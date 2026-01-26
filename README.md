# MTN-SDLC

AI-Powered Software Development Lifecycle Automation

## Overview
This project automates the entire SDLC using AI agents:
- **Agent 1**: Requirement Gathering (ADO + Figma)
- **Agent 2**: Development (Code Generation)
- **Agent 3**: Testing & Debugging (Self-Healing)
- **Agent 4**: Deployment (GitHub PR)

## Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run the server
uvicorn src.main:app --reload --port 8008
```

## API
```
POST /api/v1/process-story
{
  "story_id": 12345,
  "force_reprocess": false
}
```

## Technologies
- Python/FastAPI
- Google Gemini AI
- Azure DevOps integration
- Figma API
- GitHub API