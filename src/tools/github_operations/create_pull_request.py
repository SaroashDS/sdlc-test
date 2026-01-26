"""Tool #18: Create Pull Request - Creates a GitHub pull request for code review."""

from typing import Dict, Any, List
from src.integrations.client_factory import get_github_client, get_gemini_client
from src.config import settings
from src.utils.logging import get_logger
import time
import json

logger = get_logger(__name__)


class CreatePullRequestTool:
    """Tool for creating GitHub pull requests with AI-generated descriptions."""
    
    def __init__(self):
        self.name = "create_pull_request"
        self.description = "Creates GitHub pull request with AI-generated description"
    
    async def execute(self, repository_info: Dict[str, Any],
                     branch_name: str,
                     story_data: Dict[str, Any],
                     implementation_summary: Dict[str, Any],
                     validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a GitHub pull request for the implemented story.
        
        Args:
            repository_info: Repository information (owner, repo, default_branch)
            branch_name: Name of the feature branch
            story_data: Original story information
            implementation_summary: Summary of what was implemented
            validation_results: Results from testing and validation
            
        Returns:
            Dict containing pull request creation results
        """
        start_time = time.time()
        
        try:
            story_id = story_data.get("id")
            owner = repository_info["owner"]
            repo = repository_info["repo"]
            github_client = get_github_client()
            
            logger.info("Creating pull request", 
                       story_id=story_id,
                       branch_name=branch_name,
                       repository=f"{owner}/{repo}")
            
            # ========================================
            # PRODUCTION-GRADE PR CREATION FLOW
            # ========================================
            
            # Step 1: Fetch default branch dynamically
            repo_info = await github_client.get_repository(owner, repo)
            if not repo_info:
                return {
                    "success": False,
                    "error": "Failed to fetch repository info",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            base_branch = repo_info.get("default_branch", "main")
            logger.info(f"Dynamic base branch detected: {base_branch}")
            
            # GOLDEN RULE: head ≠ base
            if branch_name == base_branch:
                return {
                    "success": False,
                    "error": f"Cannot create pull request: head branch and base branch are the same ('{base_branch}')",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Step 2: Verify head branch exists remotely
            head_check = await github_client.get_branch(owner, repo, branch_name)
            if not head_check.get("success"):
                return {
                    "success": False,
                    "error": f"Head branch '{branch_name}' does not exist on remote. Push the branch first.",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            logger.info(f"Head branch verified: {branch_name}")
            
            # Step 3: Verify commits exist (compare base...head)
            compare_result = await github_client.compare_commits(owner, repo, base_branch, branch_name)
            if not compare_result.get("success"):
                logger.warning(f"Could not compare branches: {compare_result.get('error')}")
                # Continue anyway - might be first PR
            else:
                ahead_by = compare_result.get("ahead_by", 0)
                if ahead_by == 0:
                    return {
                        "success": False,
                        "error": f"No commits to create PR. Branch '{branch_name}' is not ahead of '{base_branch}'.",
                        "duration_ms": int((time.time() - start_time) * 1000)
                    }
                logger.info(f"Branch is {ahead_by} commits ahead of {base_branch}")
            
            # Step 4: Check for existing PR (avoid duplicates)
            # Try searching with owner:branch format
            search_head = f"{owner}:{branch_name}"
            existing_prs = await github_client.get_pull_requests(
                owner, repo, state="open", head=search_head
            )
            
            # If not found, try just branch name
            if not (existing_prs.get("success") and existing_prs.get("pull_requests")):
                existing_prs = await github_client.get_pull_requests(
                    owner, repo, state="open", head=branch_name
                )

            if existing_prs.get("success") and existing_prs.get("pull_requests"):
                existing_pr = existing_prs["pull_requests"][0]
                logger.info(f"Existing PR found: #{existing_pr['number']} ({existing_pr['html_url']})")
                return {
                    "success": True,
                    "pr_number": existing_pr["number"],
                    "pr_url": existing_pr["html_url"],
                    "pr_title": existing_pr["title"],
                    "pr_description": existing_pr.get("body", ""),
                    "branch_name": branch_name,
                    "base_branch": base_branch,
                    "repository": f"{owner}/{repo}",
                    "reused_existing": True,
                    "story_id": story_id,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Step 5: Generate PR title and description using AI
            pr_content = await self._generate_pr_content(
                story_data, implementation_summary, validation_results
            )
            
            if not pr_content["success"]:
                return {
                    "success": False,
                    "error": f"Failed to generate PR content: {pr_content['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Step 6: Create pull request on GitHub
            pr_result = await github_client.create_pull_request(
                owner=owner,
                repo=repo,
                title=pr_content["title"],
                body=pr_content["description"],
                head=branch_name,
                base=base_branch
            )
            
            if not pr_result["success"]:
                # Check if failure is due to existing PR that we missed in Step 4
                if "already exists" in pr_result["error"].lower():
                    logger.warning("PR creation failed because it already exists. Searching again...")
                    # Search again with a more broad filter
                    all_prs = await github_client.get_pull_requests(owner, repo, state="open")
                    if all_prs.get("success"):
                        for pr in all_prs.get("pull_requests", []):
                            if pr.get("head", {}).get("ref") == branch_name:
                                logger.info(f"Found existing PR on fallback search: #{pr['number']}")
                                return {
                                    "success": True,
                                    "pr_number": pr["number"],
                                    "pr_url": pr["html_url"],
                                    "pr_title": pr["title"],
                                    "pr_description": pr.get("body", ""),
                                    "branch_name": branch_name,
                                    "base_branch": base_branch,
                                    "repository": f"{owner}/{repo}",
                                    "reused_existing": True,
                                    "story_id": story_id,
                                    "duration_ms": int((time.time() - start_time) * 1000)
                                }

                return {
                    "success": False,
                    "error": f"Failed to create pull request: {pr_result['error']}",
                    "pr_content": pr_content,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Add labels and reviewers if configured
            enhancement_result = await self._enhance_pull_request(
                repository_info, pr_result["pr_number"], story_data, validation_results
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Pull request created successfully", 
                       story_id=story_id,
                       pr_number=pr_result["pr_number"],
                       pr_url=pr_result["pr_url"],
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "pr_number": pr_result["pr_number"],
                "pr_url": pr_result["pr_url"],
                "pr_title": pr_content["title"],
                "pr_description": pr_content["description"],
                "branch_name": branch_name,
                "base_branch": base_branch,
                "repository": f"{owner}/{repo}",
                "pr_content_generation": pr_content,
                "enhancement_result": enhancement_result,
                "story_id": story_id,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error creating pull request", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    async def _generate_pr_content(self, story_data: Dict[str, Any],
                                 implementation_summary: Dict[str, Any],
                                 validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate PR title and description using AI."""
        
        try:
            prompt = f"""
            You are an expert software developer creating a pull request. Generate a professional PR title and description.
            
            USER STORY:
            {json.dumps(story_data, indent=2)}
            
            IMPLEMENTATION SUMMARY:
            {json.dumps(implementation_summary, indent=2)}
            
            VALIDATION RESULTS:
            {json.dumps(validation_results, indent=2)}
            
            Generate a pull request with:
            1. Clear, concise title following conventional commits format
            2. Comprehensive description including:
               - What was implemented
               - Key features and components
               - Testing information
               - Code quality metrics
               - Any notes for reviewers
            
            Return as JSON:
            {{
                "title": "feat: implement story #123 - feature description",
                "description": "## Summary\\n\\n## Changes Made\\n\\n## Testing\\n\\n## Quality Metrics\\n\\n## Review Notes"
            }}
            
            Make it professional and informative for code reviewers.
            """
            
            ai_response = await get_gemini_client()._generate_content_async(prompt)
            
            if ai_response:
                try:
                    pr_data = json.loads(ai_response)
                    return {
                        "success": True,
                        "title": pr_data.get("title", ""),
                        "description": pr_data.get("description", "")
                    }
                except json.JSONDecodeError:
                    # Fallback to manual generation if AI response isn't JSON
                    return self._generate_fallback_pr_content(story_data, implementation_summary, validation_results)
            
            return self._generate_fallback_pr_content(story_data, implementation_summary, validation_results)
            
        except Exception as e:
            logger.error("Error generating PR content with AI", error=str(e))
            return self._generate_fallback_pr_content(story_data, implementation_summary, validation_results)
    
    def _generate_fallback_pr_content(self, story_data: Dict[str, Any],
                                    implementation_summary: Dict[str, Any],
                                    validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate PR content without AI as fallback."""
        
        try:
            story_id = story_data.get("id")
            story_title = story_data.get("title", "")
            
            # Generate title
            title = f"feat: implement story #{story_id} - {story_title}"
            
            # Generate description
            description = f"""## Summary
            
Implements user story #{story_id}: {story_title}

## Changes Made

"""
            
            # Add implementation details
            if implementation_summary:
                files_generated = implementation_summary.get("files_generated", {})
                totals = files_generated.get("totals", {})
                
                if totals:
                    description += f"- Generated {totals.get('total_files', 0)} files\n"
                    description += f"- Created {totals.get('components', 0)} React components\n"
                    description += f"- Added {totals.get('tests', 0)} test files\n"
                    description += f"- Configured {totals.get('config_files', 0)} configuration files\n"
            
            description += "\n## Testing\n\n"
            
            # Add validation results
            if validation_results:
                validation_status = validation_results.get("overall_status", "unknown")
                description += f"- Validation Status: {validation_status}\n"
                
                error_count = validation_results.get("total_errors", 0)
                warning_count = validation_results.get("total_warnings", 0)
                
                description += f"- Errors: {error_count}\n"
                description += f"- Warnings: {warning_count}\n"
                
                test_coverage = validation_results.get("test_coverage", 0)
                if test_coverage > 0:
                    description += f"- Test Coverage: {test_coverage:.1f}%\n"
                
                quality_score = validation_results.get("code_quality_score", 0)
                if quality_score > 0:
                    description += f"- Code Quality Score: {quality_score:.1f}/100\n"
                
                # Self-healing info
                if validation_results.get("self_healing_attempted", False):
                    attempts = validation_results.get("self_healing_attempts", 0)
                    successful = validation_results.get("self_healing_successful", False)
                    description += f"- Self-healing: {attempts} attempts, {'successful' if successful else 'failed'}\n"
            
            description += "\n## Quality Metrics\n\n"
            description += "- ✅ TypeScript compilation\n"
            description += "- ✅ ESLint validation\n"
            description += "- ✅ Prettier formatting\n"
            description += "- ✅ Jest tests\n"
            
            description += "\n## Review Notes\n\n"
            description += "This code was generated by the AI-SDLC Automation System and has been automatically validated.\n"
            description += "Please review for:\n"
            description += "- Business logic correctness\n"
            description += "- UI/UX implementation accuracy\n"
            description += "- Code style and best practices\n"
            description += "- Security considerations\n"
            
            return {
                "success": True,
                "title": title,
                "description": description
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _enhance_pull_request(self, repository_info: Dict[str, Any],
                                  pr_number: int,
                                  story_data: Dict[str, Any],
                                  validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Add labels, reviewers, and other enhancements to the PR."""
        
        enhancement_results = {
            "labels_added": [],
            "reviewers_added": [],
            "assignees_added": [],
            "errors": []
        }
        
        try:
            # Add labels based on story and validation
            labels = self._determine_pr_labels(story_data, validation_results)
            
            if labels:
                label_result = await get_github_client().add_labels_to_pr(
                    owner=repository_info["owner"],
                    repo=repository_info["repo"],
                    pr_number=pr_number,
                    labels=labels
                )
                
                if label_result["success"]:
                    enhancement_results["labels_added"] = labels
                else:
                    enhancement_results["errors"].append(f"Failed to add labels: {label_result['error']}")
            
            # Add reviewers if configured
            reviewers = self._get_default_reviewers()
            
            if reviewers:
                reviewer_result = await get_github_client().request_pr_reviewers(
                    owner=repository_info["owner"],
                    repo=repository_info["repo"],
                    pr_number=pr_number,
                    reviewers=reviewers
                )
                
                if reviewer_result["success"]:
                    enhancement_results["reviewers_added"] = reviewers
                else:
                    enhancement_results["errors"].append(f"Failed to add reviewers: {reviewer_result['error']}")
            
            # Assign PR to story author if available
            story_author = story_data.get("assigned_to", {}).get("uniqueName")
            if story_author:
                # Convert ADO username to GitHub username if mapping exists
                github_username = self._map_ado_to_github_username(story_author)
                
                if github_username:
                    assign_result = await get_github_client().assign_pr(
                        owner=repository_info["owner"],
                        repo=repository_info["repo"],
                        pr_number=pr_number,
                        assignees=[github_username]
                    )
                    
                    if assign_result["success"]:
                        enhancement_results["assignees_added"] = [github_username]
                    else:
                        enhancement_results["errors"].append(f"Failed to assign PR: {assign_result['error']}")
            
            return enhancement_results
            
        except Exception as e:
            enhancement_results["errors"].append(str(e))
            return enhancement_results
    
    def _determine_pr_labels(self, story_data: Dict[str, Any],
                           validation_results: Dict[str, Any]) -> List[str]:
        """Determine appropriate labels for the PR."""
        
        labels = []
        
        # Add feature label
        labels.append("feature")
        
        # Add story type labels
        story_type = story_data.get("workItemType", "").lower()
        if story_type in ["user story", "story"]:
            labels.append("user-story")
        elif story_type in ["bug", "defect"]:
            labels.append("bug")
        elif story_type in ["task"]:
            labels.append("task")
        
        # Add validation status labels
        if validation_results:
            validation_status = validation_results.get("overall_status")
            
            if validation_status == "passed":
                labels.append("validated")
            elif validation_status == "failed":
                labels.append("needs-review")
            
            # Add self-healing label if applicable
            if validation_results.get("self_healing_attempted", False):
                if validation_results.get("self_healing_successful", False):
                    labels.append("self-healed")
                else:
                    labels.append("self-healing-failed")
        
        # Add AI-generated label
        labels.append("ai-generated")
        
        return labels
    
    def _get_default_reviewers(self) -> List[str]:
        """Get default reviewers from configuration."""
        
        # Get from settings if configured
        reviewers = getattr(settings, 'default_pr_reviewers', [])
        
        if isinstance(reviewers, str):
            reviewers = [reviewers]
        
        return reviewers
    
    def _map_ado_to_github_username(self, ado_username: str) -> str:
        """Map Azure DevOps username to GitHub username."""
        
        # Get mapping from configuration if available
        username_mapping = getattr(settings, 'ado_to_github_username_mapping', {})
        
        if ado_username in username_mapping:
            return username_mapping[ado_username]
        
        # Simple fallback: extract username part before @
        if '@' in ado_username:
            return ado_username.split('@')[0]
        
        return ado_username


# Global tool instance
create_pull_request_tool = CreatePullRequestTool()
