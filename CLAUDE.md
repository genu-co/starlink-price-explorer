# Starlink Price Comparator

Comparateur de prix Starlink par pays (app Next.js dans `frontend/`), avec des données récupérées directement depuis l'API publique Starlink.

Pour le contexte personnel de l'utilisateur (son propre kit Starlink, sa situation au Cameroun, ses décisions de pays d'enregistrement), voir **`STARLINK_PERSONAL_CASE.md`** à la racine du repo — ne pas dupliquer ces infos ici, ce fichier ne couvre que le projet/code.

## Structure

- `scripts/fetch-data.js` — télécharge `https://starlink.com/public-files/landing-prices.json` (catalogue de prix par pays) et `.../api/webagg/v1/public/sign-up/countries/8` (pays actifs), écrit dans `frontend/public/*.json` + `metadata.json`. Lancé aussi via `.github/workflows/weekly-update.yml` (cron hebdomadaire).
- `frontend/` — app Next.js (App Router, `output: 'export'` dans `next.config.mjs`)
  - `src/constants.js` — `AFRICA_CODES`, `FALLBACK_RATES`, `TRANSLATIONS` (fr/en), `TAX_RATES` (taux de TVA par pays ISO alpha-2, source Trading Economics), `VOLATILE_CURRENCIES` (devises en crise de change, actuellement `["BOB"]`)
  - `src/utils/processor.js` — `processStarlinkJson()` transforme le JSON brut Starlink en objets `{region, currency, kitPrice, standard, roamReg, roamGlobal, roamCapped, taxRate, starlinkUrl}`
  - `src/hooks/useStarlinkData.js` — fetch live (via proxies CORS) avec fallback sur le fichier local `frontend/public/starlink.landing-prices.json`, plus taux de change (frankfurter.app puis open.er-api.com en fallback)
  - `components/StarlinkTable.jsx` — UI principale (tableau triable/filtrable, toggle taxe, badge devise volatile)

## Gotchas d'environnement (déjà rencontrés dans cette session)

- **Tailwind v4 ne générait AUCUNE règle CSS** (fichier compilé de ~100 octets) parce qu'il manquait `frontend/postcss.config.mjs` (le plugin `@tailwindcss/postcss` était en dépendance mais jamais branché). Corrigé — ce fichier doit rester présent.
- **Port 3000 occupé par une autre application** sur la machine de l'utilisateur (un service Express sans rapport, lié à des requêtes `my_orange_desktop_mac`/WhatsApp). Toujours lancer le dev server sur un autre port : `npm run dev -- -p 3001`.
- **La machine de l'utilisateur redémarre/dort fréquemment** entre les tours de conversation, ce qui tue les process en arrière-plan (`next dev`) et vide `/tmp`. Si `curl localhost:3001` échoue, vérifier `uptime` (si très bas, la machine vient de redémarrer) et relancer avec `setsid nohup npm run dev -- -p 3001 > /tmp/nextdev.log 2>&1 < /dev/null & disown`.
- **Gestionnaire de paquets : pnpm** (`pnpm-lock.yaml` présent). L'utilisateur a des données limitées — éviter de re-télécharger Chromium/Playwright inutilement : le binaire est déjà en cache dans `~/.cache/ms-playwright/` (plusieurs builds présents), pointer `executablePath` dessus directement plutôt que `npx playwright install`.

## Ce qu'on a appris sur les données Starlink

- Les prix de `frontend/public/starlink.landing-prices.json` sont les prix **TTC finaux** (taxe locale déjà incluse) — vérifié empiriquement en comparant au flux d'activation réel pour le Rwanda, le Nigeria et la Bolivie (le prix catalogue correspond exactement au prix affiché à l'écran de sélection du plan, à un facteur `1 + taux_TVA_local` près par rapport au prix "starting at" HT affiché sur l'écran résumé).
- Le catalogue statique peut être **en retard** pour les devises en forte volatilité (confirmé pour le BOB bolivien mi-2026, cf. `VOLATILE_CURRENCIES`).
- L'API de prix **live authentifiée** de Starlink (`api/webagg/v1/activate/plans/{utid}`) n'est pas accessible anonymement : recherche/géocodage d'adresse = public, mais créer une `serviceAddressId` renvoie 401 sans session utilisateur, et il y a en plus une protection anti-fraude (Forter)/captcha derrière. **Ne pas construire d'outillage pour contourner ça** — une tentative précédente d'un sous-agent dans ce sens a été supprimée volontairement (hors périmètre, s'approchait du contournement anti-bot).
- Exports d'analyse ponctuels à la racine du repo (non régénérés automatiquement, snapshots figés dans le temps) : `starlink_all_countries.csv`, `starlink_prices_in_XAF.csv`.

## Workflow

- **Commiter au fur et à mesure** (demande explicite de l'utilisateur) : un commit par étape cohérente, sans attendre la fin de la tâche. Jamais de ligne d'attribution Claude.
- Veille des prix Roam : `scripts/promo_watch.py` (timer systemd utilisateur `starlink-watch.timer`, 8 h, copies des unités dans `scripts/systemd/`). Données locales dans `~/.local/share/starlink-watch/`, alertes Telegram via `~/.config/starlink-watch/telegram.env`.
