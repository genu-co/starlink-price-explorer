# Starlink Bolivie vs FTTH Camtel : stratégie 100 Go / illimité

Copie hors ligne du document Claude Docs (révision 21 du 19 octobre 2026). Prix et taux mis à jour le 20 octobre 2026.

**Taux utilisés** (open.er-api.com, 20 octobre 2026) : 1 EUR = 655,957 XAF = 13,1076 BOB, donc 1 BOB ≈ 50,05 XAF (contre ≈ 48,2 dans le CSV du 16 août). Les prix locaux du catalogue Starlink n'ont pas changé : 415 Bs pour 100 Go, 1 100 Bs pour l'Illimité. Seule la conversion en XAF a monté, d'environ 3,8 %.

## Recommandation

Commencer par Roam 100 Go (environ 21 000 XAF) puis passer en Illimité quand le débit devient pénible coûte environ 39 000 à 50 000 XAF le mois, contre 55 000 XAF en Illimité d'emblée. Cela ne vaut que si les 100 Go tiennent plus de 11 jours : en dessous, le plus simple est de prendre l'Illimité.

- Votre vraie question est le volume : 100 Go en une semaine représentent environ 14 Go par jour. Claude Code seul n'explique probablement pas cela (voir la section consommation) ; il faut mesurer avant de choisir.
- La fibre Camtel à 25 000 XAF par mois (forfait S, illimité) devient moins chère que Starlink 100 Go dès que vous consommez plus de 120 Go par mois, et elle est toujours moins chère que l'Illimité Starlink.
- Tous les prix Starlink viennent du catalogue récupéré le 20 octobre 2026. Le boliviano se déprécie vite : le prix réel affiché à l'activation peut être plus élevé.

## Pause de ligne et changement de pays

Le mode veille à 1 Mbit/s existe chez Starlink, mais je n'ai trouvé aucune source qui dise qu'il est proposé en Bolivie : votre observation est donc plausible, pas une règle prouvée.

