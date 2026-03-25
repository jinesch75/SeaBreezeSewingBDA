# Sea Breeze Sewing BDA — Website

A beautiful, handcrafted website for Sea Breeze Sewing BDA, built in the spirit of Bermuda.

---

## 🚀 How to Run the Website

### Requirements
- [Node.js](https://nodejs.org) (version 16 or higher) — download and install it for free

### Steps

1. **Open a terminal / command prompt** in this folder.

2. **Install the required packages** (only needed once):
   ```
   npm install
   ```

3. **Start the website**:
   ```
   npm start
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

That's it! Your website is running.

---

## 🔐 Admin Panel

Access the admin panel at: `http://localhost:3000/admin.html`

**Default password:** `seabreeze2024`

> ⚠️ **Important:** Change your admin password before making the website public!
> Open `server.js` in any text editor and change this line near the top:
> ```js
> const ADMIN_PASSWORD = 'seabreeze2024';
> ```

### What you can do in the admin panel:
- **Upload new designs** — add a photo, title, description, category
- **Feature designs** on the homepage (★ button)
- **Delete designs** you no longer want to show
- **View purchase inquiries** from visitors — reply to them by email

---

## 📁 File Structure

```
SeaBreezeSewingBDA Webpage/
├── server.js          ← The website server (run this with npm start)
├── package.json       ← Dependencies list
├── data/
│   ├── designs.json   ← Your designs are stored here
│   └── contacts.json  ← Visitor inquiries are stored here
└── public/
    ├── index.html     ← Home page
    ├── designs.html   ← Designs gallery
    ├── about.html     ← About page
    ├── contact.html   ← Contact page
    ├── admin.html     ← Admin panel
    ├── css/
    │   └── style.css  ← All styles
    ├── js/
    │   ├── main.js    ← Shared JavaScript
    │   └── admin.js   ← Admin panel JavaScript
    └── images/
        └── uploads/   ← Your uploaded design photos go here
```

---

## 🌐 Hosting Online (Optional)

To make your website accessible to everyone on the internet, you can host it on a free platform like [Railway](https://railway.app) or [Render](https://render.com). Both support Node.js websites for free.

---

## 📧 Contact Email

The contact email is set to `brosiusjacques@gmail.com` in the website pages.
To change it, search for that email in the HTML files and replace it.

---

*Made with 🧵 in Bermuda*
