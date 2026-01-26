"""Tool #11: Run Static Analysis - Runs TypeScript compiler, ESLint, and Prettier."""

import os
import asyncio
import json
from typing import Dict, Any, List, Optional
from src.config import settings
from src.utils.logging import get_logger
from src.models.validation_result import (
    StaticAnalysisResult, ValidationError, ErrorSeverity, ValidationStatus
)
import time
import re

logger = get_logger(__name__)


class RunStaticAnalysisTool:
    """Tool for running static analysis on generated code."""
    
    def __init__(self):
        self.name = "run_static_analysis"
        self.description = "Runs TypeScript compilation, ESLint, and Prettier checks"
    
    async def execute(self, workspace_path: str, 
                     files_to_analyze: List[str] = None) -> Dict[str, Any]:
        """
        Run static analysis on the workspace.
        
        Args:
            workspace_path: Path to the workspace
            files_to_analyze: Optional list of specific files to analyze
            
        Returns:
            Dict containing static analysis results
        """
        start_time = time.time()
        
        try:
            logger.info("Running static analysis", workspace_path=workspace_path)
            
            # Validate workspace
            if not os.path.exists(workspace_path):
                return {
                    "success": False,
                    "error": f"Workspace path does not exist: {workspace_path}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            analysis_results = {}
            
            # Run TypeScript compilation check
            logger.info("Running TypeScript compilation check")
            typescript_result = await self._run_typescript_check(workspace_path)
            analysis_results["typescript"] = typescript_result
            
            # Run ESLint
            logger.info("Running ESLint analysis")
            eslint_result = await self._run_eslint_check(workspace_path, files_to_analyze)
            analysis_results["eslint"] = eslint_result
            
            # Run Prettier check
            logger.info("Running Prettier format check")
            prettier_result = await self._run_prettier_check(workspace_path, files_to_analyze)
            analysis_results["prettier"] = prettier_result
            
            # Calculate overall status
            overall_status = self._calculate_overall_status(analysis_results)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Static analysis completed", 
                       workspace_path=workspace_path,
                       overall_status=overall_status,
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "workspace_path": workspace_path,
                "analysis_results": analysis_results,
                "overall_status": overall_status,
                "summary": self._create_analysis_summary(analysis_results),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error running static analysis", 
                        workspace_path=workspace_path,
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    async def _run_typescript_check(self, workspace_path: str) -> StaticAnalysisResult:
        """Run TypeScript compilation check."""
        
        start_time = time.time()
        
        try:
            # Check if tsconfig.json exists
            tsconfig_path = os.path.join(workspace_path, "tsconfig.json")
            if not os.path.exists(tsconfig_path):
                return StaticAnalysisResult(
                    tool="typescript",
                    status=ValidationStatus.FAILED,
                    errors=[ValidationError(
                        file_path="tsconfig.json",
                        rule="missing-config",
                        message="tsconfig.json not found",
                        severity=ErrorSeverity.ERROR,
                        source="typescript"
                    )],
                    duration_ms=int((time.time() - start_time) * 1000)
                )
            
            # Run TypeScript compiler
            result = await self._run_command(
                ["npx", "tsc", "--noEmit", "--pretty", "false"],
                cwd=workspace_path
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            if result["returncode"] == 0:
                return StaticAnalysisResult(
                    tool="typescript",
                    status=ValidationStatus.PASSED,
                    errors=[],
                    warnings=[],
                    duration_ms=duration_ms
                )
            else:
                # Parse TypeScript errors
                errors = self._parse_typescript_errors(result["stdout"] + result["stderr"])
                
                return StaticAnalysisResult(
                    tool="typescript",
                    status=ValidationStatus.FAILED,
                    errors=errors,
                    warnings=[],
                    duration_ms=duration_ms
                )
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return StaticAnalysisResult(
                tool="typescript",
                status=ValidationStatus.FAILED,
                errors=[ValidationError(
                    file_path="unknown",
                    rule="execution-error",
                    message=str(e),
                    severity=ErrorSeverity.ERROR,
                    source="typescript"
                )],
                duration_ms=duration_ms
            )
    
    async def _run_eslint_check(self, workspace_path: str, 
                              files_to_analyze: List[str] = None) -> StaticAnalysisResult:
        """Run ESLint analysis."""
        
        start_time = time.time()
        
        try:
            # Check if ESLint config exists
            eslint_configs = [".eslintrc.json", ".eslintrc.js", ".eslintrc.yaml", "eslint.config.js"]
            config_exists = any(
                os.path.exists(os.path.join(workspace_path, config))
                for config in eslint_configs
            )
            
            if not config_exists:
                return StaticAnalysisResult(
                    tool="eslint",
                    status=ValidationStatus.FAILED,
                    errors=[ValidationError(
                        file_path=".eslintrc.json",
                        rule="missing-config",
                        message="ESLint configuration not found",
                        severity=ErrorSeverity.ERROR,
                        source="eslint"
                    )],
                    duration_ms=int((time.time() - start_time) * 1000)
                )
            
            # Determine files to lint
            if files_to_analyze:
                # Filter for TypeScript/JavaScript files
                lint_files = [f for f in files_to_analyze if f.endswith(('.ts', '.tsx', '.js', '.jsx'))]
            else:
                lint_files = ["src/**/*.{ts,tsx,js,jsx}"]
            
            if not lint_files:
                return StaticAnalysisResult(
                    tool="eslint",
                    status=ValidationStatus.PASSED,
                    errors=[],
                    warnings=[],
                    duration_ms=int((time.time() - start_time) * 1000)
                )
            
            # Run ESLint
            command = ["npx", "eslint", "--format", "json"] + lint_files
            result = await self._run_command(command, cwd=workspace_path)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Parse ESLint output
            errors, warnings = self._parse_eslint_output(result["stdout"])
            
            status = ValidationStatus.PASSED
            if errors:
                status = ValidationStatus.FAILED
            elif warnings:
                status = ValidationStatus.WARNING
            
            return StaticAnalysisResult(
                tool="eslint",
                status=status,
                errors=errors,
                warnings=warnings,
                duration_ms=duration_ms
            )
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return StaticAnalysisResult(
                tool="eslint",
                status=ValidationStatus.FAILED,
                errors=[ValidationError(
                    file_path="unknown",
                    rule="execution-error",
                    message=str(e),
                    severity=ErrorSeverity.ERROR,
                    source="eslint"
                )],
                duration_ms=duration_ms
            )
    
    async def _run_prettier_check(self, workspace_path: str, 
                                files_to_analyze: List[str] = None) -> StaticAnalysisResult:
        """Run Prettier format check."""
        
        start_time = time.time()
        
        try:
            # Determine files to check
            if files_to_analyze:
                # Filter for supported file types
                check_files = [f for f in files_to_analyze 
                             if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md'))]
            else:
                check_files = ["src/**/*.{ts,tsx,js,jsx,json,css,md}"]
            
            if not check_files:
                return StaticAnalysisResult(
                    tool="prettier",
                    status=ValidationStatus.PASSED,
                    errors=[],
                    warnings=[],
                    duration_ms=int((time.time() - start_time) * 1000)
                )
            
            # Run Prettier check
            command = ["npx", "prettier", "--check"] + check_files
            result = await self._run_command(command, cwd=workspace_path)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            if result["returncode"] == 0:
                return StaticAnalysisResult(
                    tool="prettier",
                    status=ValidationStatus.PASSED,
                    errors=[],
                    warnings=[],
                    duration_ms=duration_ms
                )
            else:
                # Parse Prettier output for unformatted files
                warnings = self._parse_prettier_output(result["stdout"] + result["stderr"])
                
                return StaticAnalysisResult(
                    tool="prettier",
                    status=ValidationStatus.WARNING,
                    errors=[],
                    warnings=warnings,
                    duration_ms=duration_ms
                )
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return StaticAnalysisResult(
                tool="prettier",
                status=ValidationStatus.FAILED,
                errors=[ValidationError(
                    file_path="unknown",
                    rule="execution-error",
                    message=str(e),
                    severity=ErrorSeverity.ERROR,
                    source="prettier"
                )],
                duration_ms=duration_ms
            )
    
    def _parse_typescript_errors(self, output: str) -> List[ValidationError]:
        """Parse TypeScript compiler errors."""
        
        errors = []
        
        # TypeScript error pattern: file(line,col): error TS####: message
        error_pattern = r'(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)'
        
        for line in output.split('\n'):
            match = re.match(error_pattern, line.strip())
            if match:
                file_path, line_num, col_num, severity, ts_code, message = match.groups()
                
                errors.append(ValidationError(
                    file_path=file_path,
                    line=int(line_num),
                    column=int(col_num),
                    rule=f"TS{ts_code}",
                    message=message,
                    severity=ErrorSeverity.ERROR if severity == "error" else ErrorSeverity.WARNING,
                    source="typescript",
                    auto_fixable=self._is_typescript_error_fixable(ts_code)
                ))
        
        return errors
    
    def _parse_eslint_output(self, output: str) -> tuple[List[ValidationError], List[ValidationError]]:
        """Parse ESLint JSON output."""
        
        errors = []
        warnings = []
        
        try:
            if not output.strip():
                return errors, warnings
            
            eslint_results = json.loads(output)
            
            for file_result in eslint_results:
                file_path = file_result.get("filePath", "unknown")
                
                for message in file_result.get("messages", []):
                    validation_error = ValidationError(
                        file_path=file_path,
                        line=message.get("line"),
                        column=message.get("column"),
                        rule=message.get("ruleId", "unknown"),
                        message=message.get("message", ""),
                        severity=ErrorSeverity.ERROR if message.get("severity") == 2 else ErrorSeverity.WARNING,
                        source="eslint",
                        auto_fixable=message.get("fix") is not None
                    )
                    
                    if validation_error.severity == ErrorSeverity.ERROR:
                        errors.append(validation_error)
                    else:
                        warnings.append(validation_error)
        
        except json.JSONDecodeError:
            # If JSON parsing fails, try to parse as text
            for line in output.split('\n'):
                if 'error' in line.lower() or 'warning' in line.lower():
                    errors.append(ValidationError(
                        file_path="unknown",
                        rule="parse-error",
                        message=line.strip(),
                        severity=ErrorSeverity.ERROR,
                        source="eslint"
                    ))
        
        return errors, warnings
    
    def _parse_prettier_output(self, output: str) -> List[ValidationError]:
        """Parse Prettier output for formatting issues."""
        
        warnings = []
        
        for line in output.split('\n'):
            line = line.strip()
            if line and not line.startswith('['):
                warnings.append(ValidationError(
                    file_path=line,
                    rule="formatting",
                    message="File is not formatted according to Prettier rules",
                    severity=ErrorSeverity.WARNING,
                    source="prettier",
                    auto_fixable=True,
                    suggested_fix="Run 'npx prettier --write' to fix formatting"
                ))
        
        return warnings
    
    def _is_typescript_error_fixable(self, ts_code: str) -> bool:
        """Determine if a TypeScript error is auto-fixable."""
        
        # Common auto-fixable TypeScript errors
        fixable_errors = [
            "2304",  # Cannot find name
            "2307",  # Cannot find module
            "2322",  # Type is not assignable
            "2339",  # Property does not exist
            "2345",  # Argument of type is not assignable
            "2531",  # Object is possibly null
            "2532",  # Object is possibly undefined
        ]
        
        return ts_code in fixable_errors
    
    def _calculate_overall_status(self, analysis_results: Dict[str, StaticAnalysisResult]) -> ValidationStatus:
        """Calculate overall validation status."""
        
        has_errors = any(
            result.status == ValidationStatus.FAILED 
            for result in analysis_results.values()
        )
        
        if has_errors:
            return ValidationStatus.FAILED
        
        has_warnings = any(
            result.status == ValidationStatus.WARNING 
            for result in analysis_results.values()
        )
        
        if has_warnings:
            return ValidationStatus.WARNING
        
        return ValidationStatus.PASSED
    
    def _create_analysis_summary(self, analysis_results: Dict[str, StaticAnalysisResult]) -> Dict[str, Any]:
        """Create summary of static analysis results."""
        
        total_errors = sum(len(result.errors) for result in analysis_results.values())
        total_warnings = sum(len(result.warnings) for result in analysis_results.values())
        
        tool_statuses = {
            tool: result.status.value 
            for tool, result in analysis_results.items()
        }
        
        auto_fixable_errors = sum(
            len([error for error in result.errors if error.auto_fixable])
            for result in analysis_results.values()
        )
        
        return {
            "total_errors": total_errors,
            "total_warnings": total_warnings,
            "auto_fixable_errors": auto_fixable_errors,
            "tool_statuses": tool_statuses,
            "tools_passed": len([s for s in tool_statuses.values() if s == "passed"]),
            "tools_failed": len([s for s in tool_statuses.values() if s == "failed"]),
            "overall_passing": total_errors == 0
        }
    
    async def _run_command(self, command: List[str], cwd: str = None, 
                         timeout: int = 60) -> Dict[str, Any]:
        """Run a shell command asynchronously."""
        
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            return {
                "returncode": process.returncode,
                "stdout": stdout.decode('utf-8') if stdout else "",
                "stderr": stderr.decode('utf-8') if stderr else ""
            }
            
        except asyncio.TimeoutError:
            if 'process' in locals():
                process.kill()
                await process.wait()
            raise
        except Exception as e:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e)
            }


# Global tool instance
run_static_analysis_tool = RunStaticAnalysisTool()