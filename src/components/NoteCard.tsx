
// src/components/NoteCard.tsx
"use client";

import type { Note } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Edit3, Trash2, Maximize2, Minimize2, Image as ImageIcon, ZoomIn } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import React, { useState, forwardRef } from 'react';
import { escapeRegExp, highlightTextInMarkdown } from '@/lib/note-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import NextImage from 'next/image';
import { useToast } from "@/hooks/use-toast";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onFocusView: (note: Note) => void;
  searchTerm?: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text || highlight.trim() === '') {
    return <>{text || ''}</>;
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

export const NoteCard = forwardRef<HTMLDivElement, NoteCardProps>(({ note, onEdit, onFocusView, searchTerm }, ref) => {
  const { deleteNote, togglePinNote } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const formattedDate = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
  const displaySearchTerm = searchTerm?.trim();
  const notesPreviewLength = 180;

  const notesPreviewText = note.notesArea.substring(0, notesPreviewLength) + (note.notesArea.length > notesPreviewLength ? '...' : '');
  const highlightedPreview = highlightTextInMarkdown(notesPreviewText, displaySearchTerm);
  const highlightedFullNotes = highlightTextInMarkdown(note.notesArea, displaySearchTerm);

  const openImageInModal = (src: string) => {
    if (typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http'))) {
        setPreviewImageSrc(src);
        setIsPreviewModalOpen(true);
    } else {
        toast({
            title: "Error de Imagen",
            description: "La fuente de la imagen seleccionada no es válida para previsualizar.",
            variant: "destructive",
        });
    }
  };

  return (
    <>
      <Card ref={ref} className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out bg-card text-card-foreground rounded-lg border border-border/80 overflow-hidden flex flex-col">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-lg font-semibold mb-1 leading-tight truncate cursor-pointer hover:text-primary hover:underline"
                title={`Editar: ${note.title}`}
                onClick={() => onEdit(note)}
              >
                <HighlightedText text={note.title} highlight={displaySearchTerm} />
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Creado {formattedDate} <span className="mx-1">&bull;</span> ID: <HighlightedText text={note.id} highlight={displaySearchTerm} />
              </CardDescription>
            </div>
            {note.isPinned && <Pin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 py-4 px-5 flex-1">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Objetivo:</h4>
            <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
              <HighlightedText text={note.objective} highlight={displaySearchTerm} />
            </p>
          </div>

          {note.images && note.images.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> Imágenes Adjuntas:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {note.images.slice(0,6).map((src, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded border overflow-hidden group bg-muted/30 cursor-pointer"
                    onClick={() => openImageInModal(src)}
                    title="Haz clic para ver imagen completa"
                  >
                    {typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http')) ? (
                      <NextImage
                        src={src}
                        alt={`Imagen adjunta ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
                        style={{ objectFit: 'contain' }}
                        className="transition-transform duration-300 ease-in-out group-hover:scale-105 transform-gpu"
                        data-ai-hint="illustration abstract"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No válida</div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white/80" />
                    </div>
                  </div>
                ))}
              </div>
              {note.images.length > 6 && <p className="text-xs text-muted-foreground mt-1.5">...y {note.images.length - 6} más.</p>}
            </div>
          )}

          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas:</h4>
            <div className="text-sm leading-relaxed text-foreground/90 markdown-content">
              {isExpanded ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {highlightedFullNotes}
                </ReactMarkdown>
              ) : (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {highlightedPreview}
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
            onClick={() => onFocusView(note)}
            aria-label="Ver nota en detalle"
            title="Ver nota en detalle"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-8 h-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
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
                  <strong className="block mt-1 font-medium text-foreground">"<HighlightedText text={note.title} highlight={displaySearchTerm}/>"</strong>
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
      {/* Este Dialog es para la previsualización de imagen individual */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl p-2 h-auto max-h-[90vh]">
          {previewImageSrc && (
            <div className="relative w-full h-full aspect-video max-h-[85vh]">
              <NextImage
                src={previewImageSrc}
                alt="Previsualización de imagen ampliada"
                fill
                sizes="90vw"
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

NoteCard.displayName = 'NoteCard';

