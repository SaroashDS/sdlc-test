"""Configuration utilities and helpers."""

from src.config import settings
import structlog

logger = structlog.get_logger()


class SecretManager:
    """Helper class for accessing secrets from .env or GCP Secret Manager."""
    
    def __init__(self):
        self._gcp_client = None
    
    @property
    def gcp_client(self):
        """Lazy-load GCP client only when needed."""
        if self._gcp_client is None:
            from google.cloud import secretmanager
            self._gcp_client = secretmanager.SecretManagerServiceClient()
        return self._gcp_client
    
    def get_secret(self, secret_path: str) -> str:
        """Get secret value from GCP Secret Manager."""
        response = self.gcp_client.access_secret_version(name=secret_path)
        return response.payload.data.decode('UTF-8')
    
    def get_ado_pat(self) -> str:
        """Get Azure DevOps Personal Access Token."""
        return self.get_secret(settings.ado_pat_secret)
    
    def get_figma_token(self) -> str:
        """Get Figma API token. Checks .env first, then GCP."""
        if settings.figma_token:
            return settings.figma_token
        return self.get_secret(settings.figma_token_secret)
    
    def get_github_token(self) -> str:
        """Get GitHub token. Checks .env first, then GCP for app key."""
        if settings.github_token:
            return settings.github_token
        return self.get_secret(settings.github_app_key_secret)


# Global secret manager instance
secret_manager = SecretManager()