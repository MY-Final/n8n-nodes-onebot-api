import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

interface UploadGroupFileResponse {
	file_id?: string | null;
}

/**
 * 上传群文件
 * 必填字段：
 * - group_id: number 群号
 * - file: string 文件路径或 URL
 * - name: string 文件名
 *
 * 可选字段：
 * - folder: string 父目录 ID
 * - folder_id: string 父目录 ID (兼容性字段)
 * - upload_file: boolean 是否执行上传（默认 true）
 *
 * 权限要求：机器人必须是管理员或群主
 */
export async function uploadGroupFile(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number;
	const file = this.getNodeParameter('file', index) as string;
	const name = this.getNodeParameter('name', index) as string;

	// 构建请求体
	const body: IDataObject = {
		group_id,
		file,
		name,
		upload_file: true,
	};

	// 可选参数：父目录 ID
	let folder = '';
	try {
		folder = this.getNodeParameter('folder', index, '') as string;
	} catch {
		folder = '';
	}
	if (folder) {
		body.folder = folder;
	}

	let folder_id = '';
	try {
		folder_id = this.getNodeParameter('folder_id', index, '') as string;
	} catch {
		folder_id = '';
	}
	if (folder_id) {
		body.folder_id = folder_id;
	}

	let upload_file = true;
	try {
		upload_file = this.getNodeParameter('upload_file', index, true) as boolean;
	} catch {
		upload_file = true;
	}
	body.upload_file = upload_file;

	return apiRequest.call(this, 'POST', API_PATHS.uploadGroupFile, body) as Promise<
		IDataObject & {
			data?: UploadGroupFileResponse;
		}
	>;
}
