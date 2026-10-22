/**
 * Vercel Web Analytics Initialization
 * This script initializes Vercel Web Analytics across all pages
 * Using the official @vercel/analytics package
 */
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
// In production, analytics will be automatically enabled
// In development, debug mode will be active for testing
inject();
