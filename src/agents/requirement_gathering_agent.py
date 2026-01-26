"""Agent 1: Requirement Gathering Agent - Understands what needs to be built."""

from typing import Dict, Any, Optional
from src.tools.data_collection.fetch_ado_story import fetch_ado_story_tool
from src.tools.data_collection.fetch_figma_design import fetch_figma_design_tool
from src.tools.data_collection.analyze_github_repo import analyze_github_repo_tool
from src.tools.data_collection.generate_implementation_plan import generate_implementation_plan_tool
from src.models.story_model import ADOStory
from src.models.design_model import FigmaDesign
from src.models.implementation_plan import ImplementationPlan
from src.utils.logging import AgentLogger
import time
import asyncio

logger = AgentLogger("RequirementGatheringAgent")


class RequirementGatheringAgent:
    """
    Agent 1: Requirement Gathering Agent
    
    Purpose: Understand what needs to be built by analyzing all inputs
    
    Workflow:
    1. Reads Azure DevOps user story (title, description, acceptance criteria)
    2. Extracts Figma design link from story
    3. Downloads Figma design and analyzes components, colors, layout
    4. Checks if user wants to add to existing repo or create new one
    5. Analyzes existing code patterns (if existing repo)
    6. Creates detailed Implementation Plan using AI
    
    Tools Used:
    - Tool #1: Fetch ADO Story
    - Tool #2: Fetch Figma Design  
    - Tool #3: Analyze GitHub Repository
    - Tool #4: Generate Implementation Plan (using Gemini)
    
    Time: 5-10 minutes
    """
    
    def __init__(self):
        self.name = "RequirementGatheringAgent"
        self.version = "1.0.0"
        self.tools = {
            "fetch_ado_story": fetch_ado_story_tool,
            "fetch_figma_design": fetch_figma_design_tool,
            "analyze_github_repo": analyze_github_repo_tool,
            "generate_implementation_plan": generate_implementation_plan_tool
        }
    
    async def execute(self, story_id: int) -> Dict[str, Any]:
        """
        Execute the requirement gathering workflow.
        
        Args:
            story_id: Azure DevOps work item ID
            
        Returns:
            Dict containing implementation plan and all gathered requirements
        """
        start_time = time.time()
        execution_id = f"req_gather_{story_id}_{int(start_time)}"
        
        logger.log_agent_start(story_id, execution_id=execution_id)
        
        try:
            # Step 1: Fetch ADO Story
            logger.info("Step 1: Fetching ADO story", story_id=story_id)
            story_result = await self._fetch_ado_story(story_id)
            
            if not story_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to fetch ADO story: {story_result['error']}"
                )
            
            story_data = story_result["story"]
            validation = story_result["validation"]
            
            # Check if story is ready for development
            if not validation["ready"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Story not ready for development: {', '.join(validation['issues'])}"
                )
            
            # Step 2 & 3: Parallel Data Collection (Figma + GitHub Analysis)
            logger.info("Steps 2 & 3: Parallelized Figma fetch and GitHub analysis starting...")
            
            github_repo_info = validation["github_repo_info"]
            repo_url = f"https://github.com/{github_repo_info['owner']}/{github_repo_info['repo']}"
            
            # Run Figma fetch and GitHub analysis concurrently
            figma_task = self._fetch_figma_design(validation["figma_file_key"], validation.get("figma_url"))
            github_task = self._analyze_github_repo(repo_url)
            
            figma_result, repo_result = await asyncio.gather(figma_task, github_task)
            
            # Handle Figma results with soft degradation
            figma_data = None
            design_analysis = None
            
            if figma_result["success"]:
                figma_data = figma_result["design"]
                design_analysis = figma_result["analysis"]
                logger.info("Figma design details integrated into requirements")
            else:
                logger.warning(
                    "Figma design fetch failed, proceeding with Story and Repo data only",
                    error=figma_result.get("error")
                )
                # Create a minimal placeholder for downstream tools
                figma_data = {
                    "name": "Story Requirements (No UI)",
                    "file_key": validation.get("figma_file_key", "unknown"),
                    "component_analysis": [],
                    "design_tokens": {}
                }
                design_analysis = {
                    "development_ready": True,
                    "issues": ["No Figma design available - using logic-only requirements"],
                    "recommendations": ["Follow project's existing UI patterns"]
                }
            
            # Handle GitHub results
            if not repo_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to analyze GitHub repository: {repo_result['error']}"
                )
            
            repo_analysis = repo_result["analysis"]
            repo_info = repo_result["repository_info"]
            
            # Step 4: Generate Implementation Plan using AI
            logger.info("Step 4: Generating implementation plan using AI")
            
            plan_result = await self._generate_implementation_plan(
                story_data, figma_data, repo_result
            )
            
            if not plan_result["success"]:
                return self._create_error_result(
                    execution_id, story_id, start_time,
                    f"Failed to generate implementation plan: {plan_result['error']}"
                )
            
            implementation_plan = plan_result["plan"]
            plan_validation = plan_result["validation"]
            
            # Create comprehensive result
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = {
                "success": True,
                "execution_id": execution_id,
                "story_id": story_id,
                "duration_ms": duration_ms,
                
                # Core outputs
                "implementation_plan": implementation_plan,
                
                # Supporting data
                "story_data": story_data,
                "story_validation": validation,
                "figma_data": figma_data,
                "design_analysis": design_analysis,
                "repository_analysis": repo_analysis,
                "repository_info": repo_info,
                "plan_validation": plan_validation,
                
                # Execution metadata
                "steps_completed": 4,
                "tools_used": list(self.tools.keys()),
                "ai_reasoning": plan_result.get("ai_reasoning", {}),
                
                # Summary for next agent
                "summary": self._create_execution_summary(
                    story_data, figma_data, repo_info, implementation_plan
                )
            }
            
            logger.log_agent_complete(
                story_id, duration_ms, True,
                tasks_planned=len(implementation_plan.get("tasks", [])),
                estimated_minutes=implementation_plan.get("total_estimated_minutes", 0)
            )
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_error(e, {"story_id": story_id, "execution_id": execution_id})
            
            return self._create_error_result(
                execution_id, story_id, start_time,
                f"Unexpected error in requirement gathering: {str(e)}"
            )
    
    async def _fetch_ado_story(self, story_id: int) -> Dict[str, Any]:
        """Execute Tool #1: Fetch ADO Story."""
        tool_start = time.time()
        
        try:
            result = await self.tools["fetch_ado_story"].execute(story_id)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("fetch_ado_story", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("fetch_ado_story", duration_ms, False)
            raise
    
    async def _fetch_figma_design(self, file_key: str, figma_url: Optional[str] = None) -> Dict[str, Any]:
        """Execute Tool #2: Fetch Figma Design."""
        tool_start = time.time()
        
        try:
            result = await self.tools["fetch_figma_design"].execute(file_key, figma_url)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("fetch_figma_design", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("fetch_figma_design", duration_ms, False)
            raise
    
    async def _analyze_github_repo(self, repo_url: str) -> Dict[str, Any]:
        """Execute Tool #3: Analyze GitHub Repository."""
        tool_start = time.time()
        
        try:
            result = await self.tools["analyze_github_repo"].execute(repo_url)
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("analyze_github_repo", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("analyze_github_repo", duration_ms, False)
            raise
    
    async def _generate_implementation_plan(self, story_data: Dict[str, Any], 
                                          figma_data: Dict[str, Any], 
                                          repo_result: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #4: Generate Implementation Plan."""
        tool_start = time.time()
        
        try:
            result = await self.tools["generate_implementation_plan"].execute(
                story_data, figma_data, repo_result
            )
            
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_implementation_plan", duration_ms, result["success"])
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - tool_start) * 1000)
            logger.log_tool_usage("generate_implementation_plan", duration_ms, False)
            raise
    
    def _create_error_result(self, execution_id: str, story_id: int, 
                           start_time: float, error_message: str) -> Dict[str, Any]:
        """Create standardized error result."""
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.log_agent_complete(story_id, duration_ms, False, error=error_message)
        
        return {
            "success": False,
            "execution_id": execution_id,
            "story_id": story_id,
            "duration_ms": duration_ms,
            "error": error_message,
            "implementation_plan": None
        }
    
    def _create_execution_summary(self, story_data: Dict[str, Any], 
                                figma_data: Dict[str, Any],
                                repo_info: Dict[str, Any], 
                                implementation_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Create execution summary for next agent."""
        
        # Extract story title from either mock dict format or real ADOStory format
        story_title = "Unknown"
        story_type = "Unknown"
        acceptance_criteria_count = 0
        
        try:
            if isinstance(story_data, dict):
                # Mock data format
                fields = story_data.get("fields", {})
                story_title = fields.get("System.Title", "Unknown")
                story_type = fields.get("System.WorkItemType", "Unknown")
                # Count acceptance criteria from description
                description = fields.get("System.Description", "")
                acceptance_criteria_count = len([line for line in description.split('\n') if line.strip().startswith(('-', '*'))])
            else:
                # Real ADOStory object format
                story_title = getattr(story_data, 'title', "Unknown")
                story_type = getattr(story_data, 'work_item_type', "Unknown")
                acceptance_criteria_count = len(getattr(story_data, 'acceptance_criteria', []))
        except Exception as e:
            logger.warning("Could not extract story data for summary", error=str(e))
        
        return {
            "story_title": story_title,
            "story_type": story_type,
            "acceptance_criteria_count": acceptance_criteria_count,
            
            "design_components_count": len(figma_data.get("component_analysis", [])),
            "design_tokens_available": bool(figma_data.get("design_tokens", {}).get("colors")),
            "interactive_components": len([
                c for c in figma_data.get("component_analysis", []) 
                if c.get("is_clickable") or c.get("is_input")
            ]),
            
            "repository_type": "new" if repo_info.get("is_new") else "existing",
            "has_typescript": repo_info.get("has_typescript", False),
            "has_existing_patterns": not repo_info.get("is_new", True),
            
            "tasks_to_implement": len(implementation_plan.get("tasks", [])),
            "estimated_duration_hours": round(implementation_plan.get("total_estimated_minutes", 0) / 60, 1),
            "new_dependencies_count": len(implementation_plan.get("new_dependencies", [])),
            "high_priority_tasks": len([
                t for t in implementation_plan.get("tasks", []) 
                if t.get("priority") == "high"
            ]),
            
            "ready_for_development": True,
            "next_agent": "DevelopmentAgent"
        }
    
    async def validate_inputs(self, story_id: int) -> Dict[str, Any]:
        """
        Validate inputs before execution (optional pre-check).
        
        Args:
            story_id: Azure DevOps work item ID
            
        Returns:
            Validation result
        """
        try:
            # Quick validation - just check if story exists
            story_result = await self.tools["fetch_ado_story"].execute(story_id)
            
            if not story_result["success"]:
                return {
                    "valid": False,
                    "error": story_result["error"]
                }
            
            validation = story_result["validation"]
            story_data = story_result["story"]
            
            # Extract title from either mock dict format or real ADOStory format
            story_title = "Unknown"
            try:
                if isinstance(story_data, dict):
                    # Mock data format
                    story_title = story_data.get("fields", {}).get("System.Title", "Unknown")
                else:
                    # Real ADOStory object format
                    story_title = story_data.title if hasattr(story_data, 'title') else "Unknown"
            except Exception as title_error:
                logger.warning("Could not extract story title", error=str(title_error))
            
            return {
                "valid": validation["ready"],
                "issues": validation.get("issues", []),
                "warnings": validation.get("warnings", []),
                "story_title": story_title
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Validation failed: {str(e)}"
            }


# Global agent instance
requirement_gathering_agent = RequirementGatheringAgent()