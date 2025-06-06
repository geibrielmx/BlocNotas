
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
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isFormPreviewModalOpen, setIsFormPreviewModalOpen] = useState(false);
  const [formPreviewImageSrc, setFormPreviewImageSrc] = useState<string | null>(null);
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
      setImagePreviews([]); // Clear previews when dialog closes
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
          if (trimmedLine.startsWith('- ') || trimmedLine.match(/^\d+\.\s/)) { // Avoid double-prefixing
              return line; 
          }
          return `${prefix}${line}`;
      }).join('\n');
      
      newTextValue = `${currentText.substring(0, start)}${formattedLines}${currentText.substring(end)}`;
      finalCursorPosition = start + formattedLines.length;
    } else {
      // Apply to current line or insert new line if current is prefixed
      let lineStartIndex = start;
      while(lineStartIndex > 0 && currentText[lineStartIndex -1] !== '\n') {
        lineStartIndex--;
      }
      const textBeforeCursorLine = currentText.substring(0, lineStartIndex);
      let textAfterCursorLine = currentText.substring(lineStartIndex);

      const currentLineContent = textAfterCursorLine.split('\n')[0];
      if (currentLineContent.trimStart().startsWith('- ') || currentLineContent.trimStart().match(/^\d+\.\s/)) {
        // Current line is already a list item, add a new one below it
        newTextValue = `${textBeforeCursorLine}${currentLineContent}\n${prefix}${textAfterCursorLine.substring(currentLineContent.length)}`;
        finalCursorPosition = start + prefix.length + 1; // +1 for the newline
      } else {
        // Prefix current line
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

  const processFiles = useCallback((files: File[]) => {
    const currentImageCount = imagePreviews.length;
    if (currentImageCount + files.length > 5) {
      toast({
        title: "Límite de Imágenes Alcanzado",
        description: `Puedes subir un máximo de 5 imágenes por nota. Intentaste añadir ${files.length} imagen(es). Límite actual: ${currentImageCount}/5.`,
        variant: "destructive",
      });
      return;
    }

    let imagesProcessedInBatch = 0;
    files.forEach(file => {
      if (imagePreviews.length + imagesProcessedInBatch >= 5) {
         if (files.length > (5 - currentImageCount) ) { // Only show if some files were skipped due to overall limit
            toast({
                title: "Algunas Imágenes Omitidas",
                description: `Se alcanzó el límite de 5 imágenes. No todas las imágenes seleccionadas/pegadas pudieron ser añadidas.`,
                variant: "default"
            });
         }
         return; // Stop processing if overall limit is reached
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
         toast({
          title: "Imagen Demasiado Grande",
          description: `La imagen "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)}MB) supera el límite de 2MB y no será añadida.`,
          variant: "destructive",
        });
        return; // Skip this file
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreviews(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
      imagesProcessedInBatch++;
    });
  }, [imagePreviews, setImagePreviews, toast]);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(Array.from(files));
      event.target.value = ""; // Clear the input after processing
    }
  };

  useEffect(() => {
    const currentTextarea = notesAreaRef.current;
    const handlePaste = (event: ClipboardEvent) => {
      if (!isOpen || !currentTextarea) return; // Check if textarea is available

      const items = event.clipboardData?.items;
      if (items) {
        const filesArray: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
              filesArray.push(file);
            }
          }
        }
        if (filesArray.length > 0) {
          event.preventDefault(); // Prevent default paste action if images are handled
          processFiles(filesArray);
        }
      }
    };

    if (currentTextarea && isOpen) {
      currentTextarea.addEventListener('paste', handlePaste as EventListener);
    }

    return () => {
      if (currentTextarea) {
        currentTextarea.removeEventListener('paste', handlePaste as EventListener);
      }
    };
  }, [isOpen, processFiles, notesAreaRef]);


  const removeImage = (indexToRemove: number) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const openImagePreviewModal = (src: string) => {
    if (typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http'))) {
        setFormPreviewImageSrc(src);
        setIsFormPreviewModalOpen(true);
    } else {
        toast({
            title: "Error de Imagen",
            description: "La fuente de la imagen seleccionada no es válida para previsualizar.",
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
    <>
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
            <div className="px-6 flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-4"> {/* Ensure padding is here for scroll content */}
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
                        placeholder="Anota tus ideas, detalles, fragmentos de código y cualquier información relevante... Puedes usar Markdown para formatear, ¡incluyendo tablas! También puedes pegar imágenes directamente aquí."
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
                        title="Haz clic para ver imagen completa / Botón X para eliminar"
                        onClick={() => openImagePreviewModal(src)} 
                      >
                        <NextImage
                          src={src}
                          alt={`Previsualización ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          style={{ objectFit: 'contain' }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0 z-10"
                          onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                          title="Eliminar imagen"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <ZoomIn className="h-8 w-8 text-white/80" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                 <FormMessage>{/* RHF doesn't directly manage imagePreviews state */}</FormMessage>
              </FormItem>
            </div>
            <DialogFooter className="bg-card border-t px-6 py-4 gap-2 sm:gap-0"> {/* Standard padding */}
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
    
    <Dialog open={isFormPreviewModalOpen} onOpenChange={setIsFormPreviewModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl p-2 h-auto max-h-[90vh]">
          {formPreviewImageSrc && (
            <div className="relative w-full h-full aspect-video max-h-[85vh]">
              <NextImage
                src={formPreviewImageSrc}
                alt="Previsualización de imagen ampliada desde formulario"
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
}

