// ============================================================
//  ANUSHA BIRTHDAY — script.js  (Error-Handled Version)
// ============================================================

// ── 1. Safe DOM references ───────────────────────────────────
const canvas = document.getElementById('canvas');
if (!canvas) {
  console.error('[Init] Canvas element not found. Aborting.');
  throw new Error('Canvas element missing from DOM.');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  console.error('[Init] 2D context unavailable (unsupported browser?).');
  throw new Error('Canvas 2D context not available.');
}

// ── 2. Bear image with fallback ──────────────────────────────
const bear = document.getElementById('bear');
if (bear) {
  bear.addEventListener('error', () => {
    console.warn('[Bear] GIF failed to load. Hiding bear element.');
    bear.style.display = 'none';
  });
}

// ── 3. State ─────────────────────────────────────────────────
const stars         = [];
const explosions    = [];
const shootingStars = [];
const fullText      = [" WISH YOU HAPPY BIRTHDAY ANUSHA 💗"];
const fontSize      = 66;
const fontFamily    = "georgia";
const lineHeight    = 120;
const bearX         = 70;
let   bearY         = canvas.height - 80;
let   dots          = [];
let   targetDotsQueue   = [];
let   currentCharIndex  = 0;
let   animationDone     = false;
let   animationStarted  = false; // Ensures animations only start once

// ── 4. Interval / RAF handles (so we can clear them) ─────────
let shootInterval     = null;
let shootStarInterval = null;
let rafId             = null;

// ── 5. Orientation check — defined once, outside resizeCanvas ─
function checkOrientation() {
  const isMobile  = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isPortrait = window.innerHeight > window.innerWidth;
  const notice    = document.getElementById("rotateNotice");

  if (!notice) return; // guard: element might not exist

  if (isMobile && isPortrait) {
    // Mobile portrait: show rotation prompt
    notice.style.display         = "block";
    canvas.style.display         = "none";
    if (bear) bear.style.display = "none";
  } else {
    // Landscape or desktop: show content
    notice.style.display         = "none";
    canvas.style.display         = "block";
    if (bear) bear.style.display = "block";
    startBirthdayAnimations();
  }
}

// ── 5.6. Start birthday animations ───────────────────────────
function startBirthdayAnimations() {
  if (animationStarted) return;
  animationStarted = true;

  if (!shootInterval) {
    shootInterval = setInterval(shootDot, 50);
  }
  if (!shootStarInterval) {
    shootStarInterval = setInterval(createShootingStar, 1500);
  }
  if (!rafId) {
    animate();
  }
}

// ── 6. resizeCanvas — no duplicate listeners ──────────────────
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  bearY = canvas.height - 80;

  stars.length = 0;
  for (let i = 0; i < 300; i++) {
    stars.push({
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha:  Math.random(),
      delta:  Math.random() * 0.02 + 0.005,
    });
  }

  // Reset animation state on resize (dots were orphaned before)
  dots             = [];
  targetDotsQueue  = [];
  currentCharIndex = 0;
  animationDone    = false;
  generateAllTargetDots();
}

// ── 7. Single resize listener (no more duplicate stacking) ────
window.addEventListener('resize', () => {
  resizeCanvas();
  checkOrientation();
});

// ── 8. Explosion ──────────────────────────────────────────────
function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    explosions.push({
      x, y,
      vx:      Math.cos(angle) * speed,
      vy:      Math.sin(angle) * speed,
      life:    60,
      opacity: 1,
    });
  }
}

// ── 9. Stars ──────────────────────────────────────────────────
function drawStars() {
  for (const star of stars) {
    star.alpha += star.delta;
    if (star.alpha >= 1 || star.alpha <= 0) star.delta = -star.delta;

    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle   = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── 10. Shooting stars ────────────────────────────────────────
function createShootingStar() {
  shootingStars.push({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height / 2,
    length:  Math.random() * 300 + 100,
    speed:   Math.random() * 10 + 6,
    angle:   Math.PI / 4,
    opacity: 1,
  });
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s    = shootingStars[i];
    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;

    const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
    gradient.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
    gradient.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    s.x       += Math.cos(s.angle) * s.speed;
    s.y       += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.01;

    if (s.opacity <= 0) shootingStars.splice(i, 1);
  }
}

// ── 11. generateCharDots — safe canvas dimensions + try/catch ─
function generateCharDots(char, x, y) {
  try {
    const tempCanvas  = document.createElement('canvas');
    // Use main canvas dimensions (guaranteed non-zero after resizeCanvas)
    tempCanvas.width  = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      console.warn('[generateCharDots] Could not get 2D context for temp canvas.');
      return [];
    }

    tempCtx.font      = `bold ${fontSize}px ${fontFamily}`;
    tempCtx.fillStyle = "red";
    tempCtx.textAlign = "left";
    tempCtx.fillText(char, x, y);

    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
    const charDots  = [];

    // Renamed loop vars to row/col to avoid shadowing outer x, y params
    for (let row = 0; row < canvas.height; row += 4) {
      for (let col = 0; col < canvas.width; col += 4) {
        const index = (row * canvas.width + col) * 4;
        if (imageData[index + 3] > 128) {
          charDots.push({ x: col, y: row });
        }
      }
    }

    return charDots;
  } catch (err) {
    console.error('[generateCharDots] Failed for char "' + char + '":', err);
    return [];
  }
}

