import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTuteById, saveTute } from '../services/tuteStorage';
import { GRADE_OPTIONS, SUBJECT_OPTIONS, STATUS_OPTIONS } from '../data/defaultTutes';
import LatexToolbar from '../components/LatexToolbar';
import SymbolPalette from '../components/SymbolPalette';
import AnswerManager from '../components/AnswerManager';
import QuestionRenderer from '../components/QuestionRenderer';
import '../styles/editor.css';

const defaultNewTute = {
  title: 'New Mathematics Tute',
  grade: 'Grade 10',
  subject: 'Mathematics',
  unit: 'General',
  className: 'Default Class',
  description: '',
  status: 'draft',
  questions: [
    {
      id: 'q_default_1',
      order: 1,
      title: 'Question 1',
      content: 'Solve for $x$ in the equation:\n\n$$2x + 5 = 15$$\n\nWhat is the value of $x$? {{answer_1}}',
      answers: [
        {
          id: 'answer_1',
          type: 'number',
          correctAnswer: '5',
          explanation: '$2x = 10 \\implies x = 5$.'
        }
      ]
    }
  ]
};

export function TuteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [tute, setTute] = useState(() => {
    if (id) {
      const existing = getTuteById(id);
      if (existing) return existing;
    }
    return defaultNewTute;
  });

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [deviceView, setDeviceView] = useState('100%'); // '100%', '768px', '375px'
  const [activeTab, setActiveTab] = useState('shortcuts'); // 'shortcuts' | 'symbols'
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});

  const activeQuestion = tute.questions[activeQuestionIndex] || tute.questions[0] || {
    id: 'q_fallback',
    order: 1,
    title: 'Question 1',
    content: '',
    answers: []
  };

  const handleMetadataChange = (field, value) => {
    setTute(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (updatedQuestion) => {
    const updatedQuestions = [...tute.questions];
    updatedQuestions[activeQuestionIndex] = updatedQuestion;
    setTute(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleAddQuestion = () => {
    const newQNum = tute.questions.length + 1;
    const newQ = {
      id: `q_${Date.now()}_${newQNum}`,
      order: newQNum,
      title: `Question ${newQNum}`,
      content: `Question ${newQNum} content in LaTeX...\n\nAnswer: {{answer_1}}`,
      answers: [
        {
          id: 'answer_1',
          type: 'number',
          correctAnswer: '0',
          explanation: ''
        }
      ]
    };
    setTute(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
    setActiveQuestionIndex(tute.questions.length);
  };

  const handleRemoveQuestion = (index) => {
    if (tute.questions.length <= 1) return;
    const updated = tute.questions.filter((_, idx) => idx !== index);
    setTute(prev => ({ ...prev, questions: updated }));
    setActiveQuestionIndex(Math.max(0, index - 1));
  };

  const insertTextAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = activeQuestion.content || '';

    const newContent = currentContent.substring(0, start) + textToInsert + currentContent.substring(end);
    handleQuestionChange({ ...activeQuestion, content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);
  };

  const handleSave = () => {
    const success = saveTute(tute);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (!id && tute.id) {
        navigate(`/tutes/${tute.id}/edit`, { replace: true });
      }
    }
  };

  return (
    <div className="tute-editor-page">
      {/* Top Navigation Header */}
      <header className="editor-header">
        <div className="editor-header-title-group">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/tutes')}
          >
            ← Back to Tutes List
          </button>
          <h1 className="editor-title">Tute Editor</h1>
        </div>

        <div className="editor-header-actions">
          {saveSuccess && (
            <span className="save-badge">
              ✓ Saved successfully!
            </span>
          )}
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleSave}
          >
            💾 Save Tute
          </button>
          {tute.id && (
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => navigate(`/tutes/${tute.id}/preview`)}
            >
              👁 Full Preview
            </button>
          )}
        </div>
      </header>

      {/* 3-Column Layout Grid */}
      <div className="editor-grid-container">
        
        {/* LEFT COLUMN: Metadata & Question Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tute Metadata Card */}
          <div className="editor-card">
            <div className="editor-card-header">
              <h2 className="editor-card-title">⚙️ Metadata</h2>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tute Title</label>
              <input
                type="text"
                className="form-input"
                value={tute.title}
                onChange={(e) => handleMetadataChange('title', e.target.value)}
                placeholder="e.g. Quad Equations & Functions"
              />
            </div>

            <div className="form-grid-2 form-group">
              <div>
                <label className="form-label">Grade</label>
                <select
                  className="form-select"
                  value={tute.grade}
                  onChange={(e) => handleMetadataChange('grade', e.target.value)}
                >
                  {GRADE_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={tute.subject}
                  onChange={(e) => handleMetadataChange('subject', e.target.value)}
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2 form-group">
              <div>
                <label className="form-label">Unit / Topic</label>
                <input
                  type="text"
                  className="form-input"
                  value={tute.unit}
                  onChange={(e) => handleMetadataChange('unit', e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  className={`form-select status-select ${tute.status}`}
                  value={tute.status}
                  onChange={(e) => handleMetadataChange('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{st.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                className="form-input"
                value={tute.className || ''}
                onChange={(e) => handleMetadataChange('className', e.target.value)}
                placeholder="e.g. Grade 10 Monday Class"
              />
            </div>
          </div>

          {/* Question List Card */}
          <div className="editor-card">
            <div className="editor-card-header">
              <h2 className="editor-card-title">
                📝 Questions ({tute.questions.length})
              </h2>
              <button
                type="button"
                className="btn-add-q"
                onClick={handleAddQuestion}
              >
                + Add Q
              </button>
            </div>

            <div className="question-list-container">
              {tute.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={`question-item-btn ${activeQuestionIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveQuestionIndex(idx)}
                >
                  <span className="question-item-title">
                    Q{idx + 1}. {q.title || `Question ${idx + 1}`}
                  </span>
                  {tute.questions.length > 1 && (
                    <button
                      type="button"
                      className="btn-delete-q"
                      title="Delete question"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveQuestion(idx);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Question Content & LaTeX Editor */}
        <div className="editor-card">
          <div className="editor-card-header">
            <h2 className="editor-card-title">
              ✏️ Editing Question {activeQuestionIndex + 1}
            </h2>
          </div>

          {/* Question Title Input */}
          <div className="form-group">
            <label className="form-label">Question Heading / Title</label>
            <input
              type="text"
              className="form-input"
              value={activeQuestion.title || ''}
              onChange={(e) => handleQuestionChange({ ...activeQuestion, title: e.target.value })}
              placeholder="e.g. Question 1: Solve for x"
            />
          </div>

          {/* Tabbed Toolbar: LaTeX Snippets & Symbols */}
          <div style={{ marginBottom: '16px' }}>
            <div className="editor-tabs">
              <button
                type="button"
                className={`editor-tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
                onClick={() => setActiveTab('shortcuts')}
              >
                📐 LaTeX Templates
              </button>
              <button
                type="button"
                className={`editor-tab-btn ${activeTab === 'symbols' ? 'active' : ''}`}
                onClick={() => setActiveTab('symbols')}
              >
                α Symbol Palette
              </button>
            </div>

            {activeTab === 'shortcuts' && (
              <LatexToolbar onInsertSnippet={insertTextAtCursor} />
            )}
            {activeTab === 'symbols' && (
              <SymbolPalette onInsertSymbol={insertTextAtCursor} />
            )}
          </div>

          {/* LaTeX Textarea Input */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Question Content (Markdown + KaTeX + Answers)
              </label>
              <span className="form-hint">
                Use <code>$x$</code> for inline, <code>$$...$$</code> for block, <code>{'{{answer_1}}'}</code> for inputs
              </span>
            </div>
            <textarea
              ref={textareaRef}
              className="form-textarea"
              rows={12}
              value={activeQuestion.content || ''}
              onChange={(e) => handleQuestionChange({ ...activeQuestion, content: e.target.value })}
              placeholder={'Write text and LaTeX here...\n\nExample: Solve for $x$ in $$x^2 - 4 = 0$$\n\nAnswer: {{answer_1}}'}
            />
          </div>

          {/* Answer Fields Manager */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <AnswerManager
              question={activeQuestion}
              onChange={handleQuestionChange}
              onInsertPlaceholder={(ansId) => insertTextAtCursor(`{{${ansId}}}`)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Live Student Preview Simulator */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="editor-card">
            <div className="editor-card-header">
              <h2 className="editor-card-title">
                📱 Live Student View Preview
              </h2>

              {/* Device Width Toggle */}
              <div className="device-toggle-group">
                {[
                  { id: '100%', label: 'Desktop' },
                  { id: '768px', label: 'Tablet' },
                  { id: '375px', label: 'Mobile' }
                ].map(dev => (
                  <button
                    key={dev.id}
                    type="button"
                    className={`device-toggle-btn ${deviceView === dev.id ? 'active' : ''}`}
                    onClick={() => setDeviceView(dev.id)}
                  >
                    {dev.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Device Container Frame */}
            <div className="device-preview-wrapper">
              <div
                className="device-preview-frame"
                style={{ width: deviceView }}
              >
                <div className="preview-badge-header">
                  <span className="preview-tag">
                    {tute.subject} • {tute.grade}
                  </span>
                  <h3 className="preview-q-title">
                    {activeQuestion.title || `Question ${activeQuestionIndex + 1}`}
                  </h3>
                </div>

                {/* Render Question Content */}
                <QuestionRenderer
                  content={activeQuestion.content}
                  answers={activeQuestion.answers}
                  userAnswers={userAnswers}
                  onAnswerChange={(ansId, val) => setUserAnswers(prev => ({ ...prev, [ansId]: val }))}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TuteEditor;
