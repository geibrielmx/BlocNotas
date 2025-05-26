
"use client";

import type { Note } from '@/types';
import { useForm, Controller } from 'react-hook-form';
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
import { useEffect, useRef, useState } from 'react';
import { FilePenLine, Edit, Bold, Italic, List, ListOrdered, Code, SquareCode, LinkIcon, ImagePlus, X, ZoomIn } from 'lucide-react';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';

const noteSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(100, 'El título debe tener 100 caracteres o menos'),
  objective: z.string().min(1, 'El objetivo es obligatorio').max(200, 'El objetivo debe tener 200 caracteres o menos'),
  notesArea: z.string().min(1, 'El área de notas no puede estar vacía'),
  images: z.array(z.string()).optional(),
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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      objective: '',
      notesArea: '',
      images: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        form.reset({
          title: noteToEdit.title,
          objective: noteToEdit.objective,
          notesArea: noteToEdit.notesArea,
          images: noteToEdit.images || [],
        });
        setImagePreviews(noteToEdit.images || []);
      } else {
        form.reset({
          title: '',
          objective: '',
          notesArea: '',
          images: [],
        });
        setImagePreviews([]);
      }
    }
  }, [noteToEdit, form, isOpen]);

  const onSubmit = (data: NoteFormData) => {
    const noteDataWithImages = {
      ...data,
      images: imagePreviews,
    };
    if (noteToEdit) {
      updateNote({ ...noteToEdit, ...noteDataWithImages });
    } else {
      addNote(noteDataWithImages);
    }
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setImagePreviews([]);
    }
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

      const currentLineContent = textAfterCursorLine.split('\n')[0];
      if (currentLineContent.trimStart().startsWith('- ') || currentLineContent.trimStart().match(/^\d+\.\s/)) {
        newTextValue = `${textBeforeCursorLine}${currentLineContent}\n${prefix}${textAfterCursorLine.substring(currentLineContent.length)}`;
        finalCursorPosition = start + prefix.length + 1; 
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentImageCount = imagePreviews.length;
      if (currentImageCount + files.length > 5) {
        toast({
          title: "Límite de Imágenes Alcanzado",
          description: "Puedes subir un máximo de 5 imágenes por nota.",
          variant: "destructive",
        });
        return;
      }

      Array.from(files).forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
           toast({
            title: "Imagen Demasiado Grande",
            description: `La imagen "${file.name}" supera el límite de 2MB y no será añadida.`,
            variant: "destructive",
          });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImagePreviews(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      event.target.value = ""; 
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const openImagePreview = (src: string) => {
    if (typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http'))) {
      const newTab = window.open(src, '_blank');
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
          toast({
            title: "Error al Abrir Imagen",
            description: "No se pudo abrir la imagen en una nueva pestaña. Es posible que tu navegador haya bloqueado la ventana emergente.",
            variant: "destructive",
          });
      }
    } else {
      toast({
        title: "Error de Imagen",
        description: "La fuente de la imagen seleccionada no es válida para abrir.",
        variant: "destructive",
      });
    }
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col bg-card text-card-foreground shadow-xl rounded-lg border border-border/90 p-0">
        <DialogHeader className="pb-3 pt-5 px-6">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {noteToEdit ? <Edit className="h-5 w-5 text-primary" /> : <FilePenLine className="h-5 w-5 text-primary" />}
            {noteToEdit ? 'Editar Nota' : 'Crear Nueva Nota'}
          </DialogTitle>
          <DialogDescription className="text-sm pt-0.5">
            {noteToEdit ? 'Modifica los detalles de tu nota existente.' : 'Completa los detalles para crear una nueva nota.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 px-6 flex-1 overflow-y-auto custom-scrollbar pb-4">
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
                        {...field} 
                        ref={(e) => {
                          field.ref(e); 
                          notesAreaRef.current = e; 
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
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground/90">Imágenes (máx. 5, 2MB c/u)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      id="imageUpload"
                      multiple
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('imageUpload')?.click()}>
                      <ImagePlus className="h-4 w-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Añadir Imágenes</span>
                    </Button>
                  </div>
                </FormControl>
                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((src, index) => (
                      <div 
                        key={index} 
                        className="relative group aspect-square border rounded-md overflow-hidden shadow-sm bg-muted/30 cursor-pointer"
                        title="Haz clic para ver imagen completa / Eliminar"
                        onClick={() => openImagePreview(src)}
                      >
                        <NextImage 
                          src={src} 
                          alt={`Previsualización ${index + 1}`} 
                          fill
                          sizes="(max-width: 640px) 50vw, 200px" // Provide sizes for responsiveness
                          style={{ objectFit: 'contain' }}
                          onError={(e) => console.error("NoteForm NextImage Error:", e.currentTarget.currentSrc)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0 z-10"
                          onClick={(e) => { e.stopPropagation(); removeImage(index); }} // Stop propagation to prevent opening
                          title="Eliminar imagen"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <ZoomIn className="h-6 w-6 text-white/70" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                 <FormMessage>{/* RHF doesn't directly manage imagePreviews state */}</FormMessage>
              </FormItem>
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0 bg-card py-3 border-t px-6">
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

    