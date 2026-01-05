import { BitBoard } from '../Shogi.js';

export function runAllTests() {
    console.log("=== BitBoard Test Start ===");

    testWrapper("fromSFEN", test_fromSFEN);
    testWrapper("attacksFrom", test_attacksFrom);
    testWrapper("isCheck", test_isCheck);
    testWrapper("apply/undo", test_apply_undo);
    testWrapper("generateLegalMoves basic", test_generateLegalMoves_basic);
    testWrapper("nifu", test_nifu);
    testWrapper("uchi-fuzume", test_uchifuzume);
    testWrapper("USI", test_USI);

    console.log("=== BitBoard Test End ===");
}

function assert(cond, msg, func) {
    if (!cond) {
        console.error(`[FAIL][${func}] ${msg}`);
        throw new Error(msg);
    }
}

function testWrapper(funcName, fn) {
    try {
        fn();
        console.log(`[OK] ${funcName}`);
    } catch (e) {
        console.error(`[ERROR][${funcName}]`, e.message);
    }
}

function test_fromSFEN() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/4k4/3p1p3/4K4 w p 1");

    assert(bb.turn === "white", "turn incorrect", "fromSFEN");
    assert(bb.getPieceAt(6 * 9 + 4) === "k", "white king missing", "fromSFEN");
    assert(bb.getPieceAt(8 * 9 + 4) === "K", "black king missing", "fromSFEN");
    assert(bb.hand.white.P === 1, "hand parse error", "fromSFEN");
}

function test_attacksFrom() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/9/4P4/4K4 b - 1");

    const from = 7 * 9 + 4;
    const atk = bb.attacksFrom("P", from);

    assert(atk.length === 1, "pawn attack count", "attacksFrom");
    assert(atk[0] === 6 * 9 + 4, "pawn attack square", "attacksFrom");
}

function test_isCheck() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/4k4/4P4/4K4 b - 1");

    assert(bb.isCheck("white") === true, "pawn check failed", "isCheck");
    assert(bb.isCheck("black") === false, "false positive check", "isCheck");
}

function test_apply_undo() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/9/4P4/4K4 b - 1");

    const move = { from: 7 * 9 + 4, to: 6 * 9 + 4, piece: "P", promote: false, drop: false };
    bb.applyMove(move);

    assert(bb.getPieceAt(6 * 9 + 4) === "P", "apply failed", "applyMove");

    bb.undoMove();
    assert(bb.getPieceAt(7 * 9 + 4) === "P", "undo failed", "undoMove");
}

function test_generateLegalMoves_basic() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/9/4P4/4K4 w - 1");

    const moves = bb.generateLegalMoves();

    assert(moves.length === 0, "illegal move count", "generateLegalMoves");
}

function test_nifu() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/9/PPPPPPPPP/4K4 b P 1");

    const moves = bb.generateLegalMoves();
    const drops = moves.filter(m => m.drop);

    assert(drops.length === 0, "nifu allowed", "generateLegalMoves");
}

function test_uchifuzume() {
    const bb = new BitBoard();
    bb.fromSFEN("9/9/9/9/9/9/4k4/3p1p3/4K4 w p 1");

    const moves = bb.generateLegalMoves();

    const illegalPawnDrop = moves.some(
        m => m.drop && m.piece === "P" && m.to === 67
    );

    assert(!illegalPawnDrop, "P*5h (打ち歩詰め) が許可されている", "isDropMate");
}

function test_USI() {
    const bb = new BitBoard();
    const move = { from: 80, to: 71, piece: "K", promote: false, drop: false };

    const usi = bb.moveToUSI(move);
    assert(usi === "1i1h", "USI format error", "moveToUSI");
}
