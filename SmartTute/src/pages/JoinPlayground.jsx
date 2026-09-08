import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { PlaygroundStage } from '../components/playground/PlaygroundStage.jsx';
import { AvatarPreview } from '../components/avatar/AvatarPreview.jsx';
import { AvatarEditor } from '../components/avatar/AvatarEditor.jsx';
import { getPlaygroundByCode, joinPlayground, updateParticipant } from '../services/playgroundService.js';
import { getStudent, saveStudent, updateStudent } from '../services/storage.js';
import { Gamepad2, User, Edit2, RefreshCw } from 'lucide-react';

export function JoinPlayground() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(() => getStudent());
  const [playground, setPlayground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Setup form states for new student
  const [nameInput, setNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState({
    skinTone: '#FFDBAC',
    hairStyle: 'short',
    hairColor: '#3B82F6',
    shirtColor: '#38BDF8',
    pantsColor: '#1E293B',
    shoesColor: '#FFFFFF',
    accessory: 'none'
  });

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  const fetchSession = async () => {
    if (!code) return;
    const pg = await getPlaygroundByCode(code);
    if (!pg) {
      setError('Playground not found. Please verify your join code.');
    } else {
      setPlayground(pg);
      setError('');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [code]);

  // Handle joining if student already exists
  useEffect(() => {
    if (playground && student && (student.name || student.fullName) && student.avatar) {
      joinPlayground(playground.joinCode, student);
    }
  }, [playground?.joinCode, student]);

  const handleCreateStudentAndJoin = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const newStudent = {
      id: `st_${Date.now()}`,
      name: nameInput.trim(),
      fullName: nameInput.trim(),
      avatar: selectedAvatar
    };

    saveStudent(newStudent);
    setStudent(newStudent);

    if (playground) {
      await joinPlayground(playground.joinCode, newStudent);
      await fetchSession();
    }
  };

  const handleUpdateAvatarInLobby = async (newAvatar) => {
    const updatedStudent = updateStudent({ avatar: newAvatar });
    setStudent(updatedStudent);
    setIsEditingAvatar(false);

    if (playground && updatedStudent) {
      await updateParticipant(playground.id, updatedStudent.id, {
        avatar: newAvatar,
        animation: 'bounce'
      });
      await fetchSession();
    }
  };

  const handleUpdateNameInLobby = async () => {
    if (!editNameInput.trim()) return;
    const updatedStudent = updateStudent({ name: editNameInput.trim(), fullName: editNameInput.trim() });
    setStudent(updatedStudent);
    setIsEditingName(false);

    if (playground && updatedStudent) {
      await updateParticipant(playground.id, updatedStudent.id, {
        name: editNameInput.trim()
      });
      await fetchSession();
    }
  };

  if (loading) {
    return (
      <AppShell student={student}>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', display: 'block', color: '#ec4899' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Joining Playground Stage...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !playground) {
    return (
      <AppShell student={student}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', margin: '2rem auto', maxWidth: '500px', borderRadius: '16px' }}>
          <Gamepad2 size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Invalid Playground Code</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '8px 0 20px 0' }}>{error}</p>
          <button
            onClick={() => navigate('/playgrounds')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ec4899', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Return to Playgrounds
          </button>
        </div>
      </AppShell>
    );
  }

  const isJoined = student && (student.name || student.fullName) && student.avatar;

  return (
    <AppShell student={student} onOpenAvatarEditor={() => setIsEditingAvatar(true)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Lobby Top Banner */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ec4899', letterSpacing: '0.05em' }}>
              VIRTUAL PLAYGROUND LOBBY
            </span>
            <h1 style={{ margin: '2px 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{playground.name}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, padding: '4px 12px', borderRadius: '12px', backgroundColor: playground.status === 'started' ? '#DCFCE7' : '#FEF3C7', color: playground.status === 'started' ? '#166534' : '#92400E' }}>
              {playground.status === 'started' ? '🎉 Host Started Playground!' : '⏳ Waiting for Host...'}
            </span>
          </div>
        </div>

        {/* Conditional Flow: If Student exists → Show Stage & Controls; Else → Show Setup Form */}
        {isJoined ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Student Stage Controls */}
            <div className="card" style={{ padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AvatarPreview avatar={student.avatar} size={40} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '1rem' }}>{student.name || student.fullName}</strong>
                    <button
                      onClick={() => {
                        setEditNameInput(student.name || student.fullName);
                        setIsEditingName(true);
                      }}
                      title="Edit Display Name"
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>✓ On Stage</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditingAvatar(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <User size={16} /> Edit Character
              </button>
            </div>

            {/* Virtual Playground Stage */}
            <PlaygroundStage
              participants={playground.participants || []}
              currentStudentId={student.id}
            />
          </div>
        ) : (
          /* New Student Setup Card */
          <div className="card" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '500px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800 }}>Welcome to SmartTute Playground!</h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                Enter your name and pick a character to join <strong>{playground.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleCreateStudentAndJoin}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>What is your name?</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Your Character Preview</label>
                <AvatarPreview avatar={selectedAvatar} size={140} />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ec4899',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)'
                }}
              >
                🎮 Join Stage
              </button>
            </form>
          </div>
        )}

        {/* Edit Name Modal */}
        {isEditingName && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', width: '320px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Edit Display Name</h3>
              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setIsEditingName(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleUpdateNameInLobby} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#ec4899', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Avatar Editor Modal */}
        {isEditingAvatar && (
          <AvatarEditor
            currentAvatar={student?.avatar || selectedAvatar}
            onSave={handleUpdateAvatarInLobby}
            onCancel={() => setIsEditingAvatar(false)}
          />
        )}

      </div>
    </AppShell>
  );
}

export default JoinPlayground;
