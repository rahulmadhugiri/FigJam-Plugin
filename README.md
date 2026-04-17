# FigJam Workshop AI

A FigJam plugin that lets you talk to your board. Describe what you want to change in plain English — the plugin reads your board state, sends it to OpenAI's `gpt-4o-mini`, and applies structured actions back to the canvas without leaving FigJam.

---

## What it does

Instead of manually editing dozens of sticky notes, sections, or frames, you type a natural language instruction. The plugin:

1. Serializes your current selection (or the full board if nothing is selected) into a structured JSON snapshot — including node types, positions, sizes, text content, fill colors, text colors, lock state, and visibility.
2. Sends that snapshot plus your instruction to `gpt-4o-mini` with a strict JSON-output system prompt.
3. Validates the returned actions against a known schema before touching anything on the canvas.
4. Dispatches each action through the Figma Plugin API and reports back what was applied.

Your OpenAI API key is stored locally using Figma's encrypted `clientStorage` — it is never sent anywhere except directly to `api.openai.com`.

---

## Supported actions (35 total)

### Text
| Action | What it does |
|--------|-------------|
| `update_text` | Change the text content of a sticky, label, or text block |
| `set_font_size` | Set the font size of a text node |
| `set_font_color` | Set the text color (r/g/b/a, values 0–1) |
| `set_text_align` | Set horizontal and/or vertical text alignment |
| `set_text_decoration` | Apply underline or strikethrough |
| `set_text_case` | Transform to UPPER, lower, or Title case |

### Position & Size
| Action | What it does |
|--------|-------------|
| `move_node` | Move a node to an absolute x/y position |
| `move_nodes_down` | Shift a group of nodes down by a pixel amount |
| `resize_node` | Set a node's width and height |
| `rotate_node` | Rotate a node to a degree value (−180 to 180) |
| `reposition_section` | Move a section to specific x/y coordinates |

### Visual
| Action | What it does |
|--------|-------------|
| `set_fill_color` | Set the background/fill color of any node |
| `set_stroke` | Set stroke color and weight |
| `set_opacity` | Set opacity (0–1) |
| `set_corner_radius` | Round the corners of a frame or rectangle |
| `set_visible` | Show or hide a node |
| `set_blend_mode` | Set blend mode (NORMAL, MULTIPLY, SCREEN, etc.) |

### Node Management
| Action | What it does |
|--------|-------------|
| `lock_nodes` | Lock nodes so they can't be moved or edited |
| `unlock_nodes` | Unlock nodes to make them editable |
| `rename_node` | Rename a node in the layer panel |
| `delete_nodes` | Delete one or more nodes |
| `duplicate_node` | Clone a node with an optional x/y offset |
| `duplicate_section` | Clone a section, optionally into a new parent |
| `group_nodes` | Group two or more nodes together |
| `ungroup_node` | Ungroup a group node |
| `move_to_front` | Bring a node to the top of the z-order |
| `move_to_back` | Send a node to the bottom of the z-order |

### Create
| Action | What it does |
|--------|-------------|
| `insert_new_sticky` | Add a sticky note at a position or after another node |
| `insert_frame` | Create a new frame at x/y with width/height |
| `insert_text` | Create a new text node at x/y |
| `insert_section` | Create a new section at x/y with width/height |
| `insert_rectangle` | Create a rectangle shape |
| `insert_ellipse` | Create an ellipse or circle |

### FigJam-specific
| Action | What it does |
|--------|-------------|
| `set_sticky_color` | Change the background color of a sticky note |
| `set_section_hidden` | Collapse or expand a section's contents |
| `scroll_into_view` | Scroll the viewport to show specific nodes |

---

## Smart local shortcuts

Some instructions never hit the LLM — they are resolved entirely client-side for speed and reliability:

**Legibility fix** — phrases like "make the text legible" or "improve contrast" trigger a local pass that computes the luminance of each node's fill color and sets the text color to white or near-black accordingly. No API call, no guessing.

**Spatial swap** — phrases like "swap the 2nd and 3rd one" trigger a local spatial clustering algorithm that groups nodes by proximity, sorts them in reading order, and physically swaps the two groups' positions. Works on any node type.

**Repeated layout** — phrases like "make this for 2 more people" or "add 3 more" detect your selected nodes as a repeated grid (e.g. a NAME label + columns of stickies per person), compute the group structure, and clone entire person-groups into a new row with matching spacing. Works whether your groups are loose nodes, sections, or frames.

