// Not a secret: Firebase web config is meant to be public. Access control
// lives in Firestore's own security rules (see firestore.rules in this
// repo), not in hiding this file.
var firebaseConfig = {
  apiKey: "AIzaSyAL4aSZAMvVUUYakgxXfHeslcO0h89Vb2k",
  authDomain: "carnetpiste.firebaseapp.com",
  projectId: "carnetpiste",
  storageBucket: "carnetpiste.firebasestorage.app",
  messagingSenderId: "479200716688",
  appId: "1:479200716688:web:24641f978aa1683d15f515"
};
firebase.initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3) : prouve à Firebase que les requêtes viennent bien
// de Pitbook, et pas d'un script qui réutiliserait la clé ci-dessus.
// La clé de site reCAPTCHA est publique elle aussi. Vide = App Check éteint.
var APPCHECK_SITE_KEY = '6LdcvB8uAAAAAKjZPCFGsfPLxscH7h9Yk2Bn-NaQ';
if (APPCHECK_SITE_KEY && firebase.appCheck && /(^|\.)pitbook\.fr$|firebaseapp\.com$/.test(location.hostname)) {
  try { firebase.appCheck().activate(new firebase.appCheck.ReCaptchaV3Provider(APPCHECK_SITE_KEY), true); } catch (e) {}
}

// Notifications push : clé publique « Web Push » (VAPID) du projet, publique
// elle aussi (Firebase › Paramètres du projet › Cloud Messaging › Certificats
// Web Push). Vide = le bouton « Activer » n'apparaît pas.
var PUSH_VAPID_KEY = '';
