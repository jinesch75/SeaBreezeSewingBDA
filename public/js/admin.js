/* ============================================================
   Sea Breeze Sewing BDA — Admin Panel JS
   ============================================================ */

let activeTab = 'designs';

// ── Boot: check session ───────────────────────────────────
(async () => {
  try {
    const res  = await fetch('/admin/status');
    const json = await res.json();
    if (json.isAdmin) showAdminShell();
  } catch {}
})();

// ── Login ─────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  btn.disabled    = true;
  btn.textContent = 'Signing in...';
  errEl.style.display = 'none';

  try {
    const res  = await fetch('/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: document.getElementById('loginPassword').value })
    });
    const json = await res.json();
    if (json.success) {
      showAdminShell();
    } else {
      errEl.textContent    = json.error || 'Incorrect password.';
      errEl.style.display  = 'block';
      btn.disabled         = false;
      btn.textContent      = 'Sign In';
    }
  } catch {
    errEl.textContent   = 'Connection error. Is the server running?';
    errEl.style.display = 'block';
    btn.disabled        = false;
    btn.textContent     = 'Sign In';
  }
});

async function adminLogout() {
  await fetch('/admin/logout', { method: 'POST' });
  document.getElementById('adminShell').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
}

function showAdminShell() {
  document.getElementById('loginScreen').style.display  = 'none';
  document.getElementById('adminShell').style.display   = 'block';
  loadDesigns();
  loadContacts();
}

// ── Tabs ──────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.admin-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'designs') || (i === 1 && tab === 'inquiries'));
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
}

// ── Image preview ─────────────────────────────────────────
function previewImage(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('dropContent').style.display    = 'none';
    document.getElementById('imagePreview').style.display   = 'block';
    document.getElementById('previewImg').src               = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function clearImage() {
  document.getElementById('imageInput').value              = '';
  document.getElementById('dropContent').style.display    = '';
  document.getElementById('imagePreview').style.display   = 'none';
  document.getElementById('previewImg').src               = '';
}

// Drag & drop
const dropZone = document.getElementById('dropZone');
if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('imageInput').files = dt.files;
      previewImage(document.getElementById('imageInput'));
    }
  });
}

// ── Upload form ───────────────────────────────────────────
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = document.getElementById('uploadBtn');
  const file = document.getElementById('imageInput').files[0];

  if (!file) {
    showToast('Please select an image first.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Uploading...';

  // Animate progress bar
  const prog    = document.getElementById('uploadProgress');
  const bar     = document.getElementById('uploadProgressBar');
  prog.style.display = 'block';
  let pct = 0;
  const timer = setInterval(() => {
    pct = Math.min(pct + 8, 85);
    bar.style.width = pct + '%';
  }, 120);

  const formData = new FormData(e.target);

  try {
    const res  = await fetch('/admin/designs', { method: 'POST', body: formData });
    const json = await res.json();

    clearInterval(timer);
    bar.style.width = '100%';

    if (json.success) {
      showToast('Design uploaded successfully!', 'success');
      e.target.reset();
      clearImage();
      setTimeout(() => { prog.style.display = 'none'; bar.style.width = '0%'; }, 800);
      loadDesigns();
    } else {
      showToast(json.error || 'Upload failed. Please try again.', 'error');
    }
  } catch {
    clearInterval(timer);
    showToast('Upload error. Please try again.', 'error');
  }

  btn.disabled    = false;
  btn.textContent = 'Upload Design';
});

