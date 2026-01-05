# shogi.js

JavaScript（ESM）で実装された **将棋ロジック専用ライブラリ**です。  
AI用途ではなく、**Web将棋・将棋アプリのルール処理**を目的として設計されています。

BitBoard（BigInt）を用いて局面管理を行い、  
**合法手生成・王手判定・打ち歩詰め判定・USI変換**までをサポートします。

---

## 特徴

- ✅ **将棋ルールに忠実**
- ✅ 合法手生成（王手回避・成り・持ち駒打ち含む）
- ✅ **打ち歩詰め完全禁止**
- ✅ 正確な **isCheck（王手判定）**
- ✅ undoMove 完全対応（ランダム100手往復テスト済）
- ✅ USI形式出力対応
- ✅ Web用途向け（1局面あたり数十〜100回程度の計算想定）

---

## 非対応・非目的

- ❌ 探索エンジン（AI）
- ❌ 高速化特化（並列探索・ビット演算最適化など）
- ❌ 棋譜解析・評価関数

本ライブラリは **「正確性を最優先」** しています。

---

## インストール

```bash
git clone https://github.com/yourname/shogi.js
```

## 基本的な使い方

### 局面作成

```js
import { BitBoard } from "./src/Board.js";

// BitBoardの作成
const bb = new BitBoard();

// BitBoardをターミナルに表示
console.log(bb.toString());

```

### SFEN で指定局面

```js
bb.fromSFEN("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1");

```

- 盤面
- 手番
- 持ち駒

すべて正しく反映されます。

### 合法手生成

- 王手回避を含む完全合法手
- 成りの強制・任意を正確に処理
- 打ち歩詰めを除外

USI形式で欲しい場合：

```js
const usiMoves = bb.generateUSIMoves();
```

### 王手判定

```js
bb.isCheck("black");
bb.isCheck("white");
```

- 歩・香・桂・銀・金・角・飛・玉
- 成駒含む
- スライド駒も正確に判定

### 打ち歩詰め判定

```js
bb.isDropMate(move);
```

- 歩打ち限定
- 実際に合法手を生成して「逃げ道があるか」で判定

### インデックスと盤面対応

```yaml
rank 0:  0  1  2  3  4  5  6  7  8
rank 1:  9 10 11 12 13 14 15 16 17
...
rank 8: 72 73 74 75 76 77 78 79 80
```

- index = rank * 9 + file
- 先手は index - 9 が前方向

### デバッグ表示

```js
console.log(bb.toString());
```

盤面・手番・持ち駒を表示します。

## 設計方針

- 正確性 > 速度
- 可読性を優先
- Web将棋用途を想定
- BitBoard を使うが、過度な最適化は行わない

## 注意事項

現状、以下の機能は実装されていません。

- 千日手・連続王手の千日手の判定
- 持将棋の判定

## バージョン情報

- Version: 0.1.0
- Status: 開発中(experimental)

## ライセンス

本プロジェクトは MIT License のもとで公開されています。
詳細は LICENSE ファイルを参照してください。
