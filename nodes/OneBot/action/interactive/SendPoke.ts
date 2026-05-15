import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 发送戳一戳
 * 支持好友戳一戳和群组戳一戳
 * - 好友戳一戳（Friend resource）：使用 user_ids（多选）
 * - 群组戳一戳（Group resource）：使用 group_id + user_id（单选）
 */
export async function SendPoke(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const resource = this.getNodeParameter('resource', index) as string;

	// Friend resource: 批量戳一戳
	if (resource === 'friend') {
		const rawUserIds = this.getNodeParameter('user_ids', index, []) as Array<string | number>;
		const userIds = Array.isArray(rawUserIds)
			? rawUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v))
			: [];

		if (userIds.length === 0) {
			throw new NodeOperationError(this.getNode(), '请至少选择一个好友进行戳一戳。', {
				itemIndex: index,
			});
		}

		const results: Array<{ user_id: number; ok: boolean; data?: IDataObject; error?: string }> = [];

		for (const targetUserId of userIds) {
			const body: IDataObject = { user_id: targetUserId };

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
			total: userIds.length,
			success: results.filter((r) => r.ok).length,
			failed: results.filter((r) => !r.ok).length,
			results,
		};
	}

	// Group resource: 单个戳一戳
	const group_id = this.getNodeParameter('group_id', index) as number;
	const user_id = this.getNodeParameter('user_id', index) as number;

	const body: IDataObject = {
		group_id,
		user_id,
	};

	try {
		const data = await apiRequest.call(this, 'POST', API_PATHS.sendPoke, body);
		return {
			success: true,
			group_id,
			user_id,
			data,
		};
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`发送戳一戳失败: ${error instanceof Error ? error.message : String(error)}`,
			{
				itemIndex: index,
			},
		);
	}
}
