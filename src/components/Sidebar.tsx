import React from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatDate } from '../utils/markdown';
import { Plus, Search, Pin, Trash2, FileText } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeNoteId,
    searchQuery,
    setActiveNoteId,
    setSearchQuery,
    createNote,
    deleteNote,
    togglePinNote,
    getFilteredNotes,
    notes,
  } = useNotesStore();

  const { isSidebarOpen } = useSettingsStore();

  if (!isSidebarOpen) return null;

  const filteredNotes = getFilteredNotes();

  return (
    <aside className="w-64 flex-shrink-0 bg-[var(--panel-bg)] border-r border-[var(--border-dark)] flex flex-col h-full select-none">
      {/* SIDEBAR HEADER / NEW NOTE BUTTON */}
      <div className="p-2 border-b border-[var(--border-dark)] space-y-2">
        <button
          onClick={() => createNote()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--panel-bg)] win95-outset hover:bg-gray-200 active:win95-pressed transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-blue-700" />
          <span>+ New Note</span>
        </button>

        {/* SEARCH INPUT */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-2 py-1 pl-7 text-xs bg-[var(--editor-bg)] text-[var(--editor-text)] win95-inset focus:outline-none placeholder-gray-500"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1 text-xs text-gray-500 hover:text-black font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* NOTES LIST */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-xs opacity-60 italic">
            {searchQuery ? 'No matching notes found' : 'No notes yet. Click "+ New Note"'}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const snippet = note.content
              .replace(/#+\s+/g, '')
              .replace(/[*_`]/g, '')
              .trim()
              .slice(0, 45);

            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`group relative p-2 text-xs border cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[var(--active-item-bg)] text-[var(--active-item-text)] border-[var(--border-darkest)] font-semibold'
                    : 'bg-[var(--panel-bg)] hover:bg-black/5 text-[var(--text-main)] border-transparent hover:border-[var(--border-dark)]'
                }`}
              >
                {/* Note Header */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <FileText className="w-3 h-3 flex-shrink-0 opacity-75" />
                    <span className="truncate text-xs">{note.title || 'Untitled Note'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinNote(note.id);
                      }}
                      title={note.pinned ? 'Unpin' : 'Pin note'}
                      className={`p-0.5 rounded hover:bg-black/10 ${note.pinned ? 'text-amber-500 font-bold' : ''}`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>

                    {notes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete note "${note.title}"?`)) {
                            deleteNote(note.id);
                          }
                        }}
                        title="Delete note"
                        className="p-0.5 rounded hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Snippet preview */}
                <p className="text-[11px] opacity-75 truncate line-clamp-1 font-normal">
                  {snippet || 'Empty note...'}
                </p>

                {/* Footer date & pin badge */}
                <div className="mt-1 flex items-center justify-between text-[10px] opacity-60 font-mono">
                  <span>{formatDate(note.updatedAt)}</span>
                  {note.pinned && <span className="text-amber-600 font-bold">★ PINNED</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER COUNTER */}
      <div className="p-1.5 border-t border-[var(--border-dark)] text-[10px] text-center font-mono opacity-70 bg-[var(--panel-bg)]">
        {notes.length} {notes.length === 1 ? 'Note' : 'Notes'} total
      </div>
    </aside>
  );
};
