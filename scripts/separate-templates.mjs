/**
 * Extracts inline Angular templates and styles into separate .html / .scss files.
 *
 * Handles:
 *   template: `...`           → writes <name>.html, changes to templateUrl
 *   styles: [`...`]           → writes <name>.scss, changes to styleUrl
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, statSync } from 'fs';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Find the index of the CLOSING backtick that matches the opening one at `start`.
 *  Skips \` escaped backticks.  Does NOT try to track ${} depth because Angular
 *  templates use {{ }} not ${}, so no nested template literals in practice. */
function findClosingBacktick(src, start) {
  let i = start + 1;
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue; } // escaped char
    if (src[i] === '`')  return i;
    i++;
  }
  return -1;
}

/** Extract the content of a template literal that begins at `openTick`. */
function extractLiteral(src, openTick) {
  const closeTick = findClosingBacktick(src, openTick);
  if (closeTick === -1) return null;
  return { content: src.slice(openTick + 1, closeTick), end: closeTick };
}

// ── main processing ───────────────────────────────────────────────────────────

function processFile(filePath) {
  let src = readFileSync(filePath, 'utf8');
  const dir   = dirname(filePath);
  const name  = basename(filePath, '.ts');   // e.g. "cursor"
  let changed = false;

  // ── 1. Extract template: `...` ─────────────────────────────────────────────
  const tplKeyRe = /\btemplate:\s*`/g;
  let tplMatch   = tplKeyRe.exec(src);
  if (tplMatch) {
    const openTick = src.indexOf('`', tplMatch.index);
    const lit      = extractLiteral(src, openTick);
    if (lit) {
      const htmlPath = join(dir, name + '.html');
      writeFileSync(htmlPath, lit.content);

      // Replace template: `...` with templateUrl: './name.html'
      src = src.slice(0, tplMatch.index)
          + `templateUrl: './${name}.html'`
          + src.slice(lit.end + 1);
      changed = true;
      console.log(`  [html] wrote ${name}.html`);
    }
  }

  // ── 2. Extract styles: [`...`] ────────────────────────────────────────────
  // Re-search after template replacement may have shifted indices
  const styKeyRe = /\bstyles:\s*\[\s*`/g;
  let styMatch   = styKeyRe.exec(src);
  if (styMatch) {
    const openTick = src.indexOf('`', styMatch.index);
    const lit      = extractLiteral(src, openTick);
    if (lit) {
      // Find the closing `]` after the closing backtick
      const closeArray = src.indexOf(']', lit.end);
      if (closeArray !== -1) {
        const scssPath = join(dir, name + '.scss');
        writeFileSync(scssPath, lit.content);

        // Replace styles: [`...`] with styleUrl: './name.scss'
        src = src.slice(0, styMatch.index)
            + `styleUrl: './${name}.scss'`
            + src.slice(closeArray + 1);
        changed = true;
        console.log(`  [scss] wrote ${name}.scss`);
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, src);
    console.log(`  [ts]   updated ${name}.ts`);
  }
  return changed;
}

// ── walk the src tree ────────────────────────────────────────────────────────

function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, results);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

const __dir  = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dir, '..', 'src', 'Frontend', 'falful-web', 'src', 'app');

let processed = 0;
for (const file of walk(srcDir)) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('template: `')) continue;

  console.log(`\n▶ ${file.replace(srcDir, '').replace(/\\/g, '/')}`);
  if (processFile(file)) processed++;
}

console.log(`\n✅  Done. ${processed} files updated.`);
