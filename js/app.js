/* NetAcademy app shell: routing, sidebar, lesson pages, quizzes, progress */
(function () {
  'use strict';
  const { h } = Engine;
  const ORDER = ['basics', 'osi', 'transport', 'ipv4', 'subnetting', 'ipv6', 'cabling', 'termination', 'rack', 'structured', 'ios', 'switching', 'arp', 'vlan', 'intervlan', 'stp', 'etherchannel', 'wireless', 'routing', 'ospf', 'dhcp', 'dns', 'nat', 'acl', 'ad-intro', 'ad-dns', 'kerberos', 'gpo', 'ad-groups', 'ad-replication'];
  const LESSONS = window.LESSONS.sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));
  const MODULES = [...new Set(LESSONS.map(l => l.module))];
  const KEY = 'netacademy-progress-v1';

  /* ---------- progress (localStorage, safe) ---------- */
  const Store = {
    data: { done: {}, scores: {}, exam: null, last: null },
    load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) this.data = Object.assign(this.data, d); } catch (e) { /* ignore */ } },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
    done(id) { return !!this.data.done[id]; },
    setDone(id, v) { this.data.done[id] = v; this.save(); },
    count() { return LESSONS.filter(l => this.data.done[l.id]).length; }
  };
  Store.load();

  /* ---------- theme ---------- */
  function setTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('netacademy-theme', t || ''); } catch (e) { /* ignore */ }
  }
  try { const t = localStorage.getItem('netacademy-theme'); if (t) setTheme(t); } catch (e) { /* ignore */ }
  function isDark() {
    const a = document.documentElement.getAttribute('data-theme');
    return a ? a === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ---------- helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function highlightCLI(code) {
    return code.split('\n').map(line => {
      const e = esc(line);
      if (/^\s*[!#]/.test(line)) return `<span class="c-cm">${e}</span>`;
      const m = e.match(/^(PS [A-Z]:\\[^&]*&gt;|\S+?(?:&gt;|#)|\$)(\s.*)?$/);
      let out = m ? `<span class="c-pr">${m[1]}</span>${m[2] || ''}` : e;
      out = out.replace(/(\s)(!.*)$/, '$1<span class="c-cm">$2</span>');
      return out;
    }).join('\n');
  }
  function codeBlock(code, title) {
    const pre = h('pre', { class: 'cli', html: highlightCLI(code) });
    const btn = h('button', { class: 'copy', onclick: () => {
      const done = () => { btn.textContent = 'Copied ✓'; setTimeout(() => (btn.textContent = 'Copy'), 1400); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, () => fallbackCopy(code, done));
      else fallbackCopy(code, done);
    } }, 'Copy');
    return h('div', { class: 'cli-wrap' }, h('div', { class: 'cli-head' }, h('span', {}, title || 'Cisco IOS'), btn), pre);
  }
  function fallbackCopy(text, cb) {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { /* ignore */ }
    ta.remove();
  }

  /* ---------- quiz ---------- */
  function quiz(questions, onFinish) {
    const box = h('div', { class: 'quiz' });
    let answered = 0, correct = 0;
    const result = h('div', { class: 'quiz-result' });
    questions.forEach((q, qi) => {
      const opts = h('div', { class: 'opts' });
      const why = h('div', { class: 'why' });
      q.a.forEach((a, ai) => {
        const b = h('button', { class: 'opt', onclick: () => {
          if (opts.dataset.done) return;
          opts.dataset.done = '1'; answered++;
          const ok = ai === q.c; if (ok) correct++;
          Array.from(opts.children).forEach((x, i) => { x.disabled = true; if (i === q.c) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          Engine.Sound.play(ok ? 'ok' : 'bad');
          why.innerHTML = (ok ? '<b class="ok">Correct.</b> ' : '<b class="err">Not quite.</b> ') + esc(q.why || '');
          if (answered === questions.length) {
            const pct = Math.round(correct / questions.length * 100);
            result.innerHTML = `<b>Score: ${correct}/${questions.length} (${pct}%)</b> ` + (pct >= 75 ? '— passed ✓' : '— review the lesson and try again.');
            result.className = 'quiz-result ' + (pct >= 75 ? 'pass' : 'fail');
            result.appendChild(h('button', { class: 'btn', onclick: () => { const n = quiz(questions, onFinish); box.replaceWith(n); } }, 'Retry'));
            if (onFinish) onFinish(pct, correct);
          }
        } }, h('span', { class: 'opt-l' }, 'ABCD'[ai]), a);
        opts.appendChild(b);
      });
      box.appendChild(h('div', { class: 'q' }, h('div', { class: 'qt' }, h('span', { class: 'qn' }, qi + 1), q.q), opts, why));
    });
    box.appendChild(result);
    return box;
  }

  /* ---------- sidebar ---------- */
  const side = document.getElementById('side');
  const main = document.getElementById('main');
  function buildSide() {
    side.innerHTML = '';
    const search = h('input', { class: 'inp side-search', placeholder: 'Search lessons…', 'aria-label': 'Search lessons', oninput: e => {
      const v = e.target.value.toLowerCase();
      side.querySelectorAll('.nav-lesson').forEach(a => { a.style.display = a.dataset.s.includes(v) ? '' : 'none'; });
    } });
    const pct = Math.round(Store.count() / LESSONS.length * 100);
    side.append(
      h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark' }, '◈'), h('span', {}, 'NetAcademy', h('small', {}, 'Offline networking course'))),
      h('div', { class: 'side-prog' }, h('div', { class: 'bar' }, h('i', { style: `width:${pct}%` })), h('span', {}, `${Store.count()} / ${LESSONS.length} lessons complete`)),
      search
    );
    const nav = h('nav', { class: 'nav' });
    nav.appendChild(h('a', { class: 'nav-top', href: '#/' }, '⌂  Home'));
    MODULES.forEach(m => {
      nav.appendChild(h('div', { class: 'nav-mod' }, m));
      LESSONS.filter(l => l.module === m).forEach(l => {
        const n = LESSONS.indexOf(l) + 1;
        nav.appendChild(h('a', { class: 'nav-lesson' + (Store.done(l.id) ? ' done' : ''), href: '#/lesson/' + l.id, 'data-id': l.id, 'data-s': (l.title + ' ' + l.summary + ' ' + m).toLowerCase() },
          h('span', { class: 'nav-n' }, Store.done(l.id) ? '✓' : n), l.title));
      });
    });
    nav.appendChild(h('div', { class: 'nav-mod' }, 'Practice'));
    nav.appendChild(h('a', { class: 'nav-top', href: '#/labs' }, '🛠  Hands-on labs (how to set up)'));
    nav.appendChild(h('a', { class: 'nav-top', href: '#/lab/subnet' }, '⌗  Subnet calculator & drill'));
    nav.appendChild(h('a', { class: 'nav-top', href: '#/cli' }, '›_  Cisco CLI cheat sheet'));
    nav.appendChild(h('a', { class: 'nav-top', href: '#/exam' }, '✎  Practice exam'));
    side.appendChild(nav);
    side.appendChild(audioPanel());
    side.appendChild(h('div', { class: 'side-foot' },
      h('button', { class: 'btn small', onclick: () => { setTheme(isDark() ? 'light' : 'dark'); } }, '◐ Theme'),
      h('button', { class: 'btn small', onclick: () => { if (confirm('Reset all progress?')) { Store.data = { done: {}, scores: {}, exam: null, last: null }; Store.save(); buildSide(); route(); } } }, 'Reset progress')));
    markActive();
  }
  /* ---------- audio settings panel (sidebar) ---------- */
  function audioPanel() {
    const S = Engine.Settings, V = Engine.Voice;
    const tg = (key, label) => {
      const b = h('button', { class: 'switch', role: 'switch', onclick: () => { S.set(key, !S[key]); if (key === 'voice' && !S.voice) V.stop(); } }, h('span', { class: 'knob' }), label);
      const sync = () => { b.classList.toggle('on', !!S[key]); b.setAttribute('aria-checked', String(!!S[key])); };
      window.addEventListener('netacademy-audio', sync); sync();
      return b;
    };
    const voiceSel = h('select', { class: 'inp mini', 'aria-label': 'Narrator voice', onchange: e => { S.set('voiceName', e.target.value); V.speak('Hello! I will read the animation steps for you.', { force: true }); } });
    const fill = () => {
      const vs = V.voices();
      voiceSel.innerHTML = '';
      voiceSel.appendChild(h('option', { value: '' }, 'Default voice'));
      vs.forEach(v => voiceSel.appendChild(h('option', { value: v.name, selected: v.name === S.voiceName ? 'selected' : null }, v.name.replace(/^Microsoft /, '').replace(/ - .*$/, '') + ' (' + v.lang + ')')));
    };
    if (V.supported) { fill(); speechSynthesis.onvoiceschanged = fill; }
    const rateSel = h('select', { class: 'inp mini', 'aria-label': 'Narration speed', onchange: e => S.set('rate', +e.target.value) },
      [['0.8', 'Slow'], ['1', 'Normal'], ['1.2', 'Fast']].map(([v, l]) => h('option', { value: v, selected: +v === S.rate ? 'selected' : null }, l)));
    return h('div', { class: 'audio-panel' },
      h('div', { class: 'nav-mod' }, 'Audio'),
      tg('sound', 'Sound effects'),
      V.supported ? tg('voice', 'Narrate animations') : h('p', { class: 'small' }, 'Narration not supported in this browser.'),
      V.supported ? h('div', { class: 'audio-row' }, voiceSel, rateSel) : null);
  }

  /* ---------- "listen to lesson": reads the text sections aloud ---------- */
  let reading = null;
  function listenButton(page) {
    const V = Engine.Voice;
    if (!V.supported) return null;
    const b = h('button', { class: 'btn small listen' }, '🎧 Listen to lesson');
    b.onclick = async () => {
      if (reading === b) { V.stop(); return; }
      reading = b; b.textContent = '■ Stop reading'; b.classList.add('on');
      const els = Array.from(page.querySelectorAll('.lesson-head h1, .lesson-head .lead, .sec > h2, .sec > .prose, .keypoints li'));
      for (const el of els) {
        const c = el.cloneNode(true);
        c.querySelectorAll('table, .frame-diagram, .map2, pre').forEach(x => x.remove());
        el.classList.add('reading');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const done = await V.speak(c.innerHTML, { force: true });
        el.classList.remove('reading');
        if (!done || reading !== b) break;
      }
      if (reading === b) reading = null;
      b.textContent = '🎧 Listen to lesson'; b.classList.remove('on');
    };
    return b;
  }

  /* ---------- video / audio files (from a section or media/media.js) ---------- */
  function mediaBlock(m) {
    const isAudio = m.type === 'audio' || /\.(mp3|ogg|wav|m4a)$/i.test(m.src);
    const el = h(isAudio ? 'audio' : 'video', { controls: 'controls', preload: 'metadata', src: m.src, poster: m.poster || null });
    const fig = h('figure', { class: 'media' + (isAudio ? ' audio' : '') }, el, h('figcaption', {}, m.title || m.src));
    el.addEventListener('error', () => {
      el.replaceWith(h('div', { class: 'media-missing' }, h('b', {}, (isAudio ? '🎵' : '🎬') + ' File not found'),
        h('span', {}, 'Put the file at '), h('code', {}, m.src), h('span', {}, ' inside the NetAcademy folder.')));
    });
    return fig;
  }

  function markActive() {
    const hsh = location.hash || '#/';
    side.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hsh));
  }

  /* ---------- pages ---------- */
  function home() {
    const next = LESSONS.find(l => !Store.done(l.id)) || LESSONS[0];
    const last = Store.data.last && LESSONS.find(l => l.id === Store.data.last);
    const page = h('div', { class: 'page home' });
    page.appendChild(h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('div', { class: 'kicker' }, 'Works 100% offline · CCNA-aligned'),
        h('h1', {}, 'Learn computer networking by ', h('em', {}, 'watching it happen')),
        h('p', {}, `${LESSONS.length} lessons with step-by-step animated diagrams — packets, switches, VLANs, routing, STP, OSPF, NAT and more. Pause, rewind and replay any animation until it clicks.`),
        h('div', { class: 'hero-btns' },
          h('a', { class: 'btn primary', href: '#/lesson/' + (last && !Store.done(last.id) ? last.id : next.id) }, Store.count() ? 'Continue learning →' : 'Start lesson 1 →'),
          h('a', { class: 'btn', href: '#/labs' }, '🛠 Hands-on labs'),
          h('a', { class: 'btn', href: '#/lab/subnet' }, 'Subnet lab'),
          h('a', { class: 'btn', href: '#/exam' }, 'Practice exam'))),
      h('div', { class: 'hero-demo', id: 'hero-demo' })));
    page.appendChild(h('div', { class: 'stats' },
      stat(LESSONS.length, 'lessons'), stat(LESSONS.reduce((a, l) => a + l.sections.filter(s => s.sim).length, 0), 'animations'),
      stat(LESSONS.reduce((a, l) => a + (l.quiz || []).length, 0), 'quiz questions'), stat(Store.count(), 'completed')));
    MODULES.forEach(m => {
      page.appendChild(h('h2', { class: 'mod-h' }, m));
      page.appendChild(h('div', { class: 'cards' }, LESSONS.filter(l => l.module === m).map(l =>
        h('a', { class: 'card' + (Store.done(l.id) ? ' done' : ''), href: '#/lesson/' + l.id },
          h('div', { class: 'card-top' }, h('span', { class: 'card-n' }, 'Lesson ' + (LESSONS.indexOf(l) + 1)), Store.done(l.id) ? h('span', { class: 'pill ok' }, '✓ done') : h('span', { class: 'pill' }, l.minutes + ' min')),
          h('h3', {}, l.title), h('p', {}, l.summary),
          h('div', { class: 'card-foot' }, `${l.sections.filter(s => s.sim).length} animation${l.sections.filter(s => s.sim).length === 1 ? '' : 's'} · ${(l.quiz || []).length} questions`)))));
    });
    if (LABS.length) {
      page.appendChild(h('h2', { class: 'mod-h' }, 'Hands-on labs — how to set it up'));
      page.appendChild(h('div', { class: 'cards' }, LABS.map(labCard)));
    }
    main.appendChild(page);
    // small live demo on the hero
    new Engine.Player(document.getElementById('hero-demo'), {
      title: 'Try it: a switch learning MAC addresses',
      cfg: {
        w: 520, h: 300,
        nodes: [{ id: 'sw', type: 'switch', x: 260, y: 150, label: 'Switch' }, { id: 'a', type: 'pc', x: 80, y: 60, label: 'PC-A' }, { id: 'b', type: 'pc', x: 440, y: 60, label: 'PC-B' }, { id: 'c', type: 'pc', x: 80, y: 240, label: 'PC-C' }, { id: 'd', type: 'pc', x: 440, y: 240, label: 'PC-D' }],
        links: [{ a: 'a', b: 'sw' }, { a: 'b', b: 'sw' }, { a: 'c', b: 'sw' }, { a: 'd', b: 'sw' }]
      },
      steps: [
        { text: 'PC-A sends to PC-D. The switch does not know where PC-D is yet, so it <b>floods</b> the frame.', run: async t => { await t.send(['a', 'sw'], { label: 'A→D', color: 'blue' }); await t.many([{ path: ['sw', 'b'], drop: true }, { path: ['sw', 'c'], drop: true }, { path: ['sw', 'd'] }], { label: 'A→D', color: 'blue' }); } },
        { text: 'PC-D replies. The switch already learned PC-A’s port, so it forwards <b>only</b> to PC-A.', run: t => t.send(['d', 'sw', 'a'], { label: 'D→A', color: 'green' }) },
        { text: 'Now both are known — traffic goes straight through. Open the <b>Ethernet &amp; Switches</b> lesson for the full story.', run: t => t.send(['a', 'sw', 'd'], { label: 'A→D', color: 'blue' }) }
      ]
    });
  }
  function stat(n, l) { return h('div', { class: 'stat' }, h('b', {}, n), h('span', {}, l)); }

  function lesson(id) {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return notFound();
    Store.data.last = id; Store.save();
    const i = LESSONS.indexOf(l);
    const page = h('article', { class: 'page lesson' });
    page.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'Home'), ' / ', l.module, ' / Lesson ' + (i + 1)));
    page.appendChild(h('header', { class: 'lesson-head' },
      h('h1', {}, l.title), h('p', { class: 'lead' }, l.summary),
      h('div', { class: 'meta' }, h('span', { class: 'pill' }, '⏱ ' + l.minutes + ' min'), h('span', { class: 'pill' }, l.module),
        Store.done(id) ? h('span', { class: 'pill ok' }, '✓ completed') : null, listenButton(page))));
    const extra = (window.LESSON_MEDIA || {})[id] || [];
    if (extra.length) page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Videos & audio'), h('div', { class: 'media-grid' }, extra.map(mediaBlock))));
    l.sections.forEach(s => {
      const sec = h('section', { class: 'sec' });
      if (s.h) sec.appendChild(h('h2', {}, s.h));
      if (s.html) sec.appendChild(h('div', { class: 'prose', html: s.html }));
      if (s.media) sec.appendChild(h('div', { class: 'media-grid' }, [].concat(s.media).map(mediaBlock)));
      if (s.widget && window.Widgets[s.widget]) { const w = h('div', {}); sec.appendChild(w); window.Widgets[s.widget](w); }
      if (s.sim) new Engine.Player(sec, s.sim);
      page.appendChild(sec);
    });
    if (l.keypoints) page.appendChild(h('section', { class: 'sec keypoints' }, h('h2', {}, 'Key points to remember'), h('ul', {}, l.keypoints.map(k => h('li', {}, k)))));
    if (l.cli) page.appendChild(h('section', { class: 'sec' }, h('h2', {}, l.cliTitle ? l.cliTitle + ' commands' : 'Cisco commands'), codeBlock(l.cli, l.title + ' — ' + (l.cliTitle || 'Cisco IOS'))));
    if (l.quiz) {
      page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Check yourself'), h('p', { class: 'muted' }, 'Score 75% or more to complete this lesson.'),
        quiz(l.quiz, pct => {
          Store.data.scores[id] = Math.max(pct, Store.data.scores[id] || 0);
          if (pct >= 75 && !Store.done(id)) { Store.setDone(id, true); buildSide(); }
          Store.save();
        })));
    }
    page.appendChild(h('div', { class: 'lesson-done' },
      h('button', { class: 'btn', onclick: e => { Store.setDone(id, !Store.done(id)); buildSide(); e.target.textContent = Store.done(id) ? '✓ Marked complete (undo)' : 'Mark lesson complete'; } }, Store.done(id) ? '✓ Marked complete (undo)' : 'Mark lesson complete')));
    page.appendChild(h('nav', { class: 'pager' },
      i > 0 ? h('a', { class: 'pg prev', href: '#/lesson/' + LESSONS[i - 1].id }, h('small', {}, '← Previous'), LESSONS[i - 1].title) : h('span', {}),
      i < LESSONS.length - 1 ? h('a', { class: 'pg next', href: '#/lesson/' + LESSONS[i + 1].id }, h('small', {}, 'Next →'), LESSONS[i + 1].title) : h('a', { class: 'pg next', href: '#/exam' }, h('small', {}, 'Finished! →'), 'Take the practice exam')));
    main.appendChild(page);
  }

  function lab() {
    const page = h('div', { class: 'page' });
    page.append(h('h1', {}, 'Subnet calculator & drill'), h('p', { class: 'lead' }, 'Type any IPv4 address with a prefix (/26) or mask (255.255.255.192). Then practice until you can do it in your head.'));
    const a = h('section', { class: 'sec' }, h('h2', {}, 'Calculator')); Widgets.subnetcalc(a);
    const b = h('section', { class: 'sec' }, h('h2', {}, 'Binary trainer')); Widgets.binary(b);
    const c = h('section', { class: 'sec' }, h('h2', {}, 'Practice drill')); Widgets.subnetpractice(c);
    page.append(a, c, b);
    main.appendChild(page);
  }

  function cli() {
    const page = h('div', { class: 'page' });
    const blocks = [];
    const filter = h('input', { class: 'inp', placeholder: 'Filter commands, e.g. "vlan", "ospf", "show"', 'aria-label': 'Filter commands', oninput: e => {
      const v = e.target.value.toLowerCase().trim();
      blocks.forEach(({ el, l }) => {
        if (!v) { el.style.display = ''; el.querySelector('pre').innerHTML = highlightCLI(l.cli); return; }
        const lines = l.cli.split('\n').filter(x => x.toLowerCase().includes(v));
        el.style.display = lines.length ? '' : 'none';
        el.querySelector('pre').innerHTML = highlightCLI(lines.join('\n'));
      });
    } });
    page.append(h('h1', {}, 'Cisco CLI cheat sheet'), h('p', { class: 'lead' }, 'Every command from every lesson in one place. Lines starting with ! are comments.'), h('div', { class: 'sticky-filter' }, filter));
    LESSONS.filter(l => l.cli).forEach(l => {
      const el = h('section', { class: 'sec' }, h('h2', {}, h('a', { href: '#/lesson/' + l.id }, l.title)), codeBlock(l.cli, l.title));
      blocks.push({ el, l });
      page.appendChild(el);
    });
    page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Troubleshooting toolkit'), codeBlock(`! Layer 1-2
Switch# show interfaces status
Switch# show interfaces fa0/1          ! errors, CRC, duplex
Switch# show cdp neighbors detail
Switch# show lldp neighbors
! Layer 3
Router# show ip interface brief
Router# show ip route
Router# ping 10.1.1.1
Router# traceroute 8.8.8.8
Router# show ip protocols
! Logs & time
Router# show logging
Router# show clock
Router(config)# ntp server 10.0.0.1
Router(config)# logging host 10.0.0.50
! Host side
C:\\> ipconfig /all
C:\\> ping -t 192.168.1.1
C:\\> tracert 8.8.8.8
C:\\> nslookup example.com`, 'Troubleshooting')));
    main.appendChild(page);
  }

  function exam() {
    const page = h('div', { class: 'page' });
    const all = [];
    LESSONS.forEach(l => (l.quiz || []).forEach(q => all.push(Object.assign({ src: l.title }, q))));
    const N = Math.min(25, all.length);
    const start = () => {
      body.innerHTML = '';
      const pick = all.slice().sort(() => Math.random() - 0.5).slice(0, N);
      body.appendChild(quiz(pick, pct => {
        Store.data.exam = Math.max(pct, Store.data.exam || 0); Store.save();
        best.textContent = 'Best score: ' + Store.data.exam + '%';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }));
    };
    const best = h('span', { class: 'pill' }, Store.data.exam !== null ? 'Best score: ' + Store.data.exam + '%' : 'No attempts yet');
    const body = h('div', {});
    page.append(h('h1', {}, 'Practice exam'), h('p', { class: 'lead' }, `${N} random questions from all ${LESSONS.length} lessons. Answers are explained right after you click. Aim for 85%+.`),
      h('div', { class: 'exam-bar' }, best, h('button', { class: 'btn primary', onclick: start }, 'New random exam')), body);
    main.appendChild(page);
    start();
  }

  /* ---------- hands-on labs ---------- */
  const LABS = window.LABS || [];
  const labState = id => { Store.data.labs = Store.data.labs || {}; return (Store.data.labs[id] = Store.data.labs[id] || []); };
  const labDone = l => labState(l.id).filter(Boolean).length;
  const LAB_GROUPS = [['Start here', 'Start here'], ['Packet Tracer', 'Cisco labs (Packet Tracer)'], ['Windows Server VM', 'Windows Server & Active Directory labs'], ['Real hardware', 'Physical build: cables, racks & patching'], ['Real router', 'Real-world setup']];

  function labCard(l) {
    const d = labDone(l), n = l.tasks.length;
    return h('a', { class: 'card' + (d === n ? ' done' : ''), href: '#/labs/' + l.id },
      h('div', { class: 'card-top' }, h('span', { class: 'card-n' }, l.level), d === n ? h('span', { class: 'pill ok' }, '✓ done') : h('span', { class: 'pill' }, l.minutes + ' min')),
      h('h3', {}, l.title), h('p', {}, l.summary),
      h('div', { class: 'card-foot' }, `${l.tools} · ${d}/${n} steps done`));
  }

  function labsIndex() {
    const page = h('div', { class: 'page' });
    page.append(h('h1', {}, 'Hands-on labs'),
      h('p', { class: 'lead' }, 'Step-by-step “how to set it up” guides. Each lab has a topology, an addressing table, the exact commands (or GUI clicks), how to verify every step, and a troubleshooting table. Tick each step as you finish it.'));
    LAB_GROUPS.forEach(([tool, title]) => {
      const list = LABS.filter(l => (l.tools === tool) || (tool === 'Start here' && l.level === 'Start here'));
      const uniq = list.filter(l => tool === 'Start here' || l.level !== 'Start here');
      if (!uniq.length) return;
      page.appendChild(h('h2', { class: 'mod-h' }, title));
      page.appendChild(h('div', { class: 'cards' }, uniq.map(labCard)));
    });
    main.appendChild(page);
  }

  function labPage(id) {
    const lab = LABS.find(l => l.id === id);
    if (!lab) return notFound();
    const st = labState(id);
    const i = LABS.indexOf(lab);
    const page = h('article', { class: 'page lab' });
    const bar = h('i', {}), barTxt = h('span', {});
    const updBar = () => { const d = labDone(lab); bar.style.width = (d / lab.tasks.length * 100) + '%'; barTxt.textContent = `${d} / ${lab.tasks.length} steps done`; };
    page.append(
      h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'Home'), ' / ', h('a', { href: '#/labs' }, 'Hands-on labs'), ' / ' + lab.tools),
      h('header', { class: 'lesson-head' }, h('h1', {}, lab.title), h('p', { class: 'lead' }, lab.summary),
        h('div', { class: 'meta' }, h('span', { class: 'pill' }, lab.level), h('span', { class: 'pill' }, '⏱ ' + lab.minutes + ' min'), h('span', { class: 'pill' }, '🧰 ' + lab.tools), listenButton(page)),
        h('div', { class: 'lab-prog' }, h('div', { class: 'bar' }, bar), barTxt)),
      h('div', { class: 'callout tip' }, h('b', {}, '🎯 Goal: '), lab.goal));
    if (lab.lessons) page.appendChild(h('p', { class: 'muted' }, 'Learn first: ', lab.lessons.map((lid, k) => { const L2 = LESSONS.find(x => x.id === lid); return L2 ? [k ? ', ' : '', h('a', { href: '#/lesson/' + lid }, L2.title)] : null; })));
    if (lab.topo) {
      const sec = h('section', { class: 'sec' }, h('h2', {}, 'Topology'));
      const box = h('div', { class: 'lab-topo' }); sec.appendChild(box); new Engine.Topo(box, lab.topo);
      page.appendChild(sec);
    }
    if (lab.addressing) page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Addressing table'),
      h('div', { class: 'prose' }, h('table', { class: 'data mono-t' }, h('tr', {}, ['Device', 'Interface', 'IP address', 'Subnet mask', 'Gateway / DNS'].map(c => h('th', {}, c))), lab.addressing.map(r => h('tr', {}, r.map(c => h('td', {}, c))))))));
    if (lab.prereq) page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Before you start'), h('ul', { class: 'prose' }, lab.prereq.map(p => h('li', { html: p })))));
    const tasksSec = h('section', { class: 'sec' }, h('h2', {}, 'Step by step'));
    lab.tasks.forEach((tk, k) => {
      const cb = h('input', { type: 'checkbox', 'aria-label': 'Mark step ' + (k + 1) + ' done' });
      cb.checked = !!st[k];
      const card = h('div', { class: 'task' + (st[k] ? ' done' : '') });
      cb.addEventListener('change', () => {
        st[k] = cb.checked; Store.save(); card.classList.toggle('done', cb.checked); updBar();
        if (cb.checked) Engine.Sound.play(labDone(lab) === lab.tasks.length ? 'ok' : 'arrive');
      });
      card.append(h('div', { class: 'task-h' }, h('span', { class: 'task-n' }, k + 1), h('h3', {}, tk.t), tk.on ? h('span', { class: 'pill dev' }, tk.on) : null, h('label', { class: 'task-done' }, cb, ' Done')));
      if (tk.why) card.appendChild(h('p', { class: 'task-why', html: tk.why }));
      if (tk.gui) card.appendChild(h('div', { class: 'gui' }, h('div', { class: 'gui-h' }, '🖱 GUI steps'), h('ol', {}, tk.gui.map(g => h('li', { html: g })))));
      if (tk.cmd) card.appendChild(codeBlock(tk.cmd, tk.cmdTitle || (tk.on ? tk.on + ' — commands' : 'Commands')));
      if (tk.verify) card.appendChild(h('div', { class: 'verify' }, h('div', { class: 'gui-h' }, '✅ Verify'), codeBlock(tk.verify, 'Verify')));
      if (tk.expect) card.appendChild(h('div', { class: 'expect' }, h('div', { class: 'gui-h' }, 'Expected output (similar)'), h('pre', {}, tk.expect)));
      tasksSec.appendChild(card);
    });
    page.appendChild(tasksSec);
    if (lab.test && lab.topo) {
      const box = h('div', { class: 'lab-topo' });
      const t = new Engine.Topo(box, lab.topo);
      const msg = h('div', { class: 'test-msg' });
      const btn = h('button', { class: 'btn primary', onclick: async () => {
        btn.disabled = true; msg.textContent = '';
        const T = lab.test;
        await t.send(T.path, { label: T.label, color: T.drop ? 'red' : 'blue', seg: T.seg, drop: T.drop });
        if (T.back && !T.drop) await t.send(T.path.slice().reverse(), { label: T.back, color: 'green' });
        const all = labDone(lab) === lab.tasks.length;
        msg.innerHTML = T.drop ? '<b class="ok">Blocked as expected ✓</b> — the ACL works.' : (all ? '<b class="ok">Lab complete ✓</b> Great job!' : 'That is what success looks like. Tick all steps when your own lab matches.');
        Engine.Sound.play('ok');
        btn.disabled = false;
      } }, '▶ Run final test');
      page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Final test'), h('p', {}, lab.test.text), box, h('div', { class: 'test-row' }, btn, msg)));
    }
    if (lab.trouble) page.appendChild(h('section', { class: 'sec' }, h('h2', {}, 'Troubleshooting'),
      h('div', { class: 'prose' }, h('table', { class: 'data' }, h('tr', {}, h('th', {}, 'Problem'), h('th', {}, 'Fix')), lab.trouble.map(([p, f]) => h('tr', {}, h('td', {}, h('b', {}, p)), h('td', { html: f })))))));
    page.appendChild(h('nav', { class: 'pager' },
      i > 0 ? h('a', { class: 'pg prev', href: '#/labs/' + LABS[i - 1].id }, h('small', {}, '← Previous lab'), LABS[i - 1].title) : h('span', {}),
      i < LABS.length - 1 ? h('a', { class: 'pg next', href: '#/labs/' + LABS[i + 1].id }, h('small', {}, 'Next lab →'), LABS[i + 1].title) : h('a', { class: 'pg next', href: '#/labs' }, h('small', {}, 'All labs →'), 'Back to the lab list')));
    main.appendChild(page);
    updBar();
  }

  function notFound() { main.appendChild(h('div', { class: 'page' }, h('h1', {}, 'Page not found'), h('a', { class: 'btn', href: '#/' }, 'Go home'))); }

  /* ---------- router ---------- */
  function route() {
    Engine.Voice.stop(); reading = null;
    main.querySelectorAll('video, audio').forEach(m => m.pause());
    main.innerHTML = '';
    document.body.classList.remove('nav-open');
    const p = (location.hash || '#/').slice(2).split('/');
    if (!p[0]) home();
    else if (p[0] === 'lesson') lesson(p[1]);
    else if (p[0] === 'lab') lab();
    else if (p[0] === 'cli') cli();
    else if (p[0] === 'exam') exam();
    else if (p[0] === 'labs') { if (p[1]) labPage(p[1]); else labsIndex(); }
    else notFound();
    const l = (p[0] === 'lesson' && LESSONS.find(x => x.id === p[1])) || (p[0] === 'labs' && LABS.find(x => x.id === p[1]));
    document.title = l ? l.title + ' · NetAcademy' : p[0] === 'labs' ? 'Hands-on labs · NetAcademy' : 'NetAcademy';
    markActive();
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  document.getElementById('menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
  window.addEventListener('hashchange', route);
  buildSide();
  route();
})();
