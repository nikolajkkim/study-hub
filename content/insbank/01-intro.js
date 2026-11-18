(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l1', num: 1, minutes: 50,
    title: 'How insurance and banking work, and the flood insurance program',
    oneLiner: r`Insurance is **risk transfer**: many people pay a little so the few who suffer a loss get paid. Banks turn **deposits into loans**. Flood is the peril that ties the course together.`,
    leadsTo: 'Next: measuring claims, how a mortgage is made, and judging yes/no models.',
    bigPicture: {
      what: r`The first lecture introduces the two industries and the data the course uses.

**Insurance**: why it exists, what is in a policy (premiums, claims, reserves, limits, deductibles, wording), who sells it, who manages the risk, and why **flood** is special enough that the US government runs its own program, the NFIP, and publishes its claims as open data.

**Banking**: the many kinds of banks, starting with the oldest, the lending bank, and the free economic database (FRED) used all term.

**Tools**: Python in Google Colab instead of Excel, and AI assistants used with care.`,
      why: r`Every later lecture analyses data from these businesses: NFIP claims, mortgage performance, interest rates, catastrophe losses. Knowing what a claim, a deductible or a reserve is makes those datasets readable.`,
      remember: r`1. An insurer collects premiums **before** it knows its costs, so it must estimate claims and hold reserves.
2. Payout on a loss = the loss minus the deductible, capped at the limit.
3. Flood is excluded from standard homeowners policies; most US flood cover comes from the NFIP (1968), sold through private insurers under the Write Your Own program (1983).`
    },
    sections: [
      { id: 's-ins', title: 'Insurance basics', summary: 'Risk transfer, the policy, and the people who run it.', concepts: [
        { id: 'transfer', title: 'Insurance is a risk transfer mechanism',
          plain: r`You swap a small, certain cost (the premium) for protection against a large, uncertain one (your house burning down). It works because the insurer **pools** many similar risks: it cannot predict which house will burn, but it can predict roughly how many will, and price for that.

It is old. Around 1750 BCE, Babylonian traders paid extra on shipping loans so that the loan was forgiven if the ship was lost. Greek and Roman benevolent societies covered funerals and health. The first stand-alone insurance contracts appear around 1347, in Genoa.` },
        { id: 'products', title: 'The main products',
          plain: r`- **Life** and **health** insurance.
- **Workers' compensation**: covers employees injured on the job.
- **Property and casualty (P&C)**: damage to things (fire, natural disasters, theft) and liability for accidents. Homeowners and auto insurance are P&C.
- Specialty markets (Lloyd's of London) cover unusual risks.

Homeowners policies have **exclusions**: flood and earthquake are typically not covered and need separate policies. That gap is why the NFIP exists.` },
        { id: 'model', title: 'Policies, premiums, claims, reserves: a business that gives customers money back',
          plain: r`A **policy** is the contract. The customer pays a **premium**; when a covered loss happens they file a **claim**; the insurer pays. Because premiums arrive before the claims they pay for, the insurer must estimate what it will owe and set money aside: **reserves**, including for losses that have happened but have not been reported yet.

Most businesses know their costs before setting a price. Insurers set the price first and learn their costs later. Pricing and reserving are therefore forecasting problems, which is where data science comes in.` },
        { id: 'limits', title: 'Limits and deductibles',
          plain: r`The **deductible** is the part of each loss the policyholder pays first. It removes small claims (expensive to process) and gives the owner a reason to be careful. The **limit** is the most the policy pays. An **umbrella** policy adds liability coverage above the limits of other policies.`,
          formula: r`\[ \text{payout} = \min\big(\max(\text{loss} - \text{deductible},\,0),\ \text{limit}\big) \]`,
          example: r`Deductible $2,000, limit $250,000. A $80,000 loss pays $78,000. A $1,500 loss pays nothing. A $300,000 loss pays $250,000.`,
          watch: r`**Wording is everything.** Definitions and exceptions in the policy decide whether a loss is covered at all. "Flood" vs "water damage from a burst pipe" are treated completely differently.` },
        { id: 'roles', title: 'Who sells it and who manages the risk',
          plain: r`**Selling**: **carriers** (the insurers that take the risk), **brokers** (work for the customer, shop across carriers), and **managing general agents** (MGAs: firms a carrier authorises to sell and underwrite for it).

**Managing the risk**: **underwriters** (decide whether to insure and at what price), **actuaries** (statistical pricing and reserves), **data scientists**, risk managers, and **reinsurance** (insurance for insurers). Also **compliance** (insurance is regulated by each state), **adjusters** (assess claims, now sometimes by drone) and **legal**.` },
        { id: 'altdata', title: 'Alternative data',
          plain: r`Underwriters increasingly use data beyond the application form: tax liens, building-code violations, whether a home is on a street or an avenue, parking signs, and many city open-data portals. Each can hint at risk (an unpaid tax lien may signal deferred maintenance) and each has to be checked for fairness and relevance before use.` },
      ]},
      { id: 's-flood', title: 'Flood risk and the NFIP', summary: 'Why flood is special, and how the federal government got involved.', concepts: [
        { id: 'whyflood', title: 'What makes flood risk unique',
          plain: r`From the lecture: flood is the **costliest and most frequent** natural disaster worldwide; about **90%** of natural disasters involve flooding; nearly **20%** of US urban land is in a high-risk flood zone.

Flood is also hard for private insurers: losses are **correlated** (one storm floods a whole town at once, so pooling fails locally) and the people who most want flood insurance are the ones most likely to flood (adverse selection). Those two features are why the federal government stepped in.` },
        { id: 'nfiphistory', title: 'The federal timeline',
          plain: r`- **1968** National Flood Insurance Act: creates the **NFIP** and the National Flood Insurance Fund, managed by FEMA's Federal Insurance and Mitigation Administration (FIMA).
- **1973** Flood Disaster Protection Act: flood insurance becomes mandatory for federally backed mortgages in high-risk zones.
- **1977** Executive Order 11988: federal agencies must avoid building in floodplains.
- **1979** FEMA is created.
- **1983** **Write Your Own (WYO)**: private insurers sell and service the Standard Flood Insurance Policy (SFIP) as FEMA's agents, while FEMA keeps the risk.

The standard NFIP residential policy covers up to $250,000 for the building and $100,000 for contents.` },
        { id: 'openfema', title: 'The NFIP claims and policy datasets',
          plain: r`FEMA publishes redacted NFIP **claims** and **policies** on OpenFEMA, free. Things to know before you analyse them:
- **IDs do not line up**: you cannot join a claim to its policy directly (redacted for privacy).
- **Start dates differ** between the claims and the policies data.
- Columns come in building/contents pairs (damage amount, property value, amount paid, coverage), which Lecture 2 turns into ratios.

Download as **CSV** or **Parquet**. Parquet is compressed and stores data by column, so it is much smaller and faster to load.` },
      ]},
      { id: 's-bank', title: 'Banking basics', summary: 'Lending banks, and where the data comes from.', concepts: [
        { id: 'banktypes', title: 'Many kinds of banks; we start with lending banks',
          plain: r`Lending (deposit) banks, investment banks, central banks, shadow banks (lenders that are not regulated as banks) and more. A **lending bank** takes deposits and makes loans. The idea goes back to about 2000 BCE (loans of seed for crops). Deposits and loans developed in ancient Greece, China and India. Roman money-changers worked at a long bench, a *bancu*, which gave us "bank". Modern banking grew in Renaissance Florence, Venice and Genoa; the oldest bank still operating, in Siena, dates from 1472.

In the US, **real-estate loans** are the largest share of what deposit banks lend, and home loans exceed commercial ones. Mortgages are Lecture 2.` },
        { id: 'fred', title: 'FRED: the free economic database',
          plain: r`The St. Louis Fed's FRED holds hundreds of thousands of economic time series (interest rates, inflation, unemployment, mortgage activity), downloadable or readable from Python. It is the main data source for the course's banking and time-series work.` },
      ]},
      { id: 's-tools', title: 'Tools: Python, Colab and AI', summary: 'Why not Excel, and how to use AI assistants.', concepts: [
        { id: 'notexcel', title: 'Why not Excel?',
          plain: r`An Excel sheet holds at most 1,048,576 rows. The NFIP claims data has over two million and the policies data tens of millions. Excel also makes it hard to reproduce an analysis step by step. **Google Colab** runs Python notebooks in the browser with nothing to install, and pandas loads the Parquet files directly.` },
        { id: 'llm1', title: 'AI assistants: the right prompt, and hallucinations',
          plain: r`A precise prompt (what data, what columns, what output) gets far better code than a vague one. Models can **hallucinate**: produce confident, wrong answers, invent functions or misread a column. Check the numbers they give you. Lecture 2 adds the temperature and top-p settings; Lecture 8 covers agents and MCP.` },
      ]},
    ],
    sheet: [
      { title: 'Key terms and facts', cols: ['Item', 'What to remember'], rows: [
        ['Payout', r`\(\min(\max(\text{loss}-\text{deductible},0),\text{limit})\)`],
        ['Reserves', 'money set aside for claims not yet paid, including unreported ones'],
        ['Carrier / broker / MGA', 'takes the risk / works for the buyer / sells and underwrites for a carrier'],
        ['Underwriter / actuary / adjuster', 'decides to insure / prices and reserves / sizes claims'],
        ['NFIP', '1968; run by FEMA (FIMA); standard cover $250k building, $100k contents'],
        ['Flood Disaster Protection Act', '1973: mandatory flood insurance for federally backed mortgages in high-risk zones'],
        ['FEMA', 'created 1979'],
        ['Write Your Own', '1983: private insurers sell NFIP policies; FEMA keeps the risk'],
        ['OpenFEMA NFIP data', 'claims and policies; IDs do not join; start dates differ; CSV or Parquet'],
        ['Excel row limit', '1,048,576'],
        ['"Bank"', 'from bancu, the bench of Roman money-changers'],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'limits', q: r`A policy has a $2,500 deductible and a $100,000 limit. A covered loss is $40,000. How much does the insurer pay?`, answer: 37500, tol: 1,
        hint: 'Loss minus deductible, then cap at the limit.', solution: r`\(40{,}000-2{,}500=37{,}500\), below the limit, so **$37,500**.` },
      { id: 'q2', type: 'num', concept: 'limits', q: r`Same policy ($2,500 deductible, $100,000 limit), but the loss is $130,000. How much does the insurer pay?`, answer: 100000, tol: 1,
        hint: 'Check the limit.', solution: r`\(130{,}000-2{,}500=127{,}500\), capped at the limit: **$100,000**. The owner bears $30,000.` },
      { id: 'q3', type: 'mcq', concept: 'products', q: r`A homeowner's basement floods after heavy rain. Which policy normally covers it?`, choices: ['A standard homeowners policy', 'A separate flood policy (e.g. NFIP)', 'Workers\' compensation', 'An umbrella policy'], answer: 1,
        hint: 'Exclusions.', solution: r`Flood is excluded from standard homeowners policies. It needs a flood policy, usually from the NFIP.` },
      { id: 'q4', type: 'mcq', concept: 'nfiphistory', q: r`What did the 1983 Write Your Own program do?`, choices: ['Created FEMA', 'Let private insurers sell and service NFIP policies on FEMA\'s behalf', 'Made flood insurance mandatory for all homes', 'Ended the NFIP'], answer: 1,
        hint: 'Who writes the policy, who keeps the risk?', solution: r`WYO insurers issue the Standard Flood Insurance Policy as FEMA's fiduciary and fiscal agent; FEMA still carries the risk.` },
      { id: 'q5', type: 'num', concept: 'nfiphistory', q: r`In what year was the National Flood Insurance Program created?`, answer: 1968, tol: 0.1,
        hint: 'National Flood Insurance Act.', solution: r`**1968**. FEMA itself only came in 1979.` },
      { id: 'q6', type: 'mcq', concept: 'roles', q: r`Who works for the customer and shops for coverage across several insurers?`, choices: ['Carrier', 'Broker', 'Adjuster', 'Actuary'], answer: 1,
        hint: 'Which side is each on?', solution: r`A **broker** represents the buyer. The carrier takes the risk; the adjuster sizes claims; the actuary prices.` },
      { id: 'q7', type: 'mcq', concept: 'model', q: r`Why do insurers hold reserves?`, choices: ['To pay brokers', 'Because premiums arrive before the claims they pay for, including claims not yet reported', 'Because regulators ban investing', 'To lower premiums'], answer: 1,
        hint: 'The order of cash flows.', solution: r`The price is set before costs are known. Reserves cover claims still to be paid, including losses that have happened but are not reported yet.` },
      { id: 'q8', type: 'mcq', concept: 'openfema', q: r`You try to join the NFIP claims table to the policies table on an ID column. What goes wrong?`, choices: ['Nothing, the IDs match', 'The IDs do not line up between the two datasets', 'The tables are in different languages', 'Parquet cannot be joined'], answer: 1,
        hint: 'From the lecture\'s dataset overview.', solution: r`The redacted datasets do not share aligned IDs (and their start dates differ), so you cannot match a claim to its policy directly.` },
      { id: 'q9', type: 'num', concept: 'notexcel', q: r`How many rows can one Excel worksheet hold?`, answer: 1048576, tol: 1,
        hint: r`\(2^{20}\).`, solution: r`\(2^{20}=1{,}048{,}576\). The NFIP claims data is larger, which is one reason to use Python.` },
      { id: 'q10', type: 'mcq', concept: 'whyflood', q: r`Why is flood hard for private insurers to cover on their own?`, choices: ['Floods are rare', 'Losses are highly correlated (one event hits many policies at once) and the highest-risk owners are the most likely to buy', 'Flood damage is cheap', 'Floods cannot be mapped'], answer: 1,
        hint: 'What does pooling need?', solution: r`Pooling works when losses are independent. A flood hits a whole area at once, and adverse selection concentrates buyers in risky places.` },
      { id: 'q11', type: 'self', concept: 'transfer', q: r`Explain in two or three sentences how an insurer can promise to pay for a house fire it cannot predict.`,
        hint: 'One house vs many.',
        solution: r`The insurer cannot know which house will burn, but across many similar, mostly independent houses the number of fires per year is fairly predictable. It charges each owner a premium based on the expected cost per house plus expenses and a margin, and holds reserves and reinsurance for bad years. Each owner swaps a small certain cost for protection against a large uncertain one.` },
    ]
  });
})();
