/* Module 1 — Network fundamentals */
(function () {
  const L = (window.LESSONS = window.LESSONS || []);
  const h = Engine.h;

  /* ---------- helpers for HTML stages ---------- */
  function toBin(n) { return n.toString(2).padStart(8, '0'); }
  function bitRow(label, octets, prefix, cls) {
    const row = h('div', { class: 'bitrow ' + (cls || '') }, h('div', { class: 'bitrow-label' }, label));
    const oc = h('div', { class: 'bitrow-octets' });
    octets.forEach((o, i) => {
      const box = h('div', { class: 'octet' });
      const bits = h('div', { class: 'bits' });
      toBin(o).split('').forEach((b, j) => {
        const idx = i * 8 + j;
        bits.appendChild(h('span', { class: 'bit ' + (b === '1' ? 'one' : 'zero') + (idx >= prefix ? ' host' : ' net'), style: `animation-delay:${idx * 18}ms` }, b));
      });
      box.append(bits, h('div', { class: 'octet-dec' }, String(o)));
      oc.appendChild(box);
      if (i < 3) oc.appendChild(h('div', { class: 'octet-dot' }, '.'));
    });
    row.appendChild(oc);
    return row;
  }

  /* ===================================================== */
  L.push({
    id: 'basics',
    module: 'Fundamentals',
    title: 'What is a Network?',
    minutes: 10,
    summary: 'Devices, LAN vs WAN, topologies and how data travels from your PC to a website.',
    sections: [
      { h: 'The big idea', html: `
        <p>A <b>computer network</b> is two or more devices connected so they can share data. Every time you open a website, send a chat message or print a document, data is broken into small pieces called <b>packets</b> that travel across cables, switches, routers and wireless links.</p>
        <div class="callout tip"><b>Analogy:</b> A network is like the postal system. Your data is a letter, the <b>IP address</b> is the street address, the <b>switch</b> is the local mail room inside a building, and the <b>router</b> is the post office that sends letters to other cities.</div>` },
      { sim: {
        title: 'Journey of a web request',
        desc: 'Watch what happens when you open a website from your home PC.',
        cfg: {
          w: 800, h: 300,
          zones: [{ x: 20, y: 60, w: 440, h: 200, label: 'LAN — your home / office', color: 'blue' }, { x: 480, y: 60, w: 300, h: 200, label: 'WAN — the Internet', color: 'purple' }],
          nodes: [
            { id: 'pc', type: 'pc', x: 80, y: 170, label: 'Your PC', sub: '192.168.1.10' },
            { id: 'sw', type: 'switch', x: 230, y: 170, label: 'Switch' },
            { id: 'r', type: 'router', x: 380, y: 170, label: 'Router', sub: 'Default gateway' },
            { id: 'net', type: 'cloud', x: 560, y: 170, label: 'ISP / Internet' },
            { id: 'web', type: 'server', x: 710, y: 170, label: 'Web Server', sub: '93.184.216.34' }
          ],
          links: [{ a: 'pc', b: 'sw' }, { a: 'sw', b: 'r' }, { a: 'r', b: 'net', cls: 'wan' }, { a: 'net', b: 'web', cls: 'wan' }]
        },
        steps: [
          { text: 'You type <code>example.com</code> in the browser. The PC builds an <b>HTTP request</b> and wraps it in a packet addressed to the web server.', run: async t => { t.say('pc', 'GET /index.html', 2200); await t.flash('pc'); await t.wait(900); } },
          { text: 'The destination is <b>not on the local network</b>, so the PC sends the packet to its <b>default gateway</b> (the router). Inside the LAN, the <b>switch</b> forwards it using MAC addresses.', run: t => t.send(['pc', 'sw', 'r'], { label: 'Request', color: 'blue' }) },
          { text: 'The <b>router</b> connects your LAN to the Internet. It forwards the packet to your ISP, and many routers on the Internet pass it hop-by-hop to the server.', run: t => t.send(['r', 'net', 'web'], { label: 'Request', color: 'blue' }) },
          { text: 'The web server processes the request and sends back a <b>response</b> (the web page) to your public IP address.', run: async t => { t.say('web', 'HTTP 200 OK', 1800); await t.wait(500); await t.send(['web', 'net', 'r', 'sw', 'pc'], { label: 'Web page', color: 'green' }); } },
          { text: 'Your browser receives the data and draws the page. All of this usually takes less than 100 milliseconds!', run: async t => { t.badge('pc', '✓ Page loaded', 'ok'); await t.flash('pc', 'green'); } }
        ]
      } },
      { h: 'Common network devices', widget: 'devices' },
      { h: 'LAN, WAN and more', html: `
        <table class="data">
          <tr><th>Type</th><th>Meaning</th><th>Example</th></tr>
          <tr><td><b>LAN</b></td><td>Local Area Network — small area, high speed, you own it</td><td>Home Wi-Fi, office floor</td></tr>
          <tr><td><b>WAN</b></td><td>Wide Area Network — connects LANs over long distance</td><td>The Internet, MPLS between branches</td></tr>
          <tr><td><b>WLAN</b></td><td>Wireless LAN</td><td>Wi-Fi 6 network</td></tr>
          <tr><td><b>MAN</b></td><td>Metropolitan Area Network — a city</td><td>City fiber ring</td></tr>
          <tr><td><b>SOHO</b></td><td>Small Office / Home Office</td><td>One all-in-one router</td></tr>
        </table>` },
      { h: 'Physical topologies', widget: 'topologies' },
      { h: 'Speed words you must know', html: `
        <ul>
          <li><b>Bandwidth</b> — maximum capacity of a link (e.g. 1 Gbps). Like the number of lanes on a highway.</li>
          <li><b>Throughput</b> — actual data rate you get (always ≤ bandwidth).</li>
          <li><b>Latency (delay)</b> — time for a packet to arrive (ms).</li>
          <li><b>Jitter</b> — variation in latency; bad for voice and video.</li>
          <li><b>Packet loss</b> — packets that never arrive.</li>
        </ul>
        <p>Cabling basics: <b>UTP copper</b> (Cat5e/Cat6, max 100 m), <b>fiber</b> (multimode for short, single-mode for long distances, immune to electrical interference) and <b>wireless</b>.</p>` }
    ],
    keypoints: [
      'A network shares data between devices using packets.',
      'Switches connect devices inside a LAN; routers connect different networks.',
      'The default gateway is the router your PC uses to reach other networks.',
      'Star topology (everything to a switch) is the most common LAN design.'
    ],
    quiz: [
      { q: 'Which device connects different networks together (e.g. your LAN to the Internet)?', a: ['Switch', 'Router', 'Hub', 'Access point'], c: 1, why: 'Routers forward packets between networks based on IP address.' },
      { q: 'Your PC sends traffic for remote networks to the…', a: ['DNS server', 'Default gateway', 'Switch', 'DHCP server'], c: 1, why: 'The default gateway (a router) is the exit door for traffic leaving the local subnet.' },
      { q: 'Maximum recommended length of a UTP Cat6 Ethernet cable run?', a: ['10 m', '100 m', '500 m', '2 km'], c: 1, why: 'Twisted-pair Ethernet is limited to 100 meters.' },
      { q: 'Variation in delay that hurts voice calls is called…', a: ['Bandwidth', 'Throughput', 'Jitter', 'Attenuation'], c: 2, why: 'Jitter = the change in latency between packets.' }
    ]
  });

  /* ===================================================== */
  const ENC_LAYERS = [
    [7, 'Application'], [6, 'Presentation'], [5, 'Session'], [4, 'Transport'], [3, 'Network'], [2, 'Data Link'], [1, 'Physical']
  ];
  function encLit(s, arr) { s.$$('.enc-l').forEach(e => e.classList.toggle('on', arr.includes(+e.dataset.l))); }
  function encBlk(cls, text) { return h('div', { class: 'blk ' + cls }, text); }
  L.push({
    id: 'osi',
    module: 'Fundamentals',
    title: 'The OSI Model',
    minutes: 15,
    summary: 'Seven layers, PDUs and encapsulation — the map every network engineer uses.',
    sections: [
      { h: 'Why layers?', html: `
        <p>The <b>OSI (Open Systems Interconnection) model</b> splits networking into <b>7 layers</b>. Each layer has one job and only talks to the layers directly above and below. This lets vendors build parts independently and helps you <b>troubleshoot</b> step by step (“Is the cable OK? → Layer 1. Is the IP right? → Layer 3”).</p>
        <div class="callout tip"><b>Memory trick</b> (top → bottom, 7 → 1): <b>A</b>ll <b>P</b>eople <b>S</b>eem <b>T</b>o <b>N</b>eed <b>D</b>ata <b>P</b>rocessing.<br>Bottom → top: <b>P</b>lease <b>D</b>o <b>N</b>ot <b>T</b>hrow <b>S</b>ausage <b>P</b>izza <b>A</b>way.</div>
        <p>Click a layer to see what it does:</p>` },
      { widget: 'osi' },
      { sim: {
        kind: 'stage',
        title: 'Encapsulation & de-encapsulation',
        desc: 'As data goes DOWN the layers, each layer adds its own header. The receiver removes them going UP.',
        cfg: {
          init: s => {
            s.root.appendChild(h('div', { class: 'enc' },
              h('div', { class: 'enc-layers' }, ENC_LAYERS.map(([n, name]) => h('div', { class: 'enc-l', 'data-l': n }, h('b', {}, n), ' ' + name))),
              h('div', { class: 'enc-main' },
                h('div', { class: 'enc-side' }, 'Sender: PC 192.168.1.10'),
                h('div', { class: 'enc-pdu' }),
                h('div', { class: 'enc-name' }, ''),
                h('div', { class: 'enc-bits' }))));
          }
        },
        steps: [
          { text: '<b>Layers 7–5:</b> The browser creates the application data — an HTTP request. At this point the PDU is simply called <b>Data</b>.', run: s => { encLit(s, [7, 6, 5]); s.$('.enc-pdu').appendChild(encBlk('data', 'DATA: GET /index.html')); s.$('.enc-name').textContent = 'PDU = Data'; return s.wait(700); } },
          { text: '<b>Layer 4 Transport</b> adds a <b>TCP header</b> with source & destination <b>ports</b> (49152 → 443) and sequence numbers. Now it is a <b>Segment</b>.', run: s => { encLit(s, [4]); s.$('.enc-pdu').prepend(encBlk('l4', 'TCP  49152 → 443')); s.$('.enc-name').textContent = 'PDU = Segment'; return s.wait(700); } },
          { text: '<b>Layer 3 Network</b> adds an <b>IP header</b> with source & destination <b>IP addresses</b>. Now it is a <b>Packet</b>. Routers work here.', run: s => { encLit(s, [3]); s.$('.enc-pdu').prepend(encBlk('l3', 'IP  192.168.1.10 → 93.184.216.34')); s.$('.enc-name').textContent = 'PDU = Packet'; return s.wait(700); } },
          { text: '<b>Layer 2 Data Link</b> adds an <b>Ethernet header</b> (destination & source <b>MAC</b>) and a trailer (<b>FCS</b>, error check). Now it is a <b>Frame</b>. Switches work here.', run: s => { encLit(s, [2]); s.$('.enc-pdu').prepend(encBlk('l2', 'ETH  dst MAC | src MAC')); s.$('.enc-pdu').appendChild(encBlk('l2 fcs', 'FCS')); s.$('.enc-name').textContent = 'PDU = Frame'; return s.wait(700); } },
          { text: '<b>Layer 1 Physical</b> turns the frame into <b>bits</b> — electrical signals on copper, light in fiber, or radio waves in Wi-Fi.', run: s => {
            encLit(s, [1]); s.$('.enc-name').textContent = 'PDU = Bits';
            let bits = ''; for (let i = 0; i < 64; i++) bits += (i * 7 + 3) % 5 > 1 ? '1' : '0';
            s.$('.enc-bits').innerHTML = bits.split('').map((b, i) => `<span style="animation-delay:${i * 15}ms">${b}</span>`).join('');
            return s.wait(1200);
          } },
          { text: 'At the <b>receiver</b> the process reverses: Layer 2 checks the FCS and strips the Ethernet header/trailer…', run: s => { s.$('.enc-side').textContent = 'Receiver: Web server 93.184.216.34'; s.$('.enc-bits').innerHTML = ''; encLit(s, [2]); s.$$('.blk.l2').forEach(b => b.classList.add('gone')); s.$('.enc-name').textContent = 'Frame → Packet'; return s.wait(900); } },
          { text: '…Layer 3 checks the destination IP and removes the IP header, Layer 4 uses the port (443) to hand data to the right application (the web server software).', run: async s => { encLit(s, [3]); s.$$('.blk.l3').forEach(b => b.classList.add('gone')); s.$('.enc-name').textContent = 'Packet → Segment'; await s.wait(900); encLit(s, [4]); s.$$('.blk.l4').forEach(b => b.classList.add('gone')); s.$('.enc-name').textContent = 'Segment → Data'; await s.wait(900); encLit(s, [7, 6, 5]); s.$('.enc-name').textContent = 'Data delivered to HTTPS app ✓'; } }
        ]
      } },
      { h: 'OSI cheat table', html: `
        <table class="data">
          <tr><th>#</th><th>Layer</th><th>PDU</th><th>Addressing / job</th><th>Examples</th><th>Devices</th></tr>
          <tr><td>7</td><td>Application</td><td rowspan="3">Data</td><td>Network services for apps</td><td>HTTP, DNS, DHCP, SSH, FTP, SMTP</td><td rowspan="3">Hosts, firewalls</td></tr>
          <tr><td>6</td><td>Presentation</td><td>Format, encryption, compression</td><td>TLS, JPEG, ASCII</td></tr>
          <tr><td>5</td><td>Session</td><td>Open / manage / close sessions</td><td>NetBIOS, RPC</td></tr>
          <tr><td>4</td><td>Transport</td><td>Segment</td><td>Ports, reliability, flow control</td><td>TCP, UDP</td><td>Firewalls</td></tr>
          <tr><td>3</td><td>Network</td><td>Packet</td><td>IP addresses, routing</td><td>IPv4, IPv6, ICMP, OSPF</td><td>Router, L3 switch</td></tr>
          <tr><td>2</td><td>Data Link</td><td>Frame</td><td>MAC addresses, switching</td><td>Ethernet, 802.1Q, Wi-Fi MAC, ARP*</td><td>Switch, AP, NIC</td></tr>
          <tr><td>1</td><td>Physical</td><td>Bits</td><td>Signals, cables, connectors</td><td>UTP, fiber, RJ-45, radio</td><td>Hub, repeater, cable</td></tr>
        </table>
        <p class="small">*ARP sits between Layer 2 and 3.</p>` },
      { h: 'TCP/IP model vs OSI', html: `
        <p>The Internet really runs on the <b>TCP/IP model</b>, which merges some OSI layers:</p>
        <div class="map2">
          <div class="mcol"><div class="mh">OSI</div><div class="m l7">7 Application</div><div class="m l7">6 Presentation</div><div class="m l7">5 Session</div><div class="m l4">4 Transport</div><div class="m l3">3 Network</div><div class="m l2">2 Data Link</div><div class="m l2">1 Physical</div></div>
          <div class="mcol"><div class="mh">TCP/IP</div><div class="m l7 x3">Application</div><div class="m l4">Transport</div><div class="m l3">Internet</div><div class="m l2 x2">Network Access (Link)</div></div>
        </div>` }
    ],
    keypoints: [
      'OSI = 7 layers: Application, Presentation, Session, Transport, Network, Data Link, Physical.',
      'PDUs: Data → Segment (L4) → Packet (L3) → Frame (L2) → Bits (L1).',
      'Switches = Layer 2 (MAC). Routers = Layer 3 (IP).',
      'Troubleshoot bottom-up: cable/link first, then MAC, then IP, then ports/apps.'
    ],
    quiz: [
      { q: 'At which OSI layer does a router make forwarding decisions?', a: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4'], c: 2, why: 'Routers use IP addresses — the Network layer (3).' },
      { q: 'What is the PDU at the Transport layer called?', a: ['Frame', 'Packet', 'Segment', 'Bits'], c: 2, why: 'TCP/UDP data units are segments (UDP: sometimes "datagram").' },
      { q: 'Which layer adds source and destination MAC addresses?', a: ['Data Link', 'Network', 'Transport', 'Physical'], c: 0, why: 'Ethernet header with MACs is added at Layer 2.' },
      { q: 'TLS encryption fits best in which OSI layer?', a: ['Session', 'Presentation', 'Network', 'Data Link'], c: 1, why: 'Encryption/format translation is a Presentation layer function.' },
      { q: 'Correct encapsulation order when sending:', a: ['Data → Packet → Segment → Frame → Bits', 'Data → Segment → Packet → Frame → Bits', 'Bits → Frame → Packet → Segment → Data', 'Data → Frame → Packet → Segment → Bits'], c: 1, why: 'Going down the stack: Segment (L4), Packet (L3), Frame (L2), Bits (L1).' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'transport',
    module: 'Fundamentals',
    title: 'TCP, UDP & Ports',
    minutes: 15,
    summary: 'Reliable vs fast delivery, the 3-way handshake, and well-known port numbers.',
    sections: [
      { h: 'Two delivery styles', html: `
        <div class="cols2">
          <div class="card-mini"><h4>TCP — Transmission Control Protocol</h4><ul><li><b>Connection-oriented</b> (3-way handshake)</li><li>Reliable: sequence numbers, ACKs, retransmission</li><li>Flow control (window size)</li><li>Slower, more overhead (20-byte header)</li><li>Web, email, SSH, file transfer</li></ul></div>
          <div class="card-mini"><h4>UDP — User Datagram Protocol</h4><ul><li><b>Connectionless</b> — just send</li><li>No ACKs, no retransmission</li><li>Very low overhead (8-byte header)</li><li>Fast, good for real-time</li><li>DNS, DHCP, VoIP, video, TFTP, SNMP</li></ul></div>
        </div>
        <div class="callout tip"><b>Analogy:</b> TCP is a phone call (you say hello, confirm, then talk). UDP is shouting a message across the room — fast, but you do not know if it was heard.</div>` },
      { sim: {
        kind: 'ladder',
        title: 'TCP 3-way handshake, data and close',
        desc: 'Every TCP connection starts with SYN → SYN-ACK → ACK.',
        cfg: { w: 700, actors: [{ id: 'c', type: 'pc', label: 'Client', sub: '192.168.1.10:49152' }, { id: 's', type: 'server', label: 'Web Server', sub: '93.184.216.34:443' }] },
        steps: [
          { text: '<b>SYN</b>: Client asks to open a connection and picks a random starting sequence number (seq=100).', run: t => t.arrow('c', 's', 'SYN', { sub: 'seq=100', color: 'blue' }) },
          { text: '<b>SYN-ACK</b>: Server agrees, sends its own sequence number (seq=300) and acknowledges the client (ack=101 = “I expect byte 101 next”).', run: t => t.arrow('s', 'c', 'SYN + ACK', { sub: 'seq=300  ack=101', color: 'purple' }) },
          { text: '<b>ACK</b>: Client confirms (ack=301). The connection is <b>ESTABLISHED</b> — both sides agree on sequence numbers.', run: async t => { await t.arrow('c', 's', 'ACK', { sub: 'seq=101  ack=301', color: 'blue' }); await t.note('Connection ESTABLISHED', 'ok'); } },
          { text: 'Data is sent. Each segment is <b>acknowledged</b>. If an ACK does not come back in time, the sender <b>retransmits</b>.', run: async t => { await t.arrow('c', 's', 'HTTP GET (100 bytes)', { sub: 'seq=101', color: 'green' }); await t.arrow('s', 'c', 'ACK + HTTP 200 data', { sub: 'ack=201', color: 'green' }); } },
          { text: '<b>Lost segment:</b> a segment is lost, no ACK arrives, the timer expires and TCP sends it again. UDP would simply lose it.', run: async t => { await t.arrow('s', 'c', 'Data seq=301', { color: 'red', lost: true, sub: 'lost on the way' }); await t.note('Retransmission timer expires…', 'warn'); await t.arrow('s', 'c', 'Data seq=301 (retransmit)', { color: 'green' }); await t.arrow('c', 's', 'ACK', { sub: 'ack=1301', color: 'blue' }); } },
          { text: 'Closing uses <b>FIN</b> and <b>ACK</b> from both sides (4-way close).', run: async t => { await t.arrow('c', 's', 'FIN', { color: 'orange' }); await t.arrow('s', 'c', 'ACK', { color: 'orange' }); await t.arrow('s', 'c', 'FIN', { color: 'orange' }); await t.arrow('c', 's', 'ACK', { color: 'orange' }); await t.note('Connection CLOSED'); } }
        ]
      } },
      { sim: {
        kind: 'ladder',
        title: 'UDP: just send it',
        desc: 'A DNS lookup uses UDP port 53 — no handshake, no acknowledgements.',
        cfg: { w: 700, actors: [{ id: 'c', type: 'pc', label: 'Client', sub: '192.168.1.10:53001' }, { id: 's', type: 'server', label: 'DNS Server', sub: '8.8.8.8:53' }] },
        steps: [
          { text: 'Client sends one UDP datagram with the question. No connection setup.', run: t => t.arrow('c', 's', 'DNS Query: example.com A?', { color: 'teal' }) },
          { text: 'Server replies with one datagram. Done — just 2 packets instead of 7+ for TCP.', run: t => t.arrow('s', 'c', 'DNS Response: 93.184.216.34', { color: 'teal' }) },
          { text: 'If a datagram is lost, UDP does nothing. The <b>application</b> must decide (DNS just asks again after a timeout).', run: async t => { await t.arrow('c', 's', 'Query (lost)', { color: 'red', lost: true }); await t.note('Application timeout → ask again', 'warn'); await t.arrow('c', 's', 'DNS Query', { color: 'teal' }); await t.arrow('s', 'c', 'DNS Response', { color: 'teal' }); } }
        ]
      } },
      { h: 'Port numbers', html: `
        <p>A <b>port</b> identifies the application on a host. <b>IP + port = socket</b> (e.g. 93.184.216.34:443).</p>
        <ul><li><b>0–1023</b> well-known (servers) · <b>1024–49151</b> registered · <b>49152–65535</b> dynamic/ephemeral (client side)</li></ul>
        <table class="data ports">
          <tr><th>Port</th><th>Protocol</th><th>Transport</th><th>Use</th></tr>
          <tr><td>20/21</td><td>FTP</td><td>TCP</td><td>File transfer (data/control)</td></tr>
          <tr><td>22</td><td>SSH</td><td>TCP</td><td>Secure remote CLI</td></tr>
          <tr><td>23</td><td>Telnet</td><td>TCP</td><td>Insecure remote CLI (plain text!)</td></tr>
          <tr><td>25</td><td>SMTP</td><td>TCP</td><td>Send email</td></tr>
          <tr><td>53</td><td>DNS</td><td>UDP/TCP</td><td>Name resolution</td></tr>
          <tr><td>67/68</td><td>DHCP</td><td>UDP</td><td>Server / client address assignment</td></tr>
          <tr><td>69</td><td>TFTP</td><td>UDP</td><td>Simple file transfer (IOS images)</td></tr>
          <tr><td>80</td><td>HTTP</td><td>TCP</td><td>Web</td></tr>
          <tr><td>110</td><td>POP3</td><td>TCP</td><td>Receive email</td></tr>
          <tr><td>123</td><td>NTP</td><td>UDP</td><td>Time sync</td></tr>
          <tr><td>161/162</td><td>SNMP</td><td>UDP</td><td>Monitoring / traps</td></tr>
          <tr><td>443</td><td>HTTPS</td><td>TCP (QUIC: UDP)</td><td>Secure web</td></tr>
          <tr><td>514</td><td>Syslog</td><td>UDP</td><td>Logging</td></tr>
        </table>` }
    ],
    keypoints: [
      'TCP = reliable, connection-oriented (SYN, SYN-ACK, ACK). UDP = fast, connectionless.',
      'TCP uses sequence numbers, ACKs, retransmissions and windowing.',
      'Know the well-known ports: 22 SSH, 23 Telnet, 53 DNS, 67/68 DHCP, 80 HTTP, 443 HTTPS.',
      'Clients use random ephemeral ports (49152–65535).'
    ],
    quiz: [
      { q: 'Correct order of the TCP 3-way handshake:', a: ['SYN, ACK, SYN-ACK', 'SYN, SYN-ACK, ACK', 'ACK, SYN, FIN', 'SYN, FIN, ACK'], c: 1, why: 'Client SYN, server SYN-ACK, client ACK.' },
      { q: 'Which protocol is best for live voice calls?', a: ['TCP', 'UDP', 'FTP', 'SMTP'], c: 1, why: 'Real-time traffic prefers UDP: a retransmitted late voice packet is useless.' },
      { q: 'SSH uses which port?', a: ['21', '22', '23', '443'], c: 1, why: 'SSH = TCP 22. Telnet = 23.' },
      { q: 'DHCP uses which transport and ports?', a: ['TCP 67/68', 'UDP 67/68', 'UDP 53', 'TCP 443'], c: 1, why: 'DHCP server listens on UDP 67, client on UDP 68.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'ipv4',
    module: 'Fundamentals',
    title: 'IPv4 Addressing',
    minutes: 20,
    summary: 'Binary, subnet masks, network & broadcast addresses, private ranges.',
    sections: [
      { h: 'What an IPv4 address is', html: `
        <p>An IPv4 address is <b>32 bits</b>, written as 4 decimal <b>octets</b> (8 bits each): <code>192.168.10.77</code>. Each octet is 0–255.</p>
        <p>It has two parts: a <b>network part</b> (which street) and a <b>host part</b> (which house). The <b>subnet mask</b> tells where the split is. <code>255.255.255.0</code> = <code>/24</code> = the first 24 bits are the network.</p>
        <p>Practice binary — click bits to turn them on/off:</p>` },
      { widget: 'binary' },
      { sim: {
        kind: 'stage',
        title: 'Finding the network & broadcast address (the AND operation)',
        desc: 'Host 192.168.10.77 with mask /26 (255.255.255.192).',
        cfg: { init: s => s.root.appendChild(h('div', { class: 'bitstage' })) },
        steps: [
          { text: 'Write the IP address <b>192.168.10.77</b> in binary. Each octet = 8 bits (128 64 32 16 8 4 2 1).', run: s => { s.$('.bitstage').appendChild(bitRow('IP address', [192, 168, 10, 77], 32)); return s.wait(900); } },
          { text: 'The mask <b>/26</b> = 26 ones followed by 6 zeros = <b>255.255.255.192</b>. The ones mark the <b>network bits</b>, the zeros the <b>host bits</b>.', run: s => { s.$('.bitstage').appendChild(bitRow('Mask /26', [255, 255, 255, 192], 26, 'mask')); return s.wait(900); } },
          { text: '<b>IP AND mask</b> (1 AND 1 = 1, anything AND 0 = 0) → keep network bits, zero the host bits. Network address = <b>192.168.10.64</b>.', run: s => { s.$('.bitstage').appendChild(bitRow('Network', [192, 168, 10, 64], 26, 'net-row')); return s.wait(900); } },
          { text: 'Set all <b>host bits to 1</b> → <b>broadcast address 192.168.10.127</b>. Packets to it reach every host in the subnet.', run: s => { s.$('.bitstage').appendChild(bitRow('Broadcast', [192, 168, 10, 127], 26, 'bc-row')); return s.wait(900); } },
          { text: 'Usable hosts = 2<sup>host bits</sup> − 2 = 2<sup>6</sup> − 2 = <b>62</b>. Range: <b>192.168.10.65 – 192.168.10.126</b>. (−2 because network & broadcast cannot be given to hosts.)', run: s => { s.$('.bitstage').appendChild(h('div', { class: 'bit-summary' }, h('span', {}, 'Network ', h('b', {}, '.64')), h('span', {}, 'First host ', h('b', {}, '.65')), h('span', {}, 'Last host ', h('b', {}, '.126')), h('span', {}, 'Broadcast ', h('b', {}, '.127')), h('span', {}, 'Hosts ', h('b', {}, '62')))); return s.wait(500); } }
        ]
      } },
      { h: 'Address classes & private ranges', html: `
        <table class="data">
          <tr><th>Class</th><th>First octet</th><th>Default mask</th><th>Private range (RFC 1918)</th></tr>
          <tr><td>A</td><td>1–126</td><td>/8 255.0.0.0</td><td>10.0.0.0/8</td></tr>
          <tr><td>B</td><td>128–191</td><td>/16 255.255.0.0</td><td>172.16.0.0/12 (172.16–172.31)</td></tr>
          <tr><td>C</td><td>192–223</td><td>/24 255.255.255.0</td><td>192.168.0.0/16</td></tr>
          <tr><td>D</td><td>224–239</td><td>—</td><td>Multicast</td></tr>
          <tr><td>E</td><td>240–255</td><td>—</td><td>Experimental</td></tr>
        </table>
        <p>Special: <code>127.0.0.0/8</code> loopback (127.0.0.1 = “myself”), <code>169.254.0.0/16</code> APIPA (DHCP failed!), <code>0.0.0.0</code> “any / unknown”, <code>255.255.255.255</code> local broadcast.</p>
        <div class="callout warn"><b>Private addresses</b> are not routed on the Internet. Your home router uses <b>NAT</b> to translate them to one public IP (see the NAT lesson).</div>
        <p>Three types of traffic: <b>unicast</b> (one → one), <b>broadcast</b> (one → all in subnet), <b>multicast</b> (one → a group, 224.0.0.0/4).</p>` }
    ],
    keypoints: [
      'IPv4 = 32 bits = 4 octets. Mask splits network and host part.',
      'Network address = all host bits 0. Broadcast = all host bits 1.',
      'Usable hosts = 2^h − 2 (h = host bits).',
      'Private: 10/8, 172.16/12, 192.168/16. 169.254.x.x means DHCP failed.'
    ],
    quiz: [
      { q: 'What is the network address of 172.16.5.200/24?', a: ['172.16.0.0', '172.16.5.0', '172.16.5.255', '172.16.5.1'], c: 1, why: '/24 keeps the first three octets: 172.16.5.0.' },
      { q: 'Which is a PRIVATE address?', a: ['172.32.1.1', '11.0.0.1', '172.20.1.1', '192.169.1.1'], c: 2, why: '172.16.0.0–172.31.255.255 is private; 172.20 fits.' },
      { q: 'A PC shows IP 169.254.33.7. What happened?', a: ['Static IP set', 'DHCP failed (APIPA)', 'It is a loopback', 'It is a public IP'], c: 1, why: '169.254.0.0/16 is self-assigned when no DHCP server answers.' },
      { q: 'How many usable hosts in a /27?', a: ['30', '32', '62', '14'], c: 0, why: '32 − 27 = 5 host bits → 2^5 − 2 = 30.' },
      { q: '255.255.255.240 equals which prefix?', a: ['/26', '/27', '/28', '/29'], c: 2, why: '240 = 11110000 → 24 + 4 = /28.' }
    ]
  });

  /* ===================================================== */
  function splitBar(s, segs) {
    const bar = s.$('.splitbar');
    bar.innerHTML = '';
    segs.forEach((g, i) => {
      bar.appendChild(h('div', { class: 'seg c-' + (g.color || 'blue'), style: `flex:${g.size} 0 0;animation-delay:${i * 90}ms` },
        h('div', { class: 'seg-t' }, g.label), h('div', { class: 'seg-s' }, g.sub || '')));
    });
  }
  L.push({
    id: 'subnetting',
    module: 'Fundamentals',
    title: 'Subnetting & VLSM',
    minutes: 25,
    summary: 'Split networks fast with the block-size method, then size subnets with VLSM.',
    sections: [
      { h: 'Why subnet?', html: `
        <p><b>Subnetting</b> splits one big network into smaller ones. Smaller broadcast domains = less noise, better security (separate HR from Guests), and no wasted addresses.</p>
        <p>You <b>borrow host bits</b> to make more network bits. Borrow <i>n</i> bits → <b>2<sup>n</sup> subnets</b>. Remaining <i>h</i> host bits → <b>2<sup>h</sup> − 2 hosts</b> each.</p>` },
      { sim: {
        kind: 'stage',
        title: 'Cutting 192.168.1.0/24 into pieces',
        desc: 'Each borrowed bit doubles the number of subnets and halves their size.',
        cfg: { init: s => s.root.append(h('div', { class: 'split-head' }, ''), h('div', { class: 'splitbar' }), h('div', { class: 'split-note' }, '')) },
        steps: [
          { text: 'Start: <b>192.168.1.0/24</b> — one network, 256 addresses, 254 hosts.', run: s => { s.$('.split-head').textContent = '/24  →  1 network × 256 addresses'; splitBar(s, [{ size: 256, label: '192.168.1.0/24', sub: '.1 – .254', color: 'blue' }]); return s.wait(600); } },
          { text: 'Borrow <b>1 bit</b> → /25 → <b>2 subnets</b> of 128 addresses (126 hosts). Block size = 128.', run: s => { s.$('.split-head').textContent = '/25  →  2 subnets × 128'; splitBar(s, [{ size: 128, label: '.0/25', sub: '.1 – .126', color: 'blue' }, { size: 128, label: '.128/25', sub: '.129 – .254', color: 'purple' }]); return s.wait(600); } },
          { text: 'Borrow <b>2 bits</b> → /26 → <b>4 subnets</b> of 64 (62 hosts). Mask 255.255.255.<b>192</b>. Subnets start at multiples of 64: 0, 64, 128, 192.', run: s => { s.$('.split-head').textContent = '/26  →  4 subnets × 64'; splitBar(s, [0, 64, 128, 192].map((n, i) => ({ size: 64, label: '.' + n + '/26', sub: '.' + (n + 1) + '–.' + (n + 62), color: ['blue', 'purple', 'green', 'orange'][i] }))); return s.wait(600); } },
          { text: 'Borrow <b>3 bits</b> → /27 → <b>8 subnets</b> of 32 (30 hosts). Block size 32.', run: s => { s.$('.split-head').textContent = '/27  →  8 subnets × 32'; splitBar(s, [0, 32, 64, 96, 128, 160, 192, 224].map((n, i) => ({ size: 32, label: '.' + n, sub: '/27', color: ['blue', 'purple', 'green', 'orange'][i % 4] }))); return s.wait(600); } },
          { text: '<b>VLSM</b> (Variable Length Subnet Mask): give each LAN only what it needs. Sales needs 100 hosts → /25. IT 50 → /26. Guests 20 → /27. Router link 2 → /30. <b>Always allocate the biggest first.</b>', run: s => {
            s.$('.split-head').textContent = 'VLSM: different sizes in the same /24';
            splitBar(s, [
              { size: 128, label: 'Sales .0/25', sub: '126 hosts (need 100)', color: 'blue' },
              { size: 64, label: 'IT .128/26', sub: '62 (need 50)', color: 'green' },
              { size: 32, label: 'Guest .192/27', sub: '30 (need 20)', color: 'orange' },
              { size: 4, label: '/30', sub: '', color: 'red' },
              { size: 28, label: 'free', sub: '.228 – .255', color: 'gray' }
            ]);
            s.$('.split-note').innerHTML = 'WAN link <b>192.168.1.224/30</b> → hosts .225 and .226 (2 usable).';
            return s.wait(600);
          } }
        ]
      } },
      { h: 'The fast method: “magic number” (block size)', html: `
        <ol class="steps">
          <li>Find the <b>interesting octet</b> — the one where the mask is not 255 or 0.</li>
          <li><b>Block size = 256 − mask value</b> in that octet. (/26 → 256 − 192 = <b>64</b>)</li>
          <li>Subnets start at multiples of the block size: 0, 64, 128, 192…</li>
          <li>Find which block your IP falls into. Next block − 1 = broadcast.</li>
        </ol>
        <div class="callout tip"><b>Example:</b> 10.1.1.100/27 → block 32 → blocks 0, 32, 64, <b>96</b>, 128. 100 is in the 96 block → network <b>10.1.1.96</b>, broadcast <b>10.1.1.127</b>, hosts .97–.126.</div>
        <table class="data center">
          <tr><th>Prefix</th><th>Mask (last octet)</th><th>Block</th><th>Hosts</th></tr>
          <tr><td>/24</td><td>0</td><td>256</td><td>254</td></tr>
          <tr><td>/25</td><td>128</td><td>128</td><td>126</td></tr>
          <tr><td>/26</td><td>192</td><td>64</td><td>62</td></tr>
          <tr><td>/27</td><td>224</td><td>32</td><td>30</td></tr>
          <tr><td>/28</td><td>240</td><td>16</td><td>14</td></tr>
          <tr><td>/29</td><td>248</td><td>8</td><td>6</td></tr>
          <tr><td>/30</td><td>252</td><td>4</td><td>2 (point-to-point)</td></tr>
          <tr><td>/31</td><td>254</td><td>2</td><td>2 (P2P, RFC 3021)</td></tr>
          <tr><td>/32</td><td>255</td><td>1</td><td>1 host route / loopback</td></tr>
        </table>` },
      { h: 'Try it: subnet calculator', widget: 'subnetcalc' },
      { h: 'Practice drill', widget: 'subnetpractice' }
    ],
    keypoints: [
      'Borrow n bits → 2^n subnets. h host bits → 2^h − 2 hosts.',
      'Block size = 256 − interesting mask octet.',
      'VLSM: allocate largest subnets first to avoid overlap.',
      '/30 (or /31) for point-to-point router links.'
    ],
    quiz: [
      { q: 'Which subnet does 192.168.5.130/26 belong to?', a: ['192.168.5.64', '192.168.5.128', '192.168.5.192', '192.168.5.0'], c: 1, why: 'Block 64 → 0, 64, 128, 192. 130 is in the 128 block.' },
      { q: 'Broadcast address of 10.10.10.20/28?', a: ['10.10.10.31', '10.10.10.15', '10.10.10.23', '10.10.10.255'], c: 0, why: 'Block 16 → network .16, next .32 → broadcast .31.' },
      { q: 'Smallest prefix (largest subnet) needed for 500 hosts?', a: ['/24', '/23', '/22', '/25'], c: 1, why: '2^9 − 2 = 510 ≥ 500 → 9 host bits → /23.' },
      { q: 'Best mask for a router-to-router link (2 hosts) in classic design?', a: ['/24', '/28', '/30', '/32'], c: 2, why: '/30 gives exactly 2 usable addresses.' },
      { q: 'You borrow 3 bits from a /24. How many subnets?', a: ['3', '6', '8', '16'], c: 2, why: '2^3 = 8 subnets (/27).' }
    ]
  });

  /* ===================================================== */
  function hexRow(s, parts, mark) {
    const row = s.$('.v6row'); row.innerHTML = '';
    parts.forEach((p, i) => {
      if (i) row.appendChild(h('span', { class: 'v6colon' }, ':'));
      row.appendChild(h('span', { class: 'v6h' + (mark && mark.includes(i) ? ' mark' : '') + (p === '' ? ' dbl' : ''), style: `animation-delay:${i * 60}ms` }, p === '' ? ':' : p));
    });
  }
  L.push({
    id: 'ipv6',
    module: 'Fundamentals',
    title: 'IPv6 Basics',
    minutes: 15,
    summary: '128-bit addresses, shortening rules, address types and SLAAC.',
    sections: [
      { h: 'Why IPv6?', html: `
        <p>IPv4 has only ~4.3 billion addresses — they ran out. <b>IPv6 uses 128 bits</b> = 340 undecillion addresses. It is written as <b>8 groups (hextets)</b> of 4 hex digits separated by colons.</p>
        <p>No broadcast in IPv6 (it uses <b>multicast</b>), no NAT needed, and hosts can configure themselves (<b>SLAAC</b>). Typical LAN prefix is <b>/64</b>: first 64 bits = network, last 64 = interface ID.</p>` },
      { sim: {
        kind: 'stage',
        title: 'Shortening an IPv6 address',
        desc: 'Two rules make long addresses readable.',
        cfg: { init: s => s.root.append(h('div', { class: 'v6row' }), h('div', { class: 'v6note' })) },
        steps: [
          { text: 'Full address: 8 hextets × 16 bits = 128 bits.', run: s => { hexRow(s, ['2001', '0db8', '0000', '0000', '0000', 'ff00', '0042', '8329']); s.$('.v6note').textContent = '2001:0db8:0000:0000:0000:ff00:0042:8329'; return s.wait(600); } },
          { text: '<b>Rule 1:</b> remove <b>leading zeros</b> in each hextet. 0db8 → db8, 0000 → 0, 0042 → 42.', run: s => { hexRow(s, ['2001', 'db8', '0', '0', '0', 'ff00', '42', '8329'], [1, 2, 3, 4, 6]); s.$('.v6note').textContent = '2001:db8:0:0:0:ff00:42:8329'; return s.wait(600); } },
          { text: '<b>Rule 2:</b> replace <b>one</b> run of consecutive all-zero hextets with <b>::</b>. Only once per address (otherwise you cannot tell how many zeros each :: hides).', run: s => { hexRow(s, ['2001', 'db8', '', 'ff00', '42', '8329'], [2]); s.$('.v6note').innerHTML = '<b>2001:db8::ff00:42:8329</b>'; return s.wait(600); } }
        ]
      } },
      { h: 'IPv6 address types', html: `
        <table class="data">
          <tr><th>Type</th><th>Prefix</th><th>Like IPv4…</th></tr>
          <tr><td>Global Unicast (GUA)</td><td><code>2000::/3</code></td><td>Public address</td></tr>
          <tr><td>Unique Local (ULA)</td><td><code>FC00::/7</code> (FD..)</td><td>Private (10.x)</td></tr>
          <tr><td>Link-Local</td><td><code>FE80::/10</code></td><td>169.254.x.x — always present, never routed</td></tr>
          <tr><td>Multicast</td><td><code>FF00::/8</code></td><td>Replaces broadcast (FF02::1 all nodes, FF02::2 all routers)</td></tr>
          <tr><td>Loopback</td><td><code>::1</code></td><td>127.0.0.1</td></tr>
          <tr><td>Unspecified</td><td><code>::</code></td><td>0.0.0.0</td></tr>
        </table>
        <h4>How hosts get an address</h4>
        <ul>
          <li><b>Static</b> configuration.</li>
          <li><b>SLAAC</b> — router sends a <i>Router Advertisement</i> (NDP) with the /64 prefix; host builds its own interface ID (random, or <b>EUI-64</b> from MAC: split MAC, insert FFFE, flip 7th bit).</li>
          <li><b>DHCPv6</b> — stateful (server assigns) or stateless (SLAAC + DNS info).</li>
        </ul>
        <p><b>NDP</b> (Neighbor Discovery Protocol, ICMPv6) replaces ARP: Neighbor Solicitation / Advertisement, Router Solicitation / Advertisement.</p>` }
    ],
    keypoints: [
      'IPv6 = 128 bits, 8 hextets, usually /64 per LAN.',
      'Drop leading zeros; use :: once for consecutive zero hextets.',
      'FE80::/10 link-local, 2000::/3 global, FF00::/8 multicast. No broadcast.',
      'NDP replaces ARP. SLAAC lets hosts self-configure.'
    ],
    quiz: [
      { q: 'Valid short form of 2001:0db8:0000:0000:0001:0000:0000:0001?', a: ['2001:db8::1::1', '2001:db8::1:0:0:1', '2001:db8:0:0:1::1', 'Both B and C'], c: 3, why: ':: may be used only once. B and C are both valid (best practice: compress the longest run, leftmost if tied → B).' },
      { q: 'Which prefix is link-local?', a: ['FF00::/8', 'FE80::/10', '2000::/3', 'FC00::/7'], c: 1, why: 'FE80::/10 is link-local.' },
      { q: 'What replaces ARP in IPv6?', a: ['DHCPv6', 'NDP', 'ICMPv4', 'RA Guard'], c: 1, why: 'Neighbor Discovery Protocol (ICMPv6 NS/NA).' },
      { q: 'IPv6 has no…', a: ['Multicast', 'Unicast', 'Broadcast', 'Anycast'], c: 2, why: 'Broadcast is replaced by multicast groups.' }
    ]
  });
})();
