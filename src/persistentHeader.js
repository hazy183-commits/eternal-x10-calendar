const header = document.querySelector('.topbar');
if (header) {
  const updateHeight = () => {
    const height = Math.ceil(header.getBoundingClientRect().height);
    if (height > 0) document.documentElement.style.setProperty('--site-header-height', `${height}px`);
  };
  new ResizeObserver(updateHeight).observe(header);
  updateHeight();
  header.addEventListener('click', (event) => {
    if (event.target.closest('#adminTrigger')) document.querySelector('#memberZoneLayer')?.classList.remove('open');
    if (event.target.closest('.member-auth-entry:not(.logout), .main-nav a[href="#top"], .brand')) {
      const admin = document.querySelector('#adminModal');
      admin?.classList.remove('open');
      admin?.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('admin-modal-open');
    }
    if (event.target.closest('.main-nav a[href="#top"], .brand')) document.querySelector('#memberZoneLayer')?.classList.remove('open');
  }, true);
}
