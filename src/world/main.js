// ============================================================
// src/world/main.js — boot demo dunia Fase 0 (world.html).
// Merangkai: tilemap + pemain + kamera + input + loop + interaksi.
// Slice 2: field Joseon <-> interior Gua Latihan, monster wander,
// overlay kota (tautan ke menu kota index.html).
// ============================================================

import { TILE_SIZE, TILE, paintTiles, tileAt, walkableAt } from './tiles.js';
import { ELEMENTS } from './data/elements.js';
import { buildJoseonMap, MAP_W, MAP_H } from './map-joseon.js';
import { buildDungeon, DUN_W, DUN_H } from './map-dungeon.js';
import { createInput, attachKeyboard, attachTouch, endTick } from './input.js';
import { createCamera, snapCamera, followCamera } from './camera.js';
import { createPlayer, updatePlayer } from './player.js';
import { createMonster, updateMonster, monsterSpriteState } from './monster.js';
import { createNpc, openDialogue, advanceDialogue, closeDialogue } from './npc.js';
import { createInventory, addItem, removeItem, countItem, listItems, totalCount } from './inventory.js';
import { getItemDef, rarityColor, RARITY } from './data/items.js';
import { MENU_TABS, getTab, renderMenuTab } from './menu.js';
import { COMPANIONS, getCompanionDef } from './data/companions.js';
import { newProgress, recalcStats, gainXp, allocateStat, POINTS_PER_LEVEL, MANA_REGEN, MAX_LEVEL } from './level.js';
import { playerAttack, skillStrike, damagePlayer, updateFloaters, spendMana } from './combat.js';
import { dashPlayer, SKILL1_CD, SKILL1_COST, SKILL2_CD, DASH_COST } from './player.js';
import { createParty, hireMember, dismissMember, gainPartyXp, memberMaxHp, MAX_MEMBERS } from './party.js';
import { getShopStock } from './data/shop.js';
import { writeSave, readSave, clearSave, migrateLegacy } from './save.js';
import { loadImage } from './sprites.js';
import { startLoop } from './loop.js';
import manifest from '../../public/assets/sprites/manifest.json';

const SCALE = 2; // 1 game-pixel = 2 screen-pixel (estetika pixelated)

