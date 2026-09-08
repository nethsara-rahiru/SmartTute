import React from 'react';
import PropTypes from 'prop-types';

class LatexError extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Invalid LaTeX syntax' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('KaTeX Error Boundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.latex !== this.props.latex && this.state.hasError) {
      this.setState({ hasError: false, errorMsg: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <span
          className="latex-error-badge"
          style={{
            color: 'var(--color-danger, #ef4444)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85em',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-block'
          }}
          title={this.state.errorMsg}
        >
          ⚠️ [LaTeX Error: {this.props.latex}]
        </span>
      );
    }

    return this.props.children;
  }
}

LatexError.propTypes = {
  latex: PropTypes.string,
  children: PropTypes.node
};

export default LatexError;
