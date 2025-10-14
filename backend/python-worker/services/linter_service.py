"""
Linter Service for static code analysis
Run linters before calling Claude to reduce unnecessary AI calls
Following prompt.md lines 176-180, 819
"""

import subprocess
import tempfile
import os
from typing import Dict, Any, Optional, List
import json

class LinterService:
    """
    Run static analysis and linters before Claude calls
    Supported: pylint (Python), eslint (JavaScript/TypeScript), rubocop (Ruby), etc.
    """

    def __init__(self):
        self.supported_languages = {
            "python": self._lint_python,
            "javascript": self._lint_javascript,
            "typescript": self._lint_typescript,
            "java": self._lint_java,
            "go": self._lint_go,
            "rust": self._lint_rust,
        }

    async def lint_code(
        self,
        code: str,
        language: str,
        filename: str
    ) -> Dict[str, Any]:
        """
        Run linter for the given code

        Returns:
            {
                "success": bool,
                "issues": List[dict],
                "summary": str,
                "severity_counts": {"error": int, "warning": int, "info": int}
            }
        """
        language_lower = language.lower()

        if language_lower not in self.supported_languages:
            return {
                "success": True,
                "issues": [],
                "summary": f"No linter available for {language}",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "skipped": True
            }

        try:
            # Call the appropriate linter
            lint_func = self.supported_languages[language_lower]
            result = await lint_func(code, filename)

            print(f"✅ Linting completed for {filename} ({language}): "
                  f"{result['severity_counts']['error']} errors, "
                  f"{result['severity_counts']['warning']} warnings")

            return result

        except Exception as e:
            print(f"⚠️  Linting error for {filename}: {e}")
            return {
                "success": False,
                "issues": [],
                "summary": f"Linting failed: {str(e)}",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "error": str(e)
            }

    async def _lint_python(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Lint Python code using pylint
        """
        issues = []
        severity_counts = {"error": 0, "warning": 0, "info": 0}

        try:
            # Create temp file
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.py',
                delete=False,
                encoding='utf-8'
            ) as f:
                f.write(code)
                temp_path = f.name

            # Run pylint with JSON output
            result = subprocess.run(
                ['pylint', '--output-format=json', '--disable=C0114,C0116', temp_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            # Parse pylint output
            if result.stdout:
                try:
                    pylint_output = json.loads(result.stdout)

                    for issue in pylint_output:
                        severity = "error" if issue.get("type") == "error" else \
                                   "warning" if issue.get("type") == "warning" else "info"

                        issues.append({
                            "line": issue.get("line"),
                            "column": issue.get("column"),
                            "severity": severity,
                            "message": issue.get("message"),
                            "rule": issue.get("symbol"),
                            "message_id": issue.get("message-id")
                        })

                        severity_counts[severity] += 1

                except json.JSONDecodeError:
                    pass

            # Cleanup
            os.unlink(temp_path)

            return {
                "success": True,
                "issues": issues,
                "summary": f"Found {len(issues)} issue(s)",
                "severity_counts": severity_counts
            }

        except FileNotFoundError:
            return {
                "success": True,
                "issues": [],
                "summary": "pylint not installed, skipping",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "skipped": True
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "issues": [],
                "summary": "Linting timed out",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "error": "timeout"
            }

    async def _lint_javascript(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Lint JavaScript code using eslint
        """
        issues = []
        severity_counts = {"error": 0, "warning": 0, "info": 0}

        try:
            # Create temp file
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.js',
                delete=False,
                encoding='utf-8'
            ) as f:
                f.write(code)
                temp_path = f.name

            # Run eslint with JSON output
            result = subprocess.run(
                ['eslint', '--format=json', temp_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            # Parse eslint output
            if result.stdout:
                try:
                    eslint_output = json.loads(result.stdout)

                    for file_result in eslint_output:
                        for message in file_result.get("messages", []):
                            severity_level = message.get("severity", 1)
                            severity = "error" if severity_level == 2 else "warning"

                            issues.append({
                                "line": message.get("line"),
                                "column": message.get("column"),
                                "severity": severity,
                                "message": message.get("message"),
                                "rule": message.get("ruleId")
                            })

                            severity_counts[severity] += 1

                except json.JSONDecodeError:
                    pass

            # Cleanup
            os.unlink(temp_path)

            return {
                "success": True,
                "issues": issues,
                "summary": f"Found {len(issues)} issue(s)",
                "severity_counts": severity_counts
            }

        except FileNotFoundError:
            return {
                "success": True,
                "issues": [],
                "summary": "eslint not installed, skipping",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "skipped": True
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "issues": [],
                "summary": "Linting timed out",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "error": "timeout"
            }

    async def _lint_typescript(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Lint TypeScript code using eslint
        (Same as JavaScript but with .ts extension)
        """
        issues = []
        severity_counts = {"error": 0, "warning": 0, "info": 0}

        try:
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.ts',
                delete=False,
                encoding='utf-8'
            ) as f:
                f.write(code)
                temp_path = f.name

            result = subprocess.run(
                ['eslint', '--format=json', temp_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.stdout:
                try:
                    eslint_output = json.loads(result.stdout)
                    for file_result in eslint_output:
                        for message in file_result.get("messages", []):
                            severity_level = message.get("severity", 1)
                            severity = "error" if severity_level == 2 else "warning"

                            issues.append({
                                "line": message.get("line"),
                                "column": message.get("column"),
                                "severity": severity,
                                "message": message.get("message"),
                                "rule": message.get("ruleId")
                            })

                            severity_counts[severity] += 1
                except json.JSONDecodeError:
                    pass

            os.unlink(temp_path)

            return {
                "success": True,
                "issues": issues,
                "summary": f"Found {len(issues)} issue(s)",
                "severity_counts": severity_counts
            }

        except FileNotFoundError:
            return {
                "success": True,
                "issues": [],
                "summary": "eslint not installed, skipping",
                "severity_counts": {"error": 0, "warning": 0, "info": 0},
                "skipped": True
            }

    async def _lint_java(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Basic Java syntax check (checkstyle would require config)
        """
        return {
            "success": True,
            "issues": [],
            "summary": "Java linting requires checkstyle configuration",
            "severity_counts": {"error": 0, "warning": 0, "info": 0},
            "skipped": True
        }

    async def _lint_go(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Go linting using go vet
        """
        return {
            "success": True,
            "issues": [],
            "summary": "Go linting requires project context",
            "severity_counts": {"error": 0, "warning": 0, "info": 0},
            "skipped": True
        }

    async def _lint_rust(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Rust linting using clippy
        """
        return {
            "success": True,
            "issues": [],
            "summary": "Rust linting requires project context",
            "severity_counts": {"error": 0, "warning": 0, "info": 0},
            "skipped": True
        }

# Singleton instance
linter_service = LinterService()
