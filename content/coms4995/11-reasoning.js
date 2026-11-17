(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w11', num: 11, minutes: 85,
    title: 'Reasoning and search-time scaling',
    oneLiner: r`When an answer can be **checked**, spend more compute at inference (sample, vote, search) and train with RL directly on the checker (**GRPO**), as reasoning models like DeepSeek-R1 do.`,
    leadsTo: 'Next (Dec 2): inference optimization and serving.',
    bigPicture: {
      what: r`Weeks 9–10 scored answers with a **learned reward model** that can be fooled. This week the score comes from a **checker**: exact match on a maths answer, unit tests for code, a parser. A rule is much harder to exploit, and that opens two doors:

1. **Spend more compute at inference**: write out reasoning (chain-of-thought), sample many answers and vote, or search, then pick an answer the checker or a verifier prefers.
2. **Train with RL on the checker**: GRPO is PPO without the critic; a group of answers to the same question is its own baseline.

Then: what breaks (length bias, entropy collapse), what RL actually adds (it sharpens; distillation teaches), two case studies (DeepSeek-R1; m1 in medicine), and a recap of all the alignment methods.`,
      why: r`This is how current reasoning models are built and evaluated. You should be able to explain why chain-of-thought and sampling help, compute pass@k, choose between voting, a verifier and a longer thinking budget, write the GRPO loss (Homework 4), and pick an alignment method for a task.`,
      remember: r`1. Each reasoning token buys one more forward pass of computation. Coverage (pass@k) keeps rising with samples; **picking** the right sample is the hard part.
2. GRPO advantage: \(\hat A_i=(r_i-\text{mean})/\text{std}\) over a group of \(G\) answers. All-right or all-wrong groups give zero gradient. No critic: about half PPO's memory, but \(G\)× the generation.
3. RL with verifiable rewards raises pass@1 but not pass@256: it **sharpens** what the base model can already do. To add new abilities to a small model, **distil** from a stronger one.`
    },
    sections: [
      { id: 's-cot', title: 'Chain-of-thought', summary: 'Writing out the steps before the answer.', concepts: [
        { id: 'cot', title: 'Chain-of-thought prompting',
          plain: r`Put a few worked examples in the prompt that show the **reasoning** before the answer, not just the answer. The model copies the format and writes intermediate steps. Same model, same weights, only the prompt changes. PaLM 540B with eight such examples set the state of the art on GSM8K (grade-school maths word problems).

But it only helps once the model is big enough: below about 100B parameters it gave little gain or hurt (fluent but illogical steps); above, the gain jumps, most on multi-step problems. (Later instruction-tuned and reasoning-trained models write useful chains at much smaller sizes: data sets the threshold too.)` },
        { id: 'zeroshotcot', title: '"Let\'s think step by step"',
          plain: r`No examples at all, just one sentence before the answer. Call 1 generates reasoning after the trigger; call 2 appends "Therefore, the answer (arabic numerals) is" to extract it. With text-davinci-002: MultiArith 17.7% → 78.7%, GSM8K 10.4% → 40.7%. Reasoning models are now trained so this is the default: DeepSeek-R1 writes reasoning between <think> tags before every answer.` },
        { id: 'tokens', title: 'Each reasoning token buys one more forward pass',
          plain: r`A Transformer does a fixed amount of computation per token. A problem needing ten sequential steps may not fit in one forward pass, but it can be spread across ten generated tokens, each reading the earlier ones through attention. Generated tokens act as **working memory**: write intermediate results down, read them back.

Not free: compute and latency grow with the length of the reasoning. That is the bill test-time scaling decides to pay.` },
        { id: 'faithful', title: 'The written reasoning is not always the real reason',
          plain: r`Turpin et al. biased few-shot prompts (e.g. every example's answer was (A)). Models followed the bias, and their chain-of-thought explained the answer **without mentioning** the bias; accuracy fell by up to 36 points on some tasks. A chain-of-thought is a useful output, not a guaranteed window into the computation. **Check answers, not stories.** A judge that reads the reasoning can be persuaded by it; a checker that looks only at the final answer cannot.` },
      ]},
      { id: 's-ttc', title: 'Test-time compute: sample, vote, search', summary: 'Spend more compute at inference instead of in training.', concepts: [
        { id: 'selfcons', title: 'Self-consistency: sample many chains and vote',
          plain: r`Instead of one greedy chain, sample many at a temperature above zero and return the **most common final answer**. Wrong chains scatter over many different answers; correct chains tend to agree. Up to +17.9 points on GSM8K over greedy chain-of-thought, with no extra model. Limit: needs final answers that can be compared (a number, a choice); free text has no majority.` },
        { id: 'coverage', title: 'Coverage keeps rising with the number of samples',
          plain: r`**Coverage** (pass@k): the chance that at least one of \(k\) samples is right. It grows roughly linearly in \(\log k\) over four orders of magnitude. On SWE-bench Lite (real GitHub issues), one model solved 15.9% with one sample and 56% with 250, beating the 43% single-attempt state of the art.

The catch: coverage assumes an **oracle** that recognises the right sample. Unit tests and proof checkers provide one; most tasks do not.` },
        { id: 'passk', title: 'pass@k, maj@k and best-of-N answer different questions',
          plain: r`- **pass@1**: how often one sample is right (what a user sees).
- **pass@k**: whether **any** of \(k\) is right (what the model can find; needs an oracle).
- **maj@k**: the most common of \(k\) final answers (needs comparable answers).
- **best-of-N**: the answer a verifier scores highest (needs a verifier).

To estimate pass@k without bias: draw \(n\ge k\) samples, count \(c\) correct, and compute the chance a random subset of \(k\) contains at least one. Always state \(k\), \(n\) and the temperature.`,
          formula: r`\[ \text{pass@}k = 1-\frac{\binom{n-c}{k}}{\binom{n}{k}} \]`,
          widget: 'passk',
          example: r`\(n=10\), \(c=2\): pass@1 = 0.2; pass@5 \(=1-\binom85/\binom{10}5=1-56/252\approx0.78\).` },
        { id: 'pickgap', title: 'Finding a correct answer is easy; picking it out is hard',
          plain: r`On MATH, majority vote and reward-model selection plateau around 100 samples while coverage keeps climbing. If the model's most common answer is wrong, more samples confirm it; a correct answer found once in 100 never wins a vote. The gap between coverage and what you can actually select **is the verification problem**. A better verifier is worth as much as a better generator.` },
        { id: 'tot', title: 'Tree of Thoughts: search over partial solutions',
          plain: r`The model proposes several next steps, rates them itself, and a breadth- or depth-first search expands the promising ones and backtracks from dead ends. On Game of 24, GPT-4 with chain-of-thought solved 4%; with Tree of Thoughts, 74%. Cost: many model calls per problem and a hand-written controller per task. Reasoning models learned to do much of this search **inside one long chain**: propose, check, "wait", backtrack.` },
      ]},
      { id: 's-verif', title: 'Verifiers: outcome, process, rules', summary: 'Scoring answers, scoring steps, or checking them.', concepts: [
        { id: 'orm', title: 'Outcome reward models (ORM)',
          plain: r`A verifier reads a solution and predicts whether it is correct, trained on final-answer correctness only (Week 9's reward model, with correctness as the label). Sampling 100 solutions and keeping the top-scored one gave a 6B model about the boost of a 30× larger model. With small training sets verification lost to plain fine-tuning; it won once the dataset was large.` },
        { id: 'prm', title: 'Process reward models (PRM): score every step',
          plain: r`A step label says **where** a solution went wrong; a final-answer label only says **that** it did, and lucky answers after wrong reasoning get credit. Lightman et al. had humans label 800,000 individual steps (PRM800K). Best of 1,860 samples on MATH: 78.2% with the PRM, 72.4% with an outcome model, 69.6% with majority voting. Step labels are expensive; later work estimates them by rolling out from each step and checking final answers.` },
        { id: 'rules', title: 'Rule-based verifiers: check, do not score',
          plain: r`- **Exact match** on the final answer (maths, multiple choice). Fooled by: guessing on multiple choice.
- **Symbolic equivalence** (SymPy, Math-Verify): 1/2 equals 0.5. Fooled by: parser bugs, odd formats.
- **Unit tests** (code). Fooled by: weak tests, special-casing visible inputs.
- **Constraint checkers** (IFEval: word counts, valid JSON). Fooled by: meeting the letter, not the intent.
- **Format checks** (answer inside the right tags). Alone, rewards form, not content.

A rule cannot be persuaded by confident prose: the score depends only on the extracted answer. Where rules run out (open writing, medicine, law), an LLM judge against a reference answer is used.` },
        { id: 'difficulty', title: 'The best strategy depends on difficulty, and on time',
          plain: r`Snell et al.: for easy and medium questions, **sequential revisions** (refine an answer that is nearly right) work best; for hard ones, **parallel sampling and search** explore different approaches; on the hardest, more pre-training beat more test-time compute. Choosing the strategy per difficulty matched best-of-N with about 4× less compute, and a small model + test-time compute beat a 14× larger model on easy and medium questions at matched FLOPs.

**Budget forcing** (s1): fine-tune on 1,000 reasoning traces, then end thinking early, or extend it by blocking the end-of-thinking token and appending "Wait". AIME24: 50.0% → 56.7%. At the same token budget, extending one chain beat majority voting over many short ones.` },
      ]},
      { id: 's-grpo', title: 'Group Relative Policy Optimization (GRPO)', summary: 'PPO without the value model, for rewards that can be checked.', concepts: [
        { id: 'grpoidea', title: 'The group is the baseline',
          plain: r`For each question, sample a **group** of \(G\) answers, score each with the checker, and use the group's mean as the baseline. No value model to train, no GAE. What is dropped: PPO's critic, usually as big as the policy and hard to train when the only reward arrives at the end. What stays: the clipped ratio and the KL to a frozen reference: the same reward − β·KL objective.` },
        { id: 'adv', title: 'Group-relative advantage',
          plain: r`Normalise each answer's reward within its group: subtract the mean, divide by the standard deviation. Every token of answer \(i\) gets the same advantage, so the whole answer is pushed up or down together. Answers better than their siblings go up, worse ones go down, and the advantages sum to zero. **The rarer the success, the bigger its push.**

Almost RLOO (which uses the mean of the *other* \(G-1\) and does not divide by std).`,
          formula: r`\[ \hat A_i = \frac{r_i-\text{mean}(r_1,\dots,r_G)}{\text{std}(r_1,\dots,r_G)} \]`,
          widget: 'grpo',
          example: r`\(G=8\), 3 correct (\(r=1\)), 5 wrong (\(r=0\)): mean 0.375, std 0.48. Correct: +1.29 each; wrong: −0.77 each. With only 1 correct in 8: +2.65 for it, −0.38 for each wrong one.` },
        { id: 'objective', title: 'The full objective',
          plain: r`Per token: PPO's clipped ratio times the group advantage, minus \(\beta\) × a KL estimate to the reference. Each answer's loss is averaged over its **own length** \(|o_i|\), then averaged over the \(G\) answers (remember this for the length-bias problem). The KL is a separate loss term, not part of the reward, so the advantage reflects only the checker.

The KL estimator \(e^{d}-d-1\) with \(d=\log\pi_{\text{ref}}-\log\pi_\theta\) is always ≥ 0.

DeepSeekMath: \(G = 64\), \(\beta = 0.04\), learning rate \(10^{-6}\), batch 1,024. GSM8K 82.9% → 88.2%, MATH 46.8% → 51.7%.`,
          formula: r`\[ \mathcal J=\frac1G\sum_{i=1}^G\frac{1}{|o_i|}\sum_{t}\Big[\min\big(\rho_{i,t}\hat A_i,\ \text{clip}(\rho_{i,t},1\pm\varepsilon)\hat A_i\big)-\beta\,\widehat{\text{KL}}_{i,t}\Big],\qquad \widehat{\text{KL}}=e^{d}-d-1 \]` },
        { id: 'rlvr', title: 'RLVR: the reward is a function, not a model',
          plain: r`Tülu 3 named it **Reinforcement Learning with Verifiable Rewards**: sample completions, give a fixed reward (10 in Tülu 3) if the checker accepts the answer and 0 otherwise, optimise. RLVR names the **reward**, not the optimiser: Tülu 3 used PPO, DeepSeek used GRPO, others use RLOO. In Tülu 3 it is the last stage: SFT → DPO → RLVR on the tasks that have checkers (GSM8K, MATH, instruction constraints).` },
        { id: 'grpomem', title: 'Memory: one trained model, one frozen',
          plain: r`7B model, Adam, mixed precision: PPO = policy 112 + value 112 + reference 14 + reward model 14 = 252 GB. GRPO with a rule = policy 112 + reference 14 = **126 GB** (no reference at all if \(\beta = 0\)); the reward is a Python function. But GRPO samples \(G\) answers per question (often 8–64), each possibly thousands of tokens, so **generation becomes most of the cost**. Frameworks pair the trainer with a fast inference engine like vLLM for rollouts.` },
        { id: 'zerospread', title: 'All-right or all-wrong groups teach nothing',
          plain: r`If every answer in a group gets the same reward, every advantage is zero and the question contributes **no gradient**, after paying for \(G\) generations. Keep questions the current model solves **sometimes** (e.g. 20–80% of the time; estimate with a few samples first), or resample until the batch is full of mixed groups (DAPO's dynamic sampling).` },
      ]},
      { id: 's-fix', title: 'Making GRPO work', summary: 'Length bias, entropy collapse, and the hacks rules still allow.', concepts: [
        { id: 'lengthbias', title: 'Per-answer averaging lets wrong answers grow long',
          plain: r`GRPO divides each answer's loss by its length, so each token of a **long** wrong answer is penalised **less** than a token of a short one. Wrong answers drift longer, and that length is easy to mistake for "deeper thinking". Dividing by the group std also up-weights questions that are almost always right or almost always wrong (difficulty bias).

**Dr. GRPO** ("GRPO Done Right") drops both: advantage = \(r-\text{mean}\), and divide the summed token loss by a constant. Same accuracy, shorter wrong answers.` },
        { id: 'dapo', title: 'DAPO: four fixes, measured one by one',
          plain: r`On Qwen2.5-32B (AIME 2024): naive GRPO 30 →
- **overlong filtering** (answers cut at the length limit are not scored as wrong): 36
- **clip-higher** (\(\varepsilon_{\text{low}}=0.2\), \(\varepsilon_{\text{high}}=0.28\), so low-probability tokens can grow; entropy stays up): 38
- **soft overlong punishment** (gradual penalty near the limit): 41
- **token-level loss** (average over all tokens in the batch, so long answers weigh fairly): 42
- **dynamic sampling** (drop zero-spread groups and resample) = DAPO: **50**.

DAPO also drops the KL term: for long reasoning the policy is meant to move far from the start, and the checker, not the reference, keeps it honest.` },
        { id: 'entropy', title: 'Entropy collapse: the model stops exploring',
          plain: r`Without clip-higher, entropy fell to near zero within a few hundred steps and accuracy stalled. The upper clip \(1+\varepsilon\) caps how fast a low-probability token can grow, so rare but useful continuations never get their chance.

Log: entropy, response length (correct and wrong separately), reward, share of zero-spread groups, clip fraction. Warning signs: entropy near zero (no exploration); length rising only on wrong answers (length bias); reward up but held-out accuracy flat (hacking).` },
        { id: 'gaming', title: 'Rules can be gamed too',
          plain: r`- Multiple choice: guessing earns 25% with no reasoning → convert to open answers (HuatuoGPT-o1 did).
- Truncation: scoring a cut-off answer as wrong punishes long, correct reasoning (overlong filter).
- Weak tests: special-case the visible inputs → hide thorough tests.
- Format rewards: tidy tags around empty reasoning → keep them small next to correctness.
- Learned rewards are worse: DeepSeek-R1 kept neural reward models out of reasoning RL; with a model-based helpfulness reward, reward rose while CodeForces accuracy fell.` },
      ]},
      { id: 's-adds', title: 'What RL actually adds', summary: 'Sharpening what the base can do, or teaching something new?', concepts: [
        { id: 'sharpen', title: 'RL wins at pass@1; the base model wins at large k',
          plain: r`Yue et al. (2025), across maths, code and visual reasoning and six RL algorithms: RL with verifiable rewards raised **pass@1**, but at \(k=256\) the **base** model solved more problems. RL made correct paths it already sampled more likely, without adding new ones, and some rare correct paths were lost: the set of solvable problems shrank.

**Distillation** (SFT on a stronger teacher's reasoning traces) moves the student toward patterns it did not have: both pass@1 and pass@256 go up. Use RL for reliability (what users see); to expand what a small model can solve at all, distil from a stronger model, then apply RL.

Caveats: at large \(k\), pass@k can count lucky guesses; longer RL, more diverse data and multi-turn agents may change the picture.` },
      ]},
      { id: 's-cases', title: 'Case studies: DeepSeek-R1 and m1', summary: 'RL from a base model, then distillation; and thinking budgets in medicine.', concepts: [
        { id: 'r1zero', title: 'R1-Zero: GRPO on a base model, rule-based rewards only',
          plain: r`DeepSeek-V3-Base, no SFT. Template: think inside <think>…</think>, answer inside <answer>…</answer>, with no guidance on how to reason. Reward = accuracy (answer matches, or code passes tests) + format. AIME 2024 pass@1 rose from 15.6% to 77.9% (86.7% with self-consistency over 16). Average response length grew from hundreds to many thousands of tokens, and reflective words ("wait") became more frequent, including a logged "aha moment" where the model restarts its derivation.

Caveat: base models already produce some self-reflection before RL; RL makes it more frequent rather than inventing it. Problems: poor readability and language mixing.` },
        { id: 'r1pipe', title: 'The R1 pipeline, and distillation',
          plain: r`1. **Cold start**: SFT on thousands of long, readable chain-of-thought examples.
2. **Reasoning RL**: GRPO with rule-based rewards + a language-consistency reward.
3. **Rejection sampling + SFT**: keep ~600K correct reasoning samples, add ~200K non-reasoning examples.
4. **RL for all scenarios**: rules for reasoning; reward models for helpfulness and harmlessness.

**Distillation beat RL on the same small model**: Qwen2.5-32B with 10K+ steps of RL reached 47.0% on AIME 2024; the same base with SFT on 800K R1 samples and no RL reached 72.6%. RL on 7B and 16B bases failed to improve AIME (answers grew repetitive). For a small reasoning model: distil from a large one; RL on top can add more.` },
        { id: 'm1', title: 'm1: more thinking helps in medicine, up to a point',
          plain: r`Fine-tune Qwen2.5-Instruct on 1K or 23K medical questions with verified reasoning (no RL), then vary the thinking budget. Accuracy rose with budget on most of ten benchmarks, best near **4K tokens**; past that, overthinking could lower accuracy. m1-7B-23K averaged 60.3%, ahead of similar-size medical reasoning models.

But **budget forcing ("Wait") did not help** and sometimes turned right answers wrong: the model reasoned fluently from a wrong or missing fact. In medicine, **knowledge, not thinking time, is the limit**; gains came from more and better data and larger models. And exams are not patients: multiple-choice accuracy says little about clinical safety.` },
      ]},
      { id: 's-recap', title: 'Recap: three weeks of alignment', summary: 'SFT, DPO, PPO, GRPO and test-time compute: which one, when.', concepts: [
        { id: 'table', title: 'Every alignment method side by side',
          plain: r`| Method | Signal | Data | Models | Strength | Weakness |
|---|---|---|---|---|---|
| SFT | demonstrations | offline | 1 | simple, stable; teaches format | imitates; never sees its mistakes |
| Rejection sampling | own samples kept by a scorer | semi-online | 1 + scorer | uses any scorer | learns only what it already gets right |
| DPO | preference pairs | offline | 2 | cheap, reproducible | off-policy; can favour unlabelled answers |
| PPO | reward model or checker | online | 4 | most flexible | memory, hyperparameters, hacking |
| GRPO / RLOO | checker over G samples | online | 2 (1 if β=0) | no critic; great for verifiable tasks | needs a checker; G× generation; biases |
| Test-time compute | votes, verifier, longer thinking | none | 1 + verifier | no training | cost at every query; needs a selector |

Same objective throughout: maximise reward, stay close to the reference. The methods differ in where the reward comes from and whose samples it scores.` },
        { id: 'guide', title: 'A decision guide',
          plain: r`1. Does the model already show the behaviour or format? **No** → SFT on demonstrations, or distil from a stronger model first.
2. **Yes**, and the answer can be checked automatically → does it solve the task sometimes? **Yes** → GRPO / RLOO (+ voting at inference). **No** → distil or curate easier data first: RL cannot reinforce what it never samples.
3. Cannot be checked → preference pairs and a tight budget? **Yes** → DPO (iterative, with fresh pairs, if you can). **No** → PPO with a reward model and the reward-hacking safeguards.

Most pipelines combine them: Tülu 3 = SFT → DPO → RLVR. DeepSeek-R1 = SFT → GRPO → rejection sampling → GRPO. Llama 3 = SFT, rejection sampling and DPO. Whatever you trained, sampling and voting is the cheapest gain left; spend it on hard but solvable questions.` },
      ]},
    ],
    sheet: [
      { title: 'Formulas', cols: ['Quantity', 'Formula'], rows: [
        ['pass@k (unbiased)', r`\(1-\binom{n-c}{k}/\binom nk\)`],
        ['GRPO advantage', r`\((r_i-\text{mean})/\text{std}\) over the group (population std)`],
        ['Dr. GRPO advantage', r`\(r_i-\text{mean}\); token loss ÷ a constant`],
        ['GRPO objective', r`clipped ratio × \(\hat A_i\) − \(\beta\,\widehat{\text{KL}}\), averaged per answer then over G`],
        ['KL estimator', r`\(e^d-d-1\), \(d=\log\pi_{\text{ref}}-\log\pi_\theta\)`],
        ['DeepSeekMath GRPO', r`\(G=64,\ \beta=0.04\), lr \(10^{-6}\), batch 1,024`],
        ['DAPO clip-higher', r`\(\varepsilon_{\text{low}}=0.2,\ \varepsilon_{\text{high}}=0.28\), \(\beta=0\)`],
        ['Memory 7B: PPO vs GRPO-with-rule', '252 GB vs 126 GB'],
      ]},
      { title: 'Test-time strategies', cols: ['Strategy', 'Needs', 'Best for'], rows: [
        ['Chain-of-thought', 'a big enough (or reasoning-trained) model', 'multi-step problems'],
        ['Self-consistency (maj@k)', 'comparable final answers', 'maths, multiple choice'],
        ['Best-of-N', 'a verifier (ORM or PRM)', 'when a verifier is good'],
        ['Sequential revision / budget forcing', 'a model that can self-correct', 'easy and medium questions'],
        ['Parallel search / Tree of Thoughts', 'many calls, a controller', 'hard questions'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'passk', q: r`You draw \(n = 10\) samples and \(c = 2\) are correct. What is pass@5?`, answer: 1 - 56 / 252, show: '1 − 56/252 ≈ 0.778',
        hint: r`\(1-\binom{8}{5}/\binom{10}{5}\).`, solution: r`\(\binom85=56\), \(\binom{10}5=252\); \(1-56/252\approx\) **0.78**.` },
      { id: 'q2', type: 'num', concept: 'passk', q: r`\(n = 10\) samples, only \(c = 1\) correct. What is pass@3?`, answer: 0.3,
        hint: r`\(1-\binom93/\binom{10}3\).`, solution: r`\(\binom93=84\), \(\binom{10}3=120\); \(1-84/120=0.3\). (With one correct, pass@k is just \(k/n\).)` },
      { id: 'q3', type: 'num', concept: 'passk', q: r`\(n = 20\), \(c = 5\). What is pass@1?`, answer: 0.25,
        hint: r`pass@1 = \(c/n\).`, solution: r`\(5/20=0.25\).` },
      { id: 'q4', type: 'num', concept: 'adv', q: r`GRPO group of \(G = 8\) with exactly 1 correct answer (\(r=1\)) and 7 wrong (\(r=0\)). What is the advantage of each **wrong** answer? (Population std.)`, answer: -0.125 / Math.sqrt(0.125 * 0.875), show: '≈ −0.378',
        hint: r`Mean 0.125; std \(=\sqrt{0.125\times0.875}\).`, solution: r`std \(=\sqrt{0.109}=0.331\). Wrong: \((0-0.125)/0.331\approx\) **−0.38**. The correct one gets \((1-0.125)/0.331\approx+2.65\).` },
      { id: 'q5', type: 'num', concept: 'adv', q: r`Group rewards \([1, 1, 1, 0]\). What is the GRPO advantage of the wrong answer?`, answer: -0.75 / Math.sqrt(0.75 * 0.25), show: '≈ −1.73',
        hint: r`Mean 0.75; std \(=\sqrt{0.75\times0.25}=0.433\).`, solution: r`\((0-0.75)/0.433\approx\) **−1.73**. Each right answer gets \(+0.58\).` },
      { id: 'q6', type: 'num', concept: 'lengthbias', q: r`Same group \([1,1,1,0]\) with the Dr. GRPO advantage. What does the wrong answer get?`, answer: -0.75,
        hint: 'No division by std.', solution: r`\(0-0.75=-0.75\).` },
      { id: 'q7', type: 'mcq', concept: 'zerospread', q: r`All 16 answers in a GRPO group are correct. What does this question contribute to the gradient?`, choices: ['A large positive push', 'Nothing: every advantage is zero', 'A push toward shorter answers', 'Only the KL term matters, so a large update'], answer: 1,
        hint: 'Reward minus the mean.', solution: r`Every \(r_i\) equals the mean, so every advantage is 0. The 16 generations were paid for and taught nothing (apart from the small KL term). Filter or resample such questions.` },
      { id: 'q8', type: 'num', concept: 'grpomem', q: r`GRPO with a rule-based reward on a 7B model (policy trained, reference frozen). GB before activations?`, answer: 126, tol: 1,
        hint: '16 + 2 bytes per parameter.', solution: r`\(112+14=126\) GB, half of PPO's 252. If \(\beta=0\), only 112.` },
      { id: 'q9', type: 'num', concept: 'objective', q: r`Compute the KL estimator \(e^{d}-d-1\) for \(d = \log\pi_{\text{ref}}-\log\pi_\theta = -0.1\).`, answer: Math.exp(-0.1) + 0.1 - 1, show: '≈ 0.00484', tol: 0.0002,
        hint: r`\(e^{-0.1}\approx0.9048\).`, solution: r`\(0.9048+0.1-1\approx\) **0.0048**. Always ≥ 0, and about \(d^2/2\) for small \(d\).` },
      { id: 'q10', type: 'num', concept: 'selfcons', q: r`Eight sampled chains give final answers 12, 15, 12, 9, 12, 15, 15, 12. What does self-consistency return?`, answer: 12, tol: 0.01,
        hint: 'Count each answer.', solution: r`12 appears 4 times, 15 three times, 9 once. Majority: **12**.` },
      { id: 'q11', type: 'mcq', concept: 'sharpen', q: r`After RL with verifiable rewards, what typically happens to pass@1 and pass@256 relative to the base model?`, choices: ['Both rise', 'pass@1 rises; pass@256 is flat or lower', 'pass@1 falls; pass@256 rises', 'Both fall'], answer: 1,
        hint: 'Sharpening vs teaching.', solution: r`RL makes already-sampled correct paths more likely (pass@1 up) but does not add new ones and can lose rare ones (pass@256 flat or down).` },
      { id: 'q12', type: 'mcq', concept: 'r1pipe', q: r`You want a strong 7B reasoning model and have access to a large reasoning model's outputs. What should you do first?`, choices: ['GRPO on the 7B base from scratch', 'Distil: SFT on the large model\'s reasoning traces', 'DPO on human preferences', 'Prompt with "Let\'s think step by step"'], answer: 1,
        hint: 'What happened when DeepSeek ran RL on 7B and 16B bases?', solution: r`Distillation beat RL on the same small model (72.6% vs 47.0% AIME for 32B), and RL on 7B/16B bases failed to improve. Distil first; RL on top can add more.` },
      { id: 'q13', type: 'mcq', concept: 'pickgap', q: r`Coverage on MATH keeps climbing with more samples, but majority voting plateaus. Why?`, choices: ['Sampling temperature is too low', 'A correct answer found rarely never wins a vote; selection, not generation, is the bottleneck', 'The model runs out of memory', 'Coverage is miscalculated'], answer: 1,
        hint: 'What does voting need?', solution: r`If the model's most common answer is wrong, more samples reinforce it. The gap between coverage and selection is the verification problem.` },
      { id: 'q14', type: 'mcq', concept: 'm1', q: r`What did m1 find about forcing medical models to think longer with "Wait"?`, choices: ['Large gains on every benchmark', 'It did not help and sometimes turned right answers wrong; missing knowledge was the limit', 'It only helped multiple choice', 'It reduced token usage'], answer: 1,
        hint: 'Medicine is not maths.', solution: r`Accuracy improved with budget up to ~4K tokens, but budget forcing did not help: the model reasoned fluently from wrong or missing facts. More and better data and larger models helped.` },
      { id: 'q15', type: 'mcq', concept: 'faithful', q: r`Why is a checker that reads only the final answer safer than a judge that reads the chain-of-thought?`, choices: ['It is faster', 'Written reasoning can be unfaithful and persuasive; a final-answer check cannot be talked into a wrong answer', 'Judges cannot read long text', 'Checkers work for every task'], answer: 1,
        hint: 'Turpin et al.', solution: r`Models can produce plausible reasoning that does not reflect why they answered. A judge can be persuaded by it; an exact-match or unit-test check cannot.` },
      { id: 'q16', type: 'self', concept: 'guide', q: r`For each situation, pick a method and justify it: (a) maths word problems, model solves ~40%; (b) a chatbot's tone, SFT already decent, one GPU; (c) a new skill the model never shows.`,
        hint: 'Use the decision guide.',
        solution: r`(a) **GRPO/RLOO** with exact-match reward, plus voting at inference: the answer can be checked and the model succeeds sometimes, so groups have spread. (b) **DPO** (iterative if possible): cheap, stable, two models, and the target is near the reference. (c) **SFT or distillation first**: RL cannot reinforce behaviour it never samples; once the model sometimes succeeds, RL can sharpen it.` },
    ]
  });
})();
