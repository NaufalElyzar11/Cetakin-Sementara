(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const toast = $('#guide-toast');
  let toastTimer;
  function announce(message) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
  if (document.body.dataset.page === 'guides') {
    const core = window.CetakinGuideCore;
    const input = $('#guide-search');
    const params = new URLSearchParams(location.search);
    const groups = [...document.querySelectorAll('[data-guide-group]')];
    let group = groups.some(b=>b.dataset.guideGroup === params.get('kategori')) ? params.get('kategori') : '';
    input.value = (params.get('q') || '').slice(0, 200);
    function render(save = true) {
      const found = core.filter({q:input.value,group});
      const ids = new Set(found.map(g=>g.id));
      document.querySelectorAll('[data-guide-id]').forEach(card=> { card.hidden = !ids.has(card.dataset.guideId); });
      groups.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideGroup === group)));
      $('#guide-empty').hidden = found.length > 0;
      $('#guide-result-count').textContent = `${found.length} panduan${input.value.trim() ? ` untuk “${input.value.trim()}”` : group ? ` dalam kategori ${group}` : ' tersedia'}`;
      if (save) {
        const url = new URL(location.href);
        input.value.trim() ? url.searchParams.set('q',input.value.trim()) : url.searchParams.delete('q');
        group ? url.searchParams.set('kategori',group) : url.searchParams.delete('kategori');
        history.replaceState(null,'',url);
      }
    }
    input.addEventListener('input',()=>render());
    $('#guide-search-form').addEventListener('submit',e=> { e.preventDefault(); render(); });
    groups.forEach(b=>b.addEventListener('click',()=> { group = b.dataset.guideGroup; render(); }));
    $('#guide-reset').addEventListener('click',()=> { input.value=''; group=''; render(); input.focus(); });
    document.addEventListener('keydown',e=> {
      if (e.key==='/' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.target.closest('input,textarea,select,[contenteditable]')) { e.preventDefault(); input.focus(); }
    });
    render(false);
    return;
  }
  if (document.body.dataset.page !== 'guide') return;
  const main = $('#konten');
  const guideId = main.dataset.guide;
  const checks = [...document.querySelectorAll('[data-check]')];
  const checkKey = `cetakin-guide-parts-v1:${guideId}`;
  let saved = [];
  try { const value = JSON.parse(localStorage.getItem(checkKey) || '[]'); if (Array.isArray(value)) saved=value; } catch (_) { /* reading does not depend on storage */ }
  function updateChecks() {
    $('#check-count').textContent = checks.filter(c=>c.checked).length;
    try { localStorage.setItem(checkKey,JSON.stringify(checks.filter(c=>c.checked).map(c=>c.dataset.check))); } catch (_) { /* private mode or storage unavailable */ }
  }
  checks.forEach(c=> { c.checked=saved.includes(c.dataset.check); c.addEventListener('change',updateChecks); });
  $('#check-count').textContent = checks.filter(c=>c.checked).length;
  // Tokenize the original text once. Never re-parse highlighted HTML or alter code whitespace.
  const token = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|^\s*#[^\n]*|\b(?:const|byte|void|float|long|unsigned|if|else|for|while|return|true|false)\b)/gm;
  document.querySelectorAll('.arduino-code').forEach(code=> {
    const raw=code.textContent;
    code.dataset.rawCode=raw;
    const frag=document.createDocumentFragment();
    let pos=0;
    for (const match of raw.matchAll(token)) {
      frag.append(document.createTextNode(raw.slice(pos,match.index)));
      const span=document.createElement('span');
      span.className='token-'+(match[0].trimStart().startsWith('#') ? 'preprocessor' : match[0].startsWith('/') ? 'comment' : /^["']/.test(match[0]) ? 'string' : 'keyword');
      span.textContent=match[0]; frag.append(span); pos=match.index+match[0].length;
    }
    frag.append(document.createTextNode(raw.slice(pos))); code.replaceChildren(frag);
  });
  async function copy(text) {
    try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable'); await navigator.clipboard.writeText(text); return true; } catch (_) {
      const area=document.createElement('textarea'); area.value=text; area.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      const focused=document.activeElement;
      document.body.append(area); area.select();
      let result=false;
      try { result=document.execCommand('copy'); } catch (_) { /* show manual fallback */ }
      area.remove(); focused?.focus({preventScroll:true}); return result;
    }
  }
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=> {
    const code=document.getElementById(button.dataset.copy);
    const raw=code.dataset.rawCode || code.textContent;
    if (await copy(raw)) {
      button.textContent='Tersalin ✓'; announce('Kode tersalin. Tempel di Arduino IDE.');
      clearTimeout(button._copyTimer); button._copyTimer=setTimeout(()=> { button.textContent='Salin kode ⧉'; },2200);
    } else {
      const range=document.createRange(); range.selectNodeContents(code); const selection=window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      announce('Salin otomatis gagal. Kode sudah dipilih; gunakan Salin pada perangkat.');
    }
  }));
  const svg=$('.wiring-svg');
  let highlighted=null;
  document.querySelectorAll('[data-highlight]').forEach(button=>button.addEventListener('click',()=> {
    highlighted=highlighted===button.dataset.highlight ? null : button.dataset.highlight;
    svg.classList.toggle('has-highlight',highlighted!==null);
    svg.querySelectorAll('[data-wire]').forEach(w=>w.classList.toggle('highlighted',w.dataset.wire===highlighted));
    const mobileWires=$('.wiring-mobile');
    mobileWires?.classList.toggle('has-highlight',highlighted!==null);
    mobileWires?.querySelectorAll('[data-mobile-wire]').forEach(w=>w.classList.toggle('highlighted',w.dataset.mobileWire===highlighted));
    document.querySelectorAll('[data-pin]').forEach(row=>row.classList.toggle('selected',row.dataset.pin===highlighted));
    document.querySelectorAll('[data-highlight]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.highlight===highlighted)));
  }));
  const dialog=$('#diagram-dialog');
  $('[data-expand]').addEventListener('click',()=> {
    if (!dialog.showModal) { $('.wiring-scroll').scrollIntoView({block:'center'}); announce('Geser diagram untuk melihat sambungan.'); return; }
    const cloned=svg.cloneNode(true);
    // The main diagram remains in the document; use unique accessible title IDs in the dialog.
    cloned.querySelector('title').id='dialog-wiring-title'; cloned.querySelector('desc').id='dialog-wiring-desc';
    cloned.setAttribute('aria-labelledby','dialog-wiring-title dialog-wiring-desc');
    $('.dialog-diagram').replaceChildren(cloned); dialog.showModal();
  });
  $('#close-diagram').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=> { if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();} });
  const tocDetails=$('.guide-toc details');
  const mobile=matchMedia('(max-width:820px)');
  function fitToc(){tocDetails.open=!mobile.matches;}
  fitToc(); mobile.addEventListener('change',fitToc);
  const tocLinks=[...document.querySelectorAll('[data-toc]')];
  const sections=tocLinks.map(a=>document.getElementById(a.dataset.toc));
  tocLinks.forEach(a=>a.addEventListener('click',()=> { if(mobile.matches)tocDetails.open=false; }));
  let scheduled=false;
  function reading(){
    scheduled=false;
    const start=$('.article-layout').getBoundingClientRect().top+scrollY;
    const end=$('.guide-body').getBoundingClientRect().bottom+scrollY-innerHeight;
    const progress=Math.min(1,Math.max(0,(scrollY-start)/Math.max(1,end-start)));
    $('#reading-bar').style.transform=`scaleX(${progress})`;
    let active=sections[0];
    sections.forEach(s=>{if(s.getBoundingClientRect().top<=180)active=s;});
    tocLinks.forEach(a=> { if(a.dataset.toc===active.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current'); });
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(reading);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reading();
})();
