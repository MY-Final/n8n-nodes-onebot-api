import { apiRequest } from '../../GenericFunctions';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { API_PATHS } from '../../constants/apiPaths';

interface UploadGroupFileResponse {
	file_id?: string | null;
}

/**
 * 验证文件路径或 URL 是否有效
 */
function validateFilePath(file: string): { valid: boolean; error?: string } {
	if (!file || file.trim().length === 0) {
		return { valid: false, error: '文件路径或 URL 不能为空' };
	}

	const trimmedFile = file.trim();

	// 检查是否为 HTTP/HTTPS URL
	if (trimmedFile.startsWith('http://') || trimmedFile.startsWith('https://')) {
		try {
			new URL(trimmedFile);
			return { valid: true };
		} catch {
			return { valid: false, error: '无效的 HTTP/HTTPS URL 格式' };
		}
	}

	// 检查是否为 file:// 协议
	if (trimmedFile.startsWith('file://')) {
		return { valid: true };
	}

	// 检查是否为本地路径（Windows 或 Unix）
	// Windows: C:\path\to\file 或 \\network\path
	// Unix: /path/to/file 或 ~/path/to/file
	const isWindowsPath = /^[a-zA-Z]:\\/.test(trimmedFile) || trimmedFile.startsWith('\\\\');
	const isUnixPath = trimmedFile.startsWith('/') || trimmedFile.startsWith('~');

	if (isWindowsPath || isUnixPath) {
		return { valid: true };
	}

	return {
		valid: false,
		error: '无效的文件路径格式。支持：本地路径、file:// 协议或 HTTP/HTTPS URL',
	};
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

	// 验证文件路径
	const validation = validateFilePath(file);
	if (!validation.valid) {
		throw new NodeOperationError(this.getNode(), validation.error || '文件路径验证失败', {
			itemIndex: index,
		});
	}

	// 验证文件名
	if (!name || name.trim().length === 0) {
		throw new NodeOperationError(this.getNode(), '文件名不能为空', {
			itemIndex: index,
		});
	}

	// 构建请求体
	const body: IDataObject = {
		group_id,
		file: file.trim(),
		name: name.trim(),
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

	try {
		return (await apiRequest.call(this, 'POST', API_PATHS.uploadGroupFile, body)) as IDataObject & {
			data?: UploadGroupFileResponse;
		};
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`上传群文件失败: ${error instanceof Error ? error.message : String(error)}`,
			{
				itemIndex: index,
			},
		);
	}
}
