(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l7', num: 7, minutes: 70,
    title: 'ARIMA review and catastrophe modelling',
    oneLiner: r`A **cat model** simulates thousands of possible years of disasters to answer: what do we lose on average (**AAL**), how bad is a 1-in-100 year (**OEP/AEP**), and what does a reinsurance **layer** pay?`,
    leadsTo: 'Next: cat bonds and weather futures, cloud costs, and the AI-tool vocabulary for your project.',
    bigPicture: {
      what: r`**ARIMA review**: the same steps as Lecture 4, plus economic context: Robert Hall's 1978 finding that consumption behaves roughly like a random walk, "social inflation" in liability claims, and the Atlanta Fed's GDPNow nowcast.

**Catastrophe modelling**: the four modules (hazard → exposure → vulnerability → financial); the tables that come out (event, year and period loss tables); the risk metrics (AAL, OEP, AEP, PML, TVaR); how an excess-of-loss reinsurance **layer** works; why **copulas** matter when two perils or regions can be hit together; and practical issues (vectorised code, secondary uncertainty, validation).`,
      why: r`Every property insurer and reinsurer runs cat models to price, buy reinsurance and satisfy regulators and rating agencies. The metrics here are the vocabulary of that whole industry.`,
      remember: r`1. AAL = average yearly loss = (events per year) × (average loss per event).
2. OEP looks at the **largest single event** in a year; AEP at the **total** for the year. So AEP ≥ OEP at every return period.
3. A layer "$10M xs $5M" pays \(\min(\max(L-5,0),10)\) million: nothing below $5M, at most $10M.`
    },
    sections: [
      { id: 's-review', title: 'ARIMA review, in economic context', summary: 'Why random walks show up in real economic data.', concepts: [
        { id: 'hall', title: 'Consumption as a random walk',
          plain: r`Robert Hall (1978) argued that if people plan spending using everything they know (the "permanent income" idea), then next quarter's consumption should equal this quarter's plus an **unpredictable** surprise: a random walk, ARIMA(0,1,0). Past income should not help predict changes in consumption. Real data roughly agrees, with deviations (some households cannot borrow, so they spend as income arrives).

The takeaway for forecasting: for many economic series, "tomorrow = today" is a hard benchmark to beat. Always compare your ARIMA against it.` },
        { id: 'socialinfl', title: 'Social inflation and nowcasting',
          plain: r`**Social inflation**: liability claim costs rising faster than general inflation because of larger jury awards, litigation funding and changing attitudes toward corporations. It shows up as a trend in claim-severity series that CPI does not explain.

**GDPNow** (Atlanta Fed): a model that updates its estimate of current-quarter GDP growth as each new data release arrives, a "nowcast" before the official figure.` },
      ]},
      { id: 's-cat', title: 'How a cat model works', summary: 'Four modules and three tables.', concepts: [
        { id: 'modules', title: 'Hazard, exposure, vulnerability, financial',
          plain: r`1. **Hazard**: a catalogue of simulated events (each hurricane's track and wind speeds, each earthquake's shaking) with yearly frequencies.
2. **Exposure**: what you insure and where (location, value, construction, occupancy).
3. **Vulnerability**: damage functions, how much of a building's value is lost at a given wind speed or water depth.
4. **Financial**: apply policy terms (deductibles, limits) and reinsurance to turn ground-up damage into insured and net loss.` },
        { id: 'tables', title: 'ELT, YLT and PLT',
          plain: r`- **Event loss table (ELT)**: one row per catalogue event: annual rate, mean loss, standard deviation (and exposure).
- **Year loss table (YLT)**: simulate many years (say 10,000); for each year list the events that happened and their losses.
- **Period loss table (PLT)**: like a YLT, with dates within each year, needed for contracts with time-based terms.

Metrics like OEP and AEP are read straight off the simulated years.` },
        { id: 'metrics', title: 'AAL, OEP, AEP, PML, TVaR',
          plain: r`- **AAL** (average annual loss): mean of yearly totals. The "pure premium" before expenses and profit.
- **OEP** (occurrence exceedance probability): chance that the **largest single event** in a year exceeds a loss. "1-in-100 OEP" = the loss exceeded by the biggest event in 1% of years.
- **AEP** (aggregate exceedance probability): the same for the **sum** of all events in a year. Always \(\ge\) OEP.
- **PML** (probable maximum loss): a loss at a chosen return period, often the 1-in-100 or 1-in-250 OEP.
- **TVaR** (tail value at risk): the **average** loss in the years beyond that return period. It describes how bad the tail is, not just where it starts.`,
          formula: r`\[ \text{AAL}=\lambda\times E[\text{loss per event}] \qquad \text{1-in-}T\text{ loss}=\text{the }(1-1/T)\text{ quantile} \]`,
          example: r`The lecture's sandbox: events arrive Poisson with \(\lambda=0.3\) per year; each loss is Gamma with shape 2 and scale $5M (mean $10M). AAL \(=0.3\times10=\$3.0\)M. From the simulation: 1-in-100 OEP ≈ $26.3M, AEP ≈ $30.5M, TVaR(1%) ≈ $38.2M.` },
      ]},
      { id: 's-layer', title: 'Reinsurance layers', summary: 'What an excess-of-loss layer pays.', concepts: [
        { id: 'xol', title: 'Excess-of-loss: "$10M xs $5M"',
          plain: r`The reinsurer pays the part of each event loss **above the attachment** ($5M), **up to the limit** ($10M). Below $5M the insurer keeps everything (its retention); above $15M the insurer is back on the hook.

Useful layer statistics:
- **Expected layer loss**: the average yearly payout; the base of the reinsurance price.
- **P(attach)**: chance at least one event reaches the layer.
- **P(exhaust)**: chance an event uses up the full limit.

Try the simulation: move the attachment and limit and watch the layer's numbers and the OEP curve.`,
          formula: r`\[ \text{ceded}=\min\big(\max(L-\text{attach},0),\ \text{limit}\big) \]`,
          widget: 'xol',
          example: r`Losses of $3M, $9M and $22M: the layer pays 0, 4 and 10 million; the insurer retains 3, 5 and 12 million. In the sandbox: expected layer loss ≈ $1.3M/yr, P(attach) ≈ 19.8%, P(exhaust) ≈ 5.9%.` },
      ]},
      { id: 's-copula', title: 'Dependence: copulas', summary: 'What happens when bad years arrive together.', concepts: [
        { id: 'copula', title: 'Copulas and tail dependence',
          plain: r`An insurer exposed to two regions or perils wants the combined 1-in-200 loss. If losses were independent, a terrible year in one would usually be an ordinary year in the other: **diversification**. But a single storm or economic shock can hit both.

A **copula** joins two separately modelled distributions with a chosen dependence structure (**Sklar's theorem**: any joint distribution = its marginals + a copula). A **Gaussian** copula has correlation but little **tail dependence** (extremes rarely coincide); a **t** copula makes extremes coincide more often.

Lecture sandbox (standalone 1-in-200 losses $26.4M and $21.9M, sum $48.3M): combined 1-in-200 = $33.9M independent, $39.5M Gaussian, $42.8M t-copula. The diversification benefit shrinks as tail dependence grows.`,
          formula: r`\[ \text{diversification benefit}=1-\frac{\text{combined loss}}{\text{sum of standalone losses}} \]`,
          example: r`Independent: \(1-33.9/48.3\approx29.8\%\). t-copula: \(1-42.8/48.3\approx11.4\%\).` },
      ]},
      { id: 's-practice', title: 'Practical issues', summary: 'Speed, uncertainty and trust.', concepts: [
        { id: 'practical', title: 'Vectorisation, secondary uncertainty, validation',
          plain: r`- **Vectorisation**: simulating 100,000 years in a Python loop is slow; doing it as NumPy array operations was about 650× faster in the lecture's demo.
- **Secondary uncertainty**: even for a known event, damage to a building is uncertain. Sample losses from a distribution around each event's mean instead of using the mean alone; it fattens the tail.
- **Validation**: compare modelled losses with actual historical events, check that results are stable as the number of simulated years grows, and stress-test assumptions. Different vendor models can disagree substantially for the same portfolio.` },
      ]},
    ],
    sheet: [
      { title: 'Metrics', cols: ['Metric', 'What it measures', 'Sandbox value'], rows: [
        ['AAL', r`mean yearly loss: \(\lambda\times\) mean severity`, '$3.0M'],
        ['1-in-100 OEP', 'largest single event exceeded in 1% of years', '$26.3M'],
        ['1-in-100 AEP', 'yearly total exceeded in 1% of years', '$30.5M'],
        ['TVaR (1%)', 'average loss in the worst 1% of years', '$38.2M'],
        ['Layer $10M xs $5M', 'expected yearly payout', '$1.3M'],
        ['P(attach) / P(exhaust)', 'layer reached / used up', '19.8% / 5.9%'],
      ]},
      { title: 'Copula comparison (1-in-200)', cols: ['Dependence', 'Combined loss', 'Diversification benefit'], rows: [
        ['Independent', '$33.9M', '29.8%'],
        ['Gaussian copula', '$39.5M', '18.2%'],
        ['t copula', '$42.8M', '11.4%'],
        ['Sum of standalones', '$48.3M', '0%'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'metrics', q: r`A peril produces on average 0.5 events per year, with mean loss $8M per event. What is the AAL, in $ millions?`, answer: 4, tol: 0.01,
        hint: r`\(\lambda\times\) mean.`, solution: r`\(0.5\times8=\$4\)M.` },
      { id: 'q2', type: 'num', concept: 'xol', q: r`Layer: $10M xs $5M. An event causes a $12M loss. How much does the reinsurer pay, in $ millions?`, answer: 7, tol: 0.01,
        hint: r`\(\min(\max(12-5,0),10)\).`, solution: r`\(12-5=7\), under the limit: $7M.` },
      { id: 'q3', type: 'num', concept: 'xol', q: r`Same layer, a $30M loss. Reinsurer pays? (in $ millions)`, answer: 10, tol: 0.01,
        hint: 'Capped at the limit.', solution: r`\(30-5=25\), capped at $10M. The insurer keeps 5 + 15 = $20M.` },
      { id: 'q4', type: 'num', concept: 'xol', q: r`Same layer, a $4M loss. Reinsurer pays? (in $ millions)`, answer: 0, tol: 0.001,
        hint: 'Below attachment.', solution: r`Below $5M the layer pays nothing.` },
      { id: 'q5', type: 'mcq', concept: 'metrics', q: r`A year has three events: $6M, $8M, $10M. Which statement is right?`, choices: ['Occurrence loss $24M, aggregate $10M', 'Occurrence (largest) $10M, aggregate $24M', 'Both $24M', 'Both $10M'], answer: 1,
        hint: 'OEP uses the max; AEP the sum.', solution: r`OEP uses the largest event ($10M); AEP uses the total ($24M).` },
      { id: 'q6', type: 'mcq', concept: 'metrics', q: r`Why is the 1-in-100 AEP always at least the 1-in-100 OEP?`, choices: ['Different models', 'A yearly total is always at least as big as its largest event', 'AEP adds expenses', 'It is not always true'], answer: 1,
        hint: 'Sum vs max.', solution: r`Each year's total ≥ its largest event, so every quantile of the totals ≥ the same quantile of the maxima.` },
      { id: 'q7', type: 'num', concept: 'metrics', q: r`With 10,000 simulated years sorted from worst to best, which rank gives the 1-in-100 loss?`, answer: 100, tol: 0.01,
        hint: '1% of years.', solution: r`1% of 10,000 = the 100th-worst year.` },
      { id: 'q8', type: 'mcq', concept: 'metrics', q: r`What does TVaR add beyond the 1-in-100 loss?`, choices: ['The average of all years', 'The average loss in the years worse than the 1-in-100 threshold', 'The best-case loss', 'The premium'], answer: 1,
        hint: 'Tail average.', solution: r`TVaR averages the tail beyond the threshold, so it captures how bad the worst years get.` },
      { id: 'q9', type: 'num', concept: 'copula', q: r`Standalone 1-in-200 losses are $30M and $20M; combined 1-in-200 is $40M. What is the diversification benefit? (decimal)`, answer: 0.2,
        hint: r`\(1-40/50\).`, solution: r`\(1-40/50=0.2\) = 20%.` },
      { id: 'q10', type: 'mcq', concept: 'copula', q: r`Compared with a Gaussian copula at the same correlation, a t copula gives…`, choices: ['a smaller combined tail loss', 'a larger combined tail loss, because extremes coincide more often', 'the same result', 'independence'], answer: 1,
        hint: 'Tail dependence.', solution: r`The t copula has tail dependence: extreme years line up more often, so the combined tail is bigger and diversification is smaller.` },
      { id: 'q11', type: 'mcq', concept: 'modules', q: r`Which module turns wind speed at a building into a percentage of value damaged?`, choices: ['Hazard', 'Exposure', 'Vulnerability', 'Financial'], answer: 2,
        hint: 'Damage functions.', solution: r`**Vulnerability** (damage functions).` },
      { id: 'q12', type: 'mcq', concept: 'hall', q: r`If consumption follows a random walk, the best forecast of next quarter's consumption is…`, choices: ['the long-run average', 'this quarter\'s consumption', 'last year\'s growth rate', 'zero'], answer: 1,
        hint: 'ARIMA(0,1,0).', solution: r`Changes are unpredictable, so the best forecast is today's value.` },
      { id: 'q13', type: 'self', concept: 'practical', q: r`An insurer's cat model output looks surprisingly benign compared with a competitor's. List three things you would check.`,
        hint: 'Inputs, model, outputs.',
        solution: r`(1) Exposure data quality: missing locations, wrong construction types or under-reported values make losses look small. (2) Whether secondary uncertainty and demand surge are switched on, and which event catalogue/version is used. (3) Validation against history: do modelled losses for past events match actual claims? Also check simulation stability (enough years) and whether dependence between regions is modelled.` },
    ]
  });
})();
