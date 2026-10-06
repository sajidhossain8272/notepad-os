import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { parseMarkdownToHtml } from '../utils/markdown';
import {
  resolvePreviewFormat,
  buildHtmlPreviewSrcDoc,
  injectPreviewScrollBridge,
} from '../utils/preview';

interface EditorProps {
  onCursorChange?: (line: number, col: number) => void;
}

/**
 * Debounces rapid edits so the HTML preview iframe (and its scripts) only
 * reloads after typing pauses, instead of on every keystroke.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export const Editor: React.FC<EditorProps> = ({ onCursorChange }) => {
  const { getActiveNote, updateActiveNoteContent, updateActiveNoteTitle, cycleActiveNoteFormat } = useNotesStore();
  const { settings } = useSettingsStore();

  const activeNote = getActiveNote();
  const previewFormat = activeNote ? resolvePreviewFormat(activeNote) : 'markdown';

  const extensions = useMemo(() => {
    return [
      previewFormat === 'html' ? html() : markdown({ base: markdownLanguage }),
    ];
  }, [previewFormat]);

  // The preview iframe cannot inherit the app's CSS variables, so we read the
  // active theme's editor colors and inject them into the HTML preview shell.
  const previewPalette = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      text: styles.getPropertyValue('--editor-text').trim(),
      background: styles.getPropertyValue('--editor-bg').trim(),
    };
  }, [settings.theme]);

  const debouncedContent = useDebouncedValue(activeNote?.content ?? '', 500);

  const htmlSrcDoc = useMemo(
    () => injectPreviewScrollBridge(buildHtmlPreviewSrcDoc(debouncedContent, previewPalette)),
    [debouncedContent, previewPalette]
  );

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--editor-bg)] text-[var(--editor-text)] opacity-60 text-xs italic">
        Select a note or create a new one to start writing.
      </div>
    );
  }

  const parsedHtml = previewFormat === 'markdown' ? parseMarkdownToHtml(activeNote.content) : '';

  // Dynamic font class
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'monospace':
        return 'font-monospace';
      case 'terminal':
        return 'font-terminal';
      case 'win95':
      default:
        return 'font-win95';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--editor-bg)] text-[var(--editor-text)]">
      {/* TITLE EDIT HEADER */}
      <div className="p-2 border-b border-[var(--border-dark)] bg-[var(--panel-bg)] flex items-center gap-2">
        <span className="text-xs font-bold opacity-75">Title:</span>
        <input
          type="text"
          value={activeNote.title}
          onChange={(e) => updateActiveNoteTitle(e.target.value)}
          placeholder="Note title..."
          className="flex-1 px-2 py-0.5 text-xs bg-[var(--editor-bg)] text-[var(--editor-text)] win95-inset focus:outline-none font-bold"
        />
      </div>

      {/* MAIN WRITING AREA (SPLIT OR SINGLE) */}
      <div className="flex-1 flex overflow-hidden">
        {/* CODEMIRROR EDITOR */}
        <div
          className={`flex-1 h-full overflow-auto ${getFontFamilyClass()}`}
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          <CodeMirror
            value={activeNote.content}
            height="100%"
            extensions={extensions}
            onChange={(value) => updateActiveNoteContent(value)}
            onUpdate={(viewUpdate) => {
              if (onCursorChange) {
                const head = viewUpdate.state.selection.main.head;
                const line = viewUpdate.state.doc.lineAt(head);
                const col = head - line.from + 1;
                onCursorChange(line.number, col);
              }
            }}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              foldGutter: false,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: false,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: previewFormat === 'html',
              rectangularSelection: true,
              crosshairCursor: false,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: false,
              completionKeymap: previewFormat === 'html',
              lintKeymap: false,
            }}
            theme="none"
          />
        </div>

        {/* LIVE PREVIEW PANE (MARKDOWN OR HTML) */}
        {settings.showPreview && (
          <div className="flex-1 flex flex-col border-l border-[var(--border-dark)] bg-[var(--editor-bg)] text-[var(--editor-text)] p-4 overflow-y-auto win95-inset">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 border-b border-gray-300 pb-1 flex justify-between items-center select-none shrink-0">
              <span>{previewFormat === 'html' ? 'HTML Live Preview' : 'Markdown Live Preview'}</span>
              <button
                type="button"
                onClick={cycleActiveNoteFormat}
                title="Preview format: click to cycle Auto → Markdown → HTML (saved with this note)"
                className="font-mono opacity-60 hover:opacity-100 underline decoration-dotted cursor-pointer"
              >
                {activeNote.format
                  ? previewFormat === 'html' ? 'HTML' : 'Markdown'
                  : `Auto · ${previewFormat === 'html' ? 'HTML' : 'Markdown'}`}
              </button>
            </div>
            {previewFormat === 'html' ? (
              activeNote.content.trim() ? (
                <iframe
                  title="HTML Live Preview"
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer"
                  srcDoc={htmlSrcDoc}
                  style={{ backgroundColor: previewPalette.background }}
                  className="flex-1 min-h-0 w-full border-0"
                />
              ) : (
                <p className="text-xs opacity-50 italic">Empty note...</p>
              )
            ) : (
              <div
                className="prose max-w-none text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
