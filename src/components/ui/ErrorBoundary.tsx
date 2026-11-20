// Catches render errors so one broken view (a bad import, a malformed share link) shows a
// recoverable message instead of a blank page.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Itinera view crashed', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl border border-line bg-sunken text-bad">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-[18px] font-semibold">Something went wrong on this page</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            Your trips are safe in this browser. Try again, and if it keeps happening, export a backup from Settings.
          </p>
          <pre className="mt-4 max-h-24 overflow-auto rounded-lg bg-sunken p-3 text-left font-mono text-[11.5px] text-muted">{this.state.error.message}</pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13.5px] font-medium text-brand-ink transition-colors hover:bg-brand/90"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }
}
