# AGENTS.md - 开发指南

本文档为在 n8n-nodes-onebot-api 项目中工作的代理提供开发指南。

## 项目概述

- **项目名称**: n8n-nodes-onebot-plus
- **类型**: n8n 社区节点包
- **语言**: TypeScript (~4.8.4)
- **构建工具**: TSC + Gulp

## 命令

| 命令              | 说明                       |
| ----------------- | -------------------------- |
| `npm run build`   | 编译 TypeScript 并构建图标 |
| `npm run dev`     | TypeScript 监听模式        |
| `npm run format`  | 使用 Prettier 格式化代码   |
| `npm run lint`    | 运行 ESLint 检查           |
| `npm run lintfix` | 自动修复 ESLint 问题       |

目前未配置测试框架。

## TypeScript 配置

- 启用严格模式
- 目标: ES2019
- 模块: CommonJS
- `noImplicitAny: true`
- `noUnusedLocals: true`
- `strictNullChecks: true`
- `useUnknownInCatchVariables: false`

## 代码风格

### 格式化 (Prettier)

```js
{
  semi: true,
  trailingComma: 'all',
  bracketSpacing: true,
  useTabs: true,
  tabWidth: 2,
  arrowParens: 'always',
  singleQuote: true,
  quoteProps: 'as-needed',
  endOfLine: 'lf',
  printWidth: 100
}
```

### 命名规范

| 类型 | 规范       | 示例                           |
| ---- | ---------- | ------------------------------ |
| 类   | PascalCase | `OneBot`, `SendMessage`        |
| 函数 | camelCase  | `apiRequest`, `sendPrivateMsg` |
| 变量 | camelCase  | `userId`, `groupId`            |
| 接口 | PascalCase | `LoginInfo`, `OneBotMap`       |
| 类型 | PascalCase | `OneBotCredentials`            |
| 文件 | PascalCase | `OneBot.node.ts`               |

### 导入顺序

按来源分组导入：

1. 外部包 (n8n-workflow)
2. 内部模块 (相对路径)

```typescript
import { IExecuteFunctions, INodeType } from 'n8n-workflow';
import { apiRequest } from './GenericFunctions';
import { OneBotAction } from './Interfaces';
```

### 类型注解

- 函数参数和返回值必须使用显式类型
- 获取节点参数时使用类型断言: `as string`, `as number`
- 请求/响应体优先使用 `IDataObject`
- HTTP 方法类型使用 `IHttpRequestMethods`

```typescript
export async function sendPrivateMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const message = this.getNodeParameter('message', index) as string;
	const body: IDataObject = { user_id, message };
	return apiRequest.call(this, 'POST', endpoint, body);
}
```

### 错误处理

抛出描述性错误:

```typescript
throw new Error(`不支持的操作: ${operation}`);
```

### 注释

- 使用中文注释 (与现有代码库一致)
- 使用 JSDoc 格式

```typescript
/**
 * 通用的 OneBot API 请求函数
 * 封装了 n8n 的 HTTP 请求逻辑
 *
 * @param method HTTP 请求方法
 * @param endpoint API 端点路径
 */
```

## n8n 节点开发规范

### 节点结构

每个节点必须包含以下部分:

```typescript
export class OneBot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot', // 节点显示名称
		name: 'oneBot', // 节点唯一标识
		icon: 'file:onebot.svg', // 节点图标
		description: 'Consume OneBot API', // 节点描述
		subtitle: '={{ $parameter["operation"] }}', // 副标题
		version: 1, // 版本号
		defaults: { name: 'OneBot' },
		group: ['transform'],
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'oneBotApi', required: true }],
		properties: [], // 属性定义
	};

	methods = { loadOptions: {} }; // 动态下拉方法

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// 实现逻辑
	}
}
```

### Resource + Operation 模式

必须使用 Resource + Operation 的双层结构:

```typescript
properties: [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		default: 'message',
		options: [
			{ name: 'Bot', value: 'bot' },
			{ name: 'Message', value: 'message' },
			{ name: 'Group', value: 'group' },
		],
	},
	// ... operation 属性使用 displayOptions 根据 resource 显示
];
```

### 属性定义规范

每个 operation 必须定义 `action` 描述:

