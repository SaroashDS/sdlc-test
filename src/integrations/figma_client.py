"""Figma API client for fetching design files and analyzing components."""

import httpx
from typing import List, Optional, Dict, Any
from src.config import settings
from src.utils.config import secret_manager
from src.utils.logging import get_logger
from src.models.design_model import (
    FigmaDesign, FigmaNode, ComponentType, DesignTokens, 
    ComponentAnalysis, Paint, TypeStyle
)
import json
import re

logger = get_logger(__name__)


class FigmaClient:
    """Client for Figma REST API."""
    
    def __init__(self):
        self.base_url = settings.figma_base_url
        self._token = None
        self._client = None
    
    @property
    def token(self) -> str:
        """Get Figma token from Secret Manager."""
        if not self._token:
            self._token = secret_manager.get_figma_token()
        return self._token
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get HTTP client with authentication."""
        if not self._client:
            self._client = httpx.AsyncClient(
                headers={
                    "X-Figma-Token": self.token,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
        return self._client
    
    async def get_file(self, file_key: str) -> Optional[FigmaDesign]:
        """Fetch a Figma file by key."""
        try:
            url = f"{self.base_url}/files/{file_key}"
            
            logger.info("Fetching Figma file", file_key=file_key)
            
            response = await self.client.get(url)
            response.raise_for_status()
            
            data = response.json()
            return await self._parse_figma_file(file_key, data)
            
        except httpx.HTTPStatusError as e:
            logger.error("HTTP error fetching Figma file", 
                        file_key=file_key, 
                        status_code=e.response.status_code,
                        error=str(e))
            return None
        except Exception as e:
            logger.error("Error fetching Figma file", 
                        file_key=file_key, 
                        error=str(e))
            return None
    
    async def get_file_nodes(self, file_key: str, node_ids: List[str]) -> Optional[Dict[str, Any]]:
        """Fetch specific nodes from a Figma file."""
        try:
            url = f"{self.base_url}/files/{file_key}/nodes"
            params = {"ids": ",".join(node_ids)}
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error("Error fetching Figma nodes", 
                        file_key=file_key, 
                        node_ids=node_ids,
                        error=str(e))
            return None
    
    async def get_file_images(self, file_key: str, node_ids: List[str], format: str = "png") -> Optional[Dict[str, str]]:
        """Get image URLs for specific nodes."""
        try:
            url = f"{self.base_url}/images/{file_key}"
            params = {
                "ids": ",".join(node_ids),
                "format": format,
                "scale": "2"
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("images", {})
            
        except Exception as e:
            logger.error("Error fetching Figma images", 
                        file_key=file_key, 
                        error=str(e))
            return None
    
    async def _parse_figma_file(self, file_key: str, data: Dict[str, Any]) -> FigmaDesign:
        """Parse Figma file data into FigmaDesign model."""
        
        # Parse document structure
        document = self._parse_node(data["document"])
        
        # Extract pages
        pages = [self._parse_node(page) for page in data["document"].get("children", [])]
        
        # Extract design tokens
        design_tokens = self._extract_design_tokens(document)
        
        # Analyze components for code generation
        component_analysis = await self._analyze_components(document)
        
        return FigmaDesign(
            file_key=file_key,
            name=data.get("name", ""),
            last_modified=data.get("lastModified", ""),
            thumbnail_url=data.get("thumbnailUrl"),
            version=data.get("version", ""),
            role=data.get("role", "viewer"),
            document=document,
            components=data.get("components", {}),
            component_sets=data.get("componentSets", {}),
            schema_version=data.get("schemaVersion", 0),
            styles=data.get("styles", {}),
            design_tokens=design_tokens,
            component_analysis=component_analysis,
            pages=pages
        )
    
    def _parse_node(self, node_data: Dict[str, Any]) -> FigmaNode:
        """Parse a Figma node recursively."""
        
        # Parse children recursively
        children = []
        if "children" in node_data:
            children = [self._parse_node(child) for child in node_data["children"]]
        
        # Parse fills
        fills = []
        if "fills" in node_data:
            fills = [self._parse_paint(fill) for fill in node_data["fills"]]
        
        # Parse strokes
        strokes = []
        if "strokes" in node_data:
            strokes = [self._parse_paint(stroke) for stroke in node_data["strokes"]]
        
        # Parse text style
        style = None
        if "style" in node_data:
            style = self._parse_type_style(node_data["style"])
        
        return FigmaNode(
            id=node_data["id"],
            name=node_data.get("name", ""),
            type=ComponentType(node_data.get("type", "FRAME")),
            visible=node_data.get("visible", True),
            locked=node_data.get("locked", False),
            absolute_bounding_box=node_data.get("absoluteBoundingBox"),
            absolute_render_bounds=node_data.get("absoluteRenderBounds"),
            fills=fills,
            strokes=strokes,
            stroke_weight=node_data.get("strokeWeight", 0),
            stroke_align=node_data.get("strokeAlign", "INSIDE"),
            corner_radius=node_data.get("cornerRadius"),
            rectangle_corner_radii=node_data.get("rectangleCornerRadii"),
            blend_mode=node_data.get("blendMode", "PASS_THROUGH"),
            opacity=node_data.get("opacity", 1.0),
            layout_mode=node_data.get("layoutMode"),
            primary_axis_sizing_mode=node_data.get("primaryAxisSizingMode"),
            counter_axis_sizing_mode=node_data.get("counterAxisSizingMode"),
            primary_axis_align_items=node_data.get("primaryAxisAlignItems"),
            counter_axis_align_items=node_data.get("counterAxisAlignItems"),
            padding_left=node_data.get("paddingLeft"),
            padding_right=node_data.get("paddingRight"),
            padding_top=node_data.get("paddingTop"),
            padding_bottom=node_data.get("paddingBottom"),
            item_spacing=node_data.get("itemSpacing"),
            characters=node_data.get("characters"),
            style=style,
            component_id=node_data.get("componentId"),
            main_component=node_data.get("mainComponent"),
            children=children
        )
    
    def _parse_paint(self, paint_data: Dict[str, Any]) -> Paint:
        """Parse paint/fill data."""
        return Paint(
            type=paint_data.get("type", "SOLID"),
            visible=paint_data.get("visible", True),
            opacity=paint_data.get("opacity", 1.0),
            color=paint_data.get("color")
        )
    
    def _parse_type_style(self, style_data: Dict[str, Any]) -> TypeStyle:
        """Parse typography style data."""
        fills = []
        if "fills" in style_data:
            fills = [self._parse_paint(fill) for fill in style_data["fills"]]
        
        return TypeStyle(
            font_family=style_data.get("fontFamily", ""),
            font_size=style_data.get("fontSize", 12),
            font_post_script_name=style_data.get("fontPostScriptName"),
            line_height_px=style_data.get("lineHeightPx", 14),
            line_height_percent=style_data.get("lineHeightPercent", 116.7),
            letter_spacing=style_data.get("letterSpacing", 0),
            fills=fills
        )
    
    def _extract_design_tokens(self, document: FigmaNode) -> DesignTokens:
        """Extract design tokens from the document."""
        tokens = DesignTokens()
        
        def extract_from_node(node: FigmaNode):
            # Extract colors
            for fill in node.fills:
                if fill.color and fill.type == "SOLID":
                    color_name = self._generate_color_name(fill.color)
                    hex_color = self._rgba_to_hex(fill.color)
                    tokens.colors[color_name] = hex_color
            
            # Extract typography
            if node.style:
                if node.style.font_family not in tokens.font_families:
                    tokens.font_families.append(node.style.font_family)
                if node.style.font_size not in tokens.font_sizes:
                    tokens.font_sizes.append(node.style.font_size)
                if node.style.line_height_px not in tokens.line_heights:
                    tokens.line_heights.append(node.style.line_height_px)
            
            # Extract spacing and border radius
            if node.corner_radius and node.corner_radius not in tokens.border_radius:
                tokens.border_radius.append(node.corner_radius)
            
            if node.padding_left and node.padding_left not in tokens.spacing:
                tokens.spacing.append(node.padding_left)
            if node.padding_top and node.padding_top not in tokens.spacing:
                tokens.spacing.append(node.padding_top)
            if node.item_spacing and node.item_spacing not in tokens.spacing:
                tokens.spacing.append(node.item_spacing)
            
            # Recursively process children
            for child in node.children:
                extract_from_node(child)
        
        extract_from_node(document)
        
        # Sort and deduplicate
        tokens.font_sizes.sort()
        tokens.line_heights.sort()
        tokens.spacing.sort()
        tokens.border_radius.sort()
        
        return tokens
    
    async def _analyze_components(self, document: FigmaNode) -> List[ComponentAnalysis]:
        """Analyze components for code generation."""
        components = []
        
        def analyze_node(node: FigmaNode) -> Optional[ComponentAnalysis]:
            # Skip non-visual nodes
            if node.type in ["DOCUMENT", "CANVAS"]:
                return None
            
            # Determine layout type
            layout_type = "static"
            if node.layout_mode == "HORIZONTAL":
                layout_type = "flex"
            elif node.layout_mode == "VERTICAL":
                layout_type = "flex"
            
            # Determine if interactive
            is_clickable = self._is_clickable_component(node)
            is_input = self._is_input_component(node)
            is_form = self._is_form_component(node)
            
            # Extract styling
            background_color = None
            if node.fills and len(node.fills) > 0:
                fill = node.fills[0]
                if fill.color:
                    background_color = self._rgba_to_hex(fill.color)
            
            # Generate suggested props
            suggested_props = self._generate_component_props(node)
            
            # Generate CSS classes
            css_classes = self._generate_css_classes(node)
            
            analysis = ComponentAnalysis(
                id=node.id,
                name=self._sanitize_component_name(node.name),
                type=node.type.value,
                layout_type=layout_type,
                flex_direction="row" if node.layout_mode == "HORIZONTAL" else "column" if node.layout_mode == "VERTICAL" else None,
                justify_content=self._map_figma_alignment(node.primary_axis_align_items),
                align_items=self._map_figma_alignment(node.counter_axis_align_items),
                gap=node.item_spacing,
                background_color=background_color,
                border_radius=node.corner_radius,
                padding=self._extract_padding(node),
                is_clickable=is_clickable,
                is_input=is_input,
                is_form=is_form,
                text_content=node.characters,
                suggested_props=suggested_props,
                css_classes=css_classes,
                children=[]
            )
            
            # Analyze children
            for child in node.children:
                child_analysis = analyze_node(child)
                if child_analysis:
                    analysis.children.append(child_analysis)
            
            return analysis
        
        # Analyze all top-level frames/components
        for page in document.children:
            for child in page.children:
                analysis = analyze_node(child)
                if analysis:
                    components.append(analysis)
        
        return components
    
    def _generate_color_name(self, color: Dict[str, float]) -> str:
        """Generate a semantic color name from RGBA values."""
        # Simple color naming - in production, this would be more sophisticated
        r, g, b = int(color.get("r", 0) * 255), int(color.get("g", 0) * 255), int(color.get("b", 0) * 255)
        
        if r > 200 and g > 200 and b > 200:
            return "light-gray"
        elif r < 50 and g < 50 and b < 50:
            return "dark-gray"
        elif r > g and r > b:
            return "red"
        elif g > r and g > b:
            return "green"
        elif b > r and b > g:
            return "blue"
        else:
            return f"color-{r}-{g}-{b}"
    
    def _rgba_to_hex(self, color: Dict[str, float]) -> str:
        """Convert RGBA color to hex."""
        r = int(color.get("r", 0) * 255)
        g = int(color.get("g", 0) * 255)
        b = int(color.get("b", 0) * 255)
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def _is_clickable_component(self, node: FigmaNode) -> bool:
        """Determine if component is clickable (button, link, etc.)."""
        name_lower = node.name.lower()
        return any(keyword in name_lower for keyword in ["button", "btn", "click", "link", "cta"])
    
    def _is_input_component(self, node: FigmaNode) -> bool:
        """Determine if component is an input field."""
        name_lower = node.name.lower()
        return any(keyword in name_lower for keyword in ["input", "field", "textbox", "textarea", "select"])
    
    def _is_form_component(self, node: FigmaNode) -> bool:
        """Determine if component is a form."""
        name_lower = node.name.lower()
        return any(keyword in name_lower for keyword in ["form", "signup", "login", "register"])
    
    def _sanitize_component_name(self, name: str) -> str:
        """Sanitize component name for code generation."""
        # Convert to PascalCase and remove special characters
        name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
        words = name.split()
        return ''.join(word.capitalize() for word in words if word)
    
    def _generate_component_props(self, node: FigmaNode) -> List[str]:
        """Generate suggested React props for component."""
        props = []
        
        if self._is_clickable_component(node):
            props.extend(["onClick", "disabled", "variant"])
        
        if self._is_input_component(node):
            props.extend(["value", "onChange", "placeholder", "required"])
        
        if node.characters:
            props.append("children")
        
        # Add common props
        props.extend(["className", "style"])
        
        return list(set(props))  # Remove duplicates
    
    def _generate_css_classes(self, node: FigmaNode) -> List[str]:
        """Generate CSS class names for component."""
        base_name = self._sanitize_component_name(node.name).lower()
        classes = [base_name]
        
        if self._is_clickable_component(node):
            classes.append(f"{base_name}--clickable")
        
        if node.layout_mode:
            classes.append(f"{base_name}--{node.layout_mode.lower()}")
        
        return classes
    
    def _map_figma_alignment(self, alignment: Optional[str]) -> Optional[str]:
        """Map Figma alignment to CSS flexbox values."""
        if not alignment:
            return None
        
        mapping = {
            "MIN": "flex-start",
            "CENTER": "center",
            "MAX": "flex-end",
            "SPACE_BETWEEN": "space-between"
        }
        
        return mapping.get(alignment)
    
    def _extract_padding(self, node: FigmaNode) -> Optional[Dict[str, float]]:
        """Extract padding values from node."""
        if any([node.padding_left, node.padding_right, node.padding_top, node.padding_bottom]):
            return {
                "left": node.padding_left or 0,
                "right": node.padding_right or 0,
                "top": node.padding_top or 0,
                "bottom": node.padding_bottom or 0
            }
        return None
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()