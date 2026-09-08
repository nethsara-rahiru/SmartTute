import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { PlaygroundStage } from '../components/playground/PlaygroundStage.jsx';
import { PlaygroundQR } from '../components/playground/PlaygroundQR.jsx';
import { getPlayground, startPlayground } from '../services/playgroundService.js';
import { getStudent } from '../services/storage.js';
import { Play, ArrowLeft, Users, RefreshCw } from 'lucide-react';

export function TeacherPlayground() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student] = useState(() => getStudent());
  const [playground, setPlayground] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlaygroundDetails = async () => {
    if (!id) return;
    const pg = await getPlayground(id);
    setPlayground(pg);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaygroundDetails();
    // Auto-refresh lobby every 3 seconds to catch joining students
    const timer = setInterval(fetchPlaygroundDetails, 3000);
    return () => clearInterval(timer);
  }, [id]);

  const handleStart = async () => {
    if (!playground) return;
    await startPlayground(playground.id);
    alert('Host started the playground!');
    await fetchPlaygroundDetails();
  };

  if (loading) {
    return (
      <AppShell student={student}>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', display: 'block', color: '#ec4899' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Playground Lobby...</p>
        </div>
      </AppShell>
    );
  }

  if (!playground) {
    return (
      <AppShell student={student}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', margin: '2rem auto', maxWidth: '500px' }}>
          <h2>Playground Not Found</h2>
          <button
            onClick={() => navigate('/playgrounds')}
            style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '12px' }}
          >
            Back to Playgrounds
          </button>
        </div>
      </AppShell>
    );
  }

  const joinUrl = `${window.location.origin}/playgrounds/join/${playground.joinCode}`;

  return (
    <AppShell student={student}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/playgrounds')}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{playground.name}</h1>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', backgroundColor: playground.status === 'started' ? '#DCFCE7' : '#FEF3C7', color: playground.status === 'started' ? '#166534' : '#92400E', textTransform: 'uppercase' }}>
                  {playground.status}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Host Lobby • {playground.participants ? playground.participants.length : 0} Students Joined
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchPlaygroundDetails}
              title="Refresh Stage"
              style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', cursor: 'pointer' }}
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={handleStart}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
              }}
            >
              <Play size={20} /> Start Playground
            </button>
          </div>
        </div>

        {/* Main Grid: Left Stage (Large Visual Area), Right QR Code & Join Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* Virtual Stage Surface */}
          <div>
            <PlaygroundStage
              participants={playground.participants || []}
            />
          </div>

          {/* QR Code & Join Info Panel */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>Scan to Join Stage</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Point camera or enter short join code</p>
            </div>

            {/* QR Component */}
            <PlaygroundQR
              joinUrl={joinUrl}
              joinCode={playground.joinCode}
              size={180}
            />

            {/* Participants Counter Card */}
            <div style={{ width: '100%', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--color-deep-purple)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Joined Students</span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-deep-purple)' }}>
                {playground.participants ? playground.participants.length : 0}
              </span>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}

export default TeacherPlayground;
