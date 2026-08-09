# Règlement — Coco FA

Site statique du règlement officiel du serveur RolePlay FiveM **Coco FA**.

> **Tout le contenu vit dans `reglement.md`.** Vous pouvez modifier une règle, en
> ajouter une ou changer une sanction **sans jamais toucher au HTML, au CSS ou au JS**.
> Le site lit ce fichier et le met en page automatiquement.

- **Recherche instantanée** (`Ctrl` / `⌘` + `K`), floue, sur le titre et le corps des règles.
- **Numérotation stable et citable** : chaque règle a une ancre (`#regle-4-2`) et un bouton « copier le lien ».
- **Badges de sanction** colorés, **barème** récapitulatif, **changelog** daté, marqueur « Modifié ».
- **Thème sombre / clair** mémorisé, mobile d'abord, accessible, imprimable proprement.
- HTML / CSS / JS **vanilla**, zéro framework, zéro CDN (polices auto-hébergées).

---

## 1. Modifier le règlement — l'essentiel

Ouvrez **`reglement.md`** à la racine. C'est le seul fichier à éditer.
Il se compose de trois parties :

1. un **en-tête** (métadonnées du document) ;
2. des **chapitres** contenant des **règles** ;
3. un **changelog**.

Après chaque modification, **poussez le fichier** : le site se met à jour tout seul.

---

## 2. L'en-tête (métadonnées)

Tout en haut du fichier, entre deux lignes `---` :

```markdown
---
serveur: Coco FA
version: 1.0
maj: 2026-08-09
accroche: Le roleplay d'abord. Ce règlement protège l'immersion de chacun.
discord: https://discord.gg/cocofa
url: https://fuego-core.github.io/coco-fa-reglement/
---
```

