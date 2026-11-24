// coordinates reference the 1672 × 941 artwork. Only the fabric is redrawn.
const FLAGS = [
  { left: 1572, right: 1672, top: 264, bottom: 369, amplitude: 7 },
  { left: 1468, right: 1554, top: 378, bottom: 471, amplitude: 5 },
];

export function animateLandingFlags(canvas, layer, isOpen = () => layer.classList.contains('open')) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const picture = new Image();
  let visible = false;
  let frame = 0;
  let lastDraw = 0;

  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (now - lastDraw < 42) return;
    lastDraw = now;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const { left, right, top, bottom, amplitude } of FLAGS) {
      for (let x = left; x < right; x += 2) {
        const along = (x - left) / (right - left);
        const offset = Math.sin(now / 610 - along * 7) * amplitude * along;
        // Blend back into the original picture above and below the flag.
        for (let y = top; y < bottom; y += 4) {
          const edge = Math.min(1, (y - top) / 13, (bottom - y) / 13);
          context.drawImage(picture, x, y - offset * edge, 2, 4, x, y, 2, 4);
        }
      }
    }
  }

  function sync() {
    const active = visible && isOpen() && !motion.matches
      && !document.hidden && picture.complete && picture.naturalWidth === canvas.width;
    if (active && !frame) frame = requestAnimationFrame(draw);
    if (!active && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Size the fixed overlay to the background's scrollport, excluding the scrollbar.
  const fit = () => {
    if (!layer.clientWidth || !layer.clientHeight) return;
    canvas.style.width = `${layer.clientWidth}px`;
    canvas.style.height = `${layer.clientHeight}px`;
  };
  new ResizeObserver(fit).observe(layer);
  fit();

  picture.onload = sync;
  picture.src = '/images/clan-background-v1.jpg';
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(canvas);
  const stateObserver = new MutationObserver(sync);
  stateObserver.observe(layer, { attributes: true, attributeFilter: ['class'] });
  if (layer === document.documentElement) {
    stateObserver.observe(document.querySelector('#memberAuthLayer'), { attributes: true, attributeFilter: ['class'] });
  }
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
}
