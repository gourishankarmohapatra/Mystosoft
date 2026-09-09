/* ============================================
   MYSTOSOFT - Projects JS
   Portfolio filter and animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cards
      projectCards.forEach((card, i) => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter;

        card.style.transition = 'opacity 0.4s, transform 0.4s';
        card.style.transitionDelay = show ? (i * 0.05) + 's' : '0s';

        if (show) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px) scale(0.95)';
          setTimeout(() => { card.style.display = 'none'; }, 400);
        }
      });

      // Update count
      const countEl = document.querySelector('.projects-count');
      if (countEl) {
        const visible = filter === 'all' ? projectCards.length :
          document.querySelectorAll(`.project-card[data-category="${filter}"]`).length;
        countEl.textContent = `[ SHOWING ${visible} OF ${projectCards.length} PROJECTS ]`;
      }
    });
  });
});
