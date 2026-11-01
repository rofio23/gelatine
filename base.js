
class SlimePhysics {
  constructor() {
    this.points = [];
    this.count = 100;

    this.cx = 0;
    this.cy = 0;
    this.rx = 0;
    this.ry = 0;

    this.spring = 0.025;
    this.damping = 0.91;
    this.time = 0;

    this.dragging = false;
    this.grabIndex = -1;

    this.pointer = { x: 0, y: 0 };
    this.lastPointer = { x: 0, y: 0 };

    this.bubbles = [];
  }

  init(width, height) {
    this.width = width;
    this.height = height;

    this.cx = width / 2;
    this.cy = height * 0.49;

    // Environ 60% de largeur sur PC
    // et 85% sur téléphone.
    const mobile = width < 650;

    this.rx = width * (mobile ? 0.425 : 0.30);
    this.ry = Math.min(
      height * (mobile ? 0.235 : 0.29),
      this.rx * 0.68
    );

    this.points = [];

    for (let i = 0; i < this.count; i++) {
      const angle = i / this.count * Math.PI * 2;

      const organic =
        1 +
        Math.sin(angle * 3 + 0.4) * 0.035 +
        Math.cos(angle * 5) * 0.025;

      const x =
        this.cx + Math.cos(angle) * this.rx * organic;

      const y =
        this.cy + Math.sin(angle) * this.ry * organic;

      this.points.push({
        x, y,
        vx: 0,
        vy: 0,
        homeX: x,
        homeY: y,
        angle
      });
    }

    this.bubbles = [];

    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 0.75;

      this.bubbles.push({
        u: Math.cos(angle) * radius,
        v: Math.sin(angle) * radius,
        size: 2 + Math.random() * 9,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8
      });
    }
  }

  setElasticity(value) {
    const t = (Number(value) - 1) / 9;

    this.spring = 0.008 + t * 0.065;
    this.damping = 0.94 - t * 0.075;
  }

  startDrag(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;

    let closest = -1;
    let distance = Infinity;

    for (let i = 0; i < this.count; i++) {
      const p = this.points[i];
      const d = Math.hypot(p.x - x, p.y - y);

      if (d < distance) {
        distance = d;
        closest = i;
      }
    }

    // On peut attraper le slime depuis
    // sa surface ou près de son bord.
    const nx = (x - this.cx) / this.rx;
    const ny = (y - this.cy) / this.ry;

    const inside = nx * nx + ny * ny < 1.2;

    if (inside || distance < 70) {
      this.dragging = true;
      this.grabIndex = closest;
      this.lastPointer.x = x;
      this.lastPointer.y = y;
      this.poke(x, y, 12);
      return true;
    }

    return false;
  }

  moveDrag(x, y) {
    if (!this.dragging) return;

    const dx = x - this.lastPointer.x;
    const dy = y - this.lastPointer.y;

    this.pointer.x = x;
    this.pointer.y = y;

    const speed = Math.hypot(dx, dy);
    const influence = Math.min(1, speed / 20);

    for (let i = 0; i < this.count; i++) {
      const p = this.points[i];

      let diff = Math.abs(i - this.grabIndex);
      diff = Math.min(diff, this.count - diff);

      const weight = Math.exp(
        -(diff * diff) / (2 * 12 * 12)
      );

      p.vx += dx * weight * (0.25 + influence * 0.25);
      p.vy += dy * weight * (0.25 + influence * 0.25);
    }

    this.lastPointer.x = x;
    this.lastPointer.y = y;
  }

  endDrag() {
    this.dragging = false;
    this.grabIndex = -1;
  }

  poke(x, y, force = 15) {
    for (const p of this.points) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy);

      const weight = Math.exp(
        -(d * d) / (2 * 110 * 110)
      );

      const angle = Math.atan2(dy, dx);

      p.vx += Math.cos(angle) * force * weight;
      p.vy += Math.sin(angle) * force * weight;
    }
  }

  update(dt = 1) {
    dt = Math.min(dt, 2);
    this.time += dt * 0.016;

    const nextVelocities = [];

    for (let i = 0; i < this.count; i++) {
      const p = this.points[i];

      const prev =
        this.points[(i - 1 + this.count) % this.count];

      const next =
        this.points[(i + 1) % this.count];

      // Force de retour à la forme initiale
      let fx = (p.homeX - p.x) * this.spring;
      let fy = (p.homeY - p.y) * this.spring;

      // Cohésion entre points voisins
      const midX = (prev.x + next.x) / 2;
      const midY = (prev.y + next.y) / 2;

      fx += (midX - p.x) * 0.14;
      fy += (midY - p.y) * 0.14;

      // Micro-mouvements organiques
      const wobble =
        Math.sin(this.time * 1.7 + p.angle * 4) *
        0.025;

      fx += Math.cos(p.angle) * wobble;
      fy += Math.sin(p.angle) * wobble;

      nextVelocities.push({
        vx: (p.vx + fx * dt) * Math.pow(this.damping, dt),
        vy: (p.vy + fy * dt) * Math.pow(this.damping, dt)
      });
    }

    for (let i = 0; i < this.count; i++) {
      const p = this.points[i];
      const v = nextVelocities[i];

      p.vx = v.vx;
      p.vy = v.vy;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  reset() {
    for (const p of this.points) {
      p.vx = 0;
      p.vy = 0;
      p.x = p.homeX;
      p.y = p.homeY;
    }

    this.endDrag();
  }
}

window.SlimePhysics = SlimePhysics;
