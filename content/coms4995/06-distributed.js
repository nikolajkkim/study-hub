(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w6', num: 6, minutes: 85,
    title: 'Distributed training systems and memory optimization',
    oneLiner: r`Count where GPU memory goes, shrink it on one GPU, then split the model across many: data, ZeRO/FSDP, tensor and pipeline parallelism.`,
    leadsTo: 'Next: adapting a model without paying the full training bill again.',
    bigPicture: {
      what: r`Llama 3 405B needs about 6.5 TB just for its training state; one GPU has 80 GB. This week:

1. **Count** what fills a GPU: 16 bytes per parameter of model state, plus activations that grow with sequence length.
2. **Shrink** it on one GPU: mixed precision, activation checkpointing, gradient accumulation, FlashAttention.
3. **Copy** the model to many GPUs and split the batch (DDP), joined by an all-reduce.
4. **Stop storing copies**: shard optimizer state, gradients and weights (ZeRO 1/2/3, FSDP).
5. **Split each layer** across GPUs (tensor parallelism) and **split the stack of layers** (pipeline parallelism).
6. **Combine** them by network speed, as BLOOM, Llama 3 and DeepSeek-V3 did.`,
      why: r`Every technique trades one cost for another: memory for compute, or memory for communication. Your project needs a compute and memory estimate, and reading any model release means reading its parallelism layout. Homework 3 covers this week.`,
      remember: r`1. Adam + mixed precision = **16 bytes per parameter** (2 weight + 2 gradient + 4 master + 8 Adam). Activations per layer ≈ \(sbh(34 + 5as/h)\) bytes.
2. ZeRO-3/FSDP divides all 16 bytes by the number of GPUs \(d\), at 1.5× DDP's communication.
3. Put the chattiest method on the fastest link: tensor parallel inside a server, pipeline across servers, data parallel outermost. \(G = t\times p\times d\).`
    },
    sections: [
      { id: 's-mem', title: 'Where the memory goes', summary: 'Count what a single GPU has to hold.', concepts: [
        { id: 'state', title: '16 bytes per parameter of model state',
          plain: r`Serving a model needs only its weights: 2 bytes each in BF16, so a 7B model is 14 GB. Training also keeps, for **every** parameter: its gradient (2 bytes), an FP32 master copy of the weight (4), and Adam's two running averages \(m\) and \(v\) (4 + 4). Total 16 bytes: a 7B model needs 112 GB before activations, eight times the serving memory.

Why the FP32 copy? A small update to a big weight is rounded away in BF16; the optimizer updates the FP32 copy and a BF16 copy is made from it each step. Those 12 extra bytes exist only for the optimizer step and are three quarters of the total.`,
          formula: r`\[ \text{model state} = (2 + 2 + 4 + 4 + 4)\,N = 16N \text{ bytes} \]`,
          widget: 'mem:ddp' },
        { id: 'acts', title: 'Activations grow with sequence length, and soon dominate',
          plain: r`The forward pass saves intermediate results for the backward pass. For a GPT-style layer stored in 16 bits, the estimate is two terms: \(34\,sbh\) for layer inputs kept for backprop, and \(5\,as^2b\) for attention scores and probabilities, which grows with the **square** of sequence length. Model state is fixed by \(N\); activations grow with micro-batch \(b\) and sequence \(s\).`,
          formula: r`\[ \text{activations per layer} \approx s\,b\,h\left(34 + \frac{5\,a\,s}{h}\right)\ \text{bytes} \]
\[ s=\text{sequence length},\ b=\text{micro-batch},\ h=\text{hidden width},\ a=\text{heads},\ L=\text{layers} \]`,
          example: r`7B model (\(h=4096, a=32, L=32\)), \(b=1\): at \(s=1024\), about 10 GB of activations; at \(s=4096\), about 104 GB. Four times the length, ten times the memory.` },
      ]},
      { id: 's-one', title: 'Saving memory on a single GPU', summary: 'Mixed precision, recomputation, accumulation and FlashAttention.', concepts: [
        { id: 'mixed', title: 'Mixed precision: 16-bit maths, 32-bit updates',
          plain: r`Matrix multiplies run in BF16 or FP16: half the activation memory and the GPU's fast matrix units. The FP32 master weights receive the updates (in BF16, a change smaller than about 1/256 of a weight is lost).

**FP16** has a small range: values below about \(6\times10^{-5}\) lose precision and soon become zero, and many gradients are that small. **Loss scaling** multiplies the loss by \(S\) before backward to lift them into range, and divides gradients by \(S\) before the update. **BF16** has FP32's 8 exponent bits (same range), so since the A100 most training uses BF16 with no loss scaling.` },
        { id: 'ckpt', title: 'Activation checkpointing: a third more compute for much less memory',
          plain: r`Keep only each block's input; drop everything inside. During backward, rerun the forward pass from the nearest checkpoint to rebuild what was dropped.

Cost: training is about \(2ND\) forward + \(4ND\) backward = \(6ND\). Recomputing the forward adds another \(2ND\): \(8ND\), a third more. **Selective** recomputation drops only the attention scores (big to store, cheap to recompute), which FlashAttention does by design.`,
          formula: r`\[ \frac{8ND}{6ND} = \frac43 \quad(+33\%) \]` },
        { id: 'accum', title: 'Gradient accumulation: a big batch from small ones',
          plain: r`Run \(k\) micro-batches one after another, add up their gradients, then take one optimizer step. Activation memory scales with the micro-batch \(b\), not the global batch. With \(d\) GPUs doing the same, the global batch is \(b\cdot k\cdot d\) sequences.

It does **not** shrink model state (still 16 bytes/param) and is not faster (a step takes \(k\) times longer). Divide the loss by \(k\) so the summed gradient is an average.`,
          formula: r`\[ B_{\text{global}} = b\cdot k\cdot d \]`,
          example: r`Llama 3 405B: 16M tokens per step ≈ 2,000 sequences of 8,192 tokens, split over 128 model copies → 16 each, fed in as micro-batches.` },
        { id: 'flash', title: 'FlashAttention: exact attention, tile by tile',
          plain: r`GPU memory has two levels: big, slower **HBM** (80 GB) and tiny, ~10× faster on-chip **SRAM** (~20 MB total). Standard attention writes the full \(n\times n\) score matrix to HBM and reads it back for softmax, mask and dropout. Those steps do little arithmetic per byte, so they spend their time **waiting on memory**.

FlashAttention loads blocks of queries, keys and values into SRAM and computes attention block by block, never storing the \(n\times n\) matrix. Each query keeps three running values: \(m\) (largest score so far), \(\ell\) (running softmax denominator), \(O\) (running weighted sum of values). When a new block raises the max, the old sums are rescaled by \(e^{m_{\text{old}}-m_{\text{new}}}\). At the end \(O/\ell\) is exactly softmax(S)V. Exact result, memory linear in \(n\).`,
          formula: r`\[ m' = \max(m, \max_j s_j),\quad \ell' = e^{m-m'}\ell + \sum_j e^{s_j-m'},\quad O' = e^{m-m'}O + \sum_j e^{s_j-m'}v_j \]` },
      ]},
      { id: 's-dp', title: 'Communication and data parallelism', summary: 'Many GPUs, a model copy each, kept in step by collectives.', concepts: [
        { id: 'collectives', title: 'The collective operations',
          plain: r`Every parallel method is built from a few operations that run on all GPUs at once:
- **All-reduce**: everyone ends with the sum of everyone's tensors (DDP gradients; tensor-parallel activations).
- **Reduce-scatter**: sum, then each GPU keeps one slice of the result.
- **All-gather**: each GPU's slice is collected onto every GPU.
- **All-to-all**: each GPU sends a different piece to every other (MoE token routing).

All-reduce = reduce-scatter followed by all-gather.` },
        { id: 'ring', title: 'Ring all-reduce: the same cost per GPU at any scale',
          plain: r`Arrange \(G\) GPUs in a ring and pass chunks of size \(M/G\) around it, first summing (reduce-scatter), then distributing (all-gather). Each GPU sends \(2(G-1)\) chunks: \(2\frac{G-1}{G}M\) bytes, which approaches \(2M\) as \(G\) grows. Adding GPUs does not add traffic per GPU, though the number of steps (latency) grows, so NCCL switches to trees for small messages.`,
          formula: r`\[ \text{bytes sent per GPU} = 2\,\frac{G-1}{G}\,M \]`,
          example: r`7B model, BF16 gradients: \(M = 14\) GB, so every GPU sends about 28 GB per step.` },
        { id: 'ddp', title: 'DDP: copy the model, average the gradients',
          plain: r`Each GPU holds the whole model, runs forward and backward on its own slice of the batch, then one all-reduce averages the gradients. Every copy starts from the same weights and applies the same averaged update, so they stay identical.

DDP groups gradients into ~25 MB **buckets** and starts each bucket's all-reduce as soon as it is ready, while backward continues on earlier layers. Overlap hides time, not traffic.

**What DDP does not do**: save memory. Every GPU still holds all 16 bytes per parameter. It makes training faster; it does not let a bigger model fit.` },
      ]},
      { id: 's-zero', title: 'Sharding the model state: ZeRO and FSDP', summary: 'Keep data parallelism, but give each GPU only a slice of the state.', concepts: [
        { id: 'redundant', title: 'DDP stores the same state on every GPU',
          plain: r`With 64 GPUs and a 7.5B model, DDP stores 64 × 120 GB = 7.7 TB of state, of which only 120 GB is unique. Each GPU needs its **own activations** (it has its own data) but not its own copy of the state: everyone applies the same update to the same numbers. And the Adam step is elementwise: updating weight \(i\) needs only gradient \(i\), \(m_i\) and \(v_i\). So each GPU can own and update just its slice.` },
        { id: 'zero', title: 'ZeRO stages 1, 2, 3',
          plain: r`Each stage shards one more slice across the \(d\) data-parallel GPUs:
- **Stage 1**: shard the optimizer state (12 bytes/param).
- **Stage 2**: also shard the gradients (2 bytes/param).
- **Stage 3**: also shard the weights (2 bytes/param). Now everything is divided by \(d\).

ZeRO shards the **state**, not activations; slide-9 activations still apply per GPU.`,
          formula: r`\[ \text{ZeRO-1: } \left(4 + \tfrac{12}{d}\right)N \qquad \text{ZeRO-2: } \left(2 + \tfrac{14}{d}\right)N \qquad \text{ZeRO-3: } \tfrac{16}{d}N \]`,
          widget: 'mem:z3',
          example: r`7.5B model on 64 GPUs: DDP 120 GB → ZeRO-1 31.4 GB → ZeRO-2 16.6 GB → ZeRO-3 1.9 GB per GPU.` },
        { id: 'z3comm', title: 'ZeRO-3 fetches weights just in time, at 1.5× DDP\'s traffic',
          plain: r`With weights sharded, each layer's full weights must be **all-gathered** right before use, in forward and again in backward. DDP sends \(2M\) per step (reduce-scatter + all-gather); ZeRO-3 adds one more all-gather, so \(3M\): 1.5×. Prefetching the next layer's weights while the current layer computes hides most of it on a fast network.` },
        { id: 'fsdp', title: 'PyTorch FSDP',
          plain: r`FSDP is ZeRO-3 built into PyTorch. Wrap the model with one FSDP **unit** per Transformer block (each unit is gathered as a whole: small units = low peak memory but many small messages). Create the optimizer **after** wrapping so it only allocates Adam state for this GPU's shards. Typical mixed precision: gather and compute in BF16, reduce gradients in FP32.

Strategies: FULL_SHARD (ZeRO-3), SHARD_GRAD_OP (ZeRO-2), HYBRID_SHARD (shard inside a node, replicate across nodes), NO_SHARD (= DDP). FSDP2 (fully_shard) shards each parameter separately.` },
      ]},
      { id: 's-tp', title: 'Tensor and sequence parallelism', summary: 'Split the matrices inside every layer, and keep that traffic inside one server.', concepts: [
        { id: 'tp', title: 'Column and row splits, Megatron-style',
          plain: r`Split a weight matrix across \(t\) GPUs. **Column split**: each GPU computes its own columns of the output, no communication. **Row split**: each GPU gets a partial sum, so outputs must be added with an all-reduce.

Megatron-LM pairs them: in the MLP, split the first matrix by columns, apply GeLU locally, split the second by rows, and all-reduce once at the end. Attention splits naturally by heads. Per layer: 2 all-reduces forward, 2 backward, each moving \(b\times s\times h\) activations. Each GPU stores \(1/t\) of every split matrix.

Unlike FSDP, tensor parallelism never gathers weights; it communicates **activations**.` },
        { id: 'tpnode', title: 'Tensor parallelism stays inside one server',
          plain: r`Its all-reduces happen in every layer and sit on the critical path: each needs the matrix multiply just before it, and the next layer needs its result, so there is little to hide them behind. Inside a server, GPUs are linked by **NVLink**; between servers, traffic crosses InfiniBand or Ethernet, about 9× slower. So \(t \le 8\) (GPUs per server). BLOOM used \(t=4\), Llama 3 \(t=8\).` },
        { id: 'seqpar', title: 'Sequence and context parallelism',
          plain: r`**Sequence parallelism**: LayerNorm and dropout act on each token separately, so split those activations along the sequence too. With it, all activations are divided by \(t\).

**Context parallelism** (very long sequences): each GPU keeps the queries for its own chunk of the sequence and receives everyone else's keys and values. Ring Attention passes them around a ring; Llama 3 all-gathered them.` },
      ]},
      { id: 's-pp', title: 'Pipeline parallelism', summary: 'Give each GPU a slice of the layers, and keep every GPU busy.', concepts: [
        { id: 'stages', title: 'Stages, and the bubble',
          plain: r`Split the \(L\) layers into \(p\) consecutive **stages**, one per GPU. Activations flow forward stage to stage, gradients flow back. Only one \(b\times s\times h\) tensor crosses each boundary per micro-batch, point to point, so it can cross servers.

The catch: stage 2 waits for stage 1. With one batch, each GPU is idle \(p-1\) times as long as it works. Split the batch into \(m\) micro-batches so stages work on different ones at once. The idle "bubble" at the start and end stays the same size, so relative to useful work it shrinks as \(m\) grows. But large \(m\) needs a large global batch, and holding \(m\) micro-batches of activations costs memory.`,
          formula: r`\[ \text{bubble} \approx \frac{p-1}{m}\ \text{(idle time relative to compute)} \]` },
        { id: 'schedules', title: 'GPipe, 1F1B and interleaving',
          plain: r`**GPipe**: all forwards, then all backwards; holds activations for all \(m\) micro-batches. **1F1B** (one forward, one backward): start each backward as soon as possible, so each GPU holds at most \(p\) micro-batches of activations. **Interleaved 1F1B**: each GPU holds \(v\) smaller chunks of layers instead of one big slice; the pipeline fills faster and the bubble shrinks by a factor of \(v\).` },
      ]},
      { id: 's-prod', title: 'Putting it together, in production', summary: 'Three real runs, three answers to the same bandwidth problem.', concepts: [
        { id: 'threed', title: '3D parallelism: order by bandwidth',
          plain: r`Each GPU belongs to one tensor group, one pipeline group and one data group; the total is their product. Put the method that talks most often and most urgently on the fastest link: **tensor parallel innermost** (NVLink inside a server), **pipeline** across servers, **data parallel** (often with ZeRO) outermost because its traffic overlaps best with compute. Putting tensor parallelism across servers can halve throughput.`,
          formula: r`\[ G = t\times p\times d \]` },
        { id: 'bloom', title: 'Case study: BLOOM 176B',
          plain: r`176B parameters, 70 layers, width 14,336, 112 heads, about 366B tokens, on the Jean Zay supercomputer: Megatron tensor parallelism + DeepSpeed pipeline + ZeRO stage 1. Best configuration: 156 TFLOPs per GPU, half the A100's 312 TFLOPs BF16 peak, for about 3.5 months.` },
        { id: 'llama3dist', title: 'Case study: Llama 3 405B on 16,384 GPUs',
          plain: r`Four dimensions, ordered inside out: tensor \(t=8\), context \(c\), pipeline \(p=16\), data/FSDP \(d\) (128 for 8K-token pre-training). \(8\times16\times128 = 16{,}384\) H100s. **MFU** (model FLOPs utilization: the share of peak speed spent on the model's own maths) was 38–43%. FSDP is outermost because its all-gathers can be prefetched a layer ahead.

At this scale **failures are routine**: 466 interruptions in 54 days, 419 unexpected (about one every 3 hours), ~78% hardware. Every step needs every GPU, so one failure stops 16,383 others. Fast detection, frequent checkpoints and automatic restarts kept effective training time above 90%.` },
        { id: 'dsv3dist', title: 'Case study: DeepSeek-V3 in FP8, without tensor parallelism',
          plain: r`2,048 H800 GPUs (export version of the H100, slower NVLink). **FP8** halves memory and doubles matrix-multiply speed again over BF16; fine-grained scales keep one outlier from ruining a whole tensor; loss stayed within 0.25% of BF16. Layout: 16-way pipeline, 64-way expert parallelism over 8 nodes, ZeRO-1 data parallelism; memory savings made tensor parallelism unnecessary. **DualPipe** overlaps the MoE all-to-all with computation (20 of each GPU's 132 SMs set aside for communication).` },
      ]},
    ],
    sheet: [
      { title: 'Which technique removes which slice', cols: ['Slice', 'Size', 'Removed or shrunk by'], rows: [
        ['Optimizer state', '12 B/param', 'ZeRO-1 (shard across d)'],
        ['Gradients', '2 B/param', 'ZeRO-2'],
        ['Weights', '2 B/param', 'ZeRO-3 / FSDP; tensor and pipeline parallelism'],
        ['Activations, linear term', r`\(34sbh\) per layer`, 'checkpointing, smaller micro-batches, sequence parallelism'],
        ['Activations, attention term', r`\(5as^2b\) per layer`, 'FlashAttention; context parallelism'],
      ]},
      { title: 'Formulas', cols: ['Quantity', 'Formula'], rows: [
        ['Model state', r`\(16N\) bytes`],
        ['Activations per layer', r`\(sbh(34+5as/h)\) bytes`],
        ['Checkpointing cost', r`\(8ND\) vs \(6ND\) (+33%)`],
        ['Global batch', r`\(b\cdot k\cdot d\)`],
        ['Ring all-reduce', r`\(2\frac{G-1}{G}M\) bytes per GPU`],
        ['ZeRO-1 / 2 / 3 per GPU', r`\((4+12/d)N\) / \((2+14/d)N\) / \(16N/d\)`],
        ['ZeRO-3 traffic', r`\(3M\) = 1.5× DDP's \(2M\)`],
        ['Pipeline bubble', r`\((p-1)/m\)`],
        ['GPU count', r`\(G=t\times p\times d\)`],
        ['MFU', 'achieved model FLOPs/s ÷ peak FLOPs/s'],
      ]},
      { title: 'Seven parts, what they buy and cost', cols: ['Part', 'Buys', 'Costs'], rows: [
        ['Memory accounting', 'a plan before launching', 'an estimate to check by measuring'],
        ['One GPU tricks', 'half the memory; activations linear in n', 'a third more compute (full checkpointing)'],
        ['DDP', 'near-linear speed-up', 'a full copy of state on every GPU'],
        ['ZeRO / FSDP', 'state divided by d', '1.5× communication at stage 3'],
        ['Tensor + sequence', 'layers and activations divided by t', 'all-reduces every layer, inside a node'],
        ['Pipeline', 'model divided by p, across nodes', 'the bubble; a large batch to hide it'],
        ['Production', 'training at 16,000 GPUs', 'failures, tuning, custom engineering'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'state', q: r`How many TB of model state (weights, gradients, master copy, Adam) does training Llama 3 405B need? (1 TB = \(10^{12}\) bytes.)`, answer: 16 * 405e9 / 1e12, show: '≈ 6.5 TB',
        hint: '16 bytes per parameter.', solution: r`\(16\times405\times10^9=6.48\times10^{12}\) bytes ≈ **6.5 TB**.` },
      { id: 'q2', type: 'num', concept: 'acts', q: r`A model has \(h = 4096\), \(a = 32\) heads, \(L = 32\) layers. With sequence length \(s = 2048\) and micro-batch \(b = 1\), estimate total activation memory in GB using \(sbh(34+5as/h)\) per layer.`, answer: 2048 * 4096 * (34 + 5 * 32 * 2048 / 4096) * 32 / 1e9, show: '≈ 30.6 GB',
        hint: r`\(5as/h = 5\times32\times2048/4096 = 80\).`, solution: r`Per layer: \(2048\times4096\times(34+80)=956\)M bytes ≈ 0.96 GB. × 32 layers ≈ **30.6 GB**.` },
      { id: 'q3', type: 'num', concept: 'zero', q: r`A 70B model is trained with ZeRO-3 across 64 GPUs. How many GB of model state per GPU?`, answer: 16 * 70e9 / 64 / 1e9, show: '17.5 GB',
        hint: r`\(16N/d\).`, solution: r`\(16\times70\times10^9/64=17.5\) GB per GPU (plus activations).` },
      { id: 'q4', type: 'num', concept: 'zero', q: r`A 7.5B model with ZeRO-1 on 64 GPUs: how many GB of model state per GPU?`, answer: (4 + 12 / 64) * 7.5, show: '≈ 31.4 GB',
        hint: r`\((4+12/d)N\).`, solution: r`\((4+0.1875)\times7.5\approx\) **31.4 GB**: weights and gradients are still full copies.` },
      { id: 'q5', type: 'num', concept: 'zero', q: r`Same model and GPUs with ZeRO-2. GB per GPU?`, answer: (2 + 14 / 64) * 7.5, show: '≈ 16.6 GB',
        hint: r`\((2+14/d)N\).`, solution: r`\((2+0.21875)\times7.5\approx\) **16.6 GB**.` },
      { id: 'q6', type: 'num', concept: 'ring', q: r`A ring all-reduce over \(G = 8\) GPUs sums \(M = 14\) GB of gradients. How many GB does each GPU send?`, answer: 2 * 7 / 8 * 14, show: '24.5 GB',
        hint: r`\(2\frac{G-1}{G}M\).`, solution: r`\(2\times\frac78\times14=24.5\) GB. With very many GPUs this approaches 28 GB.` },
      { id: 'q7', type: 'num', concept: 'accum', q: r`Micro-batch \(b = 4\) sequences, \(k = 8\) accumulation steps, \(d = 64\) data-parallel GPUs. What is the global batch in sequences?`, answer: 2048, tol: 0.01,
        hint: r`\(b\cdot k\cdot d\).`, solution: r`\(4\times8\times64=2{,}048\) sequences per optimizer step.` },
      { id: 'q8', type: 'num', concept: 'stages', q: r`A pipeline has \(p = 8\) stages and \(m = 32\) micro-batches. Using \((p-1)/m\), how large is the bubble relative to compute?`, answer: 7 / 32, show: '7/32 ≈ 0.22',
        hint: 'Plug in.', solution: r`\(7/32\approx0.22\): about 22% extra idle time. Doubling \(m\) to 64 halves it.` },
      { id: 'q9', type: 'num', concept: 'threed', q: r`A run uses tensor parallel \(t = 8\), pipeline \(p = 16\), data parallel \(d = 128\). How many GPUs?`, answer: 16384, tol: 0.01,
        hint: r`\(G=t\,p\,d\).`, solution: r`\(8\times16\times128=16{,}384\): Llama 3 405B's layout.` },
      { id: 'q10', type: 'num', concept: 'ckpt', q: r`Full activation checkpointing makes training cost how many times the original compute?`, answer: 4 / 3, show: '4/3 ≈ 1.33',
        hint: r`Forward \(2ND\), backward \(4ND\), plus one more forward.`, solution: r`\(8ND/6ND = 4/3\): about 33% more compute.` },
      { id: 'q11', type: 'num', concept: 'bloom', q: r`BLOOM reached 156 TFLOPs per GPU on A100s with a 312 TFLOPs BF16 peak. What fraction of peak is that?`, answer: 0.5,
        hint: 'Achieved ÷ peak.', solution: r`\(156/312 = 0.5\): 50% utilisation.` },
      { id: 'q12', type: 'num', concept: 'llama3dist', q: r`Llama 3 saw 419 unexpected interruptions in 54 days. On average, how many hours between them?`, answer: 54 * 24 / 419, show: '≈ 3.1 hours',
        hint: 'Total hours ÷ count.', solution: r`\(54\times24/419\approx3.1\) hours.` },
      { id: 'q13', type: 'mcq', concept: 'ddp', q: r`Your 13B model does not fit in one 80 GB GPU. Will plain DDP across 8 GPUs fix it?`, choices: ['Yes, memory is divided by 8', 'No, every GPU still holds the full 16 bytes per parameter', 'Yes, if you use BF16', 'Only with gradient accumulation'], answer: 1,
        hint: 'What does each DDP rank hold?', solution: r`DDP copies the whole model state to every GPU. It speeds training up but does not let a bigger model fit. Use ZeRO/FSDP, tensor or pipeline parallelism.` },
      { id: 'q14', type: 'mcq', concept: 'tpnode', q: r`Why is tensor parallelism kept inside a single server?`, choices: ['It needs FP32', 'It all-reduces activations in every layer on the critical path, so it needs NVLink speed', 'It cannot use more than 2 GPUs', 'It shards optimizer state'], answer: 1,
        hint: 'How often does it communicate, and can it overlap?', solution: r`Two all-reduces per layer forward (and two backward), each needed immediately. Across servers the ~9× slower network would stall every layer.` },
      { id: 'q15', type: 'mcq', concept: 'mixed', q: r`Why does BF16 training usually need no loss scaling, while FP16 does?`, choices: ['BF16 has more mantissa bits', 'BF16 has FP32\'s 8 exponent bits, so small gradients do not underflow', 'BF16 is only used for inference', 'FP16 cannot do matrix multiplies'], answer: 1,
        hint: 'Range vs precision.', solution: r`BF16 keeps FP32's exponent range (it gives up precision instead). FP16's small range turns tiny gradients into zeros unless the loss is scaled up first.` },
      { id: 'q16', type: 'self', concept: 'flash', q: r`FlashAttention never stores the \(n\times n\) score matrix, yet computes the exact softmax. Explain how the running max \(m\) and sum \(\ell\) make that possible.`,
        hint: 'Softmax subtracts the row maximum; what if a later block has a bigger score?',
        solution: r`Keys arrive in blocks. For each query, keep the largest score seen so far \(m\), the running denominator \(\ell=\sum e^{s_j-m}\), and the running numerator \(O=\sum e^{s_j-m}v_j\). When a new block has a larger score, the new max \(m'\) makes all earlier terms off by a factor \(e^{m-m'}\), so multiply \(\ell\) and \(O\) by that factor, then add the new block's terms. After the last block, \(O/\ell\) equals softmax(S)V exactly. Only \(O(n)\) running values are stored, all in fast SRAM.` },
    ]
  });
})();
