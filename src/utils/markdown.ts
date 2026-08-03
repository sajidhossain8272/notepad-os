import { EditorStats } from '../types';

/**
 * Calculates word count, character count, and line count for text.
 */
export function calculateStats(text: string, cursorLine = 1, cursorCol = 1): EditorStats {
  if (!text) {
    return {
      words: 0,
      characters: 0,
      lines: 1,
      cursorLine,
      cursorCol,
    };
  }

  const characters = text.length;
  const lines = text.split('\n').length;
  
  // Clean whitespace to count words accurately
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  return {
    words,
    characters,
    lines,
    cursorLine,
    cursorCol,
  };
}

/**
 * Formats timestamps into classic readable locale dates.
 */
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parses markdown into simple sanitized HTML for live preview pane.
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '<p class="opacity-50 italic">Empty note...</p>';

  let html = markdown
    // Escape HTML characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/10 dark:bg-black/40 p-3 my-2 font-mono text-xs border border-gray-400 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-black/40 px-1 py-0.5 font-mono text-xs border border-gray-300">$1</code>')
    // Headings
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold my-2 border-b border-gray-400 pb-1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold my-2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold my-1">$1</h3>')
    // Bold & Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Blockquotes
    .replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-gray-500 pl-3 py-1 my-2 italic opacity-90">$1</blockquote>')
    // Horizontal Rule
    .replace(/^---$/gim, '<hr class="my-3 border-t border-gray-400" />')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    // Checkbox items
    .replace(/^\[x\] (.*$)/gim, '<div class="flex items-center gap-2"><input type="checkbox" checked disabled /> <span>$1</span></div>')
    .replace(/^\[ \] (.*$)/gim, '<div class="flex items-center gap-2"><input type="checkbox" disabled /> <span>$1</span></div>')
    // Line breaks
    .replace(/\n/g, '<br />');

  return html;
}
