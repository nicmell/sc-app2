// Fetch the scsynth Server Command Reference and extract a spec for every
// command / reply (address, argument table, prose) into
// scripts/scdoc/out/server-commands-doc.json — the reproducible source of the
// info the hand-written @sc-app/server-commands package encodes (addresses,
// argument types, the repeating control-pair groups, reply arg positions).
//
// Doc structure: commands/replies are anchored h3 under h2 section headings:
//   <h3><a class='anchor' name='/s_new'>/s_new</a></h3>
//   <p>Create a new synth.<table> …argument rows… </table>  …more prose…
// Argument rows are `<tr><td><strong>int</strong><td>description`; a repeating
// group is a row whose value cell holds a nested <table> (its type cell is the
// multiplier, e.g. "N *"). Some SHARED formats live in a section's INTRO (the
// text between the h2 and its first h3) — e.g. the common node-notification
// args (nodeId, parent, prev, next, isGroup, …) shared by /n_go … /n_info — so
// each section's intro block is captured too.
//
// Run: node scripts/scdoc/extract-server-commands.mjs

import { BASE, fetchCached, stripTags, writeJson } from "./lib.mjs";

const URL = `${BASE}/Reference/Server-Command-Reference.html`;
const html = await fetchCached(URL);

/** Rows of a table's INNER html → args, lifting nested group tables out first
 *  so the outer <tr> split doesn't tear a group apart. */
function parseArgTable(tableInner) {
  const groups = [];
  let flat = "";
  let depth = 0;
  let buf = "";
  for (const t of tableInner.split(/(<table>|<\/table>)/)) {
    if (t === "<table>") {
      if (depth > 0) buf += t;
      else buf = "";
      depth++;
    } else if (t === "</table>") {
      depth--;
      if (depth === 0) {
        groups.push(buf);
        flat += `@@GROUP${groups.length - 1}@@`;
      } else buf += t;
    } else if (depth === 0) flat += t;
    else buf += t;
  }

  const args = [];
  for (const row of flat.split(/<tr>/).map((r) => r.trim()).filter(Boolean)) {
    const cells = row
      .split(/<td>/)
      .slice(1)
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    const g = cells[1].match(/@@GROUP(\d+)@@/);
    if (g) args.push({ repeat: stripTags(cells[0]) || "N *", group: parseArgTable(groups[+g[1]]) });
    else args.push({ type: stripTags(cells[0]), desc: stripTags(cells[1]) });
  }
  return args;
}

/** Extract the first balanced <table>…</table> range in `block` at/after `from`. */
function firstTable(block, from = 0) {
  const start = block.indexOf("<table>", from);
  if (start < 0) return null;
  let depth = 0;
  for (const t of block.slice(start).matchAll(/<table>|<\/table>/g)) {
    depth += t[0] === "<table>" ? 1 : -1;
    if (depth === 0) return { start, end: start + t.index + t[0].length };
  }
  return null;
}

/** A doc block → { description (prose before the arg table), args, notes
 *  (prose after it) }. */
function parseBlock(block) {
  const t = firstTable(block);
  if (!t) return { description: stripTags(block), args: [], notes: "" };
  return {
    description: stripTags(block.slice(0, t.start)),
    args: parseArgTable(block.slice(t.start + "<table>".length, t.end - "</table>".length)),
    notes: stripTags(block.slice(t.end)),
  };
}

// Section (h2) + command/reply (anchored h3) boundaries.
const h2s = [...html.matchAll(/<h2><a class='anchor' name='[^']+'>([\s\S]*?)<\/h2>/g)];
const H3 = /<h3><a class='anchor' name='([^']+)'>[\s\S]*?<\/h3>/g;

const sections = h2s.map((h2, i) => {
  const secStart = h2.index + h2[0].length;
  const secEnd = i + 1 < h2s.length ? h2s[i + 1].index : html.length;
  const body = html.slice(secStart, secEnd);
  const anchors = [...body.matchAll(H3)];

  const introEnd = anchors.length ? anchors[0].index : body.length;
  const intro = parseBlock(body.slice(0, introEnd));

  const commands = anchors.map((m, j) => {
    const start = m.index + m[0].length;
    const end = j + 1 < anchors.length ? anchors[j + 1].index : body.length;
    return { address: m[1], ...parseBlock(body.slice(start, end)) };
  });

  return { title: stripTags(h2[1]), intro, commands };
});

const total = sections.reduce((n, s) => n + s.commands.length, 0);
const file = writeJson("server-commands-doc.json", { source: URL, sections });
console.log(`wrote ${file} — ${total} commands/replies across ${sections.length} sections`);
