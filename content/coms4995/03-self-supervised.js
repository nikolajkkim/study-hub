(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w3', num: 3, minutes: 80,
    title: 'Self-supervised objectives',
    oneLiner: r`Four ways to make labels out of raw data: predict the next token (**GPT**), fill in hidden tokens (**BERT**), match pairs (**CLIP**), or predict hidden representations (**JEPA**).`,
    leadsTo: 'Next: the tokenizer and the web-scale data these objectives consume.',
    bigPicture: {
      what: r`Last week gave us an architecture with no loss. This week chooses the loss, and the loss, not the architecture, decides what the finished model is good at.

Every objective here **hides part of the data and asks the model to recover it**, so unlabelled data becomes training data. They differ in two choices:

- **What is hidden**: the next token, 15% of tokens, which caption goes with which image, or a block of the input.
- **Where the prediction is scored**: in input space (produce the actual tokens/pixels) or in representation space (produce a vector).`,
      why: r`Choosing an objective is choosing what you get out: a text generator (causal LM), a contextual encoder for search and classification (masked LM), a shared space for two kinds of data like images and text (contrastive), or an encoder that ignores unpredictable noise (JEPA). Homework 2 starts here.`,
      remember: r`1. Three of the four losses are the **same cross-entropy**: score a query against a set of candidates and push up the right one. Only the candidate set changes: the vocabulary (GPT, BERT) or the batch (CLIP). JEPA is a regression instead.
2. Causal LM gets a target at every position; BERT only at the 15% it masked; CLIP gets one per pair against \(B-1\) negatives.
3. Without negatives (JEPA), the model can "cheat" by outputting a constant. A slow EMA copy and a stop-gradient prevent this, and a falling loss does **not** prove it worked.`
    },
    sections: [
      { id: 's-labels', title: 'Where the labels come from', summary: 'The frame for all four objectives.', concepts: [
        { id: 'selfsup', title: 'Hide part of the example; the hidden part is the label',
          plain: r`Take any document, image or patient record, hide a piece, and train the model to recover it. The hidden piece is the label, so every unlabelled example becomes a training example. The loss is ordinary cross-entropy or regression; only the source of the target is unusual, hence "self-supervised". Week 1 already did this (word2vec, denoising autoencoders); what is new is the scale.` },
        { id: 'oneloss', title: 'Three objectives, one cross-entropy',
          plain: r`Score a query \(q\) against a set of candidates \(C\), and push up the score of the right one \(c^+\):

<table class="sheet"><thead><tr><th>Objective</th><th>Query</th><th>Candidates</th><th>Right answer</th></tr></thead><tbody><tr><td>Causal LM</td><td>hidden state before token t</td><td>whole vocabulary (~50k)</td><td>the real next token</td></tr><tr><td>Masked LM</td><td>hidden state at a masked slot</td><td>whole vocabulary (~30k)</td><td>the original token</td></tr><tr><td>Contrastive</td><td>an image embedding</td><td>captions in the batch</td><td>its own caption</td></tr></tbody></table>

A softmax over the vocabulary makes a **language model**; a softmax over the batch makes a **retrieval model**. JEPA has no candidates; it regresses a vector.`,
          formula: r`\[ \mathcal L = -\log\frac{\exp(s(q,c^+))}{\sum_{c\in C}\exp(s(q,c))} \]` },
        { id: 'density', title: 'Targets per example differ a lot',
          plain: r`From one 512-token sequence: causal LM gets a target at every position (about 512). BERT gets one only where it masked: about 15%, roughly 77. So BERT needs more passes over the data for the same number of training signals. CLIP gets one target per image-caption pair, scored against \(B-1\) negatives.` },
      ]},
      { id: 's-clm', title: 'Causal language modelling: GPT', summary: 'Predict the next token at every position at once.', concepts: [
        { id: 'clm', title: 'Shift by one, then cross-entropy',
          plain: r`The target row is just the input row moved one place to the left. With the causal mask, position \(t\) never sees token \(t\), so all \(n\) predictions are honest and computed in one pass. Every token in the corpus is a label: GPT-3's 300 billion training tokens were 300 billion supervised examples with no annotator anywhere.

Real batches **pack** documents end to end, separated by an end-of-text token, and cut them into fixed-length rows so no compute is spent on padding.`,
          formula: r`\[ \mathcal L_{\text{CLM}} = -\sum_{t}\log p_\theta(x_t\mid x_{<t}) \]`,
          watch: r`Forget the causal mask and the loss drops to almost zero while the model learns nothing: it is copying the answer from the next position.` },
        { id: 'exposure', title: 'Teacher forcing, exposure bias and temperature',
          plain: r`In training the model always sees the **true** prefix (teacher forcing); that is what makes the one-pass training possible. At generation it sees **its own** previous samples, which it never trained on. One unlikely early choice shifts every later input, and nothing tells it that it drifted (exposure bias).

**Temperature** divides the logits before the softmax. Low T → nearly always the top token (predictable). High T → flatter, more random. Top-p sampling trims the unlikely tail.`,
          formula: r`\[ p_i = \frac{\exp(z_i/T)}{\sum_j \exp(z_j/T)} \]`,
          widget: 'softmax' },
        { id: 'gpt123', title: 'GPT-1 → GPT-2 → GPT-3: from fine-tuning to prompting',
          plain: r`**GPT-1 (2018, 117M)**: pre-train on 7,000 books, then fine-tune a separate copy per task with one linear layer. Best results on 9 of 12 tasks.

**GPT-2 (2019, 1.5B, 40 GB of web text)**: skip fine-tuning; phrase the task so the answer is the likely continuation (e.g. add "TL;DR:" to get a summary). Mostly well below supervised models, but it worked at all.

**GPT-3 (2020, 175B, 300B tokens)**: put a few examples in the prompt and the frozen model does the task: **in-context learning**, no gradient update.

The loss never changed. Parameters, data and context length did (Week 5).` },
        { id: 'whyworks', title: 'Why next-token prediction teaches so much',
          plain: r`To keep lowering the loss, the model has to get rows like these right:
- "The keys to the cabinet **are**" → grammar across a distracting noun,
- "The capital of Italy is **Rome**" → facts,
- "17 + 25 = **42**" → arithmetic,
- "The film was a waste of two hours. Sentiment: **negative**" → sentiment.

Minimising the loss over enough text forces it to represent syntax, facts and procedures, none of them ever labelled. Equivalently: a lower loss is a better compressor, and compressing text well means finding its regularities.` },
        { id: 'ppl3', title: 'Perplexity, and the one thing causal models never see',
          plain: r`Perplexity = \(e^{\text{average loss}}\): "on average, as unsure as a uniform choice among this many tokens". Great for comparing checkpoints of **one** model on **one** held-out set. Not comparable across tokenizers, and it says nothing about whether an answer is helpful, true or safe.

A causal model only ever sees the **left** context. For generation that is fine (the right side does not exist yet). For understanding a finished document (classifying, tagging, embedding it) half the evidence is thrown away. Letting it attend both ways breaks the task, because the answer becomes visible. Hence a different objective.` },
      ]},
      { id: 's-mlm', title: 'Masked language modelling: BERT', summary: 'Hide some tokens, read both sides, recover them.', concepts: [
        { id: 'mlm', title: 'Masked LM and the 80/10/10 recipe',
          plain: r`Hide 15% of tokens and predict them from **both** sides. Since the token is hidden, seeing both sides is no longer cheating, and every representation is built from the whole sentence.

Of the chosen 15%: **80%** become [MASK], **10%** become a random token, **10%** stay unchanged. Why? [MASK] never appears when the model is actually used; if it only ever saw [MASK], real tokens might be poorly represented. The random 10% makes it check every token; the unchanged 10% biases it toward the truth.

Only masked positions produce a loss (unmasked labels are set to −100, the "ignore" value).`,
          formula: r`\[ \mathcal L_{\text{MLM}} = -\sum_{i\in M}\log p_\theta(x_i\mid \tilde x) \]` },
        { id: 'bertinput', title: 'BERT\'s input, and the objective that was dropped',
          plain: r`Input = two segments with [CLS] at the start (its final state summarises the input for classification) and [SEP] after each segment, plus learned position embeddings (512 of them: a hard cap).

BERT also trained **next-sentence prediction**: did segment B really follow A? It mostly reduced to topic matching, which MLM already covers. **RoBERTa** dropped it, re-sampled masks every time (dynamic masking), used 10× the text and huge batches, and beat BERT with the **same architecture**. Lesson: BERT was undertrained.` },
        { id: 'electra', title: 'ELECTRA and T5: using more of each sequence',
          plain: r`**ELECTRA**: a small generator fills the masks with plausible tokens, and the main model labels **every** position "original or replaced". All tokens now contribute, not 15%. Same ceiling, much less compute to reach it: ELECTRA-Small on one GPU for four days beat GPT-1.

**T5 span corruption**: hide 15% of tokens in spans (mean length 3), replace each span with one sentinel token; the decoder writes the spans back. Fits T5's "every task is text in, text out" design, and targets are short, so it is cheap.` },
        { id: 'nowrite', title: 'BERT cannot write',
          plain: r`MLM learns "this one token, given everything else". It never defines a probability for a whole sequence, so there is no principled way to sample text from it, and two masks are filled independently of each other. The chain rule gives a causal LM an exact joint distribution, which is why generation belongs to decoders.

The practical rule: output is a **label, score or vector** → an encoder is usually cheaper and often better (search, retrieval, clinical NLP, Med-BERT). Output is **text** → decoder. Long input **and** long, different output → encoder-decoder.` },
      ]},
      { id: 's-clip', title: 'Contrastive learning: CLIP', summary: 'Predict which pairs belong together, and put images and text in one space.', concepts: [
        { id: 'infonce', title: 'InfoNCE: cross-entropy whose classes are the batch',
          plain: r`Two views of the same thing (an image and its caption, or two crops of one image) form a **positive** pair; everything else in the batch is a **negative**. Score the positive above all the negatives with a softmax over the batch. The model never produces a pixel or token; it only needs a space where matching things are close.

The loss can certify at most \(\log B\) nats of shared information between the two views, so bigger batches raise the ceiling.`,
          formula: r`\[ \mathcal L_{\text{InfoNCE}} = -\log\frac{\exp(\text{sim}(z,z^+)/\tau)}{\sum_{j=1}^{B}\exp(\text{sim}(z,z_j)/\tau)},\qquad I \ge \log B - \mathcal L \]` },
        { id: 'clip', title: 'CLIP: a B × B matrix whose diagonal is the answer',
          plain: r`An image encoder and a text encoder, trained together from scratch on 400 million image-caption pairs from the web. Each output is projected to a shared width and normalised to length 1, so similarity is a dot product.

In a batch of \(B\) pairs, compute all \(B\times B\) similarities. Entry \((i,i)\) is correct; every other entry in its row and column is a negative. Cross-entropy along rows (each image finds its caption) plus along columns (each caption finds its image), averaged. The labels are simply \(0,1,\dots,B-1\).

\(B = 32{,}768\) for CLIP: the matrix alone has about a billion entries, spread across many GPUs.`,
          formula: r`\[ S = \tfrac1\tau\,UV^\top\ (B\times B),\qquad \mathcal L = \tfrac12\big[\text{CE}(S,\,\text{arange}) + \text{CE}(S^\top,\,\text{arange})\big] \]` },
        { id: 'tau', title: 'Temperature sets sharpness; batch size sets the rivals',
          plain: r`Dividing similarities by \(\tau\) scales every gap between them. \(\tau = 1\): nearly flat over the batch. CLIP's start, \(\tau = 0.07\): the match dominates. Much lower: only the single hardest negative matters. CLIP **learns** \(\tau\) (stored as a log, clamped so \(1/\tau \le 100\)).

Most random negatives are easy; a huge batch raises the odds of some hard ones (a different caption for a similar picture).`,
          example: r`Two similarities 0.9 (true caption) and 0.5 (other). At \(\tau=1\): \(P(\text{true}) = e^{0.9}/(e^{0.9}+e^{0.5}) = 0.60\). At \(\tau=0.1\): \(e^{9}/(e^{9}+e^{5}) = 0.98\).` },
        { id: 'zeroshot', title: 'Zero-shot classification: turn labels into sentences',
          plain: r`To classify an image into any label set, write each label as a sentence ("A photo of a dog."), embed the sentences with the text encoder, and pick the one closest to the image. CLIP matched a supervised ResNet-50 on ImageNet (76.2%) without using any of its 1.28 million labelled images. Prompt wording matters (templates added several points).

In medicine: ConVIRT (2020) did this on X-rays with their reports a year before CLIP; CheXzero (2022) reached radiologist-level zero-shot performance on several pathologies.`,
          watch: r`What contrastive models struggle with: **word order** (bag-of-words behaviour), **counting**, and **negation** ("no effusion" vs "effusion" share almost every token). Matching against random captions rarely requires them. Also **false negatives**: two near-identical pairs in a batch (two X-rays both "no acute findings") are treated as negatives of each other, rare on the web, common in clinical data.` },
      ]},
      { id: 's-jepa', title: 'Joint-embedding predictive architectures: JEPA', summary: 'Predict the representation of what is hidden, with no negatives.', concepts: [
        { id: 'jepa', title: 'Predicting pixels wastes capacity on noise',
          plain: r`Much of an image is unpredictable in detail: exact leaf positions, sensor noise, texture. A pixel loss must model all of it, and under uncertainty its best guess is a blurry average. (Masked autoencoders hide 75% of patches and reconstruct pixels; they work, but the loss is in input space.)

**JEPA** moves the loss to representation space. A context encoder reads the visible part; a target encoder reads the full input; a predictor, told **where** the hidden blocks are, predicts their **representations**. Loss = squared distance between predicted and target vectors. Nothing is decoded back to pixels, so unpredictable detail never enters the loss.`,
          formula: r`\[ \mathcal L_{\text{JEPA}} = \sum_{i\in M}\big\|\hat s_i - \text{sg}(s_i)\big\|^2 \]` },
        { id: 'collapse', title: 'Without negatives, a constant gives zero loss',
          plain: r`If both branches output the same constant vector for every input, the prediction is perfect and the loss is zero. Contrastive methods never had this problem: their denominator punishes identical embeddings. JEPA needs an **asymmetry** instead:

- The **target encoder** gets no gradient (stop-gradient, sg). After each step it moves a little toward the context encoder: an **exponential moving average (EMA)**.
- So the target always lags behind, and the constant is not a stable resting point.

With \(m = 0.996\), the target averages roughly the last \(1/(1-m) = 250\) versions of the context encoder.`,
          formula: r`\[ \xi \leftarrow m\,\xi + (1-m)\,\theta \]`,
          watch: r`**A falling loss is not evidence of a good representation.** In SimSiam, removing the stop-gradient (one line) makes the loss drop to its minimum within a few epochs, because both branches collapsed to a constant; linear-probe accuracy fell from 67.7% to 0.1% (chance). Watch the spread of the normalised embeddings instead: about \(1/\sqrt d\) per channel when healthy, zero when collapsed.` },
        { id: 'ijepa', title: 'I-JEPA, V-JEPA 2, and where JEPA stands',
          plain: r`**I-JEPA** (images): four target blocks of 15-20% of the image each, one context block with every overlapping patch removed. No hand-designed augmentations. Each step costs about 7% more than MAE but it converges in about 5× fewer iterations.

**V-JEPA 2** (video): after pre-training, under 62 hours of robot video let it plan pick-and-place actions zero-shot in new labs.

**Brain-JEPA** (fMRI) had to redefine "position" for brain regions. JEPA is the youngest objective here; none runs in production at GPT/BERT/CLIP scale yet.` },
      ]},
    ],
    sheet: [
      { title: 'Four objectives, one table', cols: ['', 'Causal LM (GPT)', 'Masked LM (BERT)', 'Contrastive (CLIP)', 'JEPA'], rows: [
        ['Hidden', 'the next token', '15% of tokens', 'which caption goes with which image', 'a block of the input'],
        ['Scored in', 'token space', 'token space', 'representation space', 'representation space'],
        ['Candidates', r`vocabulary \(V\)`, r`vocabulary \(V\)`, r`the batch \(B\)`, 'none (regression)'],
        ['Targets per example', r`\(n\)`, r`\(\approx0.15n\)`, r`1, against \(B-1\) negatives`, r`\(|M|\) vectors`],
        ['Gives you', 'a generator', 'a contextual encoder', 'aligned encoders for two modalities', 'an encoder (+ a predictor)'],
        ['Watch out for', 'exposure bias; left context only', 'cannot generate', 'order, counting, negation', 'collapse'],
      ]},
      { title: 'Numbers and formulas', cols: ['Item', 'Value'], rows: [
        ['MLM mask rate / split', '15%; 80% [MASK], 10% random, 10% unchanged'],
        ['Ignore index', r`\(-100\) in PyTorch cross-entropy`],
        ['Temperature', r`\(p_i\propto \exp(z_i/T)\)`],
        ['InfoNCE ceiling', r`\(\log B\) nats`],
        ['CLIP batch / τ start', r`\(B=32{,}768\), \(\tau=0.07\), \(1/\tau\le100\)`],
        ['EMA update', r`\(\xi\leftarrow m\xi+(1-m)\theta\); averages \(\approx 1/(1-m)\) steps`],
        ['Healthy embedding spread', r`per-channel std \(\approx 1/\sqrt d\)`],
        ['T5 span corruption', '15% of tokens, mean span length 3'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'density', q: r`An encoder with a 1,024-token context uses BERT's 15% masking rate. About how many training targets does one full sequence produce?`, answer: 153.6, tol: 1,
        hint: 'Only masked positions are scored.', solution: r`\(0.15\times1024\approx154\). A causal LM would get about 1,024 from the same sequence.` },
      { id: 'q2', type: 'num', concept: 'mlm', q: r`In a batch, 2,000 positions are chosen for masking under BERT's recipe. How many of them are replaced by a **random** token?`, answer: 200, tol: 0.01,
        hint: '80 / 10 / 10.', solution: r`10% of 2,000 = **200**. (1,600 become [MASK]; 200 stay unchanged.)` },
      { id: 'q3', type: 'mcq', concept: 'nowrite', q: r`You want a model that writes discharge summaries. Which pre-training objective fits best?`, choices: ['Masked LM', 'Causal LM', 'Contrastive (CLIP-style)', 'JEPA'], answer: 1,
        hint: 'Which objective defines a probability for a whole sequence?', solution: r`Causal LM: the chain rule gives it an exact distribution over sequences, so it can generate one token at a time. BERT cannot sample text in a principled way.` },
      { id: 'q4', type: 'num', concept: 'ppl3', q: r`A model's average loss on held-out text is 1.72 nats per token. What is its perplexity?`, answer: Math.exp(1.72), show: '≈ 5.58',
        hint: 'Exponentiate.', solution: r`\(e^{1.72}\approx5.58\): as unsure as a uniform pick among about 5.6 tokens.` },
      { id: 'q5', type: 'num', concept: 'infonce', q: r`What is the most information (in nats) that InfoNCE can certify with a batch of \(B = 4{,}096\)?`, answer: Math.log(4096), show: 'ln 4096 ≈ 8.32 nats',
        hint: r`The bound is \(\log B\).`, solution: r`\(\ln 4096\approx8.32\) nats. Bigger batches raise the ceiling, one reason contrastive runs use huge batches.` },
      { id: 'q6', type: 'num', concept: 'clip', q: r`How many entries does the similarity matrix have for one contrastive batch of 8,192 image-caption pairs? Answer in millions.`, answer: 8192 * 8192 / 1e6, show: '≈ 67.1 million',
        hint: r`\(B\times B\).`, solution: r`\(8192^2\approx67.1\) million: one score for every image-caption combination.` },
      { id: 'q7', type: 'mcq', concept: 'clip', q: r`In CLIP's code, what are the labels passed to cross-entropy for a batch of B pairs?`, choices: ['All ones', r`\(0, 1, \dots, B-1\): row \(i\)'s answer is column \(i\)`, 'Human-written class ids', 'Random negatives'], answer: 1,
        hint: 'Where is the correct caption for image i?', solution: r`The correct caption for image \(i\) is caption \(i\), on the diagonal, so the labels are just torch.arange(B).` },
      { id: 'q8', type: 'num', concept: 'tau', q: r`An image's similarity to its true caption is 0.8 and to the only other caption is 0.6. With temperature \(\tau = 0.1\), what probability does the softmax give the true caption?`, answer: 1 / (1 + Math.exp(-2)), show: '≈ 0.881',
        hint: r`Divide each similarity by \(\tau\) before the softmax.`, solution: r`\(e^{8}/(e^{8}+e^{6})=1/(1+e^{-2})\approx0.881\). At \(\tau=1\) it would be only \(1/(1+e^{-0.2})\approx0.55\).` },
      { id: 'q9', type: 'num', concept: 'collapse', q: r`A JEPA target encoder is updated with EMA momentum \(m = 0.99\). Roughly how many recent context encoders does it average?`, answer: 100, tol: 1,
        hint: r`About \(1/(1-m)\).`, solution: r`\(1/(1-0.99) = 100\).` },
      { id: 'q10', type: 'num', concept: 'collapse', q: r`Embeddings are L2-normalised with width \(d = 256\). What per-channel standard deviation do you expect from a healthy (not collapsed) run?`, answer: 1 / 16, show: '1/√256 = 0.0625',
        hint: r`\(1/\sqrt d\).`, solution: r`\(1/\sqrt{256} = 0.0625\). A collapsed run shows about 0.` },
      { id: 'q11', type: 'mcq', concept: 'collapse', q: r`You remove the stop-gradient from a SimSiam/JEPA-style run and the training loss falls faster and lower. What most likely happened?`, choices: ['A better representation', 'Collapse: both branches output a constant', 'The learning rate was too low before', 'Overfitting to labels'], answer: 1,
        hint: 'What solution gives zero loss with no negatives?', solution: r`Collapse. The constant output is a perfect, useless solution; kNN or linear-probe accuracy would be at chance. Monitor embedding spread, not the loss.` },
      { id: 'q12', type: 'mcq', concept: 'zeroshot', q: r`Why might a CLIP-style model confuse "no pleural effusion" with "pleural effusion"?`, choices: ['The image encoder is too small', 'Matching against random captions rarely requires understanding negation, so the objective never forces it', 'Negation words are not in the vocabulary', 'The temperature is too high'], answer: 1,
        hint: 'What does the objective actually reward?', solution: r`Picking the right caption out of a batch of random ones almost never depends on "no". The two captions share nearly every token, so the model can learn to ignore negation.` },
      { id: 'q13', type: 'mcq', concept: 'bertinput', q: r`What was the main lesson of RoBERTa?`, choices: ['Bidirectional attention does not help', 'BERT was undertrained, and next-sentence prediction added little', 'Masking should be 50%', 'Encoders cannot be fine-tuned'], answer: 1,
        hint: 'Same architecture, different training.', solution: r`Dropping NSP, dynamic masking, 10× more text and bigger batches beat BERT with the same architecture.` },
      { id: 'q14', type: 'self', concept: 'oneloss', q: r`For each objective (causal LM, masked LM, contrastive, JEPA), name what is hidden, where it is scored, and what you get out at the end.`,
        hint: 'Use the comparison table.',
        solution: r`**Causal LM**: hides the next token; scored over the vocabulary; gives a generator. **Masked LM**: hides ~15% of tokens; scored over the vocabulary using both sides; gives a contextual encoder. **Contrastive**: hides which pair matches; scored over the batch; gives aligned encoders for two modalities (e.g. image and text). **JEPA**: hides a block of input; scored as a regression in representation space; gives an encoder that ignores unpredictable detail, but must be protected from collapse.` },
    ]
  });
})();
