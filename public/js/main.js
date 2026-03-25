/* ============================================================
   Sea Breeze Sewing BDA — Main Frontend JS
   Shared across all public pages
   ============================================================ */

// ── Navigation scroll effect ──────────────────────────────
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── Hamburger menu ────────────────────────────────────────
function toggleMenu() {
  const links = document.getElementById('navLinks');
  const hamburger = document.getElementById('hamburger');
  if (!links) return;
  const open = links.classList.toggle('open');
  hamburger.style.opacity = open ? '0.6' : '1';
  document.body.style.overflow = open ? 'hidden' : '';
}
// Close menu on link click
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('#navLinks a');
  links.forEach(l => l.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.remove('open');
    document.body.style.overflow = '';
  }));
});

// ── Toast notification ────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── Design card renderer (shared across pages) ───────────
function renderCard(design) {
  return `
    <div class="design-card" data-id="${design.id}">
      <div class="design-card-img">
        <img src="${design.image}" alt="${escHtml(design.title)}" loading="lazy"
          onerror="this.style.display='none'">
        ${design.featured ? '<div class="design-card-badge">New</div>' : ''}
      </div>
      <div class="design-card-body">
        <div class="design-card-category">${escHtml(design.category || 'Design')}</div>
        <h3>${escHtml(design.title)}</h3>
        <p>${escHtml(design.description || '')}</p>
        <button class="btn btn-coral" onclick="openInterestModal('${escAttr(design.title)}')">
          I'm Interested
        </button>
      </div>
    </div>`;
}

// ── Interest modal ────────────────────────────────────────
function openInterestModal(itemTitle) {
  const modal   = document.getElementById('interestModal');
  const nameEl  = document.getElementById('modalItemName');
  const inputEl = document.getElementById('modalItemInput');
  if (!modal) return;

  if (nameEl)  nameEl.textContent = itemTitle;
  if (inputEl) inputEl.value      = itemTitle;

  // Reset form + success state
  const form    = document.getElementById('modalContactForm');
  const success = document.getElementById('modalSuccess');
  if (form)    { form.style.display    = ''; form.reset(); }
  if (success) { success.style.display = 'none'; }
  if (inputEl) inputEl.value = itemTitle; // re-set after reset

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('interestModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target?.classList?.contains('modal-overlay')) closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ── Modal form submission ─────────────────────────────────
document.addEventListener('submit', async (e) => {
  if (e.target?.id !== 'modalContactForm') return;
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Sending...';

  const data = {
    name:    form.querySelector('[name="name"]').value,
    email:   form.querySelector('[name="email"]').value,
    phone:   form.querySelector('[name="phone"]')?.value || '',
    item:    document.getElementById('modalItemInput')?.value || 'Unknown item',
    message: form.querySelector('[name="message"]').value
  };

  try {
    const res  = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success) {
      form.style.display = 'none';
      const success = document.getElementById('modalSuccess');
      if (success) success.style.display = 'block';
    } else {
      showToast(json.error || 'Something went wrong. Please try again.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Send My Interest';
    }
  } catch {
    showToast('Unable to send. Please try again.', 'error');
    btn.disabled    = false;
    btn.textContent = 'Send My Interest';
  }
});

// ── Helpers ───────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return iso; }
}
