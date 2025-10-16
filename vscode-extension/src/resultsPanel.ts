import * as vscode from 'vscode';

export class ResultsPanel {
    public static currentPanel: ResultsPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri, content: string, fileName: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (ResultsPanel.currentPanel) {
            ResultsPanel.currentPanel._panel.reveal(column);
            ResultsPanel.currentPanel.update(content, fileName);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'codeInsightResults',
            'Code Insight Results',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        ResultsPanel.currentPanel = new ResultsPanel(panel, extensionUri);
        ResultsPanel.currentPanel.update(content, fileName);
    }

    public update(content: string, fileName: string) {
        this._panel.title = `Code Insight: ${fileName}`;
        this._panel.webview.html = this._getHtmlForWebview(content, fileName);
    }

    public dispose() {
        ResultsPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview('Loading...', 'Results');
    }

    private _getHtmlForWebview(content: string, fileName: string) {
        // Parse markdown-style content and create rich diff UI
        const sections = this._parseContent(content);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Insight Results</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }

        h1, h2, h3, h4, h5, h6 {
            color: var(--vscode-foreground);
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 16px;
        }

        h1 { font-size: 2em; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
        h2 { font-size: 1.75em; }
        h3 { font-size: 1.5em; font-weight: bold; }
        h4 { font-size: 1.25em; }
        h5 { font-size: 1.1em; }
        h6 { font-size: 1em; font-weight: normal; opacity: 0.9; }

        .file-header {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid var(--vscode-activityBarBadge-background);
        }

        .section {
            margin-bottom: 32px;
        }

        .code-block {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            overflow-x: auto;
            position: relative;
        }

        .code-block pre {
            margin: 0;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }

        .code-line {
            display: flex;
            padding: 2px 0;
            min-height: 20px;
        }

        .line-number {
            user-select: none;
            padding-right: 16px;
            color: var(--vscode-editorLineNumber-foreground);
            text-align: right;
            min-width: 40px;
        }

        .line-content {
            flex: 1;
            white-space: pre;
            font-family: var(--vscode-editor-font-family);
        }

        /* Diff styling like Claude/GitHub */
        .line-removed {
            background-color: rgba(255, 0, 0, 0.15);
            border-left: 3px solid #f85149;
            padding-left: 8px;
        }

        .line-removed .line-content {
            color: #ff6b6b;
            text-decoration: line-through;
        }

        .line-added {
            background-color: rgba(0, 255, 0, 0.15);
            border-left: 3px solid #3fb950;
            padding-left: 8px;
        }

        .line-added .line-content {
            color: #56d364;
        }

        .line-unchanged {
            opacity: 0.7;
        }

        .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            padding: 4px 12px;
            cursor: pointer;
            font-size: 12px;
        }

        .copy-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        ul, ol {
            margin: 12px 0;
            padding-left: 24px;
        }

        li {
            margin: 6px 0;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
        }

        .badge-success {
            background-color: rgba(56, 211, 159, 0.2);
            color: #38d39f;
        }

        .badge-warning {
            background-color: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }

        .badge-error {
            background-color: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }

        .badge-info {
            background-color: rgba(33, 150, 243, 0.2);
            color: #2196f3;
        }

        blockquote {
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            background-color: var(--vscode-textBlockQuote-background);
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 4px;
        }

        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
        }

        .emoji {
            font-size: 1.2em;
            margin-right: 4px;
        }

        .metadata {
            display: flex;
            gap: 16px;
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 8px;
        }

        .metadata-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
    </style>
</head>
<body>
    <div class="file-header">
        <h2 style="margin: 0;">📄 ${this._escapeHtml(fileName)}</h2>
        <div class="metadata">
            <div class="metadata-item">
                <span>⏱️</span>
                <span>${new Date().toLocaleString()}</span>
            </div>
            <div class="metadata-item">
                <span>🤖</span>
                <span>Claude Sonnet 4.5</span>
            </div>
        </div>
    </div>

    ${sections}

    <script>
        const vscode = acquireVsCodeApi();

        // Copy code button functionality
        document.querySelectorAll('.copy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const codeBlock = e.target.closest('.code-block');
                const code = codeBlock.querySelector('pre').textContent;
                navigator.clipboard.writeText(code);
                e.target.textContent = '✓ Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 2000);
            });
        });
    </script>
</body>
</html>`;
    }

    private _parseContent(content: string): string {
        // Parse markdown content and convert to HTML with diff styling
        let html = '';
        const lines = content.split('\n');
        let inCodeBlock = false;
        let codeBlockContent: string[] = [];
        let codeBlockLanguage = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block detection
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeBlockLanguage = line.substring(3).trim();
                    codeBlockContent = [];
                } else {
                    // End of code block - render it with diff styling
                    html += this._renderCodeBlock(codeBlockContent, codeBlockLanguage);
                    inCodeBlock = false;
                    codeBlockContent = [];
                    codeBlockLanguage = '';
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent.push(line);
                continue;
            }

            // Headers
            if (line.startsWith('# ')) {
                html += `<h1>${this._escapeHtml(line.substring(2))}</h1>`;
            } else if (line.startsWith('## ')) {
                html += `<h2>${this._escapeHtml(line.substring(3))}</h2>`;
            } else if (line.startsWith('### ')) {
                html += `<h3>${this._escapeHtml(line.substring(4))}</h3>`;
            } else if (line.startsWith('#### ')) {
                html += `<h4>${this._escapeHtml(line.substring(5))}</h4>`;
            } else if (line.startsWith('##### ')) {
                html += `<h5>${this._escapeHtml(line.substring(6))}</h5>`;
            } else if (line.startsWith('###### ')) {
                html += `<h6>${this._escapeHtml(line.substring(7))}</h6>`;
            }
            // Lists
            else if (line.match(/^[-*+]\s/)) {
                html += `<ul><li>${this._escapeHtml(line.substring(2))}</li></ul>`;
            }
            // Blockquote
            else if (line.startsWith('> ')) {
                html += `<blockquote>${this._escapeHtml(line.substring(2))}</blockquote>`;
            }
            // Regular paragraph
            else if (line.trim()) {
                html += `<p>${this._escapeHtml(line)}</p>`;
            }
        }

        return html;
    }

    private _renderCodeBlock(lines: string[], language: string): string {
        let html = `<div class="code-block">`;
        html += `<button class="copy-button">Copy</button>`;
        html += `<pre><code>`;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let lineClass = 'line-unchanged';
            let prefix = '';

            // Detect diff markers
            if (line.startsWith('- ') || line.startsWith('-\t')) {
                lineClass = 'line-removed';
                prefix = '-';
            } else if (line.startsWith('+ ') || line.startsWith('+\t')) {
                lineClass = 'line-added';
                prefix = '+';
            }

            const lineContent = prefix ? line.substring(prefix.length + 1) : line;

            html += `<div class="code-line ${lineClass}">`;
            html += `<span class="line-number">${i + 1}</span>`;
            html += `<span class="line-content">${this._escapeHtml(lineContent)}</span>`;
            html += `</div>`;
        }

        html += `</code></pre>`;
        html += `</div>`;

        return html;
    }

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
