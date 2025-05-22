
// src/components/NoteList.tsx
"use client";

import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteCard } from './NoteCard';
import { NotebookPen, SearchX } from 'lucide-react';

interface NoteListProps {
  onEditNote: (note: Note) => void;
}

export function NoteList({ onEditNote }: NoteListProps) {
  const { notes, searchTerm } = useNotes();

  const filteredNotes = notes
    .filter(note => {
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();
      if (!trimmedSearchTerm) {
        return true; 
      }
      return (
        note.id.toLowerCase().includes(trimmedSearchTerm) ||
        note.title.toLowerCase().includes(trimmedSearchTerm) ||
        note.objective.toLowerCase().includes(trimmedSearchTerm) ||
        note.notesArea.toLowerCase().includes(trimmedSearchTerm)
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-card border border-border/70 rounded-lg shadow-sm">
        <NotebookPen className="h-16 w-16 text-primary mb-6" strokeWidth={1.5}/>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Your NoteSphere is Empty</h2>
        <p className="text-muted-foreground max-w-xs">Click "Add New Note" to get started and capture your brilliant ideas and thoughts!</p>
      </div>
    );
  }
  
  if (filteredNotes.length === 0 && searchTerm) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-card border border-border/70 rounded-lg shadow-sm">
        <SearchX className="h-16 w-16 text-destructive mb-6" strokeWidth={1.5} />
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Notes Found</h2>
        <p className="text-muted-foreground">Try a different search term or clear your search to see all notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {filteredNotes.map(note => (
          <NoteCard key={note.id} note={note} onEdit={() => onEditNote(note)} searchTerm={searchTerm.trim()} />
      ))}
    </div>
  );
}
