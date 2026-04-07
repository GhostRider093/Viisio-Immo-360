# Application Immobiliere Administratif

Une application web pour gerer les aspects administratifs d'une agence immobiliere.

## Docker VPS

1. Copier le projet sur le VPS.
2. Copier `.env.example` vers `.env` puis ajuster `CORS_ORIGIN` et le port si besoin.
3. Lancer:

```bash
docker compose up -d --build
```

4. Verifier:

```bash
docker compose ps
docker compose logs -f app
```

L'application ecoute sur le port `3000` dans le conteneur et expose `APP_PORT` cote VPS.
Par defaut, le port public configure est `8013`.
La base SQLite et les captures sont persistantes dans le volume Docker `app_data`.

## Mise a jour

```bash
git pull
docker compose up -d --build
```
