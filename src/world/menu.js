// ============================================================
// src/world/menu.js — sistem menu (Status, Tas, Equip, Party, Pengaturan).
// Render per tab = fungsi murni (HTML string), bisa di-test.
// Navigasi: desktop = hotkey (C/I/U/P/Esc) + tombol ☰;
//           mobile = bottom nav bar. Panel menyesuaikan layar.
// ============================================================
import { STATS, MAX_LEVEL, xpForLevel } from './level.js';

export const MENU_TABS = [
  { id: 'status', label: 'Status', icon: '📊', hotkey: 'KeyC' },
  { id: 'tas', label: 'Tas', icon: '🎒', hotkey: 'KeyI' },
  { id: 'equip', label: 'Equip', icon: '🛡️', hotkey: 'KeyU' },
  { id: 'party', label: 'Party', icon: '👥', hotkey: 'KeyP' },
  { id: 'pengaturan', label: 'Pengaturan', icon: '⚙️', hotkey: null },
];

export function getTab(id) {
  return MENU_TABS.find((t) => t.id === id) || MENU_TABS[0];
}

// ctx: { player, inv, items: {getItemDef, rarityColor, RARITY, listItems, countItem},
//        companions: COMPANIONS, manifest }
export function renderMenuTab(tabId, ctx) {
  switch (tabId) {
    case 'tas': return renderTas(ctx);
    case 'equip': return renderEquip(ctx);
    case 'party': return renderParty(ctx);
    case 'pengaturan': return renderPengaturan(ctx);
    case 'status':
    default: return renderStatus(ctx);
  }
}

function statRow(icon, label, value) {
  return `<div class="panel-row"><div class="panel-icon">${icon}</div>
    <div class="panel-info"><div class="panel-desc">${label}</div>
    <div class="panel-name">${value}</div></div></div>`;
}

function renderStatus(ctx) {
  const p = ctx.player;
  const w = p.equip.weapon ? ctx.items.getItemDef(p.equip.weapon).name : '-';
  const a = p.equip.armor ? ctx.items.getItemDef(p.equip.armor).name : '-';
  const maxed = p.level >= MAX_LEVEL;
  const need = maxed ? 0 : xpForLevel(p.level);
  const xpPct = maxed ? 100 : Math.min(100, Math.round((p.xp / need) * 100));
  const xpBar = `<div style="background:#d8c9a8;border-radius:5px;height:10px;margin-top:4px">
      <div style="width:${xpPct}%;background:#8a6238;height:100%;border-radius:5px"></div></div>`;
  const statRows = STATS.map((st) => `
    <div class="panel-row">
      <div class="panel-icon">${st.icon}</div>
      <div class="panel-info">
        <div class="panel-name">${st.name} — ${p.stats[st.id]}</div>
        <div class="panel-desc">${st.desc}</div>
      </div>
      <button class="panel-btn" data-act="stat" data-id="${st.id}" ${p.statPoints <= 0 ? 'disabled' : ''}>+</button>
    </div>`).join('');
  return `
    ${statRow('⭐', 'Level', `${p.level}${maxed ? ' (MAX)' : ''}`)}
    <div class="panel-row"><div class="panel-info">
      <div class="panel-desc">Experience — ${maxed ? 'maks' : `${p.xp} / ${need} XP`}</div>${xpBar}
    </div></div>
    ${statRow('🎁', 'Poin stat', `${p.statPoints} (tiap naik level +3)`)}
    ${statRow('❤️', 'HP', `${p.hp} / ${p.maxHp}`)}
    ${statRow('💧', 'Mana', `${Math.floor(p.mana)} / ${p.maxMana}`)}
    ${statRow('🍖', 'Kenyang', `${p.satiety} / ${p.maxSatiety}`)}
    ${statRow('⚔️', 'Serangan', `${p.atkMin} - ${p.atkMax}`)}
    ${statRow('🛡️', 'Pertahanan', `${p.defense}`)}
    ${statRow('🪙', 'Emas', `${ctx.gold}`)}
    ${statRow('🗡️', 'Senjata', w)}
    ${statRow('🥋', 'Zirah', a)}
    <div class="panel-desc" style="padding:8px 4px 2px"><b>Alokasi stat:</b></div>
    ${statRows}
    <div class="panel-desc" style="padding:10px 4px">Lapar di bawah 25: serangan -25%. Lapar 0: tak bisa masuk gua.</div>`;
}

