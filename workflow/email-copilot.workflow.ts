import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Email Copilot - Support boutique
// Nodes   : 22  |  Connections: 15
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// IndexerALaDemande                  manualTrigger
// BaseDeConnaissanceModifiee         googleDriveTrigger         [creds]
// TelechargerLaBase                  googleDrive                [creds]
// DecoupageEnChunks                  textSplitterTokenSplitter  [ai_textSplitter]
// ChargeurDeDocument                 documentDefaultDataLoader  [AI] [ai_document]
// EmbeddingsIndexation               embeddingsOpenAi           [creds] [ai_embedding]
// IndexerLaBase                      vectorStoreInMemory        [AI]
// NouvelEmailClient                  gmailTrigger               [creds]
// NormaliserLeMessage                set
// ClasserLaDemande                   textClassifier             [AI]
// ModeleDeClassification             lmChatOpenAi               [creds] [ai_languageModel]
// RedigerLaReponse                   agent                      [AI]
// ModeleDeRedaction                  lmChatOpenAi               [creds] [ai_languageModel]
// EmbeddingsRecherche                embeddingsOpenAi           [creds] [ai_embedding]
// BaseConnaissanceBoutique           vectorStoreInMemory        [AI] [ai_tool]
// CreerLeBrouillon                   gmail                      [creds]
// MarquerAValider                    gmail                      [creds]
// MarquerEscalade                    gmail                      [creds]
// MarquerHorsPerimetre               gmail                      [creds]
// MarquerATrier                      gmail                      [creds]
// MarquerCommeTraite                 gmail                      [creds]
// StickyIndexation                   stickyNote
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// IndexerALaDemande
//    → TelechargerLaBase
//      → IndexerLaBase
// BaseDeConnaissanceModifiee
//    → TelechargerLaBase (↩ loop)
// NouvelEmailClient
//    → NormaliserLeMessage
//      → ClasserLaDemande
//        → RedigerLaReponse
//          → CreerLeBrouillon
//            → MarquerAValider
//              → MarquerCommeTraite
//       .out(1) → MarquerEscalade
//          → MarquerCommeTraite (↩ loop)
//       .out(2) → MarquerHorsPerimetre
//          → MarquerCommeTraite (↩ loop)
//       .out(3) → MarquerATrier
//          → MarquerCommeTraite (↩ loop)
//
// AI CONNECTIONS
// ChargeurDeDocument.uses({ ai_textSplitter: DecoupageEnChunks })
// IndexerLaBase.uses({ ai_embedding: EmbeddingsIndexation, ai_document: [ChargeurDeDocument] })
// ClasserLaDemande.uses({ ai_languageModel: ModeleDeClassification })
// RedigerLaReponse.uses({ ai_languageModel: ModeleDeRedaction, ai_tool: [BaseConnaissanceBoutique] })
// BaseConnaissanceBoutique.uses({ ai_embedding: EmbeddingsRecherche })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'WORKFLOW_ID',
    name: 'Email Copilot - Support boutique',
    active: false,
    settings: { executionOrder: 'v1', availableInMCP: false },
})
export class EmailCopilotSupportBoutiqueWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'b7c1e001-0001-4001-9001-a1b2c3d40001',
        name: 'Indexer à la demande',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [-260, -100],
    })
    IndexerALaDemande = {};

    @node({
        id: 'b7c1e001-0002-4002-9002-a1b2c3d40002',
        name: 'Base de connaissance modifiée',
        type: 'n8n-nodes-base.googleDriveTrigger',
        version: 1,
        position: [-260, 80],
        credentials: { googleDriveOAuth2Api: { id: 'GOOGLE_DRIVE_CREDENTIAL_ID', name: 'Google Drive' } },
    })
    BaseDeConnaissanceModifiee = {
        pollTimes: {
            item: [
                {
                    mode: 'everyMinute',
                },
            ],
        },
        triggerOn: 'specificFile',
        event: 'fileUpdated',
        fileToWatch: {
            __rl: true,
            value: 'GOOGLE_DOC_ID',
            mode: 'list',
            cachedResultName: 'Base de connaissance, Maison Kaolia',
            cachedResultUrl:
                'https://docs.google.com/document/d/GOOGLE_DOC_ID/edit?usp=drivesdk',
        },
    };

    @node({
        id: 'b7c1e001-0003-4003-9003-a1b2c3d40003',
        name: 'Télécharger la base',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [-40, -10],
        credentials: { googleDriveOAuth2Api: { id: 'GOOGLE_DRIVE_CREDENTIAL_ID', name: 'Google Drive' } },
    })
    TelechargerLaBase = {
        operation: 'download',
        fileId: {
            __rl: true,
            value: 'GOOGLE_DOC_ID',
            mode: 'id',
        },
        options: {},
    };

    @node({
        id: 'b7c1e001-0004-4004-9004-a1b2c3d40004',
        name: 'Découpage en chunks',
        type: '@n8n/n8n-nodes-langchain.textSplitterTokenSplitter',
        version: 1,
        position: [180, 300],
    })
    DecoupageEnChunks = {
        chunkSize: 400,
        chunkOverlap: 40,
    };

    @node({
        id: 'b7c1e001-0005-4005-9005-a1b2c3d40005',
        name: 'Chargeur de document',
        type: '@n8n/n8n-nodes-langchain.documentDefaultDataLoader',
        version: 1.1,
        position: [180, 150],
    })
    ChargeurDeDocument = {
        dataType: 'binary',
        binaryMode: 'allInputData',
        loader: 'auto',
        binaryDataKey: 'data',
        textSplittingMode: 'custom',
        options: {},
    };

    @node({
        id: 'b7c1e001-0006-4006-9006-a1b2c3d40006',
        name: 'Embeddings (indexation)',
        type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
        version: 1.2,
        position: [340, 300],
        credentials: { openAiApi: { id: 'OPENAI_CREDENTIAL_ID', name: 'OpenAI' } },
    })
    EmbeddingsIndexation = {
        options: {},
    };

    @node({
        id: 'b7c1e001-0007-4007-9007-a1b2c3d40007',
        name: 'Indexer la base',
        type: '@n8n/n8n-nodes-langchain.vectorStoreInMemory',
        version: 1.2,
        position: [180, -10],
    })
    IndexerLaBase = {
        mode: 'insert',
        memoryKey: {
            __rl: true,
            value: 'boutique_db',
            mode: 'list',
            cachedResultName: 'boutique_db',
        },
        embeddingBatchSize: 400,
    };

    @node({
        id: 'b7c1e001-0008-4008-9008-a1b2c3d40008',
        name: 'Nouvel email client',
        type: 'n8n-nodes-base.gmailTrigger',
        version: 1.3,
        position: [-260, 700],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    NouvelEmailClient = {
        pollTimes: {
            item: [
                {
                    mode: 'everyX',
                    value: 2,
                    unit: 'minutes',
                },
            ],
        },
        simple: true,
        filters: {
            includeSpamTrash: false,
            includeDrafts: false,
            q: 'to:GMAIL_SUPPORT_ADDRESS -label:copilot-traite',
        },
    };

    @node({
        id: 'b7c1e001-0009-4009-9009-a1b2c3d40009',
        name: 'Normaliser le message',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-40, 700],
    })
    NormaliserLeMessage = {
        assignments: {
            assignments: [
                {
                    id: 'aa000001-0000-4000-8000-000000000001',
                    name: 'message_id',
                    value: '={{ $json.id }}',
                    type: 'string',
                },
                {
                    id: 'aa000002-0000-4000-8000-000000000002',
                    name: 'thread_id',
                    value: '={{ $json.threadId }}',
                    type: 'string',
                },
                {
                    id: 'aa000003-0000-4000-8000-000000000003',
                    name: 'sujet',
                    value: '={{ $json.Subject || "(sans objet)" }}',
                    type: 'string',
                },
                {
                    id: 'aa000004-0000-4000-8000-000000000004',
                    name: 'expediteur',
                    value: '={{ $json.From }}',
                    type: 'string',
                },
                {
                    id: 'aa000005-0000-4000-8000-000000000005',
                    name: 'expediteur_email',
                    value: '={{ $json.From.match(/<(.+)>/) ? $json.From.match(/<(.+)>/)[1] : $json.From }}',
                    type: 'string',
                },
                {
                    id: 'aa000006-0000-4000-8000-000000000006',
                    name: 'corps',
                    value: '={{ ($json.text || $json.snippet || "").trim() }}',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b7c1e001-0010-4010-9010-a1b2c3d40010',
        name: 'Classer la demande',
        type: '@n8n/n8n-nodes-langchain.textClassifier',
        version: 1.1,
        position: [180, 700],
    })
    ClasserLaDemande = {
        inputText: `=Objet : {{ $json.sujet }}

Message :
{{ $json.corps }}`,
        categories: {
            categories: [
                {
                    category: 'question_generale',
                    description:
                        "Question à laquelle la documentation publique de la boutique répond : catalogue, prix, composition, conseils d'utilisation, délais et frais de livraison en général, conditions de retour et de remboursement, moyens de paiement, programme de fidélité, horaires. Le client demande une information générale, pas l'état de SON dossier.",
                },
                {
                    category: 'donnees_client',
                    description:
                        "Demande qui exige de consulter un compte, une commande ou un dossier précis pour répondre : où en est ma commande, numéro de suivi, colis non reçu ou en retard, remboursement en cours, changement d'adresse sur une commande passée, solde de points de fidélité, réclamation, litige, produit reçu cassé ou erroné, demande RGPD. Le client parle de SA commande ou de SON compte, souvent avec un numéro de commande.",
                },
                {
                    category: 'hors_perimetre',
                    description:
                        "Message qui n'est pas une demande de client : démarchage commercial, proposition de partenariat ou d'influence, candidature spontanée, facture ou relance fournisseur, newsletter, notification automatique de plateforme, spam.",
                },
            ],
        },
        options: {
            fallback: 'other',
            systemPromptTemplate: `Tu tries les emails reçus par le service client d'une boutique en ligne de cosmétiques.

Règle de départage la plus importante : la frontière entre "question_generale" et "donnees_client" ne dépend pas du sujet abordé, mais de ce qu'il faut consulter pour répondre.
- "Combien de temps prend la livraison en Belgique ?" est une question générale, la réponse est dans la documentation.
- "Ma commande #18473 est bloquée depuis 5 jours" est une demande de données client, il faut ouvrir le dossier.
Un même thème, la livraison, tombe donc dans deux catégories différentes selon le cas.

En cas d'hésitation entre "question_generale" et "donnees_client", choisis "donnees_client". Le coût d'une escalade inutile est une minute de lecture humaine. Le coût inverse est une réponse inventée envoyée à un client.

{categories}`,
        },
    };

    @node({
        id: 'b7c1e001-0011-4011-9011-a1b2c3d40011',
        name: 'Modèle de classification',
        type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
        version: 1.2,
        position: [180, 900],
        credentials: { openAiApi: { id: 'OPENAI_CREDENTIAL_ID', name: 'OpenAI' } },
    })
    ModeleDeClassification = {
        model: {
            __rl: true,
            mode: 'list',
            value: 'gpt-4o-mini',
        },
        options: {
            temperature: 0,
        },
    };

    @node({
        id: 'b7c1e001-0012-4012-9012-a1b2c3d40012',
        name: 'Rédiger la réponse',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 2,
        position: [520, 480],
    })
    RedigerLaReponse = {
        promptType: 'define',
        text: `=Un client de la boutique vient d'écrire au service client. Rédige le brouillon de réponse.

De : {{ $json.expediteur }}
Objet : {{ $json.sujet }}

Message reçu :
{{ $json.corps }}`,
        options: {
            systemMessage: `Tu es l'assistant du service client de Maison Kaolia, une petite boutique en ligne de soins capillaires naturels. Tu rédiges des brouillons de réponse que Chloé, la responsable relation client, relit et envoie elle-même.

RÈGLE ABSOLUE SUR LES INFORMATIONS
- Avant toute réponse portant sur un produit, un prix, une composition, un délai, des frais, une condition de retour ou une modalité, tu DOIS consulter l'outil "Base_connaissance_boutique".
- Tu ne donnes JAMAIS un prix, un délai, une contenance ou une condition que tu n'as pas lu dans la base. Si l'information n'y figure pas, écris que tu vérifies ce point et que tu reviens vers le client. Ne comble jamais un trou par une valeur plausible.
- Tu ne conclus JAMAIS une absence de façon catégorique. Qu'un produit ne figure pas dans la base ne prouve pas que la boutique ne le vend pas : la base peut être incomplète ou en retard sur le catalogue. Si un client demande un produit, une matière, un format ou un service que tu n'y trouves pas, tu attribues explicitement ton constat à la documentation, jamais à la boutique. Tu écris "je ne le vois pas dans notre catalogue, je vérifie et je reviens vers vous", et non "nous n'en avons pas".
- Tu n'annonces JAMAIS une nouveauté, un projet, une intention, un lancement ou une évolution à venir qui n'est pas écrit noir sur blanc dans la base. "C'est une option que nous envisageons" est une phrase interdite si la base ne la contient pas.
- Tu n'as accès à AUCUNE donnée client : ni commande, ni compte, ni stock, ni suivi de colis, ni historique. Tu ne prétends jamais avoir consulté un dossier, vérifié une commande ou contacté un transporteur.
- Tu ne promets aucun geste commercial, aucun remboursement, aucun avoir, aucune date d'expédition ferme. Ces décisions appartiennent à l'équipe.

CE QUE TU ÉCRIS
- Uniquement le corps de l'email, en français. Pas de ligne "Objet :", pas de titre, pas de balises.
- Tu commences par saluer le client par son prénom quand il est identifiable, sinon par "Bonjour".
- 100 à 180 mots. Phrases courtes, ton chaleureux et concret, aucun jargon.
- Tu réponds d'abord à la question posée, puis tu ajoutes au maximum une information utile complémentaire, si elle est réellement pertinente.
- Tu termines par "Belle journée," puis un retour à la ligne et "Chloé, Maison Kaolia".

INTERDICTIONS DE FORME
- Ne mentionne jamais que ce message a été rédigé par une IA, ni qu'il est automatique.
- N'invente aucun lien, aucun code promotionnel, aucune adresse.
- Ne demande pas au client des informations que tu ne saurais pas traiter.`,
        },
    };

    @node({
        id: 'b7c1e001-0013-4013-9013-a1b2c3d40013',
        name: 'Modèle de rédaction',
        type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
        version: 1.2,
        position: [440, 700],
        credentials: { openAiApi: { id: 'OPENAI_CREDENTIAL_ID', name: 'OpenAI' } },
    })
    ModeleDeRedaction = {
        model: {
            __rl: true,
            mode: 'list',
            value: 'gpt-4o',
        },
        options: {},
    };

    @node({
        id: 'b7c1e001-0014-4014-9014-a1b2c3d40014',
        name: 'Embeddings (recherche)',
        type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
        version: 1.2,
        position: [660, 880],
        credentials: { openAiApi: { id: 'OPENAI_CREDENTIAL_ID', name: 'OpenAI' } },
    })
    EmbeddingsRecherche = {
        options: {},
    };

    @node({
        id: 'b7c1e001-0015-4015-9015-a1b2c3d40015',
        name: 'Base_connaissance_boutique',
        type: '@n8n/n8n-nodes-langchain.vectorStoreInMemory',
        version: 1.2,
        position: [660, 700],
    })
    BaseConnaissanceBoutique = {
        mode: 'retrieve-as-tool',
        toolName: 'Base_connaissance_boutique',
        toolDescription:
            "Documentation de la boutique Maison Kaolia : catalogue et prix, compositions et allergènes, conseils d'utilisation, délais et frais de livraison, conditions de retour et de remboursement, paiement, fidélité, horaires. À consulter avant toute réponse contenant une information factuelle sur la boutique.",
        memoryKey: {
            __rl: true,
            value: 'boutique_db',
            mode: 'list',
            cachedResultName: 'boutique_db',
        },
    };

    @node({
        id: 'b7c1e001-0016-4016-9016-a1b2c3d40016',
        webhookId: 'WEBHOOK_ID',
        name: 'Créer le brouillon',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [880, 480],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    CreerLeBrouillon = {
        resource: 'draft',
        subject: "=Re: {{ $('Normaliser le message').item.json.sujet }}",
        emailType: 'text',
        message: '={{ $json.output }}',
        options: {
            threadId: "={{ $('Normaliser le message').item.json.thread_id }}",
            sendTo: "={{ $('Normaliser le message').item.json.expediteur_email }}",
        },
    };

    @node({
        id: 'b7c1e001-0017-4017-9017-a1b2c3d40017',
        webhookId: 'WEBHOOK_ID',
        name: 'Marquer à valider',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [1100, 480],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    MarquerAValider = {
        operation: 'addLabels',
        messageId: "={{ $('Normaliser le message').item.json.message_id }}",
        labelIds: ['GMAIL_LABEL_A_VALIDER'],
    };

    @node({
        id: 'b7c1e001-0018-4018-9018-a1b2c3d40018',
        webhookId: 'WEBHOOK_ID',
        name: 'Marquer escalade',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [520, 700],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    MarquerEscalade = {
        operation: 'addLabels',
        messageId: "={{ $('Normaliser le message').item.json.message_id }}",
        labelIds: ['GMAIL_LABEL_ESCALADE'],
    };

    @node({
        id: 'b7c1e001-0019-4019-9019-a1b2c3d40019',
        webhookId: 'WEBHOOK_ID',
        name: 'Marquer hors périmètre',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [520, 880],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    MarquerHorsPerimetre = {
        operation: 'addLabels',
        messageId: "={{ $('Normaliser le message').item.json.message_id }}",
        labelIds: ['GMAIL_LABEL_HORS_PERIMETRE'],
    };

    @node({
        id: 'b7c1e001-0020-4020-9020-a1b2c3d40020',
        webhookId: 'WEBHOOK_ID',
        name: 'Marquer à trier',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [520, 1060],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    MarquerATrier = {
        operation: 'addLabels',
        messageId: "={{ $('Normaliser le message').item.json.message_id }}",
        labelIds: ['GMAIL_LABEL_A_TRIER'],
    };

    @node({
        id: 'b7c1e001-0022-4022-9022-a1b2c3d40022',
        webhookId: 'WEBHOOK_ID',
        name: 'Marquer comme traité',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [1320, 700],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
    })
    MarquerCommeTraite = {
        operation: 'addLabels',
        messageId: '={{ $json.id }}',
        labelIds: ['GMAIL_LABEL_TRAITE'],
    };

    @node({
        id: 'b7c1e001-0021-4021-9021-a1b2c3d40021',
        name: 'Sticky Indexation',
        type: 'n8n-nodes-base.stickyNote',
        version: 1,
        position: [-320, -220],
    })
    StickyIndexation = {
        content: `## Indexation de la base de connaissance

Le vector store est en mémoire : il se vide à chaque redémarrage de n8n.
Lancer "Indexer à la demande" après un redémarrage, sinon l'agent répond
sans documentation et se rabat sur "je vérifie et je reviens vers vous".

Le déclencheur Drive réindexe automatiquement quand la boutique modifie
son document.`,
        color: 4,
        height: 260,
        width: 420,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.IndexerALaDemande.out(0).to(this.TelechargerLaBase.in(0));
        this.BaseDeConnaissanceModifiee.out(0).to(this.TelechargerLaBase.in(0));
        this.TelechargerLaBase.out(0).to(this.IndexerLaBase.in(0));
        this.NouvelEmailClient.out(0).to(this.NormaliserLeMessage.in(0));
        this.NormaliserLeMessage.out(0).to(this.ClasserLaDemande.in(0));
        this.ClasserLaDemande.out(0).to(this.RedigerLaReponse.in(0));
        this.ClasserLaDemande.out(1).to(this.MarquerEscalade.in(0));
        this.ClasserLaDemande.out(2).to(this.MarquerHorsPerimetre.in(0));
        this.ClasserLaDemande.out(3).to(this.MarquerATrier.in(0));
        this.RedigerLaReponse.out(0).to(this.CreerLeBrouillon.in(0));
        this.CreerLeBrouillon.out(0).to(this.MarquerAValider.in(0));
        this.MarquerAValider.out(0).to(this.MarquerCommeTraite.in(0));
        this.MarquerEscalade.out(0).to(this.MarquerCommeTraite.in(0));
        this.MarquerHorsPerimetre.out(0).to(this.MarquerCommeTraite.in(0));
        this.MarquerATrier.out(0).to(this.MarquerCommeTraite.in(0));

        this.ChargeurDeDocument.uses({
            ai_textSplitter: this.DecoupageEnChunks.output,
        });
        this.IndexerLaBase.uses({
            ai_embedding: this.EmbeddingsIndexation.output,
            ai_document: [this.ChargeurDeDocument.output],
        });
        this.ClasserLaDemande.uses({
            ai_languageModel: this.ModeleDeClassification.output,
        });
        this.RedigerLaReponse.uses({
            ai_languageModel: this.ModeleDeRedaction.output,
            ai_tool: [this.BaseConnaissanceBoutique.output],
        });
        this.BaseConnaissanceBoutique.uses({
            ai_embedding: this.EmbeddingsRecherche.output,
        });
    }
}
