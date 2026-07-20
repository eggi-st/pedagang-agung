// Pasukan jendral: rekrutmen, urutan formasi (indeks 0 = garda depan),
// promosi pangkat, dan penguatan permanen lewat Rebirth Stone.

import { state } from '../state.js';
import { render } from '../core/bus.js';
import { addLog } from './character.js';
import { RANK_NAMES, MAX_GENERALS } from '../data/mercenaries/index.js';
import { sfx } from '../audio/sfx.js';

export function recruitGeneral(idx){
  const m = state.recruits[state.city][idx];
  if(state.gold<m.price || state.generals.length>=MAX_GENERALS) { sfx('error'); return; }
  state.gold -= m.price;
  state.generals.push({name:m.name, rank:0, maxHp:m.maxHp, hp:m.maxHp, atk:m.atk, elem:m.elem});
  state.recruits[state.city].splice(idx,1);
  sfx('buy');
  addLog(`Merekrut ${m.name} sebagai Prajurit ke dalam pasukan.`);
  render();
}

export function moveGeneral(idx, dir){
  const target = idx+dir;
  if(target<0 || target>=state.generals.length) return;
  const arr = state.generals;
  [arr[idx],arr[target]] = [arr[target],arr[idx]];
  render();
}

export function useRebirthStone(idx){
  if((state.rebirthStones||0)<=0) return;
  const g = state.generals[idx];
  state.rebirthStones--;
  g.rebirthBonus = (g.rebirthBonus||0) + 5;
  g.atk += 5;
  g.maxHp += 10;
  g.hp = g.maxHp;
  sfx('craft');
  addLog(`${g.name} diperkuat permanen dengan Rebirth Stone (+5 ATK, +10 HP maksimal).`);
  render();
}

export function promoteCost(g){
  const parts = g.rank>=3 ? (g.rank-2) : 0;
  return { gold: 100 + (g.rank+1)*150, medals: (g.rank+1), parts };
}

export function promoteGeneral(idx){
  const g = state.generals[idx];
  const cost = promoteCost(g);
  if(state.gold<cost.gold || state.medals<cost.medals || (state.upgradeParts||0)<cost.parts || g.rank>=RANK_NAMES.length-1) return;
  state.gold -= cost.gold; state.medals -= cost.medals; state.upgradeParts -= cost.parts;
  g.rank++; g.maxHp += 20; g.hp = g.maxHp; g.atk += 8;
  sfx('levelup');
  addLog(`${g.name} dipromosikan menjadi ${RANK_NAMES[g.rank]}!`);
  render();
}
