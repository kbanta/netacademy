/* NetAcademy animation engine — topology diagrams, ladder (sequence) diagrams,
   free-form stages, and a step player with play / pause / next / back / speed.
   Plain script (no modules) so it runs from file:// with no server. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach(c => {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return e;
  }

  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /* ---------- audio settings (shared, saved in localStorage) ---------- */
  const SKEY = 'netacademy-audio-v1';
  const Settings = {
    sound: true, voice: false, rate: 1, voiceName: '',
    load() { try { Object.assign(this, JSON.parse(localStorage.getItem(SKEY)) || {}); } catch (e) { /* ignore */ } },
    save() {
      try { localStorage.setItem(SKEY, JSON.stringify({ sound: this.sound, voice: this.voice, rate: this.rate, voiceName: this.voiceName })); } catch (e) { /* ignore */ }
      window.dispatchEvent(new Event('netacademy-audio'));
    },
    set(k, v) { this[k] = v; this.save(); }
  };
  Settings.load();

  /* ---------- sound effects: generated with Web Audio, no files needed ---------- */
  const Sound = {
    ctx: null, last: 0,
    tone(freq, dur, type, vol, delay) {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    play(kind) {
      if (!Settings.sound) return;
      const now = performance.now();
      if (kind !== 'ok' && kind !== 'bad' && now - this.last < 70) return; // flood of packets → one sound
      this.last = now;
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        switch (kind) {
          case 'send': this.tone(620, 0.07, 'sine', 0.05); break;
          case 'arrive': this.tone(940, 0.09, 'triangle', 0.045); break;
          case 'drop': this.tone(150, 0.22, 'sawtooth', 0.04); this.tone(110, 0.25, 'square', 0.02, 0.05); break;
          case 'ok': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.05, i * 0.08)); break;
          case 'bad': this.tone(220, 0.18, 'square', 0.035); this.tone(180, 0.22, 'square', 0.035, 0.12); break;
        }
      } catch (e) { /* audio not available */ }
    }
  };

  /* ---------- narration: browser text-to-speech (offline voices on Windows/macOS) ---------- */
  const Voice = {
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    token: 0,
    voices() {
      if (!this.supported) return [];
      const v = speechSynthesis.getVoices();
      const en = v.filter(x => /^en/i.test(x.lang));
      return en.length ? en : v;
    },
    clean(html) {
      const s = String(html)
        .replace(/<sup>(.*?)<\/sup>/gi, ' to the power of $1 ')
        .replace(/<br\s*\/?>/gi, '. ');
      const d = document.createElement('div'); d.innerHTML = s;
      return (d.textContent || '')
        .replace(/→/g, ' to ').replace(/←/g, ' from ').replace(/↔/g, ' and ').replace(/×/g, ' times ').replace(/−/g, ' minus ')
        .replace(/(\d)\/(\d{1,3})\b/g, '$1 slash $2').replace(/(^|\s)\/(\d{1,2})\b/g, '$1slash $2')
        .replace(/\bvs\b/gi, 'versus').replace(/\be\.g\./gi, 'for example').replace(/\bi\.e\./gi, 'that is')
        .replace(/[✓✕❚▶◀⟲•·]/g, ' ').replace(/\s+/g, ' ').trim();
    },
    chunks(text) {
      // Chrome stops long utterances (~15 s), so speak sentence-sized pieces
      const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
      const out = []; let cur = '';
      parts.forEach(p => { if ((cur + p).length > 220 && cur) { out.push(cur); cur = p; } else cur += p; });
      if (cur.trim()) out.push(cur);
      return out;
    },
    /* speak text; resolves when finished or interrupted. opts.force ignores the narration setting */
    async speak(html, opts) {
      opts = opts || {};
      if (!this.supported || (!Settings.voice && !opts.force)) return false;
      this.stop();
      const my = ++this.token;
      const text = this.clean(html);
      if (!text) return true;
      const voice = this.voices().find(v => v.name === Settings.voiceName);
      for (const part of this.chunks(text)) {
        if (my !== this.token) return false;
        await new Promise(res => {
          const u = new SpeechSynthesisUtterance(part);
          u.rate = Settings.rate * (opts.rate || 1);
          if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
          const safety = setTimeout(res, part.length * 110 / u.rate + 2500);
          u.onend = u.onerror = () => { clearTimeout(safety); res(); };
          speechSynthesis.speak(u);
        });
      }
      return my === this.token; // true = finished, false = interrupted
    },
    stop() { this.token++; if (this.supported) speechSynthesis.cancel(); }
  };
  if (Voice.supported) speechSynthesis.getVoices(); // warm up voice list

  /* ---------- device icons (drawn around 0,0) ---------- */
  function drawIcon(g, type) {
    switch (type) {
      case 'pc':
        svg('rect', { x: -20, y: -20, width: 40, height: 28, rx: 3, class: 'dev' }, g);
        svg('rect', { x: -16, y: -16, width: 32, height: 20, rx: 1, class: 'dev-screen' }, g);
        svg('rect', { x: -4, y: 8, width: 8, height: 6, class: 'dev' }, g);
        svg('rect', { x: -13, y: 14, width: 26, height: 4, rx: 2, class: 'dev' }, g);
        break;
      case 'laptop':
        svg('rect', { x: -17, y: -18, width: 34, height: 24, rx: 3, class: 'dev' }, g);
        svg('rect', { x: -14, y: -15, width: 28, height: 18, rx: 1, class: 'dev-screen' }, g);
        svg('path', { d: 'M-22 8 H22 L18 14 H-18 Z', class: 'dev' }, g);
        break;
      case 'switch':
      case 'l3switch':
        svg('rect', { x: -27, y: -15, width: 54, height: 30, rx: 5, class: 'dev' }, g);
        svg('path', { d: 'M-17 -5 H13 M7 -10 L13 -5 L7 0 M17 5 H-13 M-7 0 L-13 5 L-7 10', class: 'dev-line' }, g);
        if (type === 'l3switch') {
          svg('rect', { x: 14, y: -24, width: 20, height: 13, rx: 3, class: 'dev-tag' }, g);
          svg('text', { x: 24, y: -14, class: 'dev-tag-t' }, g).textContent = 'L3';
        }
        break;
      case 'router':
        svg('ellipse', { cx: 0, cy: 0, rx: 25, ry: 17, class: 'dev' }, g);
        svg('path', {
          d: 'M-15 -8 L-5 -2 M-15 -8 L-9 -8 M-15 -8 L-13 -3 M15 8 L5 2 M15 8 L9 8 M15 8 L13 3 M15 -8 L5 -2 M15 -8 L9 -8 M15 -8 L13 -3 M-15 8 L-5 2 M-15 8 L-9 8 M-15 8 L-13 3',
          class: 'dev-line'
        }, g);
        break;
      case 'server':
        svg('rect', { x: -15, y: -24, width: 30, height: 46, rx: 3, class: 'dev' }, g);
        [-14, -2, 10].forEach(y => {
          svg('line', { x1: -10, y1: y + 6, x2: 4, y2: y + 6, class: 'dev-line' }, g);
          svg('circle', { cx: 8, cy: y + 6, r: 2, class: 'dev-led' }, g);
        });
        break;
      case 'cloud':
        svg('path', { d: 'M-24 14 C-38 14 -38 -4 -24 -4 C-24 -20 -2 -24 4 -11 C11 -20 28 -15 26 -2 C38 -2 38 14 26 14 Z', class: 'dev dev-cloud' }, g);
        break;
      case 'firewall':
        svg('rect', { x: -22, y: -17, width: 44, height: 34, rx: 3, class: 'dev dev-fw' }, g);
        svg('path', { d: 'M-22 -6 H22 M-22 5 H22 M-8 -17 V-6 M8 -17 V-6 M0 -6 V5 M-14 -6 V5 M14 -6 V5 M-8 5 V17 M8 5 V17', class: 'dev-line' }, g);
        break;
      case 'ap':
        svg('rect', { x: -20, y: -2, width: 40, height: 14, rx: 5, class: 'dev' }, g);
        svg('path', { d: 'M-9 -9 A13 13 0 0 1 9 -9 M-16 -16 A22 22 0 0 1 16 -16', class: 'dev-line', fill: 'none' }, g);
        svg('circle', { cx: 0, cy: 5, r: 2, class: 'dev-led' }, g);
        break;
      case 'patch': // 1U patch panel: thin box with two rows of ports
        svg('rect', { x: -30, y: -9, width: 60, height: 18, rx: 3, class: 'dev' }, g);
        for (let i = 0; i < 8; i++) {
          svg('rect', { x: -25 + i * 6.5, y: -5, width: 4, height: 4, class: 'dev-port' }, g);
          svg('rect', { x: -25 + i * 6.5, y: 1.5, width: 4, height: 4, class: 'dev-port' }, g);
        }
        break;
      case 'jack': // wall outlet faceplate with two RJ45 keystones
        svg('rect', { x: -13, y: -18, width: 26, height: 36, rx: 4, class: 'dev' }, g);
        svg('rect', { x: -6, y: -11, width: 12, height: 9, rx: 1.5, class: 'dev-port' }, g);
        svg('rect', { x: -6, y: 3, width: 12, height: 9, rx: 1.5, class: 'dev-port' }, g);
        break;
      case 'none':
        break;
      default:
        svg('circle', { r: 18, class: 'dev' }, g);
    }
  }

  function icon(type, size) {
    const s = svg('svg', { viewBox: '-40 -32 80 64', width: size || 80, height: (size || 80) * 0.8, class: 'icon-svg' });
    drawIcon(svg('g', {}, s), type);
    return s;
  }

  /* ---------- base animation object ---------- */
  class Anim {
    constructor(host) { this.host = host; this.speed = 1; this.instant = false; this.dead = false; }
    wait(ms) {
      if (this.instant || this.dead) return Promise.resolve();
      return new Promise(r => setTimeout(r, ms / this.speed));
    }
    tween(ms, fn) {
      if (this.instant || this.dead) { fn(1); return Promise.resolve(); }
      return new Promise(res => {
        const dur = ms / this.speed, t0 = performance.now();
        const tick = now => {
          if (this.dead) { fn(1); res(); return; }
          const p = Math.min(1, (now - t0) / dur);
          fn(ease(p));
          if (p < 1) requestAnimationFrame(tick); else res();
        };
        requestAnimationFrame(tick);
      });
    }
    destroy() { this.dead = true; }
  }

  /* ---------- packet graphic ---------- */
  function makePacket(parent) {
    const g = svg('g', { class: 'pkt' }, parent);
    const tagG = svg('g', { class: 'pkt-tag' }, g);
    const tagR = svg('rect', { y: -31, height: 15, rx: 4 }, tagG);
    const tagT = svg('text', { y: -20 }, tagG);
    const r = svg('rect', { y: -11, height: 22, rx: 11 }, g);
    const t = svg('text', { y: 4 }, g);
    const api = {
      g,
      set(o) {
        const label = o.label || '';
        t.textContent = label;
        const w = Math.max(26, label.length * 6.6 + 18);
        r.setAttribute('x', -w / 2); r.setAttribute('width', w);
        r.setAttribute('class', 'pkt-body c-' + (o.color || 'blue'));
        if (o.tag) {
          tagG.style.display = '';
          tagT.textContent = o.tag;
          const tw = o.tag.length * 6 + 12;
          tagR.setAttribute('x', -tw / 2); tagR.setAttribute('width', tw);
        } else tagG.style.display = 'none';
      },
      at(x, y) { g.setAttribute('transform', `translate(${x},${y})`); }
    };
    return api;
  }

  /* ---------- Topology diagram ---------- */
  class Topo extends Anim {
    constructor(host, cfg) {
      super(host);
      this.cfg = cfg;
      this.W = cfg.w || 800; this.H = cfg.h || 360;
      this.nodes = {}; this.links = []; this.tables = {};
      const wrap = h('div', { class: 'topo' + (cfg.tables ? ' with-tables' : '') });
      this.svg = svg('svg', { viewBox: `0 0 ${this.W} ${this.H}`, class: 'topo-svg', role: 'img', 'aria-label': cfg.alt || 'Network diagram' });
      this.gZones = svg('g', {}, this.svg);
      this.gLinks = svg('g', {}, this.svg);
      this.gLinkLbl = svg('g', {}, this.svg);
      this.gNodes = svg('g', {}, this.svg);
      this.gFx = svg('g', {}, this.svg);
      const box = h('div', { class: 'topo-box' }, this.svg);
      wrap.appendChild(box);
      this.panel = h('div', { class: 'topo-tables' });
      if (cfg.tables) wrap.appendChild(this.panel);
      host.appendChild(wrap);
      (cfg.zones || []).forEach(z => this.zone(z));
      cfg.nodes.forEach(n => this.addNode(n));
      (cfg.links || []).forEach(l => this.addLink(l));
      (cfg.tables || []).forEach(t => this.table(t.id, t.title, t.cols, t.rows || []));
    }

    zone(z) {
      const g = svg('g', { class: 'zone z-' + (z.color || 'gray') }, this.gZones);
      svg('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: 14 }, g);
      svg('text', { x: z.x + 12, y: z.bottom ? z.y + z.h - 10 : z.y + 20 }, g).textContent = z.label || '';
      return g;
    }

    addNode(n) {
      const g = svg('g', { class: 'node' + (n.color ? ' tint-' + n.color : ''), transform: `translate(${n.x},${n.y})` }, this.gNodes);
      const ring = svg('circle', { r: 34, class: 'node-ring' }, g);
      drawIcon(svg('g', {}, g), n.type || 'pc');
      const lbl = svg('text', { y: 40, class: 'node-label' }, g); lbl.textContent = n.label !== undefined ? n.label : n.id;
      const sub = svg('text', { y: 54, class: 'node-sub' }, g); sub.textContent = n.sub || '';
      const badgeG = svg('g', { class: 'node-badge', style: 'display:none' }, g);
      const badgeR = svg('rect', { y: -52, height: 18, rx: 9 }, badgeG);
      const badgeT = svg('text', { y: -39 }, badgeG);
      this.nodes[n.id] = Object.assign({}, n, { g, ring, lbl, sub, badgeG, badgeR, badgeT });
    }

    node(id) { const n = this.nodes[id]; if (!n) throw new Error('No node ' + id); return n; }

    addLink(l) {
      const a = this.node(l.a), b = this.node(l.b);
      const line = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'link ' + (l.cls || '') }, this.gLinks);
      const obj = { a: l.a, b: l.b, line, ports: {} };
      if (l.label) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const t = svg('text', { x: mx + (l.lx || 0), y: my - 8 + (l.ly || 0), class: 'link-label' }, this.gLinkLbl);
        t.textContent = l.label; obj.lbl = t;
      }
      this.links.push(obj);
      if (l.pa) this.port(l.a, l.b, l.a, l.pa);
      if (l.pb) this.port(l.a, l.b, l.b, l.pb);
      return obj;
    }

    link(a, b) {
      return this.links.find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a));
    }

    setLink(a, b, cls) { const l = this.link(a, b); if (l) l.line.setAttribute('class', 'link ' + (cls || '')); }
    linkLabel(a, b, text) { const l = this.link(a, b); if (l && l.lbl) l.lbl.textContent = text; }

    /* text label on a link end, near node `near` */
    port(a, b, near, text, cls) {
      const l = this.link(a, b); if (!l) return;
      const n = this.node(near), o = this.node(near === a ? b : a);
      const dx = o.x - n.x, dy = o.y - n.y, len = Math.hypot(dx, dy) || 1;
      const d = Math.min(84, len * 0.4);
      const px = n.x + dx / len * d, py = n.y + dy / len * d;
      let p = l.ports[near];
      if (!p) {
        p = svg('g', { class: 'port' }, this.gLinkLbl);
        p.r = svg('rect', { height: 16, rx: 4 }, p);
        p.t = svg('text', { y: 4 }, p);
        l.ports[near] = p;
      }
      p.setAttribute('transform', `translate(${px},${py})`);
      p.setAttribute('class', 'port' + (cls ? ' p-' + cls : ''));
      p.t.textContent = text;
      const w = text.length * 6.2 + 10;
      p.r.setAttribute('x', -w / 2); p.r.setAttribute('y', -8); p.r.setAttribute('width', w);
      p.style.display = text ? '' : 'none';
    }

    setSub(id, text) { this.node(id).sub.textContent = text; }
    setLabel(id, text) { this.node(id).lbl.textContent = text; }

    badge(id, text, cls) {
      const n = this.node(id);
      if (!text) { n.badgeG.style.display = 'none'; return; }
      n.badgeG.style.display = '';
      n.badgeG.setAttribute('class', 'node-badge ' + (cls || ''));
      n.badgeT.textContent = text;
      const w = text.length * 6.6 + 16;
      n.badgeR.setAttribute('x', -w / 2); n.badgeR.setAttribute('width', w);
    }

    /* speech bubble — transient, non-blocking */
    say(id, text, ms, cls) {
      const n = this.node(id);
      if (this.instant || this.dead) return;
      const g = svg('g', { class: 'bubble ' + (cls || ''), transform: `translate(${n.x},${n.y - 60})` }, this.gFx);
      const w = text.length * 6.4 + 20;
      svg('rect', { x: -w / 2, y: -14, width: w, height: 24, rx: 8 }, g);
      svg('path', { d: 'M-6 10 L0 18 L6 10 Z' }, g);
      svg('text', { y: 3 }, g).textContent = text;
      // keep inside viewBox horizontally
      const minX = w / 2 + 4, maxX = this.W - w / 2 - 4;
      const x = Math.max(minX, Math.min(maxX, n.x));
      g.setAttribute('transform', `translate(${x},${Math.max(18, n.y - 60)})`);
      setTimeout(() => g.classList.add('out'), (ms || 2000) / this.speed);
      setTimeout(() => g.remove(), (ms || 2000) / this.speed + 400);
    }

    flash(id, color) {
      const n = this.node(id);
      if (this.instant || this.dead) return Promise.resolve();
      const c = svg('circle', { cx: n.x, cy: n.y, r: 30, class: 'flash c-' + (color || 'blue') }, this.gFx);
      return this.tween(650, p => { c.setAttribute('r', 30 + p * 22); c.style.opacity = 1 - p; }).then(() => c.remove());
    }

    glow(id, on, color) {
      const n = this.node(id);
      n.ring.setAttribute('class', 'node-ring' + (on ? ' on c-' + (color || 'blue') : ''));
    }

    /* animate a packet along a list of node ids.
       opts: label, color, tag, drop (bool: dropped at final node), seg: [per-segment overrides] */
    async send(path, opts) {
      opts = opts || {};
      path.forEach(id => this.node(id)); // validate ids even when skipping animation
      if (this.instant || this.dead) return;
      Sound.play('send');
      const p = makePacket(this.gFx);
      let cur = Object.assign({}, opts);
      for (let i = 0; i < path.length - 1; i++) {
        const s = Object.assign({}, opts, (opts.seg || [])[i] || {});
        p.set(s); cur = s;
        const a = this.node(path[i]), b = this.node(path[i + 1]);
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const ms = opts.ms || Math.max(450, Math.min(1200, dist * 3.2));
        await this.tween(ms, t => p.at(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
        if (this.dead) break;
        if (i < path.length - 2 && b.type !== 'none') this.flash(path[i + 1], s.color);
      }
      const end = path[path.length - 1];
      if (opts.drop) {
        if (!this.dead) Sound.play('drop');
        p.g.classList.add('dropped');
        const n = this.node(end);
        const x = svg('text', { x: n.x + 26, y: n.y - 18, class: 'drop-x' }, this.gFx); x.textContent = '✕';
        await this.wait(650);
        x.remove();
      } else {
        if (!this.dead) Sound.play('arrive');
        this.flash(end, cur.color);
      }
      p.g.remove();
    }

    /* several packets at once */
    many(paths, opts) {
      return Promise.all(paths.map(pp => Array.isArray(pp) ? this.send(pp, opts) : this.send(pp.path, Object.assign({}, opts, pp))));
    }

    /* ---------- side tables ---------- */
    table(id, title, cols, rows) {
      const t = { id, title, cols, rows: rows ? rows.slice() : [], hi: -1, el: h('div', { class: 'ttable' }) };
      this.tables[id] = t;
      this.panel.appendChild(t.el);
      this.renderTable(id);
      return t;
    }
    renderTable(id) {
      const t = this.tables[id];
      t.el.innerHTML = '';
      t.el.appendChild(h('div', { class: 'ttable-title' }, t.title));
      const tbl = h('table', {},
        h('thead', {}, h('tr', {}, t.cols.map(c => h('th', {}, c)))),
        h('tbody', {}, t.rows.length
          ? t.rows.map((r, i) => h('tr', { class: (i === t.hi ? 'hi' : '') + (r._cls ? ' ' + r._cls : '') }, (r.cells || r).map(c => h('td', {}, String(c)))))
          : h('tr', { class: 'empty' }, h('td', { colspan: t.cols.length }, '(empty)')))
      );
      t.el.appendChild(tbl);
    }
    addRow(id, row, cls) {
      const t = this.tables[id];
      t.rows.push(cls ? { cells: row, _cls: cls } : row);
      t.hi = t.rows.length - 1;
      this.renderTable(id);
    }
    setRows(id, rows, hi, title) {
      const t = this.tables[id];
      t.rows = rows.slice(); t.hi = hi === undefined ? -1 : hi;
      if (title) t.title = title;
      this.renderTable(id);
    }
    hiRow(id, i) { const t = this.tables[id]; t.hi = i; this.renderTable(id); }
  }

  /* ---------- Ladder / sequence diagram ---------- */
  class Ladder extends Anim {
    constructor(host, cfg) {
      super(host);
      this.cfg = cfg;
      this.W = cfg.w || 700;
      this.top = 96; this.y = this.top + 26; this.rowH = cfg.rowH || 46;
      this.svg = svg('svg', { class: 'ladder-svg', role: 'img', 'aria-label': cfg.alt || 'Sequence diagram' });
      this.gLines = svg('g', {}, this.svg);
      this.gRows = svg('g', {}, this.svg);
      host.appendChild(h('div', { class: 'ladder' }, this.svg));
      const n = cfg.actors.length, pad = cfg.pad || 110;
      this.x = {};
      this.lifelines = [];
      cfg.actors.forEach((a, i) => {
        const x = n === 1 ? this.W / 2 : pad + i * (this.W - 2 * pad) / (n - 1);
        this.x[a.id] = x;
        const g = svg('g', { class: 'node' + (a.color ? ' tint-' + a.color : ''), transform: `translate(${x},34)` }, this.svg);
        drawIcon(svg('g', {}, g), a.type || 'pc');
        svg('text', { y: 42, class: 'node-label' }, g).textContent = a.label;
        if (a.sub) svg('text', { y: 56, class: 'node-sub' }, g).textContent = a.sub;
        this.lifelines.push(svg('line', { x1: x, x2: x, y1: this.top, y2: this.top + 40, class: 'lifeline' }, this.gLines));
      });
      this.resize();
    }
    resize() {
      const H = this.y + 20;
      this.svg.setAttribute('viewBox', `0 0 ${this.W} ${H}`);
      this.lifelines.forEach(l => l.setAttribute('y2', H - 6));
    }
    async arrow(from, to, label, o) {
      o = o || {};
      const y = this.y; this.y += this.rowH; this.resize();
      const x1 = this.x[from], x2 = this.x[to], dir = x2 > x1 ? 1 : -1;
      if (x1 === undefined || x2 === undefined) throw new Error('Unknown actor ' + from + '/' + to);
      const g = svg('g', { class: 'arrow c-' + (o.color || 'blue') + (o.dashed ? ' dashed' : '') }, this.gRows);
      const line = svg('line', { x1, y1: y, x2: x1, y2: y }, g);
      const head = svg('path', { d: `M0 0 L${-10 * dir} -5 L${-10 * dir} 5 Z` }, g);
      const t = svg('text', { x: (x1 + x2) / 2, y: y - 8, class: 'arrow-label' }, g); t.textContent = label;
      if (o.sub) { const s = svg('text', { x: (x1 + x2) / 2, y: y + 16, class: 'arrow-sub' }, g); s.textContent = o.sub; }
      if (!this.instant && !this.dead) Sound.play(o.lost ? 'drop' : 'send');
      await this.tween(o.ms || 800, p => {
        const x = x1 + (x2 - x1) * p;
        line.setAttribute('x2', x);
        head.setAttribute('transform', `translate(${x},${y})`);
      });
      if (o.lost) {
        const X = svg('text', { x: (x1 + x2) / 2 + 30 * dir, y: y + 5, class: 'drop-x' }, g); X.textContent = '✕';
      }
    }
    note(text, cls) {
      const y = this.y + 4; this.y += 32; this.resize();
      const g = svg('g', { class: 'lnote ' + (cls || '') }, this.gRows);
      const w = text.length * 6.6 + 24;
      svg('rect', { x: this.W / 2 - w / 2, y: y - 14, width: w, height: 24, rx: 6 }, g);
      svg('text', { x: this.W / 2, y: y + 3 }, g).textContent = text;
      return this.wait(400);
    }
  }

  /* ---------- free-form HTML stage ---------- */
  class Stage extends Anim {
    constructor(host, cfg) {
      super(host);
      this.cfg = cfg || {};
      this.root = h('div', { class: 'stage ' + (this.cfg.cls || '') });
      host.appendChild(this.root);
      if (this.cfg.init) this.cfg.init(this);
    }
    $(sel) { return this.root.querySelector(sel); }
    $$(sel) { return Array.from(this.root.querySelectorAll(sel)); }
  }

  /* ---------- step player ---------- */
  class Player {
    constructor(host, sc) {
      this.sc = sc; this.speed = 1; this.gen = 0; this.idx = -1; this.busy = false; this.playing = false;
      this.el = h('div', { class: 'sim' });
      const head = h('div', { class: 'sim-head' },
        h('div', { class: 'sim-kicker' }, sc.kind === 'ladder' ? 'Sequence animation' : sc.kind === 'stage' ? 'Interactive animation' : 'Network animation'),
        h('h3', {}, sc.title),
        sc.desc ? h('p', { class: 'sim-desc' }, sc.desc) : null);
      this.stageEl = h('div', { class: 'sim-stage' });
      this.capNum = h('span', { class: 'cap-num' });
      this.capText = h('div', { class: 'cap-text' });
      this.caption = h('div', { class: 'sim-caption', 'aria-live': 'polite' }, this.capNum, this.capText);
      this.bReset = h('button', { class: 'ctl', title: 'Restart', onclick: () => this.reset() }, '⟲ Restart');
      this.bPrev = h('button', { class: 'ctl', title: 'Previous step', onclick: () => this.prev() }, '◀ Back');
      this.bPlay = h('button', { class: 'ctl primary', title: 'Play all steps', onclick: () => this.play() }, '▶ Play');
      this.bNext = h('button', { class: 'ctl', title: 'Next step', onclick: () => { this.playing = false; this.next(); } }, 'Next ▶');
      this.sel = h('select', { class: 'ctl', title: 'Animation speed', onchange: e => { this.speed = +e.target.value; if (this.obj) this.obj.speed = this.speed; } },
        [['0.5', '0.5× slow'], ['1', '1× normal'], ['1.5', '1.5×'], ['2.5', '2.5× fast']].map(([v, l]) => h('option', { value: v, selected: v === '1' ? 'selected' : null }, l)));
      this.dots = h('div', { class: 'sim-dots' }, sc.steps.map((_, i) => h('button', { class: 'dot', title: 'Jump to step ' + (i + 1), onclick: () => this.jump(i) })));
      this.bVoice = h('button', { class: 'ctl toggle', title: 'Read each step aloud (narration)', 'aria-pressed': 'false', onclick: () => {
        Settings.set('voice', !Settings.voice);
        if (Settings.voice) this.say(); else Voice.stop();
      } }, '🗣 Narrate');
      this.bSound = h('button', { class: 'ctl toggle', title: 'Sound effects for packets', 'aria-pressed': 'false', onclick: () => Settings.set('sound', !Settings.sound) }, '🔊 Sounds');
      if (!Voice.supported) this.bVoice.style.display = 'none';
      this.syncAudio = () => {
        this.bVoice.classList.toggle('on', Settings.voice); this.bVoice.setAttribute('aria-pressed', String(Settings.voice));
        this.bSound.classList.toggle('on', Settings.sound); this.bSound.setAttribute('aria-pressed', String(Settings.sound));
        this.bSound.textContent = Settings.sound ? '🔊 Sounds' : '🔇 Sounds';
      };
      window.addEventListener('netacademy-audio', this.syncAudio);
      this.syncAudio();
      const ctl = h('div', { class: 'sim-controls' }, this.bReset, this.bPrev, this.bPlay, this.bNext, h('span', { class: 'grow' }), this.bVoice, this.bSound, this.sel);
      this.el.append(head, this.stageEl, this.caption, this.dots, ctl);
      host.appendChild(this.el);
      this.reset();
    }
    make() {
      if (this.obj) this.obj.destroy();
      this.stageEl.innerHTML = '';
      const k = this.sc.kind;
      this.obj = k === 'ladder' ? new Ladder(this.stageEl, this.sc.cfg)
        : k === 'stage' ? new Stage(this.stageEl, this.sc.cfg)
          : new Topo(this.stageEl, this.sc.cfg);
      this.obj.speed = this.speed;
    }
    setCaption(i) {
      if (i < 0) { this.capNum.textContent = 'Ready'; this.capText.innerHTML = this.sc.intro || 'Press <b>▶ Play</b> to watch everything, or <b>Next ▶</b> to go one step at a time.'; }
      else { this.capNum.textContent = `Step ${i + 1} / ${this.sc.steps.length}`; this.capText.innerHTML = this.sc.steps[i].text; }
    }
    ui() {
      const last = this.sc.steps.length - 1;
      this.bPlay.textContent = this.playing ? '❚❚ Pause' : (this.idx >= last ? '⟲ Replay' : '▶ Play');
      this.bNext.disabled = this.idx >= last;
      this.bPrev.disabled = this.idx < 0;
      Array.from(this.dots.children).forEach((d, i) => d.className = 'dot' + (i < this.idx ? ' done' : i === this.idx ? ' cur' : ''));
    }
    /* narrate the current caption (only when narration is on) */
    say() {
      const text = (this.idx < 0 ? this.sc.title + '. ' + (this.sc.desc || '') : this.sc.steps[this.idx].text);
      this.speech = Voice.speak(text, { rate: Math.min(1.4, Math.max(0.85, this.speed)) });
      return this.speech;
    }
    reset() {
      if (this.obj && Settings.voice) Voice.stop();
      this.gen++; this.playing = false; this.busy = false; this.idx = -1; this.speech = null;
      this.make(); this.setCaption(-1); this.ui();
    }
    async next() {
      if (this.busy || this.idx >= this.sc.steps.length - 1) return;
      this.busy = true;
      const g = this.gen;
      this.idx++;
      this.setCaption(this.idx); this.ui();
      this.say();
      try { await this.sc.steps[this.idx].run(this.obj); } catch (e) { console.error(e); }
      if (g !== this.gen) return;
      this.busy = false; this.ui();
    }
    async play() {
      const last = this.sc.steps.length - 1;
      if (this.playing) { this.playing = false; this.ui(); return; }
      if (this.idx >= last) this.reset();
      this.playing = true; this.ui();
      const g = this.gen;
      while (this.playing && g === this.gen && this.idx < last) {
        if (this.busy) { await new Promise(r => setTimeout(r, 100)); continue; }
        await this.next();
        if (g !== this.gen) return;
        if (this.idx < last) {
          // with narration: wait until the voice finishes; without: give time to read
          if (Settings.voice && Voice.supported && this.speech) { await this.speech; if (g !== this.gen) return; await this.obj.wait(450); }
          else await this.obj.wait(1100 + Math.min(1600, this.capText.textContent.length * 9));
        }
      }
      if (g === this.gen) { this.playing = false; this.ui(); }
    }
    async jump(target) {
      this.reset();
      const g = this.gen;
      this.obj.instant = true;
      for (let i = 0; i <= target; i++) {
        this.idx = i;
        try { await this.sc.steps[i].run(this.obj); } catch (e) { console.error(e); }
        if (g !== this.gen) return;
      }
      this.obj.instant = false;
      this.setCaption(target); this.ui();
      if (target >= 0) this.say();
    }
    prev() { if (this.idx >= 0) this.jump(this.idx - 1); }
  }

  window.Engine = { svg, h, icon, drawIcon, Topo, Ladder, Stage, Player, Settings, Sound, Voice };
})();
