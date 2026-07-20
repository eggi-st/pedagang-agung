// ============================================================
// LOGIC PERMAINAN — hasil pemindahan Fase 2 dari original-reference.html
//
// Isi file ini SENGAJA masih satu modul besar dan identik dengan aslinya.
// Urutannya: jalankan dulu, rapikan kemudian. Pemecahan ke src/systems/*
// dan src/ui/* dikerjakan setelah versi ini terbukti berjalan, supaya
// kalau ada yang pecah kita tahu itu karena pemecahan — bukan karena
// pemindahan.
//
// Data statis, audio, dan mesin sprite TIDAK disalin ke sini; semuanya
// diimpor dari modul yang sudah diekstrak di Fase 1.
// ============================================================

import { GOODS, WEAPONS, ARMORS, FACTORY_RECIPES, ELITE_EXCHANGES } from './data/economy.js';
import { CITIES, CITY_LEVEL_RANGE, CITY_ICON } from './data/world.js';
import { ELEMENTS, ELEMENT_ICON, ELEMENT_BODY_COLOR, elementMultiplier } from './data/elements.js';
import { MONSTERS, DUNGEON_MONSTERS, MONSTER_ICON, monsterIcon } from './data/monsters.js';
import { RARITY_RANGE, RARITY_SELL, RARITY_ORDER, ITEM_TYPE_NAMES, TYPE_LABEL, TYPE_ICON, DIAGRAMS } from './data/items.js';
import { CLASSES, NATION_ICON, NATION_BODY_COLOR, CLASS_TRANSFORM_LEVEL, CLASS_TRANSFORMS } from './data/classes.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { MERC_NAMES, RANK_NAMES, RANK_ICON, RANK_BODY_COLOR, MAX_GENERALS } from './data/mercenaries/index.js';
import { SPRITE_HUMANOID, SPRITE_MONSTER, SKIN_TONE } from './data/sprites.js';
import { paintAllSprites, spriteCanvasHTML, drawPixelSprite, playSpriteAnim } from './ui/sprites.js';
import { sfx, haptic, toggleMute as toggleMuteBase } from './audio/sfx.js';
import { playMusic, stopMusic, playVictoryJingle, toggleMusic as toggleMusicBase } from './audio/music.js';

// Modul hasil pemecahan Fase 2 lanjutan.
import { state, battle, dungeonState, setState, setBattle, setDungeonState } from './state.js';
import { rand } from './core/rng.js';
import { SAVE_PREFIX, saveGame, loadSavedGame, clearSave, migrateState } from './systems/save.js';
import {
  addLog, gainGold, accessoryContribution, currentWeaponAtk, currentArmorDef,
  getAtk, getDef, reputationBonusPct,
} from './systems/character.js';
import {
  genPrices, genRecruits, genItem, rollDrop, genQuest, genGuildQuest,
  guildQuestReady, guildQuestLabel, guildQuestProgressNow,
} from './systems/generators.js';
import { registerHooks } from './core/bus.js';
import { showEvent, closeEvent } from './ui/overlay.js';
import {
  buy, sell, buyGear, equipGear, sellGear, buyPotion,
  startProduction, sellProcessed, exchangeTP, enterHistoricalScenario, travel,
} from './systems/economy.js';
import {
  startBattle, startDungeonFloor, closeBattle, battleAttack, battleSkillHeavy,
  battleSkillWarcry, battleSkillTransform, battleUsePotion, battleDefend, battleFlee,
} from './systems/battle.js';
import { renderBattle, hpBarColor } from './ui/battle-ui.js';

// Tombol di index.html memanggil toggleMute()/toggleMusic() tanpa argumen,
// sedangkan versi terekstrak menerima elemen label. Pembungkus tipis ini
// menjaga kompatibilitas markup lama.
function toggleMute(){ return toggleMuteBase(document.getElementById('mute-btn')); }
function toggleMusic(){ return toggleMusicBase(document.getElementById('music-btn')); }


// ---------- GRAFIK LAYAR AKHIR ----------
function drawGoldChart(){
  const canvas = document.getElementById('gold-chart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const data = (state.goldHistory && state.goldHistory.length>0) ? state.goldHistory : [{day:1,gold:state.gold}];
  const padL = 34, padR = 10, padT = 10, padB = 18;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxGold = Math.max(...data.map(d=>d.gold), 10);
  const minGold = 0;
  const maxDay = Math.max(...data.map(d=>d.day), 1);
  const minDay = data[0].day;
  const dayRange = Math.max(1, maxDay-minDay);

  ctx.strokeStyle = '#3d2f5c';
  ctx.lineWidth = 1;
  ctx.font = '8px monospace';
  ctx.fillStyle = '#9788b8';
  for(let i=0;i<=4;i++){
    const y = padT + plotH - (plotH*i/4);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W-padR, y);
    ctx.stroke();
    const val = Math.round(maxGold*i/4);
    ctx.fillText(val, 2, y+3);
  }

  ctx.strokeStyle = '#f4c542';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d,i)=>{
    const x = padL + ( (d.day-minDay)/dayRange ) * plotW;
    const y = padT + plotH - ( (d.gold-minGold)/(maxGold-minGold||1) ) * plotH;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = '#f4c542';
  data.forEach(d=>{
    const x = padL + ( (d.day-minDay)/dayRange ) * plotW;
    const y = padT + plotH - ( (d.gold-minGold)/(maxGold-minGold||1) ) * plotH;
    ctx.beginPath();
    ctx.arc(x,y,2,0,Math.PI*2);
    ctx.fill();
  });

  ctx.fillStyle = '#9788b8';
  ctx.fillText(`Hari ${minDay}`, padL, H-4);
  ctx.fillText(`Hari ${maxDay}`, W-padR-32, H-4);
}

