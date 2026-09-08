
export function WelcomeSection({ student }) {
  const displayName = student?.nickname?.trim() || student?.name?.trim() || 'Student';

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h1
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
          fontWeight: 800,
          color: 'var(--color-text)',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}
      >
        Hi, {displayName}! 👋
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.35rem' }}>
        Ready to learn something new today?
      </p>
    </div>
  );
}
