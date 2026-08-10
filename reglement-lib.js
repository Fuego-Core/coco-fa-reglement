// Coco FA — parsing + rendu Markdown du règlement (porté de assets/app.js du repo)
export const T = {
  ocean: '#101724', ocean2: '#0B111B', lift: '#1B2534', card: '#161F2D', inset: '#0D131D',
  hair: 'rgba(255,255,255,.08)', hair2: 'rgba(255,255,255,.14)',
  coral: '#FF8A4A', mango: '#FFB257', cool: '#41A0EE',
  t1: '#FAF6F3', t2: '#C2BAB5', t3: '#8A8480', t4: '#6B6663'
};

export const SANCTIONS = {
  'avertissement': ['Avertissement', '#F0C88E', 'rgba(224,162,75,.14)', 'rgba(224,162,75,.42)'],
  'tolerance-zero': ['Tolérance zéro', '#FFC7A0', 'rgba(255,138,74,.14)', 'rgba(255,138,74,.42)'],
  'bannissable': ['Bannissable', '#FFB4B2', 'rgba(224,96,93,.14)', 'rgba(224,96,93,.44)'],
  'kick': ['Kick', '#F0C88E', 'rgba(224,162,75,.14)', 'rgba(224,162,75,.42)'],
  'ban-temp': ['Ban temporaire', '#FFC7A0', 'rgba(255,138,74,.14)', 'rgba(255,138,74,.42)'],
  'ban-def': ['Ban définitif', '#FFB4B2', 'rgba(224,96,93,.14)', 'rgba(224,96,93,.44)']
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const deburr = s => s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : s.toLowerCase();

export function frDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso || '';
  const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return parseInt(m[3], 10) + ' ' + mois[parseInt(m[2], 10) - 1] + ' ' + m[1];
}

export function strip(src) {
  return (src || '').replace(/\r/g, '').replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[>\-*]\s+/gm, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
}

export function mdInline(text, o = {}) {
  const accent = o.accent || T.coral, strong = o.strong || T.t1, inset = o.inset || T.inset, hair = o.hair || T.hair;
  const codes = [], SNT = '\uE000';
  text = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return SNT + (codes.length - 1) + SNT; });
  text = esc(text);
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => {
    const safe = /^(https?:|mailto:|#|\/|\.)/.test(href) ? href : '#';
    const ext = /^https?:/.test(safe) ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + esc(safe) + '"' + ext + ' style="color:' + accent + ';text-decoration:none;border-bottom:1px solid ' + accent + '66">' + t + '</a>';
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:' + strong + '">$1</strong>');
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  text = text.replace(/\uE000(\d+)\uE000/g, (_, i) =>
    '<code style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.86em;background:' + inset + ';border:1px solid ' + hair + ';border-radius:6px;padding:.06em .38em">' + esc(codes[+i]) + '</code>');
  return text;
}

export function mdBlocks(src, o = {}) {
  const accent = o.accent || T.coral, muted = o.muted || T.t2, inset = o.inset || T.inset, hair = o.hair || T.hair, t1 = o.strong || T.t1;
  const lines = (src || '').replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  const isSep = l => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.indexOf('|') !== -1 && i + 1 < lines.length && isSep(lines[i + 1])) {
      const head = cells(line); i += 2; const rows = [];
      while (i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim()) { rows.push(cells(lines[i])); i++; }
      let t = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:.94em;border:1px solid ' + hair + '"><thead><tr>';
      head.forEach(h => { t += '<th style="background:' + inset + ';text-align:left;font-weight:700;font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;padding:.6rem .85rem;color:' + t1 + ';border-bottom:1px solid ' + hair + '">' + mdInline(h, o) + '</th>'; });
      t += '</tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr>';
        for (let c = 0; c < head.length; c++) t += '<td style="padding:.6rem .85rem;border-bottom:1px solid ' + hair + ';vertical-align:top">' + mdInline(r[c] || '', o) + '</td>';
        t += '</tr>';
      });
      out.push(t + '</tbody></table></div>'); continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push('<blockquote style="margin:1rem 0;padding:.1rem 0 .1rem 1.1rem;border-left:2px solid ' + accent + '80;color:' + muted + '">' + mdInline(buf.join(' '), o) + '</blockquote>'); continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, '')); i++; }
      out.push('<ul style="margin:.7rem 0;padding-left:1.15rem;list-style:none">' + items.map(it =>
        '<li style="margin:.3rem 0;position:relative"><span style="position:absolute;left:-1.15rem;color:' + accent + '">—</span>' + mdInline(it, o) + '</li>').join('') + '</ul>'); continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const oi = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { oi.push(lines[i].replace(/^\d+\.\s+/, '')); i++; }
      out.push('<ol style="margin:.7rem 0;padding-left:1.3rem">' + oi.map(it => '<li style="margin:.3rem 0">' + mdInline(it, o) + '</li>').join('') + '</ol>'); continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^>\s?/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push('<p style="margin:.7rem 0">' + mdInline(para.join(' '), o) + '</p>');
  }
  return out.join('\n');
}

