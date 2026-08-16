import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Email Copilot - Setup labels Gmail
// Nodes   : 3  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WebhookSetupLabels                 webhook
// ListerLesLabelsACreer              code
// CreerLeLabel                       gmail                      [onError→regular] [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WebhookSetupLabels
//    → ListerLesLabelsACreer
//      → CreerLeLabel
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'SETUP_WORKFLOW_ID',
    name: 'Email Copilot - Setup labels Gmail',
    active: false,
    settings: { executionOrder: 'v1', availableInMCP: false },
})
export class EmailCopilotSetupLabelsGmailWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a1b2c3d4-1111-4a11-9001-0e1f2a3b4c50',
        webhookId: 'WEBHOOK_ID',
        name: 'Webhook - Setup labels',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [0, 0],
    })
    WebhookSetupLabels = {
        httpMethod: 'POST',
        path: 'setup-labels-copilot',
        responseMode: 'lastNode',
        responseData: 'allEntries',
        options: {},
    };

    @node({
        id: 'a1b2c3d4-2222-4a22-9002-0e1f2a3b4c52',
        name: 'Lister les labels à créer',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [220, 0],
    })
    ListerLesLabelsACreer = {
        jsCode: `// Les 4 issues possibles du tri, une par sortie du classifieur.
// Le préfixe "Copilot/" les regroupe dans une arborescence Gmail.
return [
  { json: { name: 'Copilot/A valider' } },
  { json: { name: 'Copilot/Escalade' } },
  { json: { name: 'Copilot/Hors perimetre' } },
  { json: { name: 'Copilot/A trier' } },
  // Marqueur de traitement. Nommé sans espace ni barre oblique parce qu'il
  // est utilisé dans la requête du déclencheur (-label:copilot-traite), où
  // Gmail normalise les séparateurs de façon peu prévisible.
  { json: { name: 'Copilot-Traite' } },
];`,
    };

    @node({
        id: 'a1b2c3d4-3333-4a33-9003-0e1f2a3b4c53',
        webhookId: 'WEBHOOK_ID',
        name: 'Créer le label',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [440, 0],
        credentials: { gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Gmail' } },
        onError: 'continueRegularOutput',
    })
    CreerLeLabel = {
        resource: 'label',
        operation: 'create',
        name: '={{ $json.name }}',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WebhookSetupLabels.out(0).to(this.ListerLesLabelsACreer.in(0));
        this.ListerLesLabelsACreer.out(0).to(this.CreerLeLabel.in(0));
    }
}
