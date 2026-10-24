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
