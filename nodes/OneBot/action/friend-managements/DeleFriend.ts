import { apiRequest } from '../../GenericFunctions';
import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 删除好友（支持单个或批量）
 * 必填字段：
 * - user_id: number 好友QQ（当 user_ids 未提供或为空时使用）
 * - user_ids: number[] 多个好友QQ（多选）
 * - temp_block: boolean 是否同时拉黑
 * - temp_both_del: boolean 是否双向删除（从对方列表里也把自己删掉）
 */
export async function DeleteFriend(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const temp_block = this.getNodeParameter('temp_block', index) as boolean;
	const temp_both_del = this.getNodeParameter('temp_both_del', index) as boolean;

	const rawUserIds = (this.getNodeParameter('user_ids', index, []) as Array<string | number>) || [];
	const userIds: number[] =
		Array.isArray(rawUserIds) && rawUserIds.length > 0
			? rawUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v))
			: [this.getNodeParameter('user_id', index) as number];

	const details: Array<{
		user_id: number;
		success: boolean;
		error?: string;
		response?: IDataObject;
	}> = [];
	let successCount = 0;
	let failedCount = 0;

	for (const uid of userIds) {
		const body: IDataObject = {
			user_id: uid,
			temp_block,
			temp_both_del,
		};

		try {
			const data = await apiRequest.call(this, 'POST', API_PATHS.deleteFriend, body);
			details.push({ user_id: uid, success: true, response: data as IDataObject });
			successCount++;
		} catch (error: unknown) {
			details.push({
				user_id: uid,
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});
			failedCount++;
		}
	}

	return {
		total: userIds.length,
		success: successCount,
		failed: failedCount,
		details,
	};
}
