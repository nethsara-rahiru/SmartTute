import katex from 'katex';

/**
 * Renders a KaTeX math string safely into HTML string.
 */
function renderMathHtml(math, display) {
  if (!math || typeof math !== 'string') return '';
  try {
    const isBlock = display || math.startsWith('$$') || math.includes('\n');
    const cleanMath = math.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');

    return katex.renderToString(cleanMath, {
      displayMode: isBlock,
      throwOnError: false,
      output: 'htmlAndMathml'
    });
  } catch (error) {
    console.warn('[MathView] KaTeX render error:', error);
    return `<code style="color: #EF4444">${math}</code>`;
  }
}

/**
 * Safely renders LaTeX mathematical formulas using KaTeX.
 */
export function MathView({ math = '', display = false, className = '' }) {
  if (!math || typeof math !== 'string') return null;

  const isBlock = display || math.startsWith('$$') || math.includes('\n');
  const html = renderMathHtml(math, display);

  return (
    <span
      className={`math-view ${className}`}
      style={{
        display: isBlock ? 'block' : 'inline-block',
        margin: isBlock ? '0.5rem 0' : '0 0.2rem'
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Parses mixed text containing inline ($...$) or block ($$...$$) math expressions.
 */
export function FormattedTextWithMath({ text = '', className = '' }) {
  if (!text) return null;

  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <MathView key={index} math={part.slice(2, -2)} display={true} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <MathView key={index} math={part.slice(1, -1)} display={false} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
