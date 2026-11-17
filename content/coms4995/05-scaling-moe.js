(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w5', num: 5, minutes: 80,
    title: 'Scaling laws and sparse architectures',
    oneLiner: r`Loss is predictable from compute, which tells you **how big** to make a model and **how much** to feed it. Then: make each token use only part of the model (MoE, sparse attention).`,
    leadsTo: 'Next: fitting all of this onto real GPUs.',
    bigPicture: {
      what: r`Every training run spends a compute budget \(C\) (in FLOPs) split between model size \(N\) (parameters) and data \(D\) (tokens), with \(C\approx6ND\). This week answers two questions:

**How should the budget be split?** Fit simple curves on many cheap runs, then read off the answer for the expensive one. Kaplan (2020) said "make the model big"; Chinchilla (2022) corrected it to "about 20 tokens per parameter". In practice teams train small models far past 20:1 because they are cheaper to serve.

**Can each token use less of the model?** Mixture of Experts keeps many feed-forward networks and sends each token to a few, so parameters grow without growing compute per token. Sparse attention lets each token look at only some positions.`,
      why: r`A frontier run costs millions of dollars and happens once. Scaling laws are how teams decide its size beforehand. MoE is behind most frontier models (Mixtral, DeepSeek-V3), and knowing "total vs active parameters" is essential for estimating cost and memory, including for your project.`,
      remember: r`1. \(C\approx6ND\). Compute-optimal: \(D\approx20N\), so \(N\approx\sqrt{C/120}\). 10× the compute → about 3.2× the model and 3.2× the data.
2. Power laws: each doubling buys the same **fraction** of loss, never the same amount. Scaling laws predict loss, not abilities.
3. MoE: **total** parameters set memory; **active** parameters set compute. Keep the router balanced (aux loss, capacity, or DeepSeek's bias), and pay for all-to-all communication.`
    },
    sections: [
      { id: 's-pred', title: 'Loss is predictable', summary: 'Fit a curve on cheap runs, read the answer for the expensive one.', concepts: [
        { id: 'smooth', title: 'Loss falls smoothly with compute',
          plain: r`Train many model sizes for longer and longer. Each size's loss curve flattens when the model runs out of capacity. The best model at each budget traces a smooth curve with no jumps. So a curve fitted on runs 1,000× cheaper tells you what the big run will reach before you commit to it.` },
        { id: 'powerlaw', title: 'A power law is a straight line on log-log axes',
          plain: r`\(L = (X_c/X)^{\alpha}\), where \(X\) is what you scale (\(N\), \(D\) or \(C\)). Take logs of both sides and it is a straight line with slope \(-\alpha\). Doubling \(X\) multiplies loss by \(2^{-\alpha}\): always the same **fraction**.

Fitting one is linear regression in log space (np.polyfit on log N and log L).`,
          formula: r`\[ L(X)=\left(\frac{X_c}{X}\right)^{\alpha_X}\quad\Longleftrightarrow\quad \log L = -\alpha\log X + \alpha\log X_c \]`,
          example: r`\(\alpha_N = 0.076\): doubling parameters multiplies loss by \(2^{-0.076}\approx0.949\), a 5% drop.`,
          watch: r`Extrapolating far past the runs you fitted is exactly where fits fail. Real fits also include an irreducible-loss constant.` },
        { id: 'sixnd', title: 'Training compute ≈ 6 × parameters × tokens',
          plain: r`For each token, the forward pass costs about \(2N\) FLOPs (one multiply and one add per weight) and the backward pass about \(4N\). So training on \(D\) tokens costs about \(6ND\). Attention scores add a bit more, small unless the context is long. For MoE, \(N\) means **active** parameters.`,
          formula: r`\[ C \approx 6\,N\,D \]`,
          example: r`GPT-3: \(6\times175\text{B}\times300\text{B}=3.2\times10^{23}\). Chinchilla: \(6\times70\text{B}\times1.4\text{T}=5.9\times10^{23}\). Llama 3 405B: \(3.8\times10^{25}\). DeepSeek-V3 (37B active, 14.8T tokens): \(3.3\times10^{24}\).` },
      ]},
      { id: 's-kaplan', title: 'The Kaplan power laws', summary: 'Measuring loss against N, D and C one factor at a time.', concepts: [
        { id: 'kaplan', title: 'Kaplan et al. (2020): size matters, shape barely does',
          plain: r`Decoder-only Transformers from 768 to 1.5B parameters, up to 22B tokens. Loss followed a straight line on log-log axes in each of \(N\), \(D\) and \(C\), each with its own exponent. At a fixed parameter count, changing depth, width or head count moved loss by only a few percent.

When data is limited, more parameters stop helping. Kaplan's rule: grow data at least as \(N^{0.74}\), so an 8× bigger model needs only about 5× more data. Their advice for a 100× bigger budget: make the model 29× larger but use only 3.5× more tokens. GPT-3 followed it: 175B parameters on 300B tokens, under 2 tokens per parameter.`,
          formula: r`\[ L(N,D)=\left[\left(\frac{N_c}{N}\right)^{\alpha_N/\alpha_D}+\frac{D_c}{D}\right]^{\alpha_D},\quad \alpha_N=0.076,\ \alpha_D=0.103 \]` },
      ]},
      { id: 's-chin', title: 'Chinchilla, and Llama 3 in production', summary: 'For a fixed budget, models had been too large.', concepts: [
        { id: 'isoflop', title: 'IsoFLOP curves: the best size for each budget',
          plain: r`Fix the compute budget and try many model sizes (each trained on whatever data the budget allows, \(D=C/6N\)). Too small: the model saturates. Too large: it sees too few tokens. In between is a minimum. Do this at several budgets and the minima fall on a straight line: the best \(N\) and best \(D\) both grow about as \(C^{0.5}\). Double the model, double the data.

Same budget, two choices: Gopher (280B params, 300B tokens) vs Chinchilla (70B, 1.4T). Chinchilla won almost everywhere (MMLU 67.5% vs 60.0%).` },
        { id: 'parametric', title: 'The fitted formula: floor + model term + data term',
          plain: r`\(E\) is the irreducible loss: the entropy of text itself. \(A/N^\alpha\) is what a finite model costs you; \(B/D^\beta\) is what finite data costs you. At a fixed budget, small models keep a big model term and big models keep a big data term; the minimum is in between.`,
          formula: r`\[ L(N,D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}},\qquad E{=}1.82,\ A{=}482,\ B{=}2085,\ \alpha{=}0.348,\ \beta{=}0.366 \]`,
          watch: r`These are the corrected constants of Besiroglu et al. (2024). The original fit implied about 70 tokens per parameter because of rounded constants and an optimizer that stopped early; the refit gives about 20, agreeing with the other two methods.` },
        { id: 'twenty', title: 'About 20 tokens per parameter',
          plain: r`All three Chinchilla methods agree: train on about 20 tokens per parameter. Put \(D=20N\) into \(C=6ND\) and you get \(C=120N^2\), so \(N=\sqrt{C/120}\). Ten times the compute → a model about \(\sqrt{10}=3.2\) times bigger, on 3.2 times more data.

The optimum is **flat**: a model half or double the best size loses only about 0.25% in predicted loss at Gopher's budget. That flatness is what makes deliberate overtraining cheap.`,
          formula: r`\[ D^\star\approx20N^\star,\qquad N^\star=\sqrt{C/120} \]`,
          widget: 'chinchilla',
          example: r`GPT-3 (175B) "should" have seen 3.7T tokens and saw 300B; Gopher (280B) should have seen 5.9T. The same budgets would have bought smaller, better models.` },
        { id: 'whydiffer', title: 'Why Kaplan and Chinchilla disagreed',
          plain: r`- **What N counts**: Kaplan excluded embedding parameters, a large share of small models, which bends the fitted line.
- **Learning-rate schedule**: Kaplan used one schedule length for all runs, so shorter runs were measured before their learning rate decayed and looked worse; extra data seemed less useful.
- **Model sizes**: Kaplan's were mostly small (≤1.5B); exponents fitted on small models drift when extrapolated.

Lesson: a scaling law is only as good as its runs. Teams refit for their own data, tokenizer and architecture.` },
        { id: 'dataconst', title: 'When data runs out, and when loss is not ability',
          plain: r`**Repetition** (Muennighoff 2023): repeated data is almost as good as fresh for about 4 epochs; past about 16, extra passes add almost nothing.

**Emergence**: some abilities seem to appear suddenly with scale. Often that is the metric: exact match on a long answer turns a smooth per-token improvement into a jump. Track a smooth measure (like the loss on the correct answer) alongside the benchmark; a smooth trend can be extrapolated, a jump cannot. Whether real thresholds exist is still debated.` },
        { id: 'llama3', title: 'Case study: Llama 3 planned, forecast, then overtrained',
          plain: r`**Planning**: IsoFLOP curves from \(6\times10^{18}\) to \(10^{22}\) FLOPs (40M–16B params); the fit called for 402B parameters on 16.55T tokens. Meta trained 405B on 15.6T.

**Forecasting accuracy**: two chained fits. Compute → loss on the correct answers (straight line); that loss → accuracy (S-shaped curve). It only slightly underestimated the final model on ARC.

**Overtraining on purpose**: a compute-optimal 8B model would see about 160B tokens; Llama 3 8B saw over 15T, about 100× more. Training cost more, but every token served afterwards is cheaper than with a bigger model of the same quality. Compute-optimal is about the **training** budget; a model served to millions is paid for again on every token.` },
      ]},
      { id: 's-moe', title: 'Mixture of Experts', summary: 'Decouple parameter count from compute per token.', concepts: [
        { id: 'moeidea', title: 'The idea: many FFNs, each token uses a few',
          plain: r`In a dense model every token is multiplied by every weight. Two thirds of the weights are in the feed-forward network, which processes each token on its own, so different tokens can use **different** FFNs. Keep many FFNs ("experts") and a small **router** that sends each token to its top \(k\). Parameters grow with the number of experts; compute per token does not. Attention stays dense.` },
        { id: 'topk', title: 'Top-k gating',
          plain: r`The router is one linear layer giving a score per expert. Softmax, keep the \(k\) largest, renormalise those \(k\) to sum to 1, and add up the chosen experts' outputs weighted by those numbers. Only the chosen experts run. Gradients reach the router through the weights, so it learns which experts help which tokens.

**Switch Transformer** used \(k=1\): up to 7× faster pre-training than a dense T5 with the same compute per token.`,
          formula: r`\[ p = \text{softmax}(W_r x),\quad \mathcal T = \text{top-}k(p),\quad g_i = \frac{p_i}{\sum_{j\in\mathcal T}p_j},\quad y=\sum_{i\in\mathcal T} g_i\,E_i(x) \]`,
          example: r`Router probabilities for "The": top two are 0.44 and 0.24. Renormalised: \(0.44/0.68=0.65\) and \(0.24/0.68=0.35\).` },
        { id: 'active', title: 'Total parameters set memory; active parameters set compute',
          plain: r`Mixtral 8x7B: 8 experts per layer, 2 used per token. All **46.7B** parameters must sit in GPU memory, but only **12.9B** are used per token, so it runs at roughly the speed of a 13B dense model. Why not 8 × 7B = 56B? Only the FFNs are copied 8 times; attention and embeddings are shared.

In \(C\approx6ND\), use the **active** count.` },
        { id: 'collapse', title: 'Router collapse and the load-balancing loss',
          plain: r`Early on, some experts are slightly better by chance, get more tokens, get more gradient, get better, and the rest starve. Unused experts are parameters you store but never train, and the GPU holding a popular expert does all the work while others wait.

**Auxiliary loss**: \(f_i\) = share of assignments that went to expert \(i\) (hard counts, no gradient); \(P_i\) = router's average probability for expert \(i\) (differentiable). The loss \(\alpha E\sum f_iP_i\) is smallest when both are uniform, where it equals \(\alpha\). Gradient flows through \(P_i\) and moves probability away from overused experts. Switch used \(\alpha = 0.01\).

**Router z-loss** (ST-MoE, weight ~0.001): penalise large router logits for numerical stability.`,
          formula: r`\[ \mathcal L_{\text{aux}} = \alpha\,E\sum_{i=1}^{E} f_i\,P_i \]` },
        { id: 'capacity', title: 'Expert capacity: a cap per expert, overflow skips the layer',
          plain: r`\(T\) tokens with \(k\) experts each make \(Tk\) assignments; the fair share per expert is \(Tk/E\). The **capacity factor** adds slack. Tokens beyond capacity skip the layer and pass through the residual connection unchanged. Switch used 1.0–1.25: too low drops tokens, too high fills experts with empty slots that still cost compute.

**Expert-choice routing** flips it: each expert picks its top tokens up to capacity. Balanced by construction, but a token may be picked by many experts or none.`,
          formula: r`\[ \text{capacity} = \text{CF}\times\frac{T\,k}{E} \]` },
        { id: 'moecost', title: 'MoE in production: memory, communication, fine-tuning',
          plain: r`Experts are spread across GPUs (**expert parallelism**). In every MoE layer each GPU sends its tokens to the GPUs holding their experts and gets the results back: **two all-to-all exchanges per layer** in the forward pass alone. Across machines this can dominate step time. MoE models also overfit small fine-tuning sets more easily.

Do the savings hold at scale? With well-sized (smaller, more numerous) experts and enough tokens, MoE beat dense at every budget tested, and the gap grew with scale. Experts as big as the dense FFN (Switch, Mixtral) were not optimal.` },
        { id: 'deepseek', title: 'Case study: DeepSeek-V3',
          plain: r`**Many small experts + one shared**: each of 58 MoE layers has 1 shared expert and 256 routed ones; a token uses the shared one plus 8 routed: **37B of 671B** parameters. Choosing 8 of 256 allows about \(4\times10^{14}\) combinations (vs 28 for 2 of 8). The shared expert learns what every token needs (common grammar) once.

**Balancing with a bias, not a loss**: each expert has a bias used **only to choose** the top 8, never to weight outputs. After each step, overloaded experts' biases drop by \(\gamma\), underloaded ones rise. Routing drifts toward balance without a competing gradient. No tokens dropped.

**Saving communication**: a token may use experts on at most 4 machines; DualPipe overlaps communication with compute; most matrix multiplies in FP8. Final run: 2.79M H800 GPU-hours, about $5.6M at $2/hour (the final run only, not the research before it).` },
      ]},
      { id: 's-sparseattn', title: 'Sparse attention', summary: 'MoE skips weights; sparse attention skips positions.', concepts: [
        { id: 'window', title: 'Sliding windows: n·w instead of n², depth restores reach',
          plain: r`Full causal attention computes about \(n^2/2\) scores. A **sliding window** lets each token attend only to the last \(w\) positions: \(n\cdot w\) scores. Layer 2 reads layer 1's outputs, which already summarise \(w\) positions each, so after \(\ell\) layers information can travel about \(\ell\cdot w\) positions.

Not the same as FlashAttention (Week 6): FlashAttention computes **exact** full attention faster; sparse attention changes **what** is computed.`,
          formula: r`\[ \text{scores} = n\cdot w,\qquad \text{reach}\approx \ell\cdot w \]`,
          example: r`Mistral 7B: \(w=4096\), 32 layers → about 131K positions of reach.` },
        { id: 'bigbird', title: 'BigBird and Gemma 3',
          plain: r`**BigBird**: window + a few **global** tokens (attend to and are attended by everything, so any two tokens are two hops apart) + a few **random** connections. Provably as expressive as full attention; 8× BERT's context on the same hardware. Global tokens that see the future suit encoders, not causal decoders.

**Gemma 3**: one global layer after every five local layers (local window 1,024; global up to 128K). Ablations showed little perplexity change. At 32K context, the KV cache went from about 60% of inference memory (all global) to under 15%.` },
      ]},
    ],
    sheet: [
      { title: 'Scaling formulas', cols: ['Quantity', 'Formula', 'Example'], rows: [
        ['Training compute', r`\(C\approx6ND\)`, r`70B × 1.4T → \(5.9\times10^{23}\)`],
        ['Power law', r`\(L=(X_c/X)^\alpha\)`, r`doubling N: ×\(2^{-0.076}=0.949\)`],
        ['Kaplan data rule', r`\(D\propto N^{0.74}\)`, '8× model → ~5× data'],
        ['Chinchilla law (refit)', r`\(E+A/N^{0.348}+B/D^{0.366}\)`, r`\(E=1.82\)`],
        ['Compute-optimal', r`\(D\approx20N,\ N=\sqrt{C/120}\)`, r`\(10^{24}\) → 91B on 1.8T`],
        ['Repeated data', 'fine to ~4 epochs, little value past ~16', ''],
      ]},
      { title: 'Sparsity formulas', cols: ['Quantity', 'Formula', 'Example'], rows: [
        ['Top-k weights', r`\(g_i=p_i/\sum_{j\in\mathcal T}p_j\)`, '0.44, 0.24 → 0.65, 0.35'],
        ['Aux balancing loss', r`\(\alpha E\sum f_iP_i\)`, r`balanced → \(\alpha\)`],
        ['Capacity', r`\(\text{CF}\cdot Tk/E\)`, '1024 tokens, k=2, E=8, CF=1.25 → 320'],
        ['Active vs total', 'compute vs memory', 'Mixtral 12.9B / 46.7B; DeepSeek-V3 37B / 671B'],
        ['Sliding window', r`\(n\cdot w\) scores; reach \(\ell w\)`, '4096 × 32 → 131K'],
      ]},
      { title: 'Runs to know', cols: ['Model', 'N', 'D', 'Tokens per parameter'], rows: [
        ['GPT-3 (2020)', '175B', '300B', '≈ 1.7'],
        ['Gopher (2021)', '280B', '300B', '≈ 1.1'],
        ['Chinchilla (2022)', '70B', '1.4T', '20'],
        ['Llama 3 8B (2024)', '8B', '15T+', '≈ 1,900'],
        ['Llama 3 405B (2024)', '405B', '15.6T', '≈ 39'],
        ['DeepSeek-V3 (2024)', '37B active / 671B', '14.8T', '≈ 400 (active)'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'sixnd', scale: 1e23, q: r`Estimate the training compute of a 70B-parameter model trained on 1.4T tokens. Answer in units of \(10^{23}\) FLOPs.`, answer: 6 * 70e9 * 1.4e12 / 1e23, show: '≈ 5.88 × 10²³',
        hint: r`\(6ND\).`, solution: r`\(6\times70\times10^9\times1.4\times10^{12}=5.88\times10^{23}\) FLOPs.` },
      { id: 'q2', type: 'num', concept: 'powerlaw', q: r`With \(\alpha_N = 0.076\), by what factor is the loss multiplied when you double the parameter count?`, answer: Math.pow(2, -0.076), show: '2^−0.076 ≈ 0.949',
        hint: r`\(L\propto N^{-\alpha}\).`, solution: r`\(2^{-0.076}\approx0.949\): a 5% drop per doubling.` },
      { id: 'q3', type: 'num', concept: 'twenty', scale: 1e09, q: r`Using the 20:1 rule, what is the compute-optimal model size for a budget of \(10^{24}\) FLOPs? Answer in billions of parameters.`, answer: Math.sqrt(1e24 / 120) / 1e9, show: '≈ 91B',
        hint: r`\(N=\sqrt{C/120}\).`, solution: r`\(\sqrt{10^{24}/120}=\sqrt{8.33\times10^{21}}\approx9.1\times10^{10}\) = **91B**, trained on about 1.8T tokens.` },
      { id: 'q4', type: 'num', concept: 'twenty', q: r`If your compute budget grows 100×, by what factor should the compute-optimal model size grow?`, answer: 10, tol: 0.01,
        hint: r`\(N\propto\sqrt C\).`, solution: r`\(\sqrt{100}=10\). Data also grows 10×. (Kaplan's advice would have been about 29× bigger model, 3.5× more data.)` },
      { id: 'q5', type: 'num', concept: 'llama3', q: r`Llama 3 8B was trained on 15 trillion tokens. How many tokens per parameter is that?`, answer: 1875, tol: 5,
        hint: r`\(D/N\).`, solution: r`\(15\times10^{12}/8\times10^{9}=1{,}875\), about 94× the Chinchilla ratio. Deliberate overtraining for cheaper serving.` },
      { id: 'q6', type: 'num', concept: 'active', q: r`Mixtral uses 12.9B of its 46.7B parameters per token. What fraction is active?`, answer: 12.9 / 46.7, show: '≈ 0.276',
        hint: 'Active ÷ total.', solution: r`\(12.9/46.7\approx\) **0.28**. Compute ~ a 13B dense model; memory ~ a 47B one.` },
      { id: 'q7', type: 'num', concept: 'topk', q: r`A router's top-2 probabilities for a token are 0.30 and 0.20. After renormalising over the two chosen experts, what weight does the first get?`, answer: 0.6,
        hint: 'Divide by their sum.', solution: r`\(0.30/(0.30+0.20)=0.6\); the second gets 0.4.` },
      { id: 'q8', type: 'num', concept: 'collapse', q: r`An MoE layer has \(E = 8\) experts, \(k = 2\), \(\alpha = 0.01\). Every token is routed to experts 1 and 2 (so \(f_1=f_2=0.5\), the rest 0), and the router's average probabilities are \(P_1=P_2=0.4\). What is the auxiliary loss?`, answer: 0.032,
        hint: r`\(\alpha E\sum f_iP_i\); only experts 1 and 2 have \(f_i>0\).`, solution: r`\(0.01\times8\times(0.5\times0.4+0.5\times0.4)=0.01\times8\times0.4=\) **0.032**, versus 0.01 when perfectly balanced.` },
      { id: 'q9', type: 'num', concept: 'capacity', q: r`A batch has 1,024 tokens, \(k=2\), \(E=8\) experts and capacity factor 1.25. How many tokens can each expert accept?`, answer: 320, tol: 0.01,
        hint: r`\(\text{CF}\cdot Tk/E\).`, solution: r`\(1.25\times1024\times2/8=320\).` },
      { id: 'q10', type: 'num', concept: 'sixnd', scale: 1e24, q: r`DeepSeek-V3 has 37B active parameters and trained on 14.8T tokens. Estimate its training compute in units of \(10^{24}\) FLOPs.`, answer: 6 * 37e9 * 14.8e12 / 1e24, show: '≈ 3.3 × 10²⁴',
        hint: 'For MoE, N is the active count.', solution: r`\(6\times37\times10^9\times14.8\times10^{12}\approx3.3\times10^{24}\), about a tenth of Llama 3 405B.` },
      { id: 'q11', type: 'num', concept: 'window', q: r`A model uses sliding-window attention with \(w = 4096\) in all 24 layers. About how many positions back can information reach?`, answer: 4096 * 24, tol: 1,
        hint: r`\(\ell\cdot w\).`, solution: r`\(24\times4096=98{,}304\) positions.` },
      { id: 'q12', type: 'num', concept: 'window', q: r`At \(n = 32{,}768\) tokens with window \(w = 1{,}024\), how many times fewer scores does a sliding window compute than full causal attention (\(n^2/2\))?`, answer: 16, tol: 0.05,
        hint: r`\((n^2/2)/(n w) = n/(2w)\).`, solution: r`\(32{,}768/(2\times1{,}024)=16\).` },
      { id: 'q13', type: 'mcq', concept: 'whydiffer', q: r`Which was **not** a reason Kaplan's and Chinchilla's advice differed?`, choices: ['Kaplan excluded embedding parameters', 'Kaplan used one learning-rate schedule length for all runs', 'Kaplan mostly fitted small models', 'Chinchilla used a different neural architecture family'], answer: 3,
        hint: 'Both studied decoder Transformers.', solution: r`Both used Transformer language models. The differences were measurement choices: what N counts, schedules matched to run length, and the range of model sizes.` },
      { id: 'q14', type: 'mcq', concept: 'dataconst', q: r`A capability looks like it "suddenly appears" at a certain scale on an exact-match benchmark. What should you check first?`, choices: ['Whether the tokenizer changed', 'Whether a smooth metric (e.g. loss on the correct answer) improves gradually', 'Whether the learning rate was too high', 'Nothing: emergence is always real'], answer: 1,
        hint: 'Exact match on a long answer is all-or-nothing.', solution: r`Many "emergent" jumps come from the metric. If the per-token loss on the correct answer falls smoothly, the ability was improving all along and can be extrapolated.` },
      { id: 'q15', type: 'mcq', concept: 'deepseek', q: r`How does DeepSeek-V3 balance its experts?`, choices: ['A large auxiliary loss', 'A per-expert bias used only when choosing the top-8, nudged after each step', 'Dropping every token over capacity', 'Expert-choice routing'], answer: 1,
        hint: 'It avoids a competing gradient.', solution: r`Each expert's bias shifts which experts get chosen (down if overloaded, up if underloaded) but never weights their outputs, so balance improves without adding a loss that fights the task. A tiny sequence-level loss is the safety net.` },
      { id: 'q16', type: 'self', concept: 'llama3', q: r`Why would a team deliberately train an 8B model on 100× more tokens than "compute-optimal"?`,
        hint: 'Compute-optimal for what?',
        solution: r`Chinchilla's rule minimises loss for a fixed **training** budget. A deployed model is paid for again on every token it generates, and that cost grows with \(N\). Overtraining a small model costs more once, in training, but gives a model that matches a bigger one's quality while being much cheaper per query. Because the IsoFLOP optimum is flat, the training penalty is modest, and Llama 3's small models were still improving after 15T tokens.` },
    ]
  });
})();
