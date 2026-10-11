/* Chmielewski · strona główna
   Animacje: GSAP + ScrollTrigger, płynne przewijanie: Lenis (oba z CDN jsDelivr).
   Gdy ktoś ma włączone „ogranicz ruch” albo skrypty z CDN się nie wczytają,
   strona działa normalnie, tylko bez animacji. */
(() => {
  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !reduce && !!(window.gsap && window.ScrollTrigger);
  const introPending = html.classList.contains('intro');
  clearTimeout(window.__introT);

  /* ---------- Płynne przewijanie (Lenis) zsynchronizowane z GSAP ---------- */
  let lenis = null;
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ anchors: true, stopInertiaOnNavigate: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  } else {
    html.classList.remove('intro');
  }

  /* ---------- Wejście: nagłówek, telefon, plakietki ---------- */
  const hero = document.querySelector('.hero');
  if (motion && introPending && hero) {
    const lines = hero.querySelectorAll('.h1 .ln > span');
    const fades = hero.querySelectorAll('[data-i]');
    const visual = hero.querySelector('.hero-visual');
    const badges = hero.querySelectorAll('.badge');
    const desk = window.matchMedia('(min-width: 1000px)').matches;

    gsap.set('.top', { opacity: 0, y: -14 });
    gsap.set(lines, { yPercent: 115 });
    gsap.set(fades, { opacity: 0, y: 18 });
    gsap.set(visual, { opacity: 0, y: 90, rotate: desk ? 4 : 0 });
    gsap.set(badges, { opacity: 0, scale: 0.85, y: 10 });
    html.classList.remove('intro');

    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .to('.top', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0)
      .to(fades[0], { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.05)
      .to(lines, { yPercent: 0, duration: 1.05, stagger: 0.09 }, 0.12)
      .to(Array.prototype.slice.call(fades, 1), { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, 0.5)
      .to(visual, { opacity: 1, y: 0, rotate: desk ? -4 : 0, duration: 1.3, ease: 'power3.out' }, 0.4)
      .to(badges, { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.14, ease: 'back.out(1.7)' }, 1.05);
  }

  /* ---------- Zmieniające się słowo w nagłówku (port RotatingText z react-bits) ---------- */
  const rot = document.querySelector('.rot');
  if (rot && motion) {
    const words = rot.dataset.words.split('|');
    const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('pl', { granularity: 'grapheme' }) : null;
    const chars = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));
    const build = (word) => {
      const w = document.createElement('span');
      w.className = 'rot-w';
      chars(word).forEach((c) => {
        const s = document.createElement('span');
        s.className = 'rot-c';
        s.textContent = c === ' ' ? ' ' : c;
        w.appendChild(s);
      });
      return w;
    };

    let idx = 0;
    let cur = build(words[0]);
    rot.textContent = '';
    rot.appendChild(cur);

    let timer = null;
    let done = false;
    const swap = () => {
      idx = (idx + 1) % words.length;
      const old = cur;
      cur = build(words[idx]);
      gsap.set(old, { position: 'absolute', left: 0, top: 0 });
      rot.appendChild(cur);
      gsap.to(old.children, { yPercent: -120, opacity: 0, duration: 0.42, stagger: 0.016, ease: 'power3.in', onComplete: () => old.remove() });
      gsap.fromTo(cur.children, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.022, ease: 'power4.out', delay: 0.16 });
      // Jedno pełne okrążenie, potem zatrzymanie na „Twojej firmy”
      if (idx === 0) { done = true; stop(); }
    };
    const start = () => { if (!timer && !done) timer = setInterval(swap, 2300); };
    const stop = () => { clearInterval(timer); timer = null; };

    setTimeout(() => {
      start();
      // Pauza, gdy nagłówek jest poza ekranem; po powrocie jeszcze jedno okrążenie
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (done && idx === 0) done = false; start(); } else stop();
      }).observe(rot);
    }, 1900);
  }

  /* ---------- Tekst odsłaniany słowo po słowie (port ScrollReveal z react-bits) ---------- */
  const splitWords = (el) => {
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
  };
  if (motion) {
    document.querySelectorAll('[data-words]').forEach((el) => {
      splitWords(el);
      gsap.fromTo(el.querySelectorAll('.w'), { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: 0.6 }
      });
    });
  }

  /* ---------- Delikatne pojawianie się sekcji ---------- */
  if (motion) {
    const els = gsap.utils.toArray('[data-r]');
    gsap.set(els, { opacity: 0, y: 28 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        // Po szybkim skoku (np. kliknięcie w menu) to, co już minęło, pokazujemy od razu
        const h = window.innerHeight;
        const seen = batch.filter((el) => el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < h * 1.1);
        gsap.set(batch.filter((el) => !seen.includes(el)), { opacity: 1, y: 0 });
        gsap.to(seen, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true });
      }
    });
  }

  /* ---------- Liczniki w sekcji z ceną (port CountUp z react-bits) ---------- */
  if (motion) {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: end > 100 ? 1.8 : 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } })
      });
    });
  }

  /* ---------- Kroki: linia rysuje się przy przewijaniu ---------- */
  const steps = document.querySelector('.steps');
  if (steps && motion) {
    steps.classList.add('js-steps');
    const items = steps.querySelectorAll('.step');
    items.forEach((s) => s.classList.remove('on'));
    gsap.fromTo(steps, { '--p': 0 }, {
      '--p': 1, ease: 'none',
      scrollTrigger: { trigger: steps, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 }
    });
    items.forEach((s) => ScrollTrigger.create({
      trigger: s, start: 'top 62%',
      onEnter: () => s.classList.add('on'),
      onLeaveBack: () => s.classList.remove('on')
    }));
  }

  /* ---------- Paralaksa i aktywne menu (tylko komputer) ---------- */
  if (motion) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px)', () => {
      gsap.to('.hero-visual .phone', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.utils.toArray('.work .stage .phone').forEach((p, i) => {
        gsap.fromTo(p, { y: 30 + i * 16 }, { y: -30 - i * 16, ease: 'none', scrollTrigger: { trigger: p.closest('.work'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.from('.ui-c', { x: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.ui', start: 'top 85%' } });
    });
    document.querySelectorAll('.nav .nl').forEach((a) => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: a, className: 'on' } });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------- Przyciski „przyciągane” kursorem (port Magnet z react-bits) ---------- */
  if (motion && fine) {
    document.querySelectorAll('.magnet').forEach((m) => {
      const xTo = gsap.quickTo(m, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(m, 'y', { duration: 0.5, ease: 'power3.out' });
      m.addEventListener('pointermove', (e) => {
        const r = m.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.12);
        yTo((e.clientY - r.top - r.height / 2) * 0.22);
      });
      m.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Światło za kursorem na karcie z ceną (port SpotlightCard z react-bits) ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('[data-spot]').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Przewijane strony w telefonach (tylko gdy widoczne) ---------- */
  const phones = document.querySelectorAll('.phone');
  if (!reduce && phones.length) {
    const setTravel = () => phones.forEach((p) => {
      const sc = p.querySelector('.screen');
      const site = p.querySelector('.site');
      if (sc && site) p.style.setProperty('--travel', Math.min(0, sc.clientHeight - site.scrollHeight) + 'px');
    });
    setTravel();
    window.addEventListener('load', setTravel);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setTravel, 200); });
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('play', e.isIntersecting)));
    phones.forEach((p) => io.observe(p));
  }

  /* ---------- Filmik z rolkami: gra tylko, gdy jest widoczny ---------- */
  const reel = document.querySelector('.xmedia video');
  if (reel) {
    if (reduce) reel.controls = true;
    else new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = reel.play(); if (p) p.catch(() => { reel.controls = true; }); } else reel.pause();
    }, { threshold: 0.4 }).observe(reel);
  }

  /* ---------- Pasek kontaktu na telefonie ---------- */
  const bar = document.querySelector('.bar');
  const heroCtas = document.querySelector('.hero .ctas');
  const contact = document.getElementById('kontakt');
  if (bar && heroCtas && contact) {
    let pastHero = false;
    let atContact = false;
    const upd = () => bar.classList.toggle('on', pastHero && !atContact);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }).observe(heroCtas);
    new IntersectionObserver(([e]) => { atContact = e.isIntersecting; upd(); }, { rootMargin: '0px 0px -35% 0px' }).observe(contact);
  }

  /* ---------- Kopiowanie numeru i e-maila ---------- */
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const t = b.dataset.copy;
      try { await navigator.clipboard.writeText(t); } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = t; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* nic */ }
        ta.remove();
      }
      b.textContent = 'Skopiowano';
      b.classList.add('done');
      clearTimeout(b._t);
      b._t = setTimeout(() => { b.textContent = b.dataset.label; b.classList.remove('done'); }, 1800);
    });
  });

  /* ---------- Szybka wiadomość na WhatsApp ---------- */
  const form = document.getElementById('quick');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const b = form.querySelector('input[name="b"]:checked');
      const firm = form.querySelector('#q-firm').value.trim();
      let msg = 'Dzień dobry! Piszę ze strony chmielewskifoto.pl.';
      if (b) msg += ' Prowadzę ' + b.value + (firm ? ' (' + firm + ')' : '') + '.';
      else if (firm) msg += ' Moja firma: ' + firm + '.';
      msg += ' Chcę umówić bezpłatne spotkanie w sprawie strony internetowej.';
      window.open('https://wa.me/48736842214?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  }

  /* ---------- Okna: zdjęcia i polityka prywatności ---------- */
  const openDialog = (d) => { if (!d.open) { d.showModal(); if (lenis) lenis.stop(); } };
  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('close', () => { if (lenis) lenis.start(); });
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });

  const pp = document.getElementById('pp');
  document.querySelectorAll('[data-pp]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openDialog(pp); }));
  if (location.hash === '#polityka-prywatnosci') openDialog(pp);

  const lb = document.getElementById('lb');
  const shots = Array.from(document.querySelectorAll('#photos [data-full]'));
  const lbImg = document.getElementById('lb-img');
  let li = 0;
  const show = (i) => {
    li = (i + shots.length) % shots.length;
    const it = shots[li];
    const img = it.querySelector('img');
    lbImg.removeAttribute('srcset');
    lbImg.src = img.getAttribute('src');
    lbImg.srcset = img.getAttribute('src') + ' ' + it.dataset.w + 'w, ' + it.dataset.full + ' ' + it.dataset.fw + 'w';
    lbImg.sizes = '100vw';
    lbImg.alt = img.alt;
    document.getElementById('lb-cap').textContent = it.dataset.cap;
    document.getElementById('lb-count').textContent = (li + 1) + ' / ' + shots.length;
  };
  shots.forEach((s, i) => s.addEventListener('click', () => { show(i); openDialog(lb); }));
  lb.querySelector('.lb-prev').addEventListener('click', () => show(li - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(li + 1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(li - 1);
    if (e.key === 'ArrowRight') show(li + 1);
  });
  let sx = null;
  const stage = document.getElementById('lb-stage');
  stage.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) show(li + (dx < 0 ? 1 : -1));
  });

  /* ---------- Strzałki pod galerią (komputer) ---------- */
  const strip = document.getElementById('photos');
  document.querySelectorAll('[data-ph]').forEach((b) => b.addEventListener('click', () => {
    strip.scrollBy({ left: Number(b.dataset.ph) * strip.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }));
})();
