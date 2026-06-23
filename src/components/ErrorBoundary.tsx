import { Component, type ErrorInfo, type ReactNode } from 'react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-2xl text-red-800">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <pre className="text-sm whitespace-pre-wrap overflow-auto">
            {this.state.error?.message}
          </pre>
          <pre className="text-xs text-red-500 mt-4 whitespace-pre-wrap overflow-auto">
            {this.state.error?.stack}
          </pre>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
