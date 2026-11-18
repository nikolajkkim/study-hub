(function () {
  const r = String.raw;
  COURSE.add({
    id: 'l8', num: 8, minutes: 55,
    title: 'Cat bonds and weather futures, cloud costs, and the AI-tool vocabulary',
    oneLiner: r`Insurers can pass disaster risk to investors (**cat bonds**) and hedge weather with **futures**. Plus: making data work cheaper and greener, and a clear map of LLMs, agents, MCP, RAG and friends for your project.`,
    leadsTo: 'Next: insurance fraud, spatial statistics (Moran\'s I), interpolation and model evaluation.',
    bigPicture: {
      what: r`1. **Capital markets for risk**: catastrophe bonds (how the money flows, and the four trigger types), CME weather futures based on heating degree days, and Bollinger bands for spotting unusual price moves.
2. **Sustainability and cloud**: faster, cheaper data tools (Polars, Dask, Parquet), deduplication and compression, storage tiers and instance choice.
3. **AI vocabulary**: LLM vs chatbot vs agent; MCP servers and clients; tools, APIs, libraries, RAG, prompts, skills, plugins and workflows; "vibe coding" and when to stop.
4. **Your project abstract**: Amazon's "working backwards" approach.`,
      why: r`Cat bonds and weather derivatives are where insurance meets banking. The cloud and AI material is what you will use to build your final project.`,
      remember: r`1. Cat bond: investors' money sits in a safe account (the SPV) earning a high coupon; if the trigger is hit, the insurer takes the principal.
2. HDD = \(\max(0, 65 - \text{average temp }°F)\); CME contracts pay $20 per index point.
3. LLM = the model; agent = an LLM in a loop that can use tools; MCP = a standard plug that connects tools to agents.`
    },
    sections: [
      { id: 's-catbond', title: 'Selling disaster risk to investors', summary: 'Cat bonds and their triggers.', concepts: [
        { id: 'catbond', title: 'How a catastrophe bond works',
          plain: r`1. The insurer (sponsor) sets up a **special purpose vehicle (SPV)**.
2. Investors buy bonds from the SPV; their money is held in safe collateral (Treasury money-market funds).
3. The sponsor pays a premium, so investors earn safe interest **plus** a risk spread: a high coupon.
4. No trigger event before maturity → investors get their principal back. Trigger hit → some or all of the principal goes to the sponsor to pay claims.

Why investors like them: disaster losses are largely **uncorrelated** with stock markets, which diversifies a portfolio. Why insurers like them: capacity beyond traditional reinsurance, fully collateralised (no risk the reinsurer cannot pay).` },
        { id: 'triggers', title: 'The four trigger types',
          plain: r`- **Indemnity**: pays on the sponsor's **actual** losses. No basis risk for the sponsor, but slow to settle and investors must trust the sponsor's claims data.
- **Parametric**: pays on a measured physical parameter (wind speed at a location, earthquake magnitude). Fast and transparent, but **basis risk**: the payout may not match the real loss.
- **Industry index**: pays on total **industry** losses (e.g. from PCS). Moderate basis risk.
- **Modeled loss**: the event's parameters run through an agreed cat model on the sponsor's exposure.

**Basis risk** = the gap between what the contract pays and what the sponsor actually lost.` },
      ]},
      { id: 's-weather', title: 'Weather futures and Bollinger bands', summary: 'Hedging temperature; spotting unusual moves.', concepts: [
        { id: 'hdd', title: 'Heating degree days and CME weather futures',
          plain: r`Energy companies and utilities lose money in mild winters (less heating demand). **Heating degree days** measure how cold it was: for each day, how far the average temperature fell below 65°F. Summing over a month gives the monthly HDD index. **Cooling degree days** are the summer mirror image. CME futures on these indices pay **$20 per index point**, so a utility can hedge a warm winter by selling HDD futures.`,
          formula: r`\[ \text{HDD}_{\text{day}}=\max(0,\ 65-T_{\text{avg}}),\qquad \text{CDD}_{\text{day}}=\max(0,\ T_{\text{avg}}-65) \]`,
          example: r`Daily averages 40°F, 50°F, 70°F → HDD 25, 15, 0 = 40 points = $800 per contract.` },
        { id: 'bollinger', title: 'Bollinger bands',
          plain: r`A **20-day moving average** with bands **2 standard deviations** above and below. When the price touches or breaks a band, the move is unusual relative to recent volatility; bands **narrow** in calm periods and **widen** in turbulent ones (the same volatility clustering GARCH models). Used for both prices and, in this class, as a quick anomaly flag on any series.`,
          formula: r`\[ \text{bands}=\text{SMA}_{20}\pm2\,\sigma_{20} \]` },
      ]},
      { id: 's-cloud', title: 'Cheaper, greener data work', summary: 'Compute and storage cost money and energy.', concepts: [
        { id: 'cloud', title: 'Tools and habits',
          plain: r`- **Faster dataframes**: **Polars** (multi-threaded, lazy evaluation) and **Dask** (splits work across cores or machines) handle data that is slow or too large for pandas.
- **Parquet** instead of CSV: columnar, compressed, typed; much smaller and faster to read, especially when you need only some columns.
- **Deduplicate** before storing or processing; **compress** (zip) archives.
- **Storage tiers**: AWS S3 Standard for frequently used data; **Glacier** for archives: far cheaper to store, but slow and costly to retrieve.
- **Instance choice**: right-size compute (CPU vs memory-optimised vs GPU) and shut it down when idle.` },
      ]},
      { id: 's-ai', title: 'The AI-tool vocabulary', summary: 'What each term means and how they fit together.', concepts: [
        { id: 'llmagent', title: 'LLM, chatbot, agent',
          plain: r`- **LLM** (large language model): the model itself. Text in, text out. It cannot act on its own.
- **Chatbot**: an app wrapping an LLM in a conversation.
- **Agent**: an LLM running in a **loop** that decides which **tools** to call (search, run code, read files), looks at results and continues until the goal is reached.
- **Tool**: a function an agent can call.

Key distinction: an LLM *answers*; an agent *does*.` },
        { id: 'mcp', title: 'MCP, APIs, libraries, RAG and the rest',
          plain: r`- **Library**: code you import into your own program (pandas).
- **API**: a defined way for programs to talk over a network (FRED's API returns data on request).
- **MCP** (Model Context Protocol): a standard way to expose tools and data to AI apps. An **MCP server** offers tools (e.g. "query OpenFEMA"); an **MCP client** (inside the AI app) connects to it. Like USB for AI tools: build once, plug into any compatible app.
- **RAG** (retrieval-augmented generation): fetch relevant documents first, then have the LLM answer using them, so answers are grounded in your data.
- **Prompt**: the instructions you give. **Skill**: reusable packaged instructions (and files) for a task. **Plugin**: a bundle adding capabilities to an app. **Workflow**: a fixed sequence of steps (vs an agent choosing its own).

The lecture's example: Greenpick, an MCP server that helps choose lower-carbon cloud regions.` },
        { id: 'vibe', title: 'Vibe coding, and when to stop',
          plain: r`**Vibe coding**: describing what you want and letting an AI write the code, iterating on the results without reading every line. Great for prototypes and exploring.

Stop vibing and read carefully when: the numbers will be used for decisions or graded; the code touches money, personal data or credentials; it is going into production; the AI keeps "fixing" the same bug in circles; or you cannot explain what the code does. Check results against something you know is right.` },
        { id: 'prfaq', title: 'Writing the project abstract: working backwards',
          plain: r`Amazon's "working backwards" method starts from the finished product: write the **press release** first (who the customer is, the problem, the solution, why it matters), then **FAQs** answering the hard questions (data sources, feasibility, risks, how success is measured). If the press release is not compelling, rethink before building. Use it to shape your project abstract.` },
      ]},
    ],
    sheet: [
      { title: 'Cat bond triggers', cols: ['Trigger', 'Pays on', 'Basis risk', 'Speed / transparency'], rows: [
        ['Indemnity', 'sponsor\'s actual losses', 'none', 'slow, less transparent'],
        ['Parametric', 'measured physical parameter', 'high', 'fast, transparent'],
        ['Industry index', 'industry-wide losses', 'moderate', 'medium'],
        ['Modeled loss', 'agreed model on sponsor exposure', 'moderate', 'medium'],
      ]},
      { title: 'AI vocabulary', cols: ['Term', 'One line'], rows: [
        ['LLM', 'the model: text in, text out'],
        ['Agent', 'LLM in a loop that uses tools to reach a goal'],
        ['Tool', 'a function the agent can call'],
        ['MCP server / client', 'offers tools / connects to them, using a standard protocol'],
        ['API', 'programs talking over a network'],
        ['Library', 'code imported into your program'],
        ['RAG', 'retrieve documents, then answer from them'],
        ['Workflow', 'fixed sequence of steps'],
      ]},
      { title: 'Formulas', cols: ['Item', 'Formula'], rows: [
        ['HDD (day)', r`\(\max(0,65-T)\)`],
        ['CDD (day)', r`\(\max(0,T-65)\)`],
        ['CME weather future', '$20 × index'],
        ['Bollinger bands', r`\(\text{SMA}_{20}\pm2\sigma_{20}\)`],
      ]},
    ],
    practice: [
      { id: 'q1', type: 'num', concept: 'hdd', q: r`Daily average temperatures: 30°F, 45°F, 60°F, 68°F. What is the total HDD?`, answer: 35 + 20 + 5, tol: 0.01,
        hint: r`\(\max(0,65-T)\) each day.`, solution: r`35 + 20 + 5 + 0 = 60.` },
      { id: 'q2', type: 'num', concept: 'hdd', q: r`A monthly HDD index settles at 850. What is one CME contract worth, in dollars?`, answer: 17000, tol: 1,
        hint: '$20 per point.', solution: r`\(850\times20=\$17{,}000\).` },
      { id: 'q3', type: 'num', concept: 'hdd', q: r`A day averages 80°F. What are its CDD?`, answer: 15, tol: 0.01,
        hint: r`\(\max(0,T-65)\).`, solution: r`\(80-65=15\).` },
      { id: 'q4', type: 'mcq', concept: 'triggers', q: r`A cat bond pays out if a hurricane's measured wind speed at a specific station exceeds 120 mph. Which trigger?`, choices: ['Indemnity', 'Parametric', 'Industry index', 'Modeled loss'], answer: 1,
        hint: 'Physical parameter.', solution: r`**Parametric**: pays on a measured physical quantity.` },
      { id: 'q5', type: 'mcq', concept: 'triggers', q: r`Which trigger has no basis risk for the sponsor?`, choices: ['Indemnity', 'Parametric', 'Industry index', 'Modeled loss'], answer: 0,
        hint: 'Pays on actual losses.', solution: r`**Indemnity** pays on the sponsor's own losses, so payout matches loss.` },
      { id: 'q6', type: 'mcq', concept: 'catbond', q: r`Why do pension funds buy cat bonds?`, choices: ['They are risk-free', 'High coupon and returns largely uncorrelated with stocks', 'They are tax-exempt', 'They pay more when stocks fall'], answer: 1,
        hint: 'Diversification.', solution: r`Hurricanes don't follow stock markets, so cat bonds diversify while paying a risk spread.` },
      { id: 'q7', type: 'num', concept: 'bollinger', q: r`A 20-day moving average is 100 and the 20-day standard deviation is 4. What is the upper Bollinger band?`, answer: 108, tol: 0.01,
        hint: r`SMA + 2σ.`, solution: r`\(100+2\times4=108\).` },
      { id: 'q8', type: 'mcq', concept: 'llmagent', q: r`Which best describes an agent?`, choices: ['A bigger LLM', 'An LLM in a loop that chooses and calls tools until a goal is met', 'A database', 'A fixed pipeline of steps'], answer: 1,
        hint: 'Answers vs does.', solution: r`An agent uses an LLM to decide actions, calls tools, and iterates.` },
      { id: 'q9', type: 'mcq', concept: 'mcp', q: r`You want any compatible AI app to query OpenFEMA through one integration. What do you build?`, choices: ['A Python library', 'An MCP server', 'A Parquet file', 'A prompt'], answer: 1,
        hint: 'Standard plug.', solution: r`An **MCP server** exposes the tool through a standard protocol that any MCP client can use.` },
      { id: 'q10', type: 'mcq', concept: 'cloud', q: r`You have 7 years of raw claim logs that are almost never read but must be kept. Where should they go?`, choices: ['S3 Standard', 'S3 Glacier (archive tier)', 'A GPU instance', 'Local laptop'], answer: 1,
        hint: 'Cheap to keep, slow to read.', solution: r`Archive tiers like Glacier are far cheaper for rarely accessed data.` },
      { id: 'q11', type: 'mcq', concept: 'mcp', q: r`An assistant first searches your policy documents and then answers using what it found. That is…`, choices: ['Fine-tuning', 'RAG', 'Vibe coding', 'A workflow'], answer: 1,
        hint: 'Retrieve, then generate.', solution: r`**Retrieval-augmented generation.**` },
      { id: 'q12', type: 'self', concept: 'prfaq', q: r`Draft a two-sentence "press release" opening for a project that predicts NFIP claim severity from OpenFEMA data.`,
        hint: 'Customer, problem, solution.',
        solution: r`Example: "Today we launch FloodSense, a free tool that tells homeowners and small insurers how much a flood would likely cost a specific property, using 40+ years of public NFIP claims. Instead of a flood-zone letter, users get a dollar estimate and the main drivers behind it, in seconds." FAQs would then cover data (OpenFEMA claims and policies), model choice, accuracy, limitations and privacy.` },
    ]
  });
})();
