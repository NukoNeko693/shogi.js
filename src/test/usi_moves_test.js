import { BitBoard } from '../Board.js';

function testUSIMoves() {
    const board = new BitBoard();

    console.log("=== 初期局面 ===");
    console.log(board.toString());

    // --- USI形式の合法手を取得 ---
    const usiMoves = board.generateUSIMoves();
    console.log(`初期局面の合法手数: ${usiMoves.length}`);

    // --- 全手を表示 ---
    usiMoves.forEach((move, idx) => {
        console.log(`${idx + 1}: ${move}`);
    });
}

testUSIMoves();
