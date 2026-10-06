import { create } from 'zustand';
import { Note, NoteFormat } from '../types';
import { loadNotesFromStorage, saveNotesToStorage } from '../utils/storage';

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  isSaving: boolean;
  lastSavedAt: number | null;
  
  // Actions
  initNotes: () => Promise<void>;
  setActiveNoteId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  createNote: (title?: string, content?: string) => Note;
  updateActiveNoteContent: (content: string) => void;
  updateActiveNoteTitle: (title: string) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  /** Cycles the active note's preview format: auto -> markdown -> html -> auto. */
  cycleActiveNoteFormat: () => void;
  getActiveNote: () => Note | null;
  getFilteredNotes: () => Note[];
  saveActiveNoteNow: () => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  searchQuery: '',
  isSaving: false,
  lastSavedAt: null,

  initNotes: async () => {
    const loadedNotes = await loadNotesFromStorage();
    set({
      notes: loadedNotes,
      activeNoteId: loadedNotes.length > 0 ? loadedNotes[0].id : null,
    });
  },

  setActiveNoteId: (id: string) => {
    set({ activeNoteId: id });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  createNote: (title?: string, content = '') => {
    const { notes } = get();
    const count = notes.length + 1;
    const noteTitle = title || `Untitled Note ${count}`;
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: noteTitle,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedNotes = [newNote, ...notes];
    set({
      notes: updatedNotes,
      activeNoteId: newNote.id,
      lastSavedAt: Date.now(),
    });

    saveNotesToStorage(updatedNotes);
    return newNote;
  },

  updateActiveNoteContent: (content: string) => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    set({ isSaving: true });

    // Derive auto-title from first line if default title
    const activeNote = notes.find((n) => n.id === activeNoteId);
    let title = activeNote?.title || 'Untitled Note';

    const firstLine = content.trim().split('\n')[0]?.replace(/^#+\s*/, '').trim();
    if (firstLine && title.startsWith('Untitled Note')) {
      title = firstLine.slice(0, 30);
    }

    const updatedNotes = notes.map((n) => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title,
          content,
          updatedAt: Date.now(),
        };
      }
      return n;
    });

    set({
      notes: updatedNotes,
      isSaving: false,
      lastSavedAt: Date.now(),
    });

    saveNotesToStorage(updatedNotes);
  },

  updateActiveNoteTitle: (title: string) => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    const updatedNotes = notes.map((n) => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: title || 'Untitled Note',
          updatedAt: Date.now(),
        };
      }
      return n;
    });

    set({ notes: updatedNotes, lastSavedAt: Date.now() });
    saveNotesToStorage(updatedNotes);
  },

  deleteNote: (id: string) => {
    const { notes, activeNoteId } = get();
    const updatedNotes = notes.filter((n) => n.id !== id);

    let newActiveId = activeNoteId;
    if (activeNoteId === id) {
      newActiveId = updatedNotes.length > 0 ? updatedNotes[0].id : null;
    }

    set({
      notes: updatedNotes,
      activeNoteId: newActiveId,
      lastSavedAt: Date.now(),
    });

    saveNotesToStorage(updatedNotes);
  },

  togglePinNote: (id: string) => {
    const { notes } = get();
    const updatedNotes = notes.map((n) => {
      if (n.id === id) {
        return { ...n, pinned: !n.pinned };
      }
      return n;
    });

    set({ notes: updatedNotes });
    saveNotesToStorage(updatedNotes);
  },

  cycleActiveNoteFormat: () => {
    const { notes, activeNoteId } = get();
    if (!activeNoteId) return;

    const updatedNotes = notes.map((n) => {
      if (n.id !== activeNoteId) return n;
      // undefined = auto-detect; explicit values pin the format.
      const nextFormat: NoteFormat | undefined =
        n.format === undefined ? 'markdown' : n.format === 'markdown' ? 'html' : undefined;
      return { ...n, format: nextFormat };
    });

    set({ notes: updatedNotes, lastSavedAt: Date.now() });
    saveNotesToStorage(updatedNotes);
  },

  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((n) => n.id === activeNoteId) || null;
  },

  getFilteredNotes: () => {
    const { notes, searchQuery } = get();
    if (!searchQuery.trim()) {
      // Sort pinned first, then by updatedAt desc
      return [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
    }

    const q = searchQuery.toLowerCase();
    return notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  saveActiveNoteNow: async () => {
    const { notes } = get();
    set({ isSaving: true });
    await saveNotesToStorage(notes);
    set({ isSaving: false, lastSavedAt: Date.now() });
  },
}));
