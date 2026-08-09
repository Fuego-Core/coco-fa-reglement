/* ============================================================
   COCO FA — Règlement · logique du site (vanilla JS, 0 dépendance)
   Lit reglement.md, le rend, et pilote recherche / sommaire / thème.
   ============================================================ */
(function () {
  'use strict';

  var RECENT_DAYS = 60; // fenêtre du marqueur « Modifié »
  var SANCTIONS = {
    'avertissement':  { label: 'Avertissement',  cls: 'avertissement' },
    'tolerance-zero': { label: 'Tolérance zéro', cls: 'tolerance-zero' },
    'bannissable':    { label: 'Bannissable',    cls: 'bannissable' },
    // niveaux complémentaires, utilisables au besoin
    'kick':           { label: 'Kick',           cls: 'kick' },
    'ban-temp':       { label: 'Ban temporaire', cls: 'ban-temp' },
    'ban-def':        { label: 'Ban définitif',  cls: 'ban-def' }
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Utilitaires texte ---------------- */
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function deburr(s){ return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase() : s.toLowerCase(); }
  function slug(s){ return deburr(s).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function idToAnchor(id){ return 'regle-' + id.replace(/\./g,'-'); }

  function frDate(iso){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if(!m) return iso || '';
    var mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return parseInt(m[3],10) + ' ' + mois[parseInt(m[2],10)-1] + ' ' + m[1];
  }
  function daysBetween(isoA, isoB){
    var a = new Date(isoA+'T00:00:00'), b = new Date(isoB+'T00:00:00');
    if(isNaN(a)||isNaN(b)) return Infinity;
    return Math.abs((a-b)/86400000);
  }

  /* ---------------- Markdown minimal ---------------- */
  function mdInline(text){
    var codes = [], SNT = '\uE000';
    text = text.replace(/`([^`]+)`/g, function(_, c){ codes.push(c); return SNT+(codes.length-1)+SNT; });
    text = esc(text);
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_, t, href){
      var safe = /^(https?:|mailto:|#|\/|\.)/.test(href) ? href : '#';
      var ext = /^https?:/.test(safe) ? ' target="_blank" rel="noopener"' : '';
      return '<a href="'+esc(safe)+'"'+ext+'>'+t+'</a>';
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    text = text.replace(/\uE000(\d+)\uE000/g, function(_, i){ return '<code>'+esc(codes[+i])+'</code>'; });
    return text;
  }

  function mdBlocks(src){
    var lines = src.replace(/\r/g,'').split('\n');
    var out = [], i = 0;
    function isTableSep(l){ return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l); }
    function cells(l){
      l = l.trim().replace(/^\|/,'').replace(/\|$/,'');
      return l.split('|').map(function(c){ return c.trim(); });
    }
    while(i < lines.length){
      var line = lines[i];
      if(!line.trim()){ i++; continue; }

      // Tableau
      if(line.indexOf('|') !== -1 && i+1 < lines.length && isTableSep(lines[i+1])){
        var head = cells(line); i += 2; var rows = [];
        while(i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim()){ rows.push(cells(lines[i])); i++; }
        var t = '<div class="table-wrap"><table><thead><tr>';
        head.forEach(function(h){ t += '<th>'+mdInline(h)+'</th>'; });
        t += '</tr></thead><tbody>';
        rows.forEach(function(r){
          t += '<tr>';
          for(var c=0;c<head.length;c++){ t += '<td>'+mdInline(r[c]||'')+'</td>'; }
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        out.push(t); continue;
      }
      // Citation
      if(/^>\s?/.test(line)){
        var buf = [];
        while(i < lines.length && /^>\s?/.test(lines[i])){ buf.push(lines[i].replace(/^>\s?/,'')); i++; }
        out.push('<blockquote>'+mdInline(buf.join(' '))+'</blockquote>'); continue;
      }
      // Liste à puces
      if(/^[-*]\s+/.test(line)){
        var items = [];
        while(i < lines.length && /^[-*]\s+/.test(lines[i])){ items.push(lines[i].replace(/^[-*]\s+/,'')); i++; }
        out.push('<ul>'+items.map(function(it){ return '<li>'+mdInline(it)+'</li>'; }).join('')+'</ul>'); continue;
      }
      // Liste ordonnée
      if(/^\d+\.\s+/.test(line)){
        var oi = [];
        while(i < lines.length && /^\d+\.\s+/.test(lines[i])){ oi.push(lines[i].replace(/^\d+\.\s+/,'')); i++; }
        out.push('<ol>'+oi.map(function(it){ return '<li>'+mdInline(it)+'</li>'; }).join('')+'</ol>'); continue;
      }
      // Paragraphe
      var para = [];
      while(i < lines.length && lines[i].trim() && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) &&
            !/^>\s?/.test(lines[i]) && !(lines[i].indexOf('|')!==-1 && isTableSep(lines[i+1]||''))){
        para.push(lines[i]); i++;
      }
      out.push('<p>'+mdInline(para.join(' '))+'</p>');
    }
    return out.join('\n');
  }

  function stripMd(src){
    return src.replace(/\r/g,'')
      .replace(/`([^`]+)`/g,'$1')
      .replace(/\*\*([^*]+)\*\*/g,'$1')
      .replace(/\*([^*]+)\*/g,'$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
      .replace(/^[>\-*]\s+/gm,'')
      .replace(/\|/g,' ')
      .replace(/\s+/g,' ').trim();
  }

  /* ---------------- Parseur du règlement ---------------- */
  function parse(text){
    text = text.replace(/\r/g,'');
    var meta = {}, body = text;
    var fm = /^---\n([\s\S]*?)\n---\n?/.exec(text);
    if(fm){
      fm[1].split('\n').forEach(function(l){
        var m = /^([\w-]+)\s*:\s*(.*)$/.exec(l);
        if(m) meta[m[1].trim()] = m[2].trim();
      });
      body = text.slice(fm[0].length);
    }

    var lines = body.split('\n');
    var cats = [], changelog = null, cur = null, curRule = null, mode = null;

    function flushRule(){
      if(curRule){ curRule.bodyRaw = curRule.bodyLines.join('\n').trim(); cur.rules.push(curRule); curRule = null; }
    }
    for(var i=0;i<lines.length;i++){
      var line = lines[i];
      var h1 = /^#\s+(?:@(\w+)\s+)?(.+)$/.exec(line);
      if(h1){
        flushRule();
        if((h1[1]||'').toLowerCase() === 'changelog'){
          changelog = { title: h1[2].trim(), introLines: [], entries: [] };
          cur = null; mode = 'changelog'; continue;
        }
        var title = h1[2].trim();
        // ancre explicite : « # 00. La charte {#charte} » — préserve les liens déjà partagés
        var slugM = /\{#([A-Za-z0-9_-]+)\}\s*$/.exec(title);
        var explicitId = slugM ? slugM[1] : null;
        if(slugM) title = title.slice(0, slugM.index).trim();
        var numM = /^(\d+)\.\s+(.*)$/.exec(title);
        cur = {
          num: numM ? numM[1] : '',
          title: numM ? numM[2] : title,
          id: explicitId || ('cat-' + (numM ? numM[1] : slug(title))),
          kicker: null,
          introLines: [], rules: []
        };
        cats.push(cur); mode = 'cat-meta'; continue;
      }
      var h2 = /^##\s+(\d+(?:\.\d+)+)\s+(.*)$/.exec(line);
      if(h2 && cur){
        flushRule();
        curRule = { id: h2[1], title: h2[2].trim(), sanction: null, maj: null, tags: [], bodyLines: [] };
        mode = 'rule-meta'; continue;
      }
      if(mode === 'changelog' && changelog){
        var ce = /^[-*]\s+(.+)$/.exec(line);
        if(ce){
          var parts = ce[1].split('·').map(function(s){ return s.trim(); });
          changelog.entries.push({ date: parts[0]||'', ver: parts[1]||'', text: parts.slice(2).join(' · ')||'' });
        } else if(line.trim()){ changelog.introLines.push(line); }
        continue;
      }
      if(mode === 'rule-meta' && curRule){
        var mm = /^(sanction|maj|tags)\s*:\s*(.*)$/.exec(line);
        if(mm){
          if(mm[1]==='tags') curRule.tags = mm[2].split(',').map(function(s){return s.trim();}).filter(Boolean);
          else curRule[mm[1]] = mm[2].trim();
          continue;
        }
        if(!line.trim()) continue; // saut de ligne avant le corps
        mode = 'rule-body'; curRule.bodyLines.push(line); continue;
      }
      if(mode === 'rule-body' && curRule){ curRule.bodyLines.push(line); continue; }
      if(mode === 'cat-meta' && cur){
        var cm = /^(kicker)\s*:\s*(.*)$/.exec(line);
        if(cm){ cur.kicker = cm[2].trim(); continue; }
        if(!line.trim()) continue;
        mode = 'cat-intro'; cur.introLines.push(line); continue;
      }
      if(mode === 'cat-intro' && cur){ cur.introLines.push(line); continue; }
    }
    flushRule();

    return { meta: meta, cats: cats, changelog: changelog };
  }

  /* ---------------- Rendu ---------------- */
  var state = { index: [], rules: [] };

  function badge(sanction){
    if(!sanction) return '';
    var s = SANCTIONS[sanction];
    var cls = s ? s.cls : '';
    var label = s ? s.label : sanction;
    return '<span class="badge badge--'+esc(cls)+'"><span class="badge__dot" aria-hidden="true"></span>'+esc(label)+'</span>';
  }

  function render(data){
    var meta = data.meta;
    // Hero
    if(meta.accroche) $('#heroLede').textContent = meta.accroche;
    $('#heroVersion').textContent = 'version ' + (meta.version || '—');
    $('#heroDate').textContent = 'mis à jour le ' + (meta.maj ? frDate(meta.maj) : '—');
    document.title = 'Règlement — ' + (meta.serveur || 'Coco FA');
    if(meta.discord){
      var dc = $('#heroDiscord');
      if(dc){ dc.href = meta.discord; dc.hidden = false; }
    }
    if(meta.devise) $('#footDevise').textContent = (meta.serveur || 'Coco FA') + ' — ' + meta.devise;
    if(meta.pied) $('#footNote').textContent = meta.pied;

    // Marqueur "Modifié" : rules touchées lors de la dernière révision
    var majs = {};
    data.cats.forEach(function(c){ c.rules.forEach(function(r){ if(r.maj) majs[r.maj]=1; }); });
    var distinct = Object.keys(majs).sort();
    var latestMaj = distinct[distinct.length-1];
    var flagEnabled = distinct.length >= 2;
    var today = meta.maj || (distinct.length ? latestMaj : '');

    var rulesHtml = '', tocHtml = '';

    data.cats.forEach(function(cat){
      var kicker = cat.num ? ('0'+cat.num).slice(-2) : '';
      tocHtml += '<div class="toc__cat"><a class="toc__cat-title" href="#'+esc(cat.id)+'">'
        + (cat.num?cat.num+'. ':'')+esc(cat.title)+'</a>';

      rulesHtml += '<section class="rule-cat reveal" id="'+esc(cat.id)+'">';
      rulesHtml += '<header class="rule-cat__head"><span class="anchor-target" id="'+esc(cat.id)+'-a"></span>';
      rulesHtml += '<span class="rule-cat__kicker">'
        + (kicker ? '<span class="rule-cat__chap">'+esc(kicker)+'</span>' : '')
        + (cat.kicker ? esc(cat.kicker) : (kicker ? 'Chapitre '+esc(kicker) : ''))
        + '</span>';
      rulesHtml += '<h2 class="rule-cat__title">'+esc(cat.title)+'</h2>';
      var intro = cat.introLines.join('\n').trim();
      if(intro) rulesHtml += '<div class="rule-cat__intro">'+mdBlocks(intro)+'</div>';
      rulesHtml += '</header>';

      cat.rules.forEach(function(r){
        var anchor = idToAnchor(r.id);
        var recent = flagEnabled && r.maj === latestMaj && daysBetween(r.maj, today) <= RECENT_DAYS;
        state.rules.push(r);
        state.index.push({
          id: r.id, anchor: anchor, num: r.id, title: r.title,
          cat: cat.title, catNum: cat.num,
          bodyPlain: stripMd(r.bodyRaw),
          nTitle: deburr(r.title), nBody: deburr(stripMd(r.bodyRaw)), nNum: r.id
        });

        rulesHtml += '<div class="rule reveal" id="'+anchor+'">';
        rulesHtml += '<button class="rule__anchor" type="button" data-anchor="'+anchor+'" aria-label="Copier le lien vers la règle '+esc(r.id)+'" title="Copier le lien">'
          + '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg></button>';
        rulesHtml += '<div class="rule__head">';
        rulesHtml += '<span class="rule__num">'+esc(r.id)+'</span>';
        rulesHtml += '<h3 class="rule__title">'+esc(r.title)+'</h3>';
        if(r.sanction) rulesHtml += badge(r.sanction);
        if(recent) rulesHtml += '<span class="rule__flag" title="Modifiée le '+esc(frDate(r.maj))+'">Modifié</span>';
        rulesHtml += '</div>';
        rulesHtml += '<div class="rule__body">'+mdBlocks(r.bodyRaw)+'</div>';
        rulesHtml += '<button class="rule__copy" type="button" data-anchor="'+anchor+'">'
          + '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg> Copier le lien</button>';
        rulesHtml += '</div>';

        tocHtml += '<a class="toc__link" href="#'+anchor+'" data-target="'+anchor+'">'
          + '<span class="toc__num">'+esc(r.id)+'</span><span>'+esc(r.title)+'</span></a>';
      });

      rulesHtml += '</section>';
      tocHtml += '</div>';
    });

    // Changelog
    if(data.changelog){
      var cl = data.changelog;
      tocHtml += '<div class="toc__cat"><a class="toc__cat-title" href="#changelog">Journal</a>'
        + '<a class="toc__link" href="#changelog" data-target="changelog"><span>'+esc(cl.title)+'</span></a></div>';
      rulesHtml += '<section class="rule-cat reveal" id="changelog"><header class="rule-cat__head">'
        + '<span class="anchor-target" id="changelog-a"></span>'
        + '<span class="rule-cat__kicker">Historique</span>'
        + '<h2 class="rule-cat__title">'+esc(cl.title)+'</h2>';
      var clIntro = cl.introLines.join('\n').trim();
      if(clIntro) rulesHtml += '<div class="rule-cat__intro">'+mdBlocks(clIntro)+'</div>';
      rulesHtml += '</header><div class="changelog">';
      cl.entries.forEach(function(e){
        rulesHtml += '<div class="changelog__item">'
          + '<div><span class="changelog__date">'+esc(frDate(e.date))+'</span>'
          + (e.ver?'<span class="changelog__ver">'+esc(e.ver)+'</span>':'')+'</div>'
          + '<p class="changelog__text">'+mdInline(e.text)+'</p></div>';
      });
      rulesHtml += '</div></section>';
    }

    $('#rules').innerHTML = rulesHtml;
    $('#tocNav').innerHTML = tocHtml;
    $('#tocSheetNav').innerHTML = tocHtml;
  }

  /* ---------------- Copier le lien ---------------- */
  function absoluteUrl(anchor){
    return location.origin + location.pathname + '#' + anchor;
  }
  function copyLink(anchor, btn){
    var url = absoluteUrl(anchor);
    var done = function(){
      history.replaceState(null,'','#'+anchor);
      if(btn){
        var was = btn.innerHTML, label = btn.classList.contains('rule__copy');
        btn.classList.add('is-copied');
        if(label) btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg> Lien copié';
        setTimeout(function(){ btn.classList.remove('is-copied'); if(label) btn.innerHTML = was; }, 1600);
      }
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done, function(){ fallbackCopy(url); done(); });
    } else { fallbackCopy(url); done(); }
  }
  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }

  /* ---------------- Surlignage d'ancre ---------------- */
  function flashTarget(anchor){
    var el = document.getElementById(anchor);
    if(!el) return;
    $$('.rule.is-target').forEach(function(n){ n.classList.remove('is-target'); });
    el.classList.add('is-target');
    if(!reduceMotion){
      el.classList.remove('is-flashed');
      void el.offsetWidth; // reflow pour rejouer l'animation
      el.classList.add('is-flashed');
    }
    return el;
  }
  function goToHash(smooth){
    var h = location.hash.replace('#','');
    if(!h) return;
    var el = document.getElementById(h);
    if(!el) return;
    el.scrollIntoView({ behavior: (smooth && !reduceMotion) ? 'smooth' : 'auto', block: 'start' });
    if(el.classList.contains('rule')) flashTarget(h);
  }

  /* ---------------- Sommaire : scrollspy ---------------- */
  function setupScrollSpy(){
    var links = {};
    $$('#tocNav .toc__link').forEach(function(a){ links[a.getAttribute('data-target')] = a; });
    // On n'observe que les éléments réellement présents dans le sommaire :
    // les sections de chapitre, bien plus hautes, gagneraient toujours et
    // empêcheraient tout surlignage.
    var targets = $$('.rule[id]').filter(function(el){ return links[el.id]; });
    var changelogEl = document.getElementById('changelog');
    if(changelogEl && links['changelog']) targets.push(changelogEl);
    if(!('IntersectionObserver' in window) || !targets.length) return;
    var visible = {};
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting) visible[en.target.id] = en.intersectionRatio;
        else delete visible[en.target.id];
      });
      var top = null, best = -1;
      Object.keys(visible).forEach(function(id){ if(visible[id] > best){ best = visible[id]; top = id; } });
      // choisit l'élément le plus haut visible
      var firstId = null, firstTop = Infinity;
      Object.keys(visible).forEach(function(id){
        var r = document.getElementById(id).getBoundingClientRect();
        if(r.top < firstTop){ firstTop = r.top; firstId = id; }
      });
      var active = firstId || top;
      $$('#tocNav .toc__link.is-active').forEach(function(a){ a.classList.remove('is-active'); });
      if(active && links[active]){
        links[active].classList.add('is-active');
        var nav = $('#toc');
        if(nav){
          var la = links[active];
          if(la.offsetTop < nav.scrollTop || la.offsetTop > nav.scrollTop + nav.clientHeight - 40){
            nav.scrollTop = la.offsetTop - nav.clientHeight/2;
          }
        }
      }
    }, { rootMargin: '-'+ (60+10) +'px 0px -55% 0px', threshold:[0,.25,.5,1] });
    targets.forEach(function(t){ obs.observe(t); });
  }

  /* ---------------- Barre de progression ---------------- */
  function setupProgress(){
    var bar = $('#progressBar'), ticking = false;
    function upd(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, p)) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function(){ if(!ticking){ requestAnimationFrame(upd); ticking = true; } }, { passive:true });
    upd();
  }

  /* ---------------- Révélations en cascade ---------------- */
  function setupReveal(){
    var els = $$('.reveal');
    if(reduceMotion || !('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('is-in'); }); return; }
    var obs = new IntersectionObserver(function(entries, o){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('is-in'); o.unobserve(en.target); }
      });
    }, { rootMargin:'0px 0px -8% 0px', threshold:.06 });
    els.forEach(function(e){ obs.observe(e); });
  }

  /* ---------------- Thème ---------------- */
  function setupTheme(){
    var btn = $('#themeToggle');
    function current(){ return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }
    btn.addEventListener('click', function(){
      var next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try{ localStorage.setItem('cocofa-theme', next); }catch(e){}
      var meta = document.querySelector('meta[name="theme-color"]');
    });
  }

  /* ---------------- Feuille modale sommaire ---------------- */
  function setupSheet(){
    var sheet = $('#tocSheet'), fab = $('#fabToc');
    function open(){
      sheet.hidden = false; document.body.classList.add('is-locked');
      requestAnimationFrame(function(){ sheet.classList.add('is-open'); });
      fab.setAttribute('aria-expanded','true');
    }
    function close(){
      sheet.classList.remove('is-open'); document.body.classList.remove('is-locked');
      fab.setAttribute('aria-expanded','false');
      setTimeout(function(){ sheet.hidden = true; }, reduceMotion ? 0 : 400);
    }
    fab.addEventListener('click', open);
    sheet.addEventListener('click', function(e){ if(e.target.hasAttribute('data-close')) close(); });
    $('#tocSheetNav').addEventListener('click', function(e){
      var a = e.target.closest('a'); if(a) close();
    });
    window.__closeSheet = close;
  }

  /* ---------------- Recherche ---------------- */
  function fuzzyScore(needle, hay){
    // sous-séquence : renvoie score>0 si toutes les lettres de needle apparaissent dans l'ordre
    var n = 0, score = 0, streak = 0, firstIdx = -1;
    for(var h=0; h<hay.length && n<needle.length; h++){
      if(hay[h] === needle[n]){
        if(firstIdx<0) firstIdx = h;
        streak++; score += 1 + streak; n++;
      } else { streak = 0; }
    }
    if(n < needle.length) return 0;
    score -= firstIdx * 0.05; // bonus si le match commence tôt
    return Math.max(score, 0.1);
  }

  function search(query){
    var q = deburr(query.trim());
    if(!q) return [];
    var tokens = q.split(/\s+/).filter(Boolean);
    var results = [];
    state.index.forEach(function(it){
      var total = 0, ok = true, snip = '';
      tokens.forEach(function(tok){
        var s = 0;
        if(it.nNum.indexOf(tok) === 0) s += 60;
        else if(it.nNum.indexOf(tok) !== -1) s += 30;
        var ti = it.nTitle.indexOf(tok);
        if(ti !== -1) s += 40 - Math.min(ti,20) + (ti===0?15:0);
        else s += fuzzyScore(tok, it.nTitle) * 2.2;
        var bi = it.nBody.indexOf(tok);
        if(bi !== -1){ s += 14 - Math.min(bi/40,10); }
        if(s <= 0){ ok = false; }
        total += s;
      });
      if(ok && total > 0){
        // extrait autour du 1er token trouvé dans le corps
        var pos = it.nBody.indexOf(tokens[0]);
        if(pos === -1){ for(var k=0;k<tokens.length;k++){ pos = it.nBody.indexOf(tokens[k]); if(pos!==-1) break; } }
        results.push({ it: it, score: total, pos: pos });
      }
    });
    results.sort(function(a,b){ return b.score - a.score; });
    return results.slice(0, 24);
  }

  function highlight(text, tokens){
    var out = esc(text), resafe = tokens.map(function(t){ return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).filter(Boolean);
    if(!resafe.length) return out;
    try{
      var re = new RegExp('('+resafe.join('|')+')','gi');
      // reconstruit en tenant compte des accents : on marque sur le texte original via deburr map (approx : match direct)
      out = out.replace(re, '<mark>$1</mark>');
    }catch(e){}
    return out;
  }

  function snippet(item, pos, tokens){
    var body = item.bodyPlain;
    if(pos == null || pos < 0){ return highlight(body.slice(0,150), tokens); }
    var start = Math.max(0, pos - 45);
    var frag = (start>0?'… ':'') + body.slice(start, start + 150) + (start+150<body.length?' …':'');
    return highlight(frag, tokens);
  }

  function setupSearch(){
    var modal = $('#search'), input = $('#searchInput'), list = $('#searchResults'), trigger = $('#searchTrigger');
    var activeIdx = -1, current = [], lastFocus = null;

    function open(){
      lastFocus = document.activeElement;
      modal.hidden = false; document.body.classList.add('is-locked');
      requestAnimationFrame(function(){ modal.classList.add('is-open'); input.focus(); });
      renderResults('');
    }
    function close(){
      modal.classList.remove('is-open'); document.body.classList.remove('is-locked');
      setTimeout(function(){ modal.hidden = true; }, reduceMotion?0:220);
      input.value=''; activeIdx=-1; current=[];
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function renderResults(q){
      current = search(q);
      var tokens = deburr(q.trim()).split(/\s+/).filter(Boolean);
      if(!q.trim()){
        list.innerHTML = '<li class="search__empty">Tapez un mot, un numéro (ex. « 4.2 ») ou un thème.</li>';
        return;
      }
      if(!current.length){
        list.innerHTML = '<li class="search__empty">Aucune règle ne correspond à « '+esc(q)+' ».</li>';
        return;
      }
      list.innerHTML = current.map(function(r, idx){
        return '<li role="option" id="res-'+idx+'" aria-selected="false">'
          + '<a class="result" href="#'+r.it.anchor+'" data-idx="'+idx+'" data-anchor="'+r.it.anchor+'">'
          + '<span class="result__top"><span class="result__num">'+esc(r.it.num)+'</span>'
          + '<span class="result__title">'+highlight(r.it.title, tokens)+'</span>'
          + '<span class="result__cat">'+(r.it.catNum?r.it.catNum+'. ':'')+esc(r.it.cat)+'</span></span>'
          + '<span class="result__snippet">'+snippet(r.it, r.pos, tokens)+'</span></a></li>';
      }).join('');
      activeIdx = 0; markActive();
    }
    function markActive(){
      $$('.result', list).forEach(function(el, i){
        var on = i === activeIdx;
        el.classList.toggle('is-active', on);
        el.parentElement.setAttribute('aria-selected', on?'true':'false');
        if(on){ input.setAttribute('aria-activedescendant','res-'+i); el.scrollIntoView({block:'nearest'}); }
      });
    }
    function choose(idx){
      var el = $$('.result', list)[idx];
      if(!el) return;
      var anchor = el.getAttribute('data-anchor');
      close();
      location.hash = anchor;
      setTimeout(function(){ goToHash(true); }, reduceMotion?0:60);
    }

    trigger.addEventListener('click', open);
    modal.addEventListener('click', function(e){ if(e.target.hasAttribute('data-close')) close(); });
    input.addEventListener('input', function(){ renderResults(input.value); });
    list.addEventListener('click', function(e){
      var a = e.target.closest('.result'); if(!a) return;
      e.preventDefault(); choose(parseInt(a.getAttribute('data-idx'),10));
    });
    input.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){ e.preventDefault(); if(current.length){ activeIdx=(activeIdx+1)%current.length; markActive(); } }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); if(current.length){ activeIdx=(activeIdx-1+current.length)%current.length; markActive(); } }
      else if(e.key === 'Enter'){ e.preventDefault(); if(activeIdx>=0) choose(activeIdx); }
      else if(e.key === 'Escape'){ e.preventDefault(); close(); }
    });

    document.addEventListener('keydown', function(e){
      if((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')){
        e.preventDefault(); if(modal.hidden) open(); else close();
      } else if(e.key === '/' && modal.hidden && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))){
        e.preventDefault(); open();
      } else if(e.key === 'Escape'){
        if(!modal.hidden) close();
        var sheet = $('#tocSheet');
        if(sheet && !sheet.hidden && window.__closeSheet) window.__closeSheet();
      }
    });
  }

  /* ---------------- Clics globaux (copier-lien) ---------------- */
  function setupCopy(){
    document.addEventListener('click', function(e){
      var b = e.target.closest('[data-anchor]');
      if(b && (b.classList.contains('rule__anchor') || b.classList.contains('rule__copy'))){
        copyLink(b.getAttribute('data-anchor'), b);
      }
    });
  }

  /* ---------------- Erreur de chargement ---------------- */
  function showError(){
    $('#rules').innerHTML = '<div class="load-error"><p><strong>Impossible de charger le règlement.</strong></p>'
      + '<p>Le fichier <code>reglement.md</code> n\'a pas pu être lu. Sur GitHub Pages cela fonctionne ; '
      + 'en local, ouvrez le site via un petit serveur (ex. <code>python3 -m http.server</code>) plutôt qu\'en double-cliquant le fichier.</p>'
      + '<p><a href="reglement.md">→ Lire le règlement brut (reglement.md)</a></p></div>';
  }

  /* ---------------- Amorçage ---------------- */
  function boot(){
    setupTheme();
    fetch('reglement.md', { cache: 'no-cache' })
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(text){
        var data = parse(text);
        render(data);
        setupScrollSpy();
        setupProgress();
        setupReveal();
        setupSheet();
        setupSearch();
        setupCopy();
        if(location.hash){ setTimeout(function(){ goToHash(false); }, 60); }
        window.addEventListener('hashchange', function(){ goToHash(true); });
      })
      .catch(function(err){ console.error('Règlement:', err); showError(); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
