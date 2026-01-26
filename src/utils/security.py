"""Security utilities and helpers."""

import re
import hashlib
import hmac
from typing import List, Dict, Any, Optional
from src.config import settings
import structlog

logger = structlog.get_logger()


class SecurityValidator:
    """Security validation utilities."""
    
    # Common patterns for secrets
    SECRET_PATTERNS = [
        r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
        r'(?i)(secret[_-]?key|secretkey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
        r'(?i)(access[_-]?token|accesstoken)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?',
        r'(?i)(password|pwd)\s*[:=]\s*["\']?([a-zA-Z0-9_\-!@#$%^&*()]{8,})["\']?',
        r'(?i)(private[_-]?key|privatekey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-+/=]{100,})["\']?',
        r'(?i)(database[_-]?url|databaseurl)\s*[:=]\s*["\']?(.*://.*)["\']?',
        r'(?i)(connection[_-]?string|connectionstring)\s*[:=]\s*["\']?(.*)["\']?',
    ]
    
    @classmethod
    def scan_for_secrets(cls, content: str) -> List[Dict[str, Any]]:
        """Scan content for potential secrets."""
        findings = []
        
        for pattern in cls.SECRET_PATTERNS:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                findings.append({
                    "type": "potential_secret",
                    "pattern": match.group(1),
                    "value": match.group(2)[:10] + "..." if len(match.group(2)) > 10 else match.group(2),
                    "line": content[:match.start()].count('\n') + 1,
                    "severity": "high"
                })
        
        return findings
    
    @classmethod
    def validate_dependencies(cls, dependencies: List[str]) -> List[Dict[str, Any]]:
        """Validate dependencies against known vulnerabilities."""
        # This would integrate with vulnerability databases
        # For now, return empty list
        return []
    
    @classmethod
    def sanitize_logs(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize sensitive data from logs."""
        sanitized = data.copy()
        
        sensitive_keys = [
            'password', 'token', 'key', 'secret', 'credential',
            'authorization', 'auth', 'api_key', 'access_token'
        ]
        
        for key, value in sanitized.items():
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                if isinstance(value, str) and len(value) > 4:
                    sanitized[key] = value[:4] + "***"
                else:
                    sanitized[key] = "***"
        
        return sanitized


class WebhookValidator:
    """Webhook signature validation."""
    
    @staticmethod
    def validate_ado_webhook(payload: bytes, signature: str) -> bool:
        """Validate Azure DevOps webhook signature."""
        try:
            expected_signature = hmac.new(
                settings.ado_webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(f"sha256={expected_signature}", signature)
        except Exception as e:
            logger.error("ADO webhook validation failed", error=str(e))
            return False
    
    @staticmethod
    def validate_github_webhook(payload: bytes, signature: str) -> bool:
        """Validate GitHub webhook signature."""
        try:
            expected_signature = hmac.new(
                settings.github_webhook_secret.encode(),
                payload,
                hashlib.sha1
            ).hexdigest()
            
            return hmac.compare_digest(f"sha1={expected_signature}", signature)
        except Exception as e:
            logger.error("GitHub webhook validation failed", error=str(e))
            return False


class CodeSecurityScanner:
    """Security scanner for generated code."""
    
    DANGEROUS_PATTERNS = [
        r'eval\s*\(',
        r'exec\s*\(',
        r'innerHTML\s*=',
        r'dangerouslySetInnerHTML',
        r'document\.write\s*\(',
        r'window\.location\s*=',
        r'\.system\s*\(',
        r'child_process\.exec',
        r'fs\.writeFile.*\.\./.*',  # Path traversal
    ]
    
    @classmethod
    def scan_code(cls, code: str, file_path: str) -> List[Dict[str, Any]]:
        """Scan code for security issues."""
        findings = []
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            matches = re.finditer(pattern, code, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                findings.append({
                    "type": "dangerous_pattern",
                    "pattern": pattern,
                    "file": file_path,
                    "line": code[:match.start()].count('\n') + 1,
                    "severity": "high",
                    "message": f"Potentially dangerous pattern: {match.group()}"
                })
        
        # Check for secrets
        secret_findings = SecurityValidator.scan_for_secrets(code)
        for finding in secret_findings:
            finding["file"] = file_path
            findings.append(finding)
        
        return findings
    
    @classmethod
    def scan_for_secrets(cls, content: str) -> List[Dict[str, Any]]:
        """Scan content for potential secrets (delegate to SecurityValidator)."""
        return SecurityValidator.scan_for_secrets(content)
    
    @classmethod
    def validate_file_paths(cls, file_paths: List[str]) -> List[str]:
        """Validate file paths for security issues."""
        issues = []
        
        for path in file_paths:
            # Check for path traversal
            if '..' in path:
                issues.append(f"Path traversal detected in: {path}")
            
            # Check for absolute paths outside project
            if path.startswith('/') and not path.startswith('/tmp/ai-sdlc-workspace'):
                issues.append(f"Absolute path outside workspace: {path}")
            
            # Check for suspicious extensions
            suspicious_extensions = ['.exe', '.bat', '.sh', '.ps1', '.cmd']
            if any(path.endswith(ext) for ext in suspicious_extensions):
                issues.append(f"Suspicious file extension: {path}")
        
        return issues


# Global instances
security_validator = SecurityValidator()
webhook_validator = WebhookValidator()
code_security_scanner = CodeSecurityScanner()