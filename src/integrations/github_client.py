"""GitHub API client for repository operations and pull request management."""

import httpx
import jwt
import time
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from src.config import settings
from src.utils.config import secret_manager
from src.utils.logging import get_logger
import base64
import json

logger = get_logger(__name__)


class GitHubClient:
    """Client for GitHub REST API. Supports PAT token or GitHub App authentication."""
    
    def __init__(self):
        self.base_url = settings.github_base_url
        self.app_id = settings.github_app_id
        self.installation_id = settings.github_installation_id
        self._token = None
        self._private_key = None
        self._token_expires_at = None
        self._client = None
        self._use_pat = bool(settings.github_token)
    
    async def _get_token(self) -> str:
        """Get access token. Uses PAT if available, otherwise GitHub App flow."""
        if self._use_pat:
            return secret_manager.get_github_token()
        
        # GitHub App flow: check token expiry
        if (self._token and self._token_expires_at and 
            datetime.utcnow() < self._token_expires_at - timedelta(minutes=5)):
            return self._token
        
        # Generate JWT and get installation token
        if not self._private_key:
            self._private_key = secret_manager.get_github_token()
        
        now = int(time.time())
        jwt_payload = {"iat": now - 60, "exp": now + 600, "iss": self.app_id}
        jwt_token = jwt.encode(jwt_payload, self._private_key, algorithm="RS256")
        
        url = f"{self.base_url}/app/installations/{self.installation_id}/access_tokens"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers={
                "Authorization": f"Bearer {jwt_token}",
                "Accept": "application/vnd.github.v3+json"
            })
            response.raise_for_status()
            data = response.json()
            self._token = data["token"]
            self._token_expires_at = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
        
        return self._token
    
    @property
    async def client(self) -> httpx.AsyncClient:
        """Get HTTP client with authentication."""
        if not self._client:
            token = await self._get_token()
            self._client = httpx.AsyncClient(
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "AI-SDLC-Automation/1.0"
                },
                timeout=30.0
            )
        return self._client
    
    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """Get repository information."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}"
            client = await self.client
            
            logger.info("Fetching repository info", owner=owner, repo=repo)
            
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            # Only log error if it's not a 404 (404 is expected for new repos)
            if hasattr(e, 'response') and e.response.status_code != 404:
                logger.error("Error fetching repository", owner=owner, repo=repo, error=str(e))
            return None

    async def create_repository(self, name: str, private: bool = True) -> Optional[Dict[str, Any]]:
        """Create a new repository for the authenticated user/app."""
        try:
            # For PAT tokens, we create on the user account
            url = f"{self.base_url}/user/repos"
            if not self._use_pat:
                # For Apps, we might need a different flow depending on installation, 
                # but for simplicity in this demo, we assume PAT-like creation or organization creation
                url = f"{self.base_url}/user/repos" 
            
            client = await self.client
            data = {
                "name": name,
                "private": private,
                "auto_init": True, # Create a README so we have a 'main' branch
                "description": "Created by AI-SDLC Automation System"
            }
            
            logger.info("Creating new repository", name=name)
            response = await client.post(url, json=data)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            logger.error("Error creating repository", name=name, error=str(e))
            return None
    
    async def get_repository_contents(self, owner: str, repo: str, path: str = "") -> Optional[List[Dict[str, Any]]]:
        """Get repository contents at specified path."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            data = response.json()
            return data if isinstance(data, list) else [data]
            
        except Exception as e:
            logger.error("Error fetching repository contents", 
                        owner=owner, repo=repo, path=path, error=str(e))
            return None
    
    async def get_file_content(self, owner: str, repo: str, path: str, ref: str = "main") -> Optional[str]:
        """Get file content from repository."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
            params = {"ref": ref}
            client = await self.client
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get("encoding") == "base64":
                content = base64.b64decode(data["content"]).decode("utf-8")
                return content
            
            return data.get("content", "")
            
        except Exception as e:
            logger.error("Error fetching file content", 
                        owner=owner, repo=repo, path=path, error=str(e))
            return None
    
    async def create_branch(self, owner: str, repo: str, branch_name: str, base_branch: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new branch with dynamic base branch discovery and idempotency.
        """
        try:
            client = await self.client
            
            # 1. Fetch Repository Metadata (Dynamic Discovery)
            repo_data = await self.get_repository(owner, repo)
            if not repo_data:
                raise RuntimeError(f"Repository {owner}/{repo} not found.")
            
            # Check for empty repository
            if repo_data.get("size") == 0:
                logger.warning("Repository is empty, allowing local initialization", owner=owner, repo=repo)
                return {
                    "success": True,
                    "branch_name": branch_name,
                    "is_empty": True,
                    "branch_url": f"https://github.com/{owner}/{repo}/tree/{branch_name}",
                    "message": "Repository is empty. Branch will be created on initial push."
                }

            # If no base_branch provided, use the discovered default_branch
            actual_base = base_branch or repo_data.get("default_branch", "main")
            
            # 2. Idempotency Check: Does the branch already exist?
            check_url = f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{branch_name}"
            check_response = await client.get(check_url)
            
            if check_response.status_code == 200:
                logger.info("Branch already exists, reusing it", branch=branch_name)
                branch_data = check_response.json()
                return {
                    "success": True,
                    "branch_name": branch_name,
                    "branch_url": f"https://github.com/{owner}/{repo}/tree/{branch_name}",
                    "sha": branch_data["object"]["sha"],
                    "reused": True
                }

            # 3. Get Base Branch SHA
            base_ref_url = f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{actual_base}"
            logger.info("Fetching base ref", url=base_ref_url)
            response = await client.get(base_ref_url)
            
            if response.status_code != 200:
                raise RuntimeError(f"Base branch '{actual_base}' not found for {owner}/{repo}. Status: {response.status_code}")
                
            base_sha = response.json()["object"]["sha"]
            
            # 4. Create New Branch
            create_ref_url = f"{self.base_url}/repos/{owner}/{repo}/git/refs"
            ref_data = {
                "ref": f"refs/heads/{branch_name}",
                "sha": base_sha
            }
            
            logger.info("Creating new branch", owner=owner, repo=repo, branch=branch_name, from_base=actual_base)
            
            response = await client.post(create_ref_url, json=ref_data)
            response.raise_for_status()
            
            branch_data = response.json()
            
            return {
                "success": True,
                "branch_name": branch_name,
                "branch_url": f"https://github.com/{owner}/{repo}/tree/{branch_name}",
                "sha": branch_data["object"]["sha"],
                "reused": False
            }
            
        except httpx.HTTPStatusError as e:
            msg = f"HTTP Error during branch operation: {e.response.text}"
            logger.error(msg, owner=owner, repo=repo, branch=branch_name)
            return {"success": False, "error": msg}
        except Exception as e:
            logger.error("Error in robust branch creation", 
                        owner=owner, repo=repo, branch=branch_name, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_or_update_file(self, owner: str, repo: str, path: str, content: str, 
                                   message: str, branch: str, sha: Optional[str] = None) -> bool:
        """Create or update a file in repository."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
            client = await self.client
            
            # Encode content to base64
            encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
            
            file_data = {
                "message": message,
                "content": encoded_content,
                "branch": branch
            }
            
            # If updating existing file, include SHA
            if sha:
                file_data["sha"] = sha
            
            logger.info("Creating/updating file", owner=owner, repo=repo, path=path, branch=branch)
            
            response = await client.put(url, json=file_data)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error("Error creating/updating file", 
                        owner=owner, repo=repo, path=path, error=str(e))
            return False
    
    async def create_pull_request(self, owner: str, repo: str, title: str, body: str, 
                                 head: str, base: str = "main") -> Dict[str, Any]:
        """Create a pull request."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
            client = await self.client
            
            pr_data = {
                "title": title,
                "body": body,
                "head": head,
                "base": base
            }
            
            logger.info("Creating pull request", owner=owner, repo=repo, title=title)
            
            response = await client.post(url, json=pr_data)
            response.raise_for_status()
            
            pr_info = response.json()
            
            return {
                "success": True,
                "pr_number": pr_info["number"],
                "pr_url": pr_info["html_url"],
                "pr_id": pr_info["id"],
                "pr_data": pr_info
            }
            
        except Exception as e:
            error_msg = str(e)
            # Try to get detailed error from GitHub response
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    if 'errors' in error_data:
                        # Format: "Message: error1, error2"
                        error_details = []
                        for err in error_data['errors']:
                            if isinstance(err, dict):
                                msg = err.get('message', '')
                                if not msg and 'resource' in err and 'code' in err:
                                    msg = f"{err['resource']} {err['code']}"
                                if msg: error_details.append(msg)
                            elif isinstance(err, str):
                                error_details.append(err)
                        
                        if error_details:
                            error_msg = f"{error_data.get('message', 'Validation failed')}: {'; '.join(error_details)}"
                        else:
                            error_msg = error_data.get('message', str(e))
                    elif 'message' in error_data:
                        error_msg = error_data['message']
                except Exception:
                    # Fallback to string representation of exception
                    pass
            
            logger.error("Error creating pull request", 
                        owner=owner, repo=repo, error=error_msg)
            return {
                "success": False,
                "error": error_msg
            }
    
    async def get_branch(self, owner: str, repo: str, branch: str) -> Dict[str, Any]:
        """Get branch information."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/branches/{branch}"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            branch_data = response.json()
            
            return {
                "success": True,
                "sha": branch_data["commit"]["sha"],
                "commit": branch_data["commit"]
            }
            
        except Exception as e:
            logger.error("Error getting branch", 
                        owner=owner, repo=repo, branch=branch, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def compare_commits(self, owner: str, repo: str, base: str, head: str) -> Dict[str, Any]:
        """Compare two commits/branches to see how many commits ahead/behind."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/compare/{base}...{head}"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            compare_data = response.json()
            
            return {
                "success": True,
                "ahead_by": compare_data.get("ahead_by", 0),
                "behind_by": compare_data.get("behind_by", 0),
                "total_commits": compare_data.get("total_commits", 0),
                "status": compare_data.get("status", "unknown"),
                "commits": compare_data.get("commits", [])
            }
            
        except Exception as e:
            logger.error("Error comparing commits", 
                        owner=owner, repo=repo, base=base, head=head, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_pull_requests(self, owner: str, repo: str, state: str = "open", 
                                head: str = None, base: str = None) -> Dict[str, Any]:
        """Get pull requests with optional filters."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
            params = {"state": state}
            if head:
                params["head"] = head
            if base:
                params["base"] = base
            
            client = await self.client
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            prs = response.json()
            
            return {
                "success": True,
                "pull_requests": prs,
                "count": len(prs)
            }
            
        except Exception as e:
            logger.error("Error getting pull requests", 
                        owner=owner, repo=repo, state=state, error=str(e))
            return {
                "success": False,
                "error": str(e),
                "pull_requests": []
            }
    
    async def add_labels_to_pr(self, owner: str, repo: str, pr_number: int, labels: List[str]) -> Dict[str, Any]:
        """Add labels to a pull request."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/issues/{pr_number}/labels"
            client = await self.client
            
            response = await client.post(url, json={"labels": labels})
            response.raise_for_status()
            
            return {
                "success": True,
                "labels_added": labels
            }
            
        except Exception as e:
            logger.error("Error adding labels to PR", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def request_pr_reviewers(self, owner: str, repo: str, pr_number: int, reviewers: List[str]) -> Dict[str, Any]:
        """Request reviewers for a pull request."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/pulls/{pr_number}/requested_reviewers"
            client = await self.client
            
            response = await client.post(url, json={"reviewers": reviewers})
            response.raise_for_status()
            
            return {
                "success": True,
                "reviewers_added": reviewers
            }
            
        except Exception as e:
            logger.error("Error requesting PR reviewers", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def assign_pr(self, owner: str, repo: str, pr_number: int, assignees: List[str]) -> Dict[str, Any]:
        """Assign users to a pull request."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/issues/{pr_number}/assignees"
            client = await self.client
            
            response = await client.post(url, json={"assignees": assignees})
            response.raise_for_status()
            
            return {
                "success": True,
                "assignees_added": assignees
            }
            
        except Exception as e:
            logger.error("Error assigning PR", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
        """Get pull request review comments."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/pulls/{pr_number}/comments"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error fetching PR comments", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return []
    
    async def add_pull_request_comment(self, owner: str, repo: str, pr_number: int, body: str) -> bool:
        """Add a comment to pull request."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/issues/{pr_number}/comments"
            client = await self.client
            
            comment_data = {"body": body}
            
            response = await client.post(url, json=comment_data)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error("Error adding PR comment", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return False
    
    async def get_repository_vulnerabilities(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Get repository vulnerability alerts."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/vulnerability-alerts"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error fetching vulnerabilities", 
                        owner=owner, repo=repo, error=str(e))
            return []
    
    async def get_dependabot_alerts(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Get Dependabot security alerts."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/dependabot/alerts"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error fetching Dependabot alerts", 
                        owner=owner, repo=repo, error=str(e))
            return []
    
    async def analyze_repository_structure(self, owner: str, repo: str) -> Dict[str, Any]:
        """Analyze repository structure for code patterns."""
        try:
            analysis = {
                "has_typescript": False,
                "has_react": False,
                "has_jest": False,
                "has_eslint": False,
                "has_prettier": False,
                "package_json": None,
                "tsconfig": None,
                "src_structure": {},
                "component_patterns": [],
                "styling_approach": None
            }
            
            # Check for key files
            key_files = ["package.json", "tsconfig.json", ".eslintrc.js", ".eslintrc.json", 
                        ".prettierrc", "jest.config.js", "vite.config.ts", "webpack.config.js"]
            
            for file in key_files:
                content = await self.get_file_content(owner, repo, file)
                if content:
                    if file == "package.json":
                        package_data = json.loads(content)
                        analysis["package_json"] = package_data
                        
                        # Check dependencies
                        deps = {**package_data.get("dependencies", {}), 
                               **package_data.get("devDependencies", {})}
                        
                        analysis["has_typescript"] = "typescript" in deps
                        analysis["has_react"] = "react" in deps
                        analysis["has_jest"] = "jest" in deps or "@testing-library/jest-dom" in deps
                        
                        # Determine styling approach
                        if "styled-components" in deps:
                            analysis["styling_approach"] = "styled-components"
                        elif "emotion" in deps or "@emotion/react" in deps:
                            analysis["styling_approach"] = "emotion"
                        elif "tailwindcss" in deps:
                            analysis["styling_approach"] = "tailwind"
                        else:
                            analysis["styling_approach"] = "css-modules"
                    
                    elif file == "tsconfig.json":
                        analysis["tsconfig"] = json.loads(content)
                    
                    elif file.startswith(".eslintrc"):
                        analysis["has_eslint"] = True
                    
                    elif file == ".prettierrc":
                        analysis["has_prettier"] = True
            
            # Analyze src directory structure
            src_contents = await self.get_repository_contents(owner, repo, "src")
            if src_contents:
                analysis["src_structure"] = await self._analyze_directory_structure(
                    owner, repo, "src", src_contents
                )
            
            return analysis
            
        except Exception as e:
            logger.error("Error analyzing repository structure", 
                        owner=owner, repo=repo, error=str(e))
            return {}
    
    async def _analyze_directory_structure(self, owner: str, repo: str, path: str, 
                                         contents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Recursively analyze directory structure."""
        structure = {"files": [], "directories": {}}
        
        for item in contents:
            if item["type"] == "file":
                structure["files"].append(item["name"])
            elif item["type"] == "dir":
                subdir_contents = await self.get_repository_contents(owner, repo, item["path"])
                if subdir_contents:
                    structure["directories"][item["name"]] = await self._analyze_directory_structure(
                        owner, repo, item["path"], subdir_contents
                    )
        
        return structure
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
    async def get_pr_issue_comments(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Get pull request issue comments."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/issues/{pr_number}/comments"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error fetching PR issue comments", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return []
    
    async def get_pr_reviews(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Get pull request reviews."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
            client = await self.client
            
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error fetching PR reviews", 
                        owner=owner, repo=repo, pr_number=pr_number, error=str(e))
            return []