/* Interactive widgets used inside lessons and tool pages */
(function () {
  'use strict';
  const { h, svg, icon } = Engine;

  /* ---------- IPv4 math ---------- */
  const IP = {
    parse(s) {
      const p = String(s).trim().split('.');
      if (p.length !== 4) return null;
      let n = 0;
      for (const o of p) {
        if (!/^\d{1,3}$/.test(o) || +o > 255) return null;
        n = n * 256 + +o;
      }
      return n >>> 0;
    },
    str(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); },
    mask(p) { return p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; },
    prefixFromMask(m) {
      const n = IP.parse(m); if (n === null) return null;
      const b = n.toString(2).padStart(32, '0');
      return /^1*0*$/.test(b) ? b.indexOf('0') === -1 ? 32 : b.indexOf('0') : null;
    },
    calc(ipStr, pfx) {
      const ip = IP.parse(ipStr); if (ip === null || pfx < 0 || pfx > 32) return null;
      const mask = IP.mask(pfx);
      const net = (ip & mask) >>> 0;
      const bc = (net | (~mask >>> 0)) >>> 0;
      const total = Math.pow(2, 32 - pfx);
      let first, last, hosts;
      if (pfx === 32) { first = last = net; hosts = 1; }
      else if (pfx === 31) { first = net; last = bc; hosts = 2; }
      else { first = net + 1; last = bc - 1; hosts = total - 2; }
      const o1 = ip >>> 24;
      const cls = o1 < 128 ? 'A' : o1 < 192 ? 'B' : o1 < 224 ? 'C' : o1 < 240 ? 'D (multicast)' : 'E';
      const priv = (ip >>> 24) === 10 || ((ip >>> 20) === 0xAC1) || ((ip >>> 16) === 0xC0A8);
      const special = (ip >>> 24) === 127 ? 'Loopback' : (ip >>> 16) === 0xA9FE ? 'APIPA (link-local)' : priv ? 'Private (RFC 1918)' : o1 >= 224 ? 'Not unicast' : 'Public';
      return { ip, pfx, mask, net, bc, first, last, hosts, total, wildcard: (~mask) >>> 0, cls, type: special };
    }
  };

  function bin32(n, pfx) {
    const b = n.toString(2).padStart(32, '0');
    const wrap = h('span', { class: 'bin32' });
    for (let i = 0; i < 32; i++) {
      wrap.appendChild(h('span', { class: i < pfx ? 'bn' : 'bh' }, b[i]));
      if (i % 8 === 7 && i < 31) wrap.appendChild(h('span', { class: 'bdot' }, '.'));
    }
    return wrap;
  }

  const W = {};

  /* ---------- device gallery ---------- */
  W.devices = el => {
    const items = [
      ['pc', 'End device (host)', 'PC, laptop, phone, printer. Sends and receives data. Has a NIC with a MAC and an IP.', 'L1–L7'],
      ['switch', 'Switch', 'Connects devices inside a LAN. Forwards frames using MAC addresses. Each port = own collision domain.', 'Layer 2'],
      ['router', 'Router', 'Connects different networks/subnets. Forwards packets using IP addresses and a routing table.', 'Layer 3'],
      ['l3switch', 'Multilayer switch', 'A switch that can also route between VLANs at wire speed.', 'Layer 2 + 3'],
      ['ap', 'Access point', 'Bridges wireless clients onto the wired LAN (Wi-Fi).', 'Layer 2'],
      ['firewall', 'Firewall', 'Filters traffic by security policy. Next-gen firewalls inspect applications (IPS, URL filtering).', 'Layer 3–7'],
      ['server', 'Server', 'Provides services: web, DNS, DHCP, file, email.', 'L7 services'],
      ['cloud', 'WAN / Internet / Cloud', 'Networks you do not control — ISP links, the Internet, cloud providers.', '—']
    ];
    el.appendChild(h('div', { class: 'devgrid' }, items.map(([t, n, d, l]) => h('div', { class: 'devcard' }, icon(t, 64), h('div', {}, h('b', {}, n), h('span', { class: 'pill' }, l), h('p', {}, d))))));
  };

  /* ---------- topology thumbnails ---------- */
  W.topologies = el => {
    const draw = (name, desc, nodes, links) => {
      const s = svg('svg', { viewBox: '0 0 160 120', class: 'topo-thumb' });
      links.forEach(([a, b]) => svg('line', { x1: nodes[a][0], y1: nodes[a][1], x2: nodes[b][0], y2: nodes[b][1], class: 'tl' }, s));
      nodes.forEach(([x, y, c]) => svg('circle', { cx: x, cy: y, r: c ? 11 : 8, class: c ? 'tn center' : 'tn' }, s));
      return h('div', { class: 'thumbcard' }, s, h('b', {}, name), h('p', {}, desc));
    };
    const ring = [...Array(6)].map((_, i) => [80 + 42 * Math.cos(i * Math.PI / 3), 60 + 42 * Math.sin(i * Math.PI / 3)]);
    const mesh = [...Array(5)].map((_, i) => [80 + 44 * Math.cos(i * 2 * Math.PI / 5 - Math.PI / 2), 62 + 44 * Math.sin(i * 2 * Math.PI / 5 - Math.PI / 2)]);
    const all = []; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) all.push([i, j]);
    el.appendChild(h('div', { class: 'thumbgrid' },
      draw('Star', 'All devices connect to a central switch. Most common LAN. Central point of failure.', [[80, 60, 1], [30, 20], [130, 20], [30, 100], [130, 100], [80, 108], [80, 12]], [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]]),
      draw('Bus', 'One shared cable. Legacy (coax). A cable break kills everything.', [[20, 60], [50, 60], [80, 60], [110, 60], [140, 60], [50, 25], [110, 95]], [[0, 4], [1, 5], [3, 6]]),
      draw('Ring', 'Each device connects to two neighbors. Legacy token ring / some metro fiber.', ring, ring.map((_, i) => [i, (i + 1) % 6])),
      draw('Full mesh', 'Every node to every node. Maximum redundancy, expensive: n(n−1)/2 links.', mesh, all),
      draw('Partial mesh / hybrid', 'Mix of star and mesh — typical enterprise core & WAN.', [[40, 30, 1], [120, 30, 1], [40, 90, 1], [120, 90, 1], [10, 110], [70, 112], [150, 110]], [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3], [2, 4], [2, 5], [3, 6]])
    ));
  };

  /* ---------- OSI explorer ---------- */
  W.osi = el => {
    const L = [
      [7, 'Application', 'Data', 'Interface between network and the user’s applications. Provides services like web, email, file transfer, name resolution.', 'HTTP, HTTPS, DNS, DHCP, FTP, SMTP, SSH, SNMP', 'The waiter who takes your order.'],
      [6, 'Presentation', 'Data', 'Translates, encrypts and compresses data so both sides understand it.', 'TLS/SSL, JPEG, MP4, ASCII, UTF-8', 'The translator.'],
      [5, 'Session', 'Data', 'Opens, manages and closes sessions (dialogs) between applications.', 'NetBIOS, RPC, PPTP', 'The phone call: dial, talk, hang up.'],
      [4, 'Transport', 'Segment', 'End-to-end delivery between applications using port numbers. TCP adds reliability, ordering and flow control; UDP is fast and simple.', 'TCP, UDP', 'Registered mail (TCP) vs postcard (UDP).'],
      [3, 'Network', 'Packet', 'Logical addressing (IP) and routing between different networks. Chooses the path.', 'IPv4, IPv6, ICMP, OSPF, EIGRP, BGP', 'The postal routing system using city/street addresses.'],
      [2, 'Data Link', 'Frame', 'Delivery on the local link using MAC addresses, error detection (FCS), media access. Sub-layers LLC and MAC.', 'Ethernet, 802.1Q, Wi-Fi 802.11, PPP, STP', 'The mail carrier on one street, reading house numbers.'],
      [1, 'Physical', 'Bits', 'Transmits raw bits as electrical, light or radio signals. Defines cables, connectors, voltages, speeds.', 'UTP Cat6, fiber, RJ-45, SFP, 802.11 radio', 'The road itself.']
    ];
    const detail = h('div', { class: 'osi-detail' });
    const list = h('div', { class: 'osi-list' });
    const show = i => {
      const [n, name, pdu, d, ex, an] = L[i];
      Array.from(list.children).forEach((b, j) => b.classList.toggle('on', j === i));
      detail.innerHTML = '';
      detail.append(h('div', { class: 'osi-dh' }, h('span', { class: 'osi-num l' + n }, n), h('h4', {}, name), h('span', { class: 'pill' }, 'PDU: ' + pdu)),
        h('p', {}, d), h('p', {}, h('b', {}, 'Protocols / examples: '), ex), h('p', { class: 'muted' }, h('b', {}, 'Analogy: '), an));
    };
    L.forEach((l, i) => list.appendChild(h('button', { class: 'osi-btn l' + l[0], onclick: () => show(i) }, h('b', {}, l[0]), ' ' + l[1], h('small', {}, l[2]))));
    el.appendChild(h('div', { class: 'osi-wrap' }, list, detail));
    show(3);
  };

  /* ---------- binary octet trainer ---------- */
  W.binary = el => {
    const vals = [128, 64, 32, 16, 8, 4, 2, 1];
    let bits = [1, 1, 0, 0, 0, 0, 0, 0];
    const dec = h('input', { type: 'number', min: 0, max: 255, class: 'inp small', 'aria-label': 'Decimal value' });
    const sum = h('div', { class: 'bin-sum' });
    const row = h('div', { class: 'bin-row' });
    const render = () => {
      row.innerHTML = '';
      vals.forEach((v, i) => row.appendChild(h('button', { class: 'bin-bit' + (bits[i] ? ' on' : ''), onclick: () => { bits[i] = 1 - bits[i]; render(); } }, h('small', {}, v), h('b', {}, bits[i]))));
      const n = bits.reduce((a, b, i) => a + b * vals[i], 0);
      dec.value = n;
      const parts = vals.filter((_, i) => bits[i]);
      sum.textContent = (parts.length ? parts.join(' + ') : '0') + ' = ' + n;
    };
    dec.addEventListener('input', () => {
      let n = Math.max(0, Math.min(255, parseInt(dec.value, 10) || 0));
      bits = vals.map(v => (n & v ? 1 : 0));
      const save = dec.value; render(); dec.value = save;
    });
    el.appendChild(h('div', { class: 'widget bin' }, row, h('div', { class: 'bin-foot' }, h('label', {}, 'Decimal: ', dec), sum),
      h('div', { class: 'chips' }, [0, 128, 192, 224, 240, 248, 252, 254, 255].map(n => h('button', { class: 'chip', onclick: () => { bits = vals.map(v => (n & v ? 1 : 0)); render(); } }, n)))));
    render();
  };

  /* ---------- subnet calculator ---------- */
  W.subnetcalc = el => {
    const ipIn = h('input', { class: 'inp', value: '192.168.10.77', 'aria-label': 'IP address', spellcheck: 'false' });
    const pIn = h('input', { class: 'inp', value: '26', 'aria-label': 'Prefix length or mask', spellcheck: 'false' });
    const out = h('div', { class: 'calc-out' });
    const run = () => {
      let raw = pIn.value.trim().replace(/^\//, '');
      let p = /^\d{1,2}$/.test(raw) ? +raw : IP.prefixFromMask(raw);
      let ipv = ipIn.value.trim();
      if (ipv.includes('/')) { const [a, b] = ipv.split('/'); ipv = a; p = +b; pIn.value = b; }
      const r = p === null || p === undefined || isNaN(p) ? null : IP.calc(ipv, p);
      out.innerHTML = '';
      if (!r) { out.appendChild(h('p', { class: 'err' }, 'Enter a valid IPv4 address and a prefix (0–32) or mask (e.g. 255.255.255.0).')); return; }
      const rows = [
        ['Address', IP.str(r.ip), bin32(r.ip, p)],
        ['Subnet mask', IP.str(r.mask) + '  (/' + p + ')', bin32(r.mask, p)],
        ['Wildcard', IP.str(r.wildcard), bin32(r.wildcard, p)],
        ['Network', IP.str(r.net), bin32(r.net, p)],
        ['Broadcast', p >= 31 ? '—' : IP.str(r.bc), p >= 31 ? '' : bin32(r.bc, p)],
        ['First host', IP.str(r.first), ''],
        ['Last host', IP.str(r.last), ''],
        ['Usable hosts', r.hosts.toLocaleString(), ''],
        ['Total addresses', r.total.toLocaleString(), ''],
        ['Class / type', 'Class ' + r.cls + ' · ' + r.type, '']
      ];
      out.appendChild(h('table', { class: 'data calc' }, rows.map(([a, b, c]) => h('tr', {}, h('th', {}, a), h('td', { class: 'mono' }, b), h('td', { class: 'bincell' }, c || '')))));
      const oct = p % 8 === 0 ? null : Math.floor(p / 8);
      if (oct !== null && p < 32) {
        const block = 256 - ((r.mask >>> (24 - oct * 8)) & 255);
        out.appendChild(h('p', { class: 'muted' }, `Interesting octet: #${oct + 1} · block size = 256 − ${(r.mask >>> (24 - oct * 8)) & 255} = ${block}. Subnets step by ${block}.`));
      }
      out.appendChild(h('p', { class: 'legend' }, h('span', { class: 'bn' }, '■'), ' network bits  ', h('span', { class: 'bh' }, '■'), ' host bits'));
    };
    [ipIn, pIn].forEach(i => i.addEventListener('input', run));
    el.appendChild(h('div', { class: 'widget' },
      h('div', { class: 'calc-in' }, h('label', {}, 'IP address', ipIn), h('label', {}, 'Prefix or mask', pIn)),
      out));
    run();
  };

  /* ---------- subnetting practice ---------- */
  W.subnetpractice = el => {
    const box = h('div', { class: 'widget practice' });
    let score = 0, tries = 0;
    const scoreEl = h('span', { class: 'pill' });
    const fields = [['net', 'Network address'], ['bc', 'Broadcast address'], ['first', 'First usable host'], ['last', 'Last usable host'], ['hosts', 'Usable hosts']];
    const q = h('div', { class: 'pq' });
    const form = h('div', { class: 'pform' });
    const fb = h('div', { class: 'pfb' });
    let cur;
    const newQ = () => {
      const pfx = 17 + Math.floor(Math.random() * 13);
      const first = [10, 172, 192][Math.floor(Math.random() * 3)];
      const ip = first === 10 ? `10.${rnd(255)}.${rnd(255)}.${rnd(254) + 1}` : first === 172 ? `172.${16 + rnd(15)}.${rnd(255)}.${rnd(254) + 1}` : `192.168.${rnd(255)}.${rnd(254) + 1}`;
      cur = IP.calc(ip, pfx);
      q.innerHTML = `Host <b class="mono">${ip}/${pfx}</b> &nbsp;(mask ${IP.str(cur.mask)})`;
      form.innerHTML = ''; fb.innerHTML = '';
      fields.forEach(([k, l]) => form.appendChild(h('label', {}, l, h('input', { class: 'inp', 'data-k': k, spellcheck: 'false', autocomplete: 'off' }))));
    };
    function rnd(n) { return Math.floor(Math.random() * (n + 1)); }
    const check = () => {
      const ans = { net: IP.str(cur.net), bc: IP.str(cur.bc), first: IP.str(cur.first), last: IP.str(cur.last), hosts: String(cur.hosts) };
      let ok = 0;
      form.querySelectorAll('input').forEach(i => {
        const k = i.dataset.k, good = i.value.trim().replace(/,/g, '') === ans[k];
        i.classList.toggle('good', good); i.classList.toggle('bad', !good);
        if (good) ok++;
      });
      tries++; if (ok === fields.length) score++;
      scoreEl.textContent = `Score ${score}/${tries}`;
      fb.innerHTML = ok === fields.length ? '<b class="ok">Perfect! 🎉</b>' :
        `<b class="err">${ok}/${fields.length} correct.</b> Answer: network <b>${ans.net}</b>, broadcast <b>${ans.bc}</b>, hosts <b>${ans.first} – ${ans.last}</b> (${ans.hosts}).`;
    };
    box.append(h('div', { class: 'phead' }, h('b', {}, 'Solve it'), scoreEl), q, form,
      h('div', { class: 'pbtns' }, h('button', { class: 'btn primary', onclick: check }, 'Check'), h('button', { class: 'btn', onclick: newQ }, 'New question')), fb);
    el.appendChild(box);
    scoreEl.textContent = 'Score 0/0';
    newQ();
  };

  window.Widgets = W;
  window.IPv4 = IP;
})();
