# 3d-player
from ai

## キャラクターの差し替え

`pompom/index.html` の `body[data-character]` で使用するキャラクター名を選択します。
キャラクター生成は `pompom/script.js` の `characterFactories` に登録するファクトリへ分離しており、
プレイヤー本体は `chara`、`bouncer`、腕・足・頭などの共通インターフェースだけを利用します。

新しいキャラクターは `createPompomCharacter()` と同じ形式で生成し、
`characterFactories` に名前を追加すれば、操作・アニメーション・スクリーンショット機能を再利用できます。