// ── 12. generateAllTargetDots ─────────────────────────────────
function generateAllTargetDots() {
  try {
    const measureCanvas  = document.createElement('canvas');
    measureCanvas.width  = canvas.width;
    measureCanvas.height = canvas.height;
    const tempCtx = measureCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Measure canvas context unavailable');

    tempCtx.font  = `bold ${fontSize}px ${fontFamily}`;
    const startY  = (canvas.height - fullText.length * lineHeight) / 2;

    fullText.forEach((line, lineIndex) => {
      const lineWidth = tempCtx.measureText(line).width;
      let   xCursor  = (canvas.width - lineWidth) / 2;
      const y        = startY + lineIndex * lineHeight;

      for (const char of line) {
        if (char === " ") {
          xCursor += tempCtx.measureText(" ").width;
          targetDotsQueue.push([]);
          continue;
        }
        const charDots = generateCharDots(char, xCursor, y);
        targetDotsQueue.push(charDots);
        xCursor += tempCtx.measureText(char).width;
      }
    });
  } catch (err) {
    console.error('[generateAllTargetDots] Failed:', err);
  }
}

// ── 13. shootDot ──────────────────────────────────────────────
function shootDot() {
  if (animationDone) return;

  while (
    currentCharIndex < targetDotsQueue.length &&
    targetDotsQueue[currentCharIndex].length === 0
  ) {
    currentCharIndex++;
  }

  const targetDots = targetDotsQueue[currentCharIndex];
  if (!targetDots || targetDots.length === 0) return;

  for (let i = 0; i < 5; i++) {
    const target = targetDots.shift();
    if (!target) break; // safe guard against empty pop
    const angle = Math.random() * Math.PI / 6 - Math.PI / 12;
    const speed = 3 + Math.random() * 2;
    dots.push({
      x:       bearX + 40 + Math.random() * 20,
      y:       bearY - 20 + Math.random() * 10,
      vx:      Math.cos(angle) * speed,
      vy:      Math.sin(angle) * speed,
      targetX: target.x,
      targetY: target.y,
    });
  }

  if (targetDots.length === 0 && currentCharIndex < targetDotsQueue.length - 1) {
    currentCharIndex++;
  }
}

// ── 14. animate ───────────────────────────────────────────────
function animate() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#00d4ff");
  gradient.addColorStop(1, "#7c3aed");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawShootingStars();

  dots.forEach(dot => {
    const dx = dot.targetX - dot.x;
    const dy = dot.targetY - dot.y;
    dot.vx += dx * 0.002;
    dot.vy += dy * 0.002;
    dot.vx *= 0.95;
    dot.vy *= 0.91;
    dot.x  += dot.vx;
    dot.y  += dot.vy;

    ctx.font         = "17px Arial";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💕", dot.x, dot.y);
  });

  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;
    p.opacity -= 0.015;

    ctx.globalAlpha = Math.max(p.opacity, 0);
    ctx.fillStyle   = "white";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.life <= 0 || p.opacity <= 0) explosions.splice(i, 1);
  }

  if (
    !animationDone &&
    currentCharIndex >= targetDotsQueue.length &&
    dots.every(dot => Math.abs(dot.targetX - dot.x) < 2 && Math.abs(dot.targetY - dot.y) < 2)
  ) {
    animationDone = true;
    if (bear) bear.style.display = "none";
  }

  rafId = requestAnimationFrame(animate);
}

// ── 15. Event listeners ───────────────────────────────────────
canvas.addEventListener("click", (e) => {
  createExplosion(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // prevent ghost click on mobile
  const touch = e.touches[0];
  if (touch) createExplosion(touch.clientX, touch.clientY);
}, { passive: false });

// ── 16. Kick off — store interval IDs ────────────────────────
resizeCanvas();
checkOrientation();
// Note: Birthday animations will start after rotation on mobile, or immediately on desktop
