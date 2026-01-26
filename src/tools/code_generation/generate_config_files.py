"""Tool #8: Generate Config Files - Generates configuration files (tsconfig, eslint, etc.)."""

import os
import json
from typing import Dict, Any, List, Optional
from src.integrations.client_factory import get_gemini_client
from src.config import settings
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class GenerateConfigFilesTool:
    """Tool for generating project configuration files."""
    
    def __init__(self):
        self.name = "generate_config_files"
        self.description = "Generates configuration files (tsconfig, eslint, prettier, jest, etc.)"
    
    async def execute(self, implementation_plan: Dict[str, Any], 
                     workspace_path: str,
                     repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate configuration files for the project.
        
        Args:
            implementation_plan: Implementation plan from Agent 1
            workspace_path: Workspace directory path
            repository_analysis: Repository analysis for existing configs
            
        Returns:
            Dict containing generated config files and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Generating configuration files", workspace_path=workspace_path)
            
            # Extract configuration requirements
            config_requirements = self._extract_config_requirements(
                implementation_plan, repository_analysis
            )
            
            # Generate configuration files
            generated_configs = []
            
            # Generate TypeScript config
            if config_requirements["needs_typescript"]:
                tsconfig = await self._generate_tsconfig(config_requirements, workspace_path)
                if tsconfig:
                    generated_configs.append(tsconfig)
            
            # Generate ESLint config
            if config_requirements["needs_eslint"]:
                eslint_config = await self._generate_eslint_config(config_requirements, workspace_path)
                if eslint_config:
                    generated_configs.append(eslint_config)
            
            # Generate Prettier config
            if config_requirements["needs_prettier"]:
                prettier_config = await self._generate_prettier_config(config_requirements, workspace_path)
                if prettier_config:
                    generated_configs.append(prettier_config)
            
            # Generate Jest config
            if config_requirements["needs_jest"]:
                jest_config = await self._generate_jest_config(config_requirements, workspace_path)
                if jest_config:
                    generated_configs.append(jest_config)
            
            # Generate Vite/Webpack config
            build_tool = config_requirements.get("build_tool", "vite")
            if build_tool == "vite":
                vite_config = await self._generate_vite_config(config_requirements, workspace_path)
                if vite_config:
                    generated_configs.append(vite_config)
            elif build_tool == "webpack":
                webpack_config = await self._generate_webpack_config(config_requirements, workspace_path)
                if webpack_config:
                    generated_configs.append(webpack_config)
            
            # Generate package.json
            package_json = await self._generate_package_json(config_requirements, workspace_path)
            if package_json:
                generated_configs.append(package_json)
            
            # Generate additional config files
            additional_configs = await self._generate_additional_configs(config_requirements, workspace_path)
            generated_configs.extend(additional_configs)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Configuration files generated successfully", 
                       config_files_count=len(generated_configs),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "config_files_generated": generated_configs,
                "config_requirements": config_requirements,
                "summary": self._create_config_summary(generated_configs),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error generating configuration files", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "config_files_generated": [],
                "duration_ms": duration_ms
            }
    
    def _extract_config_requirements(self, implementation_plan: Dict[str, Any],
                                   repository_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """Extract configuration requirements from implementation plan."""
        
        tech_approach = implementation_plan.get("technical_approach", {})
        quality_gates = implementation_plan.get("quality_gates", {})
        repo_analysis = repository_analysis.get("analysis", {}) if repository_analysis else {}
        
        return {
            # Basic requirements
            "needs_typescript": True,  # Always use TypeScript
            "needs_eslint": quality_gates.get("eslint_rules") is not None,
            "needs_prettier": quality_gates.get("prettier_formatting", True),
            "needs_jest": tech_approach.get("testing_approach", "").startswith("jest"),
            
            # Technical approach
            "frontend_framework": tech_approach.get("frontend_framework", "react"),
            "backend_framework": tech_approach.get("backend_framework", "nodejs"),
            "build_tool": tech_approach.get("build_tool", "vite"),
            "styling_framework": tech_approach.get("styling_framework", "css-modules"),
            "state_management": tech_approach.get("state_management", "react-hooks"),
            
            # Quality settings
            "typescript_strict": quality_gates.get("typescript_strict", True),
            "eslint_rules": quality_gates.get("eslint_rules", "@typescript-eslint/recommended"),
            "test_coverage_target": tech_approach.get("test_coverage_target", 80),
            
            # Dependencies
            "dependencies": implementation_plan.get("new_dependencies", []),
            
            # Existing configuration
            "has_existing_tsconfig": repo_analysis.get("has_typescript", False),
            "has_existing_eslint": repo_analysis.get("has_eslint", False),
            "has_existing_prettier": repo_analysis.get("has_prettier", False),
            "has_existing_jest": repo_analysis.get("has_jest", False),
            
            # Project settings
            "target_browsers": tech_approach.get("target_browsers", ["Chrome", "Firefox", "Safari", "Edge"]),
            "accessibility_level": tech_approach.get("accessibility_level", "WCAG-AA")
        }
    
    async def _generate_tsconfig(self, requirements: Dict[str, Any], 
                               workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate TypeScript configuration."""
        
        # Don't overwrite existing tsconfig unless it's a new repo
        if requirements.get("has_existing_tsconfig") and not requirements.get("is_new_repo", True):
            logger.info("Skipping tsconfig.json generation - already exists")
            return None
        
        tsconfig = {
            "compilerOptions": {
                "target": "ES2020",
                "lib": ["DOM", "DOM.Iterable", "ES6"],
                "allowJs": True,
                "skipLibCheck": True,
                "esModuleInterop": True,
                "allowSyntheticDefaultImports": True,
                "strict": requirements.get("typescript_strict", True),
                "forceConsistentCasingInFileNames": True,
                "noFallthroughCasesInSwitch": True,
                "module": "esnext",
                "moduleResolution": "node",
                "resolveJsonModule": True,
                "isolatedModules": True,
                "noEmit": True,
                "jsx": "react-jsx"
            },
            "include": [
                "src",
                "tests"
            ],
            "exclude": [
                "node_modules",
                "build",
                "dist"
            ]
        }
        
        # Add path mapping for common directories
        tsconfig["compilerOptions"]["baseUrl"] = "."
        tsconfig["compilerOptions"]["paths"] = {
            "@/*": ["src/*"],
            "@/components/*": ["src/components/*"],
            "@/hooks/*": ["src/hooks/*"],
            "@/utils/*": ["src/utils/*"],
            "@/types/*": ["src/types/*"]
        }
        
        # Adjust for build tool
        build_tool = requirements.get("build_tool", "vite")
        if build_tool == "vite":
            tsconfig["compilerOptions"]["types"] = ["vite/client"]
        
        return await self._write_config_file(
            workspace_path, "tsconfig.json", json.dumps(tsconfig, indent=2)
        )
    
    async def _generate_eslint_config(self, requirements: Dict[str, Any], 
                                    workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate ESLint configuration."""
        
        if requirements.get("has_existing_eslint") and not requirements.get("is_new_repo", True):
            logger.info("Skipping ESLint config generation - already exists")
            return None
        
        eslint_config = {
            "env": {
                "browser": True,
                "es2020": True,
                "node": True,
                "jest": True
            },
            "extends": [
                "eslint:recommended",
                "@typescript-eslint/recommended",
                "plugin:react/recommended",
                "plugin:react-hooks/recommended",
                "plugin:jsx-a11y/recommended"
            ],
            "parser": "@typescript-eslint/parser",
            "parserOptions": {
                "ecmaFeatures": {
                    "jsx": True
                },
                "ecmaVersion": 2020,
                "sourceType": "module"
            },
            "plugins": [
                "react",
                "@typescript-eslint",
                "jsx-a11y"
            ],
            "rules": {
                "react/react-in-jsx-scope": "off",
                "react/prop-types": "off",
                "@typescript-eslint/explicit-function-return-type": "off",
                "@typescript-eslint/explicit-module-boundary-types": "off",
                "@typescript-eslint/no-unused-vars": ["error", {"argsIgnorePattern": "^_"}],
                "jsx-a11y/anchor-is-valid": "off"
            },
            "settings": {
                "react": {
                    "version": "detect"
                }
            }
        }
        
        return await self._write_config_file(
            workspace_path, ".eslintrc.json", json.dumps(eslint_config, indent=2)
        )
    
    async def _generate_prettier_config(self, requirements: Dict[str, Any], 
                                      workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate Prettier configuration."""
        
        if requirements.get("has_existing_prettier") and not requirements.get("is_new_repo", True):
            logger.info("Skipping Prettier config generation - already exists")
            return None
        
        prettier_config = {
            "semi": True,
            "trailingComma": "es5",
            "singleQuote": True,
            "printWidth": 80,
            "tabWidth": 2,
            "useTabs": False,
            "bracketSpacing": True,
            "arrowParens": "avoid",
            "endOfLine": "lf"
        }
        
        return await self._write_config_file(
            workspace_path, ".prettierrc", json.dumps(prettier_config, indent=2)
        )
    
    async def _generate_jest_config(self, requirements: Dict[str, Any], 
                                  workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate Jest configuration."""
        
        if requirements.get("has_existing_jest") and not requirements.get("is_new_repo", True):
            logger.info("Skipping Jest config generation - already exists")
            return None
        
        jest_config = {
            "testEnvironment": "jsdom",
            "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
            "moduleNameMapping": {
                "^@/(.*)$": "<rootDir>/src/$1"
            },
            "transform": {
                "^.+\\.(ts|tsx)$": "ts-jest"
            },
            "testMatch": [
                "<rootDir>/src/**/__tests__/**/*.(ts|tsx)",
                "<rootDir>/src/**/*.(test|spec).(ts|tsx)",
                "<rootDir>/tests/**/*.(test|spec).(ts|tsx)"
            ],
            "collectCoverageFrom": [
                "src/**/*.(ts|tsx)",
                "!src/**/*.d.ts",
                "!src/index.tsx",
                "!src/reportWebVitals.ts"
            ],
            "coverageThreshold": {
                "global": {
                    "branches": requirements.get("test_coverage_target", 80),
                    "functions": requirements.get("test_coverage_target", 80),
                    "lines": requirements.get("test_coverage_target", 80),
                    "statements": requirements.get("test_coverage_target", 80)
                }
            },
            "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json"],
            "transformIgnorePatterns": [
                "node_modules/(?!(.*\\.mjs$))"
            ]
        }
        
        jest_config_js = f"""module.exports = {json.dumps(jest_config, indent=2)};"""
        
        return await self._write_config_file(
            workspace_path, "jest.config.js", jest_config_js
        )
    
    async def _generate_vite_config(self, requirements: Dict[str, Any], 
                                  workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate Vite configuration."""
        
        vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})"""
        
        return await self._write_config_file(
            workspace_path, "vite.config.ts", vite_config
        )
    
    async def _generate_webpack_config(self, requirements: Dict[str, Any], 
                                     workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate Webpack configuration."""
        
        # This would generate a webpack config
        # For now, we'll skip this as Vite is preferred
        return None
    
    async def _generate_package_json(self, requirements: Dict[str, Any], 
                                   workspace_path: str) -> Optional[Dict[str, Any]]:
        """Generate or update package.json."""
        
        # Check if package.json already exists
        package_json_path = os.path.join(workspace_path, "package.json")
        existing_package = {}
        
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    existing_package = json.loads(f.read())
            except Exception as e:
                logger.warning("Failed to read existing package.json", error=str(e))
        
        # Base package.json structure
        package_json = {
            "name": existing_package.get("name", "ai-generated-app"),
            "version": existing_package.get("version", "0.1.0"),
            "private": True,
            "type": "module",
            "scripts": {
                "dev": "vite",
                "build": "tsc && vite build",
                "preview": "vite preview",
                "test": "jest",
                "test:watch": "jest --watch",
                "test:coverage": "jest --coverage",
                "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
                "lint:fix": "eslint src --ext ts,tsx --fix",
                "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
                "type-check": "tsc --noEmit"
            },
            "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0"
            },
            "devDependencies": {
                "@types/react": "^18.2.43",
                "@types/react-dom": "^18.2.17",
                "@typescript-eslint/eslint-plugin": "^6.14.0",
                "@typescript-eslint/parser": "^6.14.0",
                "@vitejs/plugin-react": "^4.2.1",
                "eslint": "^8.55.0",
                "eslint-plugin-react": "^7.33.2",
                "eslint-plugin-react-hooks": "^4.6.0",
                "eslint-plugin-jsx-a11y": "^6.8.0",
                "jest": "^29.7.0",
                "@testing-library/react": "^13.4.0",
                "@testing-library/jest-dom": "^5.16.5",
                "@testing-library/user-event": "^14.5.1",
                "ts-jest": "^29.1.1",
                "typescript": "^5.2.2",
                "vite": "^5.0.8",
                "prettier": "^3.1.1"
            }
        }
        
        # Add dependencies from implementation plan
        plan_dependencies = requirements.get("dependencies", [])
        for dep in plan_dependencies:
            dep_name = dep.get("name", "")
            dep_version = dep.get("version", "latest")
            dep_type = dep.get("type", "dependencies")
            
            if dep_name:
                if dep_type == "devDependencies":
                    package_json["devDependencies"][dep_name] = dep_version
                else:
                    package_json["dependencies"][dep_name] = dep_version
        
        # Merge with existing package.json
        if existing_package:
            # Preserve existing dependencies and merge new ones
            existing_deps = existing_package.get("dependencies", {})
            existing_dev_deps = existing_package.get("devDependencies", {})
            
            package_json["dependencies"].update(existing_deps)
            package_json["devDependencies"].update(existing_dev_deps)
            
            # Preserve other fields
            for key, value in existing_package.items():
                if key not in ["dependencies", "devDependencies", "scripts"]:
                    package_json[key] = value
        
        return await self._write_config_file(
            workspace_path, "package.json", json.dumps(package_json, indent=2)
        )
    
    async def _generate_additional_configs(self, requirements: Dict[str, Any], 
                                         workspace_path: str) -> List[Dict[str, Any]]:
        """Generate additional configuration files."""
        
        additional_configs = []
        
        # Generate .gitignore
        gitignore_content = """# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary folders
tmp/
temp/

# Build tools
.cache/
.parcel-cache/"""
        
        gitignore_config = await self._write_config_file(
            workspace_path, ".gitignore", gitignore_content
        )
        if gitignore_config:
            additional_configs.append(gitignore_config)
        
        # Generate .env.example
        env_example_content = """# Environment variables for development
# Copy this file to .env and fill in your values

# API URLs
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_VERSION=v1

# Feature flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true

# Third-party services
# REACT_APP_GOOGLE_ANALYTICS_ID=
# REACT_APP_SENTRY_DSN="""
        
        env_config = await self._write_config_file(
            workspace_path, ".env.example", env_example_content
        )
        if env_config:
            additional_configs.append(env_config)
        
        # Generate README.md
        readme_content = f"""# AI Generated Application

This application was generated by the AI-SDLC Automation System.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:coverage
```

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
```

## Project Structure
```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── services/      # API services
└── assets/        # Static assets
```

## Technologies Used
- React 18
- TypeScript
- {requirements.get('build_tool', 'Vite').title()}
- Jest & React Testing Library
- ESLint & Prettier

## Generated Configuration
This project includes:
- TypeScript configuration (tsconfig.json)
- ESLint configuration (.eslintrc.json)
- Prettier configuration (.prettierrc)
- Jest configuration (jest.config.js)
- Build tool configuration
"""
        
        readme_config = await self._write_config_file(
            workspace_path, "README.md", readme_content
        )
        if readme_config:
            additional_configs.append(readme_config)
        
        return additional_configs
    
    async def _write_config_file(self, workspace_path: str, filename: str, 
                               content: str) -> Optional[Dict[str, Any]]:
        """Write configuration file to workspace."""
        
        try:
            full_path = os.path.join(workspace_path, filename)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "path": filename,
                "type": "config",
                "size_bytes": len(content.encode('utf-8')),
                "lines_count": len(content.split('\n')),
                "full_path": full_path
            }
            
        except Exception as e:
            logger.error("Failed to write config file", file=filename, error=str(e))
            return None
    
    def _create_config_summary(self, generated_configs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create summary of configuration generation."""
        
        config_types = {}
        for config in generated_configs:
            filename = config.get("path", "")
            
            if filename.endswith(".json"):
                config_type = "json"
            elif filename.endswith(".js"):
                config_type = "javascript"
            elif filename.endswith(".ts"):
                config_type = "typescript"
            elif filename.startswith("."):
                config_type = "dotfile"
            else:
                config_type = "other"
            
            if config_type not in config_types:
                config_types[config_type] = 0
            config_types[config_type] += 1
        
        return {
            "total_config_files": len(generated_configs),
            "config_types": config_types,
            "files_generated": [c.get("path", "") for c in generated_configs],
            "total_size_bytes": sum(c.get("size_bytes", 0) for c in generated_configs)
        }


# Global tool instance
generate_config_files_tool = GenerateConfigFilesTool()
