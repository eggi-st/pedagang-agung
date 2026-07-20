// STATUS: skeleton. Bentuk `state` didokumentasikan di sini berdasarkan
// original-reference.html (fungsi startGame()). Logic pembuatan/migrasi
// state MASIH ada di original-reference.html dan belum dipindah kemari —
// ini pekerjaan Fase 2 (lihat rencana-migrasi-claude-code.md).
//
// Cari fungsi-fungsi berikut di original-reference.html untuk dipindah:
//   - startGame(nation, className, opts)  -> pembuatan state baru
//   - migrateState()                       -> migrasi save lama
//   - saveGame() / loadSavedGame() / clearSave()  -> src/systems/save.js

/**
 * @typedef {Object} GameState
 * @property {string} nation
 * @property {string} className
 * @property {number} gold
 * @property {number} day
 * @property {string} city
 * @property {Object} char - level, exp, expMax, hp, maxHp, str, int, agi, luk, classAtkBonus
 * @property {Object} equipment - weapon, armor, accessory1, accessory2
 * @property {string[]} ownedWeapons
 * @property {string[]} ownedArmors
 * @property {number} potions
 * @property {Array} generals
 * @property {Array} items
 * @property {Object} inventory
 * @property {number} cap
 * @property {number} capMax
 * @property {Object} prices
 * @property {Object} recruits
 * @property {string[]} owned - kota yang dikuasai
 * @property {number} medals
 * @property {Object} reputation
 * @property {Object} cityUpgrades
 * @property {Object} quests
 * @property {Object} factory
 * @property {Object} processedGoods
 * @property {Object|null} guildQuest
 * @property {number} tradePoints
 * @property {number} upgradeParts
 * @property {number} rebirthStones
 * @property {boolean} classTransformed
 * @property {number} lastTestTown
 * @property {Array<{day:number, gold:number}>} goldHistory
 * @property {number} ngPlus
 * @property {Object} stats
 * @property {string[]} achievements
 * @property {number} currentSlot
 * @property {string[]} log
 */

export let state = null;

export function setState(newState) {
  state = newState;
}
