import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Đã xảy ra lỗi</h1>
          <p style={{ color: '#6b7280', marginBottom: '24px', textAlign: 'center' }}>
            Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang.
          </p>
          {this.state.error && (
            <details style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Chi tiết lỗi (click để xem)
              </summary>
              <pre style={{
                overflow: 'auto',
                fontSize: '12px',
                color: '#dc2626',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}