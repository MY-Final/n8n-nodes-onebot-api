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
