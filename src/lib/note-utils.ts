
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

function escapeCsvField(field: unknown): string {
  // Ensure field is a string before processing
  let stringField = String(field ?? ''); 
  // Normalize newlines to \n before quoting for consistency
  stringField = stringField.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
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
      escapeCsvField(note.isPinned), // Booleans will be converted to "true" or "false" strings
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

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

// Parses a single row of CSV. This parser is simple and has limitations,
// especially with newlines within unquoted fields or complex quote escaping.
export function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;

  if (row === null || row === undefined) {
    return []; // Handle null or undefined rows
  }

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        // Escaped double quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField); // Add the last field
  return result;
}


export function highlightTextInMarkdown(text: string, highlight?: string): string {
  if (!highlight || !text || highlight.trim() === '') {
    return text;
  }
  const searchTerm = highlight.trim();
  if (searchTerm === '') return text;

  const escapedHighlight = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  
  // Ensure text is a string before replacing
  return String(text).replace(regex, `<mark class="bg-yellow-300 text-black p-0.5 rounded-sm">$1</mark>`);
}
