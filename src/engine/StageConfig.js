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