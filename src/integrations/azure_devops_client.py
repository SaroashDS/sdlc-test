"""Azure DevOps API client for fetching and updating work items."""

import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from src.config import settings
from src.utils.config import secret_manager
from src.utils.logging import get_logger
from src.models.story_model import ADOStory, StoryState, StoryType, AcceptanceCriteria, StoryLinks, StoryAssignment, StoryMetadata
import json

logger = get_logger(__name__)


class AzureDevOpsClient:
    """Client for Azure DevOps REST API."""
    
    def __init__(self):
        self.base_url = f"{settings.ado_base_url}/{settings.ado_organization}/{settings.ado_project}"
        self.api_version = settings.ado_api_version
        self._pat_token = None
        self._client = None
    
    @property
    def pat_token(self) -> str:
        """Get PAT token from Secret Manager."""
        if not self._pat_token:
            self._pat_token = secret_manager.get_ado_pat()
        return self._pat_token
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get HTTP client with authentication."""
        if not self._client:
            self._client = httpx.AsyncClient(
                auth=("", self.pat_token),
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=30.0
            )
        return self._client
    
    async def get_work_item(self, work_item_id: int) -> Optional[ADOStory]:
        """Fetch a work item by ID."""
        try:
            url = f"{self.base_url}/_apis/wit/workitems/{work_item_id}"
            params = {
                "api-version": self.api_version,
                "$expand": "relations"
            }
            
            logger.info("Fetching work item", work_item_id=work_item_id)
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return self._parse_work_item(data)
            
        except httpx.HTTPStatusError as e:
            logger.error("HTTP error fetching work item", 
                        work_item_id=work_item_id, 
                        status_code=e.response.status_code,
                        error=str(e))
            return None
        except Exception as e:
            logger.error("Error fetching work item", 
                        work_item_id=work_item_id, 
                        error=str(e))
            return None
    
    async def update_work_item_state(self, work_item_id: int, new_state: StoryState) -> bool:
        """Update work item state."""
        try:
            url = f"{self.base_url}/_apis/wit/workitems/{work_item_id}"
            params = {"api-version": self.api_version}
            
            # JSON Patch format for ADO API
            patch_data = [
                {
                    "op": "add",
                    "path": "/fields/System.State",
                    "value": new_state.value
                }
            ]
            
            logger.info("Updating work item state", 
                       work_item_id=work_item_id, 
                       new_state=new_state)
            
            response = await self.client.patch(
                url, 
                json=patch_data,
                params=params,
                headers={"Content-Type": "application/json-patch+json"}
            )
            response.raise_for_status()
            
            logger.info("Work item state updated successfully", 
                       work_item_id=work_item_id)
            return True
            
        except Exception as e:
            logger.error("Error updating work item state", 
                        work_item_id=work_item_id, 
                        error=str(e))
            return False
    
    async def add_work_item_comment(self, work_item_id: int, comment: str) -> bool:
        """Add a comment to work item."""
        try:
            url = f"{self.base_url}/_apis/wit/workitems/{work_item_id}/comments"
            params = {"api-version": self.api_version}
            
            comment_data = {
                "text": comment
            }
            
            logger.info("Adding comment to work item", work_item_id=work_item_id)
            
            response = await self.client.post(url, json=comment_data, params=params)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error("Error adding work item comment", 
                        work_item_id=work_item_id, 
                        error=str(e))
            return False
    
    async def add_work_item_link(self, work_item_id: int, link_url: str, link_type: str = "Hyperlink") -> bool:
        """Add a hyperlink to work item."""
        try:
            url = f"{self.base_url}/_apis/wit/workitems/{work_item_id}"
            params = {"api-version": self.api_version}
            
            # JSON Patch to add relation
            patch_data = [
                {
                    "op": "add",
                    "path": "/relations/-",
                    "value": {
                        "rel": link_type,
                        "url": link_url,
                        "attributes": {
                            "comment": "Added by AI-SDLC Automation"
                        }
                    }
                }
            ]
            
            response = await self.client.patch(
                url,
                json=patch_data,
                params=params,
                headers={"Content-Type": "application/json-patch+json"}
            )
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error("Error adding work item link", 
                        work_item_id=work_item_id, 
                        error=str(e))
            return False
    
    def _parse_work_item(self, data: Dict[str, Any]) -> ADOStory:
        """Parse work item data into ADOStory model."""
        fields = data.get("fields", {})
        relations = data.get("relations", [])
        
        # Parse acceptance criteria from description or custom field
        acceptance_criteria = self._parse_acceptance_criteria(
            fields.get("System.Description", "")
        )
        
        # Parse links from relations
        links = self._parse_links(relations)
        
        # Parse assignment info
        assignment = StoryAssignment(
            assigned_to=fields.get("System.AssignedTo", {}).get("displayName"),
            team=fields.get("System.TeamProject"),
            sprint=fields.get("System.IterationPath"),
            iteration_path=fields.get("System.IterationPath")
        )
        
        # Parse metadata
        metadata = StoryMetadata(
            priority=fields.get("Microsoft.VSTS.Common.Priority"),
            story_points=fields.get("Microsoft.VSTS.Scheduling.StoryPoints"),
            business_value=fields.get("Microsoft.VSTS.Common.BusinessValue"),
            effort=fields.get("Microsoft.VSTS.Scheduling.Effort"),
            risk=fields.get("Microsoft.VSTS.Common.Risk"),
            tags=fields.get("System.Tags", "").split(";") if fields.get("System.Tags") else []
        )
        
        return ADOStory(
            id=data["id"],
            title=fields.get("System.Title", ""),
            description=fields.get("System.Description", ""),
            state=StoryState(fields.get("System.State", "New")),
            work_item_type=StoryType(fields.get("System.WorkItemType", "User Story")),
            acceptance_criteria=acceptance_criteria,
            links=links,
            assignment=assignment,
            metadata=metadata,
            created_date=datetime.fromisoformat(fields.get("System.CreatedDate", "").replace("Z", "+00:00")),
            changed_date=datetime.fromisoformat(fields.get("System.ChangedDate", "").replace("Z", "+00:00")),
            url=data.get("url", ""),
            revision=data.get("rev", 1),
            area_path=fields.get("System.AreaPath", ""),
            custom_fields={k: v for k, v in fields.items() if k.startswith("Custom.")}
        )
    
    def _parse_acceptance_criteria(self, description: str) -> List[AcceptanceCriteria]:
        """Parse acceptance criteria from description."""
        criteria = []
        
        # Look for common acceptance criteria patterns
        patterns = [
            r"(?i)acceptance criteria?:?\s*\n(.*?)(?=\n\n|\n[A-Z]|\Z)",
            r"(?i)given.*when.*then.*",
            r"(?i)as a.*i want.*so that.*"
        ]
        
        # Simple parsing - in real implementation, this would be more sophisticated
        lines = description.split('\n')
        in_criteria_section = False
        criteria_counter = 1
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if we're entering acceptance criteria section
            if any(keyword in line.lower() for keyword in ["acceptance criteria", "given", "when", "then"]):
                in_criteria_section = True
                
            if in_criteria_section and (line.startswith('-') or line.startswith('*') or line.startswith(str(criteria_counter))):
                criteria.append(AcceptanceCriteria(
                    id=f"ac_{criteria_counter}",
                    description=line.lstrip('-*0123456789. '),
                    completed=False
                ))
                criteria_counter += 1
        
        return criteria
    
    def _parse_links(self, relations: List[Dict[str, Any]]) -> StoryLinks:
        """Parse links from work item relations."""
        links = StoryLinks()
        
        for relation in relations:
            if relation.get("rel") == "Hyperlink":
                url = relation.get("url", "")
                
                if "figma.com" in url:
                    links.figma_design_url = url
                elif "github.com" in url:
                    links.github_repo_url = url
                elif "prototype" in url.lower():
                    links.prototype_url = url
                elif any(doc_keyword in url.lower() for doc_keyword in ["doc", "wiki", "confluence"]):
                    links.documentation_url = url
        
        return links
    
    async def update_work_item(self, work_item_id: int, updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Update a work item with the provided updates."""
        try:
            url = f"{self.base_url}/{self.organization}/{self.project}/_apis/wit/workitems/{work_item_id}"
            params = {"api-version": "7.0"}
            
            headers = {
                "Content-Type": "application/json-patch+json"
            }
            
            logger.info("Updating work item", work_item_id=work_item_id, updates_count=len(updates))
            
            response = await self._client.patch(url, json=updates, params=params, headers=headers)
            response.raise_for_status()
            
            return {
                "success": True,
                "work_item": response.json()
            }
            
        except Exception as e:
            logger.error("Error updating work item", work_item_id=work_item_id, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def add_hyperlink_to_work_item(self, work_item_id: int, url: str, comment: str = "") -> Dict[str, Any]:
        """Add a hyperlink to a work item."""
        try:
            api_url = f"{self.base_url}/{self.organization}/{self.project}/_apis/wit/workitems/{work_item_id}"
            params = {"api-version": "7.0"}
            
            # Create hyperlink relation
            updates = [{
                "op": "add",
                "path": "/relations/-",
                "value": {
                    "rel": "Hyperlink",
                    "url": url,
                    "attributes": {
                        "comment": comment
                    }
                }
            }]
            
            headers = {
                "Content-Type": "application/json-patch+json"
            }
            
            logger.info("Adding hyperlink to work item", work_item_id=work_item_id, url=url)
            
            response = await self._client.patch(api_url, json=updates, params=params, headers=headers)
            response.raise_for_status()
            
            return {
                "success": True,
                "work_item": response.json()
            }
            
        except Exception as e:
            logger.error("Error adding hyperlink to work item", work_item_id=work_item_id, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def add_comment_to_work_item(self, work_item_id: int, comment_text: str) -> Dict[str, Any]:
        """Add a comment to a work item."""
        try:
            # Comments are added via the History field
            api_url = f"{self.base_url}/{self.organization}/{self.project}/_apis/wit/workitems/{work_item_id}"
            params = {"api-version": "7.0"}
            
            updates = [{
                "op": "add",
                "path": "/fields/System.History",
                "value": comment_text
            }]
            
            headers = {
                "Content-Type": "application/json-patch+json"
            }
            
            logger.info("Adding comment to work item", work_item_id=work_item_id)
            
            response = await self._client.patch(api_url, json=updates, params=params, headers=headers)
            response.raise_for_status()
            
            return {
                "success": True,
                "work_item": response.json()
            }
            
        except Exception as e:
            logger.error("Error adding comment to work item", work_item_id=work_item_id, error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()