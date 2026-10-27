# Procédure urgente — sauvegarde de la base NAFA FINANCE

**État vérifié le 27 octobre 2026.** La base Render **nafa-finance-db** est sur l'offre gratuite et son expiration affichée est le **28 octobre 2026 à 01:06:35 UTC** (même heure en Côte d'Ivoire). La base est actuellement accessible au service NAFA FINANCE, mais sa liste d'adresses IP autorisées est vide ; la connexion externe depuis un PC est donc bloquée.

Render confirme que les bases PostgreSQL gratuites expirent après 30 jours, n'ont pas de sauvegardes gérées et deviennent inaccessibles à l'expiration. Elles peuvent être mises à niveau pendant la période de grâce de 14 jours avant suppression. Documentation : https://render.com/docs/free et https://render.com/docs/postgresql-backups

## Sauvegarder depuis Windows

1. Dans le tableau de bord Render, ouvrir la base **nafa-finance-db**, puis la section **Networking**. Depuis le PC Windows utilisé pour la sauvegarde, relever l'adresse IP publique actuelle et l'ajouter à la liste autorisée avec un masque `/32`. **Ne pas ouvrir l'accès à `0.0.0.0/0`.**
2. Dans la page de connexion de la base, copier l'URL de connexion **externe**. Garder cette URL privée : elle contient les informations d'accès. Ne pas la transmettre dans une conversation, une capture d'écran ou le dépôt Git.
3. Installer les outils client PostgreSQL **18 ou plus récent** sur Windows (ils doivent inclure `pg_dump` et `pg_restore`).
4. Télécharger `scripts/backup-render-postgres.ps1` depuis cette branche et l'ouvrir dans PowerShell. Exécuter ces commandes dans l'ordre : `Set-ExecutionPolicy -Scope Process Bypass`, `Unblock-File .\backup-render-postgres.ps1`, puis `.\backup-render-postgres.ps1`. Le script demande l'URL externe en entrée masquée, crée une archive personnalisée sur le Bureau et vérifie que `pg_restore --list` peut lire l'archive.
5. Ne considérer la sauvegarde comme valide que si le script affiche **VERIFICATION REUSSIE**, montre un fichier non vide et liste des objets PostgreSQL. Conserver l'archive dans un emplacement privé et sécurisé, car elle contient les données de l'application.
6. Une fois la sauvegarde vérifiée, retirer l'adresse IP temporaire de la liste autorisée.

## Maintenir le service

Deux voies existent :

- **Continuité de service :** mettre à niveau la base avant l'expiration, ce qui implique un coût. La sauvegarde locale reste recommandée.
- **Voie sans abonnement :** conserver l'archive, laisser l'instance gratuite expirer, créer ensuite une nouvelle base gratuite lorsque Render le permet, restaurer l'archive et mettre à jour la variable `DATABASE_URL` du service NAFA FINANCE. Cela entraîne une interruption jusqu'à ce que la nouvelle base soit restaurée et reliée au service. Une instance gratuite Render expire à nouveau après 30 jours ; ce n'est donc pas une solution permanente.

La restauration doit être testée avant de considérer l'application prête pour des données réelles. Ne pas activer les paiements réels pendant cette opération.
