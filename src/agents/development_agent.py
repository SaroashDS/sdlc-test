"""Agent 2: Development Agent - Generates all code, tests, and configuration files."""

from typing import Dict, Any, Optional
from src.tools.code_generation.create_directory_structure import create_directory_structure_tool
from src.tools.code_generation.generate_code_files import generate_code_files_tool
from src.tools.code_generation.generate_test_files import generate_test_files_tool
from src.tools.code_generation.generate_config_files import generate_config_files_tool
from src.tools.code_generation.generate_environment_files import generate_environment_files_tool
from src.utils.logging import AgentLogger
import time
import os

logger = AgentLogger("DevelopmentAgent")


class DevelopmentAgent:
    """
    Agent 2: Development Agent
    
    Purpose: Generate all code, tests, and configuration files
    
    Workflow:
    1. Creates folder structure (src/components, src/tests, etc.)
    2. Generates TypeScript code (React components, functions, business logic)
    3. Generates test files (Jest unit tests, React Testing Library tests)
    4. Generates configuration files (tsconfig.json, .eslintrc, .prettierrc, package.json)
    5. Generates environment files (.env.example with required variables)
    
    Tools Used:
    - Tool #5: Create Directory Structure
    - Tool #6: Generate Code Files (using Gemini)
    - Tool #7: Generate Test Files (using Gemini)
    - Tool #8: Generate Config Files
    - Tool #9: Generate Environment Files
    
    Time: 10-15 minutes
    """
    
    def __init__(self):
        self.name = "DevelopmentAgent"
        self.version = "1.0.0"
        self.tools = {
            "create_directory_structure": create_directory_structure_tool,
            "generate_code_files": generate_code_files_tool,
            "generate_test_files": generate_test_files_tool,
            "generate_config_files": generate_config_files_tool,
            "generate_environment_files": generate_environment_files_tool
        }
    
    async def execute(self, requirement_gathering_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the development workflow.
        
        Args:
            requirement_gathering_result: Result from Agent 1 (Requirement Gathering)
            
        Returns:
            Dict containing all generated files and development metadata
        """
        start_time = time.time()
        story_id = requirement_gathering_result.get("story_id")
        execution_id = f"dev_{story_id}_{int(start_time)}"
        
        logger.log_agent_start(story_id, execution_id=execution_id)
        
        try:
            # Extract required data from Agent 1 result
            implementation_plan = requirement_gathering_result.get("implementation_plan")
            figma_data = requirement_gathering_result.get("figma_data")
            repository_analysis = requirement_gathering_result.get("repository_analysis")
            
            if not implementation_plan:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    "No implementation plan provided from Requirement Gathering Agent"
                )
            
            # Step 1: Create Directory Structure
            logger.info("Step 1: Creating directory structure", story_id=story_id)
            
            directory_result = await self._create_directory_structure(implementation_plan)
            
            if not directory_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to create directory structure: {directory_result['error']}"
                )
            
            workspace_path = directory_result["workspace_path"]
            
            # Step 2: Generate Configuration Files
            logger.info("Step 2: Generating configuration files", story_id=story_id)
            
            config_result = await self._generate_config_files(
                implementation_plan, workspace_path, repository_analysis
            )
            
            if not config_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to generate configuration files: {config_result['error']}"
                )
            
            # Step 3: Generate Environment Files
            logger.info("Step 3: Generating environment files", story_id=story_id)
            
            env_result = await self._generate_environment_files(
                implementation_plan, workspace_path, repository_analysis
            )
            
            if not env_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to generate environment files: {env_result['error']}"
                )
            
            # Step 4: Generate Code Files
            logger.info("Step 4: Generating code files", story_id=story_id)
            
            code_result = await self._generate_code_files(
                implementation_plan, workspace_path, figma_data, repository_analysis
            )
            
            if not code_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to generate code files: {code_result['error']}"
                )
            
            # Step 5: Generate Test Files
            logger.info("Step 5: Generating test files", story_id=story_id)
            
            test_result = await self._generate_test_files(
                implementation_plan, workspace_path, code_result["files_generated"]
            )
            
            if not test_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to generate test files: {test_result['error']}"
                )
            
            # Create comprehensive result
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = {
                "success": True,
                "execution_id": execution_id,
                "story_id": story_id,
                "duration_ms": duration_ms,
                
                # Core outputs
                "workspace_path": workspace_path,
                "story_data": requirement_gathering_result.get("story_data"),
                "repository_info": requirement_gathering_result.get("repository_info"),
                "generated_files": self._consolidate_generated_files(
                    directory_result, config_result, env_result, code_result, test_result
                ),
                
                # Step results
                "directory_structure_result": directory_result,
                "config_files_result": config_result,
                "environment_files_result": env_result,
                "code_files_result": code_result,
                "test_files_result": test_result,
                
                # Execution metadata
                "steps_completed": 5,
                "tools_used": list(self.tools.keys()),
                
                # Summary for next agent
                "summary": self._create_execution_summary(
                    directory_result, config_result, env_result, code_result, test_result
                ),
                
                # Quality metrics
                "quality_metrics": self._calculate_quality_metrics(
                    code_result, test_result, config_result
                )
            }
            
            logger.log_agent_complete(
                story_id, duration_ms, True,
                files_generated=len(result["generated_files"]["all_files"]),
                code_files=len(result["generated_files"]["code_files"]),
                test_files=len(result["generated_files"]["test_files"])
            )
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_error(e, {"story_id": story_id, "execution_id": execution_id})
            
            return self._create_error_result(
                execution_id, story_id, start_time,
                f"Unexpected error in development: {str(e)}"
            )
    
    async def _create_directory_structure(self, implementation_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #5: Create Directory Structure."""
        tool_start = time.time()
        
        try:
            result = await self.tools["create_directory_structure"].execute(implementation_plan)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("create_directory_structure", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("create_directory_structure", duration_ms, False)
            raise
    
    async def _generate_config_files(self, implementation_plan: Dict[str, Any],
                                   workspace_path: str,
                                   repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute Tool #8: Generate Config Files."""
        tool_start = time.time()
        
        try:
            result = await self.tools["generate_config_files"].execute(
                implementation_plan, workspace_path, repository_analysis
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_config_files", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_config_files", duration_ms, False)
            raise
    
    async def _generate_environment_files(self, implementation_plan: Dict[str, Any],
                                        workspace_path: str,
                                        repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute Tool #9: Generate Environment Files."""
        tool_start = time.time()
        
        try:
            result = await self.tools["generate_environment_files"].execute(
                implementation_plan, workspace_path, repository_analysis
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_environment_files", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_environment_files", duration_ms, False)
            raise
    
    async def _generate_code_files(self, implementation_plan: Dict[str, Any],
                                 workspace_path: str,
                                 figma_data: Dict[str, Any] = None,
                                 repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute Tool #6: Generate Code Files."""
        tool_start = time.time()
        
        try:
            result = await self.tools["generate_code_files"].execute(
                implementation_plan, workspace_path, figma_data, repository_analysis
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_code_files", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_code_files", duration_ms, False)
            raise
    
    async def _generate_test_files(self, implementation_plan: Dict[str, Any],
                                 workspace_path: str,
                                 generated_code_files: list) -> Dict[str, Any]:
        """Execute Tool #7: Generate Test Files."""
        tool_start = time.time()
        
        try:
            result = await self.tools["generate_test_files"].execute(
                implementation_plan, workspace_path, generated_code_files
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_test_files", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_test_files", duration_ms, False)
            raise
    
    def _consolidate_generated_files(self, directory_result: Dict[str, Any],
                                   config_result: Dict[str, Any],
                                   env_result: Dict[str, Any],
                                   code_result: Dict[str, Any],
                                   test_result: Dict[str, Any]) -> Dict[str, Any]:
        """Consolidate all generated files into a single structure."""
        
        all_files = []
        
        # Add directories (as metadata)
        directories = directory_result.get("directories_created", [])
        
        # Add config files
        config_files = config_result.get("config_files_generated", [])
        all_files.extend(config_files)
        
        # Add environment files
        env_files = env_result.get("environment_files_generated", [])
        all_files.extend(env_files)
        
        # Add code files
        code_files = code_result.get("files_generated", [])
        all_files.extend(code_files)
        
        # Add test files
        test_files = test_result.get("test_files_generated", [])
        all_files.extend(test_files)
        
        # Categorize files
        categorized_files = {
            "directories": directories,
            "config_files": config_files,
            "environment_files": env_files,
            "code_files": code_files,
            "test_files": test_files,
            "all_files": all_files
        }
        
        # Calculate totals
        total_size = sum(f.get("size_bytes", 0) for f in all_files)
        total_lines = sum(f.get("lines_count", 0) for f in all_files)
        
        return {
            **categorized_files,
            "totals": {
                "total_files": len(all_files),
                "total_directories": len(directories),
                "total_size_bytes": total_size,
                "total_lines_of_code": total_lines
            }
        }
    
    def _create_execution_summary(self, directory_result: Dict[str, Any],
                                config_result: Dict[str, Any],
                                env_result: Dict[str, Any],
                                code_result: Dict[str, Any],
                                test_result: Dict[str, Any]) -> Dict[str, Any]:
        """Create execution summary for next agent."""
        
        # Extract key metrics
        directories_created = len(directory_result.get("directories_created", []))
        config_files_created = len(config_result.get("config_files_generated", []))
        env_files_created = len(env_result.get("environment_files_generated", []))
        code_files_created = len(code_result.get("files_generated", []))
        test_files_created = len(test_result.get("test_files_generated", []))
        
        # Calculate code metrics
        code_summary = code_result.get("summary", {})
        test_summary = test_result.get("summary", {})
        
        return {
            "directories_created": directories_created,
            "files_generated": {
                "config_files": config_files_created,
                "environment_files": env_files_created,
                "code_files": code_files_created,
                "test_files": test_files_created,
                "total_files": config_files_created + env_files_created + code_files_created + test_files_created
            },
            
            "code_metrics": {
                "total_lines_of_code": code_summary.get("total_lines_of_code", 0),
                "total_size_bytes": code_summary.get("total_size_bytes", 0),
                "file_types_generated": code_summary.get("file_types_generated", {}),
                "success_rate": code_summary.get("success_rate", 100)
            },
            
            "test_metrics": {
                "total_test_files": test_summary.get("total_test_files_generated", 0),
                "total_test_lines": test_summary.get("total_test_lines", 0),
                "test_success_rate": test_summary.get("success_rate", 100),
                "estimated_coverage": test_summary.get("estimated_coverage", "80%")
            },
            
            "security_scan": {
                "code_security_issues": len(code_result.get("security_scan", [])),
                "env_security_issues": len(env_result.get("security_scan", []))
            },
            
            "ready_for_validation": True,
            "next_agent": "TestingDebuggingAgent"
        }
    
    def _calculate_quality_metrics(self, code_result: Dict[str, Any],
                                 test_result: Dict[str, Any],
                                 config_result: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate quality metrics for the generated code."""
        
        code_summary = code_result.get("summary", {})
        test_summary = test_result.get("summary", {})
        
        # Code quality metrics
        code_files_count = code_summary.get("total_files_generated", 0)
        code_generation_success_rate = code_summary.get("success_rate", 100)
        
        # Test quality metrics
        test_files_count = test_summary.get("total_test_files_generated", 0)
        test_generation_success_rate = test_summary.get("success_rate", 100)
        
        # Calculate test coverage ratio
        test_coverage_ratio = (test_files_count / code_files_count * 100) if code_files_count > 0 else 0
        
        # Security metrics
        security_issues = len(code_result.get("security_scan", []))
        
        # Overall quality score (0-100)
        quality_score = (
            (code_generation_success_rate * 0.3) +
            (test_generation_success_rate * 0.3) +
            (min(test_coverage_ratio, 100) * 0.2) +
            (max(0, 100 - security_issues * 10) * 0.2)
        )
        
        return {
            "overall_quality_score": round(quality_score, 1),
            "code_generation_success_rate": code_generation_success_rate,
            "test_generation_success_rate": test_generation_success_rate,
            "test_coverage_ratio": round(test_coverage_ratio, 1),
            "security_issues_count": security_issues,
            "quality_gates": {
                "code_generated": code_files_count > 0,
                "tests_generated": test_files_count > 0,
                "configs_generated": len(config_result.get("config_files_generated", [])) > 0,
                "no_critical_security_issues": security_issues == 0
            }
        }
    
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
            "workspace_path": None,
            "generated_files": {
                "all_files": [],
                "totals": {
                    "total_files": 0,
                    "total_directories": 0,
                    "total_size_bytes": 0,
                    "total_lines_of_code": 0
                }
            }
        }
    
    async def validate_workspace(self, workspace_path: str) -> Dict[str, Any]:
        """
        Validate the generated workspace (optional pre-check for Agent 3).
        
        Args:
            workspace_path: Path to the generated workspace
            
        Returns:
            Validation result
        """
        try:
            if not os.path.exists(workspace_path):
                return {
                    "valid": False,
                    "error": f"Workspace path does not exist: {workspace_path}"
                }
            
            # Check for essential files
            essential_files = ["package.json", "tsconfig.json", "src"]
            missing_files = []
            
            for file_path in essential_files:
                full_path = os.path.join(workspace_path, file_path)
                if not os.path.exists(full_path):
                    missing_files.append(file_path)
            
            if missing_files:
                return {
                    "valid": False,
                    "error": f"Missing essential files: {', '.join(missing_files)}"
                }
            
            # Count generated files
            total_files = 0
            for root, dirs, files in os.walk(workspace_path):
                total_files += len(files)
            
            return {
                "valid": True,
                "workspace_path": workspace_path,
                "total_files": total_files,
                "message": f"Workspace validation passed with {total_files} files"
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Workspace validation failed: {str(e)}"
            }


# Global agent instance
development_agent = DevelopmentAgent()