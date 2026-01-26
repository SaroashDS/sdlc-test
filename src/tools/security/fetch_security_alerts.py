"""Tool #23: Fetch Security Alerts - Retrieves security alerts from GitHub."""

from typing import Dict, Any, List
from src.integrations.client_factory import get_github_client
from src.config import settings
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class FetchSecurityAlertsTool:
    """Tool for fetching security alerts and vulnerabilities."""
    
    def __init__(self):
        self.name = "fetch_security_alerts"
        self.description = "Fetches security alerts and vulnerabilities from GitHub"
    
    async def execute(self, repository_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch security alerts from GitHub repository.
        
        Args:
            repository_info: Repository information (owner, repo)
            
        Returns:
            Dict containing security alerts and metadata
        """
        start_time = time.time()
        
        try:
            owner = repository_info["owner"]
            repo = repository_info["repo"]
            
            logger.info("Fetching security alerts", 
                       owner=owner, repo=repo)
            
            # Get Dependabot alerts
            dependabot_alerts = await get_github_client().get_dependabot_alerts(owner, repo)
            
            # Get vulnerability alerts
            vulnerability_alerts = await get_github_client().get_repository_vulnerabilities(owner, repo)
            
            # Process and categorize alerts
            processed_alerts = self._process_security_alerts(dependabot_alerts, vulnerability_alerts)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Security alerts fetched successfully", 
                       total_alerts=processed_alerts["total_alerts"],
                       critical_count=processed_alerts["severity_counts"].get("critical", 0),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "repository": repository_info,
                "security_alerts": processed_alerts,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error fetching security alerts", 
                        error=str(e), duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "duration_ms": duration_ms
            }
    
    def _process_security_alerts(self, dependabot_alerts: List[Dict], 
                               vulnerability_alerts: List[Dict]) -> Dict[str, Any]:
        """Process and categorize security alerts."""
        
        all_alerts = []
        critical_alerts = []
        high_alerts = []
        medium_alerts = []
        low_alerts = []
        
        # Process Dependabot alerts
        for alert in dependabot_alerts:
            processed = {
                "id": alert.get("number"),
                "type": "dependabot",
                "package": alert.get("dependency", {}).get("package", {}).get("name"),
                "severity": alert.get("security_advisory", {}).get("severity", "unknown").lower(),
                "summary": alert.get("security_advisory", {}).get("summary"),
                "description": alert.get("security_advisory", {}).get("description"),
                "cve_id": alert.get("security_advisory", {}).get("cve_id"),
                "created_at": alert.get("created_at"),
                "updated_at": alert.get("updated_at"),
                "state": alert.get("state"),
                "fixed_at": alert.get("fixed_at"),
                "dismissed_at": alert.get("dismissed_at"),
                "vulnerable_version_range": alert.get("security_vulnerability", {}).get("vulnerable_version_range"),
                "first_patched_version": alert.get("security_vulnerability", {}).get("first_patched_version", {}).get("identifier")
            }
            
            all_alerts.append(processed)
            
            # Categorize by severity
            severity = processed["severity"]
            if severity == "critical":
                critical_alerts.append(processed)
            elif severity == "high":
                high_alerts.append(processed)
            elif severity == "medium":
                medium_alerts.append(processed)
            else:
                low_alerts.append(processed)
        
        # Process vulnerability alerts
        for alert in vulnerability_alerts:
            processed = {
                "id": alert.get("id"),
                "type": "vulnerability",
                "package": alert.get("package", {}).get("name"),
                "severity": alert.get("severity", "unknown").lower(),
                "summary": alert.get("summary"),
                "description": alert.get("description"),
                "created_at": alert.get("created_at"),
                "updated_at": alert.get("updated_at")
            }
            
            all_alerts.append(processed)
            
            # Categorize by severity
            severity = processed["severity"]
            if severity == "critical":
                critical_alerts.append(processed)
            elif severity == "high":
                high_alerts.append(processed)
            elif severity == "medium":
                medium_alerts.append(processed)
            else:
                low_alerts.append(processed)
        
        # Create severity counts
        severity_counts = {
            "critical": len(critical_alerts),
            "high": len(high_alerts),
            "medium": len(medium_alerts),
            "low": len(low_alerts)
        }
        
        # Identify actionable alerts (open and high/critical severity)
        actionable_alerts = [
            alert for alert in all_alerts 
            if alert.get("state") != "fixed" and alert.get("severity") in ["critical", "high"]
        ]
        
        return {
            "all_alerts": all_alerts,
            "critical_alerts": critical_alerts,
            "high_alerts": high_alerts,
            "medium_alerts": medium_alerts,
            "low_alerts": low_alerts,
            "actionable_alerts": actionable_alerts,
            "total_alerts": len(all_alerts),
            "severity_counts": severity_counts,
            "actionable_count": len(actionable_alerts),
            "has_critical_issues": len(critical_alerts) > 0,
            "security_score": self._calculate_security_score(severity_counts)
        }
    
    def _calculate_security_score(self, severity_counts: Dict[str, int]) -> float:
        """Calculate security score based on alert severity."""
        
        # Start with perfect score
        score = 100.0
        
        # Deduct points based on severity
        score -= severity_counts.get("critical", 0) * 25  # 25 points per critical
        score -= severity_counts.get("high", 0) * 10     # 10 points per high
        score -= severity_counts.get("medium", 0) * 5    # 5 points per medium
        score -= severity_counts.get("low", 0) * 1       # 1 point per low
        
        return max(0.0, score)


# Global tool instance
fetch_security_alerts_tool = FetchSecurityAlertsTool()
