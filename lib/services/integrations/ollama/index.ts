import { BaseIntegration } from '../base-integration';
import { integrationRegistry } from '../registry';
import type { IntegrationConfig } from '@/lib/types/integrations';
import type { StructuredTool } from '@langchain/core/tools';
import type { TestResult } from '@/lib/types/agent';
import { createOllamaSearchTool, createOllamaFetchTool } from './tools';

export class OllamaIntegration extends BaseIntegration {
  readonly id = 'ollama';
  readonly name = 'Ollama Web API';
  readonly description = 'Integration for Ollama Web Search & Fetch APIs. Provides tools for browsing the internet.';

  private config: IntegrationConfig | null = null;
  private tools: StructuredTool[] = [];

  async initialize(config: IntegrationConfig): Promise<void> {
    this.config = config;
    const baseUrl = 'https://ollama.com';
    const apiKey = config.apiKey;

    if (!apiKey) {
      console.warn('Ollama API key is missing. Tools will not work.');
      return;
    }

    this.tools = [createOllamaSearchTool(baseUrl, apiKey), createOllamaFetchTool(baseUrl, apiKey)];
  }

  getTools(): StructuredTool[] {
    if (!this.config) {
      console.warn('OllamaIntegration is not initialized. Call initialize() first.');
      return [];
    }
    return this.tools;
  }

  async testConnection(config: IntegrationConfig): Promise<TestResult> {
    try {
      const baseUrl = 'https://ollama.com';
      const apiKey = config.apiKey;

      if (!apiKey) {
        return { success: false, error: 'API Key is required.' };
      }

      const response = await fetch(`${baseUrl}/api/web_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ query: 'test', max_results: 1 })
      });

      if (!response.ok) {
        return { success: false, error: `Connection failed: ${response.statusText}` };
      }
      return { success: true, toolCount: 2 };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error during connection test' };
    }
  }
}

// Ensure the integration is registered when imported
integrationRegistry.register(new OllamaIntegration());
