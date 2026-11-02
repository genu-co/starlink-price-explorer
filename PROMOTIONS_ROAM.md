# Promotions Starlink Roam — ce qu'on sait

## Le cas « Italie à 40 000 XAF » (compte Roam enregistré en Italie, relevé le 3 nov. 2026)

Lu dans le compte, en lecture seule (Facturation) :

| Période | Facture mensuelle | Explication |
|---|---|---|
| nov. 2025 → fév. 2026 | 62,00 € (≈ 40 670 XAF) | coupon **« EUR 27 off Service »**, 6 utilisations, « valid for select customers » : 89 − 27 = 62 € |
| août → oct. 2026 | 56,06 € | non expliqué (autre remise ? à lire sur les factures détaillées) |
| à partir du 20 nov. 2026 | **89,00 €** (72,95 € HT + 22 % TVA) | aperçu de facture : plus aucune remise |

Conclusion : le prix bas venait d'un **coupon attribué au compte**, pas d'un prix de catalogue.
Ce type de remise est **invisible dans le catalogue public** : la veille (`scripts/promo_watch.py`)
ne peut pas le voir. Seuls le compte (onglet Facturation → Coupons) ou une communication de
Starlink le révèlent.

Autres constats sur ce compte :
- parrainage affiché : 45 € pour chacun (parrain et filleul) ;
- dépassement de données affiché : 1,91 €/Go (non appliqué en Illimité) ;
- consommation du cycle 20 oct. → 19 nov. : 1,6 To.

## Promotions Roam visibles dans le catalogue public (test rétroactif sur les captures Wayback)

- fév. 2025 : Roumanie Illimité −36 %
- juin 2025 : Malaisie −39 %, Islande −28 %, Danemark −22 %
- août 2025 : Albanie −27 %, Macédoine du Nord −24 %, Bulgarie −24 % ; essais 7 jours Roam Illimité au Chili (1 000 CLP) et au Japon (100 JPY)
- 4 → 17 mars 2026 : prix affichés **hors taxe** (pas une promotion)
- juin 2025 : hausse zone euro de l'Illimité 72 € → 89 €
