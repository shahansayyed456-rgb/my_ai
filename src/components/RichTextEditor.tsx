import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Code, Save, Check } from 'lucide-react';
import clsx from 'clsx';

interface RichTextEditorProps {
  id: string;
  initialValue: string;
  onSave: (value: string) => void;
}

export function RichTextEditor({ id, initialValue, onSave }: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialValue);
  const [isSaved, setIsSaved] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  const handleFormatCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Simple naive code formatting using a background color
    // In a real robust editor, we'd wrap in <code>
    document.execCommand('backColor', false, '#f1f5f9');
    document.execCommand('fontName', false, 'monospace');
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    onSave(content);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!isEditing) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personal Notes</span>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            {content ? 'Edit Notes' : 'Add Note +'}
          </button>
        </div>
        {content ? (
          <div 
            className="text-sm text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-xs text-slate-400 italic">No notes added yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Edit Notes</span>
      </div>
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
        <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button onClick={() => handleCommand('bold')} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => handleCommand('italic')} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => handleCommand('underline')} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <button onClick={handleFormatCode} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" title="Code Format">
            <Code className="w-4 h-4" />
          </button>
        </div>
        <div 
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-3 min-h-[100px] text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
          dangerouslySetInnerHTML={{ __html: initialValue }}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button 
          onClick={() => {
            setIsEditing(false);
            setContent(initialValue);
          }}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className={clsx(
            "px-4 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5",
            isSaved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          {isSaved ? (
            <><Check className="w-3.5 h-3.5" /> Saved</>
          ) : (
            <><Save className="w-3.5 h-3.5" /> Save Notes</>
          )}
        </button>
      </div>
    </div>
  );
}
