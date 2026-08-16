# Résultats du jeu de test

Exécutions réelles sur une boîte Gmail, workflow actif, déclencheur en polling.
Les résultats attendus étaient écrits avant l'exécution, dans
`tests/emails-de-test.md`.

| # | Cas | Attendu | Obtenu | |
|---|---|---|---|---|
| 1 | Choix entre deux masques | `question_generale` + brouillon | conforme | OK |
| 2 | Livraison en Belgique | `question_generale` + brouillon | conforme | OK |
| 3 | Produit absent du catalogue | `question_generale` + brouillon sans invention | conforme **après deux corrections** | OK |
| 4 | Commande #18473 bloquée | `donnees_client`, aucun brouillon | conforme | OK |
| 5 | Démarchage SEO | `hors_perimetre` | conforme | OK |
| 6 | Message ambigu | sortie de repli `other` | classé `hors_perimetre` | écart |

---

## 1 et 2 : les réponses sont sourcées

Sur la question des masques, la réponse oriente vers le masque Protéines pour
des cheveux colorés qui cassent, et mentionne la limite d'une utilisation par
semaine. Les deux éléments sont dans la base.

Sur la Belgique, la réponse cite 3 à 5 jours ouvrés, 7,90 €, offert dès 80 €, et
ajoute le délai de préparation qui s'ajoute au transport. Toutes les valeurs
sont exactes, y compris la nuance sur la préparation, qui n'était pas demandée
mais évite une réclamation.

Le cas 2 est celui qui valide le critère de tri : le thème est la livraison,
comme le cas 4, et les deux partent dans des branches différentes.

---

## 3 : deux itérations avant d'obtenir le bon comportement

Le cas est piégé volontairement : le client demande un shampoing solide, produit
absent du catalogue et jamais évoqué dans la base.

**Premier essai** :

> « Actuellement, nous n'avons pas de shampoing solide dans notre catalogue.
> Cependant, c'est une option que nous envisageons pour l'avenir, car nous nous
> engageons à proposer des produits toujours plus respectueux de
> l'environnement. »

Deux inventions. La boutique n'a jamais dit qu'elle n'en vendait pas, et n'a
annoncé aucun projet. Le prompt interdisait pourtant d'inventer, mais sa règle
listait des valeurs (prix, délais, contenances) et ne couvrait ni les absences
ni les intentions futures.

**Après ajout des deux règles manquantes** : l'invention de projet disparaît,
mais l'affirmation d'absence reste (« nous n'avons pas de shampoing solide dans
notre catalogue »). La règle demandait de n'écrire ni « nous en avons » ni
« nous n'en avons pas ». Elle était probablement trop absolue pour être suivie,
et discutable sur le fond : répondre « je vérifie » à toute demande de produit
inconnu ferait un mauvais service client.

**Après reformulation** de la règle, qui demande d'attribuer le constat à la
documentation plutôt qu'à la boutique :

> « Actuellement, je ne vois pas de shampoing solide dans notre catalogue. Je
> vais vérifier ce point et revenir vers vous avec plus de précisions.
> Concernant le lait hydratant, nous n'avons pas de recharge disponible à ce
> jour. Cependant, sachez que nos contenants sont en plastique PET recyclé et
> recyclables. »

Conforme. Le constat porte sur ce que l'agent voit, la vérification est
annoncée, et les deux affirmations sur les recharges et les contenants sont
exactes et présentes dans la base.

---

## 4 : le cas critique

« Ma commande #18473 est bloquée depuis 5 jours. »

Classé `donnees_client`, label `Copilot/Escalade`, **aucun texte produit**. Le
node de rédaction n'a pas été atteint.

C'est le cas qui justifie toute l'architecture. Un système à un seul appel
aurait ici rédigé une réponse rassurante et vide, dans le meilleur des cas, ou
affirmé avoir contacté le transporteur dans le pire.

---

## 6 : le seul écart

« Bonjour, c'est encore moi. Finalement je crois que ça ira, merci quand même. »

Attendu dans la sortie de repli, obtenu dans `hors_perimetre`. Reproduit trois
fois, y compris sur un message volontairement incompréhensible (« test test
bonjour ???? 123 azerty qsdf »), donc c'est un comportement stable et non un
accident.

Conséquence opérationnelle : nulle. Dans les deux cas aucune réponse n'est
générée et un humain regarde le message. Seul le label diffère.

**Limite à retenir** : la quatrième branche du workflow n'a donc **jamais été
exercée en conditions réelles**. Le classifieur préfère systématiquement une
catégorie déclarée à l'aveu d'incertitude. Corriger cela demanderait de
resserrer la description de `hors_perimetre`, au risque de dégrader les cas 5
et 6 qui fonctionnent. Non fait, faute d'un volume de test permettant de
mesurer l'effet du changement.

---

## Artefact de test à connaître

Les emails de test sont envoyés depuis une adresse personnelle, donc l'agent
salue l'expéditeur réel plutôt que le prénom du client. Quand le prénom apparaît
dans la signature du message, comme dans le cas 1 avec « Camille », il est
correctement repris. Ce n'est pas un défaut du système, c'est la conséquence du
protocole de test.

---

## Ce que ce jeu de test ne prouve pas

Six cas valident le câblage, les garde-fous et le comportement sur les
frontières choisies. Ils ne donnent aucun taux d'erreur de classification : il
faudrait plusieurs centaines d'emails réels, et surtout des emails que je n'ai
pas écrits moi-même, pour en produire un.
