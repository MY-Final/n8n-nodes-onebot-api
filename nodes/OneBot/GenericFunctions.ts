import { IAllExecuteFunctions, IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

/**
 * OneBot 凭证类型定义
 * 用于存储访问 OneBot API 所需的服务器地址和访问令牌
 */
type OneBotCredentials = {
	/** OneBot 服务端的基础 URL（如 http://127.0.0.1:5700） */
	server: string;
	/** 访问 OneBot API 所需的令牌（可选，部分部署需要） */
	accessToken: string;
};

/**
 * 通用的 OneBot API 请求函数
 * 封装了 n8n 的 HTTP 请求逻辑，自动处理凭证、URL 拼接、请求配置等
 *
 * @this 绑定 n8n 的 IAllExecuteFunctions 上下文，提供凭证获取、HTTP 请求等能力
 * @param method HTTP 请求方法（GET/POST/PUT/DELETE 等），符合 n8n 定义的 IHttpRequestMethods 类型
 * @param endpoint API 端点路径（如 /send_message）
 * @param body 请求体数据（POST/PUT 等方法时使用）
 * @param query URL 查询参数（GET 等方法时使用）
 * @returns Promise<any> API 请求的响应数据
 */
export async function apiRequest(
	this: IAllExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IHttpRequestOptions['body'],
	query?: IHttpRequestOptions['qs'],
) {
	// 从 n8n 凭证管理器中获取 OneBot 配置（自动关联当前节点的 oneBotApi 凭证）
	const credentials = (await this.getCredentials('oneBotApi')) as OneBotCredentials;
	const baseURL = credentials.server;

	// 确保端点路径以 / 开头，避免拼接 URL 时出现格式错误（如 server/api → server//api）
	if (!endpoint.startsWith('/')) {
		endpoint = '/' + endpoint;
	}

	/**
	 * 构建 n8n HTTP 请求配置项
	 * 符合 IHttpRequestOptions 类型规范，包含 URL、请求方法、头部、数据等
	 */
	const options: IHttpRequestOptions = {
		// 接口端点路径
		url: endpoint,
		// 服务端基础 URL
		baseURL,
		// 请求头配置
		headers: {
			'User-Agent': 'n8n', // 标识请求来源为 n8n
		},
		// HTTP 请求方法
		method,
		// 请求体数据（POST/PUT 等）
		body,
		// URL 查询参数（GET 等）
		qs: query,
		// 自动将请求体序列化为 JSON，并解析响应为 JSON
		json: true,
	};

	/**
	 * 使用 n8n 带认证的 HTTP 请求方法
	 * 自动关联 oneBotApi 凭证（处理 accessToken 鉴权），发送 HTTP 请求
	 */
	return this.helpers.httpRequestWithAuthentication.call(this, 'oneBotApi', options);
}
