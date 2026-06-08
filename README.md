<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Galaxy Editor Guide</title>
  <style>
    :root {
      --bg:      #0f0f1e;
      --surface: #1a1a2e;
      --card:    #22223a;
      --accent:  #7c6fff;
      --green:   #66bb6a;
      --orange:  #ffa726;
      --text:    #e8e8f0;
      --muted:   #9090b0;
      --border:  #2e2e4e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: Inter, Arial, sans-serif;
           font-size: 15px; line-height: 1.7; }

    /* ── Layout ── */
    .page { max-width: 860px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }
    nav   { position: sticky; top: 0; background: var(--surface); border-bottom: 1px solid var(--border);
            padding: .6rem 1.5rem; display: flex; gap: 1.2rem; flex-wrap: wrap; z-index: 10; }
    nav a { color: var(--accent); text-decoration: none; font-size: 13px; }
    nav a:hover { text-decoration: underline; }

    /* ── Typography ── */
    h1 { font-size: 2rem; color: var(--accent); margin-bottom: .3rem; }
    .subtitle { color: var(--muted); margin-bottom: 2.5rem; }
    h2 { font-size: 1.25rem; color: var(--accent); margin: 2.5rem 0 .8rem;
         padding-bottom: .4rem; border-bottom: 1px solid var(--border); }
    h3 { font-size: 1rem; color: var(--orange); margin: 1.4rem 0 .4rem; }
    p  { margin-bottom: .9rem; }
    ul, ol { margin: .4rem 0 .9rem 1.4rem; }
    li { margin-bottom: .35rem; }
    a  { color: var(--accent); }

    /* ── Cards ── */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px;
            padding: 1.2rem 1.4rem; margin-bottom: 1.2rem; }
    .card.green  { border-left: 4px solid var(--green); }
    .card.orange { border-left: 4px solid var(--orange); }
    .card.purple { border-left: 4px solid var(--accent); }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.2rem; font-size: 14px; }
    th { background: var(--surface); color: var(--accent); text-align: left;
         padding: .5rem .75rem; border: 1px solid var(--border); }
    td { padding: .45rem .75rem; border: 1px solid var(--border); vertical-align: top; }
    tr:nth-child(even) td { background: #1e1e32; }
    code { background: #2a2a42; padding: .15rem .4rem; border-radius: 4px;
           font-family: monospace; font-size: 13px; color: #c9b8ff; }

    /* ── Steps ── */
    .steps { counter-reset: step; list-style: none; margin-left: 0; }
    .steps li { counter-increment: step; padding: .5rem 0 .5rem 2.6rem; position: relative; margin-bottom: .3rem; }
    .steps li::before { content: counter(step); position: absolute; left: 0;
      background: var(--accent); color: #fff; width: 1.8rem; height: 1.8rem;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; top: .55rem; }

    /* ── Pill badges ── */
    .pill { display: inline-block; padding: .15rem .55rem; border-radius: 20px;
            font-size: 12px; font-weight: 600; margin-right: .3rem; }
    .pill.req  { background: #3a1a1a; color: #ff8a80; border: 1px solid #ff8a80; }
    .pill.opt  { background: #1a2a1a; color: #a5d6a7; border: 1px solid #a5d6a7; }

    /* ── Warning / tip boxes ── */
    .tip  { background: #1a2a1a; border: 1px solid var(--green);  border-radius: 8px; padding: .8rem 1rem; margin-bottom: 1rem; }
    .warn { background: #2a1a0a; border: 1px solid var(--orange); border-radius: 8px; padding: .8rem 1rem; margin-bottom: 1rem; }
    .tip::before  { content: "✅ "; font-weight: 700; }
    .warn::before { content: "⚠️ "; font-weight: 700; }
  </style>
</head>
<body>

<nav>
  <strong style="color:var(--text)">Galaxy Guide</strong>
  <a href="#overview">Overview</a>
  <a href="#sheets">Editing in Sheets</a>
  <a href="#nodes">Nodes</a>
  <a href="#tasks">Tasks</a>
  <a href="#context">Teacher Context</a>
  <a href="#pdfs">PDF Links</a>
  <a href="#images">Sample Images</a>
  <a href="#publish">Publishing</a>
  <a href="index.html">← Back to Galaxy</a>
</nav>

<div class="page">

  <h1>🌌 Galaxy Editor Guide</h1>
  <p class="subtitle">For Idaho Regional Math Specialists — no programming required.</p>

  <!-- ── Overview ── -->
  <section id="overview">
    <h2>How the Galaxy Works</h2>
    <p>The galaxy has <strong>two places where content lives</strong>:</p>
    <div class="card purple">
      <strong>1. Google Sheets</strong> — all text content: nodes, tasks, teacher context, connections.<br>
      Edit the Sheet → changes appear in the galaxy within ~2 minutes. No code needed.
    </div>
    <div class="card purple">
      <strong>2. GitHub Repository</strong> — image files (student work samples) and PDF task files.<br>
      Upload files through the GitHub website. Also no code needed.
    </div>
    <p>The galaxy reads from Sheets every time it loads, so <strong>editing the Sheet is all you need to do</strong> for most updates.</p>
  </section>

  <!-- ── Sheets ── -->
  <section id="sheets">
    <h2>Editing in Google Sheets</h2>
    <p>Open the <a href="https://docs.google.com/spreadsheets/d/1e3itPWSF2mNft7cQ6N7JpZt_eYs4QAMe6udEIs5pkLw/edit" target="_blank">Galaxy Data Sheet ↗</a>. It has five tabs:</p>
    <table>
      <tr><th>Tab</th><th>What it controls</th></tr>
      <tr><td><code>nodes</code></td><td>Every concept in the galaxy (domains, big ideas, mental actions, samples)</td></tr>
      <tr><td><code>progressions</code></td><td>The arrows showing how mental actions build on each other</td></tr>
      <tr><td><code>crossdomain</code></td><td>Dashed lines connecting concepts across domains</td></tr>
      <tr><td><code>tasks</code></td><td>Tasks shown in the left sidebar</td></tr>
      <tr><td><code>teacher_context</code></td><td>Planning and reflection cards that appear when a task is selected</td></tr>
    </table>
    <div class="tip">Changes save automatically. The galaxy refreshes from Sheets every time the page loads.</div>
    <div class="warn">Do not delete or rename the header row (row 1) in any tab. Do not rename the tabs themselves.</div>
  </section>

  <!-- ── Nodes ── -->
  <section id="nodes">
    <h2>Adding or Editing Nodes</h2>
    <p>Open the <code>nodes</code> tab. Each row is one concept on the galaxy map.</p>

    <h3>Column reference</h3>
    <table>
      <tr><th>Column</th><th>Required?</th><th>What to put</th><th>Example</th></tr>
      <tr>
        <td><code>id</code></td>
        <td><span class="pill req">required</span></td>
        <td>Unique code for this concept. Use the naming pattern below.</td>
        <td><code>HF.COV.MA3</code></td>
      </tr>
      <tr>
        <td><code>tier</code></td>
        <td><span class="pill req">required</span></td>
        <td><code>1</code> = Domain, <code>2</code> = Big Idea, <code>3</code> = Mental Action, <code>4</code> = Sample</td>
        <td><code>3</code></td>
      </tr>
      <tr>
        <td><code>domain</code></td>
        <td><span class="pill req">required</span></td>
        <td>Two-letter domain code this concept belongs to.</td>
        <td><code>HF</code></td>
      </tr>
      <tr>
        <td><code>parent</code></td>
        <td><span class="pill req">required</span> for tiers 2–4</td>
        <td>The <code>id</code> of the direct parent concept. Leave blank for domains (tier 1).</td>
        <td><code>HF.COV</code></td>
      </tr>
      <tr>
        <td><code>label</code></td>
        <td><span class="pill req">required</span></td>
        <td>Short display name shown on the node. Keep it under 4 words.</td>
        <td><code>Coordinating amount of change</code></td>
      </tr>
      <tr>
        <td><code>description</code></td>
        <td><span class="pill opt">optional</span></td>
        <td>Full explanation shown in the detail panel when a teacher clicks the node.</td>
        <td><code>As x increases by Δx, y changes by Δy…</code></td>
      </tr>
      <tr>
        <td><code>mediaLink</code></td>
        <td><span class="pill opt">optional</span></td>
        <td>Filename of a student work image (for tier 4 samples only). See <a href="#images">Sample Images</a>.</td>
        <td><code>hf-cov-ma3-sample1.jpg</code></td>
      </tr>
    </table>

    <h3>ID naming rules</h3>
    <div class="card">
      <strong>Domain (tier 1):</strong> 2-letter code &nbsp;→&nbsp; <code>HF</code><br>
      <strong>Big Idea (tier 2):</strong> domain + 3-letter code &nbsp;→&nbsp; <code>HF.COV</code><br>
      <strong>Mental Action (tier 3):</strong> big idea + MA + number &nbsp;→&nbsp; <code>HF.COV.MA3</code><br>
      <strong>Sample (tier 4):</strong> mental action + S + number &nbsp;→&nbsp; <code>HF.COV.MA3.S1</code>
    </div>

    <h3>Adding a new mental action</h3>
    <ol class="steps">
      <li>Find the Big Idea row it belongs under (e.g. <code>HF.COV</code>).</li>
      <li>Count how many MAs that Big Idea already has — add yours as the next number.</li>
      <li>Add a new row: fill in <code>id</code>, <code>tier</code>=3, <code>domain</code>, <code>parent</code>, <code>label</code>, <code>description</code>.</li>
      <li>If it should have a progression arrow from the previous MA, add a row in the <code>progressions</code> tab.</li>
      <li>Reload the galaxy — the new node appears automatically.</li>
    </ol>

    <div class="warn">Keep IDs short and use only letters, numbers, and dots. No spaces or special characters.</div>
  </section>

  <!-- ── Tasks ── -->
  <section id="tasks">
    <h2>Adding or Editing Tasks</h2>
    <p>Open the <code>tasks</code> tab. Each row is one task in the left sidebar.</p>

    <h3>Column reference</h3>
    <table>
      <tr><th>Column</th><th>Required?</th><th>What to put</th><th>Example</th></tr>
      <tr>
        <td><code>id</code></td>
        <td><span class="pill req">required</span></td>
        <td>Unique ID. Use <code>Task_</code> prefix + short name.</td>
        <td><code>Task_Lin1</code></td>
      </tr>
      <tr>
        <td><code>label</code></td>
        <td><span class="pill req">required</span></td>
        <td>Task name shown in the sidebar.</td>
        <td><code>The Walking Rate</code></td>
      </tr>
      <tr>
        <td><code>category</code></td>
        <td><span class="pill req">required</span></td>
        <td>Group heading in the sidebar. Tasks with the same category appear together.</td>
        <td><code>Linear</code></td>
      </tr>
      <tr>
        <td><code>domain</code></td>
        <td><span class="pill opt">optional</span></td>
        <td>Primary domain code.</td>
        <td><code>HF</code></td>
      </tr>
      <tr>
        <td><code>pdfLink</code></td>
        <td><span class="pill opt">optional</span></td>
        <td>Google Drive share URL for the task PDF. See <a href="#pdfs">PDF Links</a>.</td>
        <td><code>https://drive.google.com/…</code></td>
      </tr>
      <tr>
        <td><code>targetMAs</code></td>
        <td><span class="pill req">required</span></td>
        <td>Mental action IDs this task lights up in the galaxy. Separate multiple IDs with a <strong>pipe character</strong> <code>|</code> (no spaces).</td>
        <td><code>HF.COR.MA1|HF.COV.MA2|HF.COV.MA3</code></td>
      </tr>
    </table>

    <h3>Adding a new task</h3>
    <ol class="steps">
      <li>Add a new row at the bottom of the <code>tasks</code> tab.</li>
      <li>Fill in all required columns. For <code>targetMAs</code>, list the mental action IDs that this task is designed to surface, separated by <code>|</code>.</li>
      <li>Add planning and reflection cards in the <code>teacher_context</code> tab (see below).</li>
      <li>Optionally add a PDF link (see <a href="#pdfs">PDF Links</a>).</li>
    </ol>
  </section>

  <!-- ── Teacher Context ── -->
  <section id="context">
    <h2>Teacher Context Cards</h2>
    <p>These are the green (Planning) and orange (Reflecting) cards that appear in the sidebar and in the detail panel when a task is active. Open the <code>teacher_context</code> tab.</p>

    <h3>Column reference</h3>
    <table>
      <tr><th>Column</th><th>What to put</th><th>Example</th></tr>
      <tr>
        <td><code>taskId</code></td>
        <td>Must match the <code>id</code> from the <code>tasks</code> tab exactly.</td>
        <td><code>Task_Lin1</code></td>
      </tr>
      <tr>
        <td><code>stage</code></td>
        <td>Either <code>before</code> (Planning tab) or <code>after</code> (Reflecting tab). Lowercase.</td>
        <td><code>before</code></td>
      </tr>
      <tr>
        <td><code>maId</code></td>
        <td>The mental action this card is attached to. When a teacher clicks that node, this card appears.</td>
        <td><code>HF.COV.MA2</code></td>
      </tr>
      <tr>
        <td><code>type</code></td>
        <td>Card label — describes the kind of guidance. Common values: <code>Purposeful Question</code>, <code>Anticipated Model</code>, <code>Scaffolding</code>, <code>Intervention</code>.</td>
        <td><code>Purposeful Question</code></td>
      </tr>
      <tr>
        <td><code>content</code></td>
        <td>The actual guidance text shown on the card.</td>
        <td><code>Ask: What happens to the distance as time increases?</code></td>
      </tr>
    </table>

    <div class="tip">One task can have many context cards — just add more rows with the same <code>taskId</code>. Each row becomes a separate card.</div>

    <h3>Example: adding planning context for a new task</h3>
    <div class="card">
      <table>
        <tr><th>taskId</th><th>stage</th><th>maId</th><th>type</th><th>content</th></tr>
        <tr><td>Task_MyNew1</td><td>before</td><td>HF.COV.MA2</td><td>Purposeful Question</td><td>Ask: As x increases, what happens to y?</td></tr>
        <tr><td>Task_MyNew1</td><td>before</td><td>HF.COV.MA3</td><td>Anticipated Model</td><td>Students may draw a table. Push toward describing the constant rate.</td></tr>
        <tr><td>Task_MyNew1</td><td>after</td><td>HF.COV.MA2</td><td>Intervention</td><td>If stuck, cover the numbers and ask about the trend from the graph only.</td></tr>
      </table>
    </div>
  </section>

  <!-- ── PDFs ── -->
  <section id="pdfs">
    <h2>Linking Task PDFs</h2>
    <p>PDFs are stored in Google Drive and linked in the <code>tasks</code> tab. The galaxy opens them in an in-app viewer when a teacher clicks the 📄 button.</p>

    <ol class="steps">
      <li>Upload your PDF to Google Drive.</li>
      <li>Right-click the file → <strong>Share</strong> → change access to <strong>"Anyone with the link"</strong> → copy the link.</li>
      <li>The link looks like: <code>https://drive.google.com/file/d/FILE_ID/view?usp=sharing</code><br>
          Change <code>/view</code> to <code>/preview</code> so it embeds properly:<br>
          <code>https://drive.google.com/file/d/FILE_ID/<strong>preview</strong></code></li>
      <li>Paste that URL into the <code>pdfLink</code> column for the task row.</li>
    </ol>

    <div class="tip">The <code>/preview</code> URL is important — the plain <code>/view</code> link won't embed inside the galaxy.</div>
  </section>

  <!-- ── Images ── -->
  <section id="images">
    <h2>Uploading Student Sample Images</h2>
    <p>Sample images (tier 4 nodes) are stored in the <code>public/samples/</code> folder in the GitHub repository. You can upload them without touching any code.</p>

    <ol class="steps">
      <li>Go to <a href="https://github.com/zediiiii/secondary-math-galaxy" target="_blank">github.com/zediiiii/secondary-math-galaxy ↗</a>.</li>
      <li>Navigate to the <code>public/samples/</code> folder. (If it doesn't exist yet, click <strong>Add file → Create new file</strong>, type <code>public/samples/.gitkeep</code>, and commit it.)</li>
      <li>Click <strong>Add file → Upload files</strong>.</li>
      <li>Drag your image files in. Name them clearly, e.g. <code>hf-cov-ma3-sample1.jpg</code>.</li>
      <li>Click <strong>Commit changes</strong>.</li>
      <li>Back in the Google Sheet, put the filename (just the filename, not the full path) in the <code>mediaLink</code> column of the matching sample row in the <code>nodes</code> tab.</li>
    </ol>

    <div class="tip">Supported formats: JPG, PNG, GIF, WebP. Keep files under 5 MB for fast loading.</div>
    <div class="warn">The filename in the Sheet must match the uploaded filename exactly, including capitalization.</div>
  </section>

  <!-- ── Publishing ── -->
  <section id="publish">
    <h2>How Changes Go Live</h2>

    <h3>For Sheets changes (most edits)</h3>
    <p>Changes go live automatically — the galaxy fetches fresh data from Sheets every time it loads. There is nothing to do after saving in the Sheet.</p>
    <p>If your changes don't appear, try a <strong>hard refresh</strong>: <code>Ctrl+Shift+R</code> (Windows) or <code>Cmd+Shift+R</code> (Mac).</p>

    <h3>For image uploads (GitHub)</h3>
    <p>GitHub Pages rebuilds within about 60 seconds of a commit. After uploading an image and committing, wait a minute then reload the galaxy.</p>

    <h3>The live URL</h3>
    <div class="card green">
      <strong>🌐 <a href="https://zediiiii.github.io/secondary-math-galaxy/" target="_blank">https://zediiiii.github.io/secondary-math-galaxy/</a></strong><br>
      Share this link with teachers. It works on any device with a modern browser.
    </div>

    <h3>This guide</h3>
    <p>Bookmark this page: <a href="https://zediiiii.github.io/secondary-math-galaxy/guide.html" target="_blank">https://zediiiii.github.io/secondary-math-galaxy/guide.html</a></p>
  </section>

</div>
</body>
</html>
