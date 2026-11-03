// ============================================================
// src/world/data/elements.js — sistem elemen (data-driven).
//
// Elemen: neutral + 5 elemen GDD (siklus: Api→Angin→Petir→Air→Bumi→Api).
// Aturan efektivitas (keputusan 3 Nov 2026):
// - menyerang elemen yang dikalahkan siklus: 1.5x ("Effective!")
// - diserang balik (elemen lawan mengalahkan): 0.7x ("Resist")
// - elemen sama: 0.8x
// - netral (penyerang maupun bertahan): selalu 1.0x
// ============================================================

export const ELEMENTS = {
  neutral: { name: 'Netral', icon: '⚪', color: '#bdbdbd' },
  api:     { name: 'Api',    icon: '🔥', color: '#ef5350' },
  angin:   { name: 'Angin',  icon: '🌪️', color: '#80deea' },
  petir:   { name: 'Petir',  icon: '⚡', color: '#ffee58' },
  air:     { name: 'Air',    icon: '💧', color: '#42a5f5' },
  bumi:    { name: 'Bumi',   icon: '🪨', color: '#a1887f' },
};

// Urutan siklus: CYCLE[i] mengalahkan CYCLE[(i+1) % 5].
export const ELEMENT_CYCLE = ['api', 'angin', 'petir', 'air', 'bumi'];

export const MULT_EFFECTIVE = 1.5;
export const MULT_RESIST = 0.7;
export const MULT_SAME = 0.8;

export function effectiveness(atkEl, defEl) {
  if (!atkEl || !defEl) return 1;
  if (atkEl === 'neutral' || defEl === 'neutral') return 1;
  if (atkEl === defEl) return MULT_SAME;
  const i = ELEMENT_CYCLE.indexOf(atkEl);
  const j = ELEMENT_CYCLE.indexOf(defEl);
  if (i < 0 || j < 0) return 1;
  if ((i + 1) % ELEMENT_CYCLE.length === j) return MULT_EFFECTIVE; // atk menang siklus
  if ((j + 1) % ELEMENT_CYCLE.length === i) return MULT_RESIST;    // def menang siklus
  return 1;
}

export function elementLabel(el) {
  const e = ELEMENTS[el] || ELEMENTS.neutral;
  return `${e.icon} ${e.name}`;
}
