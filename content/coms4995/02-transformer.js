(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w2', num: 2, minutes: 75,
    title: 'The Transformer architecture',
    oneLiner: r`Attention, split into heads, wrapped in residuals and norms, given a sense of position, and stacked: the block every modern model is built from.`,
    leadsTo: 'Next: what the Transformer is trained to predict.',
    bigPicture: {
      what: r`Last week ended with "remove the recurrence and keep only attention". This week builds that, one fix at a time, where each part fixes what the previous part broke:

1. **Scaled dot-product attention**: relate every token to every other in one parallel step.
2. **Multi-head attention**: one attention pattern is not enough, so run several side by side, at no extra cost.
3. **Residuals, normalisation and the feed-forward network**: what makes a 96-layer stack trainable, and where the model "thinks" and stores facts.
4. **Position**: attention cannot tell word order, so inject it (today: RoPE).
5. **Three wirings**: encoder-only (BERT), decoder-only (GPT), encoder-decoder (T5).`,
      why: r`Every model in the rest of the course is this block. You should be able to write multi-head attention from scratch (Homework 1 asks for it), name every tensor shape, and estimate a model's parameter count and memory from four numbers (\(d, L, h\), context length) before running anything.`,
      remember: r`1. \(\text{Attention}(Q,K,V)=\text{softmax}\!\big(QK^\top/\sqrt{d_k}\big)V\). The \(\sqrt{d_k}\) keeps the softmax from saturating; the mask is applied before the softmax.
2. One block has about \(12d^2\) parameters: \(4d^2\) in attention, \(8d^2\) in the feed-forward network. A model is about \(12\,d^2 L\).
3. Memory, not arithmetic, is the binding constraint: the \(n\times n\) score matrix in training and the KV cache in serving.`
    },
    sections: [
      { id: 's-attn', title: 'Scaled dot-product attention', summary: 'One operation that relates every position to every other.', concepts: [
        { id: 'contextual', title: 'Why we want contextual vectors',
          plain: r`word2vec gives "mole" one vector, whether the sentence is about a small animal, a unit of chemistry or a skin spot. We want each token's vector to be **recomputed from the words around it, at every layer**: a weighted blend of all the tokens in the sentence, where the weights depend on the content, not on distance. That is all self-attention is; the rest is making it cheap and stable.` },
        { id: 'qkv', title: 'Queries, keys and values: a soft lookup',
          plain: r`Think of a search engine. Your **query** is what you type, each page's **key** is what it is indexed under, and the **value** is the page itself. A dictionary returns one exact match. Attention scores your query against every key, turns the scores into weights that add to 1, and returns a **weighted average of all the values**. Nothing is excluded, and because it is smooth (no hard argmax) it can be trained with gradients.

Q, K and V are three learned projections of the same input X. Why not use X directly? One vector would have to be the question, the advertisement and the content all at once; separate projections let the model "ask" in one subspace and "answer" in another.

**Self-attention**: Q, K, V all come from the same sequence. **Cross-attention**: Q from the decoder, K and V from the encoder.`,
          formula: r`\[ Q = XW_Q,\quad K = XW_K,\quad V = XW_V \qquad (3d^2 \text{ parameters}) \]` },
        { id: 'eq', title: 'The equation, and every shape in it',
          plain: r`Four steps: project into Q, K, V; score every query against every key (an \(n\times n\) table); turn each row into probabilities with a softmax; take the weighted sum of the values.

The score table is **not symmetric**: how much "her" needs "nurse" is a different question from how much "nurse" needs "her".`,
          formula: r`\[ \text{Attention}(Q,K,V)=\text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V \]
\[ X:(B,n,d)\ \to\ Q,K,V:(B,n,d)\ \to\ \text{scores}:(B,n,n)\ \to\ \text{out}:(B,n,d) \]` },
        { id: 'scale', title: 'Why divide by √dₖ',
          plain: r`A dot product of two width-\(d_k\) vectors adds up \(d_k\) terms. If each component has variance 1, the score has variance \(d_k\), so its typical size is \(\sqrt{d_k}\). Big scores push the softmax to almost one-hot, where its gradient is almost zero, and the layer stops learning. Dividing by \(\sqrt{d_k}\) brings the variance back to 1 at any width.

This is a numerical fix, not a linguistic one.`,
          formula: r`\[ \text{Var}(q\cdot k)=d_k \ \Rightarrow\ \text{Var}\!\left(\tfrac{q\cdot k}{\sqrt{d_k}}\right)=1 \]`,
          example: r`\(d_k = 64\): raw scores have standard deviation 8; after scaling, 1.` },
        { id: 'mask', title: 'The causal mask keeps next-token prediction honest',
          plain: r`Training predicts the next token at **every** position at once. Without a mask, position \(i\) could just look at position \(i+1\) and copy the answer. The **causal mask** blocks every query from seeing keys to its right.

Set masked scores to \(-\infty\) **before** the softmax: \(e^{-\infty}=0\), and the remaining weights still sum to 1. Zeroing weights **after** the softmax is wrong twice: rows no longer sum to 1, and the normalisation already used the future.

A **padding mask** also hides the filler slots added to make a batch rectangular.`,
          watch: r`In code, fill with the dtype's minimum value rather than true \(-\infty\): a fully masked row would otherwise give NaN in fp16. And run the softmax in fp32.` },
        { id: 'n2', title: 'Memory, not arithmetic, is the binding constraint',
          plain: r`Attention stores one score for every pair of positions: an \(n\times n\) matrix per sequence, per head, per layer. That grows with the **square** of the sequence length. Attention still wins on speed because its work is one big parallel matrix multiply, but long contexts run into memory first. (FlashAttention, Week 6, computes the same result without ever storing the matrix.)`,
          formula: r`\[ \text{score memory} = B \times h \times n^2 \times \text{bytes per number} \]`,
          example: r`Batch 8, one head, \(n = 4096\), fp16 (2 bytes): \(8\times4096^2\times2 \approx 0.27\) GB. At \(n=16{,}384\): 4.3 GB.` },
      ]},
      { id: 's-mha', title: 'Multi-head attention', summary: 'Several attention patterns at once, for the price of one.', concepts: [
        { id: 'heads', title: 'One softmax can only attend one way',
          plain: r`Each row of attention weights is one probability distribution: the token has to spend its attention once. But a token often needs several unrelated things: in "The nurse gave the patient her chart", "her" needs its antecedent, the verb needs its subject and objects. One head averaging those does all of them badly.

So run \(h\) attention heads side by side, each on a \(d/h\)-wide slice, then concatenate and mix with an output matrix \(W_O\). Total width is still \(d\), so the cost is the same as one big head.`,
          formula: r`\[ \text{MHA}(X)=\text{Concat}(\text{head}_1,\dots,\text{head}_h)\,W_O,\qquad d_k = d/h \]
\[ \text{parameters}: W_Q,W_K,W_V,W_O = 4d^2 \ (\text{independent of } h) \]`,
          example: r`GPT-2 small: \(d=768, h=12\), head width 64. GPT-3: \(d=12{,}288, h=96\), width 128. Llama-2 7B: \(d=4096, h=32\), width 128. Head width barely moves; the number of heads does.` },
        { id: 'specialise', title: 'What heads actually learn',
          plain: r`Some heads reliably do something readable: attend to the previous token, to the matching bracket, to a pronoun's antecedent. Many others have no clear role, and many can be pruned after training with little loss. Treat "this head does X" as a hypothesis about one trained model, not a law of the architecture.` },
        { id: 'kvcost', title: 'Heads are free in parameters and FLOPs, not in memory',
          plain: r`Every head builds its own \(n\times n\) score matrix in training, so that memory is multiplied by \(h\).

At inference, generation keeps the **keys and values** of every past token so they are not recomputed: the **KV cache**. It stores 2 tensors (K and V) × layers × width × tokens. For long contexts and big batches it can exceed the model itself. Grouped-query attention (sharing K and V across heads) exists purely to shrink this serving bill.`,
          formula: r`\[ \text{KV cache} = 2 \times L \times d \times n \times \text{bytes} \quad \text{(per sequence)} \]`,
          example: r`Llama-2 7B, 4096 tokens, fp16: \(2\times32\times4096\times4096\times2\approx2.1\) GB per sequence, next to 13 GB of weights. Batch 16 and the cache is bigger than the model.` },
      ]},
      { id: 's-block', title: 'Residuals, normalisation and the feed-forward network', summary: 'The unglamorous two thirds of the block, without which none of it trains.', concepts: [
        { id: 'residual', title: 'Residual connections: an unbroken gradient path',
          plain: r`Backprop through 96 plain layers multiplies 96 Jacobians: at 0.9 each the signal is \(4\times10^{-5}\), at 1.1 it is \(8\times10^{3}\). Early layers learn nothing or blow up.

The fix: each sublayer **adds** its output to its input instead of replacing it. The running sum is the **residual stream**, and the identity path through it is never multiplied by a weight matrix. It is the LSTM's cell-state highway, applied to depth instead of time. Residuals turned depth into a setting you can just increase, which is what made scaling possible.`,
          formula: r`\[ x \leftarrow x + \text{Attention}(\text{Norm}(x)),\qquad x \leftarrow x + \text{FFN}(\text{Norm}(x)) \]` },
        { id: 'norm', title: 'LayerNorm and RMSNorm: normalise each token on its own',
          plain: r`Adding at every layer lets activations grow without bound, so we normalise. **LayerNorm** rescales each token's \(d\) numbers to mean 0, variance 1 (then a learned scale and shift). Unlike BatchNorm it never looks across the batch, so padding, batch size 1 and train-vs-inference differences do not matter.

**RMSNorm** (Llama, T5) skips subtracting the mean and only rescales. One step cheaper, no worse in practice.`,
          formula: r`\[ \text{RMSNorm}(x)=\frac{x}{\sqrt{\tfrac1d\sum_i x_i^2+\epsilon}}\odot g \]` },
        { id: 'prenorm', title: 'Pre-norm is why deep stacks train',
          plain: r`**Post-norm** (the 2017 paper) put the norm after the addition, on the residual path, so the identity gets rescaled at every layer; deep models needed careful warm-up to train at all. **Pre-norm** (now standard) normalises the input to each sublayer instead, leaving the residual path an untouched identity. Bigger learning rates, no warm-up tuning, 100+ layers. Add one final norm after the last block.` },
        { id: 'ffn', title: 'The feed-forward network: where computing and knowledge happen',
          plain: r`Attention **moves** information between positions. The FFN **processes** it, one token at a time: expand to \(4d\), apply a nonlinearity, project back to \(d\). It also adds the nonlinearity attention lacks (pure attention stacks collapse every token to the same vector), and its weights act like a key-value memory where many facts are stored. It holds two thirds of the parameters.

**GELU** is a smooth ReLU (GPT-2, BERT). **SwiGLU** (modern models) uses a gate: two projections multiplied together, three matrices, so the hidden width drops to about \(\tfrac83 d\) to keep the count the same.`,
          formula: r`\[ \text{FFN}(x)=W_2\,\text{GELU}(W_1x),\quad W_1: d\times4d,\ W_2: 4d\times d\ \Rightarrow\ 8d^2 \]` },
        { id: 'count', title: 'Estimate any model from four numbers',
          plain: r`Per block: \(4d^2\) (attention) + \(8d^2\) (FFN) ≈ \(12d^2\). Multiply by the number of layers \(L\), then add the embedding table \(V\times d\). Norms and biases are under 1%.`,
          formula: r`\[ N \approx 12\,d^2 L + V d \]`,
          example: r`Llama-2 7B: \(12\times4096^2\times32\approx6.4\)B, plus \(32{,}000\times4096\approx0.13\)B embeddings (0.26B with a separate output layer). Published: 6.7B. Within 5% without reading the paper.` },
      ]},
      { id: 's-pos', title: 'Position', summary: 'The one thing the recurrence was quietly providing.', concepts: [
        { id: 'perm', title: 'Attention alone cannot tell word order',
          plain: r`Shuffle the input tokens and the outputs shuffle the same way, with identical values. "The patient gave the nurse her chart" and "The nurse gave the patient her chart" produce the same set of vectors. An RNN got order for free from the order of computation; removing the recurrence removed that. Whatever positional scheme you add is the **only** thing telling the model what a sequence is.` },
        { id: 'abs', title: 'Absolute positions: sinusoids or a learned table',
          plain: r`The 2017 answer: add a position vector to each token's embedding. **Sinusoidal**: a fixed pattern of sines and cosines at many frequencies, defined for any position, no parameters. **Learned**: one trainable vector per position (BERT, GPT-2), undefined past the training length.

Problems: language cares about **distance** ("three words back"), not absolute index; learned tables cannot extrapolate; position competes with meaning for the same \(d\) dimensions; the same phrase at position 10 and 900 looks different for no reason. No frontier model uses these today.` },
        { id: 'rope', title: 'RoPE: rotate queries and keys by their position',
          plain: r`Rotary position embedding turns the vector instead of adding to it. Split each query and key into pairs of numbers, and rotate pair \(j\) at position \(m\) by angle \(m\theta_j\) (one fixed frequency per pair). A rotation changes direction but not length, and a dot product only sees the **angle between** two vectors, so the score ends up depending on \(m-n\): absolute position goes in, relative position comes out.

Nothing is learned, it is a few lines of element-wise maths, nearby tokens naturally score a bit higher, and the rotation is defined for any position, which is how context gets extended (edit the frequency line: position interpolation, NTK scaling, YaRN). Used by Llama, Mistral, Qwen, DeepSeek.`,
          formula: r`\[ \langle R_m q,\ R_n k\rangle = g(q, k, m-n),\qquad \theta_j = \text{base}^{-2j/d} \]`,
          watch: r`**ALiBi** is the cheaper alternative: add a penalty to scores proportional to distance. It extrapolates without fine-tuning but is less accurate within the trained range, which is why RoPE won.` },
      ]},
      { id: 's-models', title: 'Assembling real models', summary: 'The same block wired three ways.', concepts: [
        { id: 'families', title: 'Encoder, decoder, encoder-decoder',
          plain: r`The difference is almost entirely **the mask** and **where queries come from**.

- **Encoder-only (BERT)**: every token sees both sides. Trained by filling in hidden tokens. Natural at classification, retrieval, embeddings; awkward at generating text.
- **Decoder-only (GPT)**: causal mask, next-token prediction. Natural at generation, and nearly everything can be framed as generation. The modern default.
- **Encoder-decoder (T5)**: an encoder reads the input, a decoder writes the output with cross-attention. Good when input and output differ (translation, summarisation); twice the stacks to serve.

Since 2017, four things changed in the block: pre-norm, RMSNorm, RoPE, SwiGLU, and most models dropped the encoder.` },
        { id: 'traingen', title: 'Training reads all at once; generation cannot',
          plain: r`In training, every position is predicted in one forward pass from the masked attention matrix: \(O(1)\) sequential steps, the reason the architecture won. In generation, each token depends on the one before, so it is one forward pass per token. The KV cache keeps it linear rather than quadratic, but it is still sequential and limited by memory bandwidth.

Context grew 2,000× since 2017 (512 → 1M tokens), and almost all of that came from engineering around the two costs: the \(n\times n\) matrix in training and the cache in serving.` },
      ]},
    ],
    sheet: [
      { title: 'Shapes and costs', cols: ['Quantity', 'Formula', 'Example'], rows: [
        ['Attention', r`\(\text{softmax}(QK^\top/\sqrt{d_k})V\)`, ''],
        ['Head width', r`\(d_k = d/h\)`, r`\(4096/32=128\)`],
        ['Attention parameters', r`\(4d^2\)`, r`\(d=4096\): 67M`],
        ['FFN parameters', r`\(8d^2\)`, r`\(d=4096\): 134M`],
        ['Per block', r`\(\approx 12d^2\)`, r`\(d=4096\): 201M`],
        ['Whole model', r`\(\approx 12 d^2 L + Vd\)`, 'Llama-2 7B ≈ 6.4B + embeddings'],
        ['Score memory', r`\(B\,h\,n^2\times\) bytes`, r`\(B{=}8,h{=}1,n{=}4096\), fp16: 0.27 GB`],
        ['KV cache per sequence', r`\(2\,L\,d\,n\times\) bytes`, 'Llama-2 7B, 4096 tokens: 2.1 GB'],
        ['Scaling', r`\(\text{Var}(q\cdot k)=d_k\)`, r`divide by \(\sqrt{d_k}\)`],
      ]},
      { title: 'Then and now', cols: ['Part', '2017 Transformer', 'Modern (Llama-style)'], rows: [
        ['Norm placement', 'post-norm', 'pre-norm + final norm'],
        ['Norm type', 'LayerNorm', 'RMSNorm'],
        ['Position', 'sinusoidal, added', 'RoPE, rotates Q and K'],
        ['FFN', 'ReLU / GELU, width 4d', 'SwiGLU, width ≈ 8/3 d'],
        ['Stacks', 'encoder + decoder', 'decoder only'],
        ['Attention kernel', 'materialise n × n', 'FlashAttention'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'n2', q: r`Batch 4, one head, sequence length 8,192, fp16 (2 bytes). How many GB does one attention score matrix take? (1 GB = \(10^9\) bytes.)`, answer: 4 * 8192 * 8192 * 2 / 1e9, show: '≈ 0.54 GB',
        hint: r`batch × \(n^2\) × bytes.`, solution: r`\(4\times8192^2\times2\approx5.4\times10^8\) bytes ≈ **0.54 GB**. Doubling \(n\) quadruples it.` },
      { id: 'q2', type: 'num', concept: 'kvcost', q: r`Same setting, but with 32 heads (each builds its own score matrix). How many GB now?`, answer: 32 * 4 * 8192 * 8192 * 2 / 1e9, show: '≈ 17.2 GB',
        hint: 'Multiply the previous answer by h.', solution: r`\(32\times0.537\approx\) **17.2 GB**, for one layer's scores. Heads are free in FLOPs but not in memory.` },
      { id: 'q3', type: 'num', concept: 'heads', q: r`A model has width \(d = 1024\) and \(h = 16\) heads. What is the head width \(d_k\)?`, answer: 64, tol: 0.01,
        hint: r`\(d/h\).`, solution: r`\(1024/16 = 64\).` },
      { id: 'q4', type: 'num', concept: 'scale', q: r`Query and key components are independent with mean 0 and variance 1, and \(d_k = 256\). What is the standard deviation of the raw score \(q\cdot k\) before scaling?`, answer: 16, tol: 0.01,
        hint: r`Variance of a sum of \(d_k\) independent unit-variance products is \(d_k\).`, solution: r`Variance \(=256\), so SD \(=\sqrt{256}=16\). Dividing by \(\sqrt{d_k}=16\) brings it back to 1.` },
      { id: 'q5', type: 'mcq', concept: 'mask', q: r`How should the causal mask be applied?`, choices: ['Multiply the attention weights by 0 after the softmax', r`Set future scores to \(-\infty\) (or the dtype minimum) before the softmax`, 'Remove future tokens from the batch', 'Divide future scores by √dₖ'], answer: 1,
        hint: 'What happens to row sums if you zero weights after normalising?', solution: r`Before the softmax. \(e^{-\infty}=0\), so future positions get zero weight and each row still sums to 1. Zeroing afterwards breaks the normalisation.` },
      { id: 'q6', type: 'num', concept: 'count', q: r`Estimate the parameters in **one** Transformer block with \(d = 2048\), in millions (use \(12d^2\)).`, answer: 12 * 2048 * 2048 / 1e6, show: '≈ 50.3M',
        hint: r`\(4d^2\) attention + \(8d^2\) FFN.`, solution: r`\(12\times2048^2\approx50.3\)M.` },
      { id: 'q7', type: 'num', concept: 'count', q: r`Estimate the non-embedding parameters of a model with \(d = 3072\) and \(L = 28\) layers, in billions.`, answer: 12 * 3072 * 3072 * 28 / 1e9, show: '≈ 3.17B',
        hint: r`\(12d^2L\).`, solution: r`\(12\times3072^2\times28\approx3.17\)B.` },
      { id: 'q8', type: 'num', concept: 'kvcost', q: r`A model has \(L = 40\) layers and \(d = 5120\). How many GB of KV cache does one 8,192-token sequence need in fp16?`, answer: 2 * 40 * 5120 * 8192 * 2 / 1e9, show: '≈ 6.7 GB',
        hint: r`\(2\times L\times d\times n\times 2\) bytes.`, solution: r`\(2\times40\times5120\times8192\times2 = 6{,}710{,}886{,}400\) bytes ≈ **6.7 GB** per sequence.` },
      { id: 'q9', type: 'num', concept: 'heads', scale: 1e06, q: r`How many parameters are in one multi-head attention layer with \(d = 1024\) (ignore biases), in millions?`, answer: 4 * 1024 * 1024 / 1e6, show: '≈ 4.19M',
        hint: r`Four \(d\times d\) matrices, whatever \(h\) is.`, solution: r`\(4\times1024^2=4{,}194{,}304\) ≈ **4.19M**.` },
      { id: 'q10', type: 'mcq', concept: 'perm', q: r`You shuffle the order of the input tokens of a self-attention layer that has no positional information. What happens to the outputs?`, choices: ['They change completely', 'They are shuffled the same way, with identical values', 'They become all equal', 'The layer raises an error'], answer: 1,
        hint: 'Attention only looks at contents, not indices.', solution: r`Attention is permutation-equivariant: each output depends on the set of inputs, so permuting inputs permutes outputs. That is why position must be injected.` },
      { id: 'q11', type: 'mcq', concept: 'rope', q: r`Why does RoPE give attention scores that depend on relative position?`, choices: ['It adds a learned vector per position', 'It rotates q and k by angles proportional to their positions, and a dot product only sees the angle between them', 'It adds a distance penalty to the scores', 'It sorts the tokens'], answer: 1,
        hint: 'What does a dot product measure?', solution: r`Rotating \(q\) by \(m\theta\) and \(k\) by \(n\theta\) leaves an angle difference of \((m-n)\theta\) between them. The score depends on \(m-n\), not on \(m\) or \(n\) alone. (The distance penalty is ALiBi.)` },
      { id: 'q12', type: 'mcq', concept: 'prenorm', q: r`What is the key advantage of pre-norm over post-norm?`, choices: ['Fewer parameters', 'The residual path stays an untouched identity, so gradients reach early layers cleanly', 'It removes the need for attention', 'It makes BatchNorm usable'], answer: 1,
        hint: 'Where does the norm sit relative to the addition?', solution: r`Pre-norm normalises each sublayer's **input**, so the residual stream is never rescaled. Deep stacks train with larger learning rates and no warm-up tricks.` },
      { id: 'q13', type: 'mcq', concept: 'families', q: r`You need one vector per document for search, computed once and cached. Which family is usually the cheapest good choice?`, choices: ['Decoder-only (GPT)', 'Encoder-only (BERT)', 'Encoder-decoder (T5)', 'An LSTM'], answer: 1,
        hint: 'The output is a vector, not text.', solution: r`Encoders see both sides of every token and produce representations directly. If the output is a label, score or vector, an encoder is usually cheaper.` },
      { id: 'q14', type: 'self', concept: 'ffn', q: r`Explain what the FFN does that attention does not, in three points.`,
        hint: 'Moving vs processing; nonlinearity; where facts live.',
        solution: r`(1) Attention routes information **between** positions; the FFN transforms it **within** each position. (2) With fixed weights attention is linear in the values; the FFN supplies the nonlinearity, without which stacked attention collapses every token to the same vector (rank collapse). (3) FFN layers behave like key-value memories where much factual knowledge is stored, which is why they hold about two thirds of the parameters (\(8d^2\) of \(12d^2\)).` },
    ]
  });
})();