```typescript
{
  name: 'Send Private Message',
  value: 'send_private_msg',
  action: 'Send private message', // 必须
}
```

### displayOptions 使用规则

- 使用 `show` 控制属性显示/隐藏
- 使用 `hide` 控制属性隐藏
- 条件必须是数组形式: `resource: ['message', 'bot']`

```typescript
displayOptions: {
  show: {
    resource: ['message'],
    operation: ['send_private_msg', 'send_group_msg'],
  },
}
```

### API 请求模式

使用 `apiRequest` 封装 HTTP 请求:

```typescript
export async function apiRequest(
	this: IAllExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IHttpRequestOptions['body'],
	query?: IHttpRequestOptions['qs'],
) {
	const credentials = (await this.getCredentials('oneBotApi')) as OneBotCredentials;
	const baseURL = credentials.server;

	if (!endpoint.startsWith('/')) {
		endpoint = '/' + endpoint;
	}

	const options: IHttpRequestOptions = {
		url: endpoint,
		baseURL,
		headers: { 'User-Agent': 'n8n' },
		method,
		body,
		qs: query,
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'oneBotApi', options);
}
```

### 批量处理

节点必须支持批量处理多个输入项:

```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const result: INodeExecutionData[] = [];

  for (let index = 0; index < items.length; index++) {
    const operation = this.getNodeParameter('operation', index);
    const data = await this.executeOperation(index);

    const json = this.helpers.returnJsonArray(data);
    const executionData = this.helpers.constructExecutionMetaData(json, {
      itemData: { item: index },
    });
    result.push(...executionData);
  }

  return [result];
}
```

### 响应格式化

必须使用 `returnJsonArray` 格式化输出:

```typescript
const json = this.helpers.returnJsonArray(data);
return [json];
```

### 动态下拉选项 (loadOptions)

实现动态下拉选项:

```typescript
// loadOptions/getFriendList.ts
import { ILoadOptionsFunctions } from 'n8n-workflow';

export async function getFriendList(this: ILoadOptionsFunctions) {
	const response = await apiRequest.call(this, 'GET', '/get_friend_list');
	return {
		results: (response.data as Array<{ user_id: number; nickname: string }>).map((item) => ({
			name: item.nickname,
			value: item.user_id,
		})),
	};
}
```

在节点中注册:

```typescript
methods = {
	loadOptions: {
		getFriendList,
		getGroupList,
	},
};
```

### 凭证定义

必须包含 `authenticate` 和 `test` 方法:

```typescript
export class OneBotApi implements ICredentialType {
	name = 'oneBotApi';
	displayName = 'OneBot API';
	documentationUrl = 'https://example.com/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'server',
			type: 'string',
			default: 'http://127.0.0.1:5700',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{ $credentials.accessToken }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.server }}',
			url: '/get_status',
			method: 'GET',
		},
	};
}
```

### 文件组织

```
nodes/
├── OneBot/
│   ├── OneBot.node.ts          # 主节点类
│   ├── GenericFunctions.ts     # 共享 API 函数
│   ├── Interfaces.ts           # 类型定义
│   ├── SearchFunctions.ts      # 搜索操作
│   ├── action/                 # 操作实现
│   │   ├── message/
│   │   ├── group-managements/
│   │   └── interactive/
│   ├── loadOptions/            # 动态下拉选项
│   ├── properties/             # 节点属性定义
│   └── constants/              # API 路径、常量
├── utils/                      # 共享工具函数
credentials/
└── OneBotApi.credentials.ts   # 凭证定义
```

### ESLint 配置

项目使用自定义 n8n-node-base 规则，部分规则已禁用:

- `node-execute-block-missing-continue-on-fail`
- `node-param-fixed-collection-type-unsorted-items`

提交前请运行 `npm run lint`。

## Git 规范

- 使用有意义的提交信息
- 提交前运行 `npm run format` 和 `npm run lint`

## 注意事项

1. **禁止** 使用 `any` 类型 (除非第三方库确实无法推导)
2. **禁止** 在模板中使用 `as any`
3. 所有异步操作必须处理错误
4. 节点必须支持批量输入处理
5. 凭证必须实现 `test` 方法用于验证连接
6. 属性必须使用 `noDataExpression: true` 防止表达式意外计算

## 消息发送功能说明

### 支持的消息格式

