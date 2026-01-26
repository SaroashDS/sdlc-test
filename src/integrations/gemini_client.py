"""Google Gemini AI client for code generation and analysis."""

import vertexai
from vertexai.generative_models import GenerativeModel, Part, FinishReason
import vertexai.preview.generative_models as generative_models
from typing import List, Optional, Dict, Any, Union
from src.config import settings
from src.utils.logging import get_logger
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
import warnings
import os

# Use the new google.genai package instead of deprecated google.generativeai
try:
    import google.genai as genai
    HAS_NEW_GENAI = True
except ImportError:
    # Fallback to old package if new one not available
    import google.generativeai as genai
    HAS_NEW_GENAI = False
    warnings.filterwarnings("ignore", message="All support for the `google.generativeai` package has ended")

logger = get_logger(__name__)


class GeminiClient:
    """Client for Google Gemini AI via Vertex AI or API Key."""
    
    def __init__(self):
        self.model_name = settings.gemini_model
        self.max_tokens = settings.gemini_max_tokens
        self.temperature = settings.gemini_temperature
        
        # Thread pool for async operations
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Choose authentication method
        if settings.gemini_api_key:
            # Use API Key authentication
            logger.info("Using Gemini API Key authentication")
            
            if HAS_NEW_GENAI:
                # Use new google.genai package
                # Store client as instance variable to prevent garbage collection
                self._genai_client = genai.Client(api_key=settings.gemini_api_key)
                self.model = self._genai_client.models.generate_content
                self.use_api_key = True
                self.use_new_genai = True

            else:
                # Use old google.generativeai package
                genai.configure(api_key=settings.gemini_api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self.use_api_key = True
                self.use_new_genai = False
            
            # Generation config for API key method
            self.generation_config = {
                "max_output_tokens": self.max_tokens,
                "temperature": self.temperature,
                "top_p": 1
            }
        else:
            # Use Vertex AI with Application Default Credentials
            if not settings.gcp_project_id:
                logger.error("Neither GEMINI_API_KEY nor GCP_PROJECT_ID provided. Gemini initialization will fail.")
                raise ValueError("Missing required Gemini configuration (API Key or GCP Project ID)")
                
            logger.info("Using Vertex AI with Application Default Credentials", project=settings.gcp_project_id)
            vertexai.init(
                project=settings.gcp_project_id,
                location=settings.vertex_ai_location
            )
            self.use_api_key = False
            self.use_new_genai = False
            self.model = GenerativeModel(self.model_name)
            
            # Generation config for Vertex AI
            self.generation_config = {
                "max_output_tokens": self.max_tokens,
                "temperature": self.temperature,
                "top_p": 1
            }
            
            # Safety settings for Vertex AI
            self.safety_settings = {
                generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
    
    async def generate_implementation_plan(self, story_data: Dict[str, Any], 
                                         figma_data: Dict[str, Any], 
                                         repo_analysis: Dict[str, Any]) -> Optional[str]:
        """Generate implementation plan from story, design, and repository analysis."""
        
        # Extract key information for a focused prompt
        story_title = story_data.get("fields", {}).get("System.Title", "Unknown Story")
        story_description = story_data.get("fields", {}).get("System.Description", "")
        
        # High-fidelity prompt focusing on design-first development
        prompt = f"""Create a detailed, high-fidelity implementation plan for this React TypeScript project based on the provided story and design analysis.
        
        Project Goal: {story_title}
        Requirement Details: {story_description}
        
        INSTRUCTION:
        1. If the design analysis indicates a Sidebar or Topbar, ensure you include dedicated Layout components.
        2. Group components logically (e.g., Layout items, Chart wrappers, UI Atoms).
        3. Use CSS Modules for all styling.
        4. Ensure the plan includes a main Page/Dashboard component that aggregates everything.
        
        IMPORTANT: Use only these file types: "component", "page", "hook", "util", "service", "type", "test", "config", "style"
        
        Return ONLY valid JSON in this exact format:
        {{
          "project_name": "Premium Analytics Dashboard",
          "description": "High-fidelity React dashboard with Sidebar, Topbar, and responsive Grid",
          "technical_approach": {{
            "framework": "react",
            "language": "typescript",
            "styling": "css-modules",
            "layout_strategy": "CSS Grid + Flexbox"
          }},
          "dependencies": [
            "react-chartjs-2",
            "chart.js",
            "react-router-dom",
            "react-helmet"
          ],
          "tasks": [
            {{
              "id": "task_layout",
              "title": "Build Master Layout System",
              "description": "Implement Sidebar, Navbar and Main Content area containers",
              "priority": "high",
              "estimated_minutes": 120,
              "files_to_create": [
                {{ "path": "src/components/layout/Sidebar.tsx", "type": "component", "description": "Navigation sidebar" }},
                {{ "path": "src/components/layout/Navbar.tsx", "type": "component", "description": "Top utility bar" }},
                {{ "path": "src/components/layout/DashboardShell.tsx", "type": "component", "description": "Main layout wrapper" }}
              ]
            }},
            {{
              "id": "task_components",
              "title": "Design-Aware UI Components",
              "description": "Create premium cards and charts matching the designTokens",
              "priority": "high",
              "estimated_minutes": 180,
              "files_to_create": [
                {{ "path": "src/components/ui/MetricCard.tsx", "type": "component", "description": "Glassmorphic KPI card" }},
                {{ "path": "src/components/charts/MainAnalyticsChart.tsx", "type": "component", "description": "Themed dashboard chart" }}
              ]
            }}
          ],
          "total_estimated_minutes": 300
        }}
        
        CRITICAL: Only use lowercase for types: component, page, hook, util, service, type, test, config, style.
        Return only the JSON content."""
        
        try:
            response = await self._generate_content_async(prompt)
            
            # Clean up the response - remove any markdown formatting
            if response:
                response = response.strip()
                # Remove markdown code blocks if present
                if response.startswith("```json"):
                    response = response[7:]
                if response.startswith("```"):
                    response = response[3:]
                if response.endswith("```"):
                    response = response[:-3]
                response = response.strip()
            
            return response
        except Exception as e:
            logger.error("Error generating implementation plan", error=str(e))
            return None
    
    async def generate_react_component(self, component_spec: Dict[str, Any], 
                                     design_tokens: Dict[str, Any],
                                     existing_patterns: List[str] = None) -> Optional[str]:
        """Generate React component code."""
        prompt = f"""You are a Senior Frontend Architect. Generate an elite, production-quality React component.
        
        SPECIFICATION:
        {json.dumps(component_spec, indent=2)}
        
        DESIGN TOKENS & VISUALS:
        {json.dumps(design_tokens, indent=2)}
        
        GUIDELINES for Premium UI:
        1. Styling: Use CSS Modules exclusively. Define a specific `styles` object.
        2. Aesthetics: Port the following visual details from design tokens if they exist:
           - Glassmorphism effects (backdrop-filter: blur)
           - Rounded corners (border-radius: 0.75rem or more)
           - Soft surface elevations (box-shadow)
        3. Layout: If this is a Shell or Page, use CSS Grid for the sidebar/content topology.
        4. TypeScript: Use strict typing for all props and state.
        5. Accessibility: Include ARIA labels and semantic HTML tags.
        
        CODE STRUCTURE:
        - Provide the component code.
        - If you include CSS within the same response, wrap it in a separate markdown block clearly marked as "css" for extraction.
        
        Return the component code focused on clarity and visual excellence.
        """
        
        try:
            response = await self._generate_content_async(prompt)
            return response
        except Exception as e:
            logger.error("Error generating React component", error=str(e))
            return None
    
    async def generate_test_file(self, component_code: str, component_name: str) -> Optional[str]:
        """Generate Jest test file for a component."""
        
        prompt = f"""
        You are an expert in React testing. Generate comprehensive Jest tests using React Testing Library.
        
        COMPONENT CODE:
        ```typescript
        {component_code}
        ```
        
        COMPONENT NAME: {component_name}
        
        Generate a complete test file that:
        1. Tests all component functionality
        2. Tests different prop combinations
        3. Tests user interactions (clicks, form inputs, etc.)
        4. Tests accessibility
        5. Uses proper mocking for external dependencies
        6. Achieves high code coverage
        7. Follows testing best practices
        
        Return only the test code, no explanations.
        """
        
        try:
            response = await self._generate_content_async(prompt)
            return response
        except Exception as e:
            logger.error("Error generating test file", error=str(e))
            return None
    
    async def generate_config_files(self, project_requirements: Dict[str, Any]) -> Dict[str, str]:
        """Generate configuration files (tsconfig, eslint, etc.)."""
        
        prompt = f"""
        You are an expert in TypeScript/React project configuration. Generate configuration files.
        
        PROJECT REQUIREMENTS:
        {json.dumps(project_requirements, indent=2)}
        
        Generate the following configuration files:
        1. tsconfig.json - TypeScript configuration
        2. .eslintrc.json - ESLint configuration
        3. .prettierrc - Prettier configuration
        4. jest.config.js - Jest configuration
        5. vite.config.ts - Vite configuration (if using Vite)
        
        Return as JSON object with filename as key and file content as value.
        Ensure configurations are production-ready and follow best practices.
        """
        
        try:
            response = await self._generate_content_async(prompt)
            # Parse JSON response
            config_files = json.loads(response)
            return config_files
        except Exception as e:
            logger.error("Error generating config files", error=str(e))
            return {}
    
    async def analyze_and_fix_errors(self, error_logs: List[str], 
                                   code_files: Dict[str, str]) -> Optional[Dict[str, str]]:
        """Analyze errors and generate fixed code."""
        
        prompt = f"""
        You are an expert TypeScript/React developer. Analyze these errors and provide fixes.
        
        ERROR LOGS:
        {json.dumps(error_logs, indent=2)}
        
        CODE FILES:
        {json.dumps(code_files, indent=2)}
        
        Analyze the errors and provide fixed versions of the code files.
        
        Rules:
        1. Fix TypeScript compilation errors
        2. Fix ESLint violations
        3. Fix test failures
        4. Maintain original functionality
        5. Follow best practices
        6. Don't break existing working code
        
        Return as JSON object with filename as key and fixed code as value.
        Only include files that need changes.
        """
        
        try:
            response = await self._generate_content_async(prompt)
            # Parse JSON response
            fixed_files = json.loads(response)
            return fixed_files
        except Exception as e:
            logger.error("Error analyzing and fixing errors", error=str(e))
            return None
    
    async def analyze_security_vulnerability(self, vulnerability_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze security vulnerability and suggest fixes."""
        
        prompt = f"""
        You are a security expert. Analyze this vulnerability and provide remediation guidance.
        
        VULNERABILITY DATA:
        {json.dumps(vulnerability_data, indent=2)}
        
        Provide analysis including:
        1. Severity assessment
        2. Impact analysis
        3. Recommended fix approach
        4. Code changes needed (if any)
        5. Testing recommendations
        6. Timeline for fix
        
        Return as structured JSON object.
        """
        
        try:
            response = await self._generate_content_async(prompt)
            
            # Try to parse as JSON, but handle cases where it's not valid JSON
            try:
                analysis = json.loads(response)
                return analysis
            except json.JSONDecodeError:
                # If not valid JSON, create a structured response from the text
                return {
                    "analysis_text": response,
                    "severity_assessment": "unknown",
                    "impact_analysis": "See analysis_text for details",
                    "recommended_fix": "See analysis_text for recommendations",
                    "timeline": "unknown",
                    "raw_response": True
                }
        except Exception as e:
            logger.error("Error analyzing security vulnerability", error=str(e))
            return None
    
    async def generate_pr_response(self, pr_comments: List[Dict[str, Any]], 
                                 current_code: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Generate response to PR review comments."""
        
        prompt = f"""
        You are an expert developer responding to code review feedback.
        
        PR REVIEW COMMENTS:
        {json.dumps(pr_comments, indent=2)}
        
        CURRENT CODE:
        {json.dumps(current_code, indent=2)}
        
        Generate:
        1. Updated code addressing the feedback
        2. Response message explaining changes made
        3. List of files modified
        
        Return as JSON object with:
        - "updated_files": {filename: updated_code}
        - "response_message": "explanation of changes"
        - "files_modified": ["list", "of", "files"]
        """
        
        try:
            response = await self._generate_content_async(prompt)
            pr_response = json.loads(response)
            return pr_response
        except Exception as e:
            logger.error("Error generating PR response", error=str(e))
            return None
    
        return await loop.run_in_executor(self.executor, _generate)
    
    async def analyze_design_from_image(self, image_bytes: bytes, prompt: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Analyze a design layout from an image screenshot."""
        if not prompt:
            prompt = """
            You are a Senior Frontend Architect and UI/UX Expert.
            Analyze this Figma design screenshot and extract professional technical specifications for a high-fidelity implementation:
            
            1. Layout Topology:
               - Identify major navigation structures (Sidebar width/position, Topbar height).
               - Define the Page Shell (e.g., "Sidebar + Main Layout" or "Top-nav only").
               - Identify Grid systems (e.g., "4-column KPI row", "2-column chart row").
            
            2. Visual Aesthetic (Design Tokens):
               - Colors: Identify Primary, Surface, Background, and Accent colors in Hex/RGB.
               - Effects: Note any Glassmorphism, specific shadows, or rounded corner radii (e.g., 12px/0.75rem).
               - Border/Grid lines: Note if the UI uses soft separators or high-contrast borders.
            
            3. Typography Hierarchy:
               - Font families (Primary/Secondary).
               - Exact sizing and weights for Headings (h1, h2, h3) and Body text.
            
            4. Component Mapping:
               - List all distinct components found (e.g., 'Sidebar', 'UserNav', 'MetricCard', 'AreaChart').
               - For each, list its children and purpose.
            
            5. User Experience:
               - Describe the dashboard's intent and anticipated interactive transitions.
            
            Return ONLY a valid JSON object.
            Keys: 'layout' (with 'topology', 'spacing', 'grid'), 'design_tokens' (with 'colors', 'typography', 'effects'), 'components' (list of objects), 'purpose', 'visual_summary'.
            
            CRITICAL: Be extremely precise about the Sidebar and Navbar if they exist, as these are foundational to the layout.
            """
            
        try:
            import base64
            import io
            from PIL import Image
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            logger.info("Sending image to Gemini for visual analysis")
            
            if self.use_api_key:
                if self.use_new_genai:
                    # New google.genai package - self.model is actually a function reference
                    # We need to call it differently with image bytes
                    import base64
                    b64_image = base64.b64encode(image_bytes).decode('utf-8')
                    
                    response = self.model(
                        model=self.model_name,
                        contents=[{
                            "parts": [
                                {"text": prompt},
                                {"inline_data": {"mime_type": "image/png", "data": b64_image}}
                            ]
                        }],
                        config=self.generation_config
                    )
                    text_response = response.text
                else:
                    # Old google.generativeai package - accepts PIL images directly
                    response = self.model.generate_content(
                        [prompt, image],
                        generation_config=self.generation_config
                    )
                    text_response = response.text
            else:
                # Use Vertex AI method
                img_part = Part.from_data(data=image_bytes, mime_type="image/png")
                response = self.model.generate_content(
                    [img_part, prompt],
                    generation_config=self.generation_config,
                    safety_settings=getattr(self, 'safety_settings', None)
                )
                
                if response.candidates and len(response.candidates) > 0:
                    text_response = response.candidates[0].content.parts[0].text
                else:
                    text_response = ""
            
            logger.info("Gemini response received, parsing JSON")
            
            # Parse JSON from response
            text_response = text_response.strip()
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0].strip()
                
            return json.loads(text_response)
        except Exception as e:
            logger.error("Error analyzing design from image", error=str(e))
            return None

    async def _generate_content_async(self, prompt: str) -> Optional[str]:
        """Generate content using the appropriate package (internal helper)."""
        loop = asyncio.get_running_loop()
        
        def _generate():
            if self.use_api_key:
                if self.use_new_genai:
                    response = self.model(
                        model=self.model_name,
                        contents=prompt,
                        config=self.generation_config
                    )
                    return response.text
                else:
                    response = self.model.generate_content(
                        prompt,
                        generation_config=self.generation_config
                    )
                    return response.text
            else:
                # Vertex AI
                response = self.model.generate_content(
                    prompt,
                    generation_config=self.generation_config,
                    safety_settings=getattr(self, 'safety_settings', None)
                )
                if response.candidates and len(response.candidates) > 0:
                    return response.candidates[0].content.parts[0].text
                return ""

        try:
            content = await loop.run_in_executor(self.executor, _generate)
            
            # ENTERPRISE FIX: Strip markdown code blocks if the AI included them
            if content:
                content = content.strip()
                if "```" in content:
                    # Extract content between backticks or just strip them
                    lines = content.split('\n')
                    # If first line starts with ```, remove it
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    # If last line ends with ```, remove it
                    if lines and lines[-1].strip() == "```":
                        lines = lines[:-1]
                    content = '\n'.join(lines).strip()
            
            return content
        except Exception as e:
            logger.error("Error in async Gemini generation", error=str(e))
            return None

    async def close(self):
        """Close the client and cleanup resources."""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=True)