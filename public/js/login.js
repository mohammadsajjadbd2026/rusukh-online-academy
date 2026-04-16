function toggleForm(f) { document.getElementById('loginForm').style.display = f==='register'?'none':'block'; document.getElementById('registerForm').style.display = f==='register'?'block':'none'; }
async function handleLogin(e) {
  e.preventDefault(); const btn=document.getElementById('loginBtn'); btn.disabled=true; btn.textContent='লগইন হচ্ছে...';
  try { const res=await fetch(`${API}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('loginEmail').value,password:document.getElementById('loginPassword').value})}); const d=await res.json();
    if(res.ok){setAuth(d.token,d.user);showToast('লগইন সফল! 🎉');setTimeout(()=>window.location.href='/',800);}
    else{showToast(d.error||'লগইনে সমস্যা','error');btn.disabled=false;btn.textContent='লগইন →';}
  }catch(e){showToast('সার্ভারে সমস্যা','error');btn.disabled=false;btn.textContent='লগইন →';}
}
async function handleRegister(e) {
  e.preventDefault(); const btn=document.getElementById('regBtn'); btn.disabled=true; btn.textContent='রেজিস্টার হচ্ছে...';
  try { const res=await fetch(`${API}/api/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('regName').value,email:document.getElementById('regEmail').value,password:document.getElementById('regPassword').value})}); const d=await res.json();
    if(res.ok){setAuth(d.token,d.user);showToast('অ্যাকাউন্ট তৈরি হয়েছে! 🎉');setTimeout(()=>window.location.href='/',800);}
    else{showToast(d.error||'সমস্যা','error');btn.disabled=false;btn.textContent='রেজিস্টার করুন →';}
  }catch(e){showToast('সার্ভারে সমস্যা','error');btn.disabled=false;btn.textContent='রেজিস্টার করুন →';}
}
document.addEventListener('DOMContentLoaded', () => { if(getToken()) window.location.href='/'; });
