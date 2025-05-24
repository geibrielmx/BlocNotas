
"use client";

import { useState, useRef, useEffect } from 'react';
import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteForm } from './NoteForm';
import { NoteList } from './NoteList';
import { AiSuggestions } from './AiSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, PlusCircle, Search, Sparkles, Upload, Eraser } from 'lucide-react';
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

const APP_VERSION = "v1.1.0"; // Incremented version

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
      toast({ title: "No Notes to Export", description: "There are no notes to export.", variant: "default" });
      return;
    }
    try {
      const csvData = convertNotesToCsv(notes);
      downloadTextFile('notesphere_pro_export.txt', csvData);
      toast({ title: "Export Successful", description: "Your notes have been exported." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export Failed", description: "Could not export notes.", variant: "destructive" });
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
          toast({ title: "Import Error", description: "Could not read file content.", variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: "Import Error", description: "Failed to read the file.", variant: "destructive" });
      };
      reader.readAsText(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearAllNotesConfirmed = () => {
    clearAllNotes();
    // Toast is handled within the context's clearAllNotes function
  };


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-5 border-b border-border/80 bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between gap-x-4 md:gap-x-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <svg role="img" aria-label="NoteSphere Pro Logo" className="h-8 w-8 md:h-9 md:w-9 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.8284 5.17157C18.0937 6.43683 18.75 8.13109 18.75 9.9C18.75 11.6689 18.0937 13.3632 16.8284 14.6284C15.5632 15.8937 13.8689 16.55 12.1 16.55H9.9C8.13109 16.55 6.43683 15.8937 5.17157 14.6284C3.90632 13.3632 3.25 11.6689 3.25 9.9C3.25 8.13109 3.90632 6.43683 5.17157 5.17157C6.43683 3.90632 8.13109 3.25 9.9 3.25H12.1C13.8689 3.25 15.5632 3.90632 16.8284 5.17157ZM15 5.75C14.1778 5.75 13.3733 5.99195 12.6944 6.44628L6.44628 12.6944C5.99195 13.3733 5.75 14.1778 5.75 15C5.75 16.933 7.31701 18.5 9.25 18.5H14.75C16.683 18.5 18.25 16.933 18.25 15V9.25C18.25 7.31701 16.683 5.75 14.75 5.75H15Z M20.75 9.9C20.75 10.7869 20.5801 11.6611 20.2534 12.474L12.474 20.2534C11.6611 20.5801 10.7869 20.75 9.9 20.75C7.66621 20.75 5.64045 19.8694 4.15921 18.3882C2.67797 16.9069 1.79739 14.8812 1.79739 12.6474C1.79739 12.1099 1.87002 11.5801 1.99995 11.0716L3.49805 3.49805C3.88778 2.01453 5.25978 1 6.85261 1H17.1474C18.7402 1 20.1122 2.01453 20.5019 3.49805L20.7363 4.35258C20.7441 4.38281 20.75 4.41396 20.75 4.44531V9.9Z"/>
            </svg>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">NoteSphere Pro</h1>
          </div>
          
          <div className="flex-1 min-w-0 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notes..."
                className="pl-11 pr-4 w-full bg-input border-border focus:ring-primary rounded-lg shadow-sm h-10 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button onClick={handleAddNewNote} variant="default" size="default" className="shadow-sm">
              <PlusCircle className="mr-1.5 h-4.5 w-4.5" />
              <span className="hidden sm:inline">Add Note</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".txt,.csv"
              className="hidden"
            />
            <Button onClick={handleImportButtonClick} variant="outline" size="default" className="shadow-sm">
              <Upload className="mr-1.5 h-4.5 w-4.5" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button onClick={handleExportNotes} variant="outline" size="default" className="shadow-sm">
              <Download className="mr-1.5 h-4.5 w-4.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="default" className="shadow-sm">
                  <Eraser className="mr-1.5 h-4.5 w-4.5" />
                  <span className="hidden sm:inline">Clear All</span>
                   <span className="sm:hidden">Clear</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete ALL your notes.
                    Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllNotesConfirmed}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Yes, delete all notes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

             <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10" aria-label="Toggle AI Panel">
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
          © GaboGmx {currentYear ?? new Date().getFullYear()} <span className="mx-1">&bull;</span> NoteSphere Pro {APP_VERSION}
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
      `}</style>
    </div>
  );
}
