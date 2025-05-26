
// src/components/NoteTable.tsx
"use client";

import type { Note } from '@/types';
import { useNotes } from '@/contexts/NoteContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit3, Trash2, Pin, PinOff, ArrowUpDown, SearchX, Inbox, ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface NoteTableProps {
  onEditNote: (note: Note) => void;
}

type SortableKey = 'title' | 'objective' | 'createdAt' | 'isPinned';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortableKey;
  direction: SortDirection;
}

export function NoteTable({ onEditNote }: NoteTableProps) {
  const { notes, deleteMultipleNotes, togglePinMultipleNotes } = useNotes();
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [tableFilter, setTableFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const filteredAndSortedNotes = useMemo(() => {
    let itemsToProcess = [...notes];
    const currentTableFilter = tableFilter.trim().toLowerCase();

    if (currentTableFilter !== '') {
      itemsToProcess = itemsToProcess.filter(note => 
        note.title.toLowerCase().includes(currentTableFilter) ||
        note.objective.toLowerCase().includes(currentTableFilter) ||
        note.notesArea.toLowerCase().includes(currentTableFilter) ||
        note.id.toLowerCase().includes(currentTableFilter)
      );
    }
    
    if (sortConfig !== null) {
      itemsToProcess.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'isPinned') {
          valA = valA ? 1 : 0;
          valB = valB ? 1 : 0;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        if (sortConfig.key !== 'createdAt') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
    } else { 
        itemsToProcess.sort((a,b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    return itemsToProcess;
  }, [notes, tableFilter, sortConfig]);


  const handleSelectRow = (noteId: string) => {
    setSelectedRowIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(noteId)) {
        newSelection.delete(noteId);
      } else {
        newSelection.add(noteId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRowIds(new Set(filteredAndSortedNotes.map(n => n.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };
  
  useEffect(() => { 
    const currentVisibleIds = new Set(filteredAndSortedNotes.map(n => n.id));
    setSelectedRowIds(prev => new Set([...prev].filter(id => currentVisibleIds.has(id))));
  }, [tableFilter, notes, sortConfig, filteredAndSortedNotes]);


  const requestSort = (key: SortableKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4 text-primary" /> : 
      <ChevronDown className="ml-1 h-4 w-4 text-primary" />;
  };

  const selectedNotesArray = Array.from(selectedRowIds);
  const canPinSelection = selectedNotesArray.length > 0 && selectedNotesArray.some(id => !notes.find(n=>n.id===id)?.isPinned);
  const canUnpinSelection = selectedNotesArray.length > 0 && selectedNotesArray.some(id => notes.find(n=>n.id===id)?.isPinned);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 md:p-12 bg-card border border-border/60 rounded-xl shadow-sm">
        <Inbox className="h-20 w-20 text-primary/70 mb-6 opacity-80" strokeWidth={1.2}/>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">No Hay Notas en la Tabla</h2>
        <p className="text-muted-foreground max-w-sm text-sm md:text-base mb-6">
          Aún no has creado ninguna nota. ¡Haz clic en "Añadir Nota" para empezar!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-1">
        <Input
          placeholder="Filtrar notas en la tabla..."
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="max-w-xs h-9 text-sm bg-input"
        />
        {selectedRowIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                  const noteToEdit = notes.find(n => n.id === selectedNotesArray[0]);
                  if (noteToEdit) onEditNote(noteToEdit);
                }
              }
              disabled={selectedRowIds.size !== 1}
              className="h-9"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={selectedRowIds.size === 0} className="h-9">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar ({selectedRowIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán {selectedRowIds.size} nota(s) permanentemente. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { deleteMultipleNotes(selectedNotesArray); setSelectedRowIds(new Set()); }}
                   className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => togglePinMultipleNotes(selectedNotesArray, true)}
              disabled={!canPinSelection}
              className="h-9"
            >
              <Pin className="mr-1.5 h-3.5 w-3.5" /> Fijar
            </Button>
             <Button 
              size="sm" 
              variant="outline" 
              onClick={() => togglePinMultipleNotes(selectedNotesArray, false)}
              disabled={!canUnpinSelection}
              className="h-9"
            >
              <PinOff className="mr-1.5 h-3.5 w-3.5" /> Desfijar
            </Button>
          </div>
        )}
      </div>

      {filteredAndSortedNotes.length === 0 && tableFilter.trim() !== '' && (
        <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-card border border-border/60 rounded-xl shadow-sm mt-6">
            <SearchX className="h-16 w-16 text-destructive/80 mb-5 opacity-80" strokeWidth={1.2} />
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">No se Encontraron Notas en la Tabla</h2>
            <p className="text-muted-foreground max-w-xs text-sm md:text-base">
            Ninguna nota coincide con tu filtro: "{tableFilter}".
            </p>
        </div>
      )}

      {filteredAndSortedNotes.length > 0 && (
        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] px-3">
                  <Checkbox
                    checked={selectedRowIds.size === filteredAndSortedNotes.length && filteredAndSortedNotes.length > 0 ? true : selectedRowIds.size > 0 ? "indeterminate" : false}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todas las filas"
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors w-[60px] px-2 text-center" onClick={() => requestSort('isPinned')}>
                  <div className="flex items-center justify-center">Fijado {getSortIcon('isPinned')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors min-w-[200px]" onClick={() => requestSort('title')}>
                  <div className="flex items-center">Título {getSortIcon('title')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors min-w-[250px]" onClick={() => requestSort('objective')}>
                   <div className="flex items-center">Objetivo {getSortIcon('objective')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors min-w-[150px]" onClick={() => requestSort('createdAt')}>
                   <div className="flex items-center">Creado {getSortIcon('createdAt')}</div>
                </TableHead>
                <TableHead className="w-[100px] text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedNotes.map((note) => (
                <TableRow
                  key={note.id}
                  data-state={selectedRowIds.has(note.id) && "selected"}
                  className="note-table-row hover:bg-muted/30 data-[state=selected]:bg-primary/10"
                >
                  <TableCell className="px-3">
                    <Checkbox
                      checked={selectedRowIds.has(note.id)}
                      onCheckedChange={() => handleSelectRow(note.id)}
                      aria-label={`Seleccionar fila ${note.title}`}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    {note.isPinned ? <Pin className="h-4 w-4 text-primary inline-block" /> : <PinOff className="h-4 w-4 text-muted-foreground/50 inline-block" />}
                  </TableCell>
                  <TableCell 
                    className="font-medium truncate max-w-[250px] cursor-pointer hover:text-primary hover:underline" 
                    title={`Editar: ${note.title}`}
                    onClick={() => onEditNote(note)}
                  >
                    {note.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[300px]" title={note.objective}>{note.objective}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {format(parseISO(note.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button variant="ghost" size="icon" onClick={() => onEditNote(note)} className="h-8 w-8 hover:bg-accent hover:text-accent-foreground" title="Editar Nota">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
