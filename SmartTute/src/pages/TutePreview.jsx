import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTuteByIdAsync } from '../services/tuteStorage';
import QuestionRenderer from '../components/QuestionRenderer';

export function TutePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tute, setTute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getTuteByIdAsync(id).then(data => {
        setTute(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Tute from MongoDB Atlas...</p>
      </div>
    );
  }

  if (!tute) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Tute Not Found</h2>
        <button
          type="button"
          onClick={() => navigate('/tutes')}
          style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '12px' }}
        >
          Return to Tutes
        </button>
      </div>
    );
  }

  const handleAnswerChange = (answerId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [answerId]: value
    }));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/tutes')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #4f46e5)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          ← Back to Tutes
        </button>
        
        <button
          type="button"
          onClick={() => navigate(`/tutes/${tute.id}/edit`)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          ✏️ Edit Tute
        </button>
      </div>

      {/* Tute Header Banner */}
      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--color-primary, #4f46e5)'
            }}
          >
            {tute.subject}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: '#475569'
            }}
          >
            {tute.grade}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: tute.status === 'published' ? '#dcfce7' : '#fef3c7',
              color: tute.status === 'published' ? '#166534' : '#92400e'
            }}
          >
            {(tute.status || 'draft').toUpperCase()}
          </span>
        </div>

        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#0f172a' }}>{tute.title}</h1>
        {tute.description && (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{tute.description}</p>
        )}
      </div>

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {(tute.questions || []).map((q, idx) => (
          <div
            key={q.id || idx}
            style={{
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-bg-card, #ffffff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              Question {idx + 1}: {q.title}
            </h3>

            <QuestionRenderer
              content={q.content}
              answers={q.answers}
              userAnswers={userAnswers}
              onAnswerChange={handleAnswerChange}
              disabled={submitted}
            />

            {submitted && (q.answers || []).length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Solution & Explanations:</strong>
                {(q.answers || []).map((ans, aIdx) => (
                  <div key={aIdx} style={{ fontSize: '0.85rem', marginTop: '6px', color: '#334155' }}>
                    • <strong>{ans.id}</strong>: Correct answer = <code>{ans.correctAnswer}</code>
                    {ans.explanation && (
                      <span style={{ marginLeft: '6px', color: '#64748b' }}>({ans.explanation})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setSubmitted(!submitted)}
          style={{
            padding: '12px 28px',
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: submitted ? '#475569' : 'var(--color-primary, #4f46e5)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}
        >
          {submitted ? 'Reset Answers' : 'Check Answers & View Solutions'}
        </button>
      </div>
    </div>
  );
}

export default TutePreview;
