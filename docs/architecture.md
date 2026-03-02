# Architecture and Technical Stack

Conduitの技術的な詳細、アーキテクチャ、および主要なモジュールについて説明します。

## 技術スタック

- **Core**: [WXT](https://wxt.dev/) (Web Extension Toolbox)
- **Frontend**: React 19, [Shadcn UI](https://ui.shadcn.com/), Tailwind CSS
- **AI/Agent**: [LangChain](https://js.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraphjs/)
- **Communication**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- **State Management**: React Hooks, Storage API
- **Security**: AES-GCM (APIキーの暗号化保存)

## システム構成

Conduitは現代的なブラウザ拡張機能の構造を採用しています。

- **Sidepanel**: ユーザインターフェースを提供します。チャット、履歴、設定画面が含まれます。
- **Background Service Worker**: MCPサーバとの通信、エージェントの実行、ブラウザ操作のオーケストレーションを担当します。

## 主要モジュール

### エージェント (lib/agent)

LangGraphを使用して構築された自律型エージェントです。提供されたツール（ブラウザ操作、MCPツール等）を駆使してユーザの指示を遂行します。

### LLMファクトリ (lib/agent/llm)

各種LLMプロバイダ（OpenAI, Ollama等）のインスタンスを生成する共通インターフェースです。

### MCP連携 (lib/services/mcp)

Model Context Protocolに対応したサーバと通信し、エージェントが利用可能なツールを動的に拡張します。

### ストレージ・セキュリティ (lib/services/storage, lib/services/crypto)

設定情報や会話履歴を安全に保存します。APIキーなどの機密情報は、ユーザのローカル環境でのみ復号可能な形式で暗号化されます。

## 開発ガイドライン

詳細な開発手順やコーディングスタイルについては、別途開発者向けドキュメントを参照してください。
