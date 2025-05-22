
// src/components/NoteCard.tsx
"use client";

import type { Note } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Edit3, Trash2, Sparkles } from 'lucide-react';
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
import { useState } from 'react';
import { escapeRegExp } from '@/lib/note-utils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  searchTerm?: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text || highlight.trim() === '') {
    return <>{text}</>;
  }
  const escapedHighlight = escapeRegExp(highlight);
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-accent text-accent-foreground p-0.5 rounded">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}


export function NoteCard({ note, onEdit, searchTerm }: NoteCardProps) {
  const { deleteNote, togglePinNote, setSelectedNoteIdForAI } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
  const displaySearchTerm = searchTerm?.trim();

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out bg-card text-card-foreground rounded-xl border border-border/70">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold mb-1.5 leading-tight">
              <HighlightedText text={note.title} highlight={displaySearchTerm} />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              ID: {note.id} &bull; Created {formattedDate}
            </CardDescription>
          </div>
          {note.isPinned && <Pin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <div>
          <h4 className="text-sm font-medium text-primary/90 mb-1">Objective:</h4>
          <p className="text-sm leading-relaxed text-foreground/90">
            <HighlightedText text={note.objective} highlight={displaySearchTerm} />
          </p>
        </div>
        <div className="border-t border-border/50 pt-3">
          <h4 className="text-sm font-medium text-primary/90 mb-1">Notes:</h4>
          <p className={`text-sm leading-relaxed text-foreground/90 ${!isExpanded && 'line-clamp-4'}`}>
            <HighlightedText text={note.notesArea} highlight={displaySearchTerm} />
          </p>
          {note.notesArea.length > 200 && ( 
             <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto text-primary mt-1">
             {isExpanded ? 'Show less' : 'Show more'}
           </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-4 border-t border-border/50 bg-muted/30 rounded-b-xl px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePinNote(note.id)}
          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
          className="hover:bg-primary/10"
        >
          {note.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(note)}
          aria-label="Edit note"
          title="Edit note"
          className="hover:bg-accent"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
         <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNoteIdForAI(note.id)}
          aria-label="Suggest related notes"
          title="Suggest related notes"
          className="hover:bg-accent"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Delete note" title="Delete note" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border border-border shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note titled "{note.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteNote(note.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
