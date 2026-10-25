(() => {
 const $ = (s, r=document) => r.querySelector(s);
 const $$ = (s, r=document) => [...r.querySelectorAll(s)];
 const nav = $('#nav'), menuBtn = $('#menuBtn'), toast = $('#toast');
 let toastTimer;
 menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
 $$('.nav-link').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
 $('#themeBtn').addEventListener('click', () => {
   document.body.classList.toggle('light');
   notify(document.body.classList.contains('light') ? 'Light theme enabled' : 'Dark theme enabled');
 });
 // GSAP enhancement when CDN is available, with native fallback below.
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if (window.gsap && !reduced) {
   gsap.registerPlugin(ScrollTrigger);
   gsap.from('.hero-content > *', {y:28, opacity:0, duration:1, stagger:.13, ease:'power3.out', delay:.15});
   gsap.to('#heroBg', {scale:1, duration:2.2, ease:'power2.out'});
   gsap.to('.hero-bg', {yPercent:9, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:1}});
   gsap.utils.toArray('.reveal').forEach(el => {
     gsap.fromTo(el, {y:24, opacity:0}, {y:0, opacity:1, duration:.8, ease:'power2.out',
       scrollTrigger:{trigger:el, start:'top 88%', once:true}});
   });
   gsap.to('.immersive-image img', {yPercent:8, ease:'none', scrollTrigger:{trigger:'.immersive', start:'top bottom', end:'bottom top', scrub:1}});
 } else {
   const els = $$('.reveal');
   if ('IntersectionObserver' in window && !reduced) {
     const io = new IntersectionObserver(entries => entries.forEach(e => {
       if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
     }), {threshold:.12});
     els.forEach((el,i) => {el.style.transitionDelay = `${(i%4)*65}ms`; io.observe(el);});
   } else els.forEach(el => el.classList.add('visible'));
 }
 // Filter and search
 let active = 'all';
 const cards = $$('.dest-card');
 function updateCards() {
   const query = $('#search').value.trim().toLowerCase();
   let count = 0;
   cards.forEach(card => {
     const tags = card.dataset.tags.split(' ');
     const show = (active === 'all' || tags.includes(active)) &&
       (!query || card.dataset.name.toLowerCase().includes(query));
     card.classList.toggle('hidden', !show);
     if (show) count++;
   });
   $('#empty').hidden = count > 0;
 }
 $$('#filters .filter').forEach(btn => btn.addEventListener('click', () => {
   $$('#filters .filter').forEach(b => b.classList.remove('active'));
   btn.classList.add('active'); active = btn.dataset.filter; updateCards();
 }));
 $('#search').addEventListener('input', updateCards);
 // Destination card shortcut preselects destination in the planner.
 $$('[data-place]').forEach(link => link.addEventListener('click', () => {
   $('#place').value = link.dataset.place;
 }));
 const date = $('#date');
 const now = new Date();
 date.min = new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 $('#tripForm').addEventListener('submit', e => {
   e.preventDefault();
   const place = $('#place').value, mood = $('#mood').value, day = date.value;
   const dateText = new Date(day+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
   const tip = place === 'Rajasthan road trip' ? 'Consider 6–8 days to explore multiple cities.' : 'Consider 2–3 days to explore this city at an easy pace.';
   const out = $('#tripResult');
   out.innerHTML = `<strong>Your journey starts here ✳</strong><br>Destination: ${safe(place)} · Start date: ${safe(dateText)} · Travel mood: ${safe(mood)}.<br><small>${tip} This is a planning suggestion, not a booking.</small>`;
   out.hidden = false; out.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block:'nearest'});
   notify('Your trip idea is ready');
 });
 function safe(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2300);}
 $('#year').textContent = new Date().getFullYear();
})();