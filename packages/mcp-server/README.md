# @b10cks/mcp-server

MCP server for interacting with the b10cks Management API.

## Installation

```sh
pnpm add @b10cks/mcp-server
```

## Configuration

The server runs over stdio and reads Management API configuration from environment variables:

```sh
B10CKS_MGMT_BASE_URL="https://api.example.com"
B10CKS_MGMT_TOKEN="..."
```

Optional:

```sh
B10CKS_MGMT_TIMEOUT="30000"
```

## Usage

```json
{
  "mcpServers": {
    "b10cks": {
      "command": "b10cks-mcp-server",
      "env": {
        "B10CKS_MGMT_BASE_URL": "https://api.example.com",
        "B10CKS_MGMT_TOKEN": "..."
      }
    }
  }
}
```

The server exposes:

- `b10cks_mgmt_operations`: Lists supported Management API operations.
- `b10cks_mgmt_call`: Executes an operation with `spaceId`, `id`, `params`, `payload`, and other IDs depending on the operation.

Example tool arguments:

```json
{
  "operation": "contents.list",
  "spaceId": "space-id",
  "params": {
    "page": 1,
    "per_page": 20
  }
}
```
