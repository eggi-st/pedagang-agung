// Misi harian per kota dan misi guild jangka panjang.

import { state } from '../state.js';
import { render } from '../core/bus.js';
import { addLog, gainGold } from './character.js';
import { genQuest, genGuildQuest, guildQuestReady } from './generators.js';
import { sfx } from '../audio/sfx.js';

export function claimQuest(city){
  const q = state.quests[city];
  if(!q || q.progress<q.target) return;
  gainGold(q.reward);
  state.medals += q.rewardMedal;
  state.reputation[city] = (state.reputation[city]||0) + 5;
  state.stats.questsCompleted = (state.stats.questsCompleted||0)+1;
  sfx('quest');
  addLog(`Misi di ${city} selesai! +${q.reward}g${q.rewardMedal?' + '+q.rewardMedal+' medali':''}, reputasi +5.`);
  state.quests[city] = genQuest();
  render();
}

export function claimGuildQuest(){
  if(!guildQuestReady()) return;
  const q = state.guildQuest;
  gainGold(q.reward);
  state.medals += q.rewardMedal;
  sfx('quest');
  addLog(`Misi Guild selesai! +${q.reward}g + ${q.rewardMedal} medali.`);
  state.guildQuest = genGuildQuest();
  render();
}
