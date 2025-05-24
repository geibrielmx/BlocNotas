
"use client";

import { useEffect, useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import { suggestRelatedNotes, type SuggestRelatedNotesOutput } from '@/ai/flows/suggest-related-notes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, AlertTriangle, Loader2, Brain, Wand2, ThumbsUp } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from './ui/badge';

export function AiSuggestions() {
  const { selectedNoteIdForAI, getNoteById, isLoading, setIsLoading, setSelectedNoteIdForAI } = useNotes();
  const [suggestionsOutput, setSuggestionsOutput] = useState<SuggestRelatedNotesOutput | null>(null);
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
          setSuggestionsOutput(null); 
          try {
            const noteContent = `Título: ${note.title}\nObjetivo: ${note.objective}\nNotas: ${note.notesArea}`;
            const result = await suggestRelatedNotes({ noteContent });
            setSuggestionsOutput(result);
          } catch (err) {
            console.error("Error al obtener sugerencias de IA:", err);
            setError("¡Ups! Falló al cargar las ideas de la IA. Por favor, inténtalo de nuevo más tarde o selecciona otra nota.");
          } finally {
            setIsLoading(false);
          }
        } else {
          setCurrentNoteTitle(null);
          setSuggestionsOutput(null);
        }
      };
      fetchSuggestions();
    } else {
      setCurrentNoteTitle(null);
      setSuggestionsOutput(null);
      setError(null);
    }
  }, [selectedNoteIdForAI, getNoteById, setIsLoading]);

  const handleClearSelection = () => {
    setSelectedNoteIdForAI(null);
  };

  const ideas = suggestionsOutput?.ideas;

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-lg bg-card text-card-foreground border border-border/80">
      <CardHeader className="border-b border-border/70 pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              Ideas IA para Notas
            </CardTitle>
            {selectedNoteIdForAI && (
                <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
                    Limpiar Selección
                </Button>
            )}
        </div>
        {currentNoteTitle && (
            <CardDescription className="text-xs text-muted-foreground pt-1 pl-0.5 truncate" title={`Ideas relacionadas con: "${currentNoteTitle}"`}>
                Relacionado con: <span className="font-medium text-foreground/80">"{currentNoteTitle}"</span>
            </CardDescription>
        )}
      </CardHeader>
      <ScrollArea className="flex-1 custom-scrollbar">
        <CardContent className="p-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3.5 py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Generando ideas...</p>
              <p className="text-xs text-center">La IA está pensando, esto puede tardar unos momentos.</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center space-y-3.5 py-10 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm font-medium text-center">Error al Cargar Ideas</p>
              <p className="text-xs text-center px-4">{error}</p>
            </div>
          )}
          {!isLoading && !error && !ideas && !selectedNoteIdForAI && (
            <div className="text-center text-muted-foreground py-10 px-6 space-y-4">
              <Wand2 className="mx-auto h-12 w-12 text-primary/60 opacity-70" strokeWidth={1.5}/>
              <p className="text-sm font-medium">Desbloquea Ideas con IA</p>
              <p className="text-xs leading-relaxed">
                Selecciona una nota y haz clic en el icono de <Sparkles className="inline h-3.5 w-3.5 mx-0.5 text-primary relative -top-px" /> 
                para descubrir ideas y sugerencias relacionadas impulsadas por IA.
              </p>
            </div>
          )}
          {!isLoading && !error && ideas && ideas.length === 0 && selectedNoteIdForAI && (
             <div className="text-center text-muted-foreground py-10 px-6 space-y-4">
              <ThumbsUp className="mx-auto h-12 w-12 text-primary/60 opacity-70" strokeWidth={1.5} />
              <p className="text-sm font-medium">¡Todo Bien por Aquí!</p>
              <p className="text-xs leading-relaxed">
                La IA no encontró sugerencias específicas adicionales para "{currentNoteTitle}" en este momento. ¡Tu nota parece estar en buen camino!
                Prueba con una nota diferente o añade más detalles a esta si buscas nuevas perspectivas.
              </p>
            </div>
          )}
          {ideas && ideas.length > 0 && (
            <ul className="space-y-4">
              {ideas.map((suggestion, index) => (
                <li 
                  key={index} 
                  className="p-4 border border-border/70 rounded-lg bg-background hover:border-primary/40 transition-colors shadow-sm overflow-hidden"
                >
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className="text-md font-semibold text-primary flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 opacity-80" />
                        {suggestion.title}
                    </h4>
                    {suggestion.type && (
                        <Badge variant="outline" className="text-xs ml-2">{suggestion.type}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-foreground/90 markdown-content prose prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {suggestion.details}
                    </ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

    