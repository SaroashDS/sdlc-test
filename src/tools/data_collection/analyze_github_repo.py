"""Tool #3: Analyze GitHub Repository - Analyzes existing repository structure and patterns."""

from typing import Optional, Dict, Any, Tuple
from src.integrations.client_factory import get_github_client
from src.models.implementation_plan import RepositoryAnalysis
from src.utils.logging import get_logger
import time
import json
import re

logger = get_logger(__name__)


class AnalyzeGitHubRepoTool:
    """Tool for analyzing GitHub repository structure and code patterns."""
    
    def __init__(self):
        self.name = "analyze_github_repo"
        self.description = "Analyzes GitHub repository structure, dependencies, and code patterns"
    
    async def execute(self, repo_url: str) -> Dict[str, Any]:
        """
        Analyze GitHub repository for existing patterns and structure.
        
        Args:
            repo_url: GitHub repository URL
            
        Returns:
            Dict containing repository analysis and patterns
        """
        start_time = time.time()
        
        try:
            # Parse repository URL
            owner, repo = self._parse_repo_url(repo_url)
            if not owner or not repo:
                return {
                    "success": False,
                    "error": "Invalid GitHub repository URL format",
                    "analysis": None,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            logger.info("Analyzing GitHub repository", owner=owner, repo=repo)
            
            # Get GitHub client and store as instance variable for other methods
            self.github_client = get_github_client()
            
            # Check if repository exists
            repo_info = await self.github_client.get_repository(owner, repo)
            
            if not repo_info:
                logger.info(f"Repository {owner}/{repo} not found. Attempting to create it...")
                repo_info = await self.github_client.create_repository(repo)
                
                if not repo_info:
                    return {
                        "success": False,
                        "error": f"Repository {owner}/{repo} not found and could not be created.",
                        "analysis": None,
                        "duration_ms": int((time.time() - start_time) * 1000)
                    }
                
                # Re-parse owner/repo in case creation changed anything (e.g. if created under user account)
                owner = repo_info.get("owner", {}).get("login", owner)
                repo = repo_info.get("name", repo)
                logger.info(f"Successfully created repository: {owner}/{repo}")
            
            # Determine if this is a new repository
            is_new_repo = self._is_new_repository(repo_info)
            
            # Analyze repository structure
            if is_new_repo:
                analysis = await self._analyze_new_repository(owner, repo, repo_info)
            else:
                analysis = await self._analyze_existing_repository(owner, repo, repo_info)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("GitHub repository analyzed successfully", 
                       owner=owner, 
                       repo=repo,
                       is_new=is_new_repo,
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "analysis": analysis.dict(),
                "repository_info": {
                    "owner": owner,
                    "repo": repo,
                    "is_new": is_new_repo,
                    "default_branch": repo_info.get("default_branch", "main"),
                    "language": repo_info.get("language"),
                    "size": repo_info.get("size", 0)
                },
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error analyzing GitHub repository", 
                        repo_url=repo_url, 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "analysis": None,
                "duration_ms": duration_ms
            }
    
    def _parse_repo_url(self, repo_url: str) -> Tuple[Optional[str], Optional[str]]:
        """Parse GitHub repository URL to extract owner and repo name."""
        
        # Handle different URL formats
        patterns = [
            r'https://github\.com/([^/]+)/([^/]+)/?$',
            r'git@github\.com:([^/]+)/([^/]+)\.git$',
            r'([^/]+)/([^/]+)$'  # Simple owner/repo format
        ]
        
        for pattern in patterns:
            match = re.match(pattern, repo_url.strip())
            if match:
                owner, repo = match.groups()
                # Remove .git suffix if present
                repo = repo.replace('.git', '')
                return owner, repo
        
        return None, None
    
    def _is_new_repository(self, repo_info: Dict[str, Any]) -> bool:
        """Determine if repository is new/empty."""
        
        # Check repository size and file count
        size = repo_info.get("size", 0)
        
        # Repository is considered new if it's very small
        return size < 100  # Less than 100KB
    
    async def _analyze_new_repository(self, owner: str, repo: str, repo_info: Dict[str, Any]) -> RepositoryAnalysis:
        """Analyze a new/empty repository."""
        
        logger.info("Analyzing new repository", owner=owner, repo=repo)
        
        return RepositoryAnalysis(
            is_new_repository=True,
            existing_patterns={},
            current_dependencies=[],
            current_dev_dependencies=[],
            component_patterns=[],
            hook_patterns=[],
            util_patterns=[],
            has_typescript=False,
            has_eslint=False,
            has_prettier=False,
            has_jest=False,
            src_structure={},
            current_styling=None,
            current_testing=None
        )
    
    async def _analyze_existing_repository(self, owner: str, repo: str, repo_info: Dict[str, Any]) -> RepositoryAnalysis:
        """Analyze an existing repository with code."""
        
        logger.info("Analyzing existing repository", owner=owner, repo=repo)
        
        # Use GitHub client's built-in analysis
        structure_analysis = await self.github_client.analyze_repository_structure(owner, repo)
        
        # Extract patterns from existing code
        patterns = await self._extract_code_patterns(owner, repo)
        
        return RepositoryAnalysis(
            is_new_repository=False,
            existing_patterns=patterns["patterns"],
            current_dependencies=self._extract_dependencies(structure_analysis.get("package_json")),
            current_dev_dependencies=self._extract_dev_dependencies(structure_analysis.get("package_json")),
            component_patterns=patterns["component_patterns"],
            hook_patterns=patterns["hook_patterns"],
            util_patterns=patterns["util_patterns"],
            has_typescript=structure_analysis.get("has_typescript", False),
            has_eslint=structure_analysis.get("has_eslint", False),
            has_prettier=structure_analysis.get("has_prettier", False),
            has_jest=structure_analysis.get("has_jest", False),
            src_structure=structure_analysis.get("src_structure", {}),
            current_styling=structure_analysis.get("styling_approach"),
            current_testing="jest" if structure_analysis.get("has_jest") else None
        )
    
    def _extract_dependencies(self, package_json: Optional[Dict[str, Any]]) -> list:
        """Extract production dependencies from package.json."""
        if not package_json:
            return []
        
        deps = package_json.get("dependencies", {})
        return list(deps.keys())
    
    def _extract_dev_dependencies(self, package_json: Optional[Dict[str, Any]]) -> list:
        """Extract development dependencies from package.json."""
        if not package_json:
            return []
        
        dev_deps = package_json.get("devDependencies", {})
        return list(dev_deps.keys())
    
    async def _extract_code_patterns(self, owner: str, repo: str) -> Dict[str, Any]:
        """Extract code patterns from existing repository."""
        
        patterns = {
            "patterns": {},
            "component_patterns": [],
            "hook_patterns": [],
            "util_patterns": []
        }
        
        try:
            # Look for common pattern files
            pattern_files = [
                "src/components/index.ts",
                "src/hooks/index.ts",
                "src/utils/index.ts",
                "src/types/index.ts"
            ]
            
            for file_path in pattern_files:
                content = await self.github_client.get_file_content(owner, repo, file_path)
                if content:
                    category = file_path.split('/')[1]  # components, hooks, utils, types
                    patterns["patterns"][category] = self._analyze_file_patterns(content)
            
            # Analyze component patterns
            components_dir = await self.github_client.get_repository_contents(owner, repo, "src/components")
            if components_dir:
                patterns["component_patterns"] = await self._analyze_component_patterns(owner, repo, components_dir)
            
            # Analyze hook patterns
            hooks_dir = await self.github_client.get_repository_contents(owner, repo, "src/hooks")
            if hooks_dir:
                patterns["hook_patterns"] = await self._analyze_hook_patterns(owner, repo, hooks_dir)
            
            # Analyze utility patterns
            utils_dir = await self.github_client.get_repository_contents(owner, repo, "src/utils")
            if utils_dir:
                patterns["util_patterns"] = await self._analyze_util_patterns(owner, repo, utils_dir)
        
        except Exception as e:
            logger.warning("Error extracting code patterns", error=str(e))
        
        return patterns
    
    def _analyze_file_patterns(self, content: str) -> Dict[str, Any]:
        """Analyze patterns in a file."""
        
        patterns = {
            "export_style": "named",  # named, default, mixed
            "import_style": "named",
            "naming_convention": "camelCase",
            "has_types": False,
            "has_interfaces": False
        }
        
        # Analyze export patterns
        if "export default" in content:
            if "export {" in content or "export const" in content:
                patterns["export_style"] = "mixed"
            else:
                patterns["export_style"] = "default"
        
        # Analyze import patterns
        if re.search(r'import \{[^}]+\}', content):
            patterns["import_style"] = "named"
        elif re.search(r'import \w+ from', content):
            if patterns["import_style"] == "named":
                patterns["import_style"] = "mixed"
            else:
                patterns["import_style"] = "default"
        
        # Check for TypeScript features
        patterns["has_types"] = "type " in content
        patterns["has_interfaces"] = "interface " in content
        
        # Analyze naming convention
        if re.search(r'const [a-z][a-zA-Z0-9]*[A-Z]', content):
            patterns["naming_convention"] = "camelCase"
        elif re.search(r'const [a-z][a-z0-9_]*', content):
            patterns["naming_convention"] = "snake_case"
        elif re.search(r'const [A-Z][a-zA-Z0-9]*', content):
            patterns["naming_convention"] = "PascalCase"
        
        return patterns
    
    async def _analyze_component_patterns(self, owner: str, repo: str, components_dir: list) -> list:
        """Analyze React component patterns."""
        
        patterns = []
        
        # Sample a few component files
        component_files = [f for f in components_dir if f["name"].endswith(('.tsx', '.jsx'))][:3]
        
        for file_info in component_files:
            content = await self.github_client.get_file_content(owner, repo, file_info["path"])
            if content:
                pattern = self._analyze_component_file(content, file_info["name"])
                patterns.append(pattern)
        
        return patterns
    
    def _analyze_component_file(self, content: str, filename: str) -> Dict[str, Any]:
        """Analyze a single component file for patterns."""
        
        pattern = {
            "filename": filename,
            "component_type": "functional",  # functional, class
            "uses_hooks": False,
            "uses_props_interface": False,
            "styling_approach": "unknown",
            "has_default_export": False,
            "uses_memo": False
        }
        
        # Check component type
        if "class " in content and "extends" in content:
            pattern["component_type"] = "class"
        
        # Check for hooks
        hook_patterns = [r'useState', r'useEffect', r'useCallback', r'useMemo', r'useContext']
        pattern["uses_hooks"] = any(re.search(p, content) for p in hook_patterns)
        
        # Check for props interface
        pattern["uses_props_interface"] = bool(re.search(r'interface \w+Props', content))
        
        # Check styling approach
        if "styled-components" in content or "styled." in content:
            pattern["styling_approach"] = "styled-components"
        elif "className=" in content:
            pattern["styling_approach"] = "css-classes"
        elif "style=" in content:
            pattern["styling_approach"] = "inline-styles"
        
        # Check export style
        pattern["has_default_export"] = "export default" in content
        
        # Check for React.memo
        pattern["uses_memo"] = "React.memo" in content or "memo(" in content
        
        return pattern
    
    async def _analyze_hook_patterns(self, owner: str, repo: str, hooks_dir: list) -> list:
        """Analyze custom hook patterns."""
        
        patterns = []
        
        hook_files = [f for f in hooks_dir if f["name"].startswith('use') and f["name"].endswith(('.ts', '.tsx'))][:3]
        
        for file_info in hook_files:
            content = await self.github_client.get_file_content(owner, repo, file_info["path"])
            if content:
                pattern = {
                    "filename": file_info["name"],
                    "returns_object": "{" in content and "return {" in content,
                    "returns_array": "[" in content and "return [" in content,
                    "uses_other_hooks": any(hook in content for hook in ["useState", "useEffect", "useCallback"]),
                    "has_typescript": ": " in content and "=>" in content
                }
                patterns.append(pattern)
        
        return patterns
    
    async def _analyze_util_patterns(self, owner: str, repo: str, utils_dir: list) -> list:
        """Analyze utility function patterns."""
        
        patterns = []
        
        util_files = [f for f in utils_dir if f["name"].endswith(('.ts', '.js'))][:3]
        
        for file_info in util_files:
            content = await self.github_client.get_file_content(owner, repo, file_info["path"])
            if content:
                pattern = {
                    "filename": file_info["name"],
                    "export_style": "named" if "export const" in content else "default",
                    "uses_typescript": file_info["name"].endswith('.ts'),
                    "function_style": "arrow" if "=>" in content else "declaration",
                    "has_tests": "test" in file_info["name"] or "spec" in file_info["name"]
                }
                patterns.append(pattern)
        
        return patterns


# Global tool instance
analyze_github_repo_tool = AnalyzeGitHubRepoTool()