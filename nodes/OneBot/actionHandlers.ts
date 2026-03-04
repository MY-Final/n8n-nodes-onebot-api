import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	NodeOperationError,
} from 'n8n-workflow';
import {
	sendMsg,
	sendPrivateMsg,
	sendGroupMsg,
	sendPrivateForwardMsg,
	sendGroupForwardMsg,
} from './action/message/SendMessage';
import { sendLike } from './action/interactive/SendLike';
import { SendPoke } from './action/interactive/SendPoke';
import { MuteUser, MuteAll } from './action/group-managements/Mute';
import { KickUser, LeaveGroup } from './action/group-managements/Kick';
import { DeleteFriend } from './action/friend-managements/DeleFriend';
import { sendGroupSign } from './action/interactive/SendGroupSign';
import { SetAdmin } from './action/group-managements/SetAdmin';
import { uploadGroupFile } from './action/group-managements/UploadGroupFile';
import { getGroupRootFiles, getGroupFilesByFolder } from './action/files/GetGroupFiles';
import { getGroupFileSystemInfo, getFile } from './action/files/GetFileSystemInfo';
import {
	createGroupFileFolder,
	deleteGroupFile,
	deleteGroupFolder,
} from './action/files/ManageGroupFiles';
import { moveGroupFile, renameGroupFile } from './action/files/RenameAndMoveFile';
import { apiRequest } from './GenericFunctions';

type OperationHandler = (this: IExecuteFunctions, index: number) => Promise<IDataObject>;

interface ForwardHandler {
	(this: IExecuteFunctions, items: IDataObject[]): Promise<IDataObject>;
}

const filesOperationHandlers: Record<string, OperationHandler> = {
	upload_group_file: uploadGroupFile,
	get_group_root_files: getGroupRootFiles,
	get_group_files_by_folder: getGroupFilesByFolder,
	get_group_file_system_info: getGroupFileSystemInfo,
	get_file: getFile,
	create_group_file_folder: createGroupFileFolder,
	delete_group_file: deleteGroupFile,
	delete_group_folder: deleteGroupFolder,
	move_group_file: moveGroupFile,
	rename_group_file: renameGroupFile,
};

const messageOperationHandlers: Record<string, OperationHandler> = {
	send_private_msg: sendPrivateMsg,
	send_group_msg: sendGroupMsg,
	send_msg: sendMsg,
};

const messageForwardHandlers: Record<string, ForwardHandler> = {
	send_private_msg: sendPrivateForwardMsg,
	send_group_msg: sendGroupForwardMsg,
};

const friendOperationHandlers: Record<string, OperationHandler> = {
	get_friend_list: async function (this: IExecuteFunctions, index: number) {
		return apiRequest.call(this, 'GET', 'get_friend_list');
	},
	get_stranger_info: async function (this: IExecuteFunctions, index: number) {
		const body: IDataObject = {
			user_id: this.getNodeParameter('user_id', index) as number,
		};
		return apiRequest.call(this, 'POST', 'get_stranger_info', body);
	},
	send_like: sendLike,
	send_poke: SendPoke,
	delete_friend: DeleteFriend,
};

const groupOperationHandlers: Record<string, OperationHandler> = {
	get_group_info: async function (this: IExecuteFunctions, index: number) {
		const body: IDataObject = {
			group_id: this.getNodeParameter('group_id', index) as number,
		};
		return apiRequest.call(this, 'POST', 'get_group_info', body);
	},
	get_group_list: async function (this: IExecuteFunctions, index: number) {
		return apiRequest.call(this, 'GET', 'get_group_list');
	},
	get_group_member_info: async function (this: IExecuteFunctions, index: number) {
		const body: IDataObject = {
			group_id: this.getNodeParameter('group_id', index) as number,
			user_id: this.getNodeParameter('user_id', index) as number,
		};
		return apiRequest.call(this, 'POST', 'get_group_member_info', body);
	},
	get_group_member_list: async function (this: IExecuteFunctions, index: number) {
		const body: IDataObject = {
			group_id: this.getNodeParameter('group_id', index) as number,
		};
		return apiRequest.call(this, 'POST', 'get_group_member_list', body);
	},
	send_poke: SendPoke,
	mute_user: MuteUser,
	mute_all: MuteAll,
	kick_user: KickUser,
	group_leave: LeaveGroup,
	set_group_admin: SetAdmin,
	send_group_sign: sendGroupSign,
};

const genericOperationHandlers: Record<string, OperationHandler> = {
	// Bot 相关操作
	get_login_info: async function (this: IExecuteFunctions, index: number) {
		return apiRequest.call(this, 'GET', 'get_login_info');
	},
	// Misc 相关操作
	get_status: async function (this: IExecuteFunctions, index: number) {
		return apiRequest.call(this, 'GET', 'get_status');
	},
	get_version_info: async function (this: IExecuteFunctions, index: number) {
		return apiRequest.call(this, 'GET', 'get_version_info');
	},
};

function getOperationHandler(resource: string, operation: string): OperationHandler | undefined {
	switch (resource) {
		case 'files':
			return filesOperationHandlers[operation];
		case 'message':
			return messageOperationHandlers[operation];
		case 'friend':
			return friendOperationHandlers[operation];
		case 'group':
		case 'engagement': // engagement 操作使用 group handlers
			return groupOperationHandlers[operation];
		case 'bot':
		case 'misc':
			return genericOperationHandlers[operation];
		case 'other':
		case 'relationship':
			// 这些资源目前没有专用处理器，使用通用 API 调用
			return undefined;
		default:
			return undefined;
	}
}

function getForwardHandler(operation: string): ForwardHandler | undefined {
	return messageForwardHandlers[operation];
}

export async function executeForwardMode(
	this: IExecuteFunctions,
	items: IDataObject[],
	operation: string,
): Promise<IDataObject> {
	const handler = getForwardHandler(operation);
	if (!handler) {
		throw new NodeOperationError(this.getNode(), `Unsupported forward operation: ${operation}`);
	}
	return handler.call(this, items);
}

export async function executeOperation(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	index: number,
): Promise<IDataObject> {
	const handler = getOperationHandler(resource, operation);

	if (handler) {
		return handler.call(this, index);
	}

	// 如果没有专用处理器，尝试使用通用 API 调用（适用于 other/relationship 等资源）
	return executeGenericOperation.call(this, resource, operation, index);
}

export async function executeGenericOperation(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	index: number,
): Promise<IDataObject> {
	let body: IDataObject = {};

	switch (operation) {
		case 'get_stranger_info':
			body.user_id = this.getNodeParameter('user_id', index) as number;
			break;
		case 'get_group_member_list':
		case 'get_group_info':
			body.group_id = this.getNodeParameter('group_id', index) as number;
			break;
		case 'get_group_member_info':
			body.group_id = this.getNodeParameter('group_id', index) as number;
			body.user_id = this.getNodeParameter('user_id', index) as number;
			break;
	}

	const method: IHttpRequestMethods = Object.keys(body).length === 0 ? 'GET' : 'POST';
	return apiRequest.call(this, method, operation, body);
}
