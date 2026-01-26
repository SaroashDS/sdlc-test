"""Tool #5: Create Directory Structure - Creates folder hierarchy for the project."""

import os
import asyncio
from typing import Dict, Any, List
from pathlib import Path
from src.config import settings
from src.utils.logging import get_logger
from src.utils.security import code_security_scanner
import time

logger = get_logger(__name__)


class CreateDirectoryStructureTool:
    """Tool for creating project directory structure."""
    
    def __init__(self):
        self.name = "create_directory_structure"
        self.description = "Creates folder hierarchy based on implementation plan"
    
    async def execute(self, implementation_plan: Dict[str, Any], 
                     workspace_path: str = None) -> Dict[str, Any]:
        """
        Create directory structure for the project.
        
        Args:
            implementation_plan: Implementation plan from Agent 1
            workspace_path: Optional custom workspace path
            
        Returns:
            Dict containing created directories and metadata
        """
        start_time = time.time()
        
        try:
            # Determine workspace path
            if not workspace_path:
                workspace_path = os.path.join(
                    settings.temp_workspace_path,
                    f"story_{implementation_plan.get('story_id', 'unknown')}"
                )
            
            logger.info("Creating directory structure", workspace_path=workspace_path)
            
            # Extract directory structure from implementation plan
            directories = self._extract_directories_from_plan(implementation_plan)
            
            # Validate directory paths for security
            security_issues = code_security_scanner.validate_file_paths(directories)
            if security_issues:
                return {
                    "success": False,
                    "error": f"Security issues with directory paths: {'; '.join(security_issues)}",
                    "directories_created": [],
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Create directories
            created_directories = await self._create_directories(workspace_path, directories)
            
            # Create standard files (.gitkeep, etc.)
            standard_files = await self._create_standard_files(workspace_path, created_directories)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Directory structure created successfully", 
                       workspace_path=workspace_path,
                       directories_count=len(created_directories),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "workspace_path": workspace_path,
                "directories_created": created_directories,
                "standard_files_created": standard_files,
                "structure_summary": self._create_structure_summary(created_directories),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error creating directory structure", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "directories_created": [],
                "duration_ms": duration_ms
            }
    
    def _extract_directories_from_plan(self, implementation_plan: Dict[str, Any]) -> List[str]:
        """Extract required directories from implementation plan."""
        
        directories = set()
        
        # Get technical approach
        tech_approach = implementation_plan.get("technical_approach", {})
        folder_structure = tech_approach.get("folder_structure", "feature-based")
        
        # Base directories for React/TypeScript project
        base_dirs = [
            "src",
            "src/components",
            "src/hooks",
            "src/utils",
            "src/types",
            "src/services",
            "src/assets",
            "src/styles",
            "public",
            "tests",
            "__tests__"
        ]
        
        directories.update(base_dirs)
        
        # Add directories based on folder structure approach
        if folder_structure == "feature-based":
            directories.update([
                "src/features",
                "src/shared",
                "src/shared/components",
                "src/shared/hooks",
                "src/shared/utils"
            ])
        elif folder_structure == "domain-based":
            directories.update([
                "src/domain",
                "src/infrastructure",
                "src/presentation",
                "src/application"
            ])
        
        # Add directories from tasks
        tasks = implementation_plan.get("tasks", [])
        for task in tasks:
            files_to_create = task.get("files_to_create", [])
            for file_info in files_to_create:
                file_path = file_info.get("path", "")
                if file_path:
                    # Extract directory from file path
                    dir_path = os.path.dirname(file_path)
                    if dir_path:
                        directories.add(dir_path)
                        
                        # Add parent directories
                        parent_dirs = self._get_parent_directories(dir_path)
                        directories.update(parent_dirs)
        
        # Add testing directories
        test_dirs = [
            "src/__tests__",
            "src/components/__tests__",
            "src/hooks/__tests__",
            "src/utils/__tests__",
            "tests/unit",
            "tests/integration",
            "tests/fixtures",
            "tests/mocks"
        ]
        directories.update(test_dirs)
        
        # Add build/config directories
        config_dirs = [
            ".vscode",
            "docs",
            "scripts"
        ]
        directories.update(config_dirs)
        
        return sorted(list(directories))
    
    def _get_parent_directories(self, path: str) -> List[str]:
        """Get all parent directories for a given path."""
        parents = []
        current_path = path
        
        while current_path and current_path != ".":
            parent = os.path.dirname(current_path)
            if parent and parent != current_path:
                parents.append(parent)
                current_path = parent
            else:
                break
        
        return parents
    
    async def _create_directories(self, workspace_path: str, directories: List[str]) -> List[str]:
        """Create directories in the workspace."""
        
        created_directories = []
        
        # Ensure workspace root exists
        os.makedirs(workspace_path, exist_ok=True)
        
        for directory in directories:
            full_path = os.path.join(workspace_path, directory)
            
            try:
                os.makedirs(full_path, exist_ok=True)
                created_directories.append(directory)
                logger.debug("Created directory", path=directory)
                
            except Exception as e:
                logger.warning("Failed to create directory", 
                             path=directory, 
                             error=str(e))
        
        return created_directories
    
    async def _create_standard_files(self, workspace_path: str, 
                                   directories: List[str]) -> List[str]:
        """Create standard files like .gitkeep, README files."""
        
        standard_files = []
        
        # Create .gitkeep files for empty directories
        gitkeep_dirs = [
            "src/assets",
            "src/styles", 
            "tests/fixtures",
            "tests/mocks",
            "docs",
            "scripts"
        ]
        
        for directory in gitkeep_dirs:
            if directory in directories:
                gitkeep_path = os.path.join(workspace_path, directory, ".gitkeep")
                try:
                    with open(gitkeep_path, 'w') as f:
                        f.write("# This file keeps the directory in git\n")
                    standard_files.append(f"{directory}/.gitkeep")
                except Exception as e:
                    logger.warning("Failed to create .gitkeep", 
                                 path=gitkeep_path, 
                                 error=str(e))
        
        # Create basic README files
        readme_dirs = [
            ("src/components", "# Components\n\nReact components for the application.\n"),
            ("src/hooks", "# Custom Hooks\n\nReusable React hooks.\n"),
            ("src/utils", "# Utilities\n\nUtility functions and helpers.\n"),
            ("tests", "# Tests\n\nTest files and testing utilities.\n")
        ]
        
        for directory, content in readme_dirs:
            if directory in directories:
                readme_path = os.path.join(workspace_path, directory, "README.md")
                try:
                    with open(readme_path, 'w') as f:
                        f.write(content)
                    standard_files.append(f"{directory}/README.md")
                except Exception as e:
                    logger.warning("Failed to create README", 
                                 path=readme_path, 
                                 error=str(e))
        
        return standard_files
    
    def _create_structure_summary(self, directories: List[str]) -> Dict[str, Any]:
        """Create a summary of the directory structure."""
        
        summary = {
            "total_directories": len(directories),
            "src_directories": len([d for d in directories if d.startswith("src/")]),
            "test_directories": len([d for d in directories if "test" in d.lower()]),
            "config_directories": len([d for d in directories if d.startswith(".")]),
            "structure_type": "feature-based",  # Could be determined from analysis
            "main_categories": []
        }
        
        # Categorize directories
        categories = {
            "components": [d for d in directories if "component" in d],
            "hooks": [d for d in directories if "hook" in d],
            "utils": [d for d in directories if "util" in d],
            "tests": [d for d in directories if "test" in d],
            "assets": [d for d in directories if "asset" in d or "style" in d],
            "config": [d for d in directories if d.startswith(".") or d in ["docs", "scripts"]]
        }
        
        for category, dirs in categories.items():
            if dirs:
                summary["main_categories"].append({
                    "category": category,
                    "count": len(dirs),
                    "directories": dirs[:5]  # Show first 5
                })
        
        return summary


# Global tool instance
create_directory_structure_tool = CreateDirectoryStructureTool()