"use client";

import { useState } from 'react';
import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { NoteForm } from './NoteForm';
import { NoteList } from './NoteList';
import { AiSuggestions } from './AiSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, PlusCircle, Search, Settings2, Sparkles } from 'lucide-react';
import { convertNotesToCsv, downloadTextFile } from '@/lib/note-utils';
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from '@/components/ui/separator';


export function NoteSphereApp() {
  const { notes, searchTerm, setSearchTerm } = useNotes();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true); // Default to open on larger screens

  const { toast } = useToast();

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
      downloadTextFile('notesphere_export.txt', csvData);
      toast({ title: "Export Successful", description: "Your notes have been exported." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export Failed", description: "Could not export notes.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border/80 shadow-sm bg-card">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg role="img" aria-label="NoteSphere Logo" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.8284 5.17157C18.0937 6.43683 18.75 8.13109 18.75 9.9C18.75 11.6689 18.0937 13.3632 16.8284 14.6284C15.5632 15.8937 13.8689 16.55 12.1 16.55H9.9C8.13109 16.55 6.43683 15.8937 5.17157 14.6284C3.90632 13.3632 3.25 11.6689 3.25 9.9C3.25 8.13109 3.90632 6.43683 5.17157 5.17157C6.43683 3.90632 8.13109 3.25 9.9 3.25H12.1C13.8689 3.25 15.5632 3.90632 16.8284 5.17157ZM15 5.75C14.1778 5.75 13.3733 5.99195 12.6944 6.44628L6.44628 12.6944C5.99195 13.3733 5.75 14.1778 5.75 15C5.75 16.933 7.31701 18.5 9.25 18.5H14.75C16.683 18.5 18.25 16.933 18.25 15V9.25C18.25 7.31701 16.683 5.75 14.75 5.75H15Z M20.75 9.9C20.75 10.7869 20.5801 11.6611 20.2534 12.474L12.474 20.2534C11.6611 20.5801 10.7869 20.75 9.9 20.75C7.66621 20.75 5.64045 19.8694 4.15921 18.3882C2.67797 16.9069 1.79739 14.8812 1.79739 12.6474C1.79739 12.1099 1.87002 11.5801 1.99995 11.0716L3.49805 3.49805C3.88778 2.01453 5.25978 1 6.85261 1H17.1474C18.7402 1 20.1122 2.01453 20.5019 3.49805L20.7363 4.35258C20.7441 4.38281 20.75 4.41396 20.75 4.44531V9.9Z"/>
            </svg>
            <h1 className="text-2xl font-bold text-foreground">NoteSphere</h1>
          </div>
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notes by ID, title, content..."
                className="pl-10 w-full bg-background border-input focus:ring-primary"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddNewNote} variant="default" className="shadow-sm">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Note
            </Button>
            <Button onClick={handleExportNotes} variant="outline" className="shadow-sm">
              <Download className="mr-2 h-5 w-5" />
              Export
            </Button>
             <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle AI Panel">
                  <Sparkles className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
                 <div className="h-full flex flex-col"> {/* Ensure AiSuggestions takes full height */}
                    <AiSuggestions />
                  </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden container mx-auto py-6 gap-6">
        <div className="flex-1 overflow-y-auto pr-2 scroll-smooth"> {/* Added pr-2 for scrollbar spacing */}
          <NoteList onEditNote={handleEditNote} />
        </div>
        <aside className={`hidden md:block w-[350px] lg:w-[400px] transition-all duration-300 ease-in-out overflow-y-auto ${isAiPanelOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full w-0'}`}>
          {isAiPanelOpen && <AiSuggestions />}
        </aside>
      </main>

      <NoteForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        noteToEdit={noteToEdit}
      />
    </div>
  );
}
