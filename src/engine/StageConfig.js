// レベル帯ごとの音楽スタイル定義
export const getStageStyle = (level) => {
    // Lv 01-10: ブルースの泥沼
    if (level <= 10) return {
        title: "ブルースの泥沼",
        bpm: 100, // ゆったり
        rhythm: "shuffle",
        progression: ["C7", "F7", "C7", "G7"], // 3コード
        desc: "3コード / マイナーペンタ"
    };

    // Lv 11-20: ポップスの誘惑
    if (level <= 20) return {
        title: "ポップスの誘惑",
        bpm: 120, // 少し元気に
        rhythm: "straight",
        progression: ["C", "G", "Am", "F"], // 王道進行
        desc: "歌謡曲 / メジャーペンタ切替"
    };

    // Lv 21-30: スタンダードの迷路
    if (level <= 30) return {
        title: "スタンダードの迷路",
        bpm: 140, // ジャズっぽく
        rhythm: "swing",
        progression: ["Dm7", "G7", "Cmaj7", "A7"], // II-V-I-VI
        desc: "II-V-I / ペンタシフト"
    };

    // Lv 31-40: モードの海
    if (level <= 40) return {
        title: "モードの海",
        bpm: 160, // 疾走感
        rhythm: "even",
        progression: ["Dm7 (Dorian)", "Ebm7", "Dm7", "Cm7"], // 浮遊感
        desc: "So What / アウトサイド"
    };

    // Lv 41-49: 高速の終焉
    if (level <= 49) return {
        title: "高速の終焉",
        bpm: 250, // 爆速
        rhythm: "fast-bop",
        progression: ["Bb", "G7", "Cm7", "F7"], // 循環コード
        desc: "BPM250 / マシンガンペンタ"
    };

    // Lv 50: 巨人の足跡
    return {
        title: "巨人の足跡 (GIANT STEPS)",
        bpm: 300, // 人間やめますか
        rhythm: "chaos",
        progression: ["Bmaj7", "D7", "Gmaj7", "Bb7", "Ebmaj7", "Am7", "D7"], // コルトレーンチェンジ
        desc: "Giant Steps / カオス理論"
    };
};

// ★ペンタトニックガイド: コード名 → 有効なフレット番号
export const getPentatonicGuide = (chordName) => {
    // コード名から余計な情報を削除 (例: "Dm7 (Dorian)" → "Dm7")
    const key = chordName.split(' ')[0];

    const pentatonicMap = {
        // Basic Major (メジャーペンタトニック)
        'C': [0, 2, 4, 7, 9],
        'D': [2, 4, 6, 9, 11],
        'E': [4, 6, 8, 11, 1],
        'F': [5, 7, 9, 12, 2],
        'G': [7, 9, 11, 2, 4],
        'A': [9, 11, 1, 4, 6],
        'B': [11, 1, 3, 6, 8],
        'Bb': [10, 12, 2, 5, 7],
        'Eb': [3, 5, 7, 10, 12],

        // 7th (ドミナント7th = マイナーペンタ)
        'C7': [0, 3, 5, 7, 10],
        'D7': [2, 5, 7, 9, 12],
        'E7': [4, 7, 9, 11, 2],
        'F7': [5, 8, 10, 12, 3],
        'G7': [7, 10, 12, 2, 5],
        'A7': [9, 12, 2, 4, 7],
        'B7': [11, 2, 4, 6, 9],
        'Bb7': [10, 1, 3, 5, 8],

        // Major 7 (メジャーペンタ)
        'Cmaj7': [0, 2, 4, 7, 9],
        'Dmaj7': [2, 4, 6, 9, 11],
        'Emaj7': [4, 6, 8, 11, 1],
        'Fmaj7': [5, 7, 9, 12, 2],
        'Gmaj7': [7, 9, 11, 2, 4],
        'Amaj7': [9, 11, 1, 4, 6],
        'Bmaj7': [11, 1, 3, 6, 8],
        'Ebmaj7': [3, 5, 7, 10, 12],

        // Minor 7 (マイナーペンタ / ドリアン)
        'Dm7': [2, 5, 7, 9, 12],
        'Em7': [4, 7, 9, 11, 2],
        'Am7': [9, 12, 2, 4, 7],
        'Gm7': [7, 10, 12, 2, 5],
        'Cm7': [0, 3, 5, 7, 10],
        'Bm7': [11, 2, 4, 6, 9],
        'Ebm7': [3, 6, 8, 10, 1],

        // Basic Minor (マイナーペンタ)
        'Am': [9, 12, 2, 4, 7],
        'Dm': [2, 5, 7, 9, 12],
        'Em': [4, 7, 9, 11, 2],
        'Gm': [7, 10, 12, 2, 5],
        'Cm': [0, 3, 5, 7, 10],
        'Bm': [11, 2, 4, 6, 9]
    };

    return pentatonicMap[key] || [0, 3, 5, 7, 10]; // デフォルトはCマイナーペンタ
};