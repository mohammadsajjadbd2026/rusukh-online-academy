const API = '';
function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function setAuth(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); updateAuthUI(); }
function clearAuth() { localStorage.removeItem('token'); localStorage.removeItem('user'); updateAuthUI(); }
function logout() { clearAuth(); showToast('লগআউট সফল!'); setTimeout(() => window.location.href = '/', 500); }
function authHeaders() { const t = getToken(); return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

function updateAuthUI() {
  const user = getUser(), ab = document.getElementById('authButtons'), um = document.getElementById('userMenu'), un = document.getElementById('userName');
  if (user && ab && um) { ab.style.display = 'none'; um.style.display = 'flex'; um.style.alignItems = 'center'; um.style.gap = '12px'; if (un) un.textContent = user.name; }
  else if (ab && um) { ab.style.display = 'block'; um.style.display = 'none'; }
}

async function updateCartBadge() {
  const badge = document.getElementById('cartBadge'); if (!badge || !getToken()) { if(badge) badge.classList.remove('show'); return; }
  try { const res = await fetch(`${API}/api/cart`, { headers: authHeaders() }); if (res.ok) { const d = await res.json(); const c = d.items.reduce((s, i) => s + i.quantity, 0); if (c > 0) { badge.textContent = c; badge.classList.add('show'); } else badge.classList.remove('show'); } } catch(e) {}
}

function showToast(msg, type = 'success') { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.className = `toast ${type} show`; setTimeout(() => t.classList.remove('show'), 3000); }
function toggleMobileMenu() { const l = document.getElementById('navLinks'), a = document.getElementById('navActions'); if(l) l.classList.toggle('open'); if(a) a.classList.toggle('open'); }
window.addEventListener('scroll', () => { const n = document.getElementById('navbar'); if(n) n.classList.toggle('scrolled', window.scrollY > 30); });

async function addToCart(itemType, itemId) {
  if (!getToken()) { showToast('অনুগ্রহ করে প্রথমে লগইন করুন', 'error'); setTimeout(() => window.location.href = '/login.html', 1000); return; }
  try { const res = await fetch(`${API}/api/cart`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ item_type: itemType, item_id: itemId }) }); const d = await res.json(); if (res.ok) { showToast(d.message || 'কার্টে যোগ হয়েছে!'); updateCartBadge(); } else showToast(d.error || 'ত্রুটি', 'error'); } catch(e) { showToast('সার্ভারে সমস্যা', 'error'); }
}

function renderCourseCard(c) {
  const icons = ['🕌','📖','🎓','⭐','🌙','📚']; const icon = icons[c.id % icons.length];
  return `<div class="product-card"><div class="product-card-image">${icon}<span class="product-card-badge">${c.category||'কোর্স'}</span></div><div class="product-card-body"><h3 class="product-card-title">${c.title}</h3><p class="product-card-author">👨‍🏫 ${c.instructor}</p><p class="product-card-desc">${c.description||''}</p><div class="product-card-meta"><span>📅 ${c.duration||''}</span><span>📝 ${c.lessons||0} লেসন</span><span>👥 ${c.enrolled||0} জন</span></div><div class="product-card-footer"><div class="product-price"><span class="product-price-amount">৳${c.price}</span><span class="product-price-currency">BDT</span></div><button class="btn btn-primary btn-sm" onclick="addToCart('course',${c.id})">কার্টে যোগ করুন</button></div></div></div>`;
}

function renderBookCard(b) {
  const icons = ['📕','📗','📘','📙','📓','📔']; const icon = icons[b.id % icons.length];
  return `<div class="product-card"><div class="product-card-image">${icon}<span class="product-card-badge">${b.category||'বই'}</span></div><div class="product-card-body"><h3 class="product-card-title">${b.title}</h3><p class="product-card-author">✍️ ${b.author}</p><p class="product-card-desc">${b.description||''}</p><div class="product-card-meta"><span>📄 ${b.pages||0} পৃষ্ঠা</span><span>🗣️ ${b.language||'বাংলা'}</span></div><div class="product-card-footer"><div class="product-price"><span class="product-price-amount">৳${b.price}</span><span class="product-price-currency">BDT</span></div><button class="btn btn-primary btn-sm" onclick="addToCart('book',${b.id})">কার্টে যোগ করুন</button></div></div></div>`;
}

document.addEventListener('DOMContentLoaded', () => { updateAuthUI(); updateCartBadge(); });
