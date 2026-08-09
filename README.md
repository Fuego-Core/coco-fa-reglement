# Règlement — Coco FA

Site statique du règlement officiel du serveur RolePlay FiveM **Coco FA**.

> **Tout le contenu vit dans `reglement.md`.** Vous pouvez modifier une règle, en
> ajouter une ou changer une sanction **sans jamais toucher au HTML, au CSS ou au JS**.
> Le site lit ce fichier et le met en page automatiquement.

- **Recherche instantanée** (`Ctrl` / `⌘` + `K`), floue, sur le titre et le corps des règles.
- **Numérotation stable et citable** : chaque règle a une ancre (`#regle-05-3`) et un bouton « copier le lien ».
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
maj: 2026-07-21
accroche: Tout ce qu'il faut savoir pour vivre en ville. Lis-le une fois, joue-le tout le temps.
discord: https://discord.gg/duuHzvwZ6J
url: https://fuego-core.github.io/coco-fa-reglement/
devise: Immersion · Cohérence · Conséquences
pied: Le staff se réserve le droit de trancher tout cas non prévu.
---
```

| Clé | Rôle |
| --- | --- |
| `serveur` | Nom du serveur (titre de l'onglet). |
| `version` | Numéro de version, affiché en évidence sur l'accueil. |
| `maj` | Date de dernière mise à jour, format `AAAA-MM-JJ`. |
| `accroche` | La phrase d'esprit affichée sous le grand titre. |
| `discord` | Lien du Discord : alimente le bouton « Rejoindre le Discord ». |
| `url` | Adresse publique du site (partage). |
| `devise` | Devise affichée en pied de page. |
| `pied` | Mention légale affichée sous la devise. |

---

## 3. Les chapitres

Un chapitre commence par un titre de niveau 1 (`#`) **numéroté** :

```markdown
# 02. Règles générales {#general}
kicker: Les fondamentaux

> Texte d'introduction du chapitre (facultatif). La citation `>` s'affiche en exergue.
```

- Le numéro (`02.`) s'affiche dans une pastille à côté du chapitre.
- **`{#general}`** fixe l'ancre du chapitre. **Ne la changez pas** : c'est elle qui
  fait que les liens déjà partagés (`…/#charte`, `…/#illegal`, …) continuent de marcher.
- `kicker:` est la petite accroche affichée au-dessus du titre (facultative).
- Tout ce qui suit, **avant la première règle**, sert d'introduction de chapitre.

---

## 4. Les règles — le format à connaître

Une règle est un titre de niveau 2 (`##`) commençant par son **numéro** (`00.1`, `05.3`…),
suivi de lignes de **métadonnées**, puis du **corps** :

```markdown
## 05.3 Une raison RP à toute agression
sanction: bannissable
maj: 2026-07-21

Pas de RDM. Toute violence doit découler d'une histoire : dette, territoire,
vengeance, deal qui tourne mal.

- Une agression sans contexte est un RDM.
- Le staff juge sur le scénario, pas sur le résultat.
```

Ce que fait le site avec ça :

- **`05.3`** → numéro affiché **et** ancre `#regle-05-3` (lien direct copiable).
- **`sanction:`** → badge coloré (voir le tableau ci-dessous).
- **`maj:`** → date de dernière modification de *cette* règle (sert au marqueur « Modifié »).
- Le **corps** accepte le Markdown courant (voir §6).

### Les valeurs de `sanction`

| À écrire | Badge affiché | Couleur | Pour quoi |
| --- | --- | --- | --- |
| `avertissement` | Avertissement | ambre | écart de RP |
| `tolerance-zero` | Tolérance zéro | orange | respect & comportement |
| `bannissable` | Bannissable | rouge | triche, exploit, RDM |

Trois niveaux complémentaires existent si vous voulez affiner un jour :
`kick`, `ban-temp`, `ban-def`.

> La couleur suit une rampe **froid → chaud = léger → grave**, lisible d'un coup d'œil
> sans même lire le mot. La ligne `sanction:` est **facultative** (utile pour le barème,
> qui n'encourt pas de sanction).

### Ajouter une règle

Copiez un bloc `##` existant, changez le numéro, le titre, la sanction et le texte.
Gardez le format à deux chiffres du chapitre (`05.8`, pas `5.8`) pour rester cohérent.

⚠️ Les numéros doivent rester **stables** : un lien collé sur Discord pointe vers un
numéro précis (`#regle-05-3`). Renuméroter une règle casse les liens déjà partagés.
Pour supprimer une règle, préférez la réécrire plutôt que décaler toutes les suivantes.

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

C'est un chapitre normal (ici `# 06. Staff & sanctions {#staff}`). Ses règles peuvent
ne pas porter de `sanction:`. Vous pouvez y placer un **tableau** (voir §6) pour
détailler la grille, les circonstances aggravantes et la procédure de contestation.

### Changelog

Un chapitre spécial, marqué `@changelog` :

```markdown
# @changelog Journal des modifications

> Ce qui a changé depuis votre dernière lecture (facultatif).

- 2026-07-21 · v1.0 · Publication du règlement officiel.
- 2026-09-01 · v1.1 · Précision sur les gangs et crews (règle 05.4).
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
  styles.css          Identité « Sunset » (océan, corail, bleu lagon)
  app.js              Chargement du .md, recherche, sommaire, thème…
  logo.png            Logo Coco FA (favicon + en-tête)
  key-art.jpg         Clé visuelle du serveur (bandeau d'accueil)
  og-image.png        Aperçu Discord (Open Graph, 1200×630)
  fonts/              Manrope (auto-hébergée, aucune requête externe)
```

L'aperçu Discord (`og-image.png`, 1200×630) reprend le logo et la clé visuelle du
serveur. Régénérez-le seulement si le nom, la version ou le nombre d'articles change.

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

Le site est **déjà en ligne** et publié à la racine du dépôt — aucune étape de build,
aucun workflow. GitHub Pages sert la branche `main` (dossier `/ (root)`).

**Pour mettre le règlement à jour : modifiez `reglement.md` et poussez sur `main`.**
Le site se régénère tout seul en une minute environ.

Si Pages devait être reconfiguré un jour : *Settings → Pages → Build and deployment →
Source : Deploy from a branch → `main` / `/ (root)`*.

**URL du site :**

```
https://fuego-core.github.io/coco-fa-reglement/
```

Lien direct vers une règle : `…/coco-fa-reglement/#regle-05-3`
Lien direct vers un chapitre : `…/coco-fa-reglement/#illegal`
