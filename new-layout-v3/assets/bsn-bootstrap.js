// BSN bootstrap — inject motion.css + motion.js on every page.
(function(){
  var base = (function(){
    var s=document.currentScript; if(!s) return '';
    var src=s.getAttribute('src')||''; var i=src.lastIndexOf('/');
    return i>=0? src.substring(0,i+1):'';
  })();
  if(!document.querySelector('link[data-bsn-motion-css]')){
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=base+'motion.css'; l.setAttribute('data-bsn-motion-css','1');
    document.head.appendChild(l);
  }
  function loadJs(){
    if(document.querySelector('script[data-bsn-motion-js]')) return;
    var s=document.createElement('script'); s.src=base+'motion.js'; s.setAttribute('data-bsn-motion-js','1');
    document.body.appendChild(s);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadJs);
  } else {
    loadJs();
  }
})();
