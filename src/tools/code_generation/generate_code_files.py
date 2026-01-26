"""Tool #6: Generate Code Files - Uses Gemini AI to generate TypeScript code."""

import os
import asyncio
from typing import Dict, Any, List, Optional
from src.integrations.client_factory import get_gemini_client
from src.config import settings
from src.utils.logging import get_logger
from src.utils.security import code_security_scanner
import time
import json

logger = get_logger(__name__)


class GenerateCodeFilesTool:
    """Tool for generating TypeScript code files using AI."""
    
    def __init__(self):
        self.name = "generate_code_files"
        self.description = "Generates TypeScript code files using Gemini AI"
    
    async def execute(self, implementation_plan: Dict[str, Any], 
                     workspace_path: str,
                     figma_data: Dict[str, Any] = None,
                     repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate code files based on implementation plan.
        
        Args:
            implementation_plan: Implementation plan from Agent 1
            workspace_path: Workspace directory path
            figma_data: Figma design data for component generation
            repository_analysis: Repository analysis for existing patterns
            
        Returns:
            Dict containing generated files and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Generating code files", workspace_path=workspace_path)
            
            # Get Gemini client
            gemini_client = get_gemini_client()
            
            # Extract files to generate from implementation plan
            files_to_generate = self._extract_files_from_plan(implementation_plan)
            
            if not files_to_generate:
                return {
                    "success": False,
                    "error": "No files to generate found in implementation plan",
                    "files_generated": [],
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Generate files in batches to avoid overwhelming the AI
            generated_files = []
            generation_results = []
            
            # Group files by type for efficient generation
            file_groups = self._group_files_by_type(files_to_generate)
            
            for file_type, files in file_groups.items():
                logger.info(f"Generating {file_type} files", count=len(files))
                
                batch_result = await self._generate_file_batch(
                    files, file_type, workspace_path, 
                    implementation_plan, figma_data, repository_analysis
                )
                
                generated_files.extend(batch_result["files"])
                generation_results.append(batch_result)
            
            # Security scan generated code
            security_issues = await self._scan_generated_code(workspace_path, generated_files)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Code files generated successfully", 
                       files_count=len(generated_files),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "files_generated": generated_files,
                "generation_results": generation_results,
                "security_scan": security_issues,
                "summary": self._create_generation_summary(generated_files, generation_results),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error generating code files", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "files_generated": [],
                "duration_ms": duration_ms
            }
    
    def _extract_files_from_plan(self, implementation_plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract files to generate from implementation plan."""
        
        files_to_generate = []
        
        tasks = implementation_plan.get("tasks", [])
        for task in tasks:
            files_to_create = task.get("files_to_create", [])
            for file_info in files_to_create:
                # Only generate code files (not config files)
                file_type = file_info.get("type", "")
                if file_type in ["component", "page", "hook", "util", "service", "type", "config", "style"]:
                    files_to_generate.append({
                        **file_info,
                        "task_id": task.get("id"),
                        "task_description": task.get("description", "")
                    })
        
        return files_to_generate
    
    def _group_files_by_type(self, files: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group files by type for batch processing."""
        
        groups = {}
        
        for file_info in files:
            file_type = file_info.get("type", "component")
            if file_type not in groups:
                groups[file_type] = []
            groups[file_type].append(file_info)
        
        return groups
    
    async def _generate_file_batch(self, files: List[Dict[str, Any]], 
                                 file_type: str,
                                 workspace_path: str,
                                 implementation_plan: Dict[str, Any],
                                 figma_data: Dict[str, Any] = None,
                                 repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a batch of files of the same type."""
        
        batch_start = time.time()
        generated_files = []
        errors = []
        
        for file_info in files:
            try:
                file_result = await self._generate_single_file(
                    file_info, workspace_path, implementation_plan, 
                    figma_data, repository_analysis
                )
                
                if file_result["success"]:
                    file_info = file_result["file_info"]
                    generated_files.append(file_info)
                    
                    # Also track extracted CSS module as a separate file
                    if file_info.get("extracted_css"):
                        generated_files.append(file_info["extracted_css"])
                else:
                    errors.append({
                        "file": file_info.get("path", "unknown"),
                        "error": file_result["error"]
                    })
                    
            except Exception as e:
                errors.append({
                    "file": file_info.get("path", "unknown"),
                    "error": str(e)
                })
        
        return {
            "file_type": file_type,
            "files": generated_files,
            "errors": errors,
            "duration_ms": int((time.time() - batch_start) * 1000)
        }
    
    async def _generate_single_file(self, file_info: Dict[str, Any],
                                  workspace_path: str,
                                  implementation_plan: Dict[str, Any],
                                  figma_data: Dict[str, Any] = None,
                                  repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a single code file."""
        
        file_path = file_info.get("path", "")
        file_type = file_info.get("type", "component")
        
        try:
            # Get Gemini client for AI generation
            gemini_client = get_gemini_client()
            
            # Prepare context for AI generation
            generation_context = self._prepare_generation_context(
                file_info, implementation_plan, figma_data, repository_analysis
            )
            
            # Generate code based on file type
            if file_type == "component":
                code = await self._generate_component_code(generation_context, gemini_client)
            elif file_type == "hook":
                code = await self._generate_hook_code(generation_context, gemini_client)
            elif file_type == "util":
                code = await self._generate_util_code(generation_context, gemini_client)
            elif file_type == "service":
                code = await self._generate_service_code(generation_context, gemini_client)
            elif file_type == "type":
                code = await self._generate_type_code(generation_context, gemini_client)
            elif file_type == "page":
                code = await self._generate_page_code(generation_context, gemini_client)
            else:
                code = await self._generate_generic_code(generation_context, gemini_client)
            
            if not code:
                return {
                    "success": False,
                    "error": f"AI failed to generate code for {file_path}"
                }
            
            # Post-process code (extract CSS modules, strip markdown, etc.)
            processed_code, extracted_css = self._post_process_code(code, file_path)
            
            # Write main code file to workspace
            full_path = os.path.join(workspace_path, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(processed_code)
            
            # Write extracted CSS module if any
            extracted_css_info = None
            if extracted_css:
                css_filename = file_path.replace('.tsx', '.module.css').replace('.ts', '.module.css')
                css_path = os.path.join(workspace_path, css_filename)
                with open(css_path, 'w', encoding='utf-8') as f:
                    f.write(extracted_css)
                logger.info(f"Extracted CSS module for {file_path}")
                
                extracted_css_info = {
                    "path": css_filename,
                    "type": "style",
                    "size_bytes": len(extracted_css.encode('utf-8')),
                    "lines_count": len(extracted_css.split('\n')),
                    "full_path": css_path
                }
            
            return {
                "success": True,
                "file_info": {
                    "path": file_path,
                    "type": file_type,
                    "size_bytes": len(processed_code.encode('utf-8')),
                    "lines_count": len(processed_code.split('\n')),
                    "full_path": full_path,
                    "extracted_css": extracted_css_info
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _prepare_generation_context(self, file_info: Dict[str, Any],
                                  implementation_plan: Dict[str, Any],
                                  figma_data: Dict[str, Any] = None,
                                  repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Prepare context for AI code generation."""
        
        context = {
            "file_info": file_info,
            "technical_approach": implementation_plan.get("technical_approach", {}),
            "design_tokens": {},
            "existing_patterns": [],
            "component_specs": [],
            "dependencies": implementation_plan.get("new_dependencies", [])
        }
        
        # Add Figma design context
        if figma_data:
            context["design_tokens"] = figma_data.get("design_tokens", {})
            context["layout_topology"] = figma_data.get("layout", {}).get("topology", {})
            context["visual_summary"] = figma_data.get("visual_summary", "")
            
            # Find matching component in Figma
            figma_component_id = file_info.get("figma_component_id")
            if figma_component_id:
                component_analysis = figma_data.get("component_analysis", [])
                matching_component = next(
                    (c for c in component_analysis if c.get("id") == figma_component_id),
                    None
                )
                if matching_component:
                    context["component_specs"] = [matching_component]
        
        # Add repository patterns
        if repository_analysis:
            analysis_data = repository_analysis.get("analysis", {})
            context["existing_patterns"] = analysis_data.get("component_patterns", [])
            context["has_typescript"] = analysis_data.get("has_typescript", True)
            context["styling_approach"] = analysis_data.get("current_styling", "css-modules")
        
        return context
    
    async def _generate_component_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate React component code."""
        
        file_info = context["file_info"]
        component_name = os.path.splitext(os.path.basename(file_info["path"]))[0]
        
        # Find component specification
        component_spec = {
            "name": component_name,
            "description": file_info.get("description", ""),
            "props": file_info.get("props", []),
            "interfaces": file_info.get("interfaces", []),
            "styling_approach": file_info.get("styling_approach", "css-modules")
        }
        
        # Add Figma component specs if available
        if context["component_specs"]:
            component_spec.update(context["component_specs"][0])
        
        return await gemini_client.generate_react_component(
            component_spec,
            {
                "tokens": context["design_tokens"],
                "layout": context.get("layout_topology", {}),
                "summary": context.get("visual_summary", "")
            },
            context["existing_patterns"]
        )
    
    async def _generate_hook_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate custom React hook code."""
        
        file_info = context["file_info"]
        hook_name = os.path.splitext(os.path.basename(file_info["path"]))[0]
        
        prompt = f"""
        Generate a custom React hook in TypeScript.
        
        Hook Name: {hook_name}
        Description: {file_info.get("description", "")}
        
        Requirements:
        - Use TypeScript with proper types
        - Follow React hooks best practices
        - Include JSDoc comments
        - Handle edge cases and errors
        - Return appropriate values/functions
        
        Existing patterns: {json.dumps(context["existing_patterns"], indent=2)}
        
        Generate only the hook code, no explanations.
        """
        
        return await gemini_client._generate_content_async(prompt)
    
    async def _generate_util_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate utility function code."""
        
        file_info = context["file_info"]
        util_name = os.path.splitext(os.path.basename(file_info["path"]))[0]
        
        prompt = f"""
        Generate utility functions in TypeScript.
        
        Utility Name: {util_name}
        Description: {file_info.get("description", "")}
        
        Requirements:
        - Use TypeScript with proper types
        - Include comprehensive JSDoc comments
        - Handle edge cases and validation
        - Export functions appropriately
        - Include unit test examples in comments
        
        Generate only the utility code, no explanations.
        """
        
        return await gemini_client._generate_content_async(prompt)
    
    async def _generate_service_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate service/API code."""
        
        file_info = context["file_info"]
        service_name = os.path.splitext(os.path.basename(file_info["path"]))[0]
        
        prompt = f"""
        Generate a service class/module in TypeScript.
        
        Service Name: {service_name}
        Description: {file_info.get("description", "")}
        
        Requirements:
        - Use TypeScript with proper types
        - Include error handling
        - Use async/await for API calls
        - Include proper interfaces for requests/responses
        - Add JSDoc comments
        - Follow service layer patterns
        
        Generate only the service code, no explanations.
        """
        
        return await gemini_client._generate_content_async(prompt)
    
    async def _generate_type_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate TypeScript type definitions."""
        
        file_info = context["file_info"]
        
        prompt = f"""
        Generate TypeScript type definitions.
        
        File: {file_info.get("path", "")}
        Description: {file_info.get("description", "")}
        
        Requirements:
        - Define comprehensive TypeScript interfaces and types
        - Include JSDoc comments for complex types
        - Use proper TypeScript utility types where appropriate
        - Export types appropriately
        - Follow TypeScript best practices
        
        Generate only the type definitions, no explanations.
        """
        
        return await gemini_client._generate_content_async(prompt)
    
    async def _generate_page_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate page component code."""
        
        file_info = context["file_info"]
        page_name = os.path.splitext(os.path.basename(file_info["path"]))[0]
        
        prompt = f"""
        Generate a React page component in TypeScript.
        
        Page Name: {page_name}
        Description: {file_info.get("description", "")}
        
        Requirements:
        - Use TypeScript with proper types
        - Include proper page structure
        - Add SEO meta tags if applicable
        - Use React Router for all navigation
        - Integrate with high-fidelity UI patterns (modern aesthetics)
        - Include loading and error states
        - MANDATORY: If this is an App.tsx file, ensure it correctly routes to the new features and provides a functional layout shell.
        - Follow page component patterns
        
        Design context: 
        - Tokens: {json.dumps(context["design_tokens"], indent=2)}
        - Layout: {json.dumps(context.get("layout_topology", {}), indent=2)}
        - Visual Summary: {context.get("visual_summary", "")}
        
        Generate only the page component code, no explanations.
        """
        
        return await gemini_client._generate_content_async(prompt)
    
    async def _generate_generic_code(self, context: Dict[str, Any], gemini_client) -> Optional[str]:
        """Generate generic TypeScript code."""
        
        file_info = context["file_info"]
        
        prompt = f"""
        Generate TypeScript code for this file.
        
        File: {file_info.get("path", "")}
        Type: {file_info.get("type", "")}
        Description: {file_info.get("description", "")}
        
        Requirements:
        - Use TypeScript with proper types
        - Follow best practices
        - Include appropriate comments
        - Handle errors appropriately
        
        Generate only the code, no explanations.
        """
        
        return await gemini_client._generate_content_async(prompt)
    
    async def _scan_generated_code(self, workspace_path: str, 
                                 generated_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Scan generated code for security issues."""
        
        security_issues = []
        
        for file_info in generated_files:
            file_path = file_info["path"]
            full_path = file_info["full_path"]
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    code_content = f.read()
                
                # Scan for security issues
                issues = code_security_scanner.scan_code(code_content, file_path)
                
                if issues:
                    security_issues.extend(issues)
                    
            except Exception as e:
                logger.warning("Failed to scan file for security issues", 
                             file=file_path, error=str(e))
        
        return security_issues
    
    def _post_process_code(self, raw_code: str, file_path: str) -> tuple[str, Optional[str]]:
        """Post-process generated code to extract CSS and clean markdown."""
        import re
        
        # 1. Strip markdown code blocks if the AI included them
        clean_code = raw_code.strip()
        if "```" in clean_code:
            # Check for multiple blocks (e.g., TSX and CSS)
            blocks = re.findall(r"```(?:\w+)?\n(.*?)\n```", clean_code, re.DOTALL)
            tsx_code = ""
            css_code = None
            
            for block in blocks:
                # Basic heuristic: if it has "import" or "interface", it's TSX
                if "import " in block or "interface " in block or "export const" in block:
                    tsx_code += block + "\n"
                # If it looks like CSS
                elif "{" in block and ":" in block and "}" in block:
                    css_code = block
            
            if tsx_code:
                clean_code = tsx_code.strip()
            else:
                # Fallback to first block
                clean_code = blocks[0].strip()
                
            return clean_code, css_code
            
        return clean_code, None

    def _create_generation_summary(self, generated_files: List[Dict[str, Any]], 
                                 generation_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create summary of code generation."""
        
        total_lines = sum(f.get("lines_count", 0) for f in generated_files)
        total_size = sum(f.get("size_bytes", 0) for f in generated_files)
        
        file_types = {}
        for file_info in generated_files:
            file_type = file_info.get("type", "unknown")
            if file_type not in file_types:
                file_types[file_type] = 0
            file_types[file_type] += 1
        
        errors = []
        for result in generation_results:
            errors.extend(result.get("errors", []))
        
        return {
            "total_files_generated": len(generated_files),
            "total_lines_of_code": total_lines,
            "total_size_bytes": total_size,
            "file_types_generated": file_types,
            "generation_errors": len(errors),
            "error_details": errors[:5],  # Show first 5 errors
            "success_rate": (len(generated_files) / (len(generated_files) + len(errors))) * 100 if (len(generated_files) + len(errors)) > 0 else 100
        }


# Global tool instance
generate_code_files_tool = GenerateCodeFilesTool()