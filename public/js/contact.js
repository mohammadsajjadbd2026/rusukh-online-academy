function submitContact(e) {
  e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = 'পাঠানো হচ্ছে...';
  setTimeout(() => { showToast('আপনার মেসেজ সফলভাবে পাঠানো হয়েছে! ✅'); e.target.reset(); btn.disabled = false; btn.textContent = 'মেসেজ পাঠান ✉️'; }, 1000);
}
