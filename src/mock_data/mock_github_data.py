"""Mock GitHub repository data for testing."""

# Mock GitHub Repository Analysis
mock_github_repo = {
    "success": True,
    "repository": {
        "owner": "mock-org",
        "repo": "dashboard-app",
        "full_name": "mock-org/dashboard-app",
        "default_branch": "main",
        "language": "TypeScript",
        "description": "Modern dashboard application with analytics"
    },
    "analysis": {
        "has_typescript": True,
        "has_react": True,
        "has_jest": True,
        "has_eslint": True,
        "has_prettier": True,
        "package_json": {
            "name": "dashboard-app",
            "version": "1.0.0",
            "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "@types/react": "^18.2.0",
                "typescript": "^5.0.0",
                "chart.js": "^4.0.0",
                "react-chartjs-2": "^5.0.0",
                "axios": "^1.6.0",
                "tailwindcss": "^3.3.0"
            },
            "devDependencies": {
                "@testing-library/react": "^13.4.0",
                "@testing-library/jest-dom": "^6.0.0",
                "jest": "^29.0.0",
                "eslint": "^8.50.0",
                "@typescript-eslint/eslint-plugin": "^6.0.0",
                "prettier": "^3.0.0"
            },
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build", 
                "test": "react-scripts test",
                "lint": "eslint src --ext .ts,.tsx",
                "format": "prettier --write src"
            }
        },
        "tsconfig": {
            "compilerOptions": {
                "target": "es5",
                "lib": ["dom", "dom.iterable", "es6"],
                "allowJs": True,
                "skipLibCheck": True,
                "esModuleInterop": True,
                "allowSyntheticDefaultImports": True,
                "strict": True,
                "forceConsistentCasingInFileNames": True,
                "moduleResolution": "node",
                "resolveJsonModule": True,
                "isolatedModules": True,
                "noEmit": True,
                "jsx": "react-jsx"
            },
            "include": ["src"]
        },
        "styling_approach": "tailwind",
        "src_structure": {
            "files": ["App.tsx", "index.tsx"],
            "directories": {
                "components": {
                    "files": ["Header.tsx", "Dashboard.tsx"],
                    "directories": {
                        "charts": {
                            "files": ["LineChart.tsx", "PieChart.tsx"]
                        },
                        "cards": {
                            "files": ["KPICard.tsx"]
                        }
                    }
                },
                "hooks": {
                    "files": ["useApi.ts", "useChartData.ts"]
                },
                "services": {
                    "files": ["api.ts", "analytics.ts"]
                },
                "types": {
                    "files": ["index.ts", "api.ts"]
                },
                "utils": {
                    "files": ["formatters.ts", "constants.ts"]
                }
            }
        },
        "component_patterns": [
            "Functional components with hooks",
            "TypeScript interfaces for props",
            "Custom hooks for data fetching",
            "Tailwind CSS for styling",
            "Chart.js for data visualization"
        ]
    },
    "recommendations": [
        "Continue using TypeScript for type safety",
        "Maintain current React patterns with hooks",
        "Use existing Chart.js setup for new charts",
        "Follow established component structure",
        "Maintain test coverage with Jest and Testing Library"
    ]
}

# Mock GitHub operations responses
mock_github_operations = {
    "create_branch": {
        "success": True,
        "branch_name": "feature/story-12345-user-dashboard-analytics",
        "branch_url": "https://github.com/mock-org/dashboard-app/tree/feature/story-12345-user-dashboard-analytics",
        "sha": "abc123def456"
    },
    "commit_files": {
        "success": True,
        "commit_hash": "def456abc789",
        "files_committed": 8,
        "commit_message": "feat: implement story #12345 - Create User Dashboard with Analytics"
    },
    "push_to_github": {
        "success": True,
        "commits_pushed": 1,
        "push_url": "https://github.com/mock-org/dashboard-app/tree/feature/story-12345-user-dashboard-analytics"
    },
    "create_pull_request": {
        "success": True,
        "pr_number": 42,
        "pr_url": "https://github.com/mock-org/dashboard-app/pull/42",
        "pr_title": "feat: implement story #12345 - Create User Dashboard with Analytics"
    }
}