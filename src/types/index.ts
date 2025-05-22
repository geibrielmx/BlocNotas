export interface Note {
  id: string;
  title: string;
  objective: string;
  notesArea: string;
  createdAt: string; // ISO string date
  isPinned: boolean;
}
