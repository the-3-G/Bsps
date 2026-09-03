'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, you could log this to an error reporting service
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="p-4 bg-red-50 rounded-full">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Something went wrong</h2>
          <p className="text-xs text-gray-500 max-w-md">
            An unexpected error occurred while rendering this section. Please try refreshing or contact support if the issue persists.
          </p>
          {this.state.error && (
            <pre className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded p-2 max-w-md overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-4 py-2 rounded transition-all shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
