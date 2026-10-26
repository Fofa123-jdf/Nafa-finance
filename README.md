# Nafa Finance

Application membre : `/member/` · Espace administrateur : `/admin/`

## Déploiement sur Render (Web Service Node)
- Build : `npm install` · Start : `npm start`
- Variables générales :
  - `DATABASE_URL` : lien de la base PostgreSQL Render
  - `JWT_SECRET` : phrase secrète longue (au moins 32 caractères)
  - `ADMIN_PHONE` et `ADMIN_PASSWORD` : identifiants du compte administrateur
  - `PUBLIC_BASE_URL` : URL HTTPS publique de l’application (par défaut `https://nafa-finance.onrender.com`)

## Orange Money Web Payment — mode test uniquement par défaut

Le serveur dispose désormais d’un adaptateur pour initialiser un paiement Orange Money Web Payment et vérifier ensuite son statut auprès de l’API Orange. L’absence de configuration ne crée pas de cotisation en attente et ne débite aucun compte. Le statut « validé » n’est écrit que lorsqu’une réponse de statut du fournisseur est reconnue comme positive.

Variables à configurer dans **Render → service nafa-finance → Environment**, jamais dans le code GitHub :
- `ORANGE_MONEY_MODE=sandbox`
- `ORANGE_MONEY_CLIENT_ID` : identifiant client fourni par Orange Developer
- `ORANGE_MONEY_CLIENT_SECRET` : secret correspondant
- `ORANGE_MONEY_MERCHANT_KEY` : clé marchand Web Payment fournie par Orange
- `ORANGE_MONEY_CURRENCY` : devise exacte indiquée pour le compte de test (l’adaptateur utilise `OUV` par défaut en sandbox)
- `ORANGE_MONEY_API_BASE_URL` : facultatif en sandbox ; par défaut l’URL de développement Orange Web Payment
- `ORANGE_MONEY_TOKEN_URL` : facultatif ; par défaut l’endpoint OAuth Orange

Orange doit d’abord autoriser l’accès à l’API et fournir les identifiants appropriés. Le test sandbox n’est pas un paiement sur un compte personnel réel et peut utiliser des comptes de test spécifiques. Les clients secrets et clés ne doivent jamais être transmis dans une conversation ni enregistrés dans le dépôt.

**La production est bloquée par défaut.** Pour une éventuelle mise en production, il faut que le dossier marchand, les obligations juridiques/réglementaires et les conditions Orange soient validés. Le mode `production` exige explicitement `ORANGE_MONEY_ALLOW_PRODUCTION=1`, une URL API et une devise renseignées.

## État des autres moyens de paiement

- **MTN MoMo, Wave et Moov Money** : parcours d’API officielle non encore intégré. L’application affiche un message et n’enregistre pas une cotisation qui n’a pas été transmise au prestataire.
- **Versements sortants** : à intégrer et tester séparément, avec confirmations finales et contrôles des bénéficiaires.
- Aucun test technique ne constitue une autorisation de collecter, conserver ou redistribuer des fonds réels.


## Administration sécurisée (branche de préparation)

L'administration s'appuie sur la même API et la même base PostgreSQL que l'application membre. Les changements de sécurité sont préparés sur `feature/secure-admin-roles` et ne sont pas publiés sur `main` par cette opération.

### Rôles

- `admin` : administrateur principal, accès complet et gestion de l'équipe.
- `manager` : membres, groupes, rappels, support et documents autorisés.
- `accountant` : lectures financières, rapports, commissions et préparation des versements. Les validations de cotisation déclenchent une vérification auprès du prestataire ; elles ne peuvent pas simplement forcer le statut.
- `auditor` : lecture seule des rapports financiers et du journal d'audit.

Les contrôles de rôle sont effectués dans l'API, pas seulement dans le menu de l'interface. Chaque requête protégée vérifie aussi en base le statut et le rôle actuels du compte. Les versions de session permettent de révoquer les sessions du personnel après changement de rôle, désactivation ou réinitialisation du mot de passe.

### Journal et protection

- Le journal `admin_audit_log` conserve l'identité de l'acteur, le rôle, la méthode, le chemin, le résultat HTTP et l'heure ; il ne stocke pas les mots de passe ni les corps de requête.
- Les en-têtes de protection HTTP sont ajoutés et les réponses API portent `Cache-Control: no-store`.
- Les connexions PostgreSQL et les délais des requêtes sont limités pour éviter que des opérations bloquées immobilisent le serveur.
- Les tentatives de connexion répétées à un même numéro sont temporairement limitées.
- Les cotisations en attente ne peuvent pas être validées à la main sans vérification du prestataire configuré.
- `GET /api/health` vérifie la connexion à la base sans exposer de données personnelles.

### Tests

Exécuter `npm test` pour lancer les tests automatiques de la politique des rôles avec le test runner intégré à Node.js.

### Avant le passage en production

1. Exécuter les tests et vérifier le déploiement de prévisualisation.
2. Vérifier la configuration des sauvegardes PostgreSQL et réaliser un test de restauration.
3. Configurer les clés et URL officielles des prestataires uniquement dans les variables d'environnement de Render.
4. Tester les paiements en sandbox et séparer les données de test des données réelles.
5. Obtenir les approbations juridiques, réglementaires et marchandes nécessaires avant d'encaisser ou de redistribuer des fonds.
