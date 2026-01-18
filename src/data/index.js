import guitarData from './guitars.json';
import oyajiData from './oyaji.json';
import itemData from './items.json';
import stageData from './stages.json';
import scenarioData from './scenario.json'; // surbive.jsonとlost.jsonを統合推奨

export const DB = {
  guitars: guitarData.master_guitar_list,
  oyaji: oyajiData.dialogue_data,
  items: itemData.shop_items,
  stages: stageData.stage_progression,
  scenario: scenarioData // ゲームコンセプトやモノローグ
};