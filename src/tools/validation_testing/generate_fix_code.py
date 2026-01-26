"""Tool #14: Generate Fix Code - Uses Gemini AI to generate corrected code files."""

import os
from typing import Dict, Any, List, Optional
from src.integrations.client_factory import get_gemini_client
from src.config import settings
from src.utils.logging import get_logger
from src.utils.security import code_security_scanner
import time
import json

logger = get_logger(__name__)


class GenerateFixCodeTool:
    """Tool for generating fixed code using AI based on error analysis."""
    
    def __init__(self):
        self.name = "generate_fix_code"
        self.description = "Generates corrected code files using Gemini AI"
    
    async def execute(self, workspace_path: str,
                     fix_suggestions: List[Dict[str, Any]],
                     current_code_files: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Generate fixed code based on error analysis.
        
        Args:
            workspace_path: Path to the workspace
            fix_suggestions: List of fix suggestions from error analysis
            current_code_files: Optional dict of file_path -> current_code_content
            
        Returns:
            Dict containing generated fixed code and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Generating fix code", 
                       workspace_path=workspace_path,
                       fix_suggestions_count=len(fix_suggestions))
            
            if not fix_suggestions:
                return {
                    "success": True,
                    "fixed_files": {},
                    "changes_made": [],
                    "message": "No fix suggestions provided",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Read current code files if not provided
            if current_code_files is None:
                current_code_files = await self._read_current_code_files(workspace_path)
            
            # Generate fixes for each suggestion
            fixed_files = {}
            changes_made = []
            generation_errors = []
            
            for i, suggestion in enumerate(fix_suggestions):
                try:
                    logger.info(f"Processing fix suggestion {i+1}/{len(fix_suggestions)}")
                    
                    fix_result = await self._generate_fix_for_suggestion(
                        suggestion, current_code_files, workspace_path
                    )
                    
                    if fix_result["success"]:
                        fixed_files.update(fix_result["fixed_files"])
                        changes_made.extend(fix_result["changes_made"])
                    else:
                        generation_errors.append({
                            "suggestion_id": suggestion.get("id", f"suggestion_{i}"),
                            "error": fix_result["error"]
                        })
                        
                except Exception as e:
                    generation_errors.append({
                        "suggestion_id": suggestion.get("id", f"suggestion_{i}"),
                        "error": str(e)
                    })
            
            # Apply security scanning to fixed code
            security_issues = await self._scan_fixed_code(fixed_files)
            
            # Write fixed files to workspace
            write_results = await self._write_fixed_files(workspace_path, fixed_files)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Fix code generation completed", 
                       fixed_files_count=len(fixed_files),
                       changes_made_count=len(changes_made),
                       errors_count=len(generation_errors),
                       duration_ms=duration_ms)
            
            return {
                "success": len(fixed_files) > 0 or len(generation_errors) == 0,
                "fixed_files": fixed_files,
                "changes_made": changes_made,
                "generation_errors": generation_errors,
                "security_issues": security_issues,
                "write_results": write_results,
                "summary": self._create_fix_summary(fixed_files, changes_made, generation_errors),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error generating fix code", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "fixed_files": {},
                "changes_made": [],
                "duration_ms": duration_ms
            }
    
    async def _read_current_code_files(self, workspace_path: str) -> Dict[str, str]:
        """Read current code files from workspace."""
        
        code_files = {}
        
        try:
            # Find TypeScript/JavaScript files
            for root, dirs, files in os.walk(workspace_path):
                # Skip node_modules and other irrelevant directories
                dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'coverage', 'dist', 'build']]
                
                for file in files:
                    if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, workspace_path)
                        
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                code_files[relative_path] = f.read()
                        except Exception as e:
                            logger.warning(f"Failed to read file {relative_path}", error=str(e))
        
        except Exception as e:
            logger.error("Error reading current code files", error=str(e))
        
        return code_files
    
    async def _generate_fix_for_suggestion(self, suggestion: Dict[str, Any],
                                         current_code_files: Dict[str, str],
                                         workspace_path: str) -> Dict[str, Any]:
        """Generate fix for a single suggestion."""
        
        try:
            # Extract files that need fixing
            code_changes = suggestion.get("code_changes", [])
            
            if not code_changes:
                # Generate fix using AI if no specific code changes provided
                return await self._generate_ai_fix(suggestion, current_code_files)
            
            # Apply specific code changes
            fixed_files = {}
            changes_made = []
            
            for change in code_changes:
                file_path = change.get("file_path", "")
                change_type = change.get("change_type", "modify")
                
                if file_path in current_code_files:
                    if change_type == "modify":
                        fixed_code = await self._apply_code_modification(
                            current_code_files[file_path], change
                        )
                        
                        if fixed_code:
                            fixed_files[file_path] = fixed_code
                            changes_made.append({
                                "file_path": file_path,
                                "change_type": change_type,
                                "description": f"Applied fix at line {change.get('line_number', 'unknown')}"
                            })
                
                elif change_type == "create":
                    # Create new file
                    new_code = change.get("fixed_code", "")
                    if new_code:
                        fixed_files[file_path] = new_code
                        changes_made.append({
                            "file_path": file_path,
                            "change_type": "create",
                            "description": "Created new file"
                        })
            
            return {
                "success": len(fixed_files) > 0,
                "fixed_files": fixed_files,
                "changes_made": changes_made
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "fixed_files": {},
                "changes_made": []
            }
    
    async def _apply_code_modification(self, original_code: str, 
                                     change: Dict[str, Any]) -> Optional[str]:
        """Apply a specific code modification."""
        
        try:
            original_snippet = change.get("original_code", "")
            fixed_snippet = change.get("fixed_code", "")
            line_number = change.get("line_number")
            
            if original_snippet and fixed_snippet:
                # Simple string replacement
                if original_snippet in original_code:
                    return original_code.replace(original_snippet, fixed_snippet)
                
                # Try line-based replacement if line number provided
                if line_number:
                    lines = original_code.split('\n')
                    if 0 <= line_number - 1 < len(lines):
                        lines[line_number - 1] = fixed_snippet
                        return '\n'.join(lines)
            
            # If specific changes don't work, use AI to generate the fix
            return await self._generate_ai_file_fix(original_code, change)
            
        except Exception as e:
            logger.error("Error applying code modification", error=str(e))
            return None
    
    async def _generate_ai_fix(self, suggestion: Dict[str, Any],
                             current_code_files: Dict[str, str]) -> Dict[str, Any]:
        """Generate fix using AI when specific changes aren't provided."""
        
        try:
            # Prepare context for AI
            relevant_files = {}
            error_ids = suggestion.get("error_ids", [])
            
            # Try to identify relevant files from error IDs or suggestion content
            for file_path, code in current_code_files.items():
                if any(file_path in str(error_id) for error_id in error_ids):
                    relevant_files[file_path] = code
            
            # If no specific files identified, include all files (limited)
            if not relevant_files:
                relevant_files = dict(list(current_code_files.items())[:5])  # Limit to 5 files
            
            prompt = f"""
            You are an expert TypeScript/React developer. Fix the code based on this analysis:
            
            FIX SUGGESTION:
            {json.dumps(suggestion, indent=2)}
            
            CURRENT CODE FILES:
            {json.dumps(relevant_files, indent=2)}
            
            Generate the fixed versions of the files. Return as JSON:
            {{
                "fixed_files": {{
                    "file_path": "fixed_code_content"
                }},
                "changes_made": [
                    {{
                        "file_path": "path/to/file",
                        "change_type": "modify",
                        "description": "What was changed"
                    }}
                ]
            }}
            
            Only include files that actually need changes. Ensure the fixed code:
            1. Resolves the identified errors
            2. Maintains existing functionality
            3. Follows TypeScript/React best practices
            4. Is syntactically correct
            """
            
            ai_response = await get_gemini_client()._generate_content_async(prompt)
            
            if ai_response:
                try:
                    fix_data = json.loads(ai_response)
                    return {
                        "success": True,
                        "fixed_files": fix_data.get("fixed_files", {}),
                        "changes_made": fix_data.get("changes_made", [])
                    }
                except json.JSONDecodeError:
                    logger.error("Failed to parse AI fix response as JSON")
                    return {
                        "success": False,
                        "error": "AI response was not valid JSON",
                        "fixed_files": {},
                        "changes_made": []
                    }
            
            return {
                "success": False,
                "error": "AI failed to generate fix",
                "fixed_files": {},
                "changes_made": []
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "fixed_files": {},
                "changes_made": []
            }
    
    async def _generate_ai_file_fix(self, original_code: str, 
                                  change: Dict[str, Any]) -> Optional[str]:
        """Generate fix for a single file using AI."""
        
        try:
            prompt = f"""
            Fix this TypeScript/React code based on the change specification:
            
            ORIGINAL CODE:
            ```typescript
            {original_code}
            ```
            
            CHANGE SPECIFICATION:
            {json.dumps(change, indent=2)}
            
            Return only the fixed code, no explanations or markdown formatting.
            """
            
            fixed_code = await get_gemini_client()._generate_content_async(prompt)
            return fixed_code
            
        except Exception as e:
            logger.error("Error generating AI file fix", error=str(e))
            return None
    
    async def _scan_fixed_code(self, fixed_files: Dict[str, str]) -> List[Dict[str, Any]]:
        """Scan fixed code for security issues."""
        
        security_issues = []
        
        for file_path, code_content in fixed_files.items():
            try:
                issues = code_security_scanner.scan_code(code_content, file_path)
                security_issues.extend(issues)
            except Exception as e:
                logger.warning("Failed to scan fixed code for security issues", 
                             file=file_path, error=str(e))
        
        return security_issues
    
    async def _write_fixed_files(self, workspace_path: str, 
                               fixed_files: Dict[str, str]) -> Dict[str, Any]:
        """Write fixed files to workspace."""
        
        write_results = {
            "files_written": 0,
            "files_failed": 0,
            "errors": []
        }
        
        for file_path, code_content in fixed_files.items():
            try:
                full_path = os.path.join(workspace_path, file_path)
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                # Write fixed code
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(code_content)
                
                write_results["files_written"] += 1
                logger.debug("Wrote fixed file", file_path=file_path)
                
            except Exception as e:
                write_results["files_failed"] += 1
                write_results["errors"].append({
                    "file_path": file_path,
                    "error": str(e)
                })
                logger.error("Failed to write fixed file", 
                           file_path=file_path, error=str(e))
        
        return write_results
    
    def _create_fix_summary(self, fixed_files: Dict[str, str],
                          changes_made: List[Dict[str, Any]],
                          generation_errors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create summary of fix generation."""
        
        return {
            "total_files_fixed": len(fixed_files),
            "total_changes_made": len(changes_made),
            "total_generation_errors": len(generation_errors),
            "success_rate": (len(fixed_files) / (len(fixed_files) + len(generation_errors))) * 100 if (len(fixed_files) + len(generation_errors)) > 0 else 100,
            "files_by_change_type": self._categorize_changes_by_type(changes_made),
            "error_summary": [error["error"] for error in generation_errors[:3]]  # Show first 3 errors
        }
    
    def _categorize_changes_by_type(self, changes_made: List[Dict[str, Any]]) -> Dict[str, int]:
        """Categorize changes by type."""
        
        categories = {}
        
        for change in changes_made:
            change_type = change.get("change_type", "unknown")
            if change_type not in categories:
                categories[change_type] = 0
            categories[change_type] += 1
        
        return categories


# Global tool instance
generate_fix_code_tool = GenerateFixCodeTool()
