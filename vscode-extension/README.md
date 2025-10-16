# Code Insight - AI Code Review Extension

Real-time AI-powered code review with Claude Sonnet 4.5. Get instant suggestions, fix bugs, and improve code quality directly in VS Code.

## Features

- **🔍 Real-time Code Review**: Analyze your code with AI and get instant feedback
- **🐛 Debug Doctor**: Automatically diagnose and fix bugs with error analysis
- **⚡ Smart Caching**: 30-50% faster with intelligent prompt caching
- **🔒 Secure**: API keys stored in OS keychain
- **📊 Rich Diff UI**: Beautiful code diff visualization with red (removed) and green (added) lines
- **💡 Inline Suggestions**: See issues directly in your code with squiggly lines
- **🚀 Fast**: Optimized prompts with 40-60% token reduction

## Getting Started

1. **Install the Extension**
   - Search for "Code Insight" in VS Code Extensions
   - Click Install

2. **Set Your API Key**
   - Run command: `Code Insight: Set API Key`
   - Get your API key from [codeinsight.com/dashboard](https://codeinsight.com/dashboard)

3. **Review Your Code**
   - Open any file
   - Right-click → `Code Insight: Review Current File`
   - Or use the command palette (Ctrl+Shift+P / Cmd+Shift+P)

## Commands

| Command | Description |
|---------|-------------|
| `Code Insight: Review Current File` | Review the entire active file |
| `Code Insight: Review Selection` | Review only selected code |
| `Code Insight: Debug Doctor` | Analyze and fix errors |
| `Code Insight: Set API Key` | Configure your API key |
| `Code Insight: Open Dashboard` | View usage stats and billing |

## Supported Languages

JavaScript, TypeScript, Python, Java, Go, Rust, C++, C, C#, PHP, Ruby, Swift, Kotlin, Scala, HTML, CSS, JSON, YAML, SQL

## Configuration

```json
{
  "codeInsight.apiEndpoint": "https://api.codeinsight.com",
  "codeInsight.autoReview": false,
  "codeInsight.showInlineSuggestions": true,
  "codeInsight.enableCache": true
}
```

## Pricing

- **Trial**: Free (25K tokens)
- **Lite**: $12/mo (200K tokens, annual pricing)
- **Pro**: $24/mo (500K tokens, annual pricing)
- **Business**: $160/mo (4M tokens, annual pricing)

*20% discount on annual plans!*

## Privacy & Security

- API keys stored securely in OS keychain (keytar)
- Code sent only when you explicitly trigger review
- Optional local-only mode (coming soon)
- GDPR & SOC2 compliant

## Support

- **Website**: [codeinsight.com](https://codeinsight.com)
- **Issues**: [GitHub Issues](https://github.com/preetugc1234/codeinsight/issues)
- **Email**: support@codeinsight.com

## License

MIT License - See LICENSE file for details

---

**Made with ❤️ by Code Insight Team**

*Powered by Claude Sonnet 4.5*
