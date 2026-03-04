import { apiRequest } from '../../GenericFunctions';
import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';
import { checkBotGroupPermission } from '../../../utils/PermissionUtils';

interface KickResult {
	user_id: number;
	ok: boolean;
	data?: IDataObject;
	error?: string;
}

/**
 * 将指定用户踢出群聊
 * 必填字段：
 * - group_id: number 群号
 * - user_id: number 用户QQ
 * - reject_add_request: boolean 是否拒绝再次加群（拉黑）
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function KickUser(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	let group_id: number;
	try {
		group_id = this.getNodeParameter('managed_group_id', index) as number;
	} catch {
		group_id = this.getNodeParameter('group_id', index) as number;
	}

	// 支持多选成员
	const userIdsParam = this.getNodeParameter('user_ids', index, []) as
		| string[]
		| number[]
		| undefined;
	const userIds = Array.isArray(userIdsParam)
		? userIdsParam.map((v) => Number(v)).filter((v) => !isNaN(v))
		: [];

	// 单选回退
	let singleUserId: number | null = null;
	if (userIds.length === 0) {
		try {
			singleUserId = Number(this.getNodeParameter('user_id', index));
			if (isNaN(singleUserId)) singleUserId = null;
		} catch {
			singleUserId = null;
		}
	}

	const reject_add_request = this.getNodeParameter('reject_add_request', index, false) as boolean;

	// 检查机器人权限：只有管理员或群主才能踢人
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new Error(
			`机器人没有权限执行踢人操作。当前角色：${
				permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
			}，需要管理员或群主权限。`,
		);
	}

	// 执行踢人（多选优先，单选回退）
	const targets = userIds.length > 0 ? userIds : singleUserId !== null ? [singleUserId] : [];
	if (targets.length === 0) {
		throw new Error('请至少选择一个成员进行踢出（支持多选或单选）。');
	}

	const results: KickResult[] = [];

	for (const uid of targets) {
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
		total: targets.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
}

/**
 * 机器人主动退出群聊
 * 必填字段：
 * - group_id: number 群号
 */
export async function LeaveGroup(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	let group_id: number;
	try {
		group_id = this.getNodeParameter('managed_group_id', index) as number;
	} catch {
		group_id = this.getNodeParameter('group_id', index) as number;
	}

	const body: IDataObject = { group_id };

	const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupLeave, body);
	return data;
}
