import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

interface GroupFile {
	file_id: string;
	file_name: string;
	file_size: number;
	size: number;
	busid: number;
	upload_time: number;
	dead_time: number;
	modify_time: number;
	download_times: number;
	uploader: number;
	uploader_name: string;
	group_id: number;
}

interface GroupFileFolder {
	folder_id: string;
	folder_name: string;
	folder: string;
	group_id: number;
	create_time: number;
	creator: number;
	creator_name: string;
	total_file_count: number;
}

interface GetGroupFilesResponse {
	files?: GroupFile[];
	folders?: GroupFileFolder[];
}

/**
 * 获取群根目录文件列表
 * 必填字段：
 * - group_id: number | string 群号
 *
 * 可选字段：
 * - file_count: number 一次性获取的文件数量（默认 50）
 */
export async function getGroupRootFiles(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const file_count = this.getNodeParameter('file_count', index, 50) as number;

	const body: IDataObject = {
		group_id,
		file_count,
	};

	return apiRequest.call(this, 'POST', API_PATHS.getGroupRootFiles, body) as Promise<
		IDataObject & {
			data?: GetGroupFilesResponse;
		}
	>;
}

/**
 * 获取群子目录文件列表
 * 必填字段：
 * - group_id: number | string 群号
 * - folder_id: string 文件夹 ID
 *
 * 可选字段：
 * - folder_name: string 文件夹名称（用于显示）
 * - file_count: number 一次性获取的文件数量（默认 50）
 */
export async function getGroupFilesByFolder(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;
	const folder_id = this.getNodeParameter('folder_id', index) as string;
	const folder_name = this.getNodeParameter('folder_name', index, '') as string;
	const file_count = this.getNodeParameter('file_count', index, 50) as number;

	const body: IDataObject = {
		group_id,
		folder_id,
		folder_name,
		file_count,
	};

	return apiRequest.call(this, 'POST', API_PATHS.getGroupFilesByFolder, body) as Promise<
		IDataObject & {
			data?: GetGroupFilesResponse;
		}
	>;
}
