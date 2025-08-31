"""
Git Manager for Open-Deep-Coder

Handles Git repository operations including authentication, cloning, committing, and pushing.
"""

import os
import subprocess
import json
import asyncio
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class GitManager:
    """Manages Git operations for repositories"""

    def __init__(self):
        self.authenticated = False
        self.username: Optional[str] = None
        self.token: Optional[str] = None
        self.email: Optional[str] = None
        self.is_initialized = False

    async def initialize(self):
        """Initialize Git manager"""
        logger.info("Initializing Git Manager...")
        self.is_initialized = True
        logger.info("Git Manager initialized")

    def is_ready(self) -> bool:
        """Check if Git manager is ready"""
        return self.is_initialized

    async def authenticate(self, username: str, token: str, email: str) -> Dict[str, Any]:
        """Authenticate with Git credentials"""
        try:
            self.username = username
            self.token = token
            self.email = email

            # Test authentication by trying to access user info
            result = await self._run_git_command(["config", "--global", "user.name", username])
            if result["success"]:
                await self._run_git_command(["config", "--global", "user.email", email])
                self.authenticated = True
                logger.info(f"Git authentication successful for user: {username}")
                return {"success": True, "message": "Authentication successful"}
            else:
                return {"success": False, "message": "Authentication failed"}

        except Exception as e:
            logger.error(f"Git authentication error: {e}")
            return {"success": False, "message": str(e)}

    async def create_repository(self, name: str, description: str = "", private: bool = False) -> Dict[str, Any]:
        """Create a new repository on GitHub"""
        if not self.authenticated or not self.token:
            return {"success": False, "message": "Not authenticated"}

        try:
            import httpx

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.github.com/user/repos",
                    json={
                        "name": name,
                        "description": description,
                        "private": private
                    },
                    headers={
                        "Authorization": f"token {self.token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )

                if response.status_code == 201:
                    repo_data = response.json()
                    return {
                        "success": True,
                        "repository": {
                            "name": repo_data["name"],
                            "url": repo_data["html_url"],
                            "clone_url": repo_data["clone_url"],
                            "ssh_url": repo_data["ssh_url"]
                        }
                    }
                else:
                    return {"success": False, "message": f"Failed to create repository: {response.text}"}

        except Exception as e:
            logger.error(f"Error creating repository: {e}")
            return {"success": False, "message": str(e)}

    async def clone_repository(self, repo_url: str, local_path: str) -> Dict[str, Any]:
        """Clone a repository to local path"""
        try:
            # Ensure local directory exists
            Path(local_path).parent.mkdir(parents=True, exist_ok=True)

            # Clone the repository
            if self.token and self.username:
                # Use token authentication for HTTPS URLs
                auth_url = repo_url.replace("https://", f"https://{self.username}:{self.token}@")
                result = await self._run_git_command(["clone", auth_url, local_path])
            else:
                result = await self._run_git_command(["clone", repo_url, local_path])

            if result["success"]:
                return {"success": True, "message": "Repository cloned successfully", "path": local_path}
            else:
                return {"success": False, "message": result["error"]}

        except Exception as e:
            logger.error(f"Error cloning repository: {e}")
            return {"success": False, "message": str(e)}

    async def init_repository(self, local_path: str, repo_name: str) -> Dict[str, Any]:
        """Initialize a new local repository and optionally create remote"""
        try:
            # Initialize git repository
            result = await self._run_git_command(["init"], cwd=local_path)
            if not result["success"]:
                return {"success": False, "message": result["error"]}

            # Create initial commit
            await self._run_git_command(["add", "."], cwd=local_path)
            await self._run_git_command(["commit", "-m", "Initial commit"], cwd=local_path)

            # Create remote repository if authenticated
            if self.authenticated:
                create_result = await self.create_repository(repo_name)
                if create_result["success"]:
                    # Add remote
                    remote_url = create_result["repository"]["clone_url"]
                    if self.token and self.username:
                        remote_url = remote_url.replace("https://", f"https://{self.username}:{self.token}@")

                    await self._run_git_command(["remote", "add", "origin", remote_url], cwd=local_path)
                    await self._run_git_command(["push", "-u", "origin", "main"], cwd=local_path)

                    return {
                        "success": True,
                        "message": "Repository initialized and pushed to remote",
                        "repository": create_result["repository"]
                    }

            return {"success": True, "message": "Local repository initialized"}

        except Exception as e:
            logger.error(f"Error initializing repository: {e}")
            return {"success": False, "message": str(e)}

    async def get_status(self, repo_path: str) -> Dict[str, Any]:
        """Get git status for a repository"""
        try:
            result = await self._run_git_command(["status", "--porcelain"], cwd=repo_path)
            if result["success"]:
                lines = result["output"].strip().split('\n') if result["output"].strip() else []
                return {
                    "success": True,
                    "status": {
                        "modified": [line[3:] for line in lines if line.startswith(' M ') or line.startswith('M ')],
                        "added": [line[3:] for line in lines if line.startswith('A ') or line.startswith(' A')],
                        "deleted": [line[3:] for line in lines if line.startswith('D ') or line.startswith(' D')],
                        "untracked": [line[3:] for line in lines if line.startswith('?? ')],
                        "staged": [line[3:] for line in lines if line.startswith('A ') or line.startswith('M ') or line.startswith('D ')]
                    }
                }
            else:
                return {"success": False, "message": result["error"]}

        except Exception as e:
            logger.error(f"Error getting git status: {e}")
            return {"success": False, "message": str(e)}

    async def commit_changes(self, repo_path: str, message: str, files: List[str] = None) -> Dict[str, Any]:
        """Commit changes to repository"""
        try:
            # Add files
            if files:
                for file in files:
                    await self._run_git_command(["add", file], cwd=repo_path)
            else:
                await self._run_git_command(["add", "."], cwd=repo_path)

            # Commit
            result = await self._run_git_command(["commit", "-m", message], cwd=repo_path)
            if result["success"]:
                return {"success": True, "message": "Changes committed successfully"}
            else:
                return {"success": False, "message": result["error"]}

        except Exception as e:
            logger.error(f"Error committing changes: {e}")
            return {"success": False, "message": str(e)}

    async def push_changes(self, repo_path: str, branch: str = "main") -> Dict[str, Any]:
        """Push changes to remote repository"""
        try:
            result = await self._run_git_command(["push", "origin", branch], cwd=repo_path)
            if result["success"]:
                return {"success": True, "message": "Changes pushed successfully"}
            else:
                return {"success": False, "message": result["error"]}

        except Exception as e:
            logger.error(f"Error pushing changes: {e}")
            return {"success": False, "message": str(e)}

    async def pull_changes(self, repo_path: str, branch: str = "main") -> Dict[str, Any]:
        """Pull changes from remote repository"""
        try:
            result = await self._run_git_command(["pull", "origin", branch], cwd=repo_path)
            if result["success"]:
                return {"success": True, "message": "Changes pulled successfully"}
            else:
                return {"success": False, "message": result["error"]}

        except Exception as e:
            logger.error(f"Error pulling changes: {e}")
            return {"success": False, "message": str(e)}

    async def _run_git_command(self, args: List[str], cwd: str = None) -> Dict[str, Any]:
        """Run a git command and return result"""
        try:
            env = os.environ.copy()
            # Set git credentials if available
            if self.username and self.token:
                env["GIT_USERNAME"] = self.username
                env["GIT_PASSWORD"] = self.token

            process = await asyncio.create_subprocess_exec(
                "git", *args,
                cwd=cwd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                return {
                    "success": True,
                    "output": stdout.decode().strip(),
                    "error": stderr.decode().strip()
                }
            else:
                return {
                    "success": False,
                    "output": stdout.decode().strip(),
                    "error": stderr.decode().strip()
                }

        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e)
            }