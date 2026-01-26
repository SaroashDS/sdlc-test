"""Tool #1: Fetch ADO Story - Reads Azure DevOps user story."""

from typing import Optional, Dict, Any
from src.config import settings
from src.integrations.client_factory import get_ado_client
from src.models.story_model import ADOStory
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class FetchADOStoryTool:
    """Tool for fetching Azure DevOps user stories."""
    
    def __init__(self):
        self.name = "fetch_ado_story"
        self.description = "Fetches user story from Azure DevOps by ID"
    
    async def execute(self, story_id: int) -> Dict[str, Any]:
        """
        Fetch user story from Azure DevOps.
        
        Args:
            story_id: Azure DevOps work item ID
            
        Returns:
            Dict containing story data and execution metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Fetching ADO story", story_id=story_id)
            
            # Get ADO client and fetch story from Azure DevOps
            ado_client = get_ado_client()
            story_data = await ado_client.get_work_item(story_id)
            
            if not story_data:
                return {
                    "success": False,
                    "error": f"Story {story_id} not found or inaccessible",
                    "story": None,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Handle both dict (mock) and ADOStory object (real) formats
            if isinstance(story_data, dict):
                # Mock client returns dict - convert to story dict for validation
                story_dict = story_data
                # Create a simple validation for mock data
                validation_result = self._validate_mock_story_readiness(story_dict)
            else:
                # Real client returns ADOStory object
                story_dict = story_data.dict()
                validation_result = self._validate_story_readiness(story_data)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("ADO story fetched successfully", 
                       story_id=story_id, 
                       duration_ms=duration_ms,
                       ready_for_dev=validation_result["ready"])
            
            return {
                "success": True,
                "story": story_dict,
                "validation": validation_result,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error fetching ADO story", 
                        story_id=story_id, 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "story": None,
                "duration_ms": duration_ms
            }
    
    def _validate_story_readiness(self, story: ADOStory) -> Dict[str, Any]:
        """
        Validate if story is ready for AI development.
        
        Args:
            story: ADO story object
            
        Returns:
            Validation result with readiness status and issues
        """
        issues = []
        warnings = []
        
        # Check state
        if not story.is_ready_for_development:
            issues.append(f"Story state is '{story.state.value}', expected 'Ready for Development'")
        
        # Check for Figma design link
        figma_design_url = story.links.figma_design_url
        if settings.figma_design_url:
            figma_design_url = settings.figma_design_url
            logger.info("Using Figma design override for real ADO story", url=figma_design_url)
            
        if not figma_design_url:
            issues.append("No Figma design URL found in story links")
        elif "figma.com/file/" not in figma_design_url:
            issues.append(f"Invalid Figma URL format: {figma_design_url}")
        else:
            # Re-extract key in case of override
            figma_file_key = figma_design_url.split("/file/")[1].split("/")[0]
            story.figma_file_key = figma_file_key # Update object if possible
        
        # Check for GitHub repository link
        github_repo_url = story.links.github_repo_url
        if settings.github_repo_url:
            github_repo_url = settings.github_repo_url
            logger.info("Using GitHub repository override for real ADO story", url=github_repo_url)
            
        if not github_repo_url:
            issues.append("No GitHub repository URL found in story links")
        elif "/github.com/" not in github_repo_url:
            issues.append(f"Invalid GitHub URL format: {github_repo_url}")
        else:
            # Re-parse repo info in case of override
            parts = github_repo_url.replace("https://github.com/", "").split("/")
            if len(parts) >= 2:
                repo_info = {"owner": parts[0], "repo": parts[1]}
            else:
                issues.append(f"Invalid GitHub URL structure: {github_repo_url}")
        
        # Check for acceptance criteria
        if not story.acceptance_criteria:
            issues.append("No acceptance criteria defined")
        elif len(story.acceptance_criteria) < 2:
            warnings.append("Only one acceptance criteria defined - consider adding more")
        
        # Check story description
        if not story.description or len(story.description.strip()) < 50:
            warnings.append("Story description is very short - may lack detail")
        
        # Check for story points (optional but recommended)
        if not story.metadata.story_points:
            warnings.append("No story points assigned - effort estimation missing")
        
        # Check for assignment
        if not story.assignment.assigned_to:
            warnings.append("Story is not assigned to anyone")
        
        return {
            "ready": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "figma_file_key": story.figma_file_key,
            "figma_url": story.figma_design_url or (f"https://www.figma.com/file/{story.figma_file_key}" if story.figma_file_key else None),
            "github_repo_info": story.github_repo_info,
            "acceptance_criteria_count": len(story.acceptance_criteria)
        }
    
    def _validate_mock_story_readiness(self, story_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate mock story readiness (simplified version for dict data).
        
        Args:
            story_dict: Story data as dictionary
            
        Returns:
            Validation result with readiness status and issues
        """
        issues = []
        warnings = []
        
        fields = story_dict.get("fields", {})
        relations = story_dict.get("relations", [])
        
        # Check for Figma design link
        figma_link = None
        github_link = None
        
        for relation in relations:
            if relation.get("rel") == "Hyperlink":
                url = relation.get("url", "")
                if "figma.com" in url:
                    figma_link = url
                elif "github.com" in url:
                    github_link = url
        
        if not figma_link:
            issues.append("No Figma design URL found in story links")
        
        if not github_link:
            issues.append("No GitHub repository URL found in story links")
        
        # Check story description
        description = fields.get("System.Description", "")
        if not description or len(description.strip()) < 50:
            warnings.append("Story description is very short - may lack detail")

        # Extract figma file key and github repo info for mock data
        figma_file_key = None
        github_repo_info = None
        
        # Check for overrides in settings (prioritize .env)
        if settings.figma_design_url and len(settings.figma_design_url.strip()) > 10:
            figma_link = settings.figma_design_url.strip()
            logger.info("Using Figma design override for mock ADO story", url=figma_link)
            
        if settings.github_repo_url and len(settings.github_repo_url.strip()) > 10:
            github_link = settings.github_repo_url.strip()
            logger.info("Using GitHub repository override for mock ADO story", url=github_link)
        
        # Parse Figma Key
        if figma_link:
            # Handle standard formats
            for pattern in ["/file/", "/design/", "/proto/", "/make/"]:
                if pattern in figma_link:
                    figma_file_key = figma_link.split(pattern)[1].split("/")[0].split("?")[0]
                    break
                    
            # Fallback for other potential formats (e.g., https://figma.com/KEY)
            if not figma_file_key:
                parts = figma_link.strip().rstrip('/').split("/")
                if len(parts) >= 4 and "figma.com" in parts[2]:
                    # parts[0]=https:, parts[1]='', parts[2]=www.figma.com, parts[3]=key_or_type
                    potential_key = parts[4] if len(parts) > 4 else parts[3]
                    figma_file_key = potential_key.split("?")[0]
        
        if not figma_file_key:
            issues.append(f"Could not extract Figma file key from URL: {figma_link}")
        
        # Parse GitHub Repo Info
        if github_link:
            clean_link = github_link.strip().rstrip('/')
            if "github.com/" in clean_link:
                parts = clean_link.replace("https://github.com/", "").split("/")
                if len(parts) >= 2:
                    github_repo_info = {"owner": parts[0], "repo": parts[1]}
            
        if not github_repo_info:
            issues.append(f"Could not extract GitHub owner/repo from URL: {github_link}")
        
        return {
            "ready": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "figma_file_key": figma_file_key,
            "figma_url": figma_link,
            "github_repo_info": github_repo_info,
            "acceptance_criteria_count": len([line for line in description.split('\n') if line.strip().startswith(('-', '*'))])
        }


# Global tool instance
fetch_ado_story_tool = FetchADOStoryTool()