
"use client";

import type { Note } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useNotes } from '@/contexts/NoteContext';
import { useEffect, useRef } from 'react';
import { FilePenLine, Edit, Bold, Italic, List, ListOrdered, Code, SquareCode, LinkIcon } from 'lucide-react';

const noteSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(100, 'El título debe tener 100 caracteres o menos'),
  objective: z.string().min(1, 'El objetivo es obligatorio').max(200, 'El objetivo debe tener 200 caracteres o menos'),
  notesArea: z.string().min(1, 'El área de notas no puede estar vacía'),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  noteToEdit?: Note | null;
}

export function NoteForm({ isOpen, onOpenChange, noteToEdit }: NoteFormProps) {
  const { addNote, updateNote } = useNotes();
  const notesAreaRef = useRef<HTMLTextAreaElement | null>(null);
  
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      objective: '',
      notesArea: '',
    },
  });

  useEffect(() => {
    if (isOpen) { 
      if (noteToEdit) {
        form.reset({
          title: noteToEdit.title,
          objective: noteToEdit.objective,
          notesArea: noteToEdit.notesArea,
        });
      } else {
        form.reset({
          title: '',
          objective: '',
          notesArea: '',
        });
      }
    }
  }, [noteToEdit, form, isOpen]); 

  const onSubmit = (data: NoteFormData) => {
    if (noteToEdit) {
      updateNote({ ...noteToEdit, ...data });
    } else {
      addNote(data);
    }
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  const applyMarkdownFormatting = (syntaxStart: string, syntaxEnd: string = '', placeholderText: string = 'texto') => {
    const textarea = notesAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);
    
    let newTextValue;
    let cursorStart;
    let cursorEnd;

    if (selectedText) {
      newTextValue = `${currentText.substring(0, start)}${syntaxStart}${selectedText}${syntaxEnd}${currentText.substring(end)}`;
      cursorStart = start + syntaxStart.length + selectedText.length + syntaxEnd.length;
      cursorEnd = cursorStart;
    } else {
      newTextValue = `${currentText.substring(0, start)}${syntaxStart}${placeholderText}${syntaxEnd}${currentText.substring(end)}`;
      cursorStart = start + syntaxStart.length;
      cursorEnd = cursorStart + placeholderText.length;
    }
    
    form.setValue('notesArea', newTextValue, { shouldValidate: true, shouldDirty: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

  const applyListFormatting = (prefix: string) => {
    const textarea = notesAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);
    
    let newTextValue;
    let finalCursorPosition;

    if (selectedText) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map(line => {
          const trimmedLine = line.trimStart();
          if (trimmedLine.startsWith('- ') || trimmedLine.match(/^\d+\.\s/)) {
              return line; 
          }
          return `${prefix}${line}`;
      }).join('\n');
      
      newTextValue = `${currentText.substring(0, start)}${formattedLines}${currentText.substring(end)}`;
      finalCursorPosition = start + formattedLines.length;
    } else {
      let lineStartIndex = start;
      while(lineStartIndex > 0 && currentText[lineStartIndex -1] !== '\n') {
        lineStartIndex--;
      }
      const textBeforeCursorLine = currentText.substring(0, lineStartIndex);
      let textAfterCursorLine = currentText.substring(lineStartIndex);

      // Add prefix, ensuring not to double-prefix if the line already looks like a list item
      const currentLineContent = textAfterCursorLine.split('\n')[0];
      if (currentLineContent.trimStart().startsWith('- ') || currentLineContent.trimStart().match(/^\d+\.\s/)) {
         // If already a list item, just move cursor or insert newline + prefix if at end of item
        newTextValue = `${textBeforeCursorLine}${currentLineContent}\n${prefix}${textAfterCursorLine.substring(currentLineContent.length)}`;
        finalCursorPosition = start + prefix.length + 1; // after the newline and prefix
      } else {
        newTextValue = `${textBeforeCursorLine}${prefix}${textAfterCursorLine}`;
        finalCursorPosition = lineStartIndex + prefix.length + (start - lineStartIndex);
      }
    }
    
    form.setValue('notesArea', newTextValue, { shouldValidate: true, shouldDirty: true });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(finalCursorPosition, finalCursorPosition);
    }, 0);
  };


  const markdownToolbar = (
    <div className="flex flex-wrap gap-1 mb-2 p-1 border border-border rounded-md bg-background shadow-sm">
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyMarkdownFormatting('**', '**', 'negrita')} title="Negrita (Ctrl+B)">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyMarkdownFormatting('*', '*', 'cursiva')} title="Cursiva (Ctrl+I)">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyListFormatting('- ')} title="Lista no ordenada">
        <List className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyListFormatting('1. ')} title="Lista ordenada">
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyMarkdownFormatting('`', '`', 'código')} title="Código en línea">
        <Code className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyMarkdownFormatting('```\n', '\n```', 'bloque de código')} title="Bloque de código">
        <SquareCode className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="px-2 h-8" onClick={() => applyMarkdownFormatting('[', '](url)', 'texto del enlace')} title="Enlace">
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground shadow-xl rounded-lg border border-border/90">
        <DialogHeader className="pb-3 pt-2 px-1">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {noteToEdit ? <Edit className="h-5 w-5 text-primary" /> : <FilePenLine className="h-5 w-5 text-primary" />}
            {noteToEdit ? 'Editar Nota' : 'Crear Nueva Nota'}
          </DialogTitle>
          <DialogDescription className="text-sm pt-0.5">
            {noteToEdit ? 'Modifica los detalles de tu nota existente.' : 'Completa los detalles para crear una nueva nota.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">Título</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., Ideas Campaña Marketing Q3" {...field} className="bg-input border-border focus:border-primary h-10 text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">Objetivo / Función</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., Lluvia de ideas sobre estrategias y entregables clave" {...field} className="bg-input border-border focus:border-primary h-10 text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notesArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">Área de Notas</FormLabel>
                  {markdownToolbar}
                  <FormControl>
                    <Textarea
                      {...field} // RHF field props, including its ref
                      ref={(e) => {
                        field.ref(e); // Call RHF's ref function
                        notesAreaRef.current = e; // Assign to your manual ref
                      }}
                      placeholder="Anota tus ideas, detalles, fragmentos de código y cualquier información relevante... Puedes usar Markdown para formatear, ¡incluyendo tablas!"
                      rows={8}
                      className="bg-input border-border focus:border-primary min-h-[150px] text-sm leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="default">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" variant="default" size="default">
                {noteToEdit ? 'Guardar Cambios' : 'Crear Nota'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