// Mendaftarkan implementasi yang dipakai sistem lewat core/bus.js.
// Deklarasi fungsi ter-hoist, jadi aman dipanggil di sini walau
// definisinya ada di bawah.
registerHooks({ render, renderBattle, startBattle, checkEndConditions, endGame });

// ---------- STATE LOKAL ALUR LAYAR ----------
// state/battle/dungeonState sudah pindah ke src/state.js. Yang tersisa di
// sini hanya milik alur layar yang belum dipecah.
let eventCallback = null;
let pendingSlot = 1;
let pendingNation = null;
let craftSelection = [];

// ---------- SAVE (alur layar) ----------
function manualSave(){ saveGame(); showEvent('💾 Tersimpan', `Progres di Slot ${state.currentSlot} sudah disimpan. Kamu bisa tutup dan lanjut kapan saja.`); }
function confirmReset(){
  showEvent('🗑 Hapus Progres?', 'Ini akan menghapus save di slot ini dan kembali ke layar awal. Ketuk tombol di bawah untuk konfirmasi.', ()=>{
    clearSave(state.currentSlot);
    location.reload();
  });
}
function confirmFinishJourney(){
  showEvent('🏁 Selesaikan Perjalanan?', `Kamu sudah berjalan ${state.day} hari. Ini akan mengakhiri perjalanan sekarang dan menampilkan hasil akhir (gelar, statistik, opsi New Game+). Progres yang tersimpan akan dihapus. Ketuk tombol di bawah untuk konfirmasi.`, ()=>{
    endGame(true, null);
  });
}
function renderSlotRow(){
  const row = document.getElementById('slot-row');
  row.innerHTML = '';
  for(let i=1;i<=3;i++){
    const saved = loadSavedGame(i);
    const btn = document.createElement('button');
    btn.className = 'slot-btn' + (pendingSlot===i ? ' active' : '');
    btn.textContent = saved ? `Slot ${i} ✓` : `Slot ${i} kosong`;
    btn.onclick = ()=>{ pendingSlot=i; renderSlotRow(); initContinueSlot(); };
    row.appendChild(btn);
  }
}
function initContinueSlot(){
  const saved = loadSavedGame(pendingSlot);
  const slot = document.getElementById('continue-slot');
  if(saved && saved.state){
    const s = saved.state;
    slot.innerHTML = `<button class="gold" onclick="continueGame()">▶ Lanjutkan Slot ${pendingSlot} (Hari ${s.day}, ${s.gold}g, Lv${s.char.level})</button>
    <div style="text-align:center; color:var(--dim); font-size:7px; margin-bottom:8px;">atau mulai baru di bawah (save slot ini akan tertimpa)</div>`;
  } else {
    slot.innerHTML = '';
  }
}
function continueGame(){
  const saved = loadSavedGame(pendingSlot);
  if(!saved) return;
  setState(saved.state);
  setDungeonState(saved.dungeonState || null);
  migrateState();
  document.getElementById('setup-nation').style.display='none';
  document.getElementById('setup-class').style.display='none';
  document.getElementById('main-screen').style.display='block';
  playMusic('explore');
  render();
}

// ---------- SETUP FLOW ----------
function chooseNation(nation){
  pendingNation = nation;
  document.getElementById('setup-nation').style.display='none';
  document.getElementById('setup-class').style.display='block';
}
function backToNation(){
  document.getElementById('setup-class').style.display='none';
  document.getElementById('setup-nation').style.display='block';
}
function chooseClass(className){
  startGame(pendingNation, className, {});
}

function startGame(nation, className, opts){
  opts = opts || {};
  let gold, capMax, str, int, agi, luk;
  if(nation==='Joseon'){ gold=500; capMax=50; str=8; int=4; agi=4; luk=3; }
  else if(nation==='China'){ gold=350; capMax=60; str=4; int=8; agi=4; luk=4; }
  else { gold=300; capMax=45; str=4; int=4; agi=8; luk=6; }

  const cls = CLASSES[className] || CLASSES.Pedagang;
  if(cls.capBonus) capMax += cls.capBonus;
  if(cls.lukFlat) luk += cls.lukFlat;
  gold += (opts.goldCarry || 0);

  const baseHp = 60 + str*3 + (cls.hpFlat||0);

  setState({
    nation, className, gold, day:1, maxDay:30,
    city: CITIES[0],
    char: { level:1, exp:0, expMax:100, hp: baseHp, maxHp: baseHp, str, int, agi, luk, classAtkBonus: cls.atkFlat||0 },
    classDiscountPct: cls.discountPct||0,
    classExpBonusPct: cls.expPct||0,
    equipment: { weapon:null, armor:null, accessory1:null, accessory2:null },
    ownedWeapons: [], ownedArmors: [],
    potions: 2,
    generals: [],
    items: [],
    inventory: {},
    cap:0, capMax,
    prices: {}, recruits: {},
    owned: [], medals: 0,
    reputation: {}, cityUpgrades: {}, quests: {},
    factory: { active: null }, processedGoods: {},
    guildQuest: null,
    tradePoints: 0, upgradeParts: 0, rebirthStones: 0,
    lastTestTown: 0,
    goldHistory: [{day:1, gold}],
    classTransformed: false,
    skillCooldownTransform: 0,
    ngPlus: opts.ngPlus || 0,
    stats: { battlesWon:0, battlesLost:0, itemsFound:0, itemsCrafted:0, questsCompleted:0, totalGoldEarned: gold },
    achievements: [],
    currentSlot: pendingSlot,
    log: []
  });
  CITIES.forEach(c=>{
    state.prices[c] = genPrices();
    state.recruits[c] = genRecruits();
    state.reputation[c] = 0;
    state.cityUpgrades[c] = { gudang: 0, benteng: 0 };
    state.quests[c] = genQuest();
  });
  FACTORY_RECIPES.forEach(r=> state.processedGoods[r.id]=0);
  state.guildQuest = genGuildQuest();
  GOODS.forEach(g=> state.inventory[g.id]=0);

  addLog(`Kamu memulai perjalanan sebagai ${className} dari ${nation} di kota ${state.city}.${state.ngPlus>0 ? ' (New Game+ Lv'+state.ngPlus+')' : ''}`);
  document.getElementById('setup-nation').style.display='none';
  document.getElementById('setup-class').style.display='none';
  document.getElementById('main-screen').style.display='block';
  playMusic('explore');
  render();
}

