import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 群打卡
 * 必填字段：
 * - group_id: string 群号
 *
 * 用于在群内进行每日打卡签到
 */
export async function sendGroupSign(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as string | number;

	if (!group_id) {
		throw new Error('group_id is required');
	}

	const body: IDataObject = {
		group_id: String(group_id),
	};

	return await apiRequest.call(this, 'POST', API_PATHS.sendGroupSign, body);
}
