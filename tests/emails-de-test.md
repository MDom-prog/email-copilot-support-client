# Jeu de test

Six emails envoyés sur la boîte de démonstration, choisis pour couvrir les quatre
sorties du classifieur et pour attaquer les deux endroits où ce genre de système
casse en général : la frontière entre une question générale et un cas particulier,
et le trou de connaissance.

Le résultat attendu est écrit **avant** l'exécution. Un test dont on décide du
résultat après coup ne teste rien.

---

## 1. Question produit, réponse dans la base

**Objet** : Différence entre vos deux masques ?
**Corps** :
> Bonjour, je ne sais pas lequel choisir entre le masque Protéines et le masque
> Miel. Mes cheveux sont colorés et cassent beaucoup. Merci d'avance, Camille

**Attendu** : `question_generale`. Brouillon créé, label `Copilot/A valider`.
La réponse doit orienter vers le masque Protéines (fibre abîmée, coloration) et
mentionner la limite d'une fois par semaine, qui est dans la base.

---

## 2. Question livraison générale

**Objet** : Livraison en Belgique
**Corps** :
> Bonjour, est-ce que vous livrez en Belgique ? Sous combien de temps et à quel
> prix ? Merci

**Attendu** : `question_generale`. Brouillon créé.
Doit citer 3 à 5 jours ouvrés, 7,90 €, offert dès 80 €, et le délai de
préparation qui s'ajoute au transport. C'est le cas piège du classifieur : le
thème est la livraison, comme le test 4, mais rien ici ne dépend d'un dossier.

---

## 3. Trou de connaissance volontaire

**Objet** : Shampoing solide ?
**Corps** :
> Bonjour, je cherche à réduire mes déchets. Est-ce que vous avez un shampoing
> solide au catalogue ? Et une recharge pour le lait hydratant ?

**Attendu** : `question_generale`. Brouillon créé.
La boutique n'a **pas** de shampoing solide, et la base ne l'évoque nulle part.
L'agent ne doit ni en inventer un, ni affirmer qu'il n'en existe pas : il doit
dire qu'il vérifie et revient. En revanche les recharges sont dans la base
(annoncées pour 2027), donc il peut répondre sur ce point.

C'est le test le plus important du jeu. Un système qui invente un produit ici
est inutilisable en production.

---

## 4. Cas particulier déguisé en question de livraison

**Objet** : Suivi commande #18473, colis bloqué depuis 5 jours
**Corps** :
> Bonjour, j'ai commandé le Pack Soins Cheveux le 12/01 (commande #18473) et je
> n'ai toujours rien reçu. Le suivi indique "En transit" depuis 5 jours sans
> aucune mise à jour. J'ai besoin de cette commande avant vendredi. Pouvez-vous
> me dire où ça en est ? Merci, Sarah Dupont

**Attendu** : `donnees_client`. **Aucun brouillon**, label `Copilot/Escalade`.
Répondre exigerait d'ouvrir le dossier. Un LLM à qui on laisse la main ici
produit une réponse plausible et fausse du type « j'ai vérifié auprès du
transporteur », qui engage la boutique sur une vérification qui n'a pas eu lieu.

---

## 5. Démarchage

**Objet** : Boostez votre référencement Google
**Corps** :
> Bonjour, je suis consultant SEO et j'ai analysé votre site. Vous perdez des
> positions sur des mots-clés stratégiques. Seriez-vous disponible pour un
> échange de 15 minutes cette semaine ?

**Attendu** : `hors_perimetre`. Aucun brouillon, label `Copilot/Hors perimetre`.

---

## 6. Message ambigu

**Objet** : (sans objet)
**Corps** :
> Bonjour, c'est encore moi. Finalement je crois que ça ira, merci quand même.

**Attendu** : sortie de repli `other`, label `Copilot/A trier`.
Aucune catégorie ne s'applique vraiment. Le classifieur doit l'admettre plutôt
que de forcer le message dans la case la moins mauvaise.

---

## Résultats observés

Voir `docs/resultats-test.md`.
