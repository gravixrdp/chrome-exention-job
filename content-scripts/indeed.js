// Indeed Content Script — delegates to shared base

import { createContentScript } from './content-base.js';
import { isJobPage, extractIndeedJobData } from '../src/services/detector.js';

createContentScript({
  platform: 'Indeed',
  extractJobData: extractIndeedJobData,
  isJobPage
});
