document.addEventListener('DOMContentLoaded', () => loadBooks());
async function loadBooks(category='', search='') {
  const g = document.getElementById('bookGrid'); g.innerHTML = '<div class="spinner"></div>';
  try { let url = `${API}/api/books?`; if(category) url+=`category=${encodeURIComponent(category)}&`; if(search) url+=`search=${encodeURIComponent(search)}&`;
    const d = (await (await fetch(url)).json()).books||[];
    g.innerHTML = d.length > 0 ? d.map(renderBookCard).join('') : '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🔍</div><h3>কোনো বই পাওয়া যায়নি</h3></div>';
  } catch(e) { g.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;">লোড করতে সমস্যা</p>'; }
}
function filterBooks(cat) { document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); if((cat===''&&b.textContent==='সব')||b.textContent===cat) b.classList.add('active'); }); loadBooks(cat, document.getElementById('bookSearch')?.value||''); }
function searchBooks(q) { const a = document.querySelector('.filter-btn.active'); loadBooks(a&&a.textContent!=='সব'?a.textContent:'', q); }
