import { AvatarPreview } from '../avatar/AvatarPreview.jsx';
import { Edit3, Sparkles } from 'lucide-react';
import { AVATAR_CATALOG } from '../../data/defaultStudent.js';

export function CharacterCard({ student, onOpenEditor }) {
  const avatarConfig = student?.avatar || {};
  const presetInfo = AVATAR_CATALOG.presets.find(p => p.id === avatarConfig.preset);
  const characterTitle = presetInfo ? presetInfo.name : 'Custom Character';

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '1.75rem',
        marginBottom: '1.75rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
        flexWrap: 'wrap'
      }}
    >
      {/* Avatar Visual Area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          margin: '0 auto'
        }}
      >
        <AvatarPreview avatar={avatarConfig} size={190} />
      </div>

      {/* Character Details Area */}
      <div
        style={{
          flex: 1,
          minWidth: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(167, 139, 250, 0.15)',
            color: 'var(--color-deep-purple)',
            fontSize: '0.8rem',
            fontWeight: 700
          }}
        >
          <Sparkles size={14} /> Your Character
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {characterTitle}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Personalized avatar for live math sessions
          </p>
        </div>

        <button
          onClick={onOpenEditor}
          style={{
            marginTop: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-deep-purple)',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease, background-color 0.15s ease'
          }}
        >
          <Edit3 size={18} />
          Edit Avatar
        </button>
      </div>
    </div>
  );
}
