(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l2', num: 2, minutes: 60,
    title: 'Measuring claims, making mortgages, and judging yes/no models',
    oneLiner: r`Claims have a **frequency** and a **severity**; a mortgage passes through origination, servicing and sale; and for rare outcomes (default, fraud) **accuracy lies**, so use precision, recall and F1.`,
    leadsTo: 'Next: interest rates, and how to analyse data that moves through time.',
    bigPicture: {
      what: r`Four topics:

1. **AI settings**: temperature and top-p, which control how random a model's answers are.
2. **Insurance metrics**: frequency vs severity, severity ratios in the NFIP data, loss development triangles, and subrogation.
3. **Mortgages**: how one is made (nine steps), who services it, and why banks sell it to Fannie Mae and Freddie Mac.
4. **Data skills**: three kinds of average, imbalanced datasets, and the confusion matrix with precision, recall, accuracy and F1. This leads into the homework.`,
      why: r`Most banking and insurance prediction problems are yes/no with a rare "yes": will this loan default, is this claim fraud. Picking the wrong metric makes a useless model look excellent. The same metrics return in Lecture 9 (ROC, AUC, Youden's J).`,
      remember: r`1. Frequency = how many claims; severity = how big. Severity ratios above 1.0 (paid more than the property is worth) are suspect.
2. A mortgage is originated, serviced, and often sold into a pool; Fannie Mae and Freddie Mac hold or guarantee about 70% of outstanding mortgages.
3. Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = their harmonic mean. With 1% positives, "always no" scores 99% accuracy.`
    },
    sections: [
      { id: 's-ai', title: 'AI settings: temperature and top-p', summary: 'Two knobs that control how random a model\'s answer is.', concepts: [
        { id: 'temptop', title: 'Temperature and top-p',
          plain: r`A language model picks each next word from a probability list.

**Temperature** reshapes that list. Low temperature: the most likely words dominate, answers are focused and repeatable. High temperature: the list flattens, answers are more varied and creative, and more error-prone.

**Top-p** trims the list: keep the most likely words until their probabilities add up to p, and choose only among those. Low top-p = only the safest words; high top-p = a bigger pool.

For code and data analysis, use low settings. You can try both in Google AI Studio.`,
          example: r`Probabilities: "rose" 0.5, "fell" 0.3, "stalled" 0.15, "danced" 0.05. With top-p = 0.8, only "rose" and "fell" (0.5 + 0.3 = 0.8) can be chosen.` },
      ]},
      { id: 's-ins', title: 'Insurance: claims metrics', summary: 'How often, how big, and how claims grow over time.', concepts: [
        { id: 'freqsev', title: 'Frequency and severity',
          plain: r`**Frequency** is a count: how many claims (per year, per 1,000 policies). **Severity** is a dollar amount: how big each claim is. Expected loss is the product. They behave differently and are usually modelled separately: frequency with a count distribution (Poisson, or geometric/negative binomial when claims bunch up), severity with a skewed distribution (most claims small, a few huge).`,
          formula: r`\[ \text{expected loss} = \text{frequency}\times\text{average severity} \]`,
          example: r`5 claims per 100 homes per year at $20,000 average: expected loss $1,000 per home per year.` },
        { id: 'ratios', title: 'Severity ratios in the NFIP data',
          plain: r`Raw dollar amounts are hard to compare between a $100,000 house and a $2 million one, so compare **ratios**:
1. buildingDamageAmount / buildingPropertyValue
2. amountPaidOnBuildingClaim / totalBuildingInsuranceCoverage
3. amountPaidOnContentsClaim / totalContentsInsuranceCoverage
4. contentsDamageAmount / contentsPropertyValue
5. amountPaidOnIncreasedCostOfComplianceClaim / iccCoverage

A ratio **above 1.0** (damage bigger than the property's value, or paid more than the coverage) is almost certainly a data error, or something to investigate.` },
        { id: 'triangle', title: 'Loss development triangles',
          plain: r`Claims for one year's accidents keep growing for years: some are reported late, others are paid in installments. A triangle lays this out: one row per accident year, one column per age (12 months, 24, 36…). Recent years have fewer columns filled in, which gives the triangle shape.

**Chain ladder**: for each step (12→24 months, 24→36…), divide the column totals to get an **age-to-age factor**, then multiply each year's latest value by the remaining factors to estimate its **ultimate** loss. Ultimate minus paid so far = the reserve needed.`,
          formula: r`\[ f_{12\to24} = \frac{\sum \text{value at }24}{\sum \text{value at }12\ (\text{same years})},\qquad \text{ultimate} = \text{latest}\times\prod \text{remaining factors} \]`,
          example: r`<table class="sheet"><thead><tr><th>Accident year</th><th>12 mo</th><th>24 mo</th><th>36 mo</th></tr></thead><tbody><tr><td>2022</td><td>100</td><td>150</td><td>165</td></tr><tr><td>2023</td><td>120</td><td>174</td><td></td></tr><tr><td>2024</td><td>130</td><td></td><td></td></tr></tbody></table>

\(f_{12\to24}=(150+174)/(100+120)=1.473\); \(f_{24\to36}=165/150=1.10\). Ultimate for 2024: \(130\times1.473\times1.10\approx210.6\).` },
        { id: 'subro', title: 'Subrogation',
          plain: r`After paying a claim, the insurer can "step into the shoes" of its policyholder and sue whoever caused the loss to recover the money: for example, an electrician whose faulty repair started a fire. Recoveries reduce the net cost of claims, and spotting claims with subrogation potential is a classic data-science task.` },
      ]},
      { id: 's-mort', title: 'Banking: how a mortgage is made, serviced and sold', summary: 'Deposits in, loans out, and then often sold on.', concepts: [
        { id: 'originate', title: 'Originating a mortgage',
          plain: r`A bank needs **deposits** (money to lend) and **demand** for loans. Demand depends on prices, rates and whether renting is cheaper (the price-to-rent ratio).

The steps for a buyer:
1. Get pre-qualified / pre-approved
2. Find a real estate agent
3. Shop for a home
4. Make an offer
5. Submit the loan to underwriting
6. Conditional approval
7. Final approval
8. Loan signing
9. Funding and recording` },
        { id: 'service', title: 'Servicing',
          plain: r`After closing, someone must collect monthly principal and interest, manage **escrow** (taxes and insurance paid on the owner's behalf), keep in touch with the borrower, and follow up when a loan goes delinquent. Banks either service in-house or outsource it; the servicer earns a fee.` },
        { id: 'sell', title: 'Pooling and selling mortgages',
          plain: r`A bank can keep a mortgage on its books for 30 years or sell it. Why sell? **Risk transfer** (default and interest-rate risk move to the buyer) and **balance-sheet room** (cash comes back to make new loans).

The main buyers are the government-sponsored enterprises **Fannie Mae** and **Freddie Mac**, which pool mortgages into mortgage-backed securities. They account for about **70%** of outstanding mortgages. **Ginnie Mae** guarantees pools of government-insured (FHA, VA) loans. The original servicer often keeps collecting the payments after the sale.` },
      ]},
      { id: 's-data', title: 'Data skills: averages, imbalance, and the confusion matrix', summary: 'Choosing the right summary and the right metric.', concepts: [
        { id: 'means', title: 'Three kinds of average',
          plain: r`- **Arithmetic mean**: add up and divide. The default.
- **Geometric mean**: multiply and take the nth root. Use for growth rates and ratios (average return over several years).
- **Harmonic mean**: n divided by the sum of reciprocals. Use for rates such as speed or price per unit, and it is what F1 uses.

For positive numbers that are not all equal: harmonic < geometric < arithmetic. Others: root mean square (RMS), trimmed mean (drop the extremes), weighted mean, midrange.`,
          formula: r`\[ \bar x_A=\frac{\sum x_i}{n},\qquad \bar x_G=\sqrt[n]{x_1x_2\cdots x_n},\qquad \bar x_H=\frac{n}{\sum 1/x_i} \]`,
          example: r`Data 2, 5, 6: arithmetic 4.33; geometric \(\sqrt[3]{60}=3.91\); harmonic \(3/(0.5+0.2+0.167)=3.46\).` },
        { id: 'imbalanced', title: 'Imbalanced datasets',
          plain: r`When one class is rare (loan default, fraud, churn, a positive medical test, spam), a model can ignore it and still look accurate. Options:
- **Oversample** the rare class (repeat examples).
- **Undersample** the common class (drop examples).
- **SMOTE** (Synthetic Minority Oversampling Technique): create new rare-class examples on the lines between existing ones.
- Choose metrics that focus on the rare class (below).

Resample only the training data, never the test data.`,
          watch: r`Inventing data has limits. The lecture's example: filling in trading data that was missing because a market was shut is not the same as data that existed.` },
        { id: 'confusion', title: 'The confusion matrix',
          plain: r`Compare predictions with reality:
- **TP** true positive: predicted yes, was yes.
- **FN** false negative (**Type II error**): predicted no, was yes. A missed default.
- **FP** false positive (**Type I error**): predicted yes, was no. A false alarm.
- **TN** true negative.

From these: **precision** (when it says yes, how often is it right?), **recall** or TPR (of all real yeses, how many did it catch?), **FPR** (of all real noes, how many were false alarms?), **accuracy**, and **F1**, the harmonic mean of precision and recall.`,
          formula: r`\[ \text{Precision}=\frac{TP}{TP+FP},\quad \text{Recall}=\frac{TP}{TP+FN},\quad \text{FPR}=\frac{FP}{FP+TN} \]
\[ \text{Accuracy}=\frac{TP+TN}{TP+TN+FP+FN},\qquad F_1=\frac{2\cdot\text{Precision}\cdot\text{Recall}}{\text{Precision}+\text{Recall}} \]`,
          widget: 'confusion',
          example: r`TP 100, FN 5, FP 10, TN 50: precision 0.9091, recall 0.9524, accuracy 0.9091, F1 0.9302.` },
        { id: 'whichmetric', title: 'Accuracy or F1?',
          plain: r`If 1% of loans default, a model that always says "no default" is 99% accurate and catches nothing. So:
- **Accuracy** is fine when classes are balanced and both kinds of correct answer matter.
- **F1** is better for imbalanced data, and when errors are costly: false negatives (a missed disease, a missed default) or false positives (a real email sent to spam).` },
      ]},
    ],
    sheet: [
      { title: 'Formulas', cols: ['Quantity', 'Formula'], rows: [
        ['Expected loss', 'frequency × average severity'],
        ['Severity ratio', 'damage ÷ property value, or paid ÷ coverage (> 1.0 is suspect)'],
        ['Age-to-age factor', 'sum at later age ÷ sum at earlier age, same accident years'],
        ['Ultimate loss', 'latest value × remaining factors'],
        ['Arithmetic / geometric / harmonic', r`\(\sum x/n\) / \(\sqrt[n]{\prod x}\) / \(n/\sum(1/x)\)`],
        ['Precision', r`\(TP/(TP+FP)\)`],
        ['Recall (TPR)', r`\(TP/(TP+FN)\)`],
        ['FPR', r`\(FP/(FP+TN)\)`],
        ['Accuracy', r`\((TP+TN)/\text{all}\)`],
        ['F1', r`\(2PR/(P+R)\)`],
      ]},
      { title: 'Mortgage life cycle', cols: ['Stage', 'What happens', 'Who'], rows: [
        ['Origination', 'pre-approval → offer → underwriting → approval → closing → funding', 'bank, broker, buyer'],
        ['Servicing', 'collect payments, manage escrow, handle delinquency', 'bank or outsourced servicer'],
        ['Sale', 'pooled into mortgage-backed securities', 'Fannie Mae, Freddie Mac (~70%), Ginnie Mae (FHA/VA)'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'means', q: r`What is the geometric mean of 2, 8 and 4?`, answer: 4, tol: 0.01,
        hint: r`\(\sqrt[3]{2\times8\times4}\).`, solution: r`\(\sqrt[3]{64}=4\).` },
      { id: 'q2', type: 'num', concept: 'means', q: r`A car drives one mile at 30 mph and a second mile at 60 mph. What is its average speed over the two miles? (Use the harmonic mean.)`, answer: 40, tol: 0.01,
        hint: r`\(2/(1/30+1/60)\).`, solution: r`\(2/(0.0333+0.0167)=2/0.05=40\) mph, not 45: the slow mile takes twice as long.` },
      { id: 'q3', type: 'num', concept: 'confusion', q: r`A default model gives TP = 40, FN = 10, FP = 20, TN = 930. What is its precision?`, answer: 40 / 60, show: '40/60 ≈ 0.667',
        hint: r`\(TP/(TP+FP)\).`, solution: r`\(40/60\approx0.667\).` },
      { id: 'q4', type: 'num', concept: 'confusion', q: r`Same model. What is its recall?`, answer: 0.8,
        hint: r`\(TP/(TP+FN)\).`, solution: r`\(40/50=0.8\).` },
      { id: 'q5', type: 'num', concept: 'confusion', q: r`Same model. What is its F1 score?`, answer: 2 * (2 / 3) * 0.8 / (2 / 3 + 0.8), show: '≈ 0.727',
        hint: r`\(2PR/(P+R)\).`, solution: r`\(2\times0.667\times0.8/(0.667+0.8)\approx0.727\).` },
      { id: 'q6', type: 'num', concept: 'whichmetric', q: r`1,000 loans, 10 of which default. A model predicts "no default" for every loan. What is its accuracy?`, answer: 0.99,
        hint: 'How many does it get right?', solution: r`990 correct out of 1,000 = 0.99. Its recall is 0: it never catches a default.` },
      { id: 'q7', type: 'num', concept: 'triangle', q: r`A new triangle: accident year 2021 has 80 at 12 months, 120 at 24 and 138 at 36; accident year 2022 has 140 at 24 months. Estimate the ultimate loss for 2022.`, answer: 161, tol: 0.5,
        hint: r`Find \(f_{24\to36}\) from 2021, then apply it to 2022's latest value.`, solution: r`\(f_{24\to36}=138/120=1.15\). Ultimate for 2022 \(=140\times1.15=161\).` },
      { id: 'q8', type: 'num', concept: 'triangle', q: r`Accident year values at 12 months: 200 and 250; at 24 months for the same two years: 300 and 350. What is the 12→24 age-to-age factor?`, answer: 650 / 450, show: '650/450 ≈ 1.444',
        hint: 'Sum the columns first.', solution: r`\((300+350)/(200+250)=650/450\approx1.444\).` },
      { id: 'q9', type: 'mcq', concept: 'ratios', q: r`An NFIP claim shows amountPaidOnBuildingClaim = $180,000 with totalBuildingInsuranceCoverage = $150,000. What should you conclude?`, choices: ['Normal claim', 'The ratio is above 1.0: suspect, check the record', 'The contents coverage was used', 'It is an ICC claim'], answer: 1,
        hint: 'Paid ÷ coverage.', solution: r`\(180/150=1.2>1.0\): paid more than the coverage, which should not happen. Investigate or flag as a data error.` },
      { id: 'q10', type: 'mcq', concept: 'sell', q: r`Why might a bank sell a mortgage it just made?`, choices: ['To increase its interest-rate risk', 'To transfer risk and free up its balance sheet to make new loans', 'Because servicing is illegal', 'Because GSEs pay more interest than borrowers'], answer: 1,
        hint: 'Risk and capital.', solution: r`Selling moves default and rate risk to the buyer and returns cash the bank can lend again.` },
      { id: 'q11', type: 'mcq', concept: 'temptop', q: r`You want an AI assistant to write the same correct Python code every time. Which settings?`, choices: ['High temperature, high top-p', 'Low temperature, low top-p', 'High temperature, low top-p', 'It makes no difference'], answer: 1,
        hint: 'Focused vs creative.', solution: r`Low temperature and low top-p keep the model on its most likely, most consistent choices.` },
      { id: 'q12', type: 'mcq', concept: 'confusion', q: r`A spam filter puts an important email into spam. Which error is that?`, choices: ['True positive', 'False negative (Type II)', 'False positive (Type I)', 'True negative'], answer: 2,
        hint: '"Spam" is the positive class.', solution: r`It predicted "spam" (positive) for a real email (negative): a **false positive**, Type I error.` },
      { id: 'q13', type: 'self', concept: 'imbalanced', q: r`Your fraud dataset is 0.5% fraud. Describe two ways to handle the imbalance and which metric you would report.`,
        hint: 'Resampling and metrics.',
        solution: r`Resample the **training** set only: oversample fraud (or SMOTE to create synthetic fraud cases) and/or undersample legitimate claims; or weight the rare class more in the model. Leave the test set untouched so it reflects reality. Report precision, recall and F1 (or AUC, Lecture 9), not accuracy, which would be 99.5% for a model that never flags fraud.` },
    ]
  });
})();
