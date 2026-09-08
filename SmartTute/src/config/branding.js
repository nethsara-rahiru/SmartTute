export const branding = {
  appName: "SmartTute",

  logo: "/assets/logo.png",
  favicon: "/assets/favicon.png",

  colors: {
    primary: "#7DD3FC",
    secondary: "#A78BFA",
    accent: "#F472B6",
    deepBlue: "#38BDF8",
    deepPurple: "#8B5CF6",
    deepPink: "#EC4899",

    background: "#F8FAFC",
    card: "#FFFFFF",
    text: "#1E293B",
    textMuted: "#64748B",
    border: "#E2E8F0"
  },

  font: "Inter, system-ui, -apple-system, sans-serif",

  terminology: {
    currency: "Coins",
    xp: "XP",
    character: "Character"
  },

  support: {
    email: "support@smarttute.com",
    phone: "",
    website: ""
  }
};

/**
 * Dynamically applies branding color variables and fonts to document root (:root).
 * This ensures that changing values in branding.js instantly updates the entire app visually.
 */
export function applyBrandingTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set font
  root.style.setProperty('--font-family', branding.font);

  // Set colors
  root.style.setProperty('--color-primary', branding.colors.primary);
  root.style.setProperty('--color-secondary', branding.colors.secondary);
  root.style.setProperty('--color-accent', branding.colors.accent);
  root.style.setProperty('--color-deep-blue', branding.colors.deepBlue);
  root.style.setProperty('--color-deep-purple', branding.colors.deepPurple);
  root.style.setProperty('--color-deep-pink', branding.colors.deepPink);

  root.style.setProperty('--color-bg', branding.colors.background);
  root.style.setProperty('--color-card', branding.colors.card);
  root.style.setProperty('--color-text', branding.colors.text);
  root.style.setProperty('--color-text-muted', branding.colors.textMuted);
  root.style.setProperty('--color-border', branding.colors.border);
}
