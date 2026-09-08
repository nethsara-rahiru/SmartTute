import { QRCodeSVG } from 'qrcode.react';

export function PlaygroundQR({ joinUrl, joinCode, size = 200 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          padding: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '2px solid #e2e8f0',
          display: 'inline-flex'
        }}
      >
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>

      {joinCode && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            JOIN CODE
          </div>
          <div
            style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              letterSpacing: '0.18em',
              color: 'var(--color-deep-purple, #8b5cf6)',
              fontFamily: 'monospace',
              marginTop: '2px'
            }}
          >
            {joinCode}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaygroundQR;
