import { useState } from 'react';
import { AvatarPreview } from './AvatarPreview.jsx';
import { AVATAR_CATALOG } from '../../data/defaultStudent.js';
import { X, Check, Sparkles, Palette } from 'lucide-react';

export function AvatarEditor({ currentAvatar = {}, onSave, onCancel }) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  const [avatar, setAvatar] = useState({
    preset: currentAvatar.preset || 'hero1',
    skinTone: currentAvatar.skinTone || '#FFDBAC',
    hairStyle: currentAvatar.hairStyle || 'short',
    hairColor: currentAvatar.hairColor || '#3B82F6',
    shirtColor: currentAvatar.shirtColor || '#38BDF8',
    pantsColor: currentAvatar.pantsColor || '#1E293B',
    shoesColor: currentAvatar.shoesColor || '#FFFFFF',
    accessory: currentAvatar.accessory || 'glasses'
  });

  const handleSelectPreset = (preset) => {
    setAvatar({
      preset: preset.id,
      skinTone: preset.skinTone,
      hairStyle: preset.hairStyle,
      hairColor: preset.hairColor,
      shirtColor: preset.shirtColor,
      pantsColor: preset.pantsColor || '#1E293B',
      shoesColor: preset.shoesColor || '#FFFFFF',
      accessory: preset.accessory
    });
  };

  const handleCustomChange = (key, value) => {
    setAvatar(prev => ({
      ...prev,
      preset: 'custom',
      [key]: value
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-editor-title"
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 id="avatar-editor-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Choose Your Character 🎨
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Full-body cartoon avatar customization
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close modal"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 100%)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <AvatarPreview avatar={avatar} size={170} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-deep-purple)', marginTop: '0.5rem' }}>
            Full-Body Character Preview
          </span>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('presets')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'presets' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'presets' ? '#0F172A' : 'var(--color-text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={16} /> Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'custom' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'custom' ? '#0F172A' : 'var(--color-text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Palette size={16} /> Customize
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
            {AVATAR_CATALOG.presets.map((preset) => {
              const isSelected = avatar.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-deep-purple)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'rgba(167, 139, 250, 0.1)' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <AvatarPreview avatar={preset} size={90} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Custom Options */}
        {activeTab === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Skin Tone */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Skin Tone
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {AVATAR_CATALOG.skinTones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleCustomChange('skinTone', tone.id)}
                    aria-label={`Skin tone ${tone.name}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: tone.id,
                      border: avatar.skinTone === tone.id ? '3px solid var(--color-deep-purple)' : '1px solid #CCC',
                      transform: avatar.skinTone === tone.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Hair Style
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {AVATAR_CATALOG.hairStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleCustomChange('hairStyle', style.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: avatar.hairStyle === style.id ? 'var(--color-secondary)' : '#F1F5F9',
                      color: avatar.hairStyle === style.id ? '#FFFFFF' : 'var(--color-text)'
                    }}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Hair Color
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {AVATAR_CATALOG.hairColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleCustomChange('hairColor', color.id)}
                    aria-label={`Hair color ${color.name}`}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: color.id,
                      border: avatar.hairColor === color.id ? '3px solid var(--color-deep-purple)' : '1px solid #CCC',
                      transform: avatar.hairColor === color.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Shirt Color */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Shirt / Top Color
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {AVATAR_CATALOG.shirtColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleCustomChange('shirtColor', color.id)}
                    aria-label={`Shirt color ${color.name}`}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: color.id,
                      border: avatar.shirtColor === color.id ? '3px solid var(--color-deep-purple)' : '1px solid #CCC',
                      transform: avatar.shirtColor === color.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Accessory */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.4rem' }}>
                Accessory
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {AVATAR_CATALOG.accessories.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleCustomChange('accessory', acc.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: avatar.accessory === acc.id ? 'var(--color-secondary)' : '#F1F5F9',
                      color: avatar.accessory === acc.id ? '#FFFFFF' : 'var(--color-text)'
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--color-text-muted)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(avatar)}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-deep-purple)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Check size={18} /> Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
