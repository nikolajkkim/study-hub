(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l15', num: 15, minutes: 70,
    title: 'Maximum Likelihood Estimation',
    oneLiner: r`Given data, find the parameter value that makes that data **most probable**.`,
    bigPicture: {
      what: r`Until now you were handed the model, parameters and all ("\(X\sim\text{Exp}(2)\)") and asked about the data. Real life runs the other way: you have the data and the parameter is unknown. **Estimation** is making a good guess for it.

This lecture does two things. First it defines what "good guess" means (bias, consistency, mean squared error). Then it gives a general-purpose method for producing guesses: **Maximum Likelihood**. Write down how probable your observed data is as a function of the unknown parameter, and choose the parameter value that makes it largest.`,
      why: r`MLE is the default way models are fitted, from simple distributions through logistic regression to neural networks (minimising cross-entropy loss is maximising a likelihood). The mechanics are always the same four steps, so once you can do it for the Exponential you can do it for anything.`,
      remember: r`1. Likelihood = the joint pdf of the data, read as a function of \(\theta\). Because the data is independent, it is a **product**.
2. Recipe: product → take log (becomes a sum) → differentiate → set to 0 → solve.
3. If the allowed range of \(x\) depends on \(\theta\), calculus fails. Look at the boundary instead: the answer is a min or max of the data.`
    },
    sections: [
      { id: 's-est', title: 'What makes an estimator good', summary: 'Bias, consistency, mean squared error.', concepts: [
        { id: 'estimator', title: 'Point estimator',
          plain: r`An **estimator** is any formula that turns your data into a single guess for the unknown parameter \(\theta\). It wears a hat: \(\hat\theta\). The sample mean \(\bar X\) is an estimator of \(\mu\). Because it is computed from random data, an estimator is itself random and has its own mean and variance.`,
          formula: r`\[ \hat\theta_n=g(X_1,\dots,X_n) \]` },
        { id: 'bias', title: 'Bias and unbiasedness',
          plain: r`Imagine using your estimator on many different samples. **Bias** is how far the average of all those guesses is from the truth. Zero bias ("unbiased") means it is right on average: it does not systematically aim too high or too low.`,
          formula: r`\[ \text{Bias}(\hat\theta)=E(\hat\theta)-\theta \qquad \text{unbiased}\iff E(\hat\theta)=\theta \]`,
          example: r`\(E(\bar X)=\mu\), so \(\bar X\) is an unbiased estimator of \(\mu\).` },
        { id: 'consistent', title: 'Consistency',
          plain: r`An estimator is **consistent** if it homes in on the true value as you collect more and more data. This is the Law of Large Numbers idea applied to estimators. \(\bar X\) is consistent for \(\mu\), precisely because of the LLN.`,
          formula: r`\[ \hat\theta_n\xrightarrow{P}\theta\quad\text{as }n\to\infty \]`,
          watch: r`Unbiased and consistent are different. Unbiased: right on average at a fixed \(n\). Consistent: gets arbitrarily close as \(n\) grows. An estimator can be biased yet consistent (the bias fades with \(n\)).` },
        { id: 'mse', title: 'Mean squared error and the bias–variance trade-off',
          plain: r`MSE is the average squared distance between your guess and the truth. It splits neatly into two sources of error: **variance** (the guess jumps around from sample to sample) and **bias squared** (it aims at the wrong spot).

Consequence: an estimator with a little bias but much less variance can have a smaller MSE than an unbiased one. Being unbiased is not everything.`,
          formula: r`\[ \text{MSE}(\hat\theta)=E\big[(\hat\theta-\theta)^2\big]=\text{Var}(\hat\theta)+\big[\text{Bias}(\hat\theta)\big]^2 \]`,
          example: r`Darts: unbiased with high variance = scattered all over but centred on the bullseye. Slightly biased with low variance = a tight cluster a little off-centre. The tight cluster often scores better.` },
      ]},
      { id: 's-tools', title: 'Math you need for MLE', summary: 'Finding a maximum, and log rules.', concepts: [
        { id: 'extrema', title: 'Finding a maximum with calculus',
          plain: r`A smooth function is flat at its peak, so: take the derivative, set it to zero, solve. Then check it is a peak and not a valley: the second derivative should be **negative** there.`,
          formula: r`\[ f'(x_0)=0\ \text{and}\ f''(x_0)<0\ \Rightarrow\ \text{max} \qquad f''(x_0)>0\ \Rightarrow\ \text{min} \]`,
          example: r`\(f(x)=-3x^4+16x^3+1\). \(f'(x)=-12x^2(x-4)=0\) at \(x=0\) and \(x=4\). \(f''(4)=-192<0\): maximum at \(x=4\). \(f''(0)=0\): inconclusive, and since \(f'''(0)=96\ne0\) it is an inflection point.`,
          watch: r`If the maximum sits at the edge of the allowed range, the derivative need not be zero there. This matters in the "support depends on θ" examples below.` },
        { id: 'logs', title: 'Log rules: products become sums',
          plain: r`The log turns multiplication into addition and powers into multiplication. That is exactly what you want when the likelihood is a product of \(n\) terms.`,
          formula: r`\[ \log(xy)=\log x+\log y \qquad \log\Big(\prod x_i\Big)=\sum\log x_i \qquad \log(x^y)=y\log x \qquad \log(e^x)=x \]`,
          watch: r`In this course "log" means natural log (\(\ln\)).` },
      ]},
      { id: 's-mle', title: 'The likelihood method', summary: 'Definition, recipe and the standard examples.', concepts: [
        { id: 'lik', title: 'The likelihood function',
          plain: r`You have observed data \(x_1,\dots,x_n\). For any candidate value of \(\theta\), ask: "if this were the true \(\theta\), how probable would my data be?" That number, viewed as a function of \(\theta\), is the **likelihood**. Since the observations are independent, it is the product of the individual pdfs (or pmfs).

Same formula as a joint pdf, different viewpoint: the data is now fixed and \(\theta\) is the variable.`,
          formula: r`\[ L(\theta)=f(x_1,\dots,x_n;\theta)=\prod_{i=1}^nf(x_i;\theta) \]`,
          formal: r`Suppose \(X_1,\dots,X_n\) is a random sample from a model \(f(x;\theta)\), where the pdf depends on the unknown parameter \(\theta\). The likelihood function of \(\theta\) is the joint pdf of \(X_1,\dots,X_n\).` },
        { id: 'mle', title: 'The MLE and the log-likelihood',
          plain: r`The **maximum likelihood estimate** is the \(\theta\) with the highest likelihood: the value under which what you actually saw is least surprising.

Maximising a product is messy, so maximise its log instead. The log is an increasing function, so \(L\) and \(\log L\) peak at the same \(\theta\). The derivative of the log-likelihood has a name, the **score**; the MLE is usually where the score equals zero.`,
          formula: r`\[ \hat\theta_{MLE}=\arg\max_\theta L(\theta) \qquad l(\theta)=\log L(\theta) \qquad s(\theta)=\frac{\partial l(\theta)}{\partial\theta}=0 \]`,
          widget: 'lik' },
        { id: 'recipe', title: 'The four-step recipe',
          plain: r`1. **Likelihood**: multiply the pdf over all data points. Collect like terms.
2. **Log**: take the log. Products become sums, exponents come down.
3. **Differentiate** with respect to the parameter and set equal to 0.
4. **Solve** for the parameter. (Check the second derivative is negative.)`,
          example: r`Exponential, data with mean \(\bar x=168.3\):

\(L(\lambda)=\prod\lambda e^{-\lambda x_i}=\lambda^ne^{-\lambda\sum x_i}\)

\(l(\lambda)=n\log\lambda-\lambda\sum x_i\)

\(l'(\lambda)=\dfrac n\lambda-\sum x_i=0\)

\(\hat\lambda=\dfrac{n}{\sum x_i}=\dfrac1{\bar x}=\dfrac1{168.3}=0.00594\). And \(l''(\lambda)=-n/\lambda^2<0\), so it is a maximum.` },
        { id: 'mle-bern', title: 'Bernoulli and Poisson: the MLE is the sample mean',
          plain: r`For yes/no data, the MLE of the success probability is the observed fraction of successes. For Poisson counts, the MLE of the rate is the average count. Both are exactly what common sense suggests, which is reassuring: MLE formalises intuition.`,
          formula: r`\[ \text{Bernoulli: }\ l(p)=\sum x_i\log p+\sum(1-x_i)\log(1-p)\ \Rightarrow\ \hat p=\bar x \qquad\qquad \text{Poisson: }\ \hat\lambda=\bar x \]`,
          example: r`Bernoulli steps: \(l'(p)=\dfrac{\sum x_i}{p}-\dfrac{n-\sum x_i}{1-p}=0\Rightarrow(1-p)\sum x_i=p\,(n-\sum x_i)\Rightarrow\sum x_i=np\Rightarrow\hat p=\dfrac{\sum x_i}n\).` },
        { id: 'mle-normal', title: 'Normal: two parameters at once',
          plain: r`With two unknowns (\(\mu\) and \(\sigma^2\)) take a partial derivative with respect to each, set both to zero, and solve the pair of equations. The results: the MLE of \(\mu\) is the sample mean, and the MLE of \(\sigma^2\) is the average squared deviation from the sample mean.`,
          formula: r`\[ l(\mu,\sigma^2)=-\frac n2\log(2\pi)-\frac n2\log\sigma^2-\sum\frac{(x_i-\mu)^2}{2\sigma^2} \qquad\Rightarrow\qquad \hat\mu=\bar x,\quad \hat\sigma^2=\frac1n\sum(x_i-\bar x)^2 \]`,
          watch: r`The MLE of \(\sigma^2\) divides by \(n\), not \(n-1\). That makes it slightly biased (too small on average), but it is consistent. The slides leave this solution blank; this is the standard result.`,
          formal: r`With a vector of parameters \(\theta=(\theta_1,\dots,\theta_m)\), the score is the gradient vector \(s(\theta)=\nabla_\theta l(\theta)\) and the matrix of second derivatives \(H(\theta)=\left[\frac{\partial^2}{\partial\theta_i\partial\theta_j}l(\theta)\right]\) is the Hessian.` },
      ]},
      { id: 's-edge', title: 'When calculus does not work', summary: 'The parameter controls where the data can fall.', concepts: [
        { id: 'boundary', title: 'Support depends on θ: the answer is at the boundary',
          plain: r`Sometimes \(\theta\) appears in the **range** of allowed \(x\) values, like \(0\le x\le\theta\). Then setting the derivative to zero gives nonsense. Instead:

1. Write down what the data forces \(\theta\) to satisfy (every observation must be in the allowed range).
2. Check whether the likelihood goes up or down as \(\theta\) moves.
3. Push \(\theta\) as far as the constraint allows in the "up" direction.`,
          example: r`**Uniform(0, θ)**: \(L(\theta)=\dfrac1{\theta^n}\), valid only when \(\theta\ge\) every \(x_i\). \(L\) is decreasing in \(\theta\), so make \(\theta\) as small as allowed: \(\hat\theta=\max(X_1,\dots,X_n)\).

The slide's Example 4, \(f(x;\theta)=\dfrac{2x}{1-\theta^2}\) on \(\theta\le x\le1\): \(L(\theta)=\dfrac{2^n\prod x_i}{(1-\theta^2)^n}\), valid only when \(\theta\le\) every \(x_i\). \(L\) is increasing in \(\theta\), so make \(\theta\) as large as allowed: \(\hat\theta=\min(X_1,\dots,X_n)\).`,
          formal: r`\(f(x;\theta)=\frac{2x}{1-\theta^2}I\{\theta\le x\}\). This means \(\theta\in(0,\min(X_1,\dots,X_n)]\) and \(l(\theta)\) is an increasing function over that domain, so its global max is achieved at the right endpoint of the interval.` },
        { id: 'maxdist', title: 'Distribution of the maximum (and minimum)',
          plain: r`To study an estimator like \(\max(X_i)\) you need its distribution. The trick: the maximum is below \(x\) exactly when **every** observation is below \(x\). Independence turns that into a product.`,
          formula: r`\[ P(\max\le x)=[F(x)]^n \qquad g_{\max}(x)=n\,f(x)\,[F(x)]^{n-1} \qquad P(\min>x)=[1-F(x)]^n \]`,
          example: r`For \(U(0,\theta)\): \(F(x)=x/\theta\), so the max has pdf \(\dfrac{n\,x^{n-1}}{\theta^n}\) and \(E(\max)=\dfrac{n}{n+1}\theta\).

So \(\hat\theta=\max(X_i)\) is **biased** (a bit too small on average, which makes sense since the largest observation can never exceed \(\theta\)) but **consistent**, because \(\dfrac n{n+1}\to1\).` },
      ]},
      { id: 's-props', title: 'Properties of MLEs', summary: 'Why MLE is the default method.', concepts: [
        { id: 'invariance', title: 'Invariance: transform the estimate, done',
          plain: r`Need the MLE of some function of the parameter? Apply that function to the MLE you already have. No new derivation.`,
          formula: r`\[ \widehat{h(\theta)}_{MLE}=h\big(\hat\theta_{MLE}\big) \]`,
          example: r`Normal: \(\hat\sigma^2=\frac1n\sum(x_i-\bar x)^2\), so \(\hat\sigma=\sqrt{\frac1n\sum(x_i-\bar x)^2}\).

Exponential: \(\hat\lambda=1/\bar x\), so the MLE of the mean \(1/\lambda\) is \(\bar x\).` },
        { id: 'mle-good', title: 'Consistency and approximate Normality',
          plain: r`Under mild technical conditions, MLEs are **consistent**: with enough data they converge to the true parameter. They are also approximately **Normal** for large \(n\), a generalisation of the CLT (details next semester). These two facts are why MLE is trusted as a default.`,
          formula: r`\[ \hat\theta_{MLE}\xrightarrow{P}\theta \]` },
        { id: 'numeric', title: 'No closed form: the Gamma example',
          plain: r`Sometimes the "set derivatives to zero" equations cannot be solved with algebra. For \(\Gamma(r,\lambda)\), one equation gives \(\lambda=r/\bar x\) cleanly, but the other involves \(\Gamma'(r)/\Gamma(r)\) and has no tidy solution. In that case the computer finds the maximum numerically. The principle is unchanged; only the last step is done by an optimiser.`,
          formula: r`\[ \frac{\partial l}{\partial\lambda}=\frac{nr}\lambda-\sum x_i=0\ \Rightarrow\ \lambda=\frac r{\bar x} \qquad\quad n\log\frac r{\bar x}-n\frac{\Gamma'(r)}{\Gamma(r)}+\sum\log x_i=0\ \ (\text{solve numerically}) \]` },
      ]},
    ],
    sheet: [
      { title: 'MLEs to know', cols: ['Model', 'Log-likelihood', 'MLE'], rows: [
        [r`Bernoulli(\(p\))`, r`\(\sum x_i\log p+(n-\sum x_i)\log(1-p)\)`, r`\(\hat p=\bar x\)`],
        [r`Poisson(\(\lambda\))`, r`\(\sum x_i\log\lambda-n\lambda-\sum\log x_i!\)`, r`\(\hat\lambda=\bar x\)`],
        [r`Exponential(\(\lambda\))`, r`\(n\log\lambda-\lambda\sum x_i\)`, r`\(\hat\lambda=1/\bar x\)`],
        [r`Normal(\(\mu,\sigma\))`, r`\(-\frac n2\log(2\pi\sigma^2)-\frac{\sum(x_i-\mu)^2}{2\sigma^2}\)`, r`\(\hat\mu=\bar x,\ \hat\sigma^2=\frac1n\sum(x_i-\bar x)^2\)`],
        [r`Uniform(\(0,\theta\))`, r`\(-n\log\theta\) for \(\theta\ge\max x_i\)`, r`\(\hat\theta=\max x_i\)`],
        [r`\(\frac{2x}{1-\theta^2},\ \theta\le x\le1\)`, r`increasing in \(\theta\) for \(\theta\le\min x_i\)`, r`\(\hat\theta=\min x_i\)`],
        [r`Gamma(\(r,\lambda\))`, r`\(nr\log\lambda-n\log\Gamma(r)+(r-1)\sum\log x_i-\lambda\sum x_i\)`, r`\(\hat\lambda=\hat r/\bar x\); \(\hat r\) numeric`],
      ]},
      { title: 'Definitions', cols: ['Term', 'Formula'], rows: [
        ['Bias', r`\(E(\hat\theta)-\theta\)`],
        ['Consistent', r`\(\hat\theta_n\xrightarrow{P}\theta\)`],
        ['MSE', r`\(E[(\hat\theta-\theta)^2]=\text{Var}(\hat\theta)+\text{Bias}^2\)`],
        ['Likelihood', r`\(L(\theta)=\prod f(x_i;\theta)\)`],
        ['Score', r`\(s(\theta)=\partial l/\partial\theta\)`],
        ['Invariance', r`MLE of \(h(\theta)\) is \(h(\hat\theta)\)`],
        ['Max of n iid', r`cdf \([F(x)]^n\), pdf \(nf(x)[F(x)]^{n-1}\)`],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'recipe', q: r`Waiting times 2, 4 and 6 minutes are observed from an \(\text{Exp}(\lambda)\) model. What is the MLE of \(\lambda\)?`, answer: 0.25,
        hint: r`\(\hat\lambda=1/\bar x\).`, solution: r`\(\bar x=4\), so \(\hat\lambda=1/4=0.25\).` },
      { id: 'q2', type: 'num', concept: 'mle-bern', q: r`In 20 independent trials you observe 7 successes. What is the MLE of \(p\)?`, answer: 0.35,
        hint: 'Sample proportion.', solution: r`\(\hat p=\bar x=7/20=0.35\).` },
      { id: 'q3', type: 'num', concept: 'mle-bern', q: r`Counts 3, 1, 4, 0, 2 are observed from a Poisson(\(\lambda\)) model. What is the MLE of \(\lambda\)?`, answer: 2, tol: 0.01,
        hint: 'For a Poisson the MLE is the sample mean.', solution: r`\(\hat\lambda=\bar x=10/5=2\).` },
      { id: 'q4', type: 'num', concept: 'mle-normal', q: r`Data 2, 4, 6 from a Normal model. What is the MLE of \(\sigma^2\)?`, answer: 8 / 3, show: '8/3 ≈ 2.667',
        hint: r`Divide by \(n\), not \(n-1\).`, solution: r`\(\bar x=4\). Squared deviations: \(4,0,4\). \(\hat\sigma^2=8/3=2.667\).` },
      { id: 'q5', type: 'num', concept: 'boundary', q: r`Data 1.2, 3.7, 2.9 from \(U(0,\theta)\). What is the MLE of \(\theta\)?`, answer: 3.7, tol: 0.01,
        hint: r`\(\theta\) must be at least as large as every observation, and the likelihood \(1/\theta^n\) wants \(\theta\) small.`, solution: r`\(\hat\theta=\max(x_i)=3.7\).` },
      { id: 'q6', type: 'num', concept: 'maxdist', q: r`For \(n=3\) observations from \(U(0,\theta)\) with true \(\theta=4\), what is the expected value of the MLE \(\max(X_i)\)?`, answer: 3, tol: 0.01,
        hint: r`\(E(\max)=\dfrac n{n+1}\theta\).`, solution: r`\(\tfrac34\times4=3\). The bias is \(3-4=-1\): it underestimates on average.` },
      { id: 'q7', type: 'num', concept: 'mse', q: r`An estimator has variance 2 and bias 0.5. What is its MSE?`, answer: 2.25,
        hint: r`Variance + bias².`, solution: r`\(2+0.5^2=2.25\).` },
      { id: 'q8', type: 'mcq', concept: 'mse', q: r`Estimator A is unbiased with variance 9. Estimator B has bias 1 and variance 4. Which has the smaller MSE?`, choices: ['A, because it is unbiased', 'B', 'They are equal', 'Cannot tell without the data'], answer: 1,
        hint: 'Compute both MSEs.', solution: r`\(\text{MSE}(A)=9+0=9\). \(\text{MSE}(B)=4+1=5\). B wins despite being biased: the bias–variance trade-off.` },
      { id: 'q9', type: 'mcq', concept: 'mle', q: r`Why do we maximise the log-likelihood instead of the likelihood?`, choices: ['The log-likelihood has a different, better maximiser', r`Logs turn the product into a sum, which is easier to differentiate, and the maximiser is the same`, 'The likelihood can be negative', 'It makes the estimator unbiased'], answer: 1,
        hint: 'What does log do to a product? Does an increasing transformation move the location of a peak?', solution: r`\(\log\) is strictly increasing, so \(L\) and \(\log L\) peak at the same \(\theta\). The log just makes the algebra manageable.` },
      { id: 'q10', type: 'mcq', concept: 'boundary', q: r`For \(f(x;\theta)=\dfrac{2x}{1-\theta^2}\) on \(\theta\le x\le1\), the MLE of \(\theta\) is…`, choices: [r`\(\bar X\)`, r`\(\max(X_i)\)`, r`\(\min(X_i)\)`, r`\(1/\bar X\)`], answer: 2,
        hint: r`\(\theta\) must be \(\le\) every observation, and \(L(\theta)\) increases with \(\theta\).`, solution: r`The constraint is \(\theta\le\min(X_i)\). \(L(\theta)\propto(1-\theta^2)^{-n}\) grows as \(\theta\) grows, so take the largest allowed value: \(\min(X_i)\).` },
      { id: 'q11', type: 'num', concept: 'invariance', q: r`From Exponential data you found \(\hat\lambda=0.25\). What is the MLE of the **variance** \(1/\lambda^2\)?`, answer: 16, tol: 0.01,
        hint: 'Invariance: just plug in.', solution: r`\(1/\hat\lambda^2=1/0.0625=16\).` },
      { id: 'q12', type: 'num', concept: 'extrema', q: r`Find the maximum **value** of \(f(\theta)=\dfrac{\theta}{\theta^2+1}\) on \(0<\theta<2\).`, answer: 0.5,
        hint: r`Quotient rule: \(f'(\theta)=\dfrac{1-\theta^2}{(\theta^2+1)^2}\).`, solution: r`\(f'(\theta)=0\) when \(\theta=1\) (positive before, negative after, so a max). \(f(1)=\tfrac12\).` },
      { id: 'q13', type: 'num', concept: 'maxdist', q: r`\(X_1,\dots,X_5\) are iid \(U(0,1)\). What is \(P(\max X_i\le0.8)\)?`, answer: 0.32768,
        hint: r`\([F(0.8)]^5\).`, solution: r`\(0.8^5=0.3277\).` },
      { id: 'q14', type: 'self', concept: 'mle-bern', q: r`Derive the MLE of \(\lambda\) for an iid sample \(X_1,\dots,X_n\sim\text{Poisson}(\lambda)\), following the four-step recipe.`,
        hint: r`pmf: \(\dfrac{\lambda^xe^{-\lambda}}{x!}\). After taking logs, the \(\log x_i!\) terms do not involve \(\lambda\).`,
        solution: r`**Likelihood**: \(L(\lambda)=\prod\dfrac{\lambda^{x_i}e^{-\lambda}}{x_i!}=\dfrac{\lambda^{\sum x_i}e^{-n\lambda}}{\prod x_i!}\).

**Log**: \(l(\lambda)=\sum x_i\log\lambda-n\lambda-\sum\log(x_i!)\).

**Differentiate**: \(l'(\lambda)=\dfrac{\sum x_i}\lambda-n=0\).

**Solve**: \(\hat\lambda=\dfrac{\sum x_i}n=\bar x\).

Check: \(l''(\lambda)=-\dfrac{\sum x_i}{\lambda^2}<0\), so it is a maximum.` },
    ]
  });
})();
