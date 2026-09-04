import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080d1a',
          color: '#e8edf8',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '36px 40px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: '#ffffff' }}>
              Dashboard View Exception
            </h2>
            <p style={{ fontSize: '13.5px', color: '#8899bb', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              An unexpected display issue occurred in this panel. We have prevented the app from crashing.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#f43f5e',
                fontSize: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '24px',
                wordBreak: 'break-word',
                textAlign: 'left',
                fontFamily: 'monospace'
              }}>
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                transition: 'transform 0.15s ease'
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
