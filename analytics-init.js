/**
 * Vercel Web Analytics Initialization
 * This script initializes Vercel Web Analytics across all pages
 */
(function() {
  'use strict';
  
  // Inject Vercel Web Analytics
  if (typeof window !== 'undefined') {
    window.va = window.va || function () { 
      (window.vaq = window.vaq || []).push(arguments); 
    };
    
    // Load the analytics script from Vercel's CDN
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    document.head.appendChild(script);
  }
})();
