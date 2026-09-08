import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { branding } from '../config/branding.js';
import { AvatarPreview } from '../components/avatar/AvatarPreview.jsx';
import { AVATAR_CATALOG, defaultStudent } from '../data/defaultStudent.js';
import { saveStudent, getStudent } from '../services/storage.js';
import { ArrowRight, UserCheck } from 'lucide-react';

export function Setup() {
  const navigate = useNavigate();
  const existing = getStudent();

  const [name, setName] = useState(existing.name || '');
  const [nickname, setNickname] = useState(existing.nickname || '');
  const [avatar, setAvatar] = useState(existing.avatar || defaultStudent.avatar);

  const [step, setStep] = useState(1); // Step 1: Info, Step 2: Avatar
  const [error, setError] = useState('');

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleCompleteSetup = (chosenAvatar = avatar) => {
    if (!name.trim()) {
      setError('Full name is required');
      setStep(1);
      return;
    }

    const newStudentData = {
      ...existing,
      name: name.trim(),
      nickname: nickname.trim(),
      avatar: chosenAvatar,
      isSetupComplete: true
    };

    saveStudent(newStudentData);
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem'
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2.25rem 1.75rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-deep-blue) 0%, var(--color-deep-purple) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.5rem',
              marginBottom: '0.75rem'
            }}
          >
            S
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
            Welcome to {branding.appName}! 👋
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
            Let's get your student profile set up in a few seconds.
          </p>
        </div>

        {/* STEP 1: Name & Nickname */}
        {step === 1 && (
          <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Kasun Perera"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: error ? '2px solid #EF4444' : '1px solid var(--color-border)',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.95rem'
                }}
              />
              {error && (
                <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.3rem', display: 'block' }}>
                  {error}
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Nickname <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Kasu"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.95rem'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', display: 'block' }}>
                We will use this to greet you on your dashboard!
              </span>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-deep-purple)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Continue to Avatar <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Choose Avatar OR Skip */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ margin: '0 auto 0.75rem' }}>
                <AvatarPreview avatar={avatar} size={150} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Choose Your Full-Body Character
              </h2>
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {AVATAR_CATALOG.presets.map((preset) => {
                const isSelected = avatar.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setAvatar(preset)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--color-deep-purple)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'rgba(167, 139, 250, 0.15)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}
                  >
                    <AvatarPreview avatar={preset} size={70} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => handleCompleteSetup(avatar)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-deep-purple)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <UserCheck size={18} /> Save & Enter Dashboard
              </button>

              <button
                onClick={() => handleCompleteSetup(defaultStudent.avatar)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                Skip for now (Use Default Character)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
