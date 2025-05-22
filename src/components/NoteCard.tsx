// src/components/NoteCard.tsx
"use client";

import type { Note } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Edit3, Trash2, Sparkles, Maximize2 } from 'lucide-react';
import { useNotes } from '@/contexts/NoteContext';
import { Badge } from '@/components/ui/badge';
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
  // Escape the highlight term to be safely used in a RegExp
  const escapedHighlight = escapeRegExp(highlight);
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        // Ensure the comparison for highlighting is case-insensitive and matches the original logic
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
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out bg-card text-card-foreground rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold mb-1">
              <HighlightedText text={note.title} highlight={displaySearchTerm} />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              ID: {note.id} &bull; Created {formattedDate}
            </CardDescription>
          </div>
          {note.isPinned && <Pin className="h-5 w-5 text-primary" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Objective:</h4>
          <p className="text-sm leading-relaxed">
            <HighlightedText text={note.objective} highlight={displaySearchTerm} />
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes:</h4>
          <p className={`text-sm leading-relaxed ${!isExpanded && 'line-clamp-3'}`}>
            <HighlightedText text={note.notesArea} highlight={displaySearchTerm} />
          </p>
          {note.notesArea.length > 150 && ( // Arbitrary length to show expand button
             <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto text-primary">
             {isExpanded ? 'Show less' : 'Show more'}
           </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePinNote(note.id)}
          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(note)}
          aria-label="Edit note"
          title="Edit note"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
         <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNoteIdForAI(note.id)}
          aria-label="Suggest related notes"
          title="Suggest related notes"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Delete note" title="Delete note" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note titled "{note.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
