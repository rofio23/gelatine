
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("slimeCanvas");
  const hint = document.getElementById("hint");
  const resetBtn = document.getElementById("resetBtn");
  const soundBtn = document.getElementById("soundBtn");
  const elasticity = document.getElementById("elasticity");

  const physics = new SlimePhysics();
  const renderer = new SlimeRenderer(canvas, physics);

  let audioCtx = null;
  let soundEnabled = false;
  let activePointer = null;
  let lastTime = performance.now();
  let lastSound = 0;

  function resize() {
    renderer.resize();
    physics.init(
      window.innerWidth,
      window.innerHeight
    );

    physics.setElasticity(elasticity.value);
  }

  resize();

  window.addEventListener("resize", resize);

  function position(event) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  // Son synthétique doux de gel
  function playSquish() {
    if (!soundEnabled) return;

    const now = performance.now();

    if (now - lastSound < 90) return;
    lastSound = now;

    try {
      if (!audioCtx) {
        audioCtx = new (
          window.AudioContext ||
          window.webkitAudioContext
        )();
      }

      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const t = audioCtx.currentTime;
      const oscillator = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(
        170 + Math.random() * 65, t
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        75, t + 0.16
      );

      filter.type = "lowpass";
      filter.frequency.value = 430;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(
        0.045, t + 0.018
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001, t + 0.19
      );

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      oscillator.start(t);
      oscillator.stop(t + 0.2);
    } catch (error) {
      console.warn("Audio indisponible", error);
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (activePointer !== null) return;

    const pos = position(event);

    if (physics.startDrag(pos.x, pos.y)) {
      activePointer = event.pointerId;
      canvas.setPointerCapture(event.pointerId);

      hint.classList.add("hidden");
      playSquish();
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer) return;

    const pos = position(event);

    physics.moveDrag(pos.x, pos.y);

    if (Math.random() < 0.16) {
      playSquish();
    }
  });

  function release(event) {
    if (event.pointerId !== activePointer) return;

    physics.endDrag();

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    activePointer = null;
    playSquish();
  }

  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("lostpointercapture", () => {
    physics.endDrag();
    activePointer = null;
  });

  elasticity.addEventListener("input", (event) => {
    physics.setElasticity(event.target.value);
  });

  resetBtn.addEventListener("click", () => {
    physics.reset();
    playSquish();
  });

  soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
    soundBtn.setAttribute(
      "aria-label",
      soundEnabled ? "Désactiver le son" : "Activer le son"
    );

    if (soundEnabled) playSquish();
  });

  // Boucle d'animation
  function animate(time) {
    const delta = Math.min(
      (time - lastTime) / 16.6667,
      2
    );

    lastTime = time;

    physics.update(delta);
    renderer.draw();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // Pause des calculs excessifs après retour d'onglet
  document.addEventListener("visibilitychange", () => {
    lastTime = performance.now();
  });
});
