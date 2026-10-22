/**
 * Vercel Web Analytics Initialization
 * Lightweight vanilla script integration (works natively in static HTML)
 */
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

if (typeof window !== 'undefined' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
}
