document.addEventListener('DOMContentLoaded', () => loadCourses());
async function loadCourses(category='', search='') {
  const g = document.getElementById('courseGrid'); g.innerHTML = '<div class="spinner"></div>';
  try { let url = `${API}/api/courses?`; if(category) url+=`category=${encodeURIComponent(category)}&`; if(search) url+=`search=${encodeURIComponent(search)}&`;
    const d = (await (await fetch(url)).json()).courses||[];
    g.innerHTML = d.length > 0 ? d.map(renderCourseCard).join('') : '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🔍</div><h3>কোনো কোর্স পাওয়া যায়নি</h3></div>';
  } catch(e) { g.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;">লোড করতে সমস্যা</p>'; }
}
function filterCourses(cat) { document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); if((cat===''&&b.textContent==='সব')||b.textContent===cat) b.classList.add('active'); }); loadCourses(cat, document.getElementById('courseSearch')?.value||''); }
function searchCourses(q) { const a = document.querySelector('.filter-btn.active'); loadCourses(a&&a.textContent!=='সব'?a.textContent:'', q); }
