"""Mock Figma design data for testing."""

# Mock Figma Design Data
mock_figma_design = {
    "file_key": "mock123",
    "name": "Dashboard Design",
    "lastModified": "2024-12-29T09:00:00.000Z",
    "thumbnailUrl": "https://mock-figma-thumbnail.com/dashboard.png",
    "version": "1.0",
    "document": {
        "id": "0:0",
        "name": "Dashboard Design",
        "type": "DOCUMENT",
        "children": [
            {
                "id": "1:1",
                "name": "Dashboard Page",
                "type": "CANVAS",
                "children": [
                    {
                        "id": "2:1",
                        "name": "Header Component",
                        "type": "FRAME",
                        "absoluteBoundingBox": {
                            "x": 0,
                            "y": 0,
                            "width": 1200,
                            "height": 80
                        },
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": {
                                    "r": 0.1,
                                    "g": 0.1,
                                    "b": 0.1,
                                    "a": 1
                                }
                            }
                        ]
                    },
                    {
                        "id": "2:2", 
                        "name": "KPI Cards Section",
                        "type": "FRAME",
                        "absoluteBoundingBox": {
                            "x": 0,
                            "y": 100,
                            "width": 1200,
                            "height": 200
                        },
                        "children": [
                            {
                                "id": "3:1",
                                "name": "Revenue Card",
                                "type": "FRAME",
                                "absoluteBoundingBox": {
                                    "x": 20,
                                    "y": 120,
                                    "width": 280,
                                    "height": 160
                                }
                            },
                            {
                                "id": "3:2",
                                "name": "Users Card", 
                                "type": "FRAME",
                                "absoluteBoundingBox": {
                                    "x": 320,
                                    "y": 120,
                                    "width": 280,
                                    "height": 160
                                }
                            },
                            {
                                "id": "3:3",
                                "name": "Conversion Card",
                                "type": "FRAME", 
                                "absoluteBoundingBox": {
                                    "x": 620,
                                    "y": 120,
                                    "width": 280,
                                    "height": 160
                                }
                            },
                            {
                                "id": "3:4",
                                "name": "Growth Card",
                                "type": "FRAME",
                                "absoluteBoundingBox": {
                                    "x": 920,
                                    "y": 120,
                                    "width": 260,
                                    "height": 160
                                }
                            }
                        ]
                    },
                    {
                        "id": "2:3",
                        "name": "Charts Section",
                        "type": "FRAME",
                        "absoluteBoundingBox": {
                            "x": 0,
                            "y": 320,
                            "width": 1200,
                            "height": 400
                        },
                        "children": [
                            {
                                "id": "4:1",
                                "name": "Line Chart",
                                "type": "FRAME",
                                "absoluteBoundingBox": {
                                    "x": 20,
                                    "y": 340,
                                    "width": 580,
                                    "height": 360
                                }
                            },
                            {
                                "id": "4:2",
                                "name": "Pie Chart",
                                "type": "FRAME",
                                "absoluteBoundingBox": {
                                    "x": 620,
                                    "y": 340,
                                    "width": 560,
                                    "height": 360
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "styles": {
        "primary-color": "#2563eb",
        "secondary-color": "#64748b", 
        "success-color": "#10b981",
        "warning-color": "#f59e0b",
        "error-color": "#ef4444",
        "background-color": "#f8fafc",
        "text-primary": "#1e293b",
        "text-secondary": "#64748b"
    }
}

# Mock design analysis result
mock_design_analysis = {
    "success": True,
    "design_file": {
        "file_key": "mock123",
        "name": "Dashboard Design",
        "last_modified": "2024-12-29T09:00:00.000Z"
    },
    "components": [
        {
            "id": "2:1",
            "name": "Header",
            "type": "navigation",
            "description": "Main navigation header with logo and user menu"
        },
        {
            "id": "3:1",
            "name": "KPICard", 
            "type": "data-display",
            "description": "Card component for displaying key performance indicators"
        },
        {
            "id": "4:1",
            "name": "LineChart",
            "type": "chart",
            "description": "Interactive line chart for time-series data"
        },
        {
            "id": "4:2", 
            "name": "PieChart",
            "type": "chart",
            "description": "Pie chart for categorical data visualization"
        }
    ],
    "design_tokens": {
        "colors": {
            "primary": "#2563eb",
            "secondary": "#64748b",
            "success": "#10b981", 
            "warning": "#f59e0b",
            "error": "#ef4444",
            "background": "#f8fafc",
            "textPrimary": "#1e293b",
            "textSecondary": "#64748b"
        },
        "spacing": {
            "xs": "4px",
            "sm": "8px", 
            "md": "16px",
            "lg": "24px",
            "xl": "32px"
        },
        "typography": {
            "fontFamily": "Inter, sans-serif",
            "fontSize": {
                "sm": "14px",
                "md": "16px", 
                "lg": "18px",
                "xl": "24px"
            }
        }
    },
    "layout": {
        "type": "dashboard",
        "sections": ["header", "kpi-cards", "charts"],
        "responsive": True,
        "grid_system": "12-column"
    }
}