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
	data?: IDataObject;
}

interface NewsItem {
	text?: string;
}

interface NewsCollection {
	newsItem?: NewsItem[];
}

function getOptionalStringParam(
	context: IExecuteFunctions,
	index: number,
	name: string,
	defaultValue = '',
): string {
	try {
		return context.getNodeParameter(name, index, defaultValue) as string;
	} catch {
		return defaultValue;
	}
}

function getOptionalBooleanParam(
	context: IExecuteFunctions,
	index: number,
	name: string,
	defaultValue = false,
): boolean {
	try {
		return context.getNodeParameter(name, index, defaultValue) as boolean;
	} catch {
		return defaultValue;
	}
}

function getOptionalNewsCollection(
	context: IExecuteFunctions,
	index: number,
): NewsCollection | null {
	try {
		return context.getNodeParameter('news', index, null) as NewsCollection | null;
	} catch {
		return null;
	}
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
	const user_id = this.getNodeParameter('user_id', index) as number;
	const autoEscape = this.getNodeParameter('auto_escape', index, false) as boolean;

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
	const group_id = this.getNodeParameter('group_id', index) as number;
	const autoEscape = this.getNodeParameter('auto_escape', index, false) as boolean;

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
	const useCustomSender = getOptionalBooleanParam(this, index, 'use_custom_sender', false);
	const senderNickname = getOptionalStringParam(this, index, 'sender_nickname', '');
	const senderUin = getOptionalStringParam(this, index, 'sender_uin', '');

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
	const time = getOptionalStringParam(this, index, 'time', '');
	if (time) {
		node.data.time = time;
	}

	return node;
}

/**
 * 发送私聊合并转发消息
 */
export async function sendPrivateForwardMsg(
	this: IExecuteFunctions,
	items: IDataObject[],
): Promise<IDataObject> {
	const response = await apiRequest.call(this, 'POST', API_PATHS.getLoginInfo);
	const info = (response as LoginInfoResponse).data;

	// 构建消息节点数组
	const messages: ForwardNode[] = items.map((_item, index) =>
		buildForwardNode.call(this, index, info),
	);

	const body: IDataObject = {
		user_id: this.getNodeParameter('user_id', 0) as number,
		messages,
	};

	// 添加可选参数
	const source = getOptionalStringParam(this, 0, 'source', '');
	if (source) body.source = source;

	const summary = getOptionalStringParam(this, 0, 'summary', '');
	if (summary) body.summary = summary;

	const prompt = getOptionalStringParam(this, 0, 'prompt', '');
	if (prompt) body.prompt = prompt;

	const news = getOptionalNewsCollection(this, 0);
	if (news?.newsItem?.length) {
		body.news = news.newsItem;
	}

	const autoEscape = getOptionalBooleanParam(this, 0, 'auto_escape', false);
	if (autoEscape) body.auto_escape = true;

	return apiRequest.call(this, 'POST', API_PATHS.sendPrivateForwardMsg, body);
}

/**
 * 发送群合并转发消息
 */
export async function sendGroupForwardMsg(
	this: IExecuteFunctions,
	items: IDataObject[],
): Promise<IDataObject> {
	const response = await apiRequest.call(this, 'POST', API_PATHS.getLoginInfo);
	const info = (response as LoginInfoResponse).data;

	// 构建消息节点数组
	const messages: ForwardNode[] = items.map((_item, index) =>
		buildForwardNode.call(this, index, info),
	);

	const body: IDataObject = {
		group_id: this.getNodeParameter('group_id', 0) as number,
		messages,
	};

	// 添加可选参数
	const source = getOptionalStringParam(this, 0, 'source', '');
	if (source) body.source = source;

	const summary = getOptionalStringParam(this, 0, 'summary', '');
	if (summary) body.summary = summary;

	const prompt = getOptionalStringParam(this, 0, 'prompt', '');
	if (prompt) body.prompt = prompt;

	const news = getOptionalNewsCollection(this, 0);
	if (news?.newsItem?.length) {
		body.news = news.newsItem;
	}

	const autoEscape = getOptionalBooleanParam(this, 0, 'auto_escape', false);
	if (autoEscape) body.auto_escape = true;

	return apiRequest.call(this, 'POST', API_PATHS.sendGroupForwardMsg, body);
}
