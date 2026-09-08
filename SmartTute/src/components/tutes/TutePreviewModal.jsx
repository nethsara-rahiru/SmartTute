import { useState } from 'react';
import { X } from 'lucide-react';
import { QuestionBlockRenderer } from './QuestionBlockRenderer.jsx';

export function TutePreviewModal({ tute, onClose }) {
  const [userAnswers, setUserAnswers] = useState({});

  if (!tute) return null;

  const handleAnswerSelect = (questionId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tute-preview-title"
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(125, 211, 252, 0.2)', color: 'var(--color-deep-blue)' }}>
                {tute.grade}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(167, 139, 250, 0.2)', color: 'var(--color-deep-purple)' }}>
                {tute.subject} — {tute.unit}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: tute.status === 'Published' ? '#DCFCE7' : '#FEF3C7', color: tute.status === 'Published' ? '#166534' : '#92400E' }}>
                {tute.status}
              </span>
            </div>
            <h2 id="tute-preview-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {tute.title}
            </h2>
            {tute.description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                {tute.description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close preview"
            style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(!tute.questions || tute.questions.length === 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No questions created for this Tute yet.
            </div>
          ) : (
            tute.questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="card"
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-deep-purple)' }}>
                    Question {qIdx + 1}
                  </span>
                  {q.title && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      • {q.title}
                    </span>
                  )}
                </div>

                {/* Blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(q.blocks || []).map((block, bIdx) => (
                    <QuestionBlockRenderer
                      key={block.id || bIdx}
                      block={block}
                      isInteractive={true}
                      selectedAnswer={userAnswers[q.id]}
                      onAnswerChange={(val) => handleAnswerSelect(q.id, val)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-deep-purple)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
