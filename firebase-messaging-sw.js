// Fichier attendu par le SDK Firebase : quand les notifications sont
// autorisées, l'appel des fonctions (mails Pitbook) l'enregistre au
// passage. Les vraies notifications push passent par sw.js : celui-ci
// ne fait rien.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('push', function () {});