| Clé | Rôle |
| --- | --- |
| `serveur` | Nom du serveur (titre de l'onglet). |
| `version` | Numéro de version, affiché en évidence sur l'accueil. |
| `maj` | Date de dernière mise à jour, format `AAAA-MM-JJ`. |
| `accroche` | La phrase d'esprit affichée sous le grand titre. |
| `discord`, `url` | Informatifs (repris dans le pied de page / partage). |

---

## 3. Les chapitres

Un chapitre commence par un titre de niveau 1 (`#`) **numéroté** :

```markdown
# 1. Règles générales

> Texte d'introduction du chapitre (facultatif). La citation `>` s'affiche en exergue.
```

- Le numéro (`1.`) devient le « Chapitre 01 » affiché à l'écran.
- Tout ce qui suit le titre, **avant la première règle**, sert d'introduction de chapitre.

---

## 4. Les règles — le format à connaître

Une règle est un titre de niveau 2 (`##`) commençant par son **numéro** (`1.1`, `4.2`…),
suivi de lignes de **métadonnées**, puis du **corps** :

```markdown
## 4.2 Zones et interdits de conflit
sanction: kick
maj: 2026-08-09

Certaines zones sont neutres : hôpital, commissariat, points de spawn.
Aucun conflit armé n'y est autorisé.

- Pas de prise d'otage dans ces zones.
- Camper la sortie revient à violer cette règle.
```

Ce que fait le site avec ça :

- **`4.2`** → numéro affiché **et** ancre `#regle-4-2` (lien direct copiable).
- **`sanction:`** → badge coloré (voir le tableau ci-dessous).
- **`maj:`** → date de dernière modification de *cette* règle (sert au marqueur « Modifié »).
- Le **corps** accepte le Markdown courant (voir §6).

### Les valeurs de `sanction`

| À écrire | Badge affiché | Couleur |
| --- | --- | --- |
| `avertissement` | Avertissement | bleu (le plus léger) |
| `kick` | Kick | ambre |
| `ban-temp` | Ban temporaire | orange |
| `ban-def` | Ban définitif | rouge (le plus grave) |

> La couleur suit une rampe **froid → chaud = léger → grave**, lisible d'un coup d'œil
> sans même lire le mot. La ligne `sanction:` est **facultative** (utile pour le barème,
> qui n'encourt pas de sanction).

### Ajouter une règle

Copiez un bloc `##` existant, changez le numéro, le titre, la sanction et le texte.
Les numéros n'ont pas besoin de se suivre parfaitement, mais gardez-les **stables** :
un lien partagé sur Discord pointe vers un numéro précis.

### Le marqueur « Modifié »

Une règle porte le petit marqueur **« Modifié »** quand sa date `maj` correspond à la
**dernière vague de modifications** du document (et qu'il existe des règles plus anciennes).

Concrètement : tant que **toutes** les règles ont la même date `maj` (cas d'une première
publication), **aucun** marqueur n'apparaît — ce serait du bruit. Dès que vous modifiez
**quelques** règles en leur donnant une date plus récente, **celles-là** se signalent.
Fenêtre par défaut : 60 jours (réglable via `RECENT_DAYS` dans `assets/app.js`).

---

## 5. Le barème et le changelog

### Barème des sanctions

C'est un chapitre normal (ici `# 6. Barème des sanctions`). Ses règles peuvent ne pas
porter de `sanction:`. Vous pouvez y placer un **tableau** (voir §6) pour la grille,
et rédiger librement les **circonstances aggravantes**, **atténuantes** et la
**procédure de contestation**.

### Changelog

Un chapitre spécial, marqué `@changelog` :

```markdown
# @changelog Journal des modifications

> Ce qui a changé depuis votre dernière lecture (facultatif).

- 2026-08-09 · v1.0 · Publication initiale du règlement.
- 2026-09-01 · v1.1 · Précision sur les zones neutres (règle 4.2).
```

Chaque entrée est une puce `-` en **trois parties séparées par `·`** :
`date · version · description`. Le site les affiche en journal daté.

---

## 6. Markdown accepté dans le corps

- Paragraphes (séparés par une ligne vide)
- **`**gras**`**, *`*italique*`*, `` `code` ``
- Listes à puces (`-`) et numérotées (`1.`)
- Citations (`>`)
- Liens `[texte](https://…)` (les liens externes s'ouvrent dans un nouvel onglet)
- **Tableaux** :

```markdown
| Niveau | Signification |
| --- | --- |
| Avertissement | Rappel officiel consigné. |
| Ban définitif | Exclusion sans retour. |
```

---

## 7. Structure du projet

```
index.html            Coquille de la page (à ne pas éditer pour le contenu)
reglement.md          ← LE CONTENU. C'est ici que vous travaillez.
assets/
  styles.css          Direction artistique « Le Code »
  app.js              Chargement du .md, recherche, sommaire, thème…
  favicon.svg
  og-image.png        Aperçu Discord (Open Graph)
  fonts/              Polices Fraunces + Source Serif 4 (auto-hébergées)
```

Régénérer l'aperçu Discord (`og-image.png`) après un changement de nom/version :
il est produit à partir d'un gabarit HTML capturé en 1200×630. Modifiez le titre/la
version puis recapturez (n'importe quel navigateur en export 1200×630 convient).

---

## 8. Aperçu en local

Le site charge `reglement.md` via `fetch`, ce qui **ne marche pas** en ouvrant
`index.html` par double-clic (`file://`). Lancez un petit serveur :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

> Si le JavaScript est désactivé ou échoue, un message renvoie vers `reglement.md`,
> que GitHub affiche déjà en Markdown lisible.

---

## 9. Déploiement (GitHub Pages)

Le site est publié à la racine du dépôt — aucune étape de build.

**Option A — Depuis une branche (le plus simple)**
1. Fusionnez le contenu sur `main`.
2. Dépôt → **Settings → Pages**.
3. *Build and deployment* → **Source : Deploy from a branch**.
4. Branche : **`main`**, dossier : **`/ (root)`** → **Save**.

**Option B — Via GitHub Actions**
Le workflow `.github/workflows/pages.yml` déploie automatiquement à chaque push sur
`main`. Il suffit de régler **Settings → Pages → Source : GitHub Actions**.

**URL du site :**

```
https://fuego-core.github.io/coco-fa-reglement/
```

Un lien direct vers une règle : `https://fuego-core.github.io/coco-fa-reglement/#regle-4-2`
