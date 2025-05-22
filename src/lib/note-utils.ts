import { type Note } from '@/types';
import { format } from 'date-fns';

export function generateNoteId(existingNotes: Note[]): string {
  const todayStr = format(new Date(), 'yyMMdd');
  const notesFromToday = existingNotes.filter(note => note.id.startsWith(todayStr));

  let maxSeq = 0;
  notesFromToday.forEach(note => {
    const seqPart = parseInt(note.id.substring(6), 10);
    if (seqPart > maxSeq) {
      maxSeq = seqPart;
    }
  });

  const newSeq = (maxSeq + 1).toString().padStart(2, '0');
  return `${todayStr}${newSeq}`;
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function convertNotesToCsv(notes: Note[]): string {
  const headers = ['ID', 'Title', 'Objective', 'NotesArea', 'CreatedAt', 'IsPinned'];
  const rows = notes.map(note =>
    [
      escapeCsvField(note.id),
      escapeCsvField(note.title),
      escapeCsvField(note.objective),
      escapeCsvField(note.notesArea),
      escapeCsvField(note.createdAt),
      escapeCsvField(String(note.isPinned)),
    ].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function downloadTextFile(filename: string, content: string): void {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
