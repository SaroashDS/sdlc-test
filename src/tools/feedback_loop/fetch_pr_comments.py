"""Tool #20: Fetch PR Comments - Retrieves review comments from GitHub PR."""

from typing import Dict, Any, List
from src.integrations.client_factory import get_github_client
from src.config import settings
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class FetchPRCommentsTool:
    """Tool for fetching PR review comments and feedback."""
    
    def __init__(self):
        self.name = "fetch_pr_comments"
        self.description = "Fetches review comments from GitHub pull request"
    
    async def execute(self, repository_info: Dict[str, Any], 
                     pr_number: int) -> Dict[str, Any]:
        """
        Fetch PR comments and review feedback.
        
        Args:
            repository_info: Repository information (owner, repo)
            pr_number: Pull request number
            
        Returns:
            Dict containing PR comments and metadata
        """
        start_time = time.time()
        
        try:
            owner = repository_info["owner"]
            repo = repository_info["repo"]
            
            logger.info("Fetching PR comments", 
                       owner=owner, repo=repo, pr_number=pr_number)
            
            # Get PR review comments
            review_comments = await get_github_client().get_pull_request_comments(owner, repo, pr_number)
            
            # Get general PR comments (issue comments)
            general_comments = await get_github_client().get_pr_issue_comments(owner, repo, pr_number)
            
            # Get PR reviews
            reviews = await get_github_client().get_pr_reviews(owner, repo, pr_number)
            
            # Process and categorize comments
            processed_comments = self._process_comments(review_comments, general_comments, reviews)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("PR comments fetched successfully", 
                       pr_number=pr_number,
                       total_comments=len(processed_comments["all_comments"]),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "pr_number": pr_number,
                "comments": processed_comments,
                "repository": repository_info,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error fetching PR comments", 
                        error=str(e), duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    def _process_comments(self, review_comments: List[Dict], 
                         general_comments: List[Dict], 
                         reviews: List[Dict]) -> Dict[str, Any]:
        """Process and categorize all PR feedback."""
        
        all_comments = []
        actionable_feedback = []
        
        # Process review comments (code-specific)
        for comment in review_comments:
            processed = {
                "id": comment["id"],
                "type": "review_comment",
                "author": comment["user"]["login"],
                "body": comment["body"],
                "file_path": comment.get("path"),
                "line": comment.get("line"),
                "created_at": comment["created_at"],
                "updated_at": comment["updated_at"],
                "actionable": self._is_actionable_comment(comment["body"])
            }
            all_comments.append(processed)
            
            if processed["actionable"]:
                actionable_feedback.append(processed)
        
        # Process general comments
        for comment in general_comments:
            processed = {
                "id": comment["id"],
                "type": "general_comment",
                "author": comment["user"]["login"],
                "body": comment["body"],
                "created_at": comment["created_at"],
                "updated_at": comment["updated_at"],
                "actionable": self._is_actionable_comment(comment["body"])
            }
            all_comments.append(processed)
            
            if processed["actionable"]:
                actionable_feedback.append(processed)
        
        # Process reviews
        for review in reviews:
            if review["body"]:
                processed = {
                    "id": review["id"],
                    "type": "review",
                    "author": review["user"]["login"],
                    "body": review["body"],
                    "state": review["state"],
                    "created_at": review["submitted_at"],
                    "actionable": review["state"] in ["CHANGES_REQUESTED"] or self._is_actionable_comment(review["body"])
                }
                all_comments.append(processed)
                
                if processed["actionable"]:
                    actionable_feedback.append(processed)
        
        return {
            "all_comments": all_comments,
            "actionable_feedback": actionable_feedback,
            "total_comments": len(all_comments),
            "actionable_count": len(actionable_feedback),
            "feedback_summary": self._create_feedback_summary(actionable_feedback)
        }
    
    def _is_actionable_comment(self, body: str) -> bool:
        """Determine if a comment requires action."""
        
        actionable_keywords = [
            "fix", "change", "update", "modify", "remove", "add",
            "should", "must", "need", "required", "please",
            "bug", "issue", "problem", "error", "incorrect"
        ]
        
        body_lower = body.lower()
        return any(keyword in body_lower for keyword in actionable_keywords)
    
    def _create_feedback_summary(self, actionable_feedback: List[Dict]) -> Dict[str, Any]:
        """Create summary of actionable feedback."""
        
        if not actionable_feedback:
            return {"has_feedback": False}
        
        # Group by type
        by_type = {}
        for feedback in actionable_feedback:
            feedback_type = feedback["type"]
            if feedback_type not in by_type:
                by_type[feedback_type] = []
            by_type[feedback_type].append(feedback)
        
        # Group by file
        by_file = {}
        for feedback in actionable_feedback:
            file_path = feedback.get("file_path", "general")
            if file_path not in by_file:
                by_file[file_path] = []
            by_file[file_path].append(feedback)
        
        return {
            "has_feedback": True,
            "total_actionable": len(actionable_feedback),
            "by_type": by_type,
            "by_file": by_file,
            "requires_changes": any(f.get("state") == "CHANGES_REQUESTED" for f in actionable_feedback)
        }


# Global tool instance
fetch_pr_comments_tool = FetchPRCommentsTool()
