"""Tool #12: Run Tests - Executes Jest tests and checks code coverage."""

import os
import asyncio
import json
from typing import Dict, Any, List, Optional
from src.config import settings
from src.utils.logging import get_logger
from src.models.validation_result import (
    TestSuiteResult, TestResult, CoverageResult, ValidationStatus
)
import time
import re

logger = get_logger(__name__)


class RunTestsTool:
    """Tool for running Jest tests and checking code coverage."""
    
    def __init__(self):
        self.name = "run_tests"
        self.description = "Runs Jest tests and checks code coverage"
    
    async def execute(self, workspace_path: str, 
                     coverage_threshold: int = 80,
                     test_pattern: str = None) -> Dict[str, Any]:
        """
        Run tests in the workspace.
        
        Args:
            workspace_path: Path to the workspace
            coverage_threshold: Minimum code coverage percentage required
            test_pattern: Optional test file pattern to run specific tests
            
        Returns:
            Dict containing test results and coverage information
        """
        start_time = time.time()
        
        try:
            logger.info("Running tests", workspace_path=workspace_path)
            
            # Validate workspace
            if not os.path.exists(workspace_path):
                return {
                    "success": False,
                    "error": f"Workspace path does not exist: {workspace_path}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Check if Jest is available
            jest_check = await self._check_jest_availability(workspace_path)
            if not jest_check["available"]:
                return {
                    "success": False,
                    "error": f"Jest not available: {jest_check['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Run tests with coverage
            test_result = await self._run_jest_tests(workspace_path, test_pattern)
            
            if not test_result["success"]:
                return {
                    "success": False,
                    "error": f"Test execution failed: {test_result['error']}",
                    "test_output": test_result.get("output", ""),
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Parse test results
            parsed_results = await self._parse_test_results(
                test_result["output"], workspace_path
            )
            
            # Parse coverage results
            coverage_results = await self._parse_coverage_results(workspace_path)
            
            # Create test suite result
            test_suite_result = TestSuiteResult(
                status=self._determine_test_status(parsed_results, coverage_results, coverage_threshold),
                tests_passed=parsed_results["tests_passed"],
                tests_failed=parsed_results["tests_failed"],
                tests_skipped=parsed_results["tests_skipped"],
                duration_ms=parsed_results["duration_ms"],
                test_results=parsed_results["individual_tests"],
                coverage=coverage_results
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Tests completed", 
                       workspace_path=workspace_path,
                       tests_passed=test_suite_result.tests_passed,
                       tests_failed=test_suite_result.tests_failed,
                       coverage=test_suite_result.overall_coverage_percent,
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "workspace_path": workspace_path,
                "test_suite_result": test_suite_result.dict(),
                "jest_info": jest_check,
                "coverage_threshold": coverage_threshold,
                "coverage_met": test_suite_result.overall_coverage_percent >= coverage_threshold,
                "summary": self._create_test_summary(test_suite_result, coverage_threshold),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error running tests", 
                        workspace_path=workspace_path,
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    async def _check_jest_availability(self, workspace_path: str) -> Dict[str, Any]:
        """Check if Jest is available and configured."""
        
        try:
            # Check if Jest is installed
            result = await self._run_command(
                ["npx", "jest", "--version"],
                cwd=workspace_path
            )
            
            if result["returncode"] != 0:
                return {
                    "available": False,
                    "error": "Jest not found or not working"
                }
            
            # Check for Jest configuration
            config_files = ["jest.config.js", "jest.config.json", "package.json"]
            config_found = False
            
            for config_file in config_files:
                config_path = os.path.join(workspace_path, config_file)
                if os.path.exists(config_path):
                    if config_file == "package.json":
                        # Check if package.json has jest config
                        try:
                            with open(config_path, 'r') as f:
                                package_data = json.loads(f.read())
                                if "jest" in package_data:
                                    config_found = True
                                    break
                        except:
                            pass
                    else:
                        config_found = True
                        break
            
            return {
                "available": True,
                "version": result["stdout"].strip(),
                "config_found": config_found
            }
            
        except Exception as e:
            return {
                "available": False,
                "error": str(e)
            }
    
    async def _run_jest_tests(self, workspace_path: str, 
                            test_pattern: str = None) -> Dict[str, Any]:
        """Run Jest tests with coverage."""
        
        try:
            # Build Jest command
            command = [
                "npx", "jest",
                "--coverage",
                "--json",
                "--outputFile=test-results.json",
                "--coverageReporters=json",
                "--coverageReporters=text",
                "--passWithNoTests"
            ]
            
            # Add test pattern if specified
            if test_pattern:
                command.append(test_pattern)
            
            # Run Jest
            result = await self._run_command(
                command,
                cwd=workspace_path,
                timeout=300  # 5 minutes timeout
            )
            
            # Jest returns non-zero exit code if tests fail, but that's expected
            # We consider it successful if Jest ran (even with failing tests)
            output = result["stdout"] + result["stderr"]
            
            return {
                "success": True,
                "output": output,
                "returncode": result["returncode"]
            }
            
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Jest tests timed out after 5 minutes"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _parse_test_results(self, output: str, workspace_path: str) -> Dict[str, Any]:
        """Parse Jest test results."""
        
        results = {
            "tests_passed": 0,
            "tests_failed": 0,
            "tests_skipped": 0,
            "duration_ms": 0,
            "individual_tests": []
        }
        
        try:
            # Try to read JSON results file
            results_file = os.path.join(workspace_path, "test-results.json")
            if os.path.exists(results_file):
                with open(results_file, 'r') as f:
                    jest_results = json.loads(f.read())
                
                # Parse Jest JSON results
                results["tests_passed"] = jest_results.get("numPassedTests", 0)
                results["tests_failed"] = jest_results.get("numFailedTests", 0)
                results["tests_skipped"] = jest_results.get("numPendingTests", 0)
                results["duration_ms"] = jest_results.get("testResults", [{}])[0].get("perfStats", {}).get("runtime", 0)
                
                # Parse individual test results
                for test_suite in jest_results.get("testResults", []):
                    file_path = test_suite.get("name", "unknown")
                    
                    for assertion in test_suite.get("assertionResults", []):
                        test_result = TestResult(
                            test_name=assertion.get("title", "unknown"),
                            file_path=file_path,
                            status=ValidationStatus.PASSED if assertion.get("status") == "passed" else ValidationStatus.FAILED,
                            duration_ms=assertion.get("duration", 0),
                            error_message=assertion.get("failureMessages", [None])[0] if assertion.get("failureMessages") else None
                        )
                        results["individual_tests"].append(test_result)
                
                # Clean up results file
                os.remove(results_file)
            
            else:
                # Fallback: parse text output
                results = self._parse_text_output(output)
        
        except Exception as e:
            logger.warning("Error parsing test results", error=str(e))
            # Fallback to text parsing
            results = self._parse_text_output(output)
        
        return results
    
    def _parse_text_output(self, output: str) -> Dict[str, Any]:
        """Parse Jest text output as fallback."""
        
        results = {
            "tests_passed": 0,
            "tests_failed": 0,
            "tests_skipped": 0,
            "duration_ms": 0,
            "individual_tests": []
        }
        
        # Look for test summary patterns
        patterns = {
            "passed": r"(\d+) passed",
            "failed": r"(\d+) failed",
            "skipped": r"(\d+) skipped",
            "pending": r"(\d+) pending"
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                count = int(match.group(1))
                if key == "passed":
                    results["tests_passed"] = count
                elif key == "failed":
                    results["tests_failed"] = count
                elif key in ["skipped", "pending"]:
                    results["tests_skipped"] += count
        
        # Look for time information
        time_match = re.search(r"Time:\s*(\d+(?:\.\d+)?)\s*s", output)
        if time_match:
            results["duration_ms"] = int(float(time_match.group(1)) * 1000)
        
        return results
    
    async def _parse_coverage_results(self, workspace_path: str) -> List[CoverageResult]:
        """Parse Jest coverage results."""
        
        coverage_results = []
        
        try:
            # Look for coverage JSON file
            coverage_file = os.path.join(workspace_path, "coverage", "coverage-final.json")
            if os.path.exists(coverage_file):
                with open(coverage_file, 'r') as f:
                    coverage_data = json.loads(f.read())
                
                for file_path, file_coverage in coverage_data.items():
                    # Extract coverage metrics
                    statements = file_coverage.get("s", {})
                    functions = file_coverage.get("f", {})
                    branches = file_coverage.get("b", {})
                    lines = file_coverage.get("statementMap", {})
                    
                    # Calculate coverage
                    lines_covered = sum(1 for count in statements.values() if count > 0)
                    lines_total = len(statements)
                    
                    functions_covered = sum(1 for count in functions.values() if count > 0)
                    functions_total = len(functions)
                    
                    branches_covered = sum(
                        sum(1 for branch_count in branch_data if branch_count > 0)
                        for branch_data in branches.values()
                    )
                    branches_total = sum(len(branch_data) for branch_data in branches.values())
                    
                    coverage_result = CoverageResult(
                        file_path=file_path,
                        lines_covered=lines_covered,
                        lines_total=lines_total,
                        functions_covered=functions_covered,
                        functions_total=functions_total,
                        branches_covered=branches_covered,
                        branches_total=branches_total
                    )
                    
                    coverage_results.append(coverage_result)
        
        except Exception as e:
            logger.warning("Error parsing coverage results", error=str(e))
        
        return coverage_results
    
    def _determine_test_status(self, test_results: Dict[str, Any], 
                             coverage_results: List[CoverageResult],
                             coverage_threshold: int) -> ValidationStatus:
        """Determine overall test status."""
        
        # Check if any tests failed
        if test_results["tests_failed"] > 0:
            return ValidationStatus.FAILED
        
        # Check coverage threshold
        if coverage_results:
            total_lines = sum(c.lines_total for c in coverage_results)
            covered_lines = sum(c.lines_covered for c in coverage_results)
            
            if total_lines > 0:
                coverage_percent = (covered_lines / total_lines) * 100
                if coverage_percent < coverage_threshold:
                    return ValidationStatus.WARNING
        
        # Check if no tests were run
        total_tests = test_results["tests_passed"] + test_results["tests_failed"] + test_results["tests_skipped"]
        if total_tests == 0:
            return ValidationStatus.WARNING
        
        return ValidationStatus.PASSED
    
    def _create_test_summary(self, test_suite_result: TestSuiteResult, 
                           coverage_threshold: int) -> Dict[str, Any]:
        """Create summary of test results."""
        
        return {
            "total_tests": test_suite_result.total_tests,
            "tests_passed": test_suite_result.tests_passed,
            "tests_failed": test_suite_result.tests_failed,
            "tests_skipped": test_suite_result.tests_skipped,
            "pass_rate": test_suite_result.pass_rate,
            "overall_coverage": test_suite_result.overall_coverage_percent,
            "coverage_threshold": coverage_threshold,
            "coverage_met": test_suite_result.overall_coverage_percent >= coverage_threshold,
            "status": test_suite_result.status.value,
            "duration_seconds": test_suite_result.duration_ms / 1000,
            "files_with_coverage": len(test_suite_result.coverage)
        }
    
    async def _run_command(self, command: List[str], cwd: str = None, 
                         timeout: int = 300) -> Dict[str, Any]:
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
run_tests_tool = RunTestsTool()