# Décisions techniques

Les arbitrages qui ont façonné ce workflow, avec ce qui les a déclenchés.
Plusieurs viennent d'un comportement observé en test, pas d'une intuition de
conception.

---

## 1. Classer avant de rédiger, plutôt qu'un prompt unique

**La tentation** : un seul appel au modèle, avec l'email et une consigne du
type « réponds si tu peux, sinon dis que tu transmets ».

**Pourquoi ça ne tient pas** : un modèle de langage à qui on présente une
question et un objectif de réponse répond. C'est ce qu'il fait. Lui demander de
décider lui-même de son propre silence, dans le même appel où on lui demande
d'écrire, c'est mettre le garde-fou et le conducteur dans la même main.

**Ce qui a été fait** : le refus est une branche du workflow, pas une phrase
dans un prompt. Une demande qui porte sur un dossier client n'atteint jamais le
node de rédaction, elle est arrêtée une étape plus tôt. Le rédacteur ne peut
pas mal répondre à un email qu'il ne reçoit pas.

---

## 2. Le critère de tri porte sur la source, pas sur le thème

**Le problème** : « Livrez-vous en Belgique et sous quel délai ? » et « Ma
commande #18473 est bloquée depuis 5 jours » parlent toutes les deux de
livraison. La première se répond avec la documentation publique. La seconde
exige d'ouvrir un dossier. Un classifieur qui trie par sujet met les deux dans
la même case et se trompe une fois sur deux.

**Ce qui a été fait** : le prompt du classifieur énonce le critère explicitement,
puis donne les deux exemples ci-dessus comme couple opposé. La frontière n'est
pas le sujet abordé, c'est **ce qu'il faut consulter pour répondre**.

---

## 3. En cas de doute, escalader

Les deux erreurs possibles n'ont pas le même prix.

Escalader une question à laquelle la documentation répondait coûte une minute
de lecture humaine. Rédiger une réponse sur un dossier qu'on n'a pas ouvert
produit un message plausible et faux, envoyé à un client sous le nom de la
boutique.

Le prompt du classifieur nomme cette asymétrie et impose le choix
`donnees_client` en cas d'hésitation. La température du modèle de tri est à 0,
un tri stable valant mieux qu'un tri créatif.

---

## 4. Une sortie de repli plutôt qu'un classement forcé

Un classifieur à trois catégories range tout dans l'une des trois, y compris ce
qui ne rentre nulle part. La sortie de repli (`fallback: other`) donne au
système le droit de ne pas trancher : le message part au tri humain, sans
qu'aucune réponse ne soit produite.

Observé en test : cette branche se déclenche peu. Un message court et sans
demande claire est le plus souvent rangé dans `hors_perimetre` plutôt que dans
le repli. Le résultat opérationnel est le même, aucune réponse n'est générée et
un humain regarde, mais le label posé n'est pas celui attendu. C'est une
imprécision de tri, pas un défaut de sécurité.

---

## 5. Deux modèles, pas un

| Étape | Modèle | Fréquence |
|---|---|---|
| Classification | `gpt-4o-mini`, température 0 | 100 % des emails |
| Rédaction | `gpt-4o` | seulement les emails retenus |

Trier n'est pas rédiger. L'opération qui tourne sur la totalité du flux devait
être la moins chère, celle qui produit un texte destiné à un client devait être
la meilleure. Sur le jeu de test, un tiers des emails n'atteint jamais la
rédaction.

---

## 6. Un brouillon, jamais un envoi

Le node Gmail est en `resource: draft`. Il n'existe aucun chemin, dans tout le
workflow, qui envoie un email à un client.

C'est ce qui rend le système déployable chez un commerçant qui ne connaît rien
à l'IA : le pire cas est un brouillon à supprimer, pas un message parti.

Le brouillon est rattaché au fil d'origine par son `threadId`, donc il apparaît
au bon endroit dans la boîte et se relit avec le message du client sous les yeux.

---

## 7. L'agent a inventé un produit, et la règle anti-invention ne l'a pas arrêté

**Symptôme observé.** Test volontairement piégé : un client demande un shampoing
solide, produit absent du catalogue et jamais évoqué dans la base. Réponse
produite au premier essai :

> « Actuellement, nous n'avons pas de shampoing solide dans notre catalogue.
> Cependant, c'est une option que nous envisageons pour l'avenir, car nous nous
> engageons à proposer des produits toujours plus respectueux de
> l'environnement. »

Deux inventions dans deux phrases. La boutique n'a jamais dit qu'elle n'en
vendait pas, et n'a jamais annoncé de projet.

**Cause.** Le prompt interdisait d'inventer « un prix, un délai, une contenance
ou une condition ». Il couvrait les **valeurs**, et le modèle l'a respecté à la
lettre. Il n'avait rien sur deux autres façons de meubler un trou :

- conclure une absence à partir d'un silence de la base, alors qu'une base de
  connaissance est presque toujours incomplète ;
- annoncer une intention future, ce qui n'est ni un prix ni un délai, donc
  échappait à la règle telle qu'elle était écrite.

À noter, le modèle avait par ailleurs raison sur les recharges dans la même
réponse : elles sont réellement annoncées pour 2027 dans la base. Le problème
n'est pas qu'il invente tout le temps, c'est qu'il invente à l'endroit exact où
la règle ne regardait pas.

**Premier correctif.** Deux règles ajoutées au prompt système, visant les deux
mécanismes plutôt que des exemples : ne jamais conclure une absence, ne jamais
annoncer un projet ou une évolution à venir absent de la base.

Résultat au test suivant : l'invention de projet disparaît, mais l'affirmation
d'absence reste, sous la forme « nous n'avons pas de shampoing solide dans notre
catalogue ». La règle demandait pourtant de n'écrire ni « nous en avons » ni
« nous n'en avons pas ».

