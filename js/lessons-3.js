/* Module 3 — Cisco IOS, Routing and IP Services */
(function () {
  const L = (window.LESSONS = window.LESSONS || []);
  const h = Engine.h;

  async function type(s, prompt, cmd, out) {
    const term = s.$('.term');
    const line = h('div', { class: 'tl' }, h('span', { class: 'tp' }, prompt), h('span', { class: 'tc' }));
    term.appendChild(line);
    const c = line.querySelector('.tc');
    if (s.instant) c.textContent = cmd;
    else for (let i = 1; i <= cmd.length; i++) { c.textContent = cmd.slice(0, i); await s.wait(28); }
    if (out) out.split('\n').forEach(o => term.appendChild(h('div', { class: 'to' }, o)));
    term.scrollTop = term.scrollHeight;
    await s.wait(250);
  }
  function mode(s, m) { s.$$('.mode').forEach(e => e.classList.toggle('on', e.dataset.m === m)); }

  /* ===================================================== */
  L.push({
    id: 'ios',
    module: 'Cisco IOS',
    title: 'Cisco IOS CLI Basics',
    minutes: 15,
    summary: 'CLI modes, basic device setup, saving config, and secure SSH access.',
    sections: [
      { h: 'CLI modes', html: `
        <p>Cisco routers and switches run <b>IOS</b>. You configure them through the console cable or SSH using the <b>command line</b>. Each mode has a different prompt:</p>
        <table class="data">
          <tr><th>Mode</th><th>Prompt</th><th>Enter with</th><th>Use</th></tr>
          <tr><td>User EXEC</td><td><code>Switch&gt;</code></td><td>login</td><td>Basic show/ping</td></tr>
          <tr><td>Privileged EXEC</td><td><code>Switch#</code></td><td><code>enable</code></td><td>All show, debug, copy, reload</td></tr>
          <tr><td>Global config</td><td><code>Switch(config)#</code></td><td><code>configure terminal</code></td><td>Device-wide settings</td></tr>
          <tr><td>Interface config</td><td><code>Switch(config-if)#</code></td><td><code>interface g0/1</code></td><td>Port settings</td></tr>
          <tr><td>Line config</td><td><code>Switch(config-line)#</code></td><td><code>line vty 0 15</code></td><td>Console / remote access</td></tr>
        </table>
        <p><code>exit</code> goes back one level, <code>end</code> (or Ctrl+Z) returns to Privileged EXEC. <b>?</b> shows help, <b>Tab</b> completes commands. In config mode, prefix show commands with <code>do</code>.</p>` },
      { sim: {
        kind: 'stage',
        title: 'First-time switch setup',
        cfg: { init: s => s.root.append(h('div', { class: 'modes' }, ['user', 'priv', 'global', 'if', 'line'].map((m, i) => h('div', { class: 'mode', 'data-m': m }, ['User EXEC >', 'Privileged #', 'Global (config)#', 'Interface (config-if)#', 'Line (config-line)#'][i]))), h('div', { class: 'term' })) },
        steps: [
          { text: 'You connect the console cable. You start in <b>User EXEC</b> mode — limited commands.', run: s => { mode(s, 'user'); return type(s, 'Switch>', 'enable'); } },
          { text: '<b>Privileged EXEC</b>: now enter <b>global configuration</b> mode.', run: s => { mode(s, 'priv'); return type(s, 'Switch#', 'configure terminal', 'Enter configuration commands, one per line.  End with CNTL/Z.'); } },
          { text: 'Set a hostname, an encrypted enable password and a banner.', run: async s => { mode(s, 'global'); await type(s, 'Switch(config)#', 'hostname SW1'); await type(s, 'SW1(config)#', 'enable secret Cisc0!23'); await type(s, 'SW1(config)#', 'service password-encryption'); await type(s, 'SW1(config)#', 'banner motd #Authorized access only#'); } },
          { text: 'Give the switch a management IP on <b>VLAN 1 SVI</b> and a default gateway, so you can reach it remotely.', run: async s => { await type(s, 'SW1(config)#', 'interface vlan 1'); mode(s, 'if'); await type(s, 'SW1(config-if)#', 'ip address 192.168.1.2 255.255.255.0'); await type(s, 'SW1(config-if)#', 'no shutdown'); await type(s, 'SW1(config-if)#', 'exit'); mode(s, 'global'); await type(s, 'SW1(config)#', 'ip default-gateway 192.168.1.1'); } },
          { text: 'Enable <b>SSH</b> (encrypted) instead of Telnet: domain name, RSA keys, a local user, and the VTY lines.', run: async s => { await type(s, 'SW1(config)#', 'ip domain-name lab.local'); await type(s, 'SW1(config)#', 'crypto key generate rsa modulus 2048', '% Generating 2048 bit RSA keys ...[OK]'); await type(s, 'SW1(config)#', 'username admin secret Adm1nPass'); await type(s, 'SW1(config)#', 'ip ssh version 2'); await type(s, 'SW1(config)#', 'line vty 0 15'); mode(s, 'line'); await type(s, 'SW1(config-line)#', 'login local'); await type(s, 'SW1(config-line)#', 'transport input ssh'); } },
          { text: '<b>Save!</b> The <b>running-config</b> lives in RAM and is lost on reboot. Copy it to the <b>startup-config</b> in NVRAM.', run: async s => { await type(s, 'SW1(config-line)#', 'end'); mode(s, 'priv'); await type(s, 'SW1#', 'copy running-config startup-config', 'Destination filename [startup-config]?\n[OK]'); } }
        ]
      } },
      { h: 'Memory in a Cisco device', html: `
        <ul><li><b>ROM</b> — bootstrap / POST</li><li><b>Flash</b> — IOS image</li><li><b>NVRAM</b> — startup-config</li><li><b>RAM</b> — running-config, tables (lost when power off)</li></ul>` }
    ],
    cli: `Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# enable secret <password>
SW1(config)# service password-encryption
SW1(config)# no ip domain-lookup
SW1(config)# banner motd #Authorized access only#
! Console
SW1(config)# line console 0
SW1(config-line)# password <password>
SW1(config-line)# login
SW1(config-line)# logging synchronous
SW1(config-line)# exec-timeout 5 0
! SSH
SW1(config)# ip domain-name lab.local
SW1(config)# crypto key generate rsa modulus 2048
SW1(config)# username admin secret <password>
SW1(config)# ip ssh version 2
SW1(config)# line vty 0 15
SW1(config-line)# login local
SW1(config-line)# transport input ssh
! Save & verify
SW1# copy running-config startup-config
SW1# write memory
SW1# show running-config
SW1# show startup-config
SW1# show version
SW1# show ip interface brief
SW1# reload`,
    keypoints: ['User EXEC > → enable → Privileged # → configure terminal → (config)#.', 'running-config = RAM; startup-config = NVRAM. Save with copy run start.', 'Use enable secret (hashed) and SSH v2, never Telnet.'],
    quiz: [
      { q: 'Which command saves the configuration permanently?', a: ['save config', 'copy running-config startup-config', 'write terminal', 'show running-config'], c: 1, why: 'Copies RAM config to NVRAM (also: write memory).' },
      { q: 'Prompt "Router(config-if)#" means you are in…', a: ['Privileged EXEC', 'Global config', 'Interface config', 'Line config'], c: 2, why: 'config-if = interface configuration mode.' },
      { q: 'Which is required to generate RSA keys for SSH?', a: ['A hostname other than default and an ip domain-name', 'A VLAN', 'DHCP', 'NTP'], c: 0, why: 'The key name uses hostname.domain.' }
    ]
  });

  /* ===================================================== */
  const R1 = [['C', '10.1.1.0/24', 'G0/0', '—'], ['C', '10.0.12.0/30', 'G0/1', '—'], ['S', '10.3.3.0/24 [1/0]', 'via 10.0.12.2', ''], ['S*', '0.0.0.0/0 [1/0]', 'via 10.0.12.2', '']];
  const R2 = [['C', '10.0.12.0/30', 'G0/0', ''], ['C', '10.0.23.0/30', 'G0/1', ''], ['O', '10.3.3.0/24 [110/2]', 'via 10.0.23.2', ''], ['O', '10.1.1.0/24 [110/2]', 'via 10.0.12.1', '']];
  const R3 = [['C', '10.0.23.0/30', 'G0/0', ''], ['C', '10.3.3.0/24', 'G0/1', ''], ['O', '10.1.1.0/24 [110/3]', 'via 10.0.23.1', '']];
  const LPM = [['O', '10.0.0.0/8', 'via R-A'], ['S', '10.1.0.0/16', 'via R-B'], ['C', '10.1.1.0/24', 'G0/3 (R-C)'], ['S*', '0.0.0.0/0', 'via ISP']];
  L.push({
    id: 'routing',
    module: 'Routing',
    title: 'IP Routing & Static Routes',
    minutes: 25,
    summary: 'How routers forward packets hop by hop: routing tables, longest prefix match, AD, static & default routes.',
    sections: [
      { h: 'What a router does', html: `
        <p>A router receives a packet, looks at the <b>destination IP</b>, finds the best match in its <b>routing table</b>, and forwards the packet out the right interface toward the <b>next hop</b>. At each hop it <b>decrements the TTL</b> (drops the packet at 0 — prevents loops) and builds a <b>new Layer-2 frame</b>.</p>
        <p>Routes come from three sources:</p>
        <ul>
          <li><b>C / L</b> — Connected & Local: interfaces with an IP that are up.</li>
          <li><b>S</b> — Static: typed by an admin. Simple, no overhead, but does not adapt.</li>
          <li><b>Dynamic</b> — learned from routing protocols (O = OSPF, D = EIGRP, R = RIP, B = BGP).</li>
        </ul>` },
      { sim: {
        title: 'Hop-by-hop forwarding',
        desc: 'PC1 sends a packet to the server 3 routers away. Watch each routing table lookup.',
        cfg: {
          w: 860, h: 300,
          nodes: [
            { id: 'pc', type: 'pc', x: 60, y: 140, label: 'PC1', sub: '10.1.1.10' },
            { id: 'r1', type: 'router', x: 240, y: 140, label: 'R1' },
            { id: 'r2', type: 'router', x: 430, y: 140, label: 'R2' },
            { id: 'r3', type: 'router', x: 620, y: 140, label: 'R3' },
            { id: 'srv', type: 'server', x: 800, y: 140, label: 'Server', sub: '10.3.3.10' }
          ],
          links: [{ a: 'pc', b: 'r1', label: '10.1.1.0/24' }, { a: 'r1', b: 'r2', label: '10.0.12.0/30' }, { a: 'r2', b: 'r3', label: '10.0.23.0/30' }, { a: 'r3', b: 'srv', label: '10.3.3.0/24' }],
          tables: [{ id: 'rt', title: 'Routing table', cols: ['Code', 'Destination', 'Next hop / exit', ''] }]
        },
        steps: [
          { text: 'PC1 sees 10.3.3.10 is <b>not in its subnet</b> (10.1.1.0/24) → sends the packet to its default gateway <b>R1</b>. TTL starts at 64 (Windows: 128).', run: t => t.send(['pc', 'r1'], { label: 'dst 10.3.3.10 TTL 64', color: 'blue' }) },
          { text: '<b>R1</b> looks up 10.3.3.10 → matches the <b>static route</b> 10.3.3.0/24 via 10.0.12.2. TTL − 1 = 63. Forward to R2.', run: async t => { t.setRows('rt', R1, 2, 'R1 routing table'); t.glow('r1', true); await t.wait(700); await t.send(['r1', 'r2'], { label: 'dst 10.3.3.10 TTL 63', color: 'blue' }); t.glow('r1', false); } },
          { text: '<b>R2</b> learned 10.3.3.0/24 from <b>OSPF</b> [110/2] via 10.0.23.2 → forward to R3. TTL 62.', run: async t => { t.setRows('rt', R2, 2, 'R2 routing table'); t.glow('r2', true); await t.wait(700); await t.send(['r2', 'r3'], { label: 'dst 10.3.3.10 TTL 62', color: 'blue' }); t.glow('r2', false); } },
          { text: '<b>R3</b>: 10.3.3.0/24 is <b>directly connected</b> on G0/1 → ARP for the server MAC and deliver. TTL 61.', run: async t => { t.setRows('rt', R3, 1, 'R3 routing table'); t.glow('r3', true); await t.wait(700); await t.send(['r3', 'srv'], { label: 'dst 10.3.3.10 TTL 61', color: 'blue' }); t.glow('r3', false); } },
          { text: 'The reply needs a route <b>back</b> to 10.1.1.0/24 on every router! A missing return route is a classic reason why “ping does not work”.', run: async t => { t.setRows('rt', R3, 2, 'R3 routing table'); await t.send(['srv', 'r3', 'r2', 'r1', 'pc'], { label: 'Echo reply', color: 'green' }); } }
        ]
      } },
      { h: 'Longest prefix match', html: `<p>When several routes match, the router picks the <b>most specific</b> one — the <b>longest prefix</b> (biggest /number). Administrative distance and metric are only compared between routes to the <b>same</b> prefix.</p>` },
      { sim: {
        title: 'Longest prefix match in action',
        cfg: {
          w: 800, h: 360,
          nodes: [
            { id: 'r', type: 'router', x: 330, y: 180, label: 'R1' },
            { id: 'in', type: 'pc', x: 80, y: 180, label: 'Sender' },
            { id: 'a', type: 'router', x: 620, y: 50, label: 'R-A', sub: '10.0.0.0/8' },
            { id: 'b', type: 'router', x: 680, y: 150, label: 'R-B', sub: '10.1.0.0/16' },
            { id: 'c', type: 'router', x: 680, y: 250, label: 'R-C', sub: '10.1.1.0/24' },
            { id: 'isp', type: 'cloud', x: 600, y: 320, label: 'ISP (default)' }
          ],
          links: [{ a: 'in', b: 'r' }, { a: 'r', b: 'a' }, { a: 'r', b: 'b' }, { a: 'r', b: 'c' }, { a: 'r', b: 'isp' }],
          tables: [{ id: 'rt', title: 'R1 routing table', cols: ['', 'Prefix', 'Next hop'], rows: LPM }]
        },
        steps: [
          { text: 'Packet to <b>10.1.1.5</b>: matches /8, /16, /24 and /0. Longest = <b>/24</b> → R-C.', run: async t => { await t.send(['in', 'r'], { label: '10.1.1.5', color: 'blue' }); t.hiRow('rt', 2); await t.send(['r', 'c'], { label: '10.1.1.5', color: 'blue' }); } },
          { text: 'Packet to <b>10.1.2.5</b>: /24 does not match (10.1.1.x only). Longest remaining = <b>/16</b> → R-B.', run: async t => { await t.send(['in', 'r'], { label: '10.1.2.5', color: 'purple' }); t.hiRow('rt', 1); await t.send(['r', 'b'], { label: '10.1.2.5', color: 'purple' }); } },
          { text: 'Packet to <b>10.200.1.1</b>: only /8 and /0 match → <b>/8</b> → R-A.', run: async t => { await t.send(['in', 'r'], { label: '10.200.1.1', color: 'orange' }); t.hiRow('rt', 0); await t.send(['r', 'a'], { label: '10.200.1.1', color: 'orange' }); } },
          { text: 'Packet to <b>8.8.8.8</b>: only the <b>default route 0.0.0.0/0</b> matches (“gateway of last resort”) → ISP. Without a default route the packet would be dropped.', run: async t => { await t.send(['in', 'r'], { label: '8.8.8.8', color: 'green' }); t.hiRow('rt', 3); await t.send(['r', 'isp'], { label: '8.8.8.8', color: 'green' }); } }
        ]
      } },
      { h: 'Administrative Distance (trustworthiness)', html: `
        <p>If two <b>sources</b> offer a route to the <b>same prefix</b>, the lowest <b>AD</b> wins. Inside one protocol, the lowest <b>metric</b> wins.</p>
        <table class="data center">
          <tr><th>Source</th><th>AD</th></tr>
          <tr><td>Connected</td><td>0</td></tr><tr><td>Static</td><td>1</td></tr><tr><td>eBGP</td><td>20</td></tr>
          <tr><td>EIGRP (internal)</td><td>90</td></tr><tr><td>OSPF</td><td>110</td></tr><tr><td>IS-IS</td><td>115</td></tr>
          <tr><td>RIP</td><td>120</td></tr><tr><td>iBGP</td><td>200</td></tr><tr><td>Unusable</td><td>255</td></tr>
        </table>
        <p>A <b>floating static route</b> has a higher AD (e.g. 130) so it is only used when the dynamic route disappears — a backup link.</p>
        <p>Reading a route: <code>O 10.3.3.0/24 [110/2] via 10.0.23.2, 00:05:12, G0/1</code> → OSPF, AD 110, metric 2, next hop 10.0.23.2.</p>` }
    ],
    cli: `! Enable an interface
Router(config)# interface g0/0
Router(config-if)# ip address 10.1.1.1 255.255.255.0
Router(config-if)# no shutdown

! Static routes
Router(config)# ip route 10.3.3.0 255.255.255.0 10.0.12.2       ! next-hop
Router(config)# ip route 10.3.3.0 255.255.255.0 g0/1             ! exit interface (point-to-point)
Router(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1             ! default route
Router(config)# ip route 10.3.3.0 255.255.255.0 10.0.99.2 130    ! floating static (backup)

! IPv6 static
Router(config)# ipv6 unicast-routing
Router(config)# ipv6 route 2001:db8:3::/64 2001:db8:12::2
Router(config)# ipv6 route ::/0 2001:db8:12::2

! Verify & test
Router# show ip route
Router# show ip route static
Router# show ip route 10.3.3.10
Router# ping 10.3.3.10
Router# traceroute 10.3.3.10`,
    keypoints: [
      'Routers forward based on destination IP; TTL decreases each hop.',
      'Longest prefix match first; then AD (between sources); then metric (inside a protocol).',
      'Default route 0.0.0.0/0 = gateway of last resort.',
      'Routing must work in BOTH directions.'
    ],
    quiz: [
      { q: 'Routes to 10.1.1.0/24 (OSPF) and 10.1.0.0/16 (static). Packet to 10.1.1.9 uses…', a: ['The static route (lower AD)', 'The OSPF /24 route (longest prefix)', 'Both (load balance)', 'The default route'], c: 1, why: 'Longest prefix match always comes first. AD only compares identical prefixes.' },
      { q: 'Administrative distance of OSPF?', a: ['90', '100', '110', '120'], c: 2, why: 'OSPF = 110, EIGRP = 90, RIP = 120, static = 1.' },
      { q: 'Command for a default static route via 1.1.1.1:', a: ['ip route 0.0.0.0 255.255.255.255 1.1.1.1', 'ip route 0.0.0.0 0.0.0.0 1.1.1.1', 'ip default-route 1.1.1.1', 'route add default 1.1.1.1'], c: 1, why: 'Network 0.0.0.0 mask 0.0.0.0 matches everything.' },
      { q: 'What does a router do when TTL reaches 0?', a: ['Forwards it anyway', 'Drops it and sends ICMP Time Exceeded', 'Resets TTL to 64', 'Broadcasts it'], c: 1, why: 'traceroute uses exactly this behavior.' },
      { q: 'A floating static route is…', a: ['A route with a higher AD used as backup', 'A route to a floating IP', 'A default route', 'A route learned by OSPF'], c: 0, why: 'Higher AD keeps it out of the table until the primary route disappears.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'ospf',
    module: 'Routing',
    title: 'OSPF (Dynamic Routing)',
    minutes: 25,
    summary: 'Link-state routing: hellos, neighbors, LSAs, SPF, cost and fast reconvergence.',
    sections: [
      { h: 'Dynamic routing protocols', html: `
        <table class="data">
          <tr><th>Type</th><th>How it works</th><th>Examples</th></tr>
          <tr><td>Distance vector</td><td>Tells neighbors “I can reach X at distance N” (routing by rumor)</td><td>RIP (hop count, max 15)</td></tr>
          <tr><td>Advanced DV</td><td>DV + fast convergence features</td><td>EIGRP (Cisco)</td></tr>
          <tr><td><b>Link state</b></td><td>Every router learns the <b>full map</b> and computes best paths itself (Dijkstra SPF)</td><td><b>OSPF</b>, IS-IS</td></tr>
          <tr><td>Path vector</td><td>Between organizations (Internet)</td><td>BGP</td></tr>
        </table>
        <p><b>OSPF</b> (Open Shortest Path First) is an open standard IGP. Metric = <b>cost</b> = reference bandwidth (100 Mbps default) ÷ interface bandwidth. Sends Hellos to multicast <b>224.0.0.5</b>. AD <b>110</b>.</p>` },
      { sim: {
        title: 'OSPF: from neighbors to best path',
        desc: 'Link costs are shown on each link. R1 wants to reach the server LAN behind R4.',
        cfg: {
          w: 820, h: 380,
          nodes: [
            { id: 'r1', type: 'router', x: 150, y: 90, label: 'R1', sub: 'RID 1.1.1.1' },
            { id: 'r2', type: 'router', x: 470, y: 90, label: 'R2', sub: 'RID 2.2.2.2' },
            { id: 'r3', type: 'router', x: 150, y: 290, label: 'R3', sub: 'RID 3.3.3.3' },
            { id: 'r4', type: 'router', x: 470, y: 290, label: 'R4', sub: 'RID 4.4.4.4' },
            { id: 'srv', type: 'server', x: 700, y: 290, label: 'Server LAN', sub: '10.4.4.0/24' }
          ],
          links: [
            { a: 'r1', b: 'r2', label: 'cost 1' }, { a: 'r2', b: 'r4', label: 'cost 10', lx: 34 },
            { a: 'r1', b: 'r3', label: 'cost 1', lx: -34 }, { a: 'r3', b: 'r4', label: 'cost 1' }, { a: 'r4', b: 'srv', label: 'cost 1' }
          ],
          tables: [{ id: 'nb', title: 'R1 neighbor table', cols: ['Neighbor ID', 'State', 'Interface'] }, { id: 'rt', title: 'R1 OSPF route to 10.4.4.0/24', cols: ['Path', 'Total cost', ''] }]
        },
        steps: [
          { text: '<b>Hello</b> packets are sent every 10 s (Ethernet) to 224.0.0.5. Routers become <b>neighbors</b> if area, subnet, hello/dead timers, authentication and MTU match.', run: t => t.many([['r1', 'r2'], ['r2', 'r1'], ['r1', 'r3'], ['r3', 'r1'], ['r3', 'r4'], ['r4', 'r3'], ['r2', 'r4'], ['r4', 'r2']], { label: 'Hello', color: 'teal' }) },
          { text: 'Neighbors move through states <i>Down → Init → 2-Way → ExStart → Exchange → Loading → <b>Full</b></i>. R1 is now FULL with R2 and R3.', run: async t => { t.addRow('nb', ['2.2.2.2', 'FULL', 'G0/0']); await t.wait(300); t.addRow('nb', ['3.3.3.3', 'FULL', 'G0/1']); } },
          { text: 'Each router floods <b>LSAs</b> (Link-State Advertisements) describing its links. Soon all routers have an <b>identical LSDB</b> — the same map of the network.', run: async t => { await t.many([['r4', 'r3', 'r1'], ['r4', 'r2', 'r1'], ['r2', 'r1', 'r3'], ['r3', 'r4', 'r2']], { label: 'LSA', color: 'purple' }); ['r1', 'r2', 'r3', 'r4'].forEach(r => t.badge(r, 'LSDB ✓', 'ok')); } },
          { text: 'R1 runs <b>SPF (Dijkstra)</b>: via R2 = 1 + 10 + 1 = <b>12</b>, via R3 = 1 + 1 + 1 = <b>3</b>. Lowest cost wins → path R1 → R3 → R4.', run: async t => { t.setRows('rt', [['R1→R2→R4', '12', ''], ['R1→R3→R4', '3', '✓ best']], 1); t.setLink('r1', 'r3', 'best'); t.setLink('r3', 'r4', 'best'); t.setLink('r4', 'srv', 'best'); await t.wait(500); } },
          { text: 'Traffic follows the best path. The routing table shows <code>O 10.4.4.0/24 [110/3] via R3</code>.', run: t => t.send(['r1', 'r3', 'r4', 'srv'], { label: 'Data', color: 'blue' }) },
          { text: '<b>Link failure R3–R4!</b> R3 and R4 flood new LSAs. Every router reruns SPF. New best path: via R2, cost 12. Convergence in seconds (no manual work).', run: async t => { t.setLink('r3', 'r4', 'down'); t.setLink('r1', 'r3', ''); await t.many([['r3', 'r1'], ['r4', 'r2', 'r1']], { label: 'LSA', color: 'red' }); t.setRows('rt', [['R1→R2→R4', '12', '✓ best'], ['R1→R3→R4', '∞', 'link down']], 0); t.setLink('r1', 'r2', 'best'); t.setLink('r2', 'r4', 'best'); await t.send(['r1', 'r2', 'r4', 'srv'], { label: 'Data', color: 'blue' }); } }
        ]
      } },
      { h: 'Key OSPF terms', html: `
        <ul>
          <li><b>Router ID</b>: 32-bit ID. Chosen: manual <code>router-id</code> → highest loopback IP → highest active interface IP.</li>
          <li><b>Areas</b>: big networks are divided into areas; <b>Area 0</b> = backbone. All areas connect to area 0. Routers between areas = <b>ABR</b>.</li>
          <li><b>DR / BDR</b>: on multi-access (Ethernet) segments, one <b>Designated Router</b> and a Backup are elected (highest priority, then highest RID) to reduce LSA flooding. Others = DROTHER (2-Way with each other). Point-to-point links have no DR.</li>
          <li><b>Timers</b>: Hello 10 s, Dead 40 s on broadcast networks.</li>
          <li><b>Cost</b>: 100 Mbps / bandwidth. FastEthernet = 1, but GigE is also 1 → set <code>auto-cost reference-bandwidth 100000</code> on all routers.</li>
          <li><b>Passive interface</b>: advertise the network, but do not send Hellos (LAN ports to PCs).</li>
        </ul>` }
    ],
    cli: `Router(config)# router ospf 1
Router(config-router)# router-id 1.1.1.1
Router(config-router)# network 10.1.1.0 0.0.0.255 area 0
Router(config-router)# network 10.0.12.0 0.0.0.3 area 0
Router(config-router)# passive-interface g0/0
Router(config-router)# auto-cost reference-bandwidth 100000
Router(config-router)# default-information originate     ! share default route

! Or enable directly on the interface
Router(config)# interface g0/1
Router(config-if)# ip ospf 1 area 0
Router(config-if)# ip ospf cost 10
Router(config-if)# ip ospf priority 255         ! become DR
Router(config-if)# ip ospf network point-to-point

! Verify
Router# show ip ospf neighbor
Router# show ip ospf interface brief
Router# show ip ospf database
Router# show ip route ospf
Router# show ip protocols`,
    keypoints: [
      'OSPF = link-state, open standard, AD 110, metric = cost.',
      'Hellos (224.0.0.5) form neighbors; LSAs build an identical LSDB; SPF picks best paths.',
      'Neighbor requirements: same area, subnet, timers, auth, MTU; unique router IDs.',
      'Multi-access segments elect DR/BDR (highest priority, then RID).'
    ],
    quiz: [
      { q: 'OSPF uses which algorithm to calculate best paths?', a: ['Bellman-Ford', 'DUAL', 'Dijkstra SPF', 'Spanning Tree'], c: 2, why: 'Link-state protocols run Dijkstra’s Shortest Path First.' },
      { q: 'Wildcard mask for network 10.0.12.0/30 in an OSPF network statement?', a: ['255.255.255.252', '0.0.0.3', '0.0.0.252', '0.0.0.4'], c: 1, why: 'Wildcard = 255.255.255.255 − mask = 0.0.0.3.' },
      { q: 'Final OSPF neighbor state with a DR on Ethernet?', a: ['2-Way', 'Exchange', 'Full', 'Init'], c: 2, why: 'Full = LSDBs synchronized (DROTHERs stay 2-Way with each other).' },
      { q: 'Which router becomes DR?', a: ['Lowest RID', 'Highest priority, then highest RID', 'First to boot always', 'Lowest IP'], c: 1, why: 'Priority (0–255; 0 = never) first, then RID. Not preemptive.' },
      { q: 'OSPF default hello interval on Ethernet:', a: ['5 s', '10 s', '30 s', '40 s'], c: 1, why: 'Hello 10, Dead 40 on broadcast/point-to-point.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'dhcp',
    module: 'IP Services',
    title: 'DHCP — Automatic Addressing',
    minutes: 12,
    summary: 'The DORA process, leases, relay agents and DHCP snooping.',
    sections: [
      { h: 'What DHCP gives a host', html: `<p><b>DHCP</b> (Dynamic Host Configuration Protocol, UDP 67/68) automatically gives a device its <b>IP address, subnet mask, default gateway, DNS servers</b> and a <b>lease time</b>. Without it, every device would need manual setup.</p>` },
      { sim: {
        title: 'DORA: Discover, Offer, Request, Acknowledge',
        cfg: {
          w: 800, h: 340,
          nodes: [
            { id: 'pc', type: 'laptop', x: 100, y: 230, label: 'New laptop', sub: 'IP: 0.0.0.0' },
            { id: 'sw', type: 'switch', x: 330, y: 230, label: 'SW1' },
            { id: 'srv', type: 'server', x: 600, y: 90, label: 'DHCP Server', sub: '192.168.1.5' },
            { id: 'pc2', type: 'pc', x: 600, y: 280, label: 'PC-B', sub: '192.168.1.20' }
          ],
          links: [{ a: 'pc', b: 'sw' }, { a: 'sw', b: 'srv' }, { a: 'sw', b: 'pc2' }],
          tables: [{ id: 'b', title: 'DHCP server bindings', cols: ['IP', 'Client MAC', 'Lease'] }]
        },
        steps: [
          { text: 'A new laptop connects. It has <b>no IP</b> and does not know where the DHCP server is.', run: async t => { t.say('pc', 'I need an IP!', 1600); await t.flash('pc'); await t.wait(500); } },
          { text: '<b>D — Discover</b>: broadcast from 0.0.0.0 to 255.255.255.255 (UDP 68 → 67): “Any DHCP server out there?”', run: async t => { await t.send(['pc', 'sw'], { label: 'DISCOVER', color: 'orange' }); await t.many([{ path: ['sw', 'srv'] }, { path: ['sw', 'pc2'], drop: true }], { label: 'DISCOVER', color: 'orange' }); } },
          { text: '<b>O — Offer</b>: the server picks a free address from its pool and offers it: 192.168.1.100, mask /24, gateway .1, DNS, lease 1 day.', run: t => t.send(['srv', 'sw', 'pc'], { label: 'OFFER .100', color: 'purple' }) },
          { text: '<b>R — Request</b>: the client broadcasts “I accept 192.168.1.100 from server .5”. (Broadcast so other DHCP servers know their offers were declined.)', run: async t => { await t.send(['pc', 'sw'], { label: 'REQUEST .100', color: 'orange' }); await t.many([{ path: ['sw', 'srv'] }, { path: ['sw', 'pc2'], drop: true }], { label: 'REQUEST', color: 'orange' }); } },
          { text: '<b>A — Acknowledge</b>: the server confirms and records the lease. The laptop is now configured.', run: async t => { await t.send(['srv', 'sw', 'pc'], { label: 'ACK', color: 'green' }); t.setSub('pc', 'IP: 192.168.1.100/24'); t.badge('pc', 'gw .1  DNS 8.8.8.8', 'ok'); t.addRow('b', ['192.168.1.100', 'a1b2.c3d4.e5f6', '1 day']); } },
          { text: 'At <b>50%</b> of the lease (T1) the client unicasts a Request to renew. If the server is gone, at 87.5% (T2) it broadcasts to any server.', run: t => t.send(['pc', 'sw', 'srv'], { label: 'Renew (unicast)', color: 'blue' }) }
        ]
      } },
      { h: 'DHCP relay & security', html: `
        <p>DHCP Discover is a <b>broadcast</b>, and routers do not forward broadcasts. If the server is in another subnet, configure a <b>DHCP relay</b> on the router’s LAN interface: <code>ip helper-address &lt;server-ip&gt;</code>. The router converts the broadcast into a unicast to the server.</p>
        <p><b>DHCP snooping</b> (switch security) allows server messages (Offer/ACK) only on <b>trusted</b> ports, blocking rogue DHCP servers, and builds a binding table used by DAI and IP Source Guard.</p>` }
    ],
    cli: `! Router as DHCP server
Router(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.10
Router(config)# ip dhcp pool LAN
Router(dhcp-config)# network 192.168.1.0 255.255.255.0
Router(dhcp-config)# default-router 192.168.1.1
Router(dhcp-config)# dns-server 8.8.8.8 1.1.1.1
Router(dhcp-config)# domain-name lab.local
Router(dhcp-config)# lease 1

! DHCP relay on the client-side interface
Router(config)# interface g0/1
Router(config-if)# ip helper-address 10.99.99.5

! Router interface as DHCP client
Router(config-if)# ip address dhcp

! DHCP snooping
Switch(config)# ip dhcp snooping
Switch(config)# ip dhcp snooping vlan 10
Switch(config)# interface g0/24
Switch(config-if)# ip dhcp snooping trust

! Verify
Router# show ip dhcp binding
Router# show ip dhcp pool
Router# show ip dhcp conflict
C:\\> ipconfig /release
C:\\> ipconfig /renew`,
    keypoints: ['DORA: Discover (bc), Offer, Request (bc), Ack.', 'Server UDP 67, client UDP 68.', 'ip helper-address relays DHCP across routers.', 'DHCP snooping blocks rogue servers (trusted ports only).'],
    quiz: [
      { q: 'Correct DHCP message order:', a: ['Request, Offer, Discover, Ack', 'Discover, Offer, Request, Ack', 'Discover, Request, Offer, Ack', 'Offer, Discover, Ack, Request'], c: 1, why: 'D-O-R-A.' },
      { q: 'Clients in VLAN 10 must get IPs from a server in another subnet. Configure…', a: ['ip dhcp pool on the switch', 'ip helper-address on the VLAN 10 gateway interface', 'ip route to the server', 'DHCP snooping trust'], c: 1, why: 'The relay agent forwards the broadcast as unicast.' },
      { q: 'At what point does a client first try to renew its lease?', a: ['25%', '50%', '87.5%', '100%'], c: 1, why: 'T1 = 50% of lease time.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'dns',
    module: 'IP Services',
    title: 'DNS — Names to Addresses',
    minutes: 12,
    summary: 'How example.com becomes an IP: resolvers, root, TLD, authoritative servers and caching.',
    sections: [
      { h: 'The phone book of the Internet', html: `<p>Humans remember <b>names</b>, computers need <b>IPs</b>. <b>DNS</b> (UDP/TCP 53) translates names into addresses using a worldwide hierarchy: <b>root (.)</b> → <b>TLD</b> (.com, .org, .ph) → <b>authoritative</b> server for the domain.</p>` },
      { sim: {
        title: 'Resolving www.example.com',
        cfg: {
          w: 820, h: 380,
          nodes: [
            { id: 'pc', type: 'pc', x: 80, y: 280, label: 'Your PC', sub: 'stub resolver' },
            { id: 'res', type: 'server', x: 290, y: 280, label: 'DNS Resolver', sub: 'ISP / 8.8.8.8' },
            { id: 'root', type: 'server', x: 520, y: 70, label: 'Root server', sub: '"."' },
            { id: 'tld', type: 'server', x: 720, y: 170, label: '.com TLD server' },
            { id: 'auth', type: 'server', x: 560, y: 300, label: 'example.com NS', sub: 'authoritative' }
          ],
          links: [{ a: 'pc', b: 'res' }, { a: 'res', b: 'root', cls: 'wan' }, { a: 'res', b: 'tld', cls: 'wan' }, { a: 'res', b: 'auth', cls: 'wan' }],
          tables: [{ id: 'c', title: 'Resolver cache', cols: ['Name', 'Type', 'Value', 'TTL'] }]
        },
        steps: [
          { text: 'You type <b>www.example.com</b>. The PC checks its own cache and hosts file, then asks its configured DNS resolver (<b>recursive query</b>: “give me the final answer”).', run: t => t.send(['pc', 'res'], { label: 'www.example.com A?', color: 'blue' }) },
          { text: 'The resolver does not know. It asks a <b>root server</b> (iterative). Root says: “I do not know, but ask the <b>.com</b> TLD servers.”', run: async t => { await t.send(['res', 'root'], { label: 'A?', color: 'blue' }); await t.send(['root', 'res'], { label: 'ask .com', color: 'purple' }); } },
          { text: 'The <b>.com TLD</b> server answers: “Ask example.com’s <b>authoritative name server</b>.”', run: async t => { await t.send(['res', 'tld'], { label: 'A?', color: 'blue' }); await t.send(['tld', 'res'], { label: 'ask ns.example', color: 'purple' }); } },
          { text: 'The <b>authoritative</b> server owns the zone and returns the real answer: <b>A 93.184.216.34</b>.', run: async t => { await t.send(['res', 'auth'], { label: 'A?', color: 'blue' }); await t.send(['auth', 'res'], { label: 'A 93.184.216.34', color: 'green' }); } },
          { text: 'The resolver <b>caches</b> the answer (for its TTL) and returns it to your PC. Now the browser can connect.', run: async t => { t.addRow('c', ['www.example.com', 'A', '93.184.216.34', '3600']); await t.send(['res', 'pc'], { label: '93.184.216.34', color: 'green' }); } },
          { text: 'Next person asking for the same name gets an <b>instant answer from cache</b> — no trip to root/TLD. That is why DNS is fast.', run: async t => { await t.send(['pc', 'res'], { label: 'A?', color: 'blue' }); t.hiRow('c', 0); await t.send(['res', 'pc'], { label: 'cached ✓', color: 'green' }); } }
        ]
      } },
      { h: 'Record types', html: `
        <table class="data">
          <tr><th>Record</th><th>Meaning</th></tr>
          <tr><td>A</td><td>Name → IPv4</td></tr><tr><td>AAAA</td><td>Name → IPv6</td></tr>
          <tr><td>CNAME</td><td>Alias → another name</td></tr><tr><td>MX</td><td>Mail server for the domain</td></tr>
          <tr><td>NS</td><td>Authoritative name servers</td></tr><tr><td>PTR</td><td>IP → name (reverse lookup)</td></tr>
          <tr><td>TXT</td><td>Text (SPF, verification)</td></tr><tr><td>SOA</td><td>Start of authority (zone info)</td></tr>
        </table>` }
    ],
    cli: `! Let the router resolve names
Router(config)# ip domain-lookup
Router(config)# ip name-server 8.8.8.8
! Router as a simple DNS server
Router(config)# ip dns server
Router(config)# ip host server1 10.1.1.50
! Stop typos being treated as hostnames
Router(config)# no ip domain-lookup

! Client tools
C:\\> nslookup www.example.com
C:\\> ipconfig /displaydns
C:\\> ipconfig /flushdns
$ dig www.example.com A`,
    keypoints: ['DNS uses port 53 (UDP mostly, TCP for big replies/zone transfers).', 'Client → recursive resolver → root → TLD → authoritative.', 'Caching (TTL) makes repeat lookups fast.', 'A = IPv4, AAAA = IPv6, MX = mail, PTR = reverse.'],
    quiz: [
      { q: 'Which record maps a name to an IPv6 address?', a: ['A', 'AAAA', 'MX', 'PTR'], c: 1, why: 'AAAA (quad-A) = IPv6.' },
      { q: 'Which server holds the real records for example.com?', a: ['Root', 'TLD', 'Authoritative', 'Resolver cache'], c: 2, why: 'The authoritative name server for the zone.' },
      { q: 'Windows command to clear the local DNS cache:', a: ['ipconfig /release', 'ipconfig /flushdns', 'arp -d', 'nslookup -clear'], c: 1, why: 'ipconfig /flushdns.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'nat',
    module: 'IP Services',
    title: 'NAT & PAT',
    minutes: 15,
    summary: 'How many private hosts share one public IP — and why the Internet works with IPv4 today.',
    sections: [
      { h: 'Why NAT?', html: `
        <p>Private addresses (10/8, 172.16/12, 192.168/16) cannot be routed on the Internet. <b>NAT (Network Address Translation)</b> on the edge router rewrites the source IP to a public one.</p>
        <table class="data">
          <tr><th>Type</th><th>Mapping</th><th>Use</th></tr>
          <tr><td><b>Static NAT</b></td><td>1 private ↔ 1 public (permanent)</td><td>Servers reachable from Internet</td></tr>
          <tr><td><b>Dynamic NAT</b></td><td>Private → first free from a public pool</td><td>Rare today</td></tr>
          <tr><td><b>PAT</b> (NAT overload)</td><td>Many private → 1 public, distinguished by <b>port</b></td><td>Every home & office router</td></tr>
        </table>
        <p>Terms: <b>Inside local</b> = private IP of the host. <b>Inside global</b> = public IP representing it. <b>Outside global</b> = the real Internet server IP.</p>` },
      { sim: {
        title: 'PAT: two PCs share one public IP',
        cfg: {
          w: 860, h: 380,
          zones: [{ x: 20, y: 30, w: 400, h: 330, label: 'Inside (private)', color: 'blue' }, { x: 440, y: 30, w: 400, h: 330, label: 'Outside (Internet)', color: 'purple' }],
          nodes: [
            { id: 'p1', type: 'pc', x: 90, y: 110, label: 'PC1', sub: '192.168.1.10' },
            { id: 'p2', type: 'pc', x: 90, y: 280, label: 'PC2', sub: '192.168.1.11' },
            { id: 'sw', type: 'switch', x: 230, y: 195, label: 'SW' },
            { id: 'r', type: 'router', x: 400, y: 195, label: 'R1 (NAT)', sub: 'public 203.0.113.5' },
            { id: 'net', type: 'cloud', x: 590, y: 195, label: 'Internet' },
            { id: 'srv', type: 'server', x: 770, y: 195, label: 'Web', sub: '198.51.100.7' }
          ],
          links: [{ a: 'p1', b: 'sw' }, { a: 'p2', b: 'sw' }, { a: 'sw', b: 'r', pb: 'inside' }, { a: 'r', b: 'net', cls: 'wan', pa: 'outside' }, { a: 'net', b: 'srv', cls: 'wan' }],
          tables: [{ id: 'nat', title: 'R1 NAT translation table', cols: ['Inside local', 'Inside global', 'Outside'] }]
        },
        steps: [
          { text: 'PC1 opens a web page. Packet: <b>src 192.168.1.10:50001 → dst 198.51.100.7:443</b>.', run: t => t.send(['p1', 'sw', 'r'], { label: '192.168.1.10:50001', color: 'blue' }) },
          { text: 'R1 rewrites the source to its public IP and records the mapping: <b>203.0.113.5:50001</b>.', run: async t => { t.addRow('nat', ['192.168.1.10:50001', '203.0.113.5:50001', '198.51.100.7:443']); await t.send(['r', 'net', 'srv'], { label: '203.0.113.5:50001', color: 'purple' }); } },
          { text: 'PC2 also uses source port 50001! PAT notices the conflict and picks another port: <b>203.0.113.5:1024</b>.', run: async t => { await t.send(['p2', 'sw', 'r'], { label: '192.168.1.11:50001', color: 'green' }); t.addRow('nat', ['192.168.1.11:50001', '203.0.113.5:1024', '198.51.100.7:443']); await t.send(['r', 'net', 'srv'], { label: '203.0.113.5:1024', color: 'purple' }); } },
          { text: 'Server replies to <b>203.0.113.5:1024</b>. R1 looks it up → it belongs to PC2 → translates back to 192.168.1.11:50001.', run: async t => { await t.send(['srv', 'net', 'r'], { label: 'to 203.0.113.5:1024', color: 'orange' }); t.hiRow('nat', 1); await t.send(['r', 'sw', 'p2'], { label: 'to 192.168.1.11:50001', color: 'green' }); } },
          { text: 'An outside host sends an unsolicited packet. No table entry → <b>dropped</b>. (Side effect: hidden inside hosts. To publish a server, use static NAT / port forwarding.)', run: t => t.send(['srv', 'net', 'r'], { label: 'to 203.0.113.5:3389', color: 'red', drop: true }) }
        ]
      } }
    ],
    cli: `! Mark interfaces
Router(config)# interface g0/0
Router(config-if)# ip nat inside
Router(config)# interface g0/1
Router(config-if)# ip nat outside

! PAT (overload) on the outside interface
Router(config)# access-list 1 permit 192.168.1.0 0.0.0.255
Router(config)# ip nat inside source list 1 interface g0/1 overload

! Static NAT (publish a server)
Router(config)# ip nat inside source static 192.168.1.50 203.0.113.10
! Static port forwarding
Router(config)# ip nat inside source static tcp 192.168.1.50 80 203.0.113.5 80

! Dynamic NAT with a pool
Router(config)# ip nat pool PUB 203.0.113.20 203.0.113.30 netmask 255.255.255.0
Router(config)# ip nat inside source list 1 pool PUB

! Verify
Router# show ip nat translations
Router# show ip nat statistics
Router# clear ip nat translation *`,
    keypoints: ['NAT translates private ↔ public addresses at the edge.', 'PAT (overload) = many hosts, one IP, different ports.', 'Inside local = private host IP; inside global = its public IP.', 'Static NAT publishes inside servers.'],
    quiz: [
      { q: 'Keyword that enables PAT?', a: ['pat', 'overload', 'extendable', 'port'], c: 1, why: 'ip nat inside source list 1 interface g0/1 overload.' },
      { q: 'Private IP of an inside host is called…', a: ['Inside global', 'Inside local', 'Outside local', 'Outside global'], c: 1, why: 'Inside local = as seen from inside.' },
      { q: 'Which NAT type lets Internet users reach an internal web server?', a: ['PAT', 'Dynamic NAT', 'Static NAT', 'None'], c: 2, why: 'A permanent 1:1 (or port) mapping.' }
    ]
  });

  /* ===================================================== */
  const ACL = [['10', 'permit tcp host 10.1.1.10 host 172.16.1.100 eq 80'], ['20', 'deny tcp any host 172.16.1.200 eq 22'], ['30', 'permit ip any any'], ['—', '(implicit) deny ip any any']];
  L.push({
    id: 'acl',
    module: 'Security',
    title: 'Access Control Lists (ACLs)',
    minutes: 20,
    summary: 'Permit or deny traffic: standard vs extended ACLs, wildcard masks, top-down processing and implicit deny.',
    sections: [
      { h: 'How ACLs work', html: `
        <p>An <b>ACL</b> is an ordered list of <b>permit/deny</b> rules (ACEs) applied to a router interface <b>in</b> or <b>out</b>.</p>
        <ol class="steps"><li>Checked <b>top-down</b>.</li><li><b>First match wins</b> — the rest are ignored.</li><li>No match → <b>implicit deny any</b> at the end. An ACL with only deny lines blocks everything!</li></ol>
        <table class="data">
          <tr><th></th><th>Standard ACL</th><th>Extended ACL</th></tr>
          <tr><td>Numbers</td><td>1–99, 1300–1999</td><td>100–199, 2000–2699</td></tr>
          <tr><td>Matches</td><td><b>Source IP only</b></td><td>Protocol, source/dest IP, source/dest <b>port</b></td></tr>
          <tr><td>Place it</td><td><b>Close to the destination</b></td><td><b>Close to the source</b></td></tr>
        </table>
        <p><b>Wildcard mask</b> = inverse of subnet mask: 0 = must match, 1 = ignore. /24 → <code>0.0.0.255</code>, /30 → <code>0.0.0.3</code>. <code>host 10.1.1.10</code> = <code>10.1.1.10 0.0.0.0</code>; <code>any</code> = <code>0.0.0.0 255.255.255.255</code>.</p>` },
      { sim: {
        title: 'Extended ACL 110 inbound on R1 G0/0',
        cfg: {
          w: 820, h: 360,
          nodes: [
            { id: 'a', type: 'pc', x: 80, y: 90, label: 'PC-A', sub: '10.1.1.10' },
            { id: 'b', type: 'pc', x: 80, y: 280, label: 'PC-B', sub: '10.1.1.20' },
            { id: 'sw', type: 'switch', x: 220, y: 185, label: 'SW' },
            { id: 'r', type: 'router', x: 420, y: 185, label: 'R1', sub: 'ACL 110 in G0/0' },
            { id: 'web', type: 'server', x: 700, y: 90, label: 'Web', sub: '172.16.1.100' },
            { id: 'ssh', type: 'server', x: 700, y: 280, label: 'Mgmt server', sub: '172.16.1.200' }
          ],
          links: [{ a: 'a', b: 'sw' }, { a: 'b', b: 'sw' }, { a: 'sw', b: 'r', pb: 'G0/0 in' }, { a: 'r', b: 'web' }, { a: 'r', b: 'ssh' }],
          tables: [{ id: 'acl', title: 'access-list 110', cols: ['Seq', 'Rule'], rows: ACL }]
        },
        steps: [
          { text: 'PC-A → Web, TCP 80. Line 10 matches exactly → <b>permit</b>.', run: async t => { await t.send(['a', 'sw', 'r'], { label: 'A→Web :80', color: 'blue' }); t.hiRow('acl', 0); await t.send(['r', 'web'], { label: 'permitted', color: 'green' }); } },
          { text: 'PC-B → Web, TCP 80. Line 10 (only host .10) no. Line 20 (port 22 to .200) no. Line 30 <b>permit ip any any</b> → allowed.', run: async t => { await t.send(['b', 'sw', 'r'], { label: 'B→Web :80', color: 'blue' }); t.hiRow('acl', 2); await t.send(['r', 'web'], { label: 'permitted', color: 'green' }); } },
          { text: 'PC-B → Mgmt server, SSH (22). Line 20 matches → <b>deny</b>. Packet dropped; the router may send ICMP “administratively prohibited”.', run: async t => { t.hiRow('acl', 1); await t.send(['b', 'sw', 'r'], { label: 'B→.200 :22', color: 'red', drop: true }); } },
          { text: 'PC-A → Mgmt SSH. Line 10 is for port 80 only — no match. Line 20 matches → <b>deny</b>. Order matters!', run: async t => { t.hiRow('acl', 1); await t.send(['a', 'sw', 'r'], { label: 'A→.200 :22', color: 'red', drop: true }); } },
          { text: 'If someone deletes line 30, PC-B’s web traffic hits the <b>implicit deny</b> and is blocked. Always end with the permits you need.', run: async t => { t.setRows('acl', [ACL[0], ACL[1], ['30', '(deleted)'], ACL[3]], 3); await t.send(['b', 'sw', 'r'], { label: 'B→Web :80', color: 'red', drop: true }); } }
        ]
      } },
      { h: 'Other Layer-2 security features (CCNA)', html: `
        <ul>
          <li><b>Port security</b>: limit MACs per port (e.g. max 1); violation modes <i>protect</i>, <i>restrict</i>, <i>shutdown</i> (default → err-disabled).</li>
          <li><b>DHCP snooping</b>: block rogue DHCP servers.</li>
          <li><b>Dynamic ARP Inspection</b>: block ARP spoofing.</li>
          <li><b>802.1X</b>: port-based authentication with a RADIUS server.</li>
          <li><b>AAA</b>: Authentication, Authorization, Accounting (RADIUS / TACACS+).</li>
          <li>Shut unused ports and put them in an unused VLAN.</li>
        </ul>` }
    ],
    cli: `! Standard numbered ACL — block one subnet from reaching a LAN (place near destination)
Router(config)# access-list 10 deny 192.168.2.0 0.0.0.255
Router(config)# access-list 10 permit any
Router(config)# interface g0/1
Router(config-if)# ip access-group 10 out

! Extended named ACL (place near source)
Router(config)# ip access-list extended BLOCK-SSH
Router(config-ext-nacl)# 10 permit tcp host 10.1.1.10 host 172.16.1.100 eq 80
Router(config-ext-nacl)# 20 deny tcp any host 172.16.1.200 eq 22
Router(config-ext-nacl)# 30 permit ip any any
Router(config)# interface g0/0
Router(config-if)# ip access-group BLOCK-SSH in

! Restrict who can SSH to the router itself
Router(config)# access-list 5 permit 10.1.1.0 0.0.0.255
Router(config)# line vty 0 15
Router(config-line)# access-class 5 in

! Port security
Switch(config-if)# switchport mode access
Switch(config-if)# switchport port-security
Switch(config-if)# switchport port-security maximum 1
Switch(config-if)# switchport port-security mac-address sticky
Switch(config-if)# switchport port-security violation shutdown

! Verify
Router# show access-lists
Router# show ip interface g0/0
Switch# show port-security interface fa0/1`,
    keypoints: ['Top-down, first match wins, implicit deny at the end.', 'Standard = source only, near destination. Extended = near source.', 'Wildcard: 0 = match, 1 = ignore.', 'One ACL per interface, per direction, per protocol.'],
    quiz: [
      { q: 'What happens to a packet that matches no line in an ACL?', a: ['Permitted', 'Denied by implicit deny', 'Sent to CPU', 'Logged and permitted'], c: 1, why: 'Every ACL ends with an invisible deny any.' },
      { q: 'Wildcard mask for 192.168.10.0/26?', a: ['0.0.0.63', '0.0.0.64', '255.255.255.192', '0.0.0.31'], c: 0, why: '255 − 192 = 63.' },
      { q: 'Standard ACLs should be placed…', a: ['Close to the source', 'Close to the destination', 'On every interface', 'Only on switches'], c: 1, why: 'They only see source IP, so placing near the source could block too much.' },
      { q: 'Which number range is an extended IP ACL?', a: ['1–99', '100–199', '200–299', '700–799'], c: 1, why: '100–199 and 2000–2699.' }
    ]
  });
})();
