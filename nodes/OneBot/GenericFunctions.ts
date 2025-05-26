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
		errorMessage.includes('was aborted') ||  // 添加连接中断检测
		errorMessage.includes('timed out') ||    // 添加超时检测
		errorMessage.includes('getaddrinfo') ||
		errorMessage.includes('socket hang up') ||
		errorMessage.includes('network timeout')
	);
}

// 检测是否是超时错误
function isTimeoutError(error: unknown): boolean {
	const errorMessage = error instanceof Error ? error.message : String(error);
	return (
		errorMessage.includes('ETIMEDOUT') ||
		errorMessage.includes('timed out') ||
		errorMessage.includes('timeout')
	);
}

// 检测是否是连接中断错误
function isConnectionAbortedError(error: unknown): boolean {
	const errorMessage = error instanceof Error ? error.message : String(error);
	return (
		errorMessage.includes('aborted') ||
		errorMessage.includes('connection') ||
		errorMessage.includes('socket')
	);
}

// 等待指定毫秒数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 新增辅助函数，用于简化Base64字符串在日志中的显示
function simplifyBase64ForLog(jsonStr: string): string {
	// 查找并替换Base64字符串模式(base64://后跟大量字符)
	return jsonStr.replace(/(base64:\/\/[A-Za-z0-9+\/=]{20})[A-Za-z0-9+\/=]+/g, '$1...[BASE64数据]');
}

/**
 * 发送API请求到OneBot服务器
 *
 * @param this - 执行函数上下文
 * @param method - HTTP请求方法（GET/POST等）
 * @param endpoint - API端点路径
 * @param body - 请求体数据(可选)
 * @param query - URL查询参数(可选)
 * @param maxRetries - 最大重试次数(默认1次)
 * @returns 请求响应数据
 */
export async function apiRequest(
	this: IAllExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IHttpRequestOptions['body'],
	query?: IHttpRequestOptions['qs'],
	maxRetries: number = 1,
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

	// 对于发送消息类的操作，增加超时时间
	let timeoutValue = 30000; // 默认30秒
	if (endpoint.includes('send_') && endpoint.includes('_msg')) {
		timeoutValue = 60000; // 发送消息操作增加到60秒
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
		timeout: timeoutValue, // 使用动态超时时间
	};

	let retries = 0;
	let lastError: Error | unknown;

	// 重试循环
	while (retries <= maxRetries) {
		try {
			// 准备日志输出
			let bodyLog = '';
			if (body) {
				// 将body转为字符串并简化Base64内容
				const bodyStr = JSON.stringify(body);
				const simplifiedBody = simplifyBase64ForLog(bodyStr);
				// 截断长度，但保留更多内容
				bodyLog = `请求体: ${simplifiedBody.length > 1000 ? simplifiedBody.substring(0, 1000) + '...(省略)' : simplifiedBody}`;
			}
			
			console.log(`${retries > 0 ? `[重试 ${retries}/${maxRetries}] ` : ''}发送${method}请求到 ${baseURL}${endpoint}`,
				bodyLog,
				processedQuery && Object.keys(processedQuery).length > 0 ? `查询参数: ${JSON.stringify(processedQuery)}` : ''
			);

			// 发送带身份验证的HTTP请求
			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'oneBotApi', options);
			console.log(`API响应状态: ${response.status || '未知'}`);
			// 简化响应日志
			const responseStr = JSON.stringify(response);
			const simplifiedResponse = simplifyBase64ForLog(responseStr);
			console.log(`API响应内容: ${simplifiedResponse.length > 500 ? simplifiedResponse.substring(0, 500) + '...(省略)' : simplifiedResponse}`);

			// 检查响应是否成功
			if (response.status === 'failed') {
				console.error('API请求失败:', response.message || '未知错误');
				throw new Error(`OneBot API错误: ${response.message || '未知错误'}`);
			}

			return response;
		} catch (error) {
			lastError = error;
			const errorMsg = error instanceof Error ? error.message : String(error);

			// 记录错误信息但不再将超时和连接中断视为成功
			if (isTimeoutError(error)) {
				console.log(`请求超时: ${errorMsg}`);
			} else if (isConnectionAbortedError(error)) {
				console.log(`连接中断: ${errorMsg}`);
			}
			
			if (isNetworkError(error) && retries < maxRetries) {
				// 网络错误，进行重试
				retries++;
				const waitTime = retries * 1000; // 递增的等待时间
				console.log(`遇到网络错误: ${errorMsg}, 将在${waitTime}毫秒后重试 (${retries}/${maxRetries})`);
				await sleep(waitTime);
			} else {
				// 非网络错误或已达到最大重试次数，抛出异常
				console.error('API请求失败:', errorMsg);
				throw error;
			}
		}
	}

	// 如果代码执行到这里（理论上不应该），则所有重试都失败了
	throw lastError;
}

