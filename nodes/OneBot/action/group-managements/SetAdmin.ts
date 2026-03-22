import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../GenericFunctions';
import { API_PATHS } from '../../constants/apiPaths';

export async function SetAdmin(this: IExecuteFunctions, index: number): Promise<IDataObject> {
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
		throw new NodeOperationError(this.getNode(), '请至少选择一个群成员（支持单选或多选）。', {
			itemIndex: index,
		});
	}
	const enable = this.getNodeParameter('enable', index) as boolean;

	const results: Array<{ user_id: number; ok: boolean; data?: IDataObject; error?: string }> = [];

	for (const targetUserId of targets) {
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
		total: targets.length,
		success: results.filter((r) => r.ok).length,
		failed: results.filter((r) => !r.ok).length,
		results,
	};
}
