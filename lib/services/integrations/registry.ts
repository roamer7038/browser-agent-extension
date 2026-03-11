import { BaseIntegration } from './base-integration';
import { IntegrationRepository } from '../storage/repositories/integration-repository';
import type { StructuredTool } from '@langchain/core/tools';

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private integrations: Map<string, BaseIntegration> = new Map();

  private constructor() {}

  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }

  /**
   * Register a new integration provider class.
   */
  register(integration: BaseIntegration) {
    this.integrations.set(integration.id, integration);
  }

  /**
   * Get an integration provider by its ID.
   */
  get(id: string): BaseIntegration | undefined {
    return this.integrations.get(id);
  }

  /**
   * Get all registered integrations.
   */
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Initialize all enabled integrations from storage and collect their tools.
   */
  async getEnabledTools(): Promise<StructuredTool[]> {
    const configs = await IntegrationRepository.getAll();
    const enabledConfigs = configs.filter((c) => c.enabled);

    const tools: StructuredTool[] = [];

    for (const config of enabledConfigs) {
      const integration = this.integrations.get(config.id);
      if (integration) {
        try {
          // Re-initialize with actual configs, such as decryption-restored api keys
          await integration.initialize(config);
          const integrationTools = integration.getTools();
          tools.push(...integrationTools);
        } catch (err) {
          console.error(`Failed to initialize integration ${config.id}:`, err);
        }
      } else {
        console.warn(`Enabled integration provider ${config.id} is not registered.`);
      }
    }

    return tools;
  }
}

// Export singleton instance
export const integrationRegistry = IntegrationRegistry.getInstance();