function switchTab(tab){
  ['trade','shop','party','peta'].forEach(t=>{
    const panel = document.getElementById('panel-'+t);
    if(t===tab){
      panel.style.display = 'block';
      panel.classList.remove('tab-panel-anim');
      void panel.offsetWidth;
      panel.classList.add('tab-panel-anim');
    } else {
      panel.style.display = 'none';
    }
    document.getElementById('tab-'+t).classList.toggle('active', t===tab);
  });
}

function render(){
  const c = state.char;
  document.getElementById('s-gold').textContent = state.gold;
  document.getElementById('s-day').textContent = state.day;
  document.getElementById('s-hp').textContent = c.hp;
  document.getElementById('s-maxhp').textContent = c.maxHp;
  document.getElementById('s-level').textContent = c.level;
  document.getElementById('s-medals').textContent = state.medals;
  document.getElementById('s-tp').textContent = state.tradePoints||0;
  document.getElementById('s-cap').textContent = state.cap;
  document.getElementById('s-capmax').textContent = state.capMax;
  document.getElementById('s-exp').textContent = c.exp;
  document.getElementById('s-expmax').textContent = c.expMax;
  document.getElementById('s-str').textContent = c.str;
  document.getElementById('s-int').textContent = c.int;
  document.getElementById('s-agi').textContent = c.agi;
  document.getElementById('s-luk').textContent = c.luk;
  document.getElementById('s-atk').textContent = getAtk();
  document.getElementById('s-def').textContent = getDef();
  document.getElementById('city-name-trade').textContent = `Kota: ${state.city}`;
  drawPixelSprite(document.getElementById('player-avatar-canvas'), SPRITE_HUMANOID, { H:'#2a1a0a', S:SKIN_TONE, B: NATION_BODY_COLOR[state.nation]||'#4a90d9', A:'#f4c542' });
  const displayClassName = (state.classTransformed && CLASS_TRANSFORMS[state.className]) ? CLASS_TRANSFORMS[state.className].title : (state.className||'Pedagang');
  document.getElementById('player-name-label').textContent = `${displayClassName} Lv${c.level}`;
  document.getElementById('player-nation-label').textContent = `Asal: ${state.nation}`;

  document.getElementById('eq-weapon').textContent = state.equipment.weapon ? WEAPONS.find(w=>w.id===state.equipment.weapon).name : 'Kosong';
  document.getElementById('eq-armor').textContent = state.equipment.armor ? ARMORS.find(a=>a.id===state.equipment.armor).name : 'Kosong';
  const acc1 = state.equipment.accessory1 ? state.items.find(i=>i.uid===state.equipment.accessory1) : null;
  const acc2 = state.equipment.accessory2 ? state.items.find(i=>i.uid===state.equipment.accessory2) : null;
  document.getElementById('eq-acc1').textContent = acc1 ? acc1.name : 'Kosong';
  document.getElementById('eq-acc2').textContent = acc2 ? acc2.name : 'Kosong';
  document.getElementById('eq-potion').textContent = state.potions;

  const repPct = reputationBonusPct(state.city);
  const discPct = Math.min(30, (state.classDiscountPct||0) + repPct);
  const list = document.getElementById('goods-list');
  list.innerHTML = `<div style="font-size:6.5px; color:var(--dim); margin-bottom:6px;">Reputasi di ${state.city}: ${state.reputation[state.city]||0} (diskon beli ${discPct}%, bonus jual ${repPct}%)</div>`;
  const prices = state.prices[state.city];
  GOODS.forEach(g=>{
    const basePrice = prices[g.id];
    const buyPrice = Math.max(1, Math.round(basePrice*(1-discPct/100)));
    const sellPrice = Math.round(basePrice*(1+repPct/100));
    const owned = state.inventory[g.id];
    const row = document.createElement('div');
    row.className='row';
    row.innerHTML = `
      <div class="row-name">${g.icon} ${g.name}<small>Punya: ${owned} · Jual: ${sellPrice}g</small></div>
      <div class="price">${buyPrice}g</div>
      <button class="mini-btn gold" onclick="buy('${g.id}')" ${state.gold<buyPrice || state.cap>=state.capMax ? 'disabled':''}>Beli</button>
      <button class="mini-btn red" onclick="sell('${g.id}')" ${owned<=0 ? 'disabled':''}>Jual</button>
    `;
    list.appendChild(row);
  });

  const wList = document.getElementById('weapon-list');
  wList.innerHTML = '';
  const baseAtkNoWeapon = getAtk() - currentWeaponAtk();
  WEAPONS.forEach(w=>{
    const isOwned = state.ownedWeapons.includes(w.id);
    const isEquipped = state.equipment.weapon===w.id;
    const previewAtk = baseAtkNoWeapon + w.atk;
    const row = document.createElement('div');
    row.className='row';
    let btns = '';
    if(isEquipped){ btns = `<span style="color:var(--dim); font-size:7px;">Terpasang</span>`; }
    else if(isOwned){ btns = `<button class="mini-btn teal" onclick="equipGear('weapon','${w.id}')">Pakai</button><button class="mini-btn red" onclick="sellGear('weapon','${w.id}')">Jual</button>`; }
    else { btns = `<button class="mini-btn gold" onclick="buyGear('weapon','${w.id}')" ${state.gold<w.price?'disabled':''}>Beli ${w.price}g</button>`; }
    row.innerHTML = `<div class="row-name">${w.name} ${ELEMENT_ICON[w.elem]}<small>ATK +${w.atk} · total jadi ${previewAtk} · Elemen ${w.elem}</small></div>${btns}`;
    wList.appendChild(row);
  });
  const aList = document.getElementById('armor-list');
  aList.innerHTML = '';
  const baseDefNoArmor = getDef() - currentArmorDef();
  ARMORS.forEach(a=>{
    const isOwned = state.ownedArmors.includes(a.id);
    const isEquipped = state.equipment.armor===a.id;
    const previewDef = baseDefNoArmor + a.def;
    const row = document.createElement('div');
    row.className='row';
    let btns = '';
    if(isEquipped){ btns = `<span style="color:var(--dim); font-size:7px;">Terpasang</span>`; }
    else if(isOwned){ btns = `<button class="mini-btn teal" onclick="equipGear('armor','${a.id}')">Pakai</button><button class="mini-btn red" onclick="sellGear('armor','${a.id}')">Jual</button>`; }
    else { btns = `<button class="mini-btn gold" onclick="buyGear('armor','${a.id}')" ${state.gold<a.price?'disabled':''}>Beli ${a.price}g</button>`; }
    row.innerHTML = `<div class="row-name">${a.name}<small>DEF +${a.def} · total jadi ${previewDef}</small></div>${btns}`;
    aList.appendChild(row);
  });
  document.getElementById('potion-list').innerHTML = `
    <div class="row">
      <div class="row-name">Ramuan Penyembuh<small>Pulihkan 40 HP</small></div>
      <div class="price">25g</div>
      <button class="mini-btn gold" onclick="buyPotion()" ${state.gold<25?'disabled':''}>Beli</button>
    </div>`;

  const rList = document.getElementById('recruit-list');
  rList.innerHTML = '';
  state.recruits[state.city].forEach((m,idx)=>{
    const row = document.createElement('div');
    row.className='row';
    const full = state.generals.length>=MAX_GENERALS;
    row.innerHTML = `
      <div class="row-name">${m.name} ${ELEMENT_ICON[m.elem]}<small>HP ${m.maxHp} · ATK ${m.atk} · Elemen ${m.elem}</small></div>
      <div class="price">${m.price}g</div>
      <button class="mini-btn purple" onclick="recruitGeneral(${idx})" ${state.gold<m.price || full ? 'disabled':''}>Rekrut</button>
    `;
    rList.appendChild(row);
  });

  renderFactory();
  renderEliteNPC();

  const gearInv = document.getElementById('gear-inventory');
  const ownedSpareWeapons = state.ownedWeapons.filter(id=>id!==state.equipment.weapon);
  const ownedSpareArmors = state.ownedArmors.filter(id=>id!==state.equipment.armor);
  gearInv.innerHTML = '';
  if(ownedSpareWeapons.length===0 && ownedSpareArmors.length===0){
    gearInv.innerHTML = '<div style="color:var(--dim); font-size:8px;">Semua gear yang dimiliki sedang terpasang.</div>';
  }
  ownedSpareWeapons.forEach(id=>{
    const w = WEAPONS.find(x=>x.id===id);
    const row = document.createElement('div');
    row.className='row';
    row.innerHTML = `<div class="row-name">${w.name}<small>Senjata cadangan · ATK +${w.atk}</small></div><button class="mini-btn teal" onclick="equipGear('weapon','${id}')">Pakai</button><button class="mini-btn red" onclick="sellGear('weapon','${id}')">Jual</button>`;
    gearInv.appendChild(row);
  });
  ownedSpareArmors.forEach(id=>{
    const a = ARMORS.find(x=>x.id===id);
    const row = document.createElement('div');
    row.className='row';
    row.innerHTML = `<div class="row-name">${a.name}<small>Zirah cadangan · DEF +${a.def}</small></div><button class="mini-btn teal" onclick="equipGear('armor','${id}')">Pakai</button><button class="mini-btn red" onclick="sellGear('armor','${id}')">Jual</button>`;
    gearInv.appendChild(row);
  });

  const itemList = document.getElementById('item-list');
  itemList.innerHTML = state.items.length===0 ? '<div style="color:var(--dim); font-size:8px;">Belum ada barang rampasan.</div>' : '';
  state.items.forEach(it=>{
    const slot = state.equipment.accessory1===it.uid ? 1 : (state.equipment.accessory2===it.uid ? 2 : 0);
    const selected = craftSelection.includes(it.uid);
    const row = document.createElement('div');
    row.className='row' + (selected ? ' item-selected' : '');
    row.innerHTML = `
      <div class="row-icon" style="flex:1; min-width:100px;">
        <div class="icon-box rarity-${it.rarity}">${TYPE_ICON[it.type]}</div>
        <div class="row-name" style="min-width:0;">${it.name}
          <span class="tag rarity-${it.rarity}">${it.rarity}</span>
          <span class="tag type-${it.type}">${TYPE_LABEL[it.type]}</span>
          <small>bonus +${it.bonus} · nilai jual ${it.sellValue}g</small>
        </div>
      </div>
      <button class="mini-btn ${slot===1?'':'teal'}" onclick="equipAccessory('${it.uid}',1)" ${slot===1?'disabled':''}>${slot===1?'Slot 1':'Pakai S1'}</button>
      <button class="mini-btn ${slot===2?'':'teal'}" onclick="equipAccessory('${it.uid}',2)" ${slot===2?'disabled':''}>${slot===2?'Slot 2':'Pakai S2'}</button>
      <button class="mini-btn ${selected?'gold':'orange'}" onclick="toggleCraftSelect('${it.uid}')">${selected?'Batal Pilih':'Pilih'}</button>
      <button class="mini-btn red" onclick="sellItem('${it.uid}')">Jual</button>
    `;
    itemList.appendChild(row);
  });
  renderCraftAction();
  renderDiagramAction();

  const mList = document.getElementById('merc-list');
  mList.innerHTML = state.generals.length===0 ? '<div style="color:var(--dim); font-size:8px;">Belum ada jendral direkrut.</div>' : '';
  state.generals.forEach((m,idx)=>{
    const div = document.createElement('div');
    div.className='merc-card';
    const pct = Math.max(0,Math.round(m.hp/m.maxHp*100));
    const cost = promoteCost(m);
    const canPromote = m.rank < RANK_NAMES.length-1;
    div.innerHTML = `
      <div class="merc-head row-icon"><div class="icon-box">${spriteCanvasHTML('general', m.rank, 28)}</div><b style="flex:1;">${m.name}${idx===0?' (Garda Depan)':''}</b><span class="merc-rank">${RANK_NAMES[m.rank]} ${ELEMENT_ICON[m.elem]||''}</span></div>
      <div style="font-size:7px; color:var(--dim);">ATK ${m.atk} · HP ${m.hp}/${m.maxHp}</div>
      <div class="merc-hpbar"><div style="width:${pct}%; background:${hpBarColor(pct)};"></div></div>
      <div class="merc-formation-row">
        <button class="mini-btn" style="flex:1;" onclick="moveGeneral(${idx},-1)" ${idx===0?'disabled':''}>▲ Maju</button>
        <button class="mini-btn" style="flex:1;" onclick="moveGeneral(${idx},1)" ${idx===state.generals.length-1?'disabled':''}>▼ Mundur</button>
      </div>
      ${canPromote ? `<button class="mini-btn gold" style="width:100%; margin-top:6px;" onclick="promoteGeneral(${idx})" ${(state.gold<cost.gold||state.medals<cost.medals||(state.upgradeParts||0)<cost.parts)?'disabled':''}>Promosikan (${cost.gold}g + ${cost.medals} medali${cost.parts>0 ? ' + '+cost.parts+' part':''})</button>` : '<div style="font-size:6.5px;color:var(--gold);margin-top:4px;">Pangkat tertinggi tercapai</div>'}
      <button class="mini-btn orange" style="width:100%; margin-top:4px;" onclick="useRebirthStone(${idx})" ${(state.rebirthStones||0)<=0?'disabled':''}>💎 Pakai Rebirth Stone (punya: ${state.rebirthStones||0})</button>
      ${m.rebirthBonus ? `<div style="font-size:6.5px; color:var(--orange); margin-top:2px;">Rebirth bonus: +${m.rebirthBonus} ATK/HP</div>` : ''}
    `;
    mList.appendChild(div);
  });
  paintAllSprites(mList);

  renderAchievements();

  const destList = document.getElementById('dest-list');
  destList.innerHTML='';
  CITIES.filter(c=>c!==state.city).forEach(c=>{
    const btn = document.createElement('button');
    btn.className='dest-btn';
    btn.innerHTML = `${c} <small>1 hari perjalanan · Lv rekomendasi ${CITY_LEVEL_RANGE[c]}</small>`;
    btn.onclick = ()=> travel(c);
    destList.appendChild(btn);
  });

  renderPeta();
  checkAchievements();

  const logDiv = document.getElementById('log');
  logDiv.innerHTML = state.log.map(l=>`<div>${l}</div>`).join('');

  saveGame();
}

