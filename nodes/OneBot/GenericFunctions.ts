import { IAllExecuteFunctions, IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

/**
 * OneBot API凭证类型定义
 */
type OneBotCredentials = {
	server: string;      // OneBot服务器地址
	accessToken: string; // 访问令牌
};

// 用于检测是否是网络错误的函数
function isNetworkError(error: unknown): boolean {
	const errorMessage = error instanceof Error ? error.message : String(error);
	return (
		errorMessage.includes('ECONNRESET') ||
		errorMessage.includes('ETIMEDOUT') ||
		errorMessage.includes('ENOTFOUND') ||
		errorMessage.includes('ENETUNREACH') ||
		errorMessage.includes('ECONNREFUSED') ||
		errorMessage.includes('The connection to the server was closed unexpectedly') ||
		errorMessage.includes('getaddrinfo') ||
		errorMessage.includes('socket hang up') ||
		errorMessage.includes('network timeout')
	);
}

// 等待指定毫秒数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 发送API请求到OneBot服务器
 *
 * @param this - 执行函数上下文
 * @param method - HTTP请求方法（GET/POST等）
 * @param endpoint - API端点路径
 * @param body - 请求体数据(可选)
 * @param query - URL查询参数(可选)
 * @param maxRetries - 最大重试次数(默认3次)
 * @returns 请求响应数据
 */
export async function apiRequest(
	this: IAllExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IHttpRequestOptions['body'],
	query?: IHttpRequestOptions['qs'],
	maxRetries: number = 3,
) {
	// 获取OneBot API凭证
	const credentials = (await this.getCredentials('oneBotApi')) as OneBotCredentials;
	const baseURL = credentials.server;

	// 确保端点路径以"/"开头
	if (!endpoint.startsWith('/')) {
		endpoint = '/' + endpoint;
	}

	// 处理查询参数，确保所有值都被正确序列化
	const processedQuery: Record<string, string | number | boolean> = {};

	if (query) {
		console.log('原始查询参数:', JSON.stringify(query));

		for (const key in query) {
			if (query[key] !== undefined && query[key] !== null) {
				// 确保数值类型参数正确传递
				if (typeof query[key] === 'number') {
					processedQuery[key] = query[key] as number;
				}
				// 字符串参数
				else if (typeof query[key] === 'string') {
					processedQuery[key] = query[key] as string;
				}
				// 布尔参数
				else if (typeof query[key] === 'boolean') {
					processedQuery[key] = query[key] as boolean;
				}
				// 对象类型需要序列化
				else if (typeof query[key] === 'object') {
					processedQuery[key] = JSON.stringify(query[key]);
				}
			}
		}

		console.log('处理后的查询参数:', JSON.stringify(processedQuery));
	}

	// 构建HTTP请求选项
	const options: IHttpRequestOptions = {
		url: endpoint,
		baseURL,
		headers: {
			'User-Agent': 'n8n',
		},
		method,
		body,
		qs: processedQuery, // 使用处理后的查询参数
		json: true,
		timeout: 10000, // 增加超时时间到10秒
	};

	let retries = 0;
	let lastError: Error | unknown;

	// 重试循环
	while (retries <= maxRetries) {
		try {
			console.log(`${retries > 0 ? `[重试 ${retries}/${maxRetries}] ` : ''}发送${method}请求到 ${baseURL}${endpoint}`,
				body ? `请求体: ${JSON.stringify(body)}` : '',
				processedQuery && Object.keys(processedQuery).length > 0 ? `查询参数: ${JSON.stringify(processedQuery)}` : ''
			);

			// 发送带身份验证的HTTP请求
			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'oneBotApi', options);
			console.log(`API响应状态: ${response.status || '未知'}`);
			console.log(`API响应内容: ${JSON.stringify(response).substring(0, 500)}${JSON.stringify(response).length > 500 ? '...(省略)' : ''}`);

			// 检查响应是否成功
			if (response.status === 'failed') {
				console.error('API请求失败:', response.message || '未知错误');
				throw new Error(`OneBot API错误: ${response.message || '未知错误'}`);
			}

			return response;
		} catch (error) {
			lastError = error;
			if (isNetworkError(error) && retries < maxRetries) {
				// 网络错误，进行重试
				retries++;
				const waitTime = retries * 1000; // 递增的等待时间
				console.log(`遇到网络错误: ${error instanceof Error ? error.message : String(error)}, 将在${waitTime}毫秒后重试 (${retries}/${maxRetries})`);
				await sleep(waitTime);
			} else {
				// 非网络错误或已达到最大重试次数，抛出异常
				console.error('API请求失败:', error instanceof Error ? error.message : String(error));
				throw error;
			}
		}
	}

	// 如果代码执行到这里（理论上不应该），则所有重试都失败了
	throw lastError;
}

