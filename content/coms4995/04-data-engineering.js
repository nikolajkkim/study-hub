(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w4', num: 4, minutes: 85,
    title: 'Web-scale data engineering and pre-training infrastructure',
    oneLiner: r`Turn a raw web crawl into clean, deduplicated, filtered token batches, and feed them to the GPU fast enough that it never waits.`,
    leadsTo: 'Next: how much data, for how big a model.',
    bigPicture: {
      what: r`Last week's objectives assumed two things nobody described: a vocabulary of \(V\) tokens, and an endless supply of clean text. This week builds both, in the order data flows:

1. **Tokenize**: text → integer ids (BPE).
2. **Collect**: Common Crawl → plain-text documents.
3. **Deduplicate**: remove copies and near-copies (MinHash + LSH).
4. **Filter**: keep good documents (rules, then a classifier); maybe add synthetic data.
5. **Mix**: decide how much of each source, and make sure test sets are not in there.
6. **Load**: stream pre-tokenized shards to the GPUs without stalling.`,
      why: r`The Transformer block barely changed in five years, while training data grew about fifty-fold and got much more carefully made. Two models with the same architecture and budget now differ mostly because of their data. Every stage here is a decision that changes the finished model: what it can say, which languages it serves well, what it memorises, and whether its benchmark scores mean anything.`,
      remember: r`1. A real pipeline keeps about one page in nine. Every filter threshold is a choice, and "quality" filters also remove dialects and topics.
2. MinHash estimates Jaccard similarity from a short signature; LSH bands catch a pair with probability \(1-(1-J^r)^b\), a sharp step near \((1/b)^{1/r}\).
3. Tokenize once, offline; store a flat array of ids; memory-map it; seed the batch order by step so a crashed run resumes exactly.`
    },
    sections: [
      { id: 's-lever', title: 'Data is now the main lever', summary: 'Same block, fifty times the data.', concepts: [
        { id: 'funnel', title: 'A pipeline keeps about one page in nine',
          plain: r`Most of what a crawl contains never reaches the model. In RefinedWeb: language identification removed about half (English only); filtering and deduplication each roughly halved what remained. **11.7%** of the crawl survived. Each stage is a decision (which extractor, which threshold, how similar counts as a copy), and changing any one changes the model.`,
          example: r`FineWeb kept only "educational" pages: MMLU went from 33% to 37% and ARC from 46% to 57%, with the same model and budget.` },
      ]},
      { id: 's-tok', title: 'Tokenization', summary: 'The vocabulary V is a design choice that sets cost, fairness and failure modes.', concepts: [
        { id: 'subword', title: 'Subwords: between characters and words',
          plain: r`**Characters**: tiny vocabulary, never an unknown word, but sequences several times longer (and attention costs \(n^2\)). **Words**: short sequences, but every name, typo and word form needs an entry; anything missing becomes [UNK] and its meaning is lost. **Subwords**: frequent words stay whole, rare words split into known pieces. 30k–200k pieces cover almost any text.

Note the leading space: GPT-2 stores " patient" (with its space) as one token.` },
        { id: 'bpe', title: 'Byte-pair encoding: merge the most frequent pair, repeat',
          plain: r`1. Start with every word split into characters.
2. Count every adjacent pair across the corpus, weighting each word by how often it appears.
3. Merge the most frequent pair into a new symbol.
4. Repeat until the vocabulary has \(V\) symbols.

The output is the **ordered list of merges**. To tokenize a new word, replay the merges in order: "lowest" becomes low + est even if it was never seen.`,
          example: r`Words: newest ×6, widest ×3, low ×5, lower ×2. The pair (e, s) occurs 6 times in "newest" and 3 times in "widest" = 9, the most frequent, so "es" becomes a symbol first. Then (es, t) → "est", and so on.` },
        { id: 'bytes', title: 'Byte-level BPE, WordPiece and Unigram',
          plain: r`**Byte-level BPE** (GPT-2 onward, Llama 3): start from the 256 possible UTF-8 bytes instead of characters, so **no input is ever unknown**: emoji, code, any script. A character the merges never covered just costs one token per byte.

**WordPiece** (BERT): merges the pair whose joint count is largest **relative to** its parts' counts, so two rare symbols that always appear together win. Continuation pieces get "##" ("transform", "##er").

**Unigram** (T5, via SentencePiece): give every piece a probability, choose the segmentation with the highest product, and train by **pruning** a big vocabulary. SentencePiece treats spaces as a visible symbol, which helps languages without spaces (Chinese, Japanese).` },
        { id: 'pretok', title: 'Pre-tokenization rules come first',
          plain: r`A regular expression first splits text into chunks (words, digit runs, punctuation, spaces) and BPE only merges **inside** a chunk. So " patient" and "'s" can never fuse.

Choices here matter: GPT-4o cuts digit runs into groups of at most three (2026 → 202 + 6). GPT-2 learned no merges for runs of spaces, so eight spaces of Python indentation cost eight tokens.` },
        { id: 'vocab', title: 'Vocabulary size: shorter sequences vs bigger embeddings',
          plain: r`A bigger vocabulary shortens text (fewer tokens per sentence) but grows the embedding table and the output softmax, both \(V\times d\). At large \(V\), doubling it shortens text by only a few percent while doubling those matrices.`,
          formula: r`\[ \text{embedding parameters} = V\times d\quad(\times2 \text{ if the output layer is untied}) \]`,
          example: r`Llama 3 went from \(V=32{,}000\) to \(128{,}256\) (3.17 → 3.94 English characters per token). At \(d=4096\), each \(V\times d\) matrix is 525M parameters; the two together are about 13% of the 8B model.` },
        { id: 'fair', title: 'Same sentence, different price in different languages',
          plain: r`A vocabulary learned mostly from English compresses English best. Price, speed and context length are all counted in tokens, so other languages pay more for the same content (up to 15× in one study). The same clinical sentence: 8 tokens in English and 69 in Hindi with GPT-2; GPT-4o's bigger multilingual vocabulary brings Hindi to 14. Llama 3 added 28,000 non-English tokens: the model did not change, the tokenizer did.` },
        { id: 'failures', title: 'Model failures that are really tokenizer failures',
          plain: r`- **Counting letters**: " strawberry" is one token, so the model never sees its letters ("how many r's?" → "two").
- **Arithmetic**: GPT-2 splits 12345 as 123 + 45 but 67890 as 6 + 78 + 90, so place value is inconsistent.
- **Glitch tokens**: " SolidGoldMagikarp" was common in the tokenizer's data but rare in the model's, so its embedding was barely trained.
- **Trailing spaces**: " pain" and "pain" are different tokens; a prompt ending in a space breaks the likely next token.
- **Drug names and codes**: "hydrochlorothiazide" → five meaningless fragments. PubMedBERT built its vocabulary from PubMed and beat BERT variants that reused the general one.

Pattern: the vocabulary is learned on one corpus and frozen before training on another; every mismatch shows up as a failure.` },
        { id: 'bpb', title: 'Bits per byte: comparing models with different tokenizers',
          plain: r`Perplexity is per **token**. Bigger tokens make each prediction harder, so per-token loss rises even when the model needs fewer predictions and less total loss. So you cannot compare perplexity across tokenizers.

Fix: add up the loss over the whole text, convert nats to bits (divide by ln 2), and divide by the number of **bytes**. Bytes do not depend on the tokenizer.`,
          formula: r`\[ \text{BPB} = \frac{\sum_t \ell_t}{\ln 2\ \times\ \#\text{bytes}} \]`,
          example: r`Total loss 1,386.3 nats on a 1,000-byte text: \(1386.3 / (0.693\times1000) = 2.0\) bits per byte.` },
      ]},
      { id: 's-crawl', title: 'Collecting the web', summary: 'Common Crawl is free, enormous and far from usable as delivered.', concepts: [
        { id: 'cc', title: 'Common Crawl and text extraction',
          plain: r`A nonprofit has crawled the web since 2008 and publishes each crawl (a few billion pages, every month or two) for free. Almost every open corpus starts here (C4, The Pile, RefinedWeb, FineWeb, DCLM); GPT-3 drew 60% of its mix from it.

Formats: **WARC** = raw HTML responses; **WAT** = metadata; **WET** = Common Crawl's own extracted text. FineWeb found that extracting text from WARC with a better tool (trafilatura) clearly beat using WET, everything else equal, at a real compute cost.` },
        { id: 'cheapfilters', title: 'Cheap filters first: blocklists and language ID',
          plain: r`A URL **blocklist** drops known adult, spam and malware domains before parsing (RefinedWeb: 4.6 million domains). A fastText **language classifier** then keeps pages above a confidence score (FineWeb: English ≥ 0.65). Cheap filters run first so the expensive stages see fewer pages.

Thresholds are decisions: pages that mix languages or quote code score lower, so a strict threshold loses some of both.` },
        { id: 'consent', title: 'Consent, licensing and personal data',
          plain: r`Consent is shrinking: in one year about 5% of C4's tokens (28% of its most actively maintained sources) became blocked by robots.txt. Pipelines replace emails and IP addresses with placeholders using regular expressions, but names and identifying details in free text pass through; no tool catches everything. Clinical text is stricter (HIPAA Safe Harbor removes 18 identifier types), and rare conditions plus dates can still re-identify a patient.` },
      ]},
      { id: 's-dedup', title: 'Deduplication', summary: 'The web repeats itself, and models memorise repeats.', concepts: [
        { id: 'whydedup', title: 'Why deduplicate',
          plain: r`One 61-word sentence appeared over 60,000 times in C4. Repeats waste compute (a page seen 60,000 times teaches nothing new), and they are what models **memorise**: a sequence seen 10 times in training is generated about 1,000 times more often than one seen once. Models trained on deduplicated C4 emitted memorised text ten times less often. Some benchmarks' test sets also overlapped training data.

Three tools for three kinds of repetition: **hashing** for exact copies, **MinHash** for near copies, **line/substring removal** for repeated boilerplate. Llama 3 used all three.`,
          example: r`Clinical notes: about half the text is copied forward from earlier notes. Deduplicate within each patient at paragraph level, and split train/test **by patient**, not by note.` },
        { id: 'jaccard', title: 'Near-duplicates need a similarity: Jaccard over shingles',
          plain: r`Turn each document into the **set** of its overlapping k-word chunks ("shingles"). Jaccard similarity = shared shingles ÷ all distinct shingles. 1 = identical sets, 0 = nothing in common. Near-duplicate thresholds are usually around 0.8.

Why shingles, not single words? Sets of words ignore order: "no pain, chest pressure" and "chest pain, no pressure" share every word. 3- or 5-word shingles keep local order.

But a billion documents make about \(5\times10^{17}\) pairs. Computing exact Jaccard for each is impossible.`,
          formula: r`\[ J(A,B)=\frac{|A\cap B|}{|A\cup B|} \]` },
        { id: 'minhash', title: 'MinHash: a short signature that estimates Jaccard',
          plain: r`Hash every shingle with a random hash function and keep the **smallest** value. The smallest hash over \(A\cup B\) is equally likely to come from any shingle in the union, and the two documents' minima agree exactly when that shingle is in both. So **P(minima agree) = J**.

Repeat with \(k\) different hash functions. Each document becomes \(k\) integers, whatever its length. The fraction of the \(k\) slots that agree estimates \(J\), with error shrinking like \(1/\sqrt k\).`,
          formula: r`\[ \Pr[\min h(A)=\min h(B)] = J,\qquad \hat J = \tfrac1k\#\{i: m_i(A)=m_i(B)\},\qquad \text{SE}=\sqrt{J(1-J)/k} \]`,
          example: r`\(k=112\), \(J=0.6\): standard error \(\sqrt{0.24/112}\approx0.046\).` },
        { id: 'lsh', title: 'LSH: compare only pairs that share a bucket',
          plain: r`Cut each \(k\)-number signature into \(b\) **bands** of \(r\) numbers. Hash each band to a bucket. Two documents become a **candidate pair** if all \(r\) values of at least one band match. Only candidates are checked; every other pair is never compared.

For a pair with similarity \(J\): one band matches with probability \(J^r\); all \(b\) bands fail with probability \((1-J^r)^b\); so they become candidates with probability \(1-(1-J^r)^b\). Plotted against \(J\) this is a sharp step near \((1/b)^{1/r}\). Larger \(r\) moves the step right (stricter); larger \(b\) moves it left.`,
          formula: r`\[ P(\text{candidate}) = 1-(1-J^r)^b,\qquad \text{step}\approx(1/b)^{1/r} \]`,
          widget: 'lsh',
          example: r`FineWeb: \(b=14\), \(r=8\) (112 hashes), step ≈ 0.72. \(J=0.8\) → caught 92% of the time; \(J=0.5\) → 5%.`,
          watch: r`FineWeb deduplicated each snapshot separately. Deduplicating across all 96 removed too much of the older data, which turned out to be good data.` },
      ]},
      { id: 's-quality', title: 'Quality filtering and synthetic data', summary: 'Which remaining pages are worth training on, and whether to write new ones.', concepts: [
        { id: 'rules', title: 'Heuristic rules: cheap and explainable',
          plain: r`Examples: keep lines ending in punctuation; drop pages with fewer than 3 sentences (C4); 50 to 100,000 words; mean word length 3–10; under 10% symbols like # or "…"; at most 90% of lines are bullets; 80% of words contain a letter; must contain common words like "the", "of" (Gopher). They run on every page and every removal can be explained. The thresholds were chosen by training small models and keeping what scored best, not from principle.` },
        { id: 'classifier', title: 'Perplexity filters and classifier filters',
          plain: r`**Perplexity filter** (CCNet): train a small LM on a reference corpus like Wikipedia; keep web pages it finds unsurprising. Risk: "reads like Wikipedia" ≠ "good"; fluent forum posts, recipes and dialogue get dropped.

**Classifier filter**: learn "good" from examples. FineWeb-Edu had Llama-3-70B rate 460,000 pages for educational value (0–5), trained a small model on those ratings, scored every page, and kept scores ≥ 3 (1.3T tokens). DCLM's simple fastText classifier (instruction-style text vs random pages) beat hand-written rule sets.

Practical order: cheap rules first, then the classifier only on survivors. The threshold trades quality against quantity, and in a data-limited setting fewer pages means more repetition.` },
        { id: 'biasfilter', title: 'Filtering for "quality" also filters dialects and topics',
          plain: r`Audits found the C4 bad-words list removed African-American and Hispanic-aligned English and text about LGBTQ+ people at higher rates; a GPT-3-style quality classifier rated school newspapers from poorer, rural areas as lower quality. A model rarely sees the language of groups whose text was filtered out, then performs worse for them, and aggregate benchmarks hide it.

What to do: keep a sample of what each filter removes and **read it**; measure how much each filter keeps by source, dialect or topic, not only in total.` },
        { id: 'synthetic', title: 'Synthetic data, and model collapse',
          plain: r`When good text runs out, write more. **phi-1**: a 1.3B code model trained on about 6B tokens of filtered web code plus about 1B tokens of GPT-3.5-written textbooks scored 50.6% on HumanEval, above much larger models. **WRAP** rephrased web pages into cleaner styles and reached the same quality about 3× faster.

**Model collapse**: a generator under-samples rare events (more so at low temperature). Train the next model only on those samples and the rare events get rarer; repeat and the tails vanish. The fix: **add** synthetic data to real data, never replace it.

Treat a generator as one more source: verify correctness (run code, check maths), decontaminate against benchmarks, deduplicate, diversify, and cap its share.` },
      ]},
      { id: 's-mix', title: 'Mixtures and contamination', summary: 'How much of each source, and keeping the test set out.', concepts: [
        { id: 'mixture', title: 'Mixture weights set how often each source is seen',
          plain: r`If the run trains on \(D\) tokens and gives source \(i\) weight \(w_i\), it reads \(w_iD\) tokens from that source. Divide by the source's size to get how many times it is repeated (epochs). Repeated data is almost as good as fresh up to about 4 epochs, and adds almost nothing past about 16 (Week 5).`,
          formula: r`\[ e_i = \frac{w_i\,D}{|S_i|} \]`,
          example: r`Llama 3's final mix: about 50% general knowledge, 25% maths and reasoning, 17% code, 8% multilingual. DoReMi learns the weights with a small proxy model instead.` },
        { id: 'contam', title: 'Benchmark contamination: check n-gram overlap',
          plain: r`If test questions are in the training data, the benchmark measures memory, not ability. GPT-3 flagged a benchmark example if **any** of its 13-token sequences appeared in the training data, and reported results on the clean subsets (a bug had left some overlaps and retraining was too expensive).

At web scale the n-gram set does not fit in memory; pipelines use a Bloom filter or suffix array.`,
          formula: r`\[ \text{overlap}(e)=\frac{|G_{13}(e)\cap G_{13}(\mathcal D)|}{|G_{13}(e)|} \]`,
          watch: r`A paraphrased or translated test question shares no 13-gram with the original. Rephrased test data can raise scores while passing n-gram checks.` },
      ]},
      { id: 's-load', title: 'Feeding the GPUs', summary: 'A pre-tokenized array on disk, read fast enough that the GPU never waits.', concepts: [
        { id: 'throughput', title: 'The loader must never be the bottleneck',
          plain: r`Each step consumes \(B\) sequences of \(n\) tokens in \(t_{\text{step}}\) seconds, so the loader must supply \(Bn/t_{\text{step}}\) tokens per second, without interruption. Idle GPU time costs the same as busy time. Tokenizing inside the training loop can be slower than the GPU step itself, so tokenize the whole corpus **once, offline**. PyTorch's DataLoader workers prepare the next batches while the GPU computes.`,
          formula: r`\[ \text{tokens per second} \ge \frac{B\cdot n}{t_{\text{step}}} \]`,
          example: r`4 million tokens per step, 10-second step → 400,000 tokens every second.` },
        { id: 'memmap', title: 'A flat array of ids, memory-mapped',
          plain: r`Tokenize every document, separate with an end-of-text token, concatenate into one long array, and save it in the **smallest integer type that fits every id**. uint16 holds up to 65,535: GPT-2's 50,257 ids fit (2 bytes per token); Llama 3's 128,256 do not (4 bytes). Split into many fixed-size **shards** for parallel reading.

**np.memmap** maps the file into memory without reading it; slicing a range makes the OS load just those pages. The bytes already are token ids, so there is nothing to parse.` },
        { id: 'packing', title: 'Packing, and deterministic resumption',
          plain: r`Rows are cut from the flat array at a fixed length, so no position is padding, but a row can start mid-document and include the start of another. Either let tokens attend across the boundary (simple) or use a block-diagonal mask so each document only sees itself (cleaner; needs a kernel that accepts custom masks).

Long runs crash. Resuming at step 80,000 must neither repeat nor skip data. Give each GPU and each loader worker its own subset of shards, and fix the shuffled order with a shared seed (or seed each batch by (seed, step)), so every rank can compute its share independently and identically after a restart.` },
      ]},
    ],
    sheet: [
      { title: 'Seven stages, one table', cols: ['Stage', 'Main tool', 'What it costs', 'Without it'], rows: [
        ['Tokenization', 'byte-level BPE', r`a training pass; \(V\times d\) parameters (×2)`, 'unknown words, long sequences, costly languages'],
        ['Extraction', 'trafilatura on WARC', 'parsing every HTML page', 'menus and banners in the training text'],
        ['Cheap filters', 'URL blocklist, fastText language ID', 'one small prediction per page', 'spam and the wrong languages'],
        ['Deduplication', 'hashing, MinHash + LSH, line removal', 'k hashes per document', 'wasted compute, memorisation, leaked tests'],
        ['Quality filtering', 'rules, then a classifier', 'labels from a large model; a score per page', 'low-value text, or (overdone) missing dialects'],
        ['Mixture & contamination', 'source weights, 13-gram checks', 'ablations; an n-gram index', 'over-repeated sources, inflated scores'],
        ['Loading', 'pre-tokenized memmapped shards', 'one tokenization pass; disk', 'an idle GPU; runs that cannot resume'],
      ]},
      { title: 'Formulas', cols: ['Quantity', 'Formula'], rows: [
        ['Jaccard', r`\(|A\cap B|/|A\cup B|\)`],
        ['MinHash agreement', r`\(P = J\); SE \(=\sqrt{J(1-J)/k}\)`],
        ['LSH candidate probability', r`\(1-(1-J^r)^b\), step at \((1/b)^{1/r}\)`],
        ['Bits per byte', r`\(\sum\ell/(\ln2\cdot\#\text{bytes})\)`],
        ['Epochs of a source', r`\(e_i = w_iD/|S_i|\)`],
        ['Loader throughput', r`\(Bn/t_{\text{step}}\) tokens/s`],
        ['Embedding size', r`\(V\times d\)`],
        ['Storage per token', 'uint16 (2 B) if V ≤ 65,536, else 4 B'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'bpe', q: r`Word counts: hug ×10, pug ×5, pun ×12, bun ×4, hugs ×5. Starting from characters, what is the weighted count of the adjacent pair (u, n)?`, answer: 16, tol: 0.01,
        hint: 'Add the count of every word that contains "un".', solution: r`"pun" 12 + "bun" 4 = **16**. (For comparison, (u, g) = 10 + 5 + 5 = 20, so it would be merged first.)` },
      { id: 'q2', type: 'num', concept: 'jaccard', q: r`Document A has 8 distinct shingles, document B has 10, and they share 6. What is their Jaccard similarity?`, answer: 0.5,
        hint: r`Union = 8 + 10 − 6.`, solution: r`\(6/(8+10-6) = 6/12 = 0.5\).` },
      { id: 'q3', type: 'num', concept: 'lsh', q: r`With \(b=10\) bands of \(r=6\) rows, what is the probability that a pair with \(J = 0.7\) becomes a candidate?`, answer: 1 - Math.pow(1 - Math.pow(0.7, 6), 10), show: '≈ 0.714',
        hint: r`\(1-(1-J^r)^b\).`, solution: r`\(0.7^6\approx0.1176\); \((1-0.1176)^{10}\approx0.286\); so \(\approx0.714\).` },
      { id: 'q4', type: 'num', concept: 'lsh', q: r`Where is the LSH step for \(b = 20\) bands of \(r = 5\) rows? (Use \((1/b)^{1/r}\).)`, answer: Math.pow(1 / 20, 1 / 5), show: '≈ 0.55',
        hint: r`\(0.05^{0.2}\).`, solution: r`\(0.05^{0.2} = e^{0.2\ln0.05}\approx\) **0.55**. A looser setting than FineWeb's 0.72.` },
      { id: 'q5', type: 'num', concept: 'minhash', q: r`For a true Jaccard of 0.7, what is the standard error of the MinHash estimate with \(k = 100\) hash functions?`, answer: Math.sqrt(0.21 / 100), show: '≈ 0.0458',
        hint: r`\(\sqrt{J(1-J)/k}\).`, solution: r`\(\sqrt{0.7\times0.3/100}=\sqrt{0.0021}\approx0.046\).` },
      { id: 'q6', type: 'num', concept: 'memmap', q: r`A corpus of 10 billion tokens is stored with a GPT-2-sized vocabulary (50,257 ids). How many GB on disk?`, answer: 20, tol: 0.01,
        hint: 'Which integer type fits every id?', solution: r`uint16 (max 65,535) fits, so 2 bytes per token: \(10^{10}\times2 = 20\) GB.` },
      { id: 'q7', type: 'mcq', concept: 'memmap', q: r`A new tokenizer has 70,000 tokens. How many bytes per token must the stored token array use?`, choices: ['1', '2', '4', '8'], answer: 2,
        hint: 'What is the largest value uint16 can hold?', solution: r`uint16 holds 0–65,535, and 70,000 ids do not fit, so you need 4 bytes (uint32): double the disk space of a ≤65k vocabulary.` },
      { id: 'q8', type: 'num', concept: 'vocab', q: r`How many parameters does one \(V\times d\) embedding matrix have for \(V = 100{,}000\) and \(d = 5120\)? Answer in millions.`, answer: 512, tol: 0.5,
        hint: r`\(V\times d\).`, solution: r`\(100{,}000\times5120=512\)M. With a separate output layer, double it.` },
      { id: 'q9', type: 'num', concept: 'mixture', q: r`A run trains on 1 trillion tokens and gives weight 0.10 to a code source of 25 billion tokens. How many epochs of that source does it see?`, answer: 4, tol: 0.01,
        hint: r`\(w_iD/|S_i|\).`, solution: r`\(0.10\times10^{12}/(25\times10^9)=4\) epochs: right at the "almost as good as fresh" limit.` },
      { id: 'q10', type: 'num', concept: 'throughput', q: r`Each step uses 512 sequences of 4,096 tokens and takes 2 seconds. How many tokens per second must the loader deliver?`, answer: 512 * 4096 / 2, show: '1,048,576',
        hint: r`\(Bn/t\).`, solution: r`\(512\times4096/2 = 1{,}048{,}576\) tokens per second (about a million).` },
      { id: 'q11', type: 'num', concept: 'bpb', q: r`A model's total loss over a 2,000-byte text is 2,079 nats. What is its bits per byte?`, answer: 2079 / (Math.LN2 * 2000), show: '≈ 1.50',
        hint: 'Divide by ln 2, then by the byte count.', solution: r`\(2079/(0.6931\times2000)\approx\) **1.50** bits per byte.` },
      { id: 'q12', type: 'mcq', concept: 'bpb', q: r`Model A (32k vocabulary) has lower perplexity than model B (128k vocabulary). Can you conclude A is better?`, choices: ['Yes, lower perplexity is always better', 'No: perplexity is per token and the tokenizers differ; compare bits per byte', 'Yes, if they were trained on the same data', 'No, perplexity only applies to encoders'], answer: 1,
        hint: 'What is perplexity averaged over?', solution: r`Bigger tokens make each prediction harder, so B's per-token loss is naturally higher. Bits per byte normalises by the text, not the tokens.` },
      { id: 'q13', type: 'mcq', concept: 'contam', q: r`What does a 13-gram overlap check miss?`, choices: ['Exact copies of test questions', 'Paraphrased or translated test questions', 'Test questions with extra whitespace', 'Nothing'], answer: 1,
        hint: 'Rewording changes every 13-gram.', solution: r`A rephrased question shares no 13-token run with the original, so it passes the check while still leaking the answer.` },
      { id: 'q14', type: 'mcq', concept: 'synthetic', q: r`How do you avoid model collapse when using synthetic data?`, choices: ['Generate at very low temperature', 'Add synthetic data to the real data instead of replacing it, and cap its share', 'Train only on the newest model\'s outputs', 'Skip deduplication'], answer: 1,
        hint: 'What disappears first under repeated self-training?', solution: r`Collapse comes from training each generation only on the previous one's samples, which lose the rare tails. Keeping real data in the mix avoided it.` },
      { id: 'q15', type: 'self', concept: 'failures', q: r`Explain why a model might say "strawberry" has two r's, and why GPT-2 struggles with 5-digit addition, in terms of tokenization.`,
        hint: 'What does the model actually receive as input?',
        solution: r`" strawberry" is a single token, so the model receives one id, never the letters; it has to have memorised the spelling. GPT-2 splits numbers inconsistently (12345 → 123 + 45, 67890 → 6 + 78 + 90), so the same digit position lands in different tokens in different numbers; place value is not represented consistently, which makes digit-by-digit arithmetic hard.` },
    ]
  });
})();
