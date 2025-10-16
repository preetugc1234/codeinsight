# 📦 VS Code Extension Publishing Guide

## Complete step-by-step guide to publish Code Insight extension to the marketplace

---

## 🎯 Prerequisites

Before publishing, ensure you have:
- ✅ Extension packaged as `.vsix` file (you have `code-insight-1.0.0.vsix`)
- ✅ Azure DevOps account (for publisher credentials)
- ✅ Extension tested locally
- ✅ Backend deployed and working

---

## 📝 Step 1: Create Azure DevOps Account

### Why Azure DevOps?
VS Code Marketplace uses Azure DevOps for publisher authentication. You need to create:
1. An Azure DevOps organization
2. A Personal Access Token (PAT)
3. A publisher account

### Steps:

1. **Go to Azure DevOps**: https://dev.azure.com
2. **Sign in** with Microsoft account (or create new account)
3. **Create Organization**:
   - Click "New organization"
   - Name it something like `code-insight-publisher`
   - Click "Continue"

---

## 🔑 Step 2: Create Personal Access Token (PAT)

### Steps:

1. **Click your profile picture** (top right) → **Personal access tokens**
2. **Click "New Token"**
3. **Fill in the form**:
   - **Name**: `vscode-marketplace-token`
   - **Organization**: Select your organization
   - **Expiration**: Custom defined → 90 days (or longer)
   - **Scopes**: Click "Show all scopes"
     - ✅ Check **Marketplace** → **Manage**
4. **Click "Create"**
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)

**Example Token**: `abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx`

**⚠️ SAVE THIS TOKEN SECURELY!** You'll need it to publish.

---

## 🏢 Step 3: Create Publisher

### Option A: Create via Command Line (Recommended)

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Login with your PAT
npx vsce login code-insight

# When prompted, paste your PAT token
# Publisher ID: code-insight (or your preferred ID)
```

### Option B: Create via Marketplace Website

1. **Go to**: https://marketplace.visualstudio.com/manage
2. **Click "Create publisher"**
3. **Fill in form**:
   - **ID**: `code-insight` (must be unique, lowercase, no spaces)
   - **Name**: `Code Insight`
   - **Email**: Your email
4. **Click "Create"**

---

## 📋 Step 4: Prepare Extension Metadata

### Update `package.json` (if needed)

Make sure these fields are set correctly:

```json
{
  "name": "code-insight",
  "displayName": "Code Insight - AI Code Review & Debug",
  "description": "AI-powered code review and debugging with Claude Sonnet 4.5. Get instant feedback, fix bugs, and improve code quality.",
  "version": "1.0.0",
  "publisher": "code-insight",
  "icon": "resources/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/preetugc1234/codeinsight"
  },
  "keywords": [
    "ai",
    "code-review",
    "debug",
    "claude",
    "code-quality",
    "linter",
    "code-analysis"
  ]
}
```

### Create Icon (if not exists)

**Size**: 128x128 px PNG or SVG
**Location**: `vscode-extension/resources/icon.png`

You already have `icon.svg`, which works great!

---

## 🚀 Step 5: Publish Extension

### Method 1: Publish via Command Line (Recommended)

```bash
cd vscode-extension

# Login (one-time)
npx vsce login code-insight
# Paste your PAT when prompted

# Publish
npx vsce publish

# Output:
# ✔ Successfully published code-insight@1.0.0!
```

### Method 2: Publish via Marketplace Website

1. **Go to**: https://marketplace.visualstudio.com/manage/publishers/code-insight
2. **Click "New extension" → "Visual Studio Code"**
3. **Upload**: `code-insight-1.0.0.vsix`
4. **Click "Upload"**
5. **Wait for validation** (usually takes 5-10 minutes)

---

## ✅ Step 6: Verify Publication

### Check if Published:

1. **Go to**: https://marketplace.visualstudio.com/items?itemName=code-insight.code-insight
2. **Or search** in VS Code: `Ctrl+Shift+X` → Search "Code Insight"

### First-Time Publishing:
- **Validation**: 5-10 minutes
- **Indexing**: 15-30 minutes
- **Searchable**: 1-2 hours

---

## 🔄 Step 7: Publish Updates

### When you make changes:

```bash
cd vscode-extension

# Update version in package.json
# "version": "1.0.1"

# Or use npm version commands:
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Compile and publish
npm run compile
npx vsce publish

