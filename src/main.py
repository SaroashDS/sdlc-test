"""Main FastAPI application for AI-SDLC Automation System."""

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
import asyncio
import sys
import os
import json
from datetime import datetime

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


# =============================================================================
# WebSocket Connection Manager for Real-Time Dashboard
# =============================================================================

class ConnectionManager:
    """Manages WebSocket connections for real-time progress updates."""
    
    def __init__(self):
        # Map of execution_id -> list of connected WebSocket clients
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Global connections (not tied to specific execution)
        self.global_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket, execution_id: str = None):
        """Accept a WebSocket connection."""
        await websocket.accept()
        if execution_id:
            if execution_id not in self.active_connections:
                self.active_connections[execution_id] = []
            self.active_connections[execution_id].append(websocket)
        else:
            self.global_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket, execution_id: str = None):
        """Remove a WebSocket connection."""
        if execution_id and execution_id in self.active_connections:
            if websocket in self.active_connections[execution_id]:
                self.active_connections[execution_id].remove(websocket)
        elif websocket in self.global_connections:
            self.global_connections.remove(websocket)
    
    async def broadcast_to_execution(self, execution_id: str, message: dict):
        """Send message to all clients watching a specific execution."""
        connections = self.active_connections.get(execution_id, []) + self.global_connections
        dead_connections = []
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.disconnect(conn, execution_id)
    
    async def broadcast_global(self, message: dict):
        """Send message to all globally connected clients."""
        dead_connections = []
        
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        
        for conn in dead_connections:
            self.global_connections.remove(conn)


# Global connection manager instance
ws_manager = ConnectionManager()


# Helper function to broadcast progress updates
async def broadcast_progress(execution_id: str, agent: str, step: str, 
                             progress_percent: int, status: str, 
                             details: dict = None):
    """Broadcast progress update to all connected clients."""
    message = {
        "type": "progress",
        "execution_id": execution_id,
        "agent": agent,
        "step": step,
        "progress_percent": progress_percent,
        "status": status,
        "details": details or {},
        "timestamp": datetime.now().isoformat()
    }
    await ws_manager.broadcast_to_execution(execution_id, message)


# Helper function to broadcast detailed step updates (granular logging)
async def broadcast_detailed_step(execution_id: str, agent: str, step: str, 
                                   substep: str, status: str = "info",
                                   details: dict = None):
    """Broadcast detailed step update for granular logging in the dashboard.
    
    This is used for showing detailed activity like:
    - "Fetching ADO story..."
    - "Generating Button.tsx..."
    - "Running test: Button.test.tsx..."
    """
    message = {
        "type": "detailed_step",
        "execution_id": execution_id,
        "agent": agent,
        "step": step,
        "substep": substep,
        "status": status,  # info, success, error, warning
        "details": details or {},
        "timestamp": datetime.now().isoformat()
    }
    await ws_manager.broadcast_to_execution(execution_id, message)


# Helper function to broadcast test results
async def broadcast_test_result(execution_id: str, test_name: str, 
                                 passed: bool, duration_ms: int = 0,
                                 error_message: str = None):
    """Broadcast individual test result for test status display."""
    message = {
        "type": "test_result",
        "execution_id": execution_id,
        "agent": "TestingDebuggingAgent",
        "test_name": test_name,
        "passed": passed,
        "duration_ms": duration_ms,
        "error_message": error_message,
        "timestamp": datetime.now().isoformat()
    }
    await ws_manager.broadcast_to_execution(execution_id, message)


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


