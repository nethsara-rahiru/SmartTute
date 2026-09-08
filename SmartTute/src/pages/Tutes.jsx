import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { TutePreviewModal } from '../components/tutes/TutePreviewModal.jsx';
import { getTutesAsync, duplicateTute, deleteTute } from '../services/tuteStorage.js';
import { getStudent, updateStudent } from '../services/storage.js';
import { AvatarEditor } from '../components/avatar/AvatarEditor.jsx';
import { GRADE_OPTIONS, STATUS_OPTIONS } from '../data/defaultTutes.js';
import { Plus, Search, Filter, Eye, Edit, Copy, Trash2, BookOpen, Layers, RefreshCw } from 'lucide-react';

export function Tutes() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(() => getStudent());
  const [tutes, setTutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [previewTute, setPreviewTute] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchTutes = async () => {
    setLoading(true);
    const data = await getTutesAsync();
    setTutes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTutes();
  }, []);

  const handleSaveAvatar = (newAvatar) => {
    const updated = updateStudent({ avatar: newAvatar });
    setStudent(updated);
    setIsEditorOpen(false);
  };

  const handleDuplicate = async (id) => {
    duplicateTute(id);
    await fetchTutes();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Tute from MongoDB Atlas?')) {
      deleteTute(id);
      await fetchTutes();
    }
  };

  // Filter logic
  const filteredTutes = tutes.filter(tute => {
    const matchesSearch = searchTerm.trim() === '' ||
      (tute.title && tute.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tute.subject && tute.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tute.unit && tute.unit.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tute.className && tute.className.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrade = !gradeFilter || tute.grade === gradeFilter;
    const matchesStatus = !statusFilter || (tute.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <AppShell student={student} onOpenAvatarEditor={() => setIsEditorOpen(true)}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={28} color="var(--color-deep-purple)" />
            Tutes
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Manage math tutes, questions, and learning modules synced with MongoDB Atlas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchTutes}
            title="Refresh from MongoDB Atlas"
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#F1F5F9',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => navigate('/tutes/new')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-deep-purple)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={20} />
            Create Tute
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search tutes by title, unit, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem 0.6rem 2.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#F8FAFC',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Grade Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--color-text-muted)" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <option value="">All Grades</option>
            {GRADE_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', display: 'block', color: 'var(--color-deep-purple)' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Fetching real-time data from MongoDB Atlas...</p>
        </div>
      ) : filteredTutes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>No Tutes Found in Database</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.4rem', marginBottom: '1.25rem' }}>
            {searchTerm || gradeFilter || statusFilter
              ? 'Try adjusting your search or filters.'
              : 'Create your first real Tute to save it directly to MongoDB Atlas!'}
          </p>
          <button
            onClick={() => navigate('/tutes/new')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-deep-purple)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Plus size={18} /> Create Tute
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredTutes.map(tute => (
            <div
              key={tute.id}
              className="card animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div>
                {/* Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(125, 211, 252, 0.2)', color: 'var(--color-deep-blue)' }}>
                      {tute.grade}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(167, 139, 250, 0.2)', color: 'var(--color-deep-purple)' }}>
                      {tute.subject}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', backgroundColor: tute.status === 'published' ? '#DCFCE7' : '#FEF3C7', color: tute.status === 'published' ? '#166534' : '#92400E' }}>
                    {tute.status}
                  </span>
                </div>

                {/* Title & Info */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.3 }}>
                  {tute.title}
                </h3>
                <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>Unit: <strong>{tute.unit}</strong></span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Layers size={14} /> {tute.questions ? tute.questions.length : 0} Questions
                  </span>
                </div>

                {tute.className && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                    Class: {tute.className}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => navigate(`/tutes/${tute.id}/preview`)}
                  title="Preview Tute"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#F1F5F9',
                    color: 'var(--color-text)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Eye size={16} /> Preview
                </button>

                <button
                  onClick={() => navigate(`/tutes/${tute.id}/edit`)}
                  title="Edit Tute"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(167, 139, 250, 0.15)',
                    color: 'var(--color-deep-purple)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Edit size={16} /> Edit
                </button>

                <button
                  onClick={() => handleDuplicate(tute.id)}
                  title="Duplicate Tute"
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#F1F5F9',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <Copy size={16} />
                </button>

                <button
                  onClick={() => handleDelete(tute.id)}
                  title="Delete Tute"
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTute && (
        <TutePreviewModal
          tute={previewTute}
          onClose={() => setPreviewTute(null)}
        />
      )}

      {/* Avatar Editor Modal */}
      {isEditorOpen && (
        <AvatarEditor
          currentAvatar={student.avatar}
          onSave={handleSaveAvatar}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </AppShell>
  );
}

export default Tutes;