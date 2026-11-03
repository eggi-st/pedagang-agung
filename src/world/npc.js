// ============================================================
// src/world/npc.js — entitas NPC + mesin dialog sederhana.
// Definisi NPC di data/npcs.js (nama, sprite, peran, lines).
// ============================================================
import { getNpcDef } from './data/npcs.js';

export function createNpc(x, y, defId) {
  const def = getNpcDef(defId);
  if (!def) throw new Error(`NPC tidak dikenal: ${defId}`);
  return {
    x, y, defId,
    name: def.name,
    sprite: def.sprite,
    role: def.role,
    lines: [...def.lines],
    lineIdx: 0,
    talking: false, // true saat dialog terbuka
  };
}

// Buka dialog: kembali baris pertama, tandai talking.
export function openDialogue(npc) {
  npc.talking = true;
  npc.lineIdx = 0;
  return npc.lines[0];
}

// Lanjut dialog: baris berikut, atau null bila selesai (tutup dialog).
export function advanceDialogue(npc) {
  npc.lineIdx += 1;
  if (npc.lineIdx >= npc.lines.length) {
    npc.talking = false;
    return null;
  }
  return npc.lines[npc.lineIdx];
}

export function closeDialogue(npc) {
  npc.talking = false;
}
