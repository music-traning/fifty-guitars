import { DB } from '../data';
import { getStageStyle } from './StageConfig'; 

export class GameState {
  constructor() {
    this.money = 0;
    this.ownedGuitars = [1]; 
    this.currentGuitarId = 1;
    this.currentStageId = 1;
    this.durability = 50;
    this.maxDurability = 50;
    
    this.guitarDurabilities = {}; 

    this.listeners = [];
  }

  save() {
    this.guitarDurabilities[this.currentGuitarId] = this.durability;
    const data = {
      money: this.money,
      ownedGuitars: this.ownedGuitars,
      currentGuitarId: this.currentGuitarId,
      currentStageId: this.currentStageId,
      durability: this.durability,
      guitarDurabilities: this.guitarDurabilities
    };
    localStorage.setItem('50go_save_data', JSON.stringify(data));
  }

  load() {
    const json = localStorage.getItem('50go_save_data');
    if (json) {
      const data = JSON.parse(json);
      
      // ★修正: NaN（数値エラー）になっていたら 0 にリセットして復旧する
      this.money = Number.isNaN(Number(data.money)) ? 0 : (data.money || 0);
      
      this.ownedGuitars = data.ownedGuitars || [1];
      this.currentGuitarId = data.currentGuitarId || 1;
      this.currentStageId = data.currentStageId || 1;
      this.guitarDurabilities = data.guitarDurabilities || {};

      const g = DB.guitars.find(item => item.id === this.currentGuitarId);
      this.maxDurability = g ? g.durability.max_life : 50;

      if (data.durability !== undefined) {
        this.durability = data.durability;
      } else {
        this.durability = this.maxDurability;
      }
      
      this.notifyChange('update', null);
      return true;
    }
    return false;
  }

  equipGuitar(id) {
    if (!this.ownedGuitars.includes(id)) return;
    
    this.guitarDurabilities[this.currentGuitarId] = this.durability;

    const guitar = DB.guitars.find(g => g.id === id);
    if (guitar) {
      this.currentGuitarId = id;
      this.maxDurability = guitar.durability.max_life;

      if (this.guitarDurabilities[id] !== undefined) {
        this.durability = this.guitarDurabilities[id];
      } else {
        this.durability = this.maxDurability;
      }

      this.notifyChange('equip', guitar);
      this.notifyChange('update', null);
    }
  }

  getRepairCost() {
    const damage = this.maxDurability - this.durability;
    if (damage <= 0) return 0;
    return Math.floor(damage * 5);
  }

  repairGuitar() {
    const cost = this.getRepairCost();
    if (this.money >= cost && cost > 0) {
      this.money -= cost;
      this.durability = this.maxDurability;
      this.guitarDurabilities[this.currentGuitarId] = this.durability;
      this.notifyChange('update', null);
      return { success: true, cost: cost };
    }
    return { success: false, cost: cost };
  }

  // ★修正: スキル判定のバグ（名前の不一致）を解消
  playAction(intensity = 1.0) {
    const guitar = DB.guitars.find(g => g.id === this.currentGuitarId);
    const skill = guitar.skill || { type: 'none' };
    const style = getStageStyle(this.currentStageId);

    let moneyMult = 1.0;
    let decayMult = 1.0;
    let extraAppeal = 0;

    // --- スキル分岐 ---
    if (skill.type === 'poverty') {
        moneyMult = skill.val1; 
        decayMult = skill.val2;
    }
    else if (skill.type === 'gamble') {
        if (Math.random() < skill.prob) {
            moneyMult = skill.mult;
        }
    }
    else if (skill.type === 'appeal_up') {
        extraAppeal = skill.val;
    }
    else if (skill.type === 'durability_save') {
        decayMult = skill.val;
    }
    // ★修正: brand_name は val だったり mult だったりするので両方チェック
    else if (skill.type === 'brand_name') {
        moneyMult = skill.val || skill.mult || 1.0;
    }
    // ★追加: 漏れていた vintage_rot を追加
    else if (skill.type === 'vintage_rot') {
        moneyMult = skill.mult || 1.2;
        decayMult = skill.decay || 1.5;
    }
    else if (skill.type === 'tech_bonus' || skill.type === 'vintage_bonus' || skill.type === 'legend_bonus') {
        moneyMult = skill.mult || 1.0;
    }
    else if (skill.type === 'stage_bonus') {
        if (this.currentStageId >= skill.min && this.currentStageId <= skill.max) {
            moneyMult = skill.mult;
        }
    }
    else if (skill.type === 'speed_bonus') {
        if (style.bpm >= skill.min_bpm) {
            moneyMult = skill.mult;
        }
    }
    else if (skill.type === 'heavy_weight') {
        moneyMult = skill.mult;
        decayMult = skill.decay;
    }
    // ----------------

    const decay = guitar.durability.decay_rate * intensity * decayMult * (1 + Math.random() * 0.5);
    this.durability -= decay;
    
    const baseAppeal = guitar.specs.appeal + extraAppeal;
    // ★安全策: 万が一計算結果が NaN になっても 0 にする
    let reward = Math.floor(baseAppeal * intensity * 500 * moneyMult); 
    if (Number.isNaN(reward)) reward = 0;

    this.money += reward;

    if (this.durability <= 0) {
      this.durability = 0;
      this.notifyChange('broken', null);
    } else {
      this.notifyChange('update', null);
    }
  }

  unlockGuitar(id) {
    if (!this.ownedGuitars.includes(id)) {
      this.ownedGuitars.push(id);
      this.notifyChange('unlock', id);
      const dialog = DB.oyaji.conversations.find(c => c.target_id === id);
      return dialog ? dialog.text : "……ふん、もっていけ。";
    }
    return null;
  }

  tryClearStage() {
    const stage = DB.stages.find(s => s.stage === this.currentStageId);
    if (!stage) return { success: false, msg: "これ以上先はないようだ。" };

    if (this.money >= stage.quota) {
      let rewardMsg = "";
      let oyajiMsg = "";

      if (stage.reward_guitar_id) {
        oyajiMsg = this.unlockGuitar(stage.reward_guitar_id);
        const gName = DB.guitars.find(g => g.id === stage.reward_guitar_id).model;
        rewardMsg = `\n新ギター『${gName}』を入手した！`;
      }

      this.currentStageId++;
      const nextStage = DB.stages.find(s => s.stage === this.currentStageId);
      
      return { 
        success: true, 
        msg: `ステージ ${stage.stage} クリア！${rewardMsg}`,
        oyajiWords: oyajiMsg, 
        nextStage: nextStage 
      };
    } else {
      const diff = stage.quota - this.money;
      // ★修正: diff が NaN の場合の表示対策
      const diffDisplay = Number.isNaN(diff) ? "不明" : diff;
      return { success: false, msg: `まだ客が満足していない。\nあと ${diffDisplay} G 必要だ。` };
    }
  }

  goPrevStage() {
    if (this.currentStageId > 1) {
      this.currentStageId--;
      this.notifyChange('update', null);
      return true;
    }
    return false;
  }

  notifyChange(type, payload) {
    this.listeners.forEach(cb => cb(type, payload));
  }
  subscribe(callback) {
    this.listeners.push(callback);
  }
}