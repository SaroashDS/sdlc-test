"""Tool #15: Create GitHub Branch - Creates a new feature branch for the story."""

import os
from typing import Dict, Any, Optional
from src.integrations.client_factory import get_github_client
from src.config import settings
from src.utils.logging import get_logger
import time
import re

logger = get_logger(__name__)


class CreateGitHubBranchTool:
    """Tool for creating GitHub branches for feature development."""
    
    def __init__(self):
        self.name = "create_github_branch"
        self.description = "Creates a new GitHub branch for story development"
    
    async def execute(self, story_data: Dict[str, Any], 
                     workspace_path: str,
                     repository_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a new GitHub branch for the story.
        """
        start_time = time.time()
        
        try:
            story_id = story_data.get("id")
            story_title = story_data.get("title", "")
            
            logger.info("Creating GitHub branch", 
                       story_id=story_id,
                       workspace_path=workspace_path)
            
            # 1. ENTERPRISE FIX: Normalize branch name and strip trailing dashes
            branch_name = self._generate_branch_name(story_id, story_title)
            
            # 2. Get repository information and discover default branch
            if repository_info and repository_info.get("owner") and repository_info.get("repo"):
                owner = repository_info["owner"]
                repo = repository_info["repo"]
                
                # Discovery: Fetch real repo info from API to get the TRUE default branch
                logger.info("Fetching repository metadata from API", owner=owner, repo=repo)
                api_repo = await get_github_client().get_repository(owner, repo)
                
                repo_info = {
                    "success": True,
                    "owner": owner,
                    "repo": repo,
                    "default_branch": api_repo.get("default_branch", "main") if api_repo else repository_info.get("default_branch", "main")
                }
                logger.info("Using discovered repository information", 
                           owner=owner, 
                           repo=repo,
                           default_branch=repo_info["default_branch"])
            else:
                repo_info = await self._get_repository_info(workspace_path)
            
            if not repo_info["success"]:
                return {
                    "success": False,
                    "error": f"Failed to get repository info: {repo_info['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # 3. ENTERPRISE FIX: Use robust creation with discovery
            # We don't pass base_branch anymore to let the client discover it
            branch_result = await get_github_client().create_branch(
                owner=repo_info["owner"],
                repo=repo_info["repo"],
                branch_name=branch_name,
                base_branch=repo_info.get("default_branch")
            )
            
            if not branch_result["success"]:
                return {
                    "success": False,
                    "error": f"Failed to create GitHub branch: {branch_result['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # 4. Initialize local git repository
            is_empty = branch_result.get("is_empty", False)
            local_git_result = await self._setup_local_git(workspace_path, repo_info, branch_name, is_empty)
            
            if not local_git_result.get("success", False):
                return {
                    "success": False,
                    "error": f"Failed to setup local git: {local_git_result.get('error')}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "branch_name": branch_name,
                "reused": branch_result.get("reused", False),
                "is_empty": is_empty,
                "branch_url": branch_result.get("branch_url"),
                "repository": {
                    "owner": repo_info["owner"],
                    "repo": repo_info["repo"],
                    "default_branch": repo_info.get("default_branch", "main")
                },
                "local_git_setup": local_git_result,
                "story_id": story_id,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error creating GitHub branch", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    def _generate_branch_name(self, story_id: int, story_title: str) -> str:
        """Generate a clean branch name from story information."""
        
        # Clean the title for branch name
        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', story_title)
        clean_title = re.sub(r'\s+', '-', clean_title.strip())
        clean_title = clean_title.lower()
        
        # Limit length
        if len(clean_title) > 40:
            clean_title = clean_title[:40].rstrip('-')
        
        # Create branch name
        branch_name = f"feature/story-{story_id}-{clean_title}"
        
        # ENTERPRISE FIX: Ensure it's a valid git branch name and strip trailing dashes/separators
        branch_name = re.sub(r'[^a-zA-Z0-9\-_/]', '', branch_name)
        branch_name = re.sub(r'-+', '-', branch_name).rstrip('-').rstrip('_')
        
        return branch_name
    
    async def _get_repository_info(self, workspace_path: str) -> Dict[str, Any]:
        """Get repository information from workspace or configuration."""
        
        try:
            # In mock mode, return mock repository info
            if settings.mock_mode:
                logger.info("Mock mode: Using mock repository information")
                return {
                    "success": True,
                    "owner": "mock-org",
                    "repo": "dashboard-app",
                    "default_branch": "main"
                }
            
            # Try to get from git remote if workspace is a git repo
            git_info = await self._get_git_remote_info(workspace_path)
            
            if git_info["success"]:
                return git_info
            
            # Fall back to configuration or environment variables
            github_repo = os.getenv("GITHUB_REPOSITORY")
            if github_repo:
                repo_parts = github_repo.split('/')
                if len(repo_parts) == 2:
                    return {
                        "success": True,
                        "owner": repo_parts[0],
                        "repo": repo_parts[1],
                        "default_branch": os.getenv("GITHUB_DEFAULT_BRANCH", "main")
                    }
            
            # Final fallback for development/testing
            return {
                "success": True,
                "owner": "your-org",
                "repo": "your-repo",
                "default_branch": "main"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _get_git_remote_info(self, workspace_path: str) -> Dict[str, Any]:
        """Extract repository info from git remote."""
        
        try:
            import subprocess
            
            # Check if it's a git repository
            git_dir = os.path.join(workspace_path, '.git')
            if not os.path.exists(git_dir):
                return {
                    "success": False,
                    "error": "Not a git repository"
                }
            
            # Get remote URL
            result = subprocess.run(
                ['git', 'remote', 'get-url', 'origin'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                return {
                    "success": False,
                    "error": "No git remote origin found"
                }
            
            remote_url = result.stdout.strip()
            
            # Parse GitHub URL
            github_info = self._parse_github_url(remote_url)
            
            if github_info:
                # Get default branch
                default_branch = await self._get_default_branch(workspace_path)
                github_info["default_branch"] = default_branch
                github_info["success"] = True
                return github_info
            
            return {
                "success": False,
                "error": "Remote URL is not a GitHub repository"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _parse_github_url(self, url: str) -> Optional[Dict[str, str]]:
        """Parse GitHub repository owner and name from URL."""
        
        # Handle different GitHub URL formats
        patterns = [
            r'github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?/?$',
            r'github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return {
                    "owner": match.group(1),
                    "repo": match.group(2)
                }
        
        return None
    
    async def _get_default_branch(self, workspace_path: str) -> str:
        """Get the default branch name."""
        
        try:
            import subprocess
            
            # Try to get default branch from git
            result = subprocess.run(
                ['git', 'symbolic-ref', 'refs/remotes/origin/HEAD'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                # Extract branch name from refs/remotes/origin/branch_name
                ref = result.stdout.strip()
                if ref.startswith('refs/remotes/origin/'):
                    return ref.replace('refs/remotes/origin/', '')
            
            # Fall back to common defaults
            return "main"
            
        except Exception:
            return "main"
    
    async def _setup_local_git(self, workspace_path: str, 
                             repo_info: Dict[str, Any], 
                             branch_name: str,
                             is_empty: bool = False) -> Dict[str, Any]:
        """Setup local git repository and checkout the new branch.
        
        CRITICAL FIX: For non-empty repos, we MUST use git clone to get shared history.
        The previous git init + fetch + reset approach fails because reset requires existing HEAD.
        """
        
        try:
            import subprocess
            import shutil
            
            git_dir = os.path.join(workspace_path, '.git')
            owner = repo_info['owner']
            repo = repo_info['repo']
            default_branch = repo_info.get("default_branch", "main")
            
            # Get GitHub token for authenticated operations
            github_token = getattr(settings, 'github_token', None)
            if github_token:
                clone_url = f"https://{github_token}@github.com/{owner}/{repo}.git"
            else:
                clone_url = f"https://github.com/{owner}/{repo}.git"
            
            results = []
            
            # STRATEGY: Clone for existing repos to get REAL history
            if not is_empty:
                logger.info(f"Non-empty repo detected. Using git clone to guarantee shared history with {default_branch}.")
                
                # Robust rmtree for Windows (handles read-only files in .git)
                def remove_readonly(func, path, excinfo):
                    import stat
                    os.chmod(path, stat.S_IWRITE)
                    func(path)

                # Step 1: Backup generated files (excluding .git if it exists)
                temp_backup = workspace_path + "_backup"
                if os.path.exists(workspace_path) and os.listdir(workspace_path):
                    if os.path.exists(temp_backup):
                        shutil.rmtree(temp_backup, onerror=remove_readonly)
                    os.makedirs(temp_backup, exist_ok=True)
                    for item in os.listdir(workspace_path):
                        if item != '.git':
                            src = os.path.join(workspace_path, item)
                            dst = os.path.join(temp_backup, item)
                            try:
                                if os.path.isdir(src):
                                    shutil.copytree(src, dst)
                                else:
                                    shutil.copy2(src, dst)
                            except Exception as e:
                                logger.warning(f"Backup failed for {item}: {e}")
                    
                    try:
                        shutil.rmtree(workspace_path, onerror=remove_readonly)
                    except Exception as e:
                        logger.error(f"Failed to clear workspace path: {e}")
                        # If we can't delete it, try to at least remove .git
                        git_path = os.path.join(workspace_path, ".git")
                        if os.path.exists(git_path):
                            shutil.rmtree(git_path, onerror=remove_readonly)
                    
                    logger.info("Backed up generated files before cloning")
                
                # Step 2: Clone the repository (brings REAL history)
                os.makedirs(os.path.dirname(workspace_path), exist_ok=True)
                clone_result = subprocess.run(
                    ['git', 'clone', '--depth', '50', '--branch', default_branch, clone_url, workspace_path],
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                
                results.append({
                    "command": f"git clone --depth 50 --branch {default_branch} <repo> .",
                    "success": clone_result.returncode == 0,
                    "output": clone_result.stdout,
                    "error": clone_result.stderr
                })
                
                if clone_result.returncode != 0:
                    logger.error("Git clone failed", error=clone_result.stderr)
                    return {"success": False, "error": f"Git clone failed: {clone_result.stderr}"}
                
                # Step 3: Restore backed up generated files
                if os.path.exists(temp_backup):
                    for item in os.listdir(temp_backup):
                        src = os.path.join(temp_backup, item)
                        dst = os.path.join(workspace_path, item)
                        if os.path.isdir(src):
                            if os.path.exists(dst):
                                shutil.rmtree(dst)
                            shutil.copytree(src, dst)
                        else:
                            shutil.copy2(src, dst)
                    shutil.rmtree(temp_backup)
                    logger.info("Restored generated files into cloned repository")
                
                # Step 4: Create feature branch FROM the cloned history
                branch_cmd = subprocess.run(
                    ['git', 'checkout', '-b', branch_name],
                    cwd=workspace_path,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                # If branch exists, just checkout
                if branch_cmd.returncode != 0 and 'already exists' in branch_cmd.stderr:
                    branch_cmd = subprocess.run(
                        ['git', 'checkout', branch_name],
                        cwd=workspace_path,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                
                results.append({
                    "command": f"git checkout -b {branch_name}",
                    "success": branch_cmd.returncode == 0,
                    "output": branch_cmd.stdout,
                    "error": branch_cmd.stderr
                })
                
            else:
                # Empty repo - use git init (no history to share)
                logger.info("Empty repository. Using git init strategy.")
                
                if not os.path.exists(git_dir):
                    init_result = subprocess.run(
                        ['git', 'init'],
                        cwd=workspace_path,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    results.append({
                        "command": "git init",
                        "success": init_result.returncode == 0,
                        "output": init_result.stdout,
                        "error": init_result.stderr
                    })
                
                # Add remote
                subprocess.run(['git', 'remote', 'add', 'origin', clone_url], cwd=workspace_path, capture_output=True)
                subprocess.run(['git', 'remote', 'set-url', 'origin', clone_url], cwd=workspace_path, capture_output=True)
                
                # Create branch
                branch_cmd = subprocess.run(
                    ['git', 'checkout', '-b', branch_name],
                    cwd=workspace_path,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                results.append({
                    "command": f"git checkout -b {branch_name}",
                    "success": branch_cmd.returncode == 0,
                    "output": branch_cmd.stdout,
                    "error": branch_cmd.stderr
                })
            
            overall_success = all(r["success"] for r in results)
            
            return {
                "success": overall_success,
                "branch_name": branch_name,
                "is_empty": is_empty,
                "repository": {
                    "owner": owner,
                    "repo": repo,
                    "default_branch": default_branch
                },
                "local_git_setup": {
                    "success": overall_success,
                    "strategy": "clone" if not is_empty else "init",
                    "commands": results
                }
            }
            
        except Exception as e:
            logger.error("Error setting up local git", error=str(e))
            return {
                "success": False,
                "error": str(e)
            }


# Global tool instance
create_github_branch_tool = CreateGitHubBranchTool()
