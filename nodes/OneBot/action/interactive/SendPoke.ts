import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 发送戳一戳
 * 支持好友戳一戳和群组戳一戳
 * - 好友戳一戳：只需要 user_id，不需要 group_id
 * - 群组戳一戳：需要 user_id 和 group_id
 */
export async function SendPoke(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const rawUserIds = this.getNodeParameter('user_ids', index, []) as Array<string | number>;
	const userIdsFromMulti = Array.isArray(rawUserIds)
		? rawUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v))
		: [];

	const legacyUserId = this.getNodeParameter('userId', index, '') as string | number;
	const user_id = Number(this.getNodeParameter('user_id', index, legacyUserId) as string | number);

	const targets =
		userIdsFromMulti.length > 0 ? userIdsFromMulti : [user_id].filter(Number.isFinite);
	if (targets.length === 0) {
		throw new NodeOperationError(this.getNode(), '请至少选择一个目标用户（支持单选或多选）。', {
			itemIndex: index,
		});
	}

	// group_id 是可选的，只有在群组戳一戳时才需要
	let group_id: number | string;
	try {
		group_id = this.getNodeParameter('group_id', index, '') as number | string;
	} catch {
		group_id = this.getNodeParameter('groupId', index, '') as number | string;
	}

	const results: Array<{ user_id: number; ok: boolean; data?: IDataObject; error?: string }> = [];

	for (const targetUserId of targets) {
		const body: IDataObject = {
			user_id: targetUserId,
		};

		if (group_id !== undefined && group_id !== null && group_id !== '') {
			body.group_id = group_id;
		}

		try {
			const data = await apiRequest.call(this, 'POST', API_PATHS.sendPoke, body);
			results.push({ user_id: targetUserId, ok: true, data });
		} catch (error) {
			results.push({
				user_id: targetUserId,
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return {
		total: targets.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
}
