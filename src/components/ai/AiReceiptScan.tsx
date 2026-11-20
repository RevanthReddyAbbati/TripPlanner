import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ScanLine, X } from 'lucide-react';
import { readReceipt, type ReceiptResult } from '../../services/ai/provider';
import { AIError } from '../../services/ai/gemini';
import { useAIReady } from '../../store/ai';
import { AIBadge, AIConnectHint } from './AIConnectHint';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

/** "Scan receipt" for the expense form: reads a bill or UPI screenshot with Gemini. */
export function AiReceiptScan({ onResult }: { onResult: (r: ReceiptResult) => void }) {
  const ready = useAIReady();
  const input = useRef<HTMLInputElement>(null);
  const ctrl = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => () => ctrl.current?.abort(), []);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  if (!ready) return <AIConnectHint compact what="receipt scanning" />;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setPreview(URL.createObjectURL(file));
    setStatus('reading');
    setError('');
    try {
      const r = await readReceipt(file, c.signal);
      if (c.signal.aborted) return;
      onResult(r);
      setStatus('done');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof AIError || e instanceof Error ? e.message : 'Could not read that receipt.');
      setStatus('error');
    }
  };

  const reset = () => {
    ctrl.current?.abort();
    setPreview(null);
    setStatus('idle');
    setError('');
    if (input.current) input.current.value = '';
  };

  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-sunken/40 p-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-3">
        {preview ? (
          <img src={preview} alt="Receipt preview" className="h-12 w-12 shrink-0 rounded-md border border-line object-cover" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-surface text-muted">
            <ScanLine className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1 text-[13px]">
          {status === 'idle' && (
            <>
              <div className="flex items-center gap-2 font-medium">
                Scan a bill or UPI screenshot <AIBadge />
              </div>
              <div className="text-[12px] text-muted">The photo is sent only to Gemini to read it, and is not stored.</div>
            </>
          )}
          {status === 'reading' && (
            <div className="flex items-center gap-2 text-ink-2">
              <Spinner className="h-4 w-4" /> Reading receipt…
            </div>
          )}
          {status === 'done' && (
            <div className="flex items-center gap-1.5 font-medium text-ok">
              <CheckCircle2 className="h-4 w-4" /> Filled from receipt. Check the details.
            </div>
          )}
          {status === 'error' && <div className="font-medium text-bad">{error}</div>}
        </div>
        {status === 'idle' || status === 'error' ? (
          <Button size="sm" variant="secondary" icon={<ScanLine className="h-4 w-4" />} onClick={() => input.current?.click()}>
            {status === 'error' ? 'Try again' : 'Scan receipt'}
          </Button>
        ) : (
          <button type="button" aria-label="Clear receipt" onClick={reset} className="rounded-md p-1 text-muted hover:bg-sunken hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
