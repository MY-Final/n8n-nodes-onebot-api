import { IExecuteFunctions } from 'n8n-workflow';
import { apiRequest } from '../OneBot/GenericFunctions';
import { API_PATHS } from '../OneBot/constants/apiPaths';

/**
 * 机器人权限信息接口
 */
export interface BotPermissionInfo {
	/** 是否为管理员（包括群主） */
	isAdmin: boolean;
	/** 是否为群主 */
	isOwner: boolean;
	/** 是否可以执行操作（管理员或群主） */
	canOperate: boolean;
}

/**
 * 检查机器人在群中的权限
 *
 * @param executeFunctions - 执行函数上下文
 * @param groupId - 群ID
 * @returns 包含权限信息的对象
 */
export async function checkBotGroupPermission(
	executeFunctions: IExecuteFunctions,
	groupId: string | number,
): Promise<BotPermissionInfo> {
	try {
		// 1. 获取机器人的登录信息
		const loginInfo = await apiRequest.call(executeFunctions, 'POST', API_PATHS.getLoginInfo);

		if (!loginInfo?.data?.user_id) {
			return { isAdmin: false, isOwner: false, canOperate: false };
		}

		const botId = loginInfo.data.user_id;

		// 2. 获取机器人在群中的信息
		const body = { group_id: groupId, user_id: botId };
		const memberInfo = await apiRequest.call(
			executeFunctions,
			'POST',
			'get_group_member_info',
			body,
		);

		if (!memberInfo?.data) {
			return { isAdmin: false, isOwner: false, canOperate: false };
		}

		// 3. 检查权限
		const role = memberInfo.data.role || '';
		const isOwner = role === 'owner';
		const isAdmin = role === 'admin' || isOwner;

		return {
			isAdmin,
			isOwner,
			canOperate: isAdmin, // 只有管理员或群主才能操作
		};
	} catch (error) {
		void error;
		return { isAdmin: false, isOwner: false, canOperate: false };
	}
}
