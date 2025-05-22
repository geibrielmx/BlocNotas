"use client";

import type { Note } from '@/types';
import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateNoteId } from '@/lib/note-utils';
import { useToast } from "@/hooks/use-toast";

interface NoteContextType {
  notes: Note[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedNoteIdForAI: string | null;
  setSelectedNoteIdForAI: (id: string | null) => void;
  addNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'isPinned'>) => void;
  updateNote: (updatedNote: Note) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  isLoading: boolean; // Added for AI suggestions loading
  setIsLoading: (loading: boolean) => void; // Added for AI suggestions loading
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

const initialNotes: Note[] = [];

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useLocalStorage<Note[]>('notesphere-notes', initialNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteIdForAI, setSelectedNoteIdForAI] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addNote = useCallback((noteData: Omit<Note, 'id' | 'createdAt' | 'isPinned'>) => {
    const newNote: Note = {
      ...noteData,
      id: generateNoteId(notes),
      createdAt: new Date().toISOString(),
      isPinned: false,
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    toast({ title: "Note Created", description: `Note "${newNote.title}" has been successfully created.` });
  }, [notes, setNotes, toast]);

  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(prevNotes =>
      prevNotes.map(note => (note.id === updatedNote.id ? updatedNote : note))
    );
    toast({ title: "Note Updated", description: `Note "${updatedNote.title}" has been successfully updated.` });
  }, [setNotes, toast]);

  const deleteNote = useCallback((id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (noteToDelete) {
     toast({ title: "Note Deleted", description: `Note "${noteToDelete.title}" has been deleted.`, variant: "destructive" });
    }
  }, [notes, setNotes, toast]);

  const togglePinNote = useCallback((id: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, isPinned: !note.isPinned } : note
      )
    );
    const note = notes.find(n => n.id === id);
    if (note) {
      toast({ title: note.isPinned ? "Note Unpinned" : "Note Pinned", description: `Note "${note.title}" has been ${note.isPinned ? "unpinned" : "pinned"}.` });
    }
  }, [notes, setNotes, toast]);

  const getNoteById = useCallback((id: string) => {
    return notes.find(note => note.id === id);
  }, [notes]);

  return (
    <NoteContext.Provider
      value={{
        notes,
        searchTerm,
        setSearchTerm,
        selectedNoteIdForAI,
        setSelectedNoteIdForAI,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        getNoteById,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
