import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { ThemeMode } from '../types';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  previewBg: string;
  previewHeader: string;
  previewText: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'windows-95',
    name: 'Windows 95',
    description: 'Classic teal background & gray 3D bevel borders.',
    previewBg: '#c0c0c0',
    previewHeader: '#000080',
    previewText: '#000000',
  },
  {
    id: 'windows-xp',
    name: 'Windows XP',
    description: 'Luna blue titlebar with smooth retro feel.',
    previewBg: '#ece9d8',
    previewHeader: '#0058e6',
    previewText: '#000000',
  },
  {
    id: 'terminal-green',
    name: 'Terminal Green',
    description: 'Retro CRT monitor phosphor green on black with scanlines.',
    previewBg: '#050a05',
    previewHeader: '#003311',
    previewText: '#00ff66',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Clean monochrome high contrast mode for crisp writing.',
    previewBg: '#ffffff',
    previewHeader: '#e9ecef',
    previewText: '#212529',
  },
];

export const ThemeSelector: React.FC = () => {
  const { settings, setTheme } = useSettingsStore();

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold block mb-1">Select Theme Palette:</label>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const isSelected = settings.theme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`p-2.5 text-left border transition-all ${
                isSelected
                  ? 'win95-pressed ring-2 ring-blue-600 font-bold'
                  : 'win95-outset hover:bg-black/5'
              }`}
            >
              {/* Theme Mini Card Preview */}
              <div
                className="h-10 w-full mb-2 rounded-sm border border-gray-400 overflow-hidden flex flex-col shadow-inner"
                style={{ backgroundColor: theme.previewBg }}
              >
                <div
                  className="h-3 w-full px-1 flex items-center justify-between text-[8px] font-bold text-white"
                  style={{ backgroundColor: theme.previewHeader }}
                >
                  <span>{theme.name}</span>
                  <span>✕</span>
                </div>
                <div className="p-1 text-[9px] font-mono" style={{ color: theme.previewText }}>
                  Abc 123
                </div>
              </div>

              {/* Title & Description */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{theme.name}</span>
                {isSelected && <span className="text-[10px] text-blue-700 font-bold">● Active</span>}
              </div>
              <p className="text-[10px] opacity-75 mt-0.5 leading-tight">{theme.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
