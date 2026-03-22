import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

interface GetFileSystemInfoResponse {
	file_count?: number;
	limit_count?: number;
	used_space?: number;
	total_space?: number;
}

interface GetFileResponse {
	file?: string;
	url?: string;
	file_size?: string;
	file_name?: string;
	base64?: string;
}

/**
 * 获取群文件系统信息
 * 必填字段：
 * - group_id: number | string 群号
 *
 * 返回：
 * - file_count: 文件总数
 * - limit_count: 文件上限
 * - used_space: 已使用空间
 * - total_space: 空间上限
 */
export async function getGroupFileSystemInfo(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	const group_id = this.getNodeParameter('group_id', index) as number | string;

	const body: IDataObject = {
		group_id,
	};

	return apiRequest.call(this, 'POST', API_PATHS.getGroupFileSystemInfo, body) as Promise<
		IDataObject & {
			data?: GetFileSystemInfoResponse;
		}
	>;
}

/**
 * 获取文件信息
 * 必填字段（二选一）：
 * - file_id: string 文件 ID
 * - file: string 文件路径
 *
 * 返回：
 * - file: 文件路径或链接
 * - url: 下载链接
 * - file_size: 文件大小
 * - file_name: 文件名
 * - base64: 文件 base64 编码
 */
export async function getFile(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	// file_id 和 file 二选一
	let file_id = '';
	let file = '';

	try {
		file_id = this.getNodeParameter('file_id', index, '') as string;
	} catch {}

	try {
		file = this.getNodeParameter('file', index, '') as string;
	} catch {}

	if (!file_id && !file) {
		throw new NodeOperationError(
			this.getNode(),
			'Please provide either file_id or file parameter',
			{ itemIndex: index },
		);
	}

	const body: IDataObject = {};
	if (file_id) {
		body.file_id = file_id;
	}
	if (file) {
		body.file = file;
	}

	return apiRequest.call(this, 'POST', API_PATHS.getFile, body) as Promise<
		IDataObject & {
			data?: GetFileResponse;
		}
	>;
}
