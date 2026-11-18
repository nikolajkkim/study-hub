(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w7', num: 7, minutes: 70,
    title: 'Model adaptation and parameter-efficient fine-tuning',
    oneLiner: r`Change a pre-trained model by training tiny add-on matrices (**LoRA**), store the frozen base in 4 bits (**QLoRA**), and serve thousands of adapters from one base.`,
    leadsTo: 'Next (after the missing Week 8 on SFT): teaching the model what "better" means from preference pairs.',
    bigPicture: {
      what: r`A pre-trained model knows a lot but not your format, your domain's vocabulary or your task. Try the cheap things first (better prompts, examples in the prompt, retrieval). If you still need to train:

- **Full fine-tuning** updates every weight: the full 16-bytes-per-parameter bill, a full copy per task, and it can erase old skills.
- **PEFT** freezes the base and trains well under 1% of the parameters.
- **LoRA**, the default: add a low-rank update \(BA\) beside each frozen matrix, merge it away before serving.
- **QLoRA**: keep the frozen base in 4 bits, so a 65B model fine-tunes on one 48 GB GPU.`,
      why: r`This is how almost everyone adapts open models in practice, including your project. You should be able to estimate a fine-tuning run's memory, choose between full fine-tuning, LoRA and QLoRA, configure LoRA in Hugging Face PEFT, and explain how one base serves many adapters (Apple, S-LoRA).`,
      remember: r`1. LoRA: \(W = W_0 + \frac{\alpha}{r}BA\), with \(B\) starting at zero so training starts exactly at the base model. A \(d\times k\) matrix gets \(r(d+k)\) trainable numbers.
2. Quantization: scale by the block's largest value, round to a few levels; block-wise scales contain outliers. Bits × parameters / 8 = bytes.
3. LoRA matches full fine-tuning on narrow tasks, **learns less and forgets less** on big new domains (code, maths, a new language).`
    },
    sections: [
      { id: 's-why', title: 'Why adapt, and why not tune everything', summary: 'The memory bill, and forgetting.', concepts: [
        { id: 'whenft', title: 'When prompting is not enough',
          plain: r`Prompts, few-shot examples and retrieval (RAG) need no training and set the baseline any fine-tuned model must beat. Fine-tune when: the output must follow a fixed format every single time; the prompt would grow too long to pay for on every request; or the domain uses words and patterns pre-training rarely saw.` },
        { id: 'fullbill', title: 'Full fine-tuning pays the full training bill, per task',
          plain: r`Updating every weight costs the same 16 bytes per parameter as pre-training (Week 6). ZeRO/FSDP spread that bill across GPUs; they do not shrink it. And each task gets its own full copy of the model.`,
          formula: r`\[ \text{full fine-tune} \approx 16N \text{ bytes};\quad \text{one task copy} = 2N \text{ bytes (BF16)} \]`,
          example: r`Llama 2 7B: about 108 GB (2 GPUs); 13B: 208 GB (3); 70B: 1.1 TB (14), before activations. A full copy per task is about 14 GB for 7B; a LoRA adapter is about 17 MB.` },
        { id: 'forget', title: 'Catastrophic forgetting, safety included',
          plain: r`Training on a new task overwrites weights that earlier skills relied on. Classic defences all limit how far weights move: a lower learning rate and fewer steps, replaying old data, penalising changes to important weights (EWC), or freezing most layers.

Safety is a skill too: fine-tuning GPT-3.5 Turbo on just 10 harmful examples (under $0.20) removed its safety refusals; even benign data weakened them. Always re-test refusals after fine-tuning.` },
        { id: 'peftidea', title: 'PEFT: freeze the base, train something small',
          plain: r`Every PEFT method freezes the pre-trained weights and trains well under 1% of the parameter count. Freezing buys **memory** (no gradients or Adam state for frozen weights), **storage** (save only the small part per task) and **less forgetting** (the original weights are still there). Methods differ only in where the trainable part lives.` },
      ]},
      { id: 's-early', title: 'Early PEFT methods', summary: 'Add small layers, learn input vectors, or train only the biases.', concepts: [
        { id: 'adapters', title: 'Adapters, prompt tuning, prefix tuning, BitFit',
          plain: r`**Adapters** (2019): small bottleneck layers inserted into every block (project down to width \(m\), nonlinearity, project up, plus a skip connection). Within 0.4% of full fine-tuning on GLUE training 3.6% of parameters. Catch: extra layers run in sequence, so 20–30% more latency at batch size 1.

**Prefix tuning**: learn key/value vectors prepended at each layer (~0.1%). **Prompt tuning**: learn only some input embeddings (<0.01%); matched full fine-tuning only at about 11B parameters. Both eat part of the context window.

**BitFit**: train only the biases (<0.1%). Zero inference cost, limited capacity.

LoRA kept the quality and dropped the extra latency, so it replaced most of these.` },
      ]},
      { id: 's-lora', title: 'LoRA', summary: 'Two small matrices beside each frozen one, merged away before serving.', concepts: [
        { id: 'lowrank', title: 'Fine-tuning changes less than it seems',
          plain: r`Fine-tuning RoBERTa in a random 200-dimensional subspace (training 200 numbers!) reached 90% of full fine-tuning's accuracy on a paraphrase task. If the useful change is low-dimensional, the update to each weight matrix should be close to **low rank**: a tall thin matrix times a short wide one.

What rank means: a rank-\(r\) matrix is a sum of \(r\) simple patterns, each the outer product of two vectors. Rank 8 = eight patterns.` },
        { id: 'lora', title: 'LoRA: W = W₀ + (α/r)·BA',
          plain: r`Keep the pre-trained \(d\times k\) matrix \(W_0\) frozen. Add two new trainable matrices: \(A\) (\(r\times k\)) and \(B\) (\(d\times r\)), with \(r\) much smaller than \(d\) and \(k\). Their product \(BA\) has the same shape as \(W_0\) but only \(r(d+k)\) numbers to learn.

The original paper put adapters on the attention query and value projections \(W_q, W_v\).`,
          formula: r`\[ h = W_0x + \frac{\alpha}{r}\,BAx,\qquad \#\text{trainable} = r(d+k) \]`,
          example: r`One Llama 2 7B attention matrix: \(4096\times4096 = 16.8\)M weights. Rank 8: \(8\times(4096+4096)=65{,}536\). Rank 8 on \(W_q\) and \(W_v\) in all 32 layers: \(64\times65{,}536=4{,}194{,}304\) trainable, 0.06% of 6.74B.` },
        { id: 'init', title: 'B starts at zero; α/r keeps the scale steady',
          plain: r`\(A\) starts with small random values, \(B\) starts at **zero**, so \(BA = 0\) and the first forward pass equals the base model exactly. No jump at step 0.

Why not both zero? \(B\)'s gradient depends on \(A\) and \(A\)'s on \(B\); if both start at zero nothing trains. One random matrix breaks the symmetry.

The scale \(\alpha/r\): set \(\alpha\) once and keep it fixed while trying ranks; dividing by \(r\) keeps the update size steady so the learning rate needs less retuning. Common default: \(\alpha = 2r\). **rsLoRA** divides by \(\sqrt r\) instead, which matters from about rank 64.` },
        { id: 'which', title: 'Adapt more matrices at low rank, not one at high rank',
          plain: r`On GPT-3 with a fixed budget of trainable parameters, spreading it over more matrices beat concentrating it: \(W_q,W_k,W_v,W_o\) at rank 2 scored best; \(W_q\) alone at rank 8 scored worst. With \(W_q,W_v\) adapted, ranks 1 to 64 were all within 0.5 points. QLoRA later found adapters on **every** linear layer (feed-forward too) were needed to match full fine-tuning.

Variants: **DoRA** learns each weight's size and direction separately; **LoRA+** gives \(B\) a larger learning rate than \(A\).` },
        { id: 'merge', title: 'Saving and merging',
          plain: r`In Hugging Face PEFT, one LoraConfig (r, lora_alpha, target_modules, dropout) and get_peft_model freezes \(W_0\) and adds \(A, B\). save_pretrained writes only \(A\) and \(B\) (~17 MB vs 13.5 GB for the base). merge_and_unload adds \(BA\) into \(W_0\) once: original size, original speed, zero extra latency. To serve many tasks from one base, keep adapters separate instead.` },
      ]},
      { id: 's-quant', title: 'Just enough quantization', summary: 'The frozen base is now the biggest cost: store it in fewer bits.', concepts: [
        { id: 'bits', title: 'Fewer bits per weight, proportionally smaller model',
          plain: r`Size in bytes = parameters × bits ÷ 8 (plus a little for scales). A **frozen** base can go low because it only has to compute well, and computation tolerates rounding far better than training's tiny updates do.`,
          formula: r`\[ \text{bytes} = N\times\frac{\text{bits}}{8} \]`,
          example: r`Llama 2 70B: FP32 276 GB, BF16 138 GB, INT8 69 GB, 4-bit 35 GB (+ scales).` },
        { id: 'absmax', title: 'Absmax quantization: divide by the largest, then round',
          plain: r`Find the largest absolute value in the block; map it to the largest integer (127 for 8 bits). Multiply every value by \(127/\max|x|\) and round. Store the integers plus one scale. To restore, divide by the same factor. Rounding error is at most half a step (\(\max|x|/254\)), so small values lose the most relative to their size.`,
          formula: r`\[ q = \text{round}\!\left(\frac{127}{\max|x|}\,x\right),\qquad \hat x = q\cdot\frac{\max|x|}{127} \]`,
          example: r`Block \([0.50, -1.20, 0.03, 2.54]\): scale \(127/2.54=50\), so \(q=[25,-60,2,127]\). Restored: \([0.50,-1.20,0.04,2.54]\). The 0.03 came back as 0.04.` },
        { id: 'outliers', title: 'Outliers break one shared scale; small blocks contain them',
          plain: r`One huge value makes the step size huge for everyone in its block, crushing the small values to zero. Large models (above ~6.7B) develop a few feature dimensions up to 20× bigger than the rest, which broke naive 8-bit quantization. Fix: quantize in small **blocks**, each with its own scale. Smaller blocks = less error but more scales to store.`,
          formula: r`\[ \text{scale overhead} = \frac{\text{scale bits}}{\text{block size}}\ \text{bits per weight} \]`,
          example: r`Blocks of 64 with a 32-bit scale: \(32/64 = 0.5\) extra bits per weight.` },
      ]},
      { id: 's-qlora', title: 'QLoRA', summary: 'A 4-bit frozen base, 16-bit adapters, a 65B model on one GPU.', concepts: [
        { id: 'qlora', title: 'The recipe',
          plain: r`Store every linear layer of the frozen base in 4 bits. Just before each layer's matrix multiply, dequantize its weights to BF16, use them, discard them. Gradients flow **through** the frozen weights into the LoRA matrices, the only weights that train. Adapters and all arithmetic stay in 16 bits; only the frozen weights are rounded. Embeddings, norms and the output head stay in 16 bits. LoRA goes on every linear layer.

Price: slower steps (every pass dequantizes every layer), so use QLoRA only when the model does not fit in 16 bits.`,
          widget: 'mem:qlora' },
        { id: 'tricks', title: 'Three tricks: NF4, double quantization, paged optimizers',
          plain: r`**NF4** (NormalFloat 4): trained weights are roughly bell-shaped, so place the 16 levels at quantiles of a normal distribution; each level is used by about the same share of weights.

**Double quantization**: the 32-bit block scales are themselves quantized to 8 bits, cutting their cost from 0.5 to about 0.127 bits per weight (about 3 GB saved on a 65B model).

**Paged optimizers**: optimizer state lives in memory pages that move to CPU memory when the GPU runs out, avoiding crashes on long sequences.` },
        { id: 'qresult', title: 'What it achieved',
          plain: r`Full 16-bit fine-tuning of a 65B model needs over 780 GB; QLoRA needs under 48 GB, one GPU, with no quality loss on the benchmarks tested (4-bit QLoRA matched 16-bit LoRA and full fine-tuning on GLUE and MMLU). Guanaco 65B reached 99.3% of ChatGPT's score on the Vicuna benchmark after 24 hours on one GPU. More generally: at a fixed memory budget, a bigger model in 4 bits beats a smaller one in 8 or 16.` },
      ]},
      { id: 's-practice', title: 'What PEFT buys you in practice', summary: 'Close to full fine-tuning, orders of magnitude cheaper, with one important exception.', concepts: [
        { id: 'matched', title: 'LoRA matched or beat full fine-tuning of GPT-3',
          plain: r`On GPT-3 175B, LoRA with 4.7M trainable parameters (0.003%) beat full fine-tuning on MNLI and SAMSum and came within 0.4 points on WikiSQL. GPU memory fell from 1.2 TB to 350 GB (3.4×, not 10,000×: the frozen weights and activations are still on the GPU); per-task checkpoints from 350 GB to 35 MB; training 25% faster.

Narrow tasks with plenty of labelled data are LoRA's best case.` },
        { id: 'learnless', title: 'LoRA learns less, and forgets less',
          plain: r`Training Llama 2 7B on code and on maths with billions of tokens: LoRA trailed full fine-tuning, most in continued pre-training; full fine-tuning's weight updates had 10–100× higher rank. But LoRA kept more of the base model's other skills.

Rule of thumb: **LoRA for behaviour, format and narrow skills. Full fine-tuning for large amounts of new knowledge** (code, maths, a new language).` },
        { id: 'usecases', title: 'Use cases',
          plain: r`- **Clinical summarisation** (Van Veen 2024): with one example in the prompt, QLoRA beat in-context learning for open models.
- **Many narrow tasks** (LoRA Land): 310 rank-8 adapters on 4-bit bases; the best beat GPT-4 on 24 of 31 tasks, though GPT-4 still won broad tasks like coding.
- **Formats and style**: always-valid JSON, a house writing style, a fixed template, with a shorter prompt.
- **Beyond text**: Stable Diffusion LoRA (3 MB, from 5–10 photos), ViT on medical images (~0.5 MB per task), Whisper for low-resource languages. LoRA only needs linear layers, and every Transformer is mostly linear layers.` },
      ]},
      { id: 's-prod', title: 'Production case studies', summary: 'Apple on-device, and thousands of adapters on one GPU.', concepts: [
        { id: 'apple', title: 'Apple: one base model, one adapter per feature',
          plain: r`Apple Intelligence runs a ~3B base on phones; each feature loads its own rank-16 LoRA adapter (tens of MB). The base is stored at a mixed 2/4 bits, averaging 3.7 bits per weight (about 1.4 GB vs 6 GB in BF16). That compression costs quality, so **accuracy-recovery adapters** are trained on the compressed base to win it back, and feature adapters start from them. The QLoRA recipe, applied to inference on a phone. Cost: every base update means retraining every adapter.` },
        { id: 'slora', title: 'S-LoRA: thousands of adapters on one GPU',
          plain: r`Fine-tuning platforms end up with thousands of adapters, most rarely used. S-LoRA (and LoRAX) keep them in CPU memory and page the active ones onto the GPU, sharing one memory pool with the KV cache. Custom kernels run the base model **once** for the whole batch, then apply each request's own \(A\) and \(B\). Result: thousands of adapters per GPU, up to 4× the throughput of simpler serving. Serving a fine-tuned model costs about as much as the shared base.` },
        { id: 'choose', title: 'Choosing a strategy',
          plain: r`1. Prompts and retrieval first: no training, and they set the baseline.
2. Default: LoRA on all linear layers, rank 8–16, \(\alpha = 2r\).
3. QLoRA if the model does not fit in 16 bits.
4. Full fine-tuning if LoRA falls short (lots of new knowledge).

Then evaluate **both sides**: the target task vs the prompting baseline; general benchmarks (e.g. MMLU) before and after to catch forgetting; refusals on harmful requests.` },
      ]},
    ],
    sheet: [
      { title: 'Methods compared', cols: ['Method', 'Trains', 'Share of params', 'Inference cost', 'Weak spot'], rows: [
        ['Full fine-tuning', 'everything', '100%', 'none', '16 B/param; a copy per task; forgetting'],
        ['Adapters', 'bottleneck layers', '~3.6%', 'extra sequential layers', 'latency at small batch'],
        ['Prefix tuning', 'per-layer key/value vectors', '~0.1%', 'uses context', 'hard to optimise'],
        ['Prompt tuning', 'input embeddings', '<0.01%', 'uses context', 'weak below ~10B'],
        ['BitFit', 'biases', '<0.1%', 'none', 'limited capacity'],
        ['LoRA', r`\(B, A\) beside frozen \(W_0\)`, '0.01–1%', 'none after merging', 'big new domains'],
        ['QLoRA', 'LoRA on a 4-bit base', 'same as LoRA', 'none after merging (or dequant)', 'slower steps'],
      ]},
      { title: 'Formulas', cols: ['Quantity', 'Formula', 'Example'], rows: [
        ['LoRA update', r`\(W_0+\frac\alpha r BA\)`, r`\(\alpha=2r\) default`],
        ['LoRA parameters', r`\(r(d+k)\)`, '4096×4096, r=8 → 65,536'],
        ['Model size', r`\(N\times\text{bits}/8\)`, '70B @ 4 bits → 35 GB'],
        ['Absmax (8-bit)', r`\(q=\text{round}(127x/\max|x|)\)`, '2.54 → 127'],
        ['Scale overhead', 'scale bits ÷ block size', '32/64 = 0.5 bits'],
        ['Double-quantized scales', '≈ 0.127 bits/weight', ''],
        ['rsLoRA scale', r`\(\alpha/\sqrt r\)`, 'matters from rank ~64'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'lora', q: r`How many trainable parameters does rank-16 LoRA add to one \(5120\times5120\) matrix?`, answer: 163840, tol: 1,
        hint: r`\(r(d+k)\).`, solution: r`\(16\times(5120+5120)=163{,}840\), versus 26.2M in the frozen matrix (0.6%).` },
      { id: 'q2', type: 'num', concept: 'lora', scale: 1e06, q: r`Rank 16 LoRA on all four attention matrices (\(W_q,W_k,W_v,W_o\), each \(4096\times4096\)) in all 32 layers. How many trainable parameters, in millions?`, answer: 16 * 8192 * 4 * 32 / 1e6, show: '≈ 16.8M',
        hint: '128 matrices × r(d+k).', solution: r`\(16\times8192=131{,}072\) per matrix; \(\times4\times32=16{,}777{,}216\) ≈ **16.8M**.` },
      { id: 'q3', type: 'num', concept: 'init', q: r`LoRA with \(\alpha = 16\) and \(r = 64\) (standard scaling). What factor multiplies \(BA\)?`, answer: 0.25,
        hint: r`\(\alpha/r\).`, solution: r`\(16/64=0.25\). (rsLoRA would use \(16/\sqrt{64}=2\).)` },
      { id: 'q4', type: 'num', concept: 'absmax', q: r`8-bit absmax on the block \([0.8,\ -3.2,\ 1.5,\ 0.1]\). What integer is stored for 1.5?`, answer: 60, tol: 0.01,
        hint: r`Scale factor \(127/3.2\).`, solution: r`\(127/3.2=39.69\); \(1.5\times39.69=59.5\), which rounds to **60**.` },
      { id: 'q5', type: 'num', concept: 'absmax', q: r`Same block. What value is restored for 0.1? (Round its code first.)`, answer: 4 * 3.2 / 127, show: '4 × 3.2/127 ≈ 0.101',
        hint: r`\(q=\text{round}(0.1\times39.69)\), then multiply by \(3.2/127\).`, solution: r`\(0.1\times39.69=3.97\to4\); \(4\times3.2/127\approx0.101\). Small values lose the most relative precision.` },
      { id: 'q6', type: 'num', concept: 'outliers', q: r`Block-wise quantization with blocks of 128 weights and a 32-bit scale per block. How many extra bits per weight do the scales cost?`, answer: 0.25,
        hint: 'Scale bits ÷ block size.', solution: r`\(32/128=0.25\) bits per weight.` },
      { id: 'q7', type: 'num', concept: 'bits', q: r`How many GB does a 13B-parameter model take at 4 bits per weight (ignore scales)?`, answer: 6.5, tol: 0.1,
        hint: 'Parameters × bits ÷ 8.', solution: r`\(13\times10^9\times4/8=6.5\) GB (vs 26 GB in BF16).` },
      { id: 'q8', type: 'num', concept: 'apple', q: r`An 8B model is stored with mixed precision averaging 4.5 bits per weight. About how many GB is it?`, answer: 4.5, tol: 0.1,
        hint: 'Parameters × bits ÷ 8.', solution: r`\(8\times10^9\times4.5/8=4.5\) GB, vs 16 GB in BF16.` },
      { id: 'q9', type: 'num', concept: 'fullbill', q: r`You keep a full BF16 copy of a 13B model for each of 15 tasks. How many GB of storage? (Compare with LoRA adapters of ~30 MB each.)`, answer: 390, tol: 1,
        hint: '2 bytes per parameter per copy.', solution: r`\(26\text{ GB}\times15=390\) GB, versus one 26 GB base plus 15 × 30 MB ≈ 26.5 GB with adapters.` },
      { id: 'q10', type: 'mcq', concept: 'init', q: r`Why does LoRA initialise \(B\) to zero and \(A\) randomly?`, choices: ['To save memory', 'So BA = 0 and training starts exactly at the base model, while the random A still lets gradients flow', 'Because B is never trained', 'To make the update full rank'], answer: 1,
        hint: 'What is BA at step 0? What if both were zero?', solution: r`\(BA=0\) means no jump at step 0. If both were zero, each matrix's gradient would be zero (it depends on the other), so nothing would ever train.` },
      { id: 'q11', type: 'mcq', concept: 'merge', q: r`After merge_and_unload, what is the extra inference latency of a LoRA model?`, choices: ['20–30%', 'About 2×', 'None: BA has been added into W₀', 'It depends on the rank'], answer: 2,
        hint: 'What does merging do to the shapes?', solution: r`\(BA\) has the same shape as \(W_0\), so it is added once and the model is a plain model of the original size and speed.` },
      { id: 'q12', type: 'mcq', concept: 'learnless', q: r`You want to teach a 7B model a new programming language from billions of tokens. What is the better first choice?`, choices: ['Prompt tuning', 'LoRA rank 8 on Wq and Wv', 'Full fine-tuning (continued pre-training)', 'BitFit'], answer: 2,
        hint: 'LoRA learns less on large new domains.', solution: r`Large amounts of new knowledge are where full fine-tuning clearly beats LoRA (whose updates are far lower rank). LoRA is best for behaviour, format and narrow tasks.` },
      { id: 'q13', type: 'mcq', concept: 'which', q: r`At a fixed budget of trainable parameters, which LoRA placement did best on GPT-3?`, choices: ['Wq only at rank 8', 'Wv only at rank 8', 'Wq, Wk, Wv, Wo at rank 2', 'No difference'], answer: 2,
        hint: 'Spread or concentrate?', solution: r`Adapting more matrices at a lower rank beat one matrix at a higher rank. Later practice (QLoRA) puts adapters on every linear layer.` },
      { id: 'q14', type: 'self', concept: 'qlora', q: r`Walk through one QLoRA forward and backward pass for a single linear layer. What is stored in 4 bits, what in 16, and what gets gradients?`,
        hint: 'Dequantize → multiply → discard.',
        solution: r`Stored: the frozen weight \(W_0\) in NF4 (4 bits, block scales double-quantized); \(A\) and \(B\) in 16 bits. Forward: dequantize \(W_0\) to BF16, compute \(W_0x+\frac\alpha r BAx\) in BF16, discard the dequantized copy. Backward: gradients flow through \(W_0\) (needed to reach earlier layers) but \(W_0\) itself is not updated; only \(A\) and \(B\) get gradients and Adam state (kept in paged memory). That is why a 65B model fits on one 48 GB GPU.` },
    ]
  });
})();
