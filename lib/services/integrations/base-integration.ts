import type { StructuredTool } from '@langchain/core/tools';
import type { IntegrationConfig } from '@/lib/types/integrations';
import type { TestResult } from '@/lib/types/agent';

/**
 * Base abstract class for Web Service Integrations.
 * Each integration provides tools that the agent can use.
 */
export abstract class BaseIntegration {
  /**
   * Unique identifier for the integration provider
   */
  abstract readonly id: string;

  /**
   * Display name of the integration
   */
  abstract readonly name: string;

  /**
   * Description of the integration
   */
  abstract readonly description: string;

  /**
   * Initialize the integration with the given configuration.
   * This is where setup logic (e.g., creating API clients) goes.
   */
  abstract initialize(config: IntegrationConfig): Promise<void>;

  /**
   * Return the tools provided by this integration.
   */
  abstract getTools(): StructuredTool[];

  /**
   * Test the connection to the integration service using the config.
   * Typically used when a user saves settings.
   */
  abstract testConnection(config: IntegrationConfig): Promise<TestResult>;
}
