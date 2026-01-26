"""Tool #2: Fetch Figma Design - Downloads and analyzes Figma design file."""

from typing import Optional, Dict, Any
from src.integrations.client_factory import get_figma_client, get_figma_vision_client
from src.models.design_model import FigmaDesign
from src.utils.logging import get_logger
import time

logger = get_logger(__name__)


class FetchFigmaDesignTool:
    """Tool for fetching and analyzing Figma design files."""
    
    def __init__(self):
        self.name = "fetch_figma_design"
        self.description = "Fetches and analyzes Figma design file by file key"
    
    async def execute(self, file_key: str, figma_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch and analyze Figma design file.
        
        Args:
            file_key: Figma file key extracted from URL
            figma_url: Full Figma URL (required for Vision fallback)
            
        Returns:
            Dict containing design data and analysis
        """
        start_time = time.time()
        
        try:
            logger.info("Fetching Figma design", file_key=file_key)
            
            # Get Figma client and fetch design from Figma
            figma_client = get_figma_client()
            design_data = await figma_client.get_file(file_key)
            
            if not design_data:
                # VISION FALLBACK: If API fails, try visual analysis if we have a URL
                if figma_url:
                    logger.warning("Figma API failed, attempting Visual Analysis (Vision Mode)", url=figma_url)
                    vision_client = get_figma_vision_client()
                    vision_analysis = await vision_client.analyze_url(figma_url)
                    
                    if vision_analysis:
                        logger.info("Vision analysis successful, using visual data")
                        design_dict = vision_client.map_vision_to_design_model(vision_analysis, file_key)
                        
                        # Since it's vision-based, we've already done most of the analysis
                        analysis_result = {
                            "development_ready": True,
                            "issues": [],
                            "recommendations": ["Vision-based requirements generated from screenshot"],
                            "component_summary": {
                                "total_components": len(design_dict["component_analysis"]),
                                "interactive_count": len([c for c in design_dict["component_analysis"] if c["is_clickable"]]),
                                "layout_count": len(design_dict["component_analysis"]),
                                "component_types": list(set(c["type"] for c in design_dict["component_analysis"]))
                            },
                            "design_system": design_dict["design_tokens"],
                            "responsive_considerations": ["Analyzed from visual layout"],
                            "accessibility_notes": ["Visual accessibility check performed by AI"]
                        }
                        
                        duration_ms = int((time.time() - start_time) * 1000)
                        return {
                            "success": True,
                            "design": design_dict,
                            "analysis": analysis_result,
                            "duration_ms": duration_ms,
                            "source": "vision"
                        }

                return {
                    "success": False,
                    "error": f"Figma file {file_key} not found or inaccessible via API, and Vision fallback failed.",
                    "design": None,
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            
            # Handle both dict (mock) and FigmaDesign object (real) formats
            if isinstance(design_data, dict):
                # Mock client returns dict
                design_dict = design_data
                components_count = len(design_dict.get("components", []))
                pages_count = 1  # Mock data has one page
            else:
                # Real client returns FigmaDesign object
                design_dict = design_data.dict()
                components_count = len(design_data.component_analysis)
                pages_count = len(design_data.pages)
            
            # Analyze design for code generation
            analysis_result = self._analyze_design_for_development(design_dict)
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            logger.info("Figma design fetched successfully", 
                       file_key=file_key, 
                       duration_ms=duration_ms,
                       components_found=components_count,
                       pages_found=pages_count)
            
            return {
                "success": True,
                "design": design_dict,
                "analysis": analysis_result,
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("Error fetching Figma design", 
                        file_key=file_key, 
                        error=str(e),
                        duration_ms=duration_ms)
            
            return {
                "success": False,
                "error": str(e),
                "design": None,
                "duration_ms": duration_ms
            }
    
    def _analyze_design_for_development(self, design_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze design for development readiness and extract key information.
        
        Args:
            design_data: Figma design data as dictionary
            
        Returns:
            Analysis result with development insights
        """
        analysis = {
            "development_ready": True,
            "issues": [],
            "recommendations": [],
            "component_summary": {},
            "design_system": {},
            "responsive_considerations": [],
            "accessibility_notes": []
        }
        
        # Determine if we're dealing with mock or real data structure
        is_mock = "components" in design_data
        
        if is_mock:
            components = design_data.get("components", [])
            tokens = design_data.get("design_tokens", {})
        else:
            components = design_data.get("component_analysis", [])
            tokens = design_data.get("design_tokens", {})
            
        if not components:
            analysis["issues"].append("No components found in design - may be empty or not properly structured")
            analysis["development_ready"] = False
            return analysis
            
        # 1. Component Summary
        if is_mock:
            analysis["component_summary"] = {
                "total_components": len(components),
                "interactive_count": len([c for c in components if c.get("type", "").lower() in ["button", "input", "link"]]),
                "layout_count": len([c for c in components if c.get("type", "").lower() in ["frame", "container", "box"]]),
                "component_types": list(set(c.get("type", "unknown") for c in components))
            }
        else:
            analysis["component_summary"] = {
                "total_components": len(components),
                "interactive_count": len([c for c in components if c.get("is_clickable") or c.get("is_input")]),
                "layout_count": len([c for c in components if c.get("layout_type") == "flex"]),
                "component_types": list(set(c.get("type", "unknown") for c in components))
            }
            
        # 2. Design System Analysis
        colors = tokens.get("colors", {}) if isinstance(tokens, dict) else getattr(tokens, 'colors', {})
        font_sizes = tokens.get("font_sizes", []) if isinstance(tokens, dict) else getattr(tokens, 'font_sizes', [])
        spacing = tokens.get("spacing", []) if isinstance(tokens, dict) else getattr(tokens, 'spacing', [])
        
        analysis["design_system"] = {
            "colors_defined": len(colors),
            "font_sizes_defined": len(font_sizes),
            "spacing_values_defined": len(spacing),
            "has_color_system": len(colors) >= 3,
            "has_consistent_spacing": len(spacing) >= 2
        }
        
        # 3. Simple Recommendations
        if not analysis["design_system"]["has_color_system"]:
            analysis["recommendations"].append("Consider defining a more comprehensive color palette")
            
        if is_mock:
            analysis["responsive_considerations"].append("Component-based responsive design planned")
        else:
            # Check for flex layouts in real data
            flex_count = analysis["component_summary"]["layout_count"]
            if flex_count > 0:
                analysis["responsive_considerations"].append(f"Found {flex_count} flexbox layouts for responsiveness")
            else:
                analysis["recommendations"].append("Consider using flexbox for better responsive behavior")
                
        return analysis
    
    def _analyze_responsive_design(self, design: FigmaDesign, analysis: Dict[str, Any]):
        """Analyze design for responsive considerations."""
        
        # Check for multiple screen sizes
        pages = design.pages
        screen_sizes = []
        
        for page in pages:
            for child in page.children:
                if child.absolute_bounding_box:
                    width = child.absolute_bounding_box.get("width", 0)
                    if width not in screen_sizes:
                        screen_sizes.append(width)
        
        if len(screen_sizes) > 1:
            analysis["responsive_considerations"].append("Multiple screen sizes detected - good for responsive design")
        else:
            analysis["responsive_considerations"].append("Only one screen size found - consider mobile/tablet variants")
        
        # Check for flexible layouts
        flex_components = [c for c in design.component_analysis if c.layout_type == "flex"]
        if len(flex_components) > 0:
            analysis["responsive_considerations"].append(f"Found {len(flex_components)} flex layouts - good for responsive design")
        else:
            analysis["recommendations"].append("Consider using flexible layouts for better responsive behavior")
    
    def _analyze_accessibility(self, design: FigmaDesign, analysis: Dict[str, Any]):
        """Analyze design for accessibility considerations."""
        
        # Check text contrast (simplified analysis)
        text_components = [c for c in design.component_analysis if c.text_content]
        
        if text_components:
            analysis["accessibility_notes"].append(f"Found {len(text_components)} text components - ensure proper contrast ratios")
        
        # Check for interactive elements
        interactive_components = [c for c in design.component_analysis if c.is_clickable]
        
        if interactive_components:
            analysis["accessibility_notes"].append(f"Found {len(interactive_components)} interactive elements - ensure proper focus states and ARIA labels")
        
        # Check for form elements
        form_components = [c for c in design.component_analysis if c.is_input or c.is_form]
        
        if form_components:
            analysis["accessibility_notes"].append(f"Found {len(form_components)} form elements - ensure proper labels and validation messages")
    
    def _generate_component_recommendations(self, components: list, analysis: Dict[str, Any]):
        """Generate recommendations for component implementation."""
        
        # Check for reusable components
        component_names = [c.name for c in components]
        duplicate_names = [name for name in set(component_names) if component_names.count(name) > 1]
        
        if duplicate_names:
            analysis["recommendations"].append(f"Found duplicate component names: {duplicate_names} - consider creating reusable components")
        
        # Check for complex nested structures
        deeply_nested = [c for c in components if len(c.children) > 5]
        
        if deeply_nested:
            analysis["recommendations"].append(f"Found {len(deeply_nested)} deeply nested components - consider breaking into smaller components")
        
        # Check for missing interactive states
        buttons = [c for c in components if c.is_clickable]
        
        if buttons and not any("hover" in c.name.lower() or "active" in c.name.lower() for c in components):
            analysis["recommendations"].append("Consider defining hover and active states for interactive elements")


# Global tool instance
fetch_figma_design_tool = FetchFigmaDesignTool()