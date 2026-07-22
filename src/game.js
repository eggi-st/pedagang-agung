// ============================================================
// BOOTSTRAP + ALUR LAYAR.
//
// Setelah Fase 2 tuntas, seluruh logic dan render sudah pindah ke
// src/systems/* dan src/ui/*. Yang tersisa di sini hanya perekat:
//   - alur setup (pilih negara/kelas, mulai game, New Game+)
//   - alur slot simpan (renderSlotRow, initContinueSlot, continueGame)
//   - pendaftaran hook ke core/bus.js
//   - penyingkapan handler onclick ke window (index.html memakai atribut
//     onclick, sedangkan modul ES punya scope sendiri)
// ============================================================

import { GOODS, FACTORY_RECIPES } from './data/economy.js';
import { CITIES } from './data/world.js';
import { CLASSES } from './data/classes.js';
import { toggleMute as toggleMuteBase } from './audio/sfx.js';
import { playMusic, toggleMusic as toggleMusicBase } from './audio/music.js';

// Modul hasil pemecahan Fase 2 lanjutan.
import { state, dungeonState, setState, setDungeonState } from './state.js';
import { saveGame, loadSavedGame, clearSave, migrateState } from './systems/save.js';
import { addLog } from './systems/character.js';
import { genPrices, genRecruits, genQuest, genGuildQuest } from './systems/generators.js';
import { registerHooks } from './core/bus.js';
import { showEvent, closeEvent } from './ui/overlay.js';
import { buy, sell, buyGear, equipGear, sellGear, buyPotion, startProduction, sellProcessed, exchangeTP, enterHistoricalScenario } from './systems/economy.js';
import { startBattle, closeBattle, battleAttack, battleSkillHeavy, battleSkillWarcry, battleSkillTransform, battleUsePotion, battleDefend, battleFlee } from './systems/battle.js';
import { renderBattle } from './ui/battle-ui.js';
import { toggleCraftSelect, craftItems, craftDiagram, equipAccessory, sellItem } from './systems/inventory.js';
import { recruitGeneral, moveGeneral, useRebirthStone, promoteGeneral } from './systems/generals.js';
import { upgradeGudang, upgradeBenteng, enterDungeon, attackGarrison, enterTestTown } from './systems/territory.js';
import { claimQuest, claimGuildQuest } from './systems/quests.js';
import { render, switchTab } from './ui/render.js';
import { checkEndConditions, endGame } from './systems/progression.js';

// Tombol di index.html memanggil toggleMute()/toggleMusic() tanpa argumen,
// sedangkan versi terekstrak menerima elemen label. Pembungkus tipis ini
// menjaga kompatibilitas markup lama.
function toggleMute(){ return toggleMuteBase(document.getElementById('mute-btn')); }
function toggleMusic(){ return toggleMusicBase(document.getElementById('music-btn')); }

// Mendaftarkan implementasi yang dipakai sistem lewat core/bus.js.
registerHooks({ render, renderBattle, startBattle, checkEndConditions, endGame });

// ---------- STATE LOKAL ALUR LAYAR ----------
// state/battle/dungeonState sudah pindah ke src/state.js. Yang tersisa di
// sini hanya milik alur layar yang belum dipecah.
let eventCallback = null;
let pendingSlot = 1;
let pendingNation = null;

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
    prices: {}, basePrices: {}, recruits: {},
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
    // Baseline = harga awal kota ini; harga akan pulih ke sini seiring hari.
    state.basePrices[c] = { ...state.prices[c] };
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

