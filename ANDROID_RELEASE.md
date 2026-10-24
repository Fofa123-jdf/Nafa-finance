# NAFA FINANCE — Préparation Android / Google Play

Dernière mise à jour : 24 octobre 2026

## Application à publier

- Nom prévu : **NAFA FINANCE**
- Version publique : espace membre, démarré sur `/member/`
- URL actuelle : https://nafa-finance.onrender.com/member/
- Espace administrateur : https://nafa-finance.onrender.com/admin/ — réservé aux administrateurs, ne pas utiliser comme écran de lancement de l’application publique.
- Dépôt de référence : https://github.com/Fofa123-jdf/Nafa-finance

## État constaté du projet

Le serveur expose déjà un manifeste Web pour l’espace membre (`/assets/member.webmanifest`) et un service worker (`/member/sw.js`). Cela permet d’évaluer un emballage Android en Trusted Web Activity (TWA), sous réserve que les contrôles de qualité PWA soient réussis.

Le fichier Android App Bundle (.aab) n’est **pas encore construit ni signé**. Le nom du paquet Android définitif, le certificat de signature et le fichier Digital Asset Links doivent être arrêtés ensemble avant la première publication.

Les paiements actuellement intégrés ne doivent pas être présentés comme tous opérationnels :
- Orange Money dispose d’un parcours de paiement dont les identifiants et le mode doivent être vérifiés auprès du prestataire.
- MTN Money, Wave et Moov Money nécessitent encore leurs intégrations officielles.
- Aucune simulation ne doit être assimilée à une cotisation réelle.

## Étapes de préparation Android

À exécuter sur un ordinateur doté de Node.js, Java et des outils Android :

1. Installer Bubblewrap : `npm install -g @bubblewrap/cli`
2. Vérifier la PWA : `bubblewrap validate --url=https://nafa-finance.onrender.com/member/`
3. Initialiser le projet à partir du manifeste membre : `bubblewrap init --manifest=https://nafa-finance.onrender.com/assets/member.webmanifest`
4. Confirmer le nom de paquet définitif après vérification de l’identité de l’éditeur et de la disponibilité du nom souhaité. Ne pas publier une première version avec un identifiant provisoire.
5. Créer et sauvegarder de façon sécurisée la clé de signature. Ne jamais committer la clé ni ses mots de passe dans GitHub.
6. Générer l’APK de test et l’App Bundle avec `bubblewrap build`, puis installer l’APK sur un téléphone Android.
7. Après génération de la clé, créer `/.well-known/assetlinks.json` avec le nom de paquet et l’empreinte SHA-256 du certificat correspondant. Si Google Play App Signing est activé, vérifier le certificat d’application Play Console et y associer le bon certificat.
8. Valider la navigation, les liens externes, les erreurs réseau, l’inscription, la connexion, les droits membre/administrateur et tous les écrans avant toute soumission.

Documentation officielle :
- Trusted Web Activity : https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
- Bubblewrap : https://github.com/GoogleChromeLabs/bubblewrap
- Types de compte Google Play : https://support.google.com/googleplay/android-developer/answer/13634885

## Pré-requis de publication Google Play

- Compte développeur validé au nom de l’éditeur approprié. Google Play indique qu’un compte Organisation est requis pour les applications fournissant des services financiers ; le compte Organisation exige notamment un numéro D‑U‑N‑S.
- Identité juridique de l’éditeur et documents d’entreprise cohérents avec la fiche du développeur.
- Politique de confidentialité publiée sur une URL publique stable.
- Formulaire « Sécurité des données » renseigné exactement selon les données collectées et partagées.
- Déclarations de fonctionnalités et de services financiers dans Play Console.
- Nom, description, icône, captures d’écran et visuels de fiche finalisés.
- Accès de démonstration et instructions de test pour les vérificateurs, sans communiquer de vrais secrets ni exposer de données de clients.
- Validation des obligations locales et des accords avec chaque prestataire de paiement avant d’activer les paiements de production.

## Liste de contrôle avant publication

- [ ] Vérification fonctionnelle complète membre et administrateur.
- [ ] Nettoyage des enregistrements de simulation exclusivement identifiés comme tests.
- [ ] Confirmation de la base de données et sauvegarde vérifiée.
- [ ] Audit des droits d’accès, des sessions et des données personnelles.
- [ ] Test PWA / TWA réussi sur téléphone Android.
- [ ] Nom du paquet et version définitifs.
- [ ] Clé de signature sauvegardée hors du dépôt.
- [ ] Digital Asset Links validé.
- [ ] Politique de confidentialité et déclaration de données validées.
- [ ] Dossier juridique et autorisations nécessaires confirmés.
- [ ] Paiements de production testés avec les accès officiels autorisés.
- [ ] App Bundle (.aab) signé et testé avant soumission.
- [ ] Publication soumise à Google Play et approbation reçue.

Ce document décrit le chemin de préparation ; il ne signifie pas que l’application est déjà approuvée par Google Play ni que les intégrations de paiement sont toutes activées.
