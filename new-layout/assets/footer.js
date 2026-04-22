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
  fetch(base+'footer.html').then(function(r){return r.text()}).then(function(html){
    var existing=document.querySelector('.bsn-footer, footer.shell');
    var host=document.createElement('div'); host.innerHTML=html.trim();
    var node=host.firstElementChild;
    if(existing) existing.replaceWith(node); else document.body.appendChild(node);
  }).catch(function(){});
})();
