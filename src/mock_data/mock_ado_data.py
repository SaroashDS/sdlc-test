"""Mock Azure DevOps story data for testing."""

from datetime import datetime
from src.models.story_model import ADOStory, StoryState, StoryType, AcceptanceCriteria, StoryLinks, StoryAssignment, StoryMetadata

# Mock Azure DevOps Story
mock_ado_story = {
    "id": 12345,
    "rev": 1,
    "url": "https://dev.azure.com/mock-org/mock-project/_workitems/edit/12345",
    "fields": {
        "System.Id": 12345,
        "System.Title": "Create User Dashboard with Analytics",
        "System.Description": """
        <div>
        <h3>User Story</h3>
        <p>As a business user, I want to view a comprehensive dashboard with analytics so that I can track key metrics and make data-driven decisions.</p>
        
        <h3>Description</h3>
        <p>Create a modern, responsive dashboard that displays:</p>
        <ul>
        <li>Key performance indicators (KPIs)</li>
        <li>Interactive charts and graphs</li>
        <li>Real-time data updates</li>
        <li>Filtering and date range selection</li>
        <li>Export functionality</li>
        </ul>
        
        <h3>Acceptance Criteria</h3>
        <ul>
        <li>Dashboard loads within 3 seconds</li>
        <li>Charts are interactive and responsive</li>
        <li>Data updates in real-time</li>
        <li>Users can filter by date range</li>
        <li>Export to PDF/Excel functionality works</li>
        <li>Mobile responsive design</li>
        <li>Accessible (WCAG 2.1 AA compliant)</li>
        </ul>
        
        <h3>Technical Requirements</h3>
        <ul>
        <li>Use React with TypeScript</li>
        <li>Implement with Chart.js or D3.js</li>
        <li>REST API integration</li>
        <li>Unit tests with 80%+ coverage</li>
        <li>Error handling and loading states</li>
        </ul>
        </div>
        """,
        "System.State": "New",
        "System.WorkItemType": "User Story",
        "System.AreaPath": "MockProject\\Frontend",
        "System.IterationPath": "MockProject\\Sprint 1",
        "System.AssignedTo": {
            "displayName": "John Developer",
            "uniqueName": "john.developer@company.com",
            "id": "user-123"
        },
        "System.CreatedBy": {
            "displayName": "Jane Product Owner",
            "uniqueName": "jane.po@company.com"
        },
        "System.CreatedDate": "2024-12-29T10:00:00.000Z",
        "System.ChangedDate": "2024-12-29T10:00:00.000Z",
        "Microsoft.VSTS.Common.Priority": 2,
        "Microsoft.VSTS.Common.Severity": "2 - High",
        "Microsoft.VSTS.Scheduling.StoryPoints": 8,
        "Custom.BusinessValue": "High",
        "Custom.RiskLevel": "Medium"
    },
    "relations": [
        {
            "rel": "Hyperlink",
            "url": "https://www.figma.com/file/mock123/Dashboard-Design",
            "attributes": {
                "comment": "UI/UX Design"
            }
        },
        {
            "rel": "Hyperlink", 
            "url": "https://github.com/mock-org/dashboard-app",
            "attributes": {
                "comment": "Repository"
            }
        }
    ]
}

# Mock story validation response
mock_story_validation = {
    "valid": True,
    "story_title": "Create User Dashboard with Analytics",
    "story_id": 12345,
    "has_acceptance_criteria": True,
    "has_figma_link": True,
    "has_github_link": True,
    "estimated_complexity": "Medium-High"
}