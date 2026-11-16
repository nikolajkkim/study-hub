/* Course definition. Each lecture file calls COURSE.add({...}). */
(function () {
  const r = String.raw;
  window.COURSE = {
    code: 'STAT 5701',
    title: 'Probability and Statistics for Data Science',
    lectures: [],
    add(l) { this.lectures.push(l); this.lectures.sort((a, b) => a.num - b.num); },

    story: r`**Lectures 10–11** hand you a toolbox of named distributions: ready-made models for counts (Binomial, Poisson, Geometric…) and for measurements (Normal, Exponential, Gamma…). **Lecture 12** gives you the rules for combining random quantities: what happens to the average and the spread when you add or scale them. **Lecture 13** shows the computer shortcut: when the math is too hard, simulate. **Lecture 14** is the payoff of all that: averages of lots of data settle down (Law of Large Numbers) and look bell-shaped (Central Limit Theorem). **Lecture 15** flips the direction: instead of "given the model, what data do I expect?" it asks "given the data, which model fits best?" That is estimation, and Maximum Likelihood is the main way to do it.`,

    howTo: r`1. **Big picture** first: two minutes on what the lecture is for and how its pieces fit.
2. **Learn**: each idea is a card. The green box is the idea in plain words. The formula comes next. "How the slides say it" is there when you want to match it to the lecture notes.
3. **Cheat sheet**: the formulas in one table, for homework and exam prep.
4. **Practice**: questions with instant checking, hints and worked solutions. Missed ones stay flagged so you can retry.

Confused by anything? Highlight the text and press **Ask about this**, or use the Ask button on any card. The **Jargon decoder** translates every symbol.`,

    decoder: [
      { group: 'Reading the notation', items: [
        [r`\(X \sim \text{Binom}(n,p)\)`, '"X is distributed as…"', 'X is a random number whose behaviour follows that named model. The squiggle means "follows".'],
        [r`\(P(X = 3)\)`, '"probability X equals 3"', 'How likely it is that the random number comes out as 3.'],
        [r`\(p(x)\), pmf`, '"probability mass function"', 'For **counts**: the table/formula giving the chance of each exact value.'],
        [r`\(f(x)\), pdf`, '"probability density function"', 'For **measurements**: a curve. Area under it between two points = probability of landing there. The height itself is not a probability.'],
        [r`\(F(x)\), cdf`, '"cumulative distribution function"', r`Running total: \(F(x) = P(X \le x)\), the chance of being at or below x.`],
        [r`\(E(X)\), \(\mu\)`, '"expected value", "mu"', 'The long-run average. If you repeated the experiment forever and averaged the results, this is what you would get.'],
        [r`\(\text{Var}(X)\), \(\sigma^2\)`, '"variance", "sigma squared"', 'How spread out the values are: the average squared distance from the mean.'],
        [r`\(\sigma\), SD`, '"sigma", "standard deviation"', 'Square root of the variance. Spread, in the same units as the data.'],
        [r`\(q\)`, '"q"', r`Shorthand for \(1-p\): the chance of failure.`],
        [r`\(\binom{n}{k}\)`, '"n choose k"', r`Number of ways to pick k items out of n. \(\binom{n}{k} = \frac{n!}{k!(n-k)!}\).`],
        [r`\(\sum\), \(\prod\)`, '"sum of", "product of"', 'Add up all the terms / multiply all the terms.'],
        [r`\(\lfloor t \rfloor\) or \([t]\)`, '"floor of t"', 'Round down to a whole number.'],
        ['support', '"support"', 'The set of values the random variable can actually take.'],
        ['parameter', '', r`A dial on the model, like \(p\), \(\lambda\), \(\mu\), \(\sigma\). Fixed but usually unknown.`],
      ]},
      { group: 'Moments and generating functions', items: [
        [r`moment, \(\mu_k = E(X^k)\)`, '"k-th moment"', r`The average of \(X^k\). First moment = the mean. Second moment = average of \(X^2\).`],
        ['central moment', '', r`Same thing but measured from the mean: \(E[(X-\mu)^k]\). The 2nd central moment is the variance.`],
        [r`mgf, \(m_X(t)\)`, '"moment generating function"', r`\(E(e^{tX})\). A formula that stores all the moments: differentiate it k times, plug in \(t=0\), out comes \(E(X^k)\). Also works as a fingerprint for a distribution.`],
        [r`cgf, \(K_X(t)\) or \(l_X(t)\)`, '"cumulant generating function"', r`\(\ln m_X(t)\). First derivative at 0 = mean, second derivative at 0 = variance. A shortcut.`],
        [r`\(\Gamma(x)\)`, '"gamma of x"', r`The factorial stretched to non-whole numbers: \(\Gamma(n) = (n-1)!\).`],
        [r`\(\Phi(z)\)`, '"phi of z"', r`The standard normal cdf: \(P(Z \le z)\). Looked up in a z-table or with software.`],
        [r`\(Z\)`, '"Z"', r`A standard normal: mean 0, SD 1.`],
        [r`\(\nu\), df`, '"nu", "degrees of freedom"', 'The parameter of the chi-square distribution: how many squared normals were added.'],
      ]},
      { group: 'Several variables', items: [
        ['joint distribution', '', 'The probabilities for two variables at once: every combination of (x, y).'],
        ['marginal', '', 'The distribution of just one of them, obtained by adding up (or integrating out) the other.'],
        [r`\(E(Y \mid X = x)\)`, '"expected Y given X equals x"', 'The average of Y among only the cases where X is x.'],
        ['independent', '', 'Knowing one tells you nothing about the other. Formally: joint = product of marginals.'],
        [r`\(\text{Cov}(X,Y)\)`, '"covariance"', 'Do they move together? Positive: both tend to be high together. Zero: no linear link.'],
        [r`\(\rho_{XY}\)`, '"rho", "correlation"', 'Covariance rescaled to sit between −1 and 1, so it has no units.'],
        ['iid', '"eye-eye-dee"', 'Independent and identically distributed: every data point comes from the same model and none affects another.'],
      ]},
      { group: 'Samples, limits and estimation', items: [
        [r`\(\bar X\)`, '"X bar"', 'The sample mean: the average of your data.'],
        [r`\(\hat\theta\), \(\hat p\)`, '"theta hat", "p hat"', 'A hat means "my estimate of, computed from data". No hat = the true unknown value.'],
        ['statistic', '', 'Any number computed from the data (mean, max, proportion…). It is random, because the sample is.'],
        ['estimator', '', 'A statistic used as a guess for a parameter.'],
        ['sampling distribution', '', 'The distribution of a statistic across many hypothetical repeated samples. It tells you how much your estimate wobbles.'],
        ['standard error (SE)', '', r`The SD of an estimator. For the mean it is \(\sigma/\sqrt{n}\).`],
        [r`\(\xrightarrow{P}\)`, '"converges in probability"', 'As n grows, the chance of being far from the target shrinks to zero.'],
        [r`\(\xrightarrow{d}\)`, '"converges in distribution"', 'As n grows, the histogram of the quantity takes the shape of the target distribution.'],
        ['a.s.', '"almost surely"', 'A stronger version of "converges": it happens with probability 1.'],
        ['asymptotic', '', 'What is true when n is very large.'],
        ['bias', '', r`\(E(\hat\theta) - \theta\): how far off the estimator is on average. Zero = unbiased.`],
        ['consistent', '', 'With more and more data the estimator homes in on the truth.'],
        ['MSE', '"mean squared error"', r`Average squared miss, \(E[(\hat\theta-\theta)^2]\) = variance + bias².`],
        [r`\(L(\theta)\)`, '"likelihood"', 'How probable the data you actually saw would be if the parameter were θ.'],
        [r`\(l(\theta)\)`, '"log-likelihood"', 'The log of the likelihood. Same peak, easier algebra.'],
        ['score', '', r`The derivative of the log-likelihood. Set it to zero to find the MLE.`],
        [r`\(\arg\max\)`, '"arg max"', 'Not the maximum value, but the input where the maximum happens.'],
        [r`\(I\{\theta \le x\}\)`, '"indicator"', 'A switch: equals 1 when the condition is true, 0 when it is false.'],
        [r`\(\sup\)`, '"supremum"', 'Think "maximum" (the smallest ceiling that sits above everything).'],
        ['closed form', '', 'A tidy formula you can write down. "No closed form" = must be computed numerically.'],
        ['intractable', '', 'Too hard to do by hand.'],
        ['regularity conditions', '', 'Fine print: technical assumptions that hold for all the normal cases you will meet.'],
      ]},
    ]
  };
})();
