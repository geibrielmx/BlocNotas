
"use client";

import { useState, useRef, useEffect } from 'react';
import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteForm } from './NoteForm';
import { NoteList } from './NoteList';
import { AiSuggestions } from './AiSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, PlusCircle, Search, Sparkles, Upload, Eraser, Save, BookOpenText } from 'lucide-react';
import { convertNotesToCsv, downloadTextFile } from '@/lib/note-utils';
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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

const APP_VERSION = "v1.4.0"; 

export function NoteSphereApp() {
  const { notes, searchTerm, setSearchTerm, importNotes, clearAllNotes } = useNotes();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

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

  const handleExportNotes = () => {
    if (notes.length === 0) {
      toast({ title: "Sin Notas para Exportar", description: "No hay notas para exportar.", variant: "default" });
      return;
    }
    try {
      const csvData = convertNotesToCsv(notes);
      downloadTextFile('notesphere_pro_export.txt', csvData);
      toast({ title: "Exportación Exitosa", description: "Tus notas han sido exportadas como notesphere_pro_export.txt." });
    } catch (error) {
      console.error("Exportación fallida:", error);
      toast({ title: "Exportación Fallida", description: "No se pudieron exportar las notas.", variant: "destructive" });
    }
  };
  
  const handleSaveChanges = () => {
    if (notes.length === 0) {
      toast({ title: "Sin Cambios para Guardar", description: "No hay notas para guardar y exportar.", variant: "default" });
      return;
    }
    try {
      const csvData = convertNotesToCsv(notes);
      downloadTextFile('notesphere_pro_export.txt', csvData);
      toast({ title: "Cambios Guardados y Exportados", description: "El estado actual de tus notas ha sido exportado a notesphere_pro_export.txt." });
    } catch (error) {
      console.error("Error al guardar y exportar:", error);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar y exportar las notas.", variant: "destructive" });
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      <header className="p-5 border-b border-border/80 bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex flex-col gap-y-3">
          {/* Fila 1: Logo y Título */}
          <div className="flex items-center justify-start gap-2.5">
            <BookOpenText className="h-8 w-8 md:h-9 md:w-9 text-primary" />
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">Bloc de Notas Pro</h1>
          </div>

          {/* Fila 2: Búsqueda y Botones */}
          <div className="flex items-center justify-between gap-x-4 md:gap-x-6">
            <div className="flex-1 min-w-0 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar notas..."
                  className="pl-11 pr-4 w-full bg-input border-border focus:ring-primary rounded-lg shadow-sm h-10 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <Button onClick={handleAddNewNote} variant="default" size="sm" className="shadow-sm">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Añadir Nota</span>
                <span className="sm:hidden">Añadir</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept=".txt,.csv"
                className="hidden"
              />
              <Button onClick={handleImportButtonClick} variant="outline" size="sm" className="shadow-sm">
                <Upload className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              <Button onClick={handleSaveChanges} variant="outline" size="sm" className="shadow-sm">
                <Save className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Guardar</span>
              </Button>
              <Button onClick={handleExportNotes} variant="outline" size="sm" className="shadow-sm">
                <Download className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shadow-sm">
                    <Eraser className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Limpiar Todo</span>
                    <span className="sm:hidden">Limpiar</span>
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

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Abrir/Cerrar Panel IA">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[clamp(300px,80vw,420px)] p-0 bg-card border-l border-border shadow-xl">
                  <div className="h-full flex flex-col">
                      <AiSuggestions />
                    </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden container mx-auto py-6 md:py-8 gap-6 md:gap-8">
        <div className="flex-1 overflow-y-auto pr-2 scroll-smooth rounded-lg custom-scrollbar">
          <NoteList onEditNote={handleEditNote} />
        </div>
        <aside className="hidden md:block w-[360px] lg:w-[400px] transition-all duration-300 ease-in-out overflow-y-auto rounded-lg custom-scrollbar opacity-100 translate-x-0">
           <AiSuggestions />
        </aside>
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
        .markdown-content tr:nth-child(even) {
          background-color: hsl(var(--background));
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
        .markdown-content code {
          background-color: hsl(var(--muted));
          padding: 0.2em 0.4em;
          border-radius: var(--radius-sm);
          font-family: var(--font-geist-mono);
        }
        .markdown-content pre {
          background-color: hsl(var(--muted));
          padding: 1em;
          border-radius: var(--radius-md);
          overflow-x: auto;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
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

      `}</style>
    </div>
  );
}

    
