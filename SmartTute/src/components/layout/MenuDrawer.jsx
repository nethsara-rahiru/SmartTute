import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Gamepad2, RotateCcw, X, User } from 'lucide-react';
import { branding } from '../../config/branding.js';

import { clearStudent } from '../../services/storage.js';

export function MenuDrawer({ isOpen, onClose, onOpenAvatarEditor }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDevReset = () => {
    if (window.confirm('Reset all student data and return to setup?')) {
      clearStudent();
      onClose();
      navigate('/setup');
    }
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const isTutesActive = location.pathname.startsWith('/tutes');
  const isPlaygroundsActive = location.pathname.startsWith('/playgrounds');

  return (

    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation drawer"
    >
      {/* Semi-transparent backdrop overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={onClose}
      />

      {/* Sliding Navigation Panel */}
      <aside
        style={{
          position: 'relative',
          width: '280px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '1.5rem 1rem'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)' }}>
              {branding.appName}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{ padding: '0.4rem', color: 'var(--color-text-muted)', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button
            onClick={() => {
              navigate('/dashboard');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isDashboardActive ? 'rgba(125, 211, 252, 0.15)' : 'transparent',
              color: isDashboardActive ? 'var(--color-deep-blue)' : 'var(--color-text)',
              fontWeight: isDashboardActive ? 700 : 500,
              fontSize: '0.95rem',
              textAlign: 'left'
            }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button
            onClick={() => {
              navigate('/tutes');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isTutesActive ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
              color: isTutesActive ? 'var(--color-deep-purple)' : 'var(--color-text)',
              fontWeight: isTutesActive ? 700 : 500,
              fontSize: '0.95rem',
              textAlign: 'left'
            }}
          >
            <BookOpen size={20} />
            Tutes
          </button>

          <button
            onClick={() => {
              navigate('/playgrounds');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isPlaygroundsActive ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              color: isPlaygroundsActive ? '#ec4899' : 'var(--color-text)',
              fontWeight: isPlaygroundsActive ? 700 : 500,
              fontSize: '0.95rem',
              textAlign: 'left'
            }}
          >
            <Gamepad2 size={20} />
            Playgrounds
          </button>


          <button
            onClick={() => {
              onClose();
              onOpenAvatarEditor();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              fontWeight: 500,
              fontSize: '0.95rem',
              textAlign: 'left'
            }}
          >
            <User size={20} color="var(--color-text-muted)" />
            Edit Avatar
          </button>
        </nav>

        {/* Developer Reset Section */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Development Control
          </div>
          <button
            onClick={handleDevReset}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <RotateCcw size={16} />
            Reset Student Data (Dev)
          </button>
        </div>
      </aside>
    </div>
  );
}
