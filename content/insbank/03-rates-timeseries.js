(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l3', num: 3, minutes: 55,
    title: 'Interest rates, and the basics of time series',
    oneLiner: r`Interest rates drive profits in both industries. To model rates (or any series over time), first make the series **stationary**: take out trends and seasons by **differencing**.`,
    leadsTo: 'Next: ARIMA and GARCH models, preparing data, and the other natural perils.',
    bigPicture: {
      what: r`Two halves.

**Macro and interest rates**: what the Federal Reserve does (FOMC, dual mandate), the indicators to watch (CPI, GDP, the Fed's balance sheet, FedWatch), and exactly how rising or falling rates help or hurt **insurers** (investment income) and **banks** (net interest income, bond values).

**Time series basics**: vocabulary, the four components of a series (trend, seasonal, cyclical, irregular), why models need **stationarity**, and how to get it: first differences, seasonal differences, second differences, logs, checked with an ACF plot.`,
      why: r`Rates, prices, claim counts and loan delinquencies are all time series. Lecture 4 builds ARIMA on exactly these steps: you choose \(d\) (how many differences) here.`,
      remember: r`1. Rising rates: insurers earn more on their bond portfolios; banks can earn a wider margin, but the bonds they already hold lose value.
2. A stationary series has a constant mean and variance: trends, seasons and growing variance all break it.
3. First difference \(y_t-y_{t-1}\) removes a trend; seasonal difference \(y_t-y_{t-m}\) removes a season; logs calm growing variance. An ACF that decays slowly means "not stationary yet".`
    },
    sections: [
      { id: 's-macro', title: 'The Fed and the indicators', summary: 'Who sets rates and what they watch.', concepts: [
        { id: 'fomc', title: 'The FOMC and the dual mandate',
          plain: r`The Federal Open Market Committee sets the **federal funds target range**, the rate banks charge each other overnight; every other rate takes its cue from it. In the week before this lecture it set a new range of **3.75–4%**.

The Fed's **dual mandate**: maximum employment and stable prices. Raise rates to cool inflation; cut them to support jobs. The **CME FedWatch** tool turns futures prices into the market's odds of each move at the next meeting.` },
        { id: 'indicators', title: 'Indicators worth watching on FRED',
          plain: r`- **CPI**: consumer prices, the main inflation gauge (and energy prices, a big driver).
- **Unemployment rate**: the jobs half of the mandate.
- **GDP**: total output; watch its change from a year ago.
- **Total public debt**.
- **The Fed's balance sheet** (series WALCL): it grows during **quantitative easing** (the Fed buying bonds) and shrinks when the Fed lets them run off.

"Change from a year ago" is itself a transformation that removes seasonality, a preview of the second half.` },
      ]},
      { id: 's-rates', title: 'Why rates matter to insurers and banks', summary: 'Same lever, different effects.', concepts: [
        { id: 'insrates', title: 'Insurers: rates change investment income',
          plain: r`Insurers invest premiums (mostly in bonds) until claims are paid. **Rising rates**: higher yields → more investment income → better profitability, and products with guaranteed returns (fixed universal life) become more attractive; insurers may share the extra yield through lower premiums or richer benefits. **Falling rates**: less investment income, but cheaper funding to buy or expand businesses.` },
        { id: 'nii', title: 'Banks: net interest income and maturity transformation',
          plain: r`A bank's core profit is **net interest income**: interest earned on loans minus interest paid on deposits. Banks borrow short (deposits) and lend long (mortgages): **maturity transformation**. When the **yield curve** is steep (long rates well above short rates) that margin is wide.

**Rising rates** can raise income, especially with adjustable-rate loans, if deposit rates lag. **Falling rates** can squeeze margins.`,
          formula: r`\[ \text{NII} = \text{interest earned} - \text{interest paid},\qquad \text{NIM} = \frac{\text{NII}}{\text{earning assets}} \]`,
          example: r`Loans of $800M earning 6% ($48M) funded by deposits of $900M costing 2% ($18M): NII = $30M. On $1B of earning assets, NIM = 3%.` },
        { id: 'raterisk', title: 'Interest-rate risk: existing bonds lose value when rates rise',
          plain: r`A bond paying 2% is worth less once new bonds pay 5%, so rising rates **lower the market value** of bonds and fixed-rate loans a bank already holds. **Duration** measures the sensitivity: a bond with duration 7 loses about 7% of its value for each 1-percentage-point rise in rates. This is why interest-rate risk is managed so carefully: it hits both earnings and capital.`,
          formula: r`\[ \frac{\Delta P}{P}\approx -D\times\Delta y \]` },
        { id: 'territory', title: 'Other current topics: surplus lines and territories',
          plain: r`**Surplus lines**: insurers not licensed in a state may cover risks standard carriers refuse (unusual, high-risk or new risks like tech/cyber). **Territory**: auto insurers have priced by zip code; newer work defines risk areas more finely (road layout, traffic), because a zip code can mix very different neighbourhoods.` },
      ]},
      { id: 's-ts', title: 'Time series vocabulary and components', summary: 'What a time series is, and what it is made of.', concepts: [
        { id: 'tsdef', title: 'What a time series is',
          plain: r`A sequence of data points measured at successive times (10-year Treasury yields, the VIX volatility index, monthly claim counts). Time series analysis extracts statistics and patterns from it, often to **forecast**.

Vocabulary pairs:
- **Time domain** (how today affects tomorrow; autocorrelation) vs **frequency domain** (repeating cycles; spectral analysis).
- **Univariate** (one variable) vs **multivariate** (several).
- **Linear** vs **non-linear** (is the current value a linear function of past values?).
- **Discrete** (measured at set times) vs **continuous** (measured at every instant).` },
        { id: 'components', title: 'The four components',
          plain: r`- **Trend**: the long-run tendency to rise, fall or stay flat.
- **Seasonal**: a pattern that repeats at a **fixed** interval within a year (weather, holidays, customs). Hurricane claims every autumn.
- **Cyclical**: medium-term swings with **no fixed** length (expansions and recessions).
- **Irregular**: random, unpredictable shocks (strikes, earthquakes, floods) with no pattern to measure.

Seasonality = fixed period, predictable. Cyclicality = variable length, less predictable.` },
      ]},
      { id: 's-stat', title: 'Stationarity and differencing', summary: 'Most models need a series whose behaviour does not depend on when you look.', concepts: [
        { id: 'stationary', title: 'Stationarity',
          plain: r`A series is **stationary** if its statistical behaviour (mean, variance, correlation pattern) is the same whenever you look. **White noise** (pure random values around a constant) is stationary. A series with a **trend**, **seasonality**, a **changing level** or **growing variance** is not.

Why care? Models learn patterns from the past and assume they continue. If the mean keeps drifting, the past does not describe the future.` },
        { id: 'diff1', title: 'First differences remove trends',
          plain: r`Replace each value by its change from the previous one. A steadily rising series becomes a series of roughly constant changes. You lose the first observation (it has nothing before it).`,
          formula: r`\[ y'_t = y_t - y_{t-1} \]`,
          example: r`Values 100, 104, 109, 113, 118 → differences 4, 5, 4, 5. The trend is gone.` },
        { id: 'diffseason', title: 'Seasonal and second-order differences, and logs',
          plain: r`**Seasonal difference**: subtract the value one season ago (\(m=12\) for monthly data, 4 for quarterly): "lag-m differences". If the result looks like white noise, the forecast is simply last season's value.

**Second-order difference**: difference the differences, "the change in the changes", when one difference is not enough. Rarely needed beyond second order.

**Logs**: if the swings grow with the level, take logs first so variance is steadier. Logs are a pre-processing step, not part of the model.

Choosing among these involves some judgement.`,
          formula: r`\[ y'_t=y_t-y_{t-m}\qquad y''_t=y'_t-y'_{t-1}=y_t-2y_{t-1}+y_{t-2} \]` },
        { id: 'acfcheck', title: 'Checking with the ACF plot',
          plain: r`The **autocorrelation function** (ACF) shows how correlated the series is with itself 1, 2, 3… steps back. Read it before and after differencing:
- **Not stationary**: bars start near 1 and **decay slowly**: today looks like yesterday because of the trend.
- **Stationary**: bars **drop quickly** to near zero and stay inside the shaded significance band.

Lecture 4 uses the ACF and its partner, the PACF, to choose the ARIMA model.`,
          widget: 'acf' },
      ]},
    ],
    sheet: [
      { title: 'Rates: who gains, who loses', cols: ['', 'Rising rates', 'Falling rates'], rows: [
        ['Insurers', 'more investment income; guaranteed-return products more attractive', 'less investment income; cheaper funding for expansion'],
        ['Banks: income', 'NII can rise (adjustable loans, lagging deposit rates)', 'margins can be squeezed'],
        ['Banks: balance sheet', 'existing bonds and fixed-rate loans lose value', 'existing bonds gain value'],
        ['Rule of thumb', r`\(\Delta P/P\approx-D\,\Delta y\)`, ''],
      ]},
      { title: 'Time-series toolkit', cols: ['Tool', 'Formula / sign', 'Use'], rows: [
        ['First difference', r`\(y_t-y_{t-1}\)`, 'remove trend'],
        ['Seasonal difference', r`\(y_t-y_{t-m}\)`, 'remove seasonality (m = 12 monthly)'],
        ['Second difference', r`\(y_t-2y_{t-1}+y_{t-2}\)`, 'if one difference is not enough'],
        ['Log', r`\(\ln y_t\)`, 'steady growing variance (pre-processing)'],
        ['ACF slow decay', '', 'not stationary: difference'],
        ['ACF quick cut-off', '', 'stationary enough to model'],
        ['NII / NIM', r`earned − paid; ÷ earning assets`, 'bank profitability'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'diff1', q: r`A series is 50, 53, 58, 60. What is the last first difference?`, answer: 2, tol: 0.01,
        hint: r`\(y_4-y_3\).`, solution: r`\(60-58=2\). (The differences are 3, 5, 2.)` },
      { id: 'q2', type: 'num', concept: 'diffseason', q: r`Monthly claims were 410 in March 2025 and 452 in March 2026. What is the seasonal difference (lag 12) for March 2026?`, answer: 42, tol: 0.01,
        hint: r`\(y_t-y_{t-12}\).`, solution: r`\(452-410=42\).` },
      { id: 'q3', type: 'num', concept: 'diffseason', q: r`Values 10, 13, 18 (in order). What is the second-order difference at the last point?`, answer: 2, tol: 0.01,
        hint: r`\(y_t-2y_{t-1}+y_{t-2}\).`, solution: r`\(18-2(13)+10=2\). Check: first differences 3, 5; their difference 2.` },
      { id: 'q4', type: 'mcq', concept: 'stationary', q: r`Which series is most likely stationary?`, choices: ['Monthly ice-cream sales over ten years', 'The US price level (CPI) since 1950', 'Daily changes in a stock price', 'A city\'s population by year'], answer: 2,
        hint: 'Trend or season?', solution: r`Daily **changes** are roughly centred around a constant. The others have seasonality (ice cream) or trends (CPI, population).` },
      { id: 'q5', type: 'mcq', concept: 'acfcheck', q: r`An ACF plot starts near 1 and decays very slowly over 20 lags. What should you do?`, choices: ['Fit the model now', 'Difference the series: it is not stationary', 'Drop the first 20 observations', 'Increase the significance band'], answer: 1,
        hint: 'What does slow decay mean?', solution: r`Slow decay is the signature of a trend (non-stationary). Difference and check again.` },
      { id: 'q6', type: 'mcq', concept: 'components', q: r`Recessions and expansions of irregular length are which component?`, choices: ['Trend', 'Seasonal', 'Cyclical', 'Irregular'], answer: 2,
        hint: 'Fixed or variable period?', solution: r`**Cyclical**: medium-term swings with no fixed length. Seasonal patterns repeat at a fixed interval.` },
      { id: 'q7', type: 'num', concept: 'nii', q: r`A bank earns $60M interest on loans and pays $25M on deposits, with $1.4B of earning assets. What is its net interest margin, as a decimal?`, answer: 35 / 1400, show: '0.025 (2.5%)',
        hint: 'NII ÷ earning assets.', solution: r`NII = $35M; \(35/1400=0.025\) = 2.5%.` },
      { id: 'q8', type: 'num', concept: 'raterisk', q: r`A bond portfolio has duration 6. Rates rise by 1.5 percentage points. Approximately what percentage of value does it lose? (Answer as a positive number, e.g. 5 for 5%.)`, answer: 9, tol: 0.05,
        hint: r`\(D\times\Delta y\).`, solution: r`\(6\times1.5=9\%\).` },
      { id: 'q9', type: 'mcq', concept: 'insrates', q: r`Why do rising interest rates tend to help insurers?`, choices: ['They reduce claims', 'Insurers earn higher yields investing premiums until claims are paid', 'They lower reinsurance costs', 'They shrink reserves'], answer: 1,
        hint: 'Where does the premium go before claims?', solution: r`Premiums are invested, mostly in bonds, until claims are paid. Higher yields mean more investment income.` },
      { id: 'q10', type: 'mcq', concept: 'diffseason', q: r`A sales series grows and its seasonal swings get bigger as it grows. What is a sensible first step?`, choices: ['Take logs, then difference', 'Add a constant', 'Use second differences only', 'Nothing'], answer: 0,
        hint: 'Growing variance.', solution: r`Logs turn proportional swings into constant ones; then difference (seasonally and/or first) to remove trend and season.` },
      { id: 'q11', type: 'self', concept: 'nii', q: r`Explain why a steep yield curve is good for a bank, and what happens to the same bank if short-term rates jump above long-term rates.`,
        hint: 'Maturity transformation.',
        solution: r`Banks fund long-term loans (priced off long rates) with short-term deposits (priced off short rates). A steep curve means a wide gap between what they earn and what they pay, so net interest margin is high. If short rates jump above long rates (an inverted curve), deposit costs can rise faster than loan income, squeezing or even reversing the margin, while the value of their existing long-term bonds and loans falls.` },
    ]
  });
})();
