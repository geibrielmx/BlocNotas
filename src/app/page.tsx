import { NoteProvider } from '@/contexts/NoteContext';
import { NoteSphereApp } from '@/components/NoteSphereApp';

export default function HomePage() {
  return (
    <NoteProvider>
      <NoteSphereApp />
    </NoteProvider>
  );
}