**Pourquoi la règle n'a pas tenu.** Elle était trop absolue pour être suivie, et
discutable sur le fond. Répondre « je vérifie et je reviens » à toute demande de
produit inconnu ferait un mauvais service client, et le modèle avait de bonnes
raisons de préférer une réponse utile.

**Second correctif.** La règle ne demande plus de taire le constat, mais de
l'**attribuer à sa source** :

> Tu attribues explicitement ton constat à la documentation, jamais à la
> boutique. Tu écris « je ne le vois pas dans notre catalogue, je vérifie et je
> reviens vers vous », et non « nous n'en avons pas ».

Résultat conforme au troisième essai. Le client obtient une réponse utile, et la
boutique n'affirme rien sur son propre catalogue à partir d'un document qui peut
être incomplet.

**Leçon retenue.** Deux choses, dont la seconde a plus de valeur que la
première. Une interdiction énumérative ne couvre que ce qu'elle énumère : un
modèle qui respecte scrupuleusement « n'invente pas de prix » peut inventer une
politique commerciale sans sortir de la consigne. Et une règle qu'un modèle
enfreint mérite d'abord d'être relue : ici, ce n'était pas de la désobéissance,
c'était une consigne qui demandait un comportement déraisonnable. La bonne
correction n'a pas été d'insister, mais de reformuler ce qu'on voulait vraiment.

---

## 8. Le filtre reposait sur un état que le workflow ne contrôle pas

**Symptôme observé.** Le déclencheur filtrait sur `is:unread`, et cinq emails de
test ne sont jamais remontés. Vérification faite en interrogeant l'API Gmail :
aucun des messages de la boîte ne portait le label `UNREAD`, alors qu'ils
venaient d'arriver et n'avaient pas été traités.

**Cause.** L'état lu ou non lu d'un message ne dépend pas du workflow. Le
commerçant ouvre sa boîte sur son téléphone, un filtre Gmail s'applique, un
autre client mail marque au passage : l'email devient lu avant le cycle de
polling, et n'est alors **jamais** traité. Le symptôme inverse existe aussi, un
email relu redevenant éligible.

Ce qui empêchait réellement un second passage n'était pas le filtre, mais le
curseur temporel interne du déclencheur Gmail. Une protection implicite, hors
du contrôle du workflow, et qu'une simple désactivation remet en cause.

**Correctif.** Le workflow pose son propre marqueur. Un node de convergence,
`Marquer comme traité`, ajoute le label `Copilot-Traite` après le passage dans
n'importe laquelle des quatre branches, et le déclencheur filtre sur
`-label:copilot-traite`. La condition d'éligibilité devient une donnée que le
workflow est seul à écrire.

**Détail qui a compté** : ce marqueur est le seul label nommé sans espace ni
barre oblique. Les quatre autres suivent la convention `Copilot/...`, lisible
dans l'arborescence Gmail, mais celui-ci apparaît dans une requête de recherche,
où Gmail normalise les séparateurs de façon peu prévisible.

**Effet de bord traité.** Sur ce node de convergence,
`$('Normaliser le message').item` devient ambigu, n8n ne pouvant plus rattacher
de façon fiable un item réuni depuis quatre branches à son origine.
L'identifiant est donc lu sur l'item entrant, que les nodes Gmail propagent.

---

## 9. Le fichier de la base épinglé en dur

Le node de téléchargement Drive cible le document par identifiant écrit en dur,
et non par `{{ $json.id }}`.

Avec l'expression, une exécution déclenchée à la main n'a aucun événement Drive
en entrée : elle se résout alors sur le dernier fichier modifié du Drive et
indexe un document arbitraire, sans lever la moindre erreur. La base semble
chargée, l'agent répond, et les réponses sortent d'un document qui n'a rien à
voir.

---

## 10. Un label se cible par identifiant, jamais par son nom

**Symptôme observé.** Le node censé créer les labels a renvoyé la liste des 21
labels existants de la boîte, quatre fois de suite, sans rien créer et sans
erreur.

**Cause.** `resource: 'label'` était bien renseigné, mais pas `operation`. Le
node est retombé sur son opération par défaut, `getAll`. Un paramètre manquant
avait produit un résultat, ce qui est plus difficile à voir qu'une erreur.

**Conséquence pratique.** Les labels se ciblent ensuite par identifiant interne
(`Label_1`, `Label_2`...), attribué par Gmail à la création. Ces identifiants
sont propres à chaque boîte : le même nom de label n'a pas le même identifiant
ailleurs. D'où le workflow d'installation séparé, qui crée les cinq labels et
renvoie les identifiants à reporter.

---

## 11. L'adresse du client n'est pas le champ `From`

Gmail renvoie `Prénom Nom <adresse@domaine>`. Utilisé tel quel comme
destinataire du brouillon, ce champ produit une adresse invalide.

Le node de normalisation extrait l'adresse seule par expression régulière, avec
repli sur la valeur brute si le format ne contient pas de chevrons, ce qui est
le cas pour certains expéditeurs.

---

## 12. Vector store en mémoire : limite assumée

L'index est un `vectorStoreInMemory`. Il se vide à chaque redémarrage de n8n.
Après un redémarrage et sans réindexation, l'agent tourne sans documentation :
il ne se plante pas, il répond « je vérifie et je reviens vers vous » à tout,
ce qui est le comportement le moins nuisible possible mais reste une panne
silencieuse.

Le choix est délibéré pour un projet de démonstration : aucune infrastructure
supplémentaire à installer pour reproduire le workflow. Pour un déploiement
réel, il faut un store persistant (Supabase pgvector, Qdrant). C'est la
première ligne des prochaines étapes.
