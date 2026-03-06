# テスト仕様書

Conduit プロジェクトのユニットテスト仕様。

## テスト環境

| 項目             | 値                                                    |
| ---------------- | ----------------------------------------------------- |
| フレームワーク   | Vitest 4.x                                            |
| プラグイン       | `WxtVitest`（WXT 公式）                               |
| DOM 環境         | jsdom                                                 |
| ストレージモック | `@webext-core/fake-browser`（`WxtVitest` が自動提供） |
| テスト配置       | コロケーション（ソースファイル隣接 `*.test.ts`）      |

### 実行コマンド

```bash
pnpm vitest run          # 全テスト実行
pnpm vitest run --ui     # UI モードで確認
pnpm vitest watch        # ウォッチモード
```

---

## 命名規則

- テストファイル: `{module-name}.test.ts`（ソースファイルと同一ディレクトリに配置）
- `describe` ブロック: エクスポートされた関数名またはクラス名
- `it` ブロック: `should + 期待動作`（英語）

---

## テスト対象一覧

### 1. `lib/utils/message-parser.ts`

LangChain の生メッセージを UI 用 `Message` 型に変換するユーティリティ。

| 関数               | テスト観点                                                         | テスト数 |
| ------------------ | ------------------------------------------------------------------ | -------- |
| `parseMessages`    | human / ai / tool / error メッセージの変換                         | 12       |
|                    | `getType()` メソッドによる型判定                                   |          |
|                    | `id` フィールドからの型推定フォールバック                          |          |
|                    | AI の `reasoning_content` / `tool_calls` / `usage_metadata` の処理 |          |
|                    | Zod バリデーション失敗時の空配列                                   |          |
|                    | 非文字列 content の JSON 文字列化                                  |          |
|                    | 不明なメッセージ型の無視                                           |          |
| `getFinalMessages` | メッセージ変換 + スクリーンショート画像の追加                      | 4        |
|                    | null/undefined/非配列の安全な処理                                  |          |

---

### 2. `lib/agent/message-mapper.ts`

LangChain メッセージをシリアライズ可能な `MappedMessage` に変換。

| 関数             | テスト観点                                                   | テスト数 |
| ---------------- | ------------------------------------------------------------ | -------- |
| `mapRawMessages` | `getType()` メソッドによる型判定                             | 11       |
|                  | `type` フィールドによる型判定                                |          |
|                  | `id` に `Human` を含む場合のフォールバック                   |          |
|                  | `tool_calls` / `additional_kwargs` / `usage_metadata` の保持 |          |
|                  | 未指定時のデフォルト値（空配列/空オブジェクト）              |          |
|                  | 空配列入力                                                   |          |

---

### 3. `lib/agent/token-calculator.ts`

スレッド内の最新 AI メッセージからトークン使用量を抽出。

| 関数                  | テスト観点                            | テスト数 |
| --------------------- | ------------------------------------- | -------- |
| `getLatestTokenUsage` | 最新 AI メッセージからの抽出          | 5        |
|                       | 空配列 → ゼロ値                       |          |
|                       | AI メッセージなし → ゼロ値            |          |
|                       | `usage_metadata` なし → ゼロ値        |          |
|                       | 複数 AI メッセージ → 最後のものを使用 |          |

---

### 4. `lib/agent/tools/tool-meta.ts`

ブラウザツールのメタデータ定義。

| 対象                | テスト観点                                      | テスト数 |
| ------------------- | ----------------------------------------------- | -------- |
| `BROWSER_TOOL_META` | ツール名の一意性                                | 7        |
|                     | カテゴリの有効値チェック                        |          |
|                     | 全エントリに非空の label/description があること |          |
|                     | 名前が `browser_` プレフィックスであること      |          |
| `getAllToolNames`   | 全ツール名の返却                                |          |
|                     | 順序の一致                                      |          |

---

### 5. `lib/types/schemas.ts`

Zod スキーマによるランタイムバリデーション。

| スキーマ                   | テスト観点                                                       | テスト数 |
| -------------------------- | ---------------------------------------------------------------- | -------- |
| `TokenUsageMetadataSchema` | 正常パース / 欠損フィールド / 型不正                             | 3        |
| `ThreadTokenUsageSchema`   | 正常パース / 欠損フィールド                                      | 2        |
| `MessageSchema`            | 正常パース（text, tool_call, optional 省略, usageMetadata 付き） | 8        |
|                            | 不正な role / type の拒否                                        |          |
|                            | 全有効 role / type の受容                                        |          |

---

### 6. `lib/agent/stream-manager.ts`

アクティブなストリーム（AbortController + Port）のライフサイクル管理。