- Selon [Notebookcheck](https://www.notebookcheck.org/Starlink-traslada-a-los-abonados-del-plan-de-datos-de-10-mes-al-modo-de-espera-de-5.1213547.0.html) (janvier 2026), le mode veille coûte 5 $ par mois, avec 1 Mbit/s en descente et 0,5 Mbit/s en montée. Votre dossier `STARLINK_PERSONAL_CASE.md` note des chiffres plus récents (10 $, environ 500 Kbit/s) et que ce mode n'est pas dans le catalogue public : c'est un état activé depuis un compte déjà actif, variable selon le pays.
- Changement de pays : il passe par un Transfert, avec un nouveau compte et un nouvel e-mail. Délai : 90 jours depuis l'activation ou 120 jours depuis l'achat, le premier atteint (voir le dossier personnel). Vérifiez la date exacte avec le support.
- Alternatives déjà notées dans le dépôt, Roam 100 Go : Rwanda environ 27 600 XAF, Tchad environ 30 000 XAF, contre environ 20 800 XAF en Bolivie. La Bolivie reste donc la moins chère, avec les risques de change et de licence déjà notés.

## Économiser les 100 Go

Claude Code consomme peu : environ 200 Mo par heure d'envoi dans l'unique mesure publique que j'ai trouvée, soit 1 à 2 Go par jour pour 8 heures de travail. Cela ne suffit pas à expliquer 14 Go par jour, donc le gros de votre consommation vient sans doute d'ailleurs.

- **Source de la mesure** : une [issue GitHub de Claude Code](https://github.com/anthropics/claude-code/issues/55411), un seul utilisateur sur macOS en partage de connexion, non vérifiée par les mainteneurs et fermée « not planned ». Elle évoque aussi environ 100 Mo de téléchargement de mise à jour à chaque démarrage.
- **Pourquoi ça monte** : chaque tour renvoie tout l'historique et les sorties d'outils (20 à 50 Ko chacune). Plus la session est longue, plus chaque message pèse.
- **Mesurer d'abord** : lancez `vnstat` ou `nethogs` pendant une journée normale pour voir quel processus consomme (mises à jour système, navigateur, Docker, `npm`/`pnpm`, synchronisation cloud).
- **Mises à jour** : marquez la connexion Starlink comme limitée dans NetworkManager, désactivez les mises à jour automatiques (apt, snap, navigateur) et faites-les ponctuellement ailleurs.
- **SSH vers un serveur distant** : si Claude Code tourne sur un serveur (VPS), seul le texte du terminal passe par votre liaison, ce qui est très léger ; c'est mon raisonnement technique, pas une mesure. Un bureau à distance en vidéo est bien plus lourd que SSH (j'ai supposé que « Gmail desktop » désignait Chrome Remote Desktop ; dites-moi si c'était autre chose).
- **Communauté** : je n'ai trouvé aucun témoignage d'utilisateurs Starlink sur la consommation des agents de code ; cette partie reste à creuser (Reddit, forums Starlink).

## Coût d'un mois : 100 Go puis Illimité

Basculer après 14 jours coûte environ 39 100 à 50 100 XAF, soit 9 % à 29 % de moins que l'Illimité plein (55 048 XAF). Sans crédit sur le forfait 100 Go, le point d'équilibre est à 11 jours.

Base : prix du catalogue Starlink en boliviano (415 Bs pour 100 Go, 1 100 Bs pour l'Illimité), convertis en XAF au taux du 20 octobre 2026, taxe locale incluse. Le prorata exact n'est pas documenté : j'ai calculé deux hypothèses, sans crédit du forfait 100 Go (pire cas) et avec crédit des jours non utilisés (meilleur cas).

| Scénario sur 30 jours | Sans crédit (XAF) | Avec crédit (XAF) |
| --- | --- | --- |
| 100 Go seulement, débit réduit après épuisement | 20 768 | 20 768 |
| 100 Go, bascule Illimité au jour 21 | 37 282 | 31 052 |
| 100 Go, bascule Illimité au jour 14 | 50 127 | 39 051 |
| 100 Go, bascule Illimité au jour 7 (comme la dernière fois) | 62 971 | 47 049 |
| Illimité dès le jour 1 | 55 048 | 55 048 |

Si les 100 Go durent une semaine comme avant, la bascule est plus chère que l'Illimité d'emblée dans le pire cas. Avant de confirmer, vérifiez le montant affiché à l'écran de paiement : la date de facturation peut aussi changer. Le boliviano se dépréciant, ces montants en XAF risquent de monter.

## Fibre Camtel contre Starlink

La fibre Camtel coûte de 25 000 à 60 000 XAF par mois, illimitée, et la grille officielle (offres Blue Max) confirme ce que vous aviez vu : 25 000 XAF TTC par mois pour jusqu'à 50 Mbit/s. Seule l'offre L à 50 000 XAF est moins chère que l'Illimité Starlink (55 048 XAF) en montant le débit à 200 Mbit/s ; le débit est annoncé « max » et « variable ».

Conditions du contrat (grille officielle) : durée minimale fixée au formulaire et non publiée, reconduction tacite par périodes de 6 mois, résiliation avec 30 jours de préavis par lettre recommandée, abonnements restants dus en cas de résiliation avant terme, pénalité de retard d'un tiers de la facture. Avec un budget limité, demandez la durée minimale avant de signer.

| Offre | Prix mensuel (XAF) | Débit max (Mbit/s) | Données | Frais initiaux (XAF) |
| --- | --- | --- | --- | --- |
| Camtel Blue Max S | 25 000 | 50 | Illimitées | 50 000 |
| Camtel Blue Max M | 35 000 | 100 | Illimitées | 50 000 |
| Camtel Blue Max L | 50 000 | 200 | Illimitées | 50 000 |
| Camtel Blue Max XL | 60 000 | 300 | Illimitées | 50 000 |
| Starlink Roam 100 Go (Bolivie) | 20 768 | variable | 100 Go puis débit réduit | kit déjà possédé |
| Starlink Roam Illimité (Bolivie) | 55 048 | variable | Illimitées (usage équitable) | kit déjà possédé |

Points d'équilibre :

- Fibre S contre Starlink 100 Go : Starlink revient à environ 208 XAF par Go, donc la fibre devient moins chère à partir de 120 Go par mois, ou 140 Go en amortissant les 50 000 XAF d'installation sur 12 mois (environ 4 200 XAF par mois).
- Fibre S ou M contre Starlink Illimité : la fibre est moins chère dans tous les cas, avec 50 à 100 Mbit/s contre un débit Starlink variable.
- Fibre XL (300 Mbit/s, 60 000 XAF) : plus chère que l'Illimité Starlink ; elle ne se justifie que pour le débit et la stabilité.

Prix Camtel : grille officielle Blue Max ; anciens débits selon [LeFisk](https://lefisk.cm/blog/camtel-fiberconnect-fibre-optique-cameroun-forfaits-prix-2026) (29 juillet 2026, débits erronés au vu de la grille officielle). La grille officielle vient de fiberconnect.camtel.cm, que vous avez collée le 19 octobre 2026 (prix TTC, appels fixes et mobiles inclus). Les frais d'installation de 50 000 XAF viennent encore de LeFisk, absents de la page officielle. [Temo Vision](https://temovision.com/forfaits-internet-au-cameroun/) annonce de son côté 25 000 XAF pour 8 Mbit/s (extrait de recherche, page non ouverte). Cette valeur est contredite par la grille officielle. Vérifiez auprès de Camtel la couverture de votre quartier et les frais d'installation.

## Pays les moins chers (Roam)

Classement tiré de `starlink_prices_in_XAF.csv`, taux du 20 octobre 2026, prix du catalogue Starlink (taxe incluse). Je n'ai pas vérifié que Roam fonctionne depuis le Cameroun pour chacun de ces pays, ni les règles de licence.

**Roam 100 Go (plafonné)**

| # | Pays | XAF/mois |
| --- | --- | --- |
| 1 | Bolivie (BO) | 20 768 |
| 2 | Japon (JP) | 23 992 |
| 3 | Argentine (AR) | 24 184 |
| 4 | Roumanie (RO) | 25 246 |
| 5 | Rép. dominicaine (DO) | 25 671 |
| 6 | Bhoutan (BT) | 25 880 |
| 7 | Fidji (FJ) | 25 976 |
| 8 | Uruguay (UY) | 26 114 |

Viennent ensuite la zone euro (Belgique, Bulgarie, Chypre, Estonie, Finlande…) à 26 238 XAF. L'Autriche et la Croatie sont au même prix, mais pour 50 Go seulement.

**Roam Illimité**

| # | Pays | XAF/mois |
| --- | --- | --- |
| 1 | Chili (CL) | 51 753 |
| 2 | Philippines (PH) | 52 897 |
| 3 | Indonésie (ID) | 53 111 |
| 4 | Argentine (AR) | 53 742 |
| 5 | Martinique (MQ) | 54 444 |
| 6 | Roumanie (RO) | 54 802 |
| 7 | Bolivie (BO) | 55 048 |
| 8 | Équateur (EC) | 55 553 |

L'Ukraine est à 55 553 XAF comme l'Équateur, le Vanuatu à 55 780 et Trinité-et-Tobago à 56 205.

À retenir :

- La Bolivie est la moins chère en 100 Go et septième en Illimité, à 3 300 XAF du Chili : changer de pays pour l'Illimité ne vaut pas un transfert de 90 jours ni un nouveau compte.
- L'Argentine est 3e en 100 Go et 4e en Illimité, mais le peso est très volatil comme le boliviano : ces prix sont probablement en retard sur le prix réel à l'activation.
- Le Japon est à 23 992 XAF en 100 Go mais n'a pas d'offre Illimité dans le classement.
- Aucun pays africain n'entre dans les 15 premiers : le Rwanda est à environ 27 600 XAF en 100 Go et le Tchad à 30 000.

## Consommation mesurée du PC

Relevés pris le 3 novembre 2026 sur l'interface Wi-Fi `wlo1` du PC. Ils ne mesurent que ce PC, pas tout le foyer.

`vnstat -i wlo1 -d`, jours avec du trafic depuis le 20 octobre :

| Jour | Reçu | Envoyé | Total |
|---|---|---|---|
| 20 oct. | 818 Mio | 419 Mio | 1,21 Gio |
| 21 oct. | 1,50 Gio | 321 Mio | 1,82 Gio |
| 22 oct. | 1,90 Gio | 149 Mio | 2,05 Gio |
| 24 oct. | 22 Mio | 3 Mio | 25 Mio |
| 25 oct. | 544 Mio | 101 Mio | 645 Mio |
| 31 oct. | 1,97 Gio | 1,76 Gio | 3,74 Gio |
| 1er nov. | 5,32 Gio | 1,24 Gio | 6,56 Gio |
| 2 nov. | 9,78 Gio | 3,74 Gio | 13,52 Gio |
| 3 nov. (partiel) | 211 Mio | 24 Mio | 235 Mio |

Les 28 et 30 octobre, le trafic est quasi nul (quelques Kio). vnstat n'a aucune donnée pour les 23, 26, 27 et 29 octobre.

`vnstat -i wlo1 -m` :

| Mois | Reçu | Envoyé | Total |
|---|---|---|---|
| Octobre 2026 | 6,73 Gio | 2,73 Gio | 9,46 Gio |
| Novembre 2026 (au 3) | 15,31 Gio | 5,01 Gio | 20,32 Gio |

vnstat projette environ 302 Gio pour novembre. Cette projection extrapole les trois premiers jours, dont le 2 novembre, très chargé.

`netwatch-report --days 7 --by process --top 10`, total de 16,2 Go :

| Processus | Total (Mo) |
|---|---|
| unknown | 9 209 |
| apt (https) | 1 847 |
| ssh | 1 354 |
| apt (http) | 1 256 |
| dictate-whisper (python) | 887 |
| python3 | 676 |
| claude | 305 |
| chromium | 137 |
| uv | 136 |
| hermes (python) | 98 |

Précautions de lecture :

- Les logs netwatch antérieurs au 1er novembre 2026 surestiment la consommation, à cause d'un bug de nethogs corrigé ce jour-là. La fenêtre de 7 jours contient encore quelques jours d'avant la correction.
- La catégorie `unknown` représente plus de la moitié du trafic. Elle ne peut donc pas être attribuée à un processus précis.
- Le kit Starlink a affiché 1,6 To sur le cycle du 20 octobre au 19 novembre, mais sur un autre compte (Italie). Ce chiffre couvre tout le trafic de ce compte et ne se compare pas aux relevés de ce PC.

## Starlink Community et prochaines étapes

Je n'ai pas encore recherché Starlink Community (le programme de partage de connexion pour amortir les charges) : je ne peux donc rien affirmer sur ses conditions ni sur sa disponibilité au Cameroun ou en Bolivie.

1. Pendant deux jours, mesurez la consommation par processus (`vnstat`, `nethogs`) pour savoir si le problème est Claude Code ou autre chose.
2. Si la consommation dépasse 120 à 140 Go par mois, vérifiez auprès de Camtel la couverture de votre quartier et les frais d'installation : l'offre Blue Max S à 25 000 XAF donne jusqu'à 50 Mbit/s.
3. Sinon, prenez Roam 100 Go et notez la date à laquelle le débit chute, pour tester la bascule vers l'Illimité après le jour 11.
4. Avant toute bascule, relevez le montant exact affiché par l'application.
