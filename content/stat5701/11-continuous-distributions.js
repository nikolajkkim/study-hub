(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l11', num: 11, minutes: 80,
    title: 'Special Distributions, Part 2: the continuous family',
    oneLiner: r`The named models for **measurements** (Uniform, Normal, Exponential, Gamma…), plus how to compute their averages.`,
    leadsTo: 'Next: rules for combining several random variables at once.',
    bigPicture: {
      what: r`Lecture 10 was about counts. This one is about quantities measured on a continuous scale: time, weight, money. For these, probability is **area under a curve** (the pdf), so sums become integrals.

The second half is computational: how to find the expected value \(E(X)\) and the MGF for each of these distributions. The slides do a lot of integrals. There are really only three tricks behind all of them, and they are spelled out below.`,
      why: r`The Normal distribution is the centre of statistics: Lecture 14 shows that averages of almost anything end up Normal. The Exponential and Gamma model waiting times. The Chi-square shows up in every hypothesis test later on. You need to recognise each, know its mean and variance, and be able to get probabilities from it.`,
      remember: r`1. For continuous variables, probability = area. \(P(a\le X\le b)=F(b)-F(a)\).
2. Any Normal problem becomes a standard Normal problem by computing \(z=\dfrac{x-\mu}{\sigma}\), then looking up \(\Phi(z)\).
3. Exponential is the Gamma with \(\alpha=1\). Chi-square is the Gamma with \(\alpha=\nu/2,\ \lambda=\tfrac12\). One family.`
    },
    sections: [
      { id: 's-cont', title: 'Continuous basics and the Uniform', summary: 'Probability as area; the flattest possible distribution.', concepts: [
        { id: 'pdf', title: 'pdf and cdf: probability is area',
          plain: r`A continuous variable has a **density curve** \(f(x)\). The curve is never negative and the total area under it is 1. The probability of landing between \(a\) and \(b\) is the area under the curve between them.

The **cdf** \(F(x)\) is the area to the left of \(x\). So any "between" probability is \(F(b)-F(a)\), and the density is the slope of the cdf: \(f = F'\).`,
          formula: r`\[ f(x)\ge0,\qquad \int_{-\infty}^{\infty}f(x)\,dx=1,\qquad P(a\le X\le b)=\int_a^b f(x)\,dx = F(b)-F(a) \]`,
          watch: r`The height \(f(x)\) is not a probability and can be bigger than 1. The chance of hitting any single exact value is 0, so \(<\) and \(\le\) give the same answer for continuous variables.` },
        { id: 'unif', title: 'Uniform(a, b): every value equally likely',
          plain: r`A flat density between \(a\) and \(b\). Because the total area must be 1, the height is \(\frac{1}{b-a}\). Probabilities are just fractions of the interval's length.`,
          formula: r`\[ f(x)=\frac1{b-a},\ a\le x\le b \qquad F(x)=\frac{x-a}{b-a} \qquad E(X)=\frac{a+b}2,\quad \text{Var}(X)=\frac{(b-a)^2}{12} \]`,
          example: r`\(X\sim U(2,10)\). \(P(3<X<5)=\dfrac{5-3}{10-2}=0.25\).` },
      ]},
      { id: 's-norm', title: 'The Normal distribution', summary: 'The bell curve, and how to get probabilities from it.', concepts: [
        { id: 'normal', title: 'Normal(μ, σ): the bell curve',
          plain: r`A symmetric bell. Two dials: \(\mu\) slides the centre left or right, \(\sigma\) makes it wide or narrow. It matters so much because (a) lots of natural measurements look like it, (b) it is easy to compute with, and (c) averages of almost anything become Normal (the Central Limit Theorem, Lecture 14).`,
          formula: r`\[ f(x)=\frac{1}{\sqrt{2\pi}\,\sigma}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}} \qquad E(X)=\mu,\quad \text{Var}(X)=\sigma^2 \]`,
          widget: 'dist:norm',
          watch: r`In this course \(N(\mu,\sigma)\) lists the **standard deviation** second. Many books write \(N(\mu,\sigma^2)\) with the variance. Always check which one you are given.` },
        { id: 'zscore', title: 'Standardising: every Normal question is a Z question',
          plain: r`The Normal cdf has no formula you can write down, so we use a table or software for one special case, the **standard Normal** \(Z\sim N(0,1)\). Its cdf is called \(\Phi\).

To use it for any other Normal: convert your value to "how many standard deviations from the mean" (the z-score), then look that up.`,
          formula: r`\[ z=\frac{x-\mu}{\sigma},\qquad P(X\le x)=\Phi(z),\qquad P(a<X<b)=\Phi(z_b)-\Phi(z_a),\qquad P(X>x)=1-\Phi(z) \]`,
          example: r`\(X\sim N(9,1)\). \(P(X<9.25)=\Phi\!\left(\tfrac{9.25-9}{1}\right)=\Phi(0.25)=0.5987\).

\(P(-0.44<Z<1.33)=\Phi(1.33)-\Phi(-0.44)=0.9082-0.3300=0.5782\).

In Python: <code>from statistics import NormalDist; NormalDist().cdf(z)</code>.`,
          watch: r`By symmetry \(\Phi(-z)=1-\Phi(z)\), and \(P(Z>-1.48)=\Phi(1.48)\).`,
          formal: r`The cdf of \(X\sim N(\mu,\sigma)\) is \(F(x)=\int_{-\infty}^x \frac{1}{\sqrt{2\pi\sigma^2}}e^{-(t-\mu)^2/2\sigma^2}dt\). It is not available in closed form. The cdf of \(Z\sim N(0,1)\), denoted \(\Phi(z)\), is available approximately in the z-table.` },
      ]},
      { id: 's-exp', title: 'Exponential', summary: 'Waiting time until the next random event.', concepts: [
        { id: 'expo', title: 'Exponential(λ): how long until the next event',
          plain: r`If events happen at random at an average rate of \(\lambda\) per unit time, the wait until the next one is Exponential. The most useful formula is the "still waiting" probability: \(P(X>x)=e^{-\lambda x}\). The average wait is \(1/\lambda\): 2 calls per hour means half an hour between calls on average.`,
          formula: r`\[ f(x)=\lambda e^{-\lambda x},\ x\ge0 \qquad F(x)=1-e^{-\lambda x} \qquad P(X>x)=e^{-\lambda x} \qquad E(X)=\frac1\lambda,\quad \text{Var}(X)=\frac1{\lambda^2} \]`,
          widget: 'dist:expo',
          example: r`API requests arrive at \(\lambda=4\) per second. Chance of waiting more than half a second: \(e^{-4(0.5)}=e^{-2}=0.1353\).`,
          watch: r`\(\lambda\) is a **rate** (events per unit time), not the mean. Mean \(=1/\lambda\).` },
        { id: 'memoryless', title: 'The memoryless property',
          plain: r`The Exponential forgets how long you have already waited. If you have waited half a second with nothing, the chance of waiting **another** half second is exactly the same as it was at the start. Past waiting buys you nothing.`,
          formula: r`\[ P(X>s+t \mid X>s)=P(X>t) \]`,
          example: r`With \(\lambda=4\): \(P(X>1\mid X>0.5)=\dfrac{e^{-4}}{e^{-2}}=e^{-2}=0.1353\), the same as \(P(X>0.5)\).` },
      ]},
      { id: 's-gamma', title: 'Gamma function, Gamma distribution and relatives', summary: 'One flexible family that contains the Exponential and the Chi-square.', concepts: [
        { id: 'gammafn', title: 'The Gamma function Γ: factorial for any number',
          plain: r`Factorials only work for whole numbers. \(\Gamma\) fills in the gaps. For whole numbers it is a shifted factorial: \(\Gamma(n)=(n-1)!\). The key rule is that you can peel off one factor at a time: \(\Gamma(x+1)=x\,\Gamma(x)\). One special value to memorise: \(\Gamma(\tfrac12)=\sqrt\pi\).`,
          formula: r`\[ \Gamma(z)=\int_0^\infty u^{z-1}e^{-u}\,du \qquad \Gamma(1)=1,\quad \Gamma(x+1)=x\,\Gamma(x),\quad \Gamma(n)=(n-1)!,\quad \Gamma(\tfrac12)=\sqrt\pi \]`,
          example: r`\(\Gamma(5)=4!=24\).

\(\Gamma(\tfrac52)=\tfrac32\cdot\Gamma(\tfrac32)=\tfrac32\cdot\tfrac12\cdot\Gamma(\tfrac12)=\tfrac34\sqrt\pi\).` },
        { id: 'gammadist', title: 'Gamma(α, λ) distribution',
          plain: r`A flexible model for positive, right-skewed quantities (insurance claims, rainfall, total waiting time). Two dials: the **shape** \(\alpha\) and the **rate** \(\lambda\). A good mental picture: the time until the \(\alpha\)-th event when events arrive at rate \(\lambda\). The \(\frac{\lambda^\alpha}{\Gamma(\alpha)}\) in front is only there to make the area equal 1.`,
          formula: r`\[ f(x)=\frac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha-1}e^{-\lambda x},\ x>0 \qquad E(X)=\frac\alpha\lambda,\quad \text{Var}(X)=\frac\alpha{\lambda^2},\quad m(t)=\left(\frac{\lambda}{\lambda-t}\right)^{\!\alpha} \]`,
          widget: 'dist:gamma',
          watch: r`Some sources use a **scale** \(\beta=1/\lambda\) instead of a rate. Then the mean is \(\alpha\beta\). Check which version a problem uses.` },
        { id: 'gammafamily', title: 'The family tree: Exponential and Chi-square are Gammas',
          plain: r`Set \(\alpha=1\) and the Gamma becomes the Exponential. Set \(\alpha=\nu/2\) and \(\lambda=\tfrac12\) and it becomes the Chi-square with \(\nu\) degrees of freedom. So if you know the Gamma's mean, variance and MGF, you get the other two for free.`,
          formula: r`\[ \Gamma(1,\lambda)=\text{Exp}(\lambda) \qquad\qquad \Gamma\!\left(\tfrac\nu2,\tfrac12\right)=\chi^2_\nu \]` },
        { id: 'chisq', title: 'Chi-square: a sum of squared standard Normals',
          plain: r`Take \(\nu\) independent standard Normals, square each, add them up. The result is Chi-square with \(\nu\) "degrees of freedom" (just the count of things you added). Its mean is \(\nu\) and its variance is \(2\nu\). Add two independent Chi-squares and the degrees of freedom add.`,
          formula: r`\[ X=Z_1^2+\dots+Z_\nu^2\sim\chi^2_\nu \qquad E(X)=\nu,\quad \text{Var}(X)=2\nu,\quad m(t)=(1-2t)^{-\nu/2} \]` },
        { id: 'weibull', title: 'Weibull and Lognormal (know what they are for)',
          plain: r`**Weibull**: a lifetime model for things that age. Unlike the Exponential, the risk of failing can go up (or down) over time. Its cdf is \(F(x)=1-e^{-x^\gamma/\theta}\) in the notation of the summary table.

**Lognormal**: \(X=e^{\mu+\sigma Z}\). In words, the log of \(X\) is Normal. Used for stock prices and incomes: positive, with a long right tail. Its median is \(e^\mu\) and its mean is \(e^{\mu+\sigma^2/2}\), which is bigger because the long tail drags the mean up.` },
      ]},
      { id: 's-ev', title: 'Computing expected values', summary: 'What E(X) is and the three tricks behind every derivation on the slides.', concepts: [
        { id: 'ev', title: 'Expected value: the long-run average',
          plain: r`Multiply each possible value by how likely it is, and add up. For continuous variables "add up" becomes "integrate". To average some function of \(X\), like \(X^2\), do the same with that function in place of \(x\).`,
          formula: r`\[ E(X)=\sum_x x\,p(x)\ \ \text{or}\ \int x f(x)\,dx \qquad\qquad E[g(X)]=\sum_x g(x)\,p(x)\ \ \text{or}\ \int g(x) f(x)\,dx \]` },
        { id: 'trick-pdf', title: 'Trick 1: "make it look like a pdf"',
          plain: r`This is the most reused trick in the course. Any pdf integrates to 1. So when you face an integral, rearrange the inside until it is exactly some pdf (with the right constant in front). That part equals 1, and whatever constants you pulled outside are your answer. No actual integration.`,
          example: r`Mean of a Gamma: \(E(X)=\displaystyle\int_0^\infty x\cdot\frac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha-1}e^{-\lambda x}dx\). The inside has \(x^{\alpha}e^{-\lambda x}\), which is the core of a \(\Gamma(\alpha+1,\lambda)\) pdf. Supplying its constant and compensating outside:

\[ E(X)=\frac{\Gamma(\alpha+1)}{\Gamma(\alpha)\,\lambda}\underbrace{\int_0^\infty\frac{\lambda^{\alpha+1}}{\Gamma(\alpha+1)}x^{\alpha}e^{-\lambda x}dx}_{=1}=\frac{\alpha\,\Gamma(\alpha)}{\Gamma(\alpha)\,\lambda}=\frac\alpha\lambda \]`,
          formal: r`We will use the following "trick": \(\int_0^\infty \frac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha-1}e^{-\lambda x}dx=1\) for all \(\lambda>0\). This is a very useful formula when working with the Gamma distribution.` },
        { id: 'trick-series', title: 'Trick 2: differentiate a known series',
          plain: r`For discrete waiting-time distributions you get sums like \(1+2r+3r^2+\dots\). Start from the geometric series \(1+r+r^2+\dots=\frac1{1-r}\) and differentiate both sides with respect to \(r\). The awkward sum appears on the left, and a clean formula on the right.`,
          formula: r`\[ \sum_{k=1}^\infty k\,r^{k-1}=\frac1{(1-r)^2} \qquad\qquad \sum_{k=1}^\infty k^2 r^{k-1}=\frac{1+r}{(1-r)^3} \]`,
          example: r`Geometric mean: \(E(X)=p\sum k\,q^{k-1}=\dfrac{p}{(1-q)^2}=\dfrac p{p^2}=\dfrac1p\).

Second moment: \(E(X^2)=p\cdot\dfrac{1+q}{(1-q)^3}=\dfrac{2-p}{p^2}\). So \(\text{Var}(X)=\dfrac{2-p}{p^2}-\dfrac1{p^2}=\dfrac{q}{p^2}\).` },
        { id: 'trick-parts', title: 'Trick 3: integration by parts, and symmetry',
          plain: r`When the first two tricks do not apply, the slides fall back on calculus. For the Exponential mean, integration by parts gives \(1/\lambda\). For the Normal mean, substitute \(z=\frac{x-\mu}\sigma\); the integral splits into \(\mu\times(\text{a pdf, which integrates to }1)\) plus \(\sigma\times(\text{an odd function, which integrates to }0)\), leaving \(\mu\).`,
          formula: r`\[ \int u\,dv = uv-\int v\,du \]`,
          watch: r`You are rarely asked to redo these derivations. Know the results (cheat sheet) and recognise which trick a derivation is using.` },
      ]},
      { id: 's-mgf2', title: 'MGFs of the main distributions', summary: 'Same definition as Lecture 10, applied with the pdf trick.', concepts: [
        { id: 'mgf-list', title: 'How each MGF is derived',
          plain: r`All of them start from \(m(t)=E(e^{tX})\). What changes is how the sum or integral is finished.

- **Poisson**: the sum is the series for \(e^{u}\) with \(u=\lambda e^t\).
- **Exponential and Gamma**: combine \(e^{tx}e^{-\lambda x}=e^{-(\lambda-t)x}\). That is a Gamma pdf with rate \(\lambda-t\), so use Trick 1. It only works when \(t<\lambda\).
- **Standard Normal**: complete the square in the exponent to turn it into a Normal pdf centred at \(t\), with \(e^{t^2/2}\) left over outside.`,
          formula: r`\[ \text{Poisson: } e^{\lambda(e^t-1)} \qquad \text{Exp: } \frac{\lambda}{\lambda-t}\ (t<\lambda) \qquad N(0,1)\text{: } e^{t^2/2} \qquad \Gamma(\alpha,\lambda)\text{: } \left(\frac\lambda{\lambda-t}\right)^{\!\alpha} \]` },
      ]},
    ],
    sheet: [
      { title: 'Continuous distributions', note: r`Rates, not scales: \(\text{Exp}(\lambda)\) has mean \(1/\lambda\).`, cols: ['Name', 'Use it for', 'pdf', 'Mean', 'Variance', 'MGF'], rows: [
        ['Uniform(a,b)', 'equally likely over an interval', r`\(\dfrac1{b-a}\)`, r`\(\dfrac{a+b}2\)`, r`\(\dfrac{(b-a)^2}{12}\)`, r`\(\dfrac{e^{bt}-e^{at}}{(b-a)t}\)`],
        ['Normal(μ,σ)', 'bell-shaped measurements, averages', r`\(\dfrac1{\sqrt{2\pi}\sigma}e^{-\frac{(x-\mu)^2}{2\sigma^2}}\)`, r`\(\mu\)`, r`\(\sigma^2\)`, r`\(e^{\mu t+\frac12\sigma^2t^2}\)`],
        ['Exponential(λ)', 'wait for next event', r`\(\lambda e^{-\lambda x}\)`, r`\(1/\lambda\)`, r`\(1/\lambda^2\)`, r`\(\dfrac\lambda{\lambda-t}\)`],
        ['Gamma(α,λ)', 'wait for α-th event; skewed positives', r`\(\dfrac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha-1}e^{-\lambda x}\)`, r`\(\alpha/\lambda\)`, r`\(\alpha/\lambda^2\)`, r`\(\left(\dfrac\lambda{\lambda-t}\right)^\alpha\)`],
        [r`Chi-square \(\chi^2_\nu\)`, 'sum of ν squared N(0,1)', r`Gamma with \(\alpha=\frac\nu2,\lambda=\frac12\)`, r`\(\nu\)`, r`\(2\nu\)`, r`\((1-2t)^{-\nu/2}\)`],
        ['Lognormal', 'prices, incomes', r`\(\dfrac{1}{x\sigma\sqrt{2\pi}}e^{-\frac{(\ln x-\mu)^2}{2\sigma^2}}\)`, r`\(e^{\mu+\sigma^2/2}\)`, '—', 'none'],
      ]},
      { title: 'Probability recipes', cols: ['Task', 'Do this'], rows: [
        ['Normal probability', r`\(z=\dfrac{x-\mu}\sigma\), then \(\Phi(z)\) from table / software`],
        ['Between two values', r`\(F(b)-F(a)\)`],
        ['Exponential tail', r`\(P(X>x)=e^{-\lambda x}\)`],
        ['Memoryless', r`\(P(X>s+t\mid X>s)=P(X>t)\)`],
        ['Gamma function', r`\(\Gamma(n)=(n-1)!\), \(\Gamma(x+1)=x\Gamma(x)\), \(\Gamma(\frac12)=\sqrt\pi\)`],
        ['Useful z-values', r`\(\Phi(1)=0.8413,\ \Phi(1.645)=0.95,\ \Phi(1.96)=0.975,\ \Phi(2)=0.9772,\ \Phi(2.326)=0.99\)`],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'unif', q: r`A bus arrives uniformly at random between 0 and 20 minutes from now. What is the probability you wait **more than 15 minutes**?`, answer: 0.25,
        hint: 'Fraction of the interval that counts.', solution: r`\(P(X>15)=\dfrac{20-15}{20-0}=0.25\).` },
      { id: 'q2', type: 'num', concept: 'zscore', q: r`Test scores are \(N(\mu=100,\ \sigma=15)\). What fraction of scores are **above 130**? (Use \(\Phi(2)=0.9772\).)`, answer: 0.0228,
        hint: r`z-score first: \(z=(130-100)/15\).`, solution: r`\(z=2\). \(P(X>130)=1-\Phi(2)=1-0.9772=0.0228\).` },
      { id: 'q3', type: 'num', concept: 'zscore', q: r`For a standard Normal \(Z\), find \(P(-1<Z<1)\). (Use \(\Phi(1)=0.8413\).)`, answer: 0.6826,
        hint: r`\(\Phi(-1)=1-\Phi(1)\).`, solution: r`\(\Phi(1)-\Phi(-1)=0.8413-0.1587=0.6826\). About 68% of a Normal lies within one SD of the mean.` },
      { id: 'q4', type: 'num', concept: 'expo', q: r`Customers arrive at a rate of \(\lambda=3\) per hour. What is the probability that the next customer takes **more than 30 minutes** to arrive?`, answer: 0.2231,
        hint: 'Keep units consistent: 30 minutes is 0.5 hours.', solution: r`\(P(X>0.5)=e^{-3(0.5)}=e^{-1.5}=0.2231\).` },
      { id: 'q5', type: 'mcq', concept: 'memoryless', q: r`A component's lifetime is Exponential with mean 1000 hours. It has already run 500 hours. What is the probability it lasts at least another 1000 hours?`, choices: [r`\(e^{-1.5}\)`, r`\(e^{-1}\)`, r`\(e^{-0.5}\)`, r`\(1-e^{-1}\)`], answer: 1,
        hint: 'The Exponential does not remember the first 500 hours.', solution: r`Memoryless: \(P(X>1500\mid X>500)=P(X>1000)=e^{-1000/1000}=e^{-1}\).` },
      { id: 'q6', type: 'num', concept: 'gammafn', q: r`Compute \(\Gamma(6)\).`, answer: 120, tol: 0.01,
        hint: r`\(\Gamma(n)=(n-1)!\)`, solution: r`\(\Gamma(6)=5!=120\).` },
      { id: 'q7', type: 'num', concept: 'gammafn', q: r`Compute \(\Gamma(\tfrac72)\) as a decimal. (\(\sqrt\pi\approx1.7725\))`, answer: 3.3234,
        hint: r`Peel off factors with \(\Gamma(x+1)=x\Gamma(x)\) until you reach \(\Gamma(\tfrac12)\).`, solution: r`\(\Gamma(\tfrac72)=\tfrac52\cdot\tfrac32\cdot\tfrac12\cdot\sqrt\pi=\tfrac{15}8\sqrt\pi=3.3234\).` },
      { id: 'q8', type: 'num', concept: 'gammadist', q: r`\(X\sim\Gamma(\alpha=3,\ \lambda=2)\). What is \(\text{Var}(X)\)?`, answer: 0.75,
        hint: r`\(\alpha/\lambda^2\).`, solution: r`\(\text{Var}(X)=3/2^2=0.75\). (The mean is \(3/2=1.5\).)` },
      { id: 'q9', type: 'mcq', concept: 'gammafamily', q: r`Which statement is true?`, choices: [r`\(\Gamma(1,\lambda)\) is the Normal distribution`, r`\(\Gamma(1,\lambda)\) is \(\text{Exp}(\lambda)\)`, r`\(\Gamma(\lambda,1)\) is \(\text{Exp}(\lambda)\)`, r`Chi-square is a Gamma with \(\lambda=2\)`], answer: 1,
        hint: r`Plug \(\alpha=1\) into the Gamma pdf.`, solution: r`With \(\alpha=1\): \(\dfrac{\lambda^1}{\Gamma(1)}x^0e^{-\lambda x}=\lambda e^{-\lambda x}\), the Exponential pdf. Chi-square uses \(\lambda=\tfrac12\), not 2.` },
      { id: 'q10', type: 'num', concept: 'chisq', q: r`\(Z_1,\dots,Z_5\) are independent standard Normals and \(X=Z_1^2+\dots+Z_5^2\). What is \(\text{Var}(X)\)?`, answer: 10, tol: 0.01,
        hint: r`\(X\sim\chi^2_5\).`, solution: r`Chi-square with \(\nu=5\): mean \(=5\), variance \(=2\nu=10\).` },
      { id: 'q11', type: 'num', concept: 'trick-series', q: r`\(X\sim\text{Geo}(p=\tfrac14)\). Using \(E(X^2)=\dfrac{2-p}{p^2}\), find \(\text{Var}(X)\).`, answer: 12, tol: 0.01,
        hint: r`\(\text{Var}=E(X^2)-[E(X)]^2\) with \(E(X)=1/p\).`, solution: r`\(E(X^2)=\dfrac{1.75}{0.0625}=28\), \(E(X)=4\). \(\text{Var}=28-16=12\), which matches \(q/p^2=0.75/0.0625\).` },
      { id: 'q12', type: 'num', concept: 'mgf-list', q: r`\(X\sim\text{Exp}(\lambda=2)\) has MGF \(m(t)=\dfrac{2}{2-t}\). Use it to find \(E(X^2)\).`, answer: 0.5,
        hint: r`\(m''(t)=\dfrac{2\lambda}{(\lambda-t)^3}\).`, solution: r`\(m''(0)=\dfrac{2\lambda}{\lambda^3}=\dfrac2{\lambda^2}=\dfrac24=0.5\).` },
      { id: 'q13', type: 'self', concept: 'trick-pdf', q: r`Use the "make it look like a pdf" trick to show that for \(X\sim\Gamma(\alpha,\lambda)\), \(E(X^2)=\dfrac{\alpha(\alpha+1)}{\lambda^2}\). Then get the variance.`,
        hint: r`\(x^2\cdot x^{\alpha-1}=x^{(\alpha+2)-1}\): the core of a \(\Gamma(\alpha+2,\lambda)\) pdf.`,
        solution: r`\(E(X^2)=\displaystyle\int_0^\infty\frac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha+1}e^{-\lambda x}dx=\frac{\Gamma(\alpha+2)}{\Gamma(\alpha)\lambda^2}\int_0^\infty\frac{\lambda^{\alpha+2}}{\Gamma(\alpha+2)}x^{\alpha+1}e^{-\lambda x}dx\).

The remaining integral is a \(\Gamma(\alpha+2,\lambda)\) pdf, so it equals 1. And \(\Gamma(\alpha+2)=(\alpha+1)\alpha\,\Gamma(\alpha)\).

So \(E(X^2)=\dfrac{\alpha(\alpha+1)}{\lambda^2}\) and \(\text{Var}(X)=\dfrac{\alpha(\alpha+1)}{\lambda^2}-\dfrac{\alpha^2}{\lambda^2}=\dfrac{\alpha}{\lambda^2}\).` },
    ]
  });
})();
