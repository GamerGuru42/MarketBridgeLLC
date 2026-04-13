'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#050505', color: 'white', padding: '40px', fontFamily: 'inherit', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#FF6200', margin: '0 auto 24px' }}></div>
              <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.05em', fontStyle: 'italic', marginBottom: '16px' }}>Network <span style={{ color: '#FF6200' }}>Anomaly</span></h1>
              <p style={{ fontSize: '14px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '40px' }}>Systems encountered an unexpected exception.</p>
              
              {process.env.NODE_ENV === 'development' && (
                <div style={{ textAlign: 'left', background: '#111', padding: '24px', borderRadius: '16px', border: '1px solid #333', overflow: 'auto' }}>
                    <h2 style={{ fontSize: '14px', color: '#ff4444', marginBottom: '12px', fontWeight: 'bold' }}>{this.state.error?.toString()}</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>
                        {this.state.error?.stack}
                    </pre>
                </div>
              )}

              <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: '40px', background: '#FF6200', color: 'black', border: 'none', padding: '16px 32px', borderRadius: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', fontSize: '12px' }}
              >
                Reinitialize Node
              </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
