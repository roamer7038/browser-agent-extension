import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaIntegration } from './index';
import { createOllamaSearchTool, createOllamaFetchTool } from './tools';

// Mock global fetch
global.fetch = vi.fn();

const setupMockFetch = (responseData: any, ok: boolean = true, statusText: string = 'OK') => {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok,
    statusText,
    json: async () => responseData
  } as any);
};

describe('OllamaIntegration', () => {
  let integration: OllamaIntegration;

  beforeEach(() => {
    vi.resetAllMocks();
    integration = new OllamaIntegration();
  });

  it('should initialize and return tools', async () => {
    await integration.initialize({ id: 'ollama', name: 'Ollama', enabled: true, apiKey: 'test-key' });

    const tools = integration.getTools();
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('ollama_web_search');
    expect(tools[1].name).toBe('ollama_web_fetch');
  });

  it('should test connection successfully', async () => {
    setupMockFetch({});

    const result = await integration.testConnection({
      id: 'ollama',
      name: 'Ollama',
      enabled: true,
      apiKey: 'test-key'
    });
    expect(result.success).toBe(true);
    expect(result.toolCount).toBe(2);
  });

  it('should handle test connection failure', async () => {
    setupMockFetch({}, false, 'Unauthorized');

    const result = await integration.testConnection({
      id: 'ollama',
      name: 'Ollama',
      enabled: true,
      apiKey: 'invalid-key'
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('should fail test connection if apiKey is missing', async () => {
    const result = await integration.testConnection({ id: 'ollama', name: 'Ollama', enabled: true, apiKey: '' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('API Key is required');
  });
});

describe('Ollama Tools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('OllamaSearchTool should call the correct API endpoint', async () => {
    setupMockFetch({ results: [{ title: 'test', url: 'http://test.com', content: 'content' }] });

    const searchTool = createOllamaSearchTool('https://ollama.com', 'test-key');
    const result = await searchTool.invoke({ query: 'test query' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://ollama.com/api/web_search',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key'
        },
        body: expect.any(String)
      })
    );

    // Check payload separately due to stringification of args
    const fetchCallArgs = vi.mocked(global.fetch).mock.calls[0][1];
    const payload = JSON.parse(fetchCallArgs?.body as string);
    expect(payload.query).toBe('test query');

    expect(result).toContain('test.com');
  });

  it('OllamaFetchTool should call the correct API endpoint', async () => {
    setupMockFetch({ title: 'test', content: 'page content', links: [] });

    const fetchTool = createOllamaFetchTool('https://ollama.com', 'test-key');
    const result = await fetchTool.invoke({ url: 'http://test.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://ollama.com/api/web_fetch',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key'
        },
        body: expect.any(String)
      })
    );

    expect(result).toContain('page content');
  });
});
