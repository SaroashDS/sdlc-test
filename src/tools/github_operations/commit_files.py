"""Tool #16: Commit Files - Commits generated code files to the GitHub branch."""

import os
from typing import Dict, Any, List
from src.config import settings
from src.utils.logging import get_logger
import time
import subprocess

logger = get_logger(__name__)


class CommitFilesTool:
    """Tool for committing generated files to git."""
    
    def __init__(self):
        self.name = "commit_files"
        self.description = "Commits generated code files to git repository"
    
    async def execute(self, workspace_path: str, 
                     story_data: Dict[str, Any],
                     generated_files: Dict[str, Any]) -> Dict[str, Any]:
        """
        Commit generated files to the git repository.
        
        Args:
            workspace_path: Path to the workspace with generated code
            story_data: Story information for commit message
            generated_files: Information about generated files
            
        Returns:
            Dict containing commit results
        """
        start_time = time.time()
        
        try:
            story_id = story_data.get("id")
            story_title = story_data.get("title", "")
            
            logger.info("Committing files to git", 
                       story_id=story_id,
                       workspace_path=workspace_path)
            
            # Verify git repository
            if not self._is_git_repository(workspace_path):
                return {
                    "success": False,
                    "error": "Workspace is not a git repository",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Stage files
            stage_result = await self._stage_files(workspace_path, generated_files)
            
            if not stage_result["success"]:
                return {
                    "success": False,
                    "error": f"Failed to stage files: {stage_result['error']}",
                    "stage_result": stage_result,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Create commit message
            commit_message = self._generate_commit_message(story_data, generated_files)
            
            # If no files were staged, skip committing (repo is up to date)
            if stage_result.get("files_staged", 0) == 0:
                logger.info("No files to commit - repository is already up to date")
                return {
                    "success": True,
                    "commit_hash": None,
                    "commit_message": commit_message,
                    "files_committed": 0,
                    "stage_result": stage_result,
                    "message": "No new changes to commit",
                    "story_id": story_id,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Commit files
            commit_result = await self._commit_files(workspace_path, commit_message)
            
            if not commit_result["success"]:
                return {
                    "success": False,
                    "error": f"Failed to commit files: {commit_result.get('error', 'unknown error')}",
                    "stage_result": stage_result,
                    "commit_result": commit_result,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Files committed successfully", 
                       story_id=story_id,
                       commit_hash=commit_result.get("commit_hash"),
                       files_committed=stage_result.get("files_staged", 0),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "commit_hash": commit_result.get("commit_hash"),
                "commit_message": commit_message,
                "files_committed": stage_result.get("files_staged", 0),
                "stage_result": stage_result,
                "commit_result": commit_result,
                "story_id": story_id,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error committing files", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    def _is_git_repository(self, workspace_path: str) -> bool:
        """Check if the workspace is a git repository."""
        
        git_dir = os.path.join(workspace_path, '.git')
        return os.path.exists(git_dir)
    
    async def _stage_files(self, workspace_path: str, 
                          generated_files: Dict[str, Any]) -> Dict[str, Any]:
        """Stage generated files for commit."""
        
        try:
            # Configure git user if needed
            await self._configure_git_user(workspace_path)
            
            # Use 'git add --all' to stage all changes (more robust than individual adds)
            result = subprocess.run(
                ['git', 'add', '--all'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"git add --all failed: {result.stderr}",
                    "output": result.stdout
                }
            
            # Check staged files
            staged_files = await self._get_staged_files(workspace_path)
            
            # If no files staged, it might mean no changes - which is OK for a re-run
            if not staged_files:
                logger.warning("No files staged - repository may already be up to date")
                return {
                    "success": True,
                    "files_staged": 0,
                    "staged_files": [],
                    "message": "No new changes to stage - repository may already be up to date"
                }
            
            return {
                "success": True,
                "files_staged": len(staged_files),
                "staged_files": staged_files
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_files_to_stage(self, workspace_path: str, 
                           generated_files: Dict[str, Any]) -> List[str]:
        """Get list of files that should be staged."""
        
        files_to_stage = []
        
        try:
            # Get all files in workspace (excluding common ignore patterns)
            ignore_patterns = {
                'node_modules', '.git', 'coverage', 'dist', 'build', 
                '.env', '.env.local', '.DS_Store', '*.log'
            }
            
            for root, dirs, files in os.walk(workspace_path):
                # Filter out ignored directories
                dirs[:] = [d for d in dirs if d not in ignore_patterns]
                
                for file in files:
                    # Skip ignored files
                    if any(pattern in file for pattern in ignore_patterns):
                        continue
                    
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, workspace_path)
                    
                    # Only include source files and configs
                    if self._should_include_file(relative_path):
                        files_to_stage.append(relative_path)
            
            return files_to_stage
            
        except Exception as e:
            logger.error("Error getting files to stage", error=str(e))
            return []
    
    def _should_include_file(self, file_path: str) -> bool:
        """Determine if a file should be included in the commit."""
        
        # Include source files
        source_extensions = {'.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.html', '.css'}
        
        # Include config files
        config_files = {
            'package.json', 'tsconfig.json', '.eslintrc.json', '.prettierrc',
            'jest.config.js', 'vite.config.ts', 'README.md', 'index.html',
            'tailwind.config.js', 'postcss.config.js', '.gitignore'
        }
        
        file_name = os.path.basename(file_path)
        file_ext = os.path.splitext(file_path)[1]
        
        return file_ext in source_extensions or file_name in config_files
    
    async def _configure_git_user(self, workspace_path: str):
        """Configure git user for commits if not already configured."""
        
        try:
            # Check if user is already configured
            result = subprocess.run(
                ['git', 'config', 'user.email'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # ALWAYS configure git user to ensure consistent author
            # This prevents using the global git config which may be different
            email = getattr(settings, 'git_user_email', 'ai-sdlc-automation@example.com')
            name = getattr(settings, 'git_user_name', 'AI SDLC Automation')
            
            subprocess.run(
                ['git', 'config', 'user.email', email],
                cwd=workspace_path,
                timeout=10
            )
            
            subprocess.run(
                ['git', 'config', 'user.name', name],
                cwd=workspace_path,
                timeout=10
            )
            
            logger.info("Configured git user", email=email, name=name)
                
        except Exception as e:
            logger.warning("Failed to configure git user", error=str(e))
    
    async def _get_staged_files(self, workspace_path: str) -> List[str]:
        """Get list of currently staged files."""
        
        try:
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                staged_files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
                return staged_files
            
            return []
            
        except Exception as e:
            logger.error("Error getting staged files", error=str(e))
            return []
    
    async def _commit_files(self, workspace_path: str, 
                          commit_message: str) -> Dict[str, Any]:
        """Commit the staged files."""
        
        try:
            # Commit files
            result = subprocess.run(
                ['git', 'commit', '-m', commit_message],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return {
                    "success": False,
                    "error": result.stderr,
                    "output": result.stdout
                }
            
            # Get commit hash
            commit_hash = await self._get_latest_commit_hash(workspace_path)
            
            return {
                "success": True,
                "commit_hash": commit_hash,
                "output": result.stdout
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _get_latest_commit_hash(self, workspace_path: str) -> str:
        """Get the hash of the latest commit."""
        
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return result.stdout.strip()
            
            return ""
            
        except Exception:
            return ""
    
    def _generate_commit_message(self, story_data: Dict[str, Any], 
                               generated_files: Dict[str, Any]) -> str:
        """Generate a descriptive commit message."""
        
        story_id = story_data.get("id")
        story_title = story_data.get("title", "")
        
        # Get file counts
        totals = generated_files.get("totals", {})
        total_files = totals.get("total_files", 0)
        components = totals.get("components", 0)
        tests = totals.get("tests", 0)
        
        # Create commit message
        commit_message = f"feat: implement story #{story_id} - {story_title}\n\n"
        
        if total_files > 0:
            commit_message += f"Generated {total_files} files:\n"
            
            if components > 0:
                commit_message += f"- {components} React components\n"
            if tests > 0:
                commit_message += f"- {tests} test files\n"
            
            # Add configuration files
            config_files = totals.get("config_files", 0)
            if config_files > 0:
                commit_message += f"- {config_files} configuration files\n"
        
        commit_message += f"\nStory ID: {story_id}\n"
        commit_message += "Generated by: AI-SDLC Automation System"
        
        return commit_message


# Global tool instance
commit_files_tool = CommitFilesTool()