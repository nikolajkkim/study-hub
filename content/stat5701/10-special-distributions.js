(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l10', num: 10, minutes: 75,
    title: 'Special Distributions: MGFs and the discrete family',
    oneLiner: r`A tool for extracting means and variances (the MGF), then the named models for **counting** things.`,
    leadsTo: 'Next: the same idea, but for measurements instead of counts.',
    bigPicture: {
      what: r`Two things happen in this lecture.

First you get a tool, the **moment generating function (MGF)**. It is one formula that has the mean, the variance and every other "moment" packed inside it. You unpack them by taking derivatives.

Then you meet the **discrete distributions**: named, ready-made models for situations where you are counting. Each one answers a slightly different counting question, and almost all of them are built from the same atom: a single yes/no trial with success chance \(p\).`,
      why: r`Most probability word problems are solved in two moves: (1) recognise which named distribution the story describes, (2) plug into its formula. This lecture gives you the catalogue for move 1. The MGF keeps coming back: it is how Lecture 14 proves the Central Limit Theorem.`,
      remember: r`1. Every discrete model here is a different question about repeated yes/no trials: **how many successes** (Binomial), **how long until the first** (Geometric), **how long until the k-th** (Negative Binomial), **how many in a time window** (Poisson), **how many when drawing without replacement** (Hypergeometric).
2. MGF: differentiate, set \(t = 0\), get moments. \(m'(0) = E(X)\), \(m''(0) = E(X^2)\).
3. \(\text{Var}(X) = E(X^2) - [E(X)]^2\). Always.`
    },
    sections: [
      { id: 's-mgf', title: 'Moment generating functions', summary: 'One formula that stores the mean, variance and more.', concepts: [
        { id: 'mgf-def', title: 'What an MGF is',
          plain: r`Take your random variable \(X\), compute \(e^{tX}\), and average it. The result is a function of \(t\). On its own that function does not "mean" anything intuitive. Think of it as a **zip file**: it compresses everything about the distribution into one formula, and you unzip it with derivatives.`,
          formula: r`\[ m_X(t) = E\!\left(e^{tX}\right) = \begin{cases} \sum_x e^{tx}\,p(x) & \text{discrete} \\[4pt] \int e^{tx} f(x)\,dx & \text{continuous} \end{cases} \]`,
          example: r`\(X\) is 1 with probability \(\tfrac13\) and 2 with probability \(\tfrac23\). Then \( m(t) = \tfrac13 e^{t} + \tfrac23 e^{2t} \). Each term is (probability) × \(e^{t\cdot\text{value}}\).`,
          formal: r`Let X be a random variable. The mgf of X, \(m_X(t)\), if it exists, is \(m_X(t) = E(e^{tX})\). The MGF exists if there is a positive constant \(a\) such that \(m_X(t)\) is finite for all \(t \in [-a, a]\).` },
        { id: 'mgf-read', title: 'Reading a distribution off its MGF',
          plain: r`For a discrete variable the MGF is a sum of terms that look like (number) × \(e^{t \cdot \text{value}}\). So if someone hands you an MGF, expand it and read: the number in the exponent is a value \(X\) can take, and the coefficient in front is its probability.`,
          example: r`\( m(t) = \dfrac{(1+2e^t)(1+3e^t)}{12} = \tfrac{1}{12}e^{0t} + \tfrac{5}{12}e^{1t} + \tfrac{6}{12}e^{2t} \).

So \(P(X=0)=\tfrac1{12}\), \(P(X=1)=\tfrac5{12}\), \(P(X=2)=\tfrac12\).`,
          formal: r`If X is discrete with finite range \(x_1,\dots,x_k\), then \(m(t) = \sum_{i=1}^k p(x_i)e^{tx_i}\). Compare the expansion to \(\sum P(X=x)e^{tx}\).` },
        { id: 'mgf-moments', title: 'Getting moments out: differentiate, then set t = 0',
          plain: r`This is the whole point of the MGF. Differentiate once and plug in \(t=0\): you get the mean. Differentiate twice and plug in 0: you get \(E(X^2)\). Then variance = \(E(X^2) - \text{mean}^2\).

Quick sanity check for any MGF: \(m(0)\) must equal 1.`,
          formula: r`\[ m_X(0)=1, \qquad m_X^{(k)}(0) = E(X^k) = \mu_k \]`,
          watch: r`"Moment" just means \(E(X^k)\). \(\mu_1\) is the mean. \(\mu_2\) is **not** the variance, it is \(E(X^2)\). You still have to subtract \(\mu_1^2\).`,
          formal: r`For all \(n \ge 0\): \(\mu_n = E(X^n) = m_X^{(n)}(0)\). Also \(m_X(t) = 1 + \mu_1 t + \frac{\mu_2}{2!}t^2 + \frac{\mu_3}{3!}t^3 + \dots\)` },
        { id: 'mgf-sum', title: 'Adding independent variables = multiplying MGFs',
          plain: r`If you add independent random variables, the MGF of the total is the product of the individual MGFs. This is why MGFs are great for sums, and sums are everywhere (totals, averages).`,
          formula: r`\[ Y = X_1+\dots+X_n \ \text{(independent)} \;\Rightarrow\; m_Y(t) = m_{X_1}(t)\cdots m_{X_n}(t) \]`,
          example: r`One Bernoulli trial has MGF \(q + pe^t\). A Binomial is the sum of \(n\) independent Bernoullis, so its MGF is \((q+pe^t)^n\). No summation needed.` },
        { id: 'mgf-exist', title: 'MGFs do not always exist (and are not always convenient)',
          plain: r`For some distributions the average of \(e^{tX}\) is infinite, so there is no MGF. The t distribution is the classic case. And sometimes the MGF exists but is awkward: for Uniform(0,1) you need L'Hôpital's rule just to get the mean out. The MGF is a tool, not a requirement. Use it when it is easier.`,
          formal: r`Does the mgf always exist? No. The t distribution has no mgf. The lognormal has finite moments of every order but its mgf exists only for \(t \le 0\). For \(U(0,1)\): \(m(t) = \frac{e^t-1}{t}\) for \(t \ne 0\), and \(m(0)=1\) must be handled separately.` },
        { id: 'cgf', title: 'The cumulant generating function (CGF): a shortcut to mean and variance',
          plain: r`Take the natural log of the MGF. Now the first derivative at 0 is the mean, and the second derivative at 0 is **directly the variance**. No "subtract the mean squared" step. The third derivative at 0 gives the third central moment (a measure of lopsidedness).`,
          formula: r`\[ K_X(t) = \ln m_X(t), \qquad K'(0)=E(X), \quad K''(0)=\text{Var}(X), \quad K'''(0)=E\big[(X-\mu)^3\big] \]`,
          example: r`Binomial: \(K(t) = n\ln(q+pe^t)\). Then \(K'(0) = np\) and \(K''(0) = npq\).`,
          watch: r`This pattern stops at three. Fourth and higher derivatives of \(K\) are not the central moments.` },
      ]},
      { id: 's-binom', title: 'Bernoulli and Binomial', summary: 'One yes/no trial, then n of them: how many successes?', concepts: [
        { id: 'bern', title: 'Bernoulli: a single yes/no trial',
          plain: r`One experiment with two outcomes. Call them success (probability \(p\)) and failure (probability \(q = 1-p\)). Code success as 1 and failure as 0. That is a Bernoulli variable. It is the building block for everything else in this lecture.`,
          formula: r`\[ P(X=1)=p,\quad P(X=0)=q \qquad E(X)=p,\quad \text{Var}(X)=pq \]` },
        { id: 'binom', title: 'Binomial: number of successes in n trials',
          plain: r`Repeat the same yes/no trial \(n\) times, independently. Count the successes. That count is Binomial.

Where the formula comes from: any particular sequence with \(k\) successes and \(n-k\) failures has probability \(p^k q^{n-k}\). There are \(\binom{n}{k}\) such sequences (ways to choose which trials are the successes). Multiply.`,
          formula: r`\[ P(X=k) = \binom{n}{k} p^k q^{\,n-k},\quad k=0,1,\dots,n \qquad E(X)=np,\quad \text{Var}(X)=npq,\quad m(t)=(q+pe^t)^n \]`,
          widget: 'dist:binom',
          example: r`A surgery succeeds 85% of the time and is done 20 times: \(X\sim\text{Binom}(20, 0.85)\).

\(P(X \ge 16) = p(16)+p(17)+p(18)+p(19)+p(20) = 0.8298\).

In Python: <code>scipy.stats.binom.pmf(x, n, p)</code>.`,
          watch: r`Checklist before you use it: fixed number of trials, each trial yes/no, same \(p\) every time, trials independent. "At least" and "at most" questions mean adding several terms (or using 1 minus the complement).`,
          formal: r`We observe a Bernoulli trial (S, F) n times. Let X denote the number of successes in the n trials. Then X has a binomial distribution, \(X \sim \text{Binom}(n,p)\). These are the terms in the expansion of \((p+q)^n\).` },
      ]},
      { id: 's-wait', title: 'Waiting for successes: Geometric and Negative Binomial', summary: 'Not "how many successes" but "how many tries does it take?"', concepts: [
        { id: 'geom', title: 'Geometric: which trial gives the first success',
          plain: r`Keep repeating the trial until the first success. \(X\) is the trial number where it happens. To have the first success on trial \(x\) you need \(x-1\) failures in a row and then one success.

The handiest fact: the chance you are **still waiting** after \(k\) trials is just \(q^k\) (k failures in a row).`,
          formula: r`\[ P(X=x) = q^{\,x-1}p,\ \ x=1,2,3,\dots \qquad P(X>k)=q^k,\quad P(X\le k)=1-q^k \qquad E(X)=\frac1p,\quad \text{Var}(X)=\frac{q}{p^2} \]`,
          widget: 'dist:geom',
          example: r`Roll a die until a six (\(p=\tfrac16\)).

At most 5 rolls: \(1-(5/6)^5 = 0.598\).

At least 10 rolls means the first 9 all failed: \((5/6)^9 = 0.194\).`,
          formal: r`\(X \sim \text{Geo}(p)\). The cdf is \(F_X(t) = 1-(1-p)^{[t]}\), where \([t]\) is the greatest integer in t. The probabilities \(p, pq, pq^2,\dots\) form a geometric series, which sums to \(\frac{p}{1-q}=1\).` },
        { id: 'series', title: 'The one series you need: geometric series',
          plain: r`Many answers in this section are sums that go on forever, where each term is the previous one times a fixed ratio \(r\). As long as \(|r|<1\) the total is (first term) ÷ (1 − ratio).`,
          formula: r`\[ a + ar + ar^2 + \dots = \frac{a}{1-r} \qquad\qquad a + ar + \dots + ar^{n-1} = a\,\frac{1-r^n}{1-r} \]`,
          example: r`Probability the first six lands on an **even** roll: \(p(2)+p(4)+p(6)+\dots\). First term \(a=\tfrac16\cdot\tfrac56\), ratio \(r=(\tfrac56)^2\). Total \(= \dfrac{5/36}{1-25/36} = \dfrac{5}{11}\).` },
        { id: 'nbin', title: 'Negative Binomial: which trial gives the k-th success',
          plain: r`Same waiting game, but you stop at the \(k\)-th success instead of the first. For that to happen on trial \(x\): the last trial must be a success, and the first \(x-1\) trials must contain exactly \(k-1\) successes in any order.

Geometric is just the special case \(k=1\).`,
          formula: r`\[ P(X=x)=\binom{x-1}{k-1}p^k q^{\,x-k},\quad x=k,k+1,\dots \qquad E(X)=\frac{k}{p},\quad \text{Var}(X)=\frac{kq}{p^2} \]`,
          widget: 'dist:nbin',
          example: r`A lottery pays out 3% of the time. You play until you have won 5 times. \(P(X=x)=\binom{x-1}{4}(0.03)^5(0.97)^{x-5}\) for \(x = 5, 6, \dots\). On average that takes \(5/0.03 \approx 167\) plays.`,
          watch: r`The slide for this example shows \(0.91\) as the failure probability. With \(p = 0.03\) it should be \(q = 0.97\).` },
      ]},
      { id: 's-pois', title: 'Poisson', summary: 'Counting events that happen at random over time.', concepts: [
        { id: 'pois', title: 'Poisson: number of events in a fixed window',
          plain: r`Events happen at random moments (hurricanes in a year, emails in an hour, typos on a page). \(X\) counts how many land in a fixed window. There is one dial, \(\lambda\): the average number per window. A neat property: the mean and the variance are both \(\lambda\).`,
          formula: r`\[ P(X=x)=\frac{\lambda^x e^{-\lambda}}{x!},\quad x=0,1,2,\dots \qquad E(X)=\lambda,\quad \text{Var}(X)=\lambda,\quad m(t)=e^{\lambda(e^t-1)} \]`,
          widget: 'dist:pois',
          example: r`Hurricanes per year are Poisson with \(\lambda=13.1\). \(P(X\le 8)=0.095\), and \(P(X\ge 10)=1-P(X\le 9)=0.840\).

Conditional version: \(P(X\le 15 \mid X\ge 10) = \dfrac{P(10\le X\le 15)}{P(X\ge10)} = 0.708\).`,
          formal: r`Suppose events are occurring sequentially in time. Let X be the number of events occurring in a fixed period. Then X has a Poisson distribution with intensity parameter \(\lambda\).` },
        { id: 'pois-approx', title: 'Poisson as a shortcut for Binomial',
          plain: r`When you have **many** trials and each has a **tiny** chance of success, the Binomial is painful to compute but is almost identical to a Poisson with \(\lambda = np\).`,
          formula: r`\[ n \text{ large},\ p \text{ small}: \quad \text{Binom}(n,p) \approx \text{Poisson}(\lambda = np) \]`,
          example: r`500 people at a meeting. Chance at most one was born on September 1st? \(n=500\), \(p=\tfrac1{365}\), so \(\lambda = 500/365 = 1.37\).

\(P(X\le1)\approx e^{-1.37}+1.37e^{-1.37}=0.6023\). The exact Binomial answer is \(0.6021\).` },
      ]},
      { id: 's-other', title: 'Sampling without replacement, and more than two outcomes', summary: 'Hypergeometric and Multinomial.', concepts: [
        { id: 'hyper', title: 'Hypergeometric: drawing without putting back',
          plain: r`A population of \(N\) items: \(a\) of type A and \(b\) of type B. You grab \(n\) of them **without replacement**. \(X\) = how many type A you got. The formula is pure counting: (ways to pick the A's) × (ways to pick the B's) ÷ (ways to pick any \(n\)).`,
          formula: r`\[ P(X=x)=\frac{\binom{a}{x}\binom{b}{n-x}}{\binom{N}{n}} \]`,
          example: r`10 cars, 3 defective. Test 4. \(P(\text{exactly 1 defective})=\dfrac{\binom31\binom73}{\binom{10}{4}}=\dfrac{3\cdot35}{210}=0.5\).`,
          watch: r`**With** replacement the draws are independent and you get a Binomial with \(p=a/N\). **Without** replacement you get the Hypergeometric. When the population is huge compared to the sample, the two give nearly the same numbers.` },
        { id: 'multi', title: 'Multinomial: Binomial with more than two outcomes',
          plain: r`Each trial can end in one of \(k\) outcomes (not just yes/no), with probabilities \(p_1,\dots,p_k\). Run \(n\) trials and count how many times each outcome occurred. Same logic as Binomial: probability of one particular sequence, times the number of orderings.`,
          formula: r`\[ P(x_1,\dots,x_k)=\frac{n!}{x_1!\,x_2!\cdots x_k!}\;p_1^{x_1}p_2^{x_2}\cdots p_k^{x_k},\qquad x_1+\dots+x_k=n \]`,
          example: r`Back-pain treatment: cure 30%, reduced pain 50%, no change 20%. With 4 patients, the chance of 1 cure, 2 reduced, 1 no change is \(\dfrac{4!}{1!\,2!\,1!}(0.3)(0.5)^2(0.2)=0.18\).` },
        { id: 'which', title: 'Which distribution is it? A decision guide',
          plain: r`Ask what is being counted.

- Fixed number of trials, count the successes → **Binomial**
- Count trials until the first success → **Geometric**
- Count trials until the k-th success → **Negative Binomial**
- Count events in a stretch of time or space, given an average rate → **Poisson**
- Draw from a small group without replacement, count one type → **Hypergeometric**
- Fixed number of trials, more than two outcomes → **Multinomial**` },
      ]},
    ],
    sheet: [
      { title: 'Discrete distributions', note: r`\(q = 1-p\) throughout.`, cols: ['Name', 'What it counts', 'pmf', 'Mean', 'Variance', 'MGF'], rows: [
        ['Bernoulli(p)', 'one yes/no trial', r`\(p^x q^{1-x},\ x\in\{0,1\}\)`, r`\(p\)`, r`\(pq\)`, r`\(q+pe^t\)`],
        ['Binomial(n,p)', 'successes in n trials', r`\(\binom nx p^x q^{n-x}\)`, r`\(np\)`, r`\(npq\)`, r`\((q+pe^t)^n\)`],
        ['Geometric(p)', 'trial of 1st success', r`\(q^{x-1}p,\ x\ge1\)`, r`\(1/p\)`, r`\(q/p^2\)`, r`\(\dfrac{pe^t}{1-qe^t}\)`],
        ['Neg. Binomial(k,p)', 'trial of k-th success', r`\(\binom{x-1}{k-1}p^kq^{x-k},\ x\ge k\)`, r`\(k/p\)`, r`\(kq/p^2\)`, r`\(\left(\dfrac{pe^t}{1-qe^t}\right)^k\)`],
        ['Poisson(λ)', 'events in a window', r`\(\dfrac{\lambda^xe^{-\lambda}}{x!},\ x\ge0\)`, r`\(\lambda\)`, r`\(\lambda\)`, r`\(e^{\lambda(e^t-1)}\)`],
        ['Hypergeometric', 'type-A items in n draws, no replacement', r`\(\dfrac{\binom ax\binom b{n-x}}{\binom Nn}\)`, r`\(n\frac aN\)`, r`\(n\frac aN\left(1-\frac aN\right)\frac{N-n}{N-1}\)`, '—'],
      ]},
      { title: 'MGF and CGF rules', cols: ['Rule', 'Formula'], rows: [
        ['Definition', r`\(m_X(t)=E(e^{tX})\)`],
        ['Sanity check', r`\(m_X(0)=1\)`],
        ['Moments', r`\(m^{(k)}(0)=E(X^k)\)`],
        ['Variance', r`\(m''(0)-[m'(0)]^2\)`],
        ['Sum of independents', r`\(m_{X+Y}(t)=m_X(t)\,m_Y(t)\)`],
        ['CGF', r`\(K(t)=\ln m(t)\): \(K'(0)=\mu,\ K''(0)=\sigma^2,\ K'''(0)=E[(X-\mu)^3]\)`],
        ['Geometric series', r`\(a+ar+ar^2+\dots=\dfrac a{1-r}\) for \(|r|<1\)`],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'mcq', concept: 'which', q: r`A call centre gets on average 6 calls per minute. You want the probability of exactly 4 calls in the next minute. Which model?`, choices: ['Binomial', 'Geometric', 'Poisson', 'Hypergeometric'], answer: 2,
        hint: 'Is there a fixed number of trials, or an average rate over a window of time?', solution: r`Events at random over time with a known average rate → **Poisson** with \(\lambda=6\). There is no fixed number of trials, so it is not Binomial.` },
      { id: 'q2', type: 'num', concept: 'binom', q: r`A student guesses on a 10-question true/false exam. What is the probability of getting **exactly 6** right?`, answer: 0.2051, show: '210/1024 ≈ 0.2051',
        hint: r`\(X\sim\text{Binom}(10, 0.5)\). You need \(\binom{10}{6}\).`, solution: r`\(P(X=6)=\binom{10}{6}(0.5)^6(0.5)^4=\dfrac{210}{1024}=0.2051\).` },
      { id: 'q3', type: 'num', concept: 'binom', q: r`Same exam. What is the probability of **passing** (6 or more right) by guessing?`, answer: 0.3770, show: '386/1024 ≈ 0.377',
        hint: r`Add \(P(X=6)\) through \(P(X=10)\). The counts are \(\binom{10}{6},\dots,\binom{10}{10}\).`, solution: r`\(\dfrac{210+120+45+10+1}{1024}=\dfrac{386}{1024}=0.377\).` },
      { id: 'q4', type: 'num', concept: 'binom', q: r`In California 30% of homeowners have earthquake insurance. Four are picked at random. What is the probability that **at least two** are insured?`, answer: 0.3483,
        hint: r`Easier as \(1-P(X=0)-P(X=1)\) with \(X\sim\text{Binom}(4,0.3)\).`, solution: r`\(P(0)=0.7^4=0.2401\). \(P(1)=4(0.3)(0.7)^3=0.4116\). So \(P(X\ge2)=1-0.2401-0.4116=0.3483\).

(The most likely value, the mode, is \(X=1\).)` },
      { id: 'q5', type: 'num', concept: 'mgf-read', q: r`The MGF of \(X\) is \(m(t)=\dfrac{1+2e^t}{3}\cdot\dfrac{1+3e^t}{4}\). Find \(P(X=1)\).`, answer: 5 / 12, show: '5/12',
        hint: r`Multiply it out and find the coefficient of \(e^{1\cdot t}\).`, solution: r`\(m(t)=\dfrac{1+5e^t+6e^{2t}}{12}\). The coefficient of \(e^{t}\) is \(\tfrac5{12}\), so \(P(X=1)=\tfrac5{12}\).` },
      { id: 'q6', type: 'num', concept: 'geom', q: r`You roll a fair die until the first six appears. What is the probability it takes **at least 10** rolls?`, answer: 0.1938,
        hint: 'At least 10 rolls means the first 9 rolls were all failures.', solution: r`\(P(X\ge10)=P(X>9)=q^9=(5/6)^9=0.1938\).` },
      { id: 'q7', type: 'num', concept: 'series', q: r`Same die game. What is the probability that the first six appears on an **even-numbered** roll?`, answer: 5 / 11, show: '5/11 ≈ 0.4545',
        hint: r`Sum \(p(2)+p(4)+\dots\) as a geometric series with ratio \((5/6)^2\).`, solution: r`First term \(a=\tfrac16\cdot\tfrac56=\tfrac5{36}\), ratio \(r=\tfrac{25}{36}\). Sum \(=\dfrac{5/36}{11/36}=\dfrac5{11}\).` },
      { id: 'q8', type: 'num', concept: 'pois', q: r`Emails arrive as a Poisson process averaging 3 per minute. What is the probability of **at least 2** emails in the next minute?`, answer: 0.8009,
        hint: r`\(1-P(X=0)-P(X=1)\).`, solution: r`\(P(0)=e^{-3}\), \(P(1)=3e^{-3}\). So \(P(X\ge2)=1-4e^{-3}=1-0.1991=0.8009\).` },
      { id: 'q9', type: 'num', concept: 'pois-approx', q: r`A factory makes 2,000 chips; each is defective with probability 0.001, independently. Use the Poisson approximation to find the probability of **no** defective chips.`, answer: 0.1353,
        hint: r`\(\lambda=np\).`, solution: r`\(\lambda=2000\times0.001=2\). \(P(X=0)=e^{-2}=0.1353\).` },
      { id: 'q10', type: 'num', concept: 'nbin', q: r`You flip a fair coin until you get your **3rd head**. What is the probability this happens on exactly the 5th flip?`, answer: 0.1875, show: '6/32 = 0.1875',
        hint: r`Negative Binomial with \(k=3\), \(x=5\): the first 4 flips contain exactly 2 heads, then a head.`, solution: r`\(\binom{4}{2}(0.5)^3(0.5)^2=6/32=0.1875\).` },
      { id: 'q11', type: 'num', concept: 'hyper', q: r`A box has 12 bulbs, 4 of them faulty. You pick 3 without replacement. What is the probability that **none** are faulty?`, answer: 56 / 220, show: '56/220 ≈ 0.2545',
        hint: r`\(\binom40\binom83\big/\binom{12}3\).`, solution: r`\(\dfrac{\binom83}{\binom{12}{3}}=\dfrac{56}{220}=0.2545\).` },
      { id: 'q12', type: 'mcq', concept: 'mgf-moments', q: r`\(X\) has MGF \(m(t)=e^{3(e^t-1)}\). What are the mean and variance of \(X\)?`, choices: [r`mean 3, variance 9`, r`mean 3, variance 3`, r`mean \(e^3\), variance 3`, r`mean 1, variance 3`], answer: 1,
        hint: 'Match the MGF against the cheat sheet. Which distribution has this shape?', solution: r`\(e^{\lambda(e^t-1)}\) is the Poisson MGF with \(\lambda=3\). For a Poisson, mean = variance = \(\lambda=3\).` },
      { id: 'q13', type: 'self', concept: 'cgf', q: r`For \(X\sim\text{Binom}(n,p)\) with \(m(t)=(q+pe^t)^n\), find the cumulant generating function \(K(t)\) and use it to get the third central moment \(E[(X-\mu)^3]\).`,
        hint: r`\(K(t)=n\ln(q+pe^t)\). Differentiate three times and set \(t=0\), remembering \(p+q=1\).`,
        solution: r`\(K(t)=n\ln(q+pe^t)\).

\(K'(t)=\dfrac{npe^t}{q+pe^t}\), so \(K'(0)=np\).

\(K''(t)=\dfrac{npq\,e^t}{(q+pe^t)^2}\), so \(K''(0)=npq\).

\(K'''(t)=\dfrac{npq\,e^t(q-pe^t)}{(q+pe^t)^3}\), so \(K'''(0)=npq(q-p)\).

The third central moment is \(npq(q-p)\). It is zero when \(p=\tfrac12\): a fair-coin Binomial is perfectly symmetric.` },
    ]
  });
})();
