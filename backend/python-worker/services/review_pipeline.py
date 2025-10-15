"""
Code Review Processing Pipeline
Complete pipeline: Receive → Lint → Build Prompt → Call Claude → Validate → Store
Following prompt.md lines 176-190, 210-225, 393, 815-838
"""

import time
from typing import Dict, Any, Optional
from services.linter_service import linter_service
from services.claude_service import claude_service
from services.prompt_service import prompt_service
from services.cache_service import cache_service
from services.mongodb_service import mongodb_service
from services.websocket_service import websocket_manager
from services.token_budget_service import token_budget_service

class ReviewPipeline:
    """
    Complete code review pipeline
    Steps:
    1. Receive code from Java API via job queue
    2. Run linters (pylint, eslint, etc.)
    3. Build Claude prompt with system_brain
    4. Check cache
    5. Call Claude API
    6. Parse and validate response
    7. Store results in MongoDB
    8. Update job status
    """

    def __init__(self):
        self.pipeline_name = "CodeReviewPipeline_v1"

    async def process_review(self, job_data: Dict[str, Any]) -> bool:
        """
        Process a code review job

        Args:
            job_data: {
                "job_id": str,
                "user_id": str,
                "repo_id": str (optional),
                "file_path": str,
                "file_content": str,
                "language": str,
                "cursor_context": str (optional)
            }

        Returns:
            bool: True if processing succeeded, False otherwise
        """
        job_id = job_data.get("job_id")
        user_id = job_data.get("user_id")
        file_path = job_data.get("file_path", "untitled.py")
        file_content = job_data.get("file_content", "")
        language = job_data.get("language", "python")

        start_time = time.time()

        try:
            print(f"\n{'='*60}")
            print(f"🔍 Starting Review Pipeline for Job: {job_id}")
            print(f"   File: {file_path} ({language})")
            print(f"   User: {user_id}")
            print(f"{'='*60}\n")

            # Update job status to processing
            await mongodb_service.update_job_status(job_id, "processing")

            # Notify via WebSocket
            await websocket_manager.notify_job_update(
                job_id=job_id,
                user_id=user_id,
                status="processing",
                data={"message": "Starting code review..."}
            )

            # ==================== STEP 1: SECURITY CHECKS ====================
            print("🔒 Step 1: Running security checks...")
            security_result = prompt_service.check_security_filters(file_content)

            if not security_result["safe"]:
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error=f"Security check failed: {', '.join(security_result['issues'])}"
                )
                print(f"❌ Security check failed for job {job_id}")
                return False

            print("✅ Security checks passed")

            # ==================== STEP 2: RUN LINTERS ====================
            print(f"\n🔍 Step 2: Running linters for {language}...")
            lint_result = await linter_service.lint_code(file_content, language, file_path)

            lint_summary = f"Linter: {lint_result['severity_counts']['error']} errors, " \
                          f"{lint_result['severity_counts']['warning']} warnings"
            print(f"✅ {lint_summary}")

            # ==================== STEP 3: BUILD CLAUDE PROMPT ====================
            print("\n📝 Step 3: Building Claude prompt...")

            # Get system prompt for code_reviewer role
            system_prompt = prompt_service.get_system_prompt("code_reviewer")

            # Format user prompt with template
            user_prompt = prompt_service.format_prompt(
                "code_review",
                language=language,
                filename=file_path,
                code=file_content
            )

            # Add linter results to context if any issues found
            if lint_result["issues"]:
                lint_context = f"\n\nPRE-LINT ANALYSIS:\n"
                lint_context += f"Found {len(lint_result['issues'])} issues:\n"
                for issue in lint_result["issues"][:5]:  # Limit to top 5
                    lint_context += f"- Line {issue['line']}: [{issue['severity']}] {issue['message']}\n"

                user_prompt += lint_context

            # Count tokens
            prompt_tokens = prompt_service.count_tokens(system_prompt + user_prompt)
            print(f"✅ Prompt built: {prompt_tokens} tokens")

            # ==================== STEP 4: CHECK CACHE ====================
            print("\n💾 Step 4: Checking cache...")
            cache_key = cache_service.generate_cache_key(system_prompt, user_prompt)

            cached_result = await cache_service.get(cache_key)

            if cached_result:
                print("✅ Cache HIT! Using cached response")

                # Store cached result
                await mongodb_service.update_job_status(
                    job_id,
                    "completed",
                    results={
                        "content": cached_result.get("content"),
                        "lint_result": lint_result,
                        "cached": True
                    }
                )

                # Update tokens (from cache metadata)
                await mongodb_service.update_job_tokens(
                    job_id,
                    cached_result.get("tokens_used", {}),
                    cached_result.get("estimated_cost", 0.0),
                    cache_hit=True
                )

                elapsed = time.time() - start_time
                print(f"\n✅ Job {job_id} completed (cached) in {elapsed:.2f}s")
                return True

            print("❌ Cache MISS, calling Claude API...")

            # ==================== STEP 5: CALL CLAUDE API ====================
            print("\n🤖 Step 5: Calling Claude Sonnet 4.5...")

            claude_result = await claude_service.call_claude(
                system_prompt=system_prompt,
                user_message=user_prompt,
                max_tokens=2048,
                temperature=0.7
            )

            if not claude_result.get("success"):
                error_msg = claude_result.get("error", "Unknown error")
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error=f"Claude API error: {error_msg}"
                )
                print(f"❌ Claude API failed for job {job_id}: {error_msg}")
                return False

            print(f"✅ Claude responded: {claude_result.get('tokens_used', {}).get('total_tokens', 0)} tokens used")

            # ==================== STEP 6: VALIDATE OUTPUT ====================
            print("\n✔️  Step 6: Validating Claude output...")

            claude_content = claude_result.get("content", "")

            if not claude_content or len(claude_content) < 10:
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error="Claude returned empty or invalid response"
                )
                print(f"❌ Invalid Claude response for job {job_id}")
                return False

            print("✅ Output validation passed")

            # ==================== STEP 7: CACHE RESULT ====================
            print("\n💾 Step 7: Caching result...")
            cache_ttl = prompt_service.get_cache_ttl("code_review")
            await cache_service.set(cache_key, claude_result, cache_ttl)
            print(f"✅ Result cached (TTL: {cache_ttl}s)")

            # ==================== STEP 8: STORE IN MONGODB ====================
            print("\n💾 Step 8: Storing results in MongoDB...")

            # Calculate estimated cost (Claude Sonnet pricing)
            # Input: $0.003 per 1K tokens, Output: $0.015 per 1K tokens
            tokens_used = claude_result.get("tokens_used", {})
            input_tokens = tokens_used.get("prompt_tokens", 0)
            output_tokens = tokens_used.get("completion_tokens", 0)

            estimated_cost = (input_tokens / 1000 * 0.003) + (output_tokens / 1000 * 0.015)

            # Update job with results
            await mongodb_service.update_job_status(
                job_id,
                "completed",
                results={
                    "content": claude_content,
                    "lint_result": lint_result,
                    "model": claude_result.get("model"),
                    "elapsed_time": claude_result.get("elapsed_time"),
                    "cached": False
                }
            )

            # Update token usage
            await mongodb_service.update_job_tokens(
                job_id,
                tokens_used,
                estimated_cost,
                cache_hit=False
            )

            # Update user quota
            await mongodb_service.update_user_quota(
                user_id,
                tokens_used=tokens_used.get("total_tokens", 0),
                requests_used=1
            )

            print("✅ Results stored in MongoDB")

            # ==================== COMPLETE ====================
            elapsed = time.time() - start_time

            print(f"\n{'='*60}")
            print(f"✅ Review Pipeline COMPLETED for Job: {job_id}")
            print(f"   Total Time: {elapsed:.2f}s")
            print(f"   Tokens: {tokens_used.get('total_tokens', 0)}")
            print(f"   Cost: ${estimated_cost:.4f}")
            print(f"   Cached: No")
            print(f"{'='*60}\n")

            # Notify via WebSocket - Job completed
            await websocket_manager.notify_job_update(
                job_id=job_id,
                user_id=user_id,
                status="completed",
                data={
                    "message": "Code review completed!",
                    "tokens_used": tokens_used.get("total_tokens", 0),
                    "estimated_cost": estimated_cost,
                    "elapsed_time": elapsed
                }
            )

            return True

        except Exception as e:
            print(f"\n❌ Pipeline error for job {job_id}: {e}")

            # Update job status to failed
            try:
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error=str(e)
                )
            except:
                pass

            return False

    async def process_debug(self, job_data: Dict[str, Any]) -> bool:
        """
        Process a debug doctor job
        Following prompt.md lines 228-232:
        - Run static analysis (linters, type checkers)
        - Analyze error stack traces and trace to exact source lines
        - Generate fix suggestions with Claude
        - Return verification steps (no actual sandbox execution)
        """
        job_id = job_data.get("job_id")
        user_id = job_data.get("user_id")
        file_path = job_data.get("file_path", "untitled.py")
        file_content = job_data.get("file_content", "")
        error_log = job_data.get("error_log", "")
        language = job_data.get("language", "python")

        start_time = time.time()

        try:
            print(f"\n{'='*60}")
            print(f"🩺 Starting Debug Doctor Pipeline for Job: {job_id}")
            print(f"   File: {file_path} ({language})")
            print(f"   User: {user_id}")
            print(f"{'='*60}\n")

            # Update job status to processing
            await mongodb_service.update_job_status(job_id, "processing")

            # Notify via WebSocket
            await websocket_manager.notify_job_update(
                job_id=job_id,
                user_id=user_id,
                status="processing",
                data={"message": "Analyzing error and running diagnostics..."}
            )

            # ==================== STEP 1: PARSE STACK TRACE ====================
            print("🔍 Step 1: Parsing error stack trace...")

            stack_trace_analysis = self._parse_stack_trace(error_log, file_path)

            if stack_trace_analysis.get("error_lines"):
                print(f"✅ Found error at lines: {stack_trace_analysis['error_lines']}")
            else:
                print("⚠️  No specific line numbers found in stack trace")

            # ==================== STEP 2: RUN LINTERS ====================
            print(f"\n🔍 Step 2: Running static analysis for {language}...")
            lint_result = await linter_service.lint_code(file_content, language, file_path)

            lint_summary = f"Linter: {lint_result['severity_counts']['error']} errors, " \
                          f"{lint_result['severity_counts']['warning']} warnings"
            print(f"✅ {lint_summary}")

            # ==================== STEP 3: BUILD CLAUDE PROMPT ====================
            print("\n📝 Step 3: Building Debug Doctor prompt...")

            # Get system prompt for debug_doctor role
            system_prompt = prompt_service.get_system_prompt("debug_doctor")

            # Format user prompt with template
            user_prompt = prompt_service.format_prompt(
                "debug",
                filename=file_path,
                code=file_content,
                error_log=error_log
            )

            # Add stack trace analysis to context
            if stack_trace_analysis.get("error_lines"):
                user_prompt += f"\n\nSTACK TRACE ANALYSIS:\n"
                user_prompt += f"Error occurs at lines: {', '.join(map(str, stack_trace_analysis['error_lines']))}\n"
                user_prompt += f"Error type: {stack_trace_analysis.get('error_type', 'Unknown')}\n"

            # Add linter results to context if any issues found
            if lint_result["issues"]:
                lint_context = f"\n\nSTATIC ANALYSIS RESULTS:\n"
                lint_context += f"Found {len(lint_result['issues'])} issues:\n"
                for issue in lint_result["issues"][:5]:  # Limit to top 5
                    lint_context += f"- Line {issue['line']}: [{issue['severity']}] {issue['message']}\n"

                user_prompt += lint_context

            # Count tokens
            prompt_tokens = prompt_service.count_tokens(system_prompt + user_prompt)
            print(f"✅ Prompt built: {prompt_tokens} tokens")

            # ==================== STEP 4: CHECK CACHE ====================
            print("\n💾 Step 4: Checking cache...")
            cache_key = cache_service.generate_cache_key(system_prompt, user_prompt)

            cached_result = await cache_service.get(cache_key)

            if cached_result:
                print("✅ Cache HIT! Using cached response")

                # Store cached result
                await mongodb_service.update_job_status(
                    job_id,
                    "completed",
                    results={
                        "content": cached_result.get("content"),
                        "lint_result": lint_result,
                        "stack_trace_analysis": stack_trace_analysis,
                        "cached": True
                    }
                )

                # Update tokens (from cache metadata)
                await mongodb_service.update_job_tokens(
                    job_id,
                    cached_result.get("tokens_used", {}),
                    cached_result.get("estimated_cost", 0.0),
                    cache_hit=True
                )

                elapsed = time.time() - start_time
                print(f"\n✅ Job {job_id} completed (cached) in {elapsed:.2f}s")
                return True

            print("❌ Cache MISS, calling Claude API...")

            # ==================== STEP 5: CALL CLAUDE API ====================
            print("\n🤖 Step 5: Calling Claude Sonnet 4.5 for debug analysis...")

            claude_result = await claude_service.call_claude(
                system_prompt=system_prompt,
                user_message=user_prompt,
                max_tokens=2048,
                temperature=0.5  # Lower temperature for more deterministic debugging
            )

            if not claude_result.get("success"):
                error_msg = claude_result.get("error", "Unknown error")
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error=f"Claude API error: {error_msg}"
                )
                print(f"❌ Claude API failed for job {job_id}: {error_msg}")
                return False

            print(f"✅ Claude responded: {claude_result.get('tokens_used', {}).get('total_tokens', 0)} tokens used")

            # ==================== STEP 6: VALIDATE OUTPUT ====================
            print("\n✔️  Step 6: Validating Claude output...")

            claude_content = claude_result.get("content", "")

            if not claude_content or len(claude_content) < 10:
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error="Claude returned empty or invalid response"
                )
                print(f"❌ Invalid Claude response for job {job_id}")
                return False

            print("✅ Output validation passed")

            # ==================== STEP 7: CACHE RESULT ====================
            print("\n💾 Step 7: Caching result...")
            cache_ttl = prompt_service.get_cache_ttl("debug")
            await cache_service.set(cache_key, claude_result, cache_ttl)
            print(f"✅ Result cached (TTL: {cache_ttl}s)")

            # ==================== STEP 8: STORE IN MONGODB ====================
            print("\n💾 Step 8: Storing results in MongoDB...")

            # Calculate estimated cost (Claude Sonnet pricing)
            tokens_used = claude_result.get("tokens_used", {})
            input_tokens = tokens_used.get("prompt_tokens", 0)
            output_tokens = tokens_used.get("completion_tokens", 0)

            estimated_cost = (input_tokens / 1000 * 0.003) + (output_tokens / 1000 * 0.015)

            # Update job with results
            await mongodb_service.update_job_status(
                job_id,
                "completed",
                results={
                    "content": claude_content,
                    "lint_result": lint_result,
                    "stack_trace_analysis": stack_trace_analysis,
                    "model": claude_result.get("model"),
                    "elapsed_time": claude_result.get("elapsed_time"),
                    "cached": False
                }
            )

            # Update token usage
            await mongodb_service.update_job_tokens(
                job_id,
                tokens_used,
                estimated_cost,
                cache_hit=False
            )

            # Update user quota
            await mongodb_service.update_user_quota(
                user_id,
                tokens_used=tokens_used.get("total_tokens", 0),
                requests_used=1
            )

            print("✅ Results stored in MongoDB")

            # ==================== COMPLETE ====================
            elapsed = time.time() - start_time

            print(f"\n{'='*60}")
            print(f"✅ Debug Doctor Pipeline COMPLETED for Job: {job_id}")
            print(f"   Total Time: {elapsed:.2f}s")
            print(f"   Tokens: {tokens_used.get('total_tokens', 0)}")
            print(f"   Cost: ${estimated_cost:.4f}")
            print(f"   Cached: No")
            print(f"{'='*60}\n")

            # Notify via WebSocket - Job completed
            await websocket_manager.notify_job_update(
                job_id=job_id,
                user_id=user_id,
                status="completed",
                data={
                    "message": "Debug analysis completed!",
                    "tokens_used": tokens_used.get("total_tokens", 0),
                    "estimated_cost": estimated_cost,
                    "elapsed_time": elapsed
                }
            )

            return True

        except Exception as e:
            print(f"\n❌ Debug pipeline error for job {job_id}: {e}")

            # Update job status to failed
            try:
                await mongodb_service.update_job_status(
                    job_id,
                    "failed",
                    error=str(e)
                )
            except:
                pass

            return False

    def _parse_stack_trace(self, error_log: str, file_path: str) -> Dict[str, Any]:
        """
        Parse error stack trace to extract line numbers and error type
        Following prompt.md line 229: "capture stack traces, trace dependency graph"
        """
        import re

        analysis = {
            "error_lines": [],
            "error_type": None,
            "error_message": None
        }

        if not error_log:
            return analysis

        try:
            # Extract error type (e.g., "SyntaxError", "TypeError", "ImportError")
            error_type_match = re.search(r'(\w+Error):\s*(.+)', error_log)
            if error_type_match:
                analysis["error_type"] = error_type_match.group(1)
                analysis["error_message"] = error_type_match.group(2).strip()

            # Extract line numbers from stack trace
            # Pattern: "line 123" or "File \"...\", line 456"
            line_matches = re.findall(r'line (\d+)', error_log, re.IGNORECASE)
            if line_matches:
                analysis["error_lines"] = [int(line) for line in line_matches]

            # Python-specific: Extract from traceback
            # Pattern: File "filename.py", line 123, in function_name
            python_traceback = re.findall(
                r'File\s+"[^"]*' + re.escape(file_path.split('/')[-1]) + r'",\s+line\s+(\d+)',
                error_log
            )
            if python_traceback:
                analysis["error_lines"].extend([int(line) for line in python_traceback])

            # JavaScript-specific: Extract from stack trace
            # Pattern: at filename.js:123:45
            js_traceback = re.findall(r'at\s+[^:]+:(\d+):\d+', error_log)
            if js_traceback:
                analysis["error_lines"].extend([int(line) for line in js_traceback])

            # Remove duplicates and sort
            if analysis["error_lines"]:
                analysis["error_lines"] = sorted(list(set(analysis["error_lines"])))

        except Exception as e:
            print(f"⚠️  Error parsing stack trace: {e}")

        return analysis

# Singleton instance
review_pipeline = ReviewPipeline()
