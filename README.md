# n8n-nodes-onebot

这是一个n8n社区节点。它允许您在n8n工作流程中使用OneBot v11标准API与QQ机器人进行交互。

[OneBot标准](https://11.onebot.dev)是一种通用聊天机器人应用接口标准，修改自原CKYU平台的CQHTTP插件接口。

[n8n](https://n8n.io/)是一个[公平代码许可](https://docs.n8n.io/reference/license/)的工作流自动化平台。

[安装](#安装)  
[功能](#功能)  
[凭证](#凭证)  
[兼容性](#兼容性)  
[使用方法](#使用方法)  
[资源](#资源)  

## 安装

### NPM安装
```bash
npm install n8n-nodes-onebot-api
```

### 从n8n界面安装
按照[n8n社区节点安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)进行操作。

## 功能

### 机器人操作
- 获取登录信息 (get_login_info)

### 好友操作
- 获取好友列表 (get_friend_list)
- 获取陌生人信息 (get_stranger_info)
- 给好友点赞 (send_like)

### 群组操作
- 获取群列表 (get_group_list)
- 获取群信息 (get_group_info)
- 获取群成员列表 (get_group_member_list)
- 获取群成员信息 (get_group_member_info)
- 踢出群成员 (set_group_kick)
- 禁言群成员 (set_group_ban)
- 全员禁言 (set_group_whole_ban)
- 设置群名称 (set_group_name)
- 设置群管理员 (set_group_admin)

### 消息操作
- 发送私聊消息 (send_private_msg)
- 发送群消息 (send_group_msg)

### 其他操作
- 获取状态 (get_status)
- 获取版本信息 (get_version_info)

## 凭证

需要配置OneBot API的访问凭证：
- 访问令牌（Access Token）
- API基础URL（通常为http://localhost:5700）

## 兼容性

此节点已通过以下OneBot实现测试：
- go-cqhttp v1.1.0及以上版本
- OneBot Kotlin
- Mirai

## 使用方法

### 示例1：发送群消息
1. 创建OneBot节点
2. 选择"消息"资源
3. 选择"发送群消息"操作
4. 选择目标群组
5. 输入消息内容
6. 执行工作流

### 示例2：群管理
1. 创建OneBot节点
2. 选择"群组"资源
3. 选择所需操作（如"全员禁言"）
4. 选择目标群组
5. 配置相关参数
6. 执行工作流

> 注意：群管理功能需要机器人具有相应的权限（管理员或群主）

## 资源

* [n8n社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
* [OneBot v11标准](https://11.onebot.dev/)
* [go-cqhttp文档](https://docs.go-cqhttp.org/)
