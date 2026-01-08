// shogi.js

export class BitBoard {
    constructor() {
        this.pieces = {
            P: 0n, L: 0n, N: 0n, S: 0n, G: 0n, B: 0n, R: 0n, K: 0n,
            '+P': 0n, '+L': 0n, '+N': 0n, '+S': 0n, '+B': 0n, '+R': 0n,
            p: 0n, l: 0n, n: 0n, s: 0n, g: 0n, b: 0n, r: 0n, k: 0n,
            '+p': 0n, '+l': 0n, '+n': 0n, '+s': 0n, '+b': 0n, '+r': 0n
        };
        this.hand = { black: {}, white: {} };
        this.turn = "black";
        this.history = [];
        this.init();
    }

    init() {
        const sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
        this.fromSFEN(sfen);
        this.history = [];
        this.moveNumber = 1;
    }


    clone() {
        const copy = Object.create(BitBoard.prototype);
        copy.pieces = {};
        for (const k in this.pieces) copy.pieces[k] = this.pieces[k];
        copy.hand = {
            black: { ...this.hand.black },
            white: { ...this.hand.white }
        };
        copy.turn = this.turn;
        copy.history = [];
        return copy;
    }


    fromSFEN(sfen) {
        const parts = sfen.split(' ');
        const boardSfen = parts[0];
        const turnSfen = parts[1];
        const handSfen = parts[2] || "-";
        const moveNumberSfen = parts[3];

        // 盤上駒セット
        for (const k in this.pieces) this.pieces[k] = 0n;
        let rank = 0, file = 0;
        for (let i = 0; i < boardSfen.length; i++) {
            let c = boardSfen[i];
            if (c === "/") { rank++; file = 0; continue; }
            if (c >= "1" && c <= "9") { file += Number(c); continue; }
            let piece = c;
            if (c === "+") { i++; piece = "+" + boardSfen[i]; }
            const index = rank * 9 + file;
            this.setPiece(piece, index);
            file++;
        }

        // 手番セット
        this.turn = turnSfen === "b" ? "black" : "white";

        // 持ち駒セット
        this.hand.black = {};
        this.hand.white = {};
        if (handSfen !== "-") {
            let count = "";
            for (const c of handSfen) {
                if (c >= "1" && c <= "9") { count += c; continue; }
                const n = count === "" ? 1 : parseInt(count);
                if (c.toUpperCase() === c) this.hand.black[c] = n;
                else this.hand.white[c.toUpperCase()] = n;
                count = "";
            }
        }

        // --- 手番番号セット ---
        this.moveNumber = moveNumberSfen ? parseInt(moveNumberSfen) : 1;
    }


    setPiece(piece, index) {
        if (!(piece in this.pieces)) throw new Error(`Unknown piece: ${piece}`);
        this.pieces[piece] |= 1n << BigInt(index);
    }

    removePiece(piece, index) {
        if (!(piece in this.pieces)) throw new Error(`Unknown piece: ${piece}`);
        this.pieces[piece] &= ~(1n << BigInt(index));
    }

    getPieceAt(index) {
        for (const [piece, bb] of Object.entries(this.pieces)) {
            if ((BigInt(bb || 0n) >> BigInt(index)) & 1n) return piece;
        }
        return '.';
    }

    occupied() {
        let occ = 0n;
        for (const bb of Object.values(this.pieces)) occ |= BigInt(bb || 0n);
        return occ;
    }

    occupiedBy(color) {
        let occ = 0n;
        const keys = color === "black"
            ? ["P", "L", "N", "S", "G", "B", "R", "K", "+P", "+L", "+N", "+S", "+B", "+R"]
            : ["p", "l", "n", "s", "g", "b", "r", "k", "+p", "+l", "+n", "+s", "+b", "+r"];
        for (const k of keys) { const bb = this.pieces[k]; if (!bb) continue; occ |= BigInt(bb); }
        return occ;
    }

