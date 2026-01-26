"""Client factory for creating real or mock integration clients."""

from src.config import settings
from src.utils.logging import get_logger

logger = get_logger(__name__)


def _should_mock_ado() -> bool:
    """Determine if ADO should use mock client."""
    if settings.mock_ado is not None:
        return settings.mock_ado
    return settings.mock_mode


def _should_mock_figma() -> bool:
    """Determine if Figma should use mock client."""
    if settings.mock_figma is not None:
        return settings.mock_figma
    return settings.mock_mode


def _should_mock_github() -> bool:
    """Determine if GitHub should use mock client."""
    if settings.mock_github is not None:
        return settings.mock_github
    return settings.mock_mode


def create_azure_devops_client():
    """Create Azure DevOps client (real or mock based on configuration)."""
    if _should_mock_ado():
        logger.info("Creating Mock Azure DevOps Client")
        from src.integrations.mock_clients import MockAzureDevOpsClient
        return MockAzureDevOpsClient()
    logger.info("Creating Real Azure DevOps Client")
    from src.integrations.azure_devops_client import AzureDevOpsClient
    return AzureDevOpsClient()


def create_figma_client():
    """Create Figma client (real or mock based on configuration)."""
    if _should_mock_figma():
        logger.info("Creating Mock Figma Client")
        from src.integrations.mock_clients import MockFigmaClient
        return MockFigmaClient()
    logger.info("Creating Real Figma Client")
    from src.integrations.figma_client import FigmaClient
    return FigmaClient()


def create_github_client():
    """Create GitHub client (real or mock based on configuration)."""
    if _should_mock_github():
        logger.info("Creating Mock GitHub Client")
        from src.integrations.mock_clients import MockGitHubClient
        return MockGitHubClient()
    logger.info("Creating Real GitHub Client")
    from src.integrations.github_client import GitHubClient
    return GitHubClient()


def create_gemini_client():
    """Create Gemini client (always real - required for AI generation)."""
    logger.info("Creating Real Gemini Client")
    from src.integrations.gemini_client import GeminiClient
    return GeminiClient()


def create_figma_vision_client(gemini):
    """Create Figma Vision client."""
    logger.info("Creating Figma Vision Client")
    from src.integrations.vision_client import FigmaVisionClient
    return FigmaVisionClient(gemini)


# Global client instances
ado_client = None
figma_client = None
github_client = None
gemini_client = None
figma_vision_client = None


def initialize_clients():
    """Initialize all integration clients."""
    global ado_client, figma_client, github_client, gemini_client, figma_vision_client
    
    logger.info("Initializing integration clients", mock_mode=settings.mock_mode)
    
    ado_client = create_azure_devops_client()
    figma_client = create_figma_client()
    github_client = create_github_client()
    gemini_client = create_gemini_client()
    figma_vision_client = create_figma_vision_client(gemini_client)
    
    logger.info("All integration clients initialized successfully")


async def close_clients():
    """Close all integration clients."""
    global ado_client, figma_client, github_client, gemini_client
    
    logger.info("Closing integration clients")
    
    if ado_client:
        await ado_client.close()
    if figma_client:
        await figma_client.close()
    if github_client:
        await github_client.close()
    if gemini_client:
        await gemini_client.close()
    
    logger.info("All integration clients closed")


def get_ado_client():
    """Get Azure DevOps client instance."""
    if ado_client is None:
        raise RuntimeError("ADO client not initialized. Call initialize_clients() first.")
    return ado_client


def get_figma_client():
    """Get Figma client instance."""
    if figma_client is None:
        raise RuntimeError("Figma client not initialized. Call initialize_clients() first.")
    return figma_client


def get_github_client():
    """Get GitHub client instance."""
    if github_client is None:
        raise RuntimeError("GitHub client not initialized. Call initialize_clients() first.")
    return github_client


def get_gemini_client():
    """Get Gemini client instance."""
    if gemini_client is None:
        raise RuntimeError("Gemini client not initialized. Call initialize_clients() first.")
    return gemini_client


def get_figma_vision_client():
    """Get Figma Vision client instance."""
    if figma_vision_client is None:
        raise RuntimeError("Figma Vision client not initialized. Call initialize_clients() first.")
    return figma_vision_client