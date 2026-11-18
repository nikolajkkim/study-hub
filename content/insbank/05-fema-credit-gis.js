(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l5', num: 5, minutes: 50,
    title: 'FEMA\'s new flood pricing, credit decisions, and a first look at GIS',
    oneLiner: r`FEMA now prices flood risk house by house; banks turn borrower data into a **probability of default** with S-shaped curves and scores like **Altman's Z**; and **QGIS** puts all of it on a map.`,
    leadsTo: 'Next (after the October 23 midterm review): shapefiles, flood odds, inequality and joins.',
    bigPicture: {
      what: r`Three topics:

1. **FEMA as a business**, using FEMA's own reports: its new pricing approach (Risk Rating 2.0, the "FEMA 2.0" rate-change map) and why premiums changed so unevenly.
2. **Credit decisions**: sigmoid (S-shaped) curves that turn a score into a probability, Fannie Mae's public loan data, and the Altman Z-score for company bankruptcy risk.
3. **GIS**: an introduction to QGIS, the free mapping software (and PyQGIS, its Python interface), used for the rest of the term.`,
      why: r`Pricing and lending are both "turn data about one customer into a number". The sigmoid is the core of logistic regression, the most common credit model, and GIS is how insurers see where risk concentrates.`,
      remember: r`1. Risk Rating 2.0 prices each property from its own features (distance to water, elevation, rebuild cost) instead of only its flood zone; by law most annual increases are capped at 18%.
2. A sigmoid \(1/(1+e^{-z})\) turns any score into a probability between 0 and 1.
3. Altman Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E. Above 2.99 safe; 1.81–2.99 grey zone; below 1.81 distress.`
    },
    sections: [
      { id: 's-fema', title: 'FEMA as a business', summary: 'From flood zones to property-level pricing.', concepts: [
        { id: 'rr2', title: 'Risk Rating 2.0 ("FEMA 2.0")',
          plain: r`For decades NFIP premiums depended mainly on a property's **flood zone** on FEMA's maps, so two houses in the same zone paid similar rates even if one sat by the river and the other on a hill. Since 2021–2022, **Risk Rating 2.0** prices each property from its own characteristics: distance to water, type and frequency of flooding (river, coastal, heavy rain), ground elevation, and the cost to rebuild.

Effect: many lower-value inland homes pay less; many high-value coastal homes pay much more. The law caps most annual increases at **18%**, so some policies move toward their full risk-based price over many years. FEMA's ArcGIS dashboard maps the rate changes.` },
        { id: 'nfipfunding', title: 'Why NFIP finances keep making news',
          plain: r`The NFIP must be **reauthorised by Congress** periodically, and lapses interrupt new policies. It has borrowed from the Treasury after large disasters because premiums long sat below the actual risk (one reason for Risk Rating 2.0). Hurricane season is the stress test: large storms produce concentrated claims in one region at once.` },
      ]},
      { id: 's-credit', title: 'Credit decisions', summary: 'From borrower data to a probability, and to a yes or no.', concepts: [
        { id: 'sigmoid', title: 'Sigmoid curves turn scores into probabilities',
          plain: r`Many outcomes in finance are yes/no (default or not) but depend smoothly on inputs. A straight line would predict probabilities below 0 or above 1. The **sigmoid** (logistic) curve squashes any number into (0, 1): flat at both ends, steep in the middle. **Logistic regression** fits \(z = b_0 + b_1x_1 + \dots\) and passes it through the sigmoid to get a probability of default. The lender then picks a **cut-off** (approve below 5% default probability, say), which is a business decision trading lost good customers against bad loans.

S-curves also describe adoption over time (slow start, rapid growth, saturation).`,
          formula: r`\[ p = \sigma(z) = \frac{1}{1+e^{-z}},\qquad z=b_0+b_1x_1+\dots+b_kx_k \]`,
          example: r`Suppose \(z = 4 - 0.01\times\text{credit score}\). Score 700: \(z=-3\), \(p=1/(1+e^{3})\approx0.047\). Score 500: \(z=-1\), \(p\approx0.27\).` },
        { id: 'fannie', title: 'Fannie Mae Data Dynamics',
          plain: r`Fannie Mae publishes loan-level performance data on millions of mortgages it bought: borrower credit score, loan-to-value, debt-to-income, interest rate, and whether the loan later became delinquent, defaulted or prepaid. Data Dynamics is its free web tool for exploring it (including its mortgage-backed securities). It is a ready-made training set for default models.` },
        { id: 'altman', title: 'The Altman Z-score',
          plain: r`Edward Altman (1968) combined five ratios from a company's financial statements into one score that predicted bankruptcy surprisingly well:
- **A** = working capital / total assets (short-term cushion)
- **B** = retained earnings / total assets (accumulated profitability)
- **C** = EBIT / total assets (operating profitability)
- **D** = market value of equity / total liabilities (how far value can fall before debts exceed it)
- **E** = sales / total assets (how hard assets work)

Zones (original model, public manufacturers): above **2.99** safe, **1.81–2.99** grey, below **1.81** distress. Variants exist for private and non-manufacturing firms.`,
          formula: r`\[ Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E \]`,
          widget: 'altman',
          example: r`A = 0.2, B = 0.3, C = 0.1, D = 1.5, E = 1.2: \(Z = 0.24+0.42+0.33+0.90+1.20 = 3.09\), just in the safe zone.` },
      ]},
      { id: 's-gis', title: 'Introduction to QGIS', summary: 'Free software for putting data on maps.', concepts: [
        { id: 'qgis', title: 'What a GIS does',
          plain: r`A **geographic information system** stores data with locations and lets you map, overlay and analyse it: which insured homes sit in a flood zone, which counties had the most claims, how far each policy is from the coast. **QGIS** is free and open source; **PyQGIS** lets you automate it from Python.

Core ideas:
- **Layers**: each dataset is a layer stacked on the map (counties, rivers, policies).
- **Vector** data: points, lines, polygons, each with a row in an **attribute table**. **Raster** data: a grid of pixels (elevation, satellite images).
- **CRS** (coordinate reference system): how coordinates map to the Earth. Layers in different CRSs will not line up.` },
      ]},
    ],
    sheet: [
      { title: 'Formulas and thresholds', cols: ['Item', 'Value'], rows: [
        ['Sigmoid', r`\(p=1/(1+e^{-z})\)`],
        ['Logistic regression', r`\(z=b_0+b_1x_1+\dots\), then sigmoid`],
        ['Altman Z', r`\(1.2A+1.4B+3.3C+0.6D+1.0E\)`],
        ['Altman zones', '> 2.99 safe · 1.81–2.99 grey · < 1.81 distress'],
        ['Risk Rating 2.0 cap', 'most annual increases ≤ 18%'],
      ]},
      { title: 'Altman ratios', cols: ['Letter', 'Ratio', 'Weight'], rows: [
        ['A', 'working capital / total assets', '1.2'],
        ['B', 'retained earnings / total assets', '1.4'],
        ['C', 'EBIT / total assets', '3.3'],
        ['D', 'market value of equity / total liabilities', '0.6'],
        ['E', 'sales / total assets', '1.0'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'altman', q: r`A company has A = 0.10, B = 0.20, C = 0.05, D = 0.80, E = 1.00. What is its Altman Z-score?`, answer: 1.2 * 0.1 + 1.4 * 0.2 + 3.3 * 0.05 + 0.6 * 0.8 + 1.0, show: '≈ 2.045',
        hint: 'Multiply by the weights and add.', solution: r`\(0.12+0.28+0.165+0.48+1.00=2.045\).` },
      { id: 'q2', type: 'mcq', concept: 'altman', q: r`Which zone is a Z-score of 2.045 in?`, choices: ['Safe', 'Grey', 'Distress'], answer: 1,
        hint: '1.81–2.99.', solution: r`Between 1.81 and 2.99: the **grey zone**.` },
      { id: 'q3', type: 'num', concept: 'sigmoid', q: r`A default model gives \(z = -2\) for a borrower. What is the predicted probability of default?`, answer: 1 / (1 + Math.exp(2)), show: '≈ 0.119',
        hint: r`\(1/(1+e^{2})\).`, solution: r`\(1/(1+7.389)\approx0.119\).` },
      { id: 'q4', type: 'num', concept: 'sigmoid', q: r`What does the sigmoid give when \(z = 0\)?`, answer: 0.5,
        hint: r`\(e^0=1\).`, solution: r`\(1/(1+1)=0.5\): the midpoint of the S-curve.` },
      { id: 'q5', type: 'num', concept: 'sigmoid', q: r`Another lender's model is \(z = 6 - 0.012\times\text{score}\). What default probability does it give at a credit score of 450?`, answer: 1 / (1 + Math.exp(-0.6)), show: '≈ 0.646',
        hint: r`First find \(z\), then apply the sigmoid.`, solution: r`\(z=6-5.4=0.6\), so \(p=1/(1+e^{-0.6})\approx0.646\).` },
      { id: 'q6', type: 'mcq', concept: 'rr2', q: r`Under Risk Rating 2.0, what mainly sets a property's flood premium?`, choices: ['Only its flood-zone letter on the map', 'Its own features: distance to water, flood types, elevation, rebuild cost', 'The owner\'s credit score', 'A flat national rate'], answer: 1,
        hint: 'Property-level pricing.', solution: r`It prices each property from its own risk features instead of mainly the zone.` },
      { id: 'q7', type: 'num', concept: 'rr2', q: r`A policy's full risk-based premium is $3,000 but it pays $1,500 today. With increases capped at 18% a year, what will it pay next year?`, answer: 1770, tol: 1,
        hint: r`\(1{,}500\times1.18\).`, solution: r`\(1500\times1.18=1{,}770\). It reaches $3,000 only after about five years of capped increases.` },
      { id: 'q8', type: 'mcq', concept: 'qgis', q: r`Which is raster data?`, choices: ['County boundaries', 'Locations of insured homes', 'A digital elevation grid', 'A road network'], answer: 2,
        hint: 'Pixels vs shapes.', solution: r`An elevation grid is pixels (raster). The others are polygons, points and lines (vector).` },
      { id: 'q9', type: 'mcq', concept: 'qgis', q: r`You load a counties layer and a policies layer, and the points land in the ocean. What is the most likely cause?`, choices: ['Too many points', 'The layers use different coordinate reference systems', 'The attribute table is empty', 'QGIS cannot show points'], answer: 1,
        hint: 'CRS.', solution: r`Mismatched CRSs put layers in different coordinate spaces. Reproject one to match the other.` },
      { id: 'q10', type: 'mcq', concept: 'altman', q: r`Which Altman ratio measures how far a company's market value can fall before its debts exceed it?`, choices: ['A: working capital / assets', 'C: EBIT / assets', 'D: market value of equity / total liabilities', 'E: sales / assets'], answer: 2,
        hint: 'Equity vs liabilities.', solution: r`**D** compares the market value of equity with total liabilities.` },
      { id: 'q11', type: 'self', concept: 'sigmoid', q: r`A lender's model outputs default probabilities. Explain how it should choose the approval cut-off.`,
        hint: 'Two kinds of mistakes.',
        solution: r`Each cut-off trades approving loans that later default (false negatives, costly losses) against rejecting borrowers who would have repaid (false positives, lost interest income). Choose it by comparing expected profit at each threshold: the cost of a default versus the margin on a good loan, the lender's risk appetite, regulation and fairness checks. Lecture 9's ROC curve and Youden's J give a statistical starting point; the business costs decide.` },
    ]
  });
})();
