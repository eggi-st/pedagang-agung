// Progression: pengecekan pencapaian, syarat berakhirnya permainan, dan
// layar akhir (termasuk grafik gold).
//
// checkEndConditions dan endGame dipanggil sistem lain lewat core/bus.js;
// game.js yang mendaftarkannya. drawGoldChart hanya dipakai endGame, jadi
// ditaruh di sini agar lapisan render tidak perlu mengimpornya (mencegah
// siklus render <-> progression).

import { state } from '../state.js';
import { clearSave } from './save.js';
import { showEvent } from '../ui/overlay.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { sfx, haptic } from '../audio/sfx.js';
import { stopMusic } from '../audio/music.js';

export function drawGoldChart(){
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

export function checkAchievements(){
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

export function checkEndConditions(){
  if(state.char.hp<=0){ endGame(false,'Kamu tumbang di jalan. Perjalanan dagangmu berakhir di sini.'); return true;}
  return false;
}

export function endGame(timeUp, forcedMsg){
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
