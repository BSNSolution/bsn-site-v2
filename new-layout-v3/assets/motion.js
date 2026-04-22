/* BSN motion layer v2 — cursor tracking, scroll progress, ambient layer, parallax. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) Grain only — orbs ambientais removidos (user pediu só page-shards no fundo) */
  if(!document.querySelector('.bsn-grain')){
    var g = document.createElement('div'); g.className = 'bsn-grain';
    document.body.appendChild(g);
  }
  /* Limpa orbs antigos se existirem de uma sessão anterior */
  document.querySelectorAll('.bsn-ambient').forEach(function(el){ el.remove(); });

  /* 2) Reveal tags */
  var selectors = [
    '.hero h1', '.hero p', '.hero .sub', '.hero .ctas', '.hero .eyebrow',
    '.orbit-center h1', '.orbit-center p', '.orbit-center .ctas', '.orbit-center .eyebrow',
    '.node',
    '.vitral .mono', '.vitral h2', '.vitral p.lead',
    '.tile',
    '.band-inner h2', '.band-inner p', '.band-cta',
    '.stack h2', '.stack .mono',
    '.pane-card', '.pane',
    '.bsn-footer .col', '.bsn-footer .link-col', '.bsn-footer .link-col li',
    '.duo-right', '.duo-right .stat',
    '.aur h1', '.aur p', '.aur .eyebrow', '.aur .ctas',
    '.whs h1', '.whs .foot',
    '.glass-panel',
    /* inner pages */
    '.hero-s h1', '.hero-s p', '.hero-s .eyebrow', '.hero-s .lede', '.hero-s .ctas',
    '.svc', '.sol', '.feat-card', '.post', '.person', '.val', '.job', '.perk',
    '.channels .chan', '.chan-list .chan', '.form-card',
    '.contact-wrap > *', '.about-grid > *', '.team-grid > *', '.values-grid > *',
    '.sol-grid > *', '.svc-grid > *', '.feats > *', '.posts > *', '.jobs > *', '.perks > *',
    '.legal .doc', '.legal h2', '.legal p', '.legal h1',
    '.page h2', '.page p.lede'
  ];
  selectors.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){
      if(!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal','');
    });
  });

  var groups = ['.mosaic', '.orbit-nodes', '.hero-meta', '.pane-grid', '.bsn-footer .top', '.gh-foot', '.ptx-right', '.glass-col',
    '.svc-grid', '.sol-grid', '.feats', '.posts', '.jobs', '.perks', '.team-grid', '.values-grid', '.about-grid', '.chan-list', '.channels', '.contact-wrap'];
  groups.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(g){ g.classList.add('reveal-group'); });
  });

  document.querySelectorAll('.band-inner h2, .hero-s h1, .legal h1, .page h2').forEach(function(h){
    h.classList.add('h-accent');
  });
  /* Observe section-head h2's to trigger their underline */
  document.querySelectorAll('.section-head h2, .vitral h2').forEach(function(h){
    if(!h.hasAttribute('data-reveal')) h.setAttribute('data-reveal','');
  });

  if(reduce) return;

  /* 3) IntersectionObserver reveal */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});

  document.querySelectorAll('[data-reveal], .h-accent').forEach(function(el){ io.observe(el); });

  /* 4) Cursor-aware spotlight on cards */
  if(matchMedia('(pointer:fine)').matches){
    var spotEls = document.querySelectorAll('.glass, .tile, .node, .pane-card, .svc, .sol, .feat-card, .post, .person, .val, .job, .perk, .chan, .form-card, .doc');
    spotEls.forEach(function(el){
      /* Inject a dedicated spotlight layer so it works even when ::before/::after are taken */
      if(!el.querySelector(':scope > .bsn-spot')){
        var spot = document.createElement('i');
        spot.className = 'bsn-spot';
        spot.setAttribute('aria-hidden','true');
        el.insertBefore(spot, el.firstChild);
      }
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty('--mx', x + '%');
        el.style.setProperty('--my', y + '%');
      });
      el.addEventListener('mouseleave', function(){
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
      });
    });
  }

  /* 5) Header scroll */
  var header = document.querySelector('.bsn-header');
  var onScroll = function(){
    var sy = window.scrollY;
    if(header){
      if(sy > 12) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
    /* Parallax on hero orbs / sun */
    document.querySelectorAll('[data-parallax]').forEach(function(el){
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      el.style.transform = 'translate3d(0,' + (sy * speed) + 'px,0)';
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  /* 6) Magnetism on primary buttons */
  if(matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.btn-primary').forEach(function(btn){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width/2;
        var y = e.clientY - r.top - r.height/2;
        btn.style.transform = 'translate('+(x*0.12)+'px,'+(y*0.18)+'px)';
      });
      btn.addEventListener('mouseleave', function(){ btn.style.transform = ''; });
    });
  }

  /* 7) Subtle mouse-follow parallax on hero glow / bg layers */
  if(matchMedia('(pointer:fine)').matches){
    var heroGlow = document.querySelectorAll('.orbit-sun, .prism-glow, .aur-bg, .bg-glass, [data-mouse-parallax]');
    if(heroGlow.length){
      var mx=0,my=0,tx=0,ty=0,rafId=null;
      function loop(){
        tx += (mx-tx)*.08; ty += (my-ty)*.08;
        heroGlow.forEach(function(el){
          var depth = parseFloat(el.getAttribute('data-mouse-parallax'));
          if(isNaN(depth)){
            if(el.classList.contains('bg-glass')) depth = 10;
            else depth = 30;
          }
          var dx = tx*depth, dy = ty*depth;
          if(el.classList.contains('orbit-sun')){
            el.style.transform = 'translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px))';
          } else {
            el.style.transform = 'translate3d('+dx+'px,'+dy+'px,0)';
          }
        });
        if(Math.abs(mx-tx)>.001 || Math.abs(my-ty)>.001) rafId = requestAnimationFrame(loop);
        else rafId = null;
      }
      window.addEventListener('mousemove', function(e){
        mx = (e.clientX / window.innerWidth - .5);
        my = (e.clientY / window.innerHeight - .5);
        if(!rafId) rafId = requestAnimationFrame(loop);
      });
    }
  }

  /* 8) Counter animation for numbers with data-count */
  document.querySelectorAll('[data-count]').forEach(function(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var start = performance.now();
        var dur = 1400;
        function tick(now){
          var t = Math.min(1, (now - start)/dur);
          var eased = 1 - Math.pow(1-t, 3);
          el.textContent = (target*eased).toFixed(decimals);
          if(t<1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io2.unobserve(el);
      });
    });
    io2.observe(el);
  });
})();
