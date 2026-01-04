# 開発者メモ

※ 開発時のアルゴリズムに関するメモなどが書かれており、内容は整理されていません

## board.js

### インスタンス変数

```js
// turn (1で先手、-1で後手)
board.turn = 1;
// 手数
board.mn = 1;
// 盤面
board.board_piece = "(81要素の配列: Int8Array(81))";
// 先手・後手持ち駒
board.b_hand = "(Object: Int8Array())";
board.w_hand = "(Object: Int8Array())";
```

### Boardの扱い

- Int8Array(81)