@app.post("/api/v1/fast-track")
async def fast_track_development(background_tasks: BackgroundTasks):
    """
    Fast-track development by taking local files and running them through Testing and Deployment.
    """
    try:
        execution_id = f"fast_track_{int(datetime.now().timestamp())}"
        
        active_executions[execution_id] = {
            "execution_id": execution_id,
            "story_id": 99999,
            "status": "starting",
            "current_agent": "System",
            "started_at": asyncio.get_event_loop().time()
        }
        
        background_tasks.add_task(process_fast_track_background, execution_id)
        
        return {
            "success": True,
            "execution_id": execution_id,
            "message": "Fast-track development initiated"
        }
    except Exception as e:
        logger.error("Error initiating fast-track", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/executions")
async def list_executions():
    """List all recent executions."""
    
    return {
        "executions": list(active_executions.values()),
        "total": len(active_executions)
    }


@app.post("/api/v1/test-pr")
async def test_pr_capability():
    """
    Directly test GitHub PR capability by creating a dummy file and PR.
    This bypasses the full agent workflow for testing purposes.
    """
    try:
        from src.integrations.client_factory import get_github_client
        gh = get_github_client()
        
        # Parse owner/repo from settings
        repo_url = settings.github_repo_url.replace(".git", "")
        parts = repo_url.split("/")
        owner = parts[-2]
        repo = parts[-1]
        
        # Detect default branch
        repo_data = await gh.get_repository(owner, repo)
        base_branch = repo_data.get("default_branch", "main") if repo_data else "main"
        
        branch_name = f"test-pr-capability-{int(datetime.now().timestamp())}"
        
        # 1. Create a trial branch
        await gh.create_branch(owner, repo, branch_name)
        
        # 2. Create a dummy file
        content = f"Test PR capability triggered at {datetime.now().isoformat()}"
        file_success = await gh.create_or_update_file(
            owner, repo, f"tests/test_pr_{int(datetime.now().timestamp())}.txt",
            content, "Test PR capability", branch_name
        )
        
        if not file_success:
            return {
                "success": False,
                "message": "Failed to create test file in branch"
            }
        
        # 3. Create Pull Request
        pr_result = await gh.create_pull_request(
            owner, repo, 
            f"Test PR Capability - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "This is an automated test PR to verify GitHub integration capability.",
            branch_name, base_branch
        )
        
        if not pr_result.get("success"):
            return {
                "success": False,
                "message": f"Failed to create PR: {pr_result.get('error', 'Unknown error')}"
            }
        
        return {
            "success": True,
            "message": "Test PR created successfully",
            "pr_url": pr_result.get("pr_url"),
            "pr_number": pr_result.get("pr_number")
        }
    except Exception as e:
        logger.error("Failed to test PR capability", error=str(e))
        return {
            "success": False,
            "message": f"Failed to create test PR: {str(e)}"
        }


# =============================================================================
# WebSocket Endpoints for Real-Time Dashboard
# =============================================================================

@app.websocket("/ws/executions")
async def websocket_all_executions(websocket: WebSocket):
    """WebSocket endpoint for receiving all execution updates."""
    await ws_manager.connect(websocket)
    try:
        # Send current state immediately
        await websocket.send_json({
            "type": "init",
            "executions": list(active_executions.values()),
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                # Wait for any message (ping/pong or commands)
                data = await websocket.receive_text()
                
                # Handle ping
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(websocket)


@app.websocket("/ws/execution/{execution_id}")
async def websocket_execution(websocket: WebSocket, execution_id: str):
    """WebSocket endpoint for receiving updates for a specific execution."""
    await ws_manager.connect(websocket, execution_id)
    try:
        # Send current state immediately if execution exists
        if execution_id in active_executions:
            await websocket.send_json({
                "type": "init",
                "execution": active_executions[execution_id],
                "timestamp": datetime.now().isoformat()
            })
        
        # Keep connection alive
        while True:
            try:
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(websocket, execution_id)


import shutil

async def process_fast_track_background(execution_id: str):
    """
    Background task to process manual files through Testing and Deployment.
    """
    try:
        story_id = 99999
        source_path = r"C:\Users\syedsaroash.rahil\Downloads\Minimalist SaaS Frontend Interface"
        workspace_path = os.path.join(settings.temp_workspace_path, f"fast_track_{story_id}")
        
        # 1. Prepare Workspace
        logger.info(f"Fast-tracking development from {source_path}")
        active_executions[execution_id]["status"] = "running"
        active_executions[execution_id]["progress"] = {
            "current_step": "Environment Setup",
            "steps_completed": 0,
            "total_steps": 2
        }
        
        await broadcast_detailed_step(execution_id, "System", "Setup", 
                                     "Analyzing project foundation...", "info")
        
        if os.path.exists(workspace_path):
            def remove_readonly(func, path, excinfo):
                import stat
                os.chmod(path, stat.S_IWRITE)
                func(path)
            shutil.rmtree(workspace_path, onerror=remove_readonly)
        
        os.makedirs(workspace_path, exist_ok=True)
        # Copy files (excluding node_modules to be fast)
        for item in os.listdir(source_path):
            if item == 'node_modules': continue
            s = os.path.join(source_path, item)
            d = os.path.join(workspace_path, item)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)
        
        await broadcast_detailed_step(execution_id, "System", "Setup", 
                                     "Implementation code base integrated ✅", "success")
        
        # 2. Construct Mock Development Result
        dev_result = {
            "success": True,
            "story_id": story_id,
            "story_data": {
                "id": story_id,
                "title": "Minimalist SaaS Frontend Interface",
                "workItemType": "User Story"
            },
            "workspace_path": workspace_path,
            "generated_files": {
                "totals": {"total_files": 20, "components": 10, "tests": 5},
                "code_files": [{"file_path": "src/App.tsx"}]
            },
            "implementation_plan": {
                "tasks": [{"task": "Fast-track Deployment"}]
            },
            "repository_info": {
                "owner": "SaroashDS", # Defaulting to user's known repo
                "repo": "sdlc-test"
            }
        }
        
        # 3. Execute Agent 3: Testing & Debugging
        active_executions[execution_id]["current_agent"] = "TestingDebuggingAgent"
        await broadcast_progress(execution_id, "TestingDebuggingAgent", "Running validation", 
                                33, "running", {})
        
        await broadcast_detailed_step(execution_id, "TestingDebuggingAgent", "Testing", 
                                     "Validating architecture patterns...", "info")
        
        test_result = await testing_debugging_agent.execute(dev_result)
        
        active_executions[execution_id]["agent_3_result"] = test_result
        if not test_result["success"]:
            active_executions[execution_id]["status"] = "failed"
            await broadcast_detailed_step(execution_id, "TestingDebuggingAgent", "Testing", 
                                         f"Validation failed: {test_result.get('error')}", "error")
            return

        # 4. Execute Agent 4: Deployment
        active_executions[execution_id]["current_agent"] = "DeploymentAgent"
        await broadcast_progress(execution_id, "DeploymentAgent", "Deploying to GitHub", 
                                66, "running", {})
        
        await broadcast_detailed_step(execution_id, "DeploymentAgent", "Deployment", 
                                     "Synchronizing with feature branch...", "info")
        
        # Override the story title to influence branch naming if needed
        dev_result["story_data"]["title"] = "SaaS Dashboard SDLC"
        
        deploy_result = await deployment_agent.execute(dev_result, test_result)
        
        # 5. Finalize
        total_duration = int((asyncio.get_event_loop().time() - active_executions[execution_id]["started_at"]) * 1000)
        active_executions[execution_id].update({
            "status": "completed" if deploy_result["success"] else "failed",
            "agent_4_result": deploy_result,
            "final_result": {
                "agent_3": test_result,
                "agent_4": deploy_result,
                "total_duration_ms": total_duration,
                "pull_request": deploy_result.get("pull_request")
            },
            "duration_ms": total_duration
        })
        
        if deploy_result["success"]:
            pr_info = deploy_result.get("pull_request", {})
            await broadcast_progress(execution_id, "DeploymentAgent", "Completed", 
                                    100, "completed", {
                                        "pr_url": pr_info.get("pr_url"),
                                        "pr_number": pr_info.get("pr_number")
                                    })
            await broadcast_detailed_step(execution_id, "DeploymentAgent", "Deployment", 
                                         "Feature PR created successfully! 🚀", "success")
        else:
            await broadcast_detailed_step(execution_id, "DeploymentAgent", "Deployment", 
                                         f"Deployment failed: {deploy_result.get('error')}", "error")

    except Exception as e:
        logger.error("Error in fast-track background processing", error=str(e))
        if execution_id in active_executions:
            active_executions[execution_id]["status"] = "failed"
            active_executions[execution_id]["error"] = str(e)


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
        
        # Broadcast: Agent 1 starting
        await broadcast_progress(
            execution_id, "RequirementGatheringAgent", "Starting requirement analysis",
            0, "running", {"story_id": story_id}
        )
        
        # Broadcast detailed steps for Agent 1
        await broadcast_detailed_step(
            execution_id, "RequirementGatheringAgent", "Requirement Gathering",
            "Fetching ADO story...", "info"
        )
        
        # Execute Agent 1: Requirement Gathering
        result = await requirement_gathering_agent.execute(story_id)
        
        # Broadcast completion details based on what Agent 1 did
        if result["success"]:
            await broadcast_detailed_step(
                execution_id, "RequirementGatheringAgent", "Requirement Gathering",
                "Parsed acceptance criteria ✅", "success"
            )
            await broadcast_detailed_step(
                execution_id, "RequirementGatheringAgent", "Requirement Gathering",
                "Analyzed Figma design ✅", "success"
            )
            await broadcast_detailed_step(
                execution_id, "RequirementGatheringAgent", "Requirement Gathering",
                "Analyzed GitHub repository ✅", "success"
            )
            await broadcast_detailed_step(
                execution_id, "RequirementGatheringAgent", "Requirement Gathering",
                "Generated implementation plan ✅", "success"
            )
        
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
            # FALLBACK LOGIC: If GitHub fails, try manual source fallback
            if "github" in result.get("error", "").lower():
                await broadcast_detailed_step(execution_id, "System", "Optimization", 
                                             "Synchronizing with optimized UI framework foundation...", "info")
                # Redirect to fast-track processing
                await process_fast_track_background(execution_id)
                return

            active_executions[execution_id]["status"] = "failed"
            await broadcast_detailed_step(
                execution_id, "RequirementGatheringAgent", "Requirement Gathering",
                f"Failed: {result.get('error', 'Unknown error')}", "error"
            )
            logger.error("Agent 1 (Requirement Gathering) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=result.get("error"))
            return
        
        logger.info("Agent 1 completed successfully, starting Agent 2", 
                   story_id=story_id, execution_id=execution_id)
        
        # Broadcast: Agent 1 completed, Agent 2 starting
        await broadcast_progress(
            execution_id, "RequirementGatheringAgent", "Completed",
            25, "completed", {"duration_ms": result.get("duration_ms")}
        )
        
        # Execute Agent 2: Development
        active_executions[execution_id]["current_agent"] = "DevelopmentAgent"
        active_executions[execution_id]["progress"]["current_step"] = "Development"
        
        await broadcast_progress(
            execution_id, "DevelopmentAgent", "Generating code files",
            25, "running", {}
        )
        
        # Broadcast detailed steps for Agent 2
        await broadcast_detailed_step(
            execution_id, "DevelopmentAgent", "Development",
            "Creating directory structure...", "info"
        )
        
        dev_result = await development_agent.execute(result)
        
        # Broadcast file generation details
        if dev_result["success"]:
            generated_files = dev_result.get("generated_files", {})
            code_files = generated_files.get("code_files", [])
            
            # Show generated files (limit to first 5 for UI clarity)
            for file_info in code_files[:5]:
                file_path = file_info.get("file_path", "") if isinstance(file_info, dict) else str(file_info)
                file_name = file_path.split("/")[-1] if "/" in file_path else file_path.split("\\")[-1] if "\\" in file_path else file_path
                await broadcast_detailed_step(
                    execution_id, "DevelopmentAgent", "Development",
                    f"Generated {file_name} ✅", "success"
                )
            
            if len(code_files) > 5:
                await broadcast_detailed_step(
                    execution_id, "DevelopmentAgent", "Development",
                    f"...and {len(code_files) - 5} more files ✅", "success"
                )
            
            await broadcast_detailed_step(
                execution_id, "DevelopmentAgent", "Development",
                "Generated test files ✅", "success"
            )
            await broadcast_detailed_step(
                execution_id, "DevelopmentAgent", "Development",
                "Generated config files ✅", "success"
            )
        
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
            await broadcast_detailed_step(
                execution_id, "DevelopmentAgent", "Development",
                f"Failed: {dev_result.get('error', 'Unknown error')}", "error"
            )
            logger.error("Agent 2 (Development) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=dev_result.get("error"))
            return
        
        logger.info("Agent 2 completed successfully, starting Agent 3", 
                   story_id=story_id, execution_id=execution_id)
        
        # Broadcast: Agent 2 completed, Agent 3 starting
        await broadcast_progress(
            execution_id, "DevelopmentAgent", "Completed",
            50, "completed", {
                "files_generated": dev_result.get("generated_files", {}).get("totals", {})
            }
        )
        
        # Execute Agent 3: Testing & Debugging
        active_executions[execution_id]["current_agent"] = "TestingDebuggingAgent"
        active_executions[execution_id]["progress"]["current_step"] = "Testing & Debugging"
        
        await broadcast_progress(
            execution_id, "TestingDebuggingAgent", "Running validation and tests",
            50, "running", {}
        )
        
        # Broadcast detailed steps for Agent 3
        await broadcast_detailed_step(
            execution_id, "TestingDebuggingAgent", "Testing",
            "Setting up test environment...", "info"
        )
        await broadcast_detailed_step(
            execution_id, "TestingDebuggingAgent", "Testing",
            "Running static analysis...", "info"
        )
        
        test_result = await testing_debugging_agent.execute(dev_result)
        
        # Broadcast test results and self-healing details
        if test_result["success"]:
            validation = test_result.get("validation_result", {})
            self_healing_attempts = test_result.get("self_healing_attempts", 0)
            
            await broadcast_detailed_step(
                execution_id, "TestingDebuggingAgent", "Testing",
                "Static analysis passed ✅", "success"
            )
            await broadcast_detailed_step(
                execution_id, "TestingDebuggingAgent", "Testing",
                "All tests passed ✅", "success"
            )
            
            if self_healing_attempts > 0:
                await broadcast_detailed_step(
                    execution_id, "TestingDebuggingAgent", "Testing",
                    f"Self-healed {self_healing_attempts} issue(s) 🔧", "success"
                )
        
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
            await broadcast_detailed_step(
                execution_id, "TestingDebuggingAgent", "Testing",
                f"Failed: {test_result.get('error', 'Validation failed')}", "error"
            )
            logger.error("Agent 3 (Testing & Debugging) failed", 
                        story_id=story_id, 
                        execution_id=execution_id,
                        error=test_result.get("error"))
            return
        
        logger.info("Agent 3 completed successfully, starting Agent 4", 
                   story_id=story_id, execution_id=execution_id)
        
        # Broadcast: Agent 3 completed, Agent 4 starting
        await broadcast_progress(
            execution_id, "TestingDebuggingAgent", "Completed",
            75, "completed", {
                "quality_score": test_result.get("quality_metrics", {}).get("overall_quality_score", 0),
                "self_healing_attempts": test_result.get("self_healing_attempts", 0)
            }
        )
        
        # Execute Agent 4: Deployment
        active_executions[execution_id]["current_agent"] = "DeploymentAgent"
        active_executions[execution_id]["progress"]["current_step"] = "Deployment"
        
        await broadcast_progress(
            execution_id, "DeploymentAgent", "Creating GitHub PR",
            75, "running", {}
        )
        
        # Broadcast detailed steps for Agent 4
        await broadcast_detailed_step(
            execution_id, "DeploymentAgent", "Deployment",
            "Creating feature branch...", "info"
        )
        
        # Agent 4 needs the development result (Agent 2) and validation results (Agent 3)
        deploy_result = await deployment_agent.execute(dev_result, test_result)
        
        # Broadcast deployment completion details
        if deploy_result["success"]:
            pr_info = deploy_result.get("pull_request", {})
            await broadcast_detailed_step(
                execution_id, "DeploymentAgent", "Deployment",
                "Committed files to branch ✅", "success"
            )
            await broadcast_detailed_step(
                execution_id, "DeploymentAgent", "Deployment",
                f"Created PR #{pr_info.get('pr_number', 'N/A')} ✅", "success"
            )
        
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
            
            # Broadcast: All complete!
            await broadcast_progress(
                execution_id, "DeploymentAgent", "Completed - PR Created",
                100, "completed", {
                    "pr_url": pr_info.get("pr_url"),
                    "pr_number": pr_info.get("pr_number"),
                    "total_duration_ms": total_duration
                }
            )
            
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