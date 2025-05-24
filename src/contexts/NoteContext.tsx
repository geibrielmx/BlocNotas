
"use client";

import type { Note } from '@/types';
import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateNoteId, parseCsvRow } from '@/lib/note-utils';
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
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  importNotes: (csvString: string) => void; // Added for import
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
    setNotes(prevNotes => [newNote, ...prevNotes].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
    toast({ title: "Note Created", description: `Note "${newNote.title}" has been successfully created.` });
  }, [notes, setNotes, toast]);

  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(prevNotes =>
      prevNotes.map(note => (note.id === updatedNote.id ? updatedNote : note))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
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
    const noteToToggle = notes.find(n => n.id === id);
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, isPinned: !note.isPinned } : note
      )
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );
    if (noteToToggle) {
      toast({ title: noteToToggle.isPinned ? "Note Unpinned" : "Note Pinned", description: `Note "${noteToToggle.title}" has been ${noteToToggle.isPinned ? "unpinned" : "pinned"}.` });
    }
  }, [notes, setNotes, toast]);

  const getNoteById = useCallback((id: string) => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const importNotes = useCallback((csvString: string) => {
    try {
      const lines = csvString.trim().split(/\r?\n/); // Handles both \n and \r\n
      if (lines.length < 1) { // Allow empty file or file with only header
        toast({ title: "Import Info", description: "File is empty or contains no data.", variant: "default" });
        return;
      }
  
      const expectedHeaders = ['ID', 'Title', 'Objective', 'NotesArea', 'CreatedAt', 'IsPinned'];
      const parsedHeader = parseCsvRow(lines[0]);
  
      let headerMismatch = parsedHeader.length !== expectedHeaders.length;
      if (!headerMismatch) {
        for (let i = 0; i < expectedHeaders.length; i++) {
          if (parsedHeader[i].trim() !== expectedHeaders[i]) {
            headerMismatch = true;
            break;
          }
        }
      }
  
      if (headerMismatch) {
        toast({ title: "Import Error", description: `Invalid file format. Expected headers: ${expectedHeaders.join(', ')}. Found: ${parsedHeader.join(', ')}. Please ensure the first line contains the correct headers.`, variant: "destructive" });
        return;
      }
      
      if (lines.length < 2) {
        toast({ title: "Import Info", description: "File contains only headers. No data to import.", variant: "default" });
        return;
      }

      const dataRows = lines.slice(1);
      let importedCount = 0;
      let updatedCount = 0;
      const notesFromImportProcessing: Note[] = []; // Store all processed notes from CSV
  
      for (const row of dataRows) {
        if (row.trim() === '') continue;
        const fields = parseCsvRow(row);
  
        if (fields.length !== expectedHeaders.length) {
          console.warn("Skipping malformed row:", row);
          toast({ title: "Import Warning", description: "Skipped a malformed row in the CSV.", variant: "default" });
          continue;
        }
        
        const [id, title, objective, notesArea, createdAt, isPinnedStr] = fields;
        
        const importedNote: Note = {
          id: id.trim(),
          title: title.trim(),
          objective: objective.trim(),
          notesArea: notesArea.trim(),
          createdAt: createdAt.trim(),
          isPinned: isPinnedStr.trim().toLowerCase() === 'true',
        };
  
        if (isNaN(new Date(importedNote.createdAt).getTime())) {
          console.warn(`Skipping row with invalid date: ${importedNote.createdAt}`, importedNote);
          toast({ title: "Import Warning", description: `Skipped note "${importedNote.title || importedNote.id}" due to invalid creation date.`, variant: "default" });
          continue;
        }
        notesFromImportProcessing.push(importedNote);
      }

      setNotes(prevNotes => {
        let currentNotesMap = new Map(prevNotes.map(note => [note.id, note]));

        notesFromImportProcessing.forEach(importedNote => {
            if (currentNotesMap.has(importedNote.id)) {
                updatedCount++;
            } else {
                importedCount++;
            }
            currentNotesMap.set(importedNote.id, importedNote);
        });
        
        return Array.from(currentNotesMap.values()).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
  
      toast({ title: "Import Complete", description: `${importedCount} notes imported, ${updatedCount} notes updated.` });
  
    } catch (error) {
      console.error("Error importing notes:", error);
      toast({ title: "Import Failed", description: "An error occurred while importing notes. Check console for details.", variant: "destructive" });
    }
  }, [setNotes, toast]); // Removed 'notes' from dependencies to use the freshest state from setNotes callback

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
        importNotes,
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
