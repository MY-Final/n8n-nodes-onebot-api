import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 发送群组签名请求
 * @param this - 执行函数上下文对象
 * @param index - 节点参数索引
 * @returns 返回API响应数据对象
 */
export async function sendGroupSign(this: IExecuteFunctions, index: number): Promise<IDataObject> {

	const group_id = this.getNodeParameter('group_id', index) as number;
	const body: IDataObject = { group_id };
	return await apiRequest.call(this, 'POST', `/${API_PATHS.sendGroupSign}`, body);

}

