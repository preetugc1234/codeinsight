import * as vscode from 'vscode';
import * as keytar from 'keytar';
import { ApiService } from './apiService';
import { ResultsPanel } from './resultsPanel';
import { CodeInsightActionProvider } from './codeActionProvider';

const SERVICE_NAME = 'code-insight';
const ACCOUNT_NAME = 'api-key';

let apiService: ApiService;
let diagnosticCollection: vscode.DiagnosticCollection;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Code Insight extension is now active!');

    // Initialize services
    apiService = new ApiService();
    diagnosticCollection = vscode.languages.createDiagnosticCollection('codeInsight');
    context.subscriptions.push(diagnosticCollection);

    // Load API key from secure storage
    await loadApiKey();

    // Register CodeAction provider for quick fixes
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file' },
            new CodeInsightActionProvider(),
            {
                providedCodeActionKinds: CodeInsightActionProvider.providedCodeActionKinds
            }
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('codeInsight.reviewFile', reviewCurrentFile),
        vscode.commands.registerCommand('codeInsight.reviewSelection', reviewSelection),
        vscode.commands.registerCommand('codeInsight.debugError', debugError),
        vscode.commands.registerCommand('codeInsight.setApiKey', setApiKey),
        vscode.commands.registerCommand('codeInsight.clearCache', clearCache),
        vscode.commands.registerCommand('codeInsight.showDashboard', showDashboard)
    );

    // Auto-review on save (if enabled)
    const config = vscode.workspace.getConfiguration('codeInsight');
    if (config.get('autoReview')) {
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (document) => {
                if (isSupportedLanguage(document.languageId)) {
                    await reviewDocument(document);
                }
            })
        );
    }

    // Show welcome message if no API key
    if (!apiService.getApiKey()) {
        const action = await vscode.window.showInformationMessage(
            'Welcome to Code Insight! Set your API key to get started.',
            'Set API Key',
            'Get API Key'
        );

        if (action === 'Set API Key') {
            await setApiKey();
        } else if (action === 'Get API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://codeinsight.com/dashboard'));
        }
    }
}

async function loadApiKey() {
    try {
        const apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (apiKey) {
            apiService.setApiKey(apiKey);
            console.log('API key loaded from secure storage');
        }
    } catch (error) {
        console.error('Failed to load API key:', error);
    }
}

