import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../GenericFunctions';
import { API_PATHS } from '../../constants/apiPaths';

export async function SetAdmin(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	try {
		const group_id = this.getNodeParameter('managed_group_id', index) as number;

		const rawUserIds = this.getNodeParameter('user_ids', index, []) as Array<string | number>;
		const userIds = Array.isArray(rawUserIds)
			? rawUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v))
			: [];

		if (userIds.length === 0) {
			throw new NodeOperationError(this.getNode(), '请至少选择一个群成员进行管理员设置。', {
				itemIndex: index,
			});
		}

		const enable = this.getNodeParameter('enable', index) as boolean;

		const results: Array<{ user_id: number; ok: boolean; data?: IDataObject; error?: string }> = [];

		for (const targetUserId of userIds) {
			const body: IDataObject = {
				group_id,
				user_id: targetUserId,
				enable,
			};

			try {
				const data = await apiRequest.call(this, 'POST', API_PATHS.setGroupAdmin, body);
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
			group_id,
			total: userIds.length,
			success: results.filter((r) => r.ok).length,
			failed: results.filter((r) => !r.ok).length,
			results,
		};
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(
			this.getNode(),
			`设置管理员失败: ${error instanceof Error ? error.message : String(error)}`,
			{
				itemIndex: index,
			},
		);
	}
}
