"""Figma Design data models."""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class ComponentType(str, Enum):
    """Figma component types."""
    FRAME = "FRAME"
    GROUP = "GROUP"
    VECTOR = "VECTOR"
    BOOLEAN_OPERATION = "BOOLEAN_OPERATION"
    STAR = "STAR"
    LINE = "LINE"
    ELLIPSE = "ELLIPSE"
    REGULAR_POLYGON = "REGULAR_POLYGON"
    RECTANGLE = "RECTANGLE"
    TEXT = "TEXT"
    SLICE = "SLICE"
    COMPONENT = "COMPONENT"
    COMPONENT_SET = "COMPONENT_SET"
    INSTANCE = "INSTANCE"


class LayoutConstraint(BaseModel):
    """Layout constraints for responsive design."""
    vertical: str = "TOP"
    horizontal: str = "LEFT"


class LayoutGrid(BaseModel):
    """Layout grid information."""
    pattern: str = "COLUMNS"
    section_size: float = 1
    visible: bool = True
    color: Dict[str, float] = Field(default_factory=dict)
    alignment: str = "MIN"
    gutter_size: float = 20
    offset: float = 0
    count: int = 12


class Paint(BaseModel):
    """Paint/fill information."""
    type: str = "SOLID"
    visible: bool = True
    opacity: float = 1.0
    color: Optional[Dict[str, float]] = None
    gradient_handle_positions: Optional[List[Dict[str, float]]] = None
    gradient_stops: Optional[List[Dict[str, Any]]] = None
    scale_mode: Optional[str] = None
    image_transform: Optional[List[List[float]]] = None
    scaling_factor: Optional[float] = None
    rotation: Optional[float] = None
    image_ref: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class TypeStyle(BaseModel):
    """Typography style information."""
    font_family: str
    font_post_script_name: Optional[str] = None
    paragraph_spacing: float = 0
    paragraph_indent: float = 0
    list_spacing: float = 0
    hang_indent: float = 0
    font_size: float = 12
    text_decoration: str = "NONE"
    text_case: str = "ORIGINAL"
    line_height_px: float = 14
    line_height_percent: float = 116.7
    line_height_percent_font_size: float = 116.7
    line_height_unit: str = "INTRINSIC_%"
    letter_spacing: float = 0
    fills: List[Paint] = Field(default_factory=list)
    hyperlink: Optional[Dict[str, str]] = None
    opentypeFlags: Optional[Dict[str, int]] = None


class Effect(BaseModel):
    """Visual effects like shadows, blurs."""
    type: str
    visible: bool = True
    radius: float = 0
    color: Optional[Dict[str, float]] = None
    blend_mode: str = "NORMAL"
    offset: Optional[Dict[str, float]] = None
    spread: Optional[float] = None
    show_shadow_behind_node: Optional[bool] = None


class FigmaNode(BaseModel):
    """Base Figma node model."""
    id: str
    name: str
    type: ComponentType
    visible: bool = True
    locked: bool = False
    
    # Layout properties
    absolute_bounding_box: Optional[Dict[str, float]] = None
    absolute_render_bounds: Optional[Dict[str, float]] = None
    constraints: Optional[LayoutConstraint] = None
    layout_align: Optional[str] = None
    layout_grow: Optional[float] = None
    layout_size_mode: Optional[str] = None
    
    # Visual properties
    fills: List[Paint] = Field(default_factory=list)
    strokes: List[Paint] = Field(default_factory=list)
    stroke_weight: float = 0
    stroke_align: str = "INSIDE"
    stroke_dashes: List[float] = Field(default_factory=list)
    corner_radius: Optional[Union[float, List[float]]] = None
    rectangle_corner_radii: Optional[List[float]] = None
    
    # Effects
    effects: List[Effect] = Field(default_factory=list)
    blend_mode: str = "PASS_THROUGH"
    opacity: float = 1.0
    
    # Layout
    layout_mode: Optional[str] = None
    primary_axis_sizing_mode: Optional[str] = None
    counter_axis_sizing_mode: Optional[str] = None
    primary_axis_align_items: Optional[str] = None
    counter_axis_align_items: Optional[str] = None
    padding_left: Optional[float] = None
    padding_right: Optional[float] = None
    padding_top: Optional[float] = None
    padding_bottom: Optional[float] = None
    item_spacing: Optional[float] = None
    
    # Text properties (for TEXT nodes)
    characters: Optional[str] = None
    style: Optional[TypeStyle] = None
    character_style_overrides: List[int] = Field(default_factory=list)
    style_override_table: Dict[str, TypeStyle] = Field(default_factory=dict)
    
    # Component properties
    component_id: Optional[str] = None
    component_set_id: Optional[str] = None
    main_component: Optional[str] = None
    
    # Children
    children: List['FigmaNode'] = Field(default_factory=list)
    
    # Custom properties
    plugin_data: Dict[str, Any] = Field(default_factory=dict)
    shared_plugin_data: Dict[str, Any] = Field(default_factory=dict)


