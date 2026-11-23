import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-6 text-2xl font-black">
            !
          </div>
          <h1 className="text-2xl font-bold mb-2">Terjadi Sedikit Kendala Memuat Tampilan</h1>
          <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            Sistem MedikaCheck mendeteksi error pada rendering browser. Klik tombol di bawah untuk menyegarkan sesi Anda kembali ke halaman utama.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Reset Sesi & Masuk Ulang
            </button>
          </div>
          {this.state.error && (
            <pre className="mt-8 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-rose-300/80 max-w-xl text-left overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
