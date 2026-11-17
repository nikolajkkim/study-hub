(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w9', num: 9, minutes: 80,
    title: 'Preference modeling and direct alignment (DPO)',
    oneLiner: r`Learn from **pairs** of answers (better vs worse): turn comparisons into a reward model, then skip the reward model entirely with **DPO**.`,
    leadsTo: 'Next: the same objective optimised online, on the model\'s own answers (PPO).',
    bigPicture: {
      what: r`Supervised fine-tuning (Week 8) imitates one good answer and never sees a bad one, so it learns nothing about what to avoid. Preference tuning learns from **triples**: a prompt, a chosen answer, a rejected answer.

The road this week:
1. Why comparisons, and how they are collected (humans, AI judges, and their biases).
2. **Bradley-Terry**: turn comparisons into a reward model whose score gaps predict which answer people prefer.
3. The **RLHF objective**: maximise reward minus \(\beta\) × KL from the starting model.
4. **DPO**: three algebra steps show that objective can be optimised with one classification-style loss on the pairs. No reward model, no RL loop.
5. What goes wrong, the DPO family, and two case studies (Zephyr, Med42-v2).`,
      why: r`DPO is the cheapest, most reproducible alignment method and the right first choice on one GPU and a deadline (your project). Homework 4 covers this, PPO and GRPO. You should be able to derive DPO from the RLHF objective and implement it in fifteen lines.`,
      remember: r`1. Bradley-Terry: \(P(y_w \succ y_l)=\sigma(r_w-r_l)\). Only differences matter. Reward-model loss = \(-\log\sigma(r_w-r_l)\).
2. RLHF maximises \(\mathbb E[r] - \beta\,\text{KL}(\pi_\theta\|\pi_{\text{ref}})\). Large β = tight leash to the reference.
3. DPO: \(\mathcal L = -\log\sigma\big(\beta[\log\tfrac{\pi_\theta(y_w)}{\pi_{\text{ref}}(y_w)}-\log\tfrac{\pi_\theta(y_l)}{\pi_{\text{ref}}(y_l)}]\big)\). Starts at \(\log 2\). Watch the chosen answer's own log-probability, not just the margin.`
    },
    sections: [
      { id: 's-comp', title: 'From demonstrations to comparisons', summary: 'Judging which of two answers is better is easier than writing the best one.', concepts: [
        { id: 'pairs', title: 'Comparisons are cheaper than demonstrations',
          plain: r`Writing an ideal answer is slow; picking the better of two is fast. InstructGPT collected about 13,000 prompts with written demonstrations but about 33,000 with ranked comparisons, because each label was cheaper. Every preference dataset becomes triples \((x, y_w, y_l)\): prompt, chosen ("winner"), rejected ("loser").

One bit per label: A or B, and nothing about why. Everything this week is about squeezing a training signal from that bit. And "chosen" means **better**, not ideal: the label gives a direction, not a target.` },
        { id: 'pipeline', title: 'InstructGPT\'s three steps',
          plain: r`1. **SFT** on demonstrations (Week 8).
2. **Reward model**: the SFT model writes 4–9 answers per prompt, a labeller ranks them, a reward model learns to reproduce the ranking (this week).
3. **RL**: optimise the policy against the reward model with PPO (next week).

**Policy** is RL's word for the model being trained; \(\pi_\theta(y\mid x)\) is the probability it writes answer \(y\) to prompt \(x\). DPO replaces steps 2 and 3 with one loss on the same ranked pairs.` },
      ]},
      { id: 's-collect', title: 'Collecting feedback', summary: 'Formats, disagreement, AI judges and built-in biases.', concepts: [
        { id: 'formats', title: 'Rankings, pairs and graded pairs',
          plain: r`A ranking of \(K\) answers gives \(K(K-1)/2\) pairs, but they share answers and are strongly correlated. InstructGPT kept all pairs from one prompt in the same batch to avoid overfitting. Llama 2 used graded pairs (two answers from different model variants and temperatures) to maximise prompt diversity per labelling hour.`,
          formula: r`\[ \#\text{pairs from a ranking of } K = \frac{K(K-1)}{2} \]` },
        { id: 'agree', title: 'Annotators agree about three times in four',
          plain: r`InstructGPT's labellers agreed with each other on 72.6% of comparisons (held-out labellers 77.3%). About one label in four would flip with a different annotator: that is a ceiling for any model trained on them. Close calls are coin flips, and some dataset labels are simply debatable.` },
        { id: 'aif', title: 'AI feedback: a model and a rubric instead of a person',
          plain: r`**RLAIF** keeps the pipeline and swaps the labeller for a strong model with a written rubric. **Constitutional AI** (Anthropic): the model compares answers against written principles ("choose the less harmful response"); humans write the principles, not the labels.

**UltraFeedback**: 64,000 prompts, four answers each from a pool of 17 different models, GPT-4 rates each on four aspects (instruction following, truthfulness, honesty, helpfulness). Binarise into a DPO pair by taking the best-scored answer as chosen and another as rejected. Different models make the four answers genuinely different.` },
        { id: 'biases', title: 'Every preference dataset rewards length, flattery and position',
          plain: r`- **Length**: labellers prefer longer answers → the model learns to pad. Much of the reward gain on standard RLHF data could be reproduced by optimising length alone.
- **Sycophancy**: agreeing with the user → confirming wrong premises ("My son's fever is from teething, right?").
- **Position**: AI judges prefer the first answer shown → judge both orders, keep consistent labels.
- **Self-preference**: a judge prefers text in its own style → use a judge from another model family.
- **Formatting**: lists and bold everywhere.` },
      ]},
      { id: 's-bt', title: 'Bradley-Terry reward models', summary: 'A score whose differences predict which answer people choose.', concepts: [
        { id: 'bt', title: 'The score gap sets the probability of winning',
          plain: r`Give every answer a score \(r\). The probability that answer \(A\) is preferred to \(B\) is the sigmoid of the score difference. Same idea as chess Elo ratings (which use base 10 and a scale of 400).

**Only differences matter**: add a constant to every reward and no probability changes. Hold on to this; DPO depends on it.`,
          formula: r`\[ P(y_w\succ y_l\mid x)=\sigma\big(r(x,y_w)-r(x,y_l)\big)=\frac{1}{1+e^{-(r_w-r_l)}} \]
\[ \text{Elo: } P(A \text{ wins}) = \frac{1}{1+10^{-(R_A-R_B)/400}} \]`,
          widget: 'bt' },
        { id: 'rmarch', title: 'A reward model is the SFT model with a one-number head',
          plain: r`Feed prompt + answer in together; take the hidden state at the **last real token**; a linear layer turns it into one number \(r(x,y)\). Initialise from the SFT model so the judge knows what the judged model knows.

One score per answer means every token shares the same reward: a coarse signal, which makes RL on it noisy.`,
          watch: r`Reading a padding position instead of the last real token is the classic silent bug.` },
        { id: 'rmloss', title: 'The loss: logistic regression on the score gap',
          plain: r`Maximise the Bradley-Terry likelihood of the observed preferences: binary cross-entropy where the logit is the reward gap and the label is always "chosen wins". The gradient pushes the two scores apart.

Report **pairwise accuracy** on held-out pairs. With annotators agreeing ~75% of the time, accuracy in the low 70s is already good.`,
          formula: r`\[ \mathcal L_{\text{RM}}=-\mathbb E_{(x,y_w,y_l)}\big[\log\sigma\big(r_\phi(x,y_w)-r_\phi(x,y_l)\big)\big] \]`,
          example: r`Gap \(+0.8\): loss \(-\log\sigma(0.8)=0.37\). Wrong order, gap \(-0.8\): loss 1.17.` },
        { id: 'llama2rm', title: 'Llama 2\'s margin, and judging a reward model',
          plain: r`Llama 2 trained two reward models (helpfulness, safety) on 1.4M Meta comparisons (2.9M with open data), collected weekly from the latest model, and added a **margin** for how strongly the labeller preferred: significantly better 1, better 2/3, slightly better 1/3, unsure 0. Loss becomes \(-\log\sigma(r_w-r_l-m)\).

**RewardBench** (~3,000 pairs: Chat, Chat Hard, Safety, Reasoning; chance 50%) separates good reward models from merely fluent ones. A reward model is accurate on the kind of answers it trained on, which is why Llama 2 refreshed data weekly.` },
        { id: 'overopt', title: 'Optimise a learned reward too hard and true quality falls',
          plain: r`Gao et al.: a 6B "gold" reward model stands in for people; smaller proxy reward models learn from its labels; a policy is optimised against each proxy. The proxy score keeps rising; the gold score peaks, then falls. **Goodhart's law**: when a measure becomes a target, it ceases to be a good measure. This motivates a limit on how far the policy may move from where it started.` },
      ]},
      { id: 's-kl', title: 'The KL-regularized objective', summary: 'Maximise reward, but stay close to where you started.', concepts: [
        { id: 'klobj', title: 'Reward minus a penalty for drifting',
          plain: r`Prompts \(x\) come from a dataset; answers \(y\) come from the policy being trained. \(r_\phi\) is the trained reward model; \(\pi_{\text{ref}}\) is a frozen copy of the SFT model. **KL divergence** measures, averaged over the policy's own answers, how much more likely the policy makes them than the reference did; zero when the two agree.

\(\beta\) sets how much reward one unit of drift is worth. The penalty limits reward hacking, keeps the abilities SFT gave, and keeps answers diverse. Small \(\beta\) chases reward (risks hacking); large \(\beta\) barely moves. Typical 0.01–0.5.`,
          formula: r`\[ \max_{\pi_\theta}\ \mathbb E_{x,\,y\sim\pi_\theta}\big[r_\phi(x,y)\big]-\beta\,\text{KL}\big(\pi_\theta(\cdot\mid x)\,\|\,\pi_{\text{ref}}(\cdot\mid x)\big) \]` },
        { id: 'fourmodels', title: 'PPO needs four big models in memory',
          plain: r`Optimising this with PPO keeps: the **policy** (trained), a **value model** (trained; estimates reward still to come), the frozen **reference**, and the frozen **reward model**. For 7B models with Adam: 112 GB + 112 GB (trained, 16 bytes/param) + 14 GB + 14 GB (frozen, 2 bytes/param) = over 250 GB before activations. DPO keeps two.` },
      ]},
      { id: 's-dpo', title: 'Direct Preference Optimization', summary: 'Write the reward in terms of the policy, and the reward model disappears.', concepts: [
        { id: 'step1', title: 'Step 1: the objective has a closed-form optimum',
          plain: r`For any reward \(r\), the best policy under the KL-regularised objective is the reference **reweighted** by \(\exp(r/\beta)\) and renormalised. Answers the reward likes get boosted; \(\beta\) controls how much (large \(\beta\): nearly flat reweighting, stays near the reference).

The catch: \(Z(x)\) sums over **every possible answer**, so it can never be computed. Steps 2 and 3 make it cancel.`,
          formula: r`\[ \pi^\star(y\mid x)=\frac{1}{Z(x)}\,\pi_{\text{ref}}(y\mid x)\,\exp\!\Big(\frac{r(x,y)}{\beta}\Big),\qquad Z(x)=\sum_y \pi_{\text{ref}}(y\mid x)\exp\!\Big(\frac{r(x,y)}{\beta}\Big) \]` },
        { id: 'step2', title: 'Step 2: solve for the reward: it is a log-ratio',
          plain: r`Take logs and rearrange step 1. The reward of an answer is \(\beta\) times how much more likely the optimal policy makes it than the reference, **plus** a term \(\beta\log Z(x)\) that is the same for every answer to the same prompt. Exact, not approximate.

"Your language model is secretly a reward model": any policy defines a reward through this log-ratio, so training the policy and training the reward become the same thing.`,
          formula: r`\[ r(x,y)=\beta\log\frac{\pi^\star(y\mid x)}{\pi_{\text{ref}}(y\mid x)}+\beta\log Z(x) \]` },
        { id: 'step3', title: 'Step 3: substitute into Bradley-Terry; Z cancels',
          plain: r`Bradley-Terry only uses \(r_w - r_l\) for the **same** prompt. Both answers carry the same \(\beta\log Z(x)\), so it cancels. Replace \(\pi^\star\) with the model we train, take the negative log-likelihood, and you get the DPO loss: the reward-model loss from Part 3 with \(r\) written as \(\beta\log\pi_\theta/\pi_{\text{ref}}\).

It needs four log-probabilities per pair: policy and reference, on chosen and rejected. The reference runs with no gradient (its log-probs can be cached).`,
          formula: r`\[ \mathcal L_{\text{DPO}}=-\mathbb E\left[\log\sigma\!\left(\beta\log\frac{\pi_\theta(y_w\mid x)}{\pi_{\text{ref}}(y_w\mid x)}-\beta\log\frac{\pi_\theta(y_l\mid x)}{\pi_{\text{ref}}(y_l\mid x)}\right)\right] \]`,
          widget: 'bt:dpo',
          example: r`At the start, \(\pi_\theta=\pi_{\text{ref}}\), both log-ratios are 0, so the loss is \(-\log\sigma(0)=\log 2\approx0.693\). A quick sanity check for your code.` },
        { id: 'gradient', title: 'What one gradient step does',
          plain: r`The implied reward is \(\hat r_\theta = \beta\log\pi_\theta/\pi_{\text{ref}}\). Each step raises the chosen answer's log-probability and lowers the rejected one's, **weighted** by \(\sigma(\hat r_l-\hat r_w)\): large when the model currently ranks the pair wrong, near zero once it is well ordered. Without that weight (raising and lowering at a fixed rate) the model degenerates.

Log during training: mean implicit reward of chosen and rejected answers, their gap, and **reward accuracy** (share of pairs with \(\hat r_w>\hat r_l\)).`,
          formula: r`\[ \nabla\mathcal L = -\beta\,\mathbb E\Big[\sigma(\hat r_l-\hat r_w)\big(\nabla\log\pi_\theta(y_w)-\nabla\log\pi_\theta(y_l)\big)\Big] \]` },
        { id: 'beta', title: 'β: how far the margin must grow before the loss lets go',
          plain: r`Same meaning as in the KL objective. **Large \(\beta\)**: the loss saturates after a small log-ratio margin, so the policy stays near the reference (tight leash). **Small \(\beta\)**: the weight stays high until the margin is large, so the policy drifts further. People often guess the opposite.

In practice: 0.1 (DPO paper dialogue, Zephyr, Llama 3), 0.5 (DPO paper summarisation), 0.01 (Med42-v2 70B).` },
        { id: 'vsppo', title: 'DPO vs RLHF with PPO',
          plain: r`DPO matched or beat PPO on sentiment, summarisation (TL;DR win rate ~61% vs ~57%) and dialogue (the only method to beat the dataset's chosen answers on Anthropic HH), on models up to 6B judged by GPT-4. Careful PPO with online data can still win (next week).

| | RLHF with PPO | DPO |
|---|---|---|
| Models in memory | 4 | 2 (or cached reference log-probs) |
| Data | fresh samples, scored online | a fixed set of pairs, offline |
| Hyperparameters that bite | many | β, learning rate, epochs |` },
      ]},
      { id: 's-pitfalls', title: 'Pitfalls and the DPO family', summary: 'Falling likelihoods, stale data, and the variants built to fix them.', concepts: [
        { id: 'falling', title: 'Both likelihoods can fall while the margin grows',
          plain: r`DPO only cares about the **gap**. It can be satisfied by pushing the rejected answer down a lot and the chosen answer down a little, so the chosen answer's own probability falls. Llama 3's fixes: add a negative log-likelihood (SFT-style) term on the chosen answer (weight α = 0.2), and mask out header and end-of-turn tokens (shared tokens got opposite pushes, causing repetition and early stopping). **Log the chosen log-probability itself.**` },
        { id: 'stale', title: 'Offline pairs go stale; iterative DPO labels fresh answers',
          plain: r`Offline DPO learns from answers the current policy might never write. **Iterative DPO**: sample from the current model, rank those samples, run another round. Llama 3 did six rounds with new human preferences on the latest model each time. Online AI feedback (an LLM judge labelling pairs from the current policy at each step) beat offline DPO on the same budget.` },
        { id: 'family', title: 'The DPO family',
          plain: r`- **IPO**: squared loss toward a target margin; use when DPO overfits near-deterministic preferences.
- **cDPO**: assumes each label is flipped with probability ε; use with noisy labels.
- **KTO**: scores single answers against a reference point; works with **thumbs up/down**, unpaired data (product feedback).
- **ORPO**: SFT loss + an odds-ratio penalty, no reference model; SFT and alignment in one stage.
- **SimPO**: length-normalised log-probability with a target margin, no reference model; when memory is tight or answers grow long.

All still need an SFT model to start from.` },
      ]},
      { id: 's-cases', title: 'Case studies: Zephyr-7B and Med42-v2', summary: 'DPO end to end with AI feedback only, and in a clinical model.', concepts: [
        { id: 'zephyr', title: 'Zephyr-7B: distilled SFT + AI feedback + distilled DPO',
          plain: r`Mistral 7B → SFT on ~200,000 UltraChat dialogues (written by a stronger model: "distilled SFT") → DPO on UltraFeedback pairs judged by GPT-4. β = 0.1, learning rate \(5\times10^{-7}\), batch 32, three epochs, **2–4 hours on 16 A100s**. No human labels at all.

Result: MT-Bench 7.34, beating Llama 2-Chat 70B (6.86), a model 10× larger aligned with full RLHF; AlpacaEval 90.6%. The DPO step taught it, for example, to question a false premise and to get multi-step arithmetic right.

Ablations: DPO **without SFT first** scored only 4.76 (vs 7.34): DPO needs an SFT start. Training accuracy hit 100% in one epoch, yet three epochs scored best: training reward accuracy is not a stopping rule. Limits: GPT-4 judged both data and evaluation; no safety step.` },
        { id: 'med42', title: 'Med42-v2: clinical SFT, then three DPO rounds',
          plain: r`Llama 3 base → clinical SFT → three rounds of DPO on pairs generated and ranked by another team (PairRM, a small model that reads two answers and picks the better), plus Zephyr's data. β = 0.01 for the 70B (a looser leash; no reason given). The goal: **answer** clinicians' questions instead of refusing them.

Results: 81.2% average on 7 medical benchmarks vs 80.5% for Llama 3.1 Instruct 70B. But no ablation of the DPO stage is reported. What would show its effect: before/after each round, refusal rates on prompts that should and should not be answered, physician ratings of free-text answers. The model card states it is not ready for clinical use.` },
      ]},
    ],
    sheet: [
      { title: 'Formulas', cols: ['Quantity', 'Formula'], rows: [
        ['Bradley-Terry', r`\(P(y_w\succ y_l)=\sigma(r_w-r_l)\)`],
        ['Reward-model loss', r`\(-\log\sigma(r_w-r_l)\)  (Llama 2: \(-\log\sigma(r_w-r_l-m)\))`],
        ['Pairs from a ranking of K', r`\(K(K-1)/2\)`],
        ['RLHF objective', r`\(\mathbb E[r]-\beta\,\text{KL}(\pi_\theta\|\pi_{\text{ref}})\)`],
        ['Optimal policy', r`\(\pi^\star\propto\pi_{\text{ref}}\exp(r/\beta)\)`],
        ['Implicit reward', r`\(\beta\log\pi_\theta(y)/\pi_{\text{ref}}(y)\)`],
        ['DPO loss', r`\(-\log\sigma\big(\beta[(\log\pi_\theta-\log\pi_{\text{ref}})_w-(\log\pi_\theta-\log\pi_{\text{ref}})_l]\big)\)`],
        ['DPO loss at start', r`\(\log2\approx0.693\)`],
        ['Gradient weight', r`\(\sigma(\hat r_l-\hat r_w)\)`],
        ['PPO memory (7B, Adam)', '112 + 112 + 14 + 14 ≈ 252 GB'],
      ]},
      { title: 'Methods at a glance', cols: ['Method', 'Data', 'Reference model?', 'Use when'], rows: [
        ['DPO', 'pairs', 'yes', 'the default'],
        ['IPO', 'pairs', 'yes', 'DPO overfits near-deterministic preferences'],
        ['cDPO', 'pairs', 'yes', 'labels are noisy'],
        ['KTO', 'thumbs up/down, unpaired', 'yes', 'feedback comes from a product'],
        ['ORPO', 'pairs', 'no', 'SFT and alignment in one stage'],
        ['SimPO', 'pairs', 'no', 'memory is tight; answers grow longer'],
        ['Iterative DPO', 'fresh pairs from the current model', 'yes', 'offline pairs are off-distribution'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'formats', q: r`A labeller ranks \(K = 5\) answers to one prompt. How many chosen-rejected pairs does that ranking produce?`, answer: 10, tol: 0.01,
        hint: r`\(K(K-1)/2\).`, solution: r`\(5\times4/2=10\) pairs (correlated, since they share answers).` },
      { id: 'q2', type: 'num', concept: 'bt', q: r`A reward model scores the chosen answer 1.2 and the rejected answer 0.4. Under Bradley-Terry, what is the probability the chosen one is preferred?`, answer: 1 / (1 + Math.exp(-0.8)), show: 'σ(0.8) ≈ 0.69',
        hint: r`\(\sigma(r_w-r_l)\).`, solution: r`\(\sigma(0.8)=1/(1+e^{-0.8})\approx\) **0.69**.` },
      { id: 'q3', type: 'num', concept: 'rmloss', q: r`Same pair. What is the reward-model loss for it?`, answer: -Math.log(1 / (1 + Math.exp(-0.8))), show: '≈ 0.371',
        hint: r`\(-\log\sigma(0.8)\).`, solution: r`\(-\ln 0.690\approx\) **0.371**. If the order were wrong (gap −0.8) it would be 1.17.` },
      { id: 'q4', type: 'num', concept: 'bt', q: r`In Elo, player A is rated 400 points above B. What is A's expected probability of winning?`, answer: 10 / 11, show: '10/11 ≈ 0.909',
        hint: r`\(1/(1+10^{-400/400})\).`, solution: r`\(1/(1+10^{-1})=10/11\approx\) **0.909**.` },
      { id: 'q5', type: 'mcq', concept: 'bt', q: r`You add 5 to every reward the reward model outputs. What happens to the Bradley-Terry probabilities?`, choices: ['They all increase', 'They all decrease', 'Nothing: only differences matter', 'They become 0.5'], answer: 2,
        hint: r`\(\sigma(r_w-r_l)\).`, solution: r`\((r_w+5)-(r_l+5)=r_w-r_l\). Unchanged. This is exactly why \(\beta\log Z(x)\) cancels in DPO.` },
      { id: 'q6', type: 'num', concept: 'step3', q: r`At the very first DPO step the policy equals the reference. What is the loss?`, answer: Math.LN2, show: 'log 2 ≈ 0.693',
        hint: 'Both log-ratios are zero.', solution: r`\(-\log\sigma(0)=-\log0.5=\log2\approx\) **0.693**. If your code starts elsewhere, check it.` },
      { id: 'q7', type: 'num', concept: 'step3', q: r`With \(\beta = 0.1\): the policy's log-ratio vs the reference is \(+2\) on the chosen answer and \(-3\) on the rejected one. What is the DPO loss?`, answer: -Math.log(1 / (1 + Math.exp(-0.5))), show: '−log σ(0.5) ≈ 0.474',
        hint: r`Margin \(h = 2-(-3) = 5\); loss \(=-\log\sigma(\beta h)\).`, solution: r`\(\beta h=0.5\); \(-\log\sigma(0.5)\approx\) **0.474**.` },
      { id: 'q8', type: 'num', concept: 'gradient', q: r`Same pair. What is the gradient weight \(\sigma(\hat r_l-\hat r_w)\)?`, answer: 1 / (1 + Math.exp(0.5)), show: 'σ(−0.5) ≈ 0.378',
        hint: r`\(\hat r_w = 0.1\times2=0.2\), \(\hat r_l = 0.1\times(-3) = -0.3\).`, solution: r`\(\sigma(-0.3-0.2)=\sigma(-0.5)\approx\) **0.378**: the pair is ordered correctly, so the push is already weaker than at the start (0.5).` },
      { id: 'q9', type: 'num', concept: 'gradient', q: r`Same pair. What is the implicit reward of the chosen answer?`, answer: 0.2,
        hint: r`\(\beta\times\) its log-ratio.`, solution: r`\(0.1\times2=0.2\).` },
      { id: 'q10', type: 'mcq', concept: 'beta', q: r`You raise DPO's β from 0.1 to 0.5. What happens?`, choices: ['The policy is allowed to drift further from the reference', 'The policy stays closer to the reference', 'β has no effect in DPO', 'The loss starts at a different value'], answer: 1,
        hint: 'Same β as in the KL objective.', solution: r`Larger β = tighter leash: the loss saturates after a smaller log-ratio margin, so the policy moves less. (The starting loss is still log 2.)` },
      { id: 'q11', type: 'num', concept: 'fourmodels', q: r`PPO with four 7B models: policy and value model trained (16 bytes/param), reference and reward model frozen (2 bytes/param). Total GB before activations?`, answer: 252, tol: 1,
        hint: r`\(2\times112+2\times14\).`, solution: r`\(112+112+14+14=\) **252 GB**. DPO needs the policy (112) plus the reference (14), or cached log-probs.` },
      { id: 'q12', type: 'mcq', concept: 'family', q: r`Your only feedback is thumbs up / thumbs down on single answers from a product. Which method fits?`, choices: ['DPO', 'IPO', 'KTO', 'SimPO'], answer: 2,
        hint: 'Which one does not need pairs?', solution: r`KTO scores single answers against a reference point and works with unpaired binary feedback.` },
      { id: 'q13', type: 'mcq', concept: 'falling', q: r`During DPO the margin grows, but the chosen answers' log-probabilities are falling. What is the standard fix?`, choices: ['Lower β to 0', 'Add an NLL (SFT) term on the chosen answer', 'Remove the reference model', 'Train for more epochs'], answer: 1,
        hint: 'Llama 3 used weight 0.2.', solution: r`An NLL term on the chosen answer keeps its probability up while DPO widens the gap. Also log the chosen log-prob directly.` },
      { id: 'q14', type: 'mcq', concept: 'zephyr', q: r`In Zephyr's ablation, DPO applied directly to the base model (no SFT) scored 4.76 on MT-Bench vs 7.34 with SFT first. What does that show?`, choices: ['DPO is useless', 'DPO needs a reasonable SFT starting point', 'SFT alone is better than SFT + DPO', 'The β was wrong'], answer: 1,
        hint: 'What does DPO stay close to?', solution: r`DPO refines a policy near its reference. Starting from a base model that does not follow instructions, it has little to work with. dSFT then dDPO was best.` },
      { id: 'q15', type: 'self', concept: 'step1', q: r`Derive the DPO loss from the KL-regularised objective in three steps, and say why \(Z(x)\) disappears.`,
        hint: 'Closed form → solve for r → plug into Bradley-Terry.',
        solution: r`**1.** The optimum of \(\mathbb E[r]-\beta\text{KL}(\pi\|\pi_{\text{ref}})\) is \(\pi^\star=\pi_{\text{ref}}\exp(r/\beta)/Z(x)\). **2.** Take logs and solve for the reward: \(r=\beta\log(\pi^\star/\pi_{\text{ref}})+\beta\log Z(x)\). **3.** Bradley-Terry uses \(r_w-r_l\) for the same prompt, so \(\beta\log Z(x)\) appears in both and cancels. Substitute \(\pi_\theta\) for \(\pi^\star\) and take the negative log-likelihood: \(\mathcal L=-\log\sigma(\beta[\log\frac{\pi_\theta(y_w)}{\pi_{\text{ref}}(y_w)}-\log\frac{\pi_\theta(y_l)}{\pi_{\text{ref}}(y_l)}])\). The uncomputable sum over all answers never has to be evaluated.` },
    ]
  });
})();
