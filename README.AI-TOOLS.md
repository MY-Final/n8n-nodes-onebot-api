# OneBot AI Agent Tools 使用指南

## 🤖 AI Agent 完全接入指南

本节点包现已完全支持 n8n AI Agent 的 Tool 调用，AI 可以通过自然语言直接使用所有功能。

---

## 📦 可用的 Tool 节点

### 1. **SendQQMessage** - 发送 QQ 消息

**专用于 AI 调用的简化接口**

**功能描述:**

- 发送私聊或群聊消息
- 支持文本、CQ 码、消息段数组
- AI 友好的参数结构

**AI 使用示例:**

```
AI: "我会帮你在群里发送消息"
用户："在群 123456 发送'大家好'"
→ AI 自动调用 SendQQMessage Tool
```

**参数说明:**

- `messageType`: 消息类型（private/group）
- `userId`: 用户 QQ（私聊时必填）
- `groupId`: 群号（群聊时必填）
- `message`: 消息内容
- `autoEscape`: 是否纯文本发送

---

### 2. **QQGroupManagement** - QQ 群管理

**群管理操作专用接口**

**功能描述:**

- 禁言用户（支持时长设置）
- 全体禁言开关
- 踢出用户
- 设置管理员

**AI 使用示例:**

```
AI: "我来帮你禁言他"
用户："禁言群 123456 里的用户 789012，禁言 10 分钟"
→ AI 自动调用 QQGroupManagement Tool
```

**参数说明:**

- `action`: 操作类型（mute_user/mute_all/kick_user/set_admin）
- `groupId`: 群号
- `userId`: 用户 QQ（部分操作需要）
- `duration`: 禁言时长（秒）
- `enable`: 启用/禁用

---

### 3. **OneBot** - 完整功能节点

**支持所有 OneBot 操作的完整节点**

**可用操作分类:**

#### 消息相关

- Send Message - 发送消息（统一接口）
- Send Private Message - 私聊消息
- Send Group Message - 群消息

#### 群管理

- Mute User - 禁言用户
- Mute All - 全体禁言
- Kick User - 踢人
- Set Admin - 设置管理员
- Leave Group - 退群

#### 文件管理

- Upload Group File - 上传群文件
- Get Group Root Files - 获取根目录文件
- Get Group Files By Folder - 获取子目录文件
- Get Group File System Info - 获取文件系统信息
- Get File Info - 获取文件信息
- Create Group File Folder - 创建文件夹
- Delete Group File - 删除文件
- Delete Group Folder - 删除文件夹
- Move Group File - 移动文件
- Rename Group File - 重命名文件

#### 好友管理

- Get Friend List - 获取好友列表
- Send Like - 发送点赞
- Send Poke - 发送戳一戳
- Delete Friend - 删除好友

#### Bot 相关

- Get Login Info - 获取登录信息

#### 其他

- Get Status - 获取状态
- Get Version Info - 获取版本信息

---

## 🔧 在 n8n AI Agent 中使用

### 步骤 1: 创建 AI Agent

1. 在 n8n 中创建新的 Workflow
2. 添加 **AI Agent** 节点
3. 配置 LLM（OpenAI、Claude 等）

### 步骤 2: 添加 OneBot Tools

1. 在 AI Agent 节点的 "Tools" 部分
2. 点击 "Add Tool"
3. 选择以下任一节点：
   - **Send QQ Message** (推荐用于消息)
   - **QQ Group Management** (推荐用于群管)
   - **OneBot** (完整功能)

### 步骤 3: 配置凭证

1. 选择或创建 OneBot API 凭证
2. 配置 Server URL（如：`http://127.0.0.1:5700`）
3. 配置 Access Token（如有）

### 步骤 4: 测试 AI 调用

```
用户："在群里发个消息说大家好"
→ AI 自动识别意图
→ AI 调用 SendQQMessage Tool
→ 发送成功并返回结果
```

---

## 📝 AI 使用示例

### 示例 1：发送消息

```
用户："通知群里今天晚上 8 点开会"

AI Agent 处理:
1. 理解意图：发送群消息
2. 调用 Tool: SendQQMessage
3. 参数: {
   messageType: "group",
   groupId: "123456",
   message: "今天晚上 8 点开会"
}
4. 执行并返回结果
```

### 示例 2：群管理

```
用户："把群里那个捣乱的禁言 10 分钟"

AI Agent 处理:
1. 理解意图：禁言用户
2. 调用 Tool: QQGroupManagement
3. 参数: {
   action: "mute_user",
   groupId: "123456",
   userId: "789012",
   duration: 600
}
4. 执行并返回结果
```

### 示例 3：上传文件

```
用户："把这份文档传到群里"

AI Agent 处理:
1. 理解意图：上传群文件
2. 调用 Tool: OneBot (operation: upload_group_file)
3. 参数: {
   groupId: "123456",
   file: "/path/to/file.pdf",
   name: "文档.pdf"
}
4. 执行并返回结果
```

---

## 🎯 最佳实践

### 1. 使用专用 Tool 节点

- **消息发送** → SendQQMessage
- **群管理** → QQGroupManagement
- **其他功能** → OneBot

### 2. AI 友好的参数命名

所有参数都使用了 AI 容易理解的命名：

- `userId` 而不是 `user_id`
- `groupId` 而不是 `group_id`
- `messageType` 而不是 `message_type`

### 3. 详细的描述信息

每个 operation 都有详细的 description 和 action 描述，帮助 AI 理解功能。

---

## ⚠️ 注意事项

1. **凭证配置**: 确保 OneBot API 凭证正确配置
2. **权限要求**: 群管理操作需要机器人是管理员或群主
3. **参数验证**: AI 可能会生成错误的参数，建议添加数据验证节点
4. **错误处理**: 建议使用 continueOnFail 处理 AI 调用失败

---

## 📚 更多资源

- [OneBot 协议文档](https://github.com/botuniverse/onebot-11)
- [n8n AI Agent 文档](https://docs.n8n.io/advanced-usage/ai/overview/)
- [项目 GitHub](https://github.com/MY-Final/n8n-nodes-onebot-api)

---

**开发时间**: 2024
**版本**: 1.0.0
**作者**: Final
