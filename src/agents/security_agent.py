"""Agent 6: Security Agent - Continuous security monitoring and vulnerability management."""

from typing import Dict, Any, Optional, List
from src.tools.security.fetch_security_alerts import fetch_security_alerts_tool
from src.tools.security.analyze_vulnerability import analyze_vulnerability_tool
# from src.tools.security.update_dependencies import update_dependencies_tool
from src.tools.github_operations.create_pull_request import create_pull_request_tool
from src.config import settings
from src.utils.logging import AgentLogger
import time
from datetime import datetime

logger = AgentLogger("SecurityAgent")


class SecurityAgent:
    """
    Agent 6: Security Agent
    
    Purpose: Continuous security monitoring and automated vulnerability management
    
    Workflow:
    1. Fetches security alerts from GitHub repository
    2. Analyzes vulnerabilities using AI for risk assessment
    3. Automatically updates dependencies for fixable vulnerabilities
    4. Creates security PRs for critical/high severity issues
    5. Provides security recommendations and monitoring
    
    Tools Used:
    - Tool #23: Fetch Security Alerts
    - Tool #24: Analyze Vulnerability
    - Tool #25: Update Dependencies (temporarily disabled)
    - Tool #18: Create Pull Request (reused)
    
    Time: 3-10 minutes per security scan
    """
    
    def __init__(self):
        self.name = "SecurityAgent"
        self.version = "1.0.0"
        self.tools = {
            "fetch_security_alerts": fetch_security_alerts_tool,
            "analyze_vulnerability": analyze_vulnerability_tool,
            # "update_dependencies": update_dependencies_tool,  # Temporarily disabled
            "create_pull_request": create_pull_request_tool
        }
        self.auto_fix_threshold = getattr(settings, 'security_auto_fix_threshold', 'high')
    
    async def execute(self, repository_info: Dict[str, Any], 
                     scan_type: str = "full") -> Dict[str, Any]:
        """
        Execute security monitoring workflow.
        
        Args:
            repository_info: Repository information (owner, repo)
            scan_type: Type of scan ("full", "critical_only", "auto_fix")
            
        Returns:
            Dict containing security scan results and actions taken
        """
        start_time = time.time()
        execution_id = f"security_{int(start_time)}"
        
        logger.log_agent_start(None, execution_id=execution_id)
        
        try:
            owner = repository_info["owner"]
            repo = repository_info["repo"]
            
            logger.info("Starting security scan", 
                       owner=owner, repo=repo, scan_type=scan_type)
            
            # Step 1: Fetch Security Alerts
            logger.info("Step 1: Fetching security alerts")
            
            alerts_result = await self._fetch_security_alerts(repository_info)
            
            if not alerts_result["success"]:
                return self._create_error_result(
                    execution_id, start_time,
                    f"Failed to fetch security alerts: {alerts_result['error']}"
                )
            
            security_alerts = alerts_result["security_alerts"]
            
            if security_alerts["total_alerts"] == 0:
                logger.info("No security alerts found")
                return {
                    "success": True,
                    "execution_id": execution_id,
                    "duration_ms": int((time.time() - start_time) * 1000),
                    "security_status": "clean",
                    "alerts_found": 0,
                    "actions_taken": []
                }
            
            # Step 2: Analyze Critical/High Vulnerabilities
            logger.info("Step 2: Analyzing vulnerabilities")
            
            analysis_results = await self._analyze_vulnerabilities(
                security_alerts["actionable_alerts"]
            )
            
            # Step 3: Auto-fix Eligible Vulnerabilities
            logger.info("Step 3: Processing auto-fix eligible vulnerabilities")
            
            auto_fix_results = await self._process_auto_fixes(
                repository_info, analysis_results
            )
            
            # Step 4: Generate Security Report
            logger.info("Step 4: Generating security report")
            
            security_report = self._generate_security_report(
                security_alerts, analysis_results, auto_fix_results
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = {
                "success": True,
                "execution_id": execution_id,
                "duration_ms": duration_ms,
                
                "security_status": self._determine_security_status(security_alerts),
                "alerts_found": security_alerts["total_alerts"],
                "critical_alerts": len(security_alerts["critical_alerts"]),
                "high_alerts": len(security_alerts["high_alerts"]),
                "security_score": security_alerts["security_score"],
                
                "analysis_results": analysis_results,
                "auto_fix_results": auto_fix_results,
                "security_report": security_report,
                
                "actions_taken": self._summarize_actions_taken(auto_fix_results),
                
                "recommendations": security_report.get("recommendations", [])
            }
            
            logger.log_agent_complete(
                None, duration_ms, True,
                alerts_found=security_alerts["total_alerts"],
                critical_count=len(security_alerts["critical_alerts"]),
                auto_fixes_applied=len(auto_fix_results.get("fixes_applied", []))
            )
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_error(e, {"execution_id": execution_id})
            
            return self._create_error_result(
                execution_id, start_time,
                f"Unexpected error in security monitoring: {str(e)}"
            )
    
    async def _fetch_security_alerts(self, repository_info: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Tool #23: Fetch Security Alerts."""
        return await self.tools["fetch_security_alerts"].execute(repository_info)
    
    async def _analyze_vulnerabilities(self, vulnerabilities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze vulnerabilities using AI."""
        
        analysis_results = []
        
        for vulnerability in vulnerabilities:
            try:
                analysis = await self.tools["analyze_vulnerability"].execute(vulnerability)
                
                if analysis["success"]:
                    analysis_results.append({
                        "vulnerability": vulnerability,
                        "analysis": analysis["analysis"],
                        "priority_score": analysis["analysis"].get("priority_score", {}),
                        "automation_recommendations": analysis["analysis"].get("automation_recommendations", {})
                    })
                else:
                    logger.warning("Failed to analyze vulnerability", 
                                 vulnerability_id=vulnerability.get("id"),
                                 error=analysis.get("error"))
                    
            except Exception as e:
                logger.error("Error analyzing vulnerability", 
                           vulnerability_id=vulnerability.get("id"),
                           error=str(e))
        
        return analysis_results
    
    async def _process_auto_fixes(self, repository_info: Dict[str, Any], 
                                analysis_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process auto-fixable vulnerabilities."""
        
        auto_fix_results = {
            "fixes_applied": [],
            "fixes_failed": [],
            "prs_created": []
        }
        
        # Group fixable vulnerabilities
        fixable_vulnerabilities = []
        
        for result in analysis_results:
            automation_rec = result.get("automation_recommendations", {})
            
            if (automation_rec.get("can_auto_fix", False) and 
                automation_rec.get("auto_fix_confidence", 0) >= 80):
                
                fixable_vulnerabilities.append({
                    "package": result["vulnerability"].get("package"),
                    "first_patched_version": result["vulnerability"].get("first_patched_version"),
                    "vulnerability_data": result["vulnerability"]
                })
        
        if fixable_vulnerabilities:
            logger.info(f"Found {len(fixable_vulnerabilities)} auto-fixable vulnerabilities")
            
            # Apply dependency updates
            update_result = await self.tools["update_dependencies"].execute(
                repository_info, fixable_vulnerabilities
            )
            
            if update_result["success"]:
                auto_fix_results["fixes_applied"] = update_result["updates_applied"]
                
                # Create security PR
                pr_result = await self._create_security_pr(
                    repository_info, update_result, fixable_vulnerabilities
                )
                
                if pr_result["success"]:
                    auto_fix_results["prs_created"].append(pr_result)
            else:
                auto_fix_results["fixes_failed"].append({
                    "error": update_result.get("error"),
                    "vulnerabilities": fixable_vulnerabilities
                })
        
        return auto_fix_results
    
    async def _create_security_pr(self, repository_info: Dict[str, Any],
                                update_result: Dict[str, Any],
                                vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a security PR for dependency updates."""
        
        try:
            pr_title = f"Security: Fix {len(vulnerabilities)} vulnerabilities"
            pr_description = self._generate_security_pr_description(update_result, vulnerabilities)
            
            return await self.tools["create_pull_request"].execute(
                repository_info,
                update_result["branch_name"],
                {"id": 0, "title": pr_title},  # Dummy story data
                {"files_generated": {"totals": {"total_files": 1}}},  # Dummy implementation
                {"overall_status": "passed", "security_fix": True}  # Security validation
            )
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_security_pr_description(self, update_result: Dict[str, Any],
                                        vulnerabilities: List[Dict[str, Any]]) -> str:
        """Generate PR description for security updates."""
        
        description = "## 🔒 Automated Security Fix\n\n"
        description += "This PR automatically fixes security vulnerabilities by updating dependencies.\n\n"
        
        description += "### Vulnerabilities Fixed\n\n"
        for vuln_data in vulnerabilities:
            vuln = vuln_data["vulnerability_data"]
            severity = vuln.get("severity", "unknown").upper()
            package = vuln.get("package", "unknown")
            summary = vuln.get("summary", "No summary available")
            
            description += f"- **{severity}**: `{package}` - {summary}\n"
        
        description += "\n### Dependencies Updated\n\n"
        for update in update_result.get("updates_applied", []):
            description += f"- `{update['package']}`: {update['old_version']} → {update['new_version']}\n"
        
        description += "\n### Security Impact\n\n"
        description += "These updates address known security vulnerabilities and improve the overall security posture of the application.\n\n"
        
        description += "---\n"
        description += "*This PR was automatically generated by the AI-SDLC Security Agent*"
        
        return description
    
    def _generate_security_report(self, security_alerts: Dict[str, Any],
                                analysis_results: List[Dict[str, Any]],
                                auto_fix_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive security report."""
        
        return {
            "scan_timestamp": datetime.utcnow().isoformat(),
            "security_score": security_alerts["security_score"],
            "alert_summary": {
                "total": security_alerts["total_alerts"],
                "critical": len(security_alerts["critical_alerts"]),
                "high": len(security_alerts["high_alerts"]),
                "medium": len(security_alerts["medium_alerts"]),
                "low": len(security_alerts["low_alerts"])
            },
            "auto_fix_summary": {
                "fixes_applied": len(auto_fix_results.get("fixes_applied", [])),
                "prs_created": len(auto_fix_results.get("prs_created", [])),
                "fixes_failed": len(auto_fix_results.get("fixes_failed", []))
            },
            "recommendations": self._generate_security_recommendations(
                security_alerts, analysis_results
            ),
            "next_scan_recommended": self._calculate_next_scan_time(security_alerts)
        }
    
    def _generate_security_recommendations(self, security_alerts: Dict[str, Any],
                                         analysis_results: List[Dict[str, Any]]) -> List[str]:
        """Generate security recommendations."""
        
        recommendations = []
        
        if security_alerts["has_critical_issues"]:
            recommendations.append("Address critical security vulnerabilities immediately")
        
        if len(security_alerts["high_alerts"]) > 0:
            recommendations.append("Review and fix high-severity vulnerabilities within 1 week")
        
        if security_alerts["security_score"] < 80:
            recommendations.append("Improve overall security score by addressing medium/low vulnerabilities")
        
        # Add specific recommendations from analysis
        for result in analysis_results:
            timeline = result.get("analysis", {}).get("timeline", {})
            if timeline.get("immediate_action"):
                recommendations.append(f"Take immediate action on {result['vulnerability']['package']}")
        
        return recommendations
    
    def _calculate_next_scan_time(self, security_alerts: Dict[str, Any]) -> str:
        """Calculate when the next security scan should run."""
        
        if security_alerts["has_critical_issues"]:
            return "24 hours"
        elif len(security_alerts["high_alerts"]) > 0:
            return "3 days"
        else:
            return "1 week"
    
    def _determine_security_status(self, security_alerts: Dict[str, Any]) -> str:
        """Determine overall security status."""
        
        if security_alerts["has_critical_issues"]:
            return "critical"
        elif len(security_alerts["high_alerts"]) > 0:
            return "high_risk"
        elif len(security_alerts["medium_alerts"]) > 0:
            return "medium_risk"
        elif security_alerts["total_alerts"] > 0:
            return "low_risk"
        else:
            return "secure"
    
    def _summarize_actions_taken(self, auto_fix_results: Dict[str, Any]) -> List[str]:
        """Summarize actions taken during security scan."""
        
        actions = []
        
        fixes_applied = auto_fix_results.get("fixes_applied", [])
        if fixes_applied:
            actions.append(f"Applied {len(fixes_applied)} dependency updates")
        
        prs_created = auto_fix_results.get("prs_created", [])
        if prs_created:
            actions.append(f"Created {len(prs_created)} security PRs")
        
        if not actions:
            actions.append("No automated fixes applied")
        
        return actions
    
    def _create_error_result(self, execution_id: str, start_time: float, 
                           error_message: str) -> Dict[str, Any]:
        """Create standardized error result."""
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.log_agent_complete(None, duration_ms, False, error=error_message)
        
        return {
            "success": False,
            "execution_id": execution_id,
            "duration_ms": duration_ms,
            "error": error_message,
            "security_status": "unknown"
        }


# Global agent instance
security_agent = SecurityAgent()