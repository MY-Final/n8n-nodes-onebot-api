# n8n-nodes-onebot-plus

Powerful OneBot v11 nodes for n8n workflows.

This package lets n8n talk to QQ bots through OneBot HTTP API, including message sending, group management, group files, AI-tool friendly nodes, and now HTTP callback trigger events.

[![npm](https://img.shields.io/npm/v/n8n-nodes-onebot-plus)](https://www.npmjs.com/package/n8n-nodes-onebot-plus)
[![GitHub](https://img.shields.io/github/license/MY-Final/n8n-nodes-onebot-api)](https://github.com/MY-Final/n8n-nodes-onebot-api)

## Contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Node List](#node-list)
- [Supported Operations](#supported-operations)
- [Batch Capability](#batch-capability)
- [OneBot Trigger (HTTP Callback)](#onebot-trigger-http-callback)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Development](#development)
- [Resources](#resources)

## Highlights

- Full OneBot v11 workflow node (resource + operation model)
- OneBot Trigger node for HTTP event callbacks
- Group file management (upload/list/move/rename/delete)
- AI Agent friendly tool nodes
- Batch operations for high-frequency actions
- Access token verification support

## Installation

```bash
npm install n8n-nodes-onebot-plus
```

Or install from n8n Community Nodes UI.

## Node List

- `OneBot` (main all-in-one node)
- `OneBot Trigger` (receive HTTP callback events)
- `Send QQ Message` (AI-friendly message tool)
- `QQ Group Management` (AI-friendly group tool)
- `OneBot AI Tools` (query-only tools)

## Supported Operations

### Bot

- Get Login Info

### Friend

- Get Friend List
- Get Stranger Info
- Send Like
- Send Poke

### Group

- Get Group Info
- Get Group List
- Get Group Member Info
- Get Group Member List
- Mute User
- Mute All
- Kick User
- Leave Group
- Set Admin
- Send Poke
- Group Sign
- Upload Group File

### Files

- Upload Group File
- Get Group Root Files
- Get Group Files By Folder
- Get Group File System Info
- Get File Info
- Create Group File Folder
- Delete Group File
- Delete Group Folder
- Move Group File
- Rename Group File

### Relationship

- Delete Friend
- Optional temp block
- Optional both-side delete

### Other

- Get Status
- Get Version Info

## Batch Capability

The package now supports single + multi target in a consistent pattern.

- `delete_friend`: supports `user_ids` multi-select (with summary output)
- `group_leave`: supports `group_ids` multi-select (continue on partial failure)
- `set_group_admin`: supports `user_ids` multi-select
- `send_like`: supports `user_ids` multi-select
- `send_poke` (friend/group): supports `user_ids` multi-select
- `mute_user` / `kick_user`: supports `user_ids` multi-select

Batch actions process all targets and return aggregate fields like `total`, `success`, `failed`, and per-target details.

## OneBot Trigger (HTTP Callback)

`OneBot Trigger` is designed for OneBot event push over HTTP.

### What it does

- Receives `POST` callback payloads
- Filters by event `post_type` (`message`, `notice`, `request`, `meta_event`)
- Optional token verification:
  - `x-onebot-token`
  - `Authorization: Bearer <token>`
- Outputs normalized fields and optional raw payload

### Quick setup

1. Add `OneBot Trigger` to a workflow and activate it
2. Copy the webhook URL
3. Configure your OneBot implementation to push events to this URL
4. (Optional) Enable token verification and set the same token on both sides

## Credentials

Create `OneBot API` credentials in n8n:

- Server URL (example: `http://127.0.0.1:5700`)
- Access Token (if enabled on your OneBot implementation)

The credential includes authentication headers and a connection test request.

## Compatibility

Tested/targeted OneBot v11 implementations:

- go-cqhttp
- NapCat
- Lagrange.Core
- LLBot
- Other OneBot v11 compatible servers

## Development

```bash
npm install
npm run format
npm run lint
npm run build
```

Other useful commands:

- `npm run dev`
- `npm run lint:fix`
- `npm run build:watch`

## Resources

- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)
- [OneBot v11 docs](https://11.onebot.dev/)
- [go-cqhttp docs](https://docs.go-cqhttp.org/)
- [NapCat docs](https://napcat.dev/)
- [GitHub Repository](https://github.com/MY-Final/n8n-nodes-onebot-api)
- [npm Package](https://www.npmjs.com/package/n8n-nodes-onebot-plus)
- [AI tools guide](./README.AI-TOOLS.md)

## License

MIT
