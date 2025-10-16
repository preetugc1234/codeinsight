import * as vscode from 'vscode';

export class CodeInsightActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const codeActions: vscode.CodeAction[] = [];

        // Check if there are Code Insight diagnostics in this range
        const codeInsightDiagnostics = context.diagnostics.filter(
            diagnostic => diagnostic.source === 'Code Insight'
        );

        if (codeInsightDiagnostics.length === 0) {
            return codeActions;
        }

        // Add quick fix actions for each diagnostic
        for (const diagnostic of codeInsightDiagnostics) {
            // Extract suggested fix from diagnostic message if available
            const fix = this.extractFixFromMessage(diagnostic.message);

            if (fix) {
                const action = new vscode.CodeAction(
                    `Fix: ${this.shortenMessage(diagnostic.message)}`,
                    vscode.CodeActionKind.QuickFix
                );
                action.diagnostics = [diagnostic];
                action.edit = this.createFixEdit(document, diagnostic.range, fix);
                action.isPreferred = true;

                codeActions.push(action);
            }

            // Add "Show details" action
            const detailsAction = new vscode.CodeAction(
                '📖 Show Code Insight Details',
                vscode.CodeActionKind.QuickFix
            );
            detailsAction.command = {
                command: 'codeInsight.showDetails',
                title: 'Show Details',
                arguments: [diagnostic]
            };
            codeActions.push(detailsAction);

            // Add "Review entire file" action
            const reviewAction = new vscode.CodeAction(
                '🔍 Review Entire File',
                vscode.CodeActionKind.QuickFix
            );
            reviewAction.command = {
                command: 'codeInsight.reviewFile',
                title: 'Review File'
            };
            codeActions.push(reviewAction);
        }

        return codeActions;
    }

    private extractFixFromMessage(message: string): string | null {
        // Try to extract fix suggestion from message
        // Look for patterns like "Replace with:", "Use:", "Change to:"
        const patterns = [
            /replace with:?\s*[`']([^`']+)[`']/i,
            /use:?\s*[`']([^`']+)[`']/i,
            /change to:?\s*[`']([^`']+)[`']/i,
            /should be:?\s*[`']([^`']+)[`']/i
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    private createFixEdit(
        document: vscode.TextDocument,
        range: vscode.Range,
        fix: string
    ): vscode.WorkspaceEdit {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, fix);
        return edit;
    }

    private shortenMessage(message: string): string {
        // Shorten message for action title
        if (message.length > 50) {
            return message.substring(0, 47) + '...';
        }
        return message;
    }
}
