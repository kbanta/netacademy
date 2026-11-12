/* Module 5 — Cabling, Racks & Physical Installation */
(function () {
  const L = (window.LESSONS = window.LESSONS || []);
  const h = Engine.h;
  const MOD = 'Cabling & Racks';

  /* ---------- shared helpers ---------- */
  // T568B and T568A colour order, pin 1 → pin 8 (w = white stripe)
  const T568B = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
  const T568A = ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'];
  const WNAME = { wo: 'white/orange', o: 'orange', wg: 'white/green', g: 'green', wb: 'white/blue', b: 'blue', wbr: 'white/brown', br: 'brown' };

  function plug(parent, title) {
    const pins = [];
    const box = h('div', { class: 'rj45' },
      h('div', { class: 'rj-title' }, title),
      h('div', { class: 'rj-body' }, h('div', { class: 'rj-pins' }, [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const w = h('i', { class: 'rj-wire' });
        const p = h('div', { class: 'rj-pin' }, w, h('span', {}, i + 1));
        pins.push(w);
        return p;
      }))),
      h('div', { class: 'rj-legend' }));
    parent.appendChild(box);
    return {
      box, pins,
      set(i, c) { pins[i].className = 'rj-wire on w-' + c; pins[i].title = 'Pin ' + (i + 1) + ': ' + WNAME[c]; },
      fill(order, idx) { (idx || [0, 1, 2, 3, 4, 5, 6, 7]).forEach(i => this.set(i, order[i])); },
      legend(t) { box.querySelector('.rj-legend').innerHTML = t; }
    };
  }

  function tester(parent) {
    const unit = name => {
      const leds = [1, 2, 3, 4, 5, 6, 7, 8].map(n => h('span', { class: 'led' }, n));
      const el = h('div', { class: 'tu' }, h('b', {}, name), h('div', { class: 'leds' }, leds));
      return { el, leds };
    };
    const main = unit('Main unit'), rem = unit('Remote unit');
    const res = h('div', { class: 'tu-res' });
    parent.appendChild(h('div', { class: 'tester' }, main.el, h('div', { class: 'tu-cable' }, h('i', {}), 'cable under test'), rem.el));
    parent.appendChild(res);
    return {
      clear() { main.leds.concat(rem.leds).forEach(l => (l.className = 'led')); res.innerHTML = ''; },
      // map: for each main pin (0-7) the remote pin that lights, or -1 for "nothing"
      async run(s, map) {
        this.clear();
        for (let i = 0; i < 8; i++) {
          main.leds[i].className = 'led on';
          if (map[i] >= 0) rem.leds[map[i]].className = 'led on' + (map[i] !== i ? ' bad' : '');
          else main.leds[i].className = 'led on bad';
          await s.wait(260);
          if (!s.instant) { main.leds[i].className = 'led'; if (map[i] >= 0) rem.leds[map[i]].className = 'led'; }
        }
        // leave the final pattern visible
        for (let i = 0; i < 8; i++) {
          main.leds[i].className = 'led on' + (map[i] < 0 ? ' bad' : '');
          if (map[i] >= 0) rem.leds[map[i]].className = 'led on' + (map[i] !== i ? ' bad' : '');
        }
      },
      result(html, ok) { res.className = 'tu-res ' + (ok ? 'good' : 'fail'); res.innerHTML = html; }
    };
  }

  /* ===================================================== */
  L.push({
    id: 'cabling',
    module: MOD,
    title: 'Network Cables & Connectors',
    minutes: 18,
    summary: 'Copper categories, fiber types, RJ45/LC/SC, SFP modules, PoE and the 100-metre rule.',
    sections: [
      { h: 'Copper twisted pair (UTP / STP)', html: `
        <p>Ethernet copper cable has <b>4 twisted pairs</b> (8 wires). The twists cancel electrical noise (crosstalk and EMI). <b>UTP</b> = unshielded, the normal office cable. <b>STP/FTP</b> = shielded with foil or braid, for noisy places like factories. Shielded cable must be grounded at the patch panel, otherwise the shield does not help.</p>
        <table class="data">
          <tr><th>Category</th><th>Bandwidth</th><th>Typical speed</th><th>Max length</th><th>Use</th></tr>
          <tr><td>Cat5e</td><td>100 MHz</td><td>1 Gbps</td><td>100 m</td><td>Minimum for new 1G installs</td></tr>
          <tr><td>Cat6</td><td>250 MHz</td><td>1 Gbps (10 Gbps up to ~55 m)</td><td>100 m</td><td>Most common office cable today</td></tr>
          <tr><td>Cat6A</td><td>500 MHz</td><td>10 Gbps</td><td>100 m</td><td>Wi-Fi 6/7 access points, high-power PoE</td></tr>
          <tr><td>Cat8</td><td>2000 MHz</td><td>25/40 Gbps</td><td>30 m</td><td>Short links inside data centres</td></tr>
        </table>
        <div class="callout tip"><b>The 100-metre rule:</b> a copper Ethernet <b>channel</b> is max <b>100 m</b>: up to <b>90 m</b> of fixed (permanent) cable in the walls plus up to <b>10 m</b> of patch cords at both ends together.</div>` },
      { sim: {
        kind: 'stage',
        title: 'Build one copper channel: desk to switch',
        desc: 'Each part of the path adds length. The total must stay at or below 100 m.',
        cfg: { init: s => { s.root.append(h('div', { class: 'chan' }), h('div', { class: 'ch-meter' }, h('div', { class: 'ch-bar' }, h('i', {})), h('span', {}, '0 m of 100 m'))); s.len = 0; } },
        steps: [
          { text: 'A user’s <b>PC</b> sits at a desk in the <b>work area</b>.', run: s => { chDev(s, 'pc', 'PC'); return s.wait(300); } },
          { text: 'A short <b>patch cord</b> (stranded cable, flexible) connects the PC to the <b>wall jack</b> (outlet). Here: 3 m.', run: s => { chCable(s, 'patch', 'Patch cord', 3); chDev(s, 'jack', 'Wall jack'); return s.wait(300); } },
          { text: 'Inside the wall and ceiling runs the <b>horizontal cable</b> (solid-core, the <b>permanent link</b>) to the <b>patch panel</b> in the telecom room. Max <b>90 m</b>. Here: 88 m.', run: s => { chCable(s, 'perm', 'Horizontal cable (permanent link)', 88); chDev(s, 'patch', 'Patch panel'); return s.wait(300); } },
          { text: 'One more short patch cord connects the panel port to the <b>switch</b> port. Total = 3 + 88 + 2 = <b>93 m</b>. Under 100 m, so the link works at full speed.', run: s => { chCable(s, 'patch', 'Patch cord', 2); chDev(s, 'switch', 'Switch'); s.$('.ch-meter').classList.add('good'); return s.wait(300); } },
          { text: 'Too far? Over 100 m the signal gets weak and you see errors or no link. Use <b>fiber</b> instead (hundreds of metres to many km), or put a switch in the middle.', run: s => { s.root.appendChild(h('div', { class: 'callout warn ch-note', html: '<b>Need 150 m?</b> Copper fails. Use multimode fiber (OM4: ~400 m at 10 Gbps) or single-mode (OS2: 10 km and more).' })); return s.wait(300); } }
        ]
      } },
      { h: 'Fiber optic cable', html: `
        <div class="cols2">
          <div class="card-mini"><h4>Multimode (MMF)</h4><ul><li>Thick core (50 µm), cheaper optics (LED/VCSEL)</li><li><b>OM3 / OM4</b> (aqua jacket; OM4 sometimes violet)</li><li>10 Gbps: OM3 ~300 m, OM4 ~400 m</li><li>Use: inside a building, floor to floor (backbone)</li></ul></div>
          <div class="card-mini"><h4>Single-mode (SMF)</h4><ul><li>Thin core (9 µm), laser optics</li><li><b>OS2</b> (yellow jacket)</li><li>10 km and more</li><li>Use: between buildings, ISP links, campus</li></ul></div>
        </div>
        <p>Fiber is immune to electrical noise and lightning, and is safe to run near power cables. A link uses <b>two fibers</b>: one transmits (Tx), one receives (Rx). Tx on one end must reach Rx on the other end.</p>
        <div class="callout warn"><b>Safety:</b> never look into a fiber end or an SFP port. Laser light is invisible and can hurt your eyes.</div>` },
      { h: 'Connectors and modules', html: `
        <table class="data">
          <tr><th>Connector</th><th>Used for</th></tr>
          <tr><td><b>RJ45</b> (8P8C)</td><td>Copper Ethernet: PCs, switches, phones, access points</td></tr>
          <tr><td><b>LC</b></td><td>Small duplex fiber connector. Plugs into SFP/SFP+ modules. Most common today</td></tr>
          <tr><td><b>SC</b></td><td>Square push-pull fiber connector. Common on ISP equipment and older panels</td></tr>
          <tr><td><b>MPO/MTP</b></td><td>12 or 24 fibers in one connector, for 40/100 Gbps</td></tr>
          <tr><td><b>SFP / SFP+ / SFP28 / QSFP</b></td><td>Hot-pluggable modules that give a switch port 1G / 10G / 25G / 40-100G on fiber or copper</td></tr>
          <tr><td><b>DAC</b> (direct-attach copper)</td><td>Twinax cable with SFP+ ends fixed on. Cheap 10G link inside one rack (up to ~5 m)</td></tr>
          <tr><td><b>Console (RJ45 rollover / USB)</b></td><td>Management cable from a laptop to a switch or router console port</td></tr>
        </table>
        <div class="callout tip">Both ends of a fiber link need the <b>same type</b> of module, for example 10GBASE-SR (multimode) on both sides. SR and LR do not talk to each other.</div>` },
      { h: 'Power over Ethernet (PoE)', html: `
        <p>A PoE switch sends power through the same cable to IP phones, access points and cameras. No power socket is needed at the device.</p>
        <table class="data">
          <tr><th>Standard</th><th>Name</th><th>Power at switch port</th><th>Typical device</th></tr>
          <tr><td>802.3af</td><td>PoE</td><td>15.4 W</td><td>IP phone</td></tr>
          <tr><td>802.3at</td><td>PoE+</td><td>30 W</td><td>Access point, PTZ camera</td></tr>
          <tr><td>802.3bt Type 3</td><td>PoE++</td><td>60 W</td><td>Wi-Fi 6/7 AP, video bar</td></tr>
          <tr><td>802.3bt Type 4</td><td>PoE++</td><td>90 W</td><td>Displays, small PCs</td></tr>
        </table>
        <p>Check the switch’s <b>total PoE budget</b> (for example 370 W for a 24-port switch). If too many devices ask for power, some ports get no power.</p>` }
    ],
    cliTitle: 'Cisco IOS — check the physical layer',
    cli: `! Link state, speed and duplex of every port
SW1# show interfaces status
! Errors on one port (CRC and input errors = bad cable, bad termination or noise)
SW1# show interfaces gigabitEthernet1/0/5
SW1# show interfaces counters errors
! Built-in cable test (TDR): finds open or short pairs and the distance to the fault
SW1# test cable-diagnostics tdr interface gigabitEthernet1/0/5
SW1# show cable-diagnostics tdr interface gigabitEthernet1/0/5
! SFP modules: type and optical power levels
SW1# show inventory
SW1# show interfaces transceiver
! PoE: power used per port and the remaining budget
SW1# show power inline`,
    keypoints: [
      'Copper channel max 100 m = 90 m permanent link + 10 m patch cords.',
      'Cat6 is the normal office cable; Cat6A for 10 Gbps at 100 m and high-power PoE.',
      'Multimode fiber (OM3/OM4) inside buildings, single-mode (OS2) for long distances.',
      'LC connectors and SFP modules are the standard for fiber switch ports.',
      'PoE / PoE+ / PoE++ give 15.4 / 30 / 60–90 W per port.'
    ],
    quiz: [
      { q: 'What is the maximum length of a copper Ethernet channel?', a: ['55 m', '90 m', '100 m', '185 m'], c: 2, why: '100 m total: up to 90 m permanent link plus up to 10 m of patch cords.' },
      { q: 'You need 10 Gbps to an access point 85 m away over copper. Which cable?', a: ['Cat5e', 'Cat6', 'Cat6A', 'Cat3'], c: 2, why: 'Cat6 only does 10G up to about 55 m. Cat6A does 10G at 100 m.' },
      { q: 'Which fiber type do you use between two buildings 5 km apart?', a: ['OM3 multimode', 'OM4 multimode', 'OS2 single-mode', 'Cat8'], c: 2, why: 'Single-mode fiber reaches 10 km and more. Multimode is limited to a few hundred metres at 10G.' },
      { q: 'Which PoE standard gives 30 W per port?', a: ['802.3af', '802.3at (PoE+)', '802.3bt Type 4', '802.3ab'], c: 1, why: '802.3at (PoE+) = 30 W. 802.3af = 15.4 W. 802.3ab is 1000BASE-T, not PoE.' },
      { q: 'A port shows many CRC errors. What is the most likely cause?', a: ['Wrong VLAN', 'Bad cable or termination', 'Wrong IP address', 'STP blocking'], c: 1, why: 'CRC errors mean frames were damaged on the wire: bad cable, bad termination, too long, or noise.' }
    ]
  });

  function chDev(s, type, label) {
    s.$('.chan').appendChild(h('div', { class: 'ch-dev' }, Engine.icon(type, 64), h('span', {}, label)));
  }
  function chCable(s, cls, label, m) {
    s.$('.chan').appendChild(h('div', { class: 'ch-cable ' + cls }, h('i', {}), h('span', {}, label), h('b', {}, m + ' m')));
    s.len += m;
    s.$('.ch-bar i').style.width = Math.min(100, s.len) + '%';
    s.$('.ch-meter span').textContent = s.len + ' m of 100 m';
  }

  /* ===================================================== */
  L.push({
    id: 'termination',
    module: MOD,
    title: 'Cable Termination: T568A/B, Crimping & Punch-down',
    minutes: 22,
    summary: 'Wire colour order, straight vs crossover, how to crimp an RJ45 plug, punch down a patch panel and test the cable.',
    sections: [
      { h: 'Two wiring standards', html: `
        <p>The 8 wires go into the connector in a fixed colour order. There are two standards: <b>T568A</b> and <b>T568B</b>. They differ only in that the <b>orange and green pairs swap places</b>. Both work equally well.</p>
        <div class="callout tip"><b>Rule:</b> pick <b>one</b> standard for the whole building and use it everywhere: plugs, wall jacks and patch panels. <b>T568B</b> is the most common choice for commercial work. Many government and residential installs use T568A.</div>` },
      { sim: {
        kind: 'stage',
        title: 'RJ45 pin-out, wire by wire',
        desc: 'Hold the plug with the clip facing down and the gold contacts facing you. Pin 1 is on the left.',
        cfg: { init: s => { const row = h('div', { class: 'rj-row' }); s.root.appendChild(row); s.B = plug(row, 'T568B'); s.A = plug(row, 'T568A'); s.A.box.style.visibility = 'hidden'; } },
        steps: [
          { text: 'Empty RJ45 plug. Clip <b>down</b>, contacts <b>towards you</b>, cable entering from the bottom. Pins are numbered <b>1 to 8 from left to right</b>.', run: s => s.wait(300) },
          { text: '<b>Orange pair</b> on pins <b>1 and 2</b>: white/orange, then orange.', run: s => { s.B.fill(T568B, [0, 1]); return s.wait(400); } },
          { text: '<b>Green pair</b> is split: <b>white/green on pin 3</b> and <b>green on pin 6</b>. This split is the part beginners get wrong.', run: s => { s.B.fill(T568B, [2, 5]); return s.wait(400); } },
          { text: '<b>Blue pair</b> sits in the middle: <b>blue on pin 4</b>, <b>white/blue on pin 5</b>. Notice the solid colour comes first here.', run: s => { s.B.fill(T568B, [3, 4]); return s.wait(400); } },
          { text: '<b>Brown pair</b> on pins <b>7 and 8</b>: white/brown, brown. Memory trick for T568B: <b>“white-orange, orange, white-green, blue, white-blue, green, white-brown, brown”</b>.', run: s => { s.B.fill(T568B, [6, 7]); s.B.legend('WO · O · WG · B · WB · G · WBR · BR'); return s.wait(400); } },
          { text: '<b>T568A</b> is the same, but the <b>orange and green pairs are swapped</b>: white/green and green on pins 1–2, white/orange on 3 and orange on 6.', run: s => { s.A.box.style.visibility = ''; s.A.fill(T568A); s.A.legend('WG · G · WO · B · WB · O · WBR · BR'); return s.wait(400); } },
          { text: '<b>Straight-through</b> cable = same standard on both ends (B–B). Used for almost everything. <b>Crossover</b> = A on one end, B on the other. It was needed for switch-to-switch links, but modern ports have <b>Auto-MDIX</b> and fix this automatically.', run: s => { s.root.appendChild(h('div', { class: 'rj-types', html: '<span><b>Straight-through:</b> B ⟷ B (or A ⟷ A)</span><span><b>Crossover:</b> A ⟷ B</span><span><b>Rollover (console):</b> pin 1 ⟷ 8, 2 ⟷ 7 … fully reversed</span>' })); return s.wait(300); } }
        ]
      } },
      { h: 'How to crimp an RJ45 plug', html: `
        <ol class="steps">
          <li><b>Strip</b> about 25 mm (1 inch) of the outer jacket with a cable stripper. Do not nick the wire insulation. Cut off the rip cord and the plastic spline (Cat6).</li>
          <li><b>Untwist</b> the pairs and straighten each wire. Arrange them in <b>T568B</b> order, flat and side by side.</li>
          <li><b>Trim</b> the wires straight across, leaving about <b>13 mm (½ inch)</b> from the jacket. Too long = the jacket does not reach the plug and the cable will pull out.</li>
          <li><b>Insert</b> the wires into the plug, clip down. Push until every wire touches the <b>front wall</b> of the plug. The <b>jacket must go inside</b> the plug past the strain relief.</li>
          <li><b>Check</b> the colours through the clear plug before you crimp. Once crimped, the plug cannot be reused.</li>
          <li><b>Crimp</b> firmly with the crimp tool until it clicks. The gold pins press into the wires.</li>
          <li>Do the same on the other end, then <b>test</b> with a cable tester.</li>
        </ol>
        <div class="callout tip"><b>Pass-through plugs</b> (wires come out the front, you cut them off after crimping) make it easier to check the order. Use <b>Cat6 plugs for Cat6 cable</b>: the wires are thicker.</div>` },
      { h: 'Punch-down: patch panels and wall jacks (keystones)', html: `
        <p>The fixed cable in the wall is <b>solid-core</b> and is never crimped. It is <b>punched down</b> into IDC (insulation-displacement) contacts on the back of a patch panel or keystone jack.</p>
        <ol class="steps">
          <li>Strip about 50 mm of jacket. Keep the pairs <b>twisted</b>.</li>
          <li>Lay each wire into its slot following the <b>colour label</b> on the panel. The labels show A and B. Use the B row if your site uses T568B.</li>
          <li>Keep the twist up to the contact: <b>max 13 mm (½ inch) untwisted</b>. More untwist = crosstalk = failed test at high speed.</li>
          <li>Use a <b>110 punch-down tool</b> with the <b>cut side facing the waste end</b> of the wire. Push straight down until it clicks and cuts the extra wire.</li>
          <li>Secure the cable with the panel’s cable tie bar. Respect the <b>bend radius</b>: at least 4× the cable diameter (about 25 mm for Cat6). No sharp bends, no tight zip ties.</li>
        </ol>` },
      { sim: {
        kind: 'stage',
        title: 'Testing a cable with a wire-map tester',
        desc: 'A simple tester lights LEDs 1–8 in order on both units. The remote unit shows where each wire really arrives.',
        cfg: { init: s => { s.T = tester(s.root); } },
        steps: [
          { text: 'Plug one end into the <b>main unit</b> and the other end into the <b>remote unit</b>. Press test: the main unit sends a signal on each pin, one at a time.', run: s => { s.T.clear(); return s.wait(300); } },
          { text: '<b>Good cable:</b> LEDs light 1-1, 2-2 … 8-8 in the same order on both units.', run: async s => { await s.T.run(s, [0, 1, 2, 3, 4, 5, 6, 7]); s.T.result('✓ PASS: all 8 wires correct', true); } },
          { text: '<b>Open</b> (broken wire or wire not touching the pin): LED 3 never lights on the remote. Re-crimp or re-punch that end.', run: async s => { await s.T.run(s, [0, 1, -1, 3, 4, 5, 6, 7]); s.T.result('✗ OPEN on pin 3: the wire is not connected', false); } },
          { text: '<b>Crossed / reversed wires:</b> main 1 lights remote 2, and main 2 lights remote 1. Someone swapped two wires in one plug.', run: async s => { await s.T.run(s, [1, 0, 2, 3, 4, 5, 6, 7]); s.T.result('✗ CROSSED: pins 1 and 2 are swapped', false); } },
          { text: '<b>Split pair</b> (wires from two different pairs mixed up, but the same on both ends): a simple tester shows <b>PASS</b>, yet the link has errors or drops to 100 Mbps. Only a <b>cable certifier</b> (crosstalk / NEXT test) finds it. This is why you follow the colour code exactly.', run: async s => { await s.T.run(s, [0, 1, 2, 3, 4, 5, 6, 7]); s.T.result('⚠ Looks like PASS, but a split pair hides here. A certifier would FAIL it.', false); } }
        ]
      } },
      { h: 'Tool kit', html: `
        <table class="data">
          <tr><th>Tool</th><th>What it is for</th></tr>
          <tr><td>Cable stripper / jacket cutter</td><td>Remove the outer jacket without cutting the wires</td></tr>
          <tr><td>Crimp tool (RJ45)</td><td>Press the plug pins into the wires</td></tr>
          <tr><td>110 punch-down tool</td><td>Terminate solid cable on patch panels and keystones</td></tr>
          <tr><td>Wire-map tester</td><td>Checks the 8 wires: opens, shorts, crossed wires</td></tr>
          <tr><td>Tone generator and probe (“toner”)</td><td>Find which cable in a bundle goes to which wall jack</td></tr>
          <tr><td>Cable certifier (e.g. Fluke DSX)</td><td>Proves the link meets Cat6/6A specs: length, crosstalk, loss. Needed for warranty</td></tr>
          <tr><td>Label printer</td><td>Labels on both ends of every cable and port</td></tr>
          <tr><td>Fiber: cleaner pen and inspection scope</td><td>A dirty fiber end is the #1 cause of fiber problems. Inspect, clean, then connect</td></tr>
        </table>` }
    ],
    cliTitle: 'Cisco IOS — check the new cable',
    cli: `! Port should be "connected" at a-1000 a-full
SW1# show interfaces status | include Gi1/0/5
! Many CRC / input errors = bad termination, split pair or too much untwist
SW1# show interfaces gigabitEthernet1/0/5 | include CRC|errors
! Only 100 Mbps on a gigabit port? 1000BASE-T needs all 4 pairs; one pair is probably bad
SW1# test cable-diagnostics tdr interface gigabitEthernet1/0/5
SW1# show cable-diagnostics tdr interface gigabitEthernet1/0/5
! Clear counters, wait, then check again
SW1# clear counters gigabitEthernet1/0/5`,
    keypoints: [
      'T568B: WO-O-WG-B-WB-G-WBR-BR. T568A swaps the orange and green pairs.',
      'Use one standard on the whole site. Straight-through = same on both ends.',
      'Crimp stranded patch cords; punch down solid cable on panels and keystones.',
      'Keep untwist to max 13 mm and the jacket inside the plug.',
      'A simple tester cannot find split pairs; a certifier can.'
    ],
    quiz: [
      { q: 'Which wire is on pin 1 in T568B?', a: ['White/green', 'White/orange', 'Orange', 'Blue'], c: 1, why: 'T568B starts white/orange, orange. T568A starts white/green, green.' },
      { q: 'What is the difference between T568A and T568B?', a: ['Blue and brown pairs swap', 'Orange and green pairs swap', 'Pins are reversed', 'B is only for fiber'], c: 1, why: 'Only the orange and green pairs change places.' },
      { q: 'One end is T568A, the other T568B. What kind of cable is it?', a: ['Straight-through', 'Crossover', 'Rollover', 'Broken'], c: 1, why: 'A-to-B is a crossover. Modern Auto-MDIX ports handle either type.' },
      { q: 'Which tool terminates solid cable on the back of a patch panel?', a: ['Crimp tool', '110 punch-down tool', 'Toner', 'Fusion splicer'], c: 1, why: 'Patch panels and keystones use IDC contacts and a punch-down tool.' },
      { q: 'A cable passes a simple wire-map test but the link has many errors. Likely cause?', a: ['Split pair', 'Open wire', 'Wrong VLAN', 'Duplex on both sides is auto'], c: 0, why: 'A split pair has continuity pin-to-pin, so a simple tester passes it, but crosstalk causes errors. A certifier finds it.' }
    ]
  });

  /* ===================================================== */
  // Rack elevation helpers: 24U rack, U1 at the bottom
  const RU = 24;
  function rackInit(s) {
    const nums = h('div', { class: 'rk-nums' }, Array.from({ length: RU }, (_, i) => h('span', {}, RU - i)));
    const body = h('div', { class: 'rk-body' });
    const pdu = h('div', { class: 'rk-pdu', title: 'Vertical PDU (rear)' }, 'PDU');
    s.root.appendChild(h('div', { class: 'rackwrap' },
      h('div', { class: 'rack' }, h('div', { class: 'rk-top' }, '24U · 19-inch rack · front view'), h('div', { class: 'rk-in' }, nums, body, pdu)),
      h('div', { class: 'rk-side' })));
  }
  function rackAdd(s, top, size, cls, label, sub) {
    const it = h('div', { class: 'rk-it ' + cls, style: `grid-row:${RU - top + 1} / span ${size}` },
      h('b', {}, label), sub ? h('small', {}, sub) : null);
    s.$('.rk-body').appendChild(it);
    return it;
  }
  function rackNote(s, html) { s.$('.rk-side').appendChild(h('div', { class: 'rk-note', html })); }

  L.push({
    id: 'rack',
    module: MOD,
    title: 'Server Racks & Rack Layout',
    minutes: 18,
    summary: 'Rack units, 19-inch racks, where each device goes, power, airflow, grounding and cable management.',
    sections: [
      { h: 'Rack basics', html: `
        <div class="cols2">
          <div class="card-mini"><h4>Sizes</h4><ul><li>Standard width: <b>19 inch</b> (EIA-310) between the mounting rails</li><li>Height in <b>rack units (U)</b>: <b>1U = 1.75 in = 44.45 mm</b></li><li>Common racks: 9U–12U wall cabinet, 24U, <b>42U</b> full height</li><li>Each U has 3 holes. Devices start on a U boundary</li></ul></div>
          <div class="card-mini"><h4>Types</h4><ul><li><b>Wall-mount cabinet</b>: small office, patch panel + switch</li><li><b>2-post open frame</b>: network gear only (light, shallow)</li><li><b>4-post cabinet</b>: servers (deep, heavy). Choose 1000–1200 mm depth for servers</li><li>Square holes take <b>cage nuts</b> (usually M6). Servers use slide rails</li></ul></div>
        </div>` },
      { sim: {
        kind: 'stage',
        title: 'Filling a 24U rack, step by step',
        desc: 'Watch the order in which a small office rack is built, and why each device goes where it goes.',
        cfg: { init: rackInit },
        steps: [
          { text: 'Empty <b>24U</b> rack. U numbers count <b>from the bottom</b> (U1) to the top (U24). Plan on paper first: this plan is called a <b>rack elevation</b>.', run: s => s.wait(300) },
          { text: '<b>UPS at the bottom</b> (U1–U2). It is the heaviest item. Heavy at the bottom keeps the rack stable and makes lifting safer.', run: s => { rackAdd(s, 2, 2, 'ups', 'UPS 1500 VA', 'U1–U2 · heaviest at the bottom'); rackNote(s, '<b>Bottom:</b> UPS, batteries, heavy servers'); return s.wait(400); } },
          { text: '<b>Servers and storage in the middle</b> (U5–U8). Easy to reach, and they can sit on rails and slide out for service.', run: s => { rackAdd(s, 6, 2, 'srv', 'Server 1 (2U)', 'U5–U6'); rackAdd(s, 8, 2, 'srv', 'NAS / backup (2U)', 'U7–U8'); rackNote(s, '<b>Middle:</b> servers and storage on slide rails'); return s.wait(400); } },
          { text: '<b>Network gear at the top</b>, near where cables enter from the ceiling: patch panel, cable manager, switch, cable manager.', run: s => { rackAdd(s, 24, 1, 'pp', 'Patch panel PP1 (24 × Cat6)', 'U24'); rackAdd(s, 23, 1, 'hcm', 'Horizontal cable manager', 'U23'); rackAdd(s, 22, 1, 'sw', 'Switch SW1 (24 × 1G PoE + 4 × SFP+)', 'U22'); rackAdd(s, 21, 1, 'hcm', 'Horizontal cable manager', 'U21'); rackNote(s, '<b>Top:</b> patch panels and switches, close to the cable entry'); return s.wait(400); } },
          { text: 'Add the <b>firewall/router</b> and the <b>fiber panel</b> for the ISP line and the building backbone.', run: s => { rackAdd(s, 20, 1, 'fw', 'Firewall / router', 'U20'); rackAdd(s, 19, 1, 'pp fib', 'Fiber patch panel (LC)', 'U19 · ISP + backbone'); return s.wait(400); } },
          { text: '<b>Patch cords</b> connect each patch-panel port to the switch port just below it. Short cords (0.3–0.5 m) and colours make it tidy: for example blue = data, yellow = PoE phone/AP, red = uplink.', run: s => { s.$$('.rk-it.pp:not(.fib), .rk-it.sw').forEach(e => e.classList.add('patched')); return s.wait(400); } },
          { text: '<b>Blanking panels</b> close the empty U spaces. A <b>vertical PDU</b> at the rear feeds power from the UPS. Each server with two power supplies connects to <b>two different PDUs</b> if you have A+B power.', run: s => { rackAdd(s, 18, 9, 'blank', 'Blanking panels', 'U10–U18 · stop hot air coming back to the front'); rackAdd(s, 4, 2, 'blank', 'Blanking / shelf', 'U3–U4'); s.$('.rk-pdu').classList.add('on'); rackNote(s, '<b>Rear:</b> vertical PDU fed by the UPS'); return s.wait(400); } },
          { text: '<b>Airflow:</b> devices pull cold air in at the <b>front</b> and blow hot air out at the <b>back</b>. In server rooms all racks face the same way: front-to-front = <b>cold aisle</b>, back-to-back = <b>hot aisle</b>. Finally: <b>ground the rack</b> to the building ground bar and <b>label</b> everything.', run: s => { rackNote(s, '<span class="air"><i class="cold">❄ cold aisle → front</i> ▸ rack ▸ <i class="hot">rear → hot aisle 🔥</i></span>'); rackNote(s, '<b>Safety:</b> bond the rack to ground. Two people to lift servers. Fill from the bottom so the rack never tips.'); return s.wait(300); } }
        ]
      } },
      { h: 'Good rack practice', html: `
        <ul>
          <li><b>Plan first:</b> rack elevation drawing, power budget (watts per device), weight, and free U for growth (keep 20–30% free).</li>
          <li><b>Power:</b> UPS sized for the load + runtime you need. Two power supplies → two PDUs (A and B feed). Never daisy-chain power strips.</li>
          <li><b>Cooling:</b> front-to-back airflow, blanking panels in empty spaces, do not block the rear door. Some switches blow side-to-side or back-to-front: check before you mount.</li>
          <li><b>Cable management:</b> horizontal managers between panel and switch, vertical managers on the sides, Velcro (hook-and-loop) straps, not tight zip ties. Keep power cables on one side and data cables on the other.</li>
          <li><b>Grounding:</b> bond the rack to the telecom ground bar (TGB). Required for shielded cable and for safety.</li>
          <li><b>Security:</b> lock the rack and the room. Physical access = full access.</li>
          <li><b>Labels and documentation:</b> every device, port, cable end and patch panel port, plus a port map spreadsheet.</li>
        </ul>` }
    ],
    cliTitle: 'Cisco IOS — first look at a new switch in the rack',
    cli: `! Hardware model, serial number and modules (record these in your documentation)
Switch# show version
Switch# show inventory
! Power supplies, fans and temperature
Switch# show environment all
! PoE budget
Switch# show power inline
! Which devices are connected to which port (Cisco devices)
Switch# show cdp neighbors
Switch# show lldp neighbors`,
    keypoints: [
      '19-inch racks, height in U: 1U = 1.75 in (44.45 mm).',
      'Heavy at the bottom (UPS, servers); network gear at the top near cable entry.',
      'Patch panel → cable manager → switch → cable manager keeps patch cords short.',
      'Front-to-back airflow, hot/cold aisles, blanking panels.',
      'Ground the rack, plan power and label everything.'
    ],
    quiz: [
      { q: 'How tall is 1U?', a: ['1 inch', '1.75 inches (44.45 mm)', '2 inches', '19 inches'], c: 1, why: '1 rack unit = 1.75 in = 44.45 mm. 19 inches is the rack width.' },
      { q: 'Where do you mount the UPS?', a: ['At the top', 'In the middle', 'At the bottom', 'Outside the rack only'], c: 2, why: 'The UPS is the heaviest item. Heavy equipment goes low to keep the rack stable.' },
      { q: 'Why install blanking panels in empty U spaces?', a: ['To look nice only', 'To stop hot exhaust air flowing back to the front', 'To ground the rack', 'To hold patch cords'], c: 1, why: 'Without them, hot air from the rear recirculates to the cold front intakes.' },
      { q: 'In a server room, racks are placed front-to-front. What is the aisle between the fronts called?', a: ['Hot aisle', 'Cold aisle', 'Service aisle', 'Return aisle'], c: 1, why: 'Fronts take in cold air, so the aisle between them is the cold aisle.' },
      { q: 'A typical layout at the top of the rack is:', a: ['Switch, switch, switch, patch panel', 'Patch panel, cable manager, switch, cable manager', 'UPS, patch panel, server', 'PDU, switch, UPS'], c: 1, why: 'Alternating panel / manager / switch keeps patch cords short and tidy.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'structured',
    module: MOD,
    title: 'Structured Cabling, Labeling & Patching',
    minutes: 16,
    summary: 'MDF and IDF, horizontal vs backbone cabling, port maps, labeling standards and tracing a jack to a switch port.',
    sections: [
      { h: 'The parts of a structured cabling system', html: `
        <p><b>Structured cabling</b> means the building is cabled in a standard, planned way (TIA-568 / ISO 11801), not with random long cables. You can move a user to any desk by only changing a patch cord.</p>
        <table class="data">
          <tr><th>Part</th><th>What it is</th></tr>
          <tr><td><b>Work area</b></td><td>The desk: PC, phone, wall jack, short patch cord</td></tr>
          <tr><td><b>Horizontal cabling</b></td><td>Copper from each wall jack to the floor’s telecom room. Star topology, one cable per jack, max 90 m</td></tr>
          <tr><td><b>IDF</b> (Intermediate Distribution Frame) / telecom room</td><td>Rack on each floor: patch panels + access switches</td></tr>
          <tr><td><b>Backbone (vertical) cabling</b></td><td>Fiber from each IDF to the MDF, often 2 links for redundancy</td></tr>
          <tr><td><b>MDF</b> (Main Distribution Frame)</td><td>Main server room: core switch, servers, firewall</td></tr>
          <tr><td><b>Entrance facility / demarc</b></td><td>Where the ISP line enters. The ISP is responsible up to this point</td></tr>
        </table>` },
      { sim: {
        kind: 'topo',
        title: 'Follow a cable from desk to server room',
        desc: 'A frame from PC-A travels through every part of a structured cabling system.',
        cfg: {
          w: 940, h: 380,
          zones: [
            { x: 20, y: 40, w: 230, h: 320, label: 'Work area · floor 2', color: 'blue' },
            { x: 270, y: 40, w: 270, h: 320, label: 'IDF-2 · floor 2 telecom room', color: 'orange' },
            { x: 560, y: 40, w: 250, h: 320, label: 'MDF · server room', color: 'purple' }
          ],
          nodes: [
            { id: 'pc1', type: 'pc', x: 75, y: 130, label: 'PC-A' },
            { id: 'pc2', type: 'pc', x: 75, y: 280, label: 'PC-B' },
            { id: 'j1', type: 'jack', x: 190, y: 130, label: 'Jack 2-101' },
            { id: 'j2', type: 'jack', x: 190, y: 280, label: 'Jack 2-102' },
            { id: 'pp', type: 'patch', x: 340, y: 205, label: 'Patch panel PP1' },
            { id: 'sw', type: 'switch', x: 470, y: 205, label: 'SW-IDF2' },
            { id: 'core', type: 'l3switch', x: 630, y: 205, label: 'Core switch' },
            { id: 'srv', type: 'server', x: 740, y: 300, label: 'File server' },
            { id: 'fw', type: 'firewall', x: 740, y: 110, label: 'Firewall' },
            { id: 'isp', type: 'cloud', x: 880, y: 110, label: 'ISP (demarc)' }
          ],
          links: [
            { a: 'pc1', b: 'j1' }, { a: 'pc2', b: 'j2' },
            { a: 'j1', b: 'pp' }, { a: 'j2', b: 'pp' },
            { a: 'pp', b: 'sw' },
            { a: 'sw', b: 'core', cls: 'trunk', label: 'OM4 fiber', ly: -18 },
            { a: 'core', b: 'srv' }, { a: 'core', b: 'fw' }, { a: 'fw', b: 'isp', cls: 'wan' }
          ]
        },
        steps: [
          { text: 'PC-A plugs into wall jack <b>2-101</b> (floor 2, outlet 101) with a short <b>patch cord</b>.', run: async t => { t.badge('j1', '2-101'); await t.send(['pc1', 'j1'], { label: 'patch cord', color: 'blue' }); } },
          { text: 'Behind the wall, one <b>horizontal cable</b> runs from that jack to <b>port 01</b> of patch panel PP1 in the floor’s <b>IDF</b>. The label is the same on both ends.', run: async t => { t.badge('pp', 'PP1-01'); await t.send(['j1', 'pp'], { label: 'Cat6 · 62 m', color: 'blue' }); } },
          { text: 'A patch cord connects <b>PP1-01</b> to switch port <b>Gi1/0/1</b>. Moving a user = moving only this cord. The port description on the switch records it.', run: async t => { t.badge('sw', 'Gi1/0/1'); await t.send(['pp', 'sw'], { label: 'patch', color: 'blue' }); } },
          { text: 'The IDF switch reaches the <b>MDF</b> over the <b>fiber backbone</b>. Floors never connect directly to each other: all go to the core (star).', run: t => t.send(['sw', 'core'], { label: 'uplink', color: 'purple' }) },
          { text: 'In the MDF the core switch connects servers and the firewall. The firewall connects to the ISP at the <b>demarcation point</b>.', run: t => t.send(['core', 'fw', 'isp'], { label: 'Internet', color: 'orange' }) },
          { text: 'PC-B on jack <b>2-102 → PP1-02 → Gi1/0/2</b> opens a file on the server. Clear labels and a port map let you trace any problem in minutes.', run: async t => { t.badge('j2', '2-102'); await t.send(['pc2', 'j2', 'pp', 'sw', 'core', 'srv'], { label: 'file request', color: 'green' }); await t.send(['srv', 'core', 'sw', 'pp', 'j2', 'pc2'], { label: 'file', color: 'green' }); } }
        ]
      } },
      { h: 'Labeling (TIA-606) and the port map', html: `
        <p>Every cable gets the <b>same label on both ends</b>, and every port is labeled. Keep it simple and consistent, for example:</p>
        <table class="data mono-t">
          <tr><th>Wall jack</th><th>Patch panel port</th><th>Switch port</th><th>VLAN</th><th>Device / user</th></tr>
          <tr><td>2-101</td><td>IDF2-PP1-01</td><td>SW-IDF2 Gi1/0/1</td><td>10 Staff</td><td>PC-A, Room 201</td></tr>
          <tr><td>2-102</td><td>IDF2-PP1-02</td><td>SW-IDF2 Gi1/0/2</td><td>10 Staff</td><td>PC-B, Room 201</td></tr>
          <tr><td>2-103</td><td>IDF2-PP1-03</td><td>SW-IDF2 Gi1/0/3</td><td>20 Voice</td><td>IP phone, reception</td></tr>
          <tr><td>2-AP1</td><td>IDF2-PP1-23</td><td>SW-IDF2 Gi1/0/23</td><td>trunk</td><td>Access point, ceiling hall</td></tr>
        </table>
        <div class="callout tip">Copy the label into the <b>switch port description</b> (<code>description PP1-01 / Jack 2-101</code>). Then <code>show interfaces status</code> works as a live port map.</div>
        <h4>Finding an unlabeled cable</h4>
        <ol class="steps">
          <li>Plug the <b>tone generator</b> into the wall jack.</li>
          <li>In the telecom room, move the <b>probe</b> over the patch panel ports or cables. It beeps loudest on the right one.</li>
          <li>Or plug a laptop into the jack and run <code>show mac address-table address &lt;laptop MAC&gt;</code> on the switch, or check the switch port’s link LED.</li>
          <li>Label it immediately.</li>
        </ol>` }
    ],
    cliTitle: 'Cisco IOS — trace a jack to a switch port',
    cli: `! Find the port where a laptop MAC address was learned
SW-IDF2# show mac address-table address 00e0.4c68.1a2b
! Ports with their descriptions (your live port map)
SW-IDF2# show interfaces status
SW-IDF2# show interfaces description
! What is connected on the other side (phones, APs, other switches)
SW-IDF2# show lldp neighbors detail
! Write the port map into the switch
SW-IDF2(config)# interface gigabitEthernet1/0/1
SW-IDF2(config-if)# description PP1-01 / Jack 2-101 / Room 201`,
    keypoints: [
      'Work area → horizontal cable → IDF patch panel → switch → fiber backbone → MDF.',
      'Horizontal cabling is a star, one cable per jack, max 90 m.',
      'Label both ends of every cable the same; keep a port map.',
      'Put the patch panel label into the switch port description.',
      'Use a toner or the MAC address table to find unknown cables.'
    ],
    quiz: [
      { q: 'What is an IDF?', a: ['The ISP’s router', 'A floor telecom room with patch panels and access switches', 'The main server room', 'A type of fiber'], c: 1, why: 'Intermediate Distribution Frame = the telecom room/rack on a floor. The MDF is the main one.' },
      { q: 'What usually connects IDFs to the MDF?', a: ['Cat5e horizontal cable', 'Fiber backbone', 'Wi-Fi bridge', 'Console cable'], c: 1, why: 'Backbone links are usually fiber: longer distance, more speed, no electrical issues between floors.' },
      { q: 'Which tool finds which cable in a bundle goes to a wall jack?', a: ['Crimp tool', 'Tone generator and probe', 'OTDR only', 'Punch-down tool'], c: 1, why: 'The toner puts a signal on the cable; the probe beeps when it is close to that cable.' },
      { q: 'A user moves to another desk on the same floor. In a structured system you usually:', a: ['Pull a new cable', 'Move a patch cord and update the port map/VLAN', 'Buy a new switch', 'Re-terminate the patch panel'], c: 1, why: 'Every desk is already cabled to the IDF. Only patching and configuration change.' }
    ]
  });
})();
