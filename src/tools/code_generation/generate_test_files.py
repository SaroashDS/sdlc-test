"""Tool #7: Generate Test Files - Uses Gemini AI to generate Jest test files."""

import os
import asyncio
from typing import Dict, Any, List, Optional
from src.integrations.client_factory import get_gemini_client
from src.config import settings
from src.utils.logging import get_logger
import time
import json

logger = get_logger(__name__)


class GenerateTestFilesTool:
    """Tool for generating Jest test files using AI."""
    
    def __init__(self):
        self.name = "generate_test_files"
        self.description = "Generates Jest test files using Gemini AI"
    
    async def execute(self, implementation_plan: Dict[str, Any], 
                     workspace_path: str,
                     generated_code_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate test files for generated code.
        
        Args:
            implementation_plan: Implementation plan from Agent 1
            workspace_path: Workspace directory path
            generated_code_files: List of generated code files to test
            
        Returns:
            Dict containing generated test files and metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Generating test files", 
                       workspace_path=workspace_path,
                       code_files_count=len(generated_code_files))
            
            # Get Gemini client
            gemini_client = get_gemini_client()
            
            # Extract test requirements from implementation plan
            test_strategy = self._extract_test_strategy(implementation_plan)
            
            # Generate test files for each code file
            generated_test_files = []
            test_generation_results = []
            
            for code_file in generated_code_files:
                try:
                    test_result = await self._generate_test_for_file(
                        code_file, workspace_path, test_strategy
                    )
                    
                    if test_result["success"]:
                        generated_test_files.append(test_result["test_file"])
                    
                    test_generation_results.append(test_result)
                    
                except Exception as e:
                    logger.error("Error generating test for file", 
                               file=code_file.get("path", "unknown"),
                               error=str(e))
                    test_generation_results.append({
                        "success": False,
                        "file": code_file.get("path", "unknown"),
                        "error": str(e)
                    })
            
            # Generate additional test files (integration, e2e, etc.)
            additional_tests = await self._generate_additional_tests(
                implementation_plan, workspace_path, test_strategy
            )
            
            generated_test_files.extend(additional_tests)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Test files generated successfully", 
                       test_files_count=len(generated_test_files),
                       duration_ms=duration_ms)
            
            return {
                "success": True,
                "test_files_generated": generated_test_files,
                "generation_results": test_generation_results,
                "test_strategy": test_strategy,
                "summary": self._create_test_summary(generated_test_files, test_generation_results),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error generating test files", 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "test_files_generated": [],
                "duration_ms": duration_ms
            }
    
    def _extract_test_strategy(self, implementation_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Extract testing strategy from implementation plan."""
        
        tech_approach = implementation_plan.get("technical_approach", {})
        quality_gates = implementation_plan.get("quality_gates", {})
        
        return {
            "testing_approach": tech_approach.get("testing_approach", "jest-rtl"),
            "test_coverage_target": tech_approach.get("test_coverage_target", 80),
            "unit_tests": quality_gates.get("unit_test_coverage", 80) > 0,
            "integration_tests": quality_gates.get("integration_tests", True),
            "e2e_tests": quality_gates.get("e2e_tests", False),
            "accessibility_testing": quality_gates.get("screen_reader_support", True),
            "test_framework": tech_approach.get("testing_approach", "jest-rtl"),
            "mocking_strategy": "jest",
            "snapshot_testing": True
        }
    
    async def _generate_test_for_file(self, code_file: Dict[str, Any], 
                                    workspace_path: str,
                                    test_strategy: Dict[str, Any]) -> Dict[str, Any]:
        """Generate test file for a specific code file."""
        
        file_path = code_file.get("path", "")
        file_type = code_file.get("type", "")
        
        try:
            # Read the source code
            source_code = await self._read_source_code(workspace_path, file_path)
            
            if not source_code:
                return {
                    "success": False,
                    "file": file_path,
                    "error": "Could not read source code"
                }
            
            # Generate test file path
            test_file_path = self._generate_test_file_path(file_path, file_type)
            
            # Generate test code based on file type
            if file_type == "component":
                test_code = await self._generate_component_test(
                    source_code, file_path, test_strategy
                )
            elif file_type == "hook":
                test_code = await self._generate_hook_test(
                    source_code, file_path, test_strategy
                )
            elif file_type == "util":
                test_code = await self._generate_util_test(
                    source_code, file_path, test_strategy
                )
            elif file_type == "service":
                test_code = await self._generate_service_test(
                    source_code, file_path, test_strategy
                )
            else:
                test_code = await self._generate_generic_test(
                    source_code, file_path, test_strategy
                )
            
            if not test_code:
                return {
                    "success": False,
                    "file": file_path,
                    "error": "AI failed to generate test code"
                }
            
            # Write test file
            full_test_path = os.path.join(workspace_path, test_file_path)
            os.makedirs(os.path.dirname(full_test_path), exist_ok=True)
            
            with open(full_test_path, 'w', encoding='utf-8') as f:
                f.write(test_code)
            
            return {
                "success": True,
                "file": file_path,
                "test_file": {
                    "path": test_file_path,
                    "type": "test",
                    "source_file": file_path,
                    "size_bytes": len(test_code.encode('utf-8')),
                    "lines_count": len(test_code.split('\n')),
                    "full_path": full_test_path
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "file": file_path,
                "error": str(e)
            }
    
    async def _read_source_code(self, workspace_path: str, file_path: str) -> Optional[str]:
        """Read source code from file."""
        
        try:
            full_path = os.path.join(workspace_path, file_path)
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error("Failed to read source code", file=file_path, error=str(e))
            return None
    
    def _generate_test_file_path(self, source_file_path: str, file_type: str) -> str:
        """Generate test file path for source file."""
        
        # Get directory and filename
        directory = os.path.dirname(source_file_path)
        filename = os.path.basename(source_file_path)
        name, ext = os.path.splitext(filename)
        
        # Different test file naming strategies
        if file_type == "component":
            # Components: src/components/Button.tsx -> src/components/__tests__/Button.test.tsx
            test_dir = os.path.join(directory, "__tests__")
            test_filename = f"{name}.test{ext}"
        elif file_type == "hook":
            # Hooks: src/hooks/useAuth.ts -> src/hooks/__tests__/useAuth.test.ts
            test_dir = os.path.join(directory, "__tests__")
            test_filename = f"{name}.test{ext}"
        elif file_type == "util":
            # Utils: src/utils/helpers.ts -> src/utils/__tests__/helpers.test.ts
            test_dir = os.path.join(directory, "__tests__")
            test_filename = f"{name}.test{ext}"
        else:
            # Generic: place in __tests__ subdirectory
            test_dir = os.path.join(directory, "__tests__")
            test_filename = f"{name}.test{ext}"
        
        return os.path.join(test_dir, test_filename)
    
    async def _generate_component_test(self, source_code: str, file_path: str, 
                                     test_strategy: Dict[str, Any]) -> Optional[str]:
        """Generate React component test."""
        
        component_name = os.path.splitext(os.path.basename(file_path))[0]
        
        return await get_gemini_client().generate_test_file(source_code, component_name)
    
    async def _generate_hook_test(self, source_code: str, file_path: str,
                                test_strategy: Dict[str, Any]) -> Optional[str]:
        """Generate React hook test."""
        
        hook_name = os.path.splitext(os.path.basename(file_path))[0]
        
        prompt = f"""
        Generate comprehensive Jest tests for this React hook using @testing-library/react-hooks.
        
        Hook Code:
        ```typescript
        {source_code}
        ```
        
        Hook Name: {hook_name}
        
        Generate tests that:
        1. Test the hook's initial state
        2. Test all hook functions/methods
        3. Test different input scenarios
        4. Test error conditions
        5. Test cleanup if applicable
        6. Use proper mocking for dependencies
        7. Include edge cases
        8. Follow React Testing Library best practices
        
        Test Strategy: {json.dumps(test_strategy, indent=2)}
        
        Return only the test code, no explanations.
        """
        
        return await get_gemini_client()._generate_content_async(prompt)
    
    async def _generate_util_test(self, source_code: str, file_path: str,
                                test_strategy: Dict[str, Any]) -> Optional[str]:
        """Generate utility function test."""
        
        util_name = os.path.splitext(os.path.basename(file_path))[0]
        
        prompt = f"""
        Generate comprehensive Jest tests for these utility functions.
        
        Utility Code:
        ```typescript
        {source_code}
        ```
        
        Utility Name: {util_name}
        
        Generate tests that:
        1. Test all exported functions
        2. Test different input types and values
        3. Test edge cases and boundary conditions
        4. Test error handling
        5. Test return values and side effects
        6. Use proper assertions
        7. Include performance tests if applicable
        8. Mock external dependencies
        
        Test Strategy: {json.dumps(test_strategy, indent=2)}
        
        Return only the test code, no explanations.
        """
        
        return await get_gemini_client()._generate_content_async(prompt)
    
    async def _generate_service_test(self, source_code: str, file_path: str,
                                   test_strategy: Dict[str, Any]) -> Optional[str]:
        """Generate service/API test."""
        
        service_name = os.path.splitext(os.path.basename(file_path))[0]
        
        prompt = f"""
        Generate comprehensive Jest tests for this service/API module.
        
        Service Code:
        ```typescript
        {source_code}
        ```
        
        Service Name: {service_name}
        
        Generate tests that:
        1. Test all service methods
        2. Mock HTTP requests/responses
        3. Test success and error scenarios
        4. Test request parameters and headers
        5. Test response parsing
        6. Test error handling and retries
        7. Test authentication if applicable
        8. Use proper mocking (jest.mock, MSW, etc.)
        
        Test Strategy: {json.dumps(test_strategy, indent=2)}
        
        Return only the test code, no explanations.
        """
        
        return await get_gemini_client()._generate_content_async(prompt)
    
    async def _generate_generic_test(self, source_code: str, file_path: str,
                                   test_strategy: Dict[str, Any]) -> Optional[str]:
        """Generate generic test file."""
        
        file_name = os.path.splitext(os.path.basename(file_path))[0]
        
        prompt = f"""
        Generate comprehensive Jest tests for this TypeScript module.
        
        Source Code:
        ```typescript
        {source_code}
        ```
        
        File Name: {file_name}
        
        Generate tests that:
        1. Test all exported functions/classes
        2. Test different scenarios and inputs
        3. Test error conditions
        4. Use appropriate mocking
        5. Follow Jest best practices
        6. Include proper setup and teardown
        
        Test Strategy: {json.dumps(test_strategy, indent=2)}
        
        Return only the test code, no explanations.
        """
        
        return await get_gemini_client()._generate_content_async(prompt)
    
    async def _generate_additional_tests(self, implementation_plan: Dict[str, Any],
                                       workspace_path: str,
                                       test_strategy: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate additional test files (integration, setup, etc.)."""
        
        additional_tests = []
        
        try:
            # Generate test setup file
            setup_test = await self._generate_test_setup(workspace_path, test_strategy)
            if setup_test:
                additional_tests.append(setup_test)
            
            # Generate integration tests if required
            if test_strategy.get("integration_tests", False):
                integration_tests = await self._generate_integration_tests(
                    implementation_plan, workspace_path, test_strategy
                )
                additional_tests.extend(integration_tests)
            
            # Generate test utilities
            test_utils = await self._generate_test_utilities(workspace_path, test_strategy)
            if test_utils:
                additional_tests.append(test_utils)
                
        except Exception as e:
            logger.error("Error generating additional tests", error=str(e))
        
        return additional_tests
    
    async def _generate_test_setup(self, workspace_path: str, 
                                 test_strategy: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generate test setup file."""
        
        prompt = f"""
        Generate a Jest test setup file for a React TypeScript project.
        
        Requirements:
        1. Configure React Testing Library
        2. Set up global test utilities
        3. Configure mocks for common modules
        4. Set up test environment
        5. Add custom matchers if needed
        6. Configure cleanup
        
        Test Strategy: {json.dumps(test_strategy, indent=2)}
        
        Return only the setup code, no explanations.
        """
        
        try:
            setup_code = await get_gemini_client()._generate_content_async(prompt)
            
            if setup_code:
                setup_path = "tests/setup.ts"
                full_path = os.path.join(workspace_path, setup_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(setup_code)
                
                return {
                    "path": setup_path,
                    "type": "test-setup",
                    "size_bytes": len(setup_code.encode('utf-8')),
                    "lines_count": len(setup_code.split('\n')),
                    "full_path": full_path
                }
        except Exception as e:
            logger.error("Error generating test setup", error=str(e))
        
        return None
    
    async def _generate_integration_tests(self, implementation_plan: Dict[str, Any],
                                        workspace_path: str,
                                        test_strategy: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate integration test files."""
        
        integration_tests = []
        
        # This would generate integration tests based on the implementation plan
        # For now, return empty list
        
        return integration_tests
    
    async def _generate_test_utilities(self, workspace_path: str,
                                     test_strategy: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generate test utility functions."""
        
        prompt = f"""
        Generate test utility functions for a React TypeScript project.
        
        Include utilities for:
        1. Rendering components with providers
        2. Creating mock data
        3. Common test helpers
        4. Custom render functions
        5. Mock factories
        6. Test data generators
        
        Test Strategy: {json.dumps(test_strategy, indent=2)}
        
        Return only the utility code, no explanations.
        """
        
        try:
            utils_code = await get_gemini_client()._generate_content_async(prompt)
            
            if utils_code:
                utils_path = "tests/utils.ts"
                full_path = os.path.join(workspace_path, utils_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(utils_code)
                
                return {
                    "path": utils_path,
                    "type": "test-utils",
                    "size_bytes": len(utils_code.encode('utf-8')),
                    "lines_count": len(utils_code.split('\n')),
                    "full_path": full_path
                }
        except Exception as e:
            logger.error("Error generating test utilities", error=str(e))
        
        return None
    
    def _create_test_summary(self, generated_test_files: List[Dict[str, Any]], 
                           generation_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create summary of test generation."""
        
        total_test_lines = sum(f.get("lines_count", 0) for f in generated_test_files)
        total_test_size = sum(f.get("size_bytes", 0) for f in generated_test_files)
        
        successful_generations = len([r for r in generation_results if r.get("success", False)])
        failed_generations = len([r for r in generation_results if not r.get("success", True)])
        
        test_types = {}
        for test_file in generated_test_files:
            test_type = test_file.get("type", "test")
            if test_type not in test_types:
                test_types[test_type] = 0
            test_types[test_type] += 1
        
        return {
            "total_test_files_generated": len(generated_test_files),
            "total_test_lines": total_test_lines,
            "total_test_size_bytes": total_test_size,
            "test_types": test_types,
            "successful_generations": successful_generations,
            "failed_generations": failed_generations,
            "success_rate": (successful_generations / len(generation_results)) * 100 if generation_results else 100,
            "estimated_coverage": "80%"  # This would be calculated based on generated tests
        }


# Global tool instance
generate_test_files_tool = GenerateTestFilesTool()