// ── Load designs list ─────────────────────────────────────
async function loadDesigns() {
  const list = document.getElementById('adminDesignsList');
  try {
    const res     = await fetch('/admin/designs');
    const designs = await res.json();

    const count = document.getElementById('designsCount');
    if (designs.length > 0) {
      count.textContent    = designs.length;
      count.style.display  = 'inline-block';
    } else {
      count.style.display = 'none';
    }

    if (designs.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🧵</div>
          <h3>No designs yet</h3>
          <p>Upload your first design using the form above!</p>
        </div>`;
      return;
    }

    list.innerHTML = designs.map(d => `
      <div class="admin-design-item" id="di-${d.id}">
        <img class="admin-design-thumb" src="${d.image}" alt="${escHtml(d.title)}"
          onerror="this.style.opacity='0.3'">
        <div class="admin-design-info">
          <div class="admin-design-title">${escHtml(d.title)}</div>
          <div class="admin-design-meta">
            <span class="tag">${escHtml(d.category)}</span>
            ${d.featured ? '<span class="tag featured">★ Featured</span>' : ''}
            <span>Added ${formatDate(d.createdAt)}</span>
          </div>
        </div>
        <div class="admin-design-actions">
          <button class="btn-icon btn-icon-toggle"
            title="${d.featured ? 'Unfeature' : 'Feature on homepage'}"
            onclick="toggleFeatured('${d.id}', ${!d.featured})">
            ${d.featured ? '★' : '☆'}
          </button>
          <button class="btn-icon btn-icon-delete"
            title="Delete design"
            onclick="deleteDesign('${d.id}', '${escAttr(d.title)}')">
            🗑
          </button>
        </div>
      </div>`).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--text-mid);padding:20px">Failed to load designs.</p>';
  }
}

async function toggleFeatured(id, featured) {
  try {
    await fetch(`/admin/designs/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ featured })
    });
    showToast(featured ? 'Design featured on homepage!' : 'Design removed from homepage.', 'success');
    loadDesigns();
  } catch {
    showToast('Could not update design.', 'error');
  }
}

async function deleteDesign(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`/admin/designs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Design deleted.', 'success');
      loadDesigns();
    }
  } catch {
    showToast('Could not delete design.', 'error');
  }
}

// ── Load contacts ─────────────────────────────────────────
async function loadContacts() {
  const list = document.getElementById('adminContactsList');
  try {
    const res      = await fetch('/admin/contacts');
    const contacts = await res.json();

    const unread = contacts.filter(c => !c.read).length;
    const count  = document.getElementById('inquiriesCount');
    if (unread > 0) {
      count.textContent   = unread;
      count.style.display = 'inline-block';
    } else {
      count.style.display = 'none';
    }

    if (contacts.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✉️</div>
          <h3>No inquiries yet</h3>
          <p>When visitors send you a message, it will appear here.</p>
        </div>`;
      return;
    }

    list.innerHTML = contacts.map(c => `
      <div class="contact-inquiry ${c.read ? '' : 'unread'}" id="ci-${c.id}">
        <div class="inquiry-header">
          <div>
            <div class="inquiry-name">${escHtml(c.name)}</div>
            <div class="inquiry-meta">
              <a href="mailto:${escAttr(c.email)}" style="color:var(--turquoise)">${escHtml(c.email)}</a>
              ${c.phone ? ` · ${escHtml(c.phone)}` : ''}
              · ${formatDate(c.createdAt)}
            </div>
          </div>
          <div class="inquiry-badges">
            ${!c.read ? '<span class="badge-unread">New</span>' : ''}
            ${c.item  ? `<span class="badge-item">Re: ${escHtml(c.item)}</span>` : ''}
          </div>
        </div>
        <div class="inquiry-message">${escHtml(c.message)}</div>
        <div class="inquiry-actions">
          <a href="mailto:${escAttr(c.email)}?subject=Re: ${encodeURIComponent(c.item || 'Your inquiry')}"
             class="btn-sm-outline btn">Reply by Email</a>
          ${!c.read
            ? `<button class="btn-sm-outline" onclick="markRead('${c.id}')">Mark as Read</button>`
            : ''}
          <button class="btn-sm-outline btn-sm-delete" onclick="deleteContact('${c.id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--text-mid);padding:20px">Failed to load inquiries.</p>';
  }
}

async function markRead(id) {
  try {
    await fetch(`/admin/contacts/${id}/read`, { method: 'PATCH' });
    loadContacts();
  } catch {
    showToast('Could not update inquiry.', 'error');
  }
}

async function deleteContact(id) {
  if (!confirm('Delete this inquiry? This cannot be undone.')) return;
  try {
    await fetch(`/admin/contacts/${id}`, { method: 'DELETE' });
    showToast('Inquiry deleted.', 'success');
    loadContacts();
  } catch {
    showToast('Could not delete inquiry.', 'error');
  }
}
