import React from 'react';

/**
 * StaffSync Brand Logo Component
 * Combines an original geometric synchronization icon (people nodes + sync orbital arcs)
 * with modern typography and optional HRMS badge.
 */
const Logo = ({
  size = 'md',
  theme = 'dark', // 'dark' (for light cards) or 'light' (for dark navy headers/sidebars)
  showWordmark = true,
  showBadge = true,
  className = ''
}) => {
  // Dimension presets
  const dimensions = {
    sm: { icon: 28, titleSize: '1rem', badgeSize: '0.625rem', gap: '8px' },
    md: { icon: 38, titleSize: '1.25rem', badgeSize: '0.6875rem', gap: '10px' },
    lg: { icon: 52, titleSize: '1.75rem', badgeSize: '0.75rem', gap: '14px' },
    xl: { icon: 64, titleSize: '2.25rem', badgeSize: '0.8125rem', gap: '16px' }
  }[size] || { icon: 38, titleSize: '1.25rem', badgeSize: '0.6875rem', gap: '10px' };

  const isDarkBg = theme === 'light'; // Text is light for dark backgrounds
  const textColor = isDarkBg ? '#ffffff' : '#0f172a';
  const subtitleColor = isDarkBg ? '#94a3b8' : '#64748b';

  return (
    <div className={`d-inline-flex align-items-center ${className}`} style={{ gap: dimensions.gap }}>
      {/* Geometric SVG Icon */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(13, 110, 253, 0.35))' }}
      >
        <defs>
          <linearGradient id="staffsync-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d6efd" />
            <stop offset="100%" stopColor="#00d2ff" />
          </linearGradient>
          <linearGradient id="staffsync-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="staffsync-shield" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Outer squircle base */}
        <rect width="100" height="100" rx="24" fill="url(#staffsync-shield)" />
        <rect width="98" height="98" x="1" y="1" rx="23" stroke="#334155" strokeWidth="1.5" />

        {/* Synchronizing orbital path top-right */}
        <path
          d="M32 26 C46 16, 74 18, 80 38"
          stroke="url(#staffsync-grad-primary)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Orbital arrow head top-right */}
        <polygon points="78,28 85,39 72,40" fill="#00d2ff" />

        {/* Synchronizing orbital path bottom-left */}
        <path
          d="M68 74 C54 84, 26 82, 20 62"
          stroke="url(#staffsync-grad-accent)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Orbital arrow head bottom-left */}
        <polygon points="22,72 15,61 28,60" fill="#6366f1" />

        {/* Center Primary Node (Leader/Core) */}
        <circle cx="50" cy="42" r="7" fill="url(#staffsync-grad-primary)" />
        <path
          d="M39 60 C39 53, 44 51, 50 51 C56 51, 61 53, 61 60"
          stroke="url(#staffsync-grad-primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Left Team Node */}
        <circle cx="34" cy="48" r="4.5" fill="#38bdf8" />
        <path
          d="M26 63 C26 58, 30 56, 34 56 C37 56, 40 58, 41 62"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Right Team Node */}
        <circle cx="66" cy="48" r="4.5" fill="#818cf8" />
        <path
          d="M59 62 C60 58, 63 56, 66 56 C70 56, 74 58, 74 63"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Synced horizontal connection bridge */}
        <line x1="39" y1="50" x2="61" y2="50" stroke="#00d2ff" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>

      {/* Typography Wordmark */}
      {showWordmark && (
        <div className="d-flex flex-column text-start">
          <div className="d-flex align-items-center gap-1.5 lh-1">
            <span
              style={{
                fontSize: dimensions.titleSize,
                fontWeight: 800,
                color: textColor,
                letterSpacing: '-0.02em',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Staff<span style={{ color: '#0d6efd' }}>Sync</span>
            </span>
            {showBadge && (
              <span
                className="badge rounded-pill ms-1"
                style={{
                  fontSize: dimensions.badgeSize,
                  fontWeight: 700,
                  backgroundColor: 'rgba(13, 110, 253, 0.12)',
                  color: '#0d6efd',
                  border: '1px solid rgba(13, 110, 253, 0.25)',
                  padding: '2px 7px',
                  letterSpacing: '0.04em'
                }}
              >
                HRMS
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '0.725rem',
              color: subtitleColor,
              fontWeight: 500,
              letterSpacing: '0.01em',
              marginTop: '2px'
            }}
          >
            Human Resource Management
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
