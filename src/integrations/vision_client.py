"""Vision client for capturing screenshots and analyzing them with Gemini."""

import asyncio
import os
import tempfile
from typing import Dict, Any, Optional
from src.utils.logging import get_logger
from src.integrations.gemini_client import GeminiClient

logger = get_logger(__name__)

class FigmaVisionClient:
    """Uses browser automation to capture Figma screenshots and Gemini to analyze them."""
    
    def __init__(self, gemini_client: GeminiClient):
        self.gemini_client = gemini_client
        self.browser_initialized = False
        
    async def analyze_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Captures a screenshot of the URL and analyzes it with Gemini."""
        logger.info("Starting Vision analysis for URL", url=url)
        
        screenshot_bytes = await self._capture_screenshot(url)
        if not screenshot_bytes:
            logger.error("Failed to capture screenshot for Vision analysis")
            return None
            
        logger.info("Screenshot captured, sending to Gemini for visual analysis")
        analysis = await self.gemini_client.analyze_design_from_image(screenshot_bytes)
        
        if analysis:
            logger.info("Vision analysis completed successfully")
            return analysis
        else:
            logger.error("Gemini failed to analyze the screenshot")
            return None

    async def _capture_screenshot(self, url: str) -> Optional[bytes]:
        """Uses Playwright to capture a screenshot of the page."""
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.warning("playwright not installed. Vision mode requires playwright.")
            return None

        try:
            async with async_playwright() as p:
                logger.info("Launching headless browser for screenshot")
                try:
                    browser = await p.chromium.launch(headless=True)
                except NotImplementedError as ne:
                    logger.critical(
                        "Playwright subprocess not supported on this event loop. "
                        "Ensure WindowsSelectorEventLoopPolicy is set in main.py.",
                        exc_info=ne
                    )
                    return None
                
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
                )
                
                page = await context.new_page()
                
                logger.info("Navigating to URL", url=url)
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=90000)
                    logger.info("DOM content loaded, waiting for rendering to settle")
                except Exception as te:
                    logger.warning("Navigation timeout or error, attempting to proceed anyway", error=str(te))
                
                await asyncio.sleep(20) 
                
                logger.info("Taking screenshot")
                screenshot_bytes = await page.screenshot(full_page=False)
                
                await browser.close()
                return screenshot_bytes
                
        except Exception as e:
            logger.error("Unexpected error capturing screenshot", error=str(e))
            return None

    def map_vision_to_design_model(self, vision_data: Dict[str, Any], file_key: str) -> Dict[str, Any]:
        """Maps raw vision analysis back to a structure compatible with FigmaDesign model."""
        # Create a simplified structure that the agents can use
        # We simulate the basic fields needed by FetchFigmaDesignTool
        
        # Handle design name - could be string or dict
        purpose = vision_data.get("purpose", "Visual Design")
        if isinstance(purpose, dict):
            design_name = purpose.get("description", "Visual Design")
        else:
            design_name = str(purpose)
        
        # Simulate design tokens from vision colors
        colors = {}
        vision_colors = vision_data.get("colors", {})
        if isinstance(vision_colors, dict):
            for name, hexcode in vision_colors.items():
                if isinstance(hexcode, str):
                    colors[name] = hexcode
                elif isinstance(hexcode, dict):
                    colors[name] = hexcode.get("hex", hexcode.get("value", "#000000"))
        elif isinstance(vision_colors, list):
            for i, color in enumerate(vision_colors):
                if isinstance(color, str):
                    colors[f"color_{i}"] = color
                elif isinstance(color, dict):
                    colors[color.get("name", f"color_{i}")] = color.get("hex", "#000000")
        
        # Build component analysis list - handle various formats
        components = []
        vision_components = vision_data.get("components", [])
        
        if isinstance(vision_components, list):
            for i, comp in enumerate(vision_components):
                # Handle string components (e.g., ["Button", "Chart"])
                if isinstance(comp, str):
                    comp_name = comp
                    comp_type = "FRAME"
                    comp_text = ""
                # Handle dict components (e.g., [{"name": "Button", "type": "button"}])
                elif isinstance(comp, dict):
                    comp_name = comp.get("name", f"Component {i}")
                    comp_type = comp.get("type", "FRAME")
                    comp_text = comp.get("text", "")
                else:
                    comp_name = f"Component {i}"
                    comp_type = "FRAME"
                    comp_text = ""
                
                components.append({
                    "id": f"vision_{i}",
                    "name": comp_name,
                    "type": comp_type.upper() if isinstance(comp_type, str) else "FRAME",
                    "layout_type": "flex",
                    "is_clickable": any(kw in comp_name.lower() for kw in ["button", "link", "cta", "submit"]),
                    "is_input": any(kw in comp_name.lower() for kw in ["input", "field", "text", "search"]),
                    "text_content": comp_text,
                    "css_classes": [f"vision-component"]
                })
        elif isinstance(vision_components, dict):
            # Handle dict of components
            for name, details in vision_components.items():
                components.append({
                    "id": f"vision_{name}",
                    "name": name,
                    "type": "FRAME",
                    "layout_type": "flex",
                    "is_clickable": "button" in name.lower(),
                    "is_input": "input" in name.lower(),
                    "text_content": str(details) if not isinstance(details, dict) else details.get("text", ""),
                    "css_classes": ["vision-component"]
                })
        
        # If no components found, create placeholder based on visual_summary
        if not components:
            visual_summary = vision_data.get("visual_summary", "Dashboard with charts and cards")
            components = [
                {"id": "vision_0", "name": "Dashboard Layout", "type": "FRAME", "layout_type": "flex", 
                 "is_clickable": False, "is_input": False, "text_content": visual_summary, "css_classes": ["vision-component"]}
            ]
        
        # Return a dict that mimics FigmaDesign.dict()
        return {
            "file_key": file_key,
            "name": design_name,
            "last_modified": "just now",
            "version": "1.0",
            "document": {
                "id": "0:0",
                "name": "Document",
                "type": "DOCUMENT",
                "children": []
            },
            "design_tokens": {
                "colors": colors,
                "font_sizes": [12, 14, 16, 18, 24, 32],
                "spacing": [4, 8, 16, 24, 32]
            },
            "component_analysis": components
        }

