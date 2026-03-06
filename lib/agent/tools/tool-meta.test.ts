import { describe, it, expect } from 'vitest';
import { BROWSER_TOOL_META, getAllToolNames } from '@/lib/agent/tools/tool-meta';

describe('BROWSER_TOOL_META', () => {
  it('should have unique tool names', () => {
    const names = BROWSER_TOOL_META.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should have valid categories for all entries', () => {
    const validCategories = ['navigation', 'content', 'interaction', 'screenshot', 'download', 'tab'];
    for (const tool of BROWSER_TOOL_META) {
      expect(validCategories).toContain(tool.category);
    }
  });

  it('should have non-empty label and description for all entries', () => {
    for (const tool of BROWSER_TOOL_META) {
      expect(tool.label.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  it('should have names prefixed with browser_', () => {
    for (const tool of BROWSER_TOOL_META) {
      expect(tool.name).toMatch(/^browser_/);
    }
  });
});

describe('getAllToolNames', () => {
  it('should return all tool names from metadata', () => {
    const names = getAllToolNames();
    expect(names).toHaveLength(BROWSER_TOOL_META.length);
  });

  it('should return strings only', () => {
    const names = getAllToolNames();
    for (const name of names) {
      expect(typeof name).toBe('string');
    }
  });

  it('should match BROWSER_TOOL_META name order', () => {
    const names = getAllToolNames();
    const expected = BROWSER_TOOL_META.map((t) => t.name);
    expect(names).toEqual(expected);
  });
});
