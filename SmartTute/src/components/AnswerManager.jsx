import PropTypes from 'prop-types';
import { extractAnswerPlaceholders, validateQuestionPlaceholders } from '../utils/latexParser';

export function AnswerManager({ question, onChange, onInsertPlaceholder }) {
  const content = question.content || '';
  const answers = question.answers || [];
  const foundPlaceholders = extractAnswerPlaceholders(content);
  const warnings = validateQuestionPlaceholders(content, answers);

  const handleAddAnswerConfig = () => {
    // Generate new answer ID like answer_1, answer_2 based on max existing number
    const existingNums = answers.map(a => {
      const match = a.id.match(/^answer_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newId = `answer_${nextNum}`;

    const newAnswer = {
      id: newId,
      type: 'multiple_choice',
      options: ['Option 1', 'Option 2'],
      correctAnswer: 'Option 1',
      explanation: ''
    };

    onChange({
      ...question,
      answers: [...answers, newAnswer]
    });
  };

  const handleUpdateAnswer = (index, updatedAnswer) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = updatedAnswer;
    onChange({
      ...question,
      answers: updatedAnswers
    });
  };

  const handleRemoveAnswer = (index) => {
    const updatedAnswers = answers.filter((_, idx) => idx !== index);
    onChange({
      ...question,
      answers: updatedAnswers
    });
  };

  return (
    <div className="answer-manager" style={{ borderTop: '1px solid var(--color-border, #e2e8f0)', paddingTop: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text, #1e293b)' }}>
          🎯 Interactive Answer Configuration ({answers.length})
        </h4>
        <button
          type="button"
          className="btn-add-answer"
          onClick={handleAddAnswerConfig}
          style={{
            padding: '4px 10px',
            fontSize: '0.85rem',
            backgroundColor: 'var(--color-primary, #4f46e5)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          + Add Answer Config
        </button>
      </div>

      {warnings.length > 0 && (
        <div
          className="placeholder-warnings"
          style={{
            backgroundColor: '#fffbe8',
            border: '1px solid #fde047',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontSize: '0.85rem',
            color: '#854d0e'
          }}
        >
          <strong>⚠️ Placeholder Warnings:</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {answers.length === 0 ? (
        <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic', marginBottom: '12px' }}>
          No answers configured yet. Click "+ Add Answer Config" or insert placeholders into question text.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {answers.map((ans, idx) => {
            const isInsertedInContent = foundPlaceholders.includes(ans.id);

            return (
              <div
                key={idx}
                className="answer-card"
                style={{
                  border: '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--color-bg-card, #ffffff)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a', fontWeight: 'bold' }}>
                      {ans.id}
                    </code>
                    {!isInsertedInContent ? (
                      <button
                        type="button"
                        onClick={() => onInsertPlaceholder(ans.id)}
                        style={{
                          fontSize: '0.78rem',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          border: 'none',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Click to insert {{ID}} into cursor position"
                      >
                        ➕ Insert Placeholder
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 'bold' }}>✓ Placed in content</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAnswer(idx)}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--color-danger, #ef4444)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Answer ID</label>
                    <input
                      type="text"
                      value={ans.id}
                      onChange={(e) => handleUpdateAnswer(idx, { ...ans, id: e.target.value.trim() })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Input Type</label>
                    <select
                      value={ans.type}
                      onChange={(e) => handleUpdateAnswer(idx, { ...ans, type: e.target.value })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="number">Numeric Input</option>
                      <option value="text">Text Input</option>
                    </select>
                  </div>
                </div>

                {ans.type === 'multiple_choice' && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                      Options (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(ans.options || []).join(', ')}
                      onChange={(e) => {
                        const opts = e.target.value.split(',').map(s => s.trim());
                        handleUpdateAnswer(idx, { ...ans, options: opts });
                      }}
                      placeholder="e.g. 2, 3, 5, 6"
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Correct Answer</label>
                    <input
                      type="text"
                      value={ans.correctAnswer || ''}
                      onChange={(e) => handleUpdateAnswer(idx, { ...ans, correctAnswer: e.target.value })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Explanation (LaTeX allowed)</label>
                    <input
                      type="text"
                      value={ans.explanation || ''}
                      onChange={(e) => handleUpdateAnswer(idx, { ...ans, explanation: e.target.value })}
                      placeholder="e.g. Solved by completing square"
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

AnswerManager.propTypes = {
  question: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onInsertPlaceholder: PropTypes.func.isRequired
};

export default AnswerManager;
