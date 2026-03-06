// setup-tests.ts
import '@testing-library/jest-dom';
import { vi, beforeAll } from 'vitest';

// Suppress noisy console output during tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
