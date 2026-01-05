// shogi.js

export class BitBoard {
    constructor() {
        this.pieces = {
            P: 0n, L: 0n, N: 0n, S: 0n, G: 0n, B: 0n, R: 0n, K: 0n,
            p: 0n, l: 0n, n: 0n, s: 0n, g: 0n, b: 0n, r: 0n, k: 0n,
        };
        this.hand = { black: {}, white: {} };
        this.turn = "black";
        this.history = [];
        this.init();
    }

    init() {
        const sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL";
        this.fromSFEN(sfen);
        this.hand.black = {};
        this.hand.white = {};
        this.turn = "black";
        this.history = [];
    }

    clone() {
        const copy = new BitBoard();
        for (const k in this.pieces) copy.pieces[k] = this.pieces[k];
        copy.hand.black = { ...this.hand.black };
        copy.hand.white = { ...this.hand.white };
        copy.turn = this.turn;
        copy.history = [];
        return copy;
    }

    fromSFEN(boardSfen) {
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
            const bbBig = BigInt(bb || 0n);
            if ((bbBig >> BigInt(index)) & 1n) return piece;
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

    findPieceIndex(piece) {
        const bb = BigInt(this.pieces[piece] || 0n);
        for (let i = 0; i < 81; i++) if ((bb >> BigInt(i)) & 1n) return i;
        return -1;
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

    // =====================
    // 利き・判定
    // =====================
    attacksFrom(piece, index) {
        const attacks = [];
        const rank = Math.floor(index / 9);
        const file = index % 9;
        const isBlack = piece === piece.toUpperCase();

        const occupiedBB = this.occupied();
        const friendlyBB = this.occupiedBy(isBlack ? "black" : "white");

        const inBoard = (r, f) => r >= 0 && r < 9 && f >= 0 && f < 9;
        const idxOf = (r, f) => r * 9 + f;

        // スライダー系（飛車・角・香）
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

        // 1マス移動系
        const addIfValid = (dr, df) => {
            const r = rank + dr, f = file + df;
            if (!inBoard(r, f)) return;
            const idx = idxOf(r, f);
            if (!((friendlyBB >> BigInt(idx)) & 1n)) attacks.push(idx);
        };

        switch (piece.toUpperCase()) {
            case "P":
                addIfValid(isBlack ? -1 : 1, 0); // 黒は上方向(-1)、白は下方向(+1)
                break;
            case "L":
                slide(isBlack ? -1 : 1, 0); // 香
                break;
            case "N":
                addIfValid(isBlack ? -2 : 2, -1);
                addIfValid(isBlack ? -2 : 2, 1);
                break;
            case "S":
                addIfValid(isBlack ? -1 : 1, -1);
                addIfValid(isBlack ? -1 : 1, 0);
                addIfValid(isBlack ? -1 : 1, 1);
                addIfValid(isBlack ? 1 : -1, -1);
                addIfValid(isBlack ? 1 : -1, 1);
                break;
            case "G":
            case "+P": case "+L": case "+N": case "+S":
                addIfValid(isBlack ? -1 : 1, -1);
                addIfValid(isBlack ? -1 : 1, 0);
                addIfValid(isBlack ? -1 : 1, 1);
                addIfValid(0, -1);
                addIfValid(0, 1);
                addIfValid(isBlack ? 1 : -1, 0);
                break;
            case "K":
                for (let dr = -1; dr <= 1; dr++)
                    for (let df = -1; df <= 1; df++)
                        if (dr !== 0 || df !== 0) addIfValid(dr, df);
                break;
            case "B":
                slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
                if (piece.startsWith("+")) { addIfValid(-1, 0); addIfValid(1, 0); addIfValid(0, -1); addIfValid(0, 1); }
                break;
            case "R":
                slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
                if (piece.startsWith("+")) { addIfValid(-1, -1); addIfValid(-1, 1); addIfValid(1, -1); addIfValid(1, 1); }
                break;
        }

        return attacks;
    }

    isSquareAttacked(index, byColor) {
        const keys = byColor === "black"
            ? ["P", "L", "N", "S", "G", "B", "R", "K", "+P", "+L", "+N", "+S", "+B", "+R"]
            : ["p", "l", "n", "s", "g", "b", "r", "k", "+p", "+l", "+n", "+s", "+b", "+r"];
        for (const piece of keys) {
            const bb = BigInt(this.pieces[piece] || 0n);
            for (let i = 0; i < 81; i++) {
                if ((bb >> BigInt(i)) & 1n) {
                    const attacks = this.attacksFrom(piece, i);
                    if (attacks.includes(index)) return true;
                }
            }
        }
        return false;
    }

    isCheck(color) {
        const kingEntry = Object.entries(this.pieces).find(([p, _]) => (color === "black" ? p === "K" : p === "k"));
        if (!kingEntry) return false;
        const [_, bb] = kingEntry;
        let kingIndex = -1;
        const bbBig = BigInt(bb || 0n);
        for (let i = 0; i < 81; i++) if ((bbBig >> BigInt(i)) & 1n) { kingIndex = i; break; }
        if (kingIndex === -1) return false;
        return this.isSquareAttacked(kingIndex, color === "black" ? "white" : "black");
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


    isDropMate(move) {
        if (move.piece.toUpperCase() !== "P") return false;
        const enemy = this.turn === "black" ? "white" : "black";
        const kingEntry = Object.entries(this.pieces).find(([p, _]) => (enemy === "black" ? p === "K" : p === "k"));
        if (!kingEntry) return false;
        const [_, bb] = kingEntry;
        let kingIndex = -1;
        const bbBig = BigInt(bb || 0n);
        for (let i = 0; i < 81; i++) if ((bbBig >> BigInt(i)) & 1n) { kingIndex = i; break; }
        if (kingIndex === -1) return false;
        const moves = this.attacksFrom(enemy === "black" ? "K" : "k", kingIndex);
        for (const idx of moves) if (this.getPieceAt(idx) === '.') return false;
        return true;
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
            this.switchTurn(); return;
        }
        const boardPiece = this.getPieceAt(from);
        if (boardPiece === '.') throw new Error(`移動元に駒がない: ${from}`);
        const captured = this.getPieceAt(to);
        if (captured !== '.') {
            diff.captured = captured;
            const base = captured.startsWith("+") ? captured[1] : captured;
            this.addHandPiece(this.turn, this.turn === "black" ? base : base.toUpperCase());
            this.removePiece(captured, to);
        }
        this.removePiece(boardPiece, from);
        let placedPiece = boardPiece;
        if (promote && !boardPiece.startsWith("+")) placedPiece = "+" + boardPiece.toUpperCase();
        this.setPiece(placedPiece, to);
        diff.placedPiece = placedPiece;
        this.history.push(diff);
        this.switchTurn();
    }

    undoMove() {
        if (this.history.length === 0) return;
        const diff = this.history.pop();
        this.switchTurn();
        if (diff.drop) {
            this.removePiece(diff.placedPiece, diff.to);
            this.addHandPiece(this.turn, diff.piece); return;
        }
        this.setPiece(diff.piece, diff.from);
        this.removePiece(diff.placedPiece, diff.to);
        if (diff.captured) {
            this.setPiece(diff.captured, diff.to);
            const base = diff.captured.startsWith("+") ? diff.captured[1] : diff.captured;
            this.removeHandPiece(this.turn, this.turn === "black" ? base : base.toUpperCase());
        }
    }

    switchTurn() { this.turn = this.turn === "black" ? "white" : "black"; }

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
