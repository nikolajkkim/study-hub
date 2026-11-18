(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l9', num: 9, minutes: 65,
    title: 'Fraud, spatial statistics, interpolation and model evaluation',
    oneLiner: r`Nearby places tend to be alike. **Moran's I** measures how much; **Thiessen polygons, IDW and kriging** fill in values between measurements; **ROC/AUC** and **spatial cross-validation** tell you whether a model really works.`,
    leadsTo: 'Next: in-class quiz on Thursday, November 20 (covers the whole course so far).',
    bigPicture: {
      what: r`1. **Insurance fraud**: common schemes, and how models flag suspicious claims.
2. **Spatial autocorrelation**: Tobler's first law, Moran's I, and how to define "neighbours" (rook, queen, row-standardised weights).
3. **Spatial interpolation**: estimating values where you have no measurement: Thiessen (Voronoi) polygons, nearest neighbour, inverse distance weighting (IDW), kriging.
4. **Model evaluation**: ROC curve, AUC, Youden's J, and k-fold vs spatial k-fold cross-validation.
5. **Analysis frameworks**: SWOT and PESTEL, and a two-minute paper review format.`,
      why: r`Insurance risk is spatial: floods, fires and fraud rings cluster. Ignoring that gives overconfident models. Evaluation metrics decide whether a fraud or default model is good enough to use.`,
      remember: r`1. Moran's I near +1 = clustered, near 0 (precisely \(-1/(N-1)\)) = random, near −1 = dispersed (checkerboard).
2. IDW: weights \(1/d^p\), so closer points count more.
3. With spatial autocorrelation, random k-fold cross-validation leaks information between neighbours and looks too good; use **spatial** folds.`
    },
    sections: [
      { id: 's-fraud', title: 'Insurance fraud', summary: 'What it looks like and how data helps.', concepts: [
        { id: 'fraud', title: 'Common schemes and red flags',
          plain: r`Typical scenarios discussed:
- Staged auto accidents (often by organised rings).
- Inflated claims (exaggerating damage after a real event).
- Premium fraud: misstating facts (garaging address, mileage, prior claims) to pay less.
- Fake injuries or treatment billed by complicit providers.
- Arson or deliberate damage.
- Policies bought just before a known loss.

Data science: score each claim for suspicion so investigators (special investigation units) look at the right ones. Features: time since policy start, claim size vs typical, repeated parties or providers across claims, location clusters. The lecture noted that in this kind of messy behavioural data, a model explaining more than half the variance (\(R^2>50\%\)) can already be useful. Because fraud is rare, use the imbalanced-data tools from Lecture 2.` },
      ]},
      { id: 's-moran', title: 'Spatial autocorrelation', summary: 'Measuring "near things are more alike".', concepts: [
        { id: 'tobler', title: 'Tobler\'s first law and neighbours',
          plain: r`"Everything is related to everything else, but near things are more related than distant things." To measure it you must define **neighbours** with a weights matrix \(w_{ij}\):
- **Rook** contiguity: share an **edge** (up, down, left, right).
- **Queen** contiguity: share an edge **or a corner** (adds diagonals).
- Hexagon grids: every neighbour shares an edge, so rook and queen agree (6 neighbours).
- **First order** = direct neighbours; **second order** = neighbours of neighbours.
- **Row standardisation**: divide each row by its number of neighbours so each region's weights sum to 1. A region with 3 neighbours gives each \(1/3\).

US states with queen contiguity: Missouri and Tennessee have the most neighbours (8).`,
          example: r`A 2×3 grid A B C / D E F, rook: B touches A, C, E (3 neighbours); E touches B, D, F (3); corners touch 2. Row-standardised, B's weights are 1/3 each for A, C and E.` },
        { id: 'moran', title: 'Moran\'s I',
          plain: r`Moran's I is like a correlation between each region's value and its neighbours' values. Above-average regions next to above-average regions push it positive; above-average next to below-average push it negative.
- **+1**: strong clustering (similar values together).
- **≈ \(-1/(N-1)\)** (close to 0 for large N): random pattern.
- **−1**: dispersion (checkerboard).

Lecture examples for US states: precipitation \(I\approx0.486\) (strongly clustered: wet states border wet states), median income \(I\approx-0.003\) (no spatial pattern). Significance is tested by comparing with random shuffles of the values (a permutation test).`,
          formula: r`\[ I=\frac{N}{W}\cdot\frac{\sum_i\sum_j w_{ij}(x_i-\bar x)(x_j-\bar x)}{\sum_i(x_i-\bar x)^2},\qquad E[I]=-\frac{1}{N-1} \]
\(N\) = number of regions; \(W=\sum_i\sum_j w_{ij}\) = sum of all weights.`,
          widget: 'moran' },
      ]},
      { id: 's-interp', title: 'Spatial interpolation', summary: 'Estimating values between measurement points.', concepts: [
        { id: 'thiessen', title: 'Thiessen (Voronoi) polygons',
          plain: r`Assign every location to its **nearest** measuring station, so each station "owns" a polygon. To build them:
1. Plot the stations.
2. Connect neighbouring stations with lines (a triangulation).
3. Draw the perpendicular bisector of each line.
4. The bisectors meet to form polygons around each station.
5. Clip to the study area.

Area-weighted average for a region: weight each station's value by the share of the region its polygon covers. Simple, but values jump abruptly at polygon edges.`,
          formula: r`\[ \bar P=\sum_i\frac{A_i}{A}P_i \]`,
          example: r`Polygons cover 40%, 35%, 25% of a basin with rainfall 985, 1015, 963 mm: \(0.4(985)+0.35(1015)+0.25(963)=990\) mm.` },
        { id: 'idw', title: 'Nearest neighbour, IDW, kriging',
          plain: r`- **Nearest neighbour**: copy the closest measurement (the Thiessen idea, point by point).
- **Inverse distance weighting (IDW)**: weighted average of nearby points, with weight \(1/d^p\). Power \(p=2\) is common; larger \(p\) makes the nearest points dominate more. Smooth and simple; estimates never exceed the observed range.
- **Kriging**: a statistical method that learns from the data how similarity decays with distance (the **variogram**), then computes optimal weights. It also gives an **uncertainty** for each estimate. More work, usually more accurate.`,
          formula: r`\[ \hat z=\frac{\sum_i z_i/d_i^{\,p}}{\sum_i 1/d_i^{\,p}} \]`,
          example: r`Values 10 and 20 at distances 1 and 2, \(p=2\): weights 1 and 0.25. \(\hat z=(10+5)/1.25=12\).` },
      ]},
      { id: 's-eval', title: 'Evaluating classifiers honestly', summary: 'ROC, AUC, Youden\'s J and spatial cross-validation.', concepts: [
        { id: 'roc', title: 'ROC curve, AUC and Youden\'s J',
          plain: r`A classifier outputs a score; you choose a threshold. The **ROC curve** plots true positive rate (recall) against false positive rate at **every** threshold. **AUC** (area under it) is the chance that a random positive case gets a higher score than a random negative: 0.5 = coin flip, 1 = perfect. **Youden's J** picks the threshold with the largest TPR − FPR, the point furthest above the diagonal. (Business costs may still argue for a different threshold.)`,
          formula: r`\[ \text{TPR}=\frac{TP}{TP+FN},\quad \text{FPR}=\frac{FP}{FP+TN},\quad J=\text{TPR}-\text{FPR} \]`,
          widget: 'confusion' },
        { id: 'kfold', title: 'k-fold and spatial k-fold cross-validation',
          plain: r`**k-fold**: split the data into \(k\) parts; train on \(k-1\), test on the remaining one; rotate and average. Uses all data for both training and testing.

With spatial data, random folds put near-identical neighbours in both train and test, so the model is effectively tested on data it has seen: scores look **too good**. **Spatial k-fold** splits by area (blocks, regions or clusters), so each test fold is geographically separate, a fairer test of predicting a new place.` },
      ]},
      { id: 's-frame', title: 'Analysis frameworks', summary: 'Structuring a project or paper review.', concepts: [
        { id: 'swot', title: 'SWOT, PESTEL and the two-minute paper review',
          plain: r`- **SWOT**: Strengths and Weaknesses (internal), Opportunities and Threats (external).
- **PESTEL**: external factors: Political, Economic, Social, Technological, Environmental, Legal.
- **Two-minute paper review**: the question; the data; the method; the main finding; one limitation; why it matters for insurance or banking.` },
      ]},
    ],
    sheet: [
      { title: 'Spatial statistics', cols: ['Item', 'Formula / rule'], rows: [
        ['Moran\'s I', r`\(\frac{N}{W}\frac{\sum\sum w_{ij}(x_i-\bar x)(x_j-\bar x)}{\sum(x_i-\bar x)^2}\)`],
        ['Expected I (random)', r`\(-1/(N-1)\)`],
        ['Reading I', '+1 clustered · ≈0 random · −1 dispersed'],
        ['Rook / queen', 'edge / edge or corner'],
        ['Row standardisation', r`\(w_{ij}/\sum_j w_{ij}\)`],
        ['Thiessen average', r`\(\sum (A_i/A)P_i\)`],
        ['IDW', r`\(\sum z_i d_i^{-p}/\sum d_i^{-p}\)`],
      ]},
      { title: 'Evaluation', cols: ['Item', 'Formula / meaning'], rows: [
        ['TPR (recall)', 'TP / (TP + FN)'],
        ['FPR', 'FP / (FP + TN)'],
        ['AUC', '0.5 random · 1 perfect'],
        ['Youden J', 'TPR − FPR (maximise)'],
        ['Spatial k-fold', 'folds by area to avoid leakage'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'moran', q: r`What is the expected Moran's I under randomness for the 48 contiguous states plus DC (N = 49 regions)?`, answer: -1 / 48, show: '≈ −0.0208',
        hint: r`\(-1/(N-1)\).`, solution: r`\(-1/48\approx-0.0208\).` },
      { id: 'q2', type: 'mcq', concept: 'moran', q: r`A checkerboard of high and low values gives Moran's I near…`, choices: ['+1', '0', '−1'], answer: 2,
        hint: 'Every neighbour is opposite.', solution: r`Dispersed: near **−1**.` },
      { id: 'q3', type: 'mcq', concept: 'moran', q: r`US precipitation has \(I\approx0.486\). What does that mean?`, choices: ['Wet and dry states are randomly spread', 'Wet states tend to border wet states (clustering)', 'Wet states border dry states', 'Precipitation is normally distributed'], answer: 1,
        hint: 'Positive I.', solution: r`Positive, sizeable I = clustering.` },
      { id: 'q4', type: 'num', concept: 'tobler', q: r`In a 3×3 grid, how many **queen** neighbours does the centre cell have?`, answer: 8, tol: 0.01,
        hint: 'Edges and corners.', solution: r`4 edges + 4 corners = 8.` },
      { id: 'q5', type: 'num', concept: 'tobler', q: r`In a 3×3 grid, how many **rook** neighbours does a corner cell have?`, answer: 2, tol: 0.01,
        hint: 'Edges only.', solution: r`2.` },
      { id: 'q6', type: 'num', concept: 'tobler', q: r`A region has 4 rook neighbours. After row standardisation, what weight does each get?`, answer: 0.25,
        hint: 'Row sums to 1.', solution: r`\(1/4=0.25\).` },
      { id: 'q7', type: 'num', concept: 'idw', q: r`IDW with \(p=2\): values 30 at distance 1 and 60 at distance 3. Estimate?`, answer: (30 + 60 / 9) / (1 + 1 / 9), show: '33',
        hint: r`Weights 1 and 1/9.`, solution: r`\((30+60/9)/(1+1/9)=(36.67)/(1.111)=33\).` },
      { id: 'q8', type: 'num', concept: 'thiessen', q: r`Thiessen polygons cover 50%, 30% and 20% of a county; stations record 100, 80 and 60 mm. Area-weighted rainfall (mm)?`, answer: 86, tol: 0.01,
        hint: 'Weighted sum.', solution: r`\(50+24+12=86\) mm.` },
      { id: 'q9', type: 'num', concept: 'roc', q: r`At a threshold, TPR = 0.85 and FPR = 0.30. What is Youden's J?`, answer: 0.55,
        hint: 'TPR − FPR.', solution: r`\(0.85-0.30=0.55\).` },
      { id: 'q10', type: 'num', concept: 'roc', q: r`TP = 40, FN = 10, FP = 30, TN = 120. What is the false positive rate?`, answer: 0.2,
        hint: 'FP / (FP + TN).', solution: r`\(30/150=0.2\).` },
      { id: 'q11', type: 'mcq', concept: 'roc', q: r`A fraud model has AUC = 0.5. What does that mean?`, choices: ['Perfect', 'No better than random ranking', 'Half the frauds are caught at any threshold', 'Accuracy is 50%'], answer: 1,
        hint: 'Chance a random fraud outranks a random legit claim.', solution: r`AUC 0.5 = random ordering.` },
      { id: 'q12', type: 'mcq', concept: 'kfold', q: r`Why can random k-fold cross-validation overstate accuracy for a flood-claim model by house?`, choices: ['It uses too little data', 'Neighbouring houses with near-identical outcomes land in both train and test', 'It ignores time zones', 'It always overfits'], answer: 1,
        hint: 'Spatial autocorrelation leaks.', solution: r`Neighbours share outcomes, so the test fold is not truly new; spatial folds fix this.` },
      { id: 'q13', type: 'mcq', concept: 'idw', q: r`Which interpolation method also gives an uncertainty for each estimate?`, choices: ['Nearest neighbour', 'IDW', 'Kriging', 'Thiessen polygons'], answer: 2,
        hint: 'Statistical model of distance.', solution: r`**Kriging** (via the variogram) produces a variance for each prediction.` },
      { id: 'q14', type: 'mcq', concept: 'swot', q: r`In PESTEL, rising sea levels fall under…`, choices: ['Political', 'Economic', 'Environmental', 'Legal'], answer: 2,
        hint: 'E for…', solution: r`**Environmental.**` },
      { id: 'q15', type: 'self', concept: 'fraud', q: r`Design a simple fraud-scoring approach for auto claims: name four features and how you would evaluate the model.`,
        hint: 'Features, imbalance, metrics, spatial.',
        solution: r`Features: days between policy start and claim; claim amount relative to typical for the vehicle and damage type; whether the same repair shop, doctor or lawyer appears across many claims; the number of prior claims; location clusters of similar claims. Because fraud is rare, use class weights or SMOTE, and evaluate with precision, recall, ROC/AUC (not accuracy). Choose a threshold with Youden's J adjusted for investigation capacity and costs, and validate with spatial (and time-based) folds so clusters do not leak.` },
    ]
  });
})();
