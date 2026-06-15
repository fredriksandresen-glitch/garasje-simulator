let noGoZoneTimer = 0;

function noGoToggleValue(label) {
  const toggle = [...document.querySelectorAll('.toggle')].find((item) => item.textContent.toLowerCase().includes(label.toLowerCase()));
  return Boolean(toggle?.querySelector('input')?.checked);
}

function noGoIntersects(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function noGoPointInside(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function noGoHitsBlock(containerRect, blockRect) {
  const points = [
    { x: containerRect.left, y: containerRect.top },
    { x: containerRect.right, y: containerRect.top },
    { x: containerRect.left, y: containerRect.bottom },
    { x: containerRect.right, y: containerRect.bottom },
    { x: containerRect.left + containerRect.width / 2, y: containerRect.top + containerRect.height / 2 }
  ];
  return noGoIntersects(containerRect, blockRect) || points.some((point) => noGoPointInside(point, blockRect));
}

function noGoApply() {
  const includePink = noGoToggleValue('rosa felt');
  document.body.classList.toggle('waste-viz-pink-included', includePink);

  const excludedBlocks = [...document.querySelectorAll('.blocked.excluded')]
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  const containers = [...document.querySelectorAll('.waste-viz-container')];
  containers.forEach((container) => container.classList.remove('waste-viz-in-no-go'));

  containers.forEach((container) => {
    const rect = container.getBoundingClientRect();
    const blocked = excludedBlocks.some((block) => noGoHitsBlock(rect, block));
    container.classList.toggle('waste-viz-in-no-go', blocked);
  });
}

function noGoSchedule() {
  clearTimeout(noGoZoneTimer);
  noGoZoneTimer = setTimeout(() => {
    noGoApply();
    setTimeout(noGoApply, 160);
    setTimeout(noGoApply, 360);
  }, 120);
}

function noGoStyle() {
  if (document.getElementById('waste-viz-no-go-style')) return;
  const style = document.createElement('style');
  style.id = 'waste-viz-no-go-style';
  style.textContent = `body:not(.waste-viz-pink-included) .plan-room.lager2::before{display:none!important}.waste-viz-container.waste-viz-in-no-go{display:none!important;visibility:hidden!important}.extension-label{top:0!important;right:0!important;width:34.2%!important;height:14.7%!important;max-width:none!important;display:grid!important;place-items:center!important;text-align:center!important;border-color:#c53baa!important;background:rgba(235,0,196,.22)!important;border-radius:0!important;border-bottom:1px dashed #b1369d!important;color:#732065!important;line-height:1.22!important}.blocked.excluded{background:rgba(255,230,0,.82)!important}.blocked.included{background:rgba(234,244,132,.56)!important}`;
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