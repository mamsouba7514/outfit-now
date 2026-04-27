# Outfit Now — Stratégie complète vers l'exit

> Objectif : €80-200M de valorisation à l'exit (acheteur stratégique)
> Horizon : 4-5 ans
> Point de départ : M1 terminé, M2 en cours (Avril 2026)

---

## 0. Les deux problèmes à régler avant tout le reste

Avant d'exécuter quoi que ce soit dans ce document, deux problèmes existentiels doivent être résolus. Ignorer l'un d'eux rend tout le reste inutile.

### Problème 1 — Le cold-start

**Le constat :** Les apps de dressing numérique meurent toutes du même problème. Les utilisateurs scannent 3-5 pièces, ne voient pas de valeur immédiate, et n'ouvrent plus jamais l'app. Cladwell, Stylebook, Whering sont tous morts de cette hémorragie silencieuse. Ton pipeline IA (SAM2+CLIP) ne devient pertinent qu'à partir de 15-20 pièces cataloguées. Tu as donc un gouffre d'activation entre "l'utilisateur installe" et "l'utilisateur voit de la valeur".

**La solution :** La valeur doit être visible dès la 3e pièce scannée, pas la 30e. Cela implique :

- Une suggestion immédiate ("avec ces 3 pièces, voici une tenue pour demain") dès l'onboarding
- Un onboarding gamifié avec progression visible (barre, badges, récompense à chaque scan)
- Un fallback de tagging manuel en 3 taps (catégorie + couleur + occasion) si le scan GPU échoue ou est trop lent

**Le test à faire cette semaine :** 10 personnes, photos WhatsApp, analyse manuelle Claude Vision, suggestions renvoyées en DM. Mesure : combien finissent d'envoyer 10 pièces ? Combien reviennent après 7 jours ? Ces deux chiffres valident ou invalident tout le reste.

---

### Problème 2 — La contradiction du modèle économique

**Le constat :** "Porte mieux. Achète moins." est incompatible avec un modèle d'affiliation (tu gagnes quand les gens achètent). C'est une contradiction structurelle qui empoisonnera chaque décision produit, chaque conversation investisseur, chaque partenariat retail.

**La décision à prendre aujourd'hui :**

| Option A — Abonnement pur              | Option B — Affiliation assumée         |
| -------------------------------------- | -------------------------------------- |
| Tagline : "Porte mieux. Achète moins." | Tagline : "Porte mieux. Achète mieux." |
| €9-12/mois, valeur = style sans achat  | Commission sur achats pertinents       |
| Moat = fidélité, communauté, ESG       | Moat = recommandations précises        |
| Plafond ~€5-8M ARR seul                | Multiplicateur ×2 sur les revenus      |
| Cohérent avec l'angle minimalisme      | Cohérent avec M4 (affiliation)         |

**Recommandation :** Option B avec une nuance narrative — "achète mieux" positionne Outfit Now comme un filtre anti-impulse, pas un outil de surconsommation. Tu peux conserver l'esprit minimaliste tout en monétisant les achats pertinents.

---

## 1. Phase 0 — Validation (Semaines 1-4, avant tout code supplémentaire)

### Objectif

Obtenir 3 preuves comportementales avant d'investir une ligne de code supplémentaire sur M2.

### Actions

**Test 1 — Cold-start manuel (Semaine 1)**

- Recrute 10 personnes dans ta cible (femmes 25-40, urbaines)
- Demande-leur d'envoyer 10 photos de vêtements par WhatsApp
- Analyse manuellement avec Claude Vision, renvoie des suggestions de tenues
- Mesure : taux de complétion de l'envoi (cold-start) + retour spontané J+7 (rétention)
- Seuil go/no-go : 6/10 finissent les 10 photos ET 4/10 reviennent J+7

**Test 2 — Willingness to pay (Semaine 2)**

