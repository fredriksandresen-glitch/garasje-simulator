let noGoZoneTimer = 0;

function noGoToggleValue(label) {
  const toggle = [...document.querySelectorAll('.toggle')].find((item) => item.textContent.toLowerCase().includes(label.toLowerCase()));
  return Boolean(toggle?.querySelector('input')?.checked);
}

function noGoIntersects(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function noGoApply() {
  const includePink = noGoToggleValue('rosa felt');
  document.body.classList.toggle('waste-viz-pink-included', includePink);

  const excludedBlocks = [...document.querySelectorAll('.blocked.excluded')].map((node) => node.getBoundingClientRect());
  document.querySelectorAll('.waste-viz-container').forEach((container) => {
    const rect = container.getBoundingClientRect();
    const blocked = excludedBlocks.some((block) => noGoIntersects(rect, block));
    container.classList.toggle('waste-viz-in-no-go', blocked);
  });
}

function noGoSchedule() {
  clearTimeout(noGoZoneTimer);
  noGoZoneTimer = setTimeout(noGoApply, 120);
}

function noGoStyle() {
  if (document.getElementById('waste-viz-no-go-style')) return;
  const style = document.createElement('style');
  style.id = 'waste-viz-no-go-style';
  style.textContent = `body:not(.waste-viz-pink-included) .plan-room.lager2::before{display:none!important}.waste-viz-container.waste-viz-in-no-go{display:none!important}`;
  document.head.appendChild(style);
}

function noGoBoot() {
  noGoStyle();
  noGoSchedule();
  new MutationObserver(noGoSchedule).observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
  document.addEventListener('input', noGoSchedule, true);
  document.addEventListener('click', noGoSchedule, true);
  window.addEventListener('resize', noGoSchedule);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', noGoBoot);
else noGoBoot();