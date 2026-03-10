// Darkness Ripper — p5.js (Webcam motion-driven vortex)
// Webcam movement controls the center of an organic, noisy "split".
// No mouse required. Works best with good lighting.

let video;
let prev;
let cx = 0;
let cy = 0;

let g;
let prevCx = 0;
let prevCy = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  noiseSeed(1337);
  randomSeed(1337);

  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  prev = createImage(320, 240);

  g = createGraphics(windowWidth, windowHeight);
  g.pixelDensity(1);
  g.clear();

  cx = width / 2;
  cy = height / 2;
  prevCx = cx;
  prevCy = cy;
}

function draw() {
  background(0);

  // Fullscreen mirrored webcam preview
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  video.loadPixels();
  prev.loadPixels();

  let totalX = 0;
  let totalY = 0;
  let count = 0;

  // Motion detection via frame differencing
  for (let y = 0; y < video.height; y += 5) {
    for (let x = 0; x < video.width; x += 5) {
      const i = (x + y * video.width) * 4;

      const r = video.pixels[i];
      const gg = video.pixels[i + 1];
      const b = video.pixels[i + 2];

      const pr = prev.pixels[i];
      const pg = prev.pixels[i + 1];
      const pb = prev.pixels[i + 2];

      const diff = abs(r - pr) + abs(gg - pg) + abs(b - pb);

      if (diff > 50) {
        totalX += x;
        totalY += y;
        count++;
      }
    }
  }

  if (count > 0) {
    const mx = totalX / count;
    const my = totalY / count;

    // Map webcam space to canvas space (mirrored X)
    const tx = map(mx, 0, video.width, width, 0);
    const ty = map(my, 0, video.height, 0, height);

    cx = lerp(cx, tx, 0.2);
    cy = lerp(cy, ty, 0.2);
  }

  const vel = dist(cx, cy, prevCx, prevCy);
  const t = frameCount * 0.01;

  renderNoisyOrb(cx, cy, vel, t);

  prevCx = cx;
  prevCy = cy;

  prev.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
}

function renderNoisyOrb(cx, cy, vel, t) {
  g.push();
  g.noStroke();
  g.fill(0, 0, 0, 55);
  g.rect(0, 0, width, height);
  g.pop();

  const R = min(width, height) * 0.16;
  const inner = R * 0.34;

  const swirl = map(cx, 0, width, -0.8, 0.8);
  const spin = 1.35 + swirl * 0.25;
  const disturb = map(constrain(vel, 3, 25), 0, 25, 2.18, 2.05);

  paintSpiralStreaks(cx, cy, inner, R * 9.6, t, spin, disturb);
  paintDust(cx, cy, inner * 0.85, R * 1.15, t, disturb);
  paintInnerMist(cx, cy, inner, R * 1.45, t, disturb);
  paintFilamentRings(cx, cy, R * 0.92, R * 1.12, t, disturb);

  image(g, 0, 0);
  drawCoreOrganic(cx, cy, inner, R, t);
}

function paintSpiralStreaks(cx, cy, innerR, outerR, t, spin, disturb) {
  g.push();
  g.blendMode(BLEND);

  const samples = 12000;
  for (let i = 0; i < samples; i++) {
    const u = pow(random(), 0.72);
    const r = lerp(innerR * 1.02, outerR, u);

    let a = random(TWO_PI);
    const inv = 1.0 / (r + 18.0);
    a += spin * (190.0 * inv) + t * 0.78;

    const nx = cx + cos(a) * r;
    const ny = cy + sin(a) * r;

    const n = noise(nx * 0.004 + 10.0, ny * 0.004 + 30.0, t * 0.08);
    const twist = map(n, 0, 1, -0.75, 0.75);

    const near = 1.0 - smoothstep(innerR * 1.05, outerR, r);
    a += twist * (0.35 + (1 - u) * 1.05) * (0.55 + disturb * 0.95 * (0.35 + near));

    const diskSquash = 0.9 + noise(r * 0.02, t * 0.3) * 0.12;

    let x = cx + cos(a) * r;
    let y = cy + sin(a) * r * diskSquash;

    x += random(-1, 1) * (0.6 + near * 2.0) * (0.45 + disturb * 0.55);
    y += random(-1, 1) * (0.6 + near * 2.0) * (0.45 + disturb * 0.55);

    const tangent = a + HALF_PI;
    const len = map(1 - u, 0, 1, 0.6, 5.2) * (0.6 + n * 1.1);
    const w = 0.28 + 0.9 * (1 - u) + n * 0.45;

    const c = 210 + 35 * n;
    const alpha = 8 + 18 * (1 - u);

    g.stroke(c, c, c, alpha);
    g.strokeWeight(w);
    g.line(
      x - cos(tangent) * len,
      y - sin(tangent) * len,
      x + cos(tangent) * len,
      y + sin(tangent) * len
    );
  }

  g.pop();
}