- Crée une landing page simple (pas d'app) avec mockups
- Appel à l'action : "Rejoindre la bêta fermée — €9.99/mois"
- Envoie à 100 personnes (LinkedIn, Instagram, entourage étendu)
- Mesure : clics sur le bouton de paiement (pas juste inscription email)
- Seuil go/no-go : 5+ personnes entrent leur carte

**Test 3 — Rétention D30 (Semaines 3-4)**

- Continue le service manuel WhatsApp avec les personnes du Test 1
- Mesure : combien reviennent spontanément après 30 jours sans relance ?
- Seuil go/no-go : 3/10 reviennent

### Décision en fin de Phase 0

- **3 tests validés** → continue sur M2 avec confiance, accélère
- **2 tests validés** → continue M2 mais itère sur l'onboarding en priorité
- **1 test ou moins validé** → pivote le positionnement avant de coder

---

## 2. Phase 1 — Product-Market Fit (M2 + M3, mois 2-14)

### Objectif

Atteindre 1 000 utilisateurs actifs avec une rétention D30 > 40%.

### M2 — Dressing & Scan (Mois 2-8)

**Priorités techniques :**

1. Pipeline vision avec degraded mode obligatoire
   - Mode fast : tagging manuel 3 taps (catégorie + couleur + occasion) — disponible J1
   - Mode smart : SAM2+CLIP pour détection automatique — disponible quand pipeline stable
   - Seuil de qualité : P95 < 6 secondes, taux d'erreur < 10%
2. Valeur visible dès la 3e pièce scannée (suggestion immédiate, pas d'attente du dressing complet)
3. Onboarding gamifié : progression visible, récompense à chaque scan
4. Logging complet de chaque interaction dès J1 (le data moat commence maintenant)

**Métriques cibles fin M2 :**

- 200 beta users
- 60% complètent l'onboarding (≥10 pièces scannées)
- Rétention D7 > 45%

### M3 — Styliste IA (Mois 9-14)

**Le cœur du produit :**

- Briefs → tenues contextuelles (occasion, météo, humeur)
- Mémoire de style accumulée (ce que l'user a porté, ce qu'il a aimé)
- Suggestions proactives (notification "tenue du jour" basée sur agenda + météo)
- Fonctionnalité sociale légère (partage de tenues, pas un réseau social)

**Priorité absolue : le moment déclencheur**
L'app doit être utile dans les 30 premières secondes d'ouverture en mode "urgence" (6h52 du matin, réunion importante). Pas de friction, pas de chargement long, suggestion immédiate basée sur l'historique.

**Métriques cibles fin M3 :**

- 1 000 users actifs (ouvrent l'app ≥2x/semaine)
- Rétention D30 > 40%
- NPS > 50

---

## 3. Phase 2 — Croissance et monétisation (M4, mois 15-24)

### Objectif

Atteindre €500K ARR et démontrer la scalabilité du modèle économique.

### Modèle économique recommandé (hybride)

**Pilier 1 — Abonnement (base stable)**

- Freemium : dressing jusqu'à 20 pièces, 3 suggestions/mois
- Premium €9.99/mois : dressing illimité, styliste IA illimité, suggestions proactives
- Annual €89/an (économie de 2 mois = levier de conversion)

**Pilier 2 — Affiliation (multiplicateur)**

- Intégration avec Zalando, ASOS, Sézane, Vinted, Vestiaire Collective
- Commission 8-12% sur achats déclenchés par une recommandation Outfit Now
- Règle d'or : ne recommander que des pièces qui complètent réellement le dressing existant (aligné avec le positionnement "achète mieux")
- Objectif : 15-20% du revenu total en affiliation en fin d'année 2

**Pilier 3 — B2B layer (option à tester en M4)**

- API de recommandation pour marques DTC : "ce client possède X, Y, Z — voici ce qui complète sa garde-robe"
- Valeur pour la marque : réduction des retours (-15-20% documenté sur ce type d'outil) + hausse du panier moyen
- Pricing : €500-2 000/mois selon volume
- Commence avec 3 marques pilotes gratuites pour valider l'intégration

### Go-to-market

**Canal 1 — Communautés style/minimalisme (coût quasi-zéro)**

- Reddit : r/minimalism, r/femalefashionadvice, r/FrenchFashion
- TikTok/Instagram : contenu "dressing capsule", "30 jours 30 tenues"
- Partenariats avec créateurs minimalisme/slow fashion (nano-influenceurs 10-50K, meilleur ROI)

**Canal 2 — PR et angle ESG**

- L'angle "achète moins, mieux" est un angle PR fort en 2026 (surconsommation, fast fashion critiquée)
- Presse : Madame Figaro, Elle, L'Obs Style, Numerama, TechCrunch France
- Objectif : 3-5 articles de presse en lancement = 5-10K inscriptions gratuites

**Canal 3 — Referral programme**

- "Invite 3 amies, 1 mois gratuit"
- Viral loop naturel : partager une tenue créée par Outfit Now = publicité organique

---

## 4. Phase 3 — Scale et préparation à l'exit (mois 25-48)

### Objectif

Atteindre €5-12M ARR et se positionner comme acquisition cible prioritaire.

### Expansion géographique

**Ordre recommandé :**

1. France (mois 1-18) — valider le modèle, atteindre 50K users
2. Belgique + Suisse francophone (mois 18-24) — même langue, coût marginal faible
3. Espagne + Italie (mois 24-36) — culture mode forte, marché sous-servi en apps IA styling
4. UK + Allemagne (mois 36-48) — marchés tech premium, coût d'entrée élevé mais nécessaire pour valorisation exit

### Construction du data moat

C'est le seul vrai moat défendable contre Apple, Google et les copycats.

**Ce qu'il faut accumuler et logguer dès M2 :**

- Chaque pièce scannée (catégorie, couleur, matière, occasion, prix estimé)
- Chaque tenue suggérée et son résultat (portée, ignorée, modifiée)
- Patterns de port par saison, occasion, météo
- Style profile évolutif par utilisateur (minimaliste, coloré, formel, casual...)
- Données d'achat si affiliation activée

**Ce que ce data lake permet :**

- Des recommandations impossibles à reproduire par un concurrent sans la même historique
- Une valeur croissante pour les acheteurs stratégiques (chaque utilisateur = profil de style enrichi)
- Des insights B2B vendables aux marques (tendances, comportements d'achat, élasticité prix)

### Préparation à l'exit

**18 mois avant l'exit visé :**

- Auditer la propriété intellectuelle (pipeline vision, algorithmes de recommandation)
- Documenter le data moat de façon défendable (nombre de data points, unicité)
- Nettoyer la cap table si nécessaire
- Recruter un CFO ou advisor M&A expérimenté

**Les acheteurs à approcher (dans l'ordre) :**

| Acheteur          | Logique stratégique                          | Prix estimé |
| ----------------- | -------------------------------------------- | ----------- |
| **Zalando**       | Automatiser Zalon (styling humain) avec l'IA | €80-150M    |
| **Snap**          | Layer AR fashion + data dressing             | €100-200M   |
| **LVMH / Kering** | Personalization layer pour marques premium   | €150-250M   |
| **H&M Group**     | Tech styling pour réduire les retours        | €60-100M    |
| **Pinterest**     | Fashion discovery + styling IA               | €80-150M    |

**Règle d'or de l'exit :** Ne jamais négocier avec un seul acheteur. Dès qu'un premier terme sheet arrive, appeler immédiatement tous les autres acheteurs potentiels. La mise en concurrence est le seul levier qui fait doubler le prix.

---

## 5. Les métriques à suivre chaque semaine

### Métriques de survie (Phase 0-1)

- **Taux de complétion onboarding** : % users qui scannent ≥10 pièces dans les 7 premiers jours
- **Rétention D7** : % users qui ouvrent l'app 7 jours après l'installation
- **Rétention D30** : % users actifs à J30

### Métriques de croissance (Phase 2-3)

- **ARR** : revenus annuels récurrents (abonnements + affiliation)
- **MRR growth** : croissance mois sur mois (objectif : >15%/mois en phase 2)
- **LTV / CAC ratio** : doit être > 3 pour un modèle viable
- **NPS** : indicateur de bouche-à-oreille organique (objectif > 50)

### Métriques d'exit (Phase 3)

- **ARR growth rate** : la vitesse compte autant que le niveau (>80%/an = premium de valorisation)
- **Gross margin** : objectif >70% (SaaS-grade)
- **Data moat depth** : nombre total de data points accumulés (pièces cataloguées, interactions styliste)

---

## 6. Les risques et comment les mitiger

| Risque                                          | Probabilité               | Impact | Mitigation                                                                                     |
| ----------------------------------------------- | ------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Cold-start non résolu                           | Haute                     | Fatal  | Valeur visible dès la 3e pièce + degraded mode manuel                                          |
| Apple/Google lance une feature similaire        | Moyenne                   | Élevé  | Construire le moat data maintenant, accélérer l'expansion                                      |
| Coût GPU AWS explose à l'échelle                | Moyenne                   | Élevé  | Négocier crédits AWS Startup, prévoir migration vers modèle distillé léger                     |
| Concurrent financé mieux que toi                | Moyenne                   | Moyen  | Lever des fonds dès que PMF validé (post-Phase 1)                                              |
| Anthropic change ses conditions (Claude Sonnet) | Faible                    | Élevé  | Tester des alternatives (GPT-4o Vision, Gemini) en parallèle, ne jamais dépendre d'un seul LLM |
| Churn élevé en M4                               | Haute si data moat faible | Élevé  | Logguer chaque interaction dès M2, personalisation croissante                                  |

---

## 7. Financement recommandé

### Phase 0-1 : Bootstrapped ou pre-seed

- Valider PMF sans dilution
- Si besoin de fonds : love money ou pre-seed €100-300K pour accélérer les tests

### Phase 2 : Seed round

- Déclencher quand : rétention D30 > 40% + 1 000 users actifs + MRR > €10K
- Montant : €500K-€1.5M
- Utilisation : marketing, data infrastructure, 2-3 recrutements clés
- Dilution acceptée : 15-20%

### Phase 3 : Série A

- Déclencher quand : ARR > €1M + croissance > 100%/an
- Montant : €3-8M
- Utilisation : expansion EU, B2B layer, pipeline M&A
- Dilution : 20-25%

---

## Résumé exécutif

**Le projet Outfit Now a un potentiel de €80-200M de valeur à l'exit si :**

1. Le cold-start est résolu (valeur visible dès la 3e pièce scannée)
2. Le modèle économique est cohérent (affiliation assumée = "achète mieux")
3. Le data moat est construit consciencieusement dès M2 (chaque interaction loggée)
4. L'expansion EU est engagée avant l'année 3
5. L'exit est négocié avec au moins 3 acheteurs en compétition

**La prochaine action :** 10 personnes, WhatsApp, 10 photos chacune, analyse Claude Vision manuelle. Cette semaine. Pas la semaine prochaine.

---

_Document généré le 27 Avril 2026 — basé sur l'analyse du Council IA d'Outfit Now_