function itemRowHtml(ctx, id, action) {
  const def = ctx.items.getItemDef(id);
  const color = ctx.items.rarityColor(def.rarity);
  const icon = def.sprite
    ? `<img src="./assets/sprites/${(ctx.manifest[def.sprite] || {}).file || def.sprite + '.png'}" alt="">`
    : (def.icon || '📦');
  const bonus = def.statBonus
    ? Object.entries(def.statBonus).filter(([, v]) => v > 0)
        .map(([k, v]) => `+${v} ${(STATS.find((s) => s.id === k) || { name: k }).name}`).join(', ')
    : '';
  return `<div class="panel-row">
    <div class="panel-icon">${icon}</div>
    <div class="panel-info">
      <div class="panel-name" style="color:${color}">${def.name}</div>
      <div class="panel-desc">${ctx.items.RARITY[def.rarity].name} · ${def.desc}${bonus ? ` · <span style="color:#2e7d32">${bonus}</span>` : ''}</div>
    </div>
    <div class="panel-qty">×${ctx.items.countItem(ctx.inv, id)}</div>
    ${action ? `<button class="panel-btn" data-act="${action.act}" data-id="${id}">${action.label}</button>` : ''}
  </div>`;
}

function renderTas(ctx) {
  const ids = ctx.items.listItems(ctx.inv);
  if (ids.length === 0) {
    return '<div class="panel-desc" style="padding:12px 4px">Tas masih kosong. Kalahkan monster untuk mendapatkan item!</div>';
  }
  return ids.map((id) => {
    const def = ctx.items.getItemDef(id);
    const canUse = def.kind === 'consumable';
    return itemRowHtml(ctx, id, canUse ? { act: 'use', label: 'Pakai' } : null);
  }).join('');
}

function renderEquip(ctx) {
  const p = ctx.player;
  const slots = [
    { slot: 'weapon', label: 'Senjata', icon: '🗡️' },
    { slot: 'armor', label: 'Zirah', icon: '🥋' },
  ];
  const bonusText = (def) => {
    if (!def.statBonus) return '';
    const parts = Object.entries(def.statBonus)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `+${v} ${(STATS.find((s) => s.id === k) || { name: k }).name}`);
    return parts.length ? `<div class="panel-desc" style="color:#2e7d32">${parts.join(', ')}</div>` : '';
  };
  let html = '';
  for (const s of slots) {
    const eqId = p.equip[s.slot];
    if (eqId) {
      const def = ctx.items.getItemDef(eqId);
      html += `<div class="panel-row">
        <div class="panel-icon">${s.icon}</div>
        <div class="panel-info">
          <div class="panel-desc">${s.label} terpasang</div>
          <div class="panel-name" style="color:${ctx.items.rarityColor(def.rarity)}">${def.name}</div>
          ${bonusText(def)}
        </div>
        <button class="panel-btn" data-act="unequip" data-id="${s.slot}">Lepas</button>
      </div>`;
    } else {
      html += `<div class="panel-row"><div class="panel-icon">${s.icon}</div>
        <div class="panel-info"><div class="panel-desc">${s.label}</div>
        <div class="panel-name" style="color:#999">Kosong</div></div></div>`;
    }
  }
  const bagEquip = ctx.items.listItems(ctx.inv)
    .filter((id) => ctx.items.getItemDef(id).kind === 'equipment');
  if (bagEquip.length > 0) {
    html += '<div class="panel-desc" style="padding:8px 4px 2px">Di tas:</div>';
    html += bagEquip.map((id) => itemRowHtml(ctx, id, { act: 'equip', label: 'Pasang' })).join('');
  }
  return html;
}

function renderParty(ctx) {
  const cards = Object.values(ctx.companions).map((c) => `
    <div class="panel-row">
      <div class="panel-icon">👤</div>
      <div class="panel-info">
        <div class="panel-name">${c.name} <span class="panel-desc">(${c.role})</span></div>
        <div class="panel-desc">${c.desc}</div>
        <div class="panel-desc">Rekrut: ${c.hireCost} 🪙</div>
      </div>
      <div class="panel-qty" style="color:#999">Segera hadir</div>
    </div>`).join('');
  return `<div class="panel-desc" style="padding:8px 4px">Sistem party & rekrutmen dalam pengembangan. Roster calon pendamping:</div>${cards}`;
}

function renderPengaturan() {
  return `
    <div class="panel-row"><div class="panel-info">
      <div class="panel-name">Hapus data demo</div>
      <div class="panel-desc">Hapus simpanan lokal dan mulai dari awal.</div>
    </div><button class="panel-btn" data-act="reset-save">Hapus</button></div>
    <div class="panel-desc" style="padding:10px 4px;line-height:1.7">
      <b>Kontrol desktop:</b> WASD/panah jalan · E interaksi · Spasi/J serang · K/L skill · C/I/U/P menu · Esc tutup.<br>
      <b>Mobile:</b> joystick kiri · tombol kanan untuk aksi · nav bawah untuk menu.<br>
      Demo Fase 0 — Pedagang Agung.
    </div>`;
}
