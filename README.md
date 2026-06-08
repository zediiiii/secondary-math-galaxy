# 🌌 Secondary Math Galaxy

An interactive, traversable map of secondary mathematical concepts for Idaho Regional Math Specialists. Teachers can locate students on a conceptual landscape, illuminate the mental actions targeted by a specific task, and navigate connections across domains.

**Live app → [https://zediiiii.github.io/secondary-math-galaxy/](https://zediiiii.github.io/secondary-math-galaxy/)**

---

## How to Use the Galaxy

### The Map
The galaxy is arranged in six **Domain solar systems** (e.g. High School Functions, Ratios & Proportions). Each domain contains:

| Shape | Tier | What it is |
|-------|------|------------|
| ⭐ Star | Domain | A major content area (grades 6–12) |
| 🔵 Circle | Big Idea | An organizing concept within the domain |
| 🟩 Square | Mental Action | A specific way of thinking, ordered by sophistication |
| 💠 Diamond | Sample | A student work example linked to a mental action |

Zoom in to see labels. Zoom out to see the full galaxy and cross-domain connections.

### Selecting a Task
Click any task in the **left sidebar** to highlight the mental actions it targets:
- **Bright nodes** — directly targeted by the task
- **Dim nodes** — related via cross-domain connections
- **Faded nodes** — not relevant to this task

Planning context cards appear at the bottom of the sidebar. Click a highlighted node to see its specific guidance card.

### Planning ↔ Reflecting
Use the **Planning / Reflecting toggle** in the top bar to switch between:
- 📋 **Planning** — purposeful questions and anticipated student models (before the lesson)
- 🔄 **Reflecting** — scaffolding and intervention notes (after the lesson)

### Clicking Nodes
Click any node to open a detail panel on the right showing its description, cross-domain connections, and any related tasks. **Shift+click** multiple nodes to compare them side by side.

### Search
Use the search bar to find any concept by name or description. Results show an excerpt of the matching text. Click a result to navigate directly to that node.

### Navigation
| Button | Action |
|--------|--------|
| ⌂ | Return to full galaxy view |
| ＋ / － | Zoom in / out |
| Click background | Clear all highlighting and selections |

---

## Editing Content

All content — nodes, tasks, teacher context, and connections — is managed in a Google Sheet. No code required.

**→ [Open the Data Sheet](https://docs.google.com/spreadsheets/d/1e3itPWSF2mNft7cQ6N7JpZt_eYs4QAMe6udEIs5pkLw/edit)**

Changes in the Sheet appear in the live app within ~2 minutes.

For a full walkthrough of how to add tasks, edit mental actions, upload PDFs, and add student sample images:

**→ [Edit Guide](https://zediiiii.github.io/secondary-math-galaxy/edit-guide.html)**

---

## Technical Notes

- Built with vanilla JavaScript + [Cytoscape.js](https://js.cytoscape.org/) — no build step, no framework
- Data fetched from Google Sheets CSV at page load; falls back to seed data if Sheets is unreachable
- Hosted on GitHub Pages; update the live site with `git push`
- PWA-ready (installable, service worker caching)
- To update Sheets CSV URLs: edit `js/sheets-config.js`
