import { apiRequest } from '../../GenericFunctions';
import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';
import { checkBotGroupPermission } from '../../../utils/PermissionUtils';

interface KickResult {
	user_id: number;
	ok: boolean;
	data?: IDataObject;
	error?: string;
}

interface LeaveGroupResult {
	group_id: number;
	ok: boolean;
	data?: IDataObject;
	error?: string;
}

/**
 * 将指定用户踢出群聊
 * 必填字段：
 * - managed_group_id: number 群号（管理员群组）
 * - user_ids: number[] 用户QQ列表（多选）
 * - reject_add_request: boolean 是否拒绝再次加群（拉黑）
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function KickUser(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('managed_group_id', index) as number;

	// 获取用户列表（多选）
	const userIdsParam = this.getNodeParameter('user_ids', index, []) as string[] | number[];
	const userIds = Array.isArray(userIdsParam)
		? userIdsParam.map((v) => Number(v)).filter((v) => !isNaN(v))
		: [];

	if (userIds.length === 0) {
		throw new NodeOperationError(this.getNode(), '请至少选择一个成员进行踢出。', {
			itemIndex: index,
		});
	}

	const reject_add_request = this.getNodeParameter('reject_add_request', index, false) as boolean;

	// 检查机器人权限：只有管理员或群主才能踢人
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new NodeOperationError(
			this.getNode(),
			`机器人没有权限执行踢人操作。当前角色：${
				permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
			}，需要管理员或群主权限。`,
			{ itemIndex: index },
		);
	}

	// 执行踢人
	const results: KickResult[] = [];

	for (const uid of userIds) {
		const body: IDataObject = { group_id, user_id: uid, reject_add_request };
		try {
			const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupKick, body);
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
		reject_add_request,
		total: userIds.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
}

/**
 * 机器人主动退出群聊
 * 必填字段：
 * - group_ids: number[] 群号列表（多选）
 */
export async function LeaveGroup(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const rawGroupIds = this.getNodeParameter('group_ids', index, []) as Array<string | number>;
	const groupIds = Array.isArray(rawGroupIds)
		? rawGroupIds.map((v) => Number(v)).filter((v) => Number.isFinite(v))
		: [];

	if (groupIds.length === 0) {
		throw new NodeOperationError(this.getNode(), '请至少选择一个群组进行退出。', {
			itemIndex: index,
		});
	}

	const results: LeaveGroupResult[] = [];

	for (const group_id of groupIds) {
		const body: IDataObject = { group_id };
		try {
			const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupLeave, body);
			results.push({ group_id, ok: true, data });
		} catch (error) {
			results.push({
				group_id,
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return {
		total: groupIds.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
}