function paintDust(cx, cy, innerR, outerR, t, disturb) {
  g.push();
  g.blendMode(BLEND);
  g.noStroke();

  const dustCount = 8000;
  for (let i = 0; i < dustCount; i++) {
    const u = pow(random(), 0.85);
    const r = lerp(innerR, outerR, u);
    const a = random(TWO_PI);

    const diskSquash = 0.92 + noise(r * 2.12, t * 0.25) * 5.10;
    let x = cx + cos(a) * r;
    let y = cy + sin(a) * r * diskSquash;

    const n = noise(x * 5.8 + 90, y * 0.008 + 20, t * 0.05);
    const d = map(n, 0, 1, -5, 5) * (10.22 + disturb * 0.6);
    x += d;
    y += d * 0.65;

    const s = map(n, 0, 1, 0.6, 2.2) * (0.7 + random());
    const c = 140 + 80 * n;
    const alpha = map(1 - u, 0, 1, 7, 1.5) * (0.55 + n);

    g.fill(c, c, c, alpha);
    g.circle(x, y, s);

    if (random() < 0.08) {
      g.fill(c, c, c, alpha * 0.22);
      g.circle(x, y, s * (8 + 6 * n));
    }
  }

  g.pop();
}

function paintInnerMist(cx, cy, innerR, outerR, t, disturb) {
  g.push();
  g.blendMode(BLEND);
  g.noStroke();

  const samples = 900;
  for (let i = 0; i < samples; i++) {
    const u = pow(random(), 0.72);
    const r = lerp(innerR * 0.7, outerR, u);
    const a = random(TWO_PI);

    const diskSquash = 0.92 + noise(r * 0.018, t * 0.4) * 0.14;
    let x = cx + cos(a) * r;
    let y = cy + sin(a) * r * diskSquash;

    const n = noise(x * 0.008 + 50, y * 0.008 + 80, t * 0.06);
    const s = map(n, 0, 1, 5, 18) * (0.6 + random() * 0.9);

    const near = 1.0 - smoothstep(innerR * 1.05, outerR, r);
    x += random(-1, 1) * (0.35 + near * 1.2) * (0.35 + disturb * 0.6);
    y += random(-1, 1) * (0.35 + near * 1.2) * (0.35 + disturb * 0.6);

    const c = 150 + 65 * n;
    const alpha = map(1 - u, 0, 1, 6, 1.2) * (0.45 + n) * (0.8 + near * 0.35);

    g.fill(c, c, c, alpha);
    g.circle(x, y, s);
  }

  g.pop();
}

function drawCoreOrganic(cx, cy, innerR, R, t) {
  push();
  noStroke();

  for (let i = 0; i < 90; i++) {
    const a = random(TWO_PI);
    const n = noise(cos(a) * 1.2 + 10, sin(a) * 1.2 + 20, t * 0.9);
    const rr = innerR * (1.02 + 0.28 * n) + random(-6, 10);

    const x = cx + cos(a) * rr;
    const y = cy + sin(a) * rr * 0.92;

    const s = 7 + 24 * n + random(0, 10);
    const alpha = 5 + 18 * n;

    fill(220, 220, 220, alpha * 0.32);
    circle(x, y, s);
  }

  for (let k = 0; k < 26; k++) {
    const rr = innerR * lerp(1.9, 1.45, k / 25);
    const a = lerp(220, 255, k / 25);
    fill(0, 0, 0, a);
    circle(cx + random(-0.6, 0.6), cy + random(-0.6, 0.6), rr * 2);
  }

  for (let i = 0; i < 850; i++) {
    const u = pow(random(), 0.55);
    const a = random(TWO_PI);
    const rr = innerR * lerp(0.55, 1.25, u);

    const x = cx + cos(a) * rr;
    const y = cy + sin(a) * rr * 0.92;

    const n = noise(x * 0.02 + 100, y * 0.02 + 200, t * 0.8);
    const s = 0.6 + 2.0 * n;
    const alpha = 4 + 15 * (1 - u) * n;

    fill(210, 210, 210, alpha * 0.10);
    circle(x, y, s * 6.8);

    fill(180, 180, 180, alpha * 0.35);
    circle(x, y, s);
  }

  pop();
}

function paintFilamentRings(cx, cy, r0, r1, t, disturb) {
  g.push();
  g.blendMode(BLEND);
  g.noFill();

  const rings = 3;
  const steps = 220;

  for (let k = 0; k < rings; k++) {
    const frac = k / (rings - 1);
    const rrBase = lerp(r0, r1, frac);

    g.stroke(205, 205, 205, 18 + 10 * (1 - frac));
    g.strokeWeight(2.0 - frac * 0.5);
    filamentPath(cx, cy, rrBase, t, k, steps, 1.0, disturb);

    g.stroke(235, 235, 235, 20 + 10 * (1 - frac));
    g.strokeWeight(1.0);
    filamentPath(cx, cy, rrBase, t, k, steps, 0.65, disturb);
  }

  g.pop();
}

function filamentPath(cx, cy, rrBase, t, k, steps, jitterScale, disturb) {
  const wob = 1.0 + sin(t * 0.85 + k * 0.7) * 0.018;

  g.beginShape();
  for (let i = 0; i <= steps; i++) {
    const ang = (TWO_PI * i) / steps;

    const n = noise(
      cos(ang) * 1.15 + 600 + k * 19.7,
      sin(ang) * 1.15 + 900 + k * 19.7,
      t * 0.08
    );

    const j = (n - 0.5) * (16 * jitterScale) * (0.75 + 0.6 * disturb);
    const rr = (rrBase + j) * wob;

    const x = cx + cos(ang) * rr;
    const y = cy + sin(ang) * rr * 0.94;

    g.curveVertex(x, y);
  }
  g.endShape();
}

function smoothstep(edge0, edge1, x) {
  const t = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  g = createGraphics(windowWidth, windowHeight);
  g.pixelDensity(1);
  g.clear();
}
