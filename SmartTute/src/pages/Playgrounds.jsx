import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { getPlaygrounds, deletePlayground } from '../services/playgroundService.js';
import { getStudent, updateStudent } from '../services/storage.js';
import { AvatarEditor } from '../components/avatar/AvatarEditor.jsx';
import { Gamepad2, Plus, Users, Trash2, ExternalLink, RefreshCw } from 'lucide-react';

export function Playgrounds() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(() => getStudent());
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchPlaygroundsList = async () => {
    setLoading(true);
    const data = await getPlaygrounds();
    setPlaygrounds(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaygroundsList();
  }, []);

  const handleSaveAvatar = (newAvatar) => {
    const updated = updateStudent({ avatar: newAvatar });
    setStudent(updated);
    setIsEditorOpen(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this Playground lobby?')) {
      await deletePlayground(id);
      await fetchPlaygroundsList();
    }
  };

  return (
    <AppShell student={student} onOpenAvatarEditor={() => setIsEditorOpen(true)}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gamepad2 size={32} color="#ec4899" />
            Virtual Playgrounds
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Host live interactive classroom lobbies with animated full-body avatars.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchPlaygroundsList}
            title="Refresh Playgrounds"
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#F1F5F9',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => navigate('/playgrounds/new')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ec4899',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} />
            Create Playground
          </button>
        </div>
      </div>

      {/* Playgrounds List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', display: 'block', color: '#ec4899' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Playgrounds...</p>
        </div>
      ) : playgrounds.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--color-text-muted)' }}>
          <Gamepad2 size={56} style={{ opacity: 0.25, marginBottom: '1rem', color: '#ec4899' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>No Playgrounds Host Lobbies Yet</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.4rem', marginBottom: '1.5rem' }}>
            Create a Playground lobby so students can scan a QR code and join as full-body avatars!
          </p>
          <button
            onClick={() => navigate('/playgrounds/new')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ec4899',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Create Your First Playground
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {playgrounds.map(pg => (
            <div
              key={pg.id}
              className="card animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '12px',
                      backgroundColor: pg.status === 'started' ? '#DCFCE7' : '#FEF3C7',
                      color: pg.status === 'started' ? '#166534' : '#92400E',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {pg.status}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    <Users size={16} />
                    <span>{pg.participants ? pg.participants.length : 0} Joined</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
                  {pg.name}
                </h3>

                <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>JOIN CODE:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-deep-purple)' }}>{pg.joinCode}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                <button
                  onClick={() => navigate(`/playgrounds/${pg.id}`)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#ec4899',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ExternalLink size={16} /> Open Lobby
                </button>

                <button
                  onClick={(e) => handleDelete(pg.id, e)}
                  title="Delete Playground"
                  style={{
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Avatar Editor Modal */}
      {isEditorOpen && (
        <AvatarEditor
          currentAvatar={student.avatar}
          onSave={handleSaveAvatar}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </AppShell>
  );
}

export default Playgrounds;
