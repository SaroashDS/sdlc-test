"""Mock clients for testing without real API credentials."""

from typing import Dict, Any, List, Optional
from src.mock_data.mock_ado_data import mock_ado_story, mock_story_validation
from src.mock_data.mock_figma_data import mock_figma_design, mock_design_analysis
from src.mock_data.mock_github_data import mock_github_repo, mock_github_operations
from src.utils.logging import get_logger
import time
import asyncio

logger = get_logger(__name__)


class MockAzureDevOpsClient:
    """Mock Azure DevOps client for testing."""
    
    def __init__(self):
        self.organization = "mock-org"
        self.project = "mock-project"
        logger.info("Using Mock Azure DevOps Client")
    
    async def get_work_item(self, work_item_id: int) -> Optional[Dict[str, Any]]:
        """Mock get work item - returns dict format like real client."""
        logger.info(f"Mock: Fetching work item {work_item_id}")
        await asyncio.sleep(0.5)  # Simulate API delay
        
        if work_item_id == 12345:
            return mock_ado_story
        else:
            # Return a generic mock story for any other ID
            story = mock_ado_story.copy()
            story["id"] = work_item_id
            story["fields"]["System.Id"] = work_item_id
            story["fields"]["System.Title"] = f"Mock Story {work_item_id}"
            return story
    
    async def validate_story_readiness(self, story_id: int) -> Dict[str, Any]:
        """Mock story validation."""
        logger.info(f"Mock: Validating story {story_id}")
        await asyncio.sleep(0.3)
        
        validation = mock_story_validation.copy()
        validation["story_id"] = story_id
        return validation
    
    async def update_work_item(self, work_item_id: int, updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Mock update work item."""
        logger.info(f"Mock: Updating work item {work_item_id}")
        await asyncio.sleep(0.5)
        
        return {
            "success": True,
            "work_item": {"id": work_item_id, "updated": True}
        }
    
    async def add_hyperlink_to_work_item(self, work_item_id: int, url: str, comment: str = "") -> Dict[str, Any]:
        """Mock add hyperlink."""
        logger.info(f"Mock: Adding hyperlink to work item {work_item_id}")
        await asyncio.sleep(0.3)
        
        return {
            "success": True,
            "work_item": {"id": work_item_id, "hyperlink_added": url}
        }
    
    async def add_comment_to_work_item(self, work_item_id: int, comment_text: str) -> Dict[str, Any]:
        """Mock add comment."""
        logger.info(f"Mock: Adding comment to work item {work_item_id}")
        await asyncio.sleep(0.3)
        
        return {
            "success": True,
            "work_item": {"id": work_item_id, "comment_added": True}
        }
    
    async def close(self):
        """Mock close."""
        logger.info("Mock ADO client closed")


class MockFigmaClient:
    """Mock Figma client for testing."""
    
    def __init__(self):
        logger.info("Using Mock Figma Client")
    
    async def get_file(self, file_key: str) -> Optional[Dict[str, Any]]:
        """Mock get Figma file."""
        logger.info(f"Mock: Fetching Figma file {file_key}")
        await asyncio.sleep(0.8)  # Simulate API delay
        
        return mock_figma_design
    
    async def analyze_design_file(self, file_key: str) -> Dict[str, Any]:
        """Mock analyze design file."""
        logger.info(f"Mock: Analyzing Figma design {file_key}")
        await asyncio.sleep(1.0)
        
        return mock_design_analysis
    
    async def close(self):
        """Mock close."""
        logger.info("Mock Figma client closed")


class MockGitHubClient:
    """Mock GitHub client for testing."""
    
    def __init__(self):
        logger.info("Using Mock GitHub Client")
    
    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """Mock get repository."""
        logger.info(f"Mock: Fetching repository {owner}/{repo}")
        await asyncio.sleep(0.5)
        
        return {
            "name": repo,
            "full_name": f"{owner}/{repo}",
            "owner": {"login": owner},
            "default_branch": "main",
            "language": "TypeScript"
        }
    
    async def analyze_repository_structure(self, owner: str, repo: str) -> Dict[str, Any]:
        """Mock analyze repository."""
        logger.info(f"Mock: Analyzing repository {owner}/{repo}")
        await asyncio.sleep(1.2)
        
        return mock_github_repo["analysis"]
    
    async def create_branch(self, owner: str, repo: str, branch_name: str, base_branch: str = "main") -> Dict[str, Any]:
        """Mock create branch."""
        logger.info(f"Mock: Creating branch {branch_name}")
        await asyncio.sleep(0.5)
        
        result = mock_github_operations["create_branch"].copy()
        result["branch_name"] = branch_name
        return result
    
    async def create_or_update_file(self, owner: str, repo: str, path: str, content: str, 
                                   message: str, branch: str, sha: Optional[str] = None) -> bool:
        """Mock create/update file."""
        logger.info(f"Mock: Creating/updating file {path}")
        await asyncio.sleep(0.3)
        return True
    
    async def create_pull_request(self, owner: str, repo: str, title: str, body: str, 
                                 head: str, base: str = "main") -> Dict[str, Any]:
        """Mock create PR."""
        logger.info(f"Mock: Creating PR '{title}'")
        await asyncio.sleep(0.7)
        
        result = mock_github_operations["create_pull_request"].copy()
        result["pr_title"] = title
        return result
    
    async def get_branch(self, owner: str, repo: str, branch: str) -> Dict[str, Any]:
        """Mock get branch."""
        logger.info(f"Mock: Getting branch {branch}")
        await asyncio.sleep(0.3)
        
        return {
            "success": True,
            "sha": "abc123def456",
            "commit": {"sha": "abc123def456"}
        }
    
    async def add_labels_to_pr(self, owner: str, repo: str, pr_number: int, labels: List[str]) -> Dict[str, Any]:
        """Mock add labels."""
        logger.info(f"Mock: Adding labels to PR {pr_number}")
        await asyncio.sleep(0.2)
        
        return {
            "success": True,
            "labels_added": labels
        }
    
    async def request_pr_reviewers(self, owner: str, repo: str, pr_number: int, reviewers: List[str]) -> Dict[str, Any]:
        """Mock request reviewers."""
        logger.info(f"Mock: Requesting reviewers for PR {pr_number}")
        await asyncio.sleep(0.2)
        
        return {
            "success": True,
            "reviewers_added": reviewers
        }
    
    async def assign_pr(self, owner: str, repo: str, pr_number: int, assignees: List[str]) -> Dict[str, Any]:
        """Mock assign PR."""
        logger.info(f"Mock: Assigning PR {pr_number}")
        await asyncio.sleep(0.2)
        
        return {
            "success": True,
            "assignees_added": assignees
        }
    
    async def get_pull_request_comments(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Mock get PR comments."""
        logger.info(f"Mock: Getting PR {pr_number} comments")
        await asyncio.sleep(0.3)
        
        return [
            {
                "id": 1,
                "user": {"login": "reviewer1"},
                "body": "Looks good! Just a small suggestion on the error handling.",
                "created_at": "2024-12-29T12:00:00Z",
                "updated_at": "2024-12-29T12:00:00Z",
                "path": "src/components/Dashboard.tsx",
                "line": 45
            }
        ]
    
    async def get_pr_issue_comments(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Mock get PR issue comments."""
        logger.info(f"Mock: Getting PR {pr_number} issue comments")
        await asyncio.sleep(0.3)
        
        return [
            {
                "id": 2,
                "user": {"login": "reviewer2"},
                "body": "Great work on the dashboard! The charts look fantastic.",
                "created_at": "2024-12-29T12:30:00Z",
                "updated_at": "2024-12-29T12:30:00Z"
            }
        ]
    
    async def get_pr_reviews(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Mock get PR reviews."""
        logger.info(f"Mock: Getting PR {pr_number} reviews")
        await asyncio.sleep(0.3)
        
        return [
            {
                "id": 3,
                "user": {"login": "senior-dev"},
                "body": "Approved! Nice implementation of the analytics dashboard.",
                "state": "APPROVED",
                "submitted_at": "2024-12-29T13:00:00Z"
            }
        ]
    
    async def add_pull_request_comment(self, owner: str, repo: str, pr_number: int, body: str) -> bool:
        """Mock add PR comment."""
        logger.info(f"Mock: Adding comment to PR {pr_number}")
        await asyncio.sleep(0.3)
        return True
    
    async def get_file_content(self, owner: str, repo: str, path: str, ref: str = "main") -> Optional[str]:
        """Mock get file content."""
        logger.info(f"Mock: Getting file content {path}")
        await asyncio.sleep(0.4)
        
        if path == "package.json":
            return """{
  "name": "dashboard-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}"""
        return f"// Mock content for {path}"
    
    async def get_repository_contents(self, owner: str, repo: str, path: str = "") -> Optional[List[Dict[str, Any]]]:
        """Mock get repository contents."""
        logger.info(f"Mock: Getting repository contents {path}")
        await asyncio.sleep(0.4)
        
        return [
            {"name": "src", "type": "dir", "path": "src"},
            {"name": "package.json", "type": "file", "path": "package.json"},
            {"name": "README.md", "type": "file", "path": "README.md"}
        ]
    
    async def get_dependabot_alerts(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Mock get Dependabot alerts."""
        logger.info(f"Mock: Getting Dependabot alerts for {owner}/{repo}")
        await asyncio.sleep(0.5)
        
        return [
            {
                "number": 1,
                "state": "open",
                "dependency": {"package": {"name": "lodash"}},
                "security_advisory": {
                    "severity": "high",
                    "summary": "Prototype Pollution in lodash",
                    "cve_id": "CVE-2021-23337"
                },
                "security_vulnerability": {
                    "vulnerable_version_range": "< 4.17.21",
                    "first_patched_version": {"identifier": "4.17.21"}
                },
                "created_at": "2024-12-29T10:00:00Z"
            }
        ]
    
    async def get_repository_vulnerabilities(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Mock get repository vulnerabilities."""
        logger.info(f"Mock: Getting vulnerabilities for {owner}/{repo}")
        await asyncio.sleep(0.5)
        
        return []
    
    async def close(self):
        """Mock close."""
        logger.info("Mock GitHub client closed")