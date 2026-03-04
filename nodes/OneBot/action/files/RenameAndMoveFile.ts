import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

/**
 * 移动群文件
 * 必填字段：
 * - group_id: number | string 群号
 * - file_id: string 文件 ID
 * - current_parent_directory: string 当前父目录（根目录填 /）
 * - target_parent_directory: string 目标父目录
 */
export async function moveGroupFile(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const file_id = this.getNodeParameter('file_id', index) as string;
	const current_parent_directory = this.getNodeParameter(
		'current_parent_directory',
		index,
	) as string;
	const target_parent_directory = this.getNodeParameter('target_parent_directory', index) as string;

	const body: IDataObject = {
		group_id,
		file_id,
		current_parent_directory,
		target_parent_directory,
	};

	return apiRequest.call(this, 'POST', API_PATHS.moveGroupFile, body);
}

/**
 * 重命名群文件
 * 必填字段：
 * - group_id: number | string 群号
 * - file_id: string 文件 ID
 * - current_parent_directory: string 当前父目录
 * - new_name: string 新文件名
 */
export async function renameGroupFile(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const file_id = this.getNodeParameter('file_id', index) as string;
	const current_parent_directory = this.getNodeParameter(
		'current_parent_directory',
		index,
	) as string;
	const new_name = this.getNodeParameter('new_name', index) as string;

	const body: IDataObject = {
		group_id,
		file_id,
		current_parent_directory,
		new_name,
	};

	return apiRequest.call(this, 'POST', API_PATHS.renameGroupFile, body);
}
