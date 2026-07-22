// Sistem pertempuran: pembentukan musuh, giliran, skill, racun, elemen,
// serta penyelesaian setelah menang/kalah (termasuk alur dungeon,
// test town, garnisun, dan historical scenario).
//
// renderBattle dipanggil lewat core/bus.js, bukan diimpor dari
// ui/battle-ui.js, supaya tidak terbentuk impor melingkar.

import { state, battle, dungeonState, setBattle, setDungeonState } from '../state.js';
import { rand } from '../core/rng.js';
import { render, renderBattle, checkEndConditions, endGame } from '../core/bus.js';
import { showEvent } from '../ui/overlay.js';
import { addLog, gainGold, getAtk, getDef } from './character.js';
import { rollDrop, genItem } from './generators.js';
import { MONSTERS, DUNGEON_MONSTERS, NATION_MONSTERS, LEGENDARY } from '../data/monsters.js';
import { CITY_NATION } from '../data/world.js';
import { MONSTER_SPRITE } from '../data/sprites.js';
import { MAX_GENERALS } from '../data/mercenaries/index.js';
import { memberAtk, memberElem, giveMemberExp, memberProgressFields } from './generals.js';
import { ELEMENTS, elementMultiplier } from '../data/elements.js';
import { WEAPONS } from '../data/economy.js';
import { CLASS_TRANSFORMS, CLASS_TRANSFORM_LEVEL } from '../data/classes.js';
import { TYPE_LABEL } from '../data/items.js';
import { sfx, haptic } from '../audio/sfx.js';
import { playMusic, playVictoryJingle } from '../audio/music.js';

export function luckValue(){ return state.char.luk; }

export function startBattle(context, dest){
  let pool, scale, isBoss=false, enemyCount=1;
  const ngScale = 1 + (state.ngPlus||0)*0.15;
  if(context==='dungeon'){
    pool = DUNGEON_MONSTERS;
    scale = (1 + dungeonState.floor*0.22 + state.day*0.03) * ngScale;
    isBoss = dungeonState.floor===dungeonState.maxFloor;
    if(isBoss){ scale *= 1.3; enemyCount = 2; }
  } else if(context==='garrison'){
    pool = [{name:'Pasukan Garnisun', hpBase:55, atkBase:12, elem: ELEMENTS[rand(0,ELEMENTS.length-1)]}];
    scale = (1 + state.day*0.05) * ngScale;
    enemyCount = 2;
  } else if(context==='historical'){
    pool = [{name:'Jenderal Legendaris Masa Lalu', hpBase:120, atkBase:20, elem: ELEMENTS[rand(0,ELEMENTS.length-1)]}];
    scale = (1.4 + state.day*0.04) * ngScale;
    isBoss = true;
  } else if(context==='testtown'){
    pool = MONSTERS.concat(DUNGEON_MONSTERS);
    scale = (1.6 + dungeonState.floor*0.35 + state.day*0.04) * ngScale;
    isBoss = dungeonState.floor===dungeonState.maxFloor;
    if(isBoss){ scale *= 1.4; enemyCount = 2; }
  } else if(context==='legendary'){
    const L = LEGENDARY[CITY_NATION[dest]];
    pool = [{ name: L.name, hpBase: L.hpBase, atkBase: L.atkBase, elem: L.elem }];
    scale = (1.4 + state.day*0.05) * ngScale;
    isBoss = true;
  } else {
    // Encounter perjalanan: monster khas negara kota tujuan.
    pool = NATION_MONSTERS[CITY_NATION[dest]] || MONSTERS;
    scale = (1 + state.day*0.05) * ngScale;
  }
  const enemies = [];
  for(let i=0;i<enemyCount;i++){
    const m = pool[rand(0,pool.length-1)];
    const suffix = enemyCount>1 ? ` ${i+1}` : '';
    enemies.push({ name: m.name+suffix, hp: Math.round(m.hpBase*scale), maxHp: Math.round(m.hpBase*scale), atk: Math.round(m.atkBase*scale), poisonChance: m.poisonChance||0, poison:null, elem: m.elem||null });
  }
  setBattle({
    context, dest, isBoss,
    enemies,
    log: [enemyCount>1 ? `Sekelompok musuh menghadangmu!` : `${enemies[0].name} menghadangmu!`],
    over: false,
    skillCooldowns: { heavy:0, warcry:0, transform:0 },
    warcryTurns: 0,
    playerDefending: false,
    generalSkillUsed: [],   // indeks jendral yang sudah pakai skill (1x/tempur)
    stoneWall: 0,           // Dinding Batu: kurangi damage musuh giliran ini
    flashTargets: new Set()
  });
  document.getElementById('battle-title').textContent = context==='garrison' ? 'PERTEMPURAN GARNISUN' : (context==='historical' ? '🏛️ HISTORICAL SCENARIO' : (context==='testtown' ? `🏟️ TEST TOWN — GAUNTLET ${dungeonState.floor}/${dungeonState.maxFloor}` : (context==='dungeon' ? `DUNGEON — LANTAI ${dungeonState.floor}/${dungeonState.maxFloor}` : 'PERTEMPURAN')));

  // Inisiatif pembuka berbasis AGI: kalau musuh lebih gesit, mereka menyergap
  // (satu giliran gratis) sebelum kamu bergerak. AGI tinggi menghindarinya.
  const partySpeed = state.char.agi + rand(0,3);
  const enemySpeed = 4 + Math.round(state.day*0.3) + (isBoss?4:0) + rand(0,3);
  if(enemySpeed > partySpeed){
    blog('⚡ Kamu disergap! Musuh yang lebih gesit menyerang lebih dulu.');
    enemyTurn();
    checkBattleEnd();
  }
  renderBattle();
  const bov = document.getElementById('battle-overlay');
  bov.style.display='flex';
  bov.classList.remove('overlay-anim'); void bov.offsetWidth; bov.classList.add('overlay-anim');
  playMusic('battle');
}

