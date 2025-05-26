
"use client";

import { useState, useRef, useEffect } from 'react';
import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteForm } from './NoteForm';
import { NoteList } from './NoteList';
import { NoteTable } from './NoteTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, PlusCircle, Search, Upload, Eraser, List as ListIcon, TableIcon, Maximize2 } from 'lucide-react';
import { convertNotesToJson, downloadTextFile } from '@/lib/note-utils';
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as ModalTitle, // Renamed to avoid conflict
  DialogDescription as ModalDescription, // Renamed to avoid conflict
  DialogClose,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';


const APP_VERSION = "v1.7.0";
type ViewMode = 'cards' | 'table';

export function NoteSphereApp() {
  const { notes, searchTerm, setSearchTerm, importNotes, clearAllNotes } = useNotes();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [noteInFocus, setNoteInFocus] = useState<Note | null>(null);
  const [imagePreviewModalSrc, setImagePreviewModalSrc] = useState<string | null>(null);
  const [isImagePreviewModalOpen, setIsImagePreviewModalOpen] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const handleAddNewNote = () => {
    setNoteToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setNoteToEdit(note);
    setIsFormOpen(true);
  };

  const handleOpenFocusModal = (note: Note) => {
    setNoteInFocus(note);
    setIsFocusModalOpen(true);
  };

  const openImagePreviewInModal = (src: string) => {
    setImagePreviewModalSrc(src);
    setIsImagePreviewModalOpen(true);
  };

  const handleExportNotes = () => {
    if (notes.length === 0) {
      toast({ title: "Sin Notas para Exportar", description: "No hay notas para exportar.", variant: "default" });
      return;
    }
    try {
      const jsonData = convertNotesToJson(notes);
      downloadTextFile('notesphere_pro_export.json', jsonData, 'application/json');
      toast({ title: "Exportación Exitosa", description: "Tus notas han sido exportadas como notesphere_pro_export.json." });
    } catch (error) {
      console.error("Exportación fallida:", error);
      toast({ title: "Exportación Fallida", description: "No se pudieron exportar las notas.", variant: "destructive" });
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({ title: "Archivo Inválido", description: "Por favor, selecciona un archivo .json.", variant: "destructive"});
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          importNotes(text);
        } else {
          toast({ title: "Error de Importación", description: "No se pudo leer el contenido del archivo.", variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: "Error de Importación", description: "Falló la lectura del archivo.", variant: "destructive" });
      };
      reader.readAsText(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearAllNotesConfirmed = () => {
    clearAllNotes();
  };


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 md:p-5 border-b border-border/80 bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex flex-col gap-y-3 md:gap-y-4">
          {/* Fila 1: Logo, Título y Selector de Vista */}
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Bloc de Notas Pro</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                title="Vista de Tarjetas"
                className="h-9"
              >
                <ListIcon className="h-4 w-4 md:mr-1.5"/> <span className="hidden md:inline">Tarjetas</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                title="Vista de Tabla"
                className="h-9"
              >
                <TableIcon className="h-4 w-4 md:mr-1.5"/> <span className="hidden md:inline">Tabla</span>
              </Button>
            </div>
          </div>
          
          {/* Fila 2: Búsqueda (solo para CardView) */}
          {viewMode === 'cards' && (
            <div className="w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar en tarjetas..."
                  className="pl-10 pr-3 w-full bg-input border-border focus:ring-primary rounded-lg shadow-sm h-9 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Fila 3: Botones de Acción */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <Button onClick={handleAddNewNote} variant="default" size="sm" className="shadow-sm h-9">
              <PlusCircle className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Añadir Nota</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept="application/json"
              className="hidden"
            />
            <Button onClick={handleImportButtonClick} variant="outline" size="sm" className="shadow-sm h-9">
              <Upload className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button onClick={handleExportNotes} variant="outline" size="sm" className="shadow-sm h-9">
              <Download className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shadow-sm h-9">
                  <Eraser className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Limpiar Todo</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente TODAS tus notas.
                    ¿Estás seguro de que quieres continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllNotesConfirmed}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Sí, eliminar todas las notas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden container mx-auto py-6 md:py-8 gap-6 md:gap-8">
        <div className="flex-1 overflow-y-auto pr-2 scroll-smooth rounded-lg custom-scrollbar">
          {viewMode === 'cards' ? (
            <NoteList onEditNote={handleEditNote} onFocusView={handleOpenFocusModal} />
          ) : (
            <NoteTable onEditNote={handleEditNote} onFocusView={handleOpenFocusModal} />
          )}
        </div>
      </main>

      <footer className="py-4 px-5 border-t border-border/80 bg-card text-center">
        <p className="text-xs text-muted-foreground">
          © GaboGmx {currentYear ?? new Date().getFullYear()} <span className="mx-1">&bull;</span> Bloc de Notas Pro {APP_VERSION}
        </p>
      </footer>

      <NoteForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        noteToEdit={noteToEdit}
      />

      {/* Modal para vista de enfoque de nota */}
      {noteInFocus && (
        <Dialog open={isFocusModalOpen} onOpenChange={setIsFocusModalOpen}>
          <DialogContent className="sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
              <ModalTitle className="text-2xl font-bold text-primary">{noteInFocus.title}</ModalTitle>
              <ModalDescription className="text-sm text-muted-foreground pt-1">
                <span className="font-semibold">Objetivo:</span> {noteInFocus.objective}
              </ModalDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 custom-scrollbar">
              <div className="p-6 space-y-6">
                {noteInFocus.images && noteInFocus.images.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Imágenes Adjuntas:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {noteInFocus.images.map((src, index) => (
                        <div
                          key={index}
                          className="relative aspect-video rounded-md border overflow-hidden group bg-muted/30 cursor-pointer"
                          onClick={() => openImagePreviewInModal(src)}
                          title="Haz clic para ver imagen completa"
                        >
                          <NextImage
                            src={src}
                            alt={`Imagen adjunta ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                            style={{ objectFit: 'contain' }}
                            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                          />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="h-8 w-8 text-white/80" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Notas Detalladas:</h4>
                  <div className="prose prose-sm max-w-none markdown-content bg-background p-4 rounded-md border border-border/70">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {noteInFocus.notesArea}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t flex justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cerrar</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para previsualización de imagen individual */}
      <Dialog open={isImagePreviewModalOpen} onOpenChange={setIsImagePreviewModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl p-2 h-auto max-h-[90vh]">
          {imagePreviewModalSrc && (
            <div className="relative w-full h-full aspect-video max-h-[85vh]">
              <NextImage
                src={imagePreviewModalSrc}
                alt="Previsualización de imagen ampliada"
                fill
                sizes="90vw"
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--background) / 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--secondary-foreground) / 0.7);
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1em;
          margin-bottom: 1em;
          border: 1px solid hsl(var(--border));
        }
        .markdown-content th,
        .markdown-content td {
          border: 1px solid hsl(var(--border));
          padding: 0.5em 0.75em;
          text-align: left;
        }
        .markdown-content th {
          background-color: hsl(var(--secondary));
          font-weight: 600;
        }
        .markdown-content tr:hover {
          background-color: hsl(var(--accent));
        }
        .markdown-content p {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
         .markdown-content ul, .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        .markdown-content code:not(pre > code) { /* Apply to inline code only */
          background-color: hsl(var(--muted));
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: var(--font-geist-mono);
          font-size: 0.9em;
          border: 1px solid hsl(var(--border)/0.7);
        }
        .markdown-content pre {
          background-color: hsl(var(--muted));
          padding: 0.8em 1em;
          border-radius: var(--radius);
          overflow-x: auto;
          border: 1px solid hsl(var(--border));
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.875em;
          border: none;
        }
        .markdown-content blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1em;
          margin-left: 0;
          color: hsl(var(--muted-foreground));
        }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: 600;
        }
        .markdown-content h1 { font-size: 1.8em; }
        .markdown-content h2 { font-size: 1.5em; }
        .markdown-content h3 { font-size: 1.25em; }

        .note-table-row:hover {
          background-color: hsl(var(--muted) / 0.5) !important;
        }
        /* Tailwind Prose Overrides for better focus modal content */
        .prose {
          --tw-prose-body: hsl(var(--foreground));
          --tw-prose-headings: hsl(var(--primary));
          --tw-prose-lead: hsl(var(--muted-foreground));
          --tw-prose-links: hsl(var(--primary));
          --tw-prose-bold: hsl(var(--foreground));
          --tw-prose-counters: hsl(var(--muted-foreground));
          --tw-prose-bullets: hsl(var(--border));
          --tw-prose-hr: hsl(var(--border));
          --tw-prose-quotes: hsl(var(--primary));
          --tw-prose-quote-borders: hsl(var(--border));
          --tw-prose-captions: hsl(var(--muted-foreground));
          --tw-prose-code: hsl(var(--primary));
          --tw-prose-pre-code: hsl(var(--foreground));
          --tw-prose-pre-bg: hsl(var(--muted));
          --tw-prose-th-borders: hsl(var(--border));
          --tw-prose-td-borders: hsl(var(--border));
          
          --tw-prose-invert-body: hsl(var(--foreground));
          --tw-prose-invert-headings: hsl(var(--primary));
          --tw-prose-invert-lead: hsl(var(--muted-foreground));
          --tw-prose-invert-links: hsl(var(--primary));
          --tw-prose-invert-bold: hsl(var(--foreground));
          --tw-prose-invert-counters: hsl(var(--muted-foreground));
          --tw-prose-invert-bullets: hsl(var(--border));
          --tw-prose-invert-hr: hsl(var(--border));
          --tw-prose-invert-quotes: hsl(var(--primary));
          --tw-prose-invert-quote-borders: hsl(var(--border));
          --tw-prose-invert-captions: hsl(var(--muted-foreground));
          --tw-prose-invert-code: hsl(var(--primary));
          --tw-prose-invert-pre-code: hsl(var(--foreground));
          --tw-prose-invert-pre-bg: hsl(var(--muted));
          --tw-prose-invert-th-borders: hsl(var(--border));
          --tw-prose-invert-td-borders: hsl(var(--border));
        }
        .prose code::before, .prose code::after {
          content: none; /* Remove backticks from prose code elements */
        }
      `}</style>
    </div>
  );
}

