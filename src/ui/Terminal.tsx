import { useEffect, useRef, useState } from 'react';
import { TerminalEntry } from '../types';

type TerminalProps = {
  log: TerminalEntry[];
  onSubmit: (input: string) => void;
  isProcessing: boolean;
};

export default function Terminal({ log, onSubmit, isProcessing }: TerminalProps) {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [glitching, setGlitching] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  // Trigger glitch on error entries
  useEffect(() => {
    const lastEntry = log[log.length - 1];
    if (lastEntry?.type === 'error') {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 300);
    }
  }, [log]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    setInput('');
  };

  return (
    <div
      className={`terminal ${glitching ? 'terminal-glitch' : ''}`}
      ref={terminalRef}
    >
      <div className="terminal-log">
        {log.map((entry) => (
          <div key={entry.id} className={`terminal-entry ${entry.type}`}>
            {entry.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
      <form className="terminal-input-area" onSubmit={handleSubmit}>
        <span>&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isProcessing ? 'AI sedang berpikir...' : 'ketik prompt...'}
          disabled={isProcessing}
          autoFocus
        />
      </form>
    </div>
  );
}
