"""Main FastAPI application for AI-SDLC Automation System."""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uvicorn
import asyncio
import sys
import os

# Windows-specific fix for Playwright/Subprocess NotImplementedError
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())



from src.config import settings

from src.utils.logging import get_logger
from src.integrations.client_factory import initialize_clients, close_clients
from src.agents.requirement_gathering_agent import requirement_gathering_agent
from src.agents.development_agent import development_agent
from src.agents.testing_debugging_agent import testing_debugging_agent
from src.agents.deployment_agent import deployment_agent

# Initialize logger
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI-SDLC Automation System",
    description="AI-powered software development lifecycle automation",
    version="1.0.0",
    docs_url="/docs" if settings.debug_mode else None,
    redoc_url="/redoc" if settings.debug_mode else None
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class StoryProcessRequest(BaseModel):
    story_id: int
    force_reprocess: bool = False

class StoryProcessResponse(BaseModel):
    success: bool
    execution_id: str
    message: str
    data: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    services: Dict[str, str]

# Global state for tracking executions
active_executions: Dict[str, Dict[str, Any]] = {}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    
    # Check service connectivity
    services = {
        "azure_devops": "mock" if settings.mock_mode else "real",
        "figma": "mock" if settings.mock_mode else "real", 
        "github": "mock" if settings.mock_mode else "real",
        "gemini": "real"  # Always real
    }
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.environment,
        services=services
    )


