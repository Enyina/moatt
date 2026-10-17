import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center p-8 z-50 text-white font-mono text-sm overflow-auto">
          <h2 className="text-xl font-bold mb-4 text-red-400">3D Renderer Crashed</h2>
          <pre className="bg-black/50 p-4 rounded text-red-200 whitespace-pre-wrap">{this.state.error?.message}</pre>
          <pre className="mt-4 bg-black/50 p-4 rounded text-red-200/50 text-xs whitespace-pre-wrap">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
