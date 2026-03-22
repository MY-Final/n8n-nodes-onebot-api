import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
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

	let user_id: number;
	try {
		user_id = this.getNodeParameter('user_id', index) as number;
	} catch {
		user_id = Number(this.getNodeParameter('userId', index));
	}

	const body: IDataObject = {
		group_id,
		user_id,
		enable: this.getNodeParameter('enable', index) as boolean,
	};
	return await apiRequest.call(this, 'POST', API_PATHS.setGroupAdmin, body);
}