export function parseDoc(text) {
  text = (text || '').replace(/\r/g, '');
  const meta = {};
  let body = text;
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (fm) {
    fm[1].split('\n').forEach(l => { const m = /^([\w-]+)\s*:\s*(.*)$/.exec(l); if (m) meta[m[1].trim()] = m[2].trim(); });
    body = text.slice(fm[0].length);
  }
  const lines = body.split('\n');
  const cats = [];
  let changelog = null, cur = null, curRule = null, mode = null;
  const flush = () => { if (curRule) { curRule.bodyRaw = curRule.bodyLines.join('\n').trim(); cur.rules.push(curRule); curRule = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h1 = /^#\s+(?:@(\w+)\s+)?(.+)$/.exec(line);
    if (h1) {
      flush();
      if ((h1[1] || '').toLowerCase() === 'changelog') { changelog = { title: h1[2].trim(), introLines: [], entries: [] }; cur = null; mode = 'changelog'; continue; }
      let title = h1[2].trim();
      const slugM = /\{#([A-Za-z0-9_-]+)\}\s*$/.exec(title);
      const explicitId = slugM ? slugM[1] : null;
      if (slugM) title = title.slice(0, slugM.index).trim();
      const numM = /^(\d+)\.\s+(.*)$/.exec(title);
      cur = { num: numM ? numM[1] : '', title: numM ? numM[2] : title, id: explicitId || ('cat-' + (numM ? numM[1] : i)), kicker: null, introLines: [], rules: [] };
      cats.push(cur); mode = 'cat-meta'; continue;
    }
    const h2 = /^##\s+(\d+(?:\.\d+)+)\s+(.*)$/.exec(line);
    if (h2 && cur) { flush(); curRule = { id: h2[1], title: h2[2].trim(), sanction: null, maj: null, bodyLines: [] }; mode = 'rule-meta'; continue; }
    if (mode === 'changelog' && changelog) {
      const ce = /^[-*]\s+(.+)$/.exec(line);
      if (ce) { const p = ce[1].split('·').map(s => s.trim()); changelog.entries.push({ date: p[0] || '', ver: p[1] || '', text: p.slice(2).join(' · ') || '' }); }
      else if (line.trim()) changelog.introLines.push(line);
      continue;
    }
    if (mode === 'rule-meta' && curRule) {
      const mm = /^(sanction|maj|tags)\s*:\s*(.*)$/.exec(line);
      if (mm) { if (mm[1] !== 'tags') curRule[mm[1]] = mm[2].trim(); continue; }
      if (!line.trim()) continue;
      mode = 'rule-body'; curRule.bodyLines.push(line); continue;
    }
    if (mode === 'rule-body' && curRule) { curRule.bodyLines.push(line); continue; }
    if (mode === 'cat-meta' && cur) {
      const cm = /^(kicker)\s*:\s*(.*)$/.exec(line);
      if (cm) { cur.kicker = cm[2].trim(); continue; }
      if (!line.trim()) continue;
      mode = 'cat-intro'; cur.introLines.push(line); continue;
    }
    if (mode === 'cat-intro' && cur) { cur.introLines.push(line); continue; }
  }
  flush();
  return { meta, cats, changelog };
}

export function anchorOf(id) { return 'regle-' + String(id).replace(/\./g, '-'); }

export function buildIndex(data) {
  const index = [];
  data.cats.forEach(cat => cat.rules.forEach(r => {
    const b = strip(r.bodyRaw);
    index.push({
      num: r.id, title: r.title, anchor: anchorOf(r.id),
      cat: (cat.num ? cat.num + '. ' : '') + cat.title, body: b,
      n: deburr(r.title + ' ' + r.id + ' ' + b)
    });
  }));
  return index;
}

export function searchIndex(index, q) {
  const nq = deburr((q || '').trim());
  if (!nq) return [];
  const toks = nq.split(/\s+/).filter(Boolean);
  return index.filter(it => toks.every(t => it.n.indexOf(t) !== -1)).slice(0, 20);
}