消息内容支持三种格式：

1. **纯文本**: `"你好，世界"`
2. **CQ 码**: `"[CQ:face,id=123]你好"`
3. **消息段数组** (JSON):
   ```json
   [
   	{ "type": "text", "data": { "text": "你好" } },
   	{ "type": "face", "data": { "id": "123" } }
   ]
   ```

### 消息接口

- `send_msg`: 统一接口，通过 `message_type` 选择私聊/群聊
- `send_private_msg`: 快捷私聊接口
- `send_group_msg`: 快捷群聊接口

### Forward Mode（合并转发）

当 `forward_mode: true` 时，使用合并转发发送消息（支持单条或多条）。

**全局参数（仅 Forward Mode 下可用）:**

- `use_custom_sender`: 是否自定义发送者信息（全局默认）
- `sender_nickname`: 默认发送者昵称
- `sender_uin`: 默认发送者 QQ 号
- `time`: 消息时间戳
- `source`: 转发来源
- `summary`: 转发摘要
- `prompt`: 转发提示
- `news`: 转发的新闻列表（数组）

**每条消息的独立参数（可覆盖全局配置）:**

- `sender_nickname`: 该条消息的发送者昵称
- `sender_uin`: 该条消息的发送者 QQ 号
- `time`: 该条消息的时间戳

### 多发送者示例

```javascript
// n8n Code 节点示例
return [
	{
		json: {
			message: 'cc 谁捏',
			sender_nickname: 'Vergil',
			sender_uin: '2375736565',
		},
	},
	{
		json: {
			message: 'cc 他们的',
			sender_nickname: 'final',
			sender_uin: '1150880493',
		},
	},
	{
		json: {
			message: 'wowowowowowoowowo',
			sender_nickname: '幻影',
			sender_uin: '1693577405',
		},
	},
];
```

### 可选参数

- `auto_escape`: 是否纯文本发送（转义 CQ 码）
- `forward_mode`: 多条输入时是否合并转发

### auto_escape 参数示例

**场景 1：发送包含 CQ 码的文本（希望正常解析）**

```json
{
	"message": "[CQ:face,id=123] 你好"
}
// auto_escape: false (默认)
// 结果：显示一个表情 + "你好"
```

**场景 2：发送包含 CQ 码的文本（希望作为纯文本显示）**

```json
{
	"message": "[CQ:face,id=123] 你好",
	"auto_escape": true
}
// 结果：直接显示文本 "[CQ:face,id=123] 你好"
```

**场景 3：发送带特殊字符的文本**

```json
{
	"message": "请发送 &lt;hello&gt; 到群里",
	"auto_escape": true
}
// 结果：原样显示 "请发送 <hello> 到群里"
```

**场景 4：使用消息段数组（推荐方式，不受 auto_escape 影响）**

```json
{
	"message": [
		{ "type": "text", "data": { "text": "你好" } },
		{ "type": "face", "data": { "id": "123" } }
	]
}
// 结果：总是显示 "你好" + 表情（结构化数据，无需转义）
```

### 上传群文件

**Resource:** `Files`  
**Operation:** `Upload Group File`

**必填参数:**

- `group_id`: 群号
- `file`: 文件路径或 URL（本地文件路径、file:/// 协议或 HTTP URL）
- `name`: 文件名（显示在群内的名称）

**可选参数:**

- `folder`: 父目录 ID（上传到指定文件夹）
- `folder_id`: 父目录 ID（兼容性字段）
- `upload_file`: 是否执行上传（默认 true）

**示例:**

```json
{
	"resource": "files",
	"operation": "upload_group_file",
	"group_id": 123456,
	"file": "/path/to/file.txt",
	"name": "测试文件.txt",
	"folder": ""
}
```

**支持的文件来源:**

- 本地文件路径：`/home/user/file.txt` 或 `C:\\Users\\file.txt`
- file:/// 协议：`file:///path/to/file.txt`
- HTTP/HTTPS URL: `https://example.com/file.txt` 或 GitHub Releases 链接

### 获取群文件列表

**Resource:** `Files`  
**Operation:** `Get Group Root Files` | `Get Group Files By Folder`

#### 获取根目录文件列表

**必填参数:**

- `group_id`: 群号

**可选参数:**

- `file_count`: 一次性获取的文件数量（默认 50）

