# Nafa Finance

Application membre : `/member/` · Espace administrateur : `/admin/`

## Déploiement sur Render (Web Service Node)
- Build : `npm install` · Start : `npm start`
- Variables d'environnement :
  - `DATABASE_URL` : lien de votre base PostgreSQL Render
  - `JWT_SECRET` : une longue phrase secrète (au moins 32 caractères)
  - `ADMIN_PHONE` et `ADMIN_PASSWORD` : identifiants du compte administrateur (créé au démarrage)

Les tables sont créées automatiquement au premier démarrage.

## Non inclus
Vrais paiements Mobile Money (Wave, Orange, MTN), OTP SMS, parrainage : les paiements sont enregistrés « en attente » puis validés à la main par l'administrateur.
