/* Hands-on labs: step-by-step "how to set up X" guides.
   Each lab: topology diagram, addressing table, tasks (commands / GUI steps / verification), troubleshooting. */
(function () {
  const LABS = (window.LABS = window.LABS || []);

  /* ===================================================== */
  LABS.push({
    id: 'env',
    title: 'Set up your practice lab (Packet Tracer & VirtualBox)',
    level: 'Start here', minutes: 45, tools: 'Free software',
    summary: 'Install free tools to practice Cisco networking and Windows Server on your own PC.',
    goal: 'Get a free simulator for Cisco labs and virtual machines for Windows Server / Active Directory labs.',
    prereq: ['PC with 8 GB RAM or more (16 GB recommended for Windows Server labs)', 'About 60 GB free disk space', 'Internet only for downloading — the labs themselves work offline'],
    tasks: [
      { t: 'Install Cisco Packet Tracer (free)', on: 'Your PC', why: 'Packet Tracer simulates Cisco routers, switches, PCs and servers. Every Cisco lab here works in it.',
        gui: ['Go to the Cisco Networking Academy website (netacad.com) and create a free account.', 'Enroll in the free course “Getting Started with Cisco Packet Tracer”.', 'Download Packet Tracer for Windows from the course resources and install it.', 'Start Packet Tracer and log in once with your NetAcad account (later it works offline).'] },
      { t: 'Learn the Packet Tracer basics', on: 'Packet Tracer', why: 'You will use these 5 actions in every Cisco lab.',
        gui: ['Bottom-left device box: drag a <b>2911 router</b>, a <b>2960 switch</b> and <b>PCs</b> onto the workspace.', 'Connections (lightning icon): choose <b>Automatically Choose Connection Type</b> or <b>Copper Straight-Through</b> and click both devices.', 'Click a router/switch → <b>CLI</b> tab to type commands.', 'Click a PC → <b>Desktop</b> tab → <b>IP Configuration</b> (set IP) or <b>Command Prompt</b> (ping, ipconfig, ssh).', 'Wait until link lights turn green. Use <b>Simulation mode</b> (bottom-right) to watch packets move — just like the animations in this course.'] },
      { t: 'Install VirtualBox (or use Hyper-V)', on: 'Your PC', why: 'Virtual machines let you run Windows Server and Windows clients without extra hardware.',
        gui: ['Download VirtualBox from virtualbox.org and install it. (Windows 10/11 Pro users may enable <b>Hyper-V</b> instead: Turn Windows features on or off → Hyper-V.)', 'Enable virtualization (Intel VT-x / AMD-V) in BIOS if VirtualBox says it is disabled.'] },
      { t: 'Download Windows Server and Windows client evaluation ISOs', on: 'Your PC', why: 'Microsoft offers free 180-day (Server) and 90-day (Windows Enterprise) evaluation versions.',
        gui: ['Open the <b>Microsoft Evaluation Center</b> and download <b>Windows Server 2022 or 2025</b> (ISO).', 'Download <b>Windows 11 Enterprise</b> evaluation (ISO) for the client PC. <b>Windows Home editions cannot join a domain.</b>'] },
      { t: 'Create the lab network and VMs', on: 'VirtualBox', why: 'Both VMs must be on the same private network so the client can reach the domain controller.',
        gui: ['VirtualBox → Tools → Network → <b>NAT Networks</b> → Create “LabNet” 192.168.50.0/24. <b>Turn its DHCP OFF</b> (your Windows Server will do DHCP in a later lab).', 'New VM “DC1”: Windows Server ISO, 2 CPUs, 4 GB RAM, 60 GB disk. Network adapter 1 → NAT Network → LabNet.', 'New VM “CLIENT1”: Windows 11 ISO, 2 CPUs, 4 GB RAM, 64 GB disk, same LabNet network.', 'Install both. For the server choose <b>Desktop Experience</b> (with GUI).', 'Take a <b>snapshot</b> of each fresh VM — you can roll back if a lab goes wrong.'] }
    ],
    trouble: [
      ['VirtualBox: “VT-x is disabled in the BIOS”', 'Reboot, enter BIOS/UEFI, enable Intel Virtualization Technology / SVM Mode.'],
      ['VirtualBox VM is very slow on Windows 11', 'Hyper-V/Memory Integrity can slow VirtualBox. Either use Hyper-V for the VMs, or disable Core Isolation → Memory integrity.'],
      ['Packet Tracer link stays orange', 'Switch ports take ~30 s (STP listening/learning). Click the fast-forward button in the bottom bar.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'switch-basic',
    title: 'Basic switch setup with SSH',
    level: 'Beginner', minutes: 30, tools: 'Packet Tracer',
    lessons: ['ios', 'switching'],
    summary: 'Hostname, passwords, management IP, SSH, unused ports and saving — the first thing you do on any new switch.',
    goal: 'Configure a new Cisco 2960 switch so it can be managed securely over the network with SSH.',
    topo: { w: 700, h: 220, nodes: [{ id: 'pc', type: 'pc', x: 120, y: 110, label: 'Admin-PC', sub: '192.168.1.10/24' }, { id: 'sw', type: 'switch', x: 420, y: 110, label: 'SW1', sub: 'VLAN1 192.168.1.2' }, { id: 'r', type: 'router', x: 620, y: 110, label: 'R1 (gateway)', sub: '192.168.1.1' }], links: [{ a: 'pc', b: 'sw', pb: 'Fa0/1' }, { a: 'sw', b: 'r', pa: 'G0/1' }] },
    addressing: [['Admin-PC', 'NIC', '192.168.1.10', '255.255.255.0', '192.168.1.1'], ['SW1', 'VLAN 1', '192.168.1.2', '255.255.255.0', '192.168.1.1'], ['R1', 'G0/0', '192.168.1.1', '255.255.255.0', '—']],
    prereq: ['Place a 2960 switch and a PC, connect PC to Fa0/1 (copper straight-through).', 'Set the PC IP: Desktop → IP Configuration → 192.168.1.10 / 255.255.255.0, gateway 192.168.1.1. (The router is optional in this lab.)'],
    tasks: [
      { t: 'Hostname, passwords and banner', on: 'SW1', why: '<code>enable secret</code> is stored hashed. <code>service password-encryption</code> hides the other passwords in the config.',
        cmd: `Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# enable secret Class123!
SW1(config)# service password-encryption
SW1(config)# no ip domain-lookup
SW1(config)# banner motd #Authorized access only!#
SW1(config)# line console 0
SW1(config-line)# password Cons0le!
SW1(config-line)# login
SW1(config-line)# logging synchronous
SW1(config-line)# exec-timeout 10 0
SW1(config-line)# exit` },
      { t: 'Management IP address', on: 'SW1', why: 'A Layer-2 switch has no IP on its ports. You give it one on a <b>VLAN interface (SVI)</b> so you can reach it remotely.',
        cmd: `SW1(config)# interface vlan 1
SW1(config-if)# ip address 192.168.1.2 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# ip default-gateway 192.168.1.1`,
        verify: 'SW1# show ip interface brief', expect: `Interface              IP-Address      OK? Method Status   Protocol
Vlan1                  192.168.1.2     YES manual up       up
FastEthernet0/1        unassigned      YES unset  up       up` },
      { t: 'Enable SSH v2 (disable Telnet)', on: 'SW1', why: 'Telnet sends passwords in clear text. SSH encrypts the session. RSA keys need a hostname and a domain name first.',
        cmd: `SW1(config)# ip domain-name lab.local
SW1(config)# crypto key generate rsa
How many bits in the modulus [512]: 2048
SW1(config)# ip ssh version 2
SW1(config)# username admin privilege 15 secret Adm1n!
SW1(config)# line vty 0 15
SW1(config-line)# login local
SW1(config-line)# transport input ssh
SW1(config-line)# exit`,
        verify: 'SW1# show ip ssh', expect: 'SSH Enabled - version 2.0' },
      { t: 'Secure unused ports', on: 'SW1', why: 'Nobody can plug a rogue device into a port that is shut down and in an unused VLAN.',
        cmd: `SW1(config)# vlan 999
SW1(config-vlan)# name UNUSED
SW1(config-vlan)# exit
SW1(config)# interface range fa0/2 - 24
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 999
SW1(config-if-range)# shutdown
SW1(config-if-range)# exit
SW1(config)# interface fa0/1
SW1(config-if)# description Admin-PC
SW1(config-if)# switchport mode access
SW1(config-if)# spanning-tree portfast`,
        verify: 'SW1# show interfaces status', expect: 'Fa0/1  Admin-PC   connected   1 ...\nFa0/2              disabled  999 ...' },
      { t: 'Save the configuration', on: 'SW1', why: 'Without saving, everything is lost on reboot.',
        cmd: `SW1(config)# end
SW1# copy running-config startup-config
Destination filename [startup-config]? <Enter>` },
      { t: 'Test SSH from the PC', on: 'Admin-PC', why: 'Proves the management IP, VTY lines and user account work.',
        cmd: `C:\\> ping 192.168.1.2
C:\\> ssh -l admin 192.168.1.2
Password: Adm1n!
SW1#`, verify: 'SW1# show users', expect: '   Line       User       Host(s)              Idle       Location\n*  1 vty 0     admin      idle                 00:00:00 192.168.1.10' }
    ],
    test: { text: 'Final test: SSH from Admin-PC to SW1', path: ['pc', 'sw'], label: 'SSH :22', back: 'SW1#' },
    trouble: [
      ['Ping to 192.168.1.2 fails', 'Check <code>show ip interface brief</code>: Vlan1 must be up/up (no shutdown). PC and switch must be in the same subnet.'],
      ['“% Please define a domain-name first”', 'Run <code>ip domain-name lab.local</code> before generating RSA keys.'],
      ['SSH: “Connection refused”', 'Keys not generated, or <code>transport input ssh</code> missing on line vty.'],
      ['Login fails over SSH', 'VTY lines need <code>login local</code> and a <code>username</code> must exist.']
    ]
  });

  /* ===================================================== */
  const OFFICE = {
    w: 760, h: 390,
    zones: [{ x: 30, y: 230, w: 300, h: 140, label: 'VLAN 10 · SALES · 192.168.10.0/24', color: 'blue', bottom: true }, { x: 430, y: 230, w: 300, h: 140, label: 'VLAN 20 · HR · 192.168.20.0/24', color: 'orange', bottom: true }],
    nodes: [
      { id: 'r1', type: 'router', x: 380, y: 45, label: 'R1', sub: 'gw .10.1 / .20.1' },
      { id: 'sw', type: 'switch', x: 380, y: 175, label: 'SW1' },
      { id: 'p1', type: 'pc', x: 110, y: 285, label: 'PC1', sub: 'DHCP', color: 'blue' },
      { id: 'p2', type: 'pc', x: 250, y: 285, label: 'PC2', sub: 'DHCP', color: 'blue' },
      { id: 'p3', type: 'pc', x: 510, y: 285, label: 'PC3', sub: 'DHCP', color: 'orange' },
      { id: 'p4', type: 'pc', x: 650, y: 285, label: 'PC4', sub: 'DHCP', color: 'orange' }
    ],
    links: [{ a: 'r1', b: 'sw', cls: 'trunk', label: 'R1 G0/0 ⇄ SW1 G0/1 (802.1Q trunk)', lx: 170, ly: 14 },{ a: 'sw', b: 'p1', cls: 'v-blue', pa: 'Fa0/1' }, { a: 'sw', b: 'p2', cls: 'v-blue', pa: 'Fa0/2' }, { a: 'sw', b: 'p3', cls: 'v-orange', pa: 'Fa0/11' }, { a: 'sw', b: 'p4', cls: 'v-orange', pa: 'Fa0/12' }]
  };
  LABS.push({
    id: 'office-vlan',
    title: 'Small office: VLANs, trunk, router-on-a-stick & DHCP',
    level: 'Intermediate', minutes: 50, tools: 'Packet Tracer',
    lessons: ['vlan', 'intervlan', 'dhcp'],
    summary: 'Build a complete office network: two departments in separate VLANs that get IPs automatically and can talk through the router.',
    goal: 'Sales and HR are separated into VLAN 10 and VLAN 20. PCs get addresses by DHCP from R1. Inter-VLAN routing works.',
    topo: OFFICE,
    addressing: [['R1', 'G0/0.10', '192.168.10.1', '255.255.255.0', '—'], ['R1', 'G0/0.20', '192.168.20.1', '255.255.255.0', '—'], ['PC1, PC2', 'NIC', 'DHCP .11–.254', '255.255.255.0', '192.168.10.1'], ['PC3, PC4', 'NIC', 'DHCP .11–.254', '255.255.255.0', '192.168.20.1']],
    prereq: ['Devices: 1× 2911 router, 1× 2960 switch, 4× PC.', 'Cables: R1 G0/0 → SW1 G0/1. PC1 Fa0/1, PC2 Fa0/2, PC3 Fa0/11, PC4 Fa0/12.'],
    tasks: [
      { t: 'Create the VLANs', on: 'SW1', why: 'Each department gets its own broadcast domain.',
        cmd: `Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name SALES
SW1(config-vlan)# vlan 20
SW1(config-vlan)# name HR
SW1(config-vlan)# exit`, verify: 'SW1# show vlan brief', expect: '10   SALES      active\n20   HR         active' },
      { t: 'Assign access ports', on: 'SW1', why: 'Ports to PCs are access ports in exactly one VLAN.',
        cmd: `SW1(config)# interface range fa0/1 - 10
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# exit
SW1(config)# interface range fa0/11 - 20
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 20
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# exit`, verify: 'SW1# show vlan brief', expect: '10   SALES   active   Fa0/1, Fa0/2, ... Fa0/10\n20   HR      active   Fa0/11, Fa0/12, ... Fa0/20' },
      { t: 'Configure the trunk to the router', on: 'SW1', why: 'One cable carries both VLANs to the router, tagged with 802.1Q.',
        cmd: `SW1(config)# interface g0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# end
SW1# copy running-config startup-config`, verify: 'SW1# show interfaces trunk', expect: 'Port    Mode   Encapsulation  Status     Native vlan\nGig0/1  on     802.1q         trunking   1\n\nPort    Vlans allowed on trunk\nGig0/1  10,20' },
      { t: 'Router sub-interfaces (gateways)', on: 'R1', why: 'Each sub-interface is the default gateway of one VLAN. The physical interface must be <code>no shutdown</code>.',
        cmd: `Router(config)# hostname R1
R1(config)# interface g0/0
R1(config-if)# no shutdown
R1(config-if)# interface g0/0.10
R1(config-subif)# encapsulation dot1q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# interface g0/0.20
R1(config-subif)# encapsulation dot1q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
R1(config-subif)# exit`, verify: 'R1# show ip interface brief', expect: 'GigabitEthernet0/0      unassigned     YES unset  up   up\nGigabitEthernet0/0.10   192.168.10.1   YES manual up   up\nGigabitEthernet0/0.20   192.168.20.1   YES manual up   up' },
      { t: 'DHCP server on the router', on: 'R1', why: 'Exclude the first addresses (gateway, printers, servers), then one pool per VLAN.',
        cmd: `R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.10
R1(config)# ip dhcp excluded-address 192.168.20.1 192.168.20.10
R1(config)# ip dhcp pool SALES
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# dns-server 8.8.8.8
R1(dhcp-config)# exit
R1(config)# ip dhcp pool HR
R1(dhcp-config)# network 192.168.20.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.20.1
R1(dhcp-config)# dns-server 8.8.8.8
R1(dhcp-config)# end
R1# copy running-config startup-config` },
      { t: 'Set the PCs to DHCP', on: 'PC1–PC4', why: 'Each PC should get an address from its own VLAN pool.',
        gui: ['Click each PC → Desktop → IP Configuration → select <b>DHCP</b>.', 'PC1/PC2 should show 192.168.10.11, .12 · PC3/PC4 192.168.20.11, .12.'],
        verify: 'R1# show ip dhcp binding', expect: 'IP address       Client-ID/Hardware address   Lease expiration   Type\n192.168.10.11    0001.4366.A1B2               --                 Automatic\n192.168.20.11    0060.2F3C.9D01               --                 Automatic' },
      { t: 'Test inter-VLAN routing', on: 'PC1', why: 'Traffic from VLAN 10 to VLAN 20 must pass the router.',
        cmd: `C:\\> ipconfig
C:\\> ping 192.168.10.1
C:\\> ping 192.168.20.11
C:\\> tracert 192.168.20.11`, expect: 'Tracing route to 192.168.20.11\n  1   0 ms  192.168.10.1\n  2   0 ms  192.168.20.11' }
    ],
    test: { text: 'Final test: PC1 (VLAN 10) pings PC3 (VLAN 20)', path: ['p1', 'sw', 'r1', 'sw', 'p3'], label: 'ping', seg: [{}, { tag: 'VLAN 10' }, { tag: 'VLAN 20' }, {}], back: 'Reply' },
    trouble: [
      ['PC gets 169.254.x.x', 'DHCP failed: check the PC is in the right VLAN, the trunk is up, and the pool network matches the sub-interface.'],
      ['Sub-interfaces are down', 'The physical <code>interface g0/0</code> needs <code>no shutdown</code>.'],
      ['Ping to own gateway fails', 'Wrong VLAN number in <code>encapsulation dot1q</code> or the VLAN is not allowed on the trunk.'],
      ['Ping to other VLAN fails, gateway works', 'Check the PC’s default gateway and the other PC’s gateway (reply path!).']
    ]
  });

  /* ===================================================== */
  const THREE = {
    w: 860, h: 230,
    nodes: [
      { id: 'pc1', type: 'pc', x: 60, y: 110, label: 'PC1', sub: '10.1.1.10' },
      { id: 'r1', type: 'router', x: 240, y: 110, label: 'R1' },
      { id: 'r2', type: 'router', x: 430, y: 110, label: 'R2' },
      { id: 'r3', type: 'router', x: 620, y: 110, label: 'R3' },
      { id: 'pc2', type: 'pc', x: 800, y: 110, label: 'PC2', sub: '10.3.3.10' }
    ],
    links: [
      { a: 'pc1', b: 'r1', label: '10.1.1.0/24', pb: 'G0/0' }, { a: 'r1', b: 'r2', label: '10.0.12.0/30', pa: 'G0/1', pb: 'G0/0' },
      { a: 'r2', b: 'r3', label: '10.0.23.0/30', pa: 'G0/1', pb: 'G0/0' }, { a: 'r3', b: 'pc2', label: '10.3.3.0/24', pa: 'G0/1' }
    ]
  };
  const THREE_ADDR = [['R1', 'G0/0', '10.1.1.1', '255.255.255.0', '—'], ['R1', 'G0/1', '10.0.12.1', '255.255.255.252', '—'], ['R2', 'G0/0', '10.0.12.2', '255.255.255.252', '—'], ['R2', 'G0/1', '10.0.23.1', '255.255.255.252', '—'], ['R3', 'G0/0', '10.0.23.2', '255.255.255.252', '—'], ['R3', 'G0/1', '10.3.3.1', '255.255.255.0', '—'], ['PC1', 'NIC', '10.1.1.10', '255.255.255.0', '10.1.1.1'], ['PC2', 'NIC', '10.3.3.10', '255.255.255.0', '10.3.3.1']];
  const THREE_IF = `! R1
R1(config)# interface g0/0
R1(config-if)# ip address 10.1.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# interface g0/1
R1(config-if)# ip address 10.0.12.1 255.255.255.252
R1(config-if)# no shutdown
! R2
R2(config)# interface g0/0
R2(config-if)# ip address 10.0.12.2 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# interface g0/1
R2(config-if)# ip address 10.0.23.1 255.255.255.252
R2(config-if)# no shutdown
! R3
R3(config)# interface g0/0
R3(config-if)# ip address 10.0.23.2 255.255.255.252
R3(config-if)# no shutdown
R3(config-if)# interface g0/1
R3(config-if)# ip address 10.3.3.1 255.255.255.0
R3(config-if)# no shutdown`;
  LABS.push({
    id: 'static-routing',
    title: 'Static & default routing between 3 routers',
    level: 'Intermediate', minutes: 40, tools: 'Packet Tracer',
    lessons: ['routing'],
    summary: 'Connect two LANs through three routers using static routes and default routes.',
    goal: 'PC1 (10.1.1.0/24) can ping PC2 (10.3.3.0/24) across R1–R2–R3.',
    topo: THREE, addressing: THREE_ADDR,
    prereq: ['3× 2911 routers, 2× PC. Connect with copper cross-over or auto cables as shown.', 'Set hostnames R1, R2, R3. Set PC IPs and gateways from the table.'],
    tasks: [
      { t: 'Configure all interfaces', on: 'R1, R2, R3', why: 'Routers learn connected networks automatically once interfaces are up with an IP.', cmd: THREE_IF, verify: 'R2# show ip route connected', expect: 'C    10.0.12.0/30 is directly connected, GigabitEthernet0/0\nC    10.0.23.0/30 is directly connected, GigabitEthernet0/1' },
      { t: 'Default routes on the edge routers', on: 'R1, R3', why: 'R1 and R3 are <b>stub</b> routers — everything not local goes toward R2. A default route is enough.',
        cmd: `R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.12.2
R3(config)# ip route 0.0.0.0 0.0.0.0 10.0.23.1` },
      { t: 'Static routes on the middle router', on: 'R2', why: 'R2 must know exactly where each LAN is.',
        cmd: `R2(config)# ip route 10.1.1.0 255.255.255.0 10.0.12.1
R2(config)# ip route 10.3.3.0 255.255.255.0 10.0.23.2`, verify: 'R2# show ip route static', expect: 'S    10.1.1.0/24 [1/0] via 10.0.12.1\nS    10.3.3.0/24 [1/0] via 10.0.23.2' },
      { t: 'Test end to end and save', on: 'PC1 + all routers', why: 'traceroute shows each hop.',
        cmd: `C:\\> ping 10.3.3.10
C:\\> tracert 10.3.3.10
R1# copy running-config startup-config`, expect: '  1   10.1.1.1\n  2   10.0.12.2\n  3   10.0.23.2\n  4   10.3.3.10' }
    ],
    test: { text: 'Final test: PC1 pings PC2 across three routers', path: ['pc1', 'r1', 'r2', 'r3', 'pc2'], label: 'ping 10.3.3.10', back: 'Reply' },
    trouble: [
      ['First ping has timeouts, then works', 'Normal: ARP needs to resolve on each hop.'],
      ['“Request timed out” always', 'Check routes on EVERY router in BOTH directions. Use <code>traceroute</code> to see where it stops.'],
      ['“Destination host unreachable” from a router', 'That router has no route to the destination — add the missing route.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'ospf',
    title: 'OSPF single area',
    level: 'Intermediate', minutes: 35, tools: 'Packet Tracer',
    lessons: ['ospf'],
    summary: 'Replace static routes with OSPF so routers learn every network automatically.',
    goal: 'All three routers run OSPF area 0 and learn both LANs dynamically.',
    topo: THREE, addressing: THREE_ADDR,
    prereq: ['Same topology as the static routing lab (interfaces configured).', 'If you did the static lab, remove the static routes first.'],
    tasks: [
      { t: 'Remove static routes (if present)', on: 'R1, R2, R3', why: 'Static routes (AD 1) would be preferred over OSPF (AD 110).',
        cmd: `R1(config)# no ip route 0.0.0.0 0.0.0.0 10.0.12.2
R2(config)# no ip route 10.1.1.0 255.255.255.0 10.0.12.1
R2(config)# no ip route 10.3.3.0 255.255.255.0 10.0.23.2
R3(config)# no ip route 0.0.0.0 0.0.0.0 10.0.23.1` },
      { t: 'Enable OSPF on every router', on: 'R1, R2, R3', why: 'The <code>network</code> command uses a <b>wildcard mask</b> and turns OSPF on for matching interfaces. <code>passive-interface</code> stops hellos toward the PCs.',
        cmd: `R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.1.1.0 0.0.0.255 area 0
R1(config-router)# network 10.0.12.0 0.0.0.3 area 0
R1(config-router)# passive-interface g0/0

R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# network 10.0.12.0 0.0.0.3 area 0
R2(config-router)# network 10.0.23.0 0.0.0.3 area 0

R3(config)# router ospf 1
R3(config-router)# router-id 3.3.3.3
R3(config-router)# network 10.0.23.0 0.0.0.3 area 0
R3(config-router)# network 10.3.3.0 0.0.0.255 area 0
R3(config-router)# passive-interface g0/1`,
        verify: 'R2# show ip ospf neighbor', expect: 'Neighbor ID   Pri  State        Dead Time   Address      Interface\n1.1.1.1         1  FULL/BDR     00:00:35    10.0.12.1    Gi0/0\n3.3.3.3         1  FULL/DR      00:00:33    10.0.23.2    Gi0/1' },
      { t: 'Check the learned routes', on: 'R1', why: 'Routes marked <b>O</b> came from OSPF. [110/3] = AD 110, cost 3.',
        cmd: 'R1# show ip route ospf', expect: 'O    10.0.23.0/30 [110/2] via 10.0.12.2, GigabitEthernet0/1\nO    10.3.3.0/24  [110/3] via 10.0.12.2, GigabitEthernet0/1' },
      { t: 'Test and save', on: 'PC1', cmd: `C:\\> ping 10.3.3.10
R1# copy running-config startup-config` }
    ],
    test: { text: 'Final test: OSPF-learned path PC1 → PC2', path: ['pc1', 'r1', 'r2', 'r3', 'pc2'], label: 'ping', back: 'Reply' },
    trouble: [
      ['No OSPF neighbors', 'Both ends must be in the same subnet and area, with matching hello/dead timers. Check <code>show ip ospf interface brief</code>.'],
      ['Neighbor stuck in EXSTART/EXCHANGE', 'MTU mismatch between the two interfaces.'],
      ['LAN not advertised', 'Wrong wildcard mask in the network command (use 0.0.0.255 for /24).'],
      ['Duplicate router ID message', 'Set unique <code>router-id</code> values, then <code>clear ip ospf process</code>.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'nat-internet',
    title: 'Internet access with NAT/PAT',
    level: 'Intermediate', minutes: 35, tools: 'Packet Tracer',
    lessons: ['nat', 'routing'],
    summary: 'Give a private LAN Internet access through one public IP, and publish a web server with port forwarding.',
    goal: 'PCs in 192.168.1.0/24 reach the “Internet” server 8.8.8.8 through R1 using PAT.',
    topo: {
      w: 820, h: 240,
      zones: [{ x: 20, y: 40, w: 360, h: 180, label: 'Inside (private)', color: 'blue' }, { x: 470, y: 40, w: 330, h: 180, label: 'Outside (ISP / Internet)', color: 'purple' }],
      nodes: [{ id: 'pc', type: 'pc', x: 80, y: 130, label: 'PC1', sub: '192.168.1.10' }, { id: 'sw', type: 'switch', x: 200, y: 130, label: 'SW1' }, { id: 'r1', type: 'router', x: 330, y: 130, label: 'R1 (NAT)' }, { id: 'isp', type: 'router', x: 560, y: 130, label: 'ISP' }, { id: 'web', type: 'server', x: 730, y: 130, label: 'Internet server', sub: '8.8.8.8' }],
      links: [{ a: 'pc', b: 'sw' }, { a: 'sw', b: 'r1', pb: 'G0/0' }, { a: 'r1', b: 'isp', label: '203.0.113.0/30', pa: 'G0/1', pb: 'G0/0' }, { a: 'isp', b: 'web', label: '8.8.8.0/24', pa: 'G0/1' }]
    },
    addressing: [['R1', 'G0/0 (inside)', '192.168.1.1', '255.255.255.0', '—'], ['R1', 'G0/1 (outside)', '203.0.113.2', '255.255.255.252', '—'], ['ISP', 'G0/0', '203.0.113.1', '255.255.255.252', '—'], ['ISP', 'G0/1', '8.8.8.1', '255.255.255.0', '—'], ['Internet server', 'NIC', '8.8.8.8', '255.255.255.0', '8.8.8.1'], ['PC1', 'NIC', '192.168.1.10', '255.255.255.0', '192.168.1.1']],
    prereq: ['2× 2911 routers (R1, ISP), 1 switch, 1 PC, 1 Server.', 'The ISP router does NOT get a route to 192.168.1.0 — just like the real Internet.'],
    tasks: [
      { t: 'Interfaces and default route', on: 'R1, ISP', why: 'R1 sends all unknown traffic to the ISP.',
        cmd: `R1(config)# interface g0/0
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# interface g0/1
R1(config-if)# ip address 203.0.113.2 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1

ISP(config)# interface g0/0
ISP(config-if)# ip address 203.0.113.1 255.255.255.252
ISP(config-if)# no shutdown
ISP(config-if)# interface g0/1
ISP(config-if)# ip address 8.8.8.1 255.255.255.0
ISP(config-if)# no shutdown` },
      { t: 'Prove it fails without NAT', on: 'PC1', why: 'The ping reaches 8.8.8.8, but the reply to 192.168.1.10 has no route on the ISP router — private IPs are not routed on the Internet.',
        cmd: 'C:\\> ping 8.8.8.8', expect: 'Request timed out.' },
      { t: 'Configure PAT (NAT overload)', on: 'R1', why: 'Mark inside/outside, choose which addresses to translate (ACL 1), and translate them to the outside interface IP.',
        cmd: `R1(config)# interface g0/0
R1(config-if)# ip nat inside
R1(config-if)# interface g0/1
R1(config-if)# ip nat outside
R1(config-if)# exit
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface g0/1 overload`,
        verify: 'C:\\> ping 8.8.8.8\nR1# show ip nat translations', expect: 'Pro  Inside global      Inside local       Outside local   Outside global\nicmp 203.0.113.2:1     192.168.1.10:1     8.8.8.8:1       8.8.8.8:1' },
      { t: 'Optional: publish an inside web server (port forwarding)', on: 'R1', why: 'Static NAT lets Internet users reach a server inside on port 80.',
        cmd: 'R1(config)# ip nat inside source static tcp 192.168.1.50 80 203.0.113.2 80', gui: ['Add a Server 192.168.1.50 (gw 192.168.1.1) with HTTP on.', 'From the Internet server: Desktop → Web Browser → http://203.0.113.2'] }
    ],
    test: { text: 'Final test: PC1 browses 8.8.8.8 through PAT', path: ['pc', 'sw', 'r1', 'isp', 'web'], label: 'src 192.168.1.10', seg: [{}, {}, { label: 'src 203.0.113.2' }, { label: 'src 203.0.113.2' }], back: 'Reply' },
    trouble: [
      ['No translations appear', 'Check <code>ip nat inside/outside</code> on the correct interfaces and that ACL 1 matches the LAN.'],
      ['Translations appear but no reply', 'Missing default route on R1, or the ISP interface is down.'],
      ['Port forward not working', 'Server needs the correct default gateway (192.168.1.1).']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'acl',
    title: 'Secure the office with ACLs',
    level: 'Intermediate', minutes: 30, tools: 'Packet Tracer',
    lessons: ['acl'],
    summary: 'Block HR from the Sales VLAN and allow SSH to the router only from one admin PC.',
    goal: 'Using the small-office lab: HR (VLAN 20) cannot reach Sales (VLAN 10); only PC1 can SSH to R1.',
    topo: OFFICE,
    prereq: ['Finish the “Small office: VLANs…” lab first (everything pings).', 'Configure SSH on R1 as in the switch lab (hostname, domain name, RSA keys, user, vty).'],
    tasks: [
      { t: 'Standard ACL: block HR → Sales', on: 'R1', why: 'Standard ACLs match only the source, so place them <b>close to the destination</b>: outbound on the Sales gateway.',
        cmd: `R1(config)# access-list 10 remark Block HR to Sales
R1(config)# access-list 10 deny 192.168.20.0 0.0.0.255
R1(config)# access-list 10 permit any
R1(config)# interface g0/0.10
R1(config-subif)# ip access-group 10 out`,
        verify: 'PC3: C:\\> ping 192.168.10.11', expect: 'Reply from 192.168.20.1: Destination host unreachable.' },
      { t: 'Restrict SSH to the router', on: 'R1', why: '<code>access-class</code> filters who may open VTY (SSH) sessions to the device itself.',
        cmd: `R1(config)# ip access-list standard MGMT
R1(config-std-nacl)# permit host 192.168.10.11
R1(config-std-nacl)# exit
R1(config)# line vty 0 4
R1(config-line)# access-class MGMT in` },
      { t: 'Verify the counters', on: 'R1', why: 'Matches increase each time a rule is hit — the best way to see if an ACL works.',
        cmd: 'R1# show access-lists', expect: 'Standard IP access list 10\n    10 deny 192.168.20.0, wildcard bits 0.0.0.255 (4 match(es))\n    20 permit any (8 match(es))\nStandard IP access list MGMT\n    10 permit host 192.168.10.11 (2 match(es))' }
    ],
    test: { text: 'Final test: HR PC3 tries to reach Sales PC1 → denied', path: ['p3', 'sw', 'r1'], label: 'HR → Sales', drop: true },
    trouble: [
      ['Everything is blocked now', 'You forgot <code>permit any</code> — every ACL ends with an implicit deny.'],
      ['ACL has no matches', 'Applied on the wrong interface or direction. Check <code>show ip interface g0/0.10</code>.'],
      ['Locked yourself out of SSH', 'Use the console cable and fix the MGMT list.']
    ]
  });

  /* ===================================================== */
  const ADNET = {
    w: 760, h: 230,
    zones: [{ x: 40, y: 30, w: 680, h: 180, label: 'VirtualBox NAT Network “LabNet” 192.168.50.0/24 · domain corp.local', color: 'blue' }],
    nodes: [{ id: 'dc', type: 'server', x: 200, y: 125, label: 'DC1', sub: '192.168.50.10 · AD DS + DNS' }, { id: 'gw', type: 'router', x: 380, y: 125, label: 'VirtualBox gateway', sub: '192.168.50.1' }, { id: 'cl', type: 'pc', x: 560, y: 125, label: 'CLIENT1', sub: 'Windows 11 Ent/Pro' }],
    links: [{ a: 'dc', b: 'gw' }, { a: 'gw', b: 'cl' }]
  };
  LABS.push({
    id: 'ad-setup',
    title: 'Install Active Directory & join a Windows PC',
    level: 'Beginner', minutes: 60, tools: 'Windows Server VM',
    lessons: ['ad-intro', 'ad-dns'],
    summary: 'Turn a fresh Windows Server into a domain controller, create users, and join a Windows 11 client to the domain.',
    goal: 'Domain corp.local with DC1 as domain controller + DNS. CLIENT1 is joined and user Alice can log on.',
    topo: ADNET,
    addressing: [['DC1', 'Ethernet', '192.168.50.10', '255.255.255.0', '192.168.50.1 · DNS 192.168.50.10'], ['CLIENT1', 'Ethernet', '192.168.50.20 (or DHCP later)', '255.255.255.0', '192.168.50.1 · DNS 192.168.50.10']],
    prereq: ['Finish “Set up your practice lab” (two VMs on LabNet).', 'Windows client must be <b>Pro, Enterprise or Education</b> — Home cannot join a domain.', 'In production use a domain you own (e.g. ad.company.com). <code>.local</code> is fine for a lab.'],
    tasks: [
      { t: 'Static IP, DNS and computer name on the server', on: 'DC1', why: 'A domain controller must have a <b>static IP</b>, and its DNS must point to <b>itself</b> because it will become the DNS server.',
        gui: ['Server Manager → Local Server → click the Ethernet link → adapter Properties → IPv4.', 'IP 192.168.50.10, mask 255.255.255.0, gateway 192.168.50.1, preferred DNS 192.168.50.10.', 'Server Manager → Local Server → Computer name → Change → <b>DC1</b> → restart.'],
        cmd: `PS C:\\> New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.50.10 -PrefixLength 24 -DefaultGateway 192.168.50.1
PS C:\\> Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 192.168.50.10
PS C:\\> Rename-Computer -NewName DC1 -Restart`, cmdTitle: 'PowerShell (as Administrator)' },
      { t: 'Install the AD DS role', on: 'DC1', why: 'Installs the binaries and management tools. It does not create a domain yet.',
        gui: ['Server Manager → Manage → <b>Add Roles and Features</b>.', 'Role-based installation → select DC1 → tick <b>Active Directory Domain Services</b> → Add Features → Next → Install.'],
        cmd: 'PS C:\\> Install-WindowsFeature AD-Domain-Services -IncludeManagementTools', cmdTitle: 'PowerShell' },
      { t: 'Promote to a domain controller (new forest)', on: 'DC1', why: 'Creates the forest, the domain corp.local and the AD-integrated DNS zone. The DSRM password is for disaster recovery — write it down.',
        gui: ['Server Manager → yellow flag → <b>Promote this server to a domain controller</b>.', 'Add a new forest → Root domain name: <b>corp.local</b>.', 'Keep DNS server + Global Catalog ticked → enter a DSRM password.', 'Ignore the DNS delegation warning → NetBIOS name CORP → Next → Install. The server restarts.'],
        cmd: `PS C:\\> Install-ADDSForest -DomainName "corp.local" -DomainNetbiosName "CORP" -InstallDns -SafeModeAdministratorPassword (Read-Host -AsSecureString "DSRM password")`, cmdTitle: 'PowerShell',
        verify: 'PS C:\\> Get-ADDomain | Select DNSRoot, PDCEmulator\nC:\\> dcdiag /q', expect: 'DNSRoot    PDCEmulator\n-------    -----------\ncorp.local DC1.corp.local\n(dcdiag /q prints nothing when all tests pass)' },
      { t: 'DNS forwarders for Internet names', on: 'DC1', why: 'Clients use only DC1 for DNS. DC1 forwards unknown (Internet) names to public DNS.',
        gui: ['Tools → DNS → right-click DC1 → Properties → <b>Forwarders</b> → Edit → add 1.1.1.1 and 8.8.8.8.'],
        cmd: 'PS C:\\> Add-DnsServerForwarder -IPAddress 1.1.1.1, 8.8.8.8', cmdTitle: 'PowerShell', verify: 'PS C:\\> Resolve-DnsName microsoft.com -Server 192.168.50.10' },
      { t: 'Create OUs, a user and a group', on: 'DC1', why: 'Organize objects so you can delegate and link Group Policy later.',
        gui: ['Tools → <b>Active Directory Users and Computers</b> (dsa.msc).', 'Right-click corp.local → New → Organizational Unit: <b>Corp</b>, then inside it <b>Sales</b>, <b>HR</b>, <b>Workstations</b>, <b>Groups</b>.', 'In Sales: New → User → Alice Tan, logon alice → set password → untick “must change password” for the lab.'],
        cmd: `PS C:\\> New-ADOrganizationalUnit -Name Corp -Path "DC=corp,DC=local"
PS C:\\> "Sales","HR","Workstations","Groups" | ForEach-Object { New-ADOrganizationalUnit -Name $_ -Path "OU=Corp,DC=corp,DC=local" }
PS C:\\> New-ADUser -Name "Alice Tan" -SamAccountName alice -UserPrincipalName alice@corp.local -Path "OU=Sales,OU=Corp,DC=corp,DC=local" -AccountPassword (Read-Host -AsSecureString) -Enabled $true
PS C:\\> New-ADUser -Name "Bob Cruz" -SamAccountName bob -UserPrincipalName bob@corp.local -Path "OU=HR,OU=Corp,DC=corp,DC=local" -AccountPassword (Read-Host -AsSecureString) -Enabled $true`, cmdTitle: 'PowerShell' },
      { t: 'Point the client to the DC and join the domain', on: 'CLIENT1', why: 'The client finds the domain through DNS SRV records on DC1. Wrong DNS = join fails.',
        gui: ['Settings → Network → Ethernet → IP assignment Edit → Manual: 192.168.50.20/24, gateway 192.168.50.1, DNS <b>192.168.50.10</b>.', 'Test: <code>nslookup corp.local</code> must answer 192.168.50.10.', 'Settings → System → About → <b>Domain or workgroup</b> → Change → Domain: <b>corp.local</b> → enter CORP\\Administrator credentials → restart.'],
        cmd: `PS C:\\> Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 192.168.50.10
PS C:\\> nslookup corp.local
PS C:\\> Add-Computer -DomainName corp.local -OUPath "OU=Workstations,OU=Corp,DC=corp,DC=local" -Credential CORP\\Administrator -Restart`, cmdTitle: 'PowerShell on CLIENT1' },
      { t: 'Log on as a domain user', on: 'CLIENT1', why: 'Proves Kerberos authentication against DC1.',
        gui: ['At the sign-in screen choose <b>Other user</b> → <code>CORP\\alice</code> + password.'],
        cmd: `C:\\> whoami
C:\\> echo %logonserver%
C:\\> klist`, expect: 'corp\\alice\n\\\\DC1\nCached Tickets: (2)  #0> Client: alice @ CORP.LOCAL  Server: krbtgt/CORP.LOCAL ...' }
    ],
    test: { text: 'Final test: Alice logs on from CLIENT1 (Kerberos to DC1)', path: ['cl', 'gw', 'dc'], label: 'AS-REQ alice', back: 'TGT ✓' },
    trouble: [
      ['“An Active Directory Domain Controller could not be contacted”', 'CLIENT1 DNS is not 192.168.50.10. Fix DNS, then <code>ipconfig /flushdns</code>.'],
      ['“The specified domain either does not exist”', 'Typo in the domain name, or DC1 promotion did not finish. Run <code>dcdiag</code> on DC1.'],
      ['Cannot join: “Windows Home edition”', 'Upgrade to Pro or use Windows 11 Enterprise evaluation.'],
      ['Time skew errors at logon', 'Run <code>w32tm /resync</code> on the client; check the DC clock and time zone.'],
      ['No Internet on the client', 'DNS forwarders missing on DC1, or the NAT Network gateway is wrong.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'win-dhcp',
    title: 'Windows Server DHCP',
    level: 'Beginner', minutes: 25, tools: 'Windows Server VM',
    lessons: ['dhcp'],
    summary: 'Install the DHCP role on DC1, authorize it in AD, create a scope with options and a reservation.',
    goal: 'CLIENT1 receives IP, gateway, DNS 192.168.50.10 and domain name from DC1 automatically.',
    topo: ADNET,
    prereq: ['Finish the Active Directory lab.', '<b>Turn off every other DHCP server</b> on the network (VirtualBox LabNet DHCP must be OFF).'],
    tasks: [
      { t: 'Install the DHCP role', on: 'DC1',
        gui: ['Server Manager → Add Roles and Features → tick <b>DHCP Server</b> → Install.', 'Click the yellow flag → <b>Complete DHCP configuration</b> → Commit (this authorizes the server in AD and creates security groups).'],
        cmd: `PS C:\\> Install-WindowsFeature DHCP -IncludeManagementTools
PS C:\\> Add-DhcpServerSecurityGroup
PS C:\\> Add-DhcpServerInDC -DnsName dc1.corp.local -IPAddress 192.168.50.10
PS C:\\> Restart-Service DHCPServer`, cmdTitle: 'PowerShell', why: 'In a domain, a Windows DHCP server only hands out addresses after it is <b>authorized</b> in AD — this stops rogue Windows DHCP servers.' },
      { t: 'Create a scope with options', on: 'DC1', why: 'Scope = address range. Options = gateway (003), DNS servers (006), DNS domain (015).',
        gui: ['Tools → DHCP → DC1 → IPv4 → right-click → <b>New Scope</b>.', 'Name LAN, range 192.168.50.100–192.168.50.200, mask /24, lease 8 days.', 'Router (default gateway) 192.168.50.1 · Parent domain corp.local · DNS 192.168.50.10 · Activate now.'],
        cmd: `PS C:\\> Add-DhcpServerv4Scope -Name "LAN" -StartRange 192.168.50.100 -EndRange 192.168.50.200 -SubnetMask 255.255.255.0 -State Active
PS C:\\> Set-DhcpServerv4OptionValue -ScopeId 192.168.50.0 -Router 192.168.50.1 -DnsServer 192.168.50.10 -DnsDomain corp.local`, cmdTitle: 'PowerShell' },
      { t: 'Reserve an address for a printer', on: 'DC1', why: 'A reservation always gives the same IP to one MAC address — good for printers and cameras.',
        cmd: 'PS C:\\> Add-DhcpServerv4Reservation -ScopeId 192.168.50.0 -IPAddress 192.168.50.50 -ClientId "00-15-5D-01-02-03" -Name PRINTER1', cmdTitle: 'PowerShell' },
      { t: 'Switch the client to DHCP', on: 'CLIENT1',
        gui: ['Settings → Network → Ethernet → IP assignment → <b>Automatic (DHCP)</b>.'],
        cmd: `C:\\> ipconfig /release
C:\\> ipconfig /renew
C:\\> ipconfig /all`, expect: 'IPv4 Address. . . . : 192.168.50.100(Preferred)\nDefault Gateway . . : 192.168.50.1\nDHCP Server . . . . : 192.168.50.10\nDNS Servers . . . . : 192.168.50.10',
        verify: 'PS C:\\> Get-DhcpServerv4Lease -ScopeId 192.168.50.0' }
    ],
    test: { text: 'Final test: CLIENT1 runs DORA with DC1', path: ['cl', 'gw', 'dc'], label: 'DISCOVER', back: 'ACK .100' },
    trouble: [
      ['Client still gets an address from another range', 'Another DHCP server answers first (VirtualBox NAT Network, home router). Disable it.'],
      ['Scope has a red arrow / server not working', 'Server not authorized: run <code>Add-DhcpServerInDC</code> or authorize in the DHCP console.'],
      ['Clients on another subnet get nothing', 'Configure <code>ip helper-address</code> (DHCP relay) on that subnet’s router.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'file-share',
    title: 'File server: shared folders & permissions (AGDLP)',
    level: 'Intermediate', minutes: 35, tools: 'Windows Server VM',
    lessons: ['ad-groups'],
    summary: 'Create a Sales share where only Sales can write and HR gets “Access denied”.',
    goal: '\\\\DC1\\Sales: Alice (Sales) can modify files; Bob (HR) cannot open it.',
    topo: ADNET,
    prereq: ['Finish the Active Directory lab (users alice in Sales, bob in HR).', 'In production use a separate file server — DC1 is fine for the lab.'],
    tasks: [
      { t: 'Create the groups (AGDLP)', on: 'DC1', why: 'Users → Global group (role) → Domain Local group (access) → permission.',
        cmd: `PS C:\\> New-ADGroup GG_Sales -GroupScope Global -Path "OU=Groups,OU=Corp,DC=corp,DC=local"
PS C:\\> New-ADGroup DL_Sales_Modify -GroupScope DomainLocal -Path "OU=Groups,OU=Corp,DC=corp,DC=local"
PS C:\\> Add-ADGroupMember GG_Sales -Members alice
PS C:\\> Add-ADGroupMember DL_Sales_Modify -Members GG_Sales`, cmdTitle: 'PowerShell' },
      { t: 'Create the folder and NTFS permissions', on: 'DC1', why: 'Remove inherited “Users” access, then grant only the DL group Modify. Administrators keep Full Control.',
        gui: ['Create <code>C:\\Shares\\Sales</code>.', 'Right-click → Properties → Security → Advanced → <b>Disable inheritance</b> → Convert.', 'Remove <b>Users (DC1\\Users)</b>. Add <b>DL_Sales_Modify</b> → Modify.'],
        cmd: `PS C:\\> New-Item C:\\Shares\\Sales -ItemType Directory
C:\\> icacls C:\\Shares\\Sales /inheritance:d
C:\\> icacls C:\\Shares\\Sales /remove:g "BUILTIN\\Users"
C:\\> icacls C:\\Shares\\Sales /grant "CORP\\DL_Sales_Modify:(OI)(CI)M"
C:\\> icacls C:\\Shares\\Sales`, cmdTitle: 'PowerShell / CMD', expect: 'C:\\Shares\\Sales CORP\\DL_Sales_Modify:(OI)(CI)(M)\n                 NT AUTHORITY\\SYSTEM:(OI)(CI)(F)\n                 BUILTIN\\Administrators:(OI)(CI)(F)' },
      { t: 'Share the folder', on: 'DC1', why: 'Share permission = Full for Authenticated Users; NTFS does the real control. Access-based enumeration hides folders users cannot open.',
        gui: ['Properties → Sharing → <b>Advanced Sharing</b> → Share this folder “Sales” → Permissions: remove Everyone, add Authenticated Users = Full Control.'],
        cmd: 'PS C:\\> New-SmbShare -Name Sales -Path C:\\Shares\\Sales -FullAccess "CORP\\Authenticated Users" -FolderEnumerationMode AccessBased', cmdTitle: 'PowerShell' },
      { t: 'Test as Alice and as Bob', on: 'CLIENT1', why: 'Group membership is read at logon — sign out and in again after changing groups.',
        cmd: `C:\\> net use S: \\\\DC1\\Sales
C:\\> echo test > S:\\alice.txt
C:\\> whoami /groups | findstr Sales`, expect: 'Alice: The command completed successfully.\nBob:   System error 5 has occurred. Access is denied.' }
    ],
    test: { text: 'Final test: Alice opens \\\\DC1\\Sales', path: ['cl', 'gw', 'dc'], label: 'SMB :445', back: 'Access ✓' },
    trouble: [
      ['Alice gets Access denied right after adding her', 'She must log off and on (new Kerberos ticket with the new group). Or run <code>klist purge</code>.'],
      ['Everyone can still read', 'Inheritance still on, or “Users” not removed from NTFS.'],
      ['Cannot reach \\\\DC1', 'Check DNS and that File and Printer Sharing firewall rules are enabled.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'gpo-lab',
    title: 'Group Policy: password rules, USB block & drive mapping',
    level: 'Intermediate', minutes: 40, tools: 'Windows Server VM',
    lessons: ['gpo'],
    summary: 'Create and link real GPOs, then verify them on the client with gpresult.',
    goal: 'Domain password policy = 12 characters + lockout. USB storage is blocked on workstations. Sales users get drive S: automatically.',
    topo: ADNET,
    prereq: ['Finish the Active Directory and File server labs.', 'CLIENT1 computer object is in OU=Workstations; Alice is in OU=Sales.'],
    tasks: [
      { t: 'Password & lockout policy (domain level)', on: 'DC1', why: 'Domain password rules only work in a GPO linked to the <b>domain</b> — edit the Default Domain Policy.',
        gui: ['Tools → <b>Group Policy Management</b> (gpmc.msc) → corp.local → right-click <b>Default Domain Policy</b> → Edit.', 'Computer Configuration → Policies → Windows Settings → Security Settings → Account Policies → <b>Password Policy</b>: Minimum length 12, Complexity Enabled.', '<b>Account Lockout Policy</b>: threshold 5 invalid attempts, duration 15 minutes.'],
        cmd: 'PS C:\\> Set-ADDefaultDomainPasswordPolicy -Identity corp.local -MinPasswordLength 12 -ComplexityEnabled $true -LockoutThreshold 5 -LockoutDuration 00:15:00 -LockoutObservationWindow 00:15:00', cmdTitle: 'PowerShell (same result)',
        verify: 'C:\\> net accounts /domain', expect: 'Minimum password length:          12\nLockout threshold:                5' },
      { t: 'Block USB storage on workstations', on: 'DC1', why: 'Computer setting → link to the Workstations OU so servers are not affected.',
        gui: ['GPMC → right-click OU <b>Workstations</b> → Create a GPO and link it here → “Block USB Storage” → Edit.', 'Computer Configuration → Policies → Administrative Templates → System → <b>Removable Storage Access</b> → “All Removable Storage classes: Deny all access” → <b>Enabled</b>.'],
        cmd: `PS C:\\> New-GPO -Name "Block USB Storage" | New-GPLink -Target "OU=Workstations,OU=Corp,DC=corp,DC=local"
PS C:\\> Set-GPRegistryValue -Name "Block USB Storage" -Key "HKLM\\Software\\Policies\\Microsoft\\Windows\\RemovableStorageDevices" -ValueName Deny_All -Type DWord -Value 1`, cmdTitle: 'PowerShell' },
      { t: 'Map drive S: for Sales users', on: 'DC1', why: 'Group Policy Preferences map drives at logon — no scripts needed. User setting → link to the Sales OU.',
        gui: ['GPMC → right-click OU <b>Sales</b> → Create a GPO and link it here → “Map S Drive” → Edit.', 'User Configuration → Preferences → Windows Settings → <b>Drive Maps</b> → New → Mapped Drive.', 'Action <b>Update</b>, Location <code>\\\\DC1\\Sales</code>, Label “Sales”, Drive letter <b>S:</b>, Reconnect ticked → OK.'] },
      { t: 'Apply and verify on the client', on: 'CLIENT1', why: 'Computer policies apply at startup, user policies at logon. gpupdate forces a refresh.',
        cmd: `C:\\> gpupdate /force
C:\\> gpresult /r
C:\\> gpresult /h %USERPROFILE%\\Desktop\\gp.html`, expect: 'COMPUTER SETTINGS\n    Applied Group Policy Objects\n        Block USB Storage\n        Default Domain Policy\nUSER SETTINGS\n    Applied Group Policy Objects\n        Map S Drive',
        gui: ['Sign out and in as Alice → File Explorer shows <b>Sales (S:)</b>.', 'Try changing Alice’s password to “short1” → rejected (less than 12 characters).'] }
    ],
    test: { text: 'Final test: CLIENT1 downloads policies from SYSVOL on DC1', path: ['cl', 'gw', 'dc'], label: 'gpupdate', back: 'GPOs ✓' },
    trouble: [
      ['GPO not in gpresult', 'Linked to the wrong OU (computer vs user!), or the object is not in that OU. Check security filtering.'],
      ['“The processing of Group Policy failed”', 'DNS/DC connectivity problem — check the client DNS and run <code>dcdiag</code>.'],
      ['Drive map missing', 'Drive Maps is a USER setting — the user (not the computer) must be in the linked OU. Log off/on.'],
      ['Password policy linked to an OU does nothing', 'Domain password policy only works at the domain level. Use Fine-Grained Password Policies for groups.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'home-router',
    title: 'Set up a home / small office router & Wi-Fi',
    level: 'Beginner', minutes: 30, tools: 'Real router',
    lessons: ['basics', 'dhcp', 'nat', 'wireless'],
    summary: 'Secure a new Wi-Fi router step by step: admin password, WAN, Wi-Fi security, guest network, DHCP reservation, port forwarding.',
    goal: 'A secure home/SOHO network with WPA3/WPA2 Wi-Fi, a separate guest network and safe defaults.',
    topo: {
      w: 760, h: 240,
      nodes: [{ id: 'isp', type: 'cloud', x: 80, y: 120, label: 'ISP' }, { id: 'modem', type: 'router', x: 240, y: 120, label: 'ISP modem/ONT' }, { id: 'r', type: 'ap', x: 420, y: 120, label: 'Wi-Fi router', sub: '192.168.1.1' }, { id: 'pc', type: 'pc', x: 620, y: 50, label: 'PC', sub: 'DHCP' }, { id: 'lap', type: 'laptop', x: 620, y: 130, label: 'Laptop (Wi-Fi)' }, { id: 'prn', type: 'server', x: 620, y: 205, label: 'Printer', sub: '192.168.1.50' }],
      links: [{ a: 'isp', b: 'modem', cls: 'wan' }, { a: 'modem', b: 'r', label: 'WAN port' }, { a: 'r', b: 'pc' }, { a: 'r', b: 'lap', cls: 'wan' }, { a: 'r', b: 'prn' }]
    },
    prereq: ['Connect the router WAN/Internet port to the ISP modem/ONT.', 'Connect a PC to a LAN port (or the default Wi-Fi printed on the router label).'],
    tasks: [
      { t: 'Open the admin page and change the admin password', on: 'Router', why: 'Default passwords are public. This is the most important step.',
        gui: ['Find the gateway: <code>ipconfig</code> → Default Gateway (often 192.168.0.1 or 192.168.1.1).', 'Open it in a browser (or use the vendor app) and log in with the label credentials.', 'Set a long, unique admin password. Turn OFF <b>remote management</b> from the Internet.'], cmd: 'C:\\> ipconfig', cmdTitle: 'CMD' },
      { t: 'Update the firmware', on: 'Router', why: 'Firmware updates fix security holes. Enable automatic updates if available.', gui: ['System / Administration → Firmware Update → Check → Install. Do not power off during the update.'] },
      { t: 'Internet (WAN) settings', on: 'Router', why: 'Most ISPs use DHCP (automatic). Some fibre/DSL ISPs use PPPoE with a username/password.', gui: ['Internet/WAN → Connection type: <b>Dynamic IP (DHCP)</b> or <b>PPPoE</b> as your ISP says.', 'Check the status page shows a WAN IP and Internet: Connected.'] },
      { t: 'Secure the Wi-Fi', on: 'Router', why: 'Strong encryption and a strong passphrase keep neighbors and attackers out.',
        gui: ['Wireless → set your own <b>SSID</b> (do not include your name or address).', 'Security: <b>WPA3-Personal</b> or <b>WPA2/WPA3 mixed</b> (AES). Never WEP/WPA-TKIP.', 'Passphrase: 12+ characters, e.g. 4 random words.', 'Disable <b>WPS</b>. Channels: 2.4 GHz auto or 1/6/11, 5 GHz auto, 20 MHz width on 2.4 GHz.'] },
      { t: 'Create a guest network', on: 'Router', why: 'Visitors and smart-home gadgets get Internet but cannot see your PCs (client isolation).', gui: ['Guest Network → Enable → own SSID + password → tick <b>Do not allow guests to access my local network</b>.'] },
      { t: 'DHCP range and a reservation', on: 'Router', why: 'Printers/NAS should always have the same IP so PCs can find them.', gui: ['LAN/DHCP → range e.g. 192.168.1.100–199.', 'Address Reservation → choose the printer (by MAC) → 192.168.1.50.'] },
      { t: 'Port forwarding only if needed', on: 'Router', why: 'Each forwarded port exposes a device to the Internet. Prefer a VPN for remote access. Turn off UPnP if you do not need it.', gui: ['NAT / Port Forwarding → service name, external port, internal IP (a reserved one), internal port, protocol TCP/UDP.'] },
      { t: 'Verify', on: 'PC / phone', cmd: `C:\\> ipconfig /all
C:\\> ping 192.168.1.1
C:\\> ping 1.1.1.1
C:\\> nslookup google.com`, expect: 'Default Gateway: 192.168.1.1\nDHCP Server: 192.168.1.1\nReply from 1.1.1.1: bytes=32 time=12ms TTL=57', cmdTitle: 'CMD' }
    ],
    test: { text: 'Final test: laptop reaches the Internet over Wi-Fi + NAT', path: ['lap', 'r', 'modem', 'isp'], label: 'https', back: 'Web page' },
    trouble: [
      ['Connected but no Internet', 'ping 192.168.1.1 works but 1.1.1.1 fails → WAN problem (PPPoE credentials, ISP outage). 1.1.1.1 works but names fail → DNS problem.'],
      ['Two routers = “double NAT”', 'Set the ISP modem to bridge mode, or put your router in access-point mode.'],
      ['Old devices cannot join WPA3', 'Use WPA2/WPA3 transitional mode.'],
      ['Slow Wi-Fi', 'Move the router to a central, high place; use 5 GHz; pick a less busy channel.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'patch-cable',
    title: 'Make and test an Ethernet patch cable (RJ45 crimping)',
    level: 'Beginner', minutes: 30, tools: 'Real hardware',
    lessons: ['cabling', 'termination'],
    summary: 'Cut, strip, arrange in T568B, crimp and test your own Cat6 patch cord, then prove it runs at 1 Gbps on a real switch port.',
    goal: 'A working straight-through T568B patch cord that passes a wire-map test and links at 1000 Mbps full duplex.',
    topo: {
      w: 700, h: 200,
      nodes: [{ id: 'pc', type: 'laptop', x: 120, y: 100, label: 'Laptop', sub: 'NIC 1 Gbps' }, { id: 'sw', type: 'switch', x: 560, y: 100, label: 'SW1', sub: 'Gi1/0/5' }],
      links: [{ a: 'pc', b: 'sw', label: 'your new Cat6 cable (T568B ⟷ T568B)' }]
    },
    prereq: [
      'Cat6 <b>stranded</b> patch cable from a box or reel (solid cable is for walls and panels, not for patch cords).',
      'Cat6 RJ45 plugs (buy extras: everyone wastes a few) and optional strain-relief boots. Slide the boots onto the cable <b>before</b> you crimp.',
      'Crimp tool, cable stripper, flush cutter, wire-map tester.',
      'Optional: a switch (or any router/PC) to test the link speed.'
    ],
    tasks: [
      { t: 'Measure and cut the cable', on: 'Bench', why: 'Measure twice, cut once. Add 5 cm for mistakes.', gui: ['Cut the cable straight with the flush cutter.', 'Slide two boots onto the cable now, facing the ends.'] },
      { t: 'Strip the jacket', on: 'Bench', why: 'Removing about 25 mm gives room to arrange the wires. A nicked wire can break later.', gui: ['Put the cable in the stripper about 25 mm from the end. Rotate 1–2 turns. Pull the jacket off.', 'Check: no cut or scratched insulation. If damaged, cut it off and start again.', 'Cut off the rip cord and the plastic cross spline (Cat6).'] },
      { t: 'Untwist and arrange in T568B order', on: 'Bench', why: 'The order must be exact. 10/100 Mbps uses pins 1, 2, 3 and 6; 1 Gbps uses all four pairs.',
        gui: ['Untwist each pair and straighten the wires between your fingers.', 'Left to right (clip down, contacts facing you, wires pointing away from you): <b>white/orange, orange, white/green, blue, white/blue, green, white/brown, brown</b>.', 'Note: green is on pin 6, not next to white/green. Blue and white/blue sit in the middle.', 'Hold the wires flat and tight together.'] },
      { t: 'Trim to 13 mm', on: 'Bench', why: 'If the wires are too long, the jacket does not reach the strain relief and the cable can pull out. Too short and the wires do not reach the pins.', gui: ['Cut straight across with the flush cutter, about 13 mm (½ inch) from the jacket.', 'All 8 ends must be exactly even.'] },
      { t: 'Insert into the plug', on: 'Bench', why: 'Every wire must reach the front wall of the plug so the gold pin can cut into it.', gui: ['Clip down, push the wires in. Keep the order. Do not let wires slip over each other.', 'Look at the front of the plug: you should see 8 copper ends touching the front wall.', 'The outer jacket must be <b>inside</b> the plug, under the strain-relief tab.', 'Check the colour order through the clear plastic one more time.'] },
      { t: 'Crimp', on: 'Bench', why: 'The crimp pushes the 8 pins down into the wires and locks the jacket.', gui: ['Put the plug fully into the 8P (RJ45) slot of the crimp tool.', 'Squeeze hard until the ratchet releases. Pull gently on the cable: it must not move.', 'Slide the boot over the plug.'] },
      { t: 'Terminate the other end the same way (T568B)', on: 'Bench', why: 'Same standard on both ends = straight-through cable. A on one end and B on the other = crossover (not what we want here).', gui: ['Repeat steps 2–6 on the second end.'] },
      { t: 'Test with the wire-map tester', on: 'Tester', why: 'The tester checks each of the 8 wires for opens, shorts and crossed wires.',
        gui: ['Plug one end into the main unit and the other into the remote unit. Press Test.', 'Good: LEDs 1→8 light in the same order on both units.', 'An LED does not light = open: cut off that plug and re-crimp. LEDs out of order = wires swapped in one plug.'] },
      { t: 'Test on a live link', on: 'Laptop + switch', why: 'A real link proves the cable carries 1 Gbps without errors. A bad pair often shows as 100 Mbps.',
        cmd: `PS C:\\> Get-NetAdapter | Select-Object Name, Status, LinkSpeed
PS C:\\> ping -n 50 192.168.1.1`, cmdTitle: 'PowerShell',
        verify: `SW1# show interfaces status | include Gi1/0/5
SW1# show interfaces gigabitEthernet1/0/5 | include CRC`,
        expect: 'Name       Status LinkSpeed\nEthernet   Up     1 Gbps\n\nGi1/0/5   connected  1  a-full  a-1000 10/100/1000BaseTX\n0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored' }
    ],
    test: { text: 'Final test: the laptop pings the switch over your new cable with no loss.', path: ['pc', 'sw'], label: 'ping', back: 'reply' },
    trouble: [
      ['Tester: one LED never lights', 'Open wire. The wire did not reach the pin or broke at the jacket. Cut off the plug and crimp a new one.'],
      ['Tester: LEDs 3 and 6 light in the wrong place', 'Green pair placed wrong (very common). Green goes on pin 6, white/green on pin 3.'],
      ['Link only at 100 Mbps', '1 Gbps needs all 4 pairs. The blue or brown pair is bad. Re-crimp and test again.'],
      ['Link works, but CRC errors increase', 'Too much untwist, a split pair or a damaged jacket. Re-terminate and keep the untwist short.'],
      ['Plug pulls off the cable', 'The jacket was not inside the plug (wires cut too long). Trim to about 13 mm.']
    ]
  });

  /* ===================================================== */
  LABS.push({
    id: 'rack-build',
    title: 'Build a small office network: rack, patch panel, switch, cabling & config',
    level: 'Intermediate', minutes: 240, tools: 'Real hardware',
    lessons: ['cabling', 'termination', 'rack', 'structured', 'vlan', 'ios'],
    summary: 'The full job from empty room to working network: plan, mount the rack, run and punch down cables, terminate wall jacks, test, patch, then configure the switch with VLANs, port descriptions and SSH.',
    goal: 'Twenty labeled, tested wall jacks patched to a configured, documented switch in a tidy rack, with users getting network access in VLAN 10.',
    topo: {
      w: 900, h: 340,
      zones: [
        { x: 20, y: 30, w: 200, h: 290, label: 'Offices', color: 'blue' },
        { x: 240, y: 30, w: 640, h: 290, label: 'Comms room · 12U wall cabinet', color: 'gray' }
      ],
      nodes: [
        { id: 'pc', type: 'pc', x: 70, y: 110, label: 'PC', sub: 'VLAN 10' },
        { id: 'ap', type: 'ap', x: 70, y: 240, label: 'Access point', sub: 'PoE+' },
        { id: 'j1', type: 'jack', x: 175, y: 110, label: 'Jack 1-01' },
        { id: 'j2', type: 'jack', x: 175, y: 240, label: 'Jack 1-20' },
        { id: 'pp', type: 'patch', x: 320, y: 175, label: 'PP1 (24-port)' },
        { id: 'sw', type: 'switch', x: 470, y: 175, label: 'SW1', sub: 'mgmt 192.168.99.2' },
        { id: 'r1', type: 'router', x: 640, y: 175, label: 'R1 / firewall', sub: '.10.1 / .99.1' },
        { id: 'isp', type: 'cloud', x: 810, y: 175, label: 'ISP' }
      ],
      links: [
        { a: 'pc', b: 'j1' }, { a: 'ap', b: 'j2' }, { a: 'j1', b: 'pp' }, { a: 'j2', b: 'pp' },
        { a: 'pp', b: 'sw', label: 'patch cords' },
        { a: 'sw', b: 'r1', cls: 'trunk', label: 'Gi1/1/1 trunk' },
        { a: 'r1', b: 'isp', cls: 'wan' }
      ]
    },
    addressing: [
      ['SW1', 'VLAN 99 (management)', '192.168.99.2', '255.255.255.0', '192.168.99.1'],
      ['R1', 'G0/0.10 (VLAN 10 Staff)', '192.168.10.1', '255.255.255.0', '—'],
      ['R1', 'G0/0.99 (VLAN 99 Mgmt)', '192.168.99.1', '255.255.255.0', '—'],
      ['PCs', 'NIC', 'DHCP 192.168.10.x', '255.255.255.0', '192.168.10.1']
    ],
    prereq: [
      'Wall cabinet (12U is plenty for this job), cage nuts and screws, earth/ground cable.',
      '24-port Cat6 patch panel, 2 horizontal cable managers, 24-port PoE+ managed switch (Cisco Catalyst or similar), small UPS.',
      'Box of Cat6 <b>solid</b> cable (305 m), keystone jacks + faceplates, short Cat6 patch cords (0.3–0.5 m) in two colours.',
      'Tools: 110 punch-down tool, stripper, cable tester (certifier if available), toner, label printer, Velcro straps, fish tape / pull rods.',
      'Console cable (USB or RJ45-to-USB) and a laptop with PuTTY or Tera Term.',
      '<b>Safety:</b> follow local electrical and building codes. Use plenum-rated (CMP) cable in air-handling ceilings. Leave mains power work to a licensed electrician.'
    ],
    tasks: [
      { t: 'Plan: jacks, rack elevation and port map', on: 'Paper / spreadsheet', why: 'A plan before drilling saves hours later. The port map becomes your documentation.',
        gui: ['Walk the site. Mark every outlet on a floor plan: desks, printers, ceiling access points, cameras. Add 20% spare.',
          'Name each jack <code>&lt;floor&gt;-&lt;number&gt;</code>, e.g. 1-01 … 1-20.',
          'Draw the rack elevation, top to bottom: <b>U12 patch panel PP1 · U11 cable manager · U10 switch SW1 · U9 cable manager · U8 router/firewall · UPS at the bottom</b>.',
          'Make a port map spreadsheet: Jack · Patch panel port · Switch port · VLAN · Device. Jack 1-01 = PP1-01 = Gi1/0/1, and so on.',
          'Check every cable route is under 90 m.'] },
      { t: 'Mount and ground the rack', on: 'Comms room', why: 'A rack must be fixed firmly (it gets heavy) and bonded to ground for safety and for shielded cabling.',
        gui: ['Mount the wall cabinet into studs or with proper anchors. Leave room in front to open the door, and at the sides for airflow.',
          'Bond the cabinet ground lug to the building ground bar with the earth cable.',
          'Snap cage nuts into the square holes for each device (3 holes per U: use the top and bottom hole).'] },
      { t: 'Install the UPS, patch panel, cable managers and switch', on: 'Rack', why: 'Mounting in the planned order keeps patch cords short and heavy items low.',
        gui: ['UPS at the bottom (or on the floor next to a wall cabinet).',
          'From the top: patch panel, cable manager, switch, cable manager, router/firewall.',
          'Leave the switch powered off for now.'] },
      { t: 'Run the horizontal cables', on: 'Building', why: 'Good pulling practice keeps the cable within spec. Kinks, crushing and tight bends ruin Cat6 performance.',
        gui: ['Pull one cable from the box to each outlet location. Label <b>both ends</b> straight away (e.g. 1-01).',
          'Do not pull too hard (max about 110 N / 25 lbf). No kinks. Bend radius at least 4× the cable diameter.',
          'Keep away from power cables and fluorescent lights; cross power cables at 90°.',
          'Support cables with J-hooks; never lay them on ceiling tiles. Use Velcro, not tight zip ties.',
          'Leave a service loop: about 3 m in the comms room and 30 cm at the outlet.'] },
      { t: 'Punch down the cables on the patch panel', on: 'Rack', why: 'Solid-core cable is terminated with a punch-down tool, never crimped.',
        gui: ['Dress the cables neatly to the back of the panel, in jack order (1-01 to port 1).',
          'Strip about 50 mm of jacket. Keep pairs twisted to within 13 mm of the contact.',
          'Follow the <b>B</b> colour labels on the panel. Put each wire in its slot.',
          'Punch with the 110 tool, <b>cut side towards the waste end</b>. Check each wire is seated and trimmed.',
          'Tie the cable to the panel’s support bar. Put the jack number label on the front of the port.'] },
      { t: 'Terminate the wall jacks (keystones)', on: 'Offices', why: 'The other end of the permanent link. Use the same standard (T568B) as the panel.',
        gui: ['Strip about 50 mm, place the wires by the B colour code on the keystone, punch down (or use a tool-less keystone).',
          'Snap the keystone into the faceplate and screw it to the wall box.',
          'Label the faceplate with the same number as the cable (1-01).'] },
      { t: 'Test every link', on: 'Tester', why: 'Test and record every link before you hand over. Fix faults now, while you are still on site.',
        gui: ['Put the main unit on the patch panel port (with a short tested cord) and the remote on the wall jack.',
          'Wire-map must pass 1–8. With a certifier: run the Cat6 permanent-link test and save the result.',
          'Record PASS/FAIL and length for each link in the port map. Re-terminate any failure and test again.'] },
      { t: 'Patch the panel to the switch', on: 'Rack', why: 'Short patch cords, one-to-one, through the cable manager. Colours help: e.g. blue = data, yellow = PoE devices (APs, phones).',
        gui: ['PP1-01 → Gi1/0/1, PP1-02 → Gi1/0/2 … PP1-20 → Gi1/0/20.',
          'Route each cord through the cable manager. No cords crossing the front of the switch.',
          'Uplink SFP+ port Gi1/1/1 → router/firewall LAN port.'] },
      { t: 'Power on and connect to the console', on: 'Laptop', why: 'A new switch has no IP address. The first configuration is always done over the console port.',
        gui: ['Plug the switch and router into the UPS. Power on.',
          'Connect the console cable. Windows: Device Manager → Ports (COM &amp; LPT) shows the COM port number.',
          'PuTTY → Connection type <b>Serial</b>, your COM port, speed <b>9600</b> (8 data bits, no parity, 1 stop bit, no flow control).',
          'Press Enter. If asked “Would you like to enter the initial configuration dialog?”, answer <b>no</b>.'],
        cmd: `Switch> enable
Switch# show version
Switch# show inventory`, cmdTitle: 'SW1 — console' },
      { t: 'Basic switch configuration', on: 'SW1', why: 'Name, passwords, management IP and SSH so you can manage it from the network later.',
        cmd: `Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# enable secret Use-A-Strong-Secret1
SW1(config)# service password-encryption
SW1(config)# no ip domain-lookup
SW1(config)# banner motd $ Authorized access only $
SW1(config)# username admin privilege 15 secret Another-Strong-Secret2
SW1(config)# ip domain-name office.local
SW1(config)# crypto key generate rsa modulus 2048
SW1(config)# ip ssh version 2
SW1(config)# line console 0
SW1(config-line)# login local
SW1(config-line)# exit
SW1(config)# line vty 0 15
SW1(config-line)# login local
SW1(config-line)# transport input ssh
SW1(config-line)# exit`, cmdTitle: 'SW1 — commands' },
      { t: 'VLANs, access ports and descriptions from the port map', on: 'SW1', why: 'Each port gets its VLAN and a description that matches the patch panel and jack. Unused ports are shut down for security.',
        cmd: `SW1(config)# vlan 10
SW1(config-vlan)# name STAFF
SW1(config-vlan)# vlan 99
SW1(config-vlan)# name MGMT
SW1(config-vlan)# vlan 999
SW1(config-vlan)# name UNUSED
SW1(config-vlan)# exit
! User ports 1-20
SW1(config)# interface range gigabitEthernet1/0/1 - 20
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# spanning-tree bpduguard enable
SW1(config-if-range)# exit
! One description per port, copied from the port map
SW1(config)# interface gigabitEthernet1/0/1
SW1(config-if)# description PP1-01 / Jack 1-01 / Office 1
SW1(config-if)# interface gigabitEthernet1/0/20
SW1(config-if)# description PP1-20 / Jack 1-20 / Ceiling AP
! Spare ports: parked in an unused VLAN and shut down
SW1(config-if)# interface range gigabitEthernet1/0/21 - 24
SW1(config-if-range)# description UNUSED
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 999
SW1(config-if-range)# shutdown
SW1(config-if-range)# exit`, cmdTitle: 'SW1 — commands' },
      { t: 'Uplink trunk, management IP and save', on: 'SW1', why: 'The trunk carries VLANs 10 and 99 to the router (router-on-a-stick, see the office VLAN lab). The VLAN 99 address lets you SSH to the switch.',
        cmd: `SW1(config)# interface gigabitEthernet1/1/1
SW1(config-if)# description UPLINK to R1 G0/0
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,99
SW1(config-if)# exit
SW1(config)# interface vlan 99
SW1(config-if)# ip address 192.168.99.2 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# ip default-gateway 192.168.99.1
SW1(config)# end
SW1# copy running-config startup-config`, cmdTitle: 'SW1 — commands',
        verify: `SW1# show interfaces status
SW1# show vlan brief
SW1# show interfaces trunk
SW1# show power inline`,
        expect: 'Port      Name               Status       Vlan  Duplex  Speed Type\nGi1/0/1   PP1-01 / Jack 1-01 connected    10    a-full  a-1000 10/100/1000BaseTX\nGi1/0/20  PP1-20 / Jack 1-20 connected    10    a-full  a-1000 10/100/1000BaseTX\nGi1/0/21  UNUSED             disabled     999   auto    auto  10/100/1000BaseTX\nGi1/1/1   UPLINK to R1 G0/0  connected    trunk full    10G   SFP-10GBase-SR' },
      { t: 'Final check and documentation', on: 'Laptop', why: 'Prove a user gets network access, then hand over the documents: rack elevation, port map with test results, configs and passwords (stored safely).',
        gui: ['Plug a laptop into a few wall jacks: it should get a 192.168.10.x address and reach the Internet.',
          'SSH to the switch at 192.168.99.2 from a PC that is allowed to reach the management VLAN.',
          'Back up the switch config to a file. Take photos of the rack front and back.',
          'Update the port map: test results, cable lengths, VLAN per port.'],
        cmd: `C:\\> ipconfig
C:\\> ping 192.168.10.1
C:\\> ping 1.1.1.1
C:\\> ssh admin@192.168.99.2`, cmdTitle: 'CMD' }
    ],
    test: { text: 'Final test: a PC on wall jack 1-01 goes through the patch panel, switch and router to the Internet.', path: ['pc', 'j1', 'pp', 'sw', 'r1', 'isp'], label: 'https', back: 'web page' },
    trouble: [
      ['No link light on a port', 'Check the patch cord, then test the permanent link (panel to jack). Look for a wrong colour order or a wire not punched down. Is the port shut down or err-disabled?'],
      ['Port shows err-disabled', 'BPDU guard saw a switch plugged into a user port. Remove that switch, then <code>shutdown</code> / <code>no shutdown</code> on the port.'],
      ['Link only 100 Mbps', 'One of the four pairs is bad. Re-terminate the jack or panel and test again.'],
      ['CRC errors increase on a port', 'Bad termination, too much untwist, a damaged cable, or a run next to power. Run <code>test cable-diagnostics tdr</code> and a certifier test.'],
      ['Jack works but the user is in the wrong VLAN', 'The patch cord goes to the wrong switch port, or the port map is wrong. Trace with <code>show mac address-table</code> and fix the label.'],
      ['Access point has no power', '<code>show power inline</code>: check the PoE budget and that the AP power class fits (PoE+ = 30 W).'],
      ['Console shows garbage characters', 'Wrong speed. Use 9600 baud, 8-N-1, no flow control.']
    ]
  });
})();
