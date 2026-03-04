# n8n-nodes-onebot-plus

🤖 **功能强大的 OneBot QQ 机器人 n8n 社区节点**

支持完整的 OneBot v11 协议，让 n8n 工作流可以控制 QQ 机器人。支持消息发送、群管理、文件上传、AI Agent 调用等功能。

[![npm](https://img.shields.io/npm/v/n8n-nodes-onebot-plus)](https://www.npmjs.com/package/n8n-nodes-onebot-plus)
[![GitHub](https://img.shields.io/github/license/MY-Final/n8n-nodes-onebot-api)](https://github.com/MY-Final/n8n-nodes-onebot-api)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[AI Agent 支持](#ai-agent-支持)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)

## ✨ 特性亮点

- 🚀 **完整的 OneBot v11 支持** - 覆盖所有常用 API
- 🤖 **AI Agent 完全兼容** - 支持 n8n AI Agent 的 Tool 调用
- 📁 **群文件管理** - 上传、下载、移动、删除群文件
- 👥 **群管理功能** - 禁言、踢人、设置管理员
- 💬 **消息发送** - 支持私聊、群聊、合并转发
- 🎨 **富媒体消息** - 支持图片、表情、文件等
- 🔒 **安全认证** - 支持 Access Token 认证

## Installation

```bash
npm install n8n-nodes-onebot-plus
```

或者通过 n8n 的社区节点管理界面安装。

## Operations

### 🤖 Bot (机器人)

- **Get Login Info** - 获取机器人登录信息

### 👥 Friend (好友)

- **Get Friend List** - 获取好友列表
- **Get Stranger Info** - 获取陌生人信息
- **Send Like** - 发送点赞
- **Send Poke** - 发送戳一戳
- **Delete Friend** - 删除好友

### 👨‍👩‍👧‍👦 Group (群聊)

- **Get Group Info** - 获取群信息
- **Get Group List** - 获取群列表
- **Get Group Member Info** - 获取群成员信息
- **Get Group Member List** - 获取群成员列表
- **Mute User** - 禁言用户
- **Mute All** - 全体禁言
- **Kick User** - 踢出用户
- **Leave Group** - 退出群聊
- **Set Admin** - 设置管理员
- **Send Poke** - 发送戳一戳
- **Group Sign** - 群打卡

### 📁 Files (群文件) 🆕

- **Upload Group File** - 上传群文件
- **Get Group Root Files** - 获取根目录文件列表
- **Get Group Files By Folder** - 获取子目录文件列表
- **Get Group File System Info** - 获取文件系统信息
- **Get File Info** - 获取文件信息
- **Create Group File Folder** - 创建文件夹
- **Delete Group File** - 删除文件
- **Delete Group Folder** - 删除文件夹
- **Move Group File** - 移动文件
- **Rename Group File** - 重命名文件

### 💬 Message (消息)

- **Send Message** - 发送消息（统一接口）
- **Send Private Message** - 发送私聊消息
- **Send Group Message** - 发送群消息
- **Forward Mode** - 合并转发（支持多发送者）

### 🔧 Other (其他)

- **Get Status** - 获取状态
- **Get Version Info** - 获取版本信息

## 🤖 AI Agent 支持

### 专用 Tool 节点

本节点包包含专为 AI Agent 设计的简化接口：

#### 1. Send QQ Message

用于发送 QQ 消息的简化节点，AI 友好的参数结构。

**参数：**

- `messageType`: 消息类型（private/group）
- `userId`: 用户 QQ（私聊时）
- `groupId`: 群号（群聊时）
- `message`: 消息内容
- `autoEscape`: 是否纯文本发送

#### 2. QQ Group Management

群管理专用节点，支持禁言、踢人、设置管理员等操作。

**参数：**

- `action`: 操作类型（mute_user/mute_all/kick_user/set_admin）
- `groupId`: 群号
- `userId`: 用户 QQ
- `duration`: 禁言时长（秒）
- `enable`: 启用/禁用

### 在 AI Agent 中使用

1. 创建 n8n AI Agent 节点
2. 配置 LLM（OpenAI、Claude 等）
3. 在 Tools 部分添加 OneBot 节点
4. 配置 OneBot API 凭证
5. 开始使用自然语言调用

**示例：**

```
用户："在群里发个消息说大家好"
→ AI 自动调用 SendQQMessage Tool
→ 发送成功
```

## Credentials

需要配置 OneBot API 的 Access Token 进行认证。

**配置步骤：**

1. 在 n8n 中创建新的 OneBot API 凭证
2. 输入 Server URL（如：`http://127.0.0.1:5700`）
3. 输入 Access Token（如果 OneBot 配置了）
4. 测试连接

## Compatibility

支持的 OneBot 实现：

- ✅ **go-cqhttp** v1.1.0+
- ✅ **NapCat** (NapCat-All)
- ✅ **Lagrange.Core**
- ✅ **LLBot**
- ✅ 其他兼容 OneBot v11 的实现

## Usage

### 基本使用

1. **配置凭证** - 设置 OneBot API 的 Access Token
2. **选择资源** - 选择要操作的资源类型（Bot、Friend、Group 等）
3. **选择操作** - 选择具体的操作
4. **填写参数** - 根据提示填写必要参数
5. **运行工作流**

### 示例工作流

#### 示例 1：自动回复

```
Webhook → OneBot (接收消息) → IF 判断 → OneBot (发送回复)
```

#### 示例 2：群管理自动化

```
定时触发 → OneBot (获取群成员) → 过滤 → OneBot (踢出不活跃成员)
```

#### 示例 3：文件自动上传

```
Google Drive (新文件) → OneBot (上传到群文件)
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [OneBot v11 协议文档](https://11.onebot.dev/)
- [go-cqhttp 文档](https://docs.go-cqhttp.org/)
- [NapCat 文档](https://napcat.dev/)
- [GitHub 仓库](https://github.com/MY-Final/n8n-nodes-onebot-api)
- [npm 包](https://www.npmjs.com/package/n8n-nodes-onebot-plus)
- [AI Agent 使用指南](./README.AI-TOOLS.md)

## 开发说明

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 代码规范

```bash
npm run lint
npm run format
```

## License

MIT License

---

**作者：** Final  
**邮箱：** mydj666@qq.com  
**GitHub：** [@MY-Final](https://github.com/MY-Final)
