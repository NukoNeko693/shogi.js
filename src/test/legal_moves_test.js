function testRandomMovesUndo() {
    const board = new BitBoard();
    const originalState = board.toString(); // 初期局面の文字列を保持

    const moveHistory = [];

    // 100回ランダム合法手を選んで実行
    for (let i = 0; i < 100; i++) {
        const moves = board.generateLegalMoves();
        if (moves.length === 0) {
            console.log(`途中で合法手がなくなった: ${i}手目`);
            break;
        }
        // ランダムに選ぶ
        const move = moves[Math.floor(Math.random() * moves.length)];
        board.applyMove(move);
        moveHistory.push(move);
    }

    // 100回undoMoveで元に戻す
    for (let i = 0; i < moveHistory.length; i++) {
        board.undoMove();
    }

    const finalState = board.toString();

    if (originalState === finalState) {
        console.log("テスト成功 ✅ 元の局面に戻りました。");
    } else {
        console.log("テスト失敗 ❌ 元の局面に戻りませんでした。");
        console.log("初期局面:\n", originalState);
        console.log("最終局面:\n", finalState);
    }
}

// 実行
testRandomMovesUndo();
