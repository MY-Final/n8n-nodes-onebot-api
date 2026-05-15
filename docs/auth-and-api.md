# 鉴权机制与 OneBot 接口调用实现

## 一、鉴权机制

### 1.1 凭证定义

凭证在 `credentials/OneBotApi.credentials.ts` 中定义，包含两个字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `server` | string | OneBot 服务端地址，如 `http://127.0.0.1:5700` |
| `accessToken` | string (password) | 访问令牌，UI 中显示为密码输入框 |

### 1.2 认证方式

采用 **Bearer Token** 认证，通过 HTTP 请求头传递：

```
Authorization: Bearer <accessToken>
```

实现方式是 n8n 提供的 `IAuthenticateGeneric` 接口，声明式定义了凭证注入规则：

```typescript
// credentials/OneBotApi.credentials.ts
authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
        headers: {
            Authorization: '=Bearer {{ $credentials.accessToken }}',
        },
    },
};
```

n8n 框架在调用 `httpRequestWithAuthentication` 时会自动将 `accessToken` 拼接到请求头中，无需手动处理。

### 1.3 连接测试

凭证保存时会自动调用测试端点验证连通性：

```typescript
test: ICredentialTestRequest = {
    request: {
        baseURL: '={{ $credentials.server }}',
        url: '/get_login_info',
        method: 'POST',
    },
};
```

测试逻辑：向 `<server>/get_login_info` 发送 POST 请求，如果返回成功则凭证有效。

### 1.4 鉴权流程图

```
用户在 n8n UI 配置凭证
        │
        ▼
┌─────────────────────────┐
│  server: http://host:port│
│  accessToken: xxx        │
└─────────────────────────┘
        │
        ▼ 保存时触发
┌─────────────────────────────────┐
│  POST http://host:port/get_login_info │
│  Authorization: Bearer xxx           │
└─────────────────────────────────┘
        │
        ▼ 响应成功 → 凭证保存
        ▼ 响应失败 → 提示用户检查配置
```

## 二、接口调用实现

### 2.1 核心请求函数

所有 OneBot API 调用都通过 `GenericFunctions.ts` 中的 `apiRequest` 函数统一封装：

```typescript
// nodes/OneBot/GenericFunctions.ts
export async function apiRequest(
    this: IAllExecuteFunctions,   // n8n 执行上下文
    method: IHttpRequestMethods,  // HTTP 方法（统一使用 POST）
    endpoint: string,             // API 端点，如 'send_msg'
    body?: IDataObject,           // 请求体
    query?: IDataObject,          // 查询参数
)
```

**函数内部流程：**

1. 从 n8n 凭证管理器获取 `server` 和 `accessToken`
2. 确保 endpoint 以 `/` 开头（自动补全）
3. 构建 `IHttpRequestOptions` 配置对象
4. 调用 `httpRequestWithAuthentication` 发送请求（自动注入 Bearer Token）

### 2.2 请求配置细节

```typescript
const options: IHttpRequestOptions = {
    url: `/${endpoint}`,       // 拼接后的完整路径
    baseURL: credentials.server, // 服务端地址
    headers: { 'User-Agent': 'n8n' },
    method,                     // POST
    body,                       // JSON 请求体
    qs: query,                  // URL 查询参数
    json: true,                 // 自动序列化/反序列化 JSON
};
```

**关键点：**
- `json: true` 让 n8n 自动将 `body` 序列化为 JSON 并设置 `Content-Type: application/json`，同时将响应解析为 JSON 对象
- `httpRequestWithAuthentication` 在发送请求前自动注入凭证中的 `Authorization` 头
- OneBot v11 协议统一使用 **POST** 方法

### 2.3 API 路径管理

所有端点路径统一定义在 `constants/apiPaths.ts` 中：

```typescript
export const API_PATHS = {
    sendMsg: 'send_msg',
    sendPrivateMsg: 'send_private_msg',
    sendGroupMsg: 'send_group_msg',
    getFriendList: 'get_friend_list',
    getGroupList: 'get_group_list',
    getLoginInfo: 'get_login_info',
    // ... 共 20+ 个端点
};
```

