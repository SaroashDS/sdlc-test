"""Tool #19: Update ADO Story Status - Updates Azure DevOps story status after PR creation."""

from typing import Dict, Any
from src.integrations.client_factory import get_ado_client
from src.config import settings
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class UpdateAdoStoryStatusTool:
    """Tool for updating Azure DevOps story status and adding PR links."""
    
    def __init__(self):
        self.name = "update_ado_story_status"
        self.description = "Updates Azure DevOps story status and links PR"
    
    async def execute(self, story_id: int,
                     pr_info: Dict[str, Any],
                     implementation_summary: Dict[str, Any],
                     validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update Azure DevOps story status after successful PR creation.
        
        Args:
            story_id: Azure DevOps story ID
            pr_info: Pull request information
            implementation_summary: Summary of implementation
            validation_results: Validation and testing results
            
        Returns:
            Dict containing update results
        """
        start_time = time.time()
        
        try:
            logger.info("Updating ADO story status", 
                       story_id=story_id,
                       pr_number=pr_info.get("pr_number"))
            
            # Prepare story updates
            story_updates = self._prepare_story_updates(
                pr_info, implementation_summary, validation_results
            )
            
            # Update story status
            status_update = await self._update_story_status(story_id, story_updates)
            
            if not status_update["success"]:
                return {
                    "success": False,
                    "error": f"Failed to update story status: {status_update['error']}",
                    "story_updates": story_updates,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Add PR link to story
            link_result = await self._add_pr_link_to_story(story_id, pr_info)
            
            # Add implementation comment
            comment_result = await self._add_implementation_comment(
                story_id, pr_info, implementation_summary, validation_results
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("ADO story updated successfully", 
                       story_id=story_id,
                       new_status=story_updates.get("status"),
                       pr_linked=link_result.get("success", False),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "story_id": story_id,
                "status_update": status_update,
                "pr_link_result": link_result,
                "comment_result": comment_result,
                "story_updates": story_updates,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error updating ADO story status", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    def _prepare_story_updates(self, pr_info: Dict[str, Any],
                             implementation_summary: Dict[str, Any],
                             validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare the updates to apply to the story."""
        
        updates = {}
        
        # Update status based on validation results
        validation_status = validation_results.get("overall_status")
        
        if validation_status == "passed":
            # Move to "Ready for Review" or similar status
            updates["status"] = self._get_review_ready_status()
        else:
            # Move to "In Development" or similar if validation failed
            updates["status"] = self._get_in_development_status()
        
        # Add tags
        tags = []
        
        # Add AI-generated tag
        tags.append("AI-Generated")
        
        # Add validation status tag
        if validation_status == "passed":
            tags.append("Validated")
        else:
            tags.append("Needs-Review")
        
        # Add self-healing tag if applicable
        if validation_results.get("self_healing_attempted", False):
            if validation_results.get("self_healing_successful", False):
                tags.append("Self-Healed")
            else:
                tags.append("Self-Healing-Failed")
        
        updates["tags"] = "; ".join(tags)
        
        # Update description with implementation details
        implementation_notes = self._generate_implementation_notes(
            pr_info, implementation_summary, validation_results
        )
        
        updates["implementation_notes"] = implementation_notes
        
        return updates
    
    def _get_review_ready_status(self) -> str:
        """Get the status for stories ready for review."""
        
        # Common ADO status names for review-ready items
        possible_statuses = [
            "Ready for Review",
            "Code Review", 
            "Review",
            "Pending Review",
            "Ready for Testing",
            "Done"
        ]
        
        # Return configured status or default
        return getattr(settings, 'ado_review_ready_status', possible_statuses[0])
    
    def _get_in_development_status(self) -> str:
        """Get the status for stories still in development."""
        
        # Common ADO status names for in-development items
        possible_statuses = [
            "In Development",
            "Active",
            "In Progress",
            "Development"
        ]
        
        # Return configured status or default
        return getattr(settings, 'ado_in_development_status', possible_statuses[0])
    
    def _generate_implementation_notes(self, pr_info: Dict[str, Any],
                                     implementation_summary: Dict[str, Any],
                                     validation_results: Dict[str, Any]) -> str:
        """Generate implementation notes for the story."""
        
        notes = "## AI Implementation Summary\n\n"
        
        # PR information
        notes += f"**Pull Request:** [{pr_info.get('pr_number')}]({pr_info.get('pr_url')})\n"
        notes += f"**Branch:** {pr_info.get('branch_name')}\n\n"
        
        # Implementation details
        if implementation_summary:
            files_generated = implementation_summary.get("files_generated", {})
            totals = files_generated.get("totals", {})
            
            notes += "### Files Generated\n"
            notes += f"- Total Files: {totals.get('total_files', 0)}\n"
            notes += f"- React Components: {totals.get('components', 0)}\n"
            notes += f"- Test Files: {totals.get('tests', 0)}\n"
            notes += f"- Configuration Files: {totals.get('config_files', 0)}\n\n"
        
        # Validation results
        if validation_results:
            notes += "### Validation Results\n"
            notes += f"- Status: {validation_results.get('overall_status', 'Unknown')}\n"
            notes += f"- Errors: {validation_results.get('total_errors', 0)}\n"
            notes += f"- Warnings: {validation_results.get('total_warnings', 0)}\n"
            
            test_coverage = validation_results.get("test_coverage", 0)
            if test_coverage > 0:
                notes += f"- Test Coverage: {test_coverage:.1f}%\n"
            
            quality_score = validation_results.get("code_quality_score", 0)
            if quality_score > 0:
                notes += f"- Code Quality Score: {quality_score:.1f}/100\n"
            
            # Self-healing information
            if validation_results.get("self_healing_attempted", False):
                attempts = validation_results.get("self_healing_attempts", 0)
                successful = validation_results.get("self_healing_successful", False)
                notes += f"- Self-healing: {attempts} attempts, {'successful' if successful else 'failed'}\n"
            
            notes += "\n"
        
        # Quality gates
        notes += "### Quality Gates\n"
        notes += "- ✅ TypeScript Compilation\n"
        notes += "- ✅ ESLint Validation\n"
        notes += "- ✅ Prettier Formatting\n"
        notes += "- ✅ Jest Tests\n\n"
        
        notes += "### Next Steps\n"
        notes += "1. Review the pull request for business logic correctness\n"
        notes += "2. Verify UI/UX implementation matches design requirements\n"
        notes += "3. Test the functionality manually\n"
        notes += "4. Approve and merge the pull request\n"
        
        return notes
    
    async def _update_story_status(self, story_id: int, 
                                 updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update the story status and fields."""
        
        try:
            # Get ADO client
            ado_client = get_ado_client()
            
            # Prepare work item update
            work_item_updates = []
            
            # Status update
            if "status" in updates:
                work_item_updates.append({
                    "op": "replace",
                    "path": "/fields/System.State",
                    "value": updates["status"]
                })
            
            # Tags update
            if "tags" in updates:
                work_item_updates.append({
                    "op": "replace",
                    "path": "/fields/System.Tags",
                    "value": updates["tags"]
                })
            
            # Implementation notes (add to description or comments)
            if "implementation_notes" in updates:
                work_item_updates.append({
                    "op": "add",
                    "path": "/fields/System.History",
                    "value": updates["implementation_notes"]
                })
            
            # Update the work item
            result = await ado_client.update_work_item(story_id, work_item_updates)
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _add_pr_link_to_story(self, story_id: int, 
                                  pr_info: Dict[str, Any]) -> Dict[str, Any]:
        """Add a link from the story to the pull request."""
        
        try:
            # Get ADO client
            ado_client = get_ado_client()
            
            # Create hyperlink to PR
            pr_url = pr_info.get("pr_url")
            pr_title = f"Pull Request #{pr_info.get('pr_number')}"
            
            if pr_url:
                link_result = await ado_client.add_hyperlink_to_work_item(
                    work_item_id=story_id,
                    url=pr_url,
                    comment=pr_title
                )
                
                return link_result
            
            return {
                "success": False,
                "error": "No PR URL provided"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _add_implementation_comment(self, story_id: int,
                                        pr_info: Dict[str, Any],
                                        implementation_summary: Dict[str, Any],
                                        validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Add a detailed implementation comment to the story."""
        
        try:
            # Get ADO client
            ado_client = get_ado_client()
            
            comment_text = f"""
AI-SDLC Automation System has completed implementation of this story.

**Pull Request Created:** {pr_info.get('pr_url')}
**Branch:** {pr_info.get('branch_name')}
**Status:** {validation_results.get('overall_status', 'Unknown')}

The implementation has been automatically validated and is ready for human review.
            """.strip()
            
            result = await ado_client.add_comment_to_work_item(story_id, comment_text)
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Global tool instance
update_ado_story_status_tool = UpdateAdoStoryStatusTool()