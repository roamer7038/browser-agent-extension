/** @type {import('prettier').Config} */
export default {
  arrowParens: 'always', // アロー関数の引数が1つの場合でも括弧を省略しない
  bracketSpacing: true, // オブジェクトのブラケット前後にスペースを入れる
  htmlWhitespaceSensitivity: 'css', // HTMLの空白文字の扱いをCSSに合わせる
  insertPragma: false, // ファイルの先頭にPrettierのフォーマット情報を挿入しない
  jsxSingleQuote: true, // JSXでシングルクォートを使わない
  printWidth: 120, // 120字で折り返す
  proseWrap: 'preserve', // マークダウンのテキストの折り返しを維持する
  quoteProps: 'as-needed', // オブジェクトのプロパティ名を必要な場合のみクォートする
  requirePragma: false, // ファイルの先頭にPrettierのフォーマット情報がなくてもフォーマットする
  semi: true, // セミコロンをつける
  singleQuote: true, // シングルクォートを使う
  tabWidth: 2, // インデントは2スペース
  trailingComma: 'none', // 末尾のカンマを削除
  useTabs: false // インデントにスペースを使う
};
