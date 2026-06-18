let noGoZoneTimer = 0;

const noGoContainerDimensions = [
  { match: (text) => text.includes("20"), label: "Utvendige mål: 6.06 x 2.44 x 2.40 m" },
  { match: (text) => text.includes("15") && text.includes("half"), label: "Utvendige mål: 4.55 x 2.33 x 0.99 m" },
  { match: (text) => text.includes("15"), label: "Utvendige mål: 4.55 x 2.33 x 2.40 m" },
  { match: (text) => text.includes("10") && text.includes("half"), label: "Utvendige mål: 2.99 x 2.44 x 0.99 m" },
  { match: (text) => text.includes("10"), label: "Utvendige mål: 2.99 x 2.44 x 2.40 m" }
];

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

function noGoAnnotateContainerButtons() {
  const firstSegments = document.querySelector('.segments');
  if (!firstSegments) return;

  firstSegments.querySelectorAll('button').forEach((button) => {
    const text = (button.textContent || '').toLowerCase();
    const match = noGoContainerDimensions.find((item) => item.match(text));
    if (!match) return;
    button.setAttribute('title', match.label);
    button.setAttribute('data-container-dim', match.label);
  });
}

function noGoApply() {
  noGoAnnotateContainerButtons();

  const excludedBlocks = [...document.querySelectorAll('.blocked.excluded, .extension-label.excluded')]
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
  style.textContent = `.plan-room.lager2::before{display:none!important}.waste-viz-container.waste-viz-in-no-go{display:none!important;visibility:hidden!important}.blocked-l2{height:35.25%!important}.extension-label{top:0!important;right:0!important;width:34.2%!important;height:14.7%!important;max-width:none!important;display:grid!important;place-items:center!important;text-align:center!important;border-radius:0!important;line-height:1.22!important}.extension-label.included{border:1px solid #8f4d83!important;border-bottom:1px dashed #8f4d83!important;background:rgba(235,0,196,.22)!important;color:#732065!important}.extension-label.excluded{border:1px solid #c53baa!important;border-bottom:1px dashed #b1369d!important;background:rgba(235,0,196,.34)!important;color:#732065!important}.blocked.excluded{background:rgba(255,230,0,.82)!important}.blocked.included{background:rgba(234,244,132,.56)!important}.segments:first-of-type button[data-container-dim]{position:relative}.segments:first-of-type button[data-container-dim]::after{content:attr(data-container-dim);position:absolute;left:50%;bottom:calc(100% + 8px);z-index:80;width:max-content;max-width:230px;transform:translateX(-50%) translateY(3px);padding:7px 9px;border:1px solid #bfc8c0;border-radius:7px;background:#fff;color:#223027;box-shadow:0 12px 28px rgba(24,33,29,.18);font-size:.76rem;font-weight:750;line-height:1.25;white-space:normal;text-align:center;opacity:0;pointer-events:none;transition:opacity .14s ease,transform .14s ease}.segments:first-of-type button[data-container-dim]:hover::after,.segments:first-of-type button[data-container-dim]:focus::after{opacity:1;transform:translateX(-50%) translateY(0)}`;
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