// ========================
// F1 Véhicule - Main JS
// ========================

// --- Hamburger menu ---
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    })
  );
}

// --- Active nav link ---
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPage) a.classList.add('active');
});

// --- Animate on scroll ---
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.service-card, .sav-card, .about-grid, .contact-detail')
  .forEach(el => { el.classList.add('fade-up'); observer.observe(el); });

// Inject fade-up CSS once
const styleEl = document.createElement('style');
styleEl.textContent = `
  .fade-up { opacity: 0; transform: translateY(28px); transition: opacity .5s ease, transform .5s ease; }
  .fade-up.visible { opacity: 1; transform: none; }
`;
document.head.appendChild(styleEl);

// --- RDV Form submission ---
const rdvForm = document.getElementById('rdv-form');
if (rdvForm) {
  rdvForm.addEventListener('submit', e => {
    e.preventDefault();
    const success = document.getElementById('form-success');
    if (success) { success.style.display = 'block'; }
    rdvForm.reset();
    setTimeout(() => { if (success) success.style.display = 'none'; }, 6000);
  });
}

// --- Counter animation ---
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1400;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current) + (el.dataset.suffix || '');
  }, 16);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-target]').forEach(animateCounter);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
const statsBar = document.querySelector('.stats-bar');
if (statsBar) counterObserver.observe(statsBar);
