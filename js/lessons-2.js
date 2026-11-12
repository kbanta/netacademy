/* Module 2 — Switching (Layer 2) */
(function () {
  const L = (window.LESSONS = window.LESSONS || []);

  /* ===================================================== */
  L.push({
    id: 'switching',
    module: 'Switching',
    title: 'Ethernet & How Switches Work',
    minutes: 20,
    summary: 'MAC addresses, frames, and the learn / flood / forward / filter logic.',
    sections: [
      { h: 'MAC addresses and frames', html: `
        <p>Every network card (NIC) has a <b>MAC address</b>: 48 bits written in hex, e.g. <code>00:1A:2B:3C:4D:5E</code> (Cisco style: <code>001a.2b3c.4d5e</code>). First 24 bits = <b>OUI</b> (vendor), last 24 = device serial. <code>FFFF.FFFF.FFFF</code> = broadcast.</p>
        <div class="frame-diagram">
          <div class="fd f-pre">Preamble<br><small>8 B</small></div><div class="fd f-mac">Dest MAC<br><small>6 B</small></div><div class="fd f-mac">Source MAC<br><small>6 B</small></div><div class="fd f-type">Type<br><small>2 B</small></div><div class="fd f-data">Data (IP packet)<br><small>46–1500 B</small></div><div class="fd f-fcs">FCS<br><small>4 B</small></div>
        </div>
        <p>A <b>hub</b> (old, Layer 1) repeats bits out every port — everyone shares one <b>collision domain</b>. A <b>switch</b> (Layer 2) reads MAC addresses and sends frames only where needed. <b>Every switch port is its own collision domain</b>, and with full duplex, collisions disappear.</p>` },
      { sim: {
        title: 'MAC learning, flooding and forwarding',
        desc: 'The switch starts with an empty MAC address table. Watch it learn.',
        cfg: {
          w: 800, h: 380,
          nodes: [
            { id: 'sw', type: 'switch', x: 400, y: 190, label: 'SW1' },
            { id: 'A', type: 'pc', x: 140, y: 70, label: 'PC-A', sub: 'AAAA.AAAA.AAAA' },
            { id: 'B', type: 'pc', x: 660, y: 70, label: 'PC-B', sub: 'BBBB.BBBB.BBBB' },
            { id: 'C', type: 'pc', x: 140, y: 300, label: 'PC-C', sub: 'CCCC.CCCC.CCCC' },
            { id: 'D', type: 'pc', x: 660, y: 300, label: 'PC-D', sub: 'DDDD.DDDD.DDDD' }
          ],
          links: [{ a: 'A', b: 'sw', pb: 'Fa0/1' }, { a: 'B', b: 'sw', pb: 'Fa0/2' }, { a: 'C', b: 'sw', pb: 'Fa0/3' }, { a: 'D', b: 'sw', pb: 'Fa0/4' }],
          tables: [{ id: 'mac', title: 'SW1 MAC address table', cols: ['VLAN', 'MAC address', 'Port'] }]
        },
        steps: [
          { text: 'The switch just booted: its <b>MAC address table</b> (CAM table) is empty.', run: t => t.flash('sw') },
          { text: 'PC-A sends a frame to PC-C. The switch looks at the <b>source MAC</b> and <b>learns</b>: “AAAA is on Fa0/1”.', run: async t => { await t.send(['A', 'sw'], { label: 'A → C', color: 'blue' }); t.addRow('mac', ['1', 'aaaa.aaaa.aaaa', 'Fa0/1']); } },
          { text: 'The <b>destination MAC</b> (CCCC) is <b>unknown</b>, so the switch <b>floods</b> the frame out every port except the one it came in. PC-B and PC-D see it is not for them and discard it.', run: t => t.many([{ path: ['sw', 'B'], drop: true }, { path: ['sw', 'C'] }, { path: ['sw', 'D'], drop: true }], { label: 'A → C', color: 'blue' }) },
          { text: 'PC-C replies. The switch learns <b>CCCC is on Fa0/3</b>. The destination (AAAA) is already known → <b>forward</b> only out Fa0/1.', run: async t => { await t.send(['C', 'sw'], { label: 'C → A', color: 'green' }); t.addRow('mac', ['1', 'cccc.cccc.cccc', 'Fa0/3']); await t.send(['sw', 'A'], { label: 'C → A', color: 'green' }); } },
          { text: 'Next frame from A to C: both MACs are known → sent <b>only</b> to Fa0/3. B and D never see it. This is <b>known unicast forwarding</b>.', run: async t => { t.hiRow('mac', 1); await t.send(['A', 'sw', 'C'], { label: 'A → C', color: 'blue' }); } },
          { text: 'PC-B sends a <b>broadcast</b> (destination FFFF.FFFF.FFFF), e.g. an ARP request. The switch learns B, then <b>always floods broadcasts</b> to all other ports in the VLAN.', run: async t => { await t.send(['B', 'sw'], { label: 'Broadcast', color: 'orange' }); t.addRow('mac', ['1', 'bbbb.bbbb.bbbb', 'Fa0/2']); await t.many([['sw', 'A'], ['sw', 'C'], ['sw', 'D']], { label: 'Broadcast', color: 'orange' }); } },
          { text: 'Entries are removed after <b>300 seconds</b> of silence (aging time). If source and destination are on the <b>same port</b>, the switch <b>filters</b> (drops) the frame.', run: t => t.flash('sw', 'purple') }
        ]
      } },
      { h: 'Switch decisions summary', html: `
        <table class="data">
          <tr><th>Situation</th><th>Action</th></tr>
          <tr><td>Every frame received</td><td><b>Learn</b> source MAC → incoming port</td></tr>
          <tr><td>Destination MAC known</td><td><b>Forward</b> out that one port</td></tr>
          <tr><td>Destination unknown unicast</td><td><b>Flood</b> out all ports except incoming</td></tr>
          <tr><td>Broadcast / multicast</td><td><b>Flood</b> (within the VLAN)</td></tr>
          <tr><td>Destination on same port as source</td><td><b>Filter</b> (drop)</td></tr>
        </table>
        <p><b>Duplex & speed:</b> full duplex = send and receive at once. A <b>duplex mismatch</b> (one side half, other full) causes late collisions and slow traffic — check with <code>show interfaces</code>.</p>
        <p><b>Collision domain</b>: each switch port. <b>Broadcast domain</b>: the whole VLAN (only routers split broadcast domains).</p>` }
    ],
    cli: `! View the MAC address table
Switch# show mac address-table
Switch# show mac address-table dynamic
Switch# show mac address-table interface fa0/1
Switch# clear mac address-table dynamic

! Interface status, speed & duplex
Switch# show interfaces status
Switch# show interfaces fa0/1
Switch(config)# interface fa0/1
Switch(config-if)# speed 100
Switch(config-if)# duplex full
Switch(config-if)# description Link to PC-A`,
    keypoints: [
      'Switches learn SOURCE MACs and forward based on DESTINATION MACs.',
      'Unknown unicast and broadcast frames are flooded.',
      'Each switch port = one collision domain; each VLAN = one broadcast domain.',
      'MAC table entries age out after 300 s by default.'
    ],
    quiz: [
      { q: 'What does a switch do with a frame whose destination MAC is not in its table?', a: ['Drops it', 'Floods it out all ports except the incoming one', 'Sends it to the router', 'Sends it back'], c: 1, why: 'Unknown unicast flooding.' },
      { q: 'Which address does a switch use to BUILD its MAC table?', a: ['Destination MAC', 'Source MAC', 'Source IP', 'Destination IP'], c: 1, why: 'It learns from the source MAC of incoming frames.' },
      { q: 'How many bits in a MAC address?', a: ['32', '48', '64', '128'], c: 1, why: '48 bits = 12 hex digits.' },
      { q: 'A 24-port switch with one VLAN has how many broadcast domains?', a: ['1', '24', '12', '0'], c: 0, why: 'One VLAN = one broadcast domain (but 24 collision domains).' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'arp',
    module: 'Switching',
    title: 'ARP — Finding MAC Addresses',
    minutes: 12,
    summary: 'How a host turns an IP address into a MAC address before it can send.',
    sections: [
      { h: 'The problem ARP solves', html: `
        <p>To send a frame, a PC needs the <b>destination MAC</b>. But usually it only knows the <b>IP</b>. <b>ARP (Address Resolution Protocol)</b> asks: <i>“Who has 192.168.1.20? Tell 192.168.1.10.”</i></p>
        <ul><li><b>ARP Request</b> — broadcast (FFFF.FFFF.FFFF)</li><li><b>ARP Reply</b> — unicast, straight back</li><li>Results are cached in the <b>ARP table</b> (Windows: <code>arp -a</code>)</li></ul>` },
      { sim: {
        title: 'ARP inside the LAN — and to the gateway',
        cfg: {
          w: 800, h: 380,
          nodes: [
            { id: 'sw', type: 'switch', x: 400, y: 190, label: 'SW1' },
            { id: 'A', type: 'pc', x: 140, y: 80, label: 'PC-A', sub: '192.168.1.10' },
            { id: 'B', type: 'pc', x: 140, y: 300, label: 'PC-B', sub: '192.168.1.20' },
            { id: 'C', type: 'pc', x: 660, y: 300, label: 'PC-C', sub: '192.168.1.30' },
            { id: 'R', type: 'router', x: 660, y: 80, label: 'R1 (gateway)', sub: '192.168.1.1' }
          ],
          links: [{ a: 'A', b: 'sw' }, { a: 'B', b: 'sw' }, { a: 'C', b: 'sw' }, { a: 'R', b: 'sw' }],
          tables: [{ id: 'arp', title: 'PC-A ARP cache', cols: ['IP address', 'MAC address', 'Type'] }]
        },
        steps: [
          { text: 'PC-A wants to ping <b>192.168.1.20</b>. Same subnet → it needs B’s MAC. The ARP cache is empty.', run: async t => { t.say('A', 'ping 192.168.1.20', 1800); await t.flash('A'); await t.wait(600); } },
          { text: '<b>ARP Request</b> (broadcast): “Who has 192.168.1.20? Tell 192.168.1.10”. The switch floods it to everyone.', run: async t => { await t.send(['A', 'sw'], { label: 'ARP Who has .20?', color: 'orange' }); await t.many([{ path: ['sw', 'B'] }, { path: ['sw', 'C'], drop: true }, { path: ['sw', 'R'], drop: true }], { label: 'ARP req', color: 'orange' }); } },
          { text: 'Only PC-B owns .20. It saves A’s IP/MAC and sends an <b>ARP Reply</b> (unicast): “192.168.1.20 is at BBBB.BBBB.BBBB”.', run: async t => { t.say('B', 'That is me!', 1500); await t.send(['B', 'sw', 'A'], { label: 'ARP .20 is at BBBB', color: 'green' }); } },
          { text: 'PC-A stores the mapping in its <b>ARP cache</b> and can now send the ping frame to B’s MAC.', run: async t => { t.addRow('arp', ['192.168.1.20', 'bbbb.bbbb.bbbb', 'dynamic']); await t.send(['A', 'sw', 'B'], { label: 'ICMP Echo', color: 'blue' }); await t.send(['B', 'sw', 'A'], { label: 'Echo Reply', color: 'blue' }); } },
          { text: 'Now PC-A pings <b>8.8.8.8</b> — a <b>remote</b> network. A does NOT ARP for 8.8.8.8. It ARPs for its <b>default gateway 192.168.1.1</b>.', run: async t => { t.say('A', 'ping 8.8.8.8', 1500); await t.send(['A', 'sw'], { label: 'ARP Who has .1?', color: 'orange' }); await t.many([{ path: ['sw', 'B'], drop: true }, { path: ['sw', 'C'], drop: true }, { path: ['sw', 'R'] }], { label: 'ARP req', color: 'orange' }); } },
          { text: 'The router replies with its MAC. The frame to 8.8.8.8 carries <b>destination IP = 8.8.8.8</b> but <b>destination MAC = router</b>. MACs change at every hop; IPs stay the same.', run: async t => { await t.send(['R', 'sw', 'A'], { label: 'ARP .1 is at 1111', color: 'green' }); t.addRow('arp', ['192.168.1.1', '1111.1111.1111', 'dynamic']); await t.send(['A', 'sw', 'R'], { label: 'IP→8.8.8.8 MAC→R1', color: 'blue' }); } }
        ]
      } },
      { h: 'Good to know', html: `
        <ul>
          <li><b>Gratuitous ARP</b>: a host announces its own IP/MAC (after boot or failover) to update others.</li>
          <li><b>Proxy ARP</b>: a router answers ARP for a remote host.</li>
          <li><b>ARP spoofing</b>: an attacker sends fake replies to intercept traffic. Defense: <b>Dynamic ARP Inspection (DAI)</b> with DHCP snooping.</li>
        </ul>` }
    ],
    cli: `! Router / switch ARP table
Router# show ip arp
Router# show arp
Router# clear arp-cache

! Windows / Linux / macOS
C:\\> arp -a
C:\\> arp -d *
$ ip neigh show`,
    keypoints: [
      'ARP maps IP → MAC. Request is broadcast, reply is unicast.',
      'For remote destinations, hosts ARP for the default gateway.',
      'Destination MAC changes every hop; destination IP stays the same end-to-end.'
    ],
    quiz: [
      { q: 'An ARP Request is sent as a…', a: ['Unicast', 'Broadcast', 'Multicast', 'Anycast'], c: 1, why: 'The sender does not know the MAC yet, so it broadcasts to FFFF.FFFF.FFFF.' },
      { q: 'PC 10.1.1.5/24 sends to 172.16.1.1. Whose MAC does it ARP for?', a: ['172.16.1.1', 'Its default gateway', 'The DNS server', 'The switch'], c: 1, why: 'Remote destination → frame goes to the default gateway MAC.' },
      { q: 'Which security feature protects against ARP spoofing?', a: ['Port security', 'Dynamic ARP Inspection', 'BPDU Guard', 'PortFast'], c: 1, why: 'DAI checks ARP messages against the DHCP snooping binding table.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'vlan',
    module: 'Switching',
    title: 'VLANs & Trunking (802.1Q)',
    minutes: 25,
    summary: 'Split one switch into many virtual LANs; carry them between switches with tagged trunks.',
    sections: [
      { h: 'What is a VLAN?', html: `
        <p>A <b>VLAN (Virtual LAN)</b> is a logical group of switch ports that forms its <b>own broadcast domain</b> — as if each VLAN were a separate physical switch. Usually <b>one VLAN = one IP subnet</b>.</p>
        <div class="cols2">
          <div class="card-mini"><h4>Why use VLANs?</h4><ul><li><b>Security</b> — HR cannot see Guest traffic</li><li><b>Smaller broadcast domains</b> — better performance</li><li><b>Flexibility</b> — group users by function, not location</li><li>Separate <b>voice</b> traffic for QoS</li></ul></div>
          <div class="card-mini"><h4>Port types</h4><ul><li><b>Access port</b> — belongs to ONE VLAN, connects end devices, frames are untagged</li><li><b>Trunk port</b> — carries MANY VLANs between switches/routers, frames are <b>tagged</b> with 802.1Q</li></ul></div>
        </div>` },
      { sim: {
        title: 'VLANs isolate broadcasts',
        desc: 'One switch, two VLANs. Blue = VLAN 10 (Sales), orange = VLAN 20 (HR).',
        cfg: {
          w: 800, h: 360,
          zones: [{ x: 30, y: 210, w: 140, h: 130, label: 'VLAN 10', color: 'blue' }, { x: 430, y: 210, w: 140, h: 130, label: 'VLAN 10', color: 'blue' }, { x: 230, y: 210, w: 140, h: 130, label: 'VLAN 20', color: 'orange' }, { x: 630, y: 210, w: 140, h: 130, label: 'VLAN 20', color: 'orange' }],
          nodes: [
            { id: 'sw', type: 'switch', x: 400, y: 80, label: 'SW1' },
            { id: 'P1', type: 'pc', x: 100, y: 270, label: 'PC1', sub: '10.10.10.11', color: 'blue' },
            { id: 'P2', type: 'pc', x: 300, y: 270, label: 'PC2', sub: '10.20.20.12', color: 'orange' },
            { id: 'P3', type: 'pc', x: 500, y: 270, label: 'PC3', sub: '10.10.10.13', color: 'blue' },
            { id: 'P4', type: 'pc', x: 700, y: 270, label: 'PC4', sub: '10.20.20.14', color: 'orange' }
          ],
          links: [
            { a: 'sw', b: 'P1', cls: 'v-blue', pa: 'Fa0/1' }, { a: 'sw', b: 'P2', cls: 'v-orange', pa: 'Fa0/2' },
            { a: 'sw', b: 'P3', cls: 'v-blue', pa: 'Fa0/3' }, { a: 'sw', b: 'P4', cls: 'v-orange', pa: 'Fa0/4' }
          ]
        },
        steps: [
          { text: 'Ports Fa0/1 and Fa0/3 are access ports in <b>VLAN 10</b>. Fa0/2 and Fa0/4 are in <b>VLAN 20</b>. Same physical switch — two separate logical networks.', run: t => t.flash('sw') },
          { text: 'PC1 sends a <b>broadcast</b>. The switch floods it <b>only to ports in VLAN 10</b>. PC2 and PC4 never receive it.', run: async t => { await t.send(['P1', 'sw'], { label: 'Broadcast', color: 'blue' }); await t.send(['sw', 'P3'], { label: 'Broadcast', color: 'blue' }); t.say('P2', 'Nothing received', 1400); t.say('P4', 'Nothing received', 1400); await t.wait(500); } },
          { text: 'PC2 broadcasts in <b>VLAN 20</b> → only PC4 receives it. Two broadcast domains on one box.', run: async t => { await t.send(['P2', 'sw'], { label: 'Broadcast', color: 'orange' }); await t.send(['sw', 'P4'], { label: 'Broadcast', color: 'orange' }); } },
          { text: 'PC1 tries to talk to PC2 (different VLAN, different subnet). A Layer-2 switch <b>cannot</b> forward between VLANs → the traffic needs a <b>router or Layer-3 switch</b> (Inter-VLAN routing, next lesson).', run: async t => { await t.send(['P1', 'sw'], { label: 'to PC2', color: 'blue', drop: true }); t.say('sw', 'No route between VLANs!', 1800, 'bad'); await t.wait(600); } }
        ]
      } },
      { h: 'The 802.1Q tag', html: `
        <p>On a trunk, the switch inserts a <b>4-byte 802.1Q tag</b> into the Ethernet frame (between Source MAC and Type) so the other switch knows which VLAN the frame belongs to.</p>
        <div class="frame-diagram">
          <div class="fd f-mac">Dest MAC</div><div class="fd f-mac">Src MAC</div><div class="fd f-tag">802.1Q Tag<br><small>TPID 0x8100 · PRI 3b · DEI 1b · <b>VLAN ID 12b</b></small></div><div class="fd f-type">Type</div><div class="fd f-data">Data</div><div class="fd f-fcs">FCS</div>
        </div>
        <p>12-bit VLAN ID → <b>4094 usable VLANs</b> (1–4094). VLAN 1 = default. 1002–1005 reserved. 1006–4094 = extended range.</p>` },
      { sim: {
        title: 'Trunking between two switches',
        desc: 'Frames are tagged only while they cross the trunk link.',
        cfg: {
          w: 800, h: 360,
          nodes: [
            { id: 'S1', type: 'switch', x: 250, y: 100, label: 'SW1' },
            { id: 'S2', type: 'switch', x: 550, y: 100, label: 'SW2' },
            { id: 'P1', type: 'pc', x: 140, y: 280, label: 'PC1 · VLAN 10', sub: '10.10.10.11', color: 'blue' },
            { id: 'P2', type: 'pc', x: 330, y: 280, label: 'PC2 · VLAN 20', sub: '10.20.20.12', color: 'orange' },
            { id: 'P3', type: 'pc', x: 470, y: 280, label: 'PC3 · VLAN 10', sub: '10.10.10.13', color: 'blue' },
            { id: 'P4', type: 'pc', x: 660, y: 280, label: 'PC4 · VLAN 20', sub: '10.20.20.14', color: 'orange' }
          ],
          links: [
            { a: 'S1', b: 'S2', cls: 'trunk', label: '802.1Q trunk (VLAN 10, 20)', pa: 'G0/1', pb: 'G0/1' },
            { a: 'S1', b: 'P1', cls: 'v-blue' }, { a: 'S1', b: 'P2', cls: 'v-orange' },
            { a: 'S2', b: 'P3', cls: 'v-blue' }, { a: 'S2', b: 'P4', cls: 'v-orange' }
          ]
        },
        steps: [
          { text: 'Without trunks you would need <b>one cable per VLAN</b> between switches. A <b>trunk</b> carries all VLANs on one link.', run: t => t.flash('S1') },
          { text: 'PC1 → PC3 (both VLAN 10). The frame leaves PC1 <b>untagged</b>. SW1 knows Fa0/1 is VLAN 10, so on the trunk it <b>adds tag VLAN 10</b>. SW2 reads the tag, <b>removes it</b>, and delivers only to VLAN 10 ports.', run: t => t.send(['P1', 'S1', 'S2', 'P3'], { label: 'Frame', color: 'blue', seg: [{}, { tag: 'VLAN 10' }, {}] }) },
          { text: 'PC2 → PC4 (VLAN 20) crosses the <b>same cable</b> with tag <b>VLAN 20</b>.', run: t => t.send(['P2', 'S1', 'S2', 'P4'], { label: 'Frame', color: 'orange', seg: [{}, { tag: 'VLAN 20' }, {}] }) },
          { text: 'Both at the same time — the tags keep them separate.', run: t => t.many([{ path: ['P1', 'S1', 'S2', 'P3'], color: 'blue', seg: [{}, { tag: 'VLAN 10' }, {}] }, { path: ['P4', 'S2', 'S1', 'P2'], color: 'orange', seg: [{}, { tag: 'VLAN 20' }, {}] }], { label: 'Frame' }) },
          { text: '<b>Native VLAN</b> (default VLAN 1): frames in the native VLAN cross the trunk <b>untagged</b>. Both ends must use the <b>same native VLAN</b>, or traffic leaks between VLANs (CDP reports a “native VLAN mismatch”). Best practice: change it to an unused VLAN.', run: t => t.send(['S1', 'S2'], { label: 'Native: no tag', color: 'gray' }) }
        ]
      } },
      { h: 'DTP and VTP (exam notes)', html: `
        <ul>
          <li><b>DTP</b> (Dynamic Trunking Protocol, Cisco) negotiates trunks automatically: modes <code>dynamic auto</code>, <code>dynamic desirable</code>, <code>trunk</code>, <code>access</code>. auto + auto = <b>access</b>! Best practice: set trunk/access manually and use <code>switchport nonegotiate</code>.</li>
          <li><b>VTP</b> (VLAN Trunking Protocol) shares VLAN definitions between switches: server, client, transparent modes. Many networks use <b>transparent</b> mode to avoid accidental VLAN deletion.</li>
          <li><b>Voice VLAN</b>: an access port can carry a data VLAN plus a tagged voice VLAN for an IP phone.</li>
        </ul>` }
    ],
    cli: `! Create VLANs
Switch(config)# vlan 10
Switch(config-vlan)# name SALES
Switch(config-vlan)# vlan 20
Switch(config-vlan)# name HR

! Access ports
Switch(config)# interface range fa0/1 , fa0/3
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 10
Switch(config)# interface fa0/5
Switch(config-if)# switchport access vlan 10
Switch(config-if)# switchport voice vlan 99

! Trunk port
Switch(config)# interface g0/1
Switch(config-if)# switchport trunk encapsulation dot1q   ! only needed on some older switches
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk native vlan 999
Switch(config-if)# switchport trunk allowed vlan 10,20
Switch(config-if)# switchport nonegotiate

! Verify
Switch# show vlan brief
Switch# show interfaces trunk
Switch# show interfaces fa0/1 switchport`,
    keypoints: [
      'VLAN = separate broadcast domain = (normally) separate IP subnet.',
      'Access port = one VLAN, untagged. Trunk = many VLANs, 802.1Q tagged.',
      '802.1Q tag = 4 bytes, 12-bit VLAN ID (1–4094).',
      'Native VLAN is untagged on trunks and must match on both ends.',
      'Hosts in different VLANs need a router / L3 switch to communicate.'
    ],
    quiz: [
      { q: 'How many bits does the 802.1Q VLAN ID field use?', a: ['8', '10', '12', '16'], c: 2, why: '12 bits → 4096 values (0 and 4095 reserved).' },
      { q: 'Traffic in the native VLAN on a trunk is…', a: ['Tagged with VLAN 1', 'Untagged', 'Dropped', 'Encrypted'], c: 1, why: 'Native VLAN frames are sent without a tag.' },
      { q: 'Two switch ports both in "dynamic auto" will form a…', a: ['Trunk', 'Access link', 'EtherChannel', 'Error-disabled port'], c: 1, why: 'Neither side initiates, so the link stays access.' },
      { q: 'Command to see which VLANs are allowed and active on a trunk?', a: ['show vlan brief', 'show interfaces trunk', 'show ip route', 'show mac address-table'], c: 1, why: 'show interfaces trunk lists mode, native VLAN and allowed/active VLANs.' },
      { q: 'A broadcast from a host in VLAN 10 is received by…', a: ['All hosts on the switch', 'Only hosts in VLAN 10', 'Only the router', 'No one'], c: 1, why: 'A VLAN is a broadcast domain.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'intervlan',
    module: 'Switching',
    title: 'Inter-VLAN Routing',
    minutes: 15,
    summary: 'Router-on-a-stick with sub-interfaces, and Layer-3 switch SVIs.',
    sections: [
      { h: 'Three ways', html: `
        <ol>
          <li><b>Legacy</b>: one router interface per VLAN (wastes ports — not scalable).</li>
          <li><b>Router-on-a-stick (ROAS)</b>: ONE trunk link to the router, split into <b>sub-interfaces</b> (G0/0.10, G0/0.20), each with an 802.1Q VLAN and the VLAN’s gateway IP.</li>
          <li><b>Layer-3 switch with SVIs</b>: <code>interface vlan 10</code> on the switch acts as the gateway. Fastest, most common in enterprise.</li>
        </ol>` },
      { sim: {
        title: 'Router-on-a-stick',
        desc: 'PC1 in VLAN 10 talks to PC2 in VLAN 20 through one trunk link.',
        cfg: {
          w: 800, h: 380,
          nodes: [
            { id: 'R', type: 'router', x: 400, y: 60, label: 'R1', sub: 'G0/0.10 = 10.10.10.1 · G0/0.20 = 10.20.20.1' },
            { id: 'SW', type: 'switch', x: 400, y: 200, label: 'SW1' },
            { id: 'P1', type: 'pc', x: 170, y: 310, label: 'PC1 (VLAN 10)', sub: '10.10.10.10 gw .1', color: 'blue' },
            { id: 'P2', type: 'pc', x: 630, y: 310, label: 'PC2 (VLAN 20)', sub: '10.20.20.10 gw .1', color: 'orange' }
          ],
          links: [{ a: 'R', b: 'SW', cls: 'trunk', label: 'Trunk', lx: 34, pa: 'G0/0', pb: 'G0/1' }, { a: 'SW', b: 'P1', cls: 'v-blue' }, { a: 'SW', b: 'P2', cls: 'v-orange' }],
          tables: [{ id: 'rt', title: 'R1 routing table', cols: ['', 'Network', 'Interface'], rows: [['C', '10.10.10.0/24', 'G0/0.10'], ['C', '10.20.20.0/24', 'G0/0.20']] }]
        },
        steps: [
          { text: 'PC1 (10.10.10.10) wants PC2 (10.20.20.10). Different subnet → send to <b>default gateway 10.10.10.1</b>, which lives on sub-interface G0/0.10.', run: async t => { t.say('P1', 'Remote subnet → gateway', 1800); await t.flash('P1'); await t.wait(400); } },
          { text: 'The frame goes untagged to the switch, then up the trunk <b>tagged VLAN 10</b>. The router receives it on <b>G0/0.10</b>.', run: t => t.send(['P1', 'SW', 'R'], { label: 'to 10.20.20.10', color: 'blue', seg: [{}, { tag: 'VLAN 10' }] }) },
          { text: 'The router checks its routing table: 10.20.20.0/24 is <b>directly connected</b> on <b>G0/0.20</b>.', run: async t => { t.hiRow('rt', 1); await t.flash('R', 'green'); await t.wait(500); } },
          { text: 'The router sends the packet back down the <b>same trunk</b>, now <b>tagged VLAN 20</b>. The switch removes the tag and delivers to PC2.', run: t => t.send(['R', 'SW', 'P2'], { label: 'to 10.20.20.10', color: 'orange', seg: [{ tag: 'VLAN 20' }, {}] }) },
          { text: 'The reply follows the reverse path. Downside of ROAS: all inter-VLAN traffic shares one link and the router can be a bottleneck → large networks use <b>Layer-3 switches</b>.', run: async t => { t.hiRow('rt', 0); await t.send(['P2', 'SW', 'R', 'SW', 'P1'], { label: 'Reply', color: 'green', seg: [{}, { tag: 'VLAN 20' }, { tag: 'VLAN 10' }, {}] }); } }
        ]
      } }
    ],
    cli: `! ===== Router-on-a-stick =====
Router(config)# interface g0/0
Router(config-if)# no shutdown
Router(config)# interface g0/0.10
Router(config-subif)# encapsulation dot1q 10
Router(config-subif)# ip address 10.10.10.1 255.255.255.0
Router(config)# interface g0/0.20
Router(config-subif)# encapsulation dot1q 20
Router(config-subif)# ip address 10.20.20.1 255.255.255.0
! Switch port to router must be a trunk
Switch(config)# interface g0/1
Switch(config-if)# switchport mode trunk

! ===== Layer-3 switch (SVI) =====
L3SW(config)# ip routing
L3SW(config)# interface vlan 10
L3SW(config-if)# ip address 10.10.10.1 255.255.255.0
L3SW(config-if)# no shutdown
L3SW(config)# interface vlan 20
L3SW(config-if)# ip address 10.20.20.1 255.255.255.0
L3SW(config-if)# no shutdown
! Routed port (uplink, no VLAN)
L3SW(config)# interface g1/0/24
L3SW(config-if)# no switchport
L3SW(config-if)# ip address 10.0.0.1 255.255.255.252

! Verify
Router# show ip interface brief
Router# show ip route`,
    keypoints: [
      'Inter-VLAN routing needs a Layer-3 device.',
      'ROAS: one trunk, sub-interfaces with "encapsulation dot1q <vlan>".',
      'L3 switch: "ip routing" + SVIs (interface vlan X).',
      'Each host uses its VLAN gateway IP as default gateway.'
    ],
    quiz: [
      { q: 'Which command on a sub-interface assigns it to VLAN 30?', a: ['switchport access vlan 30', 'encapsulation dot1q 30', 'vlan 30', 'ip vlan 30'], c: 1, why: 'Sub-interfaces use encapsulation dot1q <vlan-id>.' },
      { q: 'The switch port connected to a router-on-a-stick must be…', a: ['Access', 'Trunk', 'Shutdown', 'Routed'], c: 1, why: 'It carries several VLANs → trunk.' },
      { q: 'On a Layer-3 switch, what must be enabled for SVIs to route?', a: ['ip routing', 'spanning-tree', 'vtp mode server', 'ip cef off'], c: 0, why: 'ip routing turns on Layer-3 forwarding.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'stp',
    module: 'Switching',
    title: 'Spanning Tree Protocol (STP)',
    minutes: 25,
    summary: 'Why loops kill Layer-2 networks, and how STP elects a root and blocks ports.',
    sections: [
      { h: 'The problem: Layer-2 loops', html: `
        <p>We add redundant links between switches so one cable failure does not cut the network. But Ethernet frames have <b>no TTL</b>: a broadcast that enters a loop circles <b>forever</b> and multiplies — a <b>broadcast storm</b>. MAC tables also flap and hosts receive duplicate frames.</p>` },
      { sim: {
        title: 'Broadcast storm (no STP)',
        cfg: {
          w: 800, h: 380,
          nodes: [
            { id: 'S1', type: 'switch', x: 400, y: 70, label: 'SW1' },
            { id: 'S2', type: 'switch', x: 200, y: 260, label: 'SW2' },
            { id: 'S3', type: 'switch', x: 600, y: 260, label: 'SW3' },
            { id: 'PC', type: 'pc', x: 70, y: 330, label: 'PC-A' }
          ],
          links: [{ a: 'S1', b: 'S2' }, { a: 'S1', b: 'S3' }, { a: 'S2', b: 'S3' }, { a: 'PC', b: 'S2' }]
        },
        steps: [
          { text: 'Three switches connected in a triangle — redundant, but a <b>loop</b>. STP is disabled.', run: t => t.flash('S1') },
          { text: 'PC-A sends one broadcast (e.g. ARP). SW2 floods it to SW1 and SW3.', run: async t => { await t.send(['PC', 'S2'], { label: 'BC', color: 'orange' }); await t.many([['S2', 'S1'], ['S2', 'S3']], { label: 'BC', color: 'orange' }); } },
          { text: 'SW1 floods its copy to SW3, and SW3 floods its copy to SW1. Both come back to SW2… which floods them again.', run: async t => { await t.many([['S1', 'S3'], ['S3', 'S1']], { label: 'BC', color: 'red' }); await t.many([['S3', 'S2'], ['S1', 'S2']], { label: 'BC', color: 'red' }); } },
          { text: 'The copies loop forever in both directions, using all bandwidth and CPU. The network <b>melts down</b> within seconds.', run: async t => {
            for (let i = 0; i < 2; i++) {
              await t.many([['S2', 'S1', 'S3', 'S2'], ['S2', 'S3', 'S1', 'S2'], ['S1', 'S2', 'S3', 'S1']], { label: 'BC', color: 'red', ms: 420 });
            }
            ['S1', 'S2', 'S3'].forEach(s => t.badge(s, 'CPU 100%', 'bad'));
          } }
        ]
      } },
      { h: 'How STP fixes it', html: `
        <p><b>STP (IEEE 802.1D)</b> logically <b>blocks</b> redundant ports, turning the mesh into a loop-free <b>tree</b>. If a link fails, a blocked port opens. Switches exchange <b>BPDUs</b> (Bridge Protocol Data Units) every 2 s.</p>
        <ol class="steps">
          <li><b>Elect the Root Bridge</b>: lowest <b>Bridge ID</b> = priority (default 32768 + VLAN ID) + MAC. Lowest priority wins; tie → lowest MAC.</li>
          <li><b>Each non-root switch picks one Root Port (RP)</b>: lowest total <b>path cost</b> to the root. (Cost: 10 Mbps = 100, 100 Mbps = 19, 1 Gbps = 4, 10 Gbps = 2.)</li>
          <li><b>Each segment gets one Designated Port (DP)</b>: the side with the lowest cost to root. All root bridge ports are DPs.</li>
          <li><b>Every other port is Blocked</b> (non-designated / alternate).</li>
        </ol>` },
      { sim: {
        title: 'STP election step by step',
        desc: 'All links are 1 Gbps (cost 4). All priorities are 32769 (32768 + VLAN 1).',
        cfg: {
          w: 800, h: 380,
          nodes: [
            { id: 'S1', type: 'switch', x: 400, y: 80, label: 'SW1', sub: 'MAC 0000.0000.00A1' },
            { id: 'S2', type: 'switch', x: 200, y: 270, label: 'SW2', sub: 'MAC 0000.0000.00B2' },
            { id: 'S3', type: 'switch', x: 600, y: 270, label: 'SW3', sub: 'MAC 0000.0000.00C3' },
            { id: 'PC', type: 'pc', x: 70, y: 340, label: 'PC-A' }
          ],
          links: [{ a: 'S1', b: 'S2', label: 'cost 4', lx: -30 }, { a: 'S1', b: 'S3', label: 'cost 4', lx: 30 }, { a: 'S2', b: 'S3', label: 'cost 4' }, { a: 'PC', b: 'S2' }]
        },
        steps: [
          { text: 'At startup every switch thinks <b>it</b> is the root and sends <b>BPDUs</b> with its Bridge ID.', run: t => t.many([['S1', 'S2'], ['S2', 'S1'], ['S1', 'S3'], ['S3', 'S1'], ['S2', 'S3'], ['S3', 'S2']], { label: 'BPDU', color: 'purple' }) },
          { text: '<b>Root election:</b> equal priority, so the <b>lowest MAC</b> wins → <b>SW1 is the Root Bridge</b>. All ports on the root are <b>Designated</b>.', run: async t => { t.badge('S1', 'ROOT BRIDGE', 'root'); t.port('S1', 'S2', 'S1', 'DP', 'dp'); t.port('S1', 'S3', 'S1', 'DP', 'dp'); await t.flash('S1', 'green'); } },
          { text: '<b>Root ports:</b> SW2 and SW3 each pick their port with the lowest cost to root. Direct link = cost 4 (via the other switch = 8). → <b>RP</b>.', run: async t => { t.port('S1', 'S2', 'S2', 'RP', 'rp'); t.port('S1', 'S3', 'S3', 'RP', 'rp'); await t.wait(500); } },
          { text: '<b>SW2–SW3 segment:</b> both have cost 4 to root — tie! Lower <b>Bridge ID</b> wins: SW2 (…B2) &lt; SW3 (…C3). SW2’s port = <b>DP</b>, SW3’s port = <b>Blocked</b>.', run: async t => { t.port('S2', 'S3', 'S2', 'DP', 'dp'); t.port('S2', 'S3', 'S3', 'BLK', 'blk'); t.setLink('S2', 'S3', 'blocked'); await t.wait(400); } },
          { text: 'Now a broadcast from PC-A goes up to the root and down to SW3. The copy sent to SW3’s blocked port is <b>discarded</b>. No loop!', run: async t => { await t.send(['PC', 'S2'], { label: 'BC', color: 'orange' }); await t.many([{ path: ['S2', 'S1', 'S3'] }, { path: ['S2', 'S3'], drop: true }], { label: 'BC', color: 'orange' }); } },
          { text: '<b>Link failure:</b> SW1–SW3 goes down. SW3 stops receiving BPDUs on its RP, so the blocked port becomes its new <b>Root Port</b> and starts forwarding. (Classic STP: up to 50 s; RSTP: ~1–2 s.)', run: async t => { t.setLink('S1', 'S3', 'down'); t.port('S1', 'S3', 'S3', ''); t.port('S1', 'S3', 'S1', ''); t.say('S3', 'Lost root path!', 1500, 'bad'); await t.wait(1200); t.setLink('S2', 'S3', ''); t.port('S2', 'S3', 'S3', 'RP', 'rp'); await t.send(['S1', 'S2', 'S3'], { label: 'BPDU', color: 'purple' }); } }
        ]
      } },
      { h: 'Port states & STP versions', html: `
        <table class="data">
          <tr><th>802.1D state</th><th>Forwards data?</th><th>Learns MACs?</th><th>Timer</th></tr>
          <tr><td>Blocking</td><td>No</td><td>No</td><td>Max age 20 s</td></tr>
          <tr><td>Listening</td><td>No</td><td>No</td><td>Forward delay 15 s</td></tr>
          <tr><td>Learning</td><td>No</td><td>Yes</td><td>Forward delay 15 s</td></tr>
          <tr><td>Forwarding</td><td>Yes</td><td>Yes</td><td>—</td></tr>
          <tr><td>Disabled</td><td>No</td><td>No</td><td>admin down</td></tr>
        </table>
        <ul>
          <li><b>PVST+</b> (Cisco default): one STP instance per VLAN → you can load-balance VLANs over different links.</li>
          <li><b>RSTP (802.1w)</b> / <b>Rapid PVST+</b>: fast convergence; states <i>discarding, learning, forwarding</i>; roles root, designated, <b>alternate</b>, <b>backup</b>.</li>
          <li><b>MSTP (802.1s)</b>: maps many VLANs to a few instances.</li>
          <li><b>PortFast</b>: access ports to end devices skip listening/learning — go straight to forwarding.</li>
          <li><b>BPDU Guard</b>: err-disables a PortFast port if a BPDU arrives (someone plugged in a switch).</li>
          <li><b>Root Guard</b>: stops a port from accepting a better root.</li>
        </ul>` }
    ],
    cli: `! Choose the STP mode
Switch(config)# spanning-tree mode rapid-pvst

! Make this switch the root for VLAN 10 (priority must be a multiple of 4096)
Switch(config)# spanning-tree vlan 10 root primary
Switch(config)# spanning-tree vlan 10 priority 4096
Switch(config)# spanning-tree vlan 20 root secondary

! Edge ports to PCs
Switch(config)# interface fa0/1
Switch(config-if)# spanning-tree portfast
Switch(config-if)# spanning-tree bpduguard enable
! or globally for all access ports:
Switch(config)# spanning-tree portfast default
Switch(config)# spanning-tree portfast bpduguard default

! Change port cost
Switch(config-if)# spanning-tree vlan 10 cost 10

! Verify
Switch# show spanning-tree
Switch# show spanning-tree vlan 10
Switch# show spanning-tree summary`,
    keypoints: [
      'STP prevents Layer-2 loops by blocking redundant ports.',
      'Root bridge = lowest Bridge ID (priority, then MAC).',
      'Non-root switches: one Root Port (lowest cost to root). Each segment: one Designated Port.',
      'Use Rapid PVST+, PortFast + BPDU Guard on access ports.'
    ],
    quiz: [
      { q: 'Which switch becomes the root bridge?', a: ['Highest MAC', 'Lowest Bridge ID', 'Most ports', 'Fastest links'], c: 1, why: 'Lowest priority + MAC = lowest Bridge ID wins.' },
      { q: 'Default STP cost of a 1 Gbps link (short method)?', a: ['19', '4', '100', '2'], c: 1, why: '10M=100, 100M=19, 1G=4, 10G=2.' },
      { q: 'Valid STP priority value?', a: ['1000', '4096', '5000', '32767'], c: 1, why: 'Priority is set in multiples of 4096.' },
      { q: 'What does BPDU Guard do when a BPDU arrives on a PortFast port?', a: ['Ignores it', 'Makes the port root', 'Err-disables the port', 'Blocks the VLAN'], c: 2, why: 'It shuts the port (err-disabled) to protect the topology.' },
      { q: 'In RSTP, a port that is a backup path to the root is called…', a: ['Designated', 'Alternate', 'Disabled', 'Listening'], c: 1, why: 'Alternate port = backup root port; Backup port = backup designated on the same segment.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'etherchannel',
    module: 'Switching',
    title: 'EtherChannel (Link Aggregation)',
    minutes: 10,
    summary: 'Bundle several physical links into one logical link — more bandwidth, no STP blocking.',
    sections: [
      { h: 'Idea', html: `<p>Two links between switches? STP blocks one. <b>EtherChannel</b> bundles 2–8 identical links into one logical <b>Port-channel</b>, so STP sees one link and <b>all members forward</b>. Traffic is spread by a hash (src/dst MAC or IP).</p>
        <table class="data"><tr><th>Protocol</th><th>Modes</th><th>Forms a channel when…</th></tr>
        <tr><td><b>LACP</b> (IEEE 802.3ad, open)</td><td>active / passive</td><td>active+active, active+passive</td></tr>
        <tr><td><b>PAgP</b> (Cisco)</td><td>desirable / auto</td><td>desirable+desirable, desirable+auto</td></tr>
        <tr><td>Static</td><td>on</td><td>on + on only</td></tr></table>
        <p>Members must match: speed, duplex, access VLAN or trunk settings, allowed VLANs, native VLAN.</p>` },
      { sim: {
        title: 'Without vs with EtherChannel',
        cfg: {
          w: 800, h: 300,
          nodes: [{ id: 'A', type: 'switch', x: 180, y: 150, label: 'SW1' }, { id: 'B', type: 'switch', x: 620, y: 150, label: 'SW2' }, { id: 'm1', type: 'none', x: 400, y: 95, label: '' }, { id: 'm2', type: 'none', x: 400, y: 205, label: '' }],
          links: [{ a: 'A', b: 'm1' }, { a: 'm1', b: 'B' }, { a: 'A', b: 'm2' }, { a: 'm2', b: 'B' }]
        },
        steps: [
          { text: 'Two 1 Gbps links between SW1 and SW2. Without EtherChannel, STP <b>blocks one</b> → only 1 Gbps usable.', run: async t => { t.setLink('A', 'm2', 'blocked'); t.setLink('m2', 'B', 'blocked'); await t.send(['A', 'm1', 'B'], { label: 'traffic', color: 'blue' }); } },
          { text: 'Configure <code>channel-group 1 mode active</code> (LACP) on both. Now one logical <b>Port-channel1</b> = 2 Gbps, both links forward.', run: async t => { t.setLink('A', 'm2', 'bundle'); t.setLink('m2', 'B', 'bundle'); t.setLink('A', 'm1', 'bundle'); t.setLink('m1', 'B', 'bundle'); t.badge('A', 'Po1', 'ok'); t.badge('B', 'Po1', 'ok'); await t.many([['A', 'm1', 'B'], ['A', 'm2', 'B']], { label: 'flow', color: 'green' }); } },
          { text: 'If one member fails, traffic keeps flowing on the other — no STP recalculation.', run: async t => { t.setLink('A', 'm1', 'down'); t.setLink('m1', 'B', 'down'); await t.send(['A', 'm2', 'B'], { label: 'flow', color: 'green' }); } }
        ]
      } }
    ],
    cli: `Switch(config)# interface range g0/1 - 2
Switch(config-if-range)# channel-group 1 mode active     ! LACP
Switch(config)# interface port-channel 1
Switch(config-if)# switchport mode trunk
Switch# show etherchannel summary
Switch# show lacp neighbor`,
    keypoints: ['EtherChannel bundles links so STP does not block them.', 'LACP = active/passive (standard). PAgP = desirable/auto (Cisco).', 'Member port settings must match.'],
    quiz: [
      { q: 'Which pair of LACP modes forms a channel?', a: ['passive + passive', 'active + passive', 'auto + auto', 'on + active'], c: 1, why: 'At least one side must be active.' },
      { q: 'Open standard protocol for EtherChannel?', a: ['PAgP', 'LACP', 'DTP', 'VTP'], c: 1, why: 'LACP = IEEE 802.3ad / 802.1AX.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'wireless',
    module: 'Switching',
    title: 'Wireless LAN Basics',
    minutes: 15,
    summary: 'Wi-Fi standards, bands and channels, how a client joins, and WPA2/WPA3 security.',
    sections: [
      { h: 'Wi-Fi in one page', html: `
        <table class="data">
          <tr><th>Standard</th><th>Name</th><th>Band</th><th>Max rate</th></tr>
          <tr><td>802.11n</td><td>Wi-Fi 4</td><td>2.4 / 5 GHz</td><td>600 Mbps</td></tr>
          <tr><td>802.11ac</td><td>Wi-Fi 5</td><td>5 GHz</td><td>~6.9 Gbps</td></tr>
          <tr><td>802.11ax</td><td>Wi-Fi 6 / 6E</td><td>2.4 / 5 / 6 GHz</td><td>~9.6 Gbps</td></tr>
          <tr><td>802.11be</td><td>Wi-Fi 7</td><td>2.4 / 5 / 6 GHz</td><td>~46 Gbps</td></tr>
        </table>
        <ul>
          <li><b>2.4 GHz</b>: longer range, more interference, only 3 non-overlapping channels: <b>1, 6, 11</b>.</li>
          <li><b>5 GHz / 6 GHz</b>: more channels, faster, shorter range.</li>
          <li><b>SSID</b> = network name. <b>BSSID</b> = AP radio MAC. <b>BSS</b> = one AP + its clients. <b>ESS</b> = many APs with the same SSID (roaming).</li>
          <li>Wi-Fi is half duplex and uses <b>CSMA/CA</b> (collision avoidance).</li>
          <li><b>Autonomous APs</b> are configured one by one. <b>Lightweight APs</b> are managed by a <b>WLC</b> (Wireless LAN Controller) through a <b>CAPWAP</b> tunnel (UDP 5246 control / 5247 data). Split-MAC: AP does real-time work, WLC does management.</li>
        </ul>` },
      { sim: {
        kind: 'ladder',
        title: 'How a client joins a WPA2-Personal network',
        cfg: { w: 700, actors: [{ id: 'c', type: 'laptop', label: 'Laptop' }, { id: 'ap', type: 'ap', label: 'Access Point', sub: 'SSID: Office' }] },
        steps: [
          { text: 'The AP sends <b>Beacons</b> ~10× per second announcing its SSID and capabilities (passive scanning). The client may also send <b>Probe Requests</b> (active scanning).', run: async t => { await t.arrow('ap', 'c', 'Beacon (SSID Office)', { color: 'gray', dashed: true }); await t.arrow('c', 'ap', 'Probe Request', { color: 'blue' }); await t.arrow('ap', 'c', 'Probe Response', { color: 'purple' }); } },
          { text: '<b>802.11 Authentication</b> (open system — the real security comes later) and <b>Association</b>: the client joins the BSS and gets an Association ID.', run: async t => { await t.arrow('c', 'ap', 'Authentication Req', { color: 'blue' }); await t.arrow('ap', 'c', 'Authentication Resp', { color: 'purple' }); await t.arrow('c', 'ap', 'Association Req', { color: 'blue' }); await t.arrow('ap', 'c', 'Association Resp (AID 1)', { color: 'purple' }); } },
          { text: '<b>4-way handshake</b> (EAPOL): both prove they know the passphrase (PSK) without sending it, and derive encryption keys (PTK/GTK) for <b>AES-CCMP</b>.', run: async t => { await t.arrow('ap', 'c', 'EAPOL 1: ANonce', { color: 'orange' }); await t.arrow('c', 'ap', 'EAPOL 2: SNonce + MIC', { color: 'orange' }); await t.arrow('ap', 'c', 'EAPOL 3: GTK + MIC', { color: 'orange' }); await t.arrow('c', 'ap', 'EAPOL 4: ACK', { color: 'orange' }); } },
          { text: 'Keys installed. Data is now <b>encrypted</b>. Next the client usually runs <b>DHCP</b> to get an IP.', run: async t => { await t.note('Keys installed — encrypted data', 'ok'); await t.arrow('c', 'ap', 'DHCP Discover (encrypted)', { color: 'green' }); } }
        ]
      } },
      { h: 'Wireless security', html: `
        <table class="data">
          <tr><th>Method</th><th>Status</th></tr>
          <tr><td>WEP</td><td>Broken — never use</td></tr>
          <tr><td>WPA (TKIP)</td><td>Deprecated</td></tr>
          <tr><td>WPA2 (AES-CCMP)</td><td>Common. Personal = PSK; Enterprise = 802.1X with a RADIUS server</td></tr>
          <tr><td>WPA3</td><td>Best. SAE replaces PSK (resists offline dictionary attacks), PMF required, 192-bit mode for Enterprise</td></tr>
        </table>` }
    ],
    keypoints: ['2.4 GHz non-overlapping channels: 1, 6, 11.', 'Join: beacon/probe → auth → associate → 4-way handshake.', 'Lightweight APs + WLC use CAPWAP.', 'Prefer WPA3 (SAE) or WPA2-Enterprise with 802.1X.'],
    quiz: [
      { q: 'Non-overlapping channels in 2.4 GHz (North America):', a: ['1, 5, 9', '1, 6, 11', '2, 7, 12', '36, 40, 44'], c: 1, why: 'Channels 1, 6 and 11 do not overlap.' },
      { q: 'Protocol between lightweight APs and a WLC?', a: ['LWAPP only', 'CAPWAP', 'RADIUS', 'SNMP'], c: 1, why: 'CAPWAP tunnels control and data traffic.' },
      { q: 'WPA3-Personal replaces PSK with…', a: ['TKIP', 'SAE', 'WEP', 'EAP-TLS'], c: 1, why: 'Simultaneous Authentication of Equals.' }
    ]
  });
})();
