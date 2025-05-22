
// src/components/NoteList.tsx
"use client";

import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteCard } from './NoteCard';
import { NotebookPen, SearchX, Inbox } from 'lucide-react';
import { Button } from './ui/button';

interface NoteListProps {
  onEditNote: (note: Note) => void;
}

export function NoteList({ onEditNote }: NoteListProps) {
  const { notes, searchTerm, setSearchTerm } = useNotes();

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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 md:p-12 bg-card border border-border/60 rounded-xl shadow-sm">
        <Inbox className="h-20 w-20 text-primary/70 mb-6 opacity-80" strokeWidth={1.2}/>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">Your NoteSphere is Empty</h2>
        <p className="text-muted-foreground max-w-sm text-sm md:text-base mb-6">
          Ready to capture your thoughts? Click "Add Note" to create your first note and organize your ideas.
        </p>
        {/* The button to add a new note is in the header, this is just a suggestion. 
            If direct action here is desired, onEditNote needs to be adapted or a new prop passed.
        <Button onClick={() => onEditNote(/* This needs a way to trigger new note mode *)} size="lg">
          <NotebookPen className="mr-2 h-5 w-5" />
          Create Your First Note
        </Button> 
        */}
      </div>
    );
  }
  
  if (filteredNotes.length === 0 && searchTerm) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 md:p-12 bg-card border border-border/60 rounded-xl shadow-sm">
        <SearchX className="h-20 w-20 text-destructive/80 mb-6 opacity-80" strokeWidth={1.2} />
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">No Notes Found</h2>
        <p className="text-muted-foreground max-w-xs text-sm md:text-base mb-6">
          No notes matched your search for "{searchTerm}". Try a different term or clear your search.
        </p>
        <Button variant="outline" onClick={() => setSearchTerm('')}>
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4"> {/* Increased spacing between cards */}
      {filteredNotes.map(note => (
          <NoteCard key={note.id} note={note} onEdit={() => onEditNote(note)} searchTerm={searchTerm.trim()} />
      ))}
    </div>
  );
}
