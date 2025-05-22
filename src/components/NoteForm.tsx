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

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  objective: z.string().min(1, 'Objective is required').max(200, 'Objective must be 200 characters or less'),
  notesArea: z.string().min(1, 'Notes area cannot be empty'),
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
  }, [noteToEdit, form, isOpen]); // re-run if isOpen changes, to reset form when dialog opens for new note

  const onSubmit = (data: NoteFormData) => {
    if (noteToEdit) {
      updateNote({ ...noteToEdit, ...data });
    } else {
      addNote(data);
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) form.reset(); }}>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground shadow-lg rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {noteToEdit ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter note title" {...field} className="bg-background border-input"/>
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
                  <FormLabel className="text-sm font-medium">Objective / Function</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the objective or function" {...field} className="bg-background border-input"/>
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
                  <FormLabel className="text-sm font-medium">Notes Area</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your notes here..."
                      rows={6}
                      {...field}
                      className="bg-background border-input min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="default">
                {noteToEdit ? 'Save Changes' : 'Create Note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
