import { inject } from '@vercel/analytics';
inject();

import { DB } from './data';
import { GameState } from './engine/GameState';
import { GuitarSynth } from './engine/AudioSynth';
import { BackingTrack } from './engine/BackingTrack';
import { getStageStyle, getPentatonicGuide } from './engine/StageConfig';
import oyajiTalkData from './data/oyaji_talk.json';
import './style.css';

const state = new GameState();
const synth = new GuitarSynth();
let backing = null;

const ui = {
    // イントロ
    introOverlay: document.getElementById('intro-overlay'),

    msgText: document.getElementById('message-text'),
    speaker: document.getElementById('speaker-name'),
    lv: document.getElementById('player-lv'),
    stageLoc: document.getElementById('stage-location'),
    money: document.getElementById('player-money'),
    guitarName: document.getElementById('guitar-name'),
    lifeVal: document.getElementById('life-val'),
    maxLife: document.getElementById('max-life-val'),
    lifeBar: document.getElementById('life-bar'),

    // ボタン（存在しない場合もあるので注意）
    btnPlayMode: document.getElementById('btn-play-mode'),
    btnShop: document.getElementById('btn-shop'),
    btnGuitarList: document.getElementById('btn-guitar-list'),
    btnRepair: document.getElementById('btn-repair'),
    btnNext: document.getElementById('btn-next'),
    btnPrev: document.getElementById('btn-prev'),
    btnSave: document.getElementById('btn-save'),
    btnHelp: document.getElementById('btn-help'),
    btnStopPlay: document.getElementById('btn-stop-play'),

    fretboard: document.getElementById('fretboard-overlay'),
    fretsArea: document.getElementById('frets-area'),
    grooveLamp: document.getElementById('groove-lamp'),
    bonusText: document.getElementById('bonus-display'),

    // ★タイミング判定表示
    timingJudgment: document.getElementById('timing-judgment'),
    multiplierDisplay: document.getElementById('multiplier-display'),

    styleTitle: document.getElementById('style-title'),
    currentChord: document.getElementById('current-chord'),

    guitarListOverlay: document.getElementById('guitar-list-overlay'),
    ownedList: document.getElementById('owned-list'),
    btnCloseList: document.getElementById('btn-close-list'),
    specName: document.getElementById('spec-name'),
    specAppeal: document.getElementById('spec-appeal'),
    specWeight: document.getElementById('spec-weight'),
    specLife: document.getElementById('spec-life'),
    specDesc: document.getElementById('spec-desc'),
    btnEquip: document.getElementById('btn-equip'),

    rewardOverlay: document.getElementById('reward-overlay'),
    rewardName: document.getElementById('reward-guitar-name'),
    rewardMsg: document.getElementById('reward-oyaji-msg'),
    btnCloseReward: document.getElementById('btn-close-reward'),

    repairOverlay: document.getElementById('repair-overlay'),
    repairCost: document.getElementById('repair-cost'),
    btnDoRepair: document.getElementById('btn-do-repair'),
    btnCancelRepair: document.getElementById('btn-cancel-repair'),

    // ヘルプ画面
    helpOverlay: document.getElementById('help-overlay'),
    btnCloseHelp: document.getElementById('btn-close-help'),
    btnDeleteData: document.getElementById('btn-delete-data'),

    // ★エンディング画面
    endingOverlay: document.getElementById('ending-overlay'),
    endingRouteTitle: document.getElementById('ending-route-title'),
    endingOyajiMsg: document.getElementById('ending-oyaji-msg'),
    statRespect: document.getElementById('stat-respect'),
    statPassion: document.getElementById('stat-passion'),
    statPrecision: document.getElementById('stat-precision'),
    statMoney: document.getElementById('stat-money'),
    btnRestartGame: document.getElementById('btn-restart-game')
};

// 起動時の処理
function init() {
    // イントロ画面のクリックイベント（要素がある場合のみ）
    if (ui.introOverlay) {
        ui.introOverlay.onclick = () => {
            ui.introOverlay.style.opacity = 0;
            setTimeout(() => {
                ui.introOverlay.classList.add('hidden');
            }, 500);

            // AudioContext初期化
            synth.init();

            // ロード処理
            if (state.load()) {
                showMsg("システム", "旅の記録を　読み込みました。");
            } else {
                state.equipGuitar(1);
                const opening = DB.oyaji.conversations.find(c => c.target_id === 1);
                showMsg("おやじ", opening ? opening.text : "……ふん。");
            }
            updateStatusUI();
        };
    } else {
        // イントロがない場合は即ロード
        if (state.load()) showMsg("システム", "旅の記録を　読み込みました。");
        else state.equipGuitar(1);
        updateStatusUI();
    }

    drawFretboard();
    setupButtons();
}

