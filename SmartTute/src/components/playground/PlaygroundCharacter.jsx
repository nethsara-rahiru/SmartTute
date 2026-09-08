import { AvatarPreview } from '../avatar/AvatarPreview.jsx';

export function PlaygroundCharacter({ participant, isCurrentStudent = false, onClick }) {
  const { name, avatar = {}, position = { x: 50, y: 50 }, animation = 'idle' } = participant;

  return (
    <div
      onClick={onClick}
      className={`playground-character animation-${animation}`}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -85%)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: Math.floor(position.y),
        transition: 'left 0.4s ease, top 0.4s ease',
        userSelect: 'none'
      }}
    >
      {/* Name Label */}
      <div
        style={{
          backgroundColor: isCurrentStudent ? 'var(--color-deep-purple, #8b5cf6)' : 'rgba(15, 23, 42, 0.82)',
          color: '#FFFFFF',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          marginBottom: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: isCurrentStudent ? '2px solid #FFFFFF' : 'none'
        }}
      >
        {isCurrentStudent && <span>⭐</span>}
        <span>{name || 'Student'}</span>
      </div>

      {/* Avatar Renderer */}
      <div style={{ position: 'relative' }}>
        <AvatarPreview avatar={avatar} size={110} />
      </div>
    </div>
  );
}

export default PlaygroundCharacter;