# Or specify version:
npx vsce publish patch  # Auto-increments patch version
npx vsce publish minor  # Auto-increments minor version
npx vsce publish major  # Auto-increments major version
```

### Users Auto-Update:
- VS Code checks for updates every few hours
- Users get notifications for updates
- No manual action needed!

---

## 🎨 Step 8: Customize Marketplace Page

### Update README.md

Your `README.md` becomes the marketplace description. Make it attractive:

```markdown
# Code Insight - AI Code Review & Debug

AI-powered code review and debugging with **Claude Sonnet 4.5**.

## ✨ Features

- 🔍 **Instant Code Review**: Get AI-powered feedback on your code
- 🐛 **Smart Debugging**: Fix runtime errors with AI assistance
- ⚡ **Real-time Analysis**: Fast, accurate code analysis
- 🎯 **Multi-language Support**: TypeScript, JavaScript, Python, Java, and more

## 📦 Installation

1. Install the extension from marketplace
2. Get API key from [codeinsight.com](https://codeinsight.com)
3. Press `Ctrl+Shift+P` → "Code Insight: Set API Key"
4. Start reviewing code!

## 🚀 Usage

### Review Code
1. Open any file
2. Press `Ctrl+Shift+P`
3. Select "Code Insight: Review Current File"

### Debug Code
1. Open file with error
2. Press `Ctrl+Shift+P`
3. Select "Code Insight: Debug Current File"

## 📸 Screenshots

![Code Review](screenshots/review.png)
![Debug View](screenshots/debug.png)

## 🔑 Get API Key

Visit [codeinsight.com](https://codeinsight.com) to:
- Sign up for free trial (25,000 tokens)
- Get your API key
- View usage dashboard

## 📝 License

MIT License - see [LICENSE](LICENSE.txt)
```

### Add Screenshots

Create folder: `vscode-extension/screenshots/`

Add images:
- `review.png` - Code review in action
- `debug.png` - Debug doctor results
- `settings.png` - API key setup

Reference them in README.md

---

## 📊 Step 9: Monitor Analytics

### View Extension Stats:

1. **Go to**: https://marketplace.visualstudio.com/manage/publishers/code-insight
2. **Click your extension**
3. **View stats**:
   - Total installs
   - Daily active users
   - Ratings & reviews
   - Update adoption

### Analytics Available:
- Install count (total and daily)
- Uninstall count
- Active users (DAU, WAU, MAU)
- Ratings distribution
- Review feedback

---

## 🐛 Step 10: Handle Issues

### User Reports Issues:

1. **GitHub Issues**: Users file issues at your repo
2. **Marketplace Reviews**: Users leave reviews
3. **Support Email**: Set up support email

### Quick Fix Process:

```bash
# 1. Fix the bug locally
git checkout -b fix/bug-name
# Make changes
git commit -m "Fix: bug description"
git push

# 2. Update version
cd vscode-extension
npm version patch

# 3. Publish update
npm run compile
npx vsce publish

# Users get auto-update within hours!
```

---

## 🎯 Publishing Checklist

Before publishing, verify:

- [ ] Extension works in Cursor/VS Code (press F5 to test)
- [ ] `package.json` has correct metadata
- [ ] `README.md` is well-written and helpful
- [ ] Icon is 128x128 and looks good
- [ ] LICENSE file exists
- [ ] Backend is deployed and working
- [ ] API key validation works
- [ ] No console errors or warnings
- [ ] All commands work correctly
- [ ] Azure DevOps account created
- [ ] Personal Access Token (PAT) created
- [ ] Publisher account created

---

## 🚀 Quick Publish Commands

### First Time:
```bash
# Install vsce
npm install -g @vscode/vsce

# Login
npx vsce login code-insight
# Paste PAT token

# Publish
cd vscode-extension
npx vsce publish
```

### Updates:
```bash
cd vscode-extension
npm version patch
npx vsce publish
```

---

## 🎉 You're Ready to Publish!

Your extension package is at:
**`vscode-extension/code-insight-1.0.0.vsix`**

Just follow the steps above and you'll be live on the marketplace! 🚀

### After Publishing:

1. **Share on social media**: Twitter, LinkedIn, Reddit
2. **Post on forums**: Dev.to, Hashnode, Medium
3. **Create demo video**: YouTube, TikTok
4. **Join communities**: VS Code subreddit, Discord servers
5. **Get feedback**: Iterate based on user reviews

**Good luck with your launch! 🎊**

---

## 📞 Support

If you get stuck:
- **VS Code Publishing Docs**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Azure DevOps**: https://dev.azure.com
- **Marketplace**: https://marketplace.visualstudio.com/manage

---

*Generated by Claude Code - Ready to Ship! 🚀*
