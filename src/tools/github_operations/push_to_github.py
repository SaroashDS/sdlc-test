"""Tool #17: Push to GitHub - Pushes committed changes to GitHub repository."""

import subprocess
from typing import Dict, Any
from src.integrations.client_factory import get_github_client
from src.config import settings
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class PushToGitHubTool:
    """Tool for pushing commits to GitHub repository."""
    
    def __init__(self):
        self.name = "push_to_github"
        self.description = "Pushes committed changes to GitHub repository"
    
    async def execute(self, workspace_path: str, 
                     branch_name: str,
                     repository_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Push committed changes to GitHub repository.
        
        Args:
            workspace_path: Path to the workspace with committed changes
            branch_name: Name of the branch to push
            repository_info: Repository information (owner, repo, etc.)
            
        Returns:
            Dict containing push results
        """
        start_time = time.time()
        
        try:
            logger.info("Pushing to GitHub", 
                       branch_name=branch_name,
                       repository=f"{repository_info.get('owner')}/{repository_info.get('repo')}")
            
            # Verify we have commits to push
            commits_check = await self._check_commits_to_push(workspace_path, branch_name)
            
            # Handle case where code is already pushed (re-run scenario)
            if commits_check.get("already_pushed"):
                duration_ms = int((time.time() - start_time) * 1000)
                logger.info("Code already pushed to GitHub (re-run detected)", 
                           branch_name=branch_name,
                           duration_ms=duration_ms)
                return {
                    "success": True,
                    "branch_name": branch_name,
                    "commits_pushed": 0,
                    "push_url": f"https://github.com/{repository_info['owner']}/{repository_info['repo']}/tree/{branch_name}",
                    "commits_check": commits_check,
                    "already_pushed": True,
                    "duration_ms": duration_ms
                }
            
            if not commits_check["has_commits"]:
                error_msg = commits_check.get("error", "No commits found to push")
                return {
                    "success": False,
                    "error": error_msg,
                    "commits_check": commits_check,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }

            # Setup authentication for push
            auth_setup = await self._setup_push_authentication(workspace_path, repository_info)
            
            if not auth_setup["success"]:
                return {
                    "success": False,
                    "error": f"Failed to setup authentication: {auth_setup['error']}",
                    "auth_setup": auth_setup,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Push to GitHub
            push_result = await self._push_branch(workspace_path, branch_name)
            
            if not push_result["success"]:
                return {
                    "success": False,
                    "error": f"Failed to push to GitHub: {push_result['error']}",
                    "push_result": push_result,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Verify push on GitHub
            verification = await self._verify_push_on_github(repository_info, branch_name)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Successfully pushed to GitHub", 
                       branch_name=branch_name,
                       commits_pushed=commits_check.get("commit_count", 0),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "branch_name": branch_name,
                "commits_pushed": commits_check.get("commit_count", 0),
                "push_url": f"https://github.com/{repository_info['owner']}/{repository_info['repo']}/tree/{branch_name}",
                "commits_check": commits_check,
                "push_result": push_result,
                "verification": verification,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error pushing to GitHub", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    async def _check_commits_to_push(self, workspace_path: str, 
                                   branch_name: str) -> Dict[str, Any]:
        """Check if there are commits to push."""
        
        try:
            # Get current branch
            current_branch_result = subprocess.run(
                ['git', 'branch', '--show-current'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            current_branch = current_branch_result.stdout.strip()
            
            # ENTERPRISE FIX: If on a different branch, try to switch automatically
            if current_branch and current_branch != branch_name:
                logger.info(f"Switching from {current_branch} to {branch_name}")
                # First try to checkout existing branch, if that fails create new one
                checkout_result = subprocess.run(
                    ['git', 'checkout', branch_name], 
                    cwd=workspace_path,
                    capture_output=True,
                    text=True
                )
                if checkout_result.returncode != 0:
                    # Branch doesn't exist, create it
                    subprocess.run(['git', 'checkout', '-b', branch_name], cwd=workspace_path)
                current_branch = branch_name

            # Check for unpushed commits
            # First check if we have ANY commits on current HEAD
            log_result = subprocess.run(
                ['git', 'rev-list', '--count', 'HEAD'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if log_result.returncode == 0:
                total_commits = int(log_result.stdout.strip()) if log_result.stdout.strip() else 0
                if total_commits > 0:
                    # We have commits locally, check if remote branch exists
                    remote_check = subprocess.run(
                        ['git', 'ls-remote', '--heads', 'origin', branch_name],
                        cwd=workspace_path,
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    
                    if remote_check.returncode == 0 and remote_check.stdout.strip():
                        # Remote branch exists, check for differences
                        # Fetch first to ensure we have latest remote info
                        subprocess.run(['git', 'fetch', 'origin'], cwd=workspace_path, capture_output=True, timeout=30)
                        diff_result = subprocess.run(
                            ['git', 'rev-list', '--count', f'origin/{branch_name}..HEAD'],
                            cwd=workspace_path,
                            capture_output=True,
                            text=True,
                            timeout=10
                        )
                        
                        if diff_result.returncode == 0:
                            commit_count = int(diff_result.stdout.strip()) if diff_result.stdout.strip() else 0
                            if commit_count > 0:
                                return {
                                    "has_commits": True,
                                    "commit_count": commit_count,
                                    "remote_branch_exists": True
                                }
                            else:
                                # Already up to date - this is OK, mark as success
                                return {
                                    "has_commits": True,
                                    "commit_count": 0,
                                    "remote_branch_exists": True,
                                    "already_pushed": True
                                }
                    else:
                        # Remote branch doesn't exist, we have local commits to push
                        return {
                            "has_commits": True,
                            "commit_count": total_commits,
                            "remote_branch_exists": False
                        }
            
            # MANDATORY SAFETY CHECK: Shared History Verification
            # Ensure the local branch has a common ancestor with origin/main
            default_branch = "main"
            # Quick check if main exists, else use master
            ls_remote = subprocess.run(['git', 'ls-remote', '--heads', 'origin', 'main'], cwd=workspace_path, capture_output=True, text=True)
            if ls_remote.returncode == 0 and not ls_remote.stdout.strip():
                default_branch = "master"
            
            # Use merge-base to verify common ancestry
            # This will fail with a non-zero exit code if no common father exists
            mb_result = subprocess.run(
                ['git', 'merge-base', f'origin/{default_branch}', 'HEAD'],
                cwd=workspace_path,
                capture_output=True,
                text=True
            )
            
            if mb_result.returncode != 0:
                logger.error(f"FATAL: No common history with origin/{default_branch}. PR will fail.")
                return {
                    "has_commits": False,
                    "error": f"Branch '{branch_name}' has no common history with origin/{default_branch}. Shared history is required for PRs."
                }
            
            logger.info(f"Shared history verified with origin/{default_branch}")
            
            return {
                "has_commits": False,
                "error": f"No commits found to push on branch {branch_name}"
            }
            
        except Exception as e:
            return {
                "has_commits": False,
                "error": str(e)
            }
    
    async def _setup_push_authentication(self, workspace_path: str, 
                                       repository_info: Dict[str, Any]) -> Dict[str, Any]:
        """Setup authentication for pushing to GitHub."""
        
        try:
            # In mock mode, skip authentication setup
            if settings.mock_mode:
                logger.info("Mock mode: Skipping GitHub authentication setup")
                return {
                    "success": True,
                    "authentication_method": "mock",
                    "remote_updated": False
                }
            
            # Check if we have a GitHub token
            github_token = getattr(settings, 'github_token', None)
            
            if not github_token:
                return {
                    "success": False,
                    "error": "No GitHub token configured"
                }
            
            # Setup remote URL with token authentication
            owner = repository_info["owner"]
            repo = repository_info["repo"]
            
            # Use token-based authentication URL
            auth_url = f"https://{github_token}@github.com/{owner}/{repo}.git"
            
            # Update remote URL robustly
            # Try to add origin first, if it exists then set-url
            subprocess.run(
                ['git', 'remote', 'add', 'origin', auth_url],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Now set-url to ensure it's correct (authenticated)
            remote_result = subprocess.run(
                ['git', 'remote', 'set-url', 'origin', auth_url],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if remote_result.returncode != 0:
                return {
                    "success": False,
                    "error": f"Failed to set remote URL: {remote_result.stderr}"
                }
            
            return {
                "success": True,
                "authentication_method": "token",
                "remote_updated": True
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _push_branch(self, workspace_path: str, branch_name: str) -> Dict[str, Any]:
        """Push the branch to GitHub."""
        
        try:
            # In mock mode, simulate successful push
            if settings.mock_mode:
                logger.info("Mock mode: Simulating GitHub push")
                return {
                    "success": True,
                    "output": f"Mock: Successfully pushed {branch_name} to origin",
                    "branch_pushed": branch_name
                }
            
            # Push branch to origin with force flag (for regeneration scenarios)
            # Using --force because this is an automated code generation system
            # and we want the new generated code to replace any existing code
            push_result = subprocess.run(
                ['git', 'push', '-u', '--force', 'origin', branch_name],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=60  # Longer timeout for push
            )
            
            if push_result.returncode != 0:
                return {
                    "success": False,
                    "error": push_result.stderr,
                    "output": push_result.stdout
                }
            
            return {
                "success": True,
                "output": push_result.stdout,
                "branch_pushed": branch_name
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _verify_push_on_github(self, repository_info: Dict[str, Any], 
                                   branch_name: str) -> Dict[str, Any]:
        """Verify that the push was successful on GitHub."""
        
        try:
            # Use GitHub client to check if branch exists
            branch_info = await get_github_client().get_branch(
                owner=repository_info["owner"],
                repo=repository_info["repo"],
                branch=branch_name
            )
            
            if branch_info["success"]:
                return {
                    "success": True,
                    "branch_exists": True,
                    "branch_sha": branch_info.get("sha"),
                    "last_commit": branch_info.get("commit", {})
                }
            else:
                return {
                    "success": False,
                    "branch_exists": False,
                    "error": branch_info.get("error")
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def cleanup_authentication(self, workspace_path: str, 
                                   original_remote_url: str = None):
        """Clean up authentication by restoring original remote URL."""
        
        try:
            if original_remote_url:
                subprocess.run(
                    ['git', 'remote', 'set-url', 'origin', original_remote_url],
                    cwd=workspace_path,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                logger.info("Restored original remote URL")
                
        except Exception as e:
            logger.warning("Failed to restore original remote URL", error=str(e))


# Global tool instance
push_to_github_tool = PushToGitHubTool()
