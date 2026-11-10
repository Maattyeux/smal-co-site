// Contrôle de sécurité hebdomadaire du site en ligne (lancé par .github/workflows/securite-hebdo.yml).
// Compare le site servi par Netlify au dépôt : en-têtes, scripts présents dans les pages, fichiers de code,
// formulaire de contact. Toute anomalie fait échouer le contrôle, et GitHub envoie alors un e-mail.
// Usage local : node .github/scripts/check-securite.mjs   (SITE=https://... pour viser une autre adresse)
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SITE = (process.env.SITE || 'https://smal-co-web.netlify.app').replace(/\/$/, '');
const sha = (buf, enc = 'hex') => createHash('sha256').update(buf).digest(enc);
const problems = [], notes = [];
const fail = (m) => problems.push(m);

async function get(path) {
  const r = await fetch(SITE + path, { redirect: 'follow', headers: { 'user-agent': 'smal-securite-hebdo' } });
  return { status: r.status, headers: r.headers, buf: Buffer.from(await r.arrayBuffer()) };
}

// --- Référence : la CSP et les empreintes de scripts inline autorisées, lues dans _headers du dépôt
const headersFile = readFileSync('_headers', 'utf8');
const cspRepo = headersFile.match(/Content-Security-Policy:\s*(.+)/)[1].trim();
const allowedInline = new Set([...cspRepo.matchAll(/'(sha256-[^']+)'/g)].map((m) => m[1]));
// /.netlify/scripts/ : barre d'outils injectée par Netlify lui-même (même origine)
const allowedScriptSrc = [/^\/?assets\//, /^\/\.netlify\/scripts\//,/^https:\/\/unpkg\.com\/leaflet@1\.9\.4\//, /^https:\/\/www\.google\.com\/recaptcha\//, /^https:\/\/www\.gstatic\.com\/recaptcha\//];

// --- 1. En-têtes de sécurité
const home = await get('/');
const required = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-robots-tag'];
for (const h of required) if (!home.headers.get(h)) fail(`En-tête manquant : ${h}`);
if ((home.headers.get('content-security-policy') || '').trim() !== cspRepo) fail('La CSP servie diffère de celle du dépôt (_headers)');

// --- 2. Pages : en ligne, scripts attendus uniquement, pas d'adresse e-mail en clair, pas d'iframe
const pages = readdirSync('.').filter((f) => f.endsWith('.html') && f !== '404.html');
for (const p of pages) {
  const r = await get('/' + p);
  if (r.status !== 200) { fail(`${p} : HTTP ${r.status}`); continue; }
  const html = r.buf.toString('utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1], src = attrs.match(/\bsrc=["']([^"']+)["']/);
    if (src) { if (!allowedScriptSrc.some((re) => re.test(src[1]))) fail(`${p} : script externe inattendu ${src[1]}`); }
    else if (!/ld\+json/.test(attrs) && !allowedInline.has('sha256-' + sha(m[2], 'base64'))) fail(`${p} : script inline inconnu (sha256-${sha(m[2], 'base64')})`);
  }
  if (/smal\.partner@gmail\.com/i.test(html)) fail(`${p} : adresse e-mail en clair dans le HTML`);
  if (/<iframe\b/i.test(html)) fail(`${p} : iframe inattendue`);
}

// --- 3. Fichiers de code identiques au dépôt (détecte une modification du site déployé)
const codeFiles = ['assets/site.js', 'assets/site.css', 'assets/partenaires-map.js', 'robots.txt', '.well-known/security.txt', 'site.webmanifest', 'fonts/inter-variable.woff2'];
for (const f of codeFiles) {
  const r = await get('/' + f);
  if (r.status !== 200) fail(`${f} : HTTP ${r.status}`);
  else if (sha(r.buf) !== sha(readFileSync(f))) fail(`${f} : contenu en ligne différent du dépôt`);
}

// --- 4. Fichiers de politique
if (!/Disallow:\s*\/\s*$/m.test(readFileSync('robots.txt', 'utf8'))) fail('robots.txt n’interdit plus l’indexation');
const exp = new Date(readFileSync('.well-known/security.txt', 'utf8').match(/Expires:\s*(\S+)/)[1]);
const days = Math.round((exp - Date.now()) / 864e5);
if (days < 30) fail(`security.txt expire dans ${days} jours : mettre à jour la ligne Expires`);

// --- 5. Formulaire de contact tel que servi (Netlify réécrit le HTML : guillemets simples, data-netlify retiré)
const contact = (await get('/contact.html')).buf.toString('utf8');
const form = contact.match(/<form\b[^>]*name=["']contact["'][\s\S]*?<\/form>/i)?.[0] || '';
const tag = (name) => [...form.matchAll(/<(?:input|textarea|select)\b[^>]*>/gi)].map((m) => m[0]).find((t) => new RegExp(`name=["']${name}["']`).test(t)) || '';
if (!form) fail('Formulaire « contact » introuvable');
else {
  const checks = {
    'champ piège bot-field': tag('bot-field') !== '',
    'champ caché form-name=contact': /value=["']contact["']/.test(tag('form-name')),
    'champ caché subject (filtre Gmail)': /REPONSE CONTACT SITE WEB/.test(tag('subject')),
    'validation de l’e-mail': /\bpattern=/.test(tag('email')),
    'case de consentement obligatoire': /\brequired\b/.test(tag('consentement')),
    'reCAPTCHA': /recaptcha/i.test(form),
  };
  for (const [label, ok] of Object.entries(checks)) if (!ok) fail(`Formulaire : ${label} absent`);
}

// --- 6. Option : configuration Netlify (si le secret NETLIFY_AUTH_TOKEN est défini dans GitHub)
if (process.env.NETLIFY_AUTH_TOKEN) {
  const api = (u) => fetch('https://api.netlify.com/api/v1' + u, { headers: { authorization: 'Bearer ' + process.env.NETLIFY_AUTH_TOKEN } }).then((r) => r.json());
  const site = await api('/sites/smal-co-web.netlify.app');
  const hooks = await api(`/hooks?site_id=${site.id}`);
  if (!hooks.some((h) => h.event === 'submission_created' && h.type === 'email' && !h.disabled)) fail('Netlify : plus aucune notification e-mail sur les envois du formulaire');
  const forms = await api(`/sites/${site.id}/forms`);
  const c = forms.find((f) => f.name === 'contact');
  if (!c) fail('Netlify : formulaire « contact » non détecté');
  else notes.push(`Messages reçus au total : ${c.submission_count}`);
} else notes.push('Contrôle Netlify ignoré (secret NETLIFY_AUTH_TOKEN non défini)');

console.log(`Site contrôlé : ${SITE}`);
notes.forEach((n) => console.log('ℹ ' + n));
if (problems.length) { problems.forEach((p) => console.log('✗ ' + p)); console.log(`\n${problems.length} anomalie(s).`); process.exit(1); }
console.log('✓ Aucune anomalie.');
