import { apiRequest } from '../../GenericFunctions';
import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';
import { checkBotGroupPermission } from '../../../utils/PermissionUtils';

/**
 * 禁言指定用户
 * 必填字段：
 * - group_id: number 群号
 * - user_id: number 用户QQ
 * - duration: number 禁言时长（秒）
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function MuteUser(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number;
	const user_id = this.getNodeParameter('user_id', index) as number;
	const duration = this.getNodeParameter('duration', index) as number;

	// 检查机器人权限：只有管理员或群主才能禁言其他用户
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new Error(
			`机器人没有权限执行禁言操作。当前角色：${permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'}，需要管理员或群主权限。`,
		);
	}

	const body: IDataObject = {
		group_id,
		user_id,
		duration,
	};

	const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupBan, body);

	return data;
}


/**
 * 全员禁言开关
 * 必填字段：
 * - group_id: number 群号
 * - enable: boolean 是否开启全员禁言
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function MuteAll(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number;
	const enable = this.getNodeParameter('enable', index) as boolean;

	// 检查机器人权限：只有管理员或群主才能设置全员禁言
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new Error(
			`机器人没有权限执行全员禁言操作。当前角色：${permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'}，需要管理员或群主权限。`,
		);
	}

	const body: IDataObject = {
		group_id,
		enable,
	};

	const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupWholeBan, body);

	return data;
}