async function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const fieldWorld = buildJoseonMap();
  const dungeonWorld = buildDungeon();
  let active = 'field';
  const maps = {
    field: { map: fieldWorld.map, w: MAP_W * TILE_SIZE, h: MAP_H * TILE_SIZE },
    dungeon: { map: dungeonWorld.map, w: DUN_W * TILE_SIZE, h: DUN_H * TILE_SIZE },
  };

  const tiles = paintTiles();
  const playerImg = await loadImage('./assets/sprites/pedagang-a.png');
  // Sprite monster per definisi + per state (cache).
  // Sumber kebenaran = manifest.json: key "goblin-hutan" (dasar/Idle)
  // atau "goblin-hutan-Walk" (state). Hilang -> fallback dasar.
  const { MONSTERS } = await import('./data/monsters.js');
  const monsterImgs = {};
  {
    const spriteIds = [...new Set(dungeonWorld.monsterSpawns.map((s) => (MONSTERS[s.def] || {}).sprite || 'goblin-hutan'))];
    const jobs = [];
    for (const id of spriteIds) {
      const entry = manifest[id] || {};
      const files = new Set([entry.file || `${id}.png`]);
      if (entry.states) for (const f of Object.values(entry.states)) files.add(f);
      for (const f of files) {
        const key = f.replace(/\.png$/, ''); // "goblin-hutan" / "goblin-hutan-Walk"
        jobs.push(loadImage(`./assets/sprites/${f}`).then((img) => { monsterImgs[key] = img; }));
      }
    }
    await Promise.all(jobs);
  }
  function monsterImage(m) {
    const st = monsterSpriteState(m); // null bila mati
    if (st && st !== 'Idle') {
      const key = `${m.sprite}-${st}`;
      if (monsterImgs[key]) return monsterImgs[key];
    }
    return monsterImgs[m.sprite];
  }

  const input = createInput();
  attachKeyboard(input);
  attachTouch(input, canvas);

  const cam = createCamera(400, 300);
  const player = createPlayer(fieldWorld.spawn.x, fieldWorld.spawn.y);
  Object.assign(player, newProgress()); // level, xp, statPoints, stats
  player.equip = { weapon: null, armor: null }; // slot equipment
  player.satiety = 100; player.maxSatiety = 100; // rasa lapar (habis = lemah)
  recalcStats(player);
  player.hp = player.maxHp;
  let satietyTimer = 0;
  let saveTimer = 0; // auto-save tiap 15 detik
  const inv = createInventory();
  const party = createParty();
  // Posisi follower pendamping (paralel party.members).
  let followers = [];
  function syncFollowers() {
    followers = party.members.map((m, i) => {
      const f = followers[i];
      return f && f.id === m.id ? f : { id: m.id, x: player.x - 40 - i * 36, y: player.y + 30 };
    });
  }
  // Sprite pendamping (cache).
  const companionImgs = {};
  await Promise.all(Object.values(COMPANIONS).map(async (c) => {
    const entry = manifest[c.sprite] || {};
    companionImgs[c.id] = await loadImage(`./assets/sprites/${entry.file || c.sprite + '.png'}`);
  }));
  const monsters = dungeonWorld.monsterSpawns.map((s) => createMonster(s.x, s.y, s.def));
  // NPC di field: dekat gerbang Hanseong (jalur selatan).
  const npcs = [
    createNpc(10.5 * 32, 17.5 * 32, 'penjaga-toko'),
    createNpc(14.5 * 32, 17.5 * 32, 'nenek-penginapan'),
  ];
  const floaters = []; // angka damage melayang {x,y,text,color,ttl}
  const projectiles = []; // proyektil monster {x,y,vx,vy,dmg,element,ttl}
  let gold = 0; // emas demo dunia (terpisah dari save game utama)
  let chestLooted = false;
  let activeNpc = null; // NPC yang sedang diajak bicara
  // Sprite NPC (dari manifest; fallback file dasar).
  const npcImgs = {};
  await Promise.all([...new Set(npcs.map((n) => n.sprite))].map(async (id) => {
    const entry = manifest[id] || {};
    npcImgs[id] = await loadImage(`./assets/sprites/${entry.file || id + '.png'}`);
  }));

  // Muat save permanen (bila ada); fallback migrasi sessionStorage demo lama.
  function saveState() {
    writeSave({ player, inv, gold, active, chestLooted, party });
  }
  {
    const d = readSave();
    if (d) {
      active = d.map;
      player.x = d.x; player.y = d.y;
      gold = d.gold;
      chestLooted = d.chestLooted;
      Object.assign(player, {
        level: d.player.level, xp: d.player.xp, statPoints: d.player.statPoints,
        stats: { ...d.player.stats },
      });
      player.equip = { ...d.player.equip };
      player.satiety = d.player.satiety;
      // Validasi equipment & inventory terhadap definisi saat ini.
      for (const slot of ['weapon', 'armor']) {
        if (player.equip[slot] && !getItemDef(player.equip[slot])) player.equip[slot] = null;
      }
      for (const [id, qty] of Object.entries(d.inv || {})) {
        if (getItemDef(id) && qty > 0) { try { addItem(inv, id, qty); } catch { /* abaikan */ } }
      }
      for (const m of d.party || []) {
        if (getCompanionDef(m.id)) {
          party.members.push({ id: m.id, level: Math.min(m.level, MAX_LEVEL), xp: Math.max(0, m.xp), hp: 1 });
        }
      }
      recalcStats(player);
      player.hp = Math.min(d.player.hp, player.maxHp);
      player.mana = Math.min(d.player.mana, player.maxMana);
      for (const m of party.members) {
        const def = getCompanionDef(m.id);
        m.hp = Math.min(memberMaxHp(def, m.level), memberMaxHp(def, m.level));
      }
      syncFollowers();
    } else {
      const legacy = migrateLegacy();
      if (legacy) {
        active = legacy.map;
        player.x = legacy.x; player.y = legacy.y;
        gold = legacy.gold;
      }
    }
  }

  // Hadiah tiap monster mati: emas + pulih 15 HP + roll drop item + XP (skala level).
  function onKill(m) {
    const g = m.goldMin + Math.floor(Math.random() * (m.goldMax - m.goldMin + 1));
    gold += g;
    player.hp = Math.min(player.maxHp, player.hp + 15);
    floaters.push({ x: m.x, y: m.y - 88, text: '+' + g + ' 🪙', color: '#ffd54a', ttl: 1.2 });
    rollDrops(m);
    const ups = gainXp(player, m.level * 10); // XP terukur: 10 × level monster
    const pups = gainPartyXp(party, m.level * 10); // pendamping: 50%
    if (ups > 0) {
      player.hp = player.maxHp;
      refreshHpBar();
      showToast(`🎉 LEVEL UP! Lv ${player.level} (+${ups * POINTS_PER_LEVEL} poin stat — buka Status)`);
      floaters.push({ x: player.x, y: player.y - 100, text: 'LEVEL UP!', color: '#ffd54a', ttl: 1.6 });
      saveState();
    }
    for (const pu of pups) {
      const pdef = getCompanionDef(pu.id);
      const mem = party.members.find((x) => x.id === pu.id);
      showToast(`🎉 ${pdef.name} naik ke Lv ${mem.level}!`);
    }
    refreshGold();
    refreshHpBar();
    refreshMenuBadge();
  }

  // Roll drop item per definisi monster (rate % independen per item).
  function rollDrops(m) {
    for (const d of m.drops) {
      if (Math.random() * 100 >= d.rate) continue;
      addItem(inv, d.item, 1);
      const def = getItemDef(d.item);
      const color = rarityColor(def.rarity);
      floaters.push({ x: m.x, y: m.y - 112, text: `${def.icon} ${def.name}`, color, ttl: 1.6 });
      if (def.rarity !== 'common' && def.rarity !== 'uncommon') {
        showToast(`${def.icon} ${def.name} (${RARITY[def.rarity].name}) jatuh dari ${m.name}!`);
      }
    }
    refreshMenuBadge();
  }

  function lootChest() {
    if (chestLooted) { showToast('Peti sudah kosong.'); return; }
    chestLooted = true;
    const g = 20 + Math.floor(Math.random() * 31);
    gold += g;
    dungeonWorld.map[dungeonWorld.chest.ty][dungeonWorld.chest.tx] = TILE.CHEST_OPEN;
    floaters.push({ x: player.x, y: player.y - 90, text: '+' + g + ' 🪙', color: '#ffd54a', ttl: 1.5 });
    refreshGold();
    showToast(`🎁 Peti dibuka! +${g} emas.`);
    saveState();
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cam.w = Math.ceil(window.innerWidth / SCALE);
    cam.h = Math.ceil(window.innerHeight / SCALE);
  }
  window.addEventListener('resize', resize);
  resize();
  snapCamera(cam, player.x, player.y);

  const promptEl = document.getElementById('prompt');
  const promptText = document.getElementById('prompt-text');
  const overlayEl = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const overlayActions = document.getElementById('overlay-actions');
  const toastEl = document.getElementById('toast');
  const dialogueEl = document.getElementById('dialogue');
  const dialogueName = document.getElementById('dialogue-name');
  const dialogueText = document.getElementById('dialogue-text');
  let toastTimer = 0;

  function showDialogue(npc, line) {
    dialogueName.textContent = npc.name;
    dialogueText.textContent = line;
    dialogueEl.style.display = 'block';
  }
  function hideDialogue() {
    dialogueEl.style.display = 'none';
    activeNpc = null;
  }
  dialogueEl.addEventListener('click', () => { input.interactPressed = true; input.interact = true; });

  // ---- Menu (Status/Tas/Equip/Party/Pengaturan) & Toko ----
  const menuEl = document.getElementById('menu');
  const menuTabsEl = document.getElementById('menu-tabs');
  const menuContentEl = document.getElementById('menu-content');
  const navBadgeTas = document.getElementById('navbadge-tas');
  const shopEl = document.getElementById('shop');
  const shopListEl = document.getElementById('shop-list');
  const shopTitleEl = document.getElementById('shop-title');
  let shopNpc = null;
  let menuTab = 'status';

  function itemIconHtml(def) {
    if (def.sprite) {
      const entry = manifest[def.sprite] || {};
      const f = entry.file || def.sprite + '.png';
      return `<img src="./assets/sprites/${f}" alt="">`;
    }
    return def.icon || '📦';
  }

  function refreshMenuBadge() {
    const n = totalCount(inv);
    navBadgeTas.style.display = n > 0 ? 'block' : 'none';
    navBadgeTas.textContent = n > 99 ? '99+' : String(n);
  }

  function hireCompanion(id) {
    const def = getCompanionDef(id);
    if (!def) return;
    if (gold < def.hireCost) { showToast('🪙 Emas tidak cukup!'); return; }
    const r = hireMember(party, id);
    if (!r.ok) { showToast('⚠️ ' + r.reason); return; }
    gold -= r.cost;
    syncFollowers();
    refreshGold();
    showToast(`🤝 ${def.name} bergabung dengan party!`);
    saveState();
    if (isMenuOpen()) renderMenu();
  }

  function dismissCompanion(id) {
    const def = getCompanionDef(id);
    if (dismissMember(party, id)) {
      syncFollowers();
      showToast(`👋 ${def ? def.name : id} keluar dari party.`);
      saveState();
      if (isMenuOpen()) renderMenu();
    }
  }

  function menuCtx() {
    return {
      player, inv, gold, party, manifest,
      items: { getItemDef, rarityColor, RARITY, listItems, countItem },
      companions: COMPANIONS,
    };
  }

  function renderMenu() {
    menuTabsEl.innerHTML = '';
    for (const t of MENU_TABS) {
      const b = document.createElement('button');
      b.className = 'menu-tab' + (t.id === menuTab ? ' active' : '');
      b.dataset.tab = t.id;
      const key = t.hotkey ? t.hotkey.replace('Key', '') : '';
      b.innerHTML = `${t.icon} ${t.label}${key ? `<span class="tabkey">${key}</span>` : ''}`;
      menuTabsEl.appendChild(b);
    }
    menuContentEl.innerHTML = renderMenuTab(menuTab, menuCtx());
    document.querySelectorAll('#mobile-nav button').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === menuTab));
  }

  function openMenu(tab) {
    menuTab = getTab(tab).id;
    renderMenu();
    menuEl.style.display = 'flex';
  }
  function closeMenu() { menuEl.style.display = 'none'; }
  function isMenuOpen() { return menuEl.style.display === 'flex'; }

  function useItem(id) {
    const def = getItemDef(id);
    if (!def || countItem(inv, id) <= 0) return;
    if (def.kind === 'consumable') {
      const needHp = (def.effect.heal || 0) > 0 && player.hp < player.maxHp;
      const needFood = (def.effect.satiety || 0) > 0 && player.satiety < player.maxSatiety;
      if (!needHp && !needFood) { showToast('Tidak ada efeknya sekarang.'); return; }
      removeItem(inv, id, 1);
      if (def.effect.heal) player.hp = Math.min(player.maxHp, player.hp + def.effect.heal);
      if (def.effect.satiety) {
        player.satiety = Math.min(player.maxSatiety, player.satiety + def.effect.satiety);
        refreshSatiety();
      }
      showToast(`${def.icon} ${def.name} dipakai!`);
      refreshHpBar();
    } else if (def.kind === 'equipment') {
      equipItem(id);
      return; // equipItem sudah render ulang
    }
    refreshMenuBadge();
    if (isMenuOpen()) renderMenu();
  }

  function equipItem(id) {
    const def = getItemDef(id);
    if (!def || def.kind !== 'equipment' || !removeItem(inv, id, 1)) return;
    const slot = def.slot || 'armor';
    const old = player.equip[slot];
    if (old) addItem(inv, old, 1); // yang lama kembali ke tas
    player.equip[slot] = id;
    recalcStats(player);
    showToast(`${def.icon} ${def.name} dipasang!`);
    refreshHpBar();
    refreshMenuBadge();
    if (isMenuOpen()) renderMenu();
  }

  function unequipItem(slot) {
    const old = player.equip[slot];
    if (!old) return;
    player.equip[slot] = null;
    addItem(inv, old, 1);
    recalcStats(player);
    player.hp = Math.min(player.hp, player.maxHp);
    showToast(`${getItemDef(old).icon} ${getItemDef(old).name} dilepas.`);
    refreshHpBar();
    refreshMenuBadge();
    if (isMenuOpen()) renderMenu();
  }

  function renderShop() {
    shopListEl.innerHTML = '';
    // Section BELI: stok merchant.
    const stock = getShopStock(shopNpc ? shopNpc.id : null);
    const buyTitle = document.createElement('div');
    buyTitle.className = 'panel-desc';
    buyTitle.style.cssText = 'padding:8px 4px 2px;font-weight:700';
    buyTitle.textContent = '🛒 Beli dari toko';
    shopListEl.appendChild(buyTitle);
    if (stock.length === 0) {
      const d = document.createElement('div');
      d.className = 'panel-desc'; d.style.padding = '4px';
      d.textContent = 'Stok kosong.';
      shopListEl.appendChild(d);
    }
    for (const id of stock) {
      const def = getItemDef(id);
      if (!def) continue;
      const row = document.createElement('div');
      row.className = 'panel-row';
      const afford = gold >= def.price;
      row.innerHTML = `
        <div class="panel-icon">${itemIconHtml(def)}</div>
        <div class="panel-info">
          <div class="panel-name" style="color:${rarityColor(def.rarity)}">${def.name}</div>
          <div class="panel-desc">${RARITY[def.rarity].name} · ${def.price} 🪙</div>
        </div>
        <button class="panel-btn" data-act="buy" data-id="${id}" ${afford ? '' : 'disabled'}>Beli</button>`;
      shopListEl.appendChild(row);
    }
    // Section JUAL: barang pemain.
    const sellTitle = document.createElement('div');
    sellTitle.className = 'panel-desc';
    sellTitle.style.cssText = 'padding:8px 4px 2px;font-weight:700';
    sellTitle.textContent = '💰 Jual ke toko';
    shopListEl.appendChild(sellTitle);
    const ids = listItems(inv).filter((id) => getItemDef(id).kind !== 'quest');
    if (ids.length === 0) {
      shopListEl.innerHTML = '<div class="panel-desc" style="padding:12px 4px">Tidak ada barang yang bisa dijual.</div>';
      return;
    }
    for (const id of ids) {
      const def = getItemDef(id);
      const row = document.createElement('div');
      row.className = 'panel-row';
      row.innerHTML = `
        <div class="panel-icon">${itemIconHtml(def)}</div>
        <div class="panel-info">
          <div class="panel-name" style="color:${rarityColor(def.rarity)}">${def.name}</div>
          <div class="panel-desc">${RARITY[def.rarity].name} · jual ${def.price} 🪙</div>
        </div>
        <div class="panel-qty">×${countItem(inv, id)}</div>
        <button class="panel-btn" data-act="sell" data-id="${id}">Jual</button>`;
      shopListEl.appendChild(row);
    }
  }

  function openShop(npc) {
    shopNpc = npc;
    shopTitleEl.textContent = `🛒 Toko ${npc.name}`;
    renderShop();
    shopEl.style.display = 'flex';
  }
  function closeShop() { shopEl.style.display = 'none'; shopNpc = null; }

  function sellItem(id) {
    const def = getItemDef(id);
    if (!def || def.kind === 'quest' || !removeItem(inv, id, 1)) return;
    gold += def.price;
    floaters.push({ x: player.x, y: player.y - 90, text: `+${def.price} 🪙`, color: '#ffd54a', ttl: 1.2 });
    refreshGold();
    refreshMenuBadge();
    renderShop();
    saveState();
  }

  function buyItem(id) {
    const def = getItemDef(id);
    if (!def) return;
    if (gold < def.price) { showToast('🪙 Emas tidak cukup!'); return; }
    gold -= def.price;
    addItem(inv, id, 1);
    floaters.push({ x: player.x, y: player.y - 90, text: `-${def.price} 🪙`, color: '#ffab91', ttl: 1.2 });
    refreshGold();
    refreshMenuBadge();
    renderShop();
    saveState();
  }

  menuContentEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const { act, id } = btn.dataset;
    if (act === 'use') useItem(id);
    else if (act === 'equip') equipItem(id);
    else if (act === 'unequip') unequipItem(id);
    else if (act === 'stat') { if (allocateStat(player, id)) renderMenu(); }
    else if (act === 'hire') hireCompanion(id);
    else if (act === 'dismiss') dismissCompanion(id);
    else if (act === 'reset-save') {
      clearSave();
      try { sessionStorage.clear(); } catch { /* abaikan */ }
      location.reload();
    }
  });
  menuTabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) { menuTab = b.dataset.tab; renderMenu(); }
  });
  document.getElementById('menu-close').addEventListener('click', closeMenu);
  document.getElementById('menu-btn').addEventListener('click', () => {
    isMenuOpen() ? closeMenu() : openMenu('status');
  });
  document.querySelectorAll('#mobile-nav button').forEach((b) =>
    b.addEventListener('click', () => {
      if (isMenuOpen() && menuTab === b.dataset.tab) closeMenu();
      else openMenu(b.dataset.tab);
    }));
  shopListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'sell') sellItem(btn.dataset.id);
    else if (btn.dataset.act === 'buy') buyItem(btn.dataset.id);
  });
  document.getElementById('shop-close').addEventListener('click', closeShop);

  function showToast(msg, secs = 3) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    toastTimer = secs;
  }
  function showOverlay(html, buttons) {
    overlayText.innerHTML = html;
    overlayActions.innerHTML = '';
    for (const b of buttons) {
      const el = document.createElement('button');
      el.className = 'overlay-btn';
      el.setAttribute('data-ui', '');
      el.textContent = b.label;
      el.addEventListener('click', b.onClick);
      overlayActions.appendChild(el);
    }
    overlayEl.style.display = 'flex';
  }
  const hideOverlay = () => { overlayEl.style.display = 'none'; };

  promptEl.addEventListener('click', () => { input.interactPressed = true; input.interact = true; });

  // Tombol serang (sentuh/mouse).
  const atkBtn = document.getElementById('atk-btn');
  const atkPress = (e) => { e.preventDefault(); input.attackPressed = true; input.attack = true; };
  atkBtn.addEventListener('pointerdown', atkPress);
  atkBtn.addEventListener('click', (e) => { e.preventDefault(); input.attackPressed = true; });

  // Bar HP pemain.
  const hpFill = document.getElementById('hp-fill');
  function refreshHpBar() {
    const pct = Math.max(0, (player.hp / player.maxHp) * 100);
    hpFill.style.width = pct + '%';
    hpFill.style.background = pct > 50 ? '#4caf50' : pct > 25 ? '#ff9800' : '#f44336';
  }
  const manaFill = document.getElementById('mana-fill');
  function refreshManaBar() {
    const pct = Math.max(0, (player.mana / player.maxMana) * 100);
    manaFill.style.width = pct + '%';
  }
  refreshHpBar();

  // Emas + cooldown skill.
  const goldText = document.getElementById('gold-text');
  function refreshGold() { goldText.textContent = gold; }
  refreshGold();

  const satietyFill = document.getElementById('satiety-fill');
  function refreshSatiety() {
    const pct = Math.max(0, (player.satiety / player.maxSatiety) * 100);
    satietyFill.style.width = pct + '%';
    satietyFill.style.background = pct > 50 ? '#ffb74d' : pct > 25 ? '#ff9800' : '#f44336';
  }
  refreshSatiety();
  const skillBtns = [
    { el: document.getElementById('skill1-btn'), cdEl: document.getElementById('skill1-cd'), max: SKILL1_CD,
      key: 'skill1', press: (e) => { e.preventDefault(); input.skill1Pressed = true; input.skill1 = true; } },
    { el: document.getElementById('skill2-btn'), cdEl: document.getElementById('skill2-cd'), max: SKILL2_CD,
      key: 'skill2', press: (e) => { e.preventDefault(); input.skill2Pressed = true; input.skill2 = true; } },
  ];
  for (const b of skillBtns) {
    b.el.addEventListener('pointerdown', b.press);
    b.el.addEventListener('click', (e) => { e.preventDefault(); input[b.key + 'Pressed'] = true; });
  }
  function refreshSkills() {
    const cds = [player.skill1Cd, player.skill2Cd];
    skillBtns.forEach((b, i) => {
      const cd = cds[i];
      if (cd > 0) {
        b.cdEl.style.display = 'flex';
        b.cdEl.textContent = Math.ceil(cd);
        b.el.style.opacity = '0.55';
      } else {
        b.cdEl.style.display = 'none';
        b.el.style.opacity = '1';
      }
    });
  }

  // Pingsan -> bangun di penginapan Hanseong.
  function onFaint() {
    showOverlay(
      `😵 <b>Kamu pingsan!</b><br><br>` +
      `Bangun di Penginapan Hanseong.<br>` +
      `<span style="font-size:13px;opacity:0.7">Denda gold menyusul saat ekonomi tersambung.</span>`,
      [{ label: '🏠 Bangun di Penginapan', onClick: respawnAtInn }],
    );
  }
  function respawnAtInn() {
    player.hp = player.maxHp;
    player.fainted = false;
    active = 'field';
    player.x = fieldWorld.spawn.x; player.y = fieldWorld.spawn.y;
    for (const m of monsters) { // monster kembali tenang
      m.aggro = false;
      if (m.state !== 'dead') { m.state = 'idle'; m.timer = 1; }
    }
    hideOverlay();
    snapCamera(cam, player.x, player.y);
    refreshHpBar();
    showToast('🌤️ Kamu bangun di Penginapan Hanseong. HP pulih.');
  }

  function openCityMenu() {
    showOverlay(
      `🏯 <b>Hanseong</b> — Joseon<br>` +
      `Toko · Penginapan · Balai Latihan · Aula Promosi · Pabrik<br><br>` +
      `Menu kota lengkap memakai sistem dagang yang sudah ada:`,
      [
        { label: '🛒 Buka Menu Kota', onClick: () => { saveState(); location.href = 'index.html'; } },
        { label: 'Kembali', onClick: hideOverlay },
      ],
    );
  }

  function tileCenterPx(tx, ty) {
    return { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
  }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  function switchMap(to) {
    active = to;
    if (to === 'dungeon') {
      player.x = dungeonWorld.entrance.x; player.y = dungeonWorld.entrance.y;
      // Peti bisa dijarah lagi tiap masuk dungeon (gua latihan).
      chestLooted = false;
      dungeonWorld.map[dungeonWorld.chest.ty][dungeonWorld.chest.tx] = TILE.CHEST;
      showToast('⛏ Gua Latihan — lantai 1');
    } else {
      player.x = fieldWorld.caveReturn.x; player.y = fieldWorld.caveReturn.y;
      showToast('🌤️ Kembali ke Joseon');
    }
    snapCamera(cam, player.x, player.y);
    syncFollowers(); // pendamping ikut pindah map
    saveState();
  }

  function update(dt) {
    const { map, w: mapW, h: mapH } = maps[active];
    if (!player.fainted) updatePlayer(player, input, dt, map);
    if (player.atkCd > 0) player.atkCd -= dt;
    if (player.atkAnim > 0) player.atkAnim -= dt;
    if (player.dashAnim > 0) player.dashAnim -= dt;
    if (player.skill1Cd > 0) player.skill1Cd -= dt;
    if (player.skill2Cd > 0) player.skill2Cd -= dt;
    // Mana pulih otomatis tiap detik.
    if (!player.fainted && player.mana < player.maxMana) {
      player.mana = Math.min(player.maxMana, player.mana + MANA_REGEN * dt);
      refreshManaBar();
    }
    // Auto-save tiap 15 detik.
    saveTimer += dt;
    if (saveTimer >= 15) { saveTimer = 0; saveState(); }
    // Pendamping mengikuti pemain (offset berjenjang).
    for (let i = 0; i < followers.length; i++) {
      const f = followers[i];
      const tx = player.x - 46 - i * 42, ty = player.y + 36;
      const dx = tx - f.x, dy = ty - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 14 && !player.fainted) {
        const sp = (player.speed || 150) * 1.2;
        const step = Math.min(dist, sp * dt);
        const nx = f.x + (dx / dist) * step, ny = f.y + (dy / dist) * step;
        if (walkableAt(map, nx, f.y)) f.x = nx;
        if (walkableAt(map, f.x, ny)) f.y = ny;
      }
    }

    const foes = active === 'dungeon' ? monsters : [];
    // Serangan pemain (Spasi/J/klik tombol).
    if (!player.fainted && input.attackPressed) {
      playerAttack(player, foes, floaters, onKill);
      refreshHpBar();
    }
    // Skill 1 — Tebasan Api (K). Butuh mana.
    if (!player.fainted && input.skill1Pressed) {
      if (player.skill1Cd <= 0) {
        if (spendMana(player, SKILL1_COST)) {
          skillStrike(player, foes, floaters, onKill);
          refreshHpBar();
          refreshManaBar();
        } else {
          showToast('💧 Mana tidak cukup untuk Tebasan Api!');
        }
      }
    }
    // Skill 2 — Dash (L). Butuh mana.
    if (!player.fainted && input.skill2Pressed) {
      if (player.skill2Cd <= 0) {
        if (spendMana(player, DASH_COST)) {
          const moved = dashPlayer(player, map);
          if (moved > 0) player.skill2Cd = SKILL2_CD;
          refreshManaBar();
        } else {
          showToast('💧 Mana tidak cukup untuk Dash!');
        }
      }
    }
    refreshSkills();

    if (active === 'dungeon') {
      for (const m of monsters) {
        const res = updateMonster(m, dt, map, player);
        if (res && res.hitPlayer) {
          if (damagePlayer(player, res.hitPlayer, floaters)) onFaint();
          refreshHpBar();
        }
        if (res && res.fireProjectile) {
          const p = res.fireProjectile;
          projectiles.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, dmg: p.dmg, element: p.element, ttl: 3 });
        }
        if (m.aggro && m.aggroCooldown <= 0 && m.state !== 'dead') {
          m.aggroCooldown = 8;
          showToast(`⚔️ ${m.name} mengejarmu!`);
        }
      }
      // Proyektil monster: gerak, kena dinding hilang, kena pemain damage.
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.ttl -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        let dead = p.ttl <= 0 || !walkableAt(map, p.x, p.y);
        if (!dead && !player.fainted && Math.hypot(p.x - player.x, p.y - (player.y - 35)) < 16) {
          if (damagePlayer(player, p.dmg, floaters)) onFaint();
          refreshHpBar();
          dead = true;
        }
        if (dead) projectiles.splice(i, 1);
      }
    } else {
      projectiles.length = 0; // bersih saat keluar dungeon
    }
    updateFloaters(floaters, dt);
    followCamera(cam, player.x, player.y, dt, mapW, mapH);

    // Lapar: -1 tiap 25 detik. Habis = serangan melemah & tak bisa masuk gua.
    if (!player.fainted) {
      satietyTimer += dt;
      if (satietyTimer >= 25) {
        satietyTimer = 0;
        if (player.satiety > 0) {
          player.satiety = Math.max(0, player.satiety - 1);
          if (player.satiety === 25) showToast('🍖 Perut mulai keroncongan... serangan melemah!');
          if (player.satiety === 0) showToast('🍖 Kamu kelaparan! Cari makanan.');
          refreshSatiety();
        }
      }
    }

    // Interaksi: satu prompt prioritas tertinggi yang dekat.
    let prompt = null; // { text, action }
    if (active === 'field') {
      // Dialog yang sedang berjalan: tutup bila pemain menjauh.
      if (activeNpc && dist(player.x, player.y, activeNpc.x, activeNpc.y) > 96) {
        closeDialogue(activeNpc);
        hideDialogue();
      }
      const g = tileCenterPx(fieldWorld.cityGate.tx, fieldWorld.cityGate.ty);
      const c = tileCenterPx(fieldWorld.cave.tx, fieldWorld.cave.ty);
      if (activeNpc) {
        prompt = {
          text: `💬 ${activeNpc.name} — tekan E / ketuk untuk lanjut`,
          action: () => {
            const npc = activeNpc;
            const line = advanceDialogue(npc);
            if (line === null) {
              hideDialogue();
              if (npc.role === 'shop') openShop(npc); // selesai bicara -> buka toko
            } else showDialogue(npc, line);
          },
        };
      } else {
        let nearNpc = null, nearD = 56;
        for (const n of npcs) {
          const d = dist(player.x, player.y, n.x, n.y);
          if (d < nearD) { nearD = d; nearNpc = n; }
        }
        if (nearNpc) {
          prompt = {
            text: `💬 ${nearNpc.name} — tekan E / ketuk untuk bicara`,
            action: () => { activeNpc = nearNpc; showDialogue(nearNpc, openDialogue(nearNpc)); },
          };
        } else if (dist(player.x, player.y, g.x, g.y) < 56) {
          prompt = { text: `⛩ ${fieldWorld.cityGate.name} — tekan E / ketuk untuk masuk`, action: openCityMenu };
        } else if (dist(player.x, player.y, c.x, c.y) < 60) {
          prompt = {
            text: '⛏ Gua Latihan — tekan E / ketuk untuk masuk',
            action: () => {
              if (player.satiety <= 0) {
                showToast('🍖 Terlalu lapar untuk masuk gua! Makan dulu.');
                return;
              }
              switchMap('dungeon');
            },
          };
        }
      }
    } else {
      const s = tileCenterPx(dungeonWorld.stairs.tx, dungeonWorld.stairs.ty);
      const ch = tileCenterPx(dungeonWorld.chest.tx, dungeonWorld.chest.ty);
      if (dist(player.x, player.y, s.x, s.y) < 52) {
        prompt = { text: '🪜 Tangga keluar — tekan E / ketuk', action: () => switchMap('field') };
      } else if (!chestLooted && dist(player.x, player.y, ch.x, ch.y) < 52) {
        prompt = {
          text: '🎁 Peti harta — tekan E / ketuk untuk membuka',
          action: lootChest,
        };
      }
    }

    if (prompt) {
      promptEl.style.display = 'block';
      promptText.textContent = prompt.text;
      if (input.interactPressed) prompt.action();
    } else {
      promptEl.style.display = 'none';
    }

    // Menu: hotkey C/I/U/P (desktop) atau bottom nav (mobile). Esc menutup.
    if (input.menuPressed) {
      const tab = input.menuTab;
      if (isMenuOpen() && menuTab === tab) closeMenu();
      else openMenu(tab);
    }
    if (input.escapePressed) {
      if (isMenuOpen()) closeMenu();
      else if (shopEl.style.display === 'flex') closeShop();
    }

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastEl.style.display = 'none';
    }
    endTick(input);
  }

  function render() {
    const { map } = maps[active];
    const MW = active === 'field' ? MAP_W : DUN_W;
    const MH = active === 'field' ? MAP_H : DUN_H;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.fillStyle = active === 'field' ? '#1a1f24' : '#101014';
    ctx.fillRect(0, 0, cam.w, cam.h);

    const x0 = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const y0 = Math.max(0, Math.floor(cam.y / TILE_SIZE));
    const x1 = Math.min(MW - 1, Math.ceil((cam.x + cam.w) / TILE_SIZE));
    const y1 = Math.min(MH - 1, Math.ceil((cam.y + cam.h) / TILE_SIZE));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tileAt(map, tx, ty);
        const img = tiles[t];
        if (img) ctx.drawImage(img, Math.round(tx * TILE_SIZE - cam.x), Math.round(ty * TILE_SIZE - cam.y));
      }
    }

    // Monster (hanya di dungeon).
    if (active === 'dungeon') {
      for (const m of monsters) {
        if (m.state === 'dead') continue;
        const mx = Math.round(m.x - cam.x), my = Math.round(m.y - cam.y);
        // Bar HP (tampil kalau terluka / mengejar) + label level & elemen.
        if (m.hp < m.maxHp || m.aggro) {
          const bw = 36, pct = m.hp / m.maxHp;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(mx - bw / 2, my - 62, bw, 5);
          ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336';
          ctx.fillRect(mx - bw / 2 + 1, my - 61, (bw - 2) * pct, 3);
          ctx.font = '10px system-ui, sans-serif';
          ctx.textAlign = 'left';
          const el = ELEMENTS[m.element] || ELEMENTS.neutral;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillText(`Lv${m.level} ${el.icon}`, mx - bw / 2 + 1, my - 65);
          ctx.fillStyle = '#fff';
          ctx.fillText(`Lv${m.level} ${el.icon}`, mx - bw / 2, my - 66);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(mx, my - 2, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
        const bob = (m.state === 'walk' || m.state === 'chase') ? Math.sin(m.walkPhase) * 1.5 : 0;
        const img = monsterImage(m) || monsterImgs['goblin-hutan'];
        if (img) ctx.drawImage(img, mx - 18, my - 44 + bob, 36, 44);
      }
      // Proyektil monster (lingkaran sesuai warna elemen).
      for (const p of projectiles) {
        const px = Math.round(p.x - cam.x), py = Math.round(p.y - cam.y);
        const el = ELEMENTS[p.element] || ELEMENTS.neutral;
        ctx.fillStyle = el.color;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.arc(px - 2, py - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // NPC (hanya di field).
    if (active === 'field') {
      for (const n of npcs) {
        const nx = Math.round(n.x - cam.x), ny = Math.round(n.y - cam.y);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(nx, ny - 2, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
        const img = npcImgs[n.sprite];
        if (img) ctx.drawImage(img, nx - 15, ny - 52, 30, 52);
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(n.name, nx + 1, ny - 57);
        ctx.fillStyle = n.talking ? '#ffd54a' : '#fff';
        ctx.fillText(n.name, nx, ny - 58);
      }
    }

    // Pemain.
    const pw = 30, ph = 70;
    const px = Math.round(player.x - cam.x), py = Math.round(player.y - cam.y);
    if (!player.fainted) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(px, py - 2, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      const bob = player.moving ? Math.sin(player.walkPhase) * 1.5 : 0;
      ctx.drawImage(playerImg, px - pw / 2, py - ph + bob, pw, ph);
      // Busur tebasan (api = oranye, lebih besar).
      if (player.atkAnim > 0) {
        const fire = player.atkAnimColor === 'fire';
        const base = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI }[player.dir];
        const max = fire ? 0.25 : 0.18;
        const alpha = 0.35 + 0.65 * Math.max(0, player.atkAnim / max);
        ctx.strokeStyle = fire ? `rgba(255, 120, 40, ${alpha})` : `rgba(255, 240, 160, ${alpha})`;
        ctx.lineWidth = fire ? 11 : 7;
        ctx.beginPath();
        ctx.arc(px, py - 30, fire ? 52 : 38, base - 1.1, base + 1.1);
        ctx.stroke();
        if (fire) { // lidah api tambahan
          ctx.strokeStyle = `rgba(255, 200, 80, ${alpha * 0.8})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(px, py - 30, 42, base - 0.8, base + 0.8);
          ctx.stroke();
        }
      }
      // Efek dash: kilatan putih.
      if (player.dashAnim > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${player.dashAnim / 0.25 * 0.45})`;
        ctx.beginPath(); ctx.ellipse(px, py - 30, 22, 34, 0, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Pendamping party (mengikuti pemain).
    for (const f of followers) {
      const img = companionImgs[f.id];
      if (!img) continue;
      const fx = Math.round(f.x - cam.x), fy = Math.round(f.y - cam.y);
      const fw = 26, fh = 60;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(fx, fy - 2, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(img, fx - fw / 2, fy - fh, fw, fh);
    }

    // Angka damage melayang.
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const f of floaters) {
      const fx = Math.round(f.x - cam.x), fy = Math.round(f.y - cam.y);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(f.text, fx + 1, fy + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, fx, fy);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  startLoop(update, render);

  // Handle debug untuk playtest otomatis (world.html hanya demo dev).
  window.__world = { player, cam, input, monsters, floaters, playerAttack, skillStrike, lootChest,
    get active() { return active; }, get gold() { return gold; }, set gold(v) { gold = v; },
    get inv() { return inv; }, get party() { return party; }, get followers() { return followers; },
    useItem, equipItem, unequipItem, sellItem, buyItem,
    hireCompanion, dismissCompanion, saveState,
    openMenu, closeMenu, openShop, rollDrops, gainXp, allocateStat,
    projectiles, npcs, openDialogue, advanceDialogue,
    switchMap, fieldWorld, dungeonWorld, respawnAtInn };
}

boot().catch((err) => {
  document.getElementById('hud-title').textContent = 'Gagal memuat: ' + err.message;
  console.error(err);
});