function renderAchievements(){
  const achList = document.getElementById('ach-list');
  achList.innerHTML = '';
  ACHIEVEMENTS.forEach(a=>{
    const unlocked = state.achievements.includes(a.id);
    const div = document.createElement('div');
    div.className = 'ach-row' + (unlocked?'':' locked');
    div.innerHTML = `<div class="icon-box">${unlocked?'🏆':'🔒'}</div><div><div style="color:${unlocked?'var(--gold)':'var(--dim)'}; font-size:8px;">${a.name}</div><div style="color:var(--dim); font-size:6.5px;">${a.desc}</div></div>`;
    achList.appendChild(div);
  });
}
function checkAchievements(){
  if(document.getElementById('event-overlay').style.display==='flex') return;
  ACHIEVEMENTS.forEach(a=>{
    if(!state.achievements.includes(a.id) && a.check(state)){
      state.achievements.push(a.id);
      sfx('quest');
      haptic([40,40,40]);
      showEvent('🏆 Pencapaian Terbuka!', `${a.name} — ${a.desc}`);
    }
  });
}

function toggleCraftSelect(uid){
  const idx = craftSelection.indexOf(uid);
  if(idx>=0){ craftSelection.splice(idx,1); }
  else {
    if(craftSelection.length>=2) craftSelection.shift();
    craftSelection.push(uid);
  }
  render();
}
function renderCraftAction(){
  const box = document.getElementById('craft-action');
  if(craftSelection.length!==2){ box.innerHTML=''; return; }
  const it1 = state.items.find(i=>i.uid===craftSelection[0]);
  const it2 = state.items.find(i=>i.uid===craftSelection[1]);
  if(!it1 || !it2 || it1.rarity!==it2.rarity || it1.rarity==='Legendaris'){
    box.innerHTML = `<div style="font-size:7px; color:var(--red); margin-top:6px;">Kedua item harus rarity sama dan bukan Legendaris untuk di-craft.</div>`;
    return;
  }
  const nextRarity = RARITY_ORDER[RARITY_ORDER.indexOf(it1.rarity)+1];
  box.innerHTML = `<button class="gold" style="margin-top:8px;" onclick="craftItems()">🔨 Gabungkan jadi item ${nextRarity} (biaya 30g)</button>`;
}
function craftItems(){
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

function renderDiagramAction(){
  const box = document.getElementById('diagram-action');
  const hasLegendary = state.items.some(i=>i.rarity==='Legendaris');
  box.innerHTML = '';
  DIAGRAMS.forEach(d=>{
    const canAfford = hasLegendary && state.gold>=d.goldCost && state.medals>=d.medalCost;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="row-name">${d.name} ${TYPE_ICON[d.type]}<small>Bonus +${d.bonus} · butuh 1 item Legendaris + ${d.goldCost}g + ${d.medalCost} medali</small></div>
      <button class="mini-btn gold" onclick="craftDiagram('${d.id}')" ${canAfford?'':'disabled'}>Tempa</button>`;
    box.appendChild(row);
  });
  if(!hasLegendary){
    const note = document.createElement('div');
    note.style.cssText = 'font-size:6.5px;color:var(--red);margin-top:4px;';
    note.textContent = 'Kamu butuh setidaknya 1 item Legendaris di tas untuk menempa pusaka.';
    box.appendChild(note);
  }
}
function craftDiagram(diagramId){
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

function moveGeneral(idx, dir){
  const target = idx+dir;
  if(target<0 || target>=state.generals.length) return;
  const arr = state.generals;
  [arr[idx],arr[target]] = [arr[target],arr[idx]];
  render();
}
function useRebirthStone(idx){
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

function renderPeta(){
  const petaList = document.getElementById('peta-list');
  petaList.innerHTML = '';

  const ttReady = testTownAvailable();
  const ttDiv = document.createElement('div');
  ttDiv.className = 'quest-card';
  ttDiv.style.marginBottom = '10px';
  if(ttReady){
    ttDiv.innerHTML = `<div class="qhead">🏟️ Test Town Tersedia!</div>
      <div style="font-size:6.5px; color:var(--dim);">Tantang 3 gauntlet battle super sulit demi hadiah besar (gold, medali, 2 item Legendaris). Kesempatan ini dipakai begitu kamu masuk, menang atau kalah.</div>
      <button class="red" style="margin-top:6px;" onclick="enterTestTown()">Masuk Test Town</button>`;
  } else {
    const daysLeft = 7 - (state.day - state.lastTestTown);
    ttDiv.innerHTML = `<div class="qhead">🏟️ Test Town</div><div style="font-size:6.5px; color:var(--dim);">Tersedia lagi dalam ${Math.max(1,daysLeft)} hari.</div>`;
  }
  petaList.appendChild(ttDiv);

  if(state.guildQuest){
    const gq = state.guildQuest;
    const ready = guildQuestReady();
    const now = guildQuestProgressNow();
    const pct = Math.min(100, Math.round(now/gq.target*100));
    const guildDiv = document.createElement('div');
    guildDiv.className = 'quest-card';
    guildDiv.style.marginBottom = '10px';
    guildDiv.innerHTML = `<div class="qhead">🛡️ Misi Guild: ${guildQuestLabel()}</div>
      <div class="qbar"><div style="width:${pct}%;"></div></div>
      <div style="font-size:6.5px; color:var(--dim);">Progres ${Math.min(now,gq.target)}/${gq.target} · Reward ${gq.reward}g + ${gq.rewardMedal} medali</div>
      ${ready ? `<button class="green" style="margin-top:6px;" onclick="claimGuildQuest()">Klaim Reward Guild</button>` : ''}`;
    petaList.appendChild(guildDiv);
  }

  CITIES.forEach(c=>{
    const isOwned = state.owned.includes(c);
    const isHere = state.city===c;
    const div = document.createElement('div');
    div.className='city-card';
    let actions = '';
    if(isHere){
      actions += `<button class="teal" onclick="enterDungeon('${c}')">Jelajahi Dungeon (3 lantai, Lv ${CITY_LEVEL_RANGE[c]})</button>`;
      if(!isOwned){
        actions += `<button class="red" onclick="attackGarrison('${c}')">Kuasai Wilayah (lawan garnisun, 2 musuh)</button>`;
      } else {
        const lvl = state.cityUpgrades[c].gudang;
        const cost = 200*(lvl+1);
        if(lvl<3){
          actions += `<button class="gold" onclick="upgradeGudang('${c}')" ${state.gold<cost?'disabled':''}>Upgrade Gudang (Lv${lvl}→${lvl+1}, ${cost}g)</button>`;
        } else {
          actions += `<div style="font-size:6.5px; color:var(--gold);">Gudang level maksimal</div>`;
        }
        const blvl = state.cityUpgrades[c].benteng;
        const bcost = 180*(blvl+1);
        if(blvl<3){
          actions += `<button class="gold" onclick="upgradeBenteng('${c}')" ${state.gold<bcost?'disabled':''}>Upgrade Benteng (Lv${blvl}→${blvl+1}, ${bcost}g) — cegah direbut kembali</button>`;
        } else {
          actions += `<div style="font-size:6.5px; color:var(--teal);">Benteng level maksimal</div>`;
        }
      }
      const q = state.quests[c];
      if(q){
        const label = q.type==='sell' ? `Jual ${q.target} ${q.goodName}` : `Menangkan ${q.target} pertempuran`;
        const ready = q.progress>=q.target;
        actions += `<div class="quest-card"><div class="qhead">📜 Misi: ${label}</div><div class="qbar"><div style="width:${Math.min(100,Math.round(q.progress/q.target*100))}%;"></div></div>
        <div style="font-size:6.5px; color:var(--dim);">Progres ${Math.min(q.progress,q.target)}/${q.target} · Reward ${q.reward}g${q.rewardMedal?' + '+q.rewardMedal+' medali':''}</div>
        ${ready ? `<button class="green" style="margin-top:6px;" onclick="claimQuest('${c}')">Klaim Reward</button>` : ''}
        </div>`;
      }
    } else {
      actions += `<div style="font-size:6.5px;color:var(--dim);">Kunjungi kota ini untuk beraksi</div>`;
    }
    div.innerHTML = `
      <div class="head row-icon"><div class="icon-box">${CITY_ICON[c]||'🏙️'}</div><b style="flex:1;">${c}</b><span>
        ${isOwned?'<span class="tag owned">Milikmu</span>':'<span class="tag neutral">Netral</span>'}
        ${isHere?'<span class="tag here">Di sini</span>':''}
      </span></div>
      <div style="font-size:6.5px; color:var(--dim); margin-bottom:6px;">Rekomendasi Level: ${CITY_LEVEL_RANGE[c]}</div>
      ${actions}
    `;
    petaList.appendChild(div);
  });
}
function upgradeBenteng(city){
  const lvl = state.cityUpgrades[city].benteng;
  const cost = 180*(lvl+1);
  if(state.gold<cost || lvl>=3) return;
  state.gold -= cost;
  state.cityUpgrades[city].benteng++;
  sfx('buy');
  addLog(`Benteng di ${city} ditingkatkan ke level ${state.cityUpgrades[city].benteng}, lebih sulit direbut musuh.`);
  render();
}
function claimGuildQuest(){
  if(!guildQuestReady()) return;
  const q = state.guildQuest;
  gainGold(q.reward);
  state.medals += q.rewardMedal;
  sfx('quest');
  addLog(`Misi Guild selesai! +${q.reward}g + ${q.rewardMedal} medali.`);
  state.guildQuest = genGuildQuest();
  render();
}
function upgradeGudang(city){
  const lvl = state.cityUpgrades[city].gudang;
  const cost = 200*(lvl+1);
  if(state.gold<cost || lvl>=3) return;
  state.gold -= cost;
  state.cityUpgrades[city].gudang++;
  addLog(`Gudang di ${city} ditingkatkan ke level ${state.cityUpgrades[city].gudang}.`);
  render();
}
function claimQuest(city){
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

function promoteCost(g){
  const parts = g.rank>=3 ? (g.rank-2) : 0;
  return { gold: 100 + (g.rank+1)*150, medals: (g.rank+1), parts };
}
function promoteGeneral(idx){
  const g = state.generals[idx];
  const cost = promoteCost(g);
  if(state.gold<cost.gold || state.medals<cost.medals || (state.upgradeParts||0)<cost.parts || g.rank>=RANK_NAMES.length-1) return;
  state.gold -= cost.gold; state.medals -= cost.medals; state.upgradeParts -= cost.parts;
  g.rank++; g.maxHp += 20; g.hp = g.maxHp; g.atk += 8;
  sfx('levelup');
  addLog(`${g.name} dipromosikan menjadi ${RANK_NAMES[g.rank]}!`);
  render();
}

function renderFactory(){
  const statusDiv = document.getElementById('factory-status');
  const recipesDiv = document.getElementById('factory-recipes');
  const processedDiv = document.getElementById('processed-list');
  if(state.factory.active){
    const r = FACTORY_RECIPES.find(x=>x.id===state.factory.active.recipeId);
    const daysLeft = Math.max(0, state.factory.active.readyDay - state.day);
    statusDiv.innerHTML = `<div class="row"><div class="row-name">🏭 Sedang memproduksi: ${r.name}<small>${daysLeft>0 ? `Selesai ${daysLeft} hari lagi` : 'Akan selesai saat kamu berpindah kota'}</small></div></div>`;
    recipesDiv.innerHTML = '<div style="font-size:6.5px; color:var(--dim);">Tunggu produksi selesai sebelum memulai yang baru.</div>';
  } else {
    statusDiv.innerHTML = '<div style="font-size:6.5px; color:var(--dim); margin-bottom:6px;">Pabrik kosong, siap memproduksi.</div>';
    recipesDiv.innerHTML = '';
    FACTORY_RECIPES.forEach(r=>{
      const inputsText = Object.entries(r.inputs).map(([gid,qty])=>{
        const g = GOODS.find(x=>x.id===gid);
        return `${qty}x ${g.name}`;
      }).join(', ');
      const canAfford = Object.entries(r.inputs).every(([gid,qty])=> state.inventory[gid]>=qty) && state.gold>=r.goldCost;
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div class="row-name">${r.name}<small>Butuh: ${inputsText} + ${r.goldCost}g · ${r.days} hari · Jual ${r.sellValue}g</small></div>
        <button class="mini-btn gold" onclick="startProduction('${r.id}')" ${canAfford?'':'disabled'}>Mulai</button>`;
      recipesDiv.appendChild(row);
    });
  }
  processedDiv.innerHTML = '';
  const anyProcessed = FACTORY_RECIPES.some(r=> (state.processedGoods[r.id]||0)>0);
  if(!anyProcessed){ processedDiv.innerHTML = '<div style="color:var(--dim); font-size:8px;">Belum ada barang olahan.</div>'; }
  FACTORY_RECIPES.forEach(r=>{
    const qty = state.processedGoods[r.id]||0;
    if(qty<=0) return;
    const row = document.createElement('div');
    row.className='row';
    row.innerHTML = `<div class="row-name">${r.name}<small>Punya: ${qty} · harga ${r.sellValue}g/unit</small></div><button class="mini-btn red" onclick="sellProcessed('${r.id}')">Jual 1</button>`;
    processedDiv.appendChild(row);
  });
}

