
// src/components/NoteCard.tsx
"use client";

import type { Note } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Edit3, Trash2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { useNotes } from '@/contexts/NoteContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from 'date-fns';
import React, { useState, forwardRef } from 'react';
import { escapeRegExp } from '@/lib/note-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  searchTerm?: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text || highlight.trim() === '') {
    return <>{text}</>;
  }
  const escapedHighlight = escapeRegExp(highlight.trim());
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.trim().toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-black p-0.5 rounded-sm">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const NoteCard = forwardRef<HTMLDivElement, NoteCardProps>(({ note, onEdit, searchTerm }, ref) => {
  const { deleteNote, togglePinNote, setSelectedNoteIdForAI } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
  const displaySearchTerm = searchTerm?.trim();
  const notesPreviewLength = 180; 

  return (
    <Card ref={ref} className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out bg-card text-card-foreground rounded-lg border border-border/80 overflow-hidden flex flex-col">
      <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-1 leading-tight truncate" title={note.title}>
              <HighlightedText text={note.title} highlight={displaySearchTerm} />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Creado {formattedDate} <span className="mx-1">&bull;</span> ID: {note.id}
            </CardDescription>
          </div>
          {note.isPinned && <Pin className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3.5 py-4 px-5 flex-1">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Objetivo:</h4>
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
            <HighlightedText text={note.objective} highlight={displaySearchTerm} />
          </p>
        </div>
        <div className="border-t border-border/50 pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas:</h4>
          <div className="text-sm leading-relaxed text-foreground/90 markdown-content">
            {isExpanded ? (
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.notesArea}
              </ReactMarkdown>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.notesArea.substring(0, notesPreviewLength) + (note.notesArea.length > notesPreviewLength ? '...' : '')}
                </ReactMarkdown>
              </>
            )}
          </div>
          {note.notesArea.length > notesPreviewLength && ( 
             <Button 
                variant="link" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-0 h-auto text-primary hover:text-primary/80 text-xs mt-1.5 flex items-center gap-1"
              >
             {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
             {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
           </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end items-center space-x-1.5 bg-secondary/30 border-t border-border/50 px-4 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePinNote(note.id)}
          aria-label={note.isPinned ? 'Desfijar nota' : 'Fijar nota'}
          title={note.isPinned ? 'Desfijar nota' : 'Fijar nota'}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-8 h-8"
        >
          {note.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(note)}
          aria-label="Editar nota"
          title="Editar nota"
          className="text-muted-foreground hover:text-accent-foreground hover:bg-accent/50 w-8 h-8"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
         <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNoteIdForAI(note.id)}
          aria-label="Ideas IA"
          title="Ideas IA"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-8 h-8"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Eliminar nota" title="Eliminar nota" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border border-border shadow-xl rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">¿Estás completamente seguro?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Esta acción no se puede deshacer. Se eliminará permanentemente la nota titulada:
                <strong className="block mt-1 font-medium text-foreground">"{note.title}"</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel className="px-4 py-2 text-sm">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteNote(note.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 text-sm">
                Sí, eliminar nota
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
});

NoteCard.displayName = 'NoteCard';