export function aliveEnemies(){ return battle.enemies.map((e,i)=>({e,i})).filter(x=>x.e.hp>0); }

export function blog(msg){ battle.log.unshift(msg); }

export function tickCooldowns(){
  if(battle.skillCooldowns.heavy>0) battle.skillCooldowns.heavy--;
  if(battle.skillCooldowns.warcry>0) battle.skillCooldowns.warcry--;
  if(battle.skillCooldowns.transform>0) battle.skillCooldowns.transform--;
  if(battle.warcryTurns>0) battle.warcryTurns--;
}

export function tickPoisonAll(){
  if(state.char.poison && state.char.poison.turns>0 && state.char.hp>0){
    state.char.hp = Math.max(0, state.char.hp - state.char.poison.dmg);
    blog(`☠ Racun menggerogoti kamu sebesar ${state.char.poison.dmg} damage.`);
    state.char.poison.turns--;
    battle.flashTargets.add('char');
  }
  state.generals.forEach((g,i)=>{
    if(g.poison && g.poison.turns>0 && g.hp>0){
      g.hp = Math.max(0, g.hp - g.poison.dmg);
      blog(`☠ Racun menggerogoti ${g.name} sebesar ${g.poison.dmg} damage.`);
      g.poison.turns--;
      battle.flashTargets.add('gen'+i);
    }
  });
  battle.enemies.forEach((e,i)=>{
    if(e.poison && e.poison.turns>0 && e.hp>0){
      e.hp = Math.max(0, e.hp - e.poison.dmg);
      blog(`☠ Racun menggerogoti ${e.name} sebesar ${e.poison.dmg} damage.`);
      e.poison.turns--;
      battle.flashTargets.add('enemy'+i);
    }
  });
}

export function elemNote(mult){
  if(mult>1) return ' 🔥Unggul elemen!';
  if(mult<1) return ' 💧Lemah elemen';
  return '';
}

export function generalsAutoAttack(){
  state.generals.forEach((m,idx)=>{
    if(m.hp<=0) return;
    const alive = aliveEnemies();
    if(alive.length===0) return;
    const target = alive.reduce((a,b)=> a.e.hp<b.e.hp ? a : b);
    const buffMult = battle.warcryTurns>0 ? 1.3 : 1;
    const emult = elementMultiplier(memberElem(m), target.e.elem);
    const mdmg = Math.max(1, Math.round((memberAtk(m) + rand(-2,2)) * buffMult * emult));
    target.e.hp = Math.max(0, target.e.hp - mdmg);
    battle.flashTargets.add('enemy'+target.i);
    blog(`${m.name} menyerang ${target.e.name} sebesar ${mdmg} damage.${battle.warcryTurns>0?' (buff!)':''}${elemNote(emult)}`);
  });
}

