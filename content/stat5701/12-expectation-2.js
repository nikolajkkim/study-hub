(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l12', num: 12, minutes: 80,
    title: 'Expectation, Part 2: combining random variables',
    oneLiner: r`Rules for the mean and spread of **sums** and combinations, plus covariance and correlation.`,
    leadsTo: 'Next: when the algebra gets too hard, let the computer simulate it.',
    bigPicture: {
      what: r`So far every problem had one random variable. Real data has many: \(n\) measurements, two metrics per user, a portfolio of assets. This lecture answers: **if I add, scale or average random variables, what are the mean and variance of the result?**

It starts by finishing the MGF story (pulling moments out, and the log-MGF shortcut), then moves to two variables at once: joint tables, conditional averages, covariance and correlation. It ends with the single most used fact in statistics: the average of \(n\) data points has spread \(\sigma/\sqrt n\).`,
      why: r`Everything in Lecture 14 (Law of Large Numbers, Central Limit Theorem) is these rules applied to the sample mean. If the rules for \(E\) and \(\text{Var}\) of a sum feel automatic, the next two lectures become short.`,
      remember: r`1. **Means always add**: \(E(aX+bY)=aE(X)+bE(Y)\). No conditions.
2. **Variances add only if independent** (otherwise add \(2\,\text{Cov}\)), and constants come out **squared**: \(\text{Var}(aX)=a^2\text{Var}(X)\).
3. The sample mean \(\bar X\) has mean \(\mu\) and standard deviation \(\sigma/\sqrt n\).`
    },
    sections: [
      { id: 's-mgf', title: 'Finishing MGFs', summary: 'Shifting and scaling, pulling out moments, and the log shortcut.', concepts: [
        { id: 'mgf-linear', title: 'MGF of a + bX',
          plain: r`If you shift and rescale a variable, you do not need to redo any integral. Replace \(t\) by \(bt\) in the old MGF and multiply by \(e^{at}\).`,
          formula: r`\[ Y=a+bX \;\Rightarrow\; m_Y(t)=e^{at}\,m_X(bt) \]`,
          example: r`\(Z\sim N(0,1)\) has \(m_Z(t)=e^{t^2/2}\). Then \(X=\mu+\sigma Z\) has \(m_X(t)=e^{\mu t}\,e^{(\sigma t)^2/2}=e^{\mu t+\frac12\sigma^2t^2}\). That is the general Normal MGF.` },
        { id: 'mgf-moments2', title: 'Moments from the MGF, worked',
          plain: r`Same recipe as Lecture 10 (differentiate, set \(t=0\)), now on the main distributions. The results worth knowing:

- **Poisson**: \(E(X)=\lambda\), \(E(X^2)=\lambda^2+\lambda\), so the variance is \(\lambda\).
- **Exponential**: \(E(X^k)=\dfrac{k!}{\lambda^k}\).
- **Standard Normal**: all odd moments are 0 (symmetry). \(E(Z^2)=1\), \(E(Z^4)=3\).`,
          formula: r`\[ E(Z^{2k})=\frac{(2k)!}{2^k\,k!} \qquad\qquad \text{Exp}(\lambda):\ E(X^k)=\frac{k!}{\lambda^k} \]`,
          formal: r`For the exponential you can prove by induction that \(m^{(k)}(t)=k!\,\lambda(\lambda-t)^{-k-1}\). Corollary: \(\mu_k=m^{(k)}(0)=k!/\lambda^k\).` },
        { id: 'cgf2', title: 'The log-MGF shortcut for mean and variance',
          plain: r`Take the log of the MGF first (the slides call it \(l_X(t)\); Lecture 10 called it \(K_X(t)\); it is the cumulant generating function). Then the first derivative at 0 is the mean and the second derivative at 0 is the variance directly. Logs turn powers into multiplications, so this is usually less algebra.`,
          formula: r`\[ l_X(t)=\ln m_X(t) \qquad l_X'(0)=\mu \qquad l_X''(0)=\sigma^2 \]`,
          example: r`Gamma: \(m(t)=\left(\frac\lambda{\lambda-t}\right)^\alpha\), so \(l(t)=\alpha[\ln\lambda-\ln(\lambda-t)]\).

\(l'(t)=\dfrac{\alpha}{\lambda-t}\Rightarrow\mu=\dfrac\alpha\lambda\). \(\quad l''(t)=\dfrac{\alpha}{(\lambda-t)^2}\Rightarrow\sigma^2=\dfrac\alpha{\lambda^2}\).` },
      ]},
      { id: 's-joint', title: 'Two variables at once', summary: 'Joint tables, independence and conditional averages.', concepts: [
        { id: 'joint-e', title: 'Expectation with a joint distribution',
          plain: r`With two variables you have a probability for every **pair** \((x,y)\). To average any function of both, such as \(XY\): for each pair, compute the function's value, multiply by that pair's probability, and add everything up. For continuous variables, it is a double integral over the region where the density lives.`,
          formula: r`\[ E[g(X,Y)]=\sum_x\sum_y g(x,y)\,P(X=x,Y=y)\quad\text{or}\quad\iint g(x,y)\,f(x,y)\,dx\,dy \]`,
          example: r`GPU cores \(X\in\{0,1,2\}\) and priority \(Y\in\{1,2\}\) with joint table:

<table class="sheet"><thead><tr><th>Y \ X</th><th>0</th><th>1</th><th>2</th></tr></thead><tbody><tr><td>1</td><td>0.15</td><td>0.25</td><td>0.10</td></tr><tr><td>2</td><td>0.10</td><td>0.20</td><td>0.20</td></tr></tbody></table>

\(E(XY)=(1)(1)(0.25)+(1)(2)(0.20)+(2)(1)(0.10)+(2)(2)(0.20)=1.65\). (Pairs with \(x=0\) contribute 0.)` },
        { id: 'marginal', title: 'Marginals: collapsing the table',
          plain: r`To get the distribution of \(X\) alone, add up each column of the table (sum over \(y\)). For a continuous density, integrate out the other variable. You can compute \(E(X)\) either from the joint or from the marginal: same answer.`,
          example: r`From the table: \(P(X=0)=0.25,\ P(X=1)=0.45,\ P(X=2)=0.30\). So \(E(X)=0(0.25)+1(0.45)+2(0.30)=1.05\).

Continuous: \(f(x,y)=24xy\) on \(x,y>0,\ x+y<1\). Marginal of \(X\): \(\int_0^{1-x}24xy\,dy=12x(1-x)^2\).` },
        { id: 'cond-e', title: 'Conditional expectation E(Y | X = x)',
          plain: r`"The average of \(Y\), looking only at the cases where \(X=x\)." Take that one column of the table, rescale it so it adds to 1 (divide by the column total), and then compute an ordinary average.`,
          formula: r`\[ P(Y=y\mid X=x)=\frac{P(X=x,Y=y)}{P(X=x)} \qquad E(Y\mid X=x)=\sum_y y\,P(Y=y\mid X=x) \]`,
          example: r`Column \(X=0\) is \((0.15,\ 0.10)\), total \(0.25\). Rescaled: \((0.6,\ 0.4)\). So \(E(Y\mid X=0)=1(0.6)+2(0.4)=1.4\).` },
        { id: 'indep', title: 'Independence',
          plain: r`Two variables are independent when knowing one tells you nothing about the other. In formulas: every joint probability equals the product of the two marginals. One mismatch anywhere and they are dependent. A quick giveaway for continuous densities: if the allowed region ties \(x\) and \(y\) together (like \(x+y<1\)), they cannot be independent.`,
          formula: r`\[ f(x_1,\dots,x_n)=f_1(x_1)\times\dots\times f_n(x_n) \]` },
      ]},
      { id: 's-rules', title: 'Rules for expectation and variance', summary: 'The algebra you will use constantly.', concepts: [
        { id: 'linearity', title: 'Linearity: means always add',
          plain: r`The average of a sum is the sum of the averages, and constants pull straight out. This is true **always**: independent or not, any distributions.`,
          formula: r`\[ E(a_1X_1+\dots+a_nX_n)=a_1E(X_1)+\dots+a_nE(X_n) \]` },
        { id: 'product', title: 'Product rule: only when independent',
          plain: r`You may split the average of a product into a product of averages **only if the variables are independent**.`,
          formula: r`\[ X,Y\text{ independent}\;\Rightarrow\;E(XY)=E(X)\,E(Y),\quad E(X^2Y^3)=E(X^2)\,E(Y^3) \]`,
          watch: r`In the table example \(E(X)E(Y)=1.05\times1.5=1.575\) but \(E(XY)=1.65\). They differ, so \(X\) and \(Y\) are not independent.` },
        { id: 'cov', title: 'Covariance: do they move together?',
          plain: r`Variance measures how one variable wobbles around its mean. Covariance measures whether two variables wobble **together**. Positive: when one is above its mean the other tends to be too. Negative: they move opposite. The shortcut formula is the one to use in calculations.`,
          formula: r`\[ \text{Cov}(X,Y)=E[(X-\mu_X)(Y-\mu_Y)]=E(XY)-E(X)E(Y) \]`,
          example: r`Table example: \(\text{Cov}(X,Y)=1.65-(1.05)(1.5)=0.075\).

Density \(24xy\) on the triangle: \(E(XY)=\tfrac2{15}\), \(E(X)=E(Y)=\tfrac25\), so \(\text{Cov}=\tfrac2{15}-\tfrac4{25}=-\tfrac2{75}\). Negative makes sense: since \(x+y<1\), a big \(x\) forces a small \(y\).` },
        { id: 'var-rules', title: 'Variance rules',
          plain: r`Three things to remember.

- Adding a constant does nothing to the spread. Multiplying by \(a\) multiplies the variance by \(a^2\).
- The variance of a sum is the sum of the variances **plus twice the covariance**.
- If the variables are independent the covariance is 0, so variances simply add.`,
          formula: r`\[ \text{Var}(aX+b)=a^2\text{Var}(X) \qquad \text{Var}(aX+bY)=a^2\text{Var}(X)+b^2\text{Var}(Y)+2ab\,\text{Cov}(X,Y) \]
\[ \text{independent: }\ \text{Var}(a_1X_1+\dots+a_nX_n)=\sum a_i^2\,\text{Var}(X_i) \]`,
          watch: r`\(\text{Var}(X-Y)=\text{Var}(X)+\text{Var}(Y)\) for independent variables. The minus sign gets squared. Variances never subtract.`,
          formal: r`General property: \(\text{Var}(a_1X_1+\dots+a_nX_n)=\sum a_i^2\text{Var}(X_i)+2\sum\sum_{i<j}a_ia_j\text{Cov}(X_i,X_j)\). In vector-matrix form, \(\text{Var}(\mathbf a'\mathbf X)=\mathbf a'\Sigma\,\mathbf a\), where \(\Sigma\) is the covariance matrix. (This is the answer to "how do you compute the risk of a portfolio of dependent assets?")` },
        { id: 'corr', title: 'Correlation: covariance without units',
          plain: r`Covariance depends on the units (dollars vs cents changes it). Divide by both standard deviations and you get a pure number between −1 and 1. ±1 means the points fall exactly on a straight line. 0 means no **linear** relationship.`,
          formula: r`\[ \rho_{XY}=\frac{\text{Cov}(X,Y)}{\sigma_X\,\sigma_Y},\qquad -1\le\rho_{XY}\le1 \]`,
          example: r`Table example: \(\text{Var}(X)=1.65-1.05^2=0.5475\), \(\text{Var}(Y)=0.25\). \(\rho=\dfrac{0.075}{0.7399\times0.5}=0.2027\).

Interview question: if \(\text{corr}(X,Y)=r\), then \(\text{corr}(X+5,\,Y)=r\) and \(\text{corr}(5X,\,Y)=r\). Shifting and (positive) scaling do not change correlation.`,
          watch: r`Independent ⇒ correlation 0, but **not** the other way round. Take \(X\sim N(0,1)\) and \(Y=X^2\): \(Y\) is completely determined by \(X\), yet \(\text{Cov}(X,Y)=E(X^3)=0\). Also, multiplying by a negative number flips the sign of the correlation.` },
      ]},
      { id: 's-apps', title: 'Applications of the rules', summary: 'The sample mean, Chebyshev, and building distributions from simpler pieces.', concepts: [
        { id: 'xbar', title: 'The sample mean: mean μ, spread σ/√n',
          plain: r`Take \(n\) independent measurements, each with mean \(\mu\) and standard deviation \(\sigma\), and average them. The average is still centred on \(\mu\), but it is much less wobbly than a single measurement: its standard deviation shrinks by a factor of \(\sqrt n\). To halve the noise you need four times the data.

This works for **any** distribution, and it is why averaging data is useful.`,
          formula: r`\[ \bar X=\frac1n\sum_{i=1}^nX_i \qquad E(\bar X)=\mu \qquad \text{Var}(\bar X)=\frac{\sigma^2}n \qquad \sigma_{\bar X}=\frac\sigma{\sqrt n} \]`,
          example: r`Derivation in one line: \(\text{Var}(\bar X)=\left(\tfrac1n\right)^2\text{Var}(X_1)+\dots+\left(\tfrac1n\right)^2\text{Var}(X_n)=n\cdot\dfrac{\sigma^2}{n^2}=\dfrac{\sigma^2}n\).` },
        { id: 'cheb', title: 'Chebyshev’s inequality: a guarantee that needs no distribution',
          plain: r`For **any** distribution at all, at least \(1-\frac1{k^2}\) of the probability lies within \(k\) standard deviations of the mean. So at least 75% within 2 SDs and at least 89% within 3 SDs. It is a worst-case floor, so it is usually far lower than the truth (for a Normal, 95% is within 2 SDs).`,
          formula: r`\[ P\big(|X-\mu|<k\sigma\big)\ \ge\ 1-\frac1{k^2} \]`,
          watch: r`The slides spell it "Tchebychev". Same person. With \(k=1\) the bound is 0, which says nothing.` },
        { id: 'sums', title: 'Building big distributions from small ones',
          plain: r`A slick way to get a mean and variance: write the variable as a **sum of simple independent pieces**, then add up the pieces' means and variances.

- Binomial = sum of \(n\) Bernoullis → mean \(np\), variance \(npq\).
- Negative Binomial = sum of \(k\) Geometrics (the wait for each successive success) → mean \(k/p\), variance \(kq/p^2\).`,
          formula: r`\[ X=X_1+\dots+X_n \ \text{(independent)}\;\Rightarrow\; E(X)=\sum E(X_i),\quad \text{Var}(X)=\sum\text{Var}(X_i) \]` },
      ]},
    ],
    sheet: [
      { title: 'Expectation and variance rules', cols: ['Rule', 'Formula', 'Needs independence?'], rows: [
        ['Linearity', r`\(E(aX+bY+c)=aE(X)+bE(Y)+c\)`, 'No'],
        ['Product', r`\(E(XY)=E(X)E(Y)\)`, 'Yes'],
        ['Variance shortcut', r`\(\text{Var}(X)=E(X^2)-[E(X)]^2\)`, 'No'],
        ['Scale and shift', r`\(\text{Var}(aX+b)=a^2\text{Var}(X)\)`, 'No'],
        ['Covariance', r`\(\text{Cov}(X,Y)=E(XY)-E(X)E(Y)\)`, 'No'],
        ['Variance of a sum', r`\(\text{Var}(aX+bY)=a^2\text{Var}(X)+b^2\text{Var}(Y)+2ab\,\text{Cov}(X,Y)\)`, 'No'],
        ['Sum, independent', r`\(\text{Var}(\sum a_iX_i)=\sum a_i^2\text{Var}(X_i)\)`, 'Yes'],
        ['Correlation', r`\(\rho=\dfrac{\text{Cov}(X,Y)}{\sigma_X\sigma_Y}\in[-1,1]\)`, 'No'],
        ['Sample mean', r`\(E(\bar X)=\mu,\ \ \sigma_{\bar X}=\sigma/\sqrt n\)`, 'Yes'],
        ['Chebyshev', r`\(P(|X-\mu|<k\sigma)\ge1-1/k^2\)`, 'No'],
        ['Conditional mean', r`\(E(Y\mid X=x)=\sum_y y\,\dfrac{P(x,y)}{P(X=x)}\)`, 'No'],
      ]},
      { title: 'MGF tools', cols: ['Tool', 'Formula'], rows: [
        ['Shift and scale', r`\(m_{a+bX}(t)=e^{at}m_X(bt)\)`],
        ['Log-MGF', r`\(l(t)=\ln m(t)\): \(l'(0)=\mu,\ l''(0)=\sigma^2\)`],
        ['Poisson moments', r`\(\mu_1=\lambda,\ \mu_2=\lambda^2+\lambda,\ \mu_3=\lambda^3+3\lambda^2+\lambda\)`],
        ['Exponential moments', r`\(E(X^k)=k!/\lambda^k\)`],
        ['Standard Normal moments', r`odd: 0; \(E(Z^2)=1,\ E(Z^4)=3\)`],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'var-rules', q: r`\(\text{Var}(X)=4\), \(\text{Var}(Y)=9\), \(\text{Cov}(X,Y)=1\). Find \(\text{Var}(3X-2Y)\).`, answer: 60, tol: 0.01,
        hint: r`\(a=3,\ b=-2\). The cross term is \(2ab\,\text{Cov}\).`, solution: r`\(9(4)+4(9)+2(3)(-2)(1)=36+36-12=60\).` },
      { id: 'q2', type: 'mcq', concept: 'var-rules', q: r`\(X\) and \(Y\) are independent with \(\text{Var}(X)=4\) and \(\text{Var}(Y)=9\). What is \(\text{Var}(X-Y)\)?`, choices: ['−5', '5', '13', '36'], answer: 2,
        hint: 'What happens to the coefficient −1 when it comes out of the variance?', solution: r`\((1)^2(4)+(-1)^2(9)=13\). Variances add even when you subtract the variables.` },
      { id: 'q3', type: 'num', concept: 'cond-e', q: r`Using the GPU table (\(P(X{=}2,Y{=}1)=0.10\), \(P(X{=}2,Y{=}2)=0.20\)), find \(E(Y\mid X=2)\).`, answer: 5 / 3, show: '5/3 ≈ 1.667',
        hint: 'Rescale the X = 2 column so it sums to 1.', solution: r`\(P(X=2)=0.30\). Conditional probabilities: \(\tfrac13\) and \(\tfrac23\). \(E(Y\mid X=2)=1(\tfrac13)+2(\tfrac23)=\tfrac53\).` },
      { id: 'q4', type: 'num', concept: 'corr', q: r`\(\text{Cov}(X,Y)=6\), \(\text{Var}(X)=16\), \(\text{Var}(Y)=9\). Find the correlation \(\rho_{XY}\).`, answer: 0.5,
        hint: 'Divide by the standard deviations, not the variances.', solution: r`\(\rho=\dfrac{6}{4\times3}=0.5\).` },
      { id: 'q5', type: 'mcq', concept: 'corr', q: r`The correlation between \(X\) and \(Y\) is \(r\). What is the correlation between \(-2X+7\) and \(Y\)?`, choices: [r`\(r\)`, r`\(-r\)`, r`\(-2r\)`, r`\(4r\)`], answer: 1,
        hint: 'Shifts do nothing. Scaling keeps the size but a negative multiplier flips the direction.', solution: r`\(\text{Cov}(-2X+7,Y)=-2\,\text{Cov}(X,Y)\) and \(\text{SD}(-2X+7)=2\sigma_X\). The 2s cancel and the sign stays: \(-r\).` },
      { id: 'q6', type: 'num', concept: 'xbar', q: r`Individual measurements have \(\sigma=12\). What is the standard deviation of the mean of \(n=36\) independent measurements?`, answer: 2, tol: 0.01,
        hint: r`\(\sigma/\sqrt n\).`, solution: r`\(12/\sqrt{36}=2\).` },
      { id: 'q7', type: 'num', concept: 'cheb', q: r`A variable has mean 50 and SD 5, distribution unknown. Chebyshev guarantees that \(P(40<X<60)\) is **at least** what?`, answer: 0.75,
        hint: 'How many SDs is 10 units?', solution: r`\(k=2\). \(1-\tfrac1{2^2}=0.75\).` },
      { id: 'q8', type: 'num', concept: 'var-rules', q: r`A portfolio puts half its money in each of two assets with SDs \(0.20\) and \(0.30\) and correlation \(0.5\). What is the **standard deviation** of the portfolio return?`, answer: 0.2179,
        hint: r`\(\text{Cov}=\rho\,\sigma_1\sigma_2\). Then \(\text{Var}(0.5X+0.5Y)\).`, solution: r`\(\text{Cov}=0.5(0.2)(0.3)=0.03\).

\(\text{Var}=0.25(0.04)+0.25(0.09)+2(0.25)(0.03)=0.01+0.0225+0.015=0.0475\).

\(\text{SD}=\sqrt{0.0475}=0.2179\). Lower than the average of the two SDs (0.25): that is diversification.` },
      { id: 'q9', type: 'num', concept: 'mgf-moments2', q: r`\(X\sim\text{Exp}(\lambda=2)\). Find \(E(X^3)\).`, answer: 0.75,
        hint: r`\(E(X^k)=k!/\lambda^k\).`, solution: r`\(3!/2^3=6/8=0.75\).` },
      { id: 'q10', type: 'mcq', concept: 'mgf-linear', q: r`\(Z\sim N(0,1)\) with \(m_Z(t)=e^{t^2/2}\). What is the MGF of \(Y=3+2Z\)?`, choices: [r`\(e^{3t+t^2/2}\)`, r`\(e^{3t+2t^2}\)`, r`\(e^{3t+t^2}\)`, r`\(3+2e^{t^2/2}\)`], answer: 1,
        hint: r`\(e^{at}m_Z(bt)\) with \(a=3,\ b=2\).`, solution: r`\(e^{3t}\cdot e^{(2t)^2/2}=e^{3t+2t^2}\). This is \(N(3,\sigma=2)\): \(\mu t+\tfrac12\sigma^2t^2\) with \(\sigma^2=4\).` },
      { id: 'q11', type: 'mcq', concept: 'corr', q: r`Which statement is always true?`, choices: ['Correlation 0 implies independent', 'Independent implies correlation 0', r`\(E(XY)=E(X)E(Y)\) for any \(X,Y\)`, r`\(\text{Var}(X+Y)=\text{Var}(X)+\text{Var}(Y)\) for any \(X,Y\)`], answer: 1,
        hint: r`Think of \(Y=X^2\) with \(X\) symmetric around 0.`, solution: r`Independence forces covariance 0, hence correlation 0. The reverse fails (\(Y=X^2\)). The other two also need independence (or at least zero covariance).` },
      { id: 'q12', type: 'num', concept: 'sums', q: r`You play a lottery with a 3% win chance until you have won 5 times. What is the expected number of plays?`, answer: 166.67, tol: 0.5,
        hint: 'Negative Binomial = sum of 5 Geometric waits.', solution: r`Each wait has mean \(1/p=33.33\). Five of them: \(k/p=5/0.03=166.7\).` },
      { id: 'q13', type: 'self', concept: 'cov', q: r`For \(f(x,y)=24xy\) on \(0<x,\ 0<y,\ x+y<1\), compute \(E(X)\) from the marginal \(f(x)=12x(1-x)^2\) and confirm \(\text{Cov}(X,Y)=-\tfrac2{75}\) given \(E(XY)=\tfrac2{15}\).`,
        hint: r`\(E(X)=\int_0^1 x\cdot12x(1-x)^2dx\). Expand \((1-x)^2\). By symmetry \(E(Y)=E(X)\).`,
        solution: r`\(E(X)=12\displaystyle\int_0^1(x^2-2x^3+x^4)\,dx=12\left(\tfrac13-\tfrac12+\tfrac15\right)=12\cdot\tfrac1{30}=\tfrac25\).

The density is symmetric in \(x\) and \(y\), so \(E(Y)=\tfrac25\).

\(\text{Cov}=\tfrac2{15}-\tfrac25\cdot\tfrac25=\tfrac{10}{75}-\tfrac{12}{75}=-\tfrac2{75}\).` },
    ]
  });
})();
