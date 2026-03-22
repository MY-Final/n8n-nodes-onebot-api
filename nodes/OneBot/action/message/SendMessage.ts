import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { apiRequest } from '../../GenericFunctions';
import { API_PATHS } from '../../constants/apiPaths';

interface LoginInfo {
	nickname: string;
	user_id: number;
}

interface LoginInfoResponse {
	data: LoginInfo;
}

interface MessageSegment {
	type: string;
	data?: Record<string, any>;
}

interface ForwardNode {
	type: 'node';
	data: {
		name?: string;
		uin?: string;
		user_id?: number | string;
		nickname?: string;
		content: string | MessageSegment[];
		time?: number | string;
	};
}

/**
 * 发送统一消息接口（支持私聊/群聊）
 */
export async function sendMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const messageType = this.getNodeParameter('message_type', index) as 'private' | 'group';
	const message = this.getNodeParameter('message', index) as string | IDataObject[];
	const autoEscape = this.getNodeParameter('auto_escape', index, false) as boolean;

	const body: IDataObject = {
		message_type: messageType,
		message,
	};

	if (messageType === 'private') {
		body.user_id = this.getNodeParameter('user_id', index) as number;
	} else if (messageType === 'group') {
		body.group_id = this.getNodeParameter('group_id', index) as number;
	}

	if (autoEscape) {
		body.auto_escape = true;
	}

	return apiRequest.call(this, 'POST', API_PATHS.sendMsg, body);
}

/**
 * 发送私聊消息
 */
export async function sendPrivateMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const message = this.getNodeParameter('message', index) as string | IDataObject[];
	let user_id: number;
	try {
		user_id = this.getNodeParameter('user_id', index) as number;
	} catch {
		user_id = Number(this.getNodeParameter('userId', index));
	}

	let autoEscape = false;
	try {
		autoEscape = this.getNodeParameter('auto_escape', index, false) as boolean;
	} catch {
		autoEscape = this.getNodeParameter('autoEscape', index, false) as boolean;
	}

	const body: IDataObject = {
		user_id,
		message,
	};

	if (autoEscape) {
		body.auto_escape = true;
	}

	return apiRequest.call(this, 'POST', API_PATHS.sendPrivateMsg, body);
}

/**
 * 发送群消息
 */
export async function sendGroupMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const message = this.getNodeParameter('message', index) as string | IDataObject[];
	let group_id: number;
	try {
		group_id = this.getNodeParameter('group_id', index) as number;
	} catch {
		group_id = Number(this.getNodeParameter('groupId', index));
	}

	let autoEscape = false;
	try {
		autoEscape = this.getNodeParameter('auto_escape', index, false) as boolean;
	} catch {
		autoEscape = this.getNodeParameter('autoEscape', index, false) as boolean;
	}

	const body: IDataObject = {
		group_id,
		message,
	};

	if (autoEscape) {
		body.auto_escape = true;
	}

	return apiRequest.call(this, 'POST', API_PATHS.sendGroupMsg, body);
}

/**
 * 构建合并转发消息节点
 */
function buildForwardNode(this: IExecuteFunctions, index: number, info: LoginInfo): ForwardNode {
	const content = this.getNodeParameter('message', index) as string | MessageSegment[];

	// 优先使用每条消息自己的配置，其次使用全局配置
	let useCustomSender = false;
	let senderNickname = '';
	let senderUin = '';

	try {
		useCustomSender = this.getNodeParameter('use_custom_sender', index, false) as boolean;
	} catch {}

	try {
		senderNickname = this.getNodeParameter('sender_nickname', index, '') as string;
	} catch {}

	try {
		senderUin = this.getNodeParameter('sender_uin', index, '') as string;
	} catch {}

	const node: ForwardNode = {
		type: 'node',
		data: {
			content,
		},
	};

	// 自定义发送者信息（支持每条消息独立配置）
	if (useCustomSender || senderNickname || senderUin) {
		if (senderNickname) {
			node.data.nickname = senderNickname;
			node.data.name = senderNickname;
		}
		if (senderUin) {
			node.data.uin = senderUin;
			node.data.user_id = Number(senderUin);
		}
	} else {
		// 使用机器人信息
		node.data.name = info.nickname;
		node.data.uin = info.user_id.toString();
	}

	// 可选的时间字段
	try {
		const time = this.getNodeParameter('time', index, '') as string;
		if (time) {
			node.data.time = time;
		}
	} catch {}

	return node;
}

/**
 * 发送私聊合并转发消息
 */
export async function sendPrivateForwardMsg(
	this: IExecuteFunctions,
	items: IDataObject[],
): Promise<IDataObject> {
	const response = await apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
	const info = (response as LoginInfoResponse).data;

	// 构建消息节点数组
	const messages: ForwardNode[] = items.map((item, index) =>
		buildForwardNode.call(this, index, info),
	);

	const body: IDataObject = {
		user_id: this.getNodeParameter('user_id', 0) as number,
		messages,
	};

	// 添加可选参数
	try {
		const source = this.getNodeParameter('source', 0, '') as string;
		if (source) body.source = source;
	} catch {}

	try {
		const summary = this.getNodeParameter('summary', 0, '') as string;
		if (summary) body.summary = summary;
	} catch {}

	try {
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		if (prompt) body.prompt = prompt;
	} catch {}

	try {
		const news = this.getNodeParameter('news', 0, null) as any;
		if (news && news.newsItem && Array.isArray(news.newsItem) && news.newsItem.length > 0) {
			body.news = news.newsItem;
		}
	} catch {}

	try {
		const autoEscape = this.getNodeParameter('auto_escape', 0, false) as boolean;
		if (autoEscape) body.auto_escape = true;
	} catch {}

	return apiRequest.call(this, 'POST', API_PATHS.sendPrivateForwardMsg, body);
}

/**
 * 发送群合并转发消息
 */
export async function sendGroupForwardMsg(
	this: IExecuteFunctions,
	items: IDataObject[],
): Promise<IDataObject> {
	const response = await apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
	const info = (response as LoginInfoResponse).data;

	// 构建消息节点数组
	const messages: ForwardNode[] = items.map((item, index) =>
		buildForwardNode.call(this, index, info),
	);

	const body: IDataObject = {
		group_id: this.getNodeParameter('group_id', 0) as number,
		messages,
	};

	// 添加可选参数
	try {
		const source = this.getNodeParameter('source', 0, '') as string;
		if (source) body.source = source;
	} catch {}

	try {
		const summary = this.getNodeParameter('summary', 0, '') as string;
		if (summary) body.summary = summary;
	} catch {}

	try {
		const prompt = this.getNodeParameter('prompt', 0, '') as string;
		if (prompt) body.prompt = prompt;
	} catch {}

	try {
		const news = this.getNodeParameter('news', 0, null) as any;
		if (news && news.newsItem && Array.isArray(news.newsItem) && news.newsItem.length > 0) {
			body.news = news.newsItem;
		}
	} catch {}

	try {
		const autoEscape = this.getNodeParameter('auto_escape', 0, false) as boolean;
		if (autoEscape) body.auto_escape = true;
	} catch {}

	return apiRequest.call(this, 'POST', API_PATHS.sendGroupForwardMsg, body);
}
