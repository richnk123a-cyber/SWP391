/**
 * Utilities for formatting and handling Company Logos
 */

export function getCompanyLogoUrl(logo) {
  if (!logo || typeof logo !== 'string') return null;
  const trimmed = logo.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';
    return `${backendUrl.replace(/\/api$/, '')}${trimmed}`;
  }
  return trimmed;
}

export function isImageLogo(logo) {
  if (!logo || typeof logo !== 'string') return false;
  const trimmed = logo.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/uploads/') ||
    /\.(png|jpe?g|webp|svg|gif)$/i.test(trimmed)
  );
}
