"""Configuration management for AI-SDLC Automation System."""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Google Cloud Platform
    gcp_project_id: Optional[str] = Field(default=None, env="GCP_PROJECT_ID")
    gcp_region: str = Field(default="us-central1", env="GCP_REGION")
    vertex_ai_location: str = Field(default="us-central1", env="VERTEX_AI_LOCATION")
    
    # Google Gemini AI
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.0-flash", env="GEMINI_MODEL")
    gemini_max_tokens: int = Field(default=8192, env="GEMINI_MAX_TOKENS")
    gemini_temperature: float = Field(default=0.2, env="GEMINI_TEMPERATURE")
    
    # Azure DevOps
    ado_organization: str = Field(default="mock-org", env="ADO_ORGANIZATION")
    ado_project: str = Field(default="mock-project", env="ADO_PROJECT")
    ado_base_url: str = Field(default="https://dev.azure.com", env="ADO_BASE_URL")
    ado_api_version: str = Field(default="7.0", env="ADO_API_VERSION")
    ado_webhook_secret: str = Field(default="mock-webhook-secret", env="ADO_WEBHOOK_SECRET")
    
    # Figma
    figma_base_url: str = Field(default="https://api.figma.com/v1", env="FIGMA_BASE_URL")
    figma_token: Optional[str] = Field(default=None, env="FIGMA_TOKEN")
    figma_design_url: Optional[str] = Field(default=None, env="FIGMA_DESIGN_URL")
    
    # GitHub
    github_base_url: str = Field(default="https://api.github.com", env="GITHUB_BASE_URL")
    github_app_id: str = Field(default="mock-app-id", env="GITHUB_APP_ID")
    github_installation_id: str = Field(default="mock-installation-id", env="GITHUB_INSTALLATION_ID")
    github_webhook_secret: str = Field(default="mock-webhook-secret", env="GITHUB_WEBHOOK_SECRET")
    github_token: Optional[str] = Field(default=None, env="GITHUB_TOKEN")
    github_repo_url: Optional[str] = Field(default=None, env="GITHUB_REPO_URL")
    
    # Cloud Services
    cloud_run_service_url: str = Field(default="https://mock-service.run.app", env="CLOUD_RUN_SERVICE_URL")
    pubsub_topic_ado_events: str = Field(default="ado-story-events", env="PUBSUB_TOPIC_ADO_EVENTS")
    pubsub_topic_github_events: str = Field(default="github-pr-events", env="PUBSUB_TOPIC_GITHUB_EVENTS")
    pubsub_topic_security_alerts: str = Field(default="security-alerts", env="PUBSUB_TOPIC_SECURITY_ALERTS")
    cloud_storage_bucket: str = Field(default="mock-storage-bucket", env="CLOUD_STORAGE_BUCKET")
    
    # Secret Manager References
    ado_pat_secret: str = Field(default="mock-ado-pat-secret", env="ADO_PAT_SECRET")
    figma_token_secret: str = Field(default="mock-figma-token-secret", env="FIGMA_TOKEN_SECRET")
    github_app_key_secret: str = Field(default="mock-github-app-key-secret", env="GITHUB_APP_KEY_SECRET")
    
    # Agent Configuration
    max_retry_attempts: int = Field(default=5, env="MAX_RETRY_ATTEMPTS")
    agent_timeout_minutes: int = Field(default=30, env="AGENT_TIMEOUT_MINUTES")
    self_healing_max_attempts: int = Field(default=5, env="SELF_HEALING_MAX_ATTEMPTS")
    feedback_loop_max_cycles: int = Field(default=10, env="FEEDBACK_LOOP_MAX_CYCLES")
    
    # Code Generation
    target_language: str = Field(default="typescript", env="TARGET_LANGUAGE")
    frontend_framework: str = Field(default="react", env="FRONTEND_FRAMEWORK")
    backend_framework: str = Field(default="nodejs", env="BACKEND_FRAMEWORK")
    test_framework: str = Field(default="jest", env="TEST_FRAMEWORK")
    package_manager: str = Field(default="npm", env="PACKAGE_MANAGER")
    
    # Validation
    typescript_strict_mode: bool = Field(default=True, env="TYPESCRIPT_STRICT_MODE")
    eslint_config: str = Field(default="@typescript-eslint/recommended", env="ESLINT_CONFIG")
    prettier_config: str = Field(default="standard", env="PRETTIER_CONFIG")
    code_coverage_threshold: int = Field(default=80, env="CODE_COVERAGE_THRESHOLD")
    
    # Security
    security_scan_enabled: bool = Field(default=True, env="SECURITY_SCAN_ENABLED")
    vulnerability_check_interval: int = Field(default=3600, env="VULNERABILITY_CHECK_INTERVAL")
    security_alert_webhook: Optional[str] = Field(default=None, env="SECURITY_ALERT_WEBHOOK")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    enable_structured_logging: bool = Field(default=True, env="ENABLE_STRUCTURED_LOGGING")
    
    # Environment
    environment: str = Field(default="production", env="ENVIRONMENT")
    debug_mode: bool = Field(default=False, env="DEBUG_MODE")
    
    # Granular Mock Controls (for hybrid mode: mock ADO but real Figma/GitHub)
    mock_ado: Optional[bool] = Field(default=None, env="MOCK_ADO")
    mock_figma: Optional[bool] = Field(default=None, env="MOCK_FIGMA")
    mock_github: Optional[bool] = Field(default=None, env="MOCK_GITHUB")
    mock_mode: bool = Field(default=False, env="MOCK_MODE")
    temp_workspace_path: str = Field(default="/tmp/ai-sdlc-workspace", env="TEMP_WORKSPACE_PATH")
    
    # Feature Flags
    enable_auto_merge: bool = Field(default=False, env="ENABLE_AUTO_MERGE")
    enable_security_auto_fix: bool = Field(default=True, env="ENABLE_SECURITY_AUTO_FIX")
    enable_feedback_loop: bool = Field(default=True, env="ENABLE_FEEDBACK_LOOP")
    enable_self_healing: bool = Field(default=True, env="ENABLE_SELF_HEALING")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()