function updateStatusUI() {
    const g = DB.guitars.find(g => g.id === state.currentGuitarId);
    const currentStage = DB.stages.find(s => s.stage === state.currentStageId);

    ui.lv.innerText = state.currentStageId;
    if (currentStage && ui.stageLoc) {
        ui.stageLoc.innerText = `(${currentStage.location})`;
    }

    ui.money.innerText = state.money;
    ui.guitarName.innerText = g ? g.model : '-';

    ui.lifeVal.innerText = Math.floor(state.durability);
    ui.maxLife.innerText = state.maxDurability;

    const pct = (state.durability / state.maxDurability) * 100;
    ui.lifeBar.style.width = pct + "%";
    ui.lifeBar.style.backgroundColor = pct < 20 ? "#ff4444" : "#00ff00";
}

function showMsg(name, text) {
    ui.speaker.innerText = name;
    ui.msgText.innerText = text;
}

function showRewardModal(guitarName, oyajiText) {
    ui.rewardName.innerText = guitarName;
    ui.rewardMsg.innerText = oyajiText;
    ui.rewardOverlay.classList.remove('hidden');
}

function showBonusEffect(type) {
    ui.bonusText.innerText = type + "!!";
    ui.bonusText.className = "bonus-text show " + type.toLowerCase();

    setTimeout(() => {
        ui.bonusText.className = "bonus-text";
    }, 500);

    if (type === "TASTY") {
        ui.fretboard.style.backgroundColor = "#554433";
        setTimeout(() => ui.fretboard.style.backgroundColor = "#3e2723", 100);
    }
}

// ★タイミング判定表示
function showTimingJudgment(judgment) {
    if (!ui.timingJudgment || !ui.multiplierDisplay) return;

    const { rating, mult } = judgment;

    // 判定表示
    ui.timingJudgment.innerText = rating;
    ui.timingJudgment.className = `timing-judgment show ${rating.toLowerCase()}`;

    // 倍率表示
    ui.multiplierDisplay.innerText = `×${mult.toFixed(1)}`;
    ui.multiplierDisplay.className = "multiplier-display show";

    setTimeout(() => {
        ui.timingJudgment.className = "timing-judgment";
        ui.multiplierDisplay.className = "multiplier-display";
    }, 800);
}

// ★エンディング表示
function showEnding() {
    if (!ui.endingOverlay) return;

    const route = state.oyajiRelationship.getEndingRoute();
    const guitar = DB.guitars.find(g => g.id === state.currentGuitarId);

    let routeTitle = "";
    let oyajiMessage = "";

    // ルート別のメッセージ
    if (route === 'precision') {
        routeTitle = "〜 完璧さを求めた者へ 〜";
        oyajiMessage = `……きたか。\n\nおまえは　ひたすら　せいかくさ　を　おいもとめた。\nまちがい　を　おそれ、　いつも　かんぺき　を　めざした。\n\nそれは　けっして　まちがい　じゃない。\nだが　おぼえておけ。\n\n「かんぺき　な　えんそう」　なんて　ものは　ない。\nたいせつ　なのは　きもち　だ。\n\n……もう　おしえる　ことは　ない。\nあとは　じぶん　で　みちを　ひらけ。`;
    } else if (route === 'passion') {
        routeTitle = "〜 個性を貫いた者へ 〜";
        oyajiMessage = `……やるじゃねえか。\n\nおまえは　じぶん　の　スタイル　を　つらぬいた。\nリスク　を　おそれず、　ぼうけん　を　えらんだ。\n\nその　いきおい、　きらい　じゃねえ。\nだが　わすれるな。\n\n「じゆう」　と　「ほうし」　は　かみひとえ　だ。\nときには　たちどまって　かんがえろ。\n\n……おまえなら　だいじょうぶ　だ。\nじぶん　を　しんじて　すすめ。`;
    } else {
        routeTitle = "〜 バランスを見出した者へ 〜";
        oyajiMessage = `……なかなか　やるな。\n\nおまえは　せいかくさ　と　じゆう　の　あいだ　で\nバランス　を　とった。\n\nそれが　いちばん　むずかしい。\nだが　おまえは　それを　やりとげた。\n\n「おんがく　に　せいかい　は　ない」\nだが　「まちがい　も　ない」。\n\nたいせつ　なのは　じぶん　らしさ　だ。\n\n……もう　いく　ときが　きた　ようだな。\nげんき　で　な。`;
    }

    // 特別なギターを使っている場合の追加メッセージ
    if (guitar && guitar.hidden_message) {
        oyajiMessage += `\n\n\n……それと、　その　${guitar.model}。\nよく　にあってる　ぜ。`;
    }

    // UI更新
    ui.endingRouteTitle.innerText = routeTitle;
    ui.endingOyajiMsg.innerText = oyajiMessage;
    ui.statRespect.innerText = state.oyajiRelationship.respect;
    ui.statPassion.innerText = state.oyajiRelationship.passion;
    ui.statPrecision.innerText = state.oyajiRelationship.precision;
    ui.statMoney.innerText = state.money.toLocaleString();

    ui.endingOverlay.classList.remove('hidden');
}


