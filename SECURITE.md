# Sécurité du site SMAL & CO

Ce dépôt est public : n'y mettez jamais de mot de passe, de clé ni de jeton.

## Configuration en place

**Site (Netlify, `smal-co-web`)**
- En-têtes de sécurité dans `_headers` : HSTS (préchargement), CSP stricte (scripts du site, Leaflet avec SRI, reCAPTCHA), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP, `X-Robots-Tag: noindex`.
- Non-référencement : `robots.txt` (Disallow), meta `noindex, nofollow` sur toutes les pages.
- Signalement de faille : `/.well-known/security.txt` (renvoie vers la page Contact ; à renouveler avant la date `Expires`).
- Adresse e-mail de l'association absente du HTML : reconstituée par `assets/site.js` (attributs `data-u` / `data-d`).
- Aperçus de branches protégés par la connexion Netlify.

**Formulaire de contact (`contact.html`, formulaire Netlify `contact`)**
- Anti-robots : champ piège `bot-field` + reCAPTCHA Netlify (`data-netlify-recaptcha`) + filtre anti-spam Netlify.
- Validation : e-mail strict, nom ≤ 100 caractères, message 10 à 5 000 caractères, consentement obligatoire.
- Notification Netlify « nouvelle soumission » vers la boîte de l'association ; filtre Gmail sur le sujet → libellé `website`.
- **Ne pas modifier** le champ caché `subject` ni le nom du champ `email` sans mettre à jour le filtre Gmail.
- Conservation annoncée : 3 ans au plus après le dernier échange (page Confidentialité).

## Revue trimestrielle (janvier, avril, juillet, octobre)
- [ ] Netlify : membres de l'équipe, applications autorisées et jetons (User settings → Applications), projets inutilisés.
- [ ] Google (compte du président et boîte de l'association) : Bilan de sécurité, appareils connectés, applications tierces, transferts et filtres Gmail.
- [ ] Envoyer un message test depuis la page Contact et vérifier son arrivée sous `website`.
- [ ] Vérifier la date `Expires` de `security.txt`.

## En cas de compte compromis
1. **Couper l'accès** : changer le mot de passe Google concerné, puis « Se déconnecter de tous les appareils » (Google → Sécurité → Vos appareils).
2. **Révoquer** : applications tierces Google, applications et jetons Netlify (User settings → Applications), clés d'accès GitHub.
3. **Vérifier les pièges** : règles de transfert et filtres Gmail, adresses de récupération, notifications Netlify (Forms → Form notifications), derniers déploiements Netlify (revenir à un déploiement sain si besoin).
4. **Prévenir** les partenaires dont les échanges ont pu être lus, et la CNIL sous 72 h si des données personnelles ont fuité.
5. **Noter** ce qui s'est passé et ce qui a été changé.