export function pickPartyTarget(){
  // Formasi: dua anggota teratas = GARDA DEPAN (idx 0,1). Mereka menahan
  // sebagian besar serangan musuh dan dapat bonus DEF (idx0 lebih tebal),
  // melindungi barisan belakang DAN pemain. Kalau garda depan tumbang,
  // barisan belakang & pemain baru terekspos.
  const gens = state.generals
    .map((m,i)=>({ ref:'merc', obj:m, m, idx:i, def: i===0 ? 6 : (i===1 ? 3 : 0) }))
    .filter(t=>t.obj.hp>0);
  const front = gens.filter(t=>t.idx<2);
  const back = gens.filter(t=>t.idx>=2);
  const charT = { ref:'char', obj:state.char, def:getDef() };
  const rear = back.concat(state.char.hp>0 ? [charT] : []);

  if(front.length){
    // 85% serangan kena garda depan; 15% bocor ke belakang/pemain.
    if(Math.random() < 0.85 || rear.length===0) return front[rand(0,front.length-1)];
    return rear[rand(0,rear.length-1)];
  }
  // Tak ada garda depan: musuh bebas menyerang belakang & pemain.
  return rear.length ? rear[rand(0,rear.length-1)] : null;
}

export function playerElem(){ return state.equipment.weapon ? WEAPONS.find(w=>w.id===state.equipment.weapon).elem : null; }

export function enemyTurn(){
  battle.enemies.forEach(e=>{
    if(e.hp<=0) return;
    const target = pickPartyTarget();
    if(!target) return;
    const defElem = target.ref==='char' ? playerElem() : target.m.elem;
    const emult = elementMultiplier(e.elem, defElem);
    let dmg = Math.max(1, Math.round((e.atk - Math.round(target.def*0.6)) * emult));
    if(target.ref==='char' && battle.playerDefending) dmg = Math.max(1, Math.round(dmg*0.5));
    if(battle.stoneWall) dmg = Math.max(1, Math.round(dmg*0.6)); // Dinding Batu
    target.obj.hp = Math.max(0, target.obj.hp - dmg);
    battle.flashTargets.add(target.ref==='char' ? 'char' : 'gen'+target.idx);
    const name = target.ref==='char' ? 'kamu' : target.m.name;
    blog(`${e.name} menyerang ${name} sebesar ${dmg} damage.${elemNote(emult)}`);
    if(e.poisonChance && Math.random()<e.poisonChance){
      target.obj.poison = { turns:3, dmg: Math.max(2, Math.round(e.atk*0.3)) };
      blog(`${name} terkena racun dari ${e.name}!`);
    }
  });
  battle.playerDefending = false;
  battle.stoneWall = 0; // efek habis setelah giliran musuh
}

export function checkBattleEnd(){
  if(battle.enemies.every(e=>e.hp<=0)){ winBattle(); return true; }
  if(state.char.hp<=0){ loseBattle(); return true; }
  return false;
}

export function maybePoisonEnemy(target){
  const hasLegendaryOffensive = [state.equipment.accessory1, state.equipment.accessory2].some(uid=>{
    if(!uid) return false;
    const it = state.items.find(i=>i.uid===uid);
    return it && it.rarity==='Legendaris' && it.type==='offensive';
  });
  if(hasLegendaryOffensive && Math.random()<0.2){
    target.poison = { turns:3, dmg:6 };
    blog(`${target.name} teracuni oleh senjata legendarismu!`);
  }
}

