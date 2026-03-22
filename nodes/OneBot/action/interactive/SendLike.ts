import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

// 发送好友赞
export async function sendLike(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const rawUserIds = this.getNodeParameter('user_ids', index, []) as Array<string | number>;
	const userIdsFromMulti = Array.isArray(rawUserIds)
		? rawUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v))
		: [];

	let user_id = Number.NaN;
	try {
		user_id = this.getNodeParameter('user_id', index) as number;
	} catch {
		user_id = Number(this.getNodeParameter('userId', index));
	}

	const targets =
		userIdsFromMulti.length > 0 ? userIdsFromMulti : [user_id].filter(Number.isFinite);
	if (targets.length === 0) {
		throw new NodeOperationError(this.getNode(), '请至少选择一个好友（支持单选或多选）。', {
			itemIndex: index,
		});
	}
	const times = this.getNodeParameter('times', index) as number;

	const results: Array<{ user_id: number; ok: boolean; data?: IDataObject; error?: string }> = [];

	for (const targetUserId of targets) {
		try {
			const data = await apiRequest.call(this, 'POST', API_PATHS.sendLike, {
				user_id: targetUserId,
				times,
			});
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
