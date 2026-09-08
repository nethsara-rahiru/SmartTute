/**
 * Parses LaTeX content into renderable segments.
 *
 * Segment types:
 *   text                     – plain text
 *   math_inline              – $...$ with no placeholders
 *   math_block               – $$...$$ (or \[...\]) with no placeholders
 *   math_inline_with_answers – $...$ containing one or more {{answer_x}}
 *   math_block_with_answers  – $$...$$ containing one or more {{answer_x}}
 *   tikz                     – \begin{tikzpicture}...\end{tikzpicture}
 *   answer_placeholder       – {{answer_x}} outside any math environment
 *
 * Text-heavy display math:
 *   \[ \text{A long sentence ...} \] blocks whose content is ≥ 55 % inside
 *   \text{...} are automatically expanded to plain-text + inline-math segments
 *   so they word-wrap naturally instead of overflowing in a single line.
 *
 * IMPORTANT: When {{answer_x}} appears INSIDE a math environment (even complex
 * ones like \begin{array}), the whole math block is kept intact and emitted as
 * math_*_with_answers.  The renderer then uses DOM post-processing to inject real
 * <input> elements without breaking the LaTeX structure.
 */

const PLACEHOLDER_RE = /\{\{(answer_[a-zA-Z0-9_-]+)\}\}/g;

function extractPlaceholderIds(str) {
  const ids = [];
  let m;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((m = PLACEHOLDER_RE.exec(str)) !== null) ids.push(m[1]);
  PLACEHOLDER_RE.lastIndex = 0;
  return ids;
}

/**
 * Returns true when the majority of meaningful characters in a LaTeX block
 * are inside \text{} calls — meaning it's sentence text dressed as display math.
 *
 * Heuristic: (chars inside \text{}) / (total non-whitespace chars) >= 0.55
 *
 * Examples that ARE text-heavy (will be expanded to plain text):
 *   \text{A cuboid has length }8\text{ cm and width }5\text{ cm.}
 *
 * Examples that are NOT text-heavy (rendered as a proper math block):
 *   f(x) = x^2 \text{ for all } x > 0
 *   \begin{array}{|c|c|} ... \end{array}
 */
function isTextHeavy(inner) {
  // A block with any multi-line environment (array, align, matrix, …) is never text-heavy
  if (/\\begin\{/.test(inner)) return false;

  let textChars = 0;
  const textRe = /\\text\s*\{([^}]*)\}/g;
  let m;
  while ((m = textRe.exec(inner)) !== null) textChars += m[1].length;

  const totalNonWS = inner.replace(/\s+/g, '').length;
  if (totalNonWS === 0) return false;

  return textChars / totalNonWS >= 0.55;
}

/**
 * Expands a text-heavy display-math block into an array of segments.
 * Converts \text{...} → text segments and bare math tokens → math_inline segments.
 * Also handles embedded {{answer_x}} placeholders.
 *
 * E.g. `\text{Length is }8\text{ cm.}`
 *   → [ {type:'text', value:'Length is '}, {type:'math_inline', value:'8'}, {type:'text', value:' cm.'} ]
 */
function expandTextHeavyBlock(inner) {
  const segs = [];

  // Tokenise: \text{...} | {{answer_x}} | remaining math fragments
  const EXPAND_RE = /\\text\s*\{([^}]*)\}|(\{\{answer_[a-zA-Z0-9_-]+\}\})|([^\\{]+|\\[a-zA-Z]+|.)/g;
  let m;

  while ((m = EXPAND_RE.exec(inner)) !== null) {
    if (m[1] !== undefined) {
      // \text{content} → plain text
      if (m[1]) segs.push({ type: 'text', value: m[1] });
    } else if (m[2]) {
      // {{answer_x}} placeholder
      segs.push({ type: 'answer_placeholder', answerId: m[2].slice(2, -2).trim() });
    } else if (m[3] && m[3].trim()) {
      // Bare math fragment (e.g. "8", "5", "\frac{1}{2}") → inline math
      // Skip pure whitespace and lone punctuation that belongs to text flow
      const raw = m[3];
      if (/^\s+$/.test(raw)) {
        // Whitespace between tokens — keep as text
        segs.push({ type: 'text', value: raw });
      } else {
        segs.push({ type: 'math_inline', value: raw.trim() });
      }
    }
  }

  return segs;
}

