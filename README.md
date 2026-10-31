# 3D Player

ブラウザ上で3Dキャラクターと遊べる、子ども向けのインタラクティブプレイヤーです。
キャラクターを選択し、動かしたり、色を変えたり、着せ替えや写真撮影を楽しめます。

## URL

GitHub Pagesで公開しているサイト：

<https://matsumana07384.github.io/3d-player/>

## 主な機能

- Pompom / Triceratops のキャラクター選択
- ジャンプ、手振り、回転、ウィンク、Hopscotch、Power Spin
- 四足歩行キャラクター向けの専用アニメーションプロファイル
- ドラッグによる3Dモデルの回転
- 色変更と色プリセット
- リボン、メガネ、マント、ネコ耳の着せ替え
- 昼、夜、海、宇宙、お菓子の国の背景切り替え
- 写真モード、フレーム、スタンプ
- PNGスクリーンショットのローカル保存
- タップ、ジャンプ、ウィンクなどの効果音
- 効果音のミュート切り替え
- PC・スマートフォン対応

## 画面の使い方

1. トップページでキャラクターを選択します
2. `Play` からキャラクターを動かします
3. `Colors` で色を変更します
4. `Dress Up` でアクセサリーを選びます
5. `World` で背景を変更します
6. `🖼️ Mode` で写真モードを開き、フレームやスタンプを追加します
7. `📸 Photo` または写真モードの `Save` で画像を保存します

文字をまだ読めない子どもでも遊べるよう、絵文字・短い英語・アニメーション・音によるフィードバックを重視しています。

## 技術構成

- HTML / CSS / JavaScript
- [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js)
- Web Audio API（短い効果音の生成）
- SVG favicon
- 外部サーバーやバックエンドを使用しない静的サイト

## ディレクトリ構成

```text
/
├─ index.html                  # キャラクター選択画面
├─ player/
│  ├─ index.html               # 共通プレイヤー画面
│  ├─ player.js                # 共通UI・描画・操作・写真モード
│  └─ player.css               # 共通スタイル
├─ characters/
│  ├─ pompom.js                # Pompomのモデル定義
│  └─ triceratops.js           # Triceratopsのモデル定義
├─ pompom/
│  ├─ index.html               # 旧URLからの互換リダイレクト
│  └─ favicon.svg              # 🍮🤖 favicon
├─ FEATURE_REQUIREMENTS.md     # 今後の子ども向け機能の要件定義
└─ package.json
```

### キャラクター追加

キャラクター生成ファクトリに `animationProfile` を持たせ、`player/player.js` の
`characterFactories` と `animationProfiles` に登録します。

キャラクターごとに対応するアニメーションだけを有効化できるため、二足歩行と四足歩行のように体の構造が異なるキャラクターにも対応できます。

## ローカルで起動

Node.jsを用意したうえで、リポジトリのルートで実行します。

```bash
npm install
npm run server
```

ブラウザで <http://localhost:3000/> を開いてください。

## GitHub Pagesで公開

1. GitHubリポジトリの Settings を開く
2. Pages を開く
3. 公開元に `main` ブランチのルートディレクトリを指定する
4. 保存後、表示されたURLへアクセスする

本プロジェクトは静的ファイルだけで構成されているため、サーバーサイドの設定は必要ありません。

## AIの利用

このリポジトリの開発では、実装・リファクタリング・UI設計・要件整理にAI（OpenAI Codex）を利用しています。

AIはコード作成の補助として使用し、動作確認、構成判断、子ども向けの操作性調整はリポジトリ上で確認しながら進めています。

## 利用範囲・ライセンス

本プロジェクトは、完全家庭内用の個人開発です。

- 家庭内での個人的な利用のみを想定しています
- 無断での転載、複製、改変、再配布、商用利用を禁止します
- ソースコード、画像、モデル、音声、その他の同梱素材を含め、許可なく公開・配布しないでください
