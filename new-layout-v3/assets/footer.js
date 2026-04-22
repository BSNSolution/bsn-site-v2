// BSN Solution — shared footer loader. Inject assets/footer.html at end of body.
(function(){
  var base = (function(){
    var s=document.currentScript; if(!s) return '';
    var src=s.getAttribute('src')||''; var i=src.lastIndexOf('/');
    return i>=0? src.substring(0,i+1):'';
  })();
  // stylesheet
  if(!document.querySelector('link[data-bsn-footer]')){
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=base+'footer.css'; l.setAttribute('data-bsn-footer','1');
    document.head.appendChild(l);
  }
  // motion css (ambient + reveal + spotlight) — inject on every page
  if(!document.querySelector('link[data-bsn-motion-css]')){
    var lm=document.createElement('link'); lm.rel='stylesheet'; lm.href=base+'motion.css'; lm.setAttribute('data-bsn-motion-css','1');
    document.head.appendChild(lm);
  }
  // motion js — runs after footer DOM is in place
  function loadMotion(){
    if(document.querySelector('script[data-bsn-motion-js]')) return;
    var s=document.createElement('script'); s.src=base+'motion.js'; s.setAttribute('data-bsn-motion-js','1');
    document.body.appendChild(s);
  }
  fetch(base+'footer.html').then(function(r){return r.text()}).then(function(html){
    var existing=document.querySelector('.bsn-footer, footer.shell');
    var host=document.createElement('div'); host.innerHTML=html.trim();
    var node=host.firstElementChild;
    if(existing) existing.replaceWith(node); else document.body.appendChild(node);
    loadMotion();
  }).catch(function(){ loadMotion(); });
})();
