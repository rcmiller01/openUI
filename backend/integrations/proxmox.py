"""
Proxmox Manager for Open-Deep-Coder

Manages Proxmox VE containers and VMs for development environments,
allowing live editing of hosted code through container file access.
"""

import logging
import os
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class ContainerStatus(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    SUSPENDED = "suspended"


class VMStatus(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    SUSPENDED = "suspended"


@dataclass
class ProxmoxContainer:
    vmid: int
    name: str
    node: str
    status: ContainerStatus
    cpus: int
    memory: int
    disk: int
    ip_address: Optional[str] = None
    template: bool = False


@dataclass
class ProxmoxVM:
    vmid: int
    name: str
    node: str
    status: VMStatus
    cpus: int
    memory: int
    disk: int
    ip_address: Optional[str] = None
    template: bool = False


@dataclass
class ContainerFile:
    path: str
    name: str
    size: int
    modified: datetime
    is_directory: bool
    permissions: str


class ProxmoxManager:
    """Manager for Proxmox VE operations"""

    def __init__(self, host: str = "localhost", port: int = 8006,
                 username: str = "root@pam", password: Optional[str] = None):
        self.host = host
        self.port = port
        self.username = username
        self.password = password or os.getenv("PROXMOX_PASSWORD")
        self.base_url = f"https://{host}:{port}/api2/json"
        self.session: Optional[httpx.AsyncClient] = None
        self.ticket: Optional[str] = None
        self.csrf_token: Optional[str] = None
        self.is_initialized = False

    async def initialize(self) -> None:
        """Initialize the Proxmox manager"""
        try:
            self.session = httpx.AsyncClient(
                verify=False,  # Proxmox often uses self-signed certs
                timeout=30.0
            )
            await self._authenticate()
            self.is_initialized = True
            logger.info("Proxmox manager initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Proxmox manager: {e}")
            raise

    async def cleanup(self) -> None:
        """Cleanup resources"""
        if self.session:
            await self.session.aclose()
        self.is_initialized = False

    async def _authenticate(self) -> None:
        """Authenticate with Proxmox API"""
        if not self.password:
            raise ValueError("Proxmox password not provided")

        auth_data = {
            "username": self.username,
            "password": self.password
        }

        response = await self.session.post(
            f"{self.base_url}/access/ticket",
            data=auth_data
        )
        response.raise_for_status()

        data = response.json()["data"]
        self.ticket = data["ticket"]
        self.csrf_token = data["CSRFPreventionToken"]

        # Set auth cookie for future requests
        self.session.cookies.set(
            "PVEAuthCookie", self.ticket, domain=self.host
        )

    async def _make_request(
        self, method: str, endpoint: str, data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make authenticated request to Proxmox API"""
        if not self.session or not self.ticket:
            raise RuntimeError("Not authenticated with Proxmox")

        url = f"{self.base_url}{endpoint}"
        headers = (
            {"CSRFPreventionToken": self.csrf_token}
            if self.csrf_token else {}
        )

        response = await self.session.request(
            method, url, json=data, headers=headers
        )
        response.raise_for_status()
        return response.json()

    async def get_containers(self, node: str) -> List[ProxmoxContainer]:
        """Get all containers on a node"""
        try:
            data = await self._make_request("GET", f"/nodes/{node}/lxc")
            containers = []

            for item in data["data"]:
                # Get container config for IP address
                try:
                    config_data = await self._make_request(
                        "GET", f"/nodes/{node}/lxc/{item['vmid']}/config"
                    )
                    ip_address = None
                    if "net0" in config_data["data"]:
                        net_config = config_data["data"]["net0"]
                        if "ip=" in net_config:
                            ip_parts = net_config.split("ip=")[1].split(",")[0]
                            ip_address = ip_parts.split("/")[0]
                except Exception:
                    ip_address = None

                container = ProxmoxContainer(
                    vmid=item["vmid"],
                    name=item["name"],
                    node=node,
                    status=ContainerStatus(item["status"]),
                    cpus=item.get("cpus", 1),
                    memory=(
                        item.get("maxmem", 0) // (1024 * 1024)
                    ),  # Convert to MB
                    disk=(
                        item.get("maxdisk", 0) // (1024 * 1024 * 1024)
                    ),  # Convert to GB
                    ip_address=ip_address,
                    template=item.get("template", 0) == 1
                )
                containers.append(container)

            return containers
        except Exception as e:
            logger.error(f"Error getting containers: {e}")
            raise

    async def get_vms(self, node: str) -> List[ProxmoxVM]:
        """Get all VMs on a node"""
        try:
            data = await self._make_request("GET", f"/nodes/{node}/qemu")
            vms = []

            for item in data["data"]:
                vm = ProxmoxVM(
                    vmid=item["vmid"],
                    name=item["name"],
                    node=node,
                    status=VMStatus(item["status"]),
                    cpus=item.get("cpus", 1),
                    memory=(
                        item.get("maxmem", 0) // (1024 * 1024)
                    ),  # Convert to MB
                    disk=(
                        item.get("maxdisk", 0) // (1024 * 1024 * 1024)
                    ),  # Convert to GB
                    template=item.get("template", 0) == 1
                )
                vms.append(vm)

            return vms
        except Exception as e:
            logger.error(f"Error getting VMs: {e}")
            raise

    async def start_container(self, node: str, vmid: int) -> Dict[str, Any]:
        """Start a container"""
        try:
            return await self._make_request(
                "POST", f"/nodes/{node}/lxc/{vmid}/status/start"
            )
        except Exception as e:
            logger.error(f"Error starting container {vmid}: {e}")
            raise

    async def stop_container(self, node: str, vmid: int) -> Dict[str, Any]:
        """Stop a container"""
        try:
            return await self._make_request(
                "POST", f"/nodes/{node}/lxc/{vmid}/status/stop"
            )
        except Exception as e:
            logger.error(f"Error stopping container {vmid}: {e}")
            raise

    async def restart_container(self, node: str, vmid: int) -> Dict[str, Any]:
        """Restart a container"""
        try:
            return await self._make_request(
                "POST", f"/nodes/{node}/lxc/{vmid}/status/restart"
            )
        except Exception as e:
            logger.error(f"Error restarting container {vmid}: {e}")
            raise

    async def execute_in_container(
        self, node: str, vmid: int, command: str
    ) -> Dict[str, Any]:
        """Execute command in container"""
        try:
            data = {"command": command}
            return await self._make_request(
                "POST", f"/nodes/{node}/lxc/{vmid}/exec", data
            )
        except Exception as e:
            logger.error(f"Error executing command in container {vmid}: {e}")
            raise

    async def list_container_files(
        self, node: str, vmid: int, path: str = "/"
    ) -> List[ContainerFile]:
        """List files in container"""
        try:
            # Use agent exec to list files
            command = f"ls -la {path}"
            result = await self.execute_in_container(node, vmid, command)

            files = []
            # Parse ls output (simplified parsing)
            lines = result.get("data", "").split("\n")[1:]  # Skip header

            for line in lines:
                if not line.strip():
                    continue
                parts = line.split()
                if len(parts) < 8:
                    continue

                permissions = parts[0]
                size = int(parts[4]) if parts[4].isdigit() else 0
                modified_str = " ".join(parts[5:8])
                name = " ".join(parts[8:])

                # Parse modification time (simplified)
                try:
                    modified = datetime.strptime(modified_str, "%b %d %H:%M")
                    modified = modified.replace(year=datetime.now().year)
                except ValueError:
                    modified = datetime.now()

                is_directory = permissions.startswith("d")

                file_info = ContainerFile(
                    path=f"{path.rstrip('/')}/{name}",
                    name=name,
                    size=size,
                    modified=modified,
                    is_directory=is_directory,
                    permissions=permissions
                )
                files.append(file_info)

            return files
        except Exception as e:
            logger.error(f"Error listing files in container {vmid}: {e}")
            raise

    async def read_container_file(
        self, node: str, vmid: int, file_path: str
    ) -> str:
        """Read file content from container"""
        try:
            command = f"cat {file_path}"
            result = await self.execute_in_container(node, vmid, command)
            return str(result.get("data", ""))
        except Exception as e:
            logger.error(f"Error reading file {file_path} from container {vmid}: {e}")
            raise

    async def write_container_file(
        self, node: str, vmid: int, file_path: str, content: str
    ) -> Dict[str, Any]:
        """Write file content to container"""
        try:
            # Escape content for shell
            escaped_content = content.replace("'", "'\"'\"'")
            command = f"echo '{escaped_content}' > {file_path}"
            return await self.execute_in_container(node, vmid, command)
        except Exception as e:
            logger.error(f"Error writing file {file_path} to container {vmid}: {e}")
            raise

    async def get_container_status(
        self, node: str, vmid: int
    ) -> ContainerStatus:
        """Get container status"""
        try:
            data = await self._make_request(
                "GET", f"/nodes/{node}/lxc/{vmid}/status"
            )
            return ContainerStatus(data["data"]["status"])
        except Exception as e:
            logger.error(f"Error getting container {vmid} status: {e}")
            raise

    async def get_nodes(self) -> List[str]:
        """Get list of available nodes"""
        try:
            data = await self._make_request("GET", "/nodes")
            return [node["node"] for node in data["data"]]
        except Exception as e:
            logger.error(f"Error getting nodes: {e}")
            raise
