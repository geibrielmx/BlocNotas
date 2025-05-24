
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
  importNotes: (csvString: string) => void;
  clearAllNotes: () => void;
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
    toast({ title: "Nota Creada", description: `La nota "${newNote.title}" se ha creado correctamente.` });
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
    toast({ title: "Nota Actualizada", description: `La nota "${updatedNote.title}" se ha actualizado correctamente.` });
  }, [setNotes, toast]);

  const deleteNote = useCallback((id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (selectedNoteIdForAI === id) {
        setSelectedNoteIdForAI(null);
    }
    if (noteToDelete) {
     toast({ title: "Nota Eliminada", description: `La nota "${noteToDelete.title}" ha sido eliminada.`, variant: "destructive" });
    }
  }, [notes, setNotes, toast, selectedNoteIdForAI, setSelectedNoteIdForAI]);

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
      toast({ title: noteToToggle.isPinned ? "Nota Desfijada" : "Nota Fijada", description: `La nota "${noteToToggle.title}" ha sido ${noteToToggle.isPinned ? "desfijada" : "fijada"}.` });
    }
  }, [notes, setNotes, toast]);

  const getNoteById = useCallback((id: string) => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const importNotes = useCallback((csvString: string) => {
    try {
      const lines = csvString.trim().split(/\r?\n/); 
      if (lines.length < 1) { 
        toast({ title: "Información de Importación", description: "El archivo está vacío o no contiene datos.", variant: "default" });
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
        toast({ title: "Error de Importación", description: `Formato de archivo inválido. Cabeceras esperadas: ${expectedHeaders.join(', ')}. Encontradas: ${parsedHeader.join(', ')}. Asegúrate de que la primera línea contenga las cabeceras correctas.`, variant: "destructive" });
        return;
      }
      
      if (lines.length < 2) {
        toast({ title: "Información de Importación", description: "El archivo solo contiene cabeceras. No hay datos para importar.", variant: "default" });
        return;
      }

      const dataRows = lines.slice(1);
      let importedCount = 0;
      let updatedCount = 0;
      const notesFromImportProcessing: Note[] = []; 
  
      for (const row of dataRows) {
        if (row.trim() === '') continue;
        const fields = parseCsvRow(row);
  
        if (fields.length !== expectedHeaders.length) {
          console.warn("Omitiendo fila malformada:", row);
          toast({ title: "Advertencia de Importación", description: "Se omitió una fila con formato incorrecto en el CSV.", variant: "default" });
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
          console.warn(`Omitiendo fila con fecha inválida: ${importedNote.createdAt}`, importedNote);
          toast({ title: "Advertencia de Importación", description: `Se omitió la nota "${importedNote.title || importedNote.id}" debido a una fecha de creación inválida.`, variant: "default" });
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
  
      toast({ title: "Importación Completa", description: `${importedCount} notas importadas, ${updatedCount} notas actualizadas.` });
  
    } catch (error) {
      console.error("Error al importar notas:", error);
      toast({ title: "Importación Fallida", description: "Ocurrió un error al importar las notas. Revisa la consola para más detalles.", variant: "destructive" });
    }
  }, [setNotes, toast]); 

  const clearAllNotes = useCallback(() => {
    setNotes([]);
    setSelectedNoteIdForAI(null);
    toast({
      title: "Todas las Notas Eliminadas",
      description: "Tu Bloc de Notas ahora está vacío.",
      variant: "destructive", 
    });
  }, [setNotes, toast, setSelectedNoteIdForAI]);

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
        clearAllNotes,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes debe usarse dentro de un NoteProvider');
  }
  return context;
}
