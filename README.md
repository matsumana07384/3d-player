# 3d-player
from ai

## プレイヤー構成

共通処理とキャラクター定義を分離しています。

```text
/
├─ index.html
├─ player/
│  ├─ index.html
│  ├─ player.js
│  └─ player.css
└─ characters/
   └─ pompom.js
```

プレイヤーは `player/?character=pompom` のクエリでキャラクターを選択します。
新しいキャラクターは `characters/` にモデルファクトリを追加し、`player/player.js` の
`characterFactories` と `animationProfiles` に登録します。

## キャラクターの差し替え

`pompom/index.html` の `body[data-character]` で使用するキャラクター名を選択します。
キャラクター生成は `pompom/script.js` の `characterFactories` に登録するファクトリへ分離しており、
プレイヤー本体は `chara`、`bouncer`、腕・足・頭などの共通インターフェースだけを利用します。

新しいキャラクターは `createPompomCharacter()` と同じ形式で生成し、
`characterFactories` に名前を追加すれば、操作・アニメーション・スクリーンショット機能を再利用できます。

### アニメーションプロファイル

キャラクター生成結果の `animationProfile` が、`animationProfiles` の対応表を選択します。
二足歩行のポムポムは `pompom` プロファイルを使います。四足歩行キャラクターを追加する場合は、
四足用の `walk`、`run`、`sit`、`tailWag` などを持つ別プロファイルを登録し、
対応していない既存ボタンは自動的に無効化できます。
