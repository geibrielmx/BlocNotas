
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
  deleteMultipleNotes: (ids: string[]) => void;
  togglePinNote: (id: string) => void;
  togglePinMultipleNotes: (ids: string[], pin: boolean) => void;
  getNoteById: (id: string) => Note | undefined;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  importNotes: (jsonString: string) => void;
  clearAllNotes: () => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

const initialNotes: Note[] = [];

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useLocalStorage<Note[]>('notesphere-notes-json', initialNotes); // Changed key for JSON storage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteIdForAI, setSelectedNoteIdForAI] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sortNotes = (notesToSort: Note[]): Note[] => {
    return notesToSort.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const addNote = useCallback((noteData: Omit<Note, 'id' | 'createdAt' | 'isPinned' | 'images'> & { images?: string[] }) => {
    const newNote: Note = {
      ...noteData,
      id: generateNoteId(notes),
      createdAt: new Date().toISOString(),
      isPinned: false,
      images: noteData.images || [],
    };
    setNotes(prevNotes => sortNotes([newNote, ...prevNotes]));
    toast({ title: "Nota Creada", description: `La nota "${newNote.title}" se ha creado correctamente.` });
  }, [notes, setNotes, toast]);

  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(prevNotes =>
      sortNotes(prevNotes.map(note => (note.id === updatedNote.id ? updatedNote : note)))
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

  const deleteMultipleNotes = useCallback((ids: string[]) => {
    setNotes(prevNotes => prevNotes.filter(note => !ids.includes(note.id)));
    if (ids.includes(selectedNoteIdForAI || "")) {
        setSelectedNoteIdForAI(null);
    }
    toast({ title: `${ids.length} Notas Eliminadas`, description: `Se han eliminado ${ids.length} notas.`, variant: "destructive" });
  }, [setNotes, toast, selectedNoteIdForAI, setSelectedNoteIdForAI]);


  const togglePinNote = useCallback((id: string) => {
    const noteToToggle = notes.find(n => n.id === id);
    setNotes(prevNotes =>
      sortNotes(
        prevNotes.map(note =>
          note.id === id ? { ...note, isPinned: !note.isPinned } : note
        )
      )
    );
    if (noteToToggle) {
      toast({ title: noteToToggle.isPinned ? "Nota Desfijada" : "Nota Fijada", description: `La nota "${noteToToggle.title}" ha sido ${noteToToggle.isPinned ? "desfijada" : "fijada"}.` });
    }
  }, [notes, setNotes, toast]);

  const togglePinMultipleNotes = useCallback((ids: string[], pin: boolean) => {
    setNotes(prevNotes =>
      sortNotes(
        prevNotes.map(note =>
          ids.includes(note.id) ? { ...note, isPinned: pin } : note
        )
      )
    );
    toast({ title: `Notas ${pin ? "Fijadas" : "Desfijadas"}`, description: `${ids.length} notas han sido ${pin ? "fijadas" : "desfijadas"}.` });
  }, [setNotes, toast]);

  const getNoteById = useCallback((id: string) => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const importNotes = useCallback((jsonString: string) => {
    if (!jsonString.trim()) {
      toast({ title: "Importación Vacía", description: "El archivo seleccionado está vacío o no contiene texto JSON.", variant: "default" });
      return;
    }

    try {
      const parsedNotes = JSON.parse(jsonString);

      if (!Array.isArray(parsedNotes)) {
        toast({ title: "Error de Formato", description: "El archivo no contiene un array de notas JSON válido.", variant: "destructive" });
        return;
      }

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const notesFromImportProcessing: Note[] = [];

      for (const importedObj of parsedNotes) {
        // Basic validation for a Note object
        if (
          typeof importedObj.id === 'string' &&
          typeof importedObj.title === 'string' &&
          typeof importedObj.objective === 'string' &&
          typeof importedObj.notesArea === 'string' &&
          typeof importedObj.createdAt === 'string' &&
          typeof importedObj.isPinned === 'boolean' &&
          (importedObj.images === undefined || (Array.isArray(importedObj.images) && importedObj.images.every((img: any) => typeof img === 'string'))) && // Validate images array
          !isNaN(new Date(importedObj.createdAt).getTime())
        ) {
          const noteToAdd: Note = {
            id: importedObj.id,
            title: importedObj.title,
            objective: importedObj.objective,
            notesArea: importedObj.notesArea,
            createdAt: importedObj.createdAt,
            isPinned: importedObj.isPinned,
            images: importedObj.images || [], // Ensure images is an array
          };
          notesFromImportProcessing.push(noteToAdd);
        } else {
          skippedCount++;
          console.warn("Objeto omitido durante la importación JSON por formato inválido o fecha incorrecta:", importedObj);
        }
      }

      if (notesFromImportProcessing.length === 0 && skippedCount > 0) {
        toast({ title: "Importación Fallida", description: `No se pudieron importar notas válidas. Se omitieron ${skippedCount} objetos debido a errores de formato. Revisa el archivo JSON y la consola.`, variant: "destructive", duration: 12000 });
        return;
      }
      if (notesFromImportProcessing.length === 0 && parsedNotes.length > 0) { // Check if parsedNotes had items
        toast({ title: "Sin Notas Válidas", description: "No se encontraron notas válidas para importar en el archivo JSON.", variant: "default" });
        return;
      }
      
      setNotes(prevNotes => {
        const currentNotesMap = new Map(prevNotes.map(note => [note.id, note]));
        notesFromImportProcessing.forEach(importedNote => {
          if (currentNotesMap.has(importedNote.id)) {
            updatedCount++;
          } else {
            importedCount++;
          }
          currentNotesMap.set(importedNote.id, importedNote);
        });
        return sortNotes(Array.from(currentNotesMap.values()));
      });

      let summaryMessage = `${importedCount} notas importadas, ${updatedCount} notas actualizadas.`;
      if (skippedCount > 0) {
        summaryMessage += ` ${skippedCount} objetos fueron omitidos por formato inválido.`;
      }
      toast({ title: "Importación Completada", description: summaryMessage, duration: 10000 });

    } catch (error) {
      console.error("Error crítico durante la importación de notas JSON:", error);
      toast({ title: "Error Crítico de Importación", description: "Ocurrió un error al procesar el archivo JSON. Asegúrate de que el formato sea correcto.", variant: "destructive", duration: 10000 });
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
        deleteMultipleNotes,
        togglePinNote,
        togglePinMultipleNotes,
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
