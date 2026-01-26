"""Tool #13: Analyze Error Logs - Uses Gemini AI to analyze error messages and suggest fixes."""

from typing import Dict, Any, List, Optional
from src.integrations.client_factory import get_gemini_client
from src.config import settings
from src.utils.logging import get_logger
from src.models.validation_result import ValidationError, FixAttempt
import time
import json
from datetime import datetime

logger = get_logger(__name__)


class AnalyzeErrorLogsTool:
    """Tool for analyzing error logs and suggesting fixes using AI."""
    
    def __init__(self):
        self.name = "analyze_error_logs"
        self.description = "Analyzes error messages using Gemini AI and suggests fixes"
    
    async def execute(self, error_logs: List[str], 
                     validation_errors: List[Dict[str, Any]] = None,
                     code_context: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Analyze error logs and suggest fixes.
        
        Args:
            error_logs: List of error log strings
            validation_errors: List of structured validation errors
            code_context: Optional dict of file_path -> code_content for context
            
        Returns:
            Dict containing error analysis and fix suggestions
        """
        start_time = time.time()
        
        try:
            logger.info("Analyzing error logs", error_count=len(error_logs))
            
            if not error_logs and not validation_errors:
                return {
                    "success": True,
                    "analysis": {
                        "errors_analyzed": 0,
                        "fix_suggestions": [],
                        "confidence_score": 1.0,
                        "analysis_summary": "No errors to analyze"
                    },
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Prepare error data for analysis
            error_data = self._prepare_error_data(error_logs, validation_errors)
            
            # Analyze errors using AI
            analysis_result = await self._analyze_errors_with_ai(error_data, code_context)
            
            if not analysis_result:
                return {
                    "success": False,
                    "error": "Failed to analyze errors with AI",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Parse and structure the analysis
            structured_analysis = self._structure_analysis_result(analysis_result, error_data)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Error analysis completed", 
                       errors_analyzed=len(error_data),
                       fix_suggestions=len(structured_analysis.get("fix_suggestions", [])),
                       confidence=structured_analysis.get("confidence_score", 0),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "analysis": structured_analysis,
                "error_data": error_data,
                "ai_response": analysis_result,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error analyzing error logs", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    def _prepare_error_data(self, error_logs: List[str], 
                          validation_errors: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Prepare error data for AI analysis."""
        
        error_data = []
        
        # Process raw error logs
        for i, log in enumerate(error_logs):
            error_data.append({
                "id": f"log_{i}",
                "type": "raw_log",
                "content": log,
                "source": "unknown",
                "severity": "error"
            })
        
        # Process structured validation errors
        if validation_errors:
            for i, error in enumerate(validation_errors):
                error_data.append({
                    "id": f"validation_{i}",
                    "type": "validation_error",
                    "content": error.get("message", ""),
                    "file_path": error.get("file_path", ""),
                    "line": error.get("line"),
                    "column": error.get("column"),
                    "rule": error.get("rule", ""),
                    "source": error.get("source", ""),
                    "severity": error.get("severity", "error"),
                    "auto_fixable": error.get("auto_fixable", False)
                })
        
        return error_data
    
    async def _analyze_errors_with_ai(self, error_data: List[Dict[str, Any]], 
                                    code_context: Dict[str, str] = None) -> Optional[str]:
        """Analyze errors using Gemini AI."""
        
        # Prepare context for AI
        context_info = ""
        if code_context:
            context_info = "\n\nCODE CONTEXT:\n"
            for file_path, code_content in code_context.items():
                # Limit code context to avoid token limits
                truncated_code = code_content[:2000] + "..." if len(code_content) > 2000 else code_content
                context_info += f"\n{file_path}:\n```typescript\n{truncated_code}\n```\n"
        
        prompt = f"""
        You are an expert TypeScript/React developer and debugging specialist. Analyze these errors and provide detailed fix suggestions.
        
        ERRORS TO ANALYZE:
        {json.dumps(error_data, indent=2)}
        
        {context_info}
        
        For each error, provide:
        1. Root cause analysis
        2. Specific fix suggestions with code examples
        3. Confidence level (0.0 to 1.0)
        4. Whether the fix can be automated
        5. Priority level (high, medium, low)
        6. Related errors that might be caused by the same issue
        
        Return your analysis as a JSON object with this structure:
        {{
            "overall_confidence": 0.8,
            "analysis_summary": "Brief summary of the main issues found",
            "error_categories": ["typescript", "eslint", "runtime"],
            "fix_suggestions": [
                {{
                    "error_ids": ["log_0", "validation_1"],
                    "root_cause": "Description of the root cause",
                    "fix_description": "What needs to be fixed",
                    "code_changes": [
                        {{
                            "file_path": "src/components/Button.tsx",
                            "change_type": "modify",
                            "original_code": "const Button = () => {{",
                            "fixed_code": "const Button: React.FC = () => {{",
                            "line_number": 5
                        }}
                    ],
                    "confidence": 0.9,
                    "automated": true,
                    "priority": "high",
                    "testing_notes": "How to test this fix"
                }}
            ],
            "prevention_suggestions": ["How to prevent similar errors in the future"]
        }}
        
        Focus on practical, actionable fixes. If you're not confident about a fix, say so and explain why.
        """
        
        try:
            return await get_gemini_client()._generate_content_async(prompt)
        except Exception as e:
            logger.error("Error calling Gemini AI for error analysis", error=str(e))
            return None
    
    def _structure_analysis_result(self, ai_response: str, 
                                 error_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Structure the AI analysis result."""
        
        try:
            # Try to parse JSON response
            analysis = json.loads(ai_response)
            
            # Validate and enhance the analysis
            structured_analysis = {
                "errors_analyzed": len(error_data),
                "confidence_score": analysis.get("overall_confidence", 0.5),
                "analysis_summary": analysis.get("analysis_summary", "Analysis completed"),
                "error_categories": analysis.get("error_categories", []),
                "fix_suggestions": [],
                "prevention_suggestions": analysis.get("prevention_suggestions", []),
                "ai_reasoning": ai_response
            }
            
            # Process fix suggestions
            for suggestion in analysis.get("fix_suggestions", []):
                structured_suggestion = {
                    "id": f"fix_{len(structured_analysis['fix_suggestions'])}",
                    "error_ids": suggestion.get("error_ids", []),
                    "root_cause": suggestion.get("root_cause", ""),
                    "fix_description": suggestion.get("fix_description", ""),
                    "code_changes": suggestion.get("code_changes", []),
                    "confidence": suggestion.get("confidence", 0.5),
                    "automated": suggestion.get("automated", False),
                    "priority": suggestion.get("priority", "medium"),
                    "testing_notes": suggestion.get("testing_notes", ""),
                    "estimated_time_minutes": self._estimate_fix_time(suggestion)
                }
                
                structured_analysis["fix_suggestions"].append(structured_suggestion)
            
            return structured_analysis
            
        except json.JSONDecodeError:
            # Fallback: create basic analysis from text response
            return {
                "errors_analyzed": len(error_data),
                "confidence_score": 0.3,
                "analysis_summary": "AI provided text analysis (JSON parsing failed)",
                "error_categories": ["unknown"],
                "fix_suggestions": [{
                    "id": "fix_0",
                    "error_ids": [error["id"] for error in error_data],
                    "root_cause": "Multiple errors detected",
                    "fix_description": ai_response[:500] + "..." if len(ai_response) > 500 else ai_response,
                    "code_changes": [],
                    "confidence": 0.3,
                    "automated": False,
                    "priority": "medium",
                    "testing_notes": "Manual review required",
                    "estimated_time_minutes": 30
                }],
                "prevention_suggestions": ["Review AI response for detailed suggestions"],
                "ai_reasoning": ai_response
            }
    
    def _estimate_fix_time(self, suggestion: Dict[str, Any]) -> int:
        """Estimate time needed to implement a fix."""
        
        base_time = 15  # Base 15 minutes
        
        # Add time based on number of code changes
        code_changes = suggestion.get("code_changes", [])
        base_time += len(code_changes) * 5
        
        # Adjust based on confidence
        confidence = suggestion.get("confidence", 0.5)
        if confidence < 0.5:
            base_time *= 2  # Double time for low confidence fixes
        
        # Adjust based on priority
        priority = suggestion.get("priority", "medium")
        if priority == "high":
            base_time += 10  # Add time for high priority (more careful implementation)
        
        # Adjust based on automation
        if not suggestion.get("automated", False):
            base_time += 15  # Add time for manual fixes
        
        return min(base_time, 120)  # Cap at 2 hours
    
    async def create_fix_attempt(self, fix_suggestion: Dict[str, Any], 
                               attempt_number: int) -> FixAttempt:
        """Create a FixAttempt record for tracking."""
        
        # Convert error IDs back to ValidationError objects if needed
        errors_targeted = []  # This would be populated with actual ValidationError objects
        
        return FixAttempt(
            attempt_number=attempt_number,
            timestamp=datetime.utcnow(),
            errors_targeted=errors_targeted,
            changes_made=fix_suggestion.get("fix_description", ""),
            success=False,  # Will be updated after applying the fix
            fix_reasoning=fix_suggestion.get("root_cause", ""),
            confidence_score=fix_suggestion.get("confidence", 0.5)
        )
    
    async def analyze_fix_success(self, fix_attempt: FixAttempt, 
                                new_validation_result: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze whether a fix attempt was successful."""
        
        try:
            # Compare error counts before and after
            original_error_count = len(fix_attempt.errors_targeted)
            new_error_count = len(new_validation_result.get("all_errors", []))
            
            # Determine success
            success = new_error_count < original_error_count
            
            # Calculate improvement
            improvement_percent = 0
            if original_error_count > 0:
                improvement_percent = ((original_error_count - new_error_count) / original_error_count) * 100
            
            return {
                "success": success,
                "improvement_percent": improvement_percent,
                "original_errors": original_error_count,
                "remaining_errors": new_error_count,
                "errors_fixed": max(0, original_error_count - new_error_count),
                "analysis": f"Fix attempt {'succeeded' if success else 'failed'} - {improvement_percent:.1f}% improvement"
            }
            
        except Exception as e:
            logger.error("Error analyzing fix success", error=str(e))
            return {
                "success": False,
                "improvement_percent": 0,
                "analysis": f"Error analyzing fix success: {str(e)}"
            }


# Global tool instance
analyze_error_logs_tool = AnalyzeErrorLogsTool()
