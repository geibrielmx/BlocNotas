
// src/components/NoteList.tsx
"use client";

import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteCard } from './NoteCard';
import { NotebookPen, SearchX, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import React, { useEffect, useRef } from 'react';

interface NoteListProps {
  onEditNote: (note: Note) => void;
}

export function NoteList({ onEditNote }: NoteListProps) {
  const { notes, searchTerm, setSearchTerm } = useNotes();
  const firstMatchRef = useRef<HTMLDivElement>(null);

  const filteredNotes = notes
    .filter(note => {
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();
      if (!trimmedSearchTerm) {
        return true; 
      }
      // Orden de búsqueda: Area de Notas, luego Objetivo, luego Título, y finalmente ID.
      return (
        note.notesArea.toLowerCase().includes(trimmedSearchTerm) ||
        note.objective.toLowerCase().includes(trimmedSearchTerm) ||
        note.title.toLowerCase().includes(trimmedSearchTerm) ||
        note.id.toLowerCase().includes(trimmedSearchTerm)
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  useEffect(() => {
    if (searchTerm.trim() && filteredNotes.length > 0 && firstMatchRef.current) {
      // Timeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        firstMatchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [filteredNotes, searchTerm]);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 md:p-12 bg-card border border-border/60 rounded-xl shadow-sm">
        <Inbox className="h-20 w-20 text-primary/70 mb-6 opacity-80" strokeWidth={1.2}/>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">Tu Bloc de Notas está Vacío</h2>
        <p className="text-muted-foreground max-w-sm text-sm md:text-base mb-6">
          ¿Listo para capturar tus ideas? Haz clic en "Añadir Nota" para crear tu primera nota y organizar tus pensamientos.
        </p>
      </div>
    );
  }
  
  if (filteredNotes.length === 0 && searchTerm) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 md:p-12 bg-card border border-border/60 rounded-xl shadow-sm">
        <SearchX className="h-20 w-20 text-destructive/80 mb-6 opacity-80" strokeWidth={1.2} />
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">No se Encontraron Notas</h2>
        <p className="text-muted-foreground max-w-xs text-sm md:text-base mb-6">
          Ninguna nota coincide con tu búsqueda de "{searchTerm}". Intenta con un término diferente o limpia tu búsqueda.
        </p>
        <Button variant="outline" onClick={() => setSearchTerm('')}>
          Limpiar Búsqueda
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {filteredNotes.map((note, index) => (
          <NoteCard 
            key={note.id} 
            note={note} 
            onEdit={() => onEditNote(note)} 
            searchTerm={searchTerm.trim()}
            ref={index === 0 && searchTerm.trim() ? firstMatchRef : null}
        />
      ))}
    </div>
  );
}

