// Lapisan render: memperbarui HUD dan mengisi keempat tab (dagang, toko,
// karakter, peta) dari state. render() adalah titik masuk utama yang
// dipanggil sistem lewat core/bus.js; sisanya sub-render per bagian.
//
// Handler onclick di dalam template string (buy, sell, dsb.) merujuk
// fungsi global yang disingkap game.js, jadi tidak diimpor di sini.

import { state } from '../state.js';
import { getAtk, getDef, currentWeaponAtk, currentArmorDef, reputationBonusPct } from '../systems/character.js';
import { craftSelection } from '../systems/inventory.js';
import { promoteCost } from '../systems/generals.js';
import { testTownAvailable } from '../systems/territory.js';
import { guildQuestReady, guildQuestProgressNow, guildQuestLabel } from '../systems/generators.js';
import { travel } from '../systems/economy.js';
import { checkAchievements } from '../systems/progression.js';
import { saveGame } from '../systems/save.js';
import { hpBarColor } from './battle-ui.js';
import { drawPixelSprite, spriteCanvasHTML, paintAllSprites } from './sprites.js';
import { SPRITE_HUMANOID, SKIN_TONE } from '../data/sprites.js';
import { NATION_BODY_COLOR, CLASS_TRANSFORMS } from '../data/classes.js';
import { GOODS, WEAPONS, ARMORS, FACTORY_RECIPES, ELITE_EXCHANGES } from '../data/economy.js';
import { ELEMENT_ICON } from '../data/elements.js';
import { MAX_GENERALS, RANK_NAMES } from '../data/mercenaries/index.js';
import { TYPE_ICON, TYPE_LABEL, RARITY_ORDER, DIAGRAMS } from '../data/items.js';
import { CITIES, CITY_LEVEL_RANGE, CITY_ICON } from '../data/world.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

export function switchTab(tab){
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

export function render(){
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

export function renderAchievements(){
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

export function renderCraftAction(){
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

export function renderDiagramAction(){
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

export function renderPeta(){
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

export function renderFactory(){
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

export function renderEliteNPC(){
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
