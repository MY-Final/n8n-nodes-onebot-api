import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { apiRequest } from '../../GenericFunctions';


export async function SetAdmin(this: IExecuteFunctions, index: number): Promise<IDataObject> {
     const body: IDataObject = {
       group_id: this.getNodeParameter('group_id', index) as number,
       user_id: this.getNodeParameter('user_id', index) as number,
       enable: this.getNodeParameter('enable', index) as boolean
     };
     return await apiRequest.call(this, 'POST', 'set_group_admin', body);
   }
