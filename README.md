# shogi.js

JavaScriptで将棋（日本将棋）のロジックを扱うためのライブラリです。  
UIや描画は含まず、盤面・駒などの純粋なロジック部分のみを対象とします。

## 目的

- 将棋盤面の管理
- 駒データの表現
- 将来の拡張（指し手生成、成り、持ち駒など）に耐える構成

## 対応環境

- Node.js
- ブラウザ（ES Modules）

## 現在の状態

- 盤面クラス（9×9）
- 駒クラス
- 基本的な定数定義

※ まだルール判定や合法手生成は実装されていません。

## 使い方（暫定）

```js
import { Board, Piece, PLAYER, PIECE_TYPE } from "./src/index.js";

const board = new Board();
const piece = new Piece(PIECE_TYPE.FU, PLAYER.BLACK);
board.set(4, 6, piece);
```

## ライセンス

MIT LICENSE
