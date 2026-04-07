import { useState, useRef, useEffect } from 'react';
import { VARIABLE_SUGGESTIONS, VariableSuggestion } from '../../../types/apiIntegration';

interface VariableInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  label?: string;
}

const NAMESPACE_COLORS: Record<string, string> = {
  journey:     'text-blue-600 bg-blue-50',
  session:     'text-purple-600 bg-purple-50',
  system:      'text-orange-600 bg-orange-50',
  credentials: 'text-red-600 bg-red-50',
  env:         'text-teal-600 bg-teal-50',
  block:       'text-green-600 bg-green-50',
};

export function VariableInput({
  value,
  onChange,
  placeholder,
  className = '',
  multiline = false,
  rows = 3,
  label,
}: VariableInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? VARIABLE_SUGGESTIONS.filter(
        (s) =>
          s.path.toLowerCase().includes(query.toLowerCase()) ||
          s.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : VARIABLE_SUGGESTIONS.slice(0, 12);

  const grouped = filtered.reduce<Record<string, VariableSuggestion[]>>((acc, s) => {
    if (!acc[s.namespace]) acc[s.namespace] = [];
    acc[s.namespace].push(s);
    return acc;
  }, {});

  const handleInput = (val: string, pos: number) => {
    onChange(val);
    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/\{\{([^}]*)$/);
    if (match) {
      setQuery(match[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setQuery('');
    }
    setCursorPos(pos);
  };

  const insertVariable = (suggestion: VariableSuggestion) => {
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    // Find the opening {{ before cursor
    const openIdx = textBefore.lastIndexOf('{{');
    const newText =
      textBefore.slice(0, openIdx) +
      `{{${suggestion.path}}}` +
      textAfter;
    onChange(newText);
    setShowSuggestions(false);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sharedClass = `w-full text-xs border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 font-mono ${className}`;

  return (
    <div className="relative w-full">
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}

      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          rows={rows}
          placeholder={placeholder}
          className={sharedClass + ' resize-y'}
          onChange={(e) => handleInput(e.target.value, e.target.selectionStart ?? 0)}
          onKeyUp={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
          onClick={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          placeholder={placeholder}
          className={sharedClass}
          onChange={(e) => handleInput(e.target.value, e.target.selectionStart ?? 0)}
          onKeyUp={(e) => setCursorPos((e.target as HTMLInputElement).selectionStart ?? 0)}
          onClick={(e) => setCursorPos((e.target as HTMLInputElement).selectionStart ?? 0)}
        />
      )}

      {/* Hint */}
      <p className="text-[10px] text-gray-400 mt-0.5">
        Type <code className="bg-gray-100 px-1 rounded text-gray-500">{'{{'}</code> to insert a variable
      </p>

      {/* Dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Variables</span>
            {query && <span className="text-[10px] text-gray-400">matching "{query}"</span>}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(grouped).map(([ns, suggestions]) => (
              <div key={ns}>
                <div className="px-3 py-1 bg-gray-50/80 sticky top-0">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${NAMESPACE_COLORS[ns] ?? 'text-gray-500 bg-gray-100'}`}>
                    {ns}
                  </span>
                </div>
                {suggestions.map((s) => (
                  <button
                    key={s.path}
                    onMouseDown={(e) => { e.preventDefault(); insertVariable(s); }}
                    className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800 group-hover:text-teal-700">
                        {s.label}
                      </span>
                      {s.example && (
                        <span className="text-[10px] text-gray-400 font-mono">{s.example}</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 group-hover:text-teal-500 mt-0.5">
                      {`{{${s.path}}}`}
                    </div>
                    {s.description && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{s.description}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
