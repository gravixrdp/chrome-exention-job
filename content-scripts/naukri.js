// Naukri Content Script — delegates to shared base

import { createContentScript } from './content-base.js';
import { isJobPage, extractNaukriJobData } from '../src/services/detector.js';

createContentScript({
  platform: 'Naukri',
  extractJobData: extractNaukriJobData,
  isJobPage
});
