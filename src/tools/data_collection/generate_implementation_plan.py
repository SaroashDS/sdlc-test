"""Tool #4: Generate Implementation Plan - Uses Gemini AI to create detailed implementation plan."""

from typing import Dict, Any, List
from src.integrations.client_factory import get_gemini_client
from src.models.implementation_plan import ImplementationPlan, TechnicalApproach, QualityGates, RepositoryAnalysis
from src.utils.logging import get_logger
import time
import json

logger = get_logger(__name__)


class GenerateImplementationPlanTool:
    """Tool for generating detailed implementation plans using AI."""
    
    def __init__(self):
        self.name = "generate_implementation_plan"
        self.description = "Generates comprehensive implementation plan using Gemini AI"
    
    async def execute(self, story_data: Dict[str, Any], 
                     figma_data: Dict[str, Any], 
                     repo_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate implementation plan using AI analysis.
        
        Args:
            story_data: ADO story data from Tool #1
            figma_data: Figma design data from Tool #2
            repo_analysis: Repository analysis from Tool #3
            
        Returns:
            Dict containing implementation plan and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Generating implementation plan", 
                       story_id=story_data.get("id"),
                       figma_file=figma_data.get("file_key"))
            
            # Get Gemini client and generate plan using Gemini AI
            gemini_client = get_gemini_client()
            plan_json = await gemini_client.generate_implementation_plan(
                story_data, figma_data, repo_analysis
            )
            
            if not plan_json:
                logger.warning("AI failed to generate plan, using fallback")
                # Use a fallback implementation plan
                plan_json = self._get_fallback_implementation_plan(story_data)
            
            # Parse and validate the plan
            try:
                if not plan_json or plan_json.strip() == "":
                    logger.error("AI returned empty response, using fallback")
                    plan_json = self._get_fallback_implementation_plan(story_data)
                
                logger.debug("AI response received", response_length=len(plan_json), first_100_chars=plan_json[:100])
                plan_dict = json.loads(plan_json)
                plan = self._create_implementation_plan(plan_dict, story_data, figma_data, repo_analysis)
            except (json.JSONDecodeError, ValueError) as e:
                logger.error("Failed to parse or validate AI-generated plan, using fallback", error=str(e), response=plan_json[:500] if plan_json else "None")
                # Use fallback plan
                fallback_json = self._get_fallback_implementation_plan(story_data)
                try:
                    plan_dict = json.loads(fallback_json)
                    plan = self._create_implementation_plan(plan_dict, story_data, figma_data, repo_analysis)
                except Exception as fallback_error:
                    logger.error("Fallback plan also failed", error=str(fallback_error))
                    return {
                        "success": False,
                        "error": f"Both AI and fallback plans failed: {str(e)}",
                        "plan": None,
                        "duration_ms": int((time.time() - start_time) * 1000)
                    }
            
            # Validate and enhance the plan
            validation_result = self._validate_and_enhance_plan(plan)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Implementation plan generated successfully", 
                       story_id=story_data.get("id"),
                       tasks_count=len(plan.tasks),
                       estimated_minutes=plan.total_estimated_minutes,
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "plan": plan.dict(),
                "validation": validation_result,
                "ai_reasoning": self._extract_ai_reasoning(plan_json),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error generating implementation plan", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "plan": None,
                "duration_ms": duration_ms
            }
    
    def _create_implementation_plan(self, plan_dict: Dict[str, Any], 
                                  story_data: Dict[str, Any],
                                  figma_data: Dict[str, Any], 
                                  repo_analysis: Dict[str, Any]) -> ImplementationPlan:
        """Create ImplementationPlan object from AI-generated data."""
        
        # Extract repository analysis
        repo_analysis_obj = RepositoryAnalysis(**repo_analysis.get("analysis", {}))
        
        # Create technical approach
        tech_approach_data = plan_dict.get("technical_approach", {})
        technical_approach = TechnicalApproach(
            architecture_pattern=tech_approach_data.get("architecture_pattern", "component-based"),
            state_management=tech_approach_data.get("state_management", "react-hooks"),
            routing=tech_approach_data.get("routing", "react-router"),
            styling_framework=tech_approach_data.get("styling_framework", "css-modules"),
            ui_library=tech_approach_data.get("ui_library"),
            testing_approach=tech_approach_data.get("testing_approach", "jest-rtl"),
            test_coverage_target=tech_approach_data.get("test_coverage_target", 80),
            folder_structure=tech_approach_data.get("folder_structure", "feature-based"),
            naming_convention=tech_approach_data.get("naming_convention", "camelCase"),
            code_splitting=tech_approach_data.get("code_splitting", True),
            lazy_loading=tech_approach_data.get("lazy_loading", True),
            memoization_strategy=tech_approach_data.get("memoization_strategy", "react-memo"),
            accessibility_level=tech_approach_data.get("accessibility_level", "WCAG-AA"),
            target_browsers=tech_approach_data.get("target_browsers", ["Chrome", "Firefox", "Safari", "Edge"]),
            build_tool=tech_approach_data.get("build_tool", "vite"),
            deployment_target=tech_approach_data.get("deployment_target", "static")
        )
        
        # Create quality gates
        quality_data = plan_dict.get("quality_gates", {})
        quality_gates = QualityGates(
            typescript_strict=quality_data.get("typescript_strict", True),
            eslint_rules=quality_data.get("eslint_rules", "@typescript-eslint/recommended"),
            prettier_formatting=quality_data.get("prettier_formatting", True),
            unit_test_coverage=quality_data.get("unit_test_coverage", 80),
            integration_tests=quality_data.get("integration_tests", True),
            e2e_tests=quality_data.get("e2e_tests", False),
            bundle_size_limit_kb=quality_data.get("bundle_size_limit_kb", 500),
            lighthouse_performance_score=quality_data.get("lighthouse_performance_score", 90),
            axe_violations=quality_data.get("axe_violations", 0),
            keyboard_navigation=quality_data.get("keyboard_navigation", True),
            screen_reader_support=quality_data.get("screen_reader_support", True),
            no_hardcoded_secrets=quality_data.get("no_hardcoded_secrets", True),
            dependency_vulnerability_scan=quality_data.get("dependency_vulnerability_scan", True),
            cross_browser_testing=quality_data.get("cross_browser_testing", True)
        )
        
        # Parse tasks, dependencies, etc. from plan_dict
        tasks = self._parse_tasks(plan_dict.get("tasks", []))
        dependencies = self._parse_dependencies(plan_dict.get("new_dependencies", []))
        
        # Calculate total estimated time
        total_minutes = sum(task.estimated_minutes for task in tasks)
        
        return ImplementationPlan(
            story_id=story_data.get("id"),
            story_title=story_data.get("title", ""),
            figma_file_key=figma_data.get("file_key", ""),
            github_repo_url=repo_analysis.get("repository_info", {}).get("owner", "") + "/" + 
                           repo_analysis.get("repository_info", {}).get("repo", ""),
            repository_analysis=repo_analysis_obj,
            technical_approach=technical_approach,
            quality_gates=quality_gates,
            tasks=tasks,
            new_dependencies=dependencies,
            total_estimated_minutes=total_minutes,
            risks=plan_dict.get("risks", []),
            assumptions=plan_dict.get("assumptions", []),
            success_criteria=plan_dict.get("success_criteria", []),
            artifacts_to_generate=plan_dict.get("artifacts_to_generate", [])
        )
    
    def _parse_tasks(self, tasks_data: list) -> list:
        """Parse tasks from AI-generated data."""
        from src.models.implementation_plan import ImplementationTask, TaskType, Priority, FileToCreate, FileType
        
        tasks = []
        
        for task_data in tasks_data:
            # Parse files to create
            files_to_create = []
            for file_data in task_data.get("files_to_create", []):
                file_obj = FileToCreate(
                    path=file_data.get("path", ""),
                    type=FileType(file_data.get("type", "component")),
                    description=file_data.get("description", ""),
                    dependencies=file_data.get("dependencies", []),
                    priority=Priority(file_data.get("priority", "medium")),
                    template=file_data.get("template"),
                    base_component=file_data.get("base_component"),
                    figma_component_id=file_data.get("figma_component_id"),
                    figma_component_name=file_data.get("figma_component_name"),
                    props=file_data.get("props", []),
                    interfaces=file_data.get("interfaces", []),
                    styling_approach=file_data.get("styling_approach", "css-modules"),
                    test_requirements=file_data.get("test_requirements", [])
                )
                files_to_create.append(file_obj)
            
            task = ImplementationTask(
                id=task_data.get("id", f"task_{len(tasks) + 1}"),
                type=TaskType(task_data.get("type", "create_component")),
                title=task_data.get("title", ""),
                description=task_data.get("description", ""),
                priority=Priority(task_data.get("priority", "medium")),
                files_to_create=files_to_create,
                files_to_modify=task_data.get("files_to_modify", []),
                depends_on=task_data.get("depends_on", []),
                acceptance_criteria=task_data.get("acceptance_criteria", []),
                estimated_minutes=task_data.get("estimated_minutes", 30),
                technical_notes=task_data.get("technical_notes", [])
            )
            tasks.append(task)
        
        return tasks
    
    def _parse_dependencies(self, deps_data: list) -> list:
        """Parse dependencies from AI-generated data."""
        from src.models.implementation_plan import Dependency
        
        dependencies = []
        
        for dep_data in deps_data:
            dep = Dependency(
                name=dep_data.get("name", ""),
                version=dep_data.get("version", "latest"),
                type=dep_data.get("type", "dependencies"),
                reason=dep_data.get("reason", "Required for implementation")
            )
            dependencies.append(dep)
        
        return dependencies
    
    def _validate_and_enhance_plan(self, plan: ImplementationPlan) -> Dict[str, Any]:
        """Validate and enhance the implementation plan."""
        
        validation = {
            "is_valid": True,
            "issues": [],
            "warnings": [],
            "enhancements": []
        }
        
        # 1. Foundation Check (Enterprise Step)
        # Check if core entry-point files exist in repo analysis
        has_index = any(f == 'index.html' for f in plan.repository_analysis.src_structure.keys()) or 'index.html' in plan.repository_analysis.src_structure
        # Flatten structure keys for easier search
        flat_files = self._flatten_structure(plan.repository_analysis.src_structure)
        has_app = any('App.tsx' in f or 'App.jsx' in f for f in flat_files)
        has_main = any('main.tsx' in f or 'index.tsx' in f for f in flat_files)
        has_package = 'package.json' in plan.repository_analysis.src_structure or any(f == 'package.json' for f in plan.repository_analysis.src_structure.keys())

        if plan.repository_analysis.is_new_repository or not (has_index and has_app and has_main):
            logger.info("Core project scaffold missing. Injecting foundation tasks.")
            self._inject_scaffolding_tasks(plan, has_index, has_app, has_main, has_package)
            validation["enhancements"].append("Added project scaffolding tasks to ensure runnability.")

        # Validate tasks
        if not plan.tasks:
            validation["issues"].append("No implementation tasks defined")
            validation["is_valid"] = False
        
        # Check for circular dependencies
        task_deps = {task.id: task.depends_on for task in plan.tasks}
        if self._has_circular_dependencies(task_deps):
            validation["issues"].append("Circular dependencies detected in tasks")
            validation["is_valid"] = False
        
        # Validate file paths
        all_files = []
        for task in plan.tasks:
            all_files.extend([f.path for f in task.files_to_create])
        
        duplicate_files = [f for f in set(all_files) if all_files.count(f) > 1]
        if duplicate_files:
            validation["warnings"].append(f"Duplicate file paths detected: {duplicate_files}")
        
        # Check for missing test files
        component_files = [f for f in all_files if f.endswith('.tsx') or f.endswith('.jsx')]
        test_files = [f for f in all_files if 'test' in f or 'spec' in f]
        
        if len(component_files) > len(test_files):
            validation["warnings"].append("Some components may be missing test files")
        
        # Validate dependencies
        if not plan.new_dependencies and not plan.repository_analysis.is_new_repository:
            validation["warnings"].append("No new dependencies specified - may need additional packages")
        
        # Check estimated time
        if plan.total_estimated_minutes > 480:  # 8 hours
            validation["warnings"].append("Implementation estimated to take more than 8 hours - consider breaking down")
        
        # Suggest enhancements
        if not any(task.type.value == "create_story" for task in plan.tasks):
            validation["enhancements"].append("Consider adding Storybook stories for components")
        
        if plan.technical_approach.accessibility_level == "WCAG-AA":
            validation["enhancements"].append("Excellent accessibility target - ensure proper testing")
        
        return validation

    def _flatten_structure(self, structure: Dict[str, Any], prefix: str = "") -> List[str]:
        """Flatten nested directory structure into a list of file paths."""
        paths = []
        for name, content in structure.items():
            current_path = f"{prefix}/{name}" if prefix else name
            if isinstance(content, dict):
                paths.extend(self._flatten_structure(content, current_path))
            else:
                paths.append(current_path)
        return paths

    def _inject_scaffolding_tasks(self, plan: ImplementationPlan, has_index: bool, has_app: bool, has_main: bool, has_package: bool):
        """Inject tasks to create missing project entry points."""
        from src.models.implementation_plan import ImplementationTask, TaskType, Priority, FileToCreate, FileType
        
        scaffold_task = ImplementationTask(
            id="task_scaffolding",
            type=TaskType.UPDATE_CONFIG,
            title="Project Scaffolding & Entry Points",
            description="Initialize core project files to ensure the application is runnable.",
            priority=Priority.HIGH,
            files_to_create=[],
            technical_notes=["Required for Vite/React runnability"]
        )
        
        if not has_package:
            scaffold_task.files_to_create.append(FileToCreate(
                path="package.json", type=FileType.CONFIG, 
                description="Core NPM configuration with Vite and React dependencies"
            ))
            
        if not has_index:
            scaffold_task.files_to_create.append(FileToCreate(
                path="index.html", type=FileType.CONFIG, 
                description="Main entry point for the browser"
            ))
            
        if not has_main:
            scaffold_task.files_to_create.append(FileToCreate(
                path="src/main.tsx", type=FileType.TYPE, 
                description="React DOM hydration entry point"
            ))
            
        if not has_app:
            scaffold_task.files_to_create.append(FileToCreate(
                path="src/App.tsx", type=FileType.COMPONENT, 
                description="Main application component with routing"
            ))

        # Add to the beginning of tasks
        if scaffold_task.files_to_create:
            plan.tasks.insert(0, scaffold_task)
            # Update other tasks to depend on scaffolding if they are high priority UI tasks
            for i in range(1, len(plan.tasks)):
                if plan.tasks[i].type in [TaskType.CREATE_PAGE, TaskType.CREATE_COMPONENT]:
                    plan.tasks[i].depends_on.append(scaffold_task.id)
    
    def _has_circular_dependencies(self, dependencies: Dict[str, list]) -> bool:
        """Check for circular dependencies in tasks."""
        
        def has_cycle(node, visited, rec_stack):
            visited[node] = True
            rec_stack[node] = True
            
            for neighbor in dependencies.get(node, []):
                if neighbor in dependencies:  # Only check if neighbor is a valid task
                    if not visited.get(neighbor, False):
                        if has_cycle(neighbor, visited, rec_stack):
                            return True
                    elif rec_stack.get(neighbor, False):
                        return True
            
            rec_stack[node] = False
            return False
        
        visited = {}
        rec_stack = {}
        
        for node in dependencies:
            if not visited.get(node, False):
                if has_cycle(node, visited, rec_stack):
                    return True
        
        return False
    
    def _extract_ai_reasoning(self, plan_json: str) -> Dict[str, Any]:
        """Extract AI reasoning and confidence from the generated plan."""
        
        # This would analyze the AI response for reasoning patterns
        # For now, return basic metrics
        
        return {
            "plan_length": len(plan_json),
            "complexity_score": min(10, len(plan_json) // 1000),  # Simple complexity metric
            "confidence_indicators": {
                "has_detailed_tasks": "tasks" in plan_json and len(plan_json.split("tasks")) > 2,
                "has_technical_approach": "technical_approach" in plan_json,
                "has_risk_assessment": "risks" in plan_json,
            }
        }
    
    def _get_fallback_implementation_plan(self, story_data: Dict[str, Any]) -> str:
        """Get a fallback implementation plan when AI fails."""
        
        story_title = story_data.get("fields", {}).get("System.Title", "Dashboard Implementation")
        
        fallback_plan = {
            "project_name": "Dashboard Analytics",
            "description": f"Implementation plan for: {story_title}",
            "technical_approach": {
                "framework": "react",
                "language": "typescript", 
                "styling": "css-modules",
                "testing": "jest"
            },
            "dependencies": [
                "react-chartjs-2",
                "chart.js",
                "@types/chart.js"
            ],
            "tasks": [
                {
                    "id": "task_1",
                    "title": "Setup project structure",
                    "description": "Create basic component and type files",
                    "priority": "high",
                    "estimated_minutes": 30,
                    "files_to_create": [
                        {
                            "path": "src/types/analytics.ts", 
                            "type": "type",
                            "description": "TypeScript types for analytics data"
                        }
                    ]
                },
                {
                    "id": "task_2",
                    "title": "Implement Dashboard component",
                    "description": "Create main dashboard layout and structure",
                    "priority": "high", 
                    "estimated_minutes": 90,
                    "files_to_create": [
                        {
                            "path": "src/components/Dashboard.tsx",
                            "type": "component",
                            "description": "Main dashboard component with layout"
                        }
                    ]
                },
                {
                    "id": "task_3",
                    "title": "Create KPI cards",
                    "description": "Build reusable KPI card components",
                    "priority": "high",
                    "estimated_minutes": 60,
                    "files_to_create": [
                        {
                            "path": "src/components/KPICard.tsx",
                            "type": "component", 
                            "description": "Reusable KPI display card"
                        }
                    ]
                },
                {
                    "id": "task_4",
                    "title": "Add chart functionality",
                    "description": "Integrate Chart.js for data visualization",
                    "priority": "medium",
                    "estimated_minutes": 120,
                    "files_to_create": [
                        {
                            "path": "src/components/Chart.tsx",
                            "type": "component",
                            "description": "Chart component for data visualization"
                        }
                    ]
                },
                {
                    "id": "task_5",
                    "title": "Implement data hooks",
                    "description": "Create custom hooks for data fetching",
                    "priority": "medium",
                    "estimated_minutes": 45,
                    "files_to_create": [
                        {
                            "path": "src/hooks/useAnalytics.ts",
                            "type": "hook",
                            "description": "Custom hook for analytics data"
                        }
                    ]
                }
            ],
            "total_estimated_minutes": 345
        }
        
        return json.dumps(fallback_plan, indent=2)


# Global tool instance
generate_implementation_plan_tool = GenerateImplementationPlanTool()