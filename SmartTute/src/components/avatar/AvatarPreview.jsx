/**
 * Data-driven vector SVG Full-Body Avatar Preview component.
 * Renders a complete head-to-toe cartoon character (head, face, hair, neck, torso, arms, hands, pants, legs, shoes).
 */
export function AvatarPreview({ avatar = {}, size = 180, className = "" }) {
  const skinTone = avatar.skinTone || "#FFDBAC";
  const hairStyle = avatar.hairStyle || "short";
  const hairColor = avatar.hairColor || "#3B82F6";
  const shirtColor = avatar.shirtColor || "#38BDF8";
  const pantsColor = avatar.pantsColor || "#1E293B";
  const shoesColor = avatar.shoesColor || "#FFFFFF";
  const accessory = avatar.accessory || "none";

  const numSize = typeof size === 'number' ? size : 180;
  const heightVal = typeof size === 'number' ? `${Math.round(numSize * 1.35)}px` : 'auto';

  return (
    <div
      className={`avatar-preview-container ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: heightVal,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)',
        border: '2px solid #E2E8F0',
        padding: '0.35rem'
      }}
    >
      <svg
        viewBox="0 0 200 270"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Full Body Cartoon Character Avatar"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ground Drop Shadow */}
        <ellipse cx="100" cy="256" rx="46" ry="8" fill="rgba(0,0,0,0.18)" />

        {/* --- 1. SHOES / FEET --- */}
        {/* Left Shoe */}
        <path d="M64 238 Q64 230 94 232 L95 254 L62 254 Q60 246 64 238 Z" fill={shoesColor} stroke="#1E293B" strokeWidth="2.5" />
        <rect x="60" y="250" width="36" height="5" fill="#0F172A" rx="2" />
        {/* Shoe laces */}
        <line x1="72" y1="238" x2="86" y2="238" stroke="#64748B" strokeWidth="2" />
        <line x1="74" y1="242" x2="84" y2="242" stroke="#64748B" strokeWidth="2" />

        {/* Right Shoe */}
        <path d="M106 232 Q136 230 136 238 Q140 246 138 254 L105 254 Z" fill={shoesColor} stroke="#1E293B" strokeWidth="2.5" />
        <rect x="104" y="250" width="36" height="5" fill="#0F172A" rx="2" />
        {/* Shoe laces */}
        <line x1="114" y1="238" x2="128" y2="238" stroke="#64748B" strokeWidth="2" />
        <line x1="116" y1="242" x2="126" y2="242" stroke="#64748B" strokeWidth="2" />

        {/* --- 2. LEGS --- */}
        <rect x="74" y="196" width="20" height="42" fill={skinTone} stroke="#1E293B" strokeWidth="1.5" rx="3" />
        <rect x="106" y="196" width="20" height="42" fill={skinTone} stroke="#1E293B" strokeWidth="1.5" rx="3" />

        {/* --- 3. PANTS / SHORTS --- */}
        <rect x="66" y="138" width="68" height="62" rx="6" fill={pantsColor} stroke="#1E293B" strokeWidth="2" />
        {/* Center Pants Seam */}
        <line x1="100" y1="154" x2="100" y2="200" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />
        {/* Belt */}
        <rect x="66" y="138" width="68" height="10" fill="#0F172A" />
        <rect x="94" y="136" width="12" height="14" fill="#F59E0B" rx="2" />

        {/* --- 4. ARMS & HANDS --- */}
        {/* Left Arm */}
        <path d="M70 86 Q44 116 44 150" stroke={shirtColor} strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d="M70 86 Q44 116 44 150" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Left Hand */}
        <circle cx="44" cy="154" r="9" fill={skinTone} stroke="#1E293B" strokeWidth="2" />

        {/* Right Arm */}
        <path d="M130 86 Q156 116 156 150" stroke={shirtColor} strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d="M130 86 Q156 116 156 150" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Right Hand */}
        <circle cx="156" cy="154" r="9" fill={skinTone} stroke="#1E293B" strokeWidth="2" />

        {/* --- 5. TORSO / SHIRT --- */}
        <path d="M66 84 C66 78 134 78 134 84 L134 144 C134 148 66 148 66 144 Z" fill={shirtColor} stroke="#1E293B" strokeWidth="2" />
        {/* Collar / V-Neck */}
        <path d="M82 82 L100 98 L118 82 Z" fill="rgba(0,0,0,0.15)" />
        <path d="M82 82 L100 98 L118 82" fill="none" stroke="#1E293B" strokeWidth="2" />

        {/* --- 6. NECK --- */}
        <rect x="90" y="64" width="20" height="22" fill={skinTone} stroke="#1E293B" strokeWidth="2" rx="4" />

        {/* --- 7. HEAD & EARS --- */}
        {/* Ears */}
        <circle cx="62" cy="46" r="8" fill={skinTone} stroke="#1E293B" strokeWidth="2" />
        <circle cx="138" cy="46" r="8" fill={skinTone} stroke="#1E293B" strokeWidth="2" />

        {/* Head */}
        <circle cx="100" cy="44" r="36" fill={skinTone} stroke="#1E293B" strokeWidth="2.5" />

        {/* Eyes */}
        <circle cx="86" cy="41" r="4.5" fill="#1E293B" />
        <circle cx="114" cy="41" r="4.5" fill="#1E293B" />
        <circle cx="84.5" cy="39.5" r="1.8" fill="#FFFFFF" />
        <circle cx="112.5" cy="39.5" r="1.8" fill="#FFFFFF" />

        {/* Blush */}
        <ellipse cx="78" cy="49" rx="6" ry="3.5" fill="#F472B6" opacity="0.5" />
        <ellipse cx="122" cy="49" rx="6" ry="3.5" fill="#F472B6" opacity="0.5" />

        {/* Smile */}
        <path d="M90 54 Q100 65 110 54" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />

        {/* --- 8. HAIR STYLES --- */}
        {hairStyle === 'short' && (
          <path d="M64 36 C62 8 138 8 136 36 C124 18 76 18 64 36 Z" fill={hairColor} stroke="#1E293B" strokeWidth="2" />
        )}

        {hairStyle === 'curly' && (
          <g fill={hairColor} stroke="#1E293B" strokeWidth="2">
            <circle cx="68" cy="26" r="15" />
            <circle cx="84" cy="14" r="16" />
            <circle cx="100" cy="10" r="17" />
            <circle cx="116" cy="14" r="16" />
            <circle cx="132" cy="26" r="15" />
          </g>
        )}

        {hairStyle === 'bob' && (
          <g fill={hairColor} stroke="#1E293B" strokeWidth="2">
            <path d="M62 31 C62 8 138 8 138 31 L140 58 Q134 64 128 56 L128 31 C128 18 72 18 72 31 L72 56 Q66 64 60 58 Z" />
          </g>
        )}

        {hairStyle === 'spiky' && (
          <path d="M64 34 L70 12 L82 23 L93 4 L100 19 L107 4 L118 23 L130 12 L136 34 Z" fill={hairColor} stroke="#1E293B" strokeWidth="2" />
        )}

        {hairStyle === 'ponytail' && (
          <g fill={hairColor} stroke="#1E293B" strokeWidth="2">
            <path d="M64 34 C62 8 138 8 136 34 Z" />
            <path d="M132 26 Q164 34 150 66 Q134 52 137 30 Z" />
          </g>
        )}

        {/* --- 9. ACCESSORIES --- */}
        {accessory === 'glasses' && (
          <g fill="none" stroke="#1E293B" strokeWidth="3.5">
            <rect x="74" y="32" width="22" height="16" rx="4" fill="rgba(255,255,255,0.3)" />
            <rect x="104" y="32" width="22" height="16" rx="4" fill="rgba(255,255,255,0.3)" />
            <line x1="96" y1="40" x2="104" y2="40" />
            <line x1="62" y1="36" x2="74" y2="36" />
            <line x1="126" y1="36" x2="138" y2="36" />
          </g>
        )}

        {accessory === 'hat' && (
          <g stroke="#1E293B" strokeWidth="2">
            <path d="M46 22 L154 22 L144 16 L56 16 Z" fill="#FBBF24" />
            <path d="M64 16 Q100 -14 136 16 Z" fill="#F59E0B" />
            <polygon points="100,-4 103,3 110,3 104,7 107,14 100,10 93,14 96,7 90,3 97,3" fill="#FFFFFF" stroke="none" />
          </g>
        )}

        {accessory === 'headband' && (
          <path d="M63 32 Q100 24 137 32" fill="none" stroke="#EC4899" strokeWidth="7" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}
