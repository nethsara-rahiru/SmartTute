import { useState } from 'react';
import { Menu, Bell, User, X } from 'lucide-react';
import { branding } from '../../config/branding.js';
import { AvatarPreview } from '../avatar/AvatarPreview.jsx';

export function Header({ student, onToggleMenu, onOpenAvatarEditor }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div
        className="container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left Side: Mobile Menu Button & App Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onToggleMenu}
            aria-label="Toggle navigation menu"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--color-deep-blue) 0%, var(--color-deep-purple) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}
            >
              S
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {branding.appName}
            </span>
          </div>
        </div>

        {/* Right Side: Notification Bell & Avatar Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          {/* Notification Button */}
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            aria-label="View notifications"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-muted)',
              backgroundColor: showNotifications ? '#F1F5F9' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Bell size={22} />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                padding: '1rem',
                zIndex: 200,
                backgroundColor: '#FFFFFF',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ padding: '0.2rem', color: 'var(--color-text-muted)' }}
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '1rem 0.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                🔔 No new notifications right now.
              </div>
            </div>
          )}

          {/* Student Avatar Shortcut */}
          <button
            onClick={onOpenAvatarEditor}
            aria-label="Edit student avatar"
            style={{
              padding: '2px',
              borderRadius: '50%',
              border: '2px solid var(--color-deep-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease'
            }}
          >
            {student?.avatar ? (
              <AvatarPreview avatar={student.avatar} size={36} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="var(--color-text-muted)" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
