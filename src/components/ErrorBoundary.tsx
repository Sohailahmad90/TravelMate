import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let parsedDetail: string | null = null;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error && parsed?.operationType) {
          parsedDetail = `Firestore ${parsed.operationType} on ${parsed.path || 'unknown path'}: ${parsed.error}`;
        }
      } catch {
        parsedDetail = null;
      }

      return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 shadow-lg rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-3 text-[#F97316]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold font-display text-slate-900">Something went wrong</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {parsedDetail || this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B5ED7] text-white font-semibold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload TravelMate
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
