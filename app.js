(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-nav');
  const nameInput = document.querySelector('#clicker-name');
  const previewKeys = document.querySelector('#preview-keys');
  const previewObject = document.querySelector('#preview-object');
  const previewWindow = document.querySelector('.preview-window');
  const previewStatus = document.querySelector('#preview-status');
  const orderLink = document.querySelector('#order-link');
  const year = document.querySelector('#year');

  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu() {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Buka menu');
    mobileMenu.hidden = true;
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Buka menu' : 'Tutup menu');
      mobileMenu.hidden = isOpen;
    });
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1040) closeMenu(); });
  }

  const colorLabels = { orange: 'orange', blue: 'sky blue', white: 'putih', black: 'hitam' };
  const colorButtons = Array.from(document.querySelectorAll('.color-option'));

  function renderPreview() {
    if (!nameInput || !previewKeys || !previewObject || !previewWindow || !previewStatus || !orderLink) return;
    const cleanName = nameInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    if (nameInput.value !== cleanName) nameInput.value = cleanName;
    const chosenColor = colorButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.color || 'orange';
    const colorName = colorLabels[chosenColor];
    previewWindow.dataset.color = chosenColor;
    previewKeys.replaceChildren();

    if (!cleanName) {
      const placeholder = document.createElement('span');
      placeholder.className = 'preview-key preview-key-placeholder';
      placeholder.textContent = '?';
      placeholder.setAttribute('aria-hidden', 'true');
      previewKeys.appendChild(placeholder);
      previewObject.setAttribute('aria-label', 'Isi teks untuk melihat pratinjau clicker');
      previewStatus.textContent = 'Isi 1–5 huruf untuk melihat contoh.';
      orderLink.removeAttribute('href');
      orderLink.setAttribute('aria-disabled', 'true');
      orderLink.tabIndex = -1;
      return;
    }

    for (const letter of cleanName) {
      const key = document.createElement('button');
      key.className = 'preview-key';
      key.type = 'button';
      key.textContent = letter;
      key.setAttribute('aria-label', `Tekan tombol ${letter}`);
      key.addEventListener('click', () => {
        key.classList.add('pressed');
        window.setTimeout(() => key.classList.remove('pressed'), 130);
      });
      previewKeys.appendChild(key);
    }

    previewObject.setAttribute('aria-label', `Pratinjau clicker bertuliskan ${cleanName}, warna ${colorName}`);
    previewStatus.textContent = `${cleanName.length} huruf · PETG ${colorName}`;
    // Carry the quick preview into the full customizer's versioned design format.
    const design = [2, 'solid', 'round', chosenColor, 'nunito', 1,
      [...cleanName].map((letter) => ['l', letter, 'white', 'black']), ''];
    orderLink.href = `./clicker.html#desain=${encodeURIComponent(JSON.stringify(design))}`;
    orderLink.removeAttribute('aria-disabled');
    orderLink.tabIndex = 0;
  }

  if (nameInput) nameInput.addEventListener('input', renderPreview);
  colorButtons.forEach((button) => button.addEventListener('click', () => {
    colorButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
    renderPreview();
  }));
  renderPreview();

  const copyAddressBtn = document.querySelector('#copy-address-btn');
  if (copyAddressBtn) {
    const fullAddress = 'Jl. Dahlina Raya III, Guntung Paikat, Kec. Banjarbaru Selatan, Kota Banjarbaru, Kalimantan Selatan 70714';
    const copyTextSpan = copyAddressBtn.querySelector('.copy-text');
    let copyTimeout;

    copyAddressBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fullAddress);
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = fullAddress;
          tempInput.style.position = 'fixed';
          tempInput.style.opacity = '0';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        copyAddressBtn.classList.add('copied');
        if (copyTextSpan) copyTextSpan.textContent = 'Alamat Tersalin! ✓';
        copyAddressBtn.setAttribute('aria-label', 'Alamat berhasil disalin ke papan klip');

        window.clearTimeout(copyTimeout);
        copyTimeout = window.setTimeout(() => {
          copyAddressBtn.classList.remove('copied');
          if (copyTextSpan) copyTextSpan.textContent = 'Salin Alamat';
          copyAddressBtn.setAttribute('aria-label', 'Salin alamat lengkap ke papan klip');
        }, 2200);
      } catch (err) {
        console.error('Gagal menyalin alamat:', err);
      }
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.body.classList.add('js-motion');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }
})();
