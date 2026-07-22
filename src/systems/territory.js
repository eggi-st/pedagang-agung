// Wilayah: peningkatan gudang dan benteng, penyerangan garnisun, serta
// pintu masuk dungeon dan test town.
//
// Mengimpor systems/battle.js satu arah — battle.js tidak mengimpor
// modul ini kembali.

import { state, setDungeonState } from '../state.js';
import { render } from '../core/bus.js';
import { addLog } from './character.js';
import { startBattle, startDungeonFloor } from './battle.js';
import { CITY_NATION } from '../data/world.js';
import { LEGENDARY } from '../data/monsters.js';
import { sfx } from '../audio/sfx.js';

// Level minimal untuk berani memburu monster legendaris.
export const LEGENDARY_LEVEL_REQ = 8;

/** Sudah dijinakkan? (per negara kota) */
export function legendaryTamed(city){
  return !!(state.legendaryTamed && state.legendaryTamed[CITY_NATION[city]]);
}

/** Berburu monster legendaris negara kota ini (butuh level & belum dijinakkan). */
export function huntLegendary(city){
  if(city !== state.city) return;
  if(legendaryTamed(city)) return;
  if(state.char.level < LEGENDARY_LEVEL_REQ){ sfx('error'); return; }
  if(!LEGENDARY[CITY_NATION[city]]) return;
  sfx('dungeon');
  startBattle('legendary', city);
}

export function upgradeGudang(city){
  const lvl = state.cityUpgrades[city].gudang;
  const cost = 200*(lvl+1);
  if(state.gold<cost || lvl>=3) return;
  state.gold -= cost;
  state.cityUpgrades[city].gudang++;
  addLog(`Gudang di ${city} ditingkatkan ke level ${state.cityUpgrades[city].gudang}.`);
  render();
}

export function upgradeBenteng(city){
  const lvl = state.cityUpgrades[city].benteng;
  const cost = 180*(lvl+1);
  if(state.gold<cost || lvl>=3) return;
  state.gold -= cost;
  state.cityUpgrades[city].benteng++;
  sfx('buy');
  addLog(`Benteng di ${city} ditingkatkan ke level ${state.cityUpgrades[city].benteng}, lebih sulit direbut musuh.`);
  render();
}

export function enterDungeon(city){
  setDungeonState({ city, floor:1, maxFloor:3 });
  sfx('dungeon');
  startDungeonFloor();
}

export function attackGarrison(city){ startBattle('garrison', city); }

export function testTownAvailable(){ return (state.day - state.lastTestTown) >= 7; }

export function enterTestTown(){
  if(!testTownAvailable()) { sfx('error'); return; }
  state.lastTestTown = state.day;
  setDungeonState({ city: state.city, floor:1, maxFloor:3, testTown:true });
  sfx('dungeon');
  startBattle('testtown', state.city);
}