调用时使用常量而非硬编码字符串：

```typescript
apiRequest.call(this, 'POST', API_PATHS.sendMsg, body);
```

### 2.4 操作分发架构

采用 **Resource + Operation** 双层路由，由 `actionHandlers.ts` 统一分发：

```
OneBot.node.ts (execute)
    │
    ├─ forward_mode? ──→ executeForwardMode()
    │                        │
    │                        └─ messageForwardHandlers[operation]
    │
    └─ 普通模式 ──→ executeOperation()
                        │
                        └─ getOperationHandler(resource, operation)
                               │
                               ├─ files    → filesOperationHandlers
                               ├─ message  → messageOperationHandlers
                               ├─ friend   → friendOperationHandlers
                               ├─ group    → groupOperationHandlers
                               ├─ bot/misc → genericOperationHandlers
                               └─ relationship → relationshipOperationHandlers
```

每个 handler 是一个 `(index: number) => Promise<IDataObject>` 函数，内部调用 `apiRequest`。

### 2.5 典型调用链示例

**发送群消息：**

```
用户配置: resource=message, operation=send_group_msg, group_id=123456, message="hello"
    │
    ▼
OneBot.execute()
    │
    ▼
executeOperation('message', 'send_group_msg', 0)
    │
    ▼
messageOperationHandlers['send_group_msg'] → sendGroupMsg()
    │
    ▼
sendGroupMsg() {
    group_id = getNodeParameter('group_id', 0)  // 123456
    message = getNodeParameter('message', 0)     // "hello"
    body = { group_id: 123456, message: "hello" }
    return apiRequest('POST', 'send_group_msg', body)
}
    │
    ▼
apiRequest() {
    credentials = getCredentials('oneBotApi')
    // 构建请求:
    // POST http://127.0.0.1:5700/send_group_msg
    // Headers: { Authorization: "Bearer xxx", User-Agent: "n8n" }
    // Body: { "group_id": 123456, "message": "hello" }
    return httpRequestWithAuthentication('oneBotApi', options)
}
    │
    ▼
n8n 框架自动:
    1. 读取 oneBotApi 凭证
    2. 注入 Authorization 头
    3. 发送 HTTP 请求
    4. 解析 JSON 响应
    5. 返回给节点
```

### 2.6 错误处理

- `apiRequest` 本身不做错误处理，HTTP 错误会向上抛出
- 各 handler 根据需要捕获错误并包装为 `NodeOperationError`
- 批量操作（如批量禁言）采用部分成功模式：逐个调用 API，收集成功/失败结果
- 主节点支持 `continueOnFail()`：单个 item 失败时输出错误信息而非中断整个工作流

### 2.7 loadOptions 中的调用

动态下拉选项（如好友列表、群列表）通过 `loadOptions` 方法实现，同样调用 `apiRequest`：

```typescript
// loadOptions/getFriendList.ts
export async function getFriendList(this: ILoadOptionsFunctions) {
    const response = await apiRequest.call(this, 'POST', API_PATHS.getFriendList);
    const friendData = getDataArray<FriendInfo>(response);
    return friendData.map(info => ({
        name: `${info.nickname} (QQ: ${info.user_id})`,
        value: info.user_id,
    }));
}
```

`loadOptions` 运行在 `ILoadOptionsFunctions` 上下文中，与 `IExecuteFunctions` 共享同一个 `apiRequest` 实现。

## 三、数据流总结

```
┌──────────────┐     凭证注入      ┌──────────────────┐
│   n8n 凭证    │ ──────────────→  │   apiRequest()    │
│  (server +    │  Bearer Token    │                   │
│   accessToken)│                  │  构建 HTTP 请求    │
└──────────────┘                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  OneBot 服务端     │
                                  │  (go-cqhttp 等)   │
                                  └────────┬─────────┘
                                           │
                                           ▼ JSON 响应
                                  ┌──────────────────┐
                                  │  n8n 节点输出      │
                                  │  (INodeExecutionData) │
                                  └──────────────────┘
```
