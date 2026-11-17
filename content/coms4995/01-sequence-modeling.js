(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w1', num: 1, minutes: 75,
    title: 'The sequence modeling era: the road to attention',
    oneLiner: r`Twenty-five years of language models, each failing in a way that motivated the next, until **attention** fixed both problems at once.`,
    leadsTo: 'Next: the Transformer, built entirely out of attention.',
    bigPicture: {
      what: r`A tour through every way people tried to model text before the Transformer: counting word sequences (n-grams), learning word vectors (word2vec), compressing inputs (autoencoders), sliding pattern detectors (CNNs), and reading one word at a time with a memory (RNNs and LSTMs).

Every model is judged by the same two questions:

1. **How much context can it use?** (How far back can it "see"?)
2. **How much of the computation can happen at the same time?** (Does it keep a GPU busy?)

Each model answers one of these badly. Attention is the first that answers both well, and that is why the Transformer had to exist.`,
      why: r`This lecture explains *why* the modern architecture looks the way it does, so the rest of the course (which is all Transformers) makes sense. It also introduces two ideas that come back every week: **self-supervision** (making labels from raw data for free) and **systems cost** (a model's memory and parallelism matter as much as its accuracy).`,
      remember: r`1. A language model predicts the next token. That objective has not changed since 1990; only *how the context is represented* has.
2. Older models either truncated context (n-grams), squeezed it into a fixed vector (RNNs, seq2seq), or paid depth for distance (CNNs).
3. Self-attention: any two positions interact in one step, and the whole layer is one big parallel matrix multiply. The price is memory that grows with \(n^2\).`
    },
    sections: [
      { id: 's-fm', title: 'From machine learning to foundation models', summary: 'Where labels come from, and why learning representations changed everything.', concepts: [
        { id: 'paradigms', title: 'Three ways to get a training signal',
          plain: r`**Supervised**: a person labels every example. Accurate, but labelling cost grows with the data.

**Unsupervised**: no labels at all, just find structure (clusters, PCA). Cheap, but the goal often does not match the task you care about.

**Self-supervised**: make the labels automatically from the input itself. Example: hide the next word and ask the model to predict it. The "label" was sitting in the text all along, so every web page becomes free training data.

Big idea: self-supervision turns a **labelling** problem (humans, expensive, slow) into a **compute** problem (GPUs, cheaper every year).`,
          example: r`"The cat sat on the ___" → label: "mat". Nobody had to write that label down; it came from the sentence.` },
        { id: 'repr', title: 'Representation learning replaced feature engineering',
          plain: r`Before deep learning, experts hand-designed features (edge detectors for images, word lists for sentiment). A better feature beat a better classifier, but features did not transfer between tasks.

Deep networks **learn** their own features as a side effect of minimising the loss. Early layers learn general things (edges, syntax); later layers specialise. Because the early layers are general, you can reuse them on new tasks. That reuse ("transfer") is exactly what foundation models industrialise.`,
          example: r`ImageNet improved slowly from 2004–2011 through better hand-made features. In 2012 AlexNet learned the features instead and error dropped about ten points in one year.` },
        { id: 'foundation', title: 'What a "foundation model" is',
          plain: r`A model **pre-trained once** on broad data at huge scale, then **adapted many times** to different tasks. Pre-training is like a capital investment; adaptation is cheap by comparison. The term dates from a 2021 Stanford report.

The flip side: every app built on the same base inherits its flaws. That is why evaluation and safety are part of this course.` },
        { id: 'mem16', title: 'The number to remember: about 16 bytes per parameter to train',
          plain: r`Training with the Adam optimizer in mixed precision stores, for **every** parameter: the weight (2 bytes), its gradient (2), a full-precision master copy (4), and Adam's two running averages (4 + 4). That is about 16 bytes per parameter, before counting activations.

So a 7-billion-parameter model needs about 112 GB just for this, more than one 80 GB GPU holds. This single calculation motivates all of Week 6.`,
          formula: r`\[ \text{training memory} \approx 16 \times N \text{ bytes} \qquad (2 + 2 + 4 + 8) \]`,
          example: r`\(7 \times 10^9 \times 16 = 112 \times 10^9\) bytes = 112 GB.` },
      ]},
      { id: 's-ngram', title: 'Counting words: n-gram language models', summary: 'Next-token prediction by counting, and the first memory wall.', concepts: [
        { id: 'chainrule', title: 'Language modeling = next-token prediction',
          plain: r`A language model gives a probability to a whole sentence. The chain rule of probability splits that exactly into a product of "next word given everything before it" terms. No approximation yet.

Every model in this course, GPT included, optimises this same product. What changes is only **how the conditioning context is represented**.`,
          formula: r`\[ P(w_1,\dots,w_n)=\prod_{t=1}^{n} P(w_t \mid w_1,\dots,w_{t-1}) \]`,
          watch: r`The problem: the context \(w_1\dots w_{t-1}\) can be any length, and almost every 20-word prefix has never been seen even once. Every model is an answer to "how do you fit unbounded context into bounded space?"` },
        { id: 'markov', title: 'The Markov assumption, and training by counting',
          plain: r`An n-gram model **pretends** the next word depends only on the last \(n-1\) words. That makes the table finite, and training becomes simple counting: the probability of "cat" after "the" is how often "the cat" appeared divided by how often "the" appeared.

Training is one pass over the data: no gradients, no GPU. But anything further back than \(n-1\) words is invisible, forever.`,
          formula: r`\[ P(w_t\mid w_{t-1}) = \frac{C(w_{t-1},\,w_t)}{C(w_{t-1})} \qquad \text{(bigram MLE)} \]`,
          example: r`"The keys to the old wooden cabinet **are**…": to know it is "are" not "is", the model must see "keys" ten words back, which needs \(n=11\). The table would have \(50{,}000^{11}\) possible entries, almost all never observed.`,
          formal: r`The MLE of an n-gram probability is a ratio of counts. Derivation: attach one Lagrange multiplier per context for its sum-to-one constraint; differentiating makes each probability proportional to its pair count. The objective is concave, so this is the global maximum.` },
        { id: 'perplexity1', title: 'Perplexity: how many words the model is choosing between',
          plain: r`Take the average negative log-probability the model gave to each real next word on held-out text, then exponentiate. The result reads as "on average the model was as unsure as if it were picking uniformly among this many words." Lower is better.`,
          formula: r`\[ \text{PPL} = \exp\!\Big(-\frac1n\sum_{t=1}^n \log P(w_t\mid \text{context})\Big) \]`,
          example: r`If the model always gives the true next word probability 1/4, its perplexity is exactly 4.` },
        { id: 'vn', title: 'The memory wall: the table grows as Vⁿ',
          plain: r`With a vocabulary of V words, an n-gram table can have up to \(V^n\) entries. In practice you store only the n-grams you actually saw, so memory tracks corpus size. But that sparsity is the disease: most entries are missing because the data never contained them, and nothing lets the model know "cat" and "dog" behave alike.

N-grams still shipped everywhere (T9 texting, early Google Translate, voice search), and Google trained them on two trillion tokens in 2007. Simple model + huge data was already winning ("the Bitter Lesson").`,
          formula: r`\[ \text{space} = O(V^n) \text{ worst case},\quad O(\min(N, V^n)) \text{ in practice}; \qquad \text{training } O(N) \]` },
      ]},
      { id: 's-emb', title: 'Learning representations: word embeddings', summary: 'Words as vectors, learned from the company they keep.', concepts: [
        { id: 'distrib', title: 'The distributional hypothesis',
          plain: r`"You shall know a word by the company it keeps." Words used in similar contexts tend to mean similar things. So context is a free supervision signal: predict a word's neighbours and you learn what the word means, with no labels. This is the first self-supervised objective in the course.

One-hot vectors (a 1 in the word's slot, zeros elsewhere) make every pair of words equally different. Learned vectors can put "cat" near "dog".` },
        { id: 'w2v', title: 'word2vec: skip-gram and CBOW',
          plain: r`Slide a window over text. **Skip-gram**: from the centre word, predict each word around it. **CBOW**: from the surrounding words (averaged), predict the centre word.

Each word owns two vectors: a "centre" vector (the one you keep) and a "context" vector (usually thrown away). The score for a pair is just their dot product. No hidden layer, no nonlinearity: it is two lookup tables.

Skip-gram makes one training example per neighbour, so rare words get more signal (good for small corpora). CBOW makes one per position, so it is several times faster.`,
          formula: r`\[ P(o\mid c)=\frac{\exp(v'_o\cdot v_c)}{\sum_{w=1}^{V}\exp(v'_w\cdot v_c)} \qquad \text{params} = 2\times V\times d \]`,
          example: r`V = 50,000 words, d = 300 dimensions: \(2\times 50{,}000\times300 = 30\)M parameters.` },
        { id: 'negsamp', title: 'Negative sampling: change the question to fit the hardware',
          plain: r`The softmax above sums over the whole vocabulary for every example, which is slow. Negative sampling asks an easier question: here is the real (centre, context) pair and \(k\) fake ones drawn at random. Tell real from fake. A V-way choice becomes \(k+1\) yes/no choices, and the vectors that solve one solve the other.

This is the first place in the course where a **systems constraint** (the cost of a softmax) changes the **objective** itself.`,
          formula: r`\[ \log\sigma(v'_o\cdot v_c)+\sum_{i=1}^{k}\log\sigma(-v'_{n_i}\cdot v_c),\quad n_i\sim P_n(w)\propto \text{freq}(w)^{3/4} \]`,
          watch: r`The 3/4 power on word frequency was found by experiment, not derived.` },
        { id: 'glove', title: 'GloVe, and the limits of static embeddings',
          plain: r`**GloVe** counts how often every pair of words co-occurs across the whole corpus, then fits vectors whose dot products match the log of those counts. Same kind of vectors, built from global counts instead of a sliding window.

Three limits pushed the field on:
- **One vector per word**: "bank" (river) and "bank" (money) get the same vector.
- **No composition**: nothing combines word vectors into a sentence vector (averaging works suspiciously well and is obviously wrong).
- **Bias is learned faithfully**: the vectors reproduce the stereotypes in the text.

The fix for the first two is **contextual** representations, which need a model that reads the whole sentence.`,
          example: r`Phe2vec (2021) ran word2vec on patient records (each 15-day stretch = a "sentence", each medical code = a "word"). Disease phenotypes built from the vectors beat hand-written rules: positive predictive value 0.94 vs 0.82.` },
      ]},
      { id: 's-cnn', title: 'Autoencoders and convolutions', summary: 'Learning with no labels at all, and the first fully parallel sequence model.', concepts: [
        { id: 'ae', title: 'Autoencoders: compress, then reconstruct',
          plain: r`Squeeze the input through a narrow "bottleneck" layer and train the network to rebuild the original. To succeed it must keep only what matters, so the bottleneck becomes a useful representation, with zero labels.

**Denoising** version: corrupt the input (blank out parts) and rebuild the clean original. That forces the network to learn structure instead of copying. It is the direct ancestor of BERT's masked-word training in Week 3.`,
          example: r`Deep Patient (2016): stacked denoising autoencoders on about 700,000 patients' health records, no labels. The learned representation predicted future disease onset better than raw features.` },
        { id: 'conv', title: 'A 1-D convolution slides a pattern detector over the sentence',
          plain: r`Stack word vectors into an \(n\times d\) matrix. A filter covers \(k\) consecutive words (the full width), multiplies and sums to one number, and slides down the sentence. That gives a "feature map" of length \(n-k+1\): how strongly the pattern matched at each position. **Max-pooling** keeps only the strongest match, so any sentence becomes a fixed-length vector.

Every position is computed at once, so it is fast on a GPU. But to connect words far apart you must stack layers (\(n/k\) of them), and max-pooling throws away word order.`,
          formula: r`\[ \text{feature map length} = n-k+1 \]`,
          example: r`WaveNet used **dilated** convolutions (gaps that double each layer) to reach thousands of audio samples with only \(O(\log n)\) depth.` },
        { id: 'depth', title: 'Sequential depth, not total work, is what a GPU cannot hide',
          plain: r`A GPU has 100+ compute units. It is fast when given one huge matrix multiply, slow when given thousands of small ones that must happen one after another.

A recurrent network does **less** total arithmetic than attention but needs \(n\) steps in sequence, so most of the chip sits idle. Convolution and attention need \(O(1)\) sequential steps. **Throughput beats total work.**`,
          formula: r`\[ \begin{array}{lccc} & \text{total work} & \text{sequential steps} \\ \text{Convolution} & O(k\,n\,d^2) & O(1) \\ \text{Recurrence} & O(n\,d^2) & O(n) \\ \text{Self-attention} & O(n^2 d) & O(1) \end{array} \]` },
      ]},
      { id: 's-rnn', title: 'Recurrent networks and the vanishing gradient', summary: 'Unbounded context in a fixed-size memory, and the two prices paid for it.', concepts: [
        { id: 'rnn', title: 'An RNN keeps a running summary',
          plain: r`Read one word, combine it with the "notebook" (hidden state) left from the previous step, write a new notebook, move on. The same weights are reused at every step, so the parameter count does not grow with sentence length, and in principle anything written long ago can still matter.

The catch: step \(t\) needs step \(t-1\) finished first, so it **cannot be parallelised** over the sentence. A 500-word sentence is a 500-layer-deep computation, and all 500 hidden states must be kept for backprop.`,
          formula: r`\[ h_t = \tanh(W_{hh}\,h_{t-1} + W_{xh}\,x_t + b) \]` },
        { id: 'vanish', title: 'The vanishing gradient',
          plain: r`To learn that a verb must agree with a subject 10 words back, the error signal has to travel back 10 steps. At every step it gets multiplied by the recurrent weights and the tanh slope (at most 1, usually less). Multiply by something below 1 many times and it shrinks to almost nothing: words near the verb dominate learning, the far subject is invisible in practice.

The mirror case (factors above 1) **explodes** into NaN; that one is fixed by clipping the gradient. Vanishing has no such quick fix.`,
          formula: r`\[ \frac{\partial h_t}{\partial h_{t-k}} \approx \prod (\text{factor}<1)\ \to\ 0 \qquad \text{e.g. } 0.9^{50}\approx 0.005 \]` },
        { id: 'lstm', title: 'LSTM: a second track the gradient can travel unchanged',
          plain: r`The LSTM adds a **cell state** that is only ever erased from and added to, never multiplied by a weight matrix. Gradients can ride this "highway" for hundreds of steps.

Three gates (each a sigmoid between 0 and 1) control it:
- **forget gate**: which notes to cross out,
- **input gate**: what new notes to write,
- **output gate**: how much of the memory to reveal right now.

All four gate computations are one matrix multiply, but the loop over time is still there: still \(O(n)\) sequential steps. LSTMs ran production NLP (Google Translate 2016, Gmail Smart Reply, phone keyboards) until the Transformer replaced them within about two years.`,
          formula: r`\[ c_t = f_t\odot c_{t-1} + i_t\odot \tanh(g_t),\qquad h_t = o_t\odot \tanh(c_t) \]` },
      ]},
      { id: 's-attn', title: 'The road to attention', summary: 'One vector was never going to be enough.', concepts: [
        { id: 'seq2seq', title: 'Seq2seq squeezes a whole sentence into one vector',
          plain: r`For translation, an **encoder** RNN reads the source sentence and hands its final hidden state, one vector \(c\), to a **decoder** RNN that writes the translation. The decoder never sees the source words, only that summary.

A 50-word sentence gets the same \(d\) numbers as a 5-word one, and quality falls off after about 30 words. The model is not too small; the **interface** between encoder and decoder is too narrow.` },
        { id: 'bahdanau', title: 'Attention: let the decoder look back at every source word',
          plain: r`Instead of one summary vector, at each output step the decoder scores **every** encoder state, turns the scores into weights that sum to 1, and takes the weighted blend. In the slide's example, the source word "chat" carries weight 0.62 while the decoder writes "black".

Nobody labels those weights; they emerge from the translation loss alone. And long sentences stopped degrading.

What it did **not** fix: the encoder is still an RNN, so training is still \(O(n)\) sequential.`,
          formula: r`\[ \alpha_{t,i}=\frac{\exp(\text{score}(s_t,h_i))}{\sum_j \exp(\text{score}(s_t,h_j))},\qquad c_t=\sum_i \alpha_{t,i}\,h_i \]` },
        { id: 'selfattn', title: 'Self-attention: drop the recurrence entirely',
          plain: r`If attention does the useful work, what is the recurrence for? In 2017 the answer was: nothing. Let **every** position attend to every other position in the same sentence. Each word becomes a weighted blend of all the words around it, recomputed at every layer.

- Any two words interact in **one** step (path length \(O(1)\)): no vanishing over distance.
- The whole layer is one batched matrix multiply: \(O(1)\) sequential steps.
- Price: \(O(n^2)\) compute and memory in sentence length. Every long-context trick since 2017 tries to soften this.
- One thing breaks: without recurrence the model does not know word order, so position must be added explicitly (Week 2).`,
          formula: r`\[ \begin{array}{lccc} & \text{per layer} & \text{sequential} & \text{max path} \\ \text{Self-attention} & O(n^2 d) & O(1) & O(1) \\ \text{Recurrent} & O(n d^2) & O(n) & O(n) \\ \text{Convolution} & O(k n d^2) & O(1) & O(\log_k n) \end{array} \]` },
      ]},
    ],
    sheet: [
      { title: 'Six models, one trend', note: 'The architecture that parallelises wins.', cols: ['Model', 'Context it can use', 'Parameters', 'Sequential ops', 'Killed by'], rows: [
        ['N-gram', r`last \(n-1\) words (hard cut)`, r`\(O(V^n)\)`, r`\(O(1)\)`, 'sparsity; no sharing between similar words'],
        ['Word embeddings', 'a window, static', r`\(O(V d)\)`, r`\(O(1)\)`, 'one vector per word; no composition'],
        ['Autoencoder', 'whole input, compressed', r`\(O(d^2)\)`, r`\(O(1)\)`, 'no sequence structure'],
        ['CNN', 'receptive field, grows with depth', r`\(O(k d^2)\)`, r`\(O(1)\)`, 'distance costs depth'],
        ['RNN / LSTM', 'all history, lossily compressed', r`\(O(d^2)\)`, r`\(O(n)\)`, 'vanishing gradients; no parallelism'],
        ['Self-attention', 'all positions, weighted', r`\(O(d^2)\)`, r`\(O(1)\)`, r`not yet, but \(O(n^2)\) memory hurts`],
      ]},
      { title: 'Formulas', cols: ['Idea', 'Formula'], rows: [
        ['Chain rule', r`\(P(w_{1:n})=\prod_t P(w_t\mid w_{<t})\)`],
        ['Bigram MLE', r`\(C(w_{t-1},w_t)/C(w_{t-1})\)`],
        ['Perplexity', r`\(\exp(\text{average negative log-likelihood})\)`],
        ['Skip-gram softmax', r`\(\exp(v'_o\cdot v_c)/\sum_w \exp(v'_w\cdot v_c)\)`],
        ['word2vec parameters', r`\(2Vd\)`],
        ['Conv feature map length', r`\(n-k+1\)`],
        ['LSTM cell', r`\(c_t=f_t\odot c_{t-1}+i_t\odot\tanh(g_t)\)`],
        ['Training memory (Adam, mixed precision)', r`\(\approx 16N\) bytes`],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'mcq', concept: 'paradigms', q: r`Training a model to predict the next word of web pages is which kind of learning?`, choices: ['Supervised: someone labelled every page', 'Unsupervised: there is no target at all', 'Self-supervised: the target comes from the text itself', 'Reinforcement learning'], answer: 2,
        hint: 'Where does the "correct next word" come from?', solution: r`**Self-supervised.** The next word is already in the text, so the label is manufactured from the input at no cost. That is what lets training scale to trillions of tokens.` },
      { id: 'q2', type: 'num', concept: 'mem16', q: r`About how many GB does it take to train a 13B-parameter model with AdamW in mixed precision, before activations?`, answer: 208,
        hint: '16 bytes per parameter.', solution: r`\(13\times10^9\times16 = 208\times10^9\) bytes = **208 GB**: three 80 GB GPUs just for the training state.` },
      { id: 'q3', type: 'num', concept: 'markov', q: r`In a corpus, "the" appears 500 times and "the patient" appears 40 times. What is the bigram estimate of \(P(\text{patient}\mid\text{the})\)?`, answer: 0.08,
        hint: 'Count of the pair divided by count of the context.', solution: r`\(40/500 = 0.08\).` },
      { id: 'q4', type: 'num', concept: 'perplexity1', q: r`On held-out text a model's average negative log-likelihood is 2.0 nats per token. What is its perplexity?`, answer: Math.exp(2), show: 'e² ≈ 7.39',
        hint: 'Perplexity = exp(average loss).', solution: r`\(e^{2.0}\approx 7.39\): on average the model was as unsure as a uniform choice among about 7.4 tokens.` },
      { id: 'q5', type: 'num', concept: 'vn', scale: 1e14, q: r`With a vocabulary of 50,000 words, how many possible contexts does a 4-gram model have (contexts are the previous 3 words)? Answer in units of \(10^{14}\).`, answer: 1.25,
        hint: r`\(V^{n-1}\) contexts.`, solution: r`\(50{,}000^3 = 1.25\times10^{14}\). Almost none of them appear in any corpus: that sparsity is why n-grams cannot go further.` },
      { id: 'q6', type: 'num', concept: 'w2v', scale: 1e06, q: r`A skip-gram model has a vocabulary of 100,000 words and 200-dimensional vectors. How many parameters does it train, in millions?`, answer: 40,
        hint: 'Every word owns two vectors.', solution: r`\(2\times100{,}000\times200=40{,}000{,}000\) = **40 million**.` },
      { id: 'q7', type: 'mcq', concept: 'negsamp', q: r`What does negative sampling change about word2vec?`, choices: ['It removes the context vectors', 'It replaces the V-way softmax with k+1 "real or fake pair?" decisions', 'It makes the vectors one-hot', 'It adds a hidden layer'], answer: 1,
        hint: 'What was expensive about the original softmax?', solution: r`The softmax over V words is replaced by a few binary classifications (the true pair vs \(k\) random pairs). Much cheaper, and it learns equally good vectors.` },
      { id: 'q8', type: 'num', concept: 'conv', q: r`A 1-D convolution with filter width \(k=5\) slides over a 30-word sentence. How long is the feature map?`, answer: 26, tol: 0.01,
        hint: r`\(n-k+1\).`, solution: r`\(30-5+1=26\) positions.` },
      { id: 'q9', type: 'num', concept: 'vanish', q: r`Suppose the gradient shrinks by a factor of 0.9 at every step back through time. What fraction survives after 50 steps?`, answer: Math.pow(0.9, 50), tol: 0.0003,
        hint: r`\(0.9^{50}\).`, solution: r`\(0.9^{50}\approx0.0052\): about half a percent. A dependency 50 words back barely affects learning.` },
      { id: 'q10', type: 'mcq', concept: 'lstm', q: r`Why does an LSTM avoid most of the vanishing gradient?`, choices: ['It has fewer parameters', 'Its cell state is only scaled by gates and added to, never multiplied by a weight matrix', 'It processes all words in parallel', 'It uses ReLU instead of tanh'], answer: 1,
        hint: 'Think of the "highway".', solution: r`The cell state \(c_t = f_t\odot c_{t-1} + \dots\) carries information forward without repeated matrix multiplication, so gradients can survive many steps. It is still sequential, though.` },
      { id: 'q11', type: 'mcq', concept: 'depth', q: r`An LSTM does less total arithmetic than self-attention on long sequences. Why is it still slower to train?`, choices: ['Its parameters are larger', 'It needs O(n) dependent steps, so most of the GPU waits', 'It cannot use mixed precision', 'It needs more data'], answer: 1,
        hint: 'Total work vs sequential steps.', solution: r`Step \(t\) cannot start until step \(t-1\) is done. Thousands of small dependent matrix multiplies leave most of the GPU idle, while attention does one big parallel one.` },
      { id: 'q12', type: 'mcq', concept: 'seq2seq', q: r`Why did seq2seq translation quality fall off for sentences longer than about 30 words?`, choices: ['The vocabulary was too small', 'The whole source sentence had to fit into one fixed-size vector', 'Gradients exploded', 'The decoder could see future words'], answer: 1,
        hint: 'What does the decoder receive from the encoder?', solution: r`Only the final encoder state \(c\). A long sentence has to be squeezed into the same \(d\) numbers as a short one. Attention widened that interface.` },
      { id: 'q13', type: 'mcq', concept: 'selfattn', q: r`What is the maximum path length between two positions in a self-attention layer?`, choices: [r`\(O(n)\)`, r`\(O(\log n)\)`, r`\(O(1)\)`, r`\(O(n^2)\)`], answer: 2,
        hint: 'How many steps does information take from word 1 to word 500?', solution: r`One: every position attends directly to every other. That is why distance no longer causes vanishing gradients.` },
      { id: 'q14', type: 'self', concept: 'selfattn', q: r`In three or four sentences, explain from first principles why the Transformer "had to exist", using the two questions that frame this lecture.`,
        hint: 'Context used, and computation in parallel. Which older model fails which?',
        solution: r`A model of language must (1) use long context and (2) train fast on GPUs. N-grams truncate context; RNNs compress it into a fixed state that loses distant information (vanishing gradients) and run in \(O(n)\) sequential steps; CNNs are parallel but need depth to reach far. Attention fixed the context problem in seq2seq but kept the RNN. Removing the recurrence and keeping only attention gives \(O(1)\) path length **and** \(O(1)\) sequential steps. The cost is \(O(n^2)\) memory and the need to add position information explicitly.` },
    ]
  });
})();
