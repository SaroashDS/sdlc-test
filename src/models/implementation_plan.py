"""Implementation Plan data models."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class TaskType(str, Enum):
    """Types of implementation tasks."""
    CREATE_COMPONENT = "create_component"
    CREATE_PAGE = "create_page"
    CREATE_HOOK = "create_hook"
    CREATE_UTIL = "create_util"
    CREATE_SERVICE = "create_service"
    CREATE_TYPE = "create_type"
    CREATE_TEST = "create_test"
    CREATE_STORY = "create_story"
    UPDATE_CONFIG = "update_config"
    INSTALL_DEPENDENCY = "install_dependency"


class Priority(str, Enum):
    """Task priority levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FileType(str, Enum):
    """Types of files to be created."""
    COMPONENT = "component"
    PAGE = "page"
    HOOK = "hook"
    UTIL = "util"
    SERVICE = "service"
    TYPE = "type"
    TEST = "test"
    STORY = "story"
    CONFIG = "config"
    STYLE = "style"


class Dependency(BaseModel):
    """NPM dependency information."""
    name: str
    version: str
    type: str = "dependencies"  # "dependencies" or "devDependencies"
    reason: str  # Why this dependency is needed


class FileToCreate(BaseModel):
    """File that needs to be created."""
    path: str
    type: FileType
    description: str
    dependencies: List[str] = Field(default_factory=list)  # Other files this depends on
    priority: Priority = Priority.MEDIUM
    
    # Template/pattern to follow
    template: Optional[str] = None
    base_component: Optional[str] = None  # If extending existing component
    
    # Figma component mapping
    figma_component_id: Optional[str] = None
    figma_component_name: Optional[str] = None
    
    # Props and interfaces
    props: List[str] = Field(default_factory=list)
    interfaces: List[str] = Field(default_factory=list)
    
    # Styling approach
    styling_approach: str = "css-modules"  # "css-modules", "styled-components", "tailwind"
    
    # Testing requirements
    test_requirements: List[str] = Field(default_factory=list)


class ImplementationTask(BaseModel):
    """Individual implementation task."""
    id: str
    type: TaskType
    title: str
    description: str
    priority: Priority
    
    # Files involved
    files_to_create: List[FileToCreate] = Field(default_factory=list)
    files_to_modify: List[str] = Field(default_factory=list)
    
    # Dependencies
    depends_on: List[str] = Field(default_factory=list)  # Other task IDs
    
    # Acceptance criteria
    acceptance_criteria: List[str] = Field(default_factory=list)
    
    # Estimated effort
    estimated_minutes: int = 30
    
    # Technical details
    technical_notes: List[str] = Field(default_factory=list)


class TechnicalApproach(BaseModel):
    """Technical approach for the implementation."""
    
    # Architecture decisions
    architecture_pattern: str = "component-based"  # "component-based", "page-based", "feature-based"
    state_management: str = "react-hooks"  # "react-hooks", "redux", "zustand", "context"
    routing: str = "react-router"  # "react-router", "next-router", "reach-router"
    
    # Styling approach
    styling_framework: str = "css-modules"  # "css-modules", "styled-components", "emotion", "tailwind"
    ui_library: Optional[str] = None  # "material-ui", "ant-design", "chakra-ui", etc.
    
    # Testing strategy
    testing_approach: str = "jest-rtl"  # "jest-rtl", "cypress", "playwright"
    test_coverage_target: int = 80
    
    # Code organization
    folder_structure: str = "feature-based"  # "feature-based", "type-based", "domain-based"
    naming_convention: str = "camelCase"  # "camelCase", "kebab-case", "PascalCase"
    
    # Performance considerations
    code_splitting: bool = True
    lazy_loading: bool = True
    memoization_strategy: str = "react-memo"  # "react-memo", "useMemo", "useCallback"
    
    # Accessibility
    accessibility_level: str = "WCAG-AA"  # "WCAG-A", "WCAG-AA", "WCAG-AAA"
    
    # Browser support
    target_browsers: List[str] = Field(default_factory=lambda: ["Chrome", "Firefox", "Safari", "Edge"])
    
    # Build and deployment
    build_tool: str = "vite"  # "webpack", "vite", "parcel", "rollup"
    deployment_target: str = "static"  # "static", "server", "serverless"


