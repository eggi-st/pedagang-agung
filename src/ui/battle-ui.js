// Tampilan pertempuran: menggambar aktor, bilah HP, log, dan tombol aksi.
//
// Modul ini mengimpor systems/battle.js (untuk playerElem & aliveEnemies),
// dan TIDAK diimpor balik olehnya — battle.js memanggil renderBattle lewat
// core/bus.js. Itulah yang menjaga arah impor tetap satu arah.

import { state, battle } from '../state.js';
import { ELEMENT_ICON } from '../data/elements.js';
import { CLASS_TRANSFORMS } from '../data/classes.js';
import { spriteCanvasHTML, paintAllSprites } from './sprites.js';
import { playerElem, aliveEnemies } from '../systems/battle.js';

export function statusTag(obj){
  return obj.poison && obj.poison.turns>0 ? `<span class="status-tag">☠ Racun ${obj.poison.turns}</span>` : '';
}

export function elemTag(elem){
  return elem ? `<span class="status-tag">${ELEMENT_ICON[elem]} ${elem}</span>` : '';
}

export function hpBarColor(pct){
  if(pct>50) return '#5fc36a';
  if(pct>25) return '#f0a05d';
  return '#e0523f';
}

export function renderBattle(){
  const actorsDiv = document.getElementById('battle-actors');
  let html = '';
  const c = state.char;
  const pElem = playerElem();
  const pctChar = Math.max(0,Math.round(c.hp/c.maxHp*100));
  html += `<div class="actor ${battle.playerDefending?'defending':''} ${battle.flashTargets.has('char')?'hit-flash':''}"><div class="actor-row">
    <div class="icon-box player">${spriteCanvasHTML('player', state.nation, 28)}</div>
    <div class="actor-body"><div class="name"><b>Kamu (Lv${c.level})</b><span>${c.hp}/${c.maxHp} HP ${statusTag(c)}${elemTag(pElem)}</span></div><div class="hpbar"><div style="width:${pctChar}%; background:${hpBarColor(pctChar)};"></div></div></div>
  </div></div>`;
  state.generals.forEach((m,idx)=>{
    const pct = Math.max(0,Math.round(m.hp/m.maxHp*100));
    html += `<div class="actor ${battle.flashTargets.has('gen'+idx)?'hit-flash':''}"><div class="actor-row">
      <div class="icon-box">${m.kind==='monster' ? spriteCanvasHTML('monster', m.elem||'Bumi', 28, m.monsterName) : spriteCanvasHTML('general', m.rank, 28)}</div>
      <div class="actor-body"><div class="name"><b>${m.name}${idx===0?' 🛡':''}</b><span>${m.hp}/${m.maxHp} HP ${statusTag(m)}${elemTag(m.elem)}</span></div><div class="hpbar"><div style="width:${pct}%; background:${hpBarColor(pct)};"></div></div></div>
    </div></div>`;
  });
  battle.enemies.forEach((e,idx)=>{
    const pctE = Math.max(0,Math.round(e.hp/e.maxHp*100));
    html += `<div class="actor enemy ${battle.flashTargets.has('enemy'+idx)?'hit-flash':''}" style="${e.hp<=0?'opacity:0.4;':''}"><div class="actor-row">
      <div class="icon-box enemy">${spriteCanvasHTML('monster', e.elem||'Bumi', 28)}</div>
      <div class="actor-body"><div class="name"><b>${e.name}</b><span>${e.hp}/${e.maxHp} HP ${statusTag(e)}${elemTag(e.elem)}</span></div><div class="hpbar"><div style="width:${pctE}%;"></div></div></div>
    </div></div>`;
  });
  actorsDiv.innerHTML = html;
  paintAllSprites(actorsDiv);
  battle.flashTargets.clear();

  document.getElementById('battle-log').innerHTML = battle.log.slice(0,8).map(l=>`<div>${l}</div>`).join('');

  const actionsDiv = document.getElementById('battle-actions');
  if(battle.over){
    actionsDiv.innerHTML = `<button class="gold" onclick="closeBattle()">Lanjutkan</button>`;
    return;
  }
  const alive = aliveEnemies();
  let attackBtns = alive.map(x=>`<button class="red" onclick="battleAttack(${x.i})">Serang ${battle.enemies.length>1? x.e.name : ''}</button>`).join('');
  const hcd = battle.skillCooldowns.heavy;
  const wcd = battle.skillCooldowns.warcry;
  const tcd = battle.skillCooldowns.transform;
  const transform = CLASS_TRANSFORMS[state.className];
  const transformBtn = (state.classTransformed && transform) ? `<button class="gold" onclick="battleSkillTransform()" ${tcd>0?'disabled':''}>${transform.skillName} ${tcd>0?'(CD '+tcd+')':''}</button>` : '';
  actionsDiv.innerHTML = `
    <div class="row2">${attackBtns}</div>
    <div class="row2">
      <button class="orange" onclick="battleSkillHeavy()" ${hcd>0?'disabled':''}>Serangan Berat ${hcd>0?'(CD '+hcd+')':''}</button>
      <button class="purple" onclick="battleSkillWarcry()" ${wcd>0?'disabled':''}>Teriakan Perang ${wcd>0?'(CD '+wcd+')':''}</button>
    </div>
    ${transformBtn}
    <div class="row2">
      <button class="green" onclick="battleUsePotion()">Pakai Ramuan (${state.potions})</button>
      <button class="blue" onclick="battleDefend()">Bertahan</button>
    </div>
    <button class="teal" onclick="battleFlee()">Kabur</button>
  `;
}
