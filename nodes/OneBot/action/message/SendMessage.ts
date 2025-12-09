import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { apiRequest } from '../../GenericFunctions';

export async function sendPrivateMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const message = this.getNodeParameter('message', index) as string;
    const user_id = this.getNodeParameter('user_id', index) as number;

    const body: IDataObject = {
        user_id,
        message
    };

    return apiRequest.call(this, 'POST', '/send_private_msg', body);
}

export async function sendGroupMsg(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const message = this.getNodeParameter('message', index) as string;
    const group_id = this.getNodeParameter('group_id', index) as number;

    const body: IDataObject = {
        group_id,
        message
    };

    return apiRequest.call(this, 'POST', '/send_group_msg', body);
}

