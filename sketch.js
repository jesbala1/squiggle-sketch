let squiggles = [];
let fragments = [];
let draggedPoint = null;
let showMessage = false;
let flashStartTime = 0;
let palette = [
  [104, 213, 95],
  [255, 237, 110],
  [255, 182, 193],
  [200, 170, 255]
];
let spacing = 40;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('squiggle-container');
  noFill();
  initSquiggles();
}

function initSquiggles() {
  squiggles = [];
  fragments = [];
  showMessage = false;

  const centerY = height / 2 - (spacing * 5) / 2;

  for (let j = 0; j < 10; j++) {
    let points = [];
    for (let t = 0; t < TWO_PI * 4; t += 0.2) {
      let baseX = map(t, 0, TWO_PI * 4, width * 0.15, width * 0.85);
      let baseY = centerY + j * spacing + cos(t * 3) * 15;
      points.push({
        x: baseX,
        y: baseY,
        baseX: baseX,
        baseY: baseY,
        vx: 0,
        vy: 0,
        offset: random(TWO_PI),
        dragging: false,
        snapped: false
      });
    }
    squiggles.push({ points, color: random(palette), active: true });
  }
}

function draw() {
  background(255);

  if (showMessage) {
    let elapsed = millis() - flashStartTime;
    textAlign(CENTER, CENTER);
    textSize(24);
    noStroke();
    fill(80);

    for (let j = 0; j < squiggles.length; j++) {
      let y = squiggles[j].points[0].baseY;
      let delayPerLine = 1000 / squiggles.length;
      let lineDuration = delayPerLine * 0.75;
      let lineStart = j * delayPerLine;
      let lineEnd = lineStart + lineDuration;
      if (elapsed > lineStart && elapsed < lineEnd) {
        text("the truth has been distorted", width / 2, y);
      }
    }

    if (elapsed > 1000) {
      showMessage = false;
      initSquiggles();
    }
    return;
  }

  let snappedCount = 0;

  noFill();
  for (let s of squiggles) {
    if (!s.active) {
      snappedCount++;
      continue;
    }

    let points = s.points;
    stroke(s.color);
    strokeWeight(7);
    beginShape();
    for (let p of points) {
      curveVertex(p.x, p.y);
    }
    endShape();

    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      let dx = p.x - p.baseX;
      let dy = p.y - p.baseY;
      let distFromOrigin = sqrt(dx * dx + dy * dy);

      if (distFromOrigin > 200 && !p.snapped) {
        p.snapped = true;
        s.active = false;
        let tearIndex = i;

        let left = points.slice(0, tearIndex).map((pt, idx) => ({
          ...pt,
          vx: 0,
          vy: random(-5, -2),
          alpha: 255,
          gravity: 0.4,
          color: s.color,
          life: 0,
          waveOffset: idx * 0.1 + random(0.1)
        }));

        let right = points.slice(tearIndex).map((pt, idx) => ({
          ...pt,
          vx: 0,
          vy: random(-5, -2),
          alpha: 255,
          gravity: 0.4,
          color: s.color,
          life: 0,
          waveOffset: idx * 0.1 + random(0.1)
        }));

        fragments.push(left, right);
        break;
      }
    }

    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      if (!p.dragging) {
        let spring = 0.05;
        let friction = 0.8;

        p.vx += (p.baseX - p.x) * spring;
        p.vy += (p.baseY - p.y) * spring;

        let swayX = sin(frameCount * 0.03 + p.offset + i) * 1.5;
        let swayY = cos(frameCount * 0.03 + p.offset + i) * 1.5;
        p.vx += swayX * 0.3;
        p.vy += swayY * 0.3;

        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx;
        p.y += p.vy;
      }
    }
  }

  noFill();
  for (let frag of fragments) {
    let fragColor = frag[0].color;
    strokeWeight(7);
    stroke(`rgb(${fragColor[0]}, ${fragColor[1]}, ${fragColor[2]})`);
    beginShape();
    for (let p of frag) {
      let wiggle = sin(p.life * 0.3 + p.waveOffset) * exp(-p.life * 0.1) * 8;
      p.vy += p.gravity || 0.4;
      p.x += p.vx + wiggle;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life += 1;
      curveVertex(p.x, p.y);
    }
    endShape();
  }

  if (
    !showMessage &&
    squiggles.every(s => !s.active) &&
    fragments.length > 0 &&
    fragments.every(f => f.every(p => p.life > 60))
  ) {
    showMessage = true;
    flashStartTime = millis();
  }
}

function mousePressed() {
  for (let s of squiggles) {
    if (!s.active) continue;
    for (let p of s.points) {
      if (dist(mouseX, mouseY, p.x, p.y) < 15) {
        p.dragging = true;
        draggedPoint = p;
        return;
      }
    }
  }
}

function mouseDragged() {
  if (draggedPoint) {
    draggedPoint.x = mouseX;
    draggedPoint.y = mouseY;
    draggedPoint.vx = 0;
    draggedPoint.vy = 0;
  }
}

function mouseReleased() {
  if (draggedPoint) {
    draggedPoint.dragging = false;
    draggedPoint = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
