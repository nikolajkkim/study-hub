(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l6', num: 6, minutes: 55,
    title: 'Shapefiles, flood odds, inequality, joins, and who does what in insurance',
    oneLiner: r`A "100-year flood" has a **1% chance every year**, which adds up to about **26% over a 30-year mortgage**. Plus: the files behind GIS maps, measuring inequality with the **Gini coefficient**, joining tables, and the jobs inside an insurer.`,
    leadsTo: 'Next: ARIMA review and catastrophe modelling (losses, layers and tail risk).',
    bigPicture: {
      what: r`- **GIS data**: what a shapefile really is (several files together), and where to download hazard data (NASA FIRMS fires, USGS EarthExplorer imagery).
- **Flood probability**: what "100-year flood" means and how the chance accumulates over many years.
- **Inequality**: the Lorenz curve and Gini coefficient, from FRED and the Census.
- **Joins**: combining tables (inner, left, right, full).
- **Insurance roles**: the sales funnel, A/B testing, underwriters, actuaries, adjusters, claims processors and subrogation.`,
      why: r`Return periods are the language of catastrophe risk (Lecture 7) and are widely misunderstood by homeowners. Joins are how a hazard layer meets a policy table. Inequality data feeds into vulnerability indices like FEMA's NRI.`,
      remember: r`1. P(at least one event in \(n\) years) \(=1-(1-p)^n\). For a 100-year flood: 26% over 30 years, 63% over 100 years.
2. A shapefile needs at least .shp (shapes), .shx (index) and .dbf (attributes); .prj holds the coordinate system.
3. Gini = A / (A + B): 0 = perfect equality, 1 = one person has everything.`
    },
    sections: [
      { id: 's-gisdata', title: 'GIS data files and sources', summary: 'What you actually download.', concepts: [
        { id: 'shapefile', title: 'A shapefile is several files',
          plain: r`The common vector format, the "shapefile", is a set of files with the same name and different extensions, kept in one folder (often zipped):
- **.shp** – the geometry (points, lines, polygons). Required.
- **.shx** – an index into the geometry. Required.
- **.dbf** – the attribute table (one row per shape). Required.
- **.prj** – the coordinate reference system. Strongly recommended; without it QGIS has to guess where on Earth the shapes are.
- Optional: .sbn/.sbx (spatial index), .cpg (text encoding).

Emailing just the .shp is the classic mistake: it will not open.` },
        { id: 'sources', title: 'Hazard data sources',
          plain: r`- **NASA FIRMS** (Fire Information for Resource Management System): near-real-time active fire detections from satellites, downloadable as shapefiles or CSV by region and date.
- **USGS EarthExplorer**: satellite and aerial imagery (Landsat and others) and elevation data, after a free sign-up.
- Plus OpenFEMA (claims and policies), FEMA's flood maps, and the Census.` },
      ]},
      { id: 's-flood', title: 'What a "100-year flood" really means', summary: 'A yearly probability, not a schedule.', concepts: [
        { id: 'returnperiod', title: 'Return period and annual chance',
          plain: r`A "100-year flood" is a flood with a **1% chance of being equalled or exceeded in any given year**. It does **not** mean once per century: two can happen in consecutive years. That is why the official term is the **1-percent annual exceedance probability flood**.

Return period \(T\) and annual probability \(p\) are reciprocals: \(p = 1/T\). Over many years the chance of at least one event grows: the chance of **none** in \(n\) years is \((1-p)^n\), so subtract from 1.`,
          formula: r`\[ P(\text{at least one in } n \text{ years}) = 1-(1-p)^n,\qquad p=\frac1T \]`,
          widget: 'returnperiod',
          example: r`100-year flood over a 30-year mortgage: \(1-0.99^{30}\approx0.26\). Over 100 years: \(1-0.99^{100}\approx0.634\), not 100%.`,
          watch: r`Don't multiply \(30\times1\% = 30\%\). That overcounts the years with more than one flood, and for long periods gives impossible answers above 100%.` },
      ]},
      { id: 's-gini', title: 'Measuring inequality', summary: 'Lorenz curve and Gini coefficient.', concepts: [
        { id: 'gini', title: 'Lorenz curve and Gini coefficient',
          plain: r`Sort people from poorest to richest. The **Lorenz curve** plots the cumulative share of people (x) against the cumulative share of income they hold (y). Perfect equality is the 45° line. The **Gini coefficient** is the area between the line and the curve (A) divided by the whole triangle under the line (A + B). 0 = everyone has the same; 1 = one person has everything.

Data: FRED series SIPOVGINIUSA (World Bank Gini for the US); Census American Community Survey table B19083 (Gini by county or tract), ready for mapping in QGIS.`,
          formula: r`\[ G=\frac{A}{A+B} = \frac{\sum_i\sum_j|x_i-x_j|}{2n^2\bar x} \]`,
          example: r`Four people earning 1, 2, 3, 4. Sum of all pairwise gaps \(|x_i-x_j|\) over ordered pairs = 20; \(2n^2\bar x = 2\times16\times2.5=80\); \(G=20/80=0.25\).` },
      ]},
      { id: 's-joins', title: 'Joining tables', summary: 'How a hazard table meets a policy table.', concepts: [
        { id: 'joins', title: 'Inner, left, right and full joins',
          plain: r`A **join** combines two tables on a shared key (zip code, county FIPS code, policy ID).
- **Inner**: only rows whose key appears in **both** tables.
- **Left**: every row of the left table; matches from the right where they exist, blanks otherwise.
- **Right**: the mirror image.
- **Full (outer)**: every row from both, blanks where there is no match.

In QGIS a **spatial join** uses location instead of a key: attach the county each policy point falls inside.`,
          example: r`Policies (1,000 rows, in 50 counties) left-joined to a county risk table (3,000 counties): still 1,000 rows. An inner join also has 1,000 rows if every policy's county is in the risk table; a full join has 1,000 + the 2,950 counties with no policies.`,
          watch: r`If the right table has duplicate keys (two rows for one county), a join **multiplies** rows. Check row counts before and after.` },
      ]},
      { id: 's-roles', title: 'Who does what inside an insurer', summary: 'From first quote to final payout.', concepts: [
        { id: 'funnel', title: 'The sales funnel and A/B testing',
          plain: r`**Leads → quotes → binds → renewals.** Each stage loses people; each conversion rate is a lever. **Binding** = the policy is actually issued. Renewal (retention) matters because keeping a customer is much cheaper than finding one.

**A/B testing**: show two versions (price display, form layout) to random halves of visitors and compare conversion rates, so differences are caused by the change, not by who saw it.`,
          example: r`1,000 leads × 20% quoted × 30% bind = 60 new policies. If 85% renew, 51 remain next year.` },
        { id: 'roles', title: 'The roles',
          plain: r`- **Underwriters** decide whether to accept a risk and on what terms (price, deductible, exclusions).
- **Actuaries** use statistics to set rates and reserves: how much to charge, and how much to hold for future claims.
- **Claims adjusters** investigate claims and decide how much is owed (inspect damage, check coverage).
- **Claims processors** handle the paperwork and payments.
- **Legal / subrogation**: recover money from a responsible third party after paying the customer (Lecture 2).

Data science touches every role: lead scoring, pricing models, fraud flags, claim-severity estimates.` },
      ]},
    ],
    sheet: [
      { title: 'Return periods', cols: ['Return period', 'Annual chance', 'Chance in 30 years', 'Chance in 100 years'], rows: [
        ['10-year', '10%', '95.8%', '≈100%'],
        ['50-year', '2%', '45.5%', '86.7%'],
        ['100-year', '1%', '26.0%', '63.4%'],
        ['500-year', '0.2%', '5.8%', '18.1%'],
      ]},
      { title: 'Quick reference', cols: ['Item', 'Key point'], rows: [
        ['Accumulated chance', r`\(1-(1-p)^n\)`],
        ['Shapefile essentials', '.shp + .shx + .dbf (+ .prj)'],
        ['Gini', 'A / (A + B); 0 equal, 1 maximal inequality'],
        ['Inner join', 'only matching keys'],
        ['Left join', 'all left rows'],
        ['Funnel', 'leads → quotes → binds → renewals'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'returnperiod', q: r`What is the probability of at least one 100-year flood during a 30-year mortgage? (decimal)`, answer: 1 - Math.pow(0.99, 30), show: '≈ 0.26',
        hint: r`\(1-0.99^{30}\).`, solution: r`\(1-0.99^{30}\approx0.260\).` },
      { id: 'q2', type: 'num', concept: 'returnperiod', q: r`What is the probability of at least one 50-year flood in 10 years? (decimal)`, answer: 1 - Math.pow(0.98, 10), show: '≈ 0.183',
        hint: r`\(p=1/50\).`, solution: r`\(1-0.98^{10}\approx0.183\).` },
      { id: 'q3', type: 'num', concept: 'returnperiod', q: r`A flood has a 0.2% annual chance. What is its return period, in years?`, answer: 500, tol: 0.01,
        hint: r`\(T=1/p\).`, solution: r`\(1/0.002=500\) years.` },
      { id: 'q4', type: 'mcq', concept: 'returnperiod', q: r`A town had a 100-year flood last year. What is the chance of another this year?`, choices: ['0%: it just happened', 'About 1%', '50%', '99%'], answer: 1,
        hint: 'Years are independent.', solution: r`Still 1%. The return period describes a yearly probability, not a schedule.` },
      { id: 'q5', type: 'mcq', concept: 'shapefile', q: r`A colleague emails only parcels.shp. What will happen?`, choices: ['It opens fine', 'It will not open: .shx and .dbf are required too', 'It opens without colours', 'QGIS rebuilds the other files'], answer: 1,
        hint: 'Three mandatory files.', solution: r`.shp, .shx and .dbf are all required (and .prj for the coordinate system).` },
      { id: 'q6', type: 'num', concept: 'gini', q: r`Two people earn 0 and 10. What is the Gini coefficient? (Use \(\sum\sum|x_i-x_j|/(2n^2\bar x)\).)`, answer: 0.5,
        hint: r`Ordered pairs: \(|0-10|+|10-0|=20\); \(2\cdot4\cdot5=40\).`, solution: r`\(20/40=0.5\). (With \(n\) people the maximum is \(1-1/n\), approaching 1 for large groups.)` },
      { id: 'q7', type: 'num', concept: 'gini', q: r`Everyone earns exactly $50,000. What is the Gini coefficient?`, answer: 0, tol: 0.001,
        hint: 'No gaps.', solution: r`All gaps are 0, so \(G=0\): perfect equality.` },
      { id: 'q8', type: 'mcq', concept: 'joins', q: r`You want every policy kept, with flood-zone info added where available. Which join (policies on the left)?`, choices: ['Inner', 'Left', 'Right', 'Cross'], answer: 1,
        hint: 'Keep all left rows.', solution: r`A **left** join keeps every policy and fills blanks where there is no zone match.` },
      { id: 'q9', type: 'num', concept: 'funnel', q: r`2,000 leads; 25% get a quote; 40% of quotes bind. How many new policies?`, answer: 200, tol: 0.01,
        hint: 'Multiply through.', solution: r`\(2000\times0.25\times0.4=200\).` },
      { id: 'q10', type: 'mcq', concept: 'roles', q: r`Who decides whether to accept a new risk and on what terms?`, choices: ['Actuary', 'Underwriter', 'Claims adjuster', 'Claims processor'], answer: 1,
        hint: 'Before the policy exists.', solution: r`The **underwriter**. Actuaries set the rate structure; adjusters handle claims after a loss.` },
      { id: 'q11', type: 'mcq', concept: 'funnel', q: r`Why randomly split visitors in an A/B test?`, choices: ['To double traffic', 'So the only systematic difference between groups is the change being tested', 'Because regulators require it', 'To reduce costs'], answer: 1,
        hint: 'Cause vs coincidence.', solution: r`Random assignment balances everything else, so a difference in conversion can be attributed to the change.` },
      { id: 'q12', type: 'self', concept: 'returnperiod', q: r`A homebuyer says: "It's outside the 100-year floodplain, and it only floods once a century anyway, so I don't need flood insurance." Explain what is wrong with this reasoning.`,
        hint: 'Two mistakes.',
        solution: r`First, "100-year" means 1% per year, not once a century: inside the floodplain the chance over a 30-year mortgage is about 26%. Second, being outside the mapped floodplain does not mean zero risk: heavy rainfall, drainage failures and outdated maps cause a large share of flood claims outside high-risk zones. Standard homeowners policies exclude flood, so without flood insurance those losses are uninsured.` },
    ]
  });
})();
