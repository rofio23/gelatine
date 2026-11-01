
class SlimeRenderer {
  constructor(canvas, physics) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.physics = physics;

    this.width = 0;
    this.height = 0;
    this.dpr = 1;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    this.ctx.setTransform(
      this.dpr, 0, 0, this.dpr, 0, 0
    );
  }

  path() {
    const ctx = this.ctx;
    const points = this.physics.points;

    if (!points.length) return;

    const n = points.length;

    ctx.beginPath();

    const first = points[0];
    const last = points[n - 1];

    ctx.moveTo(
      (first.x + last.x) / 2,
      (first.y + last.y) / 2
    );

    for (let i = 0; i < n; i++) {
      const p = points[i];
      const next = points[(i + 1) % n];

      const mx = (p.x + next.x) / 2;
      const my = (p.y + next.y) / 2;

      ctx.quadraticCurveTo(p.x, p.y, mx, my);
    }

    ctx.closePath();
  }

  drawShadow() {
    const ctx = this.ctx;

    ctx.save();

    ctx.translate(8, 19);

    ctx.shadowColor = "rgba(30, 58, 70, 0.35)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 13;

    this.path();

    ctx.fillStyle = "rgba(32, 77, 93, 0.16)";
    ctx.fill();

    ctx.restore();
  }

  drawBody() {
    const ctx = this.ctx;
    const p = this.physics;

    ctx.save();

    this.path();

    // Gel translucide
    const gradient = ctx.createRadialGradient(
      p.cx - p.rx * 0.3,
      p.cy - p.ry * 0.45,
      10,
      p.cx,
      p.cy,
      Math.max(p.rx, p.ry) * 1.3
    );

    gradient.addColorStop(
      0, "rgba(190, 250, 255, 0.76)"
    );
    gradient.addColorStop(
      0.28, "rgba(62, 208, 255, 0.76)"
    );
    gradient.addColorStop(
      0.68, "rgba(0, 148, 239, 0.82)"
    );
    gradient.addColorStop(
      1, "rgba(0, 78, 183, 0.88)"
    );

    ctx.fillStyle = gradient;
    ctx.fill();

    // Liseré lumineux
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(170, 246, 255, 0.58)";
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(230, 255, 255, 0.65)";
    ctx.stroke();

    ctx.clip();

    this.drawDepth();
    this.drawBubbles();
    this.drawHighlights();

    ctx.restore();
  }

  drawDepth() {
    const ctx = this.ctx;
    const p = this.physics;

    const glow = ctx.createRadialGradient(
      p.cx - p.rx * 0.2,
      p.cy - p.ry * 0.4,
      0,
      p.cx,
      p.cy,
      p.rx
    );

    glow.addColorStop(
      0, "rgba(235,255,255,0.38)"
    );
    glow.addColorStop(
      0.5, "rgba(125,238,255,0.08)"
    );
    glow.addColorStop(
      1, "rgba(0,55,170,0.28)"
    );

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.height);

    // Lignes internes très subtiles
    for (let i = 0; i < 5; i++) {
      const phase = p.time * 0.6 + i * 1.3;

      ctx.beginPath();

      const y =
        p.cy - p.ry * 0.4 + i * p.ry * 0.22;

      ctx.moveTo(p.cx - p.rx, y);

      ctx.bezierCurveTo(
        p.cx - p.rx * 0.3,
        y + Math.sin(phase) * 15,
        p.cx + p.rx * 0.2,
        y - Math.cos(phase) * 17,
        p.cx + p.rx,
        y + Math.sin(phase + 2) * 8
      );

      ctx.strokeStyle = "rgba(225,255,255,0.065)";
      ctx.lineWidth = 9;
      ctx.stroke();
    }
  }

  drawBubbles() {
    const ctx = this.ctx;
    const p = this.physics;

    for (const b of p.bubbles) {
      const drift =
        Math.sin(p.time * b.speed + b.phase);

      const x =
        p.cx + b.u * p.rx * 0.86 + drift * 5;

      const y =
        p.cy + b.v * p.ry * 0.86 +
        Math.cos(p.time + b.phase) * 4;

      const r = b.size;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      const g = ctx.createRadialGradient(
        x - r * 0.35,
        y - r * 0.35,
        0,
        x, y, r
      );

      g.addColorStop(
        0, "rgba(255,255,255,0.33)"
      );
      g.addColorStop(
        0.65, "rgba(200,250,255,0.05)"
      );
      g.addColorStop(
        1, "rgba(0,70,160,0.24)"
      );

      ctx.fillStyle = g;
      ctx.fill();

      ctx.strokeStyle = "rgba(230,255,255,0.25)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Reflet sur la bulle
      ctx.beginPath();
      ctx.arc(
        x - r * 0.3,
        y - r * 0.3,
        Math.max(0.7, r * 0.18),
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.fill();
    }
  }

  drawHighlights() {
    const ctx = this.ctx;
    const p = this.physics;

    ctx.save();

    ctx.translate(
      p.cx - p.rx * 0.24,
      p.cy - p.ry * 0.43
    );

    ctx.rotate(-0.17);

    const shine = ctx.createRadialGradient(
      0, 0, 5,
      0, 0, p.rx * 0.65
    );

    shine.addColorStop(
      0, "rgba(255,255,255,0.50)"
    );
    shine.addColorStop(
      0.45, "rgba(230,255,255,0.15)"
    );
    shine.addColorStop(
      1, "rgba(255,255,255,0)"
    );

    ctx.scale(1, 0.43);

    ctx.beginPath();
    ctx.arc(0, 0, p.rx * 0.65, 0, Math.PI * 2);

    ctx.fillStyle = shine;
    ctx.fill();

    ctx.restore();

    // Reflet blanc courbé
    ctx.beginPath();

    ctx.ellipse(
      p.cx - p.rx * 0.30,
      p.cy - p.ry * 0.48,
      p.rx * 0.23,
      p.ry * 0.065,
      -0.15,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "rgba(255,255,255,0.31)";
    ctx.fill();
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(
      0, 0, this.width, this.height
    );

    this.drawShadow();
    this.drawBody();
  }
}

window.SlimeRenderer = SlimeRenderer;
