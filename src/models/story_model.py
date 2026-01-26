"""Azure DevOps Story data models."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class StoryState(str, Enum):
    """Azure DevOps work item states."""
    NEW = "New"
    ACTIVE = "Active"
    READY_FOR_DEVELOPMENT = "Ready for Development"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    DONE = "Done"
    REMOVED = "Removed"


class StoryType(str, Enum):
    """Azure DevOps work item types."""
    USER_STORY = "User Story"
    BUG = "Bug"
    TASK = "Task"
    FEATURE = "Feature"


class AcceptanceCriteria(BaseModel):
    """Individual acceptance criteria item."""
    id: str
    description: str
    completed: bool = False


class StoryLinks(BaseModel):
    """External links associated with the story."""
    figma_design_url: Optional[str] = None
    github_repo_url: Optional[str] = None
    prototype_url: Optional[str] = None
    documentation_url: Optional[str] = None


class StoryAssignment(BaseModel):
    """Story assignment information."""
    assigned_to: Optional[str] = None
    team: Optional[str] = None
    sprint: Optional[str] = None
    iteration_path: Optional[str] = None


class StoryMetadata(BaseModel):
    """Additional story metadata."""
    priority: Optional[int] = None
    story_points: Optional[int] = None
    business_value: Optional[int] = None
    effort: Optional[str] = None
    risk: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ADOStory(BaseModel):
    """Azure DevOps User Story model."""
    
    # Core fields
    id: int
    title: str
    description: str
    state: StoryState
    work_item_type: StoryType
    
    # Acceptance criteria
    acceptance_criteria: List[AcceptanceCriteria] = Field(default_factory=list)
    
    # External links
    links: StoryLinks = Field(default_factory=StoryLinks)
    
    # Assignment
    assignment: StoryAssignment = Field(default_factory=StoryAssignment)
    
    # Metadata
    metadata: StoryMetadata = Field(default_factory=StoryMetadata)
    
    # Timestamps
    created_date: datetime
    changed_date: datetime
    
    # System fields
    url: str
    revision: int
    area_path: str
    
    # Custom fields (flexible for organization-specific fields)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    
    @property
    def is_ready_for_development(self) -> bool:
        """Check if story is ready for AI development."""
        return (
            self.state == StoryState.READY_FOR_DEVELOPMENT and
            self.links.figma_design_url is not None and
            self.links.github_repo_url is not None and
            len(self.acceptance_criteria) > 0
        )
    
    @property
    def figma_file_key(self) -> Optional[str]:
        """Extract Figma file key from URL."""
        if not self.links.figma_design_url:
            return None
        
        # Extract file key from Figma URL
        # Format: https://www.figma.com/file/FILE_KEY/TITLE
        try:
            parts = self.links.figma_design_url.split('/')
            if 'file' in parts:
                file_index = parts.index('file')
                if file_index + 1 < len(parts):
                    return parts[file_index + 1]
        except (ValueError, IndexError):
            pass
        
        return None
    
    @property
    def github_repo_info(self) -> Optional[Dict[str, str]]:
        """Extract GitHub repository owner and name from URL."""
        if not self.links.github_repo_url:
            return None
        
        # Extract repo info from GitHub URL
        # Format: https://github.com/OWNER/REPO
        try:
            parts = self.links.github_repo_url.rstrip('/').split('/')
            if len(parts) >= 2:
                return {
                    "owner": parts[-2],
                    "repo": parts[-1]
                }
        except (ValueError, IndexError):
            pass
        
        return None


class StoryUpdateEvent(BaseModel):
    """Event model for story updates from ADO webhooks."""
    
    event_type: str
    story_id: int
    previous_state: Optional[StoryState] = None
    current_state: StoryState
    changed_by: str
    changed_date: datetime
    changes: Dict[str, Any] = Field(default_factory=dict)
    
    @property
    def is_development_trigger(self) -> bool:
        """Check if this event should trigger development workflow."""
        return (
            self.current_state == StoryState.READY_FOR_DEVELOPMENT and
            self.previous_state != StoryState.READY_FOR_DEVELOPMENT
        )