"use client";

import { useEffect, useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import { suggestRelatedNotes, type SuggestRelatedNotesOutput } from '@/ai/flows/suggest-related-notes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
            const noteContent = `${note.title}\nObjective: ${note.objective}\nNotes: ${note.notesArea}`;
            const result = await suggestRelatedNotes({ noteContent });
            setSuggestions(result);
          } catch (err) {
            console.error("Error fetching AI suggestions:", err);
            setError("Failed to load suggestions. Please try again.");
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
    <Card className="h-full flex flex-col shadow-lg rounded-lg bg-card text-card-foreground">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          AI Note Suggestions
        </CardTitle>
        {currentNoteTitle && (
            <CardDescription className="text-xs text-muted-foreground pt-1">
                Related to: "{currentNoteTitle}"
            </CardDescription>
        )}
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-2 p-6 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading suggestions...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center space-y-2 p-6 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && !suggestions && !selectedNoteIdForAI && (
            <div className="text-center text-muted-foreground p-6">
              <p>Select a note and click the <Sparkles className="inline h-4 w-4 mx-1" /> icon on it to see related suggestions here.</p>
            </div>
          )}
          {!isLoading && !error && suggestions && suggestions.relatedNotes.length === 0 && (
             <div className="text-center text-muted-foreground p-6">
              <p>No specific suggestions found for this note.</p>
            </div>
          )}
          {suggestions && suggestions.relatedNotes.length > 0 && (
            <ul className="space-y-3">
              {suggestions.relatedNotes.map((suggestion, index) => (
                <li key={index} className="p-3 border border-border rounded-md bg-accent/50 text-sm text-accent-foreground shadow-sm">
                  <p className="whitespace-pre-wrap">{suggestion}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
