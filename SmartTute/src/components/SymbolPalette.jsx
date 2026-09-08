import { useState } from 'react';
import PropTypes from 'prop-types';

const SYMBOL_CATEGORIES = {
  Greek: [
    { symbol: '\\alpha', label: 'α' },
    { symbol: '\\beta', label: 'β' },
    { symbol: '\\gamma', label: 'γ' },
    { symbol: '\\delta', label: 'δ' },
    { symbol: '\\theta', label: 'θ' },
    { symbol: '\\lambda', label: 'λ' },
    { symbol: '\\mu', label: 'μ' },
    { symbol: '\\pi', label: 'π' },
    { symbol: '\\sigma', label: 'σ' },
    { symbol: '\\phi', label: 'ϕ' },
    { symbol: '\\omega', label: 'ω' },
    { symbol: '\\Delta', label: 'Δ' },
    { symbol: '\\Sigma', label: 'Σ' },
    { symbol: '\\Omega', label: 'Ω' }
  ],
  Relations: [
    { symbol: '=', label: '=' },
    { symbol: '\\neq', label: '≠' },
    { symbol: '\\approx', label: '≈' },
    { symbol: '\\le', label: '≤' },
    { symbol: '\\ge', label: '≥' },
    { symbol: '<', label: '<' },
    { symbol: '>', label: '>' },
    { symbol: '\\equiv', label: '≡' },
    { symbol: '\\sim', label: '∼' },
    { symbol: '\\propto', label: '∝' }
  ],
  Operators: [
    { symbol: '+', label: '+' },
    { symbol: '-', label: '−' },
    { symbol: '\\times', label: '×' },
    { symbol: '\\div', label: '÷' },
    { symbol: '\\pm', label: '±' },
    { symbol: '\\cdot', label: '·' },
    { symbol: '\\sqrt{x}', label: '√' },
    { symbol: '\\infty', label: '∞' }
  ],
  'Sets & Logic': [
    { symbol: '\\in', label: '∈' },
    { symbol: '\\notin', label: '∉' },
    { symbol: '\\subset', label: '⊂' },
    { symbol: '\\subseteq', label: '⊆' },
    { symbol: '\\cup', label: '∪' },
    { symbol: '\\cap', label: '∩' },
    { symbol: '\\emptyset', label: '∅' },
    { symbol: '\\forall', label: '∀' },
    { symbol: '\\exists', label: '∃' },
    { symbol: '\\mathbb{R}', label: 'ℝ' },
    { symbol: '\\mathbb{N}', label: 'ℕ' },
    { symbol: '\\mathbb{Z}', label: 'ℤ' },
    { symbol: '\\mathbb{Q}', label: 'ℚ' }
  ],
  'Calculus & Trig': [
    { symbol: '\\sin', label: 'sin' },
    { symbol: '\\cos', label: 'cos' },
    { symbol: '\\tan', label: 'tan' },
    { symbol: '\\log', label: 'log' },
    { symbol: '\\ln', label: 'ln' },
    { symbol: '\\partial', label: '∂' },
    { symbol: '\\nabla', label: '∇' },
    { symbol: '\\int', label: '∫' },
    { symbol: '\\sum', label: '∑' },
    { symbol: '\\prod', label: '∏' },
    { symbol: '\\lim_{x \\to 0}', label: 'lim' }
  ],
  Geometry: [
    { symbol: '\\angle', label: '∠' },
    { symbol: '\\perp', label: '⊥' },
    { symbol: '\\parallel', label: '∥' },
    { symbol: '\\triangle', label: '△' },
    { symbol: '\\degree', label: '°' },
    { symbol: '\\begin{tikzpicture}\n  \\draw (0,0) circle (1.2);\n\\end{tikzpicture}', label: '⭕' },
    { symbol: '\\begin{tikzpicture}\n  \\draw (0,0) -- (2,0) -- (0,2) -- cycle;\n\\end{tikzpicture}', label: '📐' }
  ]
};

export function SymbolPalette({ onInsertSymbol }) {
  const [activeCategory, setActiveCategory] = useState('Greek');

  return (
    <div
      className="symbol-palette"
      style={{
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: '8px',
        padding: '10px',
        backgroundColor: 'var(--color-bg-card, #f8fafc)',
        marginBottom: '12px'
      }}
    >
      <div
        className="category-tabs"
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          paddingBottom: '6px',
          marginBottom: '8px',
          overflowX: 'auto'
        }}
      >
        {Object.keys(SYMBOL_CATEGORIES).map(cat => (
          <button
            key={cat}
            type="button"
            className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '3px 8px',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeCategory === cat ? 'var(--color-primary, #4f46e5)' : 'transparent',
              color: activeCategory === cat ? '#ffffff' : 'var(--color-text, #64748b)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        className="symbols-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
          gap: '4px'
        }}
      >
        {SYMBOL_CATEGORIES[activeCategory].map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="symbol-btn"
            title={item.symbol}
            onClick={() => onInsertSymbol(item.symbol)}
            style={{
              height: '34px',
              fontSize: '0.95rem',
              borderRadius: '4px',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: '#ffffff',
              color: 'var(--color-text, #1e293b)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

SymbolPalette.propTypes = {
  onInsertSymbol: PropTypes.func.isRequired
};

export default SymbolPalette;
