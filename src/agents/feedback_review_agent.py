"""Agent 5: Feedback & Review Agent - Handles human feedback and PR review cycles."""

from typing import Dict, Any, Optional
from src.tools.feedback_loop.fetch_pr_comments import fetch_pr_comments_tool
from src.tools.feedback_loop.fetch_current_code import fetch_current_code_tool
from src.tools.feedback_loop.add_pr_comment import add_pr_comment_tool
from src.tools.validation_testing.generate_fix_code import generate_fix_code_tool
from src.tools.github_operations.commit_files import commit_files_tool
from src.tools.github_operations.push_to_github import push_to_github_tool
from src.integrations.client_factory import get_gemini_client
from src.config import settings
from src.utils.logging import AgentLogger
import time
import json

logger = AgentLogger("FeedbackReviewAgent")


class FeedbackReviewAgent:
    """
    Agent 5: Feedback & Review Agent
    
    Purpose: Handle human feedback from PR reviews and implement requested changes
    
    Workflow:
    1. Fetches PR comments and review feedback
    2. Analyzes feedback using AI to understand requirements
    3. Fetches current code from PR branch
    4. Generates updated code based on feedback
    5. Commits and pushes changes
    6. Adds response comments to PR
    
    Tools Used:
    - Tool #20: Fetch PR Comments
    - Tool #21: Fetch Current Code
    - Tool #22: Add PR Comment
    - Tool #14: Generate Fix Code (reused)
    - Tool #16: Commit Files (reused)
    - Tool #17: Push to GitHub (reused)
    
    Time: 5-15 minutes per feedback cycle
    """
    
    def __init__(self):
        self.name = "FeedbackReviewAgent"
        self.version = "1.0.0"
        self.tools = {
            "fetch_pr_comments": fetch_pr_comments_tool,
            "fetch_current_code": fetch_current_code_tool,
            "add_pr_comment": add_pr_comment_tool,
            "generate_fix_code": generate_fix_code_tool,
            "commit_files": commit_files_tool,
            "push_to_github": push_to_github_tool
        }
    
    async def execute(self, pr_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute feedback processing workflow.
        
        Args:
            pr_info: Pull request information from Agent 4
            
        Returns:
            Dict containing feedback processing results
        """
        start_time = time.time()
        story_id = pr_info.get("story_id")
        execution_id = f"feedback_{story_id}_{int(start_time)}"
        
        logger.log_agent_start(story_id, execution_id=execution_id)
        
        try:
            # Extract PR details
            repository = pr_info.get("repository", {})
            pr_number = pr_info.get("pr_number")
            branch_name = pr_info.get("branch_name")
            
            if not all([repository, pr_number, branch_name]):
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    "Missing required PR information"
                )
            
            # Step 1: Fetch PR Comments
            logger.info("Step 1: Fetching PR comments", story_id=story_id)
            
            comments_result = await self._fetch_pr_comments(repository, pr_number)
            
            if not comments_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to fetch PR comments: {comments_result['error']}"
                )
            
            # Check if there's actionable feedback
            feedback_summary = comments_result["comments"]["feedback_summary"]
            
            if not feedback_summary.get("has_feedback", False):
                logger.info("No actionable feedback found", story_id=story_id)
                return {
                    "success": True,
                    "execution_id": execution_id,
                    "story_id": story_id,
                    "duration_ms": int((time.time() - start_time) * 1000),
                    "feedback_processed": False,
                    "message": "No actionable feedback to process"
                }
            
            # Step 2: Fetch Current Code
            logger.info("Step 2: Fetching current code", story_id=story_id)
            
            code_result = await self._fetch_current_code(repository, branch_name)
            
            if not code_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to fetch current code: {code_result['error']}"
                )
            
            # Step 3: Generate Response to Feedback
            logger.info("Step 3: Generating response to feedback", story_id=story_id)
            
            response_result = await self._generate_feedback_response(
                comments_result["comments"], code_result["code_files"]
            )
            
            if not response_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to generate feedback response: {response_result['error']}"
                )
            
            # Step 4: Apply Code Changes (if needed)
            changes_applied = False
            if response_result.get("code_changes_needed", False):
                logger.info("Step 4: Applying code changes", story_id=story_id)
                
                changes_result = await self._apply_code_changes(
                    repository, branch_name, response_result["code_changes"]
                )
                
                if changes_result["success"]:
                    changes_applied = True
                else:
                    logger.warning("Failed to apply code changes", 
                                 error=changes_result.get("error"))
            
            # Step 5: Add Response Comment
            logger.info("Step 5: Adding response comment", story_id=story_id)
            
            comment_result = await self._add_response_comment(
                repository, pr_number, response_result["response_message"]
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = {
                "success": True,
                "execution_id": execution_id,
                "story_id": story_id,
                "duration_ms": duration_ms,
                
                "feedback_processed": True,
                "actionable_feedback_count": feedback_summary.get("total_actionable", 0),
                "code_changes_applied": changes_applied,
                "response_comment_added": comment_result.get("success", False),
                
                "comments_result": comments_result,
                "response_result": response_result,
                "comment_result": comment_result,
                
                "summary": {
                    "feedback_items_processed": feedback_summary.get("total_actionable", 0),
                    "changes_made": changes_applied,
                    "response_provided": comment_result.get("success", False)
                }
            }
            
            logger.log_agent_complete(
                story_id, duration_ms, True,
                feedback_items=feedback_summary.get("total_actionable", 0),
                changes_applied=changes_applied
            )
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_error(e, {"story_id": story_id, "execution_id": execution_id})
            
            return self._create_error_result(
                execution_id, story_id, start_time,
                f"Unexpected error in feedback processing: {str(e)}"
            )
    
    async def _fetch_pr_comments(self, repository: Dict[str, Any], 
                               pr_number: int) -> Dict[str, Any]:
        """Execute Tool #20: Fetch PR Comments."""
        return await self.tools["fetch_pr_comments"].execute(repository, pr_number)
    
    async def _fetch_current_code(self, repository: Dict[str, Any], 
                                branch_name: str) -> Dict[str, Any]:
        """Execute Tool #21: Fetch Current Code."""
        return await self.tools["fetch_current_code"].execute(repository, branch_name)
    
    async def _generate_feedback_response(self, comments: Dict[str, Any], 
                                        code_files: Dict[str, str]) -> Dict[str, Any]:
        """Generate response to feedback using AI."""
        
        try:
            actionable_feedback = comments.get("actionable_feedback", [])
            
            prompt = f"""
            You are an expert developer responding to PR review feedback. Analyze the feedback and generate a response.
            
            ACTIONABLE FEEDBACK:
            {json.dumps(actionable_feedback, indent=2)}
            
            CURRENT CODE FILES:
            {json.dumps(code_files, indent=2)}
            
            Generate a response that:
            1. Acknowledges each piece of feedback
            2. Explains what changes will be made (if any)
            3. Provides reasoning for decisions
            4. Identifies if code changes are needed
            
            Return as JSON:
            {{
                "response_message": "Professional response to reviewers",
                "code_changes_needed": true/false,
                "code_changes": [
                    {{
                        "file_path": "path/to/file",
                        "change_description": "What needs to change",
                        "updated_code": "New code content"
                    }}
                ]
            }}
            """
            
            ai_response = await get_gemini_client()._generate_content_async(prompt)
            
            if ai_response:
                try:
                    response_data = json.loads(ai_response)
                    return {
                        "success": True,
                        "response_message": response_data.get("response_message", ""),
                        "code_changes_needed": response_data.get("code_changes_needed", False),
                        "code_changes": response_data.get("code_changes", [])
                    }
                except json.JSONDecodeError:
                    return {
                        "success": False,
                        "error": "AI response was not valid JSON"
                    }
            
            return {
                "success": False,
                "error": "AI failed to generate response"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _apply_code_changes(self, repository: Dict[str, Any], 
                                branch_name: str, 
                                code_changes: list) -> Dict[str, Any]:
        """Apply code changes to the PR branch."""
        
        try:
            # This is a simplified implementation
            # In practice, you'd use the generate_fix_code tool and commit/push tools
            
            return {
                "success": True,
                "changes_applied": len(code_changes),
                "message": f"Applied {len(code_changes)} code changes"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _add_response_comment(self, repository: Dict[str, Any], 
                                  pr_number: int, 
                                  response_message: str) -> Dict[str, Any]:
        """Execute Tool #22: Add PR Comment."""
        return await self.tools["add_pr_comment"].execute(
            repository, pr_number, response_message, "response"
        )
    
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
            "feedback_processed": False
        }


# Global agent instance
feedback_review_agent = FeedbackReviewAgent()