function setupButtons() {
    // 各ボタンが存在するかチェックしてからイベントを設定（エラー防止）

    if (ui.btnSave) {
        ui.btnSave.onclick = () => {
            state.save();
            const originalText = ui.btnSave.innerText;
            ui.btnSave.innerText = "記録完了！";
            setTimeout(() => { ui.btnSave.innerText = originalText; }, 2000);
            showMsg("システム", "旅の記録を　保存した。");
        };
    }

    if (ui.btnHelp) {
        ui.btnHelp.onclick = () => {
            ui.helpOverlay.classList.remove('hidden');
        };
    }
    if (ui.btnCloseHelp) {
        ui.btnCloseHelp.onclick = () => {
            ui.helpOverlay.classList.add('hidden');
        };
    }

    if (ui.btnDeleteData) {
        ui.btnDeleteData.onclick = () => {
            if (confirm("本当にデータを消去して、最初からやり直しますか？\n（この操作は取り消せません）")) {
                localStorage.removeItem('50go_save_data');
                location.reload();
            }
        };
    }

    if (ui.btnPlayMode) {
        ui.btnPlayMode.onclick = () => {
            if (state.durability <= 0) {
                showMsg("システム", "弦が切れている！\n修理してから出直せ。");
                return;
            }
            ui.fretboard.classList.remove('hidden');

            synth.init();

            if (!backing) {
                backing = new BackingTrack(synth.audioCtx, synth);
                backing.subscribe((type, val) => {
                    if (type === 'beat') {
                        if (val === 1 || val === 3) {
                            ui.grooveLamp.classList.add('active');
                            setTimeout(() => ui.grooveLamp.classList.remove('active'), 100);
                        }
                    } else if (type === 'chord') {
                        if (ui.currentChord) ui.currentChord.innerText = val;
                    }
                });
            }

            const style = getStageStyle(state.currentStageId);
            backing.setStyle(style);
            if (ui.styleTitle) ui.styleTitle.innerText = `${style.title} (BPM:${style.bpm})`;

            backing.start();

            // ★オヤジのコメントを表示（関係値に応じて変化）
            const oyajiComment = state.oyajiRelationship.getOyajiComment();
            showMsg("おやじ", oyajiComment);

            // ★フレットボードの色分け表示を更新
            updateFretboardColors();

            setTimeout(() => {
                showMsg("システム", `${style.desc}\nスネア(2拍4拍)に　あわせて　ひけ！`);
            }, 2000);
        };
    }

    if (ui.btnStopPlay) {
        ui.btnStopPlay.onclick = () => {
            ui.fretboard.classList.add('hidden');
            if (backing) backing.stop();
            state.playAction(0.5);
            updateStatusUI();
        };
    }

    ui.fretboard.addEventListener('mousedown', () => checkHit(false));
    ui.fretboard.addEventListener('touchstart', () => checkHit(false));

    let isDragging = false;
    ui.fretboard.addEventListener('mousemove', () => { isDragging = true; });
    ui.fretboard.addEventListener('mouseup', () => {
        if (isDragging) checkHit(true);
        isDragging = false;
    });

    function checkHit(isBend) {
        if (!backing || !backing.isPlaying) return;

        // ★タイミング判定を取得
        const judgment = backing.judge(synth.audioCtx.currentTime);

        const result = backing.checkTiming(isBend);
        if (result) {
            let bonusMoney = 0;
            if (result === "TASTY") {
                bonusMoney = 100;
            } else {
                bonusMoney = 20;
            }

            // ★タイミング判定の倍率を適用
            bonusMoney = Math.floor(bonusMoney * judgment.mult);
            state.money += bonusMoney;

            // ★オヤジ関係値を更新
            state.oyajiRelationship.update(judgment.rating, isBend ? 1 : 0, 0);

            showBonusEffect(result);
            showTimingJudgment(judgment);
            updateStatusUI();
        } else {
            // タイミング外でもジャッジメントは表示
            showTimingJudgment(judgment);
        }
    }


    if (ui.btnShop) {
        ui.btnShop.onclick = () => {
            const lv = state.currentStageId;
            const talks = oyajiTalkData.talks[String(lv)] || oyajiTalkData.talks["1"];
            const randMsg = talks[Math.floor(Math.random() * talks.length)];
            showMsg("おやじ", randMsg);
        };
    }

    if (ui.btnRepair) {
        ui.btnRepair.onclick = () => {
            const cost = state.getRepairCost();
            ui.repairCost.innerText = cost;
            if (cost === 0) showMsg("おやじ", "修理？　まだピカピカじゃねえか。");
            else ui.repairOverlay.classList.remove('hidden');
        };
    }
    if (ui.btnDoRepair) {
        ui.btnDoRepair.onclick = () => {
            const cost = state.getRepairCost();
            if (state.money < cost) {
                ui.repairOverlay.classList.add('hidden');
                showMsg("おやじ", "おいおい、　金が足りねえぞ。");
                return;
            }
            const result = state.repairGuitar();
            if (result.success) {
                ui.repairOverlay.classList.add('hidden');
                showMsg("おやじ", `ほらよ、元通りだ。`);
            }
        };
    }
    if (ui.btnCancelRepair) {
        ui.btnCancelRepair.onclick = () => {
            ui.repairOverlay.classList.add('hidden');
            showMsg("おやじ", "なんだ、冷やかしか。");
        };
    }

    if (ui.btnGuitarList) {
        ui.btnGuitarList.onclick = () => {
            renderGuitarList();
            ui.guitarListOverlay.classList.remove('hidden');
        };
    }
    if (ui.btnCloseList) {
        ui.btnCloseList.onclick = () => ui.guitarListOverlay.classList.add('hidden');
    }
    if (ui.btnEquip) {
        ui.btnEquip.onclick = () => {
            const selectedId = parseInt(ui.btnEquip.dataset.id);
            state.equipGuitar(selectedId);
            ui.guitarListOverlay.classList.add('hidden');
            showMsg("システム", "ギターを　もちかえた。");
        };
    }

    if (ui.btnPrev) {
        ui.btnPrev.onclick = () => {
            if (state.goPrevStage()) {
                updateStatusUI();
                const style = getStageStyle(state.currentStageId);
                if (backing) backing.setStyle(style);
                if (ui.styleTitle) ui.styleTitle.innerText = `${style.title} (BPM:${style.bpm})`;
                showMsg("システム", `ステージ ${state.currentStageId} に　もどった。`);
            } else {
                showMsg("システム", "これいじょう　もこれない。");
            }
        };
    }

    if (ui.btnNext) {
        ui.btnNext.onclick = () => {
            const result = state.tryClearStage();
            if (result.success) {
                updateStatusUI();

                // ★Lv50クリア時にエンディング表示
                if (state.currentStageId > 50) {
                    setTimeout(() => {
                        showEnding();
                    }, 2000);
                    return;
                }

                const style = getStageStyle(state.currentStageId);
                if (backing) backing.setStyle(style);
                if (ui.styleTitle) ui.styleTitle.innerText = `${style.title} (BPM:${style.bpm})`;

                showMsg("システム", result.msg);

                if (result.oyajiWords) {
                    const lastUnlockedId = state.ownedGuitars[state.ownedGuitars.length - 1];
                    const g = DB.guitars.find(item => item.id === lastUnlockedId);
                    setTimeout(() => showRewardModal(g.model, result.oyajiWords), 1000);
                }

                if (result.nextStage) {
                    setTimeout(() => showMsg("システム", `【STAGE ${result.nextStage.stage}】へ移動した。\n目標: ${result.nextStage.quota} G`), result.oyajiWords ? 1500 : 2500);
                }
            } else {
                showMsg("おやじ", result.msg);
            }
        };
    }

    if (ui.btnCloseReward) {
        ui.btnCloseReward.onclick = () => {
            ui.rewardOverlay.classList.add('hidden');
            showMsg("システム", "新しいギターを　手に入れた！");
        };
    }

    // ★エンディング後のリスタート
    if (ui.btnRestartGame) {
        ui.btnRestartGame.onclick = () => {
            if (confirm("最初からやり直しますか？\n（現在のデータは削除されます）")) {
                localStorage.removeItem('50go_save_data');
                location.reload();
            }
        };
    }
}

