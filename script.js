/* Progressive enhancement: nav, filters, trip planner, GSAP and Three.js fort */
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toast = (message) => {
    const el = $("#toast"); if (!el) return;
    el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  };

  window.addEventListener("load", () => {
    if (window.lucide) window.lucide.createIcons();
    const menuToggle = $("#menuToggle"), mobileMenu = $("#mobileMenu");
    menuToggle?.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      if (window.lucide) window.lucide.createIcons();
    });
    $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => {
      mobileMenu.classList.remove("open"); document.body.classList.remove("menu-open");
      menuToggle?.setAttribute("aria-expanded","false");
    }));

    $$(".filter").forEach(button => button.addEventListener("click", () => {
      $$(".filter").forEach(b => b.classList.remove("active")); button.classList.add("active");
      const filter = button.dataset.filter;
      $$(".destination-card").forEach(card => {
        card.classList.toggle("hidden", filter !== "all" && card.dataset.category !== filter);
      });
    }));

    $("#tripForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const destination = $("#tripDestination").value;
      const days = Number($("#tripDays").value);
      const mood = $("#tripMood").value;
      const routes = {
        "Jaipur":["Amber Fort and old city walk","Hawa Mahal, City Palace and local crafts","Sunset views and a relaxed food trail"],
        "Jodhpur":["Mehrangarh Fort and blue lanes","Stepwells, old markets and local cuisine","A slow morning with a fort-side view"],
        "Udaipur":["City Palace and Lake Pichola","Old-town lanes, gardens and sunset by the water","A relaxed cultural and food day"],
        "Jaisalmer":["Golden Fort and sandstone havelis","Desert dunes at sunset","Local crafts and a slow morning"],
        "Rajasthan":["Jaipur's royal landmarks","Jodhpur's blue lanes or Udaipur's lakes","Choose one extra stop based on your pace"]
      };
      const list = routes[destination] || routes.Rajasthan;
      const result = $("#itineraryResult");
      result.innerHTML = `<strong>Your ${days}-day ${destination} escape</strong><p style="color:#b6b5b0;margin:5px 0 10px">Travel mood: ${mood}. A starter idea — check opening times, travel distances and availability before you go.</p><ol>${Array.from({length:days}, (_,i)=>`<li>${list[i % list.length]}</li>`).join("")}</ol>`;
      result.classList.add("visible");
      result.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"nearest"});
    });

    // Subtle pointer glow on devices that actually have a fine pointer.
    if (matchMedia("(pointer:fine)").matches) {
      const glow = $(".cursor-glow");
      window.addEventListener("pointermove", e => {
        if (glow) { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; }
      }, {passive:true});
    }

    // GSAP entrance and scroll motion. The rest of the page remains usable without CDN access.
    if (window.gsap) {
      if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
      gsap.from(".hero-content .reveal", {y:24, opacity:0, duration:1, stagger:.13, ease:"power3.out", delay:.15});
      if (window.ScrollTrigger) {
        gsap.utils.toArray(".section-kicker, .display-heading, .destination-card, .experience-item").forEach((el, i) => {
          gsap.from(el, {y:22, opacity:0, duration:.75, ease:"power2.out", delay:0.02, scrollTrigger:{trigger:el, start:"top 88%", once:true}});
        });
        gsap.to(".hero-image", {yPercent:10, ease:"none", scrollTrigger:{trigger:".hero", start:"top top", end:"bottom top", scrub:true}});
      }
    }

    initFort();
  });

  function initFort() {
    const canvas = $("#fortCanvas"), fallback = $("#threeFallback");
    if (!canvas || !window.THREE) {
      if (fallback) fallback.style.display = "grid";
      return;
    }
    let renderer, scene, camera, fort, animationId, autoRotate = true, dragging = false;
    try {
      renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:"low-power"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
      renderer.setSize(canvas.clientWidth || 500, canvas.clientHeight || 500, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
      camera.position.set(7.5, 6.1, 9.5);
      camera.lookAt(0, 1.2, 0);
      scene.add(new THREE.HemisphereLight(0xffe4b5, 0x182636, 2.0));
      const key = new THREE.DirectionalLight(0xffd49a, 3.0); key.position.set(5,9,7); scene.add(key);
      const rim = new THREE.DirectionalLight(0x6c9ac4, 1.5); rim.position.set(-7,5,-5); scene.add(rim);
      const warm = new THREE.PointLight(0xff9d45, 1.3, 15); warm.position.set(0,2,4); scene.add(warm);
      fort = new THREE.Group(); scene.add(fort);
      const mat = (color, roughness=.8) => new THREE.MeshStandardMaterial({color, roughness});
      const sandstone = mat(0xb97743), lightStone = mat(0xd49a60), shadowStone = mat(0x86502f), dark = mat(0x3a2b24), roof = mat(0x9d5735), gold = mat(0xe6b66b,.5);
      function box(parent, w,h,d,x,y,z, material, bevel=0) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
        mesh.position.set(x,y,z); parent.add(mesh); return mesh;
      }
      function cylinder(parent, rt, rb, h, x,y,z, material, seg=12) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), material);
        mesh.position.set(x,y,z); parent.add(mesh); return mesh;
      }
      function tower(parent,x,z,h=1.35,scale=1) {
        cylinder(parent,.29*scale,.35*scale,h,x,h/2+.35,z,lightStone,12);
        cylinder(parent,.38*scale,.38*scale,.12,x,h+.35,z,roof,12);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(.29*scale,12,8,0,Math.PI*2,0,Math.PI/2),gold);
        dome.position.set(x,h+.42,z); parent.add(dome);
        cylinder(parent,.035*scale,.035*scale,.28,x,h+.68,z,gold,8);
        for(let i=0;i<4;i++) box(parent,.06*scale,.22*scale,.035*scale,x+(i%2?-.13:.13)*scale,h*.52,z+(i<2?-.31:.31)*scale,dark);
      }
      // Layered plinths give the model a miniature diorama silhouette.
      cylinder(fort,2.55,2.7,.24,0,.12,0,shadowStone,8);
      cylinder(fort,2.35,2.48,.20,0,.32,0,lightStone,8);
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.15,2.28,1.05,12,1,true), sandstone);
      wall.position.y=.93; fort.add(wall);
      const parapet = new THREE.Mesh(new THREE.CylinderGeometry(2.18,2.18,.16,12), lightStone);
      parapet.position.y=1.48; fort.add(parapet);
      // Battlements around the polygon wall.
      for(let i=0;i<12;i++){
        const a=i*Math.PI*2/12, x=Math.sin(a)*2.15, z=Math.cos(a)*2.15;
        box(fort,.27,.22,.27,x,1.66,z,lightStone);
        const slit=box(fort,.075,.28,.04,x,1.0,z*1.035,dark);
        slit.rotation.y=a;
      }
      // Courtyard and central palace.
      cylinder(fort,1.55,1.55,.1,0,1.57,0,shadowStone,10);
      box(fort,1.6,1.25,1.05,0,2.2,0,sandstone);
      box(fort,1.85,.18,1.22,0,2.9,0,lightStone);
      box(fort,.65,.8,.08,0,2.0,.54,dark);
      for(let i=0;i<5;i++){
        const x=-.65+i*.325;
        box(fort,.1,.28,.04,x,2.45,.54,gold);
      }
      // Four visible towers and a gatehouse.
      tower(fort,-1.62,-1.45,1.45,.95); tower(fort,1.62,-1.45,1.25,.9);
      tower(fort,-1.62,1.45,1.3,.9); tower(fort,1.62,1.45,1.5,1);
      box(fort,.68,.85,.22,0,1.95,2.12,lightStone);
      box(fort,.3,.58,.08,0,1.85,2.25,dark);
      box(fort,.9,.15,.32,0,2.43,2.12,roof);
      // Stair-like approach.
      for(let i=0;i<6;i++) box(fort,.55+i*.18,.09,.35,0,.22+i*.09,2.6+i*.2,lightStone);
      // Small courtyard buildings and rooftop details.
      for(let i=0;i<5;i++){
        const a=(i/5)*Math.PI*2;
        const x=Math.cos(a)*1.15, z=Math.sin(a)*1.15;
        box(fort,.48,.6,.42,x,1.92,z,sandstone);
        box(fort,.54,.08,.48,x,2.26,z,roof);
      }
      // Ground ring and stars/specks for a premium floating presentation.
      const ringMat = new THREE.MeshBasicMaterial({color:0xe6b66b,transparent:true,opacity:.55});
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.95,.009,6,100),ringMat); ring.rotation.x=Math.PI/2; ring.position.y=-.04; fort.add(ring);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(3.25,64),new THREE.MeshBasicMaterial({color:0x0b1924,transparent:true,opacity:.7}));
      floor.rotation.x=-Math.PI/2; floor.position.y=-.08; fort.add(floor);
      // Set a gentle diagonal starting angle.
      fort.rotation.y=-.45;
      let pointerX=0, pointerY=0, downX=0, downY=0, startRotation=0;
      canvas.addEventListener("pointerdown", e => { dragging=true; downX=e.clientX; downY=e.clientY; startRotation=fort.rotation.y; pointerX=e.clientX; pointerY=e.clientY; canvas.setPointerCapture?.(e.pointerId); });
      canvas.addEventListener("pointermove", e => { if(!dragging)return; fort.rotation.y=startRotation+(e.clientX-downX)*.008; fort.rotation.x=Math.max(-.2,Math.min(.2,(e.clientY-downY)*.002)); });
      const stopDrag=()=>{dragging=false;}; canvas.addEventListener("pointerup",stopDrag); canvas.addEventListener("pointercancel",stopDrag);
      $("#rotateToggle")?.addEventListener("click", e => {
        autoRotate=!autoRotate;
        e.currentTarget.querySelector("span").textContent=autoRotate?"Pause 3D rotation":"Resume 3D rotation";
        e.currentTarget.querySelector("svg")?.setAttribute("data-lucide","rotate-3d");
        if(window.lucide) window.lucide.createIcons();
      });
      const resize=()=>{
        if(!renderer||!camera)return;
        const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
        renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      };
      const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : null;
      resizeObserver?.observe(canvas.parentElement); window.addEventListener("resize",resize,{passive:true}); resize();
      const clock=new THREE.Clock();
      function animate(){
        animationId=requestAnimationFrame(animate);
        const t=clock.getElapsedTime();
        if(autoRotate&&!dragging) fort.rotation.y+=.0026;
        fort.position.y=Math.sin(t*.7)*.045;
        renderer.render(scene,camera);
      }
      animate();
      document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(animationId);}else{animate();}});
    } catch(err) {
      console.warn("3D scene unavailable:",err);
      if(fallback) fallback.style.display="grid";
    }
  }
})();