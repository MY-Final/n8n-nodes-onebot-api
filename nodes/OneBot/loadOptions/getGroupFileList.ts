import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';
import { API_PATHS } from '../constants/apiPaths';

interface GroupFile {
	file_id: string;
	file_name: string;
	file_size: number;
	upload_time: number;
	uploader_name?: string;
}

interface GroupFileFolder {
	folder_id: string;
	folder_name: string;
	total_file_count: number;
}

interface GetGroupFilesResponse {
	files?: GroupFile[];
	folders?: GroupFileFolder[];
}

/**
 * 获取群根目录文件列表（用于下拉选择）
 */
export async function getGroupRootFileList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const group_id = this.getCurrentNodeParameter('group_id') as string;

		if (!group_id) {
			return [{ name: '请先选择群聊', value: '' }];
		}

		const response = (await apiRequest.call(this, 'POST', API_PATHS.getGroupRootFiles, {
			group_id,
			file_count: 100,
		})) as { data?: GetGroupFilesResponse };

		const files = response.data?.files || [];

		if (files.length === 0) {
			return [{ name: '根目录没有文件', value: '' }];
		}

		return files.map((file) => ({
			name: `${file.file_name} (${formatFileSize(file.file_size)})`,
			value: file.file_id,
			description: `上传者：${file.uploader_name || '未知'}`,
		}));
	} catch {
		return [{ name: '获取文件列表失败', value: '' }];
	}
}

/**
 * 获取群指定目录文件列表（用于下拉选择，支持根目录和子目录）
 */
export async function getGroupFileListByDirectory(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const group_id = this.getCurrentNodeParameter('group_id') as string;
		const current_parent_directory = this.getCurrentNodeParameter(
			'current_parent_directory',
		) as string;

		if (!group_id) {
			return [{ name: '请先选择群聊', value: '' }];
		}

		if (!current_parent_directory) {
			return [{ name: '请先选择当前目录', value: '' }];
		}

		let response: { data?: GetGroupFilesResponse };

		// 如果是根目录，使用 get_group_root_files
		if (current_parent_directory === '/') {
			response = (await apiRequest.call(this, 'POST', API_PATHS.getGroupRootFiles, {
				group_id,
				file_count: 100,
			})) as { data?: GetGroupFilesResponse };
		} else {
			// 否则使用 get_group_files_by_folder
			response = (await apiRequest.call(this, 'POST', API_PATHS.getGroupFilesByFolder, {
				group_id,
				folder_id: current_parent_directory,
				file_count: 100,
			})) as { data?: GetGroupFilesResponse };
		}

		const files = response.data?.files || [];

		if (files.length === 0) {
			const dirName = current_parent_directory === '/' ? '根目录' : '该目录';
			return [{ name: `${dirName}没有文件`, value: '' }];
		}

		return files.map((file) => ({
			name: `${file.file_name} (${formatFileSize(file.file_size)})`,
			value: file.file_id,
			description: `上传者：${file.uploader_name || '未知'}`,
		}));
	} catch {
		return [{ name: '获取文件列表失败', value: '' }];
	}
}

/**
 * 获取群子目录文件列表（用于下拉选择）
 */
export async function getGroupFileByFolderList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const group_id = this.getCurrentNodeParameter('group_id') as string;
		const folder_id = this.getCurrentNodeParameter('folder_id') as string;

		if (!group_id) {
			return [{ name: '请先选择群聊', value: '' }];
		}

		if (!folder_id) {
			return [{ name: '请先选择文件夹', value: '' }];
		}

		const response = (await apiRequest.call(this, 'POST', API_PATHS.getGroupFilesByFolder, {
			group_id,
			folder_id,
			file_count: 100,
		})) as { data?: GetGroupFilesResponse };

		const files = response.data?.files || [];

		if (files.length === 0) {
			return [{ name: '该文件夹没有文件', value: '' }];
		}

		return files.map((file) => ({
			name: `${file.file_name} (${formatFileSize(file.file_size)})`,
			value: file.file_id,
			description: `上传者：${file.uploader_name || '未知'}`,
		}));
	} catch {
		return [{ name: '获取文件列表失败', value: '' }];
	}
}

/**
 * 获取群根目录文件夹列表（用于下拉选择）
 */
export async function getGroupRootFolderList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const group_id = this.getCurrentNodeParameter('group_id') as string;

		if (!group_id) {
			return [{ name: '请先选择群聊', value: '' }];
		}

		const response = (await apiRequest.call(this, 'POST', API_PATHS.getGroupRootFiles, {
			group_id,
			file_count: 100,
		})) as { data?: GetGroupFilesResponse };

		const folders = response.data?.folders || [];

		// 添加根目录选项
		const result: INodePropertyOptions[] = [
			{ name: '根目录', value: '/', description: '群文件根目录' },
		];

		if (folders.length === 0) {
			return result;
		}

		return [
			...result,
			...folders.map((folder) => ({
				name: `${folder.folder_name} (${folder.total_file_count}个文件)`,
				value: folder.folder_id,
				description: `文件夹 ID: ${folder.folder_id}`,
			})),
		];
	} catch {
		return [{ name: '获取文件夹列表失败', value: '' }];
	}
}

/**
 * 获取群所有文件夹列表（包括根目录和子文件夹，用于移动文件时选择目标文件夹）
 */
export async function getAllGroupFolderList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const group_id = this.getCurrentNodeParameter('group_id') as string;

		if (!group_id) {
			return [{ name: '请先选择群聊', value: '' }];
		}

		const response = (await apiRequest.call(this, 'POST', API_PATHS.getGroupRootFiles, {
			group_id,
			file_count: 100,
		})) as { data?: GetGroupFilesResponse };

		const folders = response.data?.folders || [];

		// 添加根目录选项
		const result: INodePropertyOptions[] = [
			{ name: '根目录 /', value: '/', description: '群文件根目录' },
		];

		if (folders.length === 0) {
			return result;
		}

		return [
			...result,
			...folders.map((folder) => ({
				name: `/ ${folder.folder_name} (${folder.total_file_count}个文件)`,
				value: folder.folder_id,
				description: `文件夹 ID: ${folder.folder_id}`,
			})),
		];
	} catch {
		return [{ name: '获取文件夹列表失败', value: '' }];
	}
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
	if (bytes < 1024) {
		return bytes + ' B';
	} else if (bytes < 1024 * 1024) {
		return (bytes / 1024).toFixed(2) + ' KB';
	} else if (bytes < 1024 * 1024 * 1024) {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	} else {
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}
}
