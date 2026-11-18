(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l14', num: 14, minutes: 75,
    title: 'Law of Large Numbers and Central Limit Theorem',
    oneLiner: r`Averages of lots of data **settle down** to the true mean, and their randomness is **bell-shaped**.`,
    leadsTo: 'Next: using data to estimate the unknown parameters of a model.',
    bigPicture: {
      what: r`This is the lecture where probability turns into statistics. It is about one object: the **sample mean** \(\bar X\), the average of your data. Because the data is random, \(\bar X\) is random too. Two theorems describe how it behaves when \(n\) is large:

- **Law of Large Numbers (LLN)**: \(\bar X\) gets close to the true mean \(\mu\). It tells you **where** the average goes.
- **Central Limit Theorem (CLT)**: the leftover error \(\bar X-\mu\) is approximately Normal with standard deviation \(\sigma/\sqrt n\). It tells you **how far off** you are likely to be.

The remarkable part: the CLT works whatever distribution the individual data points come from.`,
      why: r`Every confidence interval, A/B test and error bar you will ever compute rests on the CLT. In practice it gives you a recipe: turn any question about a sum or average of many independent things into a z-score and look it up.`,
      remember: r`1. \(\bar X\) has mean \(\mu\) and SD \(\sigma/\sqrt n\). A sum \(T=X_1+\dots+X_n\) has mean \(n\mu\) and SD \(\sigma\sqrt n\).
2. CLT recipe: \(z=\dfrac{\text{value}-\text{mean}}{\text{SD}}\), then use \(\Phi\). Rule of thumb: fine when \(n\ge30\).
3. LLN = the estimate is right in the long run. CLT = the size and shape of the error.`
    },
    sections: [
      { id: 's-vocab', title: 'The language of statistics', summary: 'Parameter, statistic, sampling distribution.', concepts: [
        { id: 'param-stat', title: 'Parameter vs statistic',
          plain: r`A **parameter** is a true, fixed number describing the whole population. You almost never know it. Written with Greek letters: \(\mu\), \(\sigma\), \(\theta\).

A **statistic** is a number you compute from your sample. You know it, but it would come out differently with a different sample. Written with Roman letters or hats: \(\bar X\), \(\hat p\), \(\hat\theta\).

Statistics is the business of using the second to learn about the first.`,
          example: r`A/B test on checkout flows. Parameters: \(\mu_A,\mu_B\), the true average order values if **every** customer used each flow. Statistics: \(\bar X_A=\$44.30\) and \(\bar X_B=\$52.80\) from 1,000 customers each. The question "is \(\mu_B>\mu_A\)?" cannot be answered just by seeing \(52.80>44.30\): you need to know how much those sample means wobble.`,
          formal: r`Parameter: a constant that indexes a family of probability distributions or defines a deterministic characteristic of a complete, unobservable population. Statistic: a mathematical function applied to a random sample that does not depend on any unknown parameters and is a random variable.` },
        { id: 'sampdist', title: 'Sampling distribution',
          plain: r`Imagine repeating your whole study many times: new random sample each time, compute the statistic each time. The statistic's values would form a histogram. That histogram is its **sampling distribution**.

You only ever get one sample, so you never see it directly. Theory (this lecture) or simulation (last lecture) tells you what it looks like, and that tells you how far your one number might be from the truth.`,
          formal: r`A sampling distribution is the theoretical probability distribution of a specific sample statistic that would emerge if you repeatedly drew an infinite number of random samples of the same size from a given population.` },
        { id: 'iid', title: 'iid and "random sample"',
          plain: r`"\(X_1,\dots,X_n\) iid" means every observation is drawn from the **same** distribution and no observation influences another. It is the standard assumption behind everything in this lecture. "Random sample from a population with mean \(\mu\) and SD \(\sigma\)" means the same thing.` },
      ]},
      { id: 's-xbar', title: 'The sample mean', summary: 'Centre μ, spread σ/√n.', concepts: [
        { id: 'xbar', title: 'Mean and standard error of X̄',
          plain: r`From Lecture 12: averaging \(n\) independent observations keeps the centre at \(\mu\) and shrinks the standard deviation to \(\sigma/\sqrt n\). That SD of the sample mean is called the **standard error**. More data → smaller standard error → \(\bar X\) hugs \(\mu\) more tightly.`,
          formula: r`\[ \mu_{\bar X}=\mu,\qquad \sigma_{\bar X}=\frac{\sigma}{\sqrt n} \qquad\text{(true for any population)} \]`,
          watch: r`Do not mix up \(\sigma\) (spread of **one** observation) with \(\sigma/\sqrt n\) (spread of the **average**). Most wrong answers in this topic come from forgetting the \(\sqrt n\).` },
        { id: 'xbar-normal', title: 'If the population is Normal, X̄ is exactly Normal',
          plain: r`When the individual data points are themselves Normal, their average is exactly Normal for any \(n\), even \(n=2\). No approximation and no CLT required.`,
          formula: r`\[ X_i\ \text{iid}\ N(\mu,\sigma)\ \Rightarrow\ \bar X\sim N\!\left(\mu,\frac\sigma{\sqrt n}\right) \]`,
          example: r`\(\mu=12,\ \sigma=0.04,\ n=16\), Normal population. \(\sigma_{\bar X}=0.04/4=0.01\).

\(P(11.99\le\bar X\le12.01)=P(-1\le Z\le1)=0.8413-0.1587=0.6826\).` },
      ]},
      { id: 's-lln', title: 'Law of Large Numbers', summary: 'The average converges to the true mean.', concepts: [
        { id: 'lln', title: 'LLN: with enough data, X̄ is close to μ',
          plain: r`Pick any tolerance you like, however tiny. As \(n\) grows, the probability that \(\bar X\) is within that tolerance of \(\mu\) goes to 1. This is why averaging works, why casinos always win in the long run, and why simulation estimates (Lecture 13) can be trusted.`,
          formula: r`\[ P\big(|\bar X_n-\mu|<\varepsilon\big)\to1\ \text{ as }n\to\infty\quad\text{for every }\varepsilon>0 \qquad\text{written}\qquad \bar X_n\xrightarrow{P}\mu \]`,
          example: r`Special case: the sample proportion. If each \(X_i\) is 1 with probability \(p\) and 0 otherwise, then \(\bar X=\hat p\), the fraction of successes, and LLN says \(\hat p\to p\). Flip a coin enough and the fraction of heads approaches 0.5.`,
          formal: r`Let \(X_1,\dots,X_n\) be mutually independent random variables each having mean \(\mu\). Then the sample mean converges in probability to the population mean. Proof: can be done with Tchebychev's theorem (assuming \(\sigma^2\) finite), or with MGFs: \(m_{\bar X}(t)=[m(t/n)]^n\to e^{t\mu}\), the MGF of the constant \(\mu\).` },
        { id: 'conv', title: 'Two kinds of "converges"',
          plain: r`**In probability** (\(\xrightarrow{P}\)): the random quantity gets close to a particular **number**. LLN is this kind.

**In distribution** (\(\xrightarrow{d}\)): the random quantity keeps being random, but its **histogram** approaches a particular shape. CLT is this kind.

A useful link: if something converges in distribution to a constant, it also converges in probability to that constant.` },
      ]},
      { id: 's-clt', title: 'Central Limit Theorem', summary: 'The error of the average is approximately Normal.', concepts: [
        { id: 'clt', title: 'CLT: the statement',
          plain: r`Take an iid sample from **any** distribution with mean \(\mu\) and finite variance \(\sigma^2\). Standardise the sample mean (subtract its mean, divide by its standard error). For large \(n\), the result behaves like a standard Normal.

Translated: for large \(n\), \(\bar X\) is approximately \(N(\mu,\ \sigma/\sqrt n)\), even if the data itself is skewed, flat, or just 0s and 1s.`,
          formula: r`\[ \frac{\bar X-\mu}{\sigma/\sqrt n}\ \xrightarrow{d}\ N(0,1)\qquad\text{as }n\to\infty \]`,
          widget: 'clt',
          watch: r`The CLT is about the **average** (or sum), not about individual data points. The data does not become Normal. "Large" has no exact cut-off; the course's rule is \(n\ge30\).`,
          formal: r`Let \(X_1,\dots,X_n\) be an iid sample from any distribution with mean \(\mu\) and finite variance \(\sigma^2\). Then \(\lim_{n\to\infty}P\!\left(\frac{\bar X-\mu}{\sigma/\sqrt n}\le x\right)=\Phi(x)\).` },
        { id: 'clt-sum', title: 'CLT for sums',
          plain: r`A total is just \(n\) times an average, so the same theorem covers sums. The total of \(n\) iid pieces is approximately Normal with mean \(n\mu\) and **variance** \(n\sigma^2\) (so SD \(\sigma\sqrt n\)).`,
          formula: r`\[ T=X_1+\dots+X_n\ \approx\ N\big(n\mu,\ \text{SD}=\sigma\sqrt n\big) \]` },
        { id: 'clt-recipe', title: 'The CLT recipe for word problems',
          plain: r`1. Identify \(\mu\) and \(\sigma\) of **one** observation.
2. Decide whether the question is about the average (\(\bar X\)) or the total (\(T\)).
3. Mean and SD of that: \(\mu\) and \(\sigma/\sqrt n\) for the average; \(n\mu\) and \(\sigma\sqrt n\) for the total.
4. z-score: \(z=\dfrac{\text{value}-\text{mean}}{\text{SD}}\).
5. Look up \(\Phi(z)\).`,
          example: r`Fair coin tossed 900 times, \(P(\text{more than 495 heads})\)? One toss: \(\mu=0.5,\ \sigma=\sqrt{0.25}=0.5\). Total: mean \(450\), SD \(0.5\sqrt{900}=15\). \(z=\dfrac{495-450}{15}=3\). \(P(Z>3)=0.0013\). (Exact Binomial: 0.0012.)

Queue: waits are \(\text{Exp}(2)\), so \(\mu=\sigma=0.5\). For \(n=100\): \(P(\bar X<0.56)\approx\Phi\!\left(\dfrac{0.56-0.5}{0.5/10}\right)=\Phi(1.2)=0.8849\). (Exact, via Gamma(100, 2): 0.8826.)` },
        { id: 'clt-proof', title: 'Why it is true (proof idea)',
          plain: r`You do not need to reproduce the proof, but here is its skeleton, which reuses Lecture 10 tools.

1. MGF of a sum of independents = product of MGFs, so the MGF of the standardised mean can be written in terms of the MGF \(m\) of a single observation.
2. Take logs and let \(n\to\infty\). After applying L'Hôpital's rule twice, the log-MGF converges to \(t^2/2\).
3. So the MGF converges to \(e^{t^2/2}\), which is the MGF of \(N(0,1)\).
4. A theorem says: if MGFs converge, the distributions converge. Done.`,
          formal: r`Convergence of MGF: suppose \(m_n(t)\to m(t)\) pointwise for all \(t\in(-\delta,\delta)\). Then \(F_n(x)\to F(x)\) for all x, that is \(X_n\xrightarrow{d}X\).` },
      ]},
      { id: 's-ext', title: 'Extensions: functions of averages', summary: 'Delta method, continuous mapping, Slutsky, Lyapunov.', concepts: [
        { id: 'cmt', title: 'Continuous mapping theorem',
          plain: r`If a sequence converges to something, then any continuous function of it converges to the function of that something. You can "push the limit through" the function.`,
          formula: r`\[ X_n\to X\ \text{ and } g \text{ continuous}\ \Rightarrow\ g(X_n)\to g(X) \]`,
          example: r`LLN says \(\bar X\to\mu\). Squaring is continuous, so \(\bar X^2\to\mu^2\).` },
        { id: 'slutsky', title: 'Slutsky’s theorem',
          plain: r`If one piece converges in distribution to a random variable \(X\), and another piece converges to a **constant** \(c\), you may add or multiply them and treat the second piece as if it were just \(c\). This lets you swap an unknown \(\sigma\) for an estimate of it without spoiling the Normal limit.`,
          formula: r`\[ X_n\xrightarrow{d}X,\ \ Y_n\xrightarrow{d}c\ \Rightarrow\ X_n+Y_n\xrightarrow{d}X+c,\qquad X_nY_n\xrightarrow{d}cX \]`,
          example: r`Showing the sample variance works: \(\frac1n\sum(X_i-\bar X)^2=\frac1n\sum X_i^2-\bar X^2\to(\sigma^2+\mu^2)-\mu^2=\sigma^2\). The first term uses LLN on the \(X_i^2\); the second uses continuous mapping.` },
        { id: 'delta', title: 'Delta method: CLT for a function of the mean',
          plain: r`The CLT tells you \(\bar X\) is roughly Normal. Often you care about a **function** of it, like \(1/\bar X\) or \(\bar X(1-\bar X)\). The delta method says: that is roughly Normal too, centred at the function of \(\mu\), and its standard deviation is the old one multiplied by the **slope** of the function at \(\mu\).

Why: zoomed in near \(\mu\), any smooth function looks like a straight line, and a straight line just stretches the error by its slope.`,
          formula: r`\[ g(\bar X)\ \approx\ N\!\left(g(\mu),\ \text{SD}=|g'(\mu)|\,\frac{\sigma}{\sqrt n}\right)\qquad(g'(\mu)\ne0) \]`,
          example: r`\(X_i\sim\text{Exp}(\lambda)\): \(\mu=\sigma=1/\lambda\). Estimate \(\lambda\) by \(g(\bar X)=1/\bar X\). Slope: \(g'(\mu)=-1/\mu^2=-\lambda^2\).

SD \(\approx\lambda^2\cdot\dfrac{1/\lambda}{\sqrt n}=\dfrac{\lambda}{\sqrt n}\). So \(1/\bar X\approx N\!\left(\lambda,\ \lambda/\sqrt n\right)\).`,
          formal: r`Let \(a_n(X_n-\theta)\xrightarrow{d}F\). If \(\alpha\) is a function with continuous derivative such that \(\alpha'(\theta)\ne0\), then \(a_n[\alpha(X_n)-\alpha(\theta)]/\alpha'(\theta)\xrightarrow{d}F\). Applied to the CLT: \(\dfrac{\sqrt n\,[\alpha(\bar X)-\alpha(\mu)]}{\sigma\,\alpha'(\mu)}\xrightarrow{d}Z\).` },
        { id: 'lyapunov', title: 'Lyapunov CLT: when the pieces are not identical',
          plain: r`The basic CLT needs every observation to come from the same distribution. Lyapunov's version drops that: the pieces can have **different** means and variances, as long as they are independent and no single piece dominates the total. Standardise the sum using the sum of the means and the sum of the variances, and it is still approximately Normal.`,
          formula: r`\[ Y_n=\frac{\sum X_i-\sum\mu_i}{\sqrt{\sum\sigma_i^2}}\ \xrightarrow{d}\ N(0,1) \]` },
      ]},
    ],
    sheet: [
      { title: 'Core results', cols: ['Result', 'Statement', 'Use'], rows: [
        ['Sample mean', r`\(E(\bar X)=\mu,\ \ \text{SD}(\bar X)=\sigma/\sqrt n\)`, 'always (iid)'],
        ['Sum', r`\(E(T)=n\mu,\ \ \text{SD}(T)=\sigma\sqrt n\)`, 'always (iid)'],
        ['Normal population', r`\(\bar X\sim N(\mu,\sigma/\sqrt n)\) exactly`, 'any n'],
        ['LLN', r`\(\bar X_n\xrightarrow{P}\mu\)`, 'averages settle at the truth'],
        ['CLT', r`\(\dfrac{\bar X-\mu}{\sigma/\sqrt n}\xrightarrow{d}N(0,1)\)`, r`\(n\ge30\), any population`],
        ['Proportion', r`\(\hat p\approx N\!\left(p,\ \sqrt{p(1-p)/n}\right)\)`, 'CLT with 0/1 data'],
        ['Continuous mapping', r`\(X_n\to X\Rightarrow g(X_n)\to g(X)\)`, 'g continuous'],
        ['Slutsky', r`\(X_n\xrightarrow{d}X,\ Y_n\xrightarrow{d}c\Rightarrow X_nY_n\xrightarrow{d}cX\)`, 'plug in estimates'],
        ['Delta method', r`\(g(\bar X)\approx N\!\left(g(\mu),\ |g'(\mu)|\sigma/\sqrt n\right)\)`, 'function of a mean'],
      ]},
      { title: 'z-values worth knowing', cols: ['z', 'Φ(z)'], rows: [
        ['1.00', '0.8413'], ['1.20', '0.8849'], ['1.645', '0.9500'], ['1.89', '0.9706'], ['1.96', '0.9750'], ['2.00', '0.9772'], ['2.326', '0.9900'], ['3.00', '0.9987'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'mcq', concept: 'clt', q: r`Individual incomes in a city are heavily right-skewed. You take random samples of 200 people and record the sample mean each time. According to the CLT, what is approximately Normal?`, choices: ['The incomes of the 200 people in a sample', 'The distribution of the sample means', 'The incomes of everyone in the city', 'Nothing, because the population is skewed'], answer: 1,
        hint: 'The CLT is a statement about averages.', solution: r`The **sample mean** is approximately Normal. The individual incomes stay skewed no matter how many you collect.` },
      { id: 'q2', type: 'mcq', concept: 'xbar', q: r`To cut the standard error of a sample mean in **half**, you need to…`, choices: ['double the sample size', 'quadruple the sample size', 'halve the sample size', r`increase the sample size by \(\sqrt2\)`], answer: 1,
        hint: r`\(\sigma/\sqrt n\).`, solution: r`\(\sigma/\sqrt{4n}=\tfrac12\,\sigma/\sqrt n\). Four times the data for half the noise.` },
      { id: 'q3', type: 'num', concept: 'xbar-normal', q: r`Bolt lengths are Normal with \(\mu=50\) mm and \(\sigma=6\) mm. For a sample of \(n=9\), find \(P(48\le\bar X\le53)\). (\(\Phi(1.5)=0.9332,\ \Phi(-1)=0.1587\))`, answer: 0.9332 - 0.1587, show: '0.7745',
        hint: r`First find \(\sigma_{\bar X}=\sigma/\sqrt n\), then standardise both ends.`, solution: r`\(\sigma_{\bar X}=6/3=2\). \(z\) runs from \((48-50)/2=-1\) to \((53-50)/2=1.5\). \(P=0.9332-0.1587=0.7745\).` },
      { id: 'q4', type: 'num', concept: 'clt-recipe', q: r`Same bolts (\(\mu=50,\ \sigma=6\)), but now don't assume Normality; take \(n=36\). Approximate \(P(\bar X>51.5)\). (\(\Phi(1.5)=0.9332\))`, answer: 1 - 0.9332, tol: 0.003, show: '0.0668',
        hint: 'n = 36 is large enough for the CLT.', solution: r`\(\sigma_{\bar X}=6/6=1\). \(z=(51.5-50)/1=1.5\). \(P(Z>1.5)=1-0.9332=0.0668\).` },
      { id: 'q5', type: 'num', concept: 'clt-recipe', q: r`A bank teller's service time per customer has mean 2 minutes and variance 1. Let \(Y\) be the total time for 50 customers. Approximate \(P(90<Y<110)\). (\(\Phi(1.41)=0.9207\))`, answer: 0.8414, tol: 0.004,
        hint: r`Total: mean \(50\times2\), variance \(50\times1\).`, solution: r`Mean \(=100\), SD \(=\sqrt{50}=7.07\). \(z=\pm\dfrac{10}{7.07}=\pm1.41\).

\(P(-1.41<Z<1.41)=2(0.9207)-1=0.8414\).` },
      { id: 'q6', type: 'num', concept: 'clt-recipe', q: r`Support-ticket handling times are iid \(\text{Exp}(\lambda=4)\) hours. For 64 tickets, approximate the probability that the **average** time is less than 0.28 hours. (\(\Phi(0.96)=0.8315\))`, answer: 0.8315, tol: 0.004,
        hint: r`For \(\text{Exp}(\lambda)\), \(\mu=\sigma=1/\lambda\).`, solution: r`\(\mu=\sigma=0.25\). \(\sigma_{\bar X}=0.25/8=0.03125\). \(z=(0.28-0.25)/0.03125=0.96\). \(P\approx\Phi(0.96)=0.8315\).` },
      { id: 'q7', type: 'num', concept: 'clt-sum', q: r`ML pipeline: each request takes \(X_i=F_i+I_i\) ms, where \(F_i\sim\text{Exp}(0.5)\) and \(I_i\sim U(4,10)\) are independent. What is the **variance** of one request's time \(X_i\)?`, answer: 7, tol: 0.01,
        hint: r`\(\text{Var}(\text{Exp})=1/\lambda^2\), \(\text{Var}(U)=(b-a)^2/12\). Independent → add.`, solution: r`\(\text{Var}(F)=1/0.25=4\). \(\text{Var}(I)=36/12=3\). Total \(=7\text{ ms}^2\). (Mean \(=2+7=9\) ms.)` },
      { id: 'q8', type: 'num', concept: 'clt-sum', q: r`Same pipeline, batch of 100 requests: total time \(T\) has mean 900 ms and variance 700 ms². Approximate \(P(T<950)\). (\(\Phi(1.89)=0.9706\))`, answer: 0.9706, tol: 0.003,
        hint: r`SD \(=\sqrt{700}\approx26.46\).`, solution: r`\(z=\dfrac{950-900}{26.46}=1.89\). \(\Phi(1.89)=0.9706\).` },
      { id: 'q9', type: 'num', concept: 'clt-sum', q: r`Same pipeline. The team wants a timeout \(t_{max}\) that only 1% of batches exceed. What should \(t_{max}\) be, in ms? (The 99th percentile of \(Z\) is 2.326.)`, answer: 961.5, tol: 1,
        hint: r`Work backwards: \(t_{max}=\text{mean}+z\times\text{SD}\).`, solution: r`\(t_{max}=900+2.326\times26.46=900+61.5=961.5\) ms.` },
      { id: 'q10', type: 'num', concept: 'clt-recipe', q: r`30% of users click an ad. In a random sample of 100 users, approximate the probability that **more than 35%** click. (\(\Phi(1.09)=0.8621\))`, answer: 0.1379, tol: 0.004,
        hint: r`\(\hat p\) has mean \(p\) and SD \(\sqrt{p(1-p)/n}\).`, solution: r`SD \(=\sqrt{0.3\times0.7/100}=0.0458\). \(z=\dfrac{0.35-0.30}{0.0458}=1.09\). \(P(Z>1.09)=1-0.8621=0.1379\).` },
      { id: 'q11', type: 'mcq', concept: 'conv', q: r`Which pairing is correct?`, choices: ['LLN: convergence in distribution; CLT: convergence in probability', 'LLN: convergence in probability to a number; CLT: convergence in distribution to a Normal', 'Both describe convergence to a Normal', 'Both describe convergence to a number'], answer: 1,
        hint: 'One says where the average goes; the other describes the shape of its error.', solution: r`LLN: \(\bar X\xrightarrow{P}\mu\) (a number). CLT: the standardised mean \(\xrightarrow{d}N(0,1)\) (a shape).` },
      { id: 'q12', type: 'mcq', concept: 'delta', q: r`\(X_i\sim\text{Exp}(\lambda)\) and you estimate \(\lambda\) with \(1/\bar X\). By the delta method, the approximate standard deviation of \(1/\bar X\) is…`, choices: [r`\(\dfrac{1}{\lambda\sqrt n}\)`, r`\(\dfrac{\lambda}{\sqrt n}\)`, r`\(\dfrac{\lambda^2}{\sqrt n}\)`, r`\(\dfrac{\lambda}{n}\)`], answer: 1,
        hint: r`\(|g'(\mu)|\cdot\sigma/\sqrt n\) with \(g(x)=1/x\) and \(\mu=\sigma=1/\lambda\).`, solution: r`\(|g'(\mu)|=1/\mu^2=\lambda^2\). Multiply by \(\sigma/\sqrt n=\dfrac{1}{\lambda\sqrt n}\): result \(\dfrac{\lambda}{\sqrt n}\).` },
      { id: 'q13', type: 'self', concept: 'delta', q: r`\(X_i\sim\text{Bernoulli}(p)\) and \(\hat p=\bar X\). Use the delta method to find the approximate distribution of \(\hat p(1-\hat p)\), the estimator of the variance \(p(1-p)\).`,
        hint: r`\(g(x)=x(1-x)\), so \(g'(x)=1-2x\). For a Bernoulli, \(\sigma=\sqrt{p(1-p)}\).`,
        solution: r`\(g(p)=p(1-p)\) and \(g'(p)=1-2p\).

Delta method: \(\hat p(1-\hat p)\approx N\!\left(p(1-p),\ \text{SD}=|1-2p|\sqrt{\dfrac{p(1-p)}{n}}\right)\).

Equivalently \(\sqrt n\,[\hat p(1-\hat p)-p(1-p)]\xrightarrow{d}N\big(0,\ \text{variance}=(1-2p)^2p(1-p)\big)\).

Note: at \(p=\tfrac12\) the slope is 0, so the method's condition \(g'(\mu)\ne0\) fails there.` },
    ]
  });
})();
