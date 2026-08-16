# Architecture

Le workflow compte 22 nodes répartis en deux flux indépendants, qui ne
communiquent que par un point : l'index vectoriel de la base de connaissance.

---

## Flux A : indexation de la base de connaissance

```
Indexer à la demande (manuel) ─┐
                               ├─→ Télécharger la base (Drive) ──→ Indexer la base
Base de connaissance modifiée ─┘                                    (vector store, insert)
        (Drive, fileUpdated)

Sous-noeuds de l'indexation :
  Indexer la base
    ├── ai_embedding : Embeddings (indexation)   OpenAI text-embedding
    └── ai_document  : Chargeur de document
                         └── ai_textSplitter : Découpage en chunks (400 tokens, 40 de recouvrement)
```

Le document de la boutique vit sur Google Drive et appartient au commerçant.
C'est lui qui l'écrit et le met à jour, sans jamais ouvrir n8n. Le déclencheur
Drive surveille ce fichier précis et relance l'indexation à chaque modification.

Le déclencheur manuel existe pour une raison qui n'est pas cosmétique : le
vector store est en mémoire et se vide à chaque redémarrage de n8n. Sans
réindexation, l'agent tourne sans documentation et se rabat sur « je vérifie et
je reviens vers vous » pour tout. Le document de 200 lignes produit 7 chunks.

**Piège évité** : le node de téléchargement cible le fichier par identifiant
codé en dur, et non par `{{ $json.id }}`. En exécution manuelle, il n'y a pas
d'événement Drive en entrée, donc l'expression se résout sur le dernier fichier
modifié du Drive, ce qui indexe un document arbitraire sans lever d'erreur.

---

## Flux B : traitement des emails entrants

```
Nouvel email client (Gmail, toutes les 2 min)
  └─→ Normaliser le message (Set)
        └─→ Classer la demande (Text Classifier)
              ├─ sortie 0  question_generale ─→ Rédiger la réponse (Agent)
              │                                   └─→ Créer le brouillon (Gmail, draft)
              │                                         └─→ Marquer à valider     (label A valider)
              ├─ sortie 1  donnees_client    ─────────→ Marquer escalade          (label Escalade)
              ├─ sortie 2  hors_perimetre    ─────────→ Marquer hors périmètre    (label Hors perimetre)
              └─ sortie 3  fallback other    ─────────→ Marquer à trier           (label A trier)

                            les quatre issues convergent vers
                            Marquer comme traité (label Copilot-Traite)

Sous-noeuds :
  Classer la demande
    └── ai_languageModel : Modèle de classification   gpt-4o-mini, température 0
  Rédiger la réponse
    ├── ai_languageModel : Modèle de rédaction        gpt-4o
    └── ai_tool          : Base_connaissance_boutique  vector store, retrieve-as-tool
                             └── ai_embedding : Embeddings (recherche)
```

### Node par node

| Node | Rôle | Point d'attention |
|---|---|---|
| **Nouvel email client** | Déclencheur Gmail, polling toutes les 2 minutes | Filtre `is:unread to:<adresse support>`. Sans ce filtre, le workflow traiterait toute la boîte. |
| **Normaliser le message** | Extrait 6 champs stables de l'email brut | Isole le reste du workflow de la forme des données Gmail. Extrait l'adresse seule de `Prénom Nom <adresse>`, qui ne peut pas servir de destinataire telle quelle. |
| **Classer la demande** | Range l'email dans une des 3 catégories, ou aucune | Une sortie par catégorie, plus une sortie de repli. Voir `decisions-techniques.md`. |
| **Rédiger la réponse** | Agent qui rédige le corps du mail | Un seul outil : la base de connaissance. Aucun accès à une donnée client, par construction. |
| **Créer le brouillon** | Écrit un brouillon dans la boîte | `resource: draft`, jamais `message`. Rattaché au fil d'origine par `threadId`. |
| **Marquer à valider / escalade / hors périmètre / à trier** | Pose le label correspondant | Le label se cible par identifiant interne, jamais par nom. Ces identifiants sont des placeholders dans l'export, à remplacer par ceux de votre boîte. |
| **Marquer comme traité** | Pose le label `Copilot-Traite` | Point de convergence des 4 branches. Fait sortir le message du filtre du déclencheur, donc un email ne peut pas être traité deux fois. Le marqueur est posé par le workflow, alors que l'état lu ne se contrôle pas depuis n8n. |

### Sur le node de convergence

Les quatre branches se rejoignent sur un même node. À cet endroit,
`$('Normaliser le message').item` devient ambigu : n8n ne sait plus rattacher
de façon fiable l'item courant à son origine. L'identifiant du message est donc
lu sur l'item entrant (`$json.id`), que les nodes Gmail précédents propagent.

---

## Les trois garde-fous structurels

Ils ne reposent pas sur la bonne volonté du modèle, mais sur la forme du
workflow. C'est la différence entre une consigne et une garantie.

1. **Aucun email n'est jamais envoyé.** Le seul node d'écriture Gmail crée un
   brouillon. Même une réponse totalement fausse ne peut pas atteindre un
   client sans qu'un humain clique sur « Envoyer ».

2. **L'agent n'a pas accès aux données client.** Il dispose d'un seul outil, la
   base de connaissance. Il ne peut pas lire une commande, parce que rien dans
   le workflow ne lui en donne le moyen. L'interdiction de prétendre l'avoir
   fait est écrite dans son prompt, mais l'impossibilité de le faire est dans
   le câblage.

3. **Une demande sur un dossier précis n'atteint jamais le rédacteur.** Elle est
   arrêtée une étape plus tôt, par le classifieur, et part vers un humain sans
   qu'aucun texte ne soit produit.

---

## Ressources à créer

| Ressource | Détail |
|---|---|
| Google Doc | La base de connaissance de la boutique. Son identifiant se reporte dans le déclencheur Drive **et** dans le node de téléchargement. |
| 5 labels Gmail | `Copilot/A valider`, `Copilot/Escalade`, `Copilot/Hors perimetre`, `Copilot/A trier`, plus le marqueur `Copilot-Traite`. Créés par `workflow/setup-labels.workflow.ts`, qui renvoie leurs identifiants. Le marqueur est nommé sans espace ni barre oblique parce qu'il apparaît dans la requête du déclencheur, où Gmail normalise les séparateurs de façon peu prévisible. |
| Credentials n8n | OpenAI, Google Drive (OAuth2), Gmail (OAuth2). |

---

## Coût

Deux appels par email au maximum, un seul pour les emails écartés.

- Classification : `gpt-4o-mini`, sur 100 % des emails.
- Rédaction : `gpt-4o` plus un appel d'embedding, seulement sur les emails
  retenus par le classifieur.

Le tri étant la seule opération qui tourne systématiquement, c'est celle qui
devait être la moins chère. Sur le jeu de test, un tiers des emails n'atteint
pas la rédaction.
