# n8n-nodes-onebot-api

这是一个 n8n 社区节点。它允许您在 n8n 工作流中使用 OneBot v11。

[OneBot 标准](https://11.onebot.dev) 是从原 CKYU 平台的 CQHTTP 插件接口修改而来的通用聊天机器人应用接口标准。

[n8n](https://n8n.io/) 是一个 [fair-code 许可证](https://docs.n8n.io/reference/license/) 的工作流自动化平台。

[安装](#安装)
[操作](#操作)
[凭据](#凭据)
[兼容性](#兼容性)
[使用方法](#使用方法)
[资源](#资源)

## 安装

请按照 [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/installation/) 中的 [安装指南](https://docs.n8n.io/integrations/community-nodes/installation/) 进行安装。

## 操作

### 机器人(Bot)
- 获取登录信息

### 好友(Friend)
- 获取好友列表
- 获取陌生人信息
- 发送点赞
- 发送戳一戳

### 群聊(Group)
- 获取群信息
- 获取群列表
- 获取群成员信息
- 获取群成员列表
- 踢人
- 退群
- 全体禁言
- 禁言用户
- 发送戳一戳
- 群打卡
- 设置群管理员
- 群签到

### 消息(Message)
- 发送私信
- 发送群消息
- 转发消息模式（多消息）

### 关系(Relationship)
- 删除好友
- 删除好友时临时拉黑
- 双向删除好友（同时从对方列表中移除）

### 其他(Other)
- 获取状态
- 获取版本信息

## 凭据

需要 OneBot API 的访问令牌用于身份验证。

## 兼容性

go-cqhttp v1.1.0
napcat

## 使用方法

该节点提供了一个用户友好的界面来与 OneBot API 端点交互。使用步骤：
1. 使用 OneBot API 访问令牌配置您的凭据
2. 选择所需的资源和操作
3. 填写必填参数
4. 运行您的工作流

有关详细的使用说明和示例，请参考 [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/)。

## 资源

* [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
* [OneBot v11](https://11.onebot.dev/)
* [go-cqhttp](https://docs.go-cqhttp.org/)
