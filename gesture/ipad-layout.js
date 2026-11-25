const site = document.querySelector('.site');
function fitCanvas() {
  const scale = Math.min(window.innerWidth / 1366, window.innerHeight / 1024);
  site.style.transform = 'scale(' + scale + ')';
  site.style.left = Math.max(0, (window.innerWidth - 1366 * scale) / 2) + 'px';
  document.body.style.height = 1024 * scale + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
