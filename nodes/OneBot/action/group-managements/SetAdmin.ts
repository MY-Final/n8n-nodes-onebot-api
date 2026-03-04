import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { apiRequest } from '../../GenericFunctions';
import { API_PATHS } from '../../constants/apiPaths';

export async function SetAdmin(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const body: IDataObject = {
		group_id: this.getNodeParameter('managed_group_id', index) as number,
		user_id: this.getNodeParameter('user_id', index) as number,
		enable: this.getNodeParameter('enable', index) as boolean,
	};
	return await apiRequest.call(this, 'POST', API_PATHS.setGroupAdmin, body);
}
