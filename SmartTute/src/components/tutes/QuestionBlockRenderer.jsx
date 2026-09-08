import { FormattedTextWithMath, MathView } from '../common/MathView.jsx';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export function QuestionBlockRenderer({ block, isInteractive = false, onAnswerChange, selectedAnswer }) {
  if (!block) return null;

  switch (block.type) {
    case 'text':
      return (
        <div style={{ fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6, padding: '0.25rem 0' }}>
          <FormattedTextWithMath text={block.content} />
        </div>
      );

    case 'math':
      return (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '4px solid var(--color-deep-purple)',
            margin: '0.5rem 0',
            overflowX: 'auto',
            textAlign: 'center'
          }}
        >
          <MathView math={block.content} display={true} />
        </div>
      );

    case 'diagram':
      return (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            margin: '0.75rem 0',
            textAlign: 'center',
            overflowX: 'auto'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-deep-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            LaTeX Diagram / Graphic
          </div>
          <MathView math={block.content || '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'} display={true} />
        </div>
      );

    case 'answer':
      return (
        <AnswerBlockRenderer
          block={block}
          isInteractive={isInteractive}
          onAnswerChange={onAnswerChange}
          selectedAnswer={selectedAnswer}
        />
      );

    default:
      return (
        <div style={{ padding: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          <FormattedTextWithMath text={block.content || ''} />
        </div>
      );
  }
}

/**
 * Renders Answer Input preview or LaTeX choice options.
 */
function AnswerBlockRenderer({ block, isInteractive, onAnswerChange, selectedAnswer }) {
  const answerType = block.answerType || 'number';
  const options = block.options || [];
  const unit = block.unit || '';

  if (answerType === 'multiple_choice' && options.length > 0) {
    return (
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
          Select Correct Answer:
        </div>
        {options.map((opt, idx) => {
          const isSelected = selectedAnswer === opt;
          return (
            <button
              key={idx}
              disabled={!isInteractive}
              onClick={() => onAnswerChange && onAnswerChange(opt)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '2px solid var(--color-deep-purple)' : '1px solid var(--color-border)',
                backgroundColor: isSelected ? 'rgba(167, 139, 250, 0.12)' : '#FFFFFF',
                color: 'var(--color-text)',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: isInteractive ? 'pointer' : 'default'
              }}
            >
              <FormattedTextWithMath text={opt} />
              {isSelected && <CheckCircle2 size={18} color="var(--color-deep-purple)" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Number / Short text input block
  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.85rem 1rem',
        backgroundColor: 'rgba(125, 211, 252, 0.1)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}
    >
      <HelpCircle size={20} color="var(--color-deep-blue)" />
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
          Target Answer ({answerType.toUpperCase()})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
          <input
            type={answerType === 'number' ? 'number' : 'text'}
            placeholder={`Enter ${answerType} answer...`}
            value={selectedAnswer !== undefined ? selectedAnswer : (block.correctAnswer || '')}
            onChange={(e) => onAnswerChange && onAnswerChange(e.target.value)}
            disabled={!isInteractive}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.95rem',
              width: '180px'
            }}
          />
          {unit && <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
}
