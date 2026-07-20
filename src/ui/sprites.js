import { SPRITE_HUMANOID, SPRITE_MONSTER, SKIN_TONE } from '../data/sprites.js';
import { NATION_BODY_COLOR } from '../data/classes.js';
import { RANK_BODY_COLOR } from '../data/mercenaries/index.js';
import { ELEMENT_BODY_COLOR } from '../data/elements.js';

export function drawPixelSprite(canvas, template, colors) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const rows = template.length;
  const cols = template[0].length;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = template[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = colors[ch] || '#fff';
      ctx.fillRect(Math.floor(c * cellW), Math.floor(r * cellH), Math.ceil(cellW), Math.ceil(cellH));
    }
  }
}

export function paintSpriteCanvas(canvas) {
  const spec = canvas.getAttribute('data-sprite');
  if (!spec) return;
  const [kind, key] = spec.split(':');
  if (kind === 'player') {
    const body = NATION_BODY_COLOR[key] || '#4a90d9';
    drawPixelSprite(canvas, SPRITE_HUMANOID, { H: '#2a1a0a', S: SKIN_TONE, B: body, A: '#f4c542' });
  } else if (kind === 'general') {
    const body = RANK_BODY_COLOR[parseInt(key, 10)] || '#9788b8';
    drawPixelSprite(canvas, SPRITE_HUMANOID, { H: '#2a1a0a', S: SKIN_TONE, B: body, A: '#ede4ff' });
  } else if (kind === 'monster') {
    const body = ELEMENT_BODY_COLOR[key] || '#7a2a2a';
    drawPixelSprite(canvas, SPRITE_MONSTER, { M: body, E: '#1a1423' });
  }
}

export function paintAllSprites(root) {
  (root || document).querySelectorAll('.sprite-canvas').forEach(paintSpriteCanvas);
}

export function spriteCanvasHTML(kind, key, size = 28) {
  return `<canvas class="sprite-canvas" width="${size}" height="${size}" data-sprite="${kind}:${key}"></canvas>`;
}
