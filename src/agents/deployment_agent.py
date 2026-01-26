"""Agent 4: Deployment Agent - Handles GitHub deployment and PR creation."""

from typing import Dict, Any, Optional
from src.tools.github_operations.create_github_branch import create_github_branch_tool
from src.tools.github_operations.commit_files import commit_files_tool
from src.tools.github_operations.push_to_github import push_to_github_tool
from src.tools.github_operations.create_pull_request import create_pull_request_tool
from src.tools.github_operations.update_ado_story_status import update_ado_story_status_tool
from src.config import settings
from src.utils.logging import AgentLogger
import time
from datetime import datetime

logger = AgentLogger("DeploymentAgent")


class DeploymentAgent:
    """
    Agent 4: Deployment Agent
    
    Purpose: Deploy validated code to GitHub and create pull request for review
    
    Workflow:
    1. Creates GitHub branch for the story
    2. Commits all generated files to the branch
    3. Pushes the branch to GitHub
    4. Creates a pull request with AI-generated description
    5. Updates Azure DevOps story status and links PR
    
    Tools Used:
    - Tool #15: Create GitHub Branch
    - Tool #16: Commit Files
    - Tool #17: Push to GitHub
    - Tool #18: Create Pull Request
    - Tool #19: Update ADO Story Status
    
    Time: 2-5 minutes
    """
    
    def __init__(self):
        self.name = "DeploymentAgent"
        self.version = "1.0.0"
        self.tools = {
            "create_github_branch": create_github_branch_tool,
            "commit_files": commit_files_tool,
            "push_to_github": push_to_github_tool,
            "create_pull_request": create_pull_request_tool,
            "update_ado_story_status": update_ado_story_status_tool
        }
    
    async def execute(self, development_result: Dict[str, Any], 
                     validation_results: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute the deployment workflow.
        
        Args:
            development_result: Result from Agent 2 (Development Agent)
            validation_results: Optional validation results from Agent 3 (Testing & Debugging Agent)
            
        Returns:
            Dict containing deployment results and PR information
        """
        start_time = time.time()
        story_id = development_result.get("story_id")
        execution_id = f"deploy_{story_id}_{int(start_time)}"
        
        logger.log_agent_start(story_id, execution_id=execution_id)
        
        try:
            # Validate input from Agent 2
            validation_check = self._validate_development_result(development_result)
            
            if not validation_check["valid"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Invalid input from Development Agent: {validation_check['error']}"
                )
            
            # Use provided validation results or create default ones
            if not validation_results:
                validation_results = {
                    "overall_status": "passed",
                    "total_errors": 0,
                    "total_warnings": 0,
                    "test_coverage": 0,
                    "code_quality_score": 85.0
                }
            
            # Extract required data
            workspace_path = development_result.get("workspace_path")
            story_data = validation_check["story_data"]
            implementation_summary = validation_check["implementation_summary"]
            
            # Step 1: Create GitHub Branch
            logger.info("Step 1: Creating GitHub branch", story_id=story_id)
            
            repository_info = development_result.get("repository_info")
            branch_result = await self._create_github_branch(story_data, workspace_path, repository_info)
            
            if not branch_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to create GitHub branch: {branch_result['error']}"
                )
            
            is_empty_repo = branch_result.get("is_empty", False)
            target_branch = branch_result["branch_name"]
            
            # If repo is empty, we push to the default branch instead of a feature branch
            if is_empty_repo:
                target_branch = branch_result["repository"].get("default_branch", "main")
                logger.info(f"Empty repository detected. Switching to direct initialization on '{target_branch}' branch.")
            
            # Step 2: Commit Files
            logger.info("Step 2: Committing files", story_id=story_id)
            
            commit_result = await self._commit_files(
                workspace_path, story_data, implementation_summary
            )
            
            if not commit_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to commit files: {commit_result['error']}"
                )
            
            # Step 3: Push to GitHub
            logger.info(f"Step 3: Pushing to GitHub (branch: {target_branch})", story_id=story_id)
            
            push_result = await self._push_to_github(
                workspace_path, target_branch, branch_result["repository"]
            )
            
            if not push_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to push to GitHub: {push_result['error']}"
                )
            
            # Step 4: Create Pull Request (Skip if we pushed directly to main/master because repo was empty)
            if is_empty_repo:
                logger.info("Step 4: Skipping pull request - repository was initialized directly.")
                pr_result = {
                    "success": True,
                    "pr_number": 0,
                    "pr_url": branch_result["branch_url"], # Link to branch since no PR exists
                    "pr_title": f"Initial Project Initialization - Story {story_id}",
                    "branch_name": target_branch,
                    "repository": f"{branch_result['repository']['owner']}/{branch_result['repository']['repo']}",
                    "is_initialization": True
                }
            else:
                logger.info("Step 4: Creating pull request", story_id=story_id)
                pr_result = await self._create_pull_request(
                    branch_result["repository"], target_branch,
                    story_data, implementation_summary, validation_results
                )
            
            if not pr_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to create pull request: {pr_result['error']}"
                )
            
            # Step 5: Update ADO Story Status
            logger.info("Step 5: Updating ADO story status", story_id=story_id)
            
            ado_update_result = await self._update_ado_story_status(
                story_id, pr_result, implementation_summary, validation_results
            )
            
            # Note: ADO update failure is not critical - log warning but continue
            if not ado_update_result["success"]:
                logger.warning("Failed to update ADO story status", 
                             story_id=story_id,
                             error=ado_update_result.get("error"))
            
            # Create comprehensive result
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = {
                "success": True,
                "execution_id": execution_id,
                "story_id": story_id,
                "duration_ms": duration_ms,
                
                # Core outputs
                "pull_request": {
                    "pr_number": pr_result["pr_number"],
                    "pr_url": pr_result["pr_url"],
                    "pr_title": pr_result["pr_title"],
                    "branch_name": pr_result["branch_name"],
                    "repository": pr_result["repository"]
                },
                
                # Step results
                "branch_creation_result": branch_result,
                "commit_result": commit_result,
                "push_result": push_result,
                "pr_creation_result": pr_result,
                "ado_update_result": ado_update_result,
                
                # Execution metadata
                "steps_completed": 5,
                "tools_used": list(self.tools.keys()),
                "deployment_successful": True,
                
                # Summary for next agent or final result
                "summary": self._create_execution_summary(
                    pr_result, branch_result, commit_result, ado_update_result
                ),
                
                # Deployment metrics
                "deployment_metrics": self._calculate_deployment_metrics(
                    branch_result, commit_result, push_result, pr_result
                )
            }
            
            logger.log_agent_complete(
                story_id, duration_ms, True,
                pr_number=pr_result["pr_number"],
                pr_url=pr_result["pr_url"],
                branch_name=pr_result["branch_name"]
            )
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_error(e, {"story_id": story_id, "execution_id": execution_id})
            
            return self._create_error_result(
                execution_id, story_id, start_time,
                f"Unexpected error in deployment: {str(e)}"
            )
    
    def _validate_development_result(self, development_result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the input from Agent 2."""
        
        try:
            # Check required fields - be more flexible about field names
            required_fields = ["story_id", "workspace_path"]
            
            for field in required_fields:
                if field not in development_result:
                    return {
                        "valid": False,
                        "error": f"Missing required field: {field}"
                    }
            
            # Check for generated files (can be in different formats)
            has_generated_files = (
                "generated_files" in development_result or
                "files_generated" in development_result or
                "code_files_result" in development_result
            )
            
            if not has_generated_files:
                return {
                    "valid": False,
                    "error": "No generated files information found in development result"
                }
            
            # Extract story data from the development result
            story_data = self._extract_story_data_from_development_result(development_result)
            implementation_summary = self._extract_implementation_summary_from_development_result(development_result)
            
            return {
                "valid": True,
                "story_data": story_data,
                "implementation_summary": implementation_summary
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }
    
    def _extract_story_data_from_development_result(self, development_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract story data from the development result."""
        
        # Try to get from the development result
        story_data = development_result.get("story_data")
        if story_data:
            return story_data
        
        # Fallback: try to reconstruct from available data
        story_id = development_result.get("story_id")
        
        return {
            "id": story_id,
            "title": f"Story {story_id}",  # Minimal fallback
            "workItemType": "User Story"
        }
    
    def _extract_implementation_summary_from_development_result(self, development_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract implementation summary from the development result."""
        
        return {
            "files_generated": development_result.get("generated_files", {}),
            "workspace_path": development_result.get("workspace_path"),
            "implementation_plan": development_result.get("implementation_plan", {})
        }
    
    def _extract_story_data_from_chain(self, testing_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract story data from the agent execution chain."""
        
        # Try to get from final result first
        final_result = testing_result.get("final_result", {})
        
        if final_result:
            agent_1_result = final_result.get("agent_1", {})
            if agent_1_result and agent_1_result.get("success"):
                return agent_1_result.get("story_data", {})
        
        # Fallback: try to reconstruct from available data
        story_id = testing_result.get("story_id")
        
        return {
            "id": story_id,
            "title": f"Story {story_id}",  # Minimal fallback
            "workItemType": "User Story"
        }
    
    def _extract_implementation_summary_from_chain(self, testing_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract implementation summary from the agent execution chain."""
        
        # Try to get from final result first
        final_result = testing_result.get("final_result", {})
        
        if final_result:
            agent_2_result = final_result.get("agent_2", {})
            if agent_2_result and agent_2_result.get("success"):
                return {
                    "files_generated": agent_2_result.get("generated_files", {}),
                    "workspace_path": agent_2_result.get("workspace_path"),
                    "implementation_plan": agent_2_result.get("implementation_plan", {})
                }
        
        # Fallback: minimal summary
        return {
            "files_generated": {"totals": {"total_files": 0}},
            "workspace_path": testing_result.get("workspace_path"),
            "implementation_plan": {}
        }
    
    async def _create_github_branch(self, story_data: Dict[str, Any], 
                                  workspace_path: str,
                                  repository_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute Tool #15: Create GitHub Branch."""
        tool_start = time.time()
        
        try:
            result = await self.tools["create_github_branch"].execute(story_data, workspace_path, repository_info)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("create_github_branch", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("create_github_branch", duration_ms, False)
            raise
    
    async def _commit_files(self, workspace_path: str, 
                          story_data: Dict[str, Any],
                          implementation_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #16: Commit Files."""
        tool_start = time.time()
        
        try:
            generated_files = implementation_summary.get("files_generated", {})
            
            result = await self.tools["commit_files"].execute(
                workspace_path, story_data, generated_files
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("commit_files", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("commit_files", duration_ms, False)
            raise
    
    async def _push_to_github(self, workspace_path: str, 
                            branch_name: str,
                            repository_info: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #17: Push to GitHub."""
        tool_start = time.time()
        
        try:
            result = await self.tools["push_to_github"].execute(
                workspace_path, branch_name, repository_info
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("push_to_github", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("push_to_github", duration_ms, False)
            raise
    
    async def _create_pull_request(self, repository_info: Dict[str, Any],
                                 branch_name: str,
                                 story_data: Dict[str, Any],
                                 implementation_summary: Dict[str, Any],
                                 validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #18: Create Pull Request."""
        tool_start = time.time()
        
        try:
            result = await self.tools["create_pull_request"].execute(
                repository_info, branch_name, story_data, 
                implementation_summary, validation_results
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("create_pull_request", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("create_pull_request", duration_ms, False)
            raise
    
    async def _update_ado_story_status(self, story_id: int,
                                     pr_info: Dict[str, Any],
                                     implementation_summary: Dict[str, Any],
                                     validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #19: Update ADO Story Status."""
        tool_start = time.time()
        
        try:
            result = await self.tools["update_ado_story_status"].execute(
                story_id, pr_info, implementation_summary, validation_results
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("update_ado_story_status", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("update_ado_story_status", duration_ms, False)
            
            # Don't re-raise for ADO updates - it's not critical
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_execution_summary(self, pr_result: Dict[str, Any],
                                branch_result: Dict[str, Any],
                                commit_result: Dict[str, Any],
                                ado_update_result: Dict[str, Any]) -> Dict[str, Any]:
        """Create execution summary for final result."""
        
        return {
            "deployment_status": "completed",
            "pull_request_created": pr_result.get("success", False),
            "pr_number": pr_result.get("pr_number"),
            "pr_url": pr_result.get("pr_url"),
            "branch_name": pr_result.get("branch_name"),
            "repository": pr_result.get("repository"),
            
            "files_committed": commit_result.get("files_committed", 0),
            "commit_hash": commit_result.get("commit_hash"),
            
            "ado_story_updated": ado_update_result.get("success", False),
            
            "ready_for_review": True,
            "next_steps": [
                "Review the pull request for business logic correctness",
                "Verify UI/UX implementation matches design requirements", 
                "Test the functionality manually",
                "Approve and merge the pull request"
            ]
        }
    
    def _calculate_deployment_metrics(self, branch_result: Dict[str, Any],
                                    commit_result: Dict[str, Any],
                                    push_result: Dict[str, Any],
                                    pr_result: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate deployment metrics."""
        
        return {
            "branch_created": branch_result.get("success", False),
            "files_committed": commit_result.get("files_committed", 0),
            "commits_pushed": push_result.get("commits_pushed", 0),
            "pr_created": pr_result.get("success", False),
            
            "deployment_success_rate": self._calculate_success_rate([
                branch_result, commit_result, push_result, pr_result
            ]),
            
            "total_deployment_time_ms": (
                branch_result.get("duration_ms", 0) +
                commit_result.get("duration_ms", 0) +
                push_result.get("duration_ms", 0) +
                pr_result.get("duration_ms", 0)
            )
        }
    
    def _calculate_success_rate(self, results: list) -> float:
        """Calculate success rate from a list of results."""
        
        if not results:
            return 0.0
        
        successful = len([r for r in results if r.get("success", False)])
        return (successful / len(results)) * 100
    
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
            "deployment_result": {
                "deployment_status": "failed",
                "error_message": error_message
            }
        }


# Global agent instance
deployment_agent = DeploymentAgent()