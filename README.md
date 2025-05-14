````markdown
# n8n-nodes-onebot

![npm](https://img.shields.io/npm/v/n8n-nodes-onebot-api) ![license](https://img.shields.io/npm/l/n8n-nodes-onebot-api)

> **n8n 社区节点**：通过 [OneBot v11 标准 API](https://11.onebot.dev) 与 QQ 机器人无缝对接，让自动化工作流支持聊天机器人交互。

---

## 🔧 安装

**NPM**
```bash
npm install n8n-nodes-onebot-api
````

**n8n 界面**

1. 打开 n8n
2. 进入 **Community Nodes**
3. 搜索 `n8n-nodes-onebot-api` 并点击安装

> 更多详情，请参考官方文档：
>
> * [n8n 社区节点安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)

---

## ⚙️ 功能概览

| 资源     | 操作                                                                                                                                                                                        | 说明          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 🤖 机器人 | `get_login_info`                                                                                                                                                                          | 获取当前登录态信息   |
| 👥 好友  | `get_friend_list`, `get_stranger_info`, `send_like`                                                                                                                                       | 好友管理与点赞     |
| 🏘️ 群组 | `get_group_list`, `get_group_info`, `get_group_member_list`,<br>`get_group_member_info`, `set_group_kick`, `set_group_ban`,<br>`set_group_whole_ban`, `set_group_name`, `set_group_admin` | 群组查询与管理     |
| 💬 消息  | `send_private_msg`, `send_group_msg`                                                                                                                                                      | 私聊／群消息推送    |
| 🌐 其他  | `get_status`, `get_version_info`                                                                                                                                                          | 节点状态与版本信息查询 |

---

## 🔐 凭证配置

在 n8n 中，为 OneBot 节点添加以下凭证：

* **Access Token** 访问令牌
* **API Base URL** (例如: `http://localhost:5700`)

> 确保机器人服务已启动并且 Token 与 URL 设置正确，否则无法调用 API。

---

## 🔄 兼容性

已在以下 OneBot 实现上测试通过：

* go-cqhttp v1.1.0+
* OneBot Kotlin
* Mirai

---

## 🚀 使用示例

### 示例 1：发送群消息

1. 在工作流中添加 **OneBot** 节点
2. 资源选择 `消息`
3. 操作选择 `发送群消息`
4. 设定目标群号与消息内容
5. 运行工作流

### 示例 2：群组管理

1. 添加 **OneBot** 节点
2. 资源选择 `群组`
3. 操作选择（如 `全员禁言`）
4. 填写群号与配置参数
5. 执行

> **Tip**：机器人需在群中拥有管理员权限才能执行管理操作。

---

## 📚 资源链接

* [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
* [OneBot v11 标准](https://11.onebot.dev)
* [go-cqhttp 官方文档](https://docs.go-cqhttp.org)

---

	
