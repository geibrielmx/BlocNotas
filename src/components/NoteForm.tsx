
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
    if (isOpen) { // Reset form only when dialog opens or noteToEdit changes
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
    // form.reset(); // Resetting is handled by useEffect now
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Optionally reset form on close if not submitted, though useEffect handles open.
      // form.reset(); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground shadow-xl rounded-lg border border-border/90">
        <DialogHeader className="pb-3 pt-2 px-1">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {noteToEdit ? <Edit className="h-5 w-5 text-primary" /> : <FilePenLine className="h-5 w-5 text-primary" />}
            {noteToEdit ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
          <DialogDescription className="text-sm pt-0.5">
            {noteToEdit ? 'Modify the details of your existing note.' : 'Fill in the details to create a new note.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/90">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Marketing Campaign Q3 Ideas" {...field} className="bg-input border-border focus:border-primary h-10 text-sm"/>
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
                  <FormLabel className="text-sm font-medium text-foreground/90">Objective / Function</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Brainstorm key strategies and deliverables" {...field} className="bg-input border-border focus:border-primary h-10 text-sm"/>
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
                  <FormLabel className="text-sm font-medium text-foreground/90">Notes Area</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jot down your thoughts, details, code snippets, and any relevant information..."
                      rows={6}
                      {...field}
                      className="bg-input border-border focus:border-primary min-h-[120px] text-sm leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="default">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="default" size="default">
                {noteToEdit ? 'Save Changes' : 'Create Note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
