// Tas barang rampasan: pemilihan untuk crafting, penggabungan item,
// penempaan pusaka lewat Diagram, dan pemasangan aksesoris.
//
// craftSelection dimiliki modul ini. Lapisan UI membacanya lewat impor
// (live binding), jadi selalu melihat nilai terbaru tanpa perlu setter.

import { state } from '../state.js';
import { rand } from '../core/rng.js';
import { render } from '../core/bus.js';
import { addLog, gainGold } from './character.js';
import { genItem } from './generators.js';
import { RARITY_ORDER, DIAGRAMS } from '../data/items.js';
import { sfx } from '../audio/sfx.js';

/** Maksimal 2 item, dipakai sebagai bahan crafting. */
export let craftSelection = [];

export function toggleCraftSelect(uid){
  const idx = craftSelection.indexOf(uid);
  if(idx>=0){ craftSelection.splice(idx,1); }
  else {
    if(craftSelection.length>=2) craftSelection.shift();
    craftSelection.push(uid);
  }
  render();
}

export function craftItems(){
  if(craftSelection.length!==2) return;
  const it1 = state.items.find(i=>i.uid===craftSelection[0]);
  const it2 = state.items.find(i=>i.uid===craftSelection[1]);
  if(!it1 || !it2 || it1.rarity!==it2.rarity || it1.rarity==='Legendaris') return;
  if(state.gold<30){ sfx('error'); return; }
  state.gold -= 30;
  const nextRarity = RARITY_ORDER[RARITY_ORDER.indexOf(it1.rarity)+1];
  [it1.uid, it2.uid].forEach(uid=>{
    if(state.equipment.accessory1===uid) state.equipment.accessory1=null;
    if(state.equipment.accessory2===uid) state.equipment.accessory2=null;
  });
  state.items = state.items.filter(i=> i.uid!==it1.uid && i.uid!==it2.uid);
  const newItem = genItem(nextRarity);
  state.items.push(newItem);
  state.stats.itemsCrafted = (state.stats.itemsCrafted||0)+1;
  craftSelection = [];
  sfx('craft');
  addLog(`Berhasil crafting: ${newItem.name} (${newItem.rarity})!`);
  render();
}

export function craftDiagram(diagramId){
  const d = DIAGRAMS.find(x=>x.id===diagramId);
  const legendary = state.items.find(i=>i.rarity==='Legendaris');
  if(!legendary || state.gold<d.goldCost || state.medals<d.medalCost){ sfx('error'); return; }
  if(state.equipment.accessory1===legendary.uid) state.equipment.accessory1=null;
  if(state.equipment.accessory2===legendary.uid) state.equipment.accessory2=null;
  state.items = state.items.filter(i=>i.uid!==legendary.uid);
  state.gold -= d.goldCost;
  state.medals -= d.medalCost;
  const newItem = { uid:'it'+Date.now()+rand(0,9999), name:d.name, rarity:'Legendaris', type:d.type, bonus:d.bonus, sellValue: 300 };
  state.items.push(newItem);
  state.stats.itemsCrafted = (state.stats.itemsCrafted||0)+1;
  sfx('craft');
  addLog(`Berhasil menempa pusaka ${d.name} menggunakan Diagram!`);
  render();
}

export function equipAccessory(uid, slotNum){
  const key = slotNum===1 ? 'accessory1' : 'accessory2';
  const other = slotNum===1 ? 'accessory2' : 'accessory1';
  if(state.equipment[other]===uid) state.equipment[other] = null;
  state.equipment[key] = uid;
  render();
}

export function sellItem(uid){
  const idx = state.items.findIndex(i=>i.uid===uid);
  if(idx<0) return;
  const it = state.items[idx];
  gainGold(it.sellValue);
  if(state.equipment.accessory1===uid) state.equipment.accessory1 = null;
  if(state.equipment.accessory2===uid) state.equipment.accessory2 = null;
  state.items.splice(idx,1);
  craftSelection = craftSelection.filter(u=>u!==uid);
  sfx('sell');
  addLog(`Menjual ${it.name} seharga ${it.sellValue}g.`);
  render();
}
