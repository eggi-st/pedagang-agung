// STATE RUNTIME PUSAT.
//
// Modul ES memakai live binding: modul lain yang menulis
// `import { state } from './state.js'` akan otomatis melihat nilai
// terbaru setiap kali setState() dipanggil. Yang TIDAK bisa dilakukan
// modul lain adalah menugaskan ulang binding-nya sendiri — karena itu
// setiap penugasan ulang harus lewat setter di bawah.
//
// Mengubah ISI state (state.gold += 10) tetap boleh di mana saja;
// yang perlu setter hanyalah mengganti seluruh objeknya.

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

/** @type {GameState|null} */
export let state = null;

/** Sesi pertempuran yang sedang berlangsung, null kalau tidak bertempur. */
export let battle = null;

/** Konteks dungeon/test town/skenario, null kalau di kota biasa. */
export let dungeonState = null;

export function setState(next) { state = next; }
export function setBattle(next) { battle = next; }
export function setDungeonState(next) { dungeonState = next; }