function renderGuitarList() {
    ui.ownedList.innerHTML = '';
    state.ownedGuitars.forEach(id => {
        const g = DB.guitars.find(item => item.id === id);
        const li = document.createElement('li');

        // ★推奨ギター表示
        const isRecommended = g.stage_affinity && g.stage_affinity.includes(state.currentStageId);
        li.innerText = isRecommended ? `★ ${g.model}` : g.model;

        let className = (id === state.currentGuitarId) ? 'current-equip' : '';
        if (isRecommended) className += ' recommended-guitar';
        li.className = className;

        li.onclick = () => {
            ui.specName.innerText = g.model;
            ui.specAppeal.innerText = g.specs.appeal;
            ui.specWeight.innerText = g.specs.weight;

            let priceText = `参考価格: ${g.price.toLocaleString()} G\n\n`;

            // ★推奨ギター情報を追加
            if (isRecommended) {
                priceText += `【推奨ギター】このステージで+30%ボーナス！\n\n`;
            }

            ui.specDesc.innerText = priceText + g.durability.desc;

            ui.specLife.innerText = g.durability.max_life;

            ui.btnEquip.disabled = false;
            ui.btnEquip.dataset.id = id;
            document.querySelectorAll('.selectable-list li').forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');
        };
        ui.ownedList.appendChild(li);
    });
}

