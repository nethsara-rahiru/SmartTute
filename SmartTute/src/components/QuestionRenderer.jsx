import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { parseQuestionContent } from '../utils/latexParser';
import LatexError from './LatexError';
import TikzRenderer from './TikzRenderer';

// ─── Plain KaTeX renderer (no placeholders) ──────────────────────────────────

const KatexSpan = ({ latex, displayMode }) => {
  let html = '';
  let errorMsg = null;

  try {
    html = katex.renderToString(latex, { displayMode, throwOnError: true });
  } catch (err) {
    errorMsg = err?.message || 'Math rendering error';
  }

  if (errorMsg) {
    return (
      <span
        className="katex-error"
        style={{
          color: 'var(--color-danger, #ef4444)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.85em',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
        title={errorMsg}
      >
        ⚠️ [Math Error: {latex}]
      </span>
    );
  }

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

KatexSpan.propTypes = {
  latex: PropTypes.string.isRequired,
  displayMode: PropTypes.bool,
};

// ─── KaTeX renderer WITH embedded answer placeholders ────────────────────────
//
// Strategy:
//   1. Replace every {{answer_x}} in the LaTeX string with
//      \htmlClass{smttans-answer_x}{\square}  before calling katex.renderToString.
//      This keeps the whole expression valid LaTeX. KaTeX renders \square as □ and
//      wraps it in <span class="smttans-answer_x">.
//      (Requires trust:true so KaTeX allows HTML class injection.)
//   2. After rendering, use querySelectorAll('[class*="smttans-"]') to find every
//      injected span and replace it with a real <input> element.
//   3. Event delegation captures input changes without fighting React's reconciler.
//   4. A separate sync effect keeps input values in step with userAnswers.

function injectMarkers(latex) {
  // CSS class names allow underscores and hyphens — no encoding needed.
  return latex.replace(
    /\{\{(answer_[a-zA-Z0-9_-]+)\}\}/g,
    (_, id) => `\\htmlClass{smttans-${id}}{\\square}`,
  );
}

const KatexWithPlaceholders = ({
  latex,
  displayMode,
  placeholderIds,
  answers,
  userAnswers,
  onAnswerChange,
  disabled,
}) => {
  const containerRef = useRef(null);

  const markedLatex = injectMarkers(latex);

  let html = '';
  let errorMsg = null;
  try {
    html = katex.renderToString(markedLatex, {
      displayMode,
      throwOnError: false,
      // trust:true enables \htmlClass, \htmlStyle, etc.
      trust: true,
    });
  } catch (err) {
    errorMsg = err?.message || 'Math rendering error';
  }

  // ── Post-process: swap injected .smttans-* spans → <input> elements ─────────
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !placeholderIds?.length) return;

    // KaTeX wraps \htmlClass{cls}{content} as <span class="cls ...">content</span>
    root.querySelectorAll('[class*="smttans-"]').forEach((el) => {
      // Extract our answer ID from the element's class list
      const cls = [...el.classList].find((c) => c.startsWith('smttans-'));
      if (!cls) return;
      const id = cls.slice('smttans-'.length); // e.g. "answer_1"

      const config = (answers || []).find((a) => a.id === id);
      const input = document.createElement('input');

      input.type = config?.type === 'number' ? 'number' : 'text';
      input.placeholder = config?.type === 'number' ? '0' : '…';
      input.dataset.answerId = id;
      input.value = (userAnswers || {})[id] ?? '';
      input.disabled = !!disabled;

      Object.assign(input.style, {
        border: '1.5px solid #6366f1',
        borderRadius: '4px',
        padding: '2px 8px',
        width: config?.type === 'number' ? '70px' : '100px',
        fontSize: '0.88em',
        fontFamily: 'sans-serif',
        background: disabled ? '#f1f5f9' : '#ffffff',
        color: '#1e293b',
        outline: 'none',
        verticalAlign: 'middle',
        margin: '0 3px',
        cursor: disabled ? 'not-allowed' : 'text',
        boxShadow: '0 0 0 2px rgba(99,102,241,0.18)',
      });

      el.replaceWith(input);
    });
  // Re-run only when the rendered HTML changes (i.e. latex / displayMode changed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  // ── Event delegation — captures input events from injected <input> elements ─
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.dataset.answerId) {
        onAnswerChange?.(e.target.dataset.answerId, e.target.value);
      }
    };
    root.addEventListener('input', handler);
    return () => root.removeEventListener('input', handler);
  }, [onAnswerChange]);

  // ── Sync userAnswers → injected input values without a full re-render ───────
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll('input[data-answer-id]').forEach((inp) => {
      const val = (userAnswers || {})[inp.dataset.answerId] ?? '';
      if (inp.value !== val) inp.value = val;
    });
  }, [userAnswers]);

  if (errorMsg) {
    return (
      <span
        className="katex-error"
        style={{
          color: 'var(--color-danger, #ef4444)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.85em',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
        title={errorMsg}
      >
        ⚠️ [Math Error: {latex}]
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

KatexWithPlaceholders.propTypes = {
  latex: PropTypes.string.isRequired,
  displayMode: PropTypes.bool,
  placeholderIds: PropTypes.arrayOf(PropTypes.string),
  answers: PropTypes.array,
  userAnswers: PropTypes.object,
  onAnswerChange: PropTypes.func,
  disabled: PropTypes.bool,
};

// ─── Standalone answer input (outside math) ───────────────────────────────────

function StandaloneAnswerInput({ answerId, answers, userAnswers, onAnswerChange, disabled }) {
  const config = (answers || []).find((a) => a.id === answerId);
  const value = (userAnswers || {})[answerId] ?? '';

  if (!config) {
    return (
      <span
        style={{
          color: '#b45309',
          backgroundColor: '#fef3c7',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.85em',
          fontFamily: 'monospace',
          border: '1px dashed #f59e0b',
        }}
      >
        ❓ [{answerId} unconfigured]
      </span>
    );
  }

  if (config.type === 'multiple_choice') {
    return (
      <select
        className="answer-input answer-select"
        value={value}
        onChange={(e) => onAnswerChange?.(answerId, e.target.value)}
        disabled={disabled}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--color-border, #cbd5e1)',
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          color: 'var(--color-text, #1e293b)',
          fontSize: '0.95rem',
          margin: '0 4px',
        }}
      >
        <option value="">Select answer...</option>
        {(config.options || []).map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={config.type === 'number' ? 'number' : 'text'}
      className="answer-input answer-text"
      placeholder={`Enter ${config.type || 'answer'}...`}
      value={value}
      onChange={(e) => onAnswerChange?.(answerId, e.target.value)}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid var(--color-border, #cbd5e1)',
        backgroundColor: 'var(--color-bg-card, #ffffff)',
        color: 'var(--color-text, #1e293b)',
        fontSize: '0.95rem',
        margin: '0 4px',
        width: config.type === 'number' ? '110px' : '160px',
        display: 'inline-block',
      }}
    />
  );
}

StandaloneAnswerInput.propTypes = {
  answerId: PropTypes.string.isRequired,
  answers: PropTypes.array,
  userAnswers: PropTypes.object,
  onAnswerChange: PropTypes.func,
  disabled: PropTypes.bool,
};

// ─── Main QuestionRenderer ────────────────────────────────────────────────────

export function QuestionRenderer({
  content,
  answers = [],
  userAnswers = {},
  onAnswerChange,
  disabled = false,
}) {
  const segments = parseQuestionContent(content);

  return (
    <div className="question-renderer-content" style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
      {segments.map((seg, idx) => {
        // ── Plain text ────────────────────────────────────────────────────
        if (seg.type === 'text') {
          return (
            <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>
              {seg.value}
            </span>
          );
        }

        // ── Inline math (no placeholders) ─────────────────────────────────
        if (seg.type === 'math_inline') {
          return (
            <LatexError key={idx} latex={seg.value}>
              <KatexSpan latex={seg.value} displayMode={false} />
            </LatexError>
          );
        }

        // ── Display math (no placeholders) ───────────────────────────────
        if (seg.type === 'math_block') {
          return (
            <div key={idx} className="math-block-wrapper" style={{ margin: '12px 0', textAlign: 'center', overflowX: 'auto' }}>
              <LatexError latex={seg.value}>
                <KatexSpan latex={seg.value} displayMode={true} />
              </LatexError>
            </div>
          );
        }

        // ── Inline math WITH embedded placeholders ────────────────────────
        if (seg.type === 'math_inline_with_answers') {
          return (
            <KatexWithPlaceholders
              key={idx}
              latex={seg.value}
              displayMode={false}
              placeholderIds={seg.placeholderIds}
              answers={answers}
              userAnswers={userAnswers}
              onAnswerChange={onAnswerChange}
              disabled={disabled}
            />
          );
        }

        // ── Display math WITH embedded placeholders ───────────────────────
        if (seg.type === 'math_block_with_answers') {
          return (
            <div key={idx} className="math-block-wrapper" style={{ margin: '12px 0', textAlign: 'center', overflowX: 'auto' }}>
              <KatexWithPlaceholders
                latex={seg.value}
                displayMode={true}
                placeholderIds={seg.placeholderIds}
                answers={answers}
                userAnswers={userAnswers}
                onAnswerChange={onAnswerChange}
                disabled={disabled}
              />
            </div>
          );
        }

        // ── TikZ diagram ──────────────────────────────────────────────────
        if (seg.type === 'tikz') {
          return <TikzRenderer key={idx} tikzCode={seg.value} />;
        }

        // ── Standalone answer placeholder (outside math) ──────────────────
        if (seg.type === 'answer_placeholder') {
          return (
            <span key={idx} style={{ display: 'inline-block' }}>
              <StandaloneAnswerInput
                answerId={seg.answerId}
                answers={answers}
                userAnswers={userAnswers}
                onAnswerChange={onAnswerChange}
                disabled={disabled}
              />
            </span>
          );
        }

        return null;
      })}
    </div>
  );
}

QuestionRenderer.propTypes = {
  content: PropTypes.string,
  answers: PropTypes.array,
  userAnswers: PropTypes.object,
  onAnswerChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default QuestionRenderer;
