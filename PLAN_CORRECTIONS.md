# Plan De Corrections

## Objectif

Rendre l'application exploitable depuis `npm start`, corriger les incohérences relevées pendant l'audit et sécuriser les cas qui cassent l'intégrité des données.

## Priorités

1. Servir l'application React compilée au lieu du prototype statique `public/`.
2. Activer et respecter l'intégrité référentielle SQLite.
3. Corriger les validations métier incohérentes.
4. Aligner le frontend React avec l'API réellement exposée.
5. Rendre l'initialisation de la base déterministe.

## Correctifs Ciblés

### Backend

- Faire servir `dist/` par Express quand il existe.
- Garantir qu'un `npm start` produit un build avant de lancer le serveur.
- Attendre la connexion à la base avant d'ouvrir le port HTTP.
- Activer `PRAGMA foreign_keys = ON` sur chaque connexion SQLite.
- Retourner des erreurs métiers propres sur les contrats invalides et les suppressions bloquées.
- Exposer la création d'événements, déjà prévue par les validateurs.

### Validation

- Vérifier l'ordre des dates sur les contrats.
- Autoriser `rooms = 0` pour les terrains.
- Normaliser les champs numériques avant validation.

### Frontend React

- Corriger l'affichage de l'agenda pour utiliser `start_date` et `end_date`.
- Ajouter les formulaires manquants sur les biens et l'agenda.
- Afficher les erreurs API au lieu d'échouer silencieusement.

### Base De Données

- Rendre `npm run init-db` idempotent en recréant la base de zéro.

## Vérifications Prévues

- `npm run build`
- Contrôles ciblés sur les validateurs Node
- Vérification HTTP locale du serveur et du point d'entrée servi