export function battleAttack(targetIdx){
  if(battle.over) return;
  const target = battle.enemies[targetIdx];
  if(!target || target.hp<=0) return;
  const emult = elementMultiplier(playerElem(), target.elem);
  const dmg = Math.round((getAtk() + rand(-2,3)) * emult);
  target.hp = Math.max(0, target.hp - Math.max(1,dmg));
  battle.flashTargets.add('enemy'+targetIdx);
  blog(`Kamu menyerang ${target.name} sebesar ${Math.max(1,dmg)} damage.${elemNote(emult)}`);
  maybePoisonEnemy(target);
  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

export function battleSkillHeavy(){
  if(battle.over || battle.skillCooldowns.heavy>0) return;
  const alive = aliveEnemies();
  if(alive.length===0) return;
  const target = alive[0].e;
  const emult = elementMultiplier(playerElem(), target.elem);
  const dmg = Math.round((Math.round(getAtk()*1.8) + rand(-2,4)) * emult);
  target.hp = Math.max(0, target.hp - Math.max(1,dmg));
  battle.flashTargets.add('enemy'+alive[0].i);
  blog(`Kamu melancarkan Serangan Berat ke ${target.name} sebesar ${Math.max(1,dmg)} damage!${elemNote(emult)}`);
  maybePoisonEnemy(target);
  battle.skillCooldowns.heavy = 3;
  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

export function battleSkillWarcry(){
  if(battle.over || battle.skillCooldowns.warcry>0) return;
  battle.warcryTurns = 2;
  battle.skillCooldowns.warcry = 4;
  blog('Kamu meneriakkan Teriakan Perang! Pasukan jendral mendapat buff ATK untuk 2 giliran.');
  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

export function battleSkillTransform(){
  if(battle.over || battle.skillCooldowns.transform>0 || !state.classTransformed) return;
  const transform = CLASS_TRANSFORMS[state.className];
  battle.skillCooldowns.transform = transform.cooldown;

  if(state.className==='Pedagang'){
    const alive = aliveEnemies();
    if(alive.length>0){
      const best = alive.reduce((a,b)=> a.e.hp<b.e.hp ? a : b);
      const target = best.e;
      if(Math.random()<0.5){
        const dmg = Math.round(target.maxHp*0.4);
        target.hp = Math.max(0, target.hp-dmg);
        battle.flashTargets.add('enemy'+best.i);
        blog(`Kamu menyuap ${target.name}, mereka mundur ragu-ragu (-${dmg} HP)!`);
      } else {
        blog(`Suapmu ditolak mentah-mentah oleh ${target.name}!`);
      }
    }
  } else if(state.className==='Petarung'){
    const alive = aliveEnemies();
    if(alive.length>0){
      const target = alive[0].e;
      for(let hit=0; hit<2; hit++){
        if(target.hp<=0) break;
        const emult = elementMultiplier(playerElem(), target.elem);
        const dmg = Math.round((getAtk()+rand(-2,3))*emult);
        target.hp = Math.max(0, target.hp-Math.max(1,dmg));
        battle.flashTargets.add('enemy'+alive[0].i);
        blog(`Serangan Ganda hit ${hit+1}: ${Math.max(1,dmg)} damage ke ${target.name}.${elemNote(emult)}`);
      }
    }
  } else if(state.className==='Cendekiawan'){
    state.char.hp = Math.min(state.char.maxHp, state.char.hp+30);
    state.char.poison = null;
    battle.warcryTurns = Math.max(battle.warcryTurns,1);
    blog('Strategi Cerdas: +30 HP, racun hilang, pasukan jendral dapat buff ATK 1 giliran.');
  }

  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

export function battleUsePotion(){
  if(battle.over) return;
  if(state.potions<=0){ blog('Tidak ada ramuan tersisa!'); sfx('error'); renderBattle(); return; }
  state.potions--;
  state.char.hp = Math.min(state.char.maxHp, state.char.hp+40);
  blog('Kamu meminum ramuan, memulihkan 40 HP.');
  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

export function battleDefend(){
  if(battle.over) return;
  battle.playerDefending = true;
  blog('Kamu memasang kuda-kuda bertahan, mengurangi damage masuk 50%.');
  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

// Skill khas per elemen anggota pasukan. Nama untuk tombol; efek di
// useGeneralSkill. Tiap anggota bisa memakainya 1x per pertempuran.
export const ELEM_SKILL = {
  Api: 'Ledakan Api',
  Air: 'Berkah Air',
  Angin: 'Badai Angin',
  Petir: 'Sambaran Petir',
  Bumi: 'Dinding Batu',
};

// Combo dua anggota: pasangan elemen tertentu memicu serangan gabungan kuat,
// memakai jatah skill KEDUA anggota. Order elemen tidak penting.
export const COMBOS = [
  { a: 'Api',   b: 'Angin', name: 'Badai Api',      dmg: 1.0 },
  { a: 'Petir', b: 'Air',   name: 'Prahara Petir',  dmg: 1.0 },
  { a: 'Bumi',  b: 'Api',   name: 'Letusan Gunung', dmg: 1.2 },
  { a: 'Air',   b: 'Angin', name: 'Topan',          dmg: 0.6, heal: 0.5 },
  { a: 'Petir', b: 'Bumi',  name: 'Gempa Petir',    dmg: 1.0 },
];

/** Cari satu combo yang bisa dipakai sekarang: dua anggota hidup, skill
 *  belum dipakai, elemennya cocok sepasang. Null kalau tak ada. */
export function availableCombo(){
  if(!battle || battle.over) return null;
  const cand = state.generals.map((m,i)=>({m,i})).filter(x=>x.m.hp>0 && !battle.generalSkillUsed.includes(x.i));
  for(let a=0;a<cand.length;a++){
    for(let b=a+1;b<cand.length;b++){
      const eA = memberElem(cand[a].m), eB = memberElem(cand[b].m);
      const combo = COMBOS.find(c=> (c.a===eA&&c.b===eB)||(c.a===eB&&c.b===eA));
      if(combo) return { combo, iA: cand[a].i, iB: cand[b].i };
    }
  }
  return null;
}

/** Jalankan combo yang tersedia (memakai skill kedua anggotanya). */
export function useCombo(){
  if(battle.over) return;
  const found = availableCombo();
  if(!found){ sfx('error'); return; }
  const { combo, iA, iB } = found;
  battle.generalSkillUsed.push(iA, iB);
  const atk = memberAtk(state.generals[iA]) + memberAtk(state.generals[iB]);
  aliveEnemies().forEach(t=>{
    const d = Math.max(1, Math.round(atk*combo.dmg));
    t.e.hp = Math.max(0, t.e.hp - d);
    battle.flashTargets.add('enemy'+t.i);
  });
  if(combo.heal){
    const h = Math.round(atk*combo.heal);
    state.char.hp = Math.min(state.char.maxHp, state.char.hp + h);
    state.generals.forEach(g=>{ if(g.hp>0) g.hp = Math.min(g.maxHp, g.hp + h); });
  }
  blog(`✨✨ COMBO ${combo.name}! ${state.generals[iA].name} + ${state.generals[iB].name} bersinergi!`);
  sfx('win'); haptic([40,20,60]);

  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

/** Skill anggota pasukan idx berdasarkan elemen efektifnya (1x/tempur). */
export function useGeneralSkill(idx){
  if(battle.over) return;
  const m = state.generals[idx];
  if(!m || m.hp<=0) return;
  if(battle.generalSkillUsed.includes(idx)) { sfx('error'); return; }
  const elem = memberElem(m);
  if(!ELEM_SKILL[elem]) { sfx('error'); return; }
  battle.generalSkillUsed.push(idx);
  const atk = memberAtk(m);

  if(elem==='Api'){
    aliveEnemies().forEach(t=>{
      const em = elementMultiplier(elem, t.e.elem);
      const d = Math.max(1, Math.round(atk*1.1*em));
      t.e.hp = Math.max(0, t.e.hp - d);
      battle.flashTargets.add('enemy'+t.i);
    });
    blog(`✨ ${m.name} melepas Ledakan Api ke SEMUA musuh!`);
  } else if(elem==='Petir'){
    const alive = aliveEnemies();
    if(alive.length){
      const t = alive.reduce((a,b)=> a.e.hp>b.e.hp ? a : b);
      const em = elementMultiplier(elem, t.e.elem);
      const d = Math.max(1, Math.round(atk*2.2*em));
      t.e.hp = Math.max(0, t.e.hp - d);
      battle.flashTargets.add('enemy'+t.i);
      blog(`✨ ${m.name} menyambar ${t.e.name} dengan Petir sebesar ${d}!`);
    }
  } else if(elem==='Angin'){
    const alive = aliveEnemies();
    if(alive.length){
      const t = alive[0];
      let total = 0;
      for(let h=0;h<2 && t.e.hp>0;h++){
        const em = elementMultiplier(elem, t.e.elem);
        const d = Math.max(1, Math.round(atk*0.9*em));
        t.e.hp = Math.max(0, t.e.hp - d); total += d;
        battle.flashTargets.add('enemy'+t.i);
      }
      blog(`✨ ${m.name} melancarkan Badai Angin (2x) ke ${t.e.name} sebesar ${total}!`);
    }
  } else if(elem==='Air'){
    const heal = Math.round(atk*1.4);
    state.char.hp = Math.min(state.char.maxHp, state.char.hp + heal);
    state.generals.forEach(g=>{ if(g.hp>0) g.hp = Math.min(g.maxHp, g.hp + heal); });
    blog(`✨ ${m.name} memberi Berkah Air, memulihkan ${heal} HP seluruh pasukan!`);
  } else if(elem==='Bumi'){
    battle.stoneWall = 1;
    blog(`✨ ${m.name} memasang Dinding Batu — damage musuh giliran ini -40%!`);
  }

  generalsAutoAttack();
  if(checkBattleEnd()) return;
  enemyTurn();
  if(checkBattleEnd()) return;
  tickPoisonAll();
  if(checkBattleEnd()) return;
  tickCooldowns();
  renderBattle();
}

export function battleFlee(){
  if(battle.over) return;
  const chance = 0.3 + state.char.agi*0.03;
  if(Math.random() < chance){
    // Kabur bukan tanpa harga: kamu menjatuhkan sebagian gold saat panik.
    const drop = Math.round(state.gold*0.1);
    if(drop>0){ state.gold -= drop; blog(`Kamu menjatuhkan ${drop} gold saat panik kabur.`); }
    blog('Kamu berhasil kabur dari pertempuran!');
    battle.over = true;
    document.getElementById('battle-title').textContent = 'KABUR BERHASIL';
    renderBattle();
  } else {
    blog('Gagal kabur!');
    enemyTurn();
    if(checkBattleEnd()) return;
    tickPoisonAll();
    if(checkBattleEnd()) return;
    tickCooldowns();
    renderBattle();
  }
}

export function winBattle(){
  battle.over = true;
  state.stats.battlesWon++;
  const n = battle.enemies.length;
  const expBonusPct = state.classExpBonusPct||0;
  const expGain = Math.round(rand(15,30)*n * (1 + state.char.int*0.01) * (1+expBonusPct/100));
  const goldGain = rand(20,70)*n;
  gainGold(goldGain);
  state.char.exp += expGain;
  blog(`Kemenangan! +${goldGain} gold, +${expGain} EXP.`);
  document.getElementById('battle-title').textContent = 'MENANG';
  sfx('win');
  playVictoryJingle();
  haptic([40,30,40]);
  while(state.char.exp >= state.char.expMax){
    state.char.exp -= state.char.expMax;
    state.char.level++;
    state.char.expMax = Math.round(state.char.expMax*1.25);
    state.char.maxHp += 15;
    state.char.hp = state.char.maxHp;
    state.char.str += 2; state.char.int += 2; state.char.agi += 2; state.char.luk += 1;
    blog(`Level up! Sekarang level ${state.char.level}, semua stat naik.`);
    sfx('levelup');
    haptic([30,20,30,20,60]);
    if(!state.classTransformed && state.char.level>=CLASS_TRANSFORM_LEVEL){
      state.classTransformed = true;
      const t = CLASS_TRANSFORMS[state.className];
      blog(`✨ Transformasi! Kamu kini menjadi ${t.title}, membuka skill "${t.skillName}"!`);
      haptic([50,50,50,50,100]);
    }
  }
  // EXP untuk pasukan yang ikut & masih hidup — jendral & monster naik level
  // sendiri, bukan cuma promosi berbayar (arah "bangun pasukan").
  const partyExp = Math.round(rand(8,16)*n);
  state.generals.forEach((m)=>{
    if(m.hp<=0) return;
    const lv = giveMemberExp(m, partyExp);
    if(lv>0) blog(`${m.name} naik ke Lv${m.level}! (+${lv*2} ATK, +${lv*8} HP maks)`);
  });
  maybeCaptureMonster();
  renderBattle();
}

/**
 * Peluang menangkap satu monster yang kalah menjadi pasukan (몬스터 고용
 * ala Xian). Hanya pada perjalanan/dungeon/test town non-bos, kalau masih
 * ada slot pasukan. Monster tangkapan sedikit lebih lemah dari versi musuh.
 */
function maybeCaptureMonster(){
  if(state.generals.length >= MAX_GENERALS) return;
  if(!['travel','dungeon','testtown'].includes(battle.context) || battle.isBoss) return;
  const capturable = battle.enemies.filter(e=>{
    const nm = e.name.replace(/ \d+$/, '');
    return e.hp<=0 && nm!=='Pasukan Garnisun' && MONSTER_SPRITE[nm];
  });
  if(!capturable.length) return;
  const chance = Math.min(0.5, 0.18 + luckValue()*0.01);
  if(Math.random() >= chance) return;
  const src = capturable[rand(0, capturable.length-1)];
  const nm = src.name.replace(/ \d+$/, '');
  const hp = Math.max(10, Math.round(src.maxHp*0.8));
  const atk = Math.max(2, Math.round(src.atk*0.8));
  state.generals.push({ name: nm, kind:'monster', monsterName: nm, rank:0, maxHp: hp, hp, atk, elem: src.elem, poisonChance: src.poisonChance||0, rebirthBonus:0, ...memberProgressFields() });
  state.stats.monstersCaptured = (state.stats.monstersCaptured||0)+1;
  blog(`✨ ${nm} tunduk dan bergabung dalam pasukanmu!`);
  sfx('levelup');
}

export function loseBattle(){
  battle.over = true;
  state.stats.battlesLost++;
  blog('Kamu terluka parah dan pingsan...');
  document.getElementById('battle-title').textContent = 'KALAH';
  sfx('lose');
  haptic([120]);
  renderBattle();
}

export function closeBattle(){
  document.getElementById('battle-overlay').style.display='none';
  playMusic('explore');
  if(state.char.hp<=0){
    endGame(false, 'Kamu tumbang dalam pertempuran. Perjalanan dagangmu berakhir di sini.');
    return;
  }
  const won = battle.enemies.every(e=>e.hp<=0);

  if(battle.context==='travel'){
    if(won){
      const drop = rollDrop(luckValue()*0.4);
      if(drop){ state.items.push(drop); state.stats.itemsFound++; addLog(`Dari pertempuran kamu menemukan ${drop.name} (${drop.rarity}).`); }
    }
    addLog(`Tiba di ${battle.dest} setelah pertempuran.`);
    if(!checkEndConditions()) render();
    return;
  }

  if(battle.context==='garrison'){
    if(won){
      state.owned.push(battle.dest);
      state.medals += 2;
      showEvent('🏰 Wilayah Dikuasai!', `${battle.dest} kini di bawah kekuasaanmu dan akan memberi pemasukan pajak tiap kali kamu berpindah kota. +2 medali.`);
    } else {
      showEvent('Gagal Menguasai Wilayah', `Pasukan garnisun ${battle.dest} terlalu kuat. Perkuat dulu karaktermu dan coba lagi.`);
    }
    return;
  }

  if(battle.context==='legendary'){
    const nation = CITY_NATION[battle.dest];
    const L = LEGENDARY[nation];
    if(won){
      // Jinakkan monster legendaris jadi pasukan sangat kuat (신수).
      state.legendaryTamed = state.legendaryTamed || {};
      state.legendaryTamed[nation] = true;
      const troop = { name: L.name, kind:'monster', monsterName: L.name, rank:0,
        maxHp: Math.round(L.hpBase*1.2), hp: Math.round(L.hpBase*1.2), atk: Math.round(L.atkBase*1.1),
        elem: L.elem, poisonChance:0, rebirthBonus:0, level:1, exp:0, expMax:50, legendary:true };
      state.medals += 6;
      const dest = state.generals.length < MAX_GENERALS ? state.generals : (state.barracks || (state.barracks=[]));
      dest.push(troop);
      const where = dest===state.generals ? 'pasukan aktif' : 'barak';
      showEvent(`✨ ${L.name} Dijinakkan!`, `Kamu menaklukkan monster legendaris ${nation}! Ia kini bergabung di ${where} sebagai pasukan legendaris (+6 medali).`, ()=>{ if(!checkEndConditions()) render(); });
    } else {
      showEvent(`Gagal Berburu ${L.name}`, `Monster legendaris terlalu perkasa. Perkuat pasukanmu dan coba lagi.`, ()=>{ if(!checkEndConditions()) render(); });
    }
    return;
  }

  if(battle.context==='historical'){
    setDungeonState(null);
    if(won){
      state.upgradeParts = (state.upgradeParts||0)+2;
      const drop = genItem('Legendaris');
      state.items.push(drop);
      state.stats.itemsFound++;
      state.medals += 4;
      showEvent('🏛️ Historical Scenario Ditaklukkan!', `Kamu mengalahkan Jenderal Legendaris Masa Lalu! +2 Upgrade Part, +4 medali, dan item ${drop.name} (Legendaris).`, ()=>{ if(!checkEndConditions()) render(); });
    } else {
      showEvent('Gagal di Historical Scenario', 'Jenderal Legendaris Masa Lalu terlalu kuat. Perkuat dulu karaktermu dan coba lagi (TP yang dipakai tidak dikembalikan).', ()=>{ if(!checkEndConditions()) render(); });
    }
    return;
  }

  if(battle.context==='testtown'){
    if(won){
      const goldGain = rand(80,150)*dungeonState.floor;
      gainGold(goldGain);
      state.medals += 2;
      const drop = rollDrop(luckValue()*0.6 + dungeonState.floor*3);
      if(drop){ state.items.push(drop); state.stats.itemsFound++; }
      const lootMsg = `+${goldGain} gold, +2 medali${drop ? `, item ${drop.name} (${drop.rarity})` : ''}.`;
      if(dungeonState.floor < dungeonState.maxFloor){
        showEvent(`Gauntlet ${dungeonState.floor} Ditaklukkan!`, lootMsg + ' Lanjut ke gauntlet berikutnya?', ()=>{ dungeonState.floor++; startBattle('testtown', state.city); });
      } else {
        state.upgradeParts = (state.upgradeParts||0)+1;
        state.stats.testTownCleared = (state.stats.testTownCleared||0)+1;
        const bonusDrop = genItem('Legendaris');
        state.items.push(bonusDrop);
        showEvent('🏆 Test Town Ditaklukkan!', lootMsg + ` Bonus penuntasan: +1 Upgrade Part dan pusaka ${bonusDrop.name} (Legendaris)!`, ()=>{ setDungeonState(null); if(!checkEndConditions()) render(); });
      }
    } else {
      showEvent('Gagal di Test Town', 'Gauntlet ini terlalu berat untukmu saat ini. Kesempatan Test Town minggu ini sudah terpakai — coba lagi setelah lebih kuat.', ()=>{ setDungeonState(null); if(!checkEndConditions()) render(); });
    }
    return;
  }

  if(battle.context==='dungeon'){
    if(won){
      const luck = luckValue()*0.4 + dungeonState.floor*2 + (battle.isBoss?4:0);
      const drop = rollDrop(luck);
      if(battle.isBoss) state.medals += 3;
      if(drop){ state.items.push(drop); state.stats.itemsFound++; }
      const lootMsg = drop ? `Kamu mendapat item: ${drop.name} (${drop.rarity}, ${TYPE_LABEL[drop.type]})!` : 'Tidak ada item yang didapat kali ini.';
      if(dungeonState.floor < dungeonState.maxFloor){
        showEvent(`Lantai ${dungeonState.floor} Selesai`, lootMsg + ' Lanjut ke lantai berikutnya?', ()=>{ dungeonState.floor++; startDungeonFloor(); });
      } else {
        showEvent('🐉 Dungeon Ditaklukkan!', lootMsg + ' Kamu menaklukkan seluruh dungeon dan mendapat 3 medali.', ()=>{ setDungeonState(null); if(!checkEndConditions()) render(); });
      }
    } else {
      showEvent('Mundur dari Dungeon', 'Kamu gagal mengalahkan monster dan mundur dari dungeon.', ()=>{ setDungeonState(null); if(!checkEndConditions()) render(); });
    }
    return;
  }
}

export function startDungeonFloor(){ startBattle('dungeon', dungeonState.city); }
