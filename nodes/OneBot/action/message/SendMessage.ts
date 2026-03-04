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

export async function sendPrivateMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const message = this.getNodeParameter('message', index) as string;
	const user_id = this.getNodeParameter('user_id', index) as number;

	const body: IDataObject = {
		user_id,
		message,
	};

	return apiRequest.call(this, 'POST', API_PATHS.sendPrivateMsg, body);
}

export async function sendGroupMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const message = this.getNodeParameter('message', index) as string;
	const group_id = this.getNodeParameter('group_id', index) as number;

	const body: IDataObject = {
		group_id,
		message,
	};

	return apiRequest.call(this, 'POST', API_PATHS.sendGroupMsg, body);
}

export async function sendPrivateForwardMsg(
	this: IExecuteFunctions,
	items: IDataObject[],
): Promise<IDataObject> {
	// 获取当前登录信息
	const response = await apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
	const info = (response as LoginInfoResponse).data;

	const body: IDataObject = {};
	body.messages = items.map((item, index) => ({
		type: 'node',
		data: {
			name: info.nickname,
			uin: info.user_id.toString(),
			content: this.getNodeParameter('message', index) as string,
		},
	}));

	body.user_id = this.getNodeParameter('user_id', 0) as number;

	return apiRequest.call(this, 'POST', API_PATHS.sendPrivateForward, body);
}

export async function sendGroupForwardMsg(
	this: IExecuteFunctions,
	items: IDataObject[],
): Promise<IDataObject> {
	// 获取当前登录信息
	const response = await apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
	const info = (response as LoginInfoResponse).data;

	const body: IDataObject = {};
	body.messages = items.map((item, index) => ({
		type: 'node',
		data: {
			name: info.nickname,
			uin: info.user_id.toString(),
			content: this.getNodeParameter('message', index) as string,
		},
	}));

	body.group_id = this.getNodeParameter('group_id', 0) as number;

	return apiRequest.call(this, 'POST', API_PATHS.sendGroupForward, body);
}
