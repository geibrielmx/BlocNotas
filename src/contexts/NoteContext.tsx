
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
    if (!csvString || csvString.trim() === '') {
      toast({ title: "Importación Vacía", description: "El archivo seleccionado está vacío o no contiene texto.", variant: "default" });
      return;
    }

    try {
      const lines = csvString.trim().split(/\r?\n/);
      
      if (lines.length === 0) {
        toast({ title: "Archivo Vacío", description: "El archivo no contiene líneas de datos.", variant: "default" });
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
        toast({ 
          title: "Error de Formato en Cabeceras", 
          description: `Las cabeceras del archivo no coinciden. Esperadas: "${expectedHeaders.join(',')}". Encontradas: "${parsedHeader.join(',')}". Asegúrate de que la primera línea contenga las cabeceras correctas, que el archivo use comas como delimitadores y que no haya saltos de línea inesperados antes de las cabeceras.`, 
          variant: "destructive",
          duration: 12000 
        });
        return;
      }
      
      if (lines.length < 2) {
        toast({ title: "Sin Datos para Importar", description: "El archivo solo contiene cabeceras. No hay notas para importar.", variant: "default" });
        return;
      }

      const dataRows = lines.slice(1);
      let importedCount = 0;
      let updatedCount = 0;
      let skippedRowCount = 0;
      const notesFromImportProcessing: Note[] = []; 
  
      for (let i = 0; i < dataRows.length; i++) {
        const rowString = dataRows[i];
        if (rowString.trim() === '') continue; 

        const fields = parseCsvRow(rowString);
  
        if (fields.length !== expectedHeaders.length) {
          console.warn(`Fila ${i + 2}: Se omitió fila por número incorrecto de campos. Esperados: ${expectedHeaders.length}, Encontrados: ${fields.length}. Contenido: "${rowString}"`);
          toast({ 
            title: "Advertencia de Importación", 
            description: `Se omitió la fila ${i + 2} del archivo. Esto puede ocurrir si el formato es incorrecto o si una nota contiene saltos de línea internos en sus campos, lo cual no es soportado por este importador simple.`, 
            variant: "default",
            duration: 9000
          });
          skippedRowCount++;
          continue;
        }
        
        const [id, title, objective, notesArea, createdAt, isPinnedStr] = fields.map(f => f.trim());
        
        const importedNote: Note = {
          id: id,
          title: title,
          objective: objective,
          notesArea: notesArea,
          createdAt: createdAt,
          isPinned: isPinnedStr.toLowerCase() === 'true',
        };
  
        if (isNaN(new Date(importedNote.createdAt).getTime())) {
          console.warn(`Fila ${i + 2}: Se omitió nota con fecha inválida: "${importedNote.createdAt}". Título: "${importedNote.title}"`);
          toast({ 
            title: "Advertencia de Importación", 
            description: `Se omitió la nota "${importedNote.title || importedNote.id}" (fila ${i + 2}) debido a una fecha de creación inválida.`, 
            variant: "default",
            duration: 7000
          });
          skippedRowCount++;
          continue;
        }
        notesFromImportProcessing.push(importedNote);
      }

      if (notesFromImportProcessing.length === 0 && skippedRowCount > 0) {
        toast({ title: "Importación Fallida", description: `No se pudieron importar notas válidas. Se omitieron ${skippedRowCount} filas debido a errores de formato. Revisa el archivo CSV, especialmente por saltos de línea dentro de los campos de texto.`, variant: "destructive", duration: 12000 });
        return;
      }
      if (notesFromImportProcessing.length === 0 && skippedRowCount === 0 && dataRows.length > 0) {
        toast({ title: "Sin Notas Válidas", description: "No se encontraron notas válidas para importar en el archivo después de las cabeceras.", variant: "default" });
        return;
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
  
      let summaryMessage = `${importedCount} notas importadas, ${updatedCount} notas actualizadas.`;
      if (skippedRowCount > 0) {
        summaryMessage += ` ${skippedRowCount} filas fueron omitidas (posiblemente por saltos de línea internos en campos de texto o formato incorrecto).`;
      }
      toast({ title: "Importación Completada", description: summaryMessage, duration: 9000 });
  
    } catch (error) {
      console.error("Error al importar notas:", error);
      toast({ title: "Error Crítico de Importación", description: "Ocurrió un error inesperado al procesar el archivo. Revisa la consola para más detalles.", variant: "destructive" });
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

