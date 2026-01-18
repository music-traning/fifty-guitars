// 簡単なコード周波数マップ (第4オクターブ付近)
const CHORD_MAP = {
    // Basic Major
    "C": [261.63, 329.63, 392.00],
    "D": [293.66, 369.99, 440.00],
    "E": [329.63, 415.30, 493.88],
    "F": [349.23, 440.00, 523.25],
    "G": [392.00, 493.88, 587.33],
    "A": [440.00, 554.37, 659.25],
    "B": [493.88, 622.25, 739.99],
    "Bb": [466.16, 587.33, 698.46],
    "Eb": [311.13, 392.00, 466.16],

    // Basic Minor
    "Am": [220.00, 261.63, 329.63],
    "Dm": [293.66, 349.23, 440.00],
    "Em": [329.63, 392.00, 493.88],
    "Gm": [392.00, 466.16, 587.33],
    "Cm": [261.63, 311.13, 392.00],
    "Bm": [493.88, 587.33, 739.99],

    // 7th
    "C7": [261.63, 329.63, 392.00, 466.16],
    "G7": [392.00, 493.88, 587.33, 698.46],
    "D7": [293.66, 369.99, 440.00, 523.25],
    "A7": [440.00, 554.37, 659.25, 783.99],
    "E7": [329.63, 415.30, 493.88, 587.33],
    "F7": [349.23, 440.00, 523.25, 622.25],
    "Bb7": [233.08, 293.66, 349.23, 415.30], // 低め

    // Major 7
    "Cmaj7": [261.63, 329.63, 392.00, 493.88],
    "Fmaj7": [349.23, 440.00, 523.25, 659.25],
    "Gmaj7": [392.00, 493.88, 587.33, 739.99],
    "Ebmaj7": [311.13, 392.00, 466.16, 587.33],
    "Bmaj7": [493.88, 622.25, 739.99, 932.33],

    // Minor 7
    "Dm7": [293.66, 349.23, 440.00, 523.25],
    "Gm7": [392.00, 466.16, 587.33, 698.46],
    "Am7": [220.00, 261.63, 329.63, 392.00],
    "Cm7": [261.63, 311.13, 392.00, 466.16],
    "Em7": [329.63, 392.00, 493.88, 587.33],
    "Ebm7": [311.13, 369.99, 466.16, 554.37]
};

export class BackingTrack {
  constructor(audioCtx, synth) {
    this.ctx = audioCtx;
    this.synth = synth; // GuitarSynthのインスタンスを受け取る
    this.isPlaying = false;
    
    this.currentStyle = {
        bpm: 100,
        progression: ["C7"],
        title: "Blues"
    };

    this.nextNoteTime = 0.0;
    this.timerID = null;
    this.beatCount = 0;
    this.measureCount = 0;
    this.currentChord = "";
    this.isTastyWindow = false;
    this.listeners = [];
  }

  setStyle(styleObj) {
      this.currentStyle = styleObj;
  }

  start() {
    if (this.isPlaying) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.isPlaying = true;
    this.beatCount = 0;
    this.measureCount = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
    this.notify('chord', '-');
  }

  scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleNote(this.beatCount, this.nextNoteTime);
      this.nextStep();
    }
    if (this.isPlaying) {
      this.timerID = setTimeout(() => this.scheduler(), 25);
    }
  }

  nextStep() {
    const secondsPerBeat = 60.0 / this.currentStyle.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.beatCount++;
    if (this.beatCount % 4 === 0) {
        this.measureCount++;
    }
  }

  scheduleNote(beatNumber, time) {
    const beatInBar = beatNumber % 4;

    // --- 1拍目: コード再生 & 表示 ---
    if (beatInBar === 0) {
        const prog = this.currentStyle.progression;
        const chordName = prog[this.measureCount % prog.length];
        this.currentChord = chordName;
        
        // コード名を分解して検索 (例: "Dm7 (Dorian)" -> "Dm7")
        const key = chordName.split(' ')[0];
        const freqs = CHORD_MAP[key] || [261.63, 329.63, 392.00]; // なければC

        // ★和音を鳴らす！
        this.synth.playChord(freqs, 2.0); // 2秒くらい伸ばす

        // UI通知
        const delay = (time - this.ctx.currentTime) * 1000;
        setTimeout(() => {
            this.notify('chord', this.currentChord);
        }, delay);
    }

    // --- ドラム ---
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (beatInBar === 0 || beatInBar === 2) { // Kick
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.4);
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
    } else { // Snare
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.linearRampToValueAtTime(800, time + 0.1);
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      this.triggerBonusWindow(time);
    }

    osc.start(time);
    osc.stop(time + 0.1);

    // ビート通知
    const delay = (time - this.ctx.currentTime) * 1000;
    setTimeout(() => {
      this.notify('beat', beatInBar);
    }, delay);
  }

  triggerBonusWindow(time) {
    const windowSize = Math.max(50, 150 - (this.currentStyle.bpm / 2)); 
    const delay = (time - this.ctx.currentTime) * 1000;
    setTimeout(() => { this.isTastyWindow = true; }, delay - windowSize);
    setTimeout(() => { this.isTastyWindow = false; }, delay + windowSize);
  }

  checkTiming(isBending) {
    if (!this.isPlaying) return null;
    if (this.isTastyWindow) {
      return isBending ? "TASTY" : "GROOVE";
    }
    return null;
  }

  subscribe(cb) { this.listeners.push(cb); }
  notify(type, val) { this.listeners.forEach(cb => cb(type, val)); }
}