import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rock N Roll App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          background: '#121212',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            🎵 Rock 'N Roll App
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 400, marginBottom: 20 }}>
            {this.state.error?.message || 'Something went wrong while loading.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#1db954',
              color: '#000',
              fontWeight: 800,
              padding: '12px 24px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reload Application 🔄
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