function renderEliteNPC(){
  const box = document.getElementById('elite-npc-list');
  if(!box) return;
  box.innerHTML = '';
  ELITE_EXCHANGES.forEach(ex=>{
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="row-name">${ex.name}<small>${ex.desc}</small></div>
      <button class="mini-btn orange" onclick="exchangeTP('${ex.id}')" ${(state.tradePoints||0)<ex.tp?'disabled':''}>${ex.tp} TP</button>`;
    box.appendChild(row);
  });
  const hsRow = document.createElement('div');
  hsRow.className = 'row';
  const canHS = state.char.level>=10 && (state.tradePoints||0)>=40;
  hsRow.innerHTML = `<div class="row-name">🏛️ Historical Scenario<small>Dungeon spesial (butuh Lv10+, 40 TP) · reward Upgrade Part & item Legendaris terjamin</small></div>
    <button class="mini-btn purple" onclick="enterHistoricalScenario()" ${canHS?'':'disabled'}>Masuk (40 TP)</button>`;
  box.appendChild(hsRow);
}

function recruitGeneral(idx){
  const m = state.recruits[state.city][idx];
  if(state.gold<m.price || state.generals.length>=MAX_GENERALS) { sfx('error'); return; }
  state.gold -= m.price;
  state.generals.push({name:m.name, rank:0, maxHp:m.maxHp, hp:m.maxHp, atk:m.atk, elem:m.elem});
  state.recruits[state.city].splice(idx,1);
  sfx('buy');
  addLog(`Merekrut ${m.name} sebagai Prajurit ke dalam pasukan.`);
  render();
}
function equipAccessory(uid, slotNum){
  const key = slotNum===1 ? 'accessory1' : 'accessory2';
  const other = slotNum===1 ? 'accessory2' : 'accessory1';
  if(state.equipment[other]===uid) state.equipment[other] = null;
  state.equipment[key] = uid;
  render();
}
function sellItem(uid){
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


function checkEndConditions(){
  if(state.char.hp<=0){ endGame(false,'Kamu tumbang di jalan. Perjalanan dagangmu berakhir di sini.'); return true;}
  return false;
}


function enterDungeon(city){
  setDungeonState({ city, floor:1, maxFloor:3 });
  sfx('dungeon');
  startDungeonFloor();
}
function attackGarrison(city){ startBattle('garrison', city); }

function testTownAvailable(){ return (state.day - state.lastTestTown) >= 7; }
function enterTestTown(){
  if(!testTownAvailable()) { sfx('error'); return; }
  state.lastTestTown = state.day;
  setDungeonState({ city: state.city, floor:1, maxFloor:3, testTown:true });
  sfx('dungeon');
  startBattle('testtown', state.city);
}























function endGame(timeUp, forcedMsg){
  clearSave(state.currentSlot);
  stopMusic();
  document.getElementById('main-screen').style.display='none';
  document.getElementById('event-overlay').style.display='none';
  document.getElementById('battle-overlay').style.display='none';
  document.getElementById('end-screen').style.display='block';
  const title = document.getElementById('end-title');
  const desc = document.getElementById('end-desc');
  const statsDiv = document.getElementById('end-stats');
  const s = state.stats;
  statsDiv.innerHTML = `
    Battle menang/kalah: ${s.battlesWon}/${s.battlesLost}<br>
    Total gold pernah didapat: ${s.totalGoldEarned}<br>
    Item ditemukan: ${s.itemsFound} · Item di-craft: ${s.itemsCrafted||0}<br>
    Misi selesai: ${s.questsCompleted||0}<br>
    Wilayah dikuasai: ${state.owned.length} · New Game+ Level: ${state.ngPlus||0}<br>
    Pencapaian terbuka: ${state.achievements.length}/${ACHIEVEMENTS.length}
  `;
  drawGoldChart();
  if(forcedMsg){
    title.textContent = 'GAME OVER';
    desc.textContent = forcedMsg + ` Total gold akhir: ${state.gold}, Level ${state.char.level}.`;
    document.getElementById('ngplus-btn').style.display='none';
  } else {
    let rank = 'Pedagang Kaki Lima';
    if(state.gold>=3000) rank='Xian — Pedagang Agung Legendaris';
    else if(state.gold>=1500) rank='Saudagar Kaya Raya';
    else if(state.gold>=800) rank='Pedagang Sukses';
    title.textContent = `PERJALANAN BERAKHIR (Hari ${state.day})`;
    desc.textContent = `Total gold akhir: ${state.gold}. Level ${state.char.level}. Gelar kamu: ${rank}.`;
    document.getElementById('ngplus-btn').style.display='block';
  }
}
function startNewGamePlus(){
  const goldCarry = Math.round(state.gold*0.2);
  const ngPlus = (state.ngPlus||0)+1;
  const nation = state.nation;
  const className = state.className;
  const slot = state.currentSlot;
  document.getElementById('end-screen').style.display='none';
  document.getElementById('setup-nation').style.display='none';
  document.getElementById('setup-class').style.display='none';
  document.getElementById('main-screen').style.display='block';
  pendingSlot = slot;
  startGame(nation, className, { ngPlus, goldCarry });
}

renderSlotRow();
initContinueSlot();

// ---------- PENYINGKAPAN HANDLER ----------
// index.html memakai atribut onclick, yang mencari fungsi di window.
Object.assign(window, {
  attackGarrison,
  backToNation,
  battleAttack,
  battleDefend,
  battleFlee,
  battleSkillHeavy,
  battleSkillTransform,
  battleSkillWarcry,
  battleUsePotion,
  buy,
  buyGear,
  buyPotion,
  chooseClass,
  chooseNation,
  claimGuildQuest,
  claimQuest,
  closeBattle,
  closeEvent,
  confirmFinishJourney,
  confirmReset,
  continueGame,
  craftDiagram,
  craftItems,
  enterDungeon,
  enterHistoricalScenario,
  enterTestTown,
  equipAccessory,
  equipGear,
  exchangeTP,
  manualSave,
  moveGeneral,
  promoteGeneral,
  recruitGeneral,
  sell,
  sellGear,
  sellItem,
  sellProcessed,
  startNewGamePlus,
  startProduction,
  switchTab,
  toggleCraftSelect,
  toggleMusic,
  toggleMute,
  upgradeBenteng,
  upgradeGudang,
  useRebirthStone,
});

