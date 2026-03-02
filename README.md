# Conduit: AI Agent for Chrome Extension

Google Chrome向けAIエージェント拡張機能です。ブラウザ上で動作する高度なAIアシスタントを提供します。

## 特徴・基本機能

- 🤖 **AIエージェント搭載**: LangChain と LangGraph を採用した自律型エージェント。
- 🌐 **ブラウザ操作**: ページ遷移、コンテンツ取得、要素クリック・入力、ファイルダウンロードなどを実行可能。
- 🔌 **MCP (Model Context Protocol) 対応**: リモートMCPサーバと接続し、エージェントの機能を拡張できます。設定UIからサーバの追加・編集・接続テストが可能。
- 💬 **会話履歴管理**: 会話のセッション管理、過去の会話の閲覧・再開に対応。

## 対応LLMプロバイダ

Conduitは以下のLLMプロバイダに対応しています。

- **OpenAI / OpenAI互換**: `gpt-4o`, `deepseek-chat` 等、多くのモデルを利用可能です。
- **Ollama**: ローカル環境で動作するモデル（`llama3.1`, `phi3` 等）を利用可能です。

## クイックスタート

### インストール

```bash
git clone https://github.com/roamer7038/conduit.git
cd conduit
pnpm install
```

### 開発

開発サーバを起動すると、コードの変更が自動的にリロードされます。

```bash
pnpm dev
```

コマンド実行後、`.output/chrome-mv3` ディレクトリをブラウザに読み込ませてください。

1.  Chromeで `chrome://extensions/` を開く
2.  「デベロッパーモード」をオンにする
3.  「パッケージ化されていない拡張機能を読み込む」から `.output/chrome-mv3` を選択

### 設定

拡張機能のアイコンをクリックしてサイドパネルを開き、設定画面（歯車アイコン）からLLMのAPIキーやモデル名、MCPサーバのアドレスを入力してください。

1. LLMプロバイダを設定
2. エージェント設定でプロバイダとモデルを選択
3. MCPサーバを設定、エージェント設定からMCPツールを有効化
4. 会話を開始

## ドキュメント

技術スタック、アーキテクチャ、主要なモジュールの説明は以下のドキュメントを参照してください。

- [Architecture and Technical Stack](docs/architecture.md)

## ライセンス

本プロジェクトは[MIT License](LICENSE)のもとで公開されています。
