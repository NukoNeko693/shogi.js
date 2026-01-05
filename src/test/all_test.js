import { BitBoard } from './src/Board.js';

function testBitBoard() {
    console.log("=== BitBoard 全関数テスト ===");

    // 1. 初期化テスト
    const board = new BitBoard();
    console.log("初期局面:");
    console.log(board.toString());

    const legalMoves = board.generateLegalMoves();
    console.log(`初期局面の合法手数: ${legalMoves.length}`);
    legalMoves.forEach((move, idx) => {
        if (move.drop) {
            console.log(`${idx + 1}: ${move.piece} を ${move.to} に打つ`);
        } else {
            console.log(`${idx + 1}: ${move.piece} ${move.from} -> ${move.to}${move.promote ? " 成" : ""}`);
        }
    });

    // 2. クローンテスト
    const copy = board.clone();
    console.log("クローンした局面:");
    console.log(copy.toString());

    // 3. 駒取得・配置テスト
    console.log("駒取得テスト (左上9一):", board.getPieceAt(0));
    board.setPiece('P', 40);
    console.log("中央に歩を置く:");
    console.log(board.getPieceAt(40));

    // 4. 駒削除テスト
    board.removePiece('P', 40);
    console.log("中央の歩を削除:");
    console.log(board.getPieceAt(40));

    // 5. 持ち駒操作テスト
    board.addHandPiece('black', 'R', 1);
    board.removeHandPiece('black', 'R', 1);
    console.log("持ち駒テスト (黒飛車):", board.hand.black);

    // 6. 打ち駒テスト
    board.addHandPiece('black', 'P', 1);
    board.dropPiece('black', 'P', 40);
    console.log("打ち駒後:");
    console.log(board.toString());

    // 7. 利き計算テスト
    const attacks = board.attacksFrom('P', 40);
    console.log("中央歩の利き:", attacks);

    // 8. 王手判定テスト
    console.log("黒玉に王手？", board.isCheck('black'));

    // 9. 王手回避合法手生成テスト
    const legalMoves2 = board.generateLegalMoves();
    console.log("生成された合法手数:", legalMoves2.length);
    console.log("一部の合法手:", legalMoves2.slice(0, 5));

    // 10. applyMove / undoMove テスト
    if (legalMoves2.length > 0) {
        const move = legalMoves2[0];
        console.log("1手目を適用:", move);
        board.applyMove(move);
        console.log(board.toString());

        board.undoMove();
        console.log("undo後:");
        console.log(board.toString());
    }

    // 11. 打ち歩詰め判定テスト
    const dropMove = { from: null, to: 4, piece: 'P', promote: false, drop: true };
    console.log("打ち歩詰め判定:", board.isDropMate(dropMove));
}

testBitBoard();
