import PropTypes from 'prop-types';

const LATEX_SNIPPETS = [
  { label: 'Fraction', template: '\\frac{numerator}{denominator}', title: 'Insert fraction' },
  { label: 'Square Root', template: '\\sqrt{x}', title: 'Insert square root' },
  { label: 'Exponent / Power', template: 'x^{2}', title: 'Insert power/exponent' },
  { label: 'Subscript', template: 'x_{1}', title: 'Insert subscript' },
  { label: '2x2 Matrix', template: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', title: 'Insert 2x2 matrix' },
  { label: '3x3 Matrix', template: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}', title: 'Insert 3x3 matrix' },
  { label: 'Piecewise Cases', template: '\\begin{cases} x^2 & \\text{if } x > 0 \\\\ -x & \\text{if } x \\le 0 \\end{cases}', title: 'Insert piecewise cases' },
  { label: 'Table / Array', template: '\\begin{array}{|c|c|}\\hline A & B \\\\\\hline C & D \\\\\\hline\\end{array}', title: 'Insert matrix table' },
  { label: 'Set Notation', template: '\\{ x \\mid x \\in \\mathbb{R} \\}', title: 'Insert set builder notation' },
  { label: 'Summation', template: '\\sum_{i=1}^{n} i', title: 'Insert summation' },
  { label: 'Integral', template: '\\int_{a}^{b} f(x) \\, dx', title: 'Insert integral' },
  { label: 'Limit', template: '\\lim_{x \\to \\infty} f(x)', title: 'Insert limit' },
  { label: 'TikZ Venn Diagram', template: '\\begin{tikzpicture}\n  \\draw (-0.8,0) circle (1.2);\n  \\draw (0.8,0) circle (1.2);\n  \\node at (-1.2,0) {$A$};\n  \\node at (1.2,0) {$B$};\n\\end{tikzpicture}', title: 'Insert TikZ Venn Diagram' },
  { label: 'TikZ Triangle', template: '\\begin{tikzpicture}\n  \\draw (0,0) -- (4,0) -- (2,3) -- cycle;\n  \\node[below] at (2,0) {$b$};\n  \\node[above] at (2,3) {$C$};\n\\end{tikzpicture}', title: 'Insert TikZ Geometry Triangle' },
  { label: 'TikZ Axes Graph', template: '\\begin{tikzpicture}\n  \\draw[->] (-2,0) -- (2,0) node[right] {$x$};\n  \\draw[->] (0,-2) -- (0,2) node[above] {$y$};\n  \\draw[domain=-1.5:1.5,smooth,variable=\\x,blue] plot ({\\x},{\\x*\\x});\n\\end{tikzpicture}', title: 'Insert TikZ Coordinate Axes & Graph' }
];

export function LatexToolbar({ onInsertSnippet }) {
  return (
    <div className="latex-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
      {LATEX_SNIPPETS.map((snippet, idx) => (
        <button
          key={idx}
          type="button"
          className="btn-toolbar-item"
          title={snippet.title}
          onClick={() => onInsertSnippet(snippet.template)}
          style={{
            padding: '4px 10px',
            fontSize: '0.82rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-bg-card, #ffffff)',
            color: 'var(--color-text, #334155)',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
        >
          {snippet.label}
        </button>
      ))}
    </div>
  );
}

LatexToolbar.propTypes = {
  onInsertSnippet: PropTypes.func.isRequired
};

export default LatexToolbar;
