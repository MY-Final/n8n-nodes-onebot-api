import { apiRequest } from '../../GenericFunctions';
import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

// 发送好友赞
export async function sendLike(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const user_id = this.getNodeParameter('user_id', index) as number;
    const times = this.getNodeParameter('times', index) as number;
    const data = await apiRequest.call(this, 'POST', API_PATHS.sendLike, {
        user_id,
        times,
    });
    return data;
}