**示例:**

```json
{
	"resource": "files",
	"operation": "get_group_root_files",
	"group_id": 123456,
	"file_count": 50
}
```

#### 获取子目录文件列表

**必填参数:**

- `group_id`: 群号
- `folder_id`: 文件夹 ID

**可选参数:**

- `folder_name`: 文件夹名称（用于显示）
- `file_count`: 一次性获取的文件数量（默认 50）

**示例:**

```json
{
	"resource": "files",
	"operation": "get_group_files_by_folder",
	"group_id": 123456,
	"folder_id": "folder_uuid_123",
	"folder_name": "我的文件夹",
	"file_count": 50
}
```

**返回数据结构:**

```json
{
	"data": {
		"files": [
			{
				"file_id": "file_uuid",
				"file_name": "文件.txt",
				"file_size": 1024,
				"upload_time": 1234567890,
				"uploader": 123456,
				"uploader_name": "上传者"
			}
		],
		"folders": [
			{
				"folder_id": "folder_uuid",
				"folder_name": "文件夹名",
				"total_file_count": 10
			}
		]
	}
}
```

### 获取群文件系统信息

**Resource:** `Files`  
**Operation:** `Get Group File System Info`

**必填参数:**

- `group_id`: 群号

**返回数据:**

- `file_count`: 文件总数
- `limit_count`: 文件上限
- `used_space`: 已使用空间
- `total_space`: 空间上限

**示例:**

```json
{
	"resource": "files",
	"operation": "get_group_file_system_info",
	"group_id": 123456
}
```

### 获取文件信息

**Resource:** `Files`  
**Operation:** `Get File Info`

**必填参数（二选一）:**

- `file_id`: 文件 ID
- `file`: 文件路径

**返回数据:**

- `file`: 文件路径或链接
- `url`: 下载链接
- `file_size`: 文件大小
- `file_name`: 文件名
- `base64`: 文件 base64 编码

**示例:**

```json
{
	"resource": "files",
	"operation": "get_file",
	"file_id": "file_uuid_123"
}
```

或

```json
{
	"resource": "files",
	"operation": "get_file",
	"file": "/path/to/file.txt"
}
```

**支持的文件来源:**

- 本地文件路径：`/home/user/file.txt` 或 `C:\\Users\\file.txt`
- file:/// 协议：`file:///path/to/file.txt`
- HTTP/HTTPS URL: `https://example.com/file.txt`

### 获取群文件系统信息

**Resource:** `Files`  
**Operation:** `Get Group File System Info`

**必填参数:**

- `group_id`: 群号

**返回数据:**

- `file_count`: 文件总数
- `limit_count`: 文件上限
- `used_space`: 已使用空间
- `total_space`: 空间上限

**示例:**

```json
{
	"resource": "files",
	"operation": "get_group_file_system_info",
	"group_id": 123456
}
```

### 获取文件信息

**Resource:** `Files`  
**Operation:** `Get File Info`

**必填参数（二选一）:**

- `file_id`: 文件 ID
- `file`: 文件路径

**返回数据:**

- `file`: 文件路径或链接
- `url`: 下载链接
- `file_size`: 文件大小
- `file_name`: 文件名
- `base64`: 文件 base64 编码

**示例:**

```json
{
	"resource": "files",
	"operation": "get_file",
	"file_id": "file_uuid_123"
}
```

或

```json
{
	"resource": "files",
	"operation": "get_file",
	"file": "/path/to/file.txt"
}
```

#### 获取子目录文件列表

**必填参数:**

- `group_id`: 群号
- `folder_id`: 文件夹 ID

**可选参数:**

- `folder_name`: 文件夹名称（用于显示）
- `file_count`: 一次性获取的文件数量（默认 50）

**示例:**

```json
{
	"resource": "files",
	"operation": "get_group_files_by_folder",
	"group_id": 123456,
	"folder_id": "folder_uuid_123",
	"folder_name": "我的文件夹",
	"file_count": 50
}
```

**返回数据结构:**

```json
{
	"data": {
		"files": [
			{
				"file_id": "file_uuid",
				"file_name": "文件.txt",
				"file_size": 1024,
				"upload_time": 1234567890,
				"uploader": 123456,
				"uploader_name": "上传者"
			}
		],
		"folders": [
			{
				"folder_id": "folder_uuid",
				"folder_name": "文件夹名",
				"total_file_count": 10
			}
		]
	}
}
```

