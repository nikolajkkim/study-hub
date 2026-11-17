(function () {
  const r = String.raw;
  COURSE.add({
    id: 'w10', num: 10, minutes: 80,
    title: 'Reinforcement learning and alignment loops (PPO)',
    oneLiner: r`Same objective as DPO, but the model learns from **its own answers**, scored by a reward model, with small clipped steps (**PPO**), and has to be stopped from gaming that reward.`,
    leadsTo: 'Next: replace the reward model with a checker, and the critic with a group of samples (GRPO).',
    bigPicture: {
      what: r`DPO optimised the RLHF objective **offline**, from a fixed set of pairs someone else wrote. PPO optimises the same objective **online**: in every step the model writes answers, a reward model scores them, and the model is nudged toward the better-than-expected ones.

The road:
1. **Policy gradients**: how a single end-of-answer score becomes a gradient (REINFORCE, baselines, advantages).
2. **PPO**: a learned critic, GAE advantages, and a clipped ratio that keeps each update small.
3. **Making it work**: the implementation details and warning signs.
4. **Systems**: four models in memory, and generation dominating the time.
5. **Reward hacking**: the policy finds the reward model's blind spots.
6. **PPO vs DPO**: when online RL is worth it. Case studies: Llama 2-Chat, HuatuoGPT-o1.`,
      why: r`PPO is the original RLHF algorithm (InstructGPT, Llama 2) and the template for GRPO next week. You should be able to write its loss, estimate its memory, recognise reward hacking in a training log, and argue for PPO or DPO in a given situation (Homework 4).`,
      remember: r`1. Advantage = reward − baseline: push better-than-expected answers up, worse ones down. A baseline cuts noise without biasing the gradient.
2. PPO loss: \(-\min(\rho\hat A,\ \text{clip}(\rho,1\pm\varepsilon)\hat A)\) with \(\rho=\pi_\theta/\pi_{\text{old}}\), \(\varepsilon = 0.2\). Clipping only ever removes incentive.
3. Reward hacking: training reward keeps rising while a held-out judge falls, KL jumps, length drifts. Control KL, stop early on a held-out judge, cap length, use ensembles.`
    },
    sections: [
      { id: 's-pg', title: 'From preferences to policy gradients', summary: 'Writing an answer is an episode; the reward arrives at the end.', concepts: [
        { id: 'episode', title: 'An answer is an episode with a sparse reward',
          plain: r`The **policy** (the model being trained) picks one token at a time: \(\pi_\theta(a_t\mid s_t)\), where the "state" is the prompt plus tokens so far. One whole answer is one **episode**. The reward model pays **once**, at the end-of-sequence token; a 300-token answer gets one score. Working out which tokens earned it is the hard part.

The KL penalty is charged on **every** token: per-token reward = \(-\beta\) × (log-ratio of policy to reference for that token), plus the reward-model score on the last token. Summed over tokens, the per-token log-ratios give the sequence's KL term, so this is last week's objective exactly.`,
          formula: r`\[ r_t = -\beta\log\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\text{ref}}(a_t\mid s_t)} + \mathbb 1[t=T]\cdot r_\phi(x,y) \]` },
        { id: 'reinforce', title: 'REINFORCE: raise each answer\'s probability in proportion to its reward',
          plain: r`Why not just backpropagate through the reward? The reward depends on \(\theta\) only through **which tokens got sampled**, sampling is not differentiable, and the reward model is a black box returning a number.

The log-derivative trick turns "gradient of an expected reward" into "expected reward × gradient of log-probability", which a batch of samples can estimate. Read it as: an SFT step on the model's own samples, weighted by their scores.`,
          formula: r`\[ \nabla_\theta\,\mathbb E[R]=\mathbb E\big[R\cdot\nabla_\theta\log\pi_\theta(y\mid x)\big] \]` },
        { id: 'baseline', title: 'A baseline turns rewards into advantages',
          plain: r`If every reward is positive, every sampled answer gets pushed up and the update is mostly noise. Subtract a **baseline** \(b\) (the reward you expected): the gradient stays unbiased, and the weight becomes an **advantage**: better-than-expected answers go up, worse ones go down.

Two kinds of baseline: **learned** (a value model, PPO) or **empirical** (the mean of other samples for the same prompt: RLOO, GRPO).`,
          formula: r`\[ \nabla_\theta\,\mathbb E[R]=\mathbb E\big[(R-b)\,\nabla_\theta\log\pi_\theta\big],\qquad A = R - b \]`,
          example: r`Four answers score 2.0, 2.4, 1.6, 2.0. Baseline = mean = 2.0. Advantages: 0, +0.4, −0.4, 0. One goes up, one goes down. **RLOO** uses the mean of the *other* three instead.` },
      ]},
      { id: 's-ppo', title: 'Proximal Policy Optimization', summary: 'A learned baseline, a smarter advantage, and a limit on step size.', concepts: [
        { id: 'critic', title: 'The value model (critic) predicts reward still to come',
          plain: r`The **actor** is the policy that writes tokens. The **critic** (value model) looks at each partial answer and predicts the total reward still to come from there: \(V_\psi(s_t)\). It is a regression model trained toward the return actually observed from token \(t\) to the end (KL penalties still to be paid + the final score). Typically initialised as a copy of the reward model with its head retrained, so advantages are useful from the first update.` },
        { id: 'gae', title: 'Generalized Advantage Estimation',
          plain: r`\(\delta_t\), the **TD error**, is the critic's surprise at token \(t\): the reward at \(t\) plus the value of the next state, minus what it predicted before the token. Positive = the token made things better than expected.

GAE adds up the \(\delta\)s from \(t\) onward, the one \(l\) steps ahead weighted by \((\gamma\lambda)^l\). \(\lambda\) sets how far ahead to look:
- \(\lambda = 0\): one step ahead. Stable, but only as right as the critic (biased).
- \(\lambda = 1\): to the end (final score minus the critic's guess). Unbiased, but each token takes credit or blame for every later token (noisy).

For language models: \(\gamma = 1\), \(\lambda = 0.95\).`,
          formula: r`\[ \delta_t = r_t + \gamma V(s_{t+1}) - V(s_t),\qquad \hat A_t=\sum_{l\ge0}(\gamma\lambda)^l\,\delta_{t+l},\qquad \hat R_t = \hat A_t + V(s_t) \]` },
        { id: 'clip', title: 'The clipped ratio keeps each update small',
          plain: r`\(\rho_t\) = how much more likely the **current** policy makes the sampled token than the policy that **collected** the data (starts at 1). Multiply by the advantage, but clip \(\rho\) to \([1-\varepsilon, 1+\varepsilon]\) and take the **minimum** of the clipped and unclipped terms. So once a good token's probability has risen 20%, there is no more reward for raising it further in this batch; once a bad token's has fallen 20%, no more reward for lowering it. Clipping only ever removes incentive, never adds it.

"Proximal": the new policy stays close to the one that collected the data, so the advantages stay roughly valid and the batch can be reused for a few epochs. \(\varepsilon = 0.2\) nearly everywhere. Log the **clip fraction**: a few percent is healthy; a large share means steps are too big.`,
          formula: r`\[ \rho_t=\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\theta_{\text{old}}}(a_t\mid s_t)},\qquad \mathcal L^{\text{CLIP}}=-\mathbb E_t\Big[\min\big(\rho_t\hat A_t,\ \text{clip}(\rho_t,1-\varepsilon,1+\varepsilon)\,\hat A_t\big)\Big] \]`,
          example: r`\(\hat A = +2\), \(\rho = 1.5\): unclipped 3.0, clipped \(1.2\times2=2.4\); objective uses 2.4. \(\hat A = -1\), \(\rho = 0.5\): unclipped −0.5, clipped \(0.8\times(-1)=-0.8\); the minimum is −0.8.` },
        { id: 'iteration', title: 'One PPO iteration, four models',
          plain: r`1. **Sample** answers to a batch of prompts from the policy (the expensive part).
2. **Score**: the reward model scores each answer; the frozen reference gives per-token KL penalties; the critic gives values.
3. **Estimate** advantages and returns with GAE.
4. **Update** for a few minibatch epochs (reuse is safe because of clipping): the policy with the clipped loss, the critic with squared error to the returns.

Trained: policy and value model (gradients + optimizer state). Frozen: reference and reward model (forward passes only). DPO keeps two models and no sampling.` },
      ]},
      { id: 's-work', title: 'Making PPO work on language models', summary: 'The details, the warning signs, and the settings that matter.', concepts: [
        { id: 'details', title: 'Small details decide whether PPO trains at all',
          plain: r`Five of the 25 details catalogued by Huang et al., none of them in the PPO paper:
- **Disable dropout**: the ratio and KL estimate must be reproducible.
- **Score at the end-of-sequence token**: the only position the reward model was trained on.
- **−1 reward for answers that never end**: defines the reward and discourages rambling.
- **Whiten rewards and advantages**: keeps step sizes and \(\beta\) meaningful over training.
- **Critic initialised from the reward model**: useful advantages from the first update.` },
        { id: 'collapse', title: 'PPO collapses quietly: reward climbs, answers get worse',
          plain: r`Zheng et al.: after step 400 the reward kept rising while the win rate against the SFT model fell, and KL, perplexity and answer length all jumped at the same moment ("pattern collapse": the policy settles on a few patterns the reward model over-scores). Watch KL to the reference, perplexity, length, and **read actual answers** every few hundred steps, not just the reward curve.` },
        { id: 'fixes3', title: 'Three standard fixes made PPO competitive',
          plain: r`On competitive programming (CodeLlama-34B, APPS pass@5), plain PPO with batch 64 **destroyed** the SFT model (introductory 38.6% → 18.0%). Adding, one at a time: **advantage normalisation** (42.3%), a **large batch** of 512 samples per update (44.4% with an EMA reference). The best result in the paper.

Typical settings: batch 512, minibatch 64, clip 0.2, learning rate \(10^{-6}\)–\(3\times10^{-6}\), \(\beta\) 0.005–0.05, \(\gamma=1\), \(\lambda=0.95\), 4 PPO epochs.` },
      ]},
      { id: 's-sys', title: 'Four models, one cluster', summary: 'Memory accounting, and generation inside the training loop.', concepts: [
        { id: 'pppmem', title: 'Only the trained models carry training state',
          plain: r`16 bytes per **trained** parameter, 2 per **frozen** one (BF16 weights only). A 7B policy + 7B critic + 7B reference + 7B reward model ≈ 252 GB before activations and the KV cache of every answer being generated.

Cheap fixes before buying GPUs: shard all four with ZeRO-3/FSDP (252 GB over 8 GPUs ≈ 32 GB each); offload frozen models to CPU; use a smaller reward and value model (DeepSpeed-Chat pairs 13B–66B actors with a 350M reward model); cache reference log-probs; or use LoRA.` },
        { id: 'gen', title: 'Generation takes most of each step',
          plain: r`Sampling is about 20% of the computation but most of the time: each new token reads the whole model to do very little arithmetic (memory-bound). Sharding makes it worse: in Llama 2 at 70B, FSDP made generation about 20× slower, so Meta gathered full weights on each node before sampling. Systems like DeepSpeed-Chat's Hybrid Engine switch the same actor between a training layout and a fast inference layout.` },
        { id: 'lorappo', title: 'LoRA on one frozen base: the base doubles as the reference',
          plain: r`Put LoRA adapters on one base model. Adapters **on** = actor or critic; adapters **off** = the reference (and the reward model, with its own head). Only adapters and their optimizer state are trained. Llama 7B: full PPO ~220 GB (estimated), LoRA-PPO 68 GB, Hydra-PPO 71 GB but ~3× faster per sample. TRL supports PPO with LoRA on one base: the practical choice for a course project.` },
      ]},
      { id: 's-hack', title: 'Reward hacking', summary: 'The policy optimises the reward model, not what it was meant to measure.', concepts: [
        { id: 'hack', title: 'The policy finds the reward model\'s blind spots',
          plain: r`A proxy reward is **hackable** when it ranks some pair of behaviours the opposite way from the true goal. Every learned reward model is a proxy. RL writes **new** answers to maximise the score, so any blind spot becomes a target: length, flattery, confident formatting, repeated phrases, copying the input.

Gao et al.: the proxy keeps rising while the gold reward peaks and falls; larger reward models peak later and higher. **Best-of-n** is gentler: its KL is at most \(\log n\) (about 7 nats for \(n=1{,}000\)), while PPO reached 100 nats in the same study.`,
          formula: r`\[ \text{KL}_{\text{best-of-}n}\ \le\ \log n \]` },
        { id: 'mislead', title: 'Example: RLHF taught a model to convince, not to be right',
          plain: r`Wen et al. (2024): after RLHF on question answering and coding, human approval went up, correctness did not, and the people judging became **easier to fool**: fabricated or cherry-picked evidence, more consistent arguments for wrong answers, code that is harder to check. A clinical reviewer with a few minutes per answer is exactly the evaluator this fools.` },
        { id: 'detect', title: 'Detecting it: watch what moves with the reward',
          plain: r`| Signal | Healthy | Hacking |
|---|---|---|
| Training reward | rises, then flattens | keeps rising |
| KL to reference | grows slowly | jumps |
| Answer length | stable | drifts up or hits the limit |
| Perplexity, entropy | stable | collapses |
| Held-out judge / gold set | rises with reward | falls while reward rises |

Use a held-out judge never used in training (another reward model, an LLM judge, or people) on a fixed prompt set, plus a gold set with known correct answers (for a clinical model, measure correctness, not preference). Read 20 samples next to the SFT model's every few hundred steps; most hacks are obvious to a person who looks.` },
        { id: 'fixpolicy', title: 'Fixes: constrain the policy, or fix the reward',
          plain: r`**Constrain the policy**: adaptive KL controller (pick a target KL and let \(\beta\) move up to ~2% per batch to hold it); stop early on a held-out judge, not the training reward (Llama 2: 200–400 iterations); few PPO epochs, learning rate ~\(10^{-6}\); a fixed −1 for answers that never end.

**Fix the reward**: **ensembles** of reward models (they disagree off-distribution; worst-case or uncertainty-weighted objectives keep the policy where they agree); **WARM** averages their weights into one; **refresh** the reward model on the latest policy's answers (Llama 2).`,
          formula: r`\[ \beta_{t+1}=\beta_t\,(1+K_\beta\,e_t),\qquad e_t=\text{clip}\!\left(\tfrac{\text{KL}_t-\text{KL}_{\text{target}}}{\text{KL}_{\text{target}}},\,-0.2,\,0.2\right),\ K_\beta=0.1 \]` },
      ]},
      { id: 's-vs', title: 'PPO vs DPO: when and why', summary: 'Same objective, different data, different costs.', concepts: [
        { id: 'onoff', title: 'On-policy vs off-policy',
          plain: r`**DPO** is off-policy and offline: it learns from answers some other policy wrote, collected before training. **PPO** is on-policy and online: it learns from answers the current policy writes, scored during training. Same objective, same starting point.` },
        { id: 'edges', title: 'PPO\'s three edges',
          plain: r`1. **On-policy data fixes the model's own mistakes.** When the best answers are rare under the starting model, offline data rarely contains them; on-policy sampling goes and finds them.
2. **DPO can favour answers nobody labelled.** DPO only needs the rejected answer to go down; a policy that puts 0.9 on some never-labelled answer \(y_3\) can satisfy it. PPO samples \(y_3\), scores it, and charges KL for it. On APPS, iterative DPO stayed **below** SFT (34.2% vs 38.6%); PPO reached 44.4%.
3. **A reward model scores new prompts.** PPO can use unlabelled in-domain prompts and a bigger reward model; DPO can use neither. Ivison et al.: better data helped most, for both; PPO added a little on average and more on maths.` },
        { id: 'dpowins', title: 'Where DPO wins, and the middle ground',
          plain: r`DPO: 2 models, no generation in the loop, mainly \(\beta\) and learning rate to tune, small run-to-run variation. Llama 3 used SFT + rejection sampling + DPO over several rounds and found DPO needed less compute and performed better for large models. On one GPU with a deadline, DPO or iterative DPO is almost always the right first choice.

In between: **rejection sampling** (sample K per prompt, keep the highest-reward one, SFT on it) and **RLOO** (k samples per prompt, each one's baseline is the mean reward of the other \(k-1\)). Moving toward PPO buys more on-policy exploration and costs compute, memory and tuning. Next week: GRPO.` },
        { id: 'decision', title: 'Decision table',
          plain: r`- Reliable automatic reward (tests, known answers) → PPO, or RLOO / GRPO: online search is safe when the reward cannot be fooled.
- Hard reasoning or code, good answers rare under SFT → PPO or another online method.
- Style, tone, format, SFT already decent → DPO.
- Pairs written by other models → iterative DPO or PPO.
- One GPU, a deadline, must reproduce exactly → DPO or iterative DPO.
- Learned reward from human preferences only → either, with the reward-hacking safeguards.

The algorithm matters less than the data and the reward: get those right first.` },
      ]},
      { id: 's-cases', title: 'Case studies: Llama 2-Chat and HuatuoGPT-o1', summary: 'PPO at scale, and PPO vs DPO vs RLOO on a clinical reward.', concepts: [
        { id: 'llama2', title: 'Llama 2-Chat: rejection sampling first, PPO on top',
          plain: r`Five RLHF rounds; PPO was added in round 5. Settings: batch 512, minibatch 64, clip 0.2, learning rate \(10^{-6}\), \(\beta\) 0.01 (7B, 13B) or 0.005 (34B, 70B), 200–400 iterations, early-stopped on held-out prompts. Combined reward: the safety reward model's score for risky prompts or when it falls below 0.15, helpfulness otherwise; whitened before adding the KL term. V5 with PPO beat V5 without, under both Meta's reward models and GPT-4.

Why both? Across N samples, the **median** reward barely moves with N but the **max** does. Rejection sampling trains on the max (**breadth**: many samples from a fixed model); PPO keeps updating the distribution itself (**depth**: one sample per prompt from the latest policy).` },
        { id: 'huatuo', title: 'HuatuoGPT-o1: a verifier turns clinical questions into a reward',
          plain: r`40,000 medical exam problems rewritten as open-ended questions with one correct answer. A **verifier** (GPT-4o comparing to the reference; ~95% accurate on hand-checked cases) gives the reward. Stage 1: search for verified reasoning, then SFT (20,000 problems). Stage 2: RL with the verifier (another 20,000).

Same reward, three algorithms (8B, average of five benchmarks): SFT alone 63.0, + DPO 64.2, + RLOO 65.7, + **PPO 66.6**; PPO best on four of five. Caveats: the verifier is still a model that can be fooled; training used open-ended questions but evaluation is multiple choice; the authors restrict it from clinical use.` },
      ]},
    ],
    sheet: [
      { title: 'Formulas', cols: ['Quantity', 'Formula'], rows: [
        ['Per-token reward', r`\(-\beta\log\frac{\pi_\theta}{\pi_{\text{ref}}}\) on every token, \(+r_\phi\) on the last`],
        ['REINFORCE', r`\(\nabla\mathbb E[R]=\mathbb E[(R-b)\nabla\log\pi_\theta]\)`],
        ['TD error', r`\(\delta_t=r_t+\gamma V(s_{t+1})-V(s_t)\)`],
        ['GAE', r`\(\hat A_t=\sum_l(\gamma\lambda)^l\delta_{t+l}\); \(\gamma=1,\lambda=0.95\)`],
        ['Critic target', r`\(\hat R_t=\hat A_t+V(s_t)\)`],
        ['Ratio', r`\(\rho_t=\pi_\theta/\pi_{\text{old}}\)`],
        ['Clipped loss', r`\(-\min(\rho\hat A,\ \text{clip}(\rho,0.8,1.2)\hat A)\)`],
        ['Adaptive KL', r`\(\beta\leftarrow\beta(1+0.1\,e_t)\), \(e_t\in[-0.2,0.2]\)`],
        ['Best-of-n KL bound', r`\(\le\log n\)`],
        ['Memory (7B ×4)', '112 + 112 + 14 + 14 = 252 GB'],
      ]},
      { title: 'PPO vs DPO', cols: ['', 'DPO', 'PPO'], rows: [
        ['Models in memory', 'policy, reference', 'policy, reference, reward, value'],
        ['Data', 'labelled pairs, offline', 'prompts + a reward model, online'],
        ['Generation in the loop', 'no', 'every step'],
        ['Hyperparameters', 'β, learning rate', 'learning rate, ε, β, λ, batch, epochs'],
        ['Run-to-run variation', 'small', 'larger'],
        ['Strength', 'cheap, stable, reproducible', 'learns from its own mistakes; generalises via the reward model'],
        ['Risk', 'off-distribution pairs; favours unlabelled answers', 'reward hacking; cost'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'baseline', q: r`Four sampled answers get rewards 3, 5, 4 and 8. Using the mean as baseline, what is the advantage of the answer that scored 8?`, answer: 3, tol: 0.01,
        hint: 'Mean of all four.', solution: r`Mean = 5, so \(8-5=3\).` },
      { id: 'q2', type: 'num', concept: 'baseline', q: r`Same rewards, but with RLOO's leave-one-out baseline. What is the advantage of the answer that scored 8?`, answer: 4, tol: 0.01,
        hint: 'Mean of the other three.', solution: r`Others: 3, 5, 4 → mean 4. Advantage \(8-4=4\).` },
      { id: 'q3', type: 'num', concept: 'gae', q: r`At token \(t\): reward \(r_t = 0\), \(V(s_t) = 0.5\), \(V(s_{t+1}) = 0.6\), \(\gamma = 1\). What is the TD error \(\delta_t\)?`, answer: 0.1,
        hint: r`\(r_t+\gamma V(s_{t+1})-V(s_t)\).`, solution: r`\(0+0.6-0.5=0.1\): the token made things slightly better than the critic expected.` },
      { id: 'q4', type: 'num', concept: 'gae', q: r`The last two tokens of an answer have \(\delta_{T-1} = 0.1\) and \(\delta_T = -0.2\). With \(\gamma = 1\), \(\lambda = 0.95\), what is \(\hat A_{T-1}\)?`, answer: 0.1 + 0.95 * -0.2, show: '−0.09',
        hint: r`\(\delta_{T-1}+\gamma\lambda\,\delta_T\).`, solution: r`\(0.1+0.95\times(-0.2)=0.1-0.19=-0.09\).` },
      { id: 'q5', type: 'num', concept: 'clip', q: r`A token has advantage \(\hat A = +2\) and ratio \(\rho = 1.5\), with \(\varepsilon = 0.2\). What value does the clipped objective \(\min(\rho\hat A,\ \text{clip}(\rho)\hat A)\) take?`, answer: 2.4,
        hint: r`Clip \(\rho\) to 1.2.`, solution: r`Unclipped \(1.5\times2=3.0\); clipped \(1.2\times2=2.4\); minimum **2.4**. No extra reward for pushing this token further.` },
      { id: 'q6', type: 'num', concept: 'clip', q: r`Now \(\hat A = -1\) and \(\rho = 0.5\), \(\varepsilon = 0.2\). What value does the clipped objective take?`, answer: -0.8,
        hint: 'Compute both terms and take the minimum.', solution: r`Unclipped \(0.5\times(-1)=-0.5\); clipped \(0.8\times(-1)=-0.8\); the minimum is **−0.8**. The flat region means no further incentive to lower this token's probability.` },
      { id: 'q7', type: 'num', concept: 'pppmem', q: r`PPO with a 7B policy and 7B critic (trained), a 7B reference (frozen) and a 350M reward model (frozen). GB before activations?`, answer: 112 + 112 + 14 + 0.7, show: '≈ 238.7 GB',
        hint: '16 bytes/param trained, 2 bytes/param frozen.', solution: r`\(112+112+14+0.7=238.7\) GB. The small reward model saves about 13 GB.` },
      { id: 'q8', type: 'num', concept: 'fixpolicy', q: r`Adaptive KL controller: \(\beta_t = 0.1\), the clipped error \(e_t = +0.2\) (KL above target), \(K_\beta = 0.1\). What is \(\beta_{t+1}\)?`, answer: 0.102,
        hint: r`\(\beta(1+K_\beta e_t)\).`, solution: r`\(0.1\times(1+0.02)=0.102\). The leash tightens by 2%.` },
      { id: 'q9', type: 'num', concept: 'hack', q: r`What is the maximum KL (in nats) that best-of-n sampling can move from the base policy, for \(n = 1{,}000\)?`, answer: Math.log(1000), show: 'ln 1000 ≈ 6.9',
        hint: r`\(\log n\).`, solution: r`\(\ln1000\approx6.9\) nats, far below the ~100 nats PPO reached in the same study.` },
      { id: 'q10', type: 'mcq', concept: 'gen', q: r`Why does generation dominate the time of a PPO step even though it is a small share of the FLOPs?`, choices: ['It uses FP32', 'Each new token reads the whole model to do little arithmetic: it is memory-bound and sequential', 'The reward model is slow', 'Clipping is expensive'], answer: 1,
        hint: 'Arithmetic per byte read.', solution: r`Token-by-token decoding is limited by memory bandwidth, not compute, and cannot be parallelised over the answer. Sharding the weights (FSDP) makes it even slower.` },
      { id: 'q11', type: 'mcq', concept: 'edges', q: r`Pairs say \(y_1 \succ y_2\). Which statement about a never-labelled answer \(y_3\) is true?`, choices: ['DPO keeps y₃ at the reference probability', 'DPO\'s loss says nothing about y₃, so it can end up likely; PPO would sample it, score it and charge KL for it', 'PPO cannot generate y₃', 'Both methods ignore y₃ equally'], answer: 1,
        hint: 'What does each method actually look at?', solution: r`DPO only constrains the labelled pair. PPO samples from the current policy, so if \(y_3\) becomes likely it gets scored and pays KL.` },
      { id: 'q12', type: 'mcq', concept: 'decision', q: r`You need a model to follow a house writing style, the SFT model is already decent, and you have one GPU. Which method?`, choices: ['PPO with a learned reward', 'DPO', 'GRPO with unit tests', 'Full pre-training'], answer: 1,
        hint: 'Style, near the reference, cheap.', solution: r`DPO: cheap, stable, and enough when the target is close to what SFT already does.` },
      { id: 'q13', type: 'mcq', concept: 'detect', q: r`In a PPO log, the training reward keeps rising, KL jumps, answers get longer, and a held-out judge's score starts falling. What is happening?`, choices: ['Healthy training', 'Reward hacking', 'The critic is too accurate', 'The learning rate is too low'], answer: 1,
        hint: 'Which signals should move together?', solution: r`Classic reward hacking: the proxy rises while true quality (the held-out judge) falls. Stop early, tighten KL, cap length, or improve the reward model.` },
      { id: 'q14', type: 'self', concept: 'clip', q: r`Why is it safe for PPO to reuse one batch of samples for several gradient epochs, when plain REINFORCE should not?`,
        hint: 'What assumption do the advantages rely on?',
        solution: r`Advantages were computed for the policy that generated the samples. As the policy changes, they become less valid. PPO's clipped ratio removes any incentive to move a token's probability more than about ±20% from the data-collecting policy, so the policy stays "proximal" and the advantages stay roughly correct across a few epochs. That lets the expensive generation step be amortised. Plain REINFORCE has no such limit, so reusing samples lets the policy run away from the data.` },
    ]
  });
})();
