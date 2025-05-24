
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
import { useEffect } from 'react';
import { FilePenLine, Edit } from 'lucide-react';

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
                  <FormControl>
                    <Textarea
                      placeholder="Anota tus ideas, detalles, fragmentos de código y cualquier información relevante... Puedes usar Markdown para formatear, ¡incluyendo tablas!"
                      rows={8}
                      {...field}
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
