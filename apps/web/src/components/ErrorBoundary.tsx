import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #fef3e2, #fce4d6)',
          padding: 20, textAlign: 'center', zIndex: 9999,
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>😢</div>
          <h2 style={{ color: '#8b4513', marginBottom: 8 }}>场景加载遇到问题</h2>
          <p style={{ color: '#8b6914', marginBottom: 16, maxWidth: 320 }}>
            {this.state.error?.message || '3D场景加载失败，请刷新页面重试。如果问题持续，请尝试使用其他浏览器或设备。'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px', fontSize: '1rem', fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff8fab, #ff6b9d)', color: 'white',
              border: 'none', borderRadius: 50, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,157,0.4)',
            }}
          >
            🔄 刷新重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
