// UI micro-interactions: ripple on clickable elements and subtle focus outlines
(function(){
  function createRipple(e){
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    const left = e.clientX - rect.left - size/2;
    const top = e.clientY - rect.top - size/2;
    r.style.left = left + 'px';
    r.style.top = top + 'px';
    btn.appendChild(r);
    setTimeout(()=> r.remove(), 650);
  }

  function attachRipples(selector){
    document.querySelectorAll(selector).forEach(el => {
      el.style.position = getComputedStyle(el).position === 'static' ? 'relative' : el.style.position;
      el.addEventListener('click', createRipple);
    });
  }

  // Attach after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attachRipples('.btn-primary, .btn-secondary, .zone-card, .carousel-dot');
    });
  } else {
    attachRipples('.btn-primary, .btn-secondary, .zone-card, .carousel-dot');
  }

  // Keyboard focus ring improvement
  document.addEventListener('keydown', function(e){
    if (e.key === 'Tab') document.documentElement.classList.add('user-is-tabbing');
  });
})();