### 创建群文件文件夹

**Resource:** `Files`  
**Operation:** `Create Group File Folder`

**必填参数:**

- `group_id`: 群号
- `folder_name`: 文件夹名称

**示例:**

```json
{
	"resource": "files",
	"operation": "create_group_file_folder",
	"group_id": 123456,
	"folder_name": "我的文件夹"
}
```

### 删除群文件

**Resource:** `Files`  
**Operation:** `Delete Group File`

**必填参数:**

- `group_id`: 群号
- `file_id`: 文件 ID

**示例:**

```json
{
	"resource": "files",
	"operation": "delete_group_file",
	"group_id": 123456,
	"file_id": "file_uuid_123"
}
```

### 删除群文件夹

**Resource:** `Files`  
**Operation:** `Delete Group Folder`

**必填参数:**

- `group_id`: 群号
- `folder_id`: 文件夹 ID

**示例:**

```json
{
	"resource": "files",
	"operation": "delete_group_folder",
	"group_id": 123456,
	"folder_id": "folder_uuid_123"
}
```

## 开发规范补充

### 类型安全规范

**❌ 错误示例 - 禁止使用 `any`:**

```typescript
// 错误：使用了 any 类型
const response = (await apiRequest.call(this, 'GET', '/api')) as { data: any };
const userIds = (userIdsParam as any[]).map((v) => Number(v));

// 错误：filter 中使用了 any
const validMembers = memberData.filter((info: any) => {
	return !!info.user_id;
});
```

**✅ 正确示例 - 定义接口:**

```typescript
// 正确：定义明确的接口
interface LoginInfoResponse {
	data: {
		nickname: string;
		user_id: number;
	};
}

interface MemberInfo {
	user_id?: number | string;
	userId?: number | string;
	card?: string;
	nickname?: string;
}

const response = (await apiRequest.call(this, 'GET', '/api')) as LoginInfoResponse;
const userIds = Array.isArray(userIdsParam)
	? userIdsParam.map((v) => Number(v)).filter((v) => !isNaN(v))
	: [];

const validMembers = memberData.filter((info: MemberInfo) => {
	return !!info.user_id;
});
```

### 错误处理规范

**❌ 错误示例 - 直接 throw Error:**

```typescript
// 错误：直接抛出 Error
throw new Error(`不支持的操作：${operation}`);
```

**✅ 正确示例 - 使用 NodeOperationError:**

```typescript
import { NodeOperationError } from 'n8n-workflow';

// 正确：使用 n8n 标准错误类
throw new NodeOperationError(this.getNode(), `不支持的操作：${operation}`);
```

### 日志规范

**❌ 错误示例 - 使用 console.log:**

```typescript
// 错误：使用 console.log
console.log(`当前机器人 QQ: ${botId}`);
console.error('获取登录信息失败');
```

**✅ 正确示例 - 移除或使用 n8n 日志:**

```typescript
// 正确：移除调试日志，让 n8n 统一处理
// 或者使用 this.helpers.logger (如果可用)
```

### API 路径规范

**❌ 错误示例 - 路径格式不一致:**

```typescript
// 错误：有些带 / 有些不带
apiRequest.call(this, 'POST', `/${API_PATHS.sendMsg}`, body);
apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
```

**✅ 正确示例 - 统一不带前导 /:**

```typescript
// 正确：统一不加前导 /，GenericFunctions 会自动添加
apiRequest.call(this, 'POST', API_PATHS.sendMsg, body);
apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
```

### 属性命名规范

**❌ 错误示例 - displayName 不规范:**

```typescript
// 错误：displayName 没有以 "Name or ID" 结尾
{
 displayName: 'User',
 name: 'user_id',
 type: 'options',
 // 缺少 description
}
```

**✅ 正确示例 - 符合 n8n 规范:**

```typescript
// 正确：完整的动态下拉选项定义
{
 displayName: 'User Name or ID',
 name: 'user_id',
 type: 'options',
 description: 'Choose from the list, or specify an ID using an expression',
 typeOptions: {
  loadOptionsMethod: 'getUserList',
 },
 default: '',
}
```
