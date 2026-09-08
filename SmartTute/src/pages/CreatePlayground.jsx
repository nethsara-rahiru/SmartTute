import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { createPlayground } from '../services/playgroundService.js';
import { getStudent } from '../services/storage.js';
import { Gamepad2, ArrowLeft } from 'lucide-react';

export function CreatePlayground() {
  const navigate = useNavigate();
  const [student] = useState(() => getStudent());
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a playground name.');
      return;
    }

    setSubmitting(true);
    const newPg = await createPlayground(name.trim());
    setSubmitting(false);
    if (newPg && newPg.id) {
      navigate(`/playgrounds/${newPg.id}`);
    } else {
      setError('Failed to create playground. Please try again.');
    }
  };

  return (
    <AppShell student={student}>
      <div style={{ maxWidth: '600px', margin: '1.5rem auto' }}>
        <button
          onClick={() => navigate('/playgrounds')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #4f46e5)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={18} /> Back to Playgrounds
        </button>

        <div className="card" style={{ padding: '2rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justify: 'center', color: '#ec4899' }}>
              <Gamepad2 size={28} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Create New Playground Lobby</h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                Set up a virtual classroom lobby for your students.
              </p>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                Playground Session Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Algebra Challenge, Grade 10 Math Quiz"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => navigate('/playgrounds')}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ec4899',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Creating...' : 'Create & Open Lobby'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default CreatePlayground;
