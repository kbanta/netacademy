/* Module 4 — Windows Server & Active Directory */
(function () {
  const L = (window.LESSONS = window.LESSONS || []);
  const h = Engine.h;
  const MOD = 'Windows Server & AD';

  /* ---------- helpers for the AD hierarchy stage ---------- */
  function adBox(parent, cls, label, sub) {
    const box = h('div', { class: 'adbox ' + cls }, h('div', { class: 'adbox-h' }, h('b', {}, label), sub ? h('span', {}, sub) : null), h('div', { class: 'adbox-c' }));
    parent.appendChild(box);
    return box.querySelector('.adbox-c');
  }
  function adObj(parent, kind, label) {
    const ic = { user: '👤', computer: '🖥', group: '👥', dc: '🗄', printer: '🖨' }[kind] || '•';
    const o = h('span', { class: 'adobj o-' + kind }, ic + ' ' + label);
    parent.appendChild(o);
    return o;
  }

  /* ===================================================== */
  L.push({
    id: 'ad-intro',
    module: MOD,
    title: 'Active Directory Fundamentals',
    minutes: 20,
    summary: 'What AD DS is, domain controllers, forests, trees, domains, OUs and objects.',
    sections: [
      { h: 'Why Active Directory?', html: `
        <p>In a small office every PC has its own local user accounts. With 500 users that is impossible to manage. <b>Active Directory Domain Services (AD DS)</b> is Microsoft’s <b>central directory</b>: one database of users, computers, groups and policies, so people log on with <b>one account</b> on any domain PC.</p>
        <div class="cols2">
          <div class="card-mini"><h4>What AD gives you</h4><ul><li><b>Authentication</b> — who are you? (Kerberos)</li><li><b>Authorization</b> — what may you access? (groups, permissions)</li><li><b>Central management</b> — Group Policy for thousands of PCs</li><li><b>Single sign-on</b> to file shares, printers, apps</li></ul></div>
          <div class="card-mini"><h4>Key pieces</h4><ul><li><b>Domain Controller (DC)</b> — Windows Server running AD DS; holds a copy of the database <code>NTDS.dit</code></li><li><b>DNS</b> — AD cannot work without it</li><li><b>SYSVOL</b> — shared folder with logon scripts &amp; GPOs</li><li><b>LDAP</b> — protocol to query the directory (389/636)</li></ul></div>
        </div>
        <div class="callout tip"><b>Analogy:</b> AD is the company’s HR office + security desk. HR keeps the list of employees (directory), the security desk checks badges (authentication) and decides which doors open (authorization).</div>` },
      { sim: {
        kind: 'stage',
        title: 'Building the AD structure',
        desc: 'Forest → domains → organizational units → objects.',
        cfg: { init: s => s.root.append(h('div', { class: 'adtree' }), h('div', { class: 'ad-dn' })) },
        steps: [
          { text: 'The <b>forest</b> is the top container and the <b>security boundary</b>. All domains in it share one <b>schema</b> (the object definitions) and one <b>Global Catalog</b>.', run: s => { s.forest = adBox(s.$('.adtree'), 'forest', 'Forest: corp.local', 'security boundary · one schema'); return s.wait(500); } },
          { text: 'The first domain is the <b>forest root domain</b> <code>corp.local</code>. A <b>domain</b> is an administrative and replication boundary. Its <b>Domain Controllers</b> hold the AD database.', run: s => { s.dom = adBox(s.forest, 'domain', 'Domain: corp.local', 'root domain'); s.domObjs = h('div', { class: 'adrow' }); s.dom.appendChild(s.domObjs); adObj(s.domObjs, 'dc', 'DC1'); adObj(s.domObjs, 'dc', 'DC2'); return s.wait(500); } },
          { text: 'A <b>child domain</b> <code>eu.corp.local</code> joins the same <b>tree</b> (shared DNS name). Parent and child automatically trust each other with a <b>two-way transitive trust</b>.', run: s => { const c = adBox(s.forest, 'domain child', 'Child domain: eu.corp.local', '⇄ two-way transitive trust'); adObj(c, 'dc', 'DC-EU1'); return s.wait(500); } },
          { text: '<b>Organizational Units (OUs)</b> are folders inside a domain. Use them to <b>delegate admin rights</b> and <b>link Group Policies</b>. (The built-in “Users” and “Computers” are containers, not OUs — you cannot link GPOs to them.)', run: s => { s.ouIT = adBox(s.dom, 'ou', 'OU=IT'); s.ouHR = adBox(s.dom, 'ou', 'OU=HR'); s.ouPC = adBox(s.dom, 'ou', 'OU=Workstations'); return s.wait(500); } },
          { text: '<b>Objects</b> live in OUs: users, computers, groups, printers. Each object has attributes (name, email, password hash, group membership…) and a unique <b>SID</b>.', run: s => { adObj(s.ouIT, 'user', 'Alice'); adObj(s.ouIT, 'group', 'GG_IT'); adObj(s.ouHR, 'user', 'Bob'); adObj(s.ouPC, 'computer', 'PC-042'); adObj(s.ouPC, 'computer', 'PC-043'); return s.wait(500); } },
          { text: 'Every object has a <b>Distinguished Name (DN)</b> — its full LDAP path, read from the object up to the domain. Users log on with <code>CORP\\alice</code> or the UPN <code>alice@corp.local</code>.', run: s => { s.$('.ad-dn').innerHTML = '<span>DN of Alice:</span> <code>CN=Alice,OU=IT,DC=corp,DC=local</code>'; return s.wait(300); } }
        ]
      } },
      { h: 'Terms cheat table', html: `
        <table class="data">
          <tr><th>Term</th><th>Meaning</th></tr>
          <tr><td>Forest</td><td>Top level, security boundary, shared schema &amp; Global Catalog</td></tr>
          <tr><td>Tree</td><td>Domains sharing a contiguous DNS namespace (corp.local, eu.corp.local)</td></tr>
          <tr><td>Domain</td><td>Admin, policy and replication boundary</td></tr>
          <tr><td>OU</td><td>Container to organize objects, delegate control and link GPOs</td></tr>
          <tr><td>Domain Controller</td><td>Server that stores AD and authenticates users. Have <b>at least 2</b> per domain!</td></tr>
          <tr><td>Global Catalog (GC)</td><td>DC holding a partial copy of every object in the forest — used for searches and universal group membership</td></tr>
          <tr><td>Schema</td><td>Definition of every object class and attribute</td></tr>
          <tr><td>SID</td><td>Security Identifier — unique ID used in permissions (names can change, SIDs do not)</td></tr>
          <tr><td>Microsoft Entra ID</td><td>Cloud identity (formerly Azure AD). Hybrid setups sync on-prem AD to it with Entra Connect</td></tr>
        </table>
        <h4>Ports a DC needs</h4>
        <p><b>DNS</b> 53 · <b>Kerberos</b> 88 · <b>NTP</b> 123 · <b>RPC</b> 135 + 49152–65535 · <b>LDAP</b> 389 (TCP/UDP) · <b>SMB</b> 445 · Kerberos password 464 · <b>LDAPS</b> 636 · <b>Global Catalog</b> 3268/3269</p>` }
    ],
    cliTitle: 'PowerShell',
    cli: `# Install AD DS and create a new forest (run on Windows Server)
PS C:\\> Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
PS C:\\> Install-ADDSForest -DomainName "corp.local" -DomainNetbiosName "CORP" -InstallDns

# Add a second DC to the existing domain
PS C:\\> Install-ADDSDomainController -DomainName "corp.local" -InstallDns -Credential (Get-Credential)

# Create OUs and objects
PS C:\\> New-ADOrganizationalUnit -Name "IT" -Path "DC=corp,DC=local"
PS C:\\> New-ADUser -Name "Alice" -SamAccountName alice -UserPrincipalName alice@corp.local -Path "OU=IT,DC=corp,DC=local" -AccountPassword (Read-Host -AsSecureString) -Enabled $true
PS C:\\> Get-ADUser alice -Properties *
PS C:\\> Get-ADDomain
PS C:\\> Get-ADForest
PS C:\\> Get-ADDomainController -Filter *

# GUI tools: dsa.msc (Users and Computers), dsac.exe (Admin Center), gpmc.msc, dnsmgmt.msc`,
    keypoints: [
      'AD DS = central directory for authentication, authorization and management.',
      'Forest (security boundary) → tree → domain → OU → objects.',
      'Domain Controllers store NTDS.dit; always deploy at least two.',
      'Link GPOs and delegate rights on OUs, not on the default containers.'
    ],
    quiz: [
      { q: 'Which is the security boundary in Active Directory?', a: ['OU', 'Domain', 'Forest', 'Site'], c: 2, why: 'All domains in a forest trust each other; only the forest is a true security boundary.' },
      { q: 'What is the AD database file on a domain controller?', a: ['SAM', 'NTDS.dit', 'SYSVOL', 'registry.pol'], c: 1, why: 'NTDS.dit stores all directory objects. SAM is the local account database.' },
      { q: 'You want to apply a GPO to all HR computers and let the HR helpdesk reset passwords. Use…', a: ['A security group only', 'An OU', 'A child domain', 'A site'], c: 1, why: 'OUs are used for GPO links and delegation of control.' },
      { q: 'DN of user Bob in OU HR of domain corp.local:', a: ['corp.local/HR/Bob', 'CN=Bob,OU=HR,DC=corp,DC=local', 'DC=local,DC=corp,OU=HR,CN=Bob', 'CORP\\HR\\Bob'], c: 1, why: 'A DN is read from the object up to the domain root.' },
      { q: 'Which port does the Global Catalog use?', a: ['389', '636', '3268', '88'], c: 2, why: 'GC = 3268 (LDAP) / 3269 (LDAPS).' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'ad-dns',
    module: MOD,
    title: 'AD & DNS: Finding a DC & Joining the Domain',
    minutes: 15,
    summary: 'SRV records, the DC locator process, domain join — and the #1 AD mistake (wrong DNS).',
    sections: [
      { h: 'AD lives on DNS', html: `
        <p>Clients do not have a list of domain controllers. They <b>ask DNS</b>. When a DC is promoted, it registers <b>SRV records</b> (service location records) in DNS, e.g. <code>_ldap._tcp.dc._msdcs.corp.local</code>, which point to every DC. Most companies run DNS on the DCs as <b>AD-integrated zones</b>.</p>
        <div class="callout warn"><b>Rule #1:</b> domain-joined PCs and servers must use the <b>internal AD DNS servers</b> (the DCs) — never 8.8.8.8 or the ISP router. The DCs forward Internet names to outside DNS with <b>forwarders</b>.</div>` },
      { sim: {
        title: 'DC locator and domain join',
        cfg: {
          w: 820, h: 360,
          zones: [{ x: 360, y: 30, w: 440, h: 300, label: 'Site: HQ', color: 'blue' }],
          nodes: [
            { id: 'pc', type: 'pc', x: 90, y: 190, label: 'PC-042', sub: 'DNS: 10.0.0.10' },
            { id: 'sw', type: 'switch', x: 260, y: 190, label: 'SW' },
            { id: 'dc1', type: 'server', x: 520, y: 110, label: 'DC1 + DNS', sub: '10.0.0.10' },
            { id: 'dc2', type: 'server', x: 520, y: 270, label: 'DC2 + DNS', sub: '10.0.0.11' },
            { id: 'net', type: 'cloud', x: 720, y: 190, label: 'Internet DNS', sub: '8.8.8.8' }
          ],
          links: [{ a: 'pc', b: 'sw' }, { a: 'sw', b: 'dc1' }, { a: 'sw', b: 'dc2' }, { a: 'dc1', b: 'net', cls: 'wan' }],
          tables: [
            { id: 'srv', title: 'DNS zone corp.local (SRV)', cols: ['Record', 'Target', 'Port'], rows: [['_ldap._tcp.dc._msdcs', 'dc1.corp.local', '389'], ['_ldap._tcp.dc._msdcs', 'dc2.corp.local', '389'], ['_kerberos._tcp', 'dc1 / dc2', '88']] },
            { id: 'obj', title: 'AD: CN=Computers', cols: ['Object', 'Type'] }
          ]
        },
        steps: [
          { text: 'An admin runs <b>Add-Computer -DomainName corp.local</b> on PC-042. First the PC must <b>find a domain controller</b>.', run: async t => { t.say('pc', 'Join corp.local', 1600); await t.flash('pc'); await t.wait(500); } },
          { text: 'The PC asks its DNS server for the SRV record <code>_ldap._tcp.dc._msdcs.corp.local</code>.', run: t => t.send(['pc', 'sw', 'dc1'], { label: 'SRV? _ldap…corp.local', color: 'blue' }) },
          { text: 'DNS answers with <b>all DCs</b> (dc1 and dc2) and their priority/weight. Site-aware clients prefer DCs in their own site.', run: async t => { t.hiRow('srv', 0); await t.send(['dc1', 'sw', 'pc'], { label: 'dc1, dc2 :389', color: 'green' }); } },
          { text: 'The PC sends an <b>LDAP ping</b> (CLDAP, UDP 389) to a DC. The DC replies: “I am DC1, site HQ, I am alive.”', run: async t => { await t.send(['pc', 'sw', 'dc1'], { label: 'LDAP ping', color: 'purple' }); await t.send(['dc1', 'sw', 'pc'], { label: 'DC1 · site HQ', color: 'purple' }); } },
          { text: 'With admin credentials, the PC creates its <b>computer account</b> in AD (default container CN=Computers) and sets a machine password. After a <b>restart</b> it has a secure channel to the domain.', run: async t => { await t.send(['pc', 'sw', 'dc1'], { label: 'Create PC-042$', color: 'orange' }); t.addRow('obj', ['PC-042$', 'computer']); await t.send(['dc1', 'sw', 'dc2'], { label: 'replicate', color: 'gray' }); t.badge('pc', 'Domain joined ✓', 'ok'); } },
          { text: '<b>Common mistake:</b> the PC uses 8.8.8.8 as DNS. Public DNS knows nothing about corp.local → <i>“An Active Directory Domain Controller for the domain could not be contacted.”</i>', run: async t => { t.badge('pc', ''); t.setSub('pc', 'DNS: 8.8.8.8 ✗'); await t.send(['pc', 'sw', 'dc1', 'net'], { label: 'SRV? corp.local', color: 'red' }); await t.send(['net', 'dc1', 'sw', 'pc'], { label: 'NXDOMAIN', color: 'red', drop: true }); } }
        ]
      } },
      { h: 'DNS records AD uses', html: `
        <table class="data">
          <tr><th>Record</th><th>Purpose</th></tr>
          <tr><td>A / AAAA</td><td>Host name → IP of each DC and computer (clients register themselves with <b>dynamic DNS</b>)</td></tr>
          <tr><td>SRV <code>_ldap._tcp.dc._msdcs</code></td><td>Find any DC in the domain</td></tr>
          <tr><td>SRV <code>_ldap._tcp.&lt;Site&gt;._sites.dc._msdcs</code></td><td>Find a DC in my site</td></tr>
          <tr><td>SRV <code>_kerberos._tcp</code></td><td>Find a KDC for logon</td></tr>
          <tr><td>SRV <code>_gc._tcp</code></td><td>Find a Global Catalog</td></tr>
          <tr><td>CNAME <code>&lt;GUID&gt;._msdcs</code></td><td>Used for DC-to-DC replication</td></tr>
        </table>
        <p>Missing SRV records? On the DC run <code>ipconfig /registerdns</code> and restart the <b>Netlogon</b> service; test with <code>dcdiag /test:dns</code>.</p>` }
    ],
    cliTitle: 'PowerShell / CMD',
    cli: `# Check which DNS server the client uses
PS C:\\> Get-DnsClientServerAddress
PS C:\\> Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 10.0.0.10,10.0.0.11

# Find domain controllers
C:\\> nslookup -type=SRV _ldap._tcp.dc._msdcs.corp.local
C:\\> nltest /dsgetdc:corp.local
PS C:\\> Resolve-DnsName _ldap._tcp.dc._msdcs.corp.local -Type SRV

# Join the domain
PS C:\\> Add-Computer -DomainName corp.local -OUPath "OU=Workstations,DC=corp,DC=local" -Credential CORP\\admin -Restart

# Verify / repair
PS C:\\> Test-ComputerSecureChannel -Repair
C:\\> dcdiag /test:dns
C:\\> ipconfig /registerdns

# DNS forwarders on the DC
PS C:\\> Add-DnsServerForwarder -IPAddress 1.1.1.1,8.8.8.8`,
    keypoints: [
      'Clients find DCs through DNS SRV records.',
      'Domain members must point to internal AD DNS (the DCs); DCs forward Internet queries.',
      'Domain join creates a computer account and a machine password (secure channel).',
      'Use nltest /dsgetdc and dcdiag /test:dns to troubleshoot.'
    ],
    quiz: [
      { q: 'A PC cannot join the domain: "Domain Controller could not be contacted". Most likely cause?', a: ['Wrong subnet mask', 'PC uses a public DNS server', 'Firewall on the PC', 'Too many users'], c: 1, why: 'Public DNS cannot resolve the AD SRV records.' },
      { q: 'Which DNS record type lets clients locate domain controllers?', a: ['MX', 'PTR', 'SRV', 'TXT'], c: 2, why: 'Service location (SRV) records like _ldap._tcp.dc._msdcs.' },
      { q: 'How should a DC resolve Internet names like microsoft.com?', a: ['Clients should use 8.8.8.8 as secondary', 'Configure DNS forwarders on the DC', 'Add every site manually', 'It cannot'], c: 1, why: 'Forwarders (or root hints) send external queries out; clients keep using only internal DNS.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'kerberos',
    module: MOD,
    title: 'Kerberos Authentication',
    minutes: 15,
    summary: 'How a domain logon works: TGT, service tickets, the KDC — and why time sync matters.',
    sections: [
      { h: 'Tickets instead of passwords', html: `
        <p><b>Kerberos</b> (TCP/UDP 88) is the default AD authentication protocol. The password never crosses the network. Instead the <b>KDC</b> (Key Distribution Center, running on every DC) hands out encrypted <b>tickets</b>:</p>
        <ul>
          <li><b>TGT</b> (Ticket-Granting Ticket) — proves “I logged on”. Encrypted with the secret key of the <code>krbtgt</code> account. Valid 10 hours by default.</li>
          <li><b>Service ticket</b> (TGS) — proves “I may talk to this service”. Encrypted with the <b>service account’s</b> key, identified by an <b>SPN</b> like <code>cifs/fs1.corp.local</code>.</li>
        </ul>
        <div class="callout tip"><b>Analogy:</b> At a theme park you show your ID once at the entrance and get a wristband (TGT). For each ride you show the wristband to get a ride token (service ticket). The ride operator only checks the token.</div>` },
      { sim: {
        kind: 'ladder',
        title: 'Alice logs on and opens \\\\fs1\\Sales',
        cfg: { w: 760, pad: 100, actors: [{ id: 'pc', type: 'pc', label: 'Alice on PC-042' }, { id: 'dc', type: 'server', label: 'DC1 (KDC)', sub: 'port 88' }, { id: 'fs', type: 'server', label: 'File server FS1' }] },
        steps: [
          { text: '<b>AS-REQ:</b> Alice types her password. The PC turns it into a key and encrypts a <b>timestamp</b> with it (pre-authentication). The password itself is not sent.', run: t => t.arrow('pc', 'dc', 'AS-REQ (alice, encrypted timestamp)', { color: 'blue' }) },
          { text: '<b>AS-REP:</b> The DC decrypts the timestamp with Alice’s stored key — it matches, so she is authentic. The DC returns a <b>TGT</b> + a session key. Alice is logged on.', run: async t => { await t.arrow('dc', 'pc', 'AS-REP: TGT + session key', { color: 'green' }); await t.note('Alice has a TGT (valid 10 h)', 'ok'); } },
          { text: '<b>TGS-REQ:</b> Alice opens <code>\\\\fs1\\Sales</code>. The PC sends the TGT to the KDC and asks for a ticket for SPN <code>cifs/fs1.corp.local</code>.', run: t => t.arrow('pc', 'dc', 'TGS-REQ: TGT + SPN cifs/fs1', { color: 'blue' }) },
          { text: '<b>TGS-REP:</b> The KDC returns a <b>service ticket</b> encrypted with FS1’s own key. It contains Alice’s identity and her <b>group SIDs</b> (the PAC).', run: t => t.arrow('dc', 'pc', 'TGS-REP: service ticket for FS1', { color: 'green' }) },
          { text: '<b>AP-REQ:</b> The PC presents the service ticket to FS1. FS1 decrypts it with its own key — <b>no need to contact the DC</b>. It reads Alice’s groups and checks the folder permissions.', run: async t => { await t.arrow('pc', 'fs', 'AP-REQ: service ticket', { color: 'purple' }); await t.arrow('fs', 'pc', 'AP-REP: access granted', { color: 'green' }); } },
          { text: '<b>Time matters!</b> Tickets contain timestamps. If a PC clock is more than <b>5 minutes</b> off from the DC, authentication fails (KRB_AP_ERR_SKEW). Domain members sync time from the DCs; the <b>PDC emulator</b> is the time source of the domain.', run: async t => { await t.note('Clock skew > 5 min → logon fails', 'warn'); await t.arrow('pc', 'dc', 'AS-REQ (clock +9 min)', { color: 'red', lost: true }); } }
        ]
      } },
      { h: 'Kerberos vs NTLM', html: `
        <table class="data">
          <tr><th></th><th>Kerberos</th><th>NTLM</th></tr>
          <tr><td>Method</td><td>Tickets from a KDC</td><td>Challenge / response</td></tr>
          <tr><td>Used when</td><td>Name-based access inside the domain (default)</td><td>Access by IP address, workgroups, legacy apps, Kerberos failure</td></tr>
          <tr><td>Server must contact DC?</td><td>No (ticket is self-contained)</td><td>Yes, pass-through to a DC</td></tr>
          <tr><td>Mutual authentication</td><td>Yes</td><td>No</td></tr>
          <tr><td>Security</td><td>Strong</td><td>Weaker (relay, pass-the-hash) — disable where possible</td></tr>
        </table>
        <p class="small">Tip: <code>\\\\fs1\\share</code> uses Kerberos; <code>\\\\10.0.0.50\\share</code> usually falls back to NTLM because there is no SPN for an IP.</p>` }
    ],
    cliTitle: 'CMD / PowerShell',
    cli: `# Show and clear your Kerberos tickets
C:\\> klist
C:\\> klist purge
C:\\> klist tgt

# Service Principal Names
C:\\> setspn -L fs1
C:\\> setspn -Q cifs/fs1.corp.local

# Time sync
C:\\> w32tm /query /status
C:\\> w32tm /resync
C:\\> w32tm /monitor

# Who am I and which groups (from the token)
C:\\> whoami /groups
C:\\> whoami /upn`,
    keypoints: [
      'Kerberos uses port 88; the KDC runs on every DC.',
      'AS exchange → TGT. TGS exchange → service ticket for an SPN. AP exchange → access.',
      'The password is never sent; tickets are encrypted with account keys.',
      'Clocks must be within 5 minutes; the PDC emulator is the domain time source.'
    ],
    quiz: [
      { q: 'What does a user receive after a successful AS exchange?', a: ['Service ticket', 'TGT', 'NTLM hash', 'Certificate'], c: 1, why: 'AS-REP delivers the Ticket-Granting Ticket.' },
      { q: 'Default maximum clock difference allowed by Kerberos in AD?', a: ['30 seconds', '1 minute', '5 minutes', '1 hour'], c: 2, why: 'More than 5 minutes skew → KRB_AP_ERR_SKEW.' },
      { q: 'Which port does Kerberos use?', a: ['53', '88', '389', '445'], c: 1, why: 'Kerberos = 88 (TCP and UDP).' },
      { q: 'Command to list your cached Kerberos tickets:', a: ['ipconfig /all', 'klist', 'gpresult /r', 'nltest'], c: 1, why: 'klist shows TGT and service tickets.' }
    ]
  });

  /* ===================================================== */
  const SETTINGS = ['Wallpaper', 'Screen lock', 'USB storage'];
  function gpoRow(s, layer, vals, cls) {
    const tb = s.$('.gpo tbody');
    const tr = h('tr', { class: 'gpo-r ' + (cls || '') }, h('th', {}, layer), SETTINGS.map((_, i) => h('td', { 'data-i': i }, vals[i] || '—')));
    tb.insertBefore(tr, s.$('.gpo-result'));
    return tr;
  }
  function gpoResult(s, res) {
    const tr = s.$('.gpo-result');
    SETTINGS.forEach((_, i) => {
      const td = tr.querySelector(`td[data-i="${i}"]`);
      const v = res[i] ? res[i][0] + ' (' + res[i][1] + ')' : '—';
      if (td.textContent !== v) { td.textContent = v; td.classList.remove('chg'); void td.offsetWidth; td.classList.add('chg'); }
    });
  }
  L.push({
    id: 'gpo',
    module: MOD,
    title: 'Group Policy (GPO)',
    minutes: 20,
    summary: 'Configure thousands of PCs centrally: LSDOU order, inheritance, Enforced, Block Inheritance and filtering.',
    sections: [
      { h: 'What Group Policy does', html: `
        <p>A <b>Group Policy Object (GPO)</b> is a set of settings — password rules, mapped drives, wallpaper, software installs, firewall, USB blocking, Windows Update… You <b>link</b> a GPO to a <b>site, domain or OU</b>, and every computer/user inside receives it.</p>
        <ul>
          <li><b>Computer Configuration</b> — applied at <b>startup</b>, to computer objects.</li>
          <li><b>User Configuration</b> — applied at <b>logon</b>, to user objects.</li>
          <li>Background refresh every <b>90 minutes ± 30</b> (DCs: 5 min). Force with <code>gpupdate /force</code>.</li>
          <li>Stored in two places: the GPO object in AD and the files in <b>SYSVOL</b> (<code>\\\\corp.local\\SYSVOL\\corp.local\\Policies\\{GUID}</code>).</li>
        </ul>` },
      { sim: {
        kind: 'stage',
        title: 'LSDOU: which setting wins?',
        desc: 'User Alice in OU Corp → Sales. Policies apply in order Local → Site → Domain → OU (parent → child). The LAST one applied wins.',
        cfg: { init: s => s.root.appendChild(h('table', { class: 'data gpo' }, h('thead', {}, h('tr', {}, h('th', {}, 'Applied (in order)'), SETTINGS.map(x => h('th', {}, x)))), h('tbody', {}, h('tr', { class: 'gpo-result' }, h('th', {}, '✔ Result for Alice'), SETTINGS.map((_, i) => h('td', { 'data-i': i }, '—')))))) },
        steps: [
          { text: '<b>L — Local policy</b> on the PC applies first: default wallpaper, lock after 15 min, USB allowed.', run: s => { gpoRow(s, '1. Local', ['default', '15 min', 'allowed']); s.res = [['default', 'Local'], ['15 min', 'Local'], ['allowed', 'Local']]; gpoResult(s, s.res); return s.wait(500); } },
          { text: '<b>S — Site</b> GPOs (linked to AD site HQ). None are set here, so nothing changes. (Site GPOs are rare.)', run: s => { gpoRow(s, '2. Site HQ', []); return s.wait(400); } },
          { text: '<b>D — Domain</b> GPO “Default Domain Policy”: screen lock 10 min. It overrides Local.', run: s => { gpoRow(s, '3. Domain', ['', '10 min', '']); s.res[1] = ['10 min', 'Domain']; gpoResult(s, s.res); return s.wait(500); } },
          { text: '<b>O — OU Corp</b>: company wallpaper and <b>USB blocked</b>.', run: s => { gpoRow(s, '4. OU Corp', ['corp.jpg', '', 'blocked']); s.res[0] = ['corp.jpg', 'OU Corp']; s.res[2] = ['blocked', 'OU Corp']; gpoResult(s, s.res); return s.wait(500); } },
          { text: '<b>Child OU Sales</b> applies last (closest to the user): sales wallpaper, lock after 30 min. <b>Closest wins.</b>', run: s => { gpoRow(s, '5. OU Sales', ['sales.jpg', '30 min', '']); s.res[0] = ['sales.jpg', 'OU Sales']; s.res[1] = ['30 min', 'OU Sales']; gpoResult(s, s.res); return s.wait(500); } },
          { text: 'Security says lock must be 10 min for everyone. They mark the domain GPO <b>Enforced</b>. An enforced GPO <b>cannot be overridden</b> by lower GPOs and even ignores Block Inheritance.', run: s => { const r = gpoRow(s, '★ Domain (Enforced)', ['', '10 min', ''], 'enforced'); r.querySelector('td[data-i="1"]').classList.add('win'); s.res[1] = ['10 min', 'Enforced']; gpoResult(s, s.res); return s.wait(500); } }
        ]
      } },
      { h: 'Controlling who gets a GPO', html: `
        <table class="data">
          <tr><th>Feature</th><th>Effect</th></tr>
          <tr><td><b>Block Inheritance</b> (on an OU)</td><td>OU ignores GPOs from above — except Enforced ones</td></tr>
          <tr><td><b>Enforced</b> (on a link)</td><td>Link wins over lower links and passes through Block Inheritance</td></tr>
          <tr><td><b>Security filtering</b></td><td>Apply only to certain users/computers/groups (default: Authenticated Users)</td></tr>
          <tr><td><b>WMI filtering</b></td><td>Apply only if a query is true (e.g. only laptops, only Windows 11)</td></tr>
          <tr><td><b>Loopback processing</b></td><td>Apply user settings based on the <i>computer’s</i> OU (kiosks, RDS servers)</td></tr>
          <tr><td>Link order</td><td>Several GPOs on one OU: link order 1 is applied last and wins</td></tr>
        </table>
        <div class="callout warn"><b>Domain password policy</b> (length, complexity, lockout) only works from a GPO linked at the <b>domain</b> level. For different password rules per group use <b>Fine-Grained Password Policies</b>.</div>` }
    ],
    cliTitle: 'CMD / PowerShell',
    cli: `# On a client: refresh and see what applied
C:\\> gpupdate /force
C:\\> gpresult /r
C:\\> gpresult /h C:\\gp-report.html
C:\\> rsop.msc

# GPO management (RSAT GroupPolicy module)
PS C:\\> New-GPO -Name "Block USB" | New-GPLink -Target "OU=Corp,DC=corp,DC=local"
PS C:\\> Set-GPLink -Name "Default Domain Policy" -Target "DC=corp,DC=local" -Enforced Yes
PS C:\\> Set-GPInheritance -Target "OU=Lab,DC=corp,DC=local" -IsBlocked Yes
PS C:\\> Get-GPInheritance -Target "OU=Sales,OU=Corp,DC=corp,DC=local"
PS C:\\> Get-GPOReport -Name "Block USB" -ReportType Html -Path C:\\usb.html
PS C:\\> Invoke-GPUpdate -Computer PC-042 -Force
PS C:\\> Backup-GPO -All -Path C:\\GPOBackup

# GUI: gpmc.msc (Group Policy Management Console)`,
    keypoints: [
      'Order: Local → Site → Domain → OU → child OU. Last applied wins.',
      'Enforced beats lower GPOs and Block Inheritance.',
      'Computer settings at startup, user settings at logon, refresh every 90 ± 30 min.',
      'Use gpresult /r and gpupdate /force to troubleshoot.'
    ],
    quiz: [
      { q: 'Domain GPO sets lock = 10 min, OU GPO sets lock = 30 min. No Enforced. Result?', a: ['10 min', '30 min', 'Both', 'Default'], c: 1, why: 'The OU GPO is applied later and wins.' },
      { q: 'Same as above but the domain link is Enforced. Result?', a: ['10 min', '30 min', 'Error', 'Random'], c: 0, why: 'Enforced links cannot be overridden by lower GPOs.' },
      { q: 'Command that shows the applied GPOs for the current user/computer:', a: ['gpupdate /force', 'gpresult /r', 'klist', 'dcdiag'], c: 1, why: 'gpresult shows the Resultant Set of Policy.' },
      { q: 'Where must a GPO with the domain password policy be linked?', a: ['Any OU', 'Domain level', 'Site level', 'Users container'], c: 1, why: 'Domain account policies come only from domain-linked GPOs (or Fine-Grained Password Policies).' }
    ]
  });

  /* ===================================================== */
  function chain(s, items) {
    const c = s.$('.agdlp');
    items.forEach(([cls, label, sub]) => {
      if (c.children.length) c.appendChild(h('div', { class: 'ag-arrow' }, '→'));
      c.appendChild(h('div', { class: 'ag ' + cls }, h('b', {}, label), h('small', {}, sub)));
    });
  }
  L.push({
    id: 'ad-groups',
    module: MOD,
    title: 'Users, Groups & Permissions',
    minutes: 20,
    summary: 'Group types and scopes, the AGDLP best practice, and NTFS vs share permissions.',
    sections: [
      { h: 'Groups: type and scope', html: `
        <p><b>Type:</b> <b>Security</b> groups get permissions; <b>Distribution</b> groups are only email lists.</p>
        <table class="data">
          <tr><th>Scope</th><th>Can contain</th><th>Can get permissions on</th><th>Use for</th></tr>
          <tr><td><b>Global</b> (GG_)</td><td>Users/groups from the <b>same domain</b></td><td>Any domain in the forest</td><td>Grouping <b>people</b> by role (GG_Sales)</td></tr>
          <tr><td><b>Domain Local</b> (DL_)</td><td>Users/groups from <b>any trusted domain</b></td><td>Only its <b>own domain</b></td><td>Grouping <b>access</b> to a resource (DL_SalesShare_RW)</td></tr>
          <tr><td><b>Universal</b> (UG_)</td><td>Users/groups from any domain in the forest</td><td>Any domain in the forest</td><td>Multi-domain forests (stored in the Global Catalog)</td></tr>
        </table>` },
      { sim: {
        kind: 'stage',
        title: 'AGDLP and effective permissions',
        desc: 'Accounts → Global groups → Domain Local groups → Permissions.',
        cfg: { init: s => s.root.append(h('div', { class: 'agdlp' }), h('div', { class: 'perm' })) },
        steps: [
          { text: '<b>A — Accounts:</b> Alice and Bob work in Sales.', run: s => { chain(s, [['acc', '👤 Alice, Bob', 'user accounts']]); return s.wait(400); } },
          { text: '<b>G — Global group:</b> put the people in a role group <code>GG_Sales</code>.', run: s => { chain(s, [['gg', '👥 GG_Sales', 'global group']]); return s.wait(400); } },
          { text: '<b>DL — Domain Local group:</b> create a group that means “modify access to the Sales share”: <code>DL_SalesShare_Modify</code>. Put GG_Sales inside it.', run: s => { chain(s, [['dl', '🔑 DL_SalesShare_Modify', 'domain local group']]); return s.wait(400); } },
          { text: '<b>P — Permission:</b> only the DL group is added to the folder ACL. New hire? Add them to GG_Sales — <b>never touch the folder permissions again</b>.', run: s => { chain(s, [['pm', '📁 \\\\fs1\\Sales', 'NTFS: Modify']]); return s.wait(400); } },
          { text: 'A folder shared over the network has <b>two</b> permission layers: <b>Share</b> and <b>NTFS</b>. Over the network the <b>most restrictive</b> of the two wins. Share = Read, NTFS = Modify → Alice gets <b>Read</b>.', run: s => { s.$('.perm').innerHTML = '<div class="perm-row"><span class="pl">Share permission</span><b class="pv r">Read</b></div><div class="perm-row"><span class="pl">NTFS permission</span><b class="pv m">Modify</b></div><div class="perm-row res"><span class="pl">Effective over network</span><b class="pv r">Read (most restrictive)</b></div>'; return s.wait(400); } },
          { text: 'Best practice: set Share = <b>Full Control for Authenticated Users</b> (or Everyone) and control access with <b>NTFS only</b>. Now Alice gets <b>Modify</b>. Locally (at the server console) only NTFS applies anyway.', run: s => { s.$('.perm').innerHTML = '<div class="perm-row"><span class="pl">Share permission</span><b class="pv f">Full Control</b></div><div class="perm-row"><span class="pl">NTFS permission</span><b class="pv m">Modify</b></div><div class="perm-row res"><span class="pl">Effective over network</span><b class="pv m">Modify ✓</b></div>'; return s.wait(400); } }
        ]
      } },
      { h: 'NTFS permission rules', html: `
        <ul>
          <li>Permissions are <b>cumulative</b>: Read from one group + Write from another = Read + Write.</li>
          <li><b>Deny beats Allow</b> at the same level. Order: explicit Deny → explicit Allow → inherited Deny → inherited Allow. So an explicit Allow on a sub-folder beats an inherited Deny.</li>
          <li>Permissions <b>inherit</b> from the parent folder by default. You can disable inheritance on a folder.</li>
          <li>Standard levels: Full Control · Modify · Read &amp; Execute · List folder contents · Read · Write.</li>
          <li>Moving a file inside the same NTFS volume keeps its permissions; copying gets the destination’s permissions.</li>
          <li>Use <b>Access-Based Enumeration</b> so users only see folders they can open.</li>
        </ul>` }
    ],
    cliTitle: 'PowerShell / CMD',
    cli: `# Groups
PS C:\\> New-ADGroup -Name GG_Sales -GroupScope Global -GroupCategory Security -Path "OU=Groups,DC=corp,DC=local"
PS C:\\> New-ADGroup -Name DL_SalesShare_Modify -GroupScope DomainLocal -GroupCategory Security -Path "OU=Groups,DC=corp,DC=local"
PS C:\\> Add-ADGroupMember -Identity GG_Sales -Members alice,bob
PS C:\\> Add-ADGroupMember -Identity DL_SalesShare_Modify -Members GG_Sales
PS C:\\> Get-ADGroupMember DL_SalesShare_Modify -Recursive
PS C:\\> Get-ADPrincipalGroupMembership alice

# Share + NTFS permissions
PS C:\\> New-SmbShare -Name Sales -Path D:\\Shares\\Sales -FullAccess "CORP\\Authenticated Users" -FolderEnumerationMode AccessBased
C:\\> icacls D:\\Shares\\Sales /grant "CORP\\DL_SalesShare_Modify:(OI)(CI)M"
C:\\> icacls D:\\Shares\\Sales
PS C:\\> Get-SmbShareAccess -Name Sales

# Users
PS C:\\> Unlock-ADAccount alice
PS C:\\> Set-ADAccountPassword alice -Reset -NewPassword (Read-Host -AsSecureString)
PS C:\\> Search-ADAccount -LockedOut
PS C:\\> Disable-ADAccount bob`,
    keypoints: [
      'Security groups get permissions; distribution groups are for email.',
      'AGDLP: users → Global → Domain Local → permission on the resource.',
      'Over the network the most restrictive of Share and NTFS applies.',
      'NTFS permissions add up; explicit Deny wins over Allow.'
    ],
    quiz: [
      { q: 'In AGDLP, which group gets the permission on the folder?', a: ['Global', 'Domain Local', 'Universal', 'The user'], c: 1, why: 'Accounts → Global → Domain Local → Permission.' },
      { q: 'Share = Change, NTFS = Read. Effective access over the network?', a: ['Change', 'Read', 'Full Control', 'None'], c: 1, why: 'Most restrictive of the two layers.' },
      { q: 'Alice gets Read from GG_A and Write from GG_B on the same folder. Result?', a: ['Read', 'Write', 'Read + Write', 'Access denied'], c: 2, why: 'NTFS allow permissions are cumulative.' },
      { q: 'Which group scope can contain users from any trusted domain but is used only within its own domain?', a: ['Global', 'Domain Local', 'Universal', 'Distribution'], c: 1, why: 'Domain Local groups gather access for resources in their own domain.' }
    ]
  });

  /* ===================================================== */
  L.push({
    id: 'ad-replication',
    module: MOD,
    title: 'Sites, Replication & FSMO Roles',
    minutes: 20,
    summary: 'Multi-master replication between DCs, AD sites, and the five special FSMO roles.',
    sections: [
      { h: 'Multi-master replication', html: `
        <p>Every DC holds a writable copy of AD (except <b>RODCs</b> — read-only DCs for branch offices). A change on any DC is <b>replicated</b> to the others. Changes are tracked with <b>USNs</b> (update sequence numbers).</p>
        <ul>
          <li><b>Sites</b> = your physical locations, defined by IP subnets. Clients log on to a DC in their own site.</li>
          <li><b>Intra-site</b> replication: fast, uncompressed, triggered by change notification (~15 s).</li>
          <li><b>Inter-site</b> replication: over <b>site links</b> on a schedule (default every <b>180 min</b>, min 15), compressed, between <b>bridgehead</b> servers.</li>
          <li>The <b>KCC</b> (Knowledge Consistency Checker) builds the replication topology automatically.</li>
          <li><b>SYSVOL</b> is replicated separately with <b>DFS-R</b>.</li>
        </ul>` },
      { sim: {
        title: 'A password reset travels between sites',
        cfg: {
          w: 860, h: 380,
          zones: [{ x: 20, y: 30, w: 480, h: 330, label: 'Site HQ (10.0.0.0/16)', color: 'blue' }, { x: 560, y: 30, w: 280, h: 330, label: 'Site Branch (10.50.0.0/16)', color: 'orange' }],
          nodes: [
            { id: 'adm', type: 'pc', x: 90, y: 280, label: 'Helpdesk PC' },
            { id: 'dc2', type: 'server', x: 230, y: 130, label: 'DC2' },
            { id: 'dc1', type: 'server', x: 400, y: 130, label: 'DC1', sub: 'PDC emulator' },
            { id: 'dc3', type: 'server', x: 700, y: 130, label: 'DC3', sub: 'Branch DC' },
            { id: 'u', type: 'laptop', x: 700, y: 290, label: 'Alice (branch)' }
          ],
          links: [{ a: 'adm', b: 'dc2' }, { a: 'dc2', b: 'dc1', label: 'intra-site' }, { a: 'dc1', b: 'dc3', cls: 'wan', label: 'site link (180 min)' }, { a: 'u', b: 'dc3' }],
          tables: [{ id: 'pw', title: 'Alice’s password on each DC', cols: ['DC', 'Password', 'USN'], rows: [['DC1', 'old', '5001'], ['DC2', 'old', '7120'], ['DC3', 'old', '3300']] }]
        },
        steps: [
          { text: 'The helpdesk resets Alice’s password. The change is written on <b>DC2</b> (the DC the admin tool connected to) and gets a new USN.', run: async t => { await t.send(['adm', 'dc2'], { label: 'Reset alice pw', color: 'orange' }); t.setRows('pw', [['DC1', 'old', '5001'], ['DC2', 'NEW', '7121'], ['DC3', 'old', '3300']], 1); } },
          { text: 'Password changes are special: DC2 forwards them <b>immediately</b> to the <b>PDC emulator</b> (DC1) — urgent replication.', run: async t => { await t.send(['dc2', 'dc1'], { label: 'urgent: pw change', color: 'red' }); t.setRows('pw', [['DC1', 'NEW', '5002'], ['DC2', 'NEW', '7121'], ['DC3', 'old', '3300']], 0); } },
          { text: 'Alice in the branch logs on with the new password at <b>DC3</b>. DC3 has not received the change yet (next site-link replication is later)…', run: async t => { await t.send(['u', 'dc3'], { label: 'logon (new pw)', color: 'blue' }); t.say('dc3', 'Wrong password?', 1500, 'bad'); await t.wait(600); } },
          { text: '…so before rejecting it, DC3 <b>re-checks the password with the PDC emulator</b>. The PDCe has it → logon succeeds. This is why the PDC emulator is important.', run: async t => { await t.send(['dc3', 'dc1'], { label: 'check with PDCe', color: 'purple' }); await t.send(['dc1', 'dc3'], { label: 'password OK', color: 'green' }); await t.send(['dc3', 'u'], { label: 'Logon ✓', color: 'green' }); } },
          { text: 'At the next scheduled interval the <b>bridgeheads</b> replicate all changes over the site link. All DCs converge.', run: async t => { await t.send(['dc1', 'dc3'], { label: 'replication', color: 'gray' }); t.setRows('pw', [['DC1', 'NEW', '5002'], ['DC2', 'NEW', '7121'], ['DC3', 'NEW', '3301']], 2); } },
          { text: 'The 5 <b>FSMO roles</b> (single-master jobs) — here all on DC1. If the PDC emulator is down for long: password and time problems, lockouts not counted centrally.', run: t => { t.badge('dc1', 'Schema · Naming · RID · PDC · Infra', 'root'); t.badge('dc3', 'GC', 'ok'); return t.flash('dc1', 'purple'); } }
        ]
      } },
      { h: 'The 5 FSMO roles', html: `
        <table class="data">
          <tr><th>Role</th><th>Scope</th><th>Job</th></tr>
          <tr><td><b>Schema Master</b></td><td>Forest (1)</td><td>Only DC that can change the schema (e.g. Exchange install)</td></tr>
          <tr><td><b>Domain Naming Master</b></td><td>Forest (1)</td><td>Add/remove domains in the forest</td></tr>
          <tr><td><b>RID Master</b></td><td>Domain (1 each)</td><td>Hands out blocks of RIDs so each DC can create objects with unique SIDs</td></tr>
          <tr><td><b>PDC Emulator</b></td><td>Domain (1 each)</td><td>Time source, password changes, account lockout, GPO editing default</td></tr>
          <tr><td><b>Infrastructure Master</b></td><td>Domain (1 each)</td><td>Updates references to objects in other domains</td></tr>
        </table>
        <p><b>Transfer</b> a role when the old holder is online; <b>seize</b> it only if the old DC is gone forever (never bring that DC back).</p>
        <p><b>Backups:</b> back up the System State of at least one DC. <b>AD Recycle Bin</b> lets you restore deleted objects with all attributes.</p>` }
    ],
    cliTitle: 'CMD / PowerShell',
    cli: `# Replication health
C:\\> repadmin /replsummary
C:\\> repadmin /showrepl
C:\\> repadmin /syncall /AdeP
C:\\> dcdiag /v

# FSMO roles
C:\\> netdom query fsmo
PS C:\\> Get-ADDomain | Select PDCEmulator,RIDMaster,InfrastructureMaster
PS C:\\> Get-ADForest | Select SchemaMaster,DomainNamingMaster
PS C:\\> Move-ADDirectoryServerOperationMasterRole -Identity DC2 -OperationMasterRole PDCEmulator,RIDMaster
# seize (old DC is dead):  add  -Force

# Sites
PS C:\\> New-ADReplicationSite -Name Branch
PS C:\\> New-ADReplicationSubnet -Name "10.50.0.0/16" -Site Branch
PS C:\\> Get-ADReplicationSiteLink -Filter * | Select Name,Cost,ReplicationFrequencyInMinutes

# Recycle Bin
PS C:\\> Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target corp.local
PS C:\\> Get-ADObject -Filter 'isDeleted -eq $true' -IncludeDeletedObjects | Restore-ADObject`,
    keypoints: [
      'All writable DCs replicate changes to each other (multi-master).',
      'Sites map subnets to locations; inter-site replication runs on a schedule (default 180 min).',
      'FSMO: Schema & Domain Naming (forest); RID, PDC Emulator, Infrastructure (each domain).',
      'Password changes go urgently to the PDC emulator.'
    ],
    quiz: [
      { q: 'Which FSMO role is the domain time source and handles password changes?', a: ['RID Master', 'PDC Emulator', 'Schema Master', 'Infrastructure Master'], c: 1, why: 'The PDC emulator is the authoritative time source and gets urgent password updates.' },
      { q: 'How many FSMO roles are forest-wide?', a: ['1', '2', '3', '5'], c: 1, why: 'Schema Master and Domain Naming Master.' },
      { q: 'Default inter-site replication interval?', a: ['15 seconds', '15 minutes', '180 minutes', '24 hours'], c: 2, why: 'Site links replicate every 180 minutes by default.' },
      { q: 'Command for a quick replication health summary:', a: ['repadmin /replsummary', 'gpupdate /force', 'klist', 'ipconfig /all'], c: 0, why: 'repadmin /replsummary shows failures and largest deltas.' },
      { q: 'A read-only domain controller for a branch office is called…', a: ['BDC', 'RODC', 'GC', 'PDCe'], c: 1, why: 'RODC = Read-Only Domain Controller.' }
    ]
  });
})();