    canPromote(from, to) {
        const piece = this.getPieceAt(from).toUpperCase();
        if (piece === "P" || piece === "L" || piece === "N" || piece === "S" || piece === "B" || piece === "R") {
            const fromRank = Math.floor(from / 9);
            const toRank = Math.floor(to / 9);
            if (this.turn === "black") {
                return fromRank <= 2 || toRank <= 2;
            } else {
                return fromRank >= 6 || toRank >= 6;
            }
        }
        return false;
    }

    mustPromote(from, to) {
        // 後々実装
    }

    movePiece(from, to, dropPiece = null, promote = false) {
        if (dropPiece) {
            // 持ち駒打ち
            const boardPiece = this.turn === "black" ? dropPiece : dropPiece.toLowerCase();
            this.setPiece(boardPiece, to); // 修正
            this.hand[this.turn][dropPiece]--;
        } else {
            let piece = this.getPieceAt(from);

            // 成る場合は + を付与
            if (promote && !piece.startsWith("+") && piece.toUpperCase() !== "K" && piece.toUpperCase() !== "G") {
                piece = piece.startsWith("+") ? piece : (piece.toUpperCase() === piece ? "+" + piece : "+" + piece.toLowerCase());
            }

            this.setPiece(piece, to);             // 修正
            this.removePiece(this.getPieceAt(from), from); // 修正
        }

        // 手番切替
        this.turn = this.turn === "black" ? "white" : "black";
    }


    addHandPiece(color, piece, count = 1) {
        if (!this.hand[color][piece]) this.hand[color][piece] = 0;
        this.hand[color][piece] += count;
    }

    removeHandPiece(color, piece, count = 1) {
        if (!this.hand[color][piece] || this.hand[color][piece] < count)
            throw new Error(`持ち駒が足りません: ${color} ${piece}`);
        this.hand[color][piece] -= count;
        if (this.hand[color][piece] === 0) delete this.hand[color][piece];
    }

    dropPiece(color, piece, index) {
        this.removeHandPiece(color, piece);
        const boardPiece = color === "black" ? piece : piece.toLowerCase();
        this.setPiece(boardPiece, index);
    }

    attacksFrom(piece, index) {
        const attacks = [];
        const rank = Math.floor(index / 9);
        const file = index % 9;
        const isBlack = piece === piece.toUpperCase();

        const occupiedBB = this.occupied();
        const friendlyBB = this.occupiedBy(isBlack ? "black" : "white");

        const inBoard = (r, f) => r >= 0 && r < 9 && f >= 0 && f < 9;
        const idxOf = (r, f) => r * 9 + f;

        const slide = (dr, df) => {
            let r = rank + dr, f = file + df;
            while (inBoard(r, f)) {
                const idx = idxOf(r, f);
                if ((friendlyBB >> BigInt(idx)) & 1n) break;
                attacks.push(idx);
                if ((occupiedBB >> BigInt(idx)) & 1n) break;
                r += dr;
                f += df;
            }
        };

        const addIfValid = (dr, df) => {
            const r = rank + dr, f = file + df;
            if (!inBoard(r, f)) return;
            const idx = idxOf(r, f);
            if (!((friendlyBB >> BigInt(idx)) & 1n)) attacks.push(idx);
        };

        switch (piece.toUpperCase()) {
            case "P": addIfValid(isBlack ? -1 : 1, 0); break;
            case "L": slide(isBlack ? -1 : 1, 0); break;
            case "N": addIfValid(isBlack ? -2 : 2, -1); addIfValid(isBlack ? -2 : 2, 1); break;
            case "S":
                addIfValid(isBlack ? -1 : 1, -1); addIfValid(isBlack ? -1 : 1, 0); addIfValid(isBlack ? -1 : 1, 1);
                addIfValid(isBlack ? 1 : -1, -1); addIfValid(isBlack ? 1 : -1, 1);
                break;
            case "G":
            case "+P": case "+L": case "+N": case "+S":
                addIfValid(isBlack ? -1 : 1, -1); addIfValid(isBlack ? -1 : 1, 0); addIfValid(isBlack ? -1 : 1, 1);
                addIfValid(0, -1); addIfValid(0, 1); addIfValid(isBlack ? 1 : -1, 0);
                break;
            case "B":
                slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
                if (piece.startsWith("+")) { addIfValid(-1, 0); addIfValid(1, 0); addIfValid(0, -1); addIfValid(0, 1); }
                break;
            case "R":
                slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
                if (piece.startsWith("+")) { addIfValid(-1, -1); addIfValid(-1, 1); addIfValid(1, -1); addIfValid(1, 1); }
                break;
            case "+B":
                // 馬：斜めスライド + 1マス縦横
                slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
                addIfValid(-1, 0); addIfValid(1, 0); addIfValid(0, -1); addIfValid(0, 1);
                break;
            case "+R":
                // 龍：縦横スライド + 1マス斜め
                slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
                addIfValid(-1, -1); addIfValid(-1, 1); addIfValid(1, -1); addIfValid(1, 1);
                break;

            case "K":
                for (let dr = -1; dr <= 1; dr++) for (let df = -1; df <= 1; df++) if (dr !== 0 || df !== 0) addIfValid(dr, df);
                break;
        }

        return attacks;
    }