@app.post("/api/v1/process-story", response_model=StoryProcessResponse)
async def process_story(request: StoryProcessRequest, background_tasks: BackgroundTasks):
    """
    Process a user story through the AI-SDLC automation pipeline.
    
    This endpoint triggers Agent 1 (Requirement Gathering Agent) which:
    1. Fetches the ADO story
    2. Downloads Figma design
    3. Analyzes GitHub repository
    4. Generates implementation plan using AI
    """
    
    try:
        story_id = request.story_id
        
        logger.info("Processing story request", story_id=story_id)
        
        # Check if story is already being processed
        existing_execution = next(
            (exec_data for exec_data in active_executions.values() 
             if exec_data.get("story_id") == story_id and exec_data.get("status") == "running"),
            None
        )
        
        if existing_execution and not request.force_reprocess:
            return StoryProcessResponse(
                success=False,
                execution_id=existing_execution["execution_id"],
                message=f"Story {story_id} is already being processed. Use force_reprocess=true to override."
            )
        
        # Validate story before processing
        validation = await requirement_gathering_agent.validate_inputs(story_id)
        
        if not validation["valid"]:
            return StoryProcessResponse(
                success=False,
                execution_id="",
                message=f"Story validation failed: {validation['error']}"
            )
        
        # Start background processing
        background_tasks.add_task(process_story_background, story_id)
        
        # Create execution tracking
        execution_id = f"story_{story_id}_{int(asyncio.get_event_loop().time())}"
        active_executions[execution_id] = {
            "execution_id": execution_id,
            "story_id": story_id,
            "status": "starting",
            "current_agent": "RequirementGatheringAgent",
            "started_at": asyncio.get_event_loop().time()
        }
        
        return StoryProcessResponse(
            success=True,
            execution_id=execution_id,
            message=f"Started processing story {story_id} ({validation['story_title']})",
            data={
                "story_title": validation["story_title"],
                "estimated_duration": "25-40 minutes",
                "current_step": "Requirement Gathering → Development → Testing & Debugging → Deployment"
            }
        )
        
    except Exception as e:
        logger.error("Error processing story request", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/execution/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get status of a story processing execution."""
    
    if execution_id not in active_executions:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    execution_data = active_executions[execution_id]
    
    return {
        "execution_id": execution_id,
        "status": execution_data.get("status", "unknown"),
        "current_agent": execution_data.get("current_agent"),
        "progress": execution_data.get("progress", {}),
        "result": execution_data.get("result"),
        "error": execution_data.get("error"),
        "duration_ms": execution_data.get("duration_ms")
    }


@app.get("/api/v1/executions")
async def list_executions():
    """List all recent executions."""
    
    return {
        "executions": list(active_executions.values()),
        "total": len(active_executions)
    }


async def process_story_background(story_id: int):
    """Background task to process story through Agent 1."""
    
    execution_id = None
    
    try:
        # Find the execution record
        execution_id = next(
            (exec_id for exec_id, exec_data in active_executions.items() 
             if exec_data.get("story_id") == story_id and exec_data.get("status") == "starting"),
            None
        )
        
        if not execution_id:
            logger.error("Could not find execution record for background processing", story_id=story_id)
            return
        
        # Update status
        active_executions[execution_id]["status"] = "running"
        active_executions[execution_id]["progress"] = {
            "current_step": "Requirement Gathering",
            "steps_completed": 0,
            "total_steps": 4
        }
        
        logger.info("Starting background story processing", 
                   story_id=story_id, execution_id=execution_id)
        
        # Execute Agent 1: Requirement Gathering
        result = await requirement_gathering_agent.execute(story_id)
        
        # Update execution record with Agent 1 result
        active_executions[execution_id].update({
            "status": "agent_1_completed" if result["success"] else "failed",
            "agent_1_result": result,
            "error": result.get("error") if not result["success"] else None,
            "duration_ms": result.get("duration_ms"),
            "progress": {
                "current_step": "Development" if result["success"] else "Failed",
                "steps_completed": 1 if result["success"] else 0,
                "total_steps": 4  # Agent 1 + Agent 2 + Agent 3 + Agent 4
            }
        })
        
        if not result["success"]:
            active_executions[execution_id]["status"] = "failed"
            logger.error("Agent 1 (Requirement Gathering) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=result.get("error"))
            return
        
        logger.info("Agent 1 completed successfully, starting Agent 2", 
                   story_id=story_id, execution_id=execution_id)
        
        # Execute Agent 2: Development
        active_executions[execution_id]["current_agent"] = "DevelopmentAgent"
        active_executions[execution_id]["progress"]["current_step"] = "Development"
        
        dev_result = await development_agent.execute(result)
        
        # Update execution record with Agent 2 result
        active_executions[execution_id].update({
            "status": "agent_2_completed" if dev_result["success"] else "failed",
            "agent_2_result": dev_result,
            "progress": {
                "current_step": "Testing & Debugging" if dev_result["success"] else "Failed",
                "steps_completed": 2 if dev_result["success"] else 1,
                "total_steps": 4
            }
        })
        
        if not dev_result["success"]:
            active_executions[execution_id]["status"] = "failed"
            logger.error("Agent 2 (Development) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=dev_result.get("error"))
            return
        
        logger.info("Agent 2 completed successfully, starting Agent 3", 
                   story_id=story_id, execution_id=execution_id)
        
        # Execute Agent 3: Testing & Debugging
        active_executions[execution_id]["current_agent"] = "TestingDebuggingAgent"
        active_executions[execution_id]["progress"]["current_step"] = "Testing & Debugging"
        
        test_result = await testing_debugging_agent.execute(dev_result)
        
        # Update execution record with Agent 3 result
        active_executions[execution_id].update({
            "status": "agent_3_completed" if test_result["success"] else "failed",
            "agent_3_result": test_result,
            "progress": {
                "current_step": "Deployment" if test_result["success"] else "Failed",
                "steps_completed": 3 if test_result["success"] else 2,
                "total_steps": 4  # Agent 1 + Agent 2 + Agent 3 + Agent 4
            }
        })
        
        if not test_result["success"]:
            active_executions[execution_id]["status"] = "failed"
            logger.error("Agent 3 (Testing & Debugging) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=test_result.get("error"))
            return
        
        logger.info("Agent 3 completed successfully, starting Agent 4", 
                   story_id=story_id, execution_id=execution_id)
        
        # Execute Agent 4: Deployment
        active_executions[execution_id]["current_agent"] = "DeploymentAgent"
        active_executions[execution_id]["progress"]["current_step"] = "Deployment"
        
        # Agent 4 needs the development result (Agent 2) and validation results (Agent 3)
        deploy_result = await deployment_agent.execute(dev_result, test_result)
        
        # Update execution record with final result
        total_duration = (result.get("duration_ms", 0) + 
                         dev_result.get("duration_ms", 0) + 
                         test_result.get("duration_ms", 0) +
                         deploy_result.get("duration_ms", 0))
        
        active_executions[execution_id].update({
            "status": "completed" if deploy_result["success"] else "failed",
            "error": deploy_result.get("error") if not deploy_result["success"] else None,
            "agent_4_result": deploy_result,
            "final_result": {
                "agent_1": result,
                "agent_2": dev_result,
                "agent_3": test_result,
                "agent_4": deploy_result,
                "total_duration_ms": total_duration,
                "workspace_path": dev_result.get("workspace_path"),
                "files_generated": dev_result.get("generated_files", {}).get("totals", {}),
                "validation_status": test_result.get("validation_result", {}).get("overall_status"),
                "code_quality_score": test_result.get("quality_metrics", {}).get("overall_quality_score", 0),
                "self_healing_attempts": test_result.get("self_healing_attempts", 0),
                "pull_request": deploy_result.get("pull_request", {}) if deploy_result["success"] else None
            },
            "duration_ms": total_duration,
            "completed_at": asyncio.get_event_loop().time(),
            "progress": {
                "current_step": "Completed" if deploy_result["success"] else "Failed",
                "steps_completed": 4 if deploy_result["success"] else 3,
                "total_steps": 4
            }
        })
        
        if deploy_result["success"]:
            validation_status = test_result.get("validation_result", {}).get("overall_status")
            quality_score = test_result.get("quality_metrics", {}).get("overall_quality_score", 0)
            pr_info = deploy_result.get("pull_request", {})
            
            logger.info("Full 4-agent workflow completed successfully", 
                       story_id=story_id, 
                       execution_id=execution_id,
                       total_duration_ms=total_duration,
                       files_generated=dev_result.get("generated_files", {}).get("totals", {}).get("total_files", 0),
                       validation_status=validation_status,
                       quality_score=quality_score,
                       self_healing_attempts=test_result.get("self_healing_attempts", 0),
                       pr_number=pr_info.get("pr_number"),
                       pr_url=pr_info.get("pr_url"))
            
        else:
            logger.error("Agent 4 (Deployment) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=deploy_result.get("error"))
        
    except Exception as e:
        logger.error("Error in background story processing", 
                    story_id=story_id, 
                    execution_id=execution_id,
                    error=str(e))
        
        if execution_id:
            active_executions[execution_id].update({
                "status": "error",
                "error": str(e),
                "completed_at": asyncio.get_event_loop().time()
            })


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("AI-SDLC Automation System starting up", 
               version="1.0.0", 
               environment=settings.environment,
               mock_mode=settings.mock_mode)
    
    # Initialize integration clients
    initialize_clients()
    
    if settings.mock_mode:
        logger.info("Running in MOCK MODE - using mock data for Azure DevOps, Figma, and GitHub")
        logger.info("Gemini AI will use REAL API with your credentials")
    else:
        logger.info("Running in PRODUCTION MODE - using real APIs for all services")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("AI-SDLC Automation System shutting down")
    
    # Close integration clients
    await close_clients()


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8080,
        reload=settings.debug_mode,
        log_level=settings.log_level.lower()
    )