# Contexte personnel : situation Starlink de l'utilisateur

Ce fichier documente la situation réelle de l'utilisateur (pas le projet/code — voir `CLAUDE.md` pour ça) et les trouvailles issues de recherches internet/tests API qui ne transparaissent nulle part dans le code. À lire par tout agent reprenant cette conversation.

## Sa situation

L'utilisateur vit au **Cameroun**. Starlink n'y est **pas officiellement disponible** (au 17/08/2026). Dossier réglementaire ART/ANTIC en cours pour "Starlink Cameroun SARL", accord attendu "courant 2026" mais pas encore accordé.

Il gère **deux kits Starlink physiquement présents au Cameroun**, distincts :

### Kit 1 — Starlink Standard, à Melen, propriété de **Genu** (l'entreprise de l'utilisateur)
- Abonnement ID `SL-DF-8295885-16924-75`, nickname "Roam - Unlimited", **Service Location enregistrée : Rome -1, ROMA, ROMA ROMA 22200, IT**.
- Plan **Roam - Unlimited**, actif. Tarif actuel **63,98 EUR/mois** — le catalogue Starlink actuel affiche 89 EUR pour ce même plan en Italie (product id `it-consumer-subscription-mini-mobile-regional-increased`, le suffixe "-increased" indiquant une hausse de prix passée). Son tarif est donc très probablement un **ancien prix conservé (grandfathered)** — toute modification du service (transfert, changement d'adresse) risque de le faire perdre.
- **Balance Due : €63.98, statut "Overdue"** (facture du 7/28/2026, échéance 7/20/2026 déjà dépassée). Cycle de facturation actuel : **20 juillet – 19 août 2026**.
- Aucune adresse de facturation renseignée ("No Billing Address set"). Moyen de paiement : Visa se terminant par 6537 (nom "edwige nylanga").
- Historique de factures montre des montants variables (62€, 41,33€, 103,33€) et des statuts "Cancelled"/"Paid" — plusieurs cycles antérieurs annulés puis relancés.
- **Usage réel du cycle en cours (Jul 20 – Aug 19) : 1,46 To**, affiché comme "Unlimited" (pas de surfacturation appliquée à ce stade). Overage Data affiché à titre indicatif : 1,91€/Go (ne semble pas s'appliquer tant que le plan reste "Unlimited").

### Kit 2 — Starlink Mini, à Olembe (résidence personnelle de l'utilisateur), à terme aussi propriété de Genu
- Acheté neuf (BYOD) via **shonatech.africa** (revendeur basé au Rwanda, confirmé revendeur Starlink autorisé couvrant Zimbabwe, Mozambique, Zambie, Rwanda, Kenya, Botswana — source Techzim 2025).
- En cours d'activation/enregistrement — adresse testée : **Bolivie** (Sucre, La Paz). Voir risques Bolivie ci-dessous (Outside Region Fee, crise de change, licence expérimentale).

## Décision en cours / recommandation actuelle

**Recommandation : enregistrer ce second kit au Rwanda plutôt qu'en Bolivie.**

Raison principale — le **"Outside Region Fee"** :
- Montant : **200 $ (kit Standard) / 300 $ (kit Mini)**, appliqué environ 3 jours après l'inscription si le kit est activé hors de la région d'achat.
- La "région" Starlink = grande zone continentale (Afrique / Amérique latine / Europe / Asie / Amérique du Nord / Océanie), **pas le pays**.
- Le kit a été acheté au Rwanda (zone Afrique) → l'activer pour la Bolivie (zone Amérique latine) déclenchera très probablement ce frais. L'activer pour le Rwanda (même zone) l'évite.
- Sources : [PDF officiel Starlink](https://starlink.com/public-files/OutsideRegionFee.pdf), [Starlink Help Center](https://starlink.com/ca/support/article/ff3e270d-5436-542c-6e20-a3738a6cae30), [Cybernews](https://cybernews.com/tech/starlink-outside-region-fee/).

Risques spécifiques à la Bolivie (identifiés en plus du point ci-dessus) :
- **Crise de change en cours** : la Bolivie a abandonné son taux de change fixe fin juin 2026, dévaluation rapide du boliviano (BOB/USD passé de ~7 à 12+ en quelques semaines). Le catalogue statique Starlink peut être en retard sur cette évolution (confirmé : écart de 6% observé entre catalogue et prix live pour Roam-100GB mi-août 2026).
- **Licence Starlink expérimentale** : Starlink opère en Bolivie sous licence expérimentale de 6 mois depuis le 3 février 2026 (expire ~août 2026 — pas de garantie de renouvellement/continuité de service).
- Malgré ça, la Bolivie reste l'un des pays les moins chers au monde pour Roam-100GB (~53 700 XAF≈95$ équivalent) et Roam-Unlimited (rang #4 mondial, ~94,78$ équivalent).

## Mécanique confirmée du site Starlink (comportement API/checkout)

- **Les prix affichés se décomposent en HT (écran résumé "Choose Service", libellé "Starting at") et TTC (écran de sélection du plan détaillé + écran de paiement)**. Formule exacte : `TTC = HT × (1 + taux_TVA_local)`. Confirmé empiriquement sur 3 pays à taux différents : Rwanda (18%), Nigeria (7,5%), Bolivie (13%, mais calculée "par dedans" — la taxe bolivienne se calcule comme `prix × 13/87`, soit un ratio observé de ~14,94%, pas 13% direct).
- La **région du compte se verrouille dès la création du compte** (détection IP/pays choisi à l'inscription), pas seulement à l'étape "Service Address" — un VPN doit être actif **dès la création du compte**, pas seulement au moment de saisir l'adresse, sinon erreur "Address does not match the region of the account".
- Le **GPS du boîtier (dish) ne peut pas être trompé par un VPN** — seule la couche compte/facturation web est concernée par un VPN, jamais la géolocalisation matérielle réelle. Message d'erreur observé en zone non couverte : `"UNEXPECTED LOCATION — starlink is currently not available in this country."`
- **L'API de prix live authentifiée est verrouillée** : `POST .../api/webagg/v1/public/addresses` (création de service address, nécessaire pour obtenir un `serviceAddressId` puis interroger `activate/plans/{utid}`) renvoie **401 `authenticated_user_required`** sans session utilisateur connectée, malgré le mot "public" dans l'URL. Même connecté, une protection anti-fraude (Forter)/CAPTCHA s'ajoute à l'étape `unlocked-utid`. Étapes publiques confirmées sans authentification : liste des pays, autocomplete d'adresse (`POST .../api/marketing/v1/addresses/autocomplete`), géocodage (`GET .../api/marketing/v1/addresses/geocode/{placeId}`).
- **Politique de roaming (mi-2026, en cours de durcissement)** : Starlink a resserré ses règles entre le 15 juillet et le 17 août 2026 — suppression du "Global Roam" (400$/mois, illimité en durée), **Roam Unlimited désormais plafonné à 30 jours consécutifs hors du pays d'enregistrement** (contre 60 avant). Alternatives payantes sans cette limite : Local Priority (jusqu'à 60 jours cumulés) ou Global Priority (illimité, ≥150-250$/mois). Vérification d'identité (passeport + selfie) désormais exigée pour usage international. Aucun regroupement régional pour l'Afrique (contrairement à l'Europe, zone unique de 35+ pays) — donc tout trajet entre pays africains ou vers le Cameroun déclenche le compteur de 30 jours.
- **Standby Mode** : jamais gratuit en 2026, passé de 5$ à 10$/mois (marché US), débit plafonné ~500 Kbps, désormais catégorisé comme plan strictement stationnaire (plus d'usage "en mouvement" depuis mars 2026). Prix variable par pays/devise (pas un montant fixe converti), non trouvé documenté publiquement pour l'Afrique. **N'apparaît pas dans le catalogue public** `landing-prices.json` (ce n'est pas un plan d'inscription mais un statut basculé depuis un compte déjà actif).

## Classements de prix établis (voir aussi les CSV à la racine du repo)

- **Roam-100GB (plafonné) le moins cher au monde, converti XAF** : Bolivie (~20-21k XAF, mais voir risques ci-dessus), Japon, Argentine, Bhoutan (⚠️ taux de taxe suspect à 50%, à vérifier manuellement), Uruguay, plusieurs territoires US à 45$ (Samoa am., Guam, Mariannes du Nord), Équateur, Micronésie, Sri Lanka, Roumanie, Fidji, Rép. Dominicaine, Sierra Leone.
- **Roam-Unlimited le moins cher au monde, converti XAF** (~90-100$ équivalent partout) : Indonésie (1er), Philippines, Argentine, **Bolivie (4e, ~94,78$)**, Équateur, Ukraine, Chili, Martinique, Vanuatu, Japon, Bangladesh, Roumanie...
- **Nigeria** : Residential seulement, **aucun Roam proposé du tout** (confirmé sur le vrai formulaire, adresse Ikom/Cross River) — éliminé pour tout usage en itinérance.
- **Rwanda** : Roam-100GB confirmé disponible (~27-30k XAF), pas de Roam-Unlimited trouvé dans le catalogue pour ce pays à ce jour — à vérifier si besoin d'Unlimited spécifiquement.
- **Tchad** : voisin direct du Cameroun, même devise (XAF/CEMAC), Roam-100GB disponible (~30k XAF) — solide alternative si le Rwanda pose souci.

## Transfert, changement d'adresse et fair-use (résolu par recherche)

- **Délai de transfert 120/90 jours** : c'est le **premier délai atteint** qui compte (90 jours depuis activation OU 120 jours depuis achat, pas le plus long des deux). Vu l'usage intensif déjà établi du kit Italie, les 90 jours depuis activation sont très probablement déjà dépassés — le blocage vu dans l'interface n'est donc probablement **pas** dû au délai lui-même mais à une autre condition de compte (à vérifier avec le support Starlink). Aucun raccourci/contournement documenté trouvé (Reddit, forums RV, Facebook) malgré recherche approfondie.
- **"Change Address" ≠ "Transfer"** : Starlink confirme explicitement que changer l'adresse de service vers un **pays différent** n'est pas possible via "Change Address" (qui ne fonctionne qu'à l'intérieur du même pays). Changer de pays nécessite un **"Transfer"**, qui annule le service actuel et exige de créer un **nouveau compte avec un nouvel email**. Donc pas de raccourci possible entre les deux chemins — les deux mènent au même mur des 120/90 jours dès qu'on change de pays. Source : page d'aide Starlink *"I moved to a new country. Can I change my address?"*.
- **Fair Use Policy sur Roam Unlimited** : pas de plafond dur malgré le nom "Unlimited" — c'est une **déprioritisation** du trafic en cas de congestion locale (documenté dans la Fair Use Policy légale officielle de Starlink). Les plans Roam/Mobile sont de toute façon déjà déprioritisés en permanence par rapport aux abonnés Residential/Priority. Aucune différence de fair-use **par pays** trouvée/documentée publiquement pour un usage 1 To+/mois — l'impact réel dépend de la congestion locale du réseau, pas du pays de facturation.

## 🚨 URGENT : la nouvelle règle des 30 jours s'applique probablement DÉJÀ au kit Italie

**Depuis le 17 août 2026 (entrée en vigueur pour les comptes existants, annoncée le 15 juillet 2026)**, Starlink a resserré Roam Unlimited à **30 jours consécutifs maximum hors du pays d'enregistrement** (contre 60 auparavant). Les zones USA/Canada et Europe (35+ pays) sont chacune regroupées en "zone unique" pour ce calcul, **mais l'Afrique n'est pas regroupée avec l'Europe**. Conséquence directe : le kit facturé en Italie mais utilisé en permanence au Cameroun **dépasse très probablement déjà cette limite de 30 jours dès maintenant** (2 jours après l'entrée en vigueur). Starlink va probablement exiger un retour en Italie, un passage à un plan Priority payant (plus cher, sans limite de durée), ou un transfert vers le pays d'usage réel. **À vérifier en priorité dans l'app/compte Starlink** — c'est probablement plus urgent que la question du tarif grandfathered à 63,98€ ou du délai de transfert.

Sources : [Starlink Insider — Transfer Ownership](https://starlinkinsider.com/starlink-transfer-ownership/), [Mobile Internet Resource Center — Self-Service Equipment Transfers](https://www.rvmobileinternet.com/starlink-now-offers-self-service-equipment-transfers/), [Mobile Internet Resource Center — Roam Unlimited 30 jours](https://www.rvmobileinternet.com/starlink-restricts-international-roaming-rules-roam-unlimited-now-limited-to-30-days-abroad/), [Clevermariner](https://www.clevermariner.com/post/breaking-starlink-news-starlink-cuts-roam-unlimited-international-use-to-30-days), [Starlink Insider — Fair Use Policy](https://starlinkinsider.com/starlink-fair-use-policy/), [SatelliteInternet.com — Data Caps](https://www.satelliteinternet.com/resources/starlink-data-caps/).

## Stratégie de paiement/annulation pour le Kit 1 (Italie, facture Overdue) — résolu par recherche

Situation au moment de la recherche : facture de 63,98€ en statut "Overdue" (échéance dépassée), cycle de facturation en cours 20 juillet – 19 août 2026, l'utilisateur veut éviter d'être facturé pour un nouveau cycle (à partir du 20 août) pendant qu'il prépare un transfert vers un pays moins cher.

- **Renouvellement automatique** : Starlink prélève à chaque date anniversaire du cycle sauf annulation préalable. Pas de préavis formel requis — il faut annuler **avant que la facture suivante ne soit générée** (donc avant le 19-20 août).
- **Annuler en cours de cycle déjà payé ne coupe PAS le service immédiatement** : le service continue jusqu'à la fin de la période déjà payée, et aucune facture n'est générée pour le cycle suivant. Pas de remboursement au prorata (non pertinent ici puisque le service reste utilisable jusqu'à cette date).
- **Support Starlink pour un arrangement particulier (report, dérogation)** : non documenté publiquement de façon fiable — support historiquement automatisé. Ne pas compter dessus comme plan principal, mais un contact reste utile pour confirmer des dates précises sur le compte.
- **Séquence recommandée** :
  1. Payer la facture en retard (63,98€) maintenant — un statut "Overdue" prolongé risque la suspension du compte, ce qui bloquerait toute démarche ultérieure.
  2. Vérifier l'éligibilité réelle au transfert (90 jours depuis activation OU 120 jours depuis achat, le premier atteint) avant d'annuler quoi que ce soit — annuler trop tôt résilierait le service sans permettre de transfert.
  3. Une fois éligible, initier le Transfer/l'annulation **juste avant le 19-20 août** (pas après) pour éviter la facturation du cycle suivant tout en gardant le service jusqu'à cette date.
  4. Contacter le support en parallèle pour confirmer la date exacte d'éligibilité au transfert sur ce compte précis.

Sources : [StarlinkPrice.com — How to Cancel Starlink](https://starlinkprice.com/blog/how-to-cancel-starlink.html), [DISHYtech — Can You Pause Residential?](https://www.dishytech.com/can-you-pause-residential-sort-of-heres-how/), [Starlink Help Center — I moved to a new country](https://starlink.com/support/article/38329d88-4f39-9e69-f5bb-786aab59eef1), [Starlink Help Center — Transfer to a new country](https://starlink.com/ca/support/article/d1e19d25-a05b-3d15-e831-2aea19b53e92), [JustAnswer — Overdue Bill Options](https://www.justanswer.com/software/sxd0s-starlink-overdue-payment-options.html), [Yahoo Tech — Starlink customer service](https://tech.yahoo.com/general/articles/starlink-customers-spacexs-customer-non-100000967.html).

## Éligibilité au transfert du Kit 1 (Italie) — incertaine, historique de facturation confus

L'historique de factures montre **plusieurs cycles annulation/réactivation** sur ce même abonnement : première trace le 20/12/2025 ("Subscription", Cancelled), puis 2/3/2026 (payé), 2/5/2026 (Cancelled), 2/20/2026 ("Subscription", Cancelled), puis 7/28/2026 (facture 103,33€ payée + facture 63,98€ actuellement Overdue). Si on compte depuis la trace la plus ancienne (déc. 2025), on serait largement au-delà de 90/120 jours aujourd'hui (17/08/2026) — donc éligible en apparence. **Mais on ne sait pas si Starlink réinitialise le compteur à chaque réactivation.**

Recherche complémentaire (contournements/éligibilité prématurée) — conclusions honnêtes :
- **Aucun témoignage vérifiable** trouvé en ligne de quelqu'un ayant contourné le délai 90/120 jours. Reddit inaccessible aux outils de recherche utilisés (limite de la recherche, pas forcément absence d'info).
- **Le comportement du compteur après annulation/réactivation du même kit n'est documenté nulle part**, ni officiellement ni par la communauté — ni pour infirmer ni pour confirmer une réinitialisation.
- Pattern rapporté plusieurs fois : si pas encore éligible, le bouton de transfert reste **bloqué même après annulation** — pas de dérogation connue, juste "attendre que le support corrige ça de leur côté".
- Alternative rapportée (non chiffrée précisément) : plutôt que d'attendre, certains utilisateurs annulent et créent un **nouveau compte/second kit dans le nouveau pays directement** — ce que l'utilisateur fait déjà de facto avec son Kit 2 (Mini, Olembe, Bolivie en cours).

**Conclusion / prochaine étape** : la seule réponse fiable viendra d'un contact direct avec le support Starlink, en demandant explicitement quelle date de calcul est retenue sur ce compte précis (première activation déc. 2025 vs dernière réactivation). Pas de garantie de dérogation à espérer.

Sources recherche complémentaire : [Starlink Forum — Transfer to another country](https://starlinkforum.net/topic/1382-starlink-transfer-to-another-country/), [Starlink Forum — Moving to another country](https://starlinkforum.net/topic/1193-starlink-moving-to-another-country/), [Starlink Help Center — Transfer eligibility](https://starlink.com/support/article/1668200d-1ce5-196c-d4bb-a39be9b27dbc), [DISHYtech — Buy/Sell/Transfer used Starlink](https://www.dishytech.com/how-to-buy-sell-and-transfer-a-used-starlink/), [DISHYtech — Global Roaming](https://www.dishytech.com/everything-you-need-to-know-about-starlink-global-roaming/).

### Alternative envisagée puis écartée : annuler + créer un nouveau compte (au lieu du bouton "Transfer")

Analyse approfondie de cette idée (contourner le délai en désactivant le Kit 1 puis en le réactivant sous un compte totalement différent, via l'option "acheté hors de son pays/revendeur non autorisé" plutôt que le vrai bouton "Transfer") — **verdict : ne fonctionne très probablement pas, à écarter.**

- Le mécanisme officiel "Transfer" **EST déjà** littéralement "annuler le service + créer un nouveau compte avec un nouvel email dans le nouveau pays" (confirmé par la doc officielle Starlink). Le faire "à la main" sans cliquer sur "Transfer" est fonctionnellement identique — même opération, chemin UI différent seulement.
- Le verrou des 90/120 jours semble attaché à **l'historique du kit lui-même** (numéro de série suivi côté serveur Starlink), pas à l'action de cliquer sur un bouton précis. Rien ne suggère que les deux chemins soient traités différemment.
- **L'Outside Region Fee (200$/300$) n'a aucun rapport avec ce verrou temporel** — c'est un mécanisme indépendant conçu pour taxer le changement de zone géographique et combattre la revente rapide ("flipping") entre pays, pas pour débloquer une réactivation anticipée. Le payer n'accélère rien.
- Le fait même que Starlink ait créé cet Outside Region Fee pour lutter contre le "flipping" prouve que le matériel (Kit ID) est suivi indépendamment du compte utilisateur — ce qui renforce l'hypothèse que le verrou touche le kit, pas seulement le compte.

**Conclusion pratique retenue** : ne pas tenter ce contournement. Attendre les 90/120 jours (le plus court des deux depuis l'activation en Italie), confirmer l'éligibilité exacte auprès du support, puis utiliser le vrai bouton "Transfer".

Sources : [Starlink Help Center — Transfer ownership of hardware](https://www.starlink.com/fj/support/article/f3cad923-ed28-f957-365c-787f8fe2e4a2), [SatelliteInternet.com — Sell or Buy a Used Starlink Kit](https://www.satelliteinternet.com/resources/sell-or-buy-used-starlink/), [StarlinkInsider — Transfer Ownership](https://starlinkinsider.com/starlink-transfer-ownership/), [DISHYtech — Outside Region Fee](https://www.dishytech.com/starlink-to-charge-outside-region-fee-for-foreign-activated-kits/), [Cybernews — Outside Region Fee](https://cybernews.com/tech/starlink-outside-region-fee/), [SatelliteInternet.com — Regional Shutdown Crackdown](https://www.satelliteinternet.com/resources/starlink-regional-shutdown/).

## Mécanique du prorata au changement de plan en cours de cycle (observé empiriquement, Kit 2 Bolivie, 2026-09-03)

Contexte : Kit 2 (Bolivie) a épuisé son quota de data prioritaire (100 GB) avant la fin du cycle, connexion ralentie/dépriorisée. Test en direct de plusieurs bascules de plan via l'écran "Change Plan" du compte pour voir si passer en Residential Lite réglait le problème, avec intention de repasser en Roam-100GB sinon. **Décision finale : reste sur Roam-100GB.**

**Ce qui a été confirmé par calcul à partir des écrans réels (pas d'accès API authentifié, uniquement lecture des montants affichés) :**

- Le prorata affiché ("Due today") suit la forme `f × (nouveau_prix_mensuel − une_base)`, où `f` est la fraction du cycle restante (~0.43 ce jour-là, cycle glissant jusqu'au 17 du mois).
- **Erreur d'hypothèse initiale corrigée** : je pensais que `base` = le prix mensuel plein du plan actif (donc que faire A→B→A serait neutre en coût, un simple télescopage). **C'est faux.** En comparant deux devis réels vers "Roam-Unlimited" pris à ~2h20 d'intervalle (333.12 BOB avant tout changement, puis 481.23 BOB une fois passé sur Lite), le devis a **augmenté de +148 BOB** alors que moins de temps restait dans le cycle — donc `base` n'est PAS la pleine valeur mensuelle du plan actif.
- Résolution du système à 2 équations/2 inconnues (avec les vrais montants de deux devis pris au même instant) donne un `base` implicite d'environ **40-41 BOB**, très proche du montant qui venait d'être payé pour la bascule précédente (41.56 BOB) — mais nettement **inférieur** à la valeur mensuelle réelle du plan actif (Lite = 490 BOB, donc un vrai remboursement proportionnel aurait dû donner ~209 BOB de crédit, pas ~40).
- **Conclusion pratique retenue** : Starlink ne crédite pas la pleine valeur restante d'un plan à peine souscrit quand on le quitte peu après — chaque bascule fait perdre une partie réelle de ce qui vient d'être payé. Constaté sur ce cas précis : passer par Lite puis revenir/aller ailleurs a coûté **~190 BOB de plus (~15.7 USD, ~8 955 XAF)** que si le changement final avait été fait directement dès le premier devis.
- **Recommandation pour la prochaine fois** : ne PAS "tester" un plan intermédiaire en cours de cycle dans l'idée de revenir en arrière si ça ne convient pas — choisir directement le plan final visé. Chaque aller-retour a un coût réel non négligeable, contrairement à l'intuition d'un simple prorata linéaire réversible.
- Non résolu : le "Standard/Loading" du calcul exact de `base` (pourquoi ~40 BOB précisément) reste incertain — hypothèse la plus probable est un crédit plafonné/partiel plutôt qu'un vrai report proportionnel, mais le mécanisme exact interne de Starlink n'est pas documenté publiquement et n'a pas pu être vérifié autrement qu'empiriquement sur ce seul cas.
- Catalogue statique (`starlink.landing-prices.json`, région BO) vs prix live confirmés cohérents dans leur structure (mêmes noms d'offres : Residential/Residential Lite/Roam-100GB/Roam-Unlimited/Local Priority/Global Priority), mais avec un **décalage constant d'environ ×1.064** (catalogue en retard sur le live, cohérent avec la crise de change du BOB déjà documentée plus haut) : Residential Lite 460→490 (×1.0652), Roam-Unlimited 1100→1170 (×1.0636).
