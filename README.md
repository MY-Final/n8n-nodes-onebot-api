# n8n-nodes-onebot

![npm](https://img.shields.io/npm/v/n8n-nodes-onebot-api)
![license](https://img.shields.io/npm/l/n8n-nodes-onebot-api)

> **n8n 社区节点**：通过 [OneBot v11 标准 API](https://11.onebot.dev) 与 QQ 机器人集成，实现自动化工作流与聊天机器人的交互。

---

## 安装

### 在 n8n 中安装

1. 打开 n8n
2. 前往 **Community Nodes**
3. 搜索并安装 `n8n-nodes-onebot-api`

📖 **参考文档**：

* [n8n 社区节点安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)

---

## 功能概览

### 机器人操作

* `get_login_info`：获取当前登录状态信息

### 好友操作

* `get_friend_list`：获取好友列表
* `get_stranger_info`：获取陌生人信息
* `send_like`：发送好友赞
* `send_friend_poke`：私聊戳一戳

### 群组操作

* `get_group_list`：获取群列表
* `get_group_info`：获取群详细信息
* `get_group_member_list`：获取群成员列表
* `get_group_member_info`：获取群成员信息
* `set_group_kick`：踢出群成员
* `set_group_ban`：禁言群成员
* `set_group_whole_ban`：全员禁言
* `set_group_name`：设置群名称
* `set_group_admin`：设置或取消管理员权限
* `group_poke`：群内戳一戳
* `set_group_sign`：设置群签到

### 成员关系操作

* `set_group_leave`：退出群聊
* `delete_friend`：删除好友
* `batch_operation`：批量退群和删除好友（支持白名单）
* `random_delete_friends`：随机删除好友（支持白名单）

### 消息操作

* `send_private_msg`：发送私聊消息
* `send_group_msg`：发送群消息

**功能亮点**：

* 支持发送图片（网络图片、本地图片、Base64 编码）
* 支持 @全体成员 或 @特定成员
* 支持合并转发消息模式发送多条消息
* 多输入时自动合并为转发消息

### 其他操作

* `get_status`：获取节点状态
* `get_version_info`：获取版本信息

---

## 功能分类表

| 分类  | 操作代码                                                                                                                                                                                                                | 描述          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 机器人 | `get_login_info`                                                                                                                                                                                                    | 获取当前登录状态信息  |
| 好友  | `get_friend_list`, `get_stranger_info`, `send_like`, `send_friend_poke`                                                                                                                                             | 好友管理、点赞与戳一戳 |
| 群组  | `get_group_list`, `get_group_info`, `get_group_member_list`, `get_group_member_info`, `set_group_kick`, `set_group_ban`, `set_group_whole_ban`, `set_group_name`, `set_group_admin`, `group_poke`, `set_group_sign` | 群组查询与管理     |
| 成员关系 | `set_group_leave`, `delete_friend`, `batch_operation`, `random_delete_friends`                                                                                                                                      | 退群、删除好友与批量操作 |
| 消息  | `send_private_msg`, `send_group_msg`                                                                                                                                                                                | 私聊／群消息推送    |
| 其他  | `get_status`, `get_version_info`                                                                                                                                                                                    | 节点状态与版本信息查询 |

---

## 凭证配置

使用前请在 n8n 中配置以下凭证：

* **Access Token**：访问令牌
* **API Base URL**：例如 `http://localhost:5678`

⚠️ 请确保机器人服务已启动，并确保 Token 与 URL 设置正确，否则 API 无法调用。

---

## 兼容性

本节点已在以下 OneBot 实现中测试通过：

* [NapCatQQ](https://napneko.github.io)

---

## 使用示例

### 示例 1：发送群消息

1. 添加 **OneBot** 节点
2. 设置资源为 `消息`
3. 操作选择 `发送群消息`
4. 填写目标群号与消息内容
5. 可选：添加图片或 @成员
6. 运行工作流

### 示例 2：发送转发消息

1. 添加 **OneBot** 节点
2. 设置资源为 `消息`
3. 操作选择 `发送群消息` 或 `发送私聊消息`
4. 启用 `转发模式`
5. 添加多条转发消息并配置转发设置
6. 执行工作流

### 示例 3：群组管理

1. 添加 **OneBot** 节点
2. 设置资源为 `群组`
3. 选择操作（如 `全员禁言`）
4. 填写群号与相关参数
5. 执行工作流

### 示例 4：批量操作

1. 添加 **OneBot** 节点
2. 设置资源为 `成员关系`
3. 选择操作 `批量操作`
4. 选择操作模式（退群、删好友或两者都执行）
5. 启用白名单并选择要保留的群聊/好友
6. 执行工作流

### 示例 5：随机删除好友

1. 添加 **OneBot** 节点
2. 设置资源为 `成员关系`
3. 选择操作 `随机删除好友`
4. 设置最大删除数量（如5）
5. 启用白名单并选择要保留的好友
6. 执行工作流

💡 **提示**：执行群管理操作前，机器人需具备群管理员权限。

---

## 参考资源

* [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
* [OneBot v11 标准文档](https://11.onebot.dev)
* [go-cqhttp 使用手册](https://docs.go-cqhttp.org)
* [NapCatQQ 文档](https://napneko.github.io/)

---
