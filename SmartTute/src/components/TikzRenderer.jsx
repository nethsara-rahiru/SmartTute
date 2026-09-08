import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Wraps bare tikzpicture code in a minimal LaTeX document for QuickLaTeX submission.
 */
function buildLatexDocument(tikzCode) {
  // If already a full document, pass through
  if (tikzCode.includes('\\documentclass')) return tikzCode;

  // Determine if tikz environment tags are already included
  const hasTikzpicture =
    tikzCode.includes('\\begin{tikzpicture}') && tikzCode.includes('\\end{tikzpicture}');

  const body = hasTikzpicture
    ? `\\begin{center}\n${tikzCode}\n\\end{center}`
    : `\\begin{center}\n\\begin{tikzpicture}\n${tikzCode}\n\\end{tikzpicture}\n\\end{center}`;

  return `\\documentclass[12pt]{article}
\\usepackage{tikz}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\pagestyle{empty}
\\begin{document}
${body}
\\end{document}`;
}

/**
 * Renders TikZ code using the QuickLaTeX public API via Vite dev proxy.
 * Returns an image URL on success or throws on failure.
 */
async function renderViaQuickLaTeX(latexDoc) {
  const params = new URLSearchParams({
    formula: latexDoc,
    fsize: '17px',
    fcolor: '000000',
    mode: 0,
    out: 1,
    remhost: 'quicklatex.com',
    preamble: '\\usepackage{tikz}\\usepackage{amsmath}',
    rnd: Math.random().toFixed(10),
  });

  // Use the Vite proxy path to avoid browser CORS restrictions.
  const response = await fetch('/api/quicklatex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) throw new Error(`QuickLaTeX HTTP ${response.status}`);

  const text = await response.text();

  // Response format: "0 <imageUrl> <width> <height>\n" on success
  // or "1\n<error message>" on failure
  const lines = text.trim().split('\n');

  if (lines[0].startsWith('0 ')) {
    // Parse: "0 https://... width height"
    const parts = lines[0].split(' ');
    const imageUrl = parts[1];
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error('QuickLaTeX returned unexpected response format');
    }
    return imageUrl;
  }

  // Status 1 = error, rest of lines contain the error message
  const errorMsg = lines.slice(1).join('\n').trim() || 'LaTeX compilation error';
  throw new Error(errorMsg);
}

export function TikzRenderer({ tikzCode }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!tikzCode?.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const latexDoc = buildLatexDocument(tikzCode);

    renderViaQuickLaTeX(latexDoc)
      .then((url) => {
        if (!controller.signal.aborted) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err?.message || 'TikZ rendering failed');
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [tikzCode]);

  return (
    <div
      className="tikz-container-wrapper"
      style={{ margin: '16px 0', textAlign: 'center' }}
    >
      {loading && (
        <div
          style={{
            padding: '24px 16px',
            color: '#64748b',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid #cbd5e1',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Rendering diagram…
        </div>
      )}

      {error && !loading && (
        <div
          className="tikz-error-badge"
          style={{
            color: '#b91c1c',
            backgroundColor: 'rgba(239, 68, 68, 0.07)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'inline-block',
            textAlign: 'left',
            maxWidth: '100%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          ⚠️ TikZ Error: {error}
        </div>
      )}

      {imageUrl && !loading && (
        <img
          src={imageUrl}
          alt="TikZ diagram"
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
            borderRadius: '6px',
          }}
        />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

TikzRenderer.propTypes = {
  tikzCode: PropTypes.string.isRequired,
};

export default TikzRenderer;
