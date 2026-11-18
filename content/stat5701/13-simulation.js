(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l13', num: 13, minutes: 60,
    title: 'Simulation methods',
    oneLiner: r`When the math is too hard, make the computer generate fake data thousands of times and **look at what happens**.`,
    leadsTo: 'Next: the theory that explains why averaging simulated (or real) data works.',
    bigPicture: {
      what: r`Up to now every answer came from a formula. This lecture is the alternative: **simulate**. Tell the computer the model, have it produce random data over and over, and measure the thing you care about. An average over many simulated runs approximates an expected value; a fraction of runs approximates a probability.

The lecture has three layers: (1) how computers produce random numbers from any distribution, (2) how to look at the output (histograms and density estimates), and (3) what you can do with it (solve hard probability questions, approximate integrals, and estimate uncertainty with the bootstrap).`,
      why: r`In data science most real questions have no closed-form answer. Simulation is how you check a method, estimate an error bar, or sanity-check a derivation. It also makes Lectures 14–15 concrete: you can **see** a sampling distribution by simulating it.`,
      remember: r`1. Everything starts from Uniform(0,1) random numbers. Other distributions are made by transforming them.
2. **Inverse transform**: plug a uniform \(u\) into the inverse cdf, \(x=F^{-1}(u)\).
3. **Bootstrap**: resample your own data with replacement, many times, to see how much a statistic wobbles.`
    },
    sections: [
      { id: 's-why', title: 'Why and how to simulate', summary: 'The general recipe.', concepts: [
        { id: 'recipe', title: 'The simulation recipe',
          plain: r`Suppose you want to know how well some procedure (an estimator, a test, a confidence interval) works.

1. Pick a model for the data.
2. Generate a fake dataset of size \(n\) from it.
3. Apply your procedure and write down the result.
4. Repeat steps 2–3 many times (\(R\) replicates).
5. Study the pile of results: its average, its spread, its histogram.

Use exact math when it exists. Simulate when it does not.`,
          watch: r`A simulation only answers the case you ran. Change \(n\) or the variance and you have to run it again. A formula covers all cases at once.`,
          formal: r`Define the problem and choose a model for your random data. Simulate a dataset according to the model for a given sample size n. Apply the recipe (estimator, CI, hypothesis…). Repeat the sampling many times, which we call the number of replicates R. Study the distributions of parameter estimates. Disadvantage: generalization can be hard.` },
        { id: 'prng', title: 'Where random numbers come from (and what a seed is)',
          plain: r`Computers cannot be truly random. They run a formula that takes the last number and produces the next one, in a way that **looks** random. A common formula: multiply, add, then keep the remainder after dividing by a big number.

The starting number is the **seed**. Same seed, same sequence, every time. Set a seed when you want your results to be reproducible. Leave it unset to see different randomness each run.`,
          formula: r`\[ x_{\text{next}}=(a\,x+b)\bmod m,\qquad u=\frac{x_{\text{next}}}{m}\in[0,1) \]`,
          example: r`Python: <code>rng = np.random.default_rng(seed=42)</code> then <code>rng.normal(loc=0, scale=1, size=5)</code>. R: <code>set.seed(123)</code>.` },
      ]},
      { id: 's-gen', title: 'Generating any distribution from uniforms', summary: 'Inverse transform, Box–Muller, accept–reject.', concepts: [
        { id: 'inverse', title: 'Inverse transform sampling',
          plain: r`The cdf \(F\) turns a value \(x\) into a probability between 0 and 1. Run it backwards: start with a random probability \(u\) (a uniform number) and ask "which \(x\) has this much area to its left?" That \(x\) follows the distribution you wanted.

Recipe: (1) write \(u=F(x)\), (2) solve for \(x\), (3) feed in uniform random \(u\)'s.`,
          formula: r`\[ U\sim U(0,1),\quad X=F^{-1}(U)\ \Rightarrow\ X\text{ has cdf }F \]`,
          example: r`Exponential with rate \(\lambda\): \(u=1-e^{-\lambda x}\Rightarrow x=-\dfrac{\ln(1-u)}{\lambda}\).

Since \(1-u\) is also uniform, \(x=-\ln(u)/\lambda\) works too. That is why <code>-log(runif(n))</code> gives Exponential(1) numbers.`,
          watch: r`You need a formula for \(F^{-1}\). The Normal does not have one, which is why other methods exist (though software approximates it very well: <code>qnorm(runif(n))</code> behaves like <code>rnorm(n)</code>).`,
          formal: r`Why does this work? Let \(u\sim U(0,1)\) and \(X=F^{-1}(u)\). Then \(P(X\le x)=P(F^{-1}(u)\le x)=P(u\le F(x))=F(x)\).` },
        { id: 'boxmuller', title: 'Box–Muller: two uniforms in, two Normals out',
          plain: r`A dedicated formula for making standard Normals. Take two independent uniforms; one sets a random distance from the origin, the other a random angle. The two coordinates you land on are independent \(N(0,1)\) values.`,
          formula: r`\[ Z_1=\sqrt{-2\ln U_1}\,\cos(2\pi U_2),\qquad Z_2=\sqrt{-2\ln U_1}\,\sin(2\pi U_2) \]`,
          formal: r`The Marsaglia polar method is an optimized Box–Muller that avoids sin and cos by generating points in a unit disk using rejection sampling.` },
        { id: 'ar', title: 'Accept–reject sampling',
          plain: r`For when you cannot invert the cdf. Idea: propose values from an **easy** distribution \(g\), then randomly keep or discard each one so that what survives follows the **target** \(f\).

Picture throwing darts uniformly under a box that covers the target curve. Keep only the darts that land under the curve. The x-positions of the kept darts follow \(f\).

1. Find a constant \(c\) with \(f(x)\le c\,g(x)\) everywhere.
2. Draw a candidate \(y\) from \(g\) and a uniform \(u\).
3. If \(u\le\dfrac{f(y)}{c\,g(y)}\), accept \(y\). Otherwise throw it away and repeat.

On average a fraction \(1/c\) of candidates is accepted, so you want \(c\) as small as possible.`,
          formula: r`\[ \text{accept } y \iff u\le\frac{f(y)}{c\,g(y)},\qquad c\ge\sup_x\frac{f(x)}{g(x)},\qquad P(\text{accept})=\frac1c \]`,
          example: r`Target \(f(x)=6x(1-x)\) on \([0,1]\), proposal \(g=\) Uniform(0,1). The peak of \(f\) is \(f(0.5)=1.5\), so \(c=1.5\).

Candidate \(y=0.8\): ratio \(=\dfrac{6(0.8)(0.2)}{1.5}=0.64\). If \(u=0.42\) accept; if \(u=0.75\) reject. Overall acceptance rate \(=1/1.5=66.7\%\).` },
      ]},
      { id: 's-look', title: 'Looking at simulated data', summary: 'Histograms and smoothed density estimates.', concepts: [
        { id: 'hist', title: 'Histogram as an estimate of the pdf',
          plain: r`Chop the x-axis into bins, count how many data points fall into each, and draw bars. To make the bars comparable to a density curve (total area 1), divide each count by \(n\times\) bin width.

The bin width matters. Too many narrow bins: jagged noise (overfitting). Too few wide bins: all detail blurred away (underfitting).`,
          formula: r`\[ \hat f(x)=\frac{\nu_k}{n\,h}\quad\text{for }x\text{ in bin }k \qquad(\nu_k=\text{count in bin},\ h=\text{bin width}) \]`,
          example: r`\(n=200\) points, bin width \(h=0.5\), 30 points in a bin. Height \(=\dfrac{30}{200\times0.5}=0.3\).` },
        { id: 'bins', title: 'How many bins? Sturges and Scott',
          plain: r`Two rules of thumb. **Sturges** gives a number of bins: \(1+\log_2 n\). It is the default in R and Python. **Scott** gives a bin width based on how spread out the data is.`,
          formula: r`\[ \text{Sturges: } \#\text{bins}=1+\log_2 n,\quad h=\frac{\text{range}}{1+\log_2n} \qquad\qquad \text{Scott: } \hat h=3.49\,\hat\sigma\,n^{-1/3} \]` },
        { id: 'kde', title: 'Kernel density estimate (KDE): a smooth histogram',
          plain: r`Instead of stacking data into boxes, put a small smooth bump (the **kernel**) on top of every data point and add the bumps up. You get a smooth curve with no dependence on where bin edges fall. The **bandwidth** \(h\) plays the role of bin width: small \(h\) is wiggly, large \(h\) is oversmoothed.`,
          formula: r`\[ \hat f(x;h)=\frac1{nh}\sum_{i=1}^nK\!\left(\frac{x-X_i}h\right) \]` },
      ]},
      { id: 's-use', title: 'What simulation is good for', summary: 'Hard probability questions, integrals, and uncertainty.', concepts: [
        { id: 'solve', title: 'Solving probability problems by brute force',
          plain: r`Translate the story into code that generates one outcome. Run it 10,000 times. The **average** of the outcomes estimates an expected value. The **fraction** of runs where something happened estimates its probability.`,
          example: r`Fraser's dolphin trips: \(Y\) = working days between bad-weather days (Geometric, \(p=0.2\)), and given \(Y\), customers \(X\sim\text{Poisson}(25Y)\).

<code>y = rgeom(10000, prob=0.2); x = rpois(10000, lambda=25*y); mean(x); var(x)</code>

Output ≈ 100.2 and ≈ 12,466. Exact answers: \(E(X)=\dfrac{\mu(1-p)}p=100\) and \(\text{Var}(X)=\dfrac{\mu(1-p)(p+\mu)}{p^2}=12{,}600\).`,
          watch: r`R's <code>rgeom</code> counts **failures before** the first success (0, 1, 2, …), with mean \((1-p)/p\). The Geometric in Lecture 10 counts the **trial of** the first success (1, 2, 3, …), with mean \(1/p\). They differ by exactly 1.` },
        { id: 'mc', title: 'Monte Carlo integration',
          plain: r`An integral can be rewritten as an average, and averages can be estimated by sampling. Draw random points \(X_i\) from some density \(f\), compute \(g(X_i)/f(X_i)\) for each, and take the mean. By the Law of Large Numbers (next lecture) the mean converges to the integral.

Simplest case: to estimate \(\int_0^1 g(x)\,dx\), average \(g\) at uniform random points.`,
          formula: r`\[ J=\int_a^bg(x)\,dx=E\!\left[\frac{g(X)}{f(X)}\right]\approx\frac1n\sum_{i=1}^n\frac{g(X_i)}{f(X_i)},\qquad X_i\sim f \]` },
        { id: 'boot', title: 'The bootstrap',
          plain: r`You computed a statistic (say a median) from your one dataset. How much would it change with a different sample? You cannot go collect more samples, so you fake it: treat your data as the population and **resample from it with replacement**.

1. Draw \(n\) rows from your \(n\) rows, with replacement (some repeat, some are left out).
2. Compute the statistic on that resample.
3. Repeat \(B\) times.
4. The standard deviation of those \(B\) values is your estimated standard error.

It shines when no formula for the standard error exists, as with the median.`,
          formula: r`\[ \widehat{\text{Var}}[S(Z)]=\frac1{B-1}\sum_{b=1}^B\big(S(Z^{*b})-\bar S^*\big)^2 \]`,
          watch: r`Limits: it breaks dependent data such as time series (needs "block" bootstrap), it cannot invent values you never observed (weak for small samples), and it is computationally heavy.`,
          formal: r`The basic idea is to randomly draw datasets with replacement from the training data, each sample the same size as the original training set. This is done B times, producing B bootstrap datasets. Then we refit the model to each of the bootstrap datasets and examine the behavior of the fits over the B replications.` },
        { id: 'bagging', title: 'Bagging: the bootstrap inside random forests',
          plain: r`"Bootstrap aggregating". Train many models, each on its own bootstrap resample of the training data, and average their predictions. Averaging cancels noise, so variance drops a lot without adding bias. The rows a given tree never saw (its "out-of-bag" rows) act as a free validation set.` },
      ]},
    ],
    sheet: [
      { title: 'Simulation toolkit', cols: ['Method', 'What it does', 'Key formula'], rows: [
        ['Linear congruential generator', 'makes pseudo-random uniforms', r`\(x\leftarrow(ax+b)\bmod m\)`],
        ['Inverse transform', 'uniform → any distribution with invertible cdf', r`\(X=F^{-1}(U)\)`],
        ['Exponential via inverse', '', r`\(X=-\ln(U)/\lambda\)`],
        ['Box–Muller', '2 uniforms → 2 standard Normals', r`\(\sqrt{-2\ln U_1}\cos(2\pi U_2)\), same with \(\sin\)`],
        ['Accept–reject', r`sample \(f\) using easy proposal \(g\)`, r`accept if \(u\le\frac{f(y)}{c\,g(y)}\); rate \(=1/c\)`],
        ['Histogram density', 'bar height', r`\(\nu_k/(nh)\)`],
        ['Sturges', 'number of bins', r`\(1+\log_2n\)`],
        ['Scott', 'bin width', r`\(3.49\,\hat\sigma\,n^{-1/3}\)`],
        ['KDE', 'smooth density', r`\(\frac1{nh}\sum K\!\left(\frac{x-X_i}h\right)\)`],
        ['Monte Carlo integral', 'integral as an average', r`\(\frac1n\sum\frac{g(X_i)}{f(X_i)}\)`],
        ['Bootstrap SE', 'SD of statistic over B resamples', 'resample n rows with replacement'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'prng', q: r`A toy generator uses \(x_{\text{next}}=(5x+3)\bmod16\) with seed \(x_0=7\). What is \(x_2\) (the second number generated)?`, answer: 1, tol: 0.001,
        hint: 'Apply the rule twice. "mod 16" means the remainder after dividing by 16.', solution: r`\(x_1=(35+3)\bmod16=38\bmod16=6\). \(x_2=(30+3)\bmod16=33\bmod16=1\).` },
      { id: 'q2', type: 'mcq', concept: 'prng', q: r`You run the same simulation twice with <code>set.seed(123)</code> at the top each time. What happens?`, choices: ['Different results, because the numbers are random', 'Identical results both times', 'An error on the second run', 'Results differ only in the last decimal'], answer: 1,
        hint: 'The seed is the starting point of a deterministic formula.', solution: r`Same seed → same sequence of pseudo-random numbers → identical results. That is the point of setting a seed.` },
      { id: 'q3', type: 'num', concept: 'inverse', q: r`Generate an Exponential(\(\lambda=2\)) value by inverse transform using \(x=-\ln(1-u)/\lambda\) with \(u=0.3\).`, answer: 0.1783,
        hint: r`\(\ln(0.7)\approx-0.3567\).`, solution: r`\(x=-\ln(0.7)/2=0.3567/2=0.1783\).` },
      { id: 'q4', type: 'num', concept: 'inverse', q: r`A variable on \([0,1]\) has cdf \(F(x)=x^2\). Using inverse transform with \(u=0.49\), what value of \(x\) do you generate?`, answer: 0.7,
        hint: r`Solve \(u=x^2\) for \(x\).`, solution: r`\(x=\sqrt u=\sqrt{0.49}=0.7\).` },
      { id: 'q5', type: 'mcq', concept: 'ar', q: r`Accept–reject with target \(f(x)=2x\) on \([0,1]\) and a uniform proposal. You choose \(c=2\) (the peak of \(f\)). The candidate is \(y=0.3\) and the uniform draw is \(u=0.4\). What happens?`, choices: [r`Accept, because \(0.4>0.3\)`, r`Reject, because \(0.4>0.3\)`, r`Accept, because \(0.4<0.6\)`, r`Reject, because \(0.3<0.5\)`], answer: 1,
        hint: r`Ratio \(=f(y)/(c\,g(y))\); accept only if \(u\) is below it.`, solution: r`Ratio \(=\dfrac{2(0.3)}{2\times1}=0.3\). Since \(u=0.4>0.3\), **reject**. (Overall acceptance rate would be \(1/c=50\%\).)` },
      { id: 'q6', type: 'num', concept: 'ar', q: r`You run accept–reject with bounding constant \(c=2.5\). What fraction of candidates do you expect to accept?`, answer: 0.4,
        hint: r`\(1/c\).`, solution: r`\(1/2.5=0.4\).` },
      { id: 'q7', type: 'num', concept: 'bins', q: r`By Sturges's rule, how many histogram bins for \(n=1024\) observations?`, answer: 11, tol: 0.01,
        hint: r`\(\log_2 1024=10\).`, solution: r`\(1+\log_2(1024)=1+10=11\).` },
      { id: 'q8', type: 'num', concept: 'hist', q: r`A density histogram has \(n=500\) points and bin width \(h=0.2\). One bin contains 40 points. How tall is its bar?`, answer: 0.4,
        hint: r`\(\nu_k/(nh)\).`, solution: r`\(40/(500\times0.2)=40/100=0.4\).` },
      { id: 'q9', type: 'num', concept: 'boxmuller', q: r`Box–Muller with \(U_1=e^{-2}\) and \(U_2=0.25\). What is \(Z_2=\sqrt{-2\ln U_1}\,\sin(2\pi U_2)\)?`, answer: 2, tol: 0.01,
        hint: r`\(\ln(e^{-2})=-2\) and \(\sin(\pi/2)=1\).`, solution: r`\(\sqrt{-2(-2)}=\sqrt4=2\). \(\sin(2\pi\cdot0.25)=\sin(\pi/2)=1\). So \(Z_2=2\).` },
      { id: 'q10', type: 'mcq', concept: 'mc', q: r`You want to estimate \(\int_0^1e^{x^2}dx\) by Monte Carlo. Which procedure is right?`, choices: [r`Draw \(U_i\sim U(0,1)\) and average \(e^{U_i^2}\)`, r`Draw \(U_i\sim U(0,1)\) and compute \(e^{(\text{average of }U_i)^2}\)`, r`Draw \(Z_i\sim N(0,1)\) and average \(e^{Z_i^2}\)`, r`Average the \(U_i\) and square the result`], answer: 0,
        hint: r`With \(f=1\) on \([0,1]\), the integral equals \(E[g(U)]\).`, solution: r`\(\int_0^1g(x)\cdot1\,dx=E[g(U)]\), estimated by \(\frac1n\sum g(U_i)\). Averaging first and then applying \(g\) gives a different (wrong) number.` },
      { id: 'q11', type: 'mcq', concept: 'boot', q: r`In one bootstrap resample of a dataset with \(n\) rows you draw…`, choices: [r`\(n\) rows without replacement`, r`\(n/2\) rows with replacement`, r`\(n\) rows with replacement`, r`\(B\) rows with replacement`], answer: 2,
        hint: 'Same size as the original. And if you drew without replacement, what would you get?', solution: r`\(n\) rows **with** replacement. Without replacement you would just get the original data back in a different order.` },
      { id: 'q12', type: 'num', concept: 'boot', q: r`A dataset has \(n=10\) rows. In one bootstrap resample, what is the probability that a particular row is **never** picked?`, answer: 0.3487,
        hint: 'Each of the 10 draws misses that row with probability 0.9.', solution: r`\((0.9)^{10}=0.3487\). For large \(n\) this approaches \(e^{-1}\approx0.368\): about a third of the rows are "out-of-bag" each time.` },
      { id: 'q13', type: 'self', concept: 'solve', q: r`A ferry operator has the same set-up as the dolphin example: \(Y\) = working days between bad-weather days (Geometric) with \(E(Y)=\dfrac{1-p}p\), and \(X\mid Y\sim\text{Poisson}(\mu Y)\). Here \(\mu=30\) passengers a day and \(p=0.25\). Find \(E(X)\) without simulating, and write the two lines of R you would use to check it.`,
        hint: r`Law of total expectation: \(E(X)=E[E(X\mid Y)]\).`,
        solution: r`\(E(X\mid Y)=30Y\), so \(E(X)=30\,E(Y)=30\times\dfrac{0.75}{0.25}=90\). Check: <code>y = rgeom(10000, prob=0.25); x = rpois(10000, lambda=30*y); mean(x)</code> should print about 90.` },
    ]
  });
})();
