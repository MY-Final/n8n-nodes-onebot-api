# n8n-nodes-onebot-plus

适用于 n8n 的 OneBot v11 社区节点包。

本包可让 n8n 工作流通过 OneBot HTTP API 控制 QQ 机器人，支持消息发送、群管理、群文件管理、AI Agent 工具节点，以及 HTTP 事件回调 Trigger。

[![npm](https://img.shields.io/npm/v/n8n-nodes-onebot-plus)](https://www.npmjs.com/package/n8n-nodes-onebot-plus)
[![GitHub](https://img.shields.io/github/license/MY-Final/n8n-nodes-onebot-api)](https://github.com/MY-Final/n8n-nodes-onebot-api)

## 目录

- [特性](#特性)
- [安装](#安装)
- [节点清单](#节点清单)
- [支持的操作](#支持的操作)
- [批量能力（重点）](#批量能力重点)
- [OneBot Trigger（HTTP 事件上报）](#onebot-triggerhttp-事件上报)
- [凭证配置](#凭证配置)
- [兼容性](#兼容性)
- [开发命令](#开发命令)
- [相关资源](#相关资源)

## 特性

- 完整的 OneBot 主节点（Resource + Operation 模式）
- 新增 `OneBot Trigger`，支持 HTTP 事件回调
- 完整群文件能力（上传/获取/移动/重命名/删除）
- AI Agent 友好节点（发送消息、群管理、只读工具）
- 多个高频操作已统一支持单选 + 多选
- 支持 Access Token 鉴权

## 安装

```bash
npm install n8n-nodes-onebot-plus
```

也可以通过 n8n 的 Community Nodes 界面安装。

## 节点清单

- `OneBot`（主节点，覆盖大部分操作）
- `OneBot Trigger`（HTTP 事件回调触发）
- `Send QQ Message`（AI 友好消息节点）
- `QQ Group Management`（AI 友好群管理节点）
- `OneBot AI Tools`（只读查询工具节点）

## 支持的操作

### Bot

- 获取登录信息（Get Login Info）

### Friend

- 获取好友列表（Get Friend List）
- 获取陌生人信息（Get Stranger Info）
- 发送点赞（Send Like）
- 发送戳一戳（Send Poke）

### Group

- 获取群信息（Get Group Info）
- 获取群列表（Get Group List）
- 获取群成员信息（Get Group Member Info）
- 获取群成员列表（Get Group Member List）
- 禁言用户（Mute User）
- 全体禁言（Mute All）
- 踢人（Kick User）
- 退群（Leave Group）
- 设置管理员（Set Admin）
- 发送戳一戳（Send Poke）
- 群打卡（Group Sign）
- 上传群文件（Upload Group File）

### Files

- 上传群文件（Upload Group File）
- 获取根目录文件（Get Group Root Files）
- 获取子目录文件（Get Group Files By Folder）
- 获取群文件系统信息（Get Group File System Info）
- 获取文件信息（Get File Info）
- 创建群文件夹（Create Group File Folder）
- 删除群文件（Delete Group File）
- 删除群文件夹（Delete Group Folder）
- 移动群文件（Move Group File）
- 重命名群文件（Rename Group File）

### Relationship

- 删除好友（Delete Friend）
- 可选临时拉黑（temp_block）
- 可选双向删除（temp_both_del）

### Other

- 获取状态（Get Status）
- 获取版本信息（Get Version Info）

## 批量能力（重点）

当前已实现“单选 + 多选同构”的主要操作：

- `delete_friend`：支持 `user_ids` 多选
- `group_leave`：支持 `group_ids` 多选
- `set_group_admin`：支持 `user_ids` 多选
- `send_like`：支持 `user_ids` 多选
- `send_poke`（好友/群）：支持 `user_ids` 多选
- `mute_user` / `kick_user`：支持 `user_ids` 多选

批量执行时会继续处理后续目标，并返回聚合结果（如 `total`、`success`、`failed` 及逐项结果）。

## OneBot Trigger（HTTP 事件上报）

`OneBot Trigger` 用于接收 OneBot 的 HTTP POST 事件回调。

### 能力说明

- 接收 OneBot 事件上报
- 按 `post_type` 过滤触发（`message` / `notice` / `request` / `meta_event`）
- 可选 Token 校验：
  - `x-onebot-token`
  - `Authorization: Bearer <token>`
- 输出标准化字段，并可附带原始事件 payload

### 快速配置

1. 在 n8n 中添加并激活 `OneBot Trigger`
2. 复制 webhook URL
3. 在 OneBot 实现（如 NapCat/go-cqhttp）中配置事件上报地址为该 URL
4. 如启用 Token 校验，确保两端 Token 一致

## 凭证配置

在 n8n 中创建 `OneBot API` 凭证并填写：

- Server URL（示例：`http://127.0.0.1:5700`）
- Access Token（若 OneBot 侧启用）

凭证已包含请求头认证与连通性测试。

## 兼容性

面向 OneBot v11 实现，常见可用：

- go-cqhttp
- NapCat
- Lagrange.Core
- LLBot
- 其他兼容 OneBot v11 的实现

## 开发命令

```bash
npm install
npm run format
npm run lint
npm run build
```

其他常用命令：

- `npm run dev`
- `npm run lint:fix`
- `npm run build:watch`

## 相关资源

- [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
- [OneBot v11 文档](https://11.onebot.dev/)
- [go-cqhttp 文档](https://docs.go-cqhttp.org/)
- [NapCat 文档](https://napcat.dev/)
- [GitHub 仓库](https://github.com/MY-Final/n8n-nodes-onebot-api)
- [npm 包](https://www.npmjs.com/package/n8n-nodes-onebot-plus)
- [AI 工具节点说明](./README.AI-TOOLS.md)

## License

MIT