    isCheck(color) {
        const enemy = color === "black" ? "white" : "black";
        const kingPiece = color === "black" ? "K" : "k";

        // 玉の位置
        let kingSq = -1;
        const kingBB = this.pieces[kingPiece];
        if (!kingBB) return false;

        for (let i = 0; i < 81; i++) {
            if ((kingBB >> BigInt(i)) & 1n) {
                kingSq = i;
                break;
            }
        }
        if (kingSq === -1) return false;

        const kr = Math.floor(kingSq / 9);
        const kf = kingSq % 9;
        const isBlack = color === "black";

        const inBoard = (r, f) => r >= 0 && r < 9 && f >= 0 && f < 9;
        const idx = (r, f) => r * 9 + f;

        const enemyAt = (r, f, pieces) => {
            if (!inBoard(r, f)) return false;
            const p = this.getPieceAt(idx(r, f));
            return pieces.includes(p);
        };

        /* ---------- 歩 ---------- */
        if (enemyAt(
            kr + (isBlack ? -1 : 1),
            kf,
            enemy === "black" ? ["P"] : ["p"]
        )) return true;

        /* ---------- 桂 ---------- */
        const knightTargets = isBlack
            ? [[kr - 2, kf - 1], [kr - 2, kf + 1]]
            : [[kr + 2, kf - 1], [kr + 2, kf + 1]];

        for (const [r, f] of knightTargets)
            if (enemyAt(r, f, enemy === "black" ? ["N"] : ["n"])) return true;

        /* ---------- 金・成駒 ---------- */
        const goldMoves = isBlack
            ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]]
            : [[1, -1], [1, 0], [1, 1], [0, -1], [0, 1], [-1, 0]];

        for (const [dr, df] of goldMoves)
            if (enemyAt(
                kr + dr,
                kf + df,
                enemy === "black"
                    ? ["G", "+P", "+L", "+N", "+S"]
                    : ["g", "+p", "+l", "+n", "+s"]
            )) return true;

        /* ---------- 銀 ---------- */
        const silverMoves = isBlack
            ? [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 1]]
            : [[1, -1], [1, 0], [1, 1], [-1, -1], [-1, 1]];

        for (const [dr, df] of silverMoves)
            if (enemyAt(
                kr + dr,
                kf + df,
                enemy === "black" ? ["S"] : ["s"]
            )) return true;

        /* ---------- 玉 ---------- */
        for (let dr = -1; dr <= 1; dr++)
            for (let df = -1; df <= 1; df++)
                if (dr || df)
                    if (enemyAt(
                        kr + dr,
                        kf + df,
                        enemy === "black" ? ["K"] : ["k"]
                    )) return true;

        /* ---------- 飛車・角・香（スライド） ---------- */
        const slide = (dr, df, targets) => {
            let r = kr + dr, f = kf + df;
            while (inBoard(r, f)) {
                const p = this.getPieceAt(idx(r, f));
                if (p !== '.') return targets.includes(p);
                r += dr; f += df;
            }
            return false;
        };

        // 飛車スライド判定
        if (
            slide(-1, 0, enemy === "black" ? ["R", "+R", "L"] : ["r", "+r", "l"]) ||
            slide(1, 0, enemy === "black" ? ["R", "+R"] : ["r", "+r"]) ||
            slide(0, -1, enemy === "black" ? ["R", "+R"] : ["r", "+r"]) ||
            slide(0, 1, enemy === "black" ? ["R", "+R"] : ["r", "+r"])
        ) return true;

        // 角スライド判定
        if (
            slide(-1, -1, enemy === "black" ? ["B", "+B"] : ["b", "+b"]) ||
            slide(-1, 1, enemy === "black" ? ["B", "+B"] : ["b", "+b"]) ||
            slide(1, -1, enemy === "black" ? ["B", "+B"] : ["b", "+b"]) ||
            slide(1, 1, enemy === "black" ? ["B", "+B"] : ["b", "+b"])
        ) return true;

        /* ---------- 馬・龍の追加1マス利き判定 ---------- */
        // 馬：縦横1マス
        const horseOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, df] of horseOffsets)
            if (enemyAt(kr + dr, kf + df, enemy === "black" ? ["+B"] : ["+b"])) return true;

        // 龍：斜め1マス
        const dragonOffsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, df] of dragonOffsets)
            if (enemyAt(kr + dr, kf + df, enemy === "black" ? ["+R"] : ["+r"])) return true;

        return false;
    }


    isCheckMate() {
        const moves = this.generateLegalMoves();
        return moves.length === 0;
    }


    isGameOver() {
        // 現在は連続王手の千日手・持将棋は判定しない
        const moves = this.generateLegalMoves();
        return moves.length === 0;
    }


    // ------------------------
    // USI表記変換
    // ------------------------
    indexToUSI(index) {
        const rank = Math.floor(index / 9);
        const file = index % 9;
        const usiFile = 9 - file;
        const usiRank = String.fromCharCode('a'.charCodeAt(0) + rank);
        return `${usiFile}${usiRank}`;
    }

    moveToUSI(move) {
        if (move.drop) {
            return `${move.piece.toUpperCase()}*${this.indexToUSI(move.to)}`;
        } else {
            const fromStr = this.indexToUSI(move.from);
            const toStr = this.indexToUSI(move.to);
            return move.promote ? `${fromStr}${toStr}+` : `${fromStr}${toStr}`;
        }
    }

    // ------------------------
    // 合法手生成
    // ------------------------
    // --- 合法手生成 ---
    generateLegalMoves() {
        const moves = [];
        const color = this.turn;
        const pieceKeys = color === "black"
            ? ["P", "L", "N", "S", "G", "B", "R", "K", "+P", "+L", "+N", "+S", "+B", "+R"]
            : ["p", "l", "n", "s", "g", "b", "r", "k", "+p", "+l", "+n", "+s", "+b", "+r"];

        // --- 盤上駒移動 ---
        for (const piece of pieceKeys) {
            const bb = BigInt(this.pieces[piece] || 0n);
            for (let from = 0; from < 81; from++) {
                if (!((bb >> BigInt(from)) & 1n)) continue;
                const targets = this.attacksFrom(piece, from);
                for (const to of targets) {
                    const rank = Math.floor(to / 9);
                    const isBlack = color === "black";
                    let promoteMoves = [{ promote: false }, { promote: true }];

                    switch (piece.toUpperCase()) {
                        case "P": case "L":
                            if ((isBlack && rank === 0) || (!isBlack && rank === 8)) promoteMoves = [{ promote: true }];
                            else if ((isBlack && rank > 2) || (!isBlack && rank < 6)) promoteMoves = [{ promote: false }];
                            break;
                        case "N":
                            if ((isBlack && rank <= 1) || (!isBlack && rank >= 7)) promoteMoves = [{ promote: true }];
                            else promoteMoves = [{ promote: false }];
                            break;
                        case "S": case "B": case "R":
                            const inEnemyCamp = (isBlack && rank <= 2) || (!isBlack && rank >= 6);
                            promoteMoves = inEnemyCamp ? [{ promote: false }, { promote: true }] : [{ promote: false }];
                            break;
                        default: promoteMoves = [{ promote: false }];
                    }

                    for (const { promote } of promoteMoves) {
                        const move = { from, to, piece, promote, drop: false };
                        this.applyMove(move);
                        if (!this.isCheck(color)) moves.push(move);
                        this.undoMove();
                    }
                }
            }
        }

        // --- 持ち駒打ち ---
        for (const [piece, count] of Object.entries(this.hand[color] || {})) {
            if (count <= 0) continue;
            for (let to = 0; to < 81; to++) {
                if (this.getPieceAt(to) !== '.') continue;
                const rank = Math.floor(to / 9);
                const file = to % 9;

                // 二歩チェック
                if (piece.toUpperCase() === "P") {
                    let hasPawn = false;
                    for (let r = 0; r < 9; r++) {
                        const p = this.getPieceAt(r * 9 + file);
                        if ((color === "black" && p === "P") || (color === "white" && p === "p")) { hasPawn = true; break; }
                    }
                    if (hasPawn) continue;
                }

                // 打てない段チェック
                if (piece.toUpperCase() === "P" || piece.toUpperCase() === "L")
                    if ((color === "black" && rank === 0) || (color === "white" && rank === 8)) continue;
                if (piece.toUpperCase() === "N")
                    if ((color === "black" && rank <= 1) || (color === "white" && rank >= 7)) continue;

                const move = { from: null, to, piece, promote: false, drop: true };
                this.applyMove(move);
                if (!this.isCheck(color) && !this.isDropMate(move)) moves.push(move);
                this.undoMove();
            }
        }

        return moves;
    }

    // ------------------------
    // USI形式で合法手取得
    // ------------------------
    generateUSIMoves() {
        return this.generateLegalMoves().map(m => this.moveToUSI(m));
    }


    // ------------------------
    // 特定の駒が進める先 index 一覧
    // ------------------------
    getMovableSquares(fromIndex) {
        const piece = this.getPieceAt(fromIndex);
        if (piece === '.') return [];

        const color = piece === piece.toUpperCase() ? "black" : "white";
        if (color !== this.turn) return [];

        const moves = this.generateLegalMoves();

        const targets = new Set();

        for (const move of moves) {
            if (move.drop) continue;
            if (move.from === fromIndex) {
                targets.add(move.to);
            }
        }

        return [...targets];
    }


    isDropMate(move) {
        // 歩打ち以外は対象外
        if (!move.drop || move.piece.toUpperCase() !== "P") return false;

        // applyMove 後に呼ばれている前提
        const attacker = this.turn === "black" ? "white" : "black"; // 打った側
        const defender = this.turn; // 受ける側

        // 1. そもそも王手でなければ打ち歩詰めではない
        if (!this.isCheck(defender)) return false;

        // 2. 相手に1手でも合法手があれば詰みではない
        const savedTurn = this.turn;
        this.turn = defender;

        const replies = this.generateLegalMoves();

        this.turn = savedTurn;

        return replies.length === 0;
    }


    applyMove(move) {
        const { from, to, piece, promote, drop } = move;
        const diff = { ...move, captured: null };

        if (drop) {
            this.removeHandPiece(this.turn, piece);
            const bp = this.turn === "black" ? piece : piece.toLowerCase();
            this.setPiece(bp, to);
            diff.placedPiece = bp;
            this.history.push(diff);
            this.switchTurn();
            return;
        }

        const boardPiece = this.getPieceAt(from);
        if (boardPiece === '.') throw new Error(`移動元に駒がない: ${from}`);

        const captured = this.getPieceAt(to);
        if (captured !== '.') {
            diff.captured = captured;
            const base = captured.startsWith("+") ? captured[1] : captured;
            this.addHandPiece(
                this.turn,
                this.turn === "black" ? base.toUpperCase() : base.toUpperCase()
            );
            this.removePiece(captured, to);
        }

        this.removePiece(boardPiece, from);

        let placedPiece = boardPiece;
        if (promote && !boardPiece.startsWith("+")) {
            placedPiece = boardPiece === boardPiece.toUpperCase()
                ? "+" + boardPiece
                : "+" + boardPiece.toLowerCase();
        }

        this.setPiece(placedPiece, to);
        diff.placedPiece = placedPiece;
        this.history.push(diff);
        this.switchTurn();
        this.moveNumber++;
    }


    undoMove() {
        if (this.history.length === 0) return;
        const diff = this.history.pop();
        this.switchTurn();

        if (diff.drop) {
            this.removePiece(diff.placedPiece, diff.to);
            this.addHandPiece(this.turn, diff.piece);
            return;
        }

        this.setPiece(diff.piece, diff.from);
        this.removePiece(diff.placedPiece, diff.to);

        if (diff.captured) {
            this.setPiece(diff.captured, diff.to);
            const base = diff.captured.startsWith("+") ? diff.captured[1] : diff.captured;
            this.removeHandPiece(
                this.turn,
                base.toUpperCase()
            );
        }

        this.moveNumber--;
    }


    switchTurn() { this.turn = this.turn === "black" ? "white" : "black"; }


    toSFEN() {
        // --- 盤上駒 ---
        let sfenBoard = "";
        for (let rank = 0; rank < 9; rank++) {
            let empty = 0;
            for (let file = 0; file < 9; file++) {
                const idx = rank * 9 + file;
                const piece = this.getPieceAt(idx);
                if (piece === '.') {
                    empty++;
                } else {
                    if (empty > 0) { sfenBoard += empty; empty = 0; }
                    sfenBoard += piece;
                }
            }
            if (empty > 0) sfenBoard += empty;
            if (rank !== 8) sfenBoard += "/";
        }

        // --- 手番 ---
        const turnChar = this.turn === "black" ? "b" : "w";

        // --- 持ち駒 ---
        const handPieces = ["P", "L", "N", "S", "G", "B", "R"];
        let handStr = "";
        const counts = {};

        for (const color of ["black", "white"]) {
            for (const piece of handPieces) {
                const n = this.hand[color][piece] || 0;
                if (n <= 0) continue;
                const c = color === "black" ? piece : piece.toLowerCase();
                counts[c] = (counts[c] || 0) + n;
            }
        }

        // SFENは順番 P L N S G B R 先手後手をまとめて
        const order = ["P", "L", "N", "S", "G", "B", "R", "p", "l", "n", "s", "g", "b", "r"];
        for (const k of order) {
            if (counts[k]) handStr += (counts[k] > 1 ? counts[k] : "") + k;
        }
        if (handStr === "") handStr = "-";

        // --- 手順番号（今回は1固定） ---
        const moveNumber = this.moveNumber;

        return `${sfenBoard} ${turnChar} ${handStr} ${moveNumber}`;
    }


    toString() {
        let str = "";
        for (let r = 0; r < 9; r++) {
            for (let f = 0; f < 9; f++) str += this.getPieceAt(r * 9 + f);
            str += "\n";
        }
        str += `Turn: ${this.turn}\n`;
        str += `Hands:\n  Black: ${JSON.stringify(this.hand.black)}\n  White: ${JSON.stringify(this.hand.white)}\n`;
        return str;
    }
}
