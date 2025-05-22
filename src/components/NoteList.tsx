// src/components/NoteList.tsx
"use client";

import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteCard } from './NoteCard';
import { AnimatePresence, motion } from 'framer-motion'; // For animations (optional, needs `npm install framer-motion`)
import { escapeRegExp } from '@/lib/note-utils';

interface NoteListProps {
  onEditNote: (note: Note) => void;
}

export function NoteList({ onEditNote }: NoteListProps) {
  const { notes, searchTerm } = useNotes();

  const filteredNotes = notes
    .filter(note => {
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();
      if (!trimmedSearchTerm) {
        return true; // Show all notes if search term is empty or only whitespace
      }

      // ID search: simple substring match (case-insensitive)
      if (note.id.toLowerCase().includes(trimmedSearchTerm)) {
        return true;
      }

      // Text fields search: whole word/phrase match (case-insensitive)
      // Escape the search term to handle special regex characters safely
      const escapedTerm = escapeRegExp(trimmedSearchTerm);
      // Create a regex to match the search term as a whole word or phrase.
      // \b denotes a word boundary. 'i' flag for case-insensitive search.
      const searchRegex = new RegExp(`\\b${escapedTerm}\\b`, 'i');

      return (
        searchRegex.test(note.title) || // Test against original case, regex is case-insensitive
        searchRegex.test(note.objective) ||
        searchRegex.test(note.notesArea)
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus-2 text-muted-foreground mb-4"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M3 15h6"/><path d="M6 12v6"/></svg>
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Notes Yet</h2>
        <p className="text-muted-foreground">Click "Add New Note" to get started and organize your thoughts!</p>
      </div>
    );
  }
  
  if (filteredNotes.length === 0 && searchTerm) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
         <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search-x text-muted-foreground mb-4"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Results Found</h2>
        <p className="text-muted-foreground">Try adjusting your search term or clearing the search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {/* Consider using AnimatePresence if framer-motion is added, for smoother add/remove animations */}
      {filteredNotes.map(note => (
        // <motion.div key={note.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <NoteCard key={note.id} note={note} onEdit={() => onEditNote(note)} searchTerm={searchTerm.trim()} />
        // </motion.div>
      ))}
    </div>
  );
}
