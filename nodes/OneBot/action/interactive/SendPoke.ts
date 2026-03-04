import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 发送戳一戳
 * 支持好友戳一戳和群组戳一戳
 * - 好友戳一戳：只需要 user_id，不需要 group_id
 * - 群组戳一戳：需要 user_id 和 group_id
 */
export async function SendPoke(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const user_id = this.getNodeParameter('user_id', index) as number;

	// group_id 是可选的，只有在群组戳一戳时才需要
	const group_id = this.getNodeParameter('group_id', index, '') as number | string;

	// 构建请求体，只有当 group_id 存在且不为空时才包含它
	const body: IDataObject = {
		user_id, // 必填
	};

	// 如果提供了 group_id，则添加到请求体中（群组戳一戳）
	if (group_id !== undefined && group_id !== null && group_id !== '') {
		body.group_id = group_id;
	}

	return await apiRequest.call(this, 'POST', API_PATHS.sendPoke, body);
}