| メソッド                | テスト観点                                     | テスト数 |
| ----------------------- | ---------------------------------------------- | -------- |
| `createStream`          | 新規ストリーム作成、AbortController 返却       | 12       |
|                         | 既存ストリームの自動 abort                     |          |
|                         | Port の関連付け                                |          |
| `getStream` / `getPort` | 正常取得、存在しない場合の戻り値               |          |
| `updatePort`            | ポート更新、存在しないストリームへの無害な操作 |          |
| `abortStream`           | abort + 削除、戻り値 true/false                |          |
| `deleteStream`          | 削除のみ（abort なし）                         |          |
| `clearDisconnectedPort` | 共有ポートの null 化、他ポートへの非影響       |          |

---

### 7. `lib/agent/llm/registry.ts`

LLM プロバイダーの登録と生成。

| メソッド           | テスト観点                                      | テスト数 |
| ------------------ | ----------------------------------------------- | -------- |
| `register` / `get` | 登録・取得、未登録時 undefined、上書き          | 7        |
| `createModel`      | 登録済みプロバイダーでの生成                    |          |
|                    | `openai-compatible` → `openai` へのマッピング   |          |
|                    | 未登録プロバイダーの `UnsupportedProviderError` |          |

---

### 8. `lib/agent/stream-processor.ts`

LangGraph ストリームイベントを Chrome Port メッセージに変換。

| イベント               | テスト観点                                    | テスト数 |
| ---------------------- | --------------------------------------------- | -------- |
| `on_chat_model_stream` | `stream_chunk` メッセージの送出、デフォルト値 | 7        |
| `on_tool_start`        | `tool_start` メッセージの送出                 |          |
| `on_tool_end`          | `tool_end` メッセージの送出                   |          |
| `on_chain_start/end`   | メッセージを送出しないこと（ログのみ）        |          |
| null port              | エラーなく動作すること                        |          |
| 複数イベント           | 正しい回数の postMessage 呼び出し             |          |

---

### 9. `lib/services/storage/core/generic-repository.ts`

Zod バリデーション付き汎用 CRUD リポジトリ。`fake-browser` 使用。

| メソッド  | テスト観点                                                | テスト数 |
| --------- | --------------------------------------------------------- | -------- |
| `getAll`  | 空ストレージ → 空配列                                     | 11       |
|           | 正常データの取得                                          |          |
|           | Zod バリデーション失敗 → 空配列（データ破損の安全な処理） |          |
| `getById` | ID 一致の取得、非存在 → null                              |          |
| `save`    | 新規作成、既存更新（同一 ID）、複数エンティティの追加     |          |
| `delete`  | 削除、非存在 ID への無害な操作                            |          |
| `saveAll` | 全件置換                                                  |          |

---

### 10. `lib/services/storage/repositories/agent-config-repository.ts`

エージェント設定の CRUD + アクティブ設定の取得ロジック。`fake-browser` 使用。

| メソッド                      | テスト観点                                                  | テスト数 |
| ----------------------------- | ----------------------------------------------------------- | -------- |
| CRUD                          | `save` / `getAll` / `getById` / `delete`                    | 9        |
| `getActiveId` / `setActiveId` | 未設定 → null、設定・取得の往復                             |          |
| `getActiveConfig`             | active ID に一致する設定の取得                              |          |
|                               | active ID の設定が見つからない → `default` へフォールバック |          |
|                               | `default` もない → 最初の設定へフォールバック               |          |
|                               | 設定が0件 → null                                            |          |

---

### 11. `lib/agent/model-cache/index.ts`

モデル一覧キャッシュの保存・取得・無効化。`fake-browser` 使用。

| 関数                                    | テスト観点                        | テスト数 |
| --------------------------------------- | --------------------------------- | -------- |
| `saveCacheWithMeta` + `getCachedModels` | 保存・取得の往復                  | 6        |
|                                         | キャッシュ未存在 → null           |          |
|                                         | API キー不一致 → null             |          |
|                                         | ベース URL 不一致 → null          |          |
|                                         | 有効期限切れ（24 時間超過）→ null |          |
| `clearModelCache`                       | クリア後に取得 → null             |          |

---

## テスト追加時のガイドライン

### 新規モジュールにテストを追加する手順

1. ソースファイルと同一ディレクトリに `{module-name}.test.ts` を作成
2. このテスト仕様書の対応セクションを追加
3. `pnpm vitest run` で全テスト PASS を確認

### テスト作成の原則

- **純粋関数を優先**: 外部依存がないロジックから先にテスト
- **Chrome Storage 依存**: `beforeEach(() => { fakeBrowser.reset(); })` でリセット
- **モックは最小限**: `vi.fn()` は外部 I/O の境界のみに使用
- **境界値を意識**: 空配列、null、undefined、不正な型のケースを含める
