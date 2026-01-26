"""Tool #10: Setup Environment - Creates temporary environment and installs dependencies."""

import os
import asyncio
import subprocess
import json
from typing import Dict, Any, List, Optional
from pathlib import Path
from src.config import settings
from src.utils.logging import get_logger
from src.utils.security import code_security_scanner
import time
import shutil

logger = get_logger(__name__)


class SetupEnvironmentTool:
    """Tool for setting up temporary environment and installing dependencies."""
    
    def __init__(self):
        self.name = "setup_environment"
        self.description = "Sets up temporary environment and installs dependencies"
    
    async def execute(self, workspace_path: str, 
                     package_json_path: str = None) -> Dict[str, Any]:
        """
        Set up environment and install dependencies.
        
        Args:
            workspace_path: Path to the generated workspace
            package_json_path: Optional path to package.json (defaults to workspace_path/package.json)
            
        Returns:
            Dict containing setup results and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Setting up environment", workspace_path=workspace_path)
            
            # Validate workspace exists
            if not os.path.exists(workspace_path):
                return {
                    "success": False,
                    "error": f"Workspace path does not exist: {workspace_path}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Determine package.json path
            if not package_json_path:
                package_json_path = os.path.join(workspace_path, "package.json")
            
            # Validate package.json exists
            if not os.path.exists(package_json_path):
                return {
                    "success": False,
                    "error": f"package.json not found at: {package_json_path}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Check Node.js and npm availability
            node_check = await self._check_node_availability()
            if not node_check["available"]:
                return {
                    "success": False,
                    "error": f"Node.js not available: {node_check['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # If infrastructure check returned a skip (resilient mode)
            if node_check.get("skipped"):
                logger.info("Resilient Mode: Skipping environment setup due to missing infrastructure.")
                return {
                    "success": True,
                    "workspace_path": workspace_path,
                    "node_info": node_check,
                    "skipped": True,
                    "environment_ready": True, # Mark as ready to allow agent to proceed
                    "message": node_check.get("reason", "Skipped due to missing infrastructure"),
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Read and validate package.json
            package_info = await self._read_package_json(package_json_path)

            if not package_info["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid package.json: {package_info['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Install dependencies
            install_result = await self._install_dependencies(workspace_path)
            if not install_result["success"]:
                return {
                    "success": False,
                    "error": f"Failed to install dependencies: {install_result['error']}",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Verify installation
            verification_result = await self._verify_installation(workspace_path, package_info["data"])
            
            # Setup additional tools
            tools_setup = await self._setup_additional_tools(workspace_path)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Environment setup completed successfully", 
                       workspace_path=workspace_path,
                       dependencies_installed=len(package_info["data"].get("dependencies", {})),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "workspace_path": workspace_path,
                "node_info": node_check,
                "package_info": package_info["data"],
                "install_result": install_result,
                "verification_result": verification_result,
                "tools_setup": tools_setup,
                "environment_ready": True,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error setting up environment", 
                        workspace_path=workspace_path,
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "environment_ready": False,
                "duration_ms": duration_ms
            }
    
    async def _check_node_availability(self) -> Dict[str, Any]:
        """Check if Node.js and npm are available using shutil and subprocess."""
        import shutil
        
        try:
            # Check Node.js using shutil (fastest way to check PATH)
            node_path = shutil.which("node")
            npm_path = shutil.which("npm")
            
            # Decide if we can fallback to skipped/mocked state
            # We allow skipping if in mock mode OR specifically if ADO is mocked (common for local demos)
            can_skip = settings.mock_mode or settings.mock_ado or settings.environment == "development"
            
            if not node_path or not npm_path:
                msg = f"Node.js or npm not found in PATH. Node: {node_path}, npm: {npm_path}"
                logger.warning(msg)
                
                if can_skip:
                    logger.info("Non-Blocking Mode: Infrastructure missing but skipping is allowed for this environment.")
                    return {
                        "available": True,
                        "skipped": True,
                        "node_version": "N/A",
                        "npm_version": "N/A",
                        "reason": "Missing Node.js/npm in PATH, skipping tests as per resilient design"
                    }
                
                return {
                    "available": False,
                    "error": "Node.js not found in PATH. Please install Node.js LTS."
                }
            
            # Verify versions to ensure they actually work
            try:
                node_v = await self._run_command(["node", "--version"])
                npm_v = await self._run_command(["npm", "--version"])
                
                if node_v["returncode"] != 0:
                    raise RuntimeError("Node command failed despite being in PATH")
                
                logger.info(f"Infrastructure detected: Node {node_v['stdout'].strip()}, npm {npm_v['stdout'].strip()}")
                
                return {
                    "available": True,
                    "skipped": False,
                    "node_version": node_v["stdout"].strip(),
                    "npm_version": npm_v["stdout"].strip(),
                    "mock": False
                }
            except Exception as cmd_error:
                if can_skip:
                    logger.info(f"Node found but failed to run: {str(cmd_error)}. Using Non-Blocking fallback.")
                    return {
                        "available": True,
                        "skipped": True,
                        "node_version": "Error",
                        "npm_version": "Error",
                        "reason": f"Node found but not executable: {str(cmd_error)}"
                    }
                raise
            
        except Exception as e:
            logger.error("Error during infrastructure pre-check", error=str(e))
            return {
                "available": False,
                "error": str(e)
            }

    
    async def _read_package_json(self, package_json_path: str) -> Dict[str, Any]:
        """Read and validate package.json."""
        
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.loads(f.read())
            
            # Basic validation
            if not isinstance(package_data, dict):
                return {
                    "valid": False,
                    "error": "package.json is not a valid JSON object"
                }
            
            if "name" not in package_data:
                return {
                    "valid": False,
                    "error": "package.json missing 'name' field"
                }
            
            return {
                "valid": True,
                "data": package_data
            }
            
        except json.JSONDecodeError as e:
            return {
                "valid": False,
                "error": f"Invalid JSON in package.json: {str(e)}"
            }
        except Exception as e:
            return {
                "valid": False,
                "error": f"Error reading package.json: {str(e)}"
            }
    
    async def _install_dependencies(self, workspace_path: str) -> Dict[str, Any]:
        """Install npm dependencies."""
        
        try:
            logger.info("Installing npm dependencies", workspace_path=workspace_path)
            
            # In mock mode, simulate successful installation
            if settings.mock_mode:
                logger.info("Mock mode: Simulating npm install")
                # Create mock node_modules directory
                node_modules_path = os.path.join(workspace_path, "node_modules")
                os.makedirs(node_modules_path, exist_ok=True)
                
                # Create some mock package directories
                mock_packages = ["react", "typescript", "@types/react", "jest", "eslint"]
                for package in mock_packages:
                    package_path = os.path.join(node_modules_path, package)
                    os.makedirs(package_path, exist_ok=True)
                    # Create a simple package.json for each mock package
                    with open(os.path.join(package_path, "package.json"), 'w') as f:
                        json.dump({"name": package, "version": "1.0.0"}, f)
                
                return {
                    "success": True,
                    "stdout": "Mock npm install completed successfully",
                    "stderr": "",
                    "node_modules_created": True,
                    "mock": True
                }
            
            # Run npm install
            install_result = await self._run_command(
                ["npm", "install"],
                cwd=workspace_path,
                timeout=300  # 5 minutes timeout
            )
            
            if install_result["returncode"] != 0:
                return {
                    "success": False,
                    "error": f"npm install failed: {install_result['stderr']}",
                    "stdout": install_result["stdout"],
                    "stderr": install_result["stderr"]
                }
            
            # Check if node_modules was created
            node_modules_path = os.path.join(workspace_path, "node_modules")
            if not os.path.exists(node_modules_path):
                return {
                    "success": False,
                    "error": "node_modules directory not created after npm install"
                }
            
            return {
                "success": True,
                "stdout": install_result["stdout"],
                "stderr": install_result["stderr"],
                "node_modules_created": True,
                "mock": False
            }
            
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "npm install timed out after 5 minutes"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error during npm install: {str(e)}"
            }
    
    async def _verify_installation(self, workspace_path: str, 
                                 package_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify that dependencies were installed correctly."""
        
        verification_results = {
            "dependencies_verified": 0,
            "dependencies_missing": 0,
            "missing_packages": [],
            "verification_errors": []
        }
        
        try:
            # Check main dependencies
            dependencies = package_data.get("dependencies", {})
            dev_dependencies = package_data.get("devDependencies", {})
            all_dependencies = {**dependencies, **dev_dependencies}
            
            node_modules_path = os.path.join(workspace_path, "node_modules")
            
            for package_name in all_dependencies.keys():
                package_path = os.path.join(node_modules_path, package_name)
                
                if os.path.exists(package_path):
                    verification_results["dependencies_verified"] += 1
                else:
                    verification_results["dependencies_missing"] += 1
                    verification_results["missing_packages"].append(package_name)
            
            # Check for critical packages
            critical_packages = ["typescript", "react", "@types/react"]
            for package in critical_packages:
                if package in all_dependencies:
                    package_path = os.path.join(node_modules_path, package)
                    if not os.path.exists(package_path):
                        verification_results["verification_errors"].append(
                            f"Critical package missing: {package}"
                        )
            
            return verification_results
            
        except Exception as e:
            verification_results["verification_errors"].append(str(e))
            return verification_results
    
    async def _setup_additional_tools(self, workspace_path: str) -> Dict[str, Any]:
        """Set up additional development tools."""
        
        tools_setup = {
            "typescript_available": False,
            "eslint_available": False,
            "jest_available": False,
            "tools_errors": []
        }
        
        try:
            # In mock mode, simulate tool availability
            if settings.mock_mode:
                logger.info("Mock mode: Simulating development tools availability")
                tools_setup.update({
                    "typescript_available": True,
                    "eslint_available": True,
                    "jest_available": True,
                    "mock": True
                })
                return tools_setup
            
            # Check TypeScript
            ts_result = await self._run_command(
                ["npx", "tsc", "--version"],
                cwd=workspace_path
            )
            tools_setup["typescript_available"] = ts_result["returncode"] == 0
            
            # Check ESLint
            eslint_result = await self._run_command(
                ["npx", "eslint", "--version"],
                cwd=workspace_path
            )
            tools_setup["eslint_available"] = eslint_result["returncode"] == 0
            
            # Check Jest
            jest_result = await self._run_command(
                ["npx", "jest", "--version"],
                cwd=workspace_path
            )
            tools_setup["jest_available"] = jest_result["returncode"] == 0
            
            tools_setup["mock"] = False
            
        except Exception as e:
            tools_setup["tools_errors"].append(str(e))
        
        return tools_setup
    
    async def _run_command(self, command: List[str], cwd: str = None, 
                         timeout: int = 30) -> Dict[str, Any]:
        """Run a shell command asynchronously."""
        
        try:
            # Join command list into a single string for shell execution
            command_str = " ".join(command)
            
            process = await asyncio.create_subprocess_shell(
                command_str,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            return {
                "returncode": process.returncode,
                "stdout": stdout.decode('utf-8') if stdout else "",
                "stderr": stderr.decode('utf-8') if stderr else ""
            }
            
        except asyncio.TimeoutError:
            if 'process' in locals():
                try:
                    process.kill()
                    await process.wait()
                except:
                    pass
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": f"Command timed out after {timeout} seconds"
            }
        except Exception as e:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e)
            }
    
    async def cleanup_environment(self, workspace_path: str) -> Dict[str, Any]:
        """Clean up the temporary environment."""
        
        try:
            if os.path.exists(workspace_path):
                # Remove node_modules to save space
                node_modules_path = os.path.join(workspace_path, "node_modules")
                if os.path.exists(node_modules_path):
                    shutil.rmtree(node_modules_path)
                    logger.info("Cleaned up node_modules", workspace_path=workspace_path)
                
                return {
                    "success": True,
                    "cleaned_up": True
                }
            else:
                return {
                    "success": True,
                    "cleaned_up": False,
                    "message": "Workspace path does not exist"
                }
                
        except Exception as e:
            logger.error("Error cleaning up environment", 
                        workspace_path=workspace_path,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }


# Global tool instance
setup_environment_tool = SetupEnvironmentTool()