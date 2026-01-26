"""Tool #21: Fetch Current Code - Retrieves current code from GitHub PR branch."""

import os
from typing import Dict, Any
from src.integrations.client_factory import get_github_client
from src.config import settings
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class FetchCurrentCodeTool:
    """Tool for fetching current code from PR branch."""
    
    def __init__(self):
        self.name = "fetch_current_code"
        self.description = "Fetches current code files from GitHub PR branch"
    
    async def execute(self, repository_info: Dict[str, Any], 
                     branch_name: str,
                     file_paths: list = None) -> Dict[str, Any]:
        """
        Fetch current code from PR branch.
        
        Args:
            repository_info: Repository information (owner, repo)
            branch_name: Branch name to fetch code from
            file_paths: Optional list of specific files to fetch
            
        Returns:
            Dict containing current code files
        """
        start_time = time.time()
        
        try:
            owner = repository_info["owner"]
            repo = repository_info["repo"]
            
            logger.info("Fetching current code", 
                       owner=owner, repo=repo, branch=branch_name)
            
            if file_paths:
                # Fetch specific files
                code_files = {}
                for file_path in file_paths:
                    content = await get_github_client().get_file_content(owner, repo, file_path, branch_name)
                    if content:
                        code_files[file_path] = content
            else:
                # Fetch all source files
                code_files = await self._fetch_all_source_files(owner, repo, branch_name)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Current code fetched successfully", 
                       branch=branch_name,
                       files_count=len(code_files),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "branch_name": branch_name,
                "code_files": code_files,
                "files_count": len(code_files),
                "repository": repository_info,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error fetching current code", 
                        error=str(e), duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    async def _fetch_all_source_files(self, owner: str, repo: str, branch: str) -> Dict[str, str]:
        """Fetch all source files from the repository."""
        
        code_files = {}
        
        try:
            # Get repository contents
            contents = await get_github_client().get_repository_contents(owner, repo, "")
            
            if contents:
                await self._fetch_directory_contents(owner, repo, branch, "", contents, code_files)
            
            return code_files
            
        except Exception as e:
            logger.error("Error fetching all source files", error=str(e))
            return {}
    
    async def _fetch_directory_contents(self, owner: str, repo: str, branch: str, 
                                      path: str, contents: list, code_files: Dict[str, str]):
        """Recursively fetch directory contents."""
        
        for item in contents:
            item_path = item["path"]
            
            # Skip common directories to ignore
            if any(ignore in item_path for ignore in ['node_modules', '.git', 'coverage', 'dist', 'build']):
                continue
            
            if item["type"] == "file":
                # Only fetch source files
                if self._is_source_file(item_path):
                    content = await get_github_client().get_file_content(owner, repo, item_path, branch)
                    if content:
                        code_files[item_path] = content
            
            elif item["type"] == "dir":
                # Recursively fetch directory contents
                dir_contents = await get_github_client().get_repository_contents(owner, repo, item_path)
                if dir_contents:
                    await self._fetch_directory_contents(owner, repo, branch, item_path, dir_contents, code_files)
    
    def _is_source_file(self, file_path: str) -> bool:
        """Determine if a file is a source file we should fetch."""
        
        source_extensions = {'.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml'}
        config_files = {
            'package.json', 'tsconfig.json', '.eslintrc.json', '.prettierrc',
            'jest.config.js', 'vite.config.ts', 'README.md'
        }
        
        file_name = os.path.basename(file_path)
        file_ext = os.path.splitext(file_path)[1]
        
        return file_ext in source_extensions or file_name in config_files


# Global tool instance
fetch_current_code_tool = FetchCurrentCodeTool()