async function setApiKey() {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Code Insight API key',
        password: true,
        placeHolder: 'sk_...',
        validateInput: (value) => {
            if (!value || value.length < 10) {
                return 'Please enter a valid API key';
            }
            return null;
        }
    });

    if (apiKey) {
        try {
            // Save to secure storage
            await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
            apiService.setApiKey(apiKey);

            // Validate the API key
            const isValid = await apiService.validateApiKey();
            if (isValid) {
                vscode.window.showInformationMessage('✓ API key saved successfully!');
            } else {
                vscode.window.showErrorMessage('⚠️ API key is invalid. Please check and try again.');
                await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to save API key: ${error.message}`);
        }
    }
}

async function reviewCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    await reviewDocument(editor.document);
}

async function reviewSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('No code selected');
        return;
    }

    const selection = editor.document.getText(editor.selection);
    await reviewCode(editor.document, selection);
}

async function reviewDocument(document: vscode.TextDocument) {
    if (!isSupportedLanguage(document.languageId)) {
        vscode.window.showWarningMessage(`Language "${document.languageId}" is not supported yet`);
        return;
    }

    const content = document.getText();
    await reviewCode(document, content);
}

async function reviewCode(document: vscode.TextDocument, content: string) {
    if (!apiService.getApiKey()) {
        const action = await vscode.window.showErrorMessage(
            'API key not set. Please set your API key first.',
            'Set API Key'
        );
        if (action === 'Set API Key') {
            await setApiKey();
        }
        return;
    }

    const fileName = document.fileName.split(/[\\/]/).pop() || 'untitled';

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Code Insight: Reviewing ${fileName}...`,
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ message: 'Sending code for review...' });

            // Submit review request
            const response = await apiService.reviewCode({
                file_path: fileName,
                file_content: content,
                language: document.languageId,
                cursor_context: getCursorContext(document)
            });

            progress.report({ message: `Job ${response.job_id} - Waiting for results...` });

            // Poll for results
            const result = await apiService.pollJobUntilComplete(response.job_id, (status) => {
                progress.report({ message: `Status: ${status}...` });
            });

            // Display results
            if (result.results?.content) {
                const cached = result.results.cached ? ' (from cache ⚡)' : '';
                vscode.window.showInformationMessage(`✓ Review complete${cached}!`);

                // Show results in webview panel
                ResultsPanel.createOrShow(
                    vscode.Uri.file(__dirname),
                    result.results.content,
                    fileName
                );

                // Parse and show diagnostics
                parseDiagnostics(document, result.results.content);
            } else {
                vscode.window.showWarningMessage('No results returned from API');
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Code Insight Error: ${error.message}`);
            console.error('Review error:', error);
        }
    });
}

async function debugError() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    // Ask user for error log
    const errorLog = await vscode.window.showInputBox({
        prompt: 'Paste the error message or stack trace',
        placeHolder: 'TypeError: Cannot read property...'
    });

    if (!errorLog) {
        return;
    }

    const document = editor.document;
    const fileName = document.fileName.split(/[\\/]/).pop() || 'untitled';

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Debug Doctor: Analyzing error...`,
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ message: 'Sending for debug analysis...' });

            // Submit debug request
            const response = await apiService.debugCode({
                file_path: fileName,
                file_content: document.getText(),
                error_log: errorLog,
                language: document.languageId
            });

            progress.report({ message: `Job ${response.job_id} - Analyzing...` });

            // Poll for results
            const result = await apiService.pollJobUntilComplete(response.job_id, (status) => {
                progress.report({ message: `Status: ${status}...` });
            });

            // Display results
            if (result.results?.content) {
                vscode.window.showInformationMessage('✓ Debug analysis complete!');

                // Show results in webview panel
                ResultsPanel.createOrShow(
                    vscode.Uri.file(__dirname),
                    result.results.content,
                    `Debug: ${fileName}`
                );
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Debug Doctor Error: ${error.message}`);
        }
    });
}

function parseDiagnostics(document: vscode.TextDocument, content: string) {
    const diagnostics: vscode.Diagnostic[] = [];

    // Parse markdown content for issues
    const lines = content.split('\n');
    const issueRegex = /line\s+(\d+).*?:\s*(.+)/i;

    for (const line of lines) {
        const match = line.match(issueRegex);
        if (match) {
            const lineNumber = parseInt(match[1]) - 1;
            const message = match[2].trim();

            if (lineNumber >= 0 && lineNumber < document.lineCount) {
                const range = document.lineAt(lineNumber).range;
                const severity = line.toLowerCase().includes('error')
                    ? vscode.DiagnosticSeverity.Error
                    : line.toLowerCase().includes('warning')
                    ? vscode.DiagnosticSeverity.Warning
                    : vscode.DiagnosticSeverity.Information;

                const diagnostic = new vscode.Diagnostic(range, message, severity);
                diagnostic.source = 'Code Insight';
                diagnostics.push(diagnostic);
            }
        }
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

function getCursorContext(document: vscode.TextDocument): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return '';
    }

    const position = editor.selection.active;
    const startLine = Math.max(0, position.line - 10);
    const endLine = Math.min(document.lineCount - 1, position.line + 10);

    const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    return document.getText(range);
}

function isSupportedLanguage(languageId: string): boolean {
    const supported = [
        'javascript', 'typescript', 'python', 'java', 'go',
        'rust', 'cpp', 'c', 'csharp', 'php', 'ruby', 'swift',
        'kotlin', 'scala', 'html', 'css', 'json', 'yaml', 'sql'
    ];
    return supported.includes(languageId);
}

async function clearCache() {
    diagnosticCollection.clear();
    vscode.window.showInformationMessage('✓ Cache cleared!');
}

async function showDashboard() {
    vscode.env.openExternal(vscode.Uri.parse('https://codeinsight.com/dashboard'));
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
