
"use client";

import { useEffect, useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import { suggestRelatedNotes, type SuggestRelatedNotesOutput } from '@/ai/flows/suggest-related-notes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, AlertTriangle, Loader2, Brain } from 'lucide-react';

export function AiSuggestions() {
  const { selectedNoteIdForAI, getNoteById, isLoading, setIsLoading } = useNotes();
  const [suggestions, setSuggestions] = useState<SuggestRelatedNotesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentNoteTitle, setCurrentNoteTitle] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNoteIdForAI) {
      const fetchSuggestions = async () => {
        const note = getNoteById(selectedNoteIdForAI);
        if (note) {
          setCurrentNoteTitle(note.title);
          setIsLoading(true);
          setError(null);
          setSuggestions(null);
          try {
            const noteContent = `Title: ${note.title}\nObjective: ${note.objective}\nNotes: ${note.notesArea}`;
            const result = await suggestRelatedNotes({ noteContent });
            setSuggestions(result);
          } catch (err) {
            console.error("Error fetching AI suggestions:", err);
            setError("Failed to load suggestions. Please try again later.");
          } finally {
            setIsLoading(false);
          }
        } else {
          setCurrentNoteTitle(null);
          setSuggestions(null);
        }
      };
      fetchSuggestions();
    } else {
      setCurrentNoteTitle(null);
      setSuggestions(null);
      setError(null);
    }
  }, [selectedNoteIdForAI, getNoteById, setIsLoading]);

  return (
    <Card className="h-full flex flex-col shadow-xl rounded-xl bg-card text-card-foreground border border-border/70">
      <CardHeader className="border-b border-border/60 pb-4 pt-5 px-5">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Brain className="mr-2.5 h-6 w-6 text-primary" />
          AI Note Insights
        </CardTitle>
        {currentNoteTitle && (
            <CardDescription className="text-xs text-muted-foreground pt-1.5 pl-1">
                Insights related to: "{currentNoteTitle}"
            </CardDescription>
        )}
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="p-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 p-8 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm">Generating insights...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center space-y-3 p-8 text-destructive">
              <AlertTriangle className="h-10 w-10" />
              <p className="text-sm text-center">{error}</p>
            </div>
          )}
          {!isLoading && !error && !suggestions && !selectedNoteIdForAI && (
            <div className="text-center text-muted-foreground p-8 space-y-3">
              <Sparkles className="mx-auto h-10 w-10 text-primary/70" />
              <p className="text-sm">Select a note and click the <Sparkles className="inline h-4 w-4 mx-0.5" /> icon on it to see related AI insights here.</p>
            </div>
          )}
          {!isLoading && !error && suggestions && suggestions.relatedNotes.length === 0 && (
             <div className="text-center text-muted-foreground p-8 space-y-3">
              <Sparkles className="mx-auto h-10 w-10 text-primary/70" />
              <p className="text-sm">No specific insights found for this note at the moment.</p>
            </div>
          )}
          {suggestions && suggestions.relatedNotes.length > 0 && (
            <ul className="space-y-3.5">
              {suggestions.relatedNotes.map((suggestion, index) => (
                <li key={index} className="p-3.5 border border-border/60 rounded-lg bg-background hover:bg-muted/30 transition-colors text-sm text-foreground/90 shadow-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{suggestion}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
