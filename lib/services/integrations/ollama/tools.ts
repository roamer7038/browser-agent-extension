import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export function createOllamaSearchTool(baseUrl: string, apiKey: string) {
  return new DynamicStructuredTool({
    name: 'ollama_web_search',
    description: 'Searches the web using Ollama API. Use this to find current information on the internet.',
    schema: z.object({
      query: z.string().describe('The search query string'),
      max_results: z.number().optional().describe('Maximum results to return (default 5, max 10)')
    }),
    func: async ({ query, max_results }) => {
      const response = await fetch(`${baseUrl}/api/web_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ query, max_results })
      });
      if (!response.ok) {
        throw new Error(`Ollama Search API error: ${response.statusText}`);
      }
      const data = await response.json();
      return JSON.stringify(data.results, null, 2);
    }
  });
}

export function createOllamaFetchTool(baseUrl: string, apiKey: string) {
  return new DynamicStructuredTool({
    name: 'ollama_web_fetch',
    description: 'Fetches the content of a specific URL using Ollama API.',
    schema: z.object({
      url: z.string().describe('The URL to fetch')
    }),
    func: async ({ url }) => {
      const response = await fetch(`${baseUrl}/api/web_fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        throw new Error(`Ollama Fetch API error: ${response.statusText}`);
      }
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    }
  });
}
