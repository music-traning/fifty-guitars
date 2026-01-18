export class GuitarSynth {
  constructor() {
    this.audioCtx = null;
    this.nodes = {};
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.setupChain();
      this.setupStrings(); // ★これを復活させました（タッチ操作の有効化）
    } else if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setupChain() {
    this.nodes.masterGain = this.audioCtx.createGain();
    this.nodes.masterGain.gain.value = 0.4;

    this.nodes.drive = this.audioCtx.createWaveShaper();
    this.nodes.drive.curve = this.makeDistortionCurve(250);
    this.nodes.drive.oversample = '4x';

    this.nodes.cabinet = this.audioCtx.createBiquadFilter();
    this.nodes.cabinet.type = 'lowpass';
    this.nodes.cabinet.frequency.value = 3200;

    this.nodes.drive.connect(this.nodes.cabinet);
    this.nodes.cabinet.connect(this.nodes.masterGain);
    this.nodes.masterGain.connect(this.audioCtx.destination);
  }

  makeDistortionCurve(amount) {
    const k = amount;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = i * 2 / n - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // ★復活: 弦のタッチ操作をセットアップ
  setupStrings() {
    document.querySelectorAll('.string-zone').forEach(el => {
      // 既存のイベントリスナーが重複しないように配慮しつつ生成
      new GuitarString(el, this.audioCtx, this.nodes.drive);
    });
  }

  // ★追加機能: 和音再生（バッキング用）
  playChord(freqs, duration = 1.0) {
    if (!this.audioCtx) return;

    const chordGain = this.audioCtx.createGain();
    chordGain.gain.value = 0.2; 
    chordGain.connect(this.audioCtx.destination); // バッキングは歪ませない（クリーントーン）

    freqs.forEach(freq => {
        const osc = this.audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(chordGain);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
    });

    const now = this.audioCtx.currentTime;
    chordGain.gain.setValueAtTime(0.2, now);
    chordGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  }
}

// ★復活: 弦1本1本の操作クラス
class GuitarString {
  constructor(element, audioCtx, destNode) {
    this.element = element;
    this.audioCtx = audioCtx;
    this.destNode = destNode;
    
    this.line = element.querySelector('.string-line');
    this.marker = element.querySelector('.touch-marker');
    this.baseFreq = parseFloat(element.dataset.freq);
    this.stringIndex = parseInt(element.dataset.idx);

    this.osc = null;
    this.gain = null;
    this.isPlaying = false;
    this.startY = 0;
    this.currentFret = -1;

    this.bindEvents();
  }

  bindEvents() {
    const start = (e) => this.inputStart(e);
    const move = (e) => this.inputMove(e);
    const end = (e) => this.inputEnd(e);

    this.element.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    
    this.element.addEventListener('touchstart', start, {passive: false});
    window.addEventListener('touchmove', move, {passive: false});
    window.addEventListener('touchend', end);
  }

  inputStart(e) {
    if (!this.audioCtx) return;
    // e.preventDefault(); // ここをコメントアウトすると親要素（ボーナス判定）にもイベントが伝わる
    
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    
    this.startY = cy;
    this.isPlaying = true;
    
    const { fret, bendCents, vibratoCents } = this.analyzePosition(cx, cy);
    this.currentFret = fret;
    this.playTone(fret, bendCents + vibratoCents);

    this.marker.style.display = 'block';
    this.marker.style.left = cx + 'px';
    this.marker.style.top = '50%';
  }

  inputMove(e) {
    if (!this.isPlaying) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    const { fret, bendCents, vibratoCents, visualBendY } = this.analyzePosition(cx, cy);

    if (this.osc) {
      if (this.currentFret !== fret) {
        const newFreq = this.baseFreq * Math.pow(2, fret / 12);
        this.osc.frequency.setValueAtTime(newFreq, this.audioCtx.currentTime);
        this.currentFret = fret;
      }
      this.osc.detune.setValueAtTime(bendCents + vibratoCents, this.audioCtx.currentTime);
    }
    this.marker.style.left = cx + 'px';
    this.line.style.transform = `translateY(${visualBendY}px)`;
  }

  inputEnd() {
    this.isPlaying = false;
    this.stopSound();
    this.marker.style.display = 'none';
    this.line.style.transform = 'translateY(0)';
  }

  analyzePosition(clientX, clientY) {
    const rect = this.element.getBoundingClientRect();
    const nutEl = document.getElementById('nut-area');
    const nutWidth = nutEl ? nutEl.getBoundingClientRect().width : 50;
    
    const xRel = clientX - rect.left;
    
    let fret = 0;
    let vibratoCents = 0;

    if (xRel > nutWidth) {
      const scaleLen = rect.width - nutWidth;
      const oneFretW = scaleLen / 12;
      const fretPos = xRel - nutWidth;
      fret = Math.ceil(fretPos / oneFretW);
      if (fret > 12) fret = 12;
      if (fret < 1) fret = 1;
      
      const posInFret = (fretPos % oneFretW) / oneFretW;
      vibratoCents = (posInFret - 0.5) * 30;
    }

    let bendCents = 0;
    let visualBendY = 0;
    if (fret > 0) {
      const deltaY = clientY - this.startY;
      if (this.stringIndex <= 2) { 
        if (deltaY > 0) {
          bendCents = Math.min(deltaY * 3, 300);
          visualBendY = deltaY;
        }
      } else { 
        if (deltaY < 0) {
          bendCents = Math.min(Math.abs(deltaY) * 3, 300);
          visualBendY = deltaY;
        }
      }
    }
    return { fret, bendCents, vibratoCents, visualBendY };
  }

  playTone(fret, detune) {
    if (this.osc) this.stopSound();
    const freq = this.baseFreq * Math.pow(2, fret / 12);

    this.osc = this.audioCtx.createOscillator();
    this.gain = this.audioCtx.createGain();

    this.osc.type = 'sawtooth';
    this.osc.frequency.value = freq;
    this.osc.detune.value = detune;

    this.osc.connect(this.gain);
    this.gain.connect(this.destNode);

    this.osc.start();
    this.gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.gain.gain.linearRampToValueAtTime(1.0, this.audioCtx.currentTime + 0.01);
  }

  stopSound() {
    if (this.osc) {
      const now = this.audioCtx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      this.osc.stop(now + 0.1);
      this.osc = null;
    }
  }
}