export function parseQuestionContent(content = '') {
  if (!content || typeof content !== 'string') return [];

  // ── 1. Strip document-level wrappers ──────────────────────────────────────
  let cleaned = content;
  cleaned = cleaned.replace(/\\documentclass\{[^}]*\}/g, '');
  cleaned = cleaned.replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, '');
  cleaned = cleaned.replace(/\\begin\{document\}/g, '');
  cleaned = cleaned.replace(/\\end\{document\}/g, '');
  cleaned = cleaned.replace(/\\begin\{center\}/g, '');
  cleaned = cleaned.replace(/\\end\{center\}/g, '');
  cleaned = cleaned.trim();

  // ── 2. Normalize display math delimiters ──────────────────────────────────
  // Convert \[ ... \] → $$ ... $$ so we only need one display-math path.
  cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`);

  // ── 3. Expand enumerate lists ─────────────────────────────────────────────
  cleaned = cleaned.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, inner) => {
    let n = 1;
    return inner.replace(/\\item\s*/g, () => `\n${n++}. `);
  });

  // ── 4. First-pass tokenisation ────────────────────────────────────────────
  // Split on tikzpicture | $$ ... $$ | $ ... $ | {{answer_x}}
  // We use exec-loop (not split) so we don't accidentally drop text.
  const TOKEN_RE =
    /(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}|\$\$[\s\S]*?\$\$|\$[^$]*?\$|\{\{answer_[a-zA-Z0-9_-]+\}\})/g;

  const tokens = [];      // { kind: 'text'|'token', raw: string }
  let lastIndex = 0;
  let m;

  while ((m = TOKEN_RE.exec(cleaned)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: 'text', raw: cleaned.slice(lastIndex, m.index) });
    }
    tokens.push({ kind: 'token', raw: m[0] });
    lastIndex = TOKEN_RE.lastIndex;
  }
  if (lastIndex < cleaned.length) {
    tokens.push({ kind: 'text', raw: cleaned.slice(lastIndex) });
  }

  // ── 5. Classify tokens into segments ──────────────────────────────────────
  const segments = [];
  const TEXT_PLACEHOLDER_RE = /(\{\{answer_[a-zA-Z0-9_-]+\}\})/g;

  tokens.forEach(({ kind, raw }) => {
    if (!raw) return;

    if (kind === 'text') {
      // Text may still have bare {{answer_x}} placeholders outside math
      const parts = raw.split(TEXT_PLACEHOLDER_RE);
      parts.forEach((part) => {
        if (!part) return;
        if (part.startsWith('{{') && part.endsWith('}}')) {
          segments.push({ type: 'answer_placeholder', answerId: part.slice(2, -2).trim() });
        } else {
          segments.push({ type: 'text', value: part });
        }
      });
      return;
    }

    // ── TikZ ──────────────────────────────────────────────────────────────
    if (raw.startsWith('\\begin{tikzpicture}')) {
      segments.push({ type: 'tikz', value: raw.trim() });
      return;
    }

    // ── Display math $$ ... $$ ─────────────────────────────────────────────
    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      const inner = raw.slice(2, -2);

      // Text-heavy blocks (mostly \text{...} content) are expanded to wrappable
      // plain-text + inline-math segments instead of a single nowrap KaTeX block.
      if (isTextHeavy(inner)) {
        expandTextHeavyBlock(inner).forEach((s) => segments.push(s));
        return;
      }

      const ids = extractPlaceholderIds(inner);
      if (ids.length > 0) {
        segments.push({ type: 'math_block_with_answers', value: inner, placeholderIds: ids });
      } else {
        segments.push({ type: 'math_block', value: inner.trim() });
      }
      return;
    }

    // ── Inline math $ ... $ ───────────────────────────────────────────────
    if (raw.startsWith('$') && raw.endsWith('$')) {
      const inner = raw.slice(1, -1);
      const ids = extractPlaceholderIds(inner);
      if (ids.length > 0) {
        segments.push({ type: 'math_inline_with_answers', value: inner, placeholderIds: ids });
      } else {
        segments.push({ type: 'math_inline', value: inner.trim() });
      }
      return;
    }

    // ── Bare placeholder {{answer_x}} ────────────────────────────────────
    if (raw.startsWith('{{') && raw.endsWith('}}')) {
      segments.push({ type: 'answer_placeholder', answerId: raw.slice(2, -2).trim() });
    }
  });

  return segments;
}

/**
 * Extracts all {{answer_x}} placeholder IDs from a content string.
 */
export function extractAnswerPlaceholders(content = '') {
  if (!content || typeof content !== 'string') return [];
  const matches = content.match(/\{\{answer_[a-zA-Z0-9_-]+\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2).trim())));
}

/**
 * Validates consistency between answer placeholders in content and the answers config list.
 */
export function validateQuestionPlaceholders(content = '', answers = []) {
  const warnings = [];
  const foundPlaceholders = extractAnswerPlaceholders(content);
  const configuredAnswerIds = (answers || []).map((a) => a.id);

  foundPlaceholders.forEach((id) => {
    if (!configuredAnswerIds.includes(id)) {
      warnings.push(`Placeholder {{${id}}} is used in text but not configured in Answer Manager.`);
    }
  });

  configuredAnswerIds.forEach((id) => {
    if (!foundPlaceholders.includes(id)) {
      warnings.push(`Answer "${id}" is configured but not placed in content using {{${id}}}.`);
    }
  });

  return warnings;
}
