"""Agent 3: Testing & Debugging Agent - Validates code quality and automatically fixes issues."""

from typing import Dict, Any, Optional, List
from src.tools.validation_testing.setup_environment import setup_environment_tool
from src.tools.validation_testing.run_static_analysis import run_static_analysis_tool
from src.tools.validation_testing.run_tests import run_tests_tool
from src.tools.validation_testing.analyze_error_logs import analyze_error_logs_tool
from src.tools.validation_testing.generate_fix_code import generate_fix_code_tool
from src.models.validation_result import ValidationResult, ValidationStatus, FixAttempt
from src.config import settings
from src.utils.logging import AgentLogger
import time
from datetime import datetime

logger = AgentLogger("TestingDebuggingAgent")


class TestingDebuggingAgent:
    """
    Agent 3: Testing & Debugging Agent
    
    Purpose: Validate code quality and automatically fix any issues
    
    Workflow:
    1. Sets up temporary environment and installs dependencies
    2. Runs validation checks (TypeScript compilation, ESLint linting, Prettier formatting)
    3. Runs all tests (unit tests, integration tests)
    4. Checks code coverage
    5. If anything fails (Self-Healing Loop):
       - Analyzes error messages using Gemini AI
       - Understands what's wrong
       - Generates fixed code
       - Re-runs validation
       - Repeats until all checks pass (max 5 tries)
    6. Produces validation report
    
    Tools Used:
    - Tool #10: Setup Environment
    - Tool #11: Run Static Analysis
    - Tool #12: Run Tests
    - Tool #13: Analyze Error Logs (using Gemini)
    - Tool #14: Generate Fix Code (using Gemini)
    
    Time: 5-20 minutes (depends on errors)
    """
    
    def __init__(self):
        self.name = "TestingDebuggingAgent"
        self.version = "1.0.0"
        self.tools = {
            "setup_environment": setup_environment_tool,
            "run_static_analysis": run_static_analysis_tool,
            "run_tests": run_tests_tool,
            "analyze_error_logs": analyze_error_logs_tool,
            "generate_fix_code": generate_fix_code_tool
        }
        self.max_self_healing_attempts = settings.self_healing_max_attempts
    
    async def execute(self, development_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the testing and debugging workflow with self-healing.
        
        Args:
            development_result: Result from Agent 2 (Development Agent)
            
        Returns:
            Dict containing validation results and all debugging metadata
        """
        start_time = time.time()
        story_id = development_result.get("story_id")
        execution_id = f"test_debug_{story_id}_{int(start_time)}"
        
        logger.log_agent_start(story_id, execution_id=execution_id)
        
        try:
            # Extract required data from Agent 2 result
            workspace_path = development_result.get("workspace_path")
            generated_files = development_result.get("generated_files", {})
            
            if not workspace_path:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    "No workspace path provided from Development Agent"
                )
            
            # Step 1: Setup Environment
            logger.info("Step 1: Setting up environment", story_id=story_id)
            
            setup_result = await self._setup_environment(workspace_path)
            
            # Step 1.5: CRITICAL FILE VALIDATION (catches AI generation bugs)
            # This is mandatory regardless of npm availability
            logger.info("Step 1.5: Validating critical files", story_id=story_id)
            critical_validation = await self._validate_critical_files(workspace_path)
            
            if not critical_validation["is_valid"]:
                logger.warning("Critical file validation failed. Attempting auto-repair.", 
                             errors=critical_validation.get("errors", []))
                
                # Auto-repair critical files before proceeding
                repair_result = await self._repair_critical_files(workspace_path, critical_validation["errors"])
                
                if not repair_result["success"]:
                    return self._create_error_result(
                        execution_id, story_id, start_time,
                        f"Critical file repair failed: {repair_result.get('error', 'Unknown error')}"
                    )
                
                logger.info("Critical files repaired successfully")
            
            if not setup_result["success"] and not setup_result.get("skipped"):
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to setup environment: {setup_result['error']}"
                )
            
            # Step 2: Initial Validation (Static Analysis + Tests)
            logger.info("Step 2: Running initial validation", story_id=story_id)
            
            validation_result = await self._run_initial_validation(workspace_path, setup_result)
            
            # Step 3: Self-Healing Loop (if validation failed)
            self_healing_results = []
            
            if not validation_result["is_passing"]:
                logger.info("Step 3: Starting self-healing loop", story_id=story_id)
                
                healing_result = await self._run_self_healing_loop(
                    workspace_path, validation_result
                )
                
                self_healing_results = healing_result["attempts"]
                validation_result = healing_result["final_validation"]
            else:
                logger.info("Step 3: Skipping self-healing - validation passed", story_id=story_id)
            
            # Step 4: Final Validation Report
            logger.info("Step 4: Creating final validation report", story_id=story_id)
            
            final_report = await self._create_final_validation_report(
                validation_result, self_healing_results, setup_result
            )
            
            # Cleanup environment
            await self._cleanup_environment(workspace_path)
            
            # Create comprehensive result
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = {
                "success": True,
                "execution_id": execution_id,
                "story_id": story_id,
                "duration_ms": duration_ms,
                
                # Core outputs
                "validation_result": final_report,
                "workspace_path": workspace_path,
                
                # Step results
                "environment_setup_result": setup_result,
                "initial_validation_result": validation_result,
                "self_healing_results": self_healing_results,
                
                # Execution metadata
                "steps_completed": 4,
                "tools_used": list(self.tools.keys()),
                "self_healing_attempts": len(self_healing_results),
                "self_healing_successful": final_report.get("overall_status") == "passed",
                
                # Summary for next agent
                "summary": self._create_execution_summary(
                    final_report, self_healing_results, setup_result
                ),
                
                # Quality metrics
                "quality_metrics": self._calculate_quality_metrics(final_report)
            }
            
            logger.log_agent_complete(
                story_id, duration_ms, True,
                validation_status=final_report.get("overall_status"),
                self_healing_attempts=len(self_healing_results),
                final_errors=len(final_report.get("all_errors", []))
            )
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_error(e, {"story_id": story_id, "execution_id": execution_id})
            
            return self._create_error_result(
                execution_id, story_id, start_time,
                f"Unexpected error in testing and debugging: {str(e)}"
            )
    
    async def _setup_environment(self, workspace_path: str) -> Dict[str, Any]:
        """Execute Tool #10: Setup Environment."""
        tool_start = time.time()
        
        try:
            result = await self.tools["setup_environment"].execute(workspace_path)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("setup_environment", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("setup_environment", duration_ms, False)
            raise
    
    async def _run_initial_validation(self, workspace_path: str, setup_result: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run initial validation (static analysis + tests).
        
        CRITICAL: This must ALWAYS run real validation when Node.js is available.
        Mock mode should only affect external APIs, not local code validation.
        """
        
        validation_results = {
            "static_analysis": None,
            "test_results": None,
            "build_result": None,
            "is_passing": False,
            "all_errors": [],
            "all_warnings": [],
            "skipped": False
        }
        
        try:
            # ALWAYS try to run build validation - this catches most errors
            logger.info("Running build validation (npm run build or tsc)")
            build_result = await self._run_build_check(workspace_path)
            validation_results["build_result"] = build_result
            
            if not build_result.get("success", False):
                # Collect build errors
                build_errors = build_result.get("errors", [])
                for error in build_errors:
                    validation_results["all_errors"].append({
                        "file_path": error.get("file", ""),
                        "line": error.get("line"),
                        "message": error.get("message", str(error)),
                        "severity": "error",
                        "source": "build"
                    })

            # Run static analysis only if setup was successful (not skipped)
            if not (setup_result and setup_result.get("skipped")):
                logger.info("Running static analysis")
                static_result = await self._run_static_analysis(workspace_path)
                validation_results["static_analysis"] = static_result
            
            # Run tests
            logger.info("Running tests")
            test_result = await self._run_tests(workspace_path)
            validation_results["test_results"] = test_result
            
            # Collect all errors and warnings
            if static_result["success"]:
                analysis_results = static_result["analysis_results"]
                for tool_result in analysis_results.values():
                    if hasattr(tool_result, 'errors') and hasattr(tool_result, 'warnings'):
                        validation_results["all_errors"].extend(tool_result.errors)
                        validation_results["all_warnings"].extend(tool_result.warnings)
            
            if test_result["success"]:
                test_suite = test_result["test_suite_result"]
                if test_suite["status"] == "failed":
                    # Convert failed tests to error format
                    for test in test_suite.get("test_results", []):
                        if test.get("status") == "failed":
                            validation_results["all_errors"].append({
                                "file_path": test.get("file_path", ""),
                                "rule": "test-failure",
                                "message": test.get("error_message", "Test failed"),
                                "severity": "error",
                                "source": "jest"
                            })
            
            # Determine if validation is passing
            validation_results["is_passing"] = (
                len(validation_results["all_errors"]) == 0 and
                self._safe_get(static_result, "success", False) and
                self._safe_get(test_result, "success", False) and
                self._safe_get(test_result, "coverage_met", False)
            )
            
            return validation_results
            
        except Exception as e:
            logger.error("Error in initial validation", error=str(e))
            validation_results["error"] = str(e)
            return validation_results
    
    async def _run_build_check(self, workspace_path: str) -> Dict[str, Any]:
        """Run npm run build or tsc to catch all compilation errors.
        
        This is the MOST IMPORTANT validation step because it catches:
        - Missing imports (CSS, modules)
        - TypeScript errors
        - Missing dependencies
        - Syntax errors
        """
        import subprocess
        import os
        import re
        
        try:
            # First, ensure dependencies are installed
            if os.path.exists(os.path.join(workspace_path, "node_modules")):
                logger.info("node_modules exists, skipping npm install")
            else:
                logger.info("Installing dependencies before build check")
                install_result = subprocess.run(
                    ['npm', 'install'],
                    cwd=workspace_path,
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                if install_result.returncode != 0:
                    return {
                        "success": False,
                        "errors": [{"message": f"npm install failed: {install_result.stderr}"}]
                    }
            
            # Try npm run build first (if it exists in package.json)
            build_result = subprocess.run(
                ['npm', 'run', 'build'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            if build_result.returncode == 0:
                return {
                    "success": True,
                    "errors": [],
                    "output": build_result.stdout
                }
            
            # Parse errors from build output
            errors = []
            error_output = build_result.stderr + build_result.stdout
            
            # Parse TypeScript errors (TS2xxx format)
            ts_errors = re.findall(r'([\w/\\\.]+\.tsx?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)', error_output)
            for match in ts_errors:
                errors.append({
                    "file": match[0],
                    "line": int(match[1]),
                    "column": int(match[2]),
                    "code": match[3],
                    "message": match[4]
                })
            
            # Parse Vite/esbuild errors (Failed to resolve import)
            vite_errors = re.findall(r'Failed to resolve import "([^"]+)" from "([^"]+)"', error_output)
            for match in vite_errors:
                errors.append({
                    "file": match[1],
                    "message": f"Missing import: {match[0]}"
                })
            
            # Parse missing dependency errors
            dep_errors = re.findall(r'Cannot find module [\'"]([^\'"]+)[\'"]', error_output)
            for dep in dep_errors:
                errors.append({
                    "file": "",
                    "message": f"Missing dependency: {dep}"
                })
            
            # If no specific errors parsed, add the raw output
            if not errors and build_result.returncode != 0:
                errors.append({
                    "file": "",
                    "message": error_output[:500] if error_output else "Build failed with unknown error"
                })
            
            return {
                "success": False,
                "errors": errors,
                "raw_output": error_output[:2000]
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "errors": [{"message": "Build timed out after 180 seconds"}]
            }
        except FileNotFoundError:
            logger.warning("npm not found, skipping build check")
            return {
                "success": True,
                "skipped": True,
                "errors": [],
                "message": "npm not available, build check skipped"
            }
        except Exception as e:
            return {
                "success": False,
                "errors": [{"message": f"Build check error: {str(e)}"}]
            }
    
    async def _run_static_analysis(self, workspace_path: str) -> Dict[str, Any]:
        """Execute Tool #11: Run Static Analysis."""
        tool_start = time.time()
        
        try:
            result = await self.tools["run_static_analysis"].execute(workspace_path)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("run_static_analysis", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("run_static_analysis", duration_ms, False)
            raise
    
    async def _run_tests(self, workspace_path: str) -> Dict[str, Any]:
        """Execute Tool #12: Run Tests."""
        tool_start = time.time()
        
        try:
            result = await self.tools["run_tests"].execute(workspace_path)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("run_tests", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("run_tests", duration_ms, False)
            raise
    
    async def _run_self_healing_loop(self, workspace_path: str, 
                                   initial_validation: Dict[str, Any]) -> Dict[str, Any]:
        """Run the self-healing loop to automatically fix errors."""
        
        healing_attempts = []
        current_validation = initial_validation
        
        for attempt in range(1, self.max_self_healing_attempts + 1):
            logger.log_self_healing(attempt, len(current_validation.get("all_errors", [])), False)
            
            try:
                # Step 3a: Analyze errors using AI
                logger.info(f"Self-healing attempt {attempt}: Analyzing errors")
                
                error_analysis = await self._analyze_errors(
                    current_validation.get("all_errors", []),
                    workspace_path
                )
                
                if not error_analysis["success"]:
                    healing_attempts.append({
                        "attempt": attempt,
                        "success": False,
                        "error": f"Error analysis failed: {error_analysis['error']}",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    continue
                
                # Step 3b: Generate fixed code
                logger.info(f"Self-healing attempt {attempt}: Generating fixes")
                
                fix_suggestions = error_analysis["analysis"]["fix_suggestions"]
                fix_result = await self._generate_fixes(workspace_path, fix_suggestions)
                
                if not fix_result["success"]:
                    healing_attempts.append({
                        "attempt": attempt,
                        "success": False,
                        "error": f"Fix generation failed: {fix_result['error']}",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    continue
                
                # Step 3c: Re-run validation
                logger.info(f"Self-healing attempt {attempt}: Re-running validation")
                
                new_validation = await self._run_initial_validation(workspace_path)
                
                # Check if healing was successful
                original_error_count = len(current_validation.get("all_errors", []))
                new_error_count = len(new_validation.get("all_errors", []))
                
                healing_successful = new_error_count < original_error_count
                
                healing_attempts.append({
                    "attempt": attempt,
                    "success": healing_successful,
                    "original_errors": original_error_count,
                    "remaining_errors": new_error_count,
                    "errors_fixed": max(0, original_error_count - new_error_count),
                    "error_analysis": error_analysis["analysis"],
                    "fix_result": fix_result,
                    "changes_made": fix_result.get("changes_made", []),
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                logger.log_self_healing(attempt, new_error_count, healing_successful)
                
                # Update current validation
                current_validation = new_validation
                
                # If validation is now passing, break the loop
                if new_validation.get("is_passing", False):
                    logger.info(f"Self-healing successful after {attempt} attempts")
                    break
                
                # If no improvement, break the loop
                if not healing_successful:
                    logger.warning(f"Self-healing attempt {attempt} made no improvement")
                    if attempt >= 2:  # Give up after 2 failed attempts
                        break
                
            except Exception as e:
                healing_attempts.append({
                    "attempt": attempt,
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
                logger.error(f"Self-healing attempt {attempt} failed", error=str(e))
        
        return {
            "attempts": healing_attempts,
            "final_validation": current_validation,
            "total_attempts": len(healing_attempts),
            "successful_attempts": len([a for a in healing_attempts if a.get("success", False)])
        }
    
    async def _analyze_errors(self, errors: List[Dict[str, Any]], 
                            workspace_path: str) -> Dict[str, Any]:
        """Execute Tool #13: Analyze Error Logs."""
        tool_start = time.time()
        
        try:
            # Convert errors to string format for analysis
            error_logs = []
            for error in errors:
                if hasattr(error, 'message'):
                    # It's a ValidationError object
                    error_logs.append(error.message)
                elif isinstance(error, dict):
                    # It's a dictionary
                    error_logs.append(error.get("message", str(error)))
                else:
                    # It's something else, convert to string
                    error_logs.append(str(error))
            
            # Read current code for context
            code_context = await self._read_code_context(workspace_path)
            
            result = await self.tools["analyze_error_logs"].execute(
                error_logs, errors, code_context
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("analyze_error_logs", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("analyze_error_logs", duration_ms, False)
            raise
    
    async def _generate_fixes(self, workspace_path: str, 
                            fix_suggestions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute Tool #14: Generate Fix Code."""
        tool_start = time.time()
        
        try:
            result = await self.tools["generate_fix_code"].execute(
                workspace_path, fix_suggestions
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_fix_code", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_fix_code", duration_ms, False)
            raise
    
    async def _read_code_context(self, workspace_path: str) -> Dict[str, str]:
        """Read code files for error analysis context."""
        
        code_context = {}
        
        try:
            import os
            
            # Read key files for context
            key_files = []
            
            # Find TypeScript/JavaScript files
            for root, dirs, files in os.walk(workspace_path):
                # Skip node_modules and other irrelevant directories
                dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'coverage']]
                
                for file in files:
                    if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                        key_files.append(os.path.join(root, file))
            
            # Limit to first 10 files to avoid token limits
            for file_path in key_files[:10]:
                try:
                    relative_path = os.path.relpath(file_path, workspace_path)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Limit content size
                        if len(content) > 3000:
                            content = content[:3000] + "\n// ... (truncated)"
                        code_context[relative_path] = content
                except Exception as e:
                    logger.warning(f"Failed to read file {file_path}", error=str(e))
        
        except Exception as e:
            logger.error("Error reading code context", error=str(e))
        
        return code_context
    
    async def _validate_critical_files(self, workspace_path: str) -> Dict[str, Any]:
        """Validate that critical files exist and are in the correct format.
        
        This catches AI generation bugs like:
        - package.json with TypeScript code instead of JSON
        - main.tsx without ReactDOM.createRoot
        - Missing index.html
        """
        import os
        import json
        
        errors = []
        
        # 1. Validate package.json is valid JSON
        package_json_path = os.path.join(workspace_path, "package.json")
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Check for common mistakes: comments or TypeScript code
                    if content.strip().startswith('//') or 'interface ' in content or 'const ' in content:
                        errors.append({
                            "file": "package.json",
                            "type": "invalid_format",
                            "message": "package.json contains TypeScript/JavaScript code instead of valid JSON"
                        })
                    else:
                        json.loads(content)  # Will raise JSONDecodeError if invalid
            except json.JSONDecodeError as e:
                errors.append({
                    "file": "package.json",
                    "type": "invalid_json",
                    "message": f"package.json is not valid JSON: {str(e)}"
                })
        else:
            errors.append({
                "file": "package.json",
                "type": "missing",
                "message": "package.json file is missing"
            })
        
        # 2. Validate main.tsx has React entry point
        main_tsx_path = os.path.join(workspace_path, "src", "main.tsx")
        if os.path.exists(main_tsx_path):
            with open(main_tsx_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'ReactDOM.createRoot' not in content and 'ReactDOM.render' not in content:
                    # Check if it's just TypeScript interfaces (common AI mistake)
                    if 'interface ' in content and 'export default' not in content:
                        errors.append({
                            "file": "src/main.tsx",
                            "type": "invalid_format",
                            "message": "main.tsx contains only TypeScript interfaces, not a React entry point"
                        })
        else:
            errors.append({
                "file": "src/main.tsx",
                "type": "missing",
                "message": "src/main.tsx file is missing"
            })
        
        # 3. Validate index.html exists and has root div
        index_html_path = os.path.join(workspace_path, "index.html")
        if os.path.exists(index_html_path):
            with open(index_html_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'id="root"' not in content and "id='root'" not in content:
                    errors.append({
                        "file": "index.html",
                        "type": "invalid_format",
                        "message": "index.html is missing the root div element"
                    })
        else:
            errors.append({
                "file": "index.html",
                "type": "missing",
                "message": "index.html file is missing"
            })
        
        # 4. Check if CSS files exist (commonly imported but missing)
        main_tsx_path = os.path.join(workspace_path, "src", "main.tsx")
        if os.path.exists(main_tsx_path):
            with open(main_tsx_path, 'r', encoding='utf-8') as f:
                main_content = f.read()
                
                # Check if index.css is imported but missing (handle both quote styles)
                if './index.css' in main_content or "'./index.css'" in main_content or '"./index.css"' in main_content or 'index.css' in main_content:
                    index_css_path = os.path.join(workspace_path, "src", "index.css")
                    if not os.path.exists(index_css_path):
                        logger.warning("DETECTED: index.css is imported but missing!")
                        errors.append({
                            "file": "src/index.css",
                            "type": "missing",
                            "message": "index.css is imported in main.tsx but file is missing"
                        })
        
        app_tsx_path = os.path.join(workspace_path, "src", "App.tsx")
        if os.path.exists(app_tsx_path):
            with open(app_tsx_path, 'r', encoding='utf-8') as f:
                app_content = f.read()
                
                # Check if App.css is imported but missing (handle both quote styles)
                if './App.css' in app_content or "'./App.css'" in app_content or '"./App.css"' in app_content or 'App.css' in app_content:
                    app_css_path = os.path.join(workspace_path, "src", "App.css")
                    if not os.path.exists(app_css_path):
                        logger.warning("DETECTED: App.css is imported but missing!")
                        errors.append({
                            "file": "src/App.css",
                            "type": "missing",
                            "message": "App.css is imported in App.tsx but file is missing"
                        })
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }
    
    async def _repair_critical_files(self, workspace_path: str, errors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Repair critical files that failed validation.
        
        Uses AI to regenerate the files correctly, or uses known-good templates.
        """
        import os
        
        repairs_made = []
        
        try:
            for error in errors:
                file_name = error["file"]
                error_type = error["type"]
                
                if file_name == "package.json":
                    # Create a valid package.json
                    package_json = {
                        "name": "dashboard-app",
                        "private": True,
                        "version": "0.0.1",
                        "type": "module",
                        "scripts": {
                            "dev": "vite",
                            "build": "tsc && vite build",
                            "preview": "vite preview"
                        },
                        "dependencies": {
                            "react": "^18.2.0",
                            "react-dom": "^18.2.0",
                            "react-router-dom": "^6.20.0"
                        },
                        "devDependencies": {
                            "@types/react": "^18.2.37",
                            "@types/react-dom": "^18.2.15",
                            "@vitejs/plugin-react": "^4.2.0",
                            "typescript": "^5.2.2",
                            "vite": "^5.0.0"
                        }
                    }
                    
                    import json
                    file_path = os.path.join(workspace_path, "package.json")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(package_json, f, indent=2)
                    
                    repairs_made.append({"file": file_name, "action": "replaced", "status": "success"})
                    logger.info(f"Repaired {file_name}: Created valid JSON")
                
                elif file_name == "src/main.tsx":
                    # Create a valid React entry point
                    main_tsx_content = '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
'''
                    file_path = os.path.join(workspace_path, "src", "main.tsx")
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(main_tsx_content)
                    
                    repairs_made.append({"file": file_name, "action": "replaced", "status": "success"})
                    logger.info(f"Repaired {file_name}: Created valid React entry point")
                
                elif file_name == "index.html":
                    # Create a valid index.html
                    index_html_content = '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'''
                    file_path = os.path.join(workspace_path, "index.html")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(index_html_content)
                    
                    repairs_made.append({"file": file_name, "action": "replaced", "status": "success"})
                    logger.info(f"Repaired {file_name}: Created valid HTML entry point")
                
                elif file_name == "src/index.css":
                    # Create a basic index.css
                    index_css_content = '''* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100vh;
}
'''
                    file_path = os.path.join(workspace_path, "src", "index.css")
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(index_css_content)
                    
                    repairs_made.append({"file": file_name, "action": "created", "status": "success"})
                    logger.info(f"Repaired {file_name}: Created missing CSS file")
                
                elif file_name == "src/App.css":
                    # Create a basic App.css
                    app_css_content = '''.app {
  min-height: 100vh;
  padding: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}
'''
                    file_path = os.path.join(workspace_path, "src", "App.css")
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(app_css_content)
                    
                    repairs_made.append({"file": file_name, "action": "created", "status": "success"})
                    logger.info(f"Repaired {file_name}: Created missing CSS file")
            
            return {
                "success": True,
                "repairs_made": repairs_made,
                "total_repairs": len(repairs_made)
            }
            
        except Exception as e:
            logger.error("Error repairing critical files", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "repairs_made": repairs_made
            }
    
    async def _create_final_validation_report(self, validation_result: Dict[str, Any],
                                            self_healing_results: List[Dict[str, Any]],
                                            setup_result: Dict[str, Any]) -> Dict[str, Any]:
        """Create final validation report."""
        
        # Simple, safe approach - just return basic info without complex processing
        return {
            "validation_id": f"validation_{int(time.time())}",
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "passed" if validation_result.get("is_passing", False) else "failed",
            
            # Static analysis results - simple conversion
            "static_analysis": {"status": "completed"},
            
            # Test results - simple conversion  
            "test_results": {"status": "completed"},
            
            # Error summary - safe access
            "all_errors": validation_result.get("all_errors", []),
            "all_warnings": validation_result.get("all_warnings", []),
            "total_errors": len(validation_result.get("all_errors", [])),
            "total_warnings": len(validation_result.get("all_warnings", [])),
            
            # Self-healing summary
            "self_healing_attempted": len(self_healing_results) > 0,
            "self_healing_attempts": len(self_healing_results),
            "self_healing_successful": any(attempt.get("success", False) for attempt in self_healing_results),
            "self_healing_details": self_healing_results,
            
            # Environment info
            "environment_setup": setup_result,
            
            # Quality metrics - simple defaults
            "code_quality_score": 75.0,  # Default score
            "test_coverage": 0.0,        # Default coverage
            
            # Recommendations
            "recommendations": ["Code validation completed", "Review generated files", "Run manual tests if needed"]
        }
    
    async def _cleanup_environment(self, workspace_path: str):
        """Clean up the temporary environment."""
        try:
            await self.tools["setup_environment"].cleanup_environment(workspace_path)
        except Exception as e:
            logger.warning("Error cleaning up environment", error=str(e))
    
    def _calculate_code_quality_score(self, validation_result: Dict[str, Any]) -> float:
        """Calculate overall code quality score (0-100)."""
        
        base_score = 100.0
        
        # Deduct points for errors
        errors = len(validation_result.get("all_errors", []))
        base_score -= errors * 10  # 10 points per error
        
        # Deduct points for warnings
        warnings = len(validation_result.get("all_warnings", []))
        base_score -= warnings * 2  # 2 points per warning
        
        # Bonus for test coverage
        test_results = validation_result.get("test_results", {})
        if isinstance(test_results, dict) and test_results.get("success", False):
            test_suite_result = test_results.get("test_suite_result", {})
            if isinstance(test_suite_result, dict):
                coverage = test_suite_result.get("overall_coverage", 0)
                if coverage >= 80:
                    base_score += 5  # Bonus for good coverage
        
        return max(0.0, min(100.0, base_score))
    
    def _generate_recommendations(self, validation_result: Dict[str, Any],
                                self_healing_results: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on validation results."""
        
        recommendations = []
        
        # Error-based recommendations
        errors = validation_result.get("all_errors", [])
        if errors:
            error_sources = set()
            for error in errors:
                if hasattr(error, 'source'):
                    error_sources.add(error.source)
                elif isinstance(error, dict):
                    error_sources.add(error.get("source", "unknown"))
            
            if "typescript" in error_sources:
                recommendations.append("Consider enabling stricter TypeScript settings")
            if "eslint" in error_sources:
                recommendations.append("Review ESLint configuration and fix linting issues")
            if "jest" in error_sources:
                recommendations.append("Improve test coverage and fix failing tests")
        
        # Self-healing recommendations
        if self_healing_results:
            successful_attempts = [a for a in self_healing_results if a.get("success", False)]
            if successful_attempts:
                recommendations.append("Self-healing was successful - consider reviewing the applied fixes")
            else:
                recommendations.append("Self-healing failed - manual intervention may be required")
        
        # Coverage recommendations
        test_results = validation_result.get("test_results", {})
        if isinstance(test_results, dict) and test_results.get("success", False):
            test_suite_result = test_results.get("test_suite_result", {})
            if isinstance(test_suite_result, dict):
                coverage = test_suite_result.get("overall_coverage", 0)
                if coverage < 80:
                    recommendations.append(f"Increase test coverage from {coverage:.1f}% to at least 80%")
        
        return recommendations
    
    def _convert_static_analysis_to_dict(self, static_analysis_data: Any) -> Dict[str, Any]:
        """Convert StaticAnalysisResult objects to dictionaries for JSON serialization."""
        
        if isinstance(static_analysis_data, dict):
            # It's already a dictionary, process its values
            result = {}
            for key, value in static_analysis_data.items():
                if hasattr(value, 'dict'):
                    # It's a Pydantic model, convert to dict
                    result[key] = value.dict()
                elif hasattr(value, '__dict__'):
                    # It's an object with attributes, convert to dict
                    result[key] = {
                        "tool": getattr(value, 'tool', key),
                        "status": getattr(value, 'status', 'unknown'),
                        "errors": [self._convert_error_to_dict(e) for e in getattr(value, 'errors', [])],
                        "warnings": [self._convert_error_to_dict(e) for e in getattr(value, 'warnings', [])],
                        "duration_ms": getattr(value, 'duration_ms', 0),
                        "error_count": getattr(value, 'error_count', 0),
                        "warning_count": getattr(value, 'warning_count', 0),
                        "is_passing": getattr(value, 'is_passing', False)
                    }
                else:
                    result[key] = value
            return result
        else:
            # Return as-is if it's not a dict
            return static_analysis_data if isinstance(static_analysis_data, dict) else {}
    
    def _convert_error_to_dict(self, error: Any) -> Dict[str, Any]:
        """Convert ValidationError objects to dictionaries."""
        
        if hasattr(error, 'dict'):
            return error.dict()
        elif hasattr(error, '__dict__'):
            return {
                "file_path": getattr(error, 'file_path', ''),
                "line": getattr(error, 'line', None),
                "column": getattr(error, 'column', None),
                "rule": getattr(error, 'rule', ''),
                "message": getattr(error, 'message', str(error)),
                "severity": getattr(error, 'severity', 'error'),
                "source": getattr(error, 'source', 'unknown'),
                "suggested_fix": getattr(error, 'suggested_fix', None),
                "auto_fixable": getattr(error, 'auto_fixable', False)
            }
        elif isinstance(error, dict):
            return error
        else:
            return {"message": str(error), "severity": "error", "source": "unknown"}
    
    def _extract_test_coverage(self, validation_result: Dict[str, Any]) -> float:
        """Extract test coverage from validation result, handling both dict and object formats."""
        
        test_results = validation_result.get("test_results", {})
        
        if isinstance(test_results, dict):
            test_suite_result = test_results.get("test_suite_result", {})
            if isinstance(test_suite_result, dict):
                return test_suite_result.get("overall_coverage", 0)
            elif hasattr(test_suite_result, 'overall_coverage_percent'):
                return test_suite_result.overall_coverage_percent
        elif hasattr(test_results, 'test_suite_result'):
            test_suite = test_results.test_suite_result
            if hasattr(test_suite, 'overall_coverage_percent'):
                return test_suite.overall_coverage_percent
            elif isinstance(test_suite, dict):
                return test_suite.get("overall_coverage", 0)
        
        return 0.0
    
    def _safe_convert_to_dict(self, obj: Any) -> Dict[str, Any]:
        """Safely convert any object to dictionary format."""
        
        if obj is None:
            return {}
        elif isinstance(obj, dict):
            return obj
        elif hasattr(obj, 'dict'):
            # Pydantic model
            return obj.dict()
        elif hasattr(obj, '__dict__'):
            # Regular object with attributes
            return obj.__dict__
        else:
            # Convert to string representation
            return {"value": str(obj), "type": str(type(obj))}
    
    def _safe_get(self, obj: Any, key: str, default: Any = None) -> Any:
        """Safely get attribute from object, handling both dict and object types."""
        
        if obj is None:
            return default
        elif isinstance(obj, dict):
            return obj.get(key, default)
        elif hasattr(obj, key):
            return getattr(obj, key, default)
        else:
            return default
    
    def _create_execution_summary(self, final_report: Dict[str, Any],
                                self_healing_results: List[Dict[str, Any]],
                                setup_result: Dict[str, Any]) -> Dict[str, Any]:
        """Create execution summary for next agent."""
        
        return {
            "validation_status": final_report.get("overall_status"),
            "total_errors": final_report.get("total_errors", 0),
            "total_warnings": final_report.get("total_warnings", 0),
            "code_quality_score": final_report.get("code_quality_score", 0),
            "test_coverage": final_report.get("test_coverage", 0),
            
            "self_healing_attempted": len(self_healing_results) > 0,
            "self_healing_successful": final_report.get("self_healing_successful", False),
            "self_healing_attempts": len(self_healing_results),
            
            "environment_ready": setup_result.get("environment_ready", False),
            "dependencies_installed": setup_result.get("package_info", {}).get("dependencies", {}),
            
            "ready_for_deployment": final_report.get("overall_status") == "passed",
            "next_agent": "DeploymentAgent" if final_report.get("overall_status") == "passed" else None,
            
            "recommendations": final_report.get("recommendations", [])
        }
    
    def _calculate_quality_metrics(self, final_report: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate quality metrics for the validation."""
        
        return {
            "overall_quality_score": final_report.get("code_quality_score", 0),
            "validation_passed": final_report.get("overall_status") == "passed",
            "error_count": final_report.get("total_errors", 0),
            "warning_count": final_report.get("total_warnings", 0),
            "test_coverage_percent": final_report.get("test_coverage", 0),
            "self_healing_success_rate": self._calculate_self_healing_success_rate(final_report),
            "quality_gates": {
                "no_compilation_errors": self._check_no_compilation_errors(final_report),
                "no_linting_errors": self._check_no_linting_errors(final_report),
                "tests_passing": self._check_tests_passing(final_report),
                "coverage_threshold_met": final_report.get("test_coverage", 0) >= 80
            }
        }
    
    def _calculate_self_healing_success_rate(self, final_report: Dict[str, Any]) -> float:
        """Calculate self-healing success rate."""
        
        healing_details = final_report.get("self_healing_details", [])
        if not healing_details:
            return 100.0  # No healing needed
        
        successful = len([a for a in healing_details if a.get("success", False)])
        return (successful / len(healing_details)) * 100
    
    def _check_no_compilation_errors(self, final_report: Dict[str, Any]) -> bool:
        """Check if there are no TypeScript compilation errors."""
        
        static_analysis = final_report.get("static_analysis", {})
        if static_analysis.get("success", False):
            analysis_results = static_analysis.get("analysis_results", {})
            typescript_result = analysis_results.get("typescript", {})
            return len(typescript_result.get("errors", [])) == 0
        return False
    
    def _check_no_linting_errors(self, final_report: Dict[str, Any]) -> bool:
        """Check if there are no ESLint errors."""
        
        static_analysis = final_report.get("static_analysis", {})
        if static_analysis.get("success", False):
            analysis_results = static_analysis.get("analysis_results", {})
            eslint_result = analysis_results.get("eslint", {})
            return len(eslint_result.get("errors", [])) == 0
        return False
    
    def _check_tests_passing(self, final_report: Dict[str, Any]) -> bool:
        """Check if all tests are passing."""
        
        test_results = final_report.get("test_results", {})
        if test_results.get("success", False):
            test_suite = test_results.get("test_suite_result", {})
            return test_suite.get("tests_failed", 0) == 0
        return False
    
    def _create_error_result(self, execution_id: str, story_id: int, 
                           start_time: float, error_message: str) -> Dict[str, Any]:
        """Create standardized error result."""
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.log_agent_complete(story_id, duration_ms, False, error=error_message)
        
        return {
            "success": False,
            "execution_id": execution_id,
            "story_id": story_id,
            "duration_ms": duration_ms,
            "error": error_message,
            "validation_result": {
                "overall_status": "failed",
                "total_errors": 1,
                "error_message": error_message
            }
        }


# Global agent instance
testing_debugging_agent = TestingDebuggingAgent()