class QualityGates(BaseModel):
    """Quality gates that must be passed."""
    
    # Code quality
    typescript_strict: bool = True
    eslint_rules: str = "@typescript-eslint/recommended"
    prettier_formatting: bool = True
    
    # Testing requirements
    unit_test_coverage: int = 80
    integration_tests: bool = True
    e2e_tests: bool = False
    
    # Performance requirements
    bundle_size_limit_kb: int = 500
    lighthouse_performance_score: int = 90
    
    # Accessibility requirements
    axe_violations: int = 0
    keyboard_navigation: bool = True
    screen_reader_support: bool = True
    
    # Security requirements
    no_hardcoded_secrets: bool = True
    dependency_vulnerability_scan: bool = True
    
    # Browser compatibility
    cross_browser_testing: bool = True


class RepositoryAnalysis(BaseModel):
    """Analysis of existing repository structure."""
    
    # Repository info
    is_new_repository: bool
    existing_patterns: Dict[str, str] = Field(default_factory=dict)
    
    # Existing dependencies
    current_dependencies: List[str] = Field(default_factory=list)
    current_dev_dependencies: List[str] = Field(default_factory=list)
    
    # Code patterns - now stores detailed pattern analysis
    component_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    hook_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    util_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Configuration files
    has_typescript: bool = False
    has_eslint: bool = False
    has_prettier: bool = False
    has_jest: bool = False
    
    # Folder structure - flexible dict to handle nested structures
    src_structure: Dict[str, Any] = Field(default_factory=dict)
    
    # Styling approach
    current_styling: Optional[str] = None
    
    # Testing setup
    current_testing: Optional[str] = None


class ImplementationPlan(BaseModel):
    """Complete implementation plan for a user story."""
    
    # Story reference
    story_id: int
    story_title: str
    
    # Analysis inputs
    figma_file_key: str
    github_repo_url: str
    repository_analysis: RepositoryAnalysis
    
    # Technical approach
    technical_approach: TechnicalApproach
    
    # Quality requirements
    quality_gates: QualityGates
    
    # Implementation tasks
    tasks: List[ImplementationTask] = Field(default_factory=list)
    
    # Dependencies to install
    new_dependencies: List[Dependency] = Field(default_factory=list)
    
    # Estimated timeline
    total_estimated_minutes: int = 0
    
    # Risk assessment
    risks: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    
    # Success criteria
    success_criteria: List[str] = Field(default_factory=list)
    
    # Generated artifacts
    artifacts_to_generate: List[str] = Field(default_factory=list)
    
    @property
    def high_priority_tasks(self) -> List[ImplementationTask]:
        """Get high priority tasks."""
        return [task for task in self.tasks if task.priority == Priority.HIGH]
    
    @property
    def task_dependency_order(self) -> List[str]:
        """Get tasks in dependency order."""
        # Simple topological sort
        ordered = []
        remaining = {task.id: task for task in self.tasks}
        
        while remaining:
            # Find tasks with no unresolved dependencies
            ready = [
                task_id for task_id, task in remaining.items()
                if all(dep in ordered for dep in task.depends_on)
            ]
            
            if not ready:
                # Circular dependency or error - add remaining tasks
                ready = list(remaining.keys())
            
            # Add first ready task
            task_id = ready[0]
            ordered.append(task_id)
            del remaining[task_id]
        
        return ordered
    
    def get_files_by_type(self, file_type: FileType) -> List[FileToCreate]:
        """Get all files of a specific type."""
        files = []
        for task in self.tasks:
            files.extend([f for f in task.files_to_create if f.type == file_type])
        return files