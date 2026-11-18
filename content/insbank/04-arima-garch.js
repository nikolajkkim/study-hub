(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l4', num: 4, minutes: 65,
    title: 'ARIMA and GARCH, preparing data, and other perils',
    oneLiner: r`**ARIMA(p, d, q)** forecasts a series from its own past values and past errors; **GARCH** forecasts its volatility. Before any model: encode categories, scale numbers, handle missing data.`,
    leadsTo: 'Next: FEMA\'s new flood pricing, credit scores and the first look at GIS.',
    bigPicture: {
      what: r`**Part 1 – time series models.** ARIMA has three parts: AR (history matters), I (difference until stationary), MA (learn from recent forecast errors). You read \(p\) and \(q\) off the PACF and ACF plots, fit, then check the residuals with tests. GARCH models the **variance** instead of the mean, for data where calm and wild periods cluster.

**Part 2 – data preparation.** One-hot encoding for categories; scaling and normalisation for numbers; dealing with missing values.

**Part 3 – perils beyond flood.** FEMA's National Risk Index (18 hazards), tornadoes, wildfire and hail.`,
      why: r`ARIMA is the workhorse forecasting model in finance and insurance, and the most-asked-about topic in the class survey (it returns in Lecture 7). Data preparation is where most real projects spend their time.`,
      remember: r`1. ARIMA recipe: difference until stationary (that count is \(d\)); **PACF cut-off → p**, **ACF cut-off → q**; fit ARIMA(p,d,q) on the **original** data; check residuals look like white noise.
2. AIC = \(2k-2\ln L\), BIC = \(k\ln n-2\ln L\): lower is better; BIC penalises extra parameters more.
3. ARIMA models the conditional **mean**; GARCH models the conditional **variance** (volatility clustering).`
    },
    sections: [
      { id: 's-arima', title: 'ARIMA models', summary: 'Three ingredients, read off two plots.', concepts: [
        { id: 'parts', title: 'AR, I and MA in plain words',
          plain: r`- **AR (autoregressive)**: today is a weighted sum of recent values. "History matters."
- **I (integrated)**: difference the series (once or twice) until it is stationary: constant mean and variance.
- **MA (moving average)**: today also depends on recent **forecast errors**: if the model under-predicted yesterday, adjust today. (Not the same as a rolling average.)

A log transform can also help when volatility grows, but it is a pre-processing step, not part of AR, I or MA.`,
          formula: r`\[ y'_t = c + \phi_1y'_{t-1}+\dots+\phi_py'_{t-p} + \theta_1\varepsilon_{t-1}+\dots+\theta_q\varepsilon_{t-q}+\varepsilon_t \]
\[ y'=\text{the series differenced } d \text{ times} \]` },
        { id: 'pdq', title: 'Reading ARIMA(p, d, q), and the special cases',
          plain: r`- \(p\): how many past **values** (AR order).
- \(d\): how many times the series was **differenced**.
- \(q\): how many past **errors** (MA order).

| Model | Name | Meaning |
|---|---|---|
| ARIMA(0,0,0) | white noise | random values around a constant; no memory |
| ARIMA(0,1,0) | random walk | each value = previous value + a random shock |
| ARIMA(1,0,0) | AR(1) | forecast from one past value |
| ARIMA(0,0,1) | MA(1) | forecast from one past error |

Differencing a random walk once gives back white noise. With a constant term, ARIMA(0,1,0) is a random walk **with drift**.` },
        { id: 'acfpacf', title: 'Choosing p and q from the ACF and PACF',
          plain: r`The **ACF** is the correlation with each lag. The **PACF** is the correlation with each lag after removing the lags in between. On a stationary series:
- **AR(p)**: ACF decays gradually; **PACF cuts off after lag p**.
- **MA(q)**: **ACF cuts off after lag q**; PACF decays gradually.
- Both decay gradually → a mixed ARMA; compare candidates with AIC.
- ACF starts near 1 and decays very slowly → not stationary: difference first.
- ACF peaks again at lag 12 → monthly seasonality.

"Cuts off" = bars drop inside the shaded 95% band and stay there.`,
          widget: 'acf' },
        { id: 'steps', title: 'The five steps',
          plain: r`1. Check stationarity on the original data (ACF plot, a test, or just looking).
2. Difference until stationary. The number of differences is \(d\).
3. On the differenced data: PACF cut-off gives \(p\); ACF cut-off gives \(q\).
4. Fit ARIMA(p, d, q) on the **original** data. The model differences it itself; feeding it already-differenced data would difference twice.
5. Check the residuals: their ACF should show no significant lags. If some remain, adjust \(p\) or \(q\) and refit.` },
        { id: 'tests', title: 'The tests',
          plain: r`**On the data (stationarity)**
- **ADF** (Augmented Dickey-Fuller): null = has a unit root (not stationary). Rejecting (p < 0.05) → stationary.
- **KPSS**: the opposite null (stationary). Rejecting → not stationary. Use both: they should agree.

**Model selection**
- **AIC** = \(2k-2\ln L\) and **BIC** = \(k\ln n-2\ln L\) (\(k\) = parameters, \(L\) = likelihood, \(n\) = observations). Lower is better; BIC penalises complexity more, especially on large datasets. Compare only models fitted to the same data.

**On the residuals**
- **Ljung-Box**: null = no autocorrelation left. High p-value (> 0.05) → residuals are white noise (good).
- **Durbin-Watson**: about 2 = no autocorrelation; below 2 = positive autocorrelation.
- **Shapiro-Wilk**, **Jarque-Bera**: p > 0.05 → residuals look normal.`,
          formula: r`\[ \text{AIC}=2k-2\ln L\qquad \text{BIC}=k\ln n-2\ln L \]`,
          watch: r`Two of these have opposite nulls: rejecting ADF is good news (stationary), rejecting KPSS is bad news. A **high** Ljung-Box p-value is what you want.` },
      ]},
      { id: 's-garch', title: 'GARCH: modelling volatility', summary: 'When the size of the swings changes over time.', concepts: [
        { id: 'garch', title: 'GARCH models the variance, not the mean',
          plain: r`Financial returns and peril losses show **volatility clustering**: big moves follow big moves, calm follows calm. ARIMA assumes constant variance and cannot capture that. **GARCH** (Generalized Autoregressive Conditional Heteroskedasticity, "variance that changes depending on the past") forecasts today's variance from yesterday's surprise and yesterday's variance.

GARCH(p, q) in the lecture's convention: \(p\) = lagged conditional variances, \(q\) = lagged squared residuals from the mean model. (Some software swaps the letters.) The usual model is GARCH(1,1). Often ARIMA (or a constant) models the mean and GARCH models the variance on top.`,
          formula: r`\[ \sigma_t^2 = \omega + \alpha\,\varepsilon_{t-1}^2 + \beta\,\sigma_{t-1}^2,\qquad \text{long-run variance}=\frac{\omega}{1-\alpha-\beta} \]`,
          example: r`\(\omega=0.1,\ \alpha=0.1,\ \beta=0.8\). Yesterday: surprise \(\varepsilon=2\), variance 1. Today's variance \(=0.1+0.1(4)+0.8(1)=1.3\), above the long-run level of \(0.1/0.1=1\): a shock raises tomorrow's risk.` },
      ]},
      { id: 's-prep', title: 'Preparing data', summary: 'Turning categories and mixed scales into model-ready numbers.', concepts: [
        { id: 'onehot', title: 'One-hot encoding',
          plain: r`Models need numbers, but many columns are categories (flood zone, occupancy type). Assigning 1, 2, 3 would invent an order and distances that do not exist. **One-hot encoding** makes one 0/1 column per category. Such 0/1 columns are also called binary, indicator, dummy or dichotomous variables.

For linear models, drop one column (it is implied by the others; keeping all of them makes them perfectly collinear): pandas get_dummies(..., drop_first=True).`,
          example: r`Zone ∈ {A, AE, X}: three columns zone_A, zone_AE, zone_X; a property in AE is (0, 1, 0).` },
        { id: 'scale', title: 'Scaling and normalisation',
          plain: r`Columns on very different scales (home value in dollars, number of floors) can dominate distance-based models (k-nearest neighbours, k-means, SVM) and slow gradient-based training.
- **Min-max scaling**: squeeze into 0–1.
- **Standardisation (z-score)**: mean 0, SD 1.
- **Normalisation** (in the Kaggle notebook's sense): change the **shape** of the distribution toward normal, e.g. Box-Cox or a log, for models that assume normality.

Fit the scaler on the training data only, then apply it to the test data.`,
          formula: r`\[ x_{\text{minmax}}=\frac{x-\min}{\max-\min},\qquad z=\frac{x-\bar x}{s} \]` },
        { id: 'missing', title: 'Missing data',
          plain: r`Options, roughly from simplest: drop rows (fine if few and random); drop a column (if mostly empty); fill with the mean, median or most common value; carry the last value forward (time series); predict the missing value from other columns; add a "was missing" indicator column, because missingness itself can carry information. First ask **why** it is missing: missing on purpose (redacted), never collected, or not applicable (no contents coverage) need different handling.` },
      ]},
      { id: 's-perils', title: 'Perils beyond flood', summary: 'FEMA\'s National Risk Index, tornadoes, wildfire and hail.', concepts: [
        { id: 'nri', title: 'FEMA\'s National Risk Index',
          plain: r`The NRI scores every US county and census tract for **18** natural hazards (flooding, hurricanes, tornadoes, wildfire, hail, earthquakes, heat waves and more). It combines **expected annual loss** (what the hazard is likely to cost) with **social vulnerability** and **community resilience** (who is hit, and how well they recover). The Climate Explorer adds projected climate trends.` },
        { id: 'tornado', title: 'Tornadoes, wildfire, hail',
          plain: r`**Tornadoes** are rated on the Enhanced Fujita scale from damage-based wind estimates: EF0 (65–85 mph) to EF5 (over 200 mph). They are most frequent in "Tornado Alley" in the central US, and the lecture notes links to nearby water and moisture sources.

**Wildfire**: severe events are unlikely to recur in the same place soon, because the fuel has burned.

**Hail**: concentrated in a "hail corridor" across the Great Plains; a major source of roof and auto claims.` },
      ]},
    ],
    sheet: [
      { title: 'ACF / PACF patterns', cols: ['Pattern', 'ACF', 'PACF'], rows: [
        ['Not stationary', 'starts near 1, decays very slowly', '(difference first)'],
        ['AR(p)', 'decays gradually', 'cuts off after lag p'],
        ['MA(q)', 'cuts off after lag q', 'decays gradually'],
        ['ARMA', 'decays gradually', 'decays gradually'],
        ['Monthly seasonal', 'peaks again at lag 12', 'spike at lag 12'],
      ]},
      { title: 'Tests', cols: ['Test', 'Null hypothesis', 'Good result'], rows: [
        ['ADF', 'unit root (not stationary)', 'p < 0.05 → stationary'],
        ['KPSS', 'stationary', 'p > 0.05 → stationary'],
        ['Ljung-Box', 'no autocorrelation in residuals', 'p > 0.05'],
        ['Durbin-Watson', '—', '≈ 2'],
        ['Shapiro-Wilk / Jarque-Bera', 'residuals normal', 'p > 0.05'],
        ['AIC / BIC', r`\(2k-2\ln L\) / \(k\ln n-2\ln L\)`, 'lowest'],
      ]},
      { title: 'Other formulas', cols: ['Item', 'Formula'], rows: [
        ['GARCH(1,1)', r`\(\sigma^2_t=\omega+\alpha\varepsilon^2_{t-1}+\beta\sigma^2_{t-1}\)`],
        ['Long-run variance', r`\(\omega/(1-\alpha-\beta)\)`],
        ['Min-max', r`\((x-\min)/(\max-\min)\)`],
        ['z-score', r`\((x-\bar x)/s\)`],
        ['One-hot', 'k categories → k columns (k − 1 with drop_first)'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'mcq', concept: 'acfpacf', q: r`On a stationary series, the PACF has one significant spike at lag 1 and the ACF decays gradually. Which model?`, choices: ['MA(1)', 'AR(1)', 'White noise', 'Random walk'], answer: 1,
        hint: 'PACF cut-off → p.', solution: r`PACF cuts off after lag 1 and ACF decays: **AR(1)**.` },
      { id: 'q2', type: 'mcq', concept: 'acfpacf', q: r`The ACF has significant spikes at lags 1 and 2, then nothing; the PACF decays gradually. Which model?`, choices: ['AR(2)', 'MA(2)', 'ARIMA(0,2,0)', 'GARCH(2,2)'], answer: 1,
        hint: 'ACF cut-off → q.', solution: r`ACF cuts off after lag 2: **MA(2)**.` },
      { id: 'q3', type: 'mcq', concept: 'pdq', q: r`What is ARIMA(0, 1, 0)?`, choices: ['White noise', 'A random walk', 'AR(1)', 'MA(1)'], answer: 1,
        hint: 'One difference, nothing else.', solution: r`Each value = previous value + a random shock: a **random walk** (with drift if there is a constant).` },
      { id: 'q4', type: 'num', concept: 'tests', q: r`A model has \(k = 3\) parameters and log-likelihood \(\ln L = -120\). What is its AIC?`, answer: 246, tol: 0.01,
        hint: r`\(2k-2\ln L\).`, solution: r`\(6+240=246\).` },
      { id: 'q5', type: 'num', concept: 'tests', q: r`Same model, fitted on \(n = 100\) observations. What is its BIC?`, answer: 3 * Math.log(100) + 240, show: '≈ 253.8',
        hint: r`\(k\ln n-2\ln L\); \(\ln100\approx4.605\).`, solution: r`\(3\times4.605+240\approx253.8\).` },
      { id: 'q6', type: 'mcq', concept: 'tests', q: r`After fitting ARIMA, the Ljung-Box test on the residuals gives p = 0.62. What does that mean?`, choices: ['The model is bad: residuals are autocorrelated', 'Good: no evidence of autocorrelation left in the residuals', 'The series is not stationary', 'The residuals are not normal'], answer: 1,
        hint: 'What is the null?', solution: r`Null = no autocorrelation. A high p-value means no evidence against it: the residuals look like white noise.` },
      { id: 'q7', type: 'mcq', concept: 'tests', q: r`The ADF test gives p = 0.01. What do you conclude?`, choices: ['Not stationary', 'Stationary (reject the unit root)', 'Seasonal', 'Residuals are normal'], answer: 1,
        hint: 'ADF null = unit root.', solution: r`Rejecting the unit-root null means the series is stationary.` },
      { id: 'q8', type: 'mcq', concept: 'steps', q: r`You differenced a series once to make it stationary and chose \(p=1, q=1\). What do you pass to ARIMA(1,1,1)?`, choices: ['The differenced series', 'The original series', 'The residuals', 'The ACF values'], answer: 1,
        hint: 'Step 4.', solution: r`The **original** series: the model applies the differencing itself. Passing the differenced data would difference twice.` },
      { id: 'q9', type: 'num', concept: 'garch', q: r`GARCH(1,1) with \(\omega=0.05,\ \alpha=0.1,\ \beta=0.85\). Yesterday's surprise was \(\varepsilon=3\) and yesterday's variance was 1. What is today's variance?`, answer: 0.05 + 0.9 + 0.85, show: '1.8',
        hint: r`\(\omega+\alpha\varepsilon^2+\beta\sigma^2\).`, solution: r`\(0.05+0.1\times9+0.85\times1=1.8\).` },
      { id: 'q10', type: 'num', concept: 'garch', q: r`Same parameters. What is the long-run variance?`, answer: 1, tol: 0.01,
        hint: r`\(\omega/(1-\alpha-\beta)\).`, solution: r`\(0.05/(1-0.95)=1\).` },
      { id: 'q11', type: 'num', concept: 'scale', q: r`Home values range from $100,000 to $900,000. What is the min-max scaled value of a $300,000 home?`, answer: 0.25,
        hint: r`\((x-\min)/(\max-\min)\).`, solution: r`\((300-100)/(900-100)=0.25\).` },
      { id: 'q12', type: 'num', concept: 'onehot', q: r`A column has 5 categories. How many columns does one-hot encoding create with drop_first=True?`, answer: 4, tol: 0.01,
        hint: 'One is implied.', solution: r`\(5-1=4\).` },
      { id: 'q13', type: 'mcq', concept: 'garch', q: r`Which model fits a stock return series where turbulent weeks cluster together?`, choices: ['ARIMA alone', 'GARCH (possibly on top of an ARIMA mean)', 'One-hot encoding', 'A random walk'], answer: 1,
        hint: 'Mean or variance?', solution: r`Clustered volatility is a changing **variance**: GARCH's job.` },
      { id: 'q14', type: 'self', concept: 'steps', q: r`Walk through how you would build an ARIMA forecast of monthly NFIP claim counts, from raw data to a checked model.`,
        hint: 'Five steps, plus seasonality.',
        solution: r`Plot the series and its ACF. If it trends or has growing swings, take logs and/or difference; with a strong yearly pattern, apply a lag-12 seasonal difference (or use a seasonal ARIMA). Confirm stationarity with ADF and KPSS. On the stationary series, read p from the PACF cut-off and q from the ACF cut-off; try a few candidates and pick the lowest AIC/BIC. Fit on the original data with the chosen d. Check residuals: Ljung-Box p > 0.05 and no significant ACF lags; if not, adjust p or q. Then forecast and compare with a hold-out period.` },
    ]
  });
})();
