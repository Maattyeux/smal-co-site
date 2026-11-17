// Carte des partenaires (Leaflet), sortie de partenaires.html pour une CSP sans script inline
(function () {
 var el = document.getElementById('p-map'); if (!el || !window.L) return;
 var ig = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>';
 var globe = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>';
 var hobby = 'https://www.hobbycycles.com/';
 var pts = [
  { n: 'Hobby Cycles — Brest', a: '70 Bd Montaigne, 29200 Brest', ll: [48.403982, -4.480120], logo: 'logos/hobby-cycles.png', ig: 'https://www.instagram.com/hobbycyclesbrest', web: hobby },
  { n: 'Hobby Cycles — Concarneau', a: '4 Rue Henri Fabre, ZA de Keramporiel, 29900 Concarneau', ll: [47.901385, -3.909777], logo: 'logos/hobby-cycles.png', ig: 'https://www.instagram.com/hobbycyclesconcarneau', web: hobby },
  { n: 'Overstim.s — Plescop', a: 'Espace Activité Tréhuinec, 3 Rue Denis Papin, 56890 Plescop', ll: [47.686523, -2.800797], logo: 'logos/overstims.png', ig: 'https://www.instagram.com/overstims', web: 'https://www.overstims.com/' },
  { n: 'PG Tubes — Kersaint-Plabennec', a: 'ZA de Pen ar Forest, 29860 Kersaint-Plabennec', ll: [48.459831, -4.357611], logo: 'logos/pg-tubes.png', ig: 'https://www.instagram.com/pgtubes', web: 'https://pgtubes.fr/' },
  // coordonnées : Base Adresse Nationale (api-adresse.data.gouv.fr) ; CKI COM = centre de la ZI, pas de numéro
  { n: 'Aquaself — Guipavas', a: '360 Rue Robert Schuman, ZA, 29490 Guipavas', ll: [48.44062, -4.40843], logo: 'logos/aquaself.png', ig: 'https://www.instagram.com/aquaself_bretagne/', web: 'https://www.aquaself.fr/' },
  { n: 'CKI COM — Saint-Pol-de-Léon', a: 'ZI de Kerrannou, 29250 Saint-Pol-de-Léon', ll: [48.66885, -4.002273], logo: 'logos/ckicom.png', ig: 'https://www.instagram.com/ckicom2017/', web: 'https://www.ckicom.fr/' }
 ];
 var map = L.map(el, { scrollWheelZoom: true, touchZoom: true });
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(map);
 // Épingle 28px tournée de 45° : la pointe tombe à 14 + 14·√2 ≈ 34px sous le haut
 var pin = L.divIcon({ className: 'p-pin', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 34], popupAnchor: [0, -34] });
 var blank = ' target="_blank" rel="noopener noreferrer"';
 var markersGroup = L.featureGroup(pts.map(function (p) {
  return L.marker(p.ll, { icon: pin, title: p.n, alt: p.n }).bindPopup(
   '<div class="p-pop"><div class="p-pop-logo"><img src="' + p.logo + '" alt="" loading="lazy" decoding="async"></div>' +
   '<h3>' + p.n + '</h3><p>' + p.a + '</p><div class="p-pop-links">' +
   '<a class="btn btn-ghost btn-small"' + blank + ' href="' + p.ig + '">' + ig + 'Instagram</a>' + // même style que le lien web (le bouton plein était blanc sur blanc)
   (p.web ? '<a class="btn btn-ghost btn-small"' + blank + ' href="' + p.web + '">' + globe + p.web.replace(/^https:\/\/(www\.)?|\/$/g, '') + '</a>' : '') +
   '</div></div>', { maxWidth: 280, minWidth: 240 });
 })).addTo(map);
 map.fitBounds(markersGroup.getBounds().pad(0.12));
})();
