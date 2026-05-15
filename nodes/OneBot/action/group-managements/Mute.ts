import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';
import { checkBotGroupPermission } from '../../../utils/PermissionUtils';

interface MuteResult {
	user_id: number;
	ok: boolean;
	data?: IDataObject;
	error?: string;
}

/**
 * 禁言指定用户
 * 必填字段：
 * - managed_group_id: number 群号（管理员群组）
 * - user_ids: number[] 用户QQ列表（多选）
 * - duration: number 禁言时长（秒）
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function MuteUser(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('managed_group_id', index) as number;

	// 获取用户列表（多选）
	const userIdsParam = this.getNodeParameter('user_ids', index, []) as string[] | number[];
	const userIds = Array.isArray(userIdsParam)
		? userIdsParam.map((v) => Number(v)).filter((v) => !isNaN(v))
		: [];

	if (userIds.length === 0) {
		throw new NodeOperationError(this.getNode(), '请至少选择一个成员进行禁言。', {
			itemIndex: index,
		});
	}

	const duration = this.getNodeParameter('duration', index) as number;

	// 检查机器人权限：只有管理员或群主才能禁言其他用户
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new NodeOperationError(
			this.getNode(),
			`机器人没有权限执行禁言操作。当前角色：${
				permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
			}，需要管理员或群主权限。`,
			{ itemIndex: index },
		);
	}

	// 执行禁言
	if (userIds.length === 0) {
		throw new NodeOperationError(this.getNode(), '请至少选择一个成员进行禁言。', {
			itemIndex: index,
		});
	}

	const results: MuteResult[] = [];

	for (const uid of userIds) {
		const body: IDataObject = { group_id, user_id: uid, duration };
		try {
			const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupBan, body);
			results.push({ user_id: uid, ok: true, data });
		} catch (err) {
			results.push({
				user_id: uid,
				ok: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return {
		group_id,
		duration,
		total: userIds.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
}

/**
 * 全员禁言开关
 * 必填字段：
 * - managed_group_id: number 群号（管理员群组）
 * - enable: boolean 是否开启全员禁言
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function MuteAll(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('managed_group_id', index) as number;
	const enable = this.getNodeParameter('enable', index) as boolean;

	// 检查机器人权限：只有管理员或群主才能设置全员禁言
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new NodeOperationError(
			this.getNode(),
			`机器人没有权限执行全员禁言操作。当前角色：${
				permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
			}，需要管理员或群主权限。`,
			{ itemIndex: index },
		);
	}

	const body: IDataObject = {
		group_id,
		enable,
	};

	return await apiRequest.call(this, 'POST', API_PATHS.setGroupWholeBan, body);
}