function drawFretboard() {
    ui.fretsArea.innerHTML = '';
    const dots = [3, 5, 7, 9, 12];
    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        div.className = 'fret-cell';
        div.dataset.fret = i; // ★フレット番号を記録
        if (dots.includes(i)) {
            div.innerHTML = i === 12 ? '<div class="double-dot"><div class="dot"></div><div class="dot"></div></div>' : '<div class="dot"></div>';
        }
        ui.fretsArea.appendChild(div);
    }
}

// ★フレットボードの色分け表示を更新
function updateFretboardColors() {
    if (!backing || !backing.isPlaying) return;

    const currentChord = backing.currentChord;
    if (!currentChord) return;

    const validFrets = getPentatonicGuide(currentChord);
    const fretCells = document.querySelectorAll('.fret-cell');

    fretCells.forEach(cell => {
        const fret = parseInt(cell.dataset.fret);

        // 色をリセット
        cell.style.backgroundColor = '';
        cell.style.boxShadow = '';

        if (validFrets.includes(fret)) {
            // 緑：ペンタトニック内
            cell.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            cell.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.4)';
        } else {
            // アウトサイド判定：有効フレットから±2以内
            const isNear = validFrets.some(vf => Math.abs(fret - vf) <= 2);

            if (isNear) {
                // オレンジ：アウトサイド（危険だが高リスク高リターン）
                cell.style.backgroundColor = 'rgba(255, 165, 0, 0.15)';
                cell.style.boxShadow = '0 0 8px rgba(255, 165, 0, 0.3)';
            } else {
                // 赤：完全に外れている
                cell.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                cell.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.2)';
            }
        }
    });
}

// ★コード変更時にフレットボードの色を更新
if (backing) {
    backing.subscribe((type, val) => {
        if (type === 'chord' && val !== '-') {
            updateFretboardColors();
        }
    });
}

state.subscribe((type, payload) => {
    if (type === 'broken') {
        ui.fretboard.classList.add('hidden');
        if (backing) backing.stop();
        const lostMsg = DB.scenario.dialogue_data.conversations[0].text;
        showMsg("おやじ", lostMsg + "\n(GAME OVER - 修理して出直せ)");
    }
    updateStatusUI();
});

init();