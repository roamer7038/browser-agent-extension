# Browser Agent Extension

Google Chrome向けAIエージェント拡張機能です。WXT、React 19、Shadcn UI、そしてLangGraphを活用し、ブラウザ上で動作する高度なAIアシスタントを提供します。

## 特徴

- 🤖 **AIエージェント搭載**: LangChain.js と LangGraph.js を採用した自律型エージェント。
- 🌐 **ブラウザ操作**: アクティブタブでのページ遷移、コンテンツ取得、要素クリック・入力、スクリーンショット撮影、ファイルダウンロードなどを自動実行。
- 🔌 **MCP (Model Context Protocol) 対応**: リモートMCPサーバと接続し、エージェントの機能を拡張できます。設定UIからサーバの追加・編集・削除・接続テストが可能。
- 💬 **会話履歴管理**: 会話のセッション管理、過去の会話の閲覧・再開に対応。
- ⚛️ **モダンなUI**: React 19、Tailwind CSS 4、Shadcn UIによる美しく使いやすいサイドパネルインターフェース。

## アーキテクチャ

この拡張機能は以下の主要コンポーネントで構成されています。

```
browser-agent-extension/
├── entrypoints/
│   ├── background/        # エージェントのコアロジック (Service Worker)
│   │   ├── index.ts       # メインエントリポイント、メッセージルーティング
│   │   └── handlers/      # メッセージハンドラ (chat, thread, mcp, model)
│   └── sidepanel/         # サイドパネルUI (React)
│       ├── app.tsx        # アプリケーションルート
│       └── main.tsx       # エントリポイント
├── components/
│   ├── features/          # 機能別コンポーネント
│   │   ├── chat/          # チャット画面
│   │   ├── history/       # 会話履歴画面
│   │   └── settings/      # 設定画面
│   ├── layouts/           # レイアウトコンポーネント
│   └── ui/                # Shadcn UIコンポーネント
├── hooks/                 # カスタムフック
│   ├── use-agent.ts       # エージェント通信
│   ├── use-mcp-servers.ts # MCPサーバ管理
│   ├── use-model-selection.ts # モデル選択
│   └── use-settings.ts    # 設定管理
└── lib/
    ├── agent/
    │   ├── graph/         # LangGraphエージェント定義
    │   ├── llm/           # LLMクライアント設定
    │   ├── checkpointer/  # 状態チェックポイント
    │   ├── model-cache/   # モデル一覧キャッシュ
    │   └── tools/         # エージェントツール
    │       ├── browser/   # ブラウザ操作ツール群
    │       └── mcp.ts     # MCPサーバツール統合
    ├── services/
    │   ├── crypto/        # 暗号化サービス (Web Crypto API)
    │   ├── message/       # メッセージ処理
    │   └── storage/       # Chrome Storage管理
    └── types/             # 型定義
```

### Background Script (`entrypoints/background/`)

エージェントの頭脳となる部分です。Service Workerとして動作し、LangGraphエージェントをホストします。サイドパネルからのメッセージを受け取り、適切なハンドラにルーティングします。

- **チャット処理**: ユーザのメッセージをエージェントに渡し、ツール実行を含む応答を生成
- **スレッド管理**: 会話履歴の取得・削除
- **MCP接続テスト**: リモートMCPサーバへの接続確認
- **モデル管理**: 利用可能なモデル一覧の取得・キャッシュ

### Side Panel (`entrypoints/sidepanel/`)

Chromeのサイドパネルとして動作するユーザインターフェースです。Reactで構築され、チャット、会話履歴、設定の各画面を提供します。アイコンクリックで自動的に開きます。

### Tools (`lib/agent/tools/browser/`)

エージェントが利用できるブラウザ操作ツール群です。すべてアクティブタブに対して動作します。

| ツール          | 説明                                        |
| --------------- | ------------------------------------------- |
| **Navigation**  | URL遷移、戻る、進む、リロード               |
| **Content**     | ページのテキストコンテンツ取得、DOM構造解析 |
| **Interaction** | 要素のクリック、テキスト入力、フォーム操作  |
| **Screenshot**  | アクティブタブのスクリーンショット撮影      |
| **Download**    | ファイルダウンロード                        |
| **Tabs**        | ブラウザのタブ操作                          |

### Storage (`lib/services/`)

- **CryptoService**: Web Crypto APIを利用し、APIキーをAES-GCMで暗号化して保存。鍵はIndexedDBで管理。
- **StorageService**: `chrome.storage.local` を使用して設定、会話履歴、セッション状態を管理。

## クイックスタート

### 前提条件

- Node.js (バージョン20以上推奨)
- pnpm

### インストール

```bash
git clone https://github.com/roamer7038/browser-agent-extension.git
cd browser-agent-extension
pnpm install
```

### 開発

開発サーバを起動すると、コードの変更が自動的にリロードされます。

**Google Chromeでの開発:**

```bash
pnpm dev
```

コマンド実行後、`.output/chrome-mv3` ディレクトリが生成されます。これをブラウザに読み込ませてください。

#### ブラウザへの読み込み方法

- **Chrome**: `chrome://extensions/` を開き、デベロッパーモードをオンにして「パッケージ化されていない拡張機能を読み込む」から `.output/chrome-mv3` を選択します。

### 設定

拡張機能をインストール後、アイコンをクリックしてサイドパネルを開き、設定画面（歯車アイコン）から以下を入力してください。

#### LLM設定

1.  **API Key**: OpenAI互換のAPIキー（暗号化されて保存されます）
2.  **Base URL** (任意): カスタムエンドポイントを使用する場合
3.  **Model Name** (任意): 使用するモデル名 (例: `gpt-4o`, `claude-sonnet-4-20250514` 等)

#### MCPサーバ設定

設定画面からリモートMCPサーバを追加できます。Streamable HTTPに対応しています。

1.  サーバ名とURLを入力
2.  接続テストで動作確認
3.  保存後、エージェントが自動的にMCPツールを読み込み

## ビルド

本番環境用に最適化されたビルドを作成します。

```bash
pnpm build
```

## パッケージング

ストア提出用のZIPファイルを作成します。

```bash
pnpm zip
```

## その他のコマンド

```bash
# TypeScript型チェック
pnpm compile

# コードフォーマット
pnpm format

# フォーマットチェック
pnpm format:check

# ビルド成果物の削除
pnpm clean
```

## 技術スタック

| カテゴリ            | 技術               | バージョン |
| ------------------- | ------------------ | ---------- |
| Extension Framework | **WXT**            | ^0.20.17   |
| UI Framework        | **React**          | ^19.2.4    |
| UI Components       | **Shadcn UI**      | ^3.8.5     |
| Styling             | **Tailwind CSS**   | ^4.2.0     |
| AI / LLM            | **LangChain.js**   | ^1.2.25    |
| Agent Framework     | **LangGraph.js**   | ^1.1.5     |
| Protocol            | **MCP Adapters**   | ^1.1.3     |
| Encryption          | **Web Crypto API** | Built-in   |
| Build Tool          | **Vite**           | ^7.3.1     |
| Language            | **TypeScript**     | ^5.9.3     |
| Formatter           | **Prettier**       | ^3.8.1     |

## ライセンス

MIT License
