"""Validation Result data models."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ValidationStatus(str, Enum):
    """Validation status types."""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    SKIPPED = "skipped"


class ErrorSeverity(str, Enum):
    """Error severity levels."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationError(BaseModel):
    """Individual validation error or warning."""
    
    file_path: str
    line: Optional[int] = None
    column: Optional[int] = None
    rule: str
    message: str
    severity: ErrorSeverity
    source: str  # "typescript", "eslint", "prettier", "jest", "security"
    
    # Fix suggestion
    suggested_fix: Optional[str] = None
    auto_fixable: bool = False


class TestResult(BaseModel):
    """Individual test result."""
    
    test_name: str
    file_path: str
    status: ValidationStatus
    duration_ms: int
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None


class CoverageResult(BaseModel):
    """Code coverage results."""
    
    file_path: str
    lines_covered: int
    lines_total: int
    functions_covered: int
    functions_total: int
    branches_covered: int
    branches_total: int
    
    @property
    def line_coverage_percent(self) -> float:
        """Calculate line coverage percentage."""
        if self.lines_total == 0:
            return 100.0
        return (self.lines_covered / self.lines_total) * 100
    
    @property
    def function_coverage_percent(self) -> float:
        """Calculate function coverage percentage."""
        if self.functions_total == 0:
            return 100.0
        return (self.functions_covered / self.functions_total) * 100
    
    @property
    def branch_coverage_percent(self) -> float:
        """Calculate branch coverage percentage."""
        if self.branches_total == 0:
            return 100.0
        return (self.branches_covered / self.branches_total) * 100


class StaticAnalysisResult(BaseModel):
    """Static analysis results."""
    
    tool: str  # "typescript", "eslint", "prettier"
    status: ValidationStatus
    errors: List[ValidationError] = Field(default_factory=list)
    warnings: List[ValidationError] = Field(default_factory=list)
    duration_ms: int
    
    @property
    def error_count(self) -> int:
        """Get total error count."""
        return len(self.errors)
    
    @property
    def warning_count(self) -> int:
        """Get total warning count."""
        return len(self.warnings)
    
    @property
    def is_passing(self) -> bool:
        """Check if analysis is passing (no errors)."""
        return self.status == ValidationStatus.PASSED and self.error_count == 0


class TestSuiteResult(BaseModel):
    """Test suite execution results."""
    
    status: ValidationStatus
    tests_passed: int
    tests_failed: int
    tests_skipped: int
    duration_ms: int
    
    # Individual test results
    test_results: List[TestResult] = Field(default_factory=list)
    
    # Coverage results
    coverage: List[CoverageResult] = Field(default_factory=list)
    
    @property
    def total_tests(self) -> int:
        """Get total test count."""
        return self.tests_passed + self.tests_failed + self.tests_skipped
    
    @property
    def pass_rate(self) -> float:
        """Calculate test pass rate."""
        if self.total_tests == 0:
            return 100.0
        return (self.tests_passed / self.total_tests) * 100
    
    @property
    def overall_coverage_percent(self) -> float:
        """Calculate overall line coverage percentage."""
        if not self.coverage:
            return 0.0
        
        total_lines = sum(c.lines_total for c in self.coverage)
        covered_lines = sum(c.lines_covered for c in self.coverage)
        
        if total_lines == 0:
            return 100.0
        return (covered_lines / total_lines) * 100


class SecurityScanResult(BaseModel):
    """Security scan results."""
    
    tool: str  # "npm-audit", "snyk", "semgrep"
    status: ValidationStatus
    vulnerabilities: List[Dict[str, Any]] = Field(default_factory=list)
    duration_ms: int
    
    # Vulnerability counts by severity
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    
    @property
    def total_vulnerabilities(self) -> int:
        """Get total vulnerability count."""
        return self.critical_count + self.high_count + self.medium_count + self.low_count
    
    @property
    def has_critical_vulnerabilities(self) -> bool:
        """Check if there are critical vulnerabilities."""
        return self.critical_count > 0


class ValidationResult(BaseModel):
    """Complete validation results for generated code."""
    
    # Metadata
    validation_id: str
    story_id: int
    timestamp: datetime
    duration_ms: int
    
    # Overall status
    overall_status: ValidationStatus
    
    # Static analysis results
    typescript_result: Optional[StaticAnalysisResult] = None
    eslint_result: Optional[StaticAnalysisResult] = None
    prettier_result: Optional[StaticAnalysisResult] = None
    
    # Test results
    test_result: Optional[TestSuiteResult] = None
    
    # Security scan results
    security_result: Optional[SecurityScanResult] = None
    
    # Environment setup
    environment_setup_success: bool = True
    environment_setup_errors: List[str] = Field(default_factory=list)
    
    # Files validated
    files_validated: List[str] = Field(default_factory=list)
    
    # Self-healing attempts
    self_healing_attempts: int = 0
    self_healing_successful: bool = False
    self_healing_changes: List[str] = Field(default_factory=list)
    
    @property
    def is_passing(self) -> bool:
        """Check if overall validation is passing."""
        return self.overall_status == ValidationStatus.PASSED
    
    @property
    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return (
            (self.typescript_result and not self.typescript_result.is_passing) or
            (self.eslint_result and not self.eslint_result.is_passing) or
            (self.test_result and self.test_result.status == ValidationStatus.FAILED) or
            (self.security_result and self.security_result.has_critical_vulnerabilities)
        )
    
    @property
    def all_errors(self) -> List[ValidationError]:
        """Get all errors from all validation tools."""
        errors = []
        
        if self.typescript_result:
            errors.extend(self.typescript_result.errors)
        
        if self.eslint_result:
            errors.extend(self.eslint_result.errors)
        
        if self.prettier_result:
            errors.extend(self.prettier_result.errors)
        
        return errors
    
    @property
    def auto_fixable_errors(self) -> List[ValidationError]:
        """Get errors that can be automatically fixed."""
        return [error for error in self.all_errors if error.auto_fixable]
    
    def get_summary(self) -> Dict[str, Any]:
        """Get validation summary."""
        return {
            "status": self.overall_status,
            "duration_ms": self.duration_ms,
            "files_validated": len(self.files_validated),
            "typescript_errors": self.typescript_result.error_count if self.typescript_result else 0,
            "eslint_errors": self.eslint_result.error_count if self.eslint_result else 0,
            "prettier_errors": self.prettier_result.error_count if self.prettier_result else 0,
            "tests_passed": self.test_result.tests_passed if self.test_result else 0,
            "tests_failed": self.test_result.tests_failed if self.test_result else 0,
            "test_coverage": self.test_result.overall_coverage_percent if self.test_result else 0,
            "security_vulnerabilities": self.security_result.total_vulnerabilities if self.security_result else 0,
            "self_healing_attempts": self.self_healing_attempts,
            "self_healing_successful": self.self_healing_successful
        }


class FixAttempt(BaseModel):
    """Record of a self-healing fix attempt."""
    
    attempt_number: int
    timestamp: datetime
    errors_targeted: List[ValidationError]
    changes_made: List[str]
    success: bool
    validation_result: Optional[ValidationResult] = None
    
    # AI reasoning
    fix_reasoning: str
    confidence_score: float  # 0.0 to 1.0