class DesignTokens(BaseModel):
    """Extracted design tokens from Figma."""
    
    # Colors
    colors: Dict[str, str] = Field(default_factory=dict)  # name -> hex
    
    # Typography
    font_families: List[str] = Field(default_factory=list)
    font_sizes: List[float] = Field(default_factory=list)
    line_heights: List[float] = Field(default_factory=list)
    font_weights: List[int] = Field(default_factory=list)
    
    # Spacing
    spacing: List[float] = Field(default_factory=list)
    border_radius: List[float] = Field(default_factory=list)
    
    # Shadows
    shadows: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Breakpoints (if responsive design)
    breakpoints: Dict[str, int] = Field(default_factory=dict)


class ComponentAnalysis(BaseModel):
    """Analysis of a Figma component for code generation."""
    
    id: str
    name: str
    type: str
    
    # Layout analysis
    layout_type: str  # "flex", "grid", "absolute", "static"
    flex_direction: Optional[str] = None
    justify_content: Optional[str] = None
    align_items: Optional[str] = None
    gap: Optional[float] = None
    
    # Styling
    background_color: Optional[str] = None
    border: Optional[Dict[str, Any]] = None
    border_radius: Optional[float] = None
    padding: Optional[Dict[str, float]] = None
    margin: Optional[Dict[str, float]] = None
    
    # Interactive elements
    is_clickable: bool = False
    is_input: bool = False
    is_form: bool = False
    
    # Text content
    text_content: Optional[str] = None
    text_styles: Optional[Dict[str, Any]] = None
    
    # Children components
    children: List['ComponentAnalysis'] = Field(default_factory=list)
    
    # Suggested React props
    suggested_props: List[str] = Field(default_factory=list)
    
    # CSS classes to generate
    css_classes: List[str] = Field(default_factory=list)


class FigmaDesign(BaseModel):
    """Complete Figma design file model."""
    
    # File metadata
    file_key: str
    name: str
    last_modified: str
    thumbnail_url: Optional[str] = None
    version: str
    role: str = "viewer"
    
    # Document structure
    document: FigmaNode
    
    # Components and styles
    components: Dict[str, Any] = Field(default_factory=dict)
    component_sets: Dict[str, Any] = Field(default_factory=dict)
    schema_version: int = 0
    styles: Dict[str, Any] = Field(default_factory=dict)
    
    # Extracted design tokens
    design_tokens: DesignTokens = Field(default_factory=DesignTokens)
    
    # Component analysis for code generation
    component_analysis: List[ComponentAnalysis] = Field(default_factory=list)
    
    # Pages
    pages: List[FigmaNode] = Field(default_factory=list)
    
    @property
    def main_page(self) -> Optional[FigmaNode]:
        """Get the main design page (usually first page)."""
        return self.pages[0] if self.pages else None
    
    def find_components_by_name(self, name: str) -> List[ComponentAnalysis]:
        """Find components by name pattern."""
        return [
            comp for comp in self.component_analysis
            if name.lower() in comp.name.lower()
        ]
    
    def get_interactive_components(self) -> List[ComponentAnalysis]:
        """Get all interactive components (buttons, inputs, forms)."""
        return [
            comp for comp in self.component_analysis
            if comp.is_clickable or comp.is_input or comp.is_form
        ]


# Update forward references
FigmaNode.model_rebuild()
ComponentAnalysis.model_rebuild()