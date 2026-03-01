import { summarizationMiddleware, todoListMiddleware } from 'langchain';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { AgentSettingsConfig } from '../../types/agent';

export function getAgentMiddlewares(model: BaseLanguageModel, agentSettings: AgentSettingsConfig | null) {
  const middlewares: any[] = [];

  if (!agentSettings || !agentSettings.enabledMiddlewares) {
    return middlewares;
  }

  const { enabledMiddlewares, middlewareSettings } = agentSettings;

  if (enabledMiddlewares.includes('SummarizationMiddleware')) {
    const sumSettings = middlewareSettings?.summarization || {};
    middlewares.push(
      summarizationMiddleware({
        model,
        trigger: {
          tokens: sumSettings.maxTokens || 4000,
          messages: sumSettings.messages || 10
        }
      })
    );
  }

  if (enabledMiddlewares.includes('TodoListMiddleware')) {
    middlewares.push(todoListMiddleware());
  }

  return middlewares;
}
