import { useState } from 'react';
import { Header } from './Header.jsx';
import { MenuDrawer } from './MenuDrawer.jsx';

export function AppShell({ student, children, onOpenAvatarEditor }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        student={student}
        onToggleMenu={() => setIsMenuOpen(prev => !prev)}
        onOpenAvatarEditor={onOpenAvatarEditor}
      />

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenAvatarEditor={onOpenAvatarEditor}
      />

      <main style={{ flex: 1, padding: '1.5rem 0 3rem' }}>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}
