
import { type Note } from '@/types';
import { format } from 'date-fns';

export function generateNoteId(existingNotes: Note[]): string {
  const todayStr = format(new Date(), 'yyMMdd');
  const notesFromToday = existingNotes.filter(note => note.id.startsWith(todayStr) && note.id.length === 8 && /^\d+$/.test(note.id.substring(6)));

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

export function convertNotesToJson(notes: Note[]): string {
  return JSON.stringify(notes, null, 2); // Pretty print JSON
}

export function downloadTextFile(filename: string, content: string, mimeType: string = 'text/plain'): void {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

export function highlightTextInMarkdown(text: string, highlight?: string): string {
  if (!highlight || !text || highlight.trim() === '') {
    return text;
  }
  const searchTerm = highlight.trim();
  if (searchTerm === '') return text;

  const escapedHighlight = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  
  return String(text).replace(regex, `<mark class="bg-yellow-300 text-black p-0.5 rounded-sm">$1</mark>`);
}
