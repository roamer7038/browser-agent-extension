# WXT + React + Shadcn Starter

WXT、React、Shadcn UIを組み合わせたブラウザ拡張機能の開発テンプレートです。モダンな技術スタックで、Chrome/Firefox対応の拡張機能を素早く開発できます。

## 特徴

- 🚀 **WXT**: Next Generation Web Extension Framework
- ⚛️ **React 19**: 最新のReactによるコンポーネント開発
- 🎨 **Shadcn UI**: 美しく再利用可能なUIコンポーネント
- 🎯 **TypeScript**: 型安全な開発環境
- 💨 **Tailwind CSS 4.x**: ユーティリティファーストのスタイリング
- 🔥 **Hot Reload**: 開発時の高速リロード
- 🛠️ **コード品質ツール**: Prettier、Husky、lint-staged

## クイックスタート

### インストール

```bash
git clone https://github.com/roamer7038/wxt-react-shadcn-starter.git
cd wxt-react-shadcn-starter
pnpm install
```

### 開発

開発サーバーを起動すると、コードの変更が自動的にブラウザに反映されます。

**Chrome向け開発:**

```bash
pnpm dev
```

**Firefox向け開発:**

```bash
pnpm dev:firefox
```

開発サーバー起動後、`.output/chrome-mv3`（または`.output/firefox-mv3`）ディレクトリが生成されます。

### ブラウザへの読み込み

**Chrome:**

1. `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `.output/chrome-mv3` ディレクトリを選択

**Firefox:**

1. `about:debugging#/runtime/this-firefox` を開く
2. 「一時的なアドオンを読み込む」をクリック
3. `.output/firefox-mv3/manifest.json` を選択

### ビルド

本番用のビルドを作成します。

**Chrome向けビルド:**

```bash
pnpm build
```

**Firefox向けビルド:**

```bash
pnpm build:firefox
```

ビルド成果物は `.output/chrome-mv3` または `.output/firefox-mv3` ディレクトリに出力されます。

### 配布用ZIPの作成

ストアへの提出用にZIPファイルを作成します。

```bash
pnpm zip          # Chrome用
pnpm zip:firefox  # Firefox用
```

ZIPファイルは `.output` ディレクトリに生成されます。

## 利用可能なコマンド

| コマンド             | 説明                         |
| -------------------- | ---------------------------- |
| `pnpm dev`           | Chrome向け開発サーバー起動   |
| `pnpm dev:firefox`   | Firefox向け開発サーバー起動  |
| `pnpm build`         | Chrome向け本番ビルド         |
| `pnpm build:firefox` | Firefox向け本番ビルド        |
| `pnpm zip`           | Chrome向けZIP作成            |
| `pnpm zip:firefox`   | Firefox向けZIP作成           |
| `pnpm compile`       | TypeScriptの型チェック       |
| `pnpm format`        | Prettierでコード整形         |
| `pnpm format:check`  | コード整形のチェック         |
| `pnpm clean`         | `.output` ディレクトリを削除 |

## Shadcn UIコンポーネントの追加

プロジェクトにShadcn UIコンポーネントを追加できます。

```bash
# TUIでコンポーネントを選択して追加
pnpm dlx shadcn@latest add

# 引数でコンポーネントを指定
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
```

追加されたコンポーネントは `components/ui/` ディレクトリに配置されます。

### 使用例

```tsx
import { Button } from '@/components/ui/button';

function App() {
  return (
    <Button variant='default' size='lg'>
      Click me
    </Button>
  );
}
```

## 技術スタック

| カテゴリ          | 技術         | バージョン |
| ----------------- | ------------ | ---------- |
| Framework         | WXT          | ^0.20.17   |
| UI Library        | React        | ^19.2.4    |
| Component Library | Shadcn UI    | ^3.8.5     |
| Styling           | Tailwind CSS | ^4.2.0     |
| Language          | TypeScript   | ^5.9.3     |
| Build Tool        | Vite         | ^7.3.1     |
| Code Formatter    | Prettier     | ^3.8.1     |
| Git Hooks         | Husky        | ^9.1.7     |

## 参考リンク

- [WXT Documentation](https://wxt.dev/) - WXTの公式ドキュメント（プロジェクト構造、設定、カスタマイズ方法など）
- [Shadcn UI](https://ui.shadcn.com/) - コンポーネントのドキュメントと使用例
- [React Documentation](https://react.dev/) - Reactの公式ドキュメント
- [Tailwind CSS](https://tailwindcss.com/) - Tailwind CSSのドキュメント

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。
