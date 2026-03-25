// ============================================================
//  Sea Breeze Sewing BDA — Server
//  Built with Express.js
// ============================================================
//
//  ADMIN PASSWORD: Change this to something secure!
//  Default: seabreeze2024
//
const ADMIN_PASSWORD = 'seabreeze2024';

const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Paths ──────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const DESIGNS_FILE = path.join(DATA_DIR, 'designs.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'images', 'uploads');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Helpers ────────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Multer (image uploads) ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
            && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'), ok);
  }
});

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'sbs-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// ── Auth helper ────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ════════════════════════════════════════════════════════════
//  PUBLIC API
// ════════════════════════════════════════════════════════════

// GET all designs (sorted newest first)
app.get('/api/designs', (req, res) => {
  const designs = readJSON(DESIGNS_FILE);
  designs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(designs);
});

// GET featured designs only
app.get('/api/designs/featured', (req, res) => {
  const designs = readJSON(DESIGNS_FILE);
  const featured = designs
    .filter(d => d.featured)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  res.json(featured);
});

// POST a contact / purchase inquiry
app.post('/api/contact', (req, res) => {
  const { name, email, phone, item, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  const contacts = readJSON(CONTACTS_FILE);
  const entry = {
    id: Date.now().toString(),
    name, email,
    phone: phone || '',
    item:  item  || 'General inquiry',
    message,
    createdAt: new Date().toISOString(),
    read: false
  };
  contacts.unshift(entry);
  writeJSON(CONTACTS_FILE, contacts);
  res.json({ success: true, message: 'Thank you! Your message has been received.' });
});

// ════════════════════════════════════════════════════════════
//  ADMIN API  (all routes require session auth)
// ════════════════════════════════════════════════════════════

// POST login
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect password.' });
  }
});

// POST logout
app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET session status
app.get('/admin/status', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// GET all designs (admin — includes full data)
app.get('/admin/designs', requireAdmin, (req, res) => {
  const designs = readJSON(DESIGNS_FILE);
  designs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(designs);
});

// POST new design (with image upload)
app.post('/admin/designs', requireAdmin, upload.single('image'), (req, res) => {
  const { title, description, category, featured } = req.body;
  if (!title || !req.file) {
    return res.status(400).json({ error: 'Title and image are required.' });
  }
  const designs = readJSON(DESIGNS_FILE);
  const newDesign = {
    id:          Date.now().toString(),
    title,
    description: description || '',
    category:    category    || 'Other',
    image:       '/images/uploads/' + req.file.filename,
    featured:    featured === 'true' || featured === true,
    createdAt:   new Date().toISOString()
  };
  designs.push(newDesign);
  writeJSON(DESIGNS_FILE, designs);
  res.json({ success: true, design: newDesign });
});

// PATCH update design (title, description, category, featured)
app.patch('/admin/designs/:id', requireAdmin, (req, res) => {
  const designs = readJSON(DESIGNS_FILE);
  const idx = designs.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Design not found.' });
  const { title, description, category, featured } = req.body;
  if (title)       designs[idx].title       = title;
  if (description !== undefined) designs[idx].description = description;
  if (category)    designs[idx].category    = category;
  if (featured !== undefined) designs[idx].featured = featured === 'true' || featured === true;
  writeJSON(DESIGNS_FILE, designs);
  res.json({ success: true, design: designs[idx] });
});

// DELETE a design (also removes the image file)
app.delete('/admin/designs/:id', requireAdmin, (req, res) => {
  const designs = readJSON(DESIGNS_FILE);
  const idx = designs.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Design not found.' });
  const removed = designs.splice(idx, 1)[0];
  // Remove image file if it's an upload
  if (removed.image && removed.image.startsWith('/images/uploads/')) {
    const imgPath = path.join(__dirname, 'public', removed.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  writeJSON(DESIGNS_FILE, designs);
  res.json({ success: true });
});

// GET all contact inquiries
app.get('/admin/contacts', requireAdmin, (req, res) => {
  res.json(readJSON(CONTACTS_FILE));
});

// PATCH mark inquiry as read
app.patch('/admin/contacts/:id/read', requireAdmin, (req, res) => {
  const contacts = readJSON(CONTACTS_FILE);
  const idx = contacts.findIndex(c => c.id === req.params.id);
  if (idx !== -1) { contacts[idx].read = true; writeJSON(CONTACTS_FILE, contacts); }
  res.json({ success: true });
});

// DELETE a contact inquiry
app.delete('/admin/contacts/:id', requireAdmin, (req, res) => {
  const contacts = readJSON(CONTACTS_FILE);
  const idx = contacts.findIndex(c => c.id === req.params.id);
  if (idx !== -1) { contacts.splice(idx, 1); writeJSON(CONTACTS_FILE, contacts); }
  res.json({ success: true });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌊 Sea Breeze Sewing BDA is running!`);
  console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
