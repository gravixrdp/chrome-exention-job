// LinkedIn Content Script — delegates to shared base

import { createContentScript } from './content-base.js';
import { isJobPage, extractLinkedInJobData } from '../src/services/detector.js';

createContentScript({
  platform: 'LinkedIn',
  extractJobData: extractLinkedInJobData,
  isJobPage
});
