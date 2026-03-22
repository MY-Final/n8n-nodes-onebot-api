import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
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
 * - group_id: number 群号
 * - user_id: number 用户QQ
 * - duration: number 禁言时长（秒）
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function MuteUser(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	let group_id: number;
	try {
		group_id = this.getNodeParameter('managed_group_id', index) as number;
	} catch {
		try {
			group_id = this.getNodeParameter('group_id', index) as number;
		} catch {
			group_id = Number(this.getNodeParameter('groupId', index));
		}
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
			try {
				singleUserId = Number(this.getNodeParameter('userId', index));
				if (isNaN(singleUserId)) singleUserId = null;
			} catch {
				singleUserId = null;
			}
		}
	}

	const duration = this.getNodeParameter('duration', index) as number;

	// 检查机器人权限：只有管理员或群主才能禁言其他用户
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new Error(
			`机器人没有权限执行禁言操作。当前角色：${
				permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
			}，需要管理员或群主权限。`,
		);
	}

	// 执行禁言（多选优先，单选回退）
	const targets = userIds.length > 0 ? userIds : singleUserId !== null ? [singleUserId] : [];
	if (targets.length === 0) {
		throw new Error('请至少选择一个成员进行禁言（支持多选或单选）。');
	}

	const results: MuteResult[] = [];

	for (const uid of targets) {
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
		total: targets.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
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
	let group_id: number;
	try {
		group_id = this.getNodeParameter('managed_group_id', index) as number;
	} catch {
		try {
			group_id = this.getNodeParameter('group_id', index) as number;
		} catch {
			group_id = Number(this.getNodeParameter('groupId', index));
		}
	}
	const enable = this.getNodeParameter('enable', index) as boolean;

	// 检查机器人权限：只有管理员或群主才能设置全员禁言
	const permission = await checkBotGroupPermission(this, group_id);
	if (!permission.canOperate) {
		throw new Error(
			`机器人没有权限执行全员禁言操作。当前角色：${
				permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
			}，需要管理员或群主权限。`,
		);
	}

	const body: IDataObject = {
		group_id,
		enable,
	};

	return await apiRequest.call(this, 'POST', API_PATHS.setGroupWholeBan, body);
}
