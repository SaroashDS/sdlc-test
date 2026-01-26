"""Logging configuration and utilities."""

import structlog
import logging
import sys
from typing import Any, Dict
from src.config import settings


def configure_logging():
    """Configure structured logging for the application."""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.enable_structured_logging 
            else structlog.dev.ConsoleRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper())
    )


def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a configured logger instance."""
    return structlog.get_logger(name)


class AgentLogger:
    """Specialized logger for AI agents."""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.logger = get_logger(agent_name)
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(message, agent=self.agent_name, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message."""
        self.logger.error(message, agent=self.agent_name, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(message, agent=self.agent_name, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(message, agent=self.agent_name, **kwargs)
    
    def log_agent_start(self, story_id: int, **kwargs):
        """Log agent execution start."""
        self.logger.info(
            "Agent execution started",
            agent=self.agent_name,
            story_id=story_id,
            **kwargs
        )
    
    def log_agent_complete(self, story_id: int, duration_ms: int, success: bool, **kwargs):
        """Log agent execution completion."""
        self.logger.info(
            "Agent execution completed",
            agent=self.agent_name,
            story_id=story_id,
            duration_ms=duration_ms,
            success=success,
            **kwargs
        )
    
    def log_tool_usage(self, tool_name: str, duration_ms: int, success: bool, **kwargs):
        """Log tool usage."""
        self.logger.info(
            "Tool executed",
            agent=self.agent_name,
            tool=tool_name,
            duration_ms=duration_ms,
            success=success,
            **kwargs
        )
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log error with context."""
        self.logger.error(
            "Agent error occurred",
            agent=self.agent_name,
            error=str(error),
            error_type=type(error).__name__,
            context=context or {}
        )
    
    def log_self_healing(self, iteration: int, errors_found: int, fixes_applied: int, **kwargs):
        """Log self-healing loop iteration."""
        self.logger.info(
            "Self-healing iteration completed",
            agent=self.agent_name,
            iteration=iteration,
            errors_found=errors_found,
            fixes_applied=fixes_applied,
            **kwargs
        )


# Initialize logging on import
configure_logging()