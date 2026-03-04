import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 创建群文件文件夹
 * 必填字段：
 * - group_id: number | string 群号
 * - folder_name: string 文件夹名称
 */
export async function createGroupFileFolder(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const folder_name = this.getNodeParameter('folder_name', index) as string;

	const body: IDataObject = {
		group_id,
		folder_name,
	};

	return apiRequest.call(this, 'POST', API_PATHS.createGroupFileFolder, body);
}

/**
 * 删除群文件
 * 必填字段：
 * - group_id: number | string 群号
 * - file_id: string 文件 ID
 */
export async function deleteGroupFile(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const file_id = this.getNodeParameter('file_id', index) as string;

	const body: IDataObject = {
		group_id,
		file_id,
	};

	return apiRequest.call(this, 'POST', API_PATHS.deleteGroupFile, body);
}

/**
 * 删除群文件夹
 * 必填字段：
 * - group_id: number | string 群号
 * - folder_id: string 文件夹 ID
 */
export async function deleteGroupFolder(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const folder_id = this.getNodeParameter('folder_id', index) as string;

	const body: IDataObject = {
		group_id,
		folder_id,
	};

	return apiRequest.call(this, 'POST', API_PATHS.deleteGroupFolder, body);
}
