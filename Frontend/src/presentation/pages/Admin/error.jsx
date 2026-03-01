import React, { useState } from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BooksManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h2>Erreur dans BooksManagement</h2>
          <pre>{this.state.error?.toString()}</pre>
          <p><strong>Stack:</strong></p>
          <pre style={{ fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const BooksManagement = () => {
  // ...existing code...
};

export default () => (
  <ErrorBoundary>
    <BooksManagement />
  </ErrorBoundary>
);