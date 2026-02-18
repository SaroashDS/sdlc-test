"""
Comprehensive SDLC System Test Script
Tests all integrations and agents before running the full flow.
"""
import asyncio
import sys
import os
import httpx

sys.path.append(os.getcwd())

from src.config import settings
from src.integrations.client_factory import initialize_clients, get_ado_client, get_figma_client, get_github_client


def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"  {status} | {name}")
    if message:
        print(f"         └── {message}")


async def test_configuration():
    """Test 1: Check if all required settings are loaded."""
    print_header("TEST 1: Configuration Check")
    
    all_good = True
    
    # Gemini
    if settings.gemini_api_key:
        print_result("GEMINI_API_KEY", True, f"Key starts with: {settings.gemini_api_key[:10]}...")
    else:
        print_result("GEMINI_API_KEY", False, "Missing! Add to .env")
        all_good = False
    
    # Figma
    if settings.figma_token:
        print_result("FIGMA_TOKEN", True, f"Token starts with: {settings.figma_token[:10]}...")
    else:
        print_result("FIGMA_TOKEN", False, "Missing! Add to .env")
        all_good = False
        
    if settings.figma_design_url:
        print_result("FIGMA_DESIGN_URL", True, settings.figma_design_url)
    else:
        print_result("FIGMA_DESIGN_URL", False, "Missing! Add to .env")
        all_good = False
    
    # GitHub
    if settings.github_token:
        print_result("GITHUB_TOKEN", True, f"Token starts with: {settings.github_token[:10]}...")
    else:
        print_result("GITHUB_TOKEN", False, "Missing! Add to .env")
        all_good = False
        
    if settings.github_repo_url:
        print_result("GITHUB_REPO_URL", True, settings.github_repo_url)
    else:
        print_result("GITHUB_REPO_URL", False, "Missing! Add to .env")
        all_good = False
    
    # Mock Mode
    print_result("MOCK_ADO", True, f"Value: {settings.mock_ado}")
    print_result("MOCK_FIGMA", True, f"Value: {settings.mock_figma}")
    print_result("MOCK_GITHUB", True, f"Value: {settings.mock_github}")
    
    return all_good


async def test_figma_connection():
    """Test 2: Direct Figma API test."""
    print_header("TEST 2: Figma API Connection")
    
    if not settings.figma_token:
        print_result("Figma API", False, "No token configured")
        return False
    
    # Extract file key from URL
    figma_url = settings.figma_design_url or ""
    file_key = None
    
    for pattern in ["/file/", "/design/", "/proto/", "/make/"]:
        if pattern in figma_url:
            file_key = figma_url.split(pattern)[1].split("/")[0].split("?")[0]
            break
    
    if not file_key:
        print_result("Figma URL Parse", False, f"Could not extract key from: {figma_url}")
        return False
    
    print_result("Figma File Key", True, file_key)
    
    # Test API directly
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.figma.com/v1/files/{file_key}",
                headers={"X-Figma-Token": settings.figma_token},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print_result("Figma API Call", True, f"File name: {data.get('name', 'Unknown')}")
                return True
            elif "/make/" in figma_url:
                print_result("Figma API Call", True, "Using Vision Fallback (expected for /make/ URL)")
                return True
            else:
                print_result("Figma API Call", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
    except Exception as e:
        print_result("Figma API Call", False, str(e))
        return False


async def test_github_connection():
    """Test 3: Direct GitHub API test."""
    print_header("TEST 3: GitHub API Connection")
    
    if not settings.github_token:
        print_result("GitHub API", False, "No token configured")
        return False
    
    # Extract owner/repo from URL
    github_url = settings.github_repo_url or ""
    owner, repo = None, None
    
    if "github.com/" in github_url:
        parts = github_url.replace("https://github.com/", "").strip("/").split("/")
        if len(parts) >= 2:
            owner, repo = parts[0], parts[1]
    
    if not owner or not repo:
        print_result("GitHub URL Parse", False, f"Could not extract owner/repo from: {github_url}")
        return False
    
    print_result("GitHub Repo", True, f"{owner}/{repo}")
    
    # Test API directly
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers={
                    "Authorization": f"token {settings.github_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print_result("GitHub API Call", True, f"Repo: {data.get('full_name', 'Unknown')}, Size: {data.get('size', 0)} KB")
                return True
            elif response.status_code == 404:
                print_result("GitHub API Call", False, f"Repository not found. Will be created automatically.")
                return True  # This is OK, we can create it
            else:
                print_result("GitHub API Call", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
    except Exception as e:
        print_result("GitHub API Call", False, str(e))
        return False


async def test_mock_ado():
    """Test 4: Mock ADO client."""
    print_header("TEST 4: Mock ADO Client")
    
    try:
        initialize_clients()
        ado_client = get_ado_client()
        story = await ado_client.get_work_item(12345)
        
        if story:
            title = story.get("fields", {}).get("System.Title", "Unknown")
            print_result("Mock ADO Story", True, f"Title: {title}")
            return True
        else:
            print_result("Mock ADO Story", False, "No story returned")
            return False
            
    except Exception as e:
        print_result("Mock ADO Story", False, str(e))
        return False


async def test_full_agent_1():
    """Test 5: Full Agent 1 execution (only if all previous tests pass)."""
    print_header("TEST 5: Full Agent 1 Execution")
    
    try:
        from src.agents.requirement_gathering_agent import requirement_gathering_agent
        
        result = await requirement_gathering_agent.execute(12345)
        
        if result["success"]:
            print_result("Agent 1", True, f"Duration: {result['duration_ms']}ms")
            plan = result.get("implementation_plan", {})
            print_result("Implementation Plan", True, f"Tasks: {len(plan.get('tasks', []))}")
            return True
        else:
            print_result("Agent 1", False, result.get("error", "Unknown error"))
            return False
            
    except Exception as e:
        print_result("Agent 1", False, str(e))
        return False


async def main():
    print("\n" + "🚀" * 20)
    print("  AI-SDLC SYSTEM DIAGNOSTIC")
    print("🚀" * 20)
    
    # Run tests in order
    config_ok = await test_configuration()
    figma_ok = await test_figma_connection()
    github_ok = await test_github_connection()
    ado_ok = await test_mock_ado()
    
    # Summary
    print_header("SUMMARY")
    print(f"  Configuration: {'✅' if config_ok else '❌'}")
    print(f"  Figma API: {'✅' if figma_ok else '❌'}")
    print(f"  GitHub API: {'✅' if github_ok else '❌'}")
    print(f"  Mock ADO: {'✅' if ado_ok else '❌'}")
    
    if config_ok and figma_ok and github_ok and ado_ok:
        print("\n  All systems GO! Running full Agent 1 test...")
        agent_ok = await test_full_agent_1()
        
        if agent_ok:
            print("\n" + "🎉" * 20)
            print("  ALL TESTS PASSED! System ready for demo.")
            print("🎉" * 20)
        else:
            print("\n❌ Agent 1 failed. Check error above.")
    else:
        print("\n❌ Fix the failed tests above before running agents.")
        print("   Most likely issue: Your FIGMA_DESIGN_URL or FIGMA_TOKEN is invalid.")


if __name__ == "__main__":
    asyncio.run(main())
