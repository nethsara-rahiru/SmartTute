import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell.jsx';
import { WelcomeSection } from '../components/dashboard/WelcomeSection.jsx';
import { CharacterCard } from '../components/dashboard/CharacterCard.jsx';
import { QuickStats } from '../components/dashboard/QuickStats.jsx';
import { AvatarEditor } from '../components/avatar/AvatarEditor.jsx';
import { getStudent, updateStudent } from '../services/storage.js';

export function Dashboard() {
  const [student, setStudent] = useState(() => getStudent());
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleSaveAvatar = (newAvatar) => {
    const updated = updateStudent({ avatar: newAvatar });
    setStudent(updated);
    setIsEditorOpen(false);
  };

  return (
    <AppShell student={student} onOpenAvatarEditor={() => setIsEditorOpen(true)}>
      <WelcomeSection student={student} />
      <CharacterCard student={student} onOpenEditor={() => setIsEditorOpen(true)} />
      <QuickStats stats={student.stats} />

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