---

## How selection works

- **Something selected** → the plugin uses your selection as the primary context and sends the full board as supplementary context. The LLM is explicitly told which nodes are selected so "this", "these", and "it" resolve correctly.
- **Nothing selected** → the plugin falls back to the nearest 100 nodes on the page, sorted by proximity to the viewport center.

The plugin requests a fresh selection snapshot immediately before each LLM call to avoid stale state.

---

## Setup

Anyone can run this plugin locally without it needing to be published to the Figma community. You just need Figma Desktop (free) and an OpenAI API key.

### Step 1 — Download the code

**Option A: Clone with git**
```bash
git clone https://github.com/rahulmadhugiri/my-figjam-plugin.git
cd my-figjam-plugin
```

**Option B: Download as ZIP**
1. Go to the GitHub repo page
2. Click the green **Code** button → **Download ZIP**
3. Unzip the folder somewhere on your computer (e.g. your Desktop)

### Step 2 — Install dependencies and build

You need [Node.js](https://nodejs.org) installed (any version 16+).

Open a terminal in the project folder and run:

```bash
npm install
npm run build
```

This compiles `src/code.ts` into `src/code.js`, which is the file Figma actually runs. You only need to do this once (or again if you edit the source).

### Step 3 — Import the plugin into Figma

> **Important:** You need **Figma Desktop**, not the browser version, to load development plugins. Download it at [figma.com/downloads](https://www.figma.com/downloads/).

1. Open **Figma Desktop**.
2. Open any **FigJam** file — or create a new one via **File → New FigJam**.
3. Click the **Figma logo** in the top-left corner.
4. Go to **Plugins → Development → Import plugin from manifest…**
5. In the file picker, navigate to the folder you downloaded and select the **`manifest.json`** file.
6. Figma will confirm the plugin is imported. **FigJam Workshop AI** will now appear under **Plugins → Development**.

### Step 4 — Run the plugin

1. In your FigJam file, click the Figma logo → **Plugins → Development → FigJam Workshop AI**.
2. The plugin panel opens inside FigJam.
3. Paste your **OpenAI API key** (starts with `sk-...`) into the API Key field. You can get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
4. Your key is saved automatically — you won't need to enter it again next time.

### Step 5 — Use it

- **Select** elements on the board, then type what you want to change and press **Enter**.
- If nothing is selected, the plugin uses the full board as context.
- Press **Shift+Enter** to add a line break without sending.
- Click the **?** button in the top-right of the plugin to see everything it can do.

### After restarting Figma

The plugin stays imported permanently. Just go to **Plugins → Development → FigJam Workshop AI** to open it again — no re-importing needed.

### If you make changes to the source

```bash
npm run build      # recompile once
npm run watch      # auto-recompile on every save
```

Close and reopen the plugin in Figma after rebuilding to pick up the changes.

---

## Project structure

```
manifest.json       # Figma plugin manifest
src/
  code.ts           # Plugin sandbox (Figma API access, action dispatch)
  code.js           # Compiled output — what Figma loads
  ui.html           # Plugin iframe UI (chat interface, LLM call, spatial analysis)
assets/
  community-icon.svg
```

The plugin follows Figma's two-process model:
- **`code.ts`** runs in a sandboxed JS environment with access to the Figma API but no network access.
- **`ui.html`** runs in a sandboxed iframe with network access (OpenAI) but no direct Figma API access.
- They communicate via `figma.ui.postMessage` / `window.onmessage`.

---

## Cost

All LLM calls use `gpt-4o-mini`. A typical board interaction (serialized JSON snapshot + instruction + response) is roughly 1,000–3,000 tokens, which costs under $0.001 per message at current OpenAI pricing.

---

## Limitations

- Node positions in the serialized snapshot are parent-relative for nested nodes. Instructions that reference nodes deep inside frames may produce incorrect absolute coordinates.
- The repeated-layout and swap shortcuts rely on spatial clustering with a fixed proximity threshold — very tightly packed or very widely spaced layouts may not cluster correctly.
- `gpt-4o-mini` occasionally generates actions for node types that don't support them (e.g. `set_stroke` on a SECTION). The plugin catches these at runtime and reports them as warnings without crashing.
- Font loading is required before any text mutation. If a font is not available in the Figma environment, the action will fail with an error message in the chat.
