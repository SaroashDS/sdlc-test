"""Tool #9: Generate Environment Files - Generates .env files and environment configuration."""

import os
from typing import Dict, Any, List, Optional
from src.config import settings
from src.utils.logging import get_logger
from src.utils.security import code_security_scanner
import time

logger = get_logger(__name__)


class GenerateEnvironmentFilesTool:
    """Tool for generating environment files and configuration."""
    
    def __init__(self):
        self.name = "generate_environment_files"
        self.description = "Generates environment files (.env.example, environment configs)"
    
    async def execute(self, implementation_plan: Dict[str, Any], 
                     workspace_path: str,
                     repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate environment files for the project.
        
        Args:
            implementation_plan: Implementation plan from Agent 1
            workspace_path: Workspace directory path
            repository_analysis: Repository analysis for existing patterns
            
        Returns:
            Dict containing generated environment files and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Generating environment files", workspace_path=workspace_path)
            
            # Extract environment requirements
            env_requirements = self._extract_environment_requirements(
                implementation_plan, repository_analysis
            )
            
            # Generate environment files
            generated_env_files = []
            
            # Generate .env.example
            env_example = await self._generate_env_example(env_requirements, workspace_path)
            if env_example:
                generated_env_files.append(env_example)
            
            # Generate .env.development
            env_dev = await self._generate_env_development(env_requirements, workspace_path)
            if env_dev:
                generated_env_files.append(env_dev)
            
            # Generate .env.production (template)
            env_prod = await self._generate_env_production(env_requirements, workspace_path)
            if env_prod:
                generated_env_files.append(env_prod)
            
            # Generate environment configuration files
            env_configs = await self._generate_environment_configs(env_requirements, workspace_path)
            generated_env_files.extend(env_configs)
            
            # Security scan environment files
            security_issues = await self._scan_environment_files(workspace_path, generated_env_files)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Environment files generated successfully", 
                       env_files_count=len(generated_env_files),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "environment_files_generated": generated_env_files,
                "environment_requirements": env_requirements,
                "security_scan": security_issues,
                "summary": self._create_environment_summary(generated_env_files),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error generating environment files", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "environment_files_generated": [],
                "duration_ms": duration_ms
            }
    
    def _extract_environment_requirements(self, implementation_plan: Dict[str, Any],
                                        repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Extract environment requirements from implementation plan."""
        
        tech_approach = implementation_plan.get("technical_approach", {})
        dependencies = implementation_plan.get("new_dependencies", [])
        
        # Analyze dependencies for environment variables
        env_vars = {
            "api_urls": [],
            "feature_flags": [],
            "third_party_services": [],
            "database_configs": [],
            "auth_configs": [],
            "build_configs": []
        }
        
        # Extract environment variables from dependencies
        for dep in dependencies:
            dep_name = dep.get("name", "").lower()
            
            # API and HTTP clients
            if any(api_lib in dep_name for api_lib in ["axios", "fetch", "apollo", "graphql"]):
                env_vars["api_urls"].extend([
                    "REACT_APP_API_URL",
                    "REACT_APP_API_VERSION",
                    "REACT_APP_API_TIMEOUT"
                ])
            
            # Authentication libraries
            if any(auth_lib in dep_name for auth_lib in ["auth0", "firebase", "supabase", "clerk"]):
                env_vars["auth_configs"].extend([
                    f"REACT_APP_{dep_name.upper()}_CLIENT_ID",
                    f"REACT_APP_{dep_name.upper()}_DOMAIN"
                ])
            
            # Analytics and monitoring
            if any(analytics_lib in dep_name for analytics_lib in ["analytics", "sentry", "mixpanel"]):
                env_vars["third_party_services"].extend([
                    f"REACT_APP_{dep_name.upper()}_KEY",
                    f"REACT_APP_{dep_name.upper()}_PROJECT_ID"
                ])
            
            # Database libraries
            if any(db_lib in dep_name for db_lib in ["prisma", "mongoose", "sequelize"]):
                env_vars["database_configs"].extend([
                    "DATABASE_URL",
                    "DATABASE_NAME"
                ])
        
        # Add common React environment variables
        env_vars["build_configs"].extend([
            "NODE_ENV",
            "REACT_APP_VERSION",
            "GENERATE_SOURCEMAP",
            "REACT_APP_BUILD_DATE"
        ])
        
        # Add feature flags based on implementation
        story_title = implementation_plan.get("story_title", "").lower()
        if "login" in story_title or "auth" in story_title:
            env_vars["feature_flags"].append("REACT_APP_ENABLE_AUTH")
        if "analytics" in story_title or "tracking" in story_title:
            env_vars["feature_flags"].append("REACT_APP_ENABLE_ANALYTICS")
        if "payment" in story_title or "checkout" in story_title:
            env_vars["feature_flags"].append("REACT_APP_ENABLE_PAYMENTS")
        
        # Add default feature flags
        env_vars["feature_flags"].extend([
            "REACT_APP_ENABLE_DEBUG",
            "REACT_APP_ENABLE_MOCK_API",
            "REACT_APP_ENABLE_DEVTOOLS"
        ])
        
        return {
            "environment_variables": env_vars,
            "deployment_target": tech_approach.get("deployment_target", "static"),
            "build_tool": tech_approach.get("build_tool", "vite"),
            "frontend_framework": tech_approach.get("frontend_framework", "react"),
            "has_backend": tech_approach.get("backend_framework") is not None,
            "environments": ["development", "staging", "production"]
        }
    
    async def _generate_env_example(self, requirements: Dict[str, Any], 
                                  workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate .env.example file."""
        
        env_vars = requirements.get("environment_variables", {})
        
        content_sections = []
        
        # Header
        content_sections.append("# Environment Variables")
        content_sections.append("# Copy this file to .env and fill in your actual values")
        content_sections.append("")
        
        # Build configuration
        if env_vars.get("build_configs"):
            content_sections.append("# Build Configuration")
            content_sections.append("NODE_ENV=development")
            content_sections.append("REACT_APP_VERSION=0.1.0")
            content_sections.append("GENERATE_SOURCEMAP=true")
            content_sections.append("REACT_APP_BUILD_DATE=2024-01-01")
            content_sections.append("")
        
        # API URLs
        if env_vars.get("api_urls"):
            content_sections.append("# API Configuration")
            content_sections.append("REACT_APP_API_URL=http://localhost:3001")
            content_sections.append("REACT_APP_API_VERSION=v1")
            content_sections.append("REACT_APP_API_TIMEOUT=10000")
            content_sections.append("")
        
        # Feature flags
        if env_vars.get("feature_flags"):
            content_sections.append("# Feature Flags")
            for flag in env_vars["feature_flags"]:
                default_value = "false"
                if "DEBUG" in flag or "DEVTOOLS" in flag:
                    default_value = "true"
                content_sections.append(f"{flag}={default_value}")
            content_sections.append("")
        
        # Authentication
        if env_vars.get("auth_configs"):
            content_sections.append("# Authentication")
            for auth_var in env_vars["auth_configs"]:
                content_sections.append(f"{auth_var}=your-{auth_var.lower().replace('_', '-')}")
            content_sections.append("")
        
        # Third-party services
        if env_vars.get("third_party_services"):
            content_sections.append("# Third-party Services")
            content_sections.append("# Uncomment and fill in as needed")
            for service_var in env_vars["third_party_services"]:
                content_sections.append(f"# {service_var}=your-{service_var.lower().replace('_', '-')}")
            content_sections.append("")
        
        # Database (if backend)
        if env_vars.get("database_configs") and requirements.get("has_backend"):
            content_sections.append("# Database Configuration")
            content_sections.append("# DATABASE_URL=postgresql://user:password@localhost:5432/dbname")
            content_sections.append("# DATABASE_NAME=your_database")
            content_sections.append("")
        
        # Development tools
        content_sections.append("# Development Tools")
        content_sections.append("REACT_APP_ENABLE_MOCK_API=true")
        content_sections.append("REACT_APP_MOCK_DELAY=500")
        content_sections.append("")
        
        # Security note
        content_sections.append("# Security Note:")
        content_sections.append("# Never commit actual .env files to version control")
        content_sections.append("# Only commit .env.example with placeholder values")
        
        content = "\n".join(content_sections)
        
        return await self._write_env_file(workspace_path, ".env.example", content)
    
    async def _generate_env_development(self, requirements: Dict[str, Any], 
                                      workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate .env.development file."""
        
        content_sections = []
        
        # Header
        content_sections.append("# Development Environment Variables")
        content_sections.append("# This file is loaded automatically in development mode")
        content_sections.append("")
        
        # Development-specific settings
        content_sections.append("# Development Configuration")
        content_sections.append("NODE_ENV=development")
        content_sections.append("REACT_APP_ENABLE_DEBUG=true")
        content_sections.append("REACT_APP_ENABLE_DEVTOOLS=true")
        content_sections.append("REACT_APP_ENABLE_MOCK_API=true")
        content_sections.append("GENERATE_SOURCEMAP=true")
        content_sections.append("")
        
        # Local API
        content_sections.append("# Local API")
        content_sections.append("REACT_APP_API_URL=http://localhost:3001")
        content_sections.append("REACT_APP_API_VERSION=v1")
        content_sections.append("")
        
        # Development tools
        content_sections.append("# Development Tools")
        content_sections.append("REACT_APP_MOCK_DELAY=300")
        content_sections.append("REACT_APP_LOG_LEVEL=debug")
        
        content = "\n".join(content_sections)
        
        return await self._write_env_file(workspace_path, ".env.development", content)
    
    async def _generate_env_production(self, requirements: Dict[str, Any], 
                                     workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate .env.production template file."""
        
        content_sections = []
        
        # Header
        content_sections.append("# Production Environment Variables Template")
        content_sections.append("# Copy this file to .env.production and fill in production values")
        content_sections.append("# DO NOT commit this file with real production values")
        content_sections.append("")
        
        # Production settings
        content_sections.append("# Production Configuration")
        content_sections.append("NODE_ENV=production")
        content_sections.append("REACT_APP_ENABLE_DEBUG=false")
        content_sections.append("REACT_APP_ENABLE_DEVTOOLS=false")
        content_sections.append("REACT_APP_ENABLE_MOCK_API=false")
        content_sections.append("GENERATE_SOURCEMAP=false")
        content_sections.append("")
        
        # Production API
        content_sections.append("# Production API")
        content_sections.append("REACT_APP_API_URL=https://your-production-api.com")
        content_sections.append("REACT_APP_API_VERSION=v1")
        content_sections.append("")
        
        # Production services
        content_sections.append("# Production Services")
        content_sections.append("# REACT_APP_SENTRY_DSN=your-sentry-dsn")
        content_sections.append("# REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id")
        content_sections.append("")
        
        # Security reminder
        content_sections.append("# SECURITY REMINDER:")
        content_sections.append("# - Use environment variables in your deployment platform")
        content_sections.append("# - Never hardcode secrets in your code")
        content_sections.append("# - Rotate keys regularly")
        
        content = "\n".join(content_sections)
        
        return await self._write_env_file(workspace_path, ".env.production.template", content)
    
    async def _generate_environment_configs(self, requirements: Dict[str, Any], 
                                          workspace_path: str) -> List[Dict[str, Any]]:
        """Generate environment configuration files."""
        
        config_files = []
        
        # Generate environment configuration module
        env_config_ts = await self._generate_env_config_module(requirements, workspace_path)
        if env_config_ts:
            config_files.append(env_config_ts)
        
        # Generate environment validation
        env_validation = await self._generate_env_validation(requirements, workspace_path)
        if env_validation:
            config_files.append(env_validation)
        
        return config_files
    
    async def _generate_env_config_module(self, requirements: Dict[str, Any], 
                                        workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate TypeScript environment configuration module."""
        
        env_vars = requirements.get("environment_variables", {})
        
        content = """/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

interface EnvironmentConfig {
  // Build configuration
  nodeEnv: string;
  version: string;
  buildDate: string;
  
  // API configuration
  apiUrl: string;
  apiVersion: string;
  apiTimeout: number;
  
  // Feature flags
  enableDebug: boolean;
  enableMockApi: boolean;
  enableDevtools: boolean;
  enableAnalytics: boolean;
  
  // Development
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

const config: EnvironmentConfig = {
  // Build configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  version: process.env.REACT_APP_VERSION || '0.1.0',
  buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  
  // API configuration
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  apiVersion: process.env.REACT_APP_API_VERSION || 'v1',
  apiTimeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  
  // Feature flags
  enableDebug: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  enableMockApi: process.env.REACT_APP_ENABLE_MOCK_API === 'true',
  enableDevtools: process.env.REACT_APP_ENABLE_DEVTOOLS === 'true',
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  
  // Environment checks
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validation
if (!config.apiUrl) {
  throw new Error('REACT_APP_API_URL is required');
}

// Log configuration in development
if (config.isDevelopment) {
  console.log('Environment Configuration:', {
    nodeEnv: config.nodeEnv,
    apiUrl: config.apiUrl,
    enableDebug: config.enableDebug,
    enableMockApi: config.enableMockApi,
  });
}

export default config;
export type { EnvironmentConfig };
"""
        
        return await self._write_env_file(workspace_path, "src/config/environment.ts", content)
    
    async def _generate_env_validation(self, requirements: Dict[str, Any], 
                                     workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate environment validation utility."""
        
        content = """/**
 * Environment Validation Utility
 * Validates required environment variables at startup
 */

interface ValidationRule {
  key: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
  defaultValue?: string;
  description: string;
}

const validationRules: ValidationRule[] = [
  {
    key: 'REACT_APP_API_URL',
    required: true,
    type: 'string',
    description: 'Base URL for the API server',
  },
  {
    key: 'REACT_APP_API_VERSION',
    required: false,
    type: 'string',
    defaultValue: 'v1',
    description: 'API version to use',
  },
  {
    key: 'REACT_APP_ENABLE_DEBUG',
    required: false,
    type: 'boolean',
    defaultValue: 'false',
    description: 'Enable debug mode',
  },
  {
    key: 'REACT_APP_ENABLE_MOCK_API',
    required: false,
    type: 'boolean',
    defaultValue: 'false',
    description: 'Use mock API instead of real API',
  },
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const rule of validationRules) {
    const value = process.env[rule.key];
    
    // Check required variables
    if (rule.required && !value) {
      errors.push(`Missing required environment variable: ${rule.key} - ${rule.description}`);
      continue;
    }
    
    // Type validation
    if (value) {
      switch (rule.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${rule.key} must be a number, got: ${value}`);
          }
          break;
        case 'boolean':
          if (!['true', 'false'].includes(value.toLowerCase())) {
            warnings.push(`${rule.key} should be 'true' or 'false', got: ${value}`);
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${rule.key} must be a string`);
          }
          break;
      }
    }
    
    // Check for default values
    if (!value && rule.defaultValue) {
      warnings.push(`Using default value for ${rule.key}: ${rule.defaultValue}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  
  if (result.isValid) {
    console.log('✅ Environment validation passed');
  } else {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

// Auto-validate in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentStatus();
}
"""
        
        return await self._write_env_file(workspace_path, "src/utils/validateEnvironment.ts", content)
    
    async def _write_env_file(self, workspace_path: str, filename: str, 
                            content: str) -> Optional[Dict[str, Any]]:
        """Write environment file to workspace."""
        
        try:
            full_path = os.path.join(workspace_path, filename)
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "path": filename,
                "type": "environment",
                "size_bytes": len(content.encode('utf-8')),
                "lines_count": len(content.split('\n')),
                "full_path": full_path
            }
            
        except Exception as e:
            logger.error("Failed to write environment file", file=filename, error=str(e))
            return None
    
    async def _scan_environment_files(self, workspace_path: str, 
                                    env_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Scan environment files for security issues."""
        
        security_issues = []
        
        for file_info in env_files:
            file_path = file_info["path"]
            full_path = file_info["full_path"]
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for potential secrets in environment files
                issues = code_security_scanner.scan_for_secrets(content)
                
                # Filter out expected placeholder values
                filtered_issues = []
                for issue in issues:
                    value = issue.get("value", "")
                    if not any(placeholder in value.lower() for placeholder in 
                             ["your-", "placeholder", "example", "localhost", "development"]):
                        filtered_issues.append(issue)
                
                if filtered_issues:
                    security_issues.extend(filtered_issues)
                    
            except Exception as e:
                logger.warning("Failed to scan environment file for security issues", 
                             file=file_path, error=str(e))
        
        return security_issues
    
    def _create_environment_summary(self, env_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create summary of environment file generation."""
        
        file_types = {}
        for env_file in env_files:
            filename = env_file.get("path", "")
            
            if filename.startswith(".env"):
                file_type = "env_file"
            elif filename.endswith(".ts"):
                file_type = "config_module"
            else:
                file_type = "other"
            
            if file_type not in file_types:
                file_types[file_type] = 0
            file_types[file_type] += 1
        
        return {
            "total_environment_files": len(env_files),
            "file_types": file_types,
            "files_generated": [f.get("path", "") for f in env_files],
            "total_size_bytes": sum(f.get("size_bytes", 0) for f in env_files),
            "security_recommendations": [
                "Never commit .env files with real secrets",
                "Use environment variables in deployment platforms",
                "Rotate API keys and secrets regularly",
                "Validate environment variables at startup"
            ]
        }


# Global tool instance
generate_environment_files_tool = GenerateEnvironmentFilesTool()