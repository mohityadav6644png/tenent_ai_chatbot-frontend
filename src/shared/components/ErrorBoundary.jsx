import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error in Component Tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#0f172a' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              An unexpected error occurred while loading this view. Please try reloading the page.
            </p>
            {this.state.error && (
              <details style={{ textAlign: 'left', margin: '1rem 0' }}>
                <summary style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Error details
                </summary>
                <pre style={{ background: '#f1f5f9', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.75rem', maxHeight: '180px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#0f766e',
                color: '#ffffff',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
