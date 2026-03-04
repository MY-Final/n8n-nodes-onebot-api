import { INodeProperties } from 'n8n-workflow';

export const filesProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'upload_group_file',
		options: [
			{
				name: 'Create Group File Folder',
				value: 'create_group_file_folder',
				description: 'Create a folder in the group file system',
				action: 'Create group file folder',
			},
			{
				name: 'Delete Group File',
				value: 'delete_group_file',
				description: 'Delete a file from the group',
				action: 'Delete group file',
			},
			{
				name: 'Delete Group Folder',
				value: 'delete_group_folder',
				description: 'Delete a folder from the group',
				action: 'Delete group folder',
			},
			{
				name: 'Get File Info',
				value: 'get_file',
				description: 'Get file information by file_id or file path',
				action: 'Get file info',
			},
			{
				name: 'Get Group File System Info',
				value: 'get_group_file_system_info',
				description: 'Get group file system information',
				action: 'Get group file system info',
			},
			{
				name: 'Get Group Files By Folder',
				value: 'get_group_files_by_folder',
				description: 'Get file list from group subfolder',
				action: 'Get group files by folder',
			},
			{
				name: 'Get Group Root Files',
				value: 'get_group_root_files',
				description: 'Get file list from group root directory',
				action: 'Get group root files',
			},
			{
				name: 'Move Group File',
				value: 'move_group_file',
				description: 'Move a file to another folder',
				action: 'Move group file',
			},
			{
				name: 'Rename Group File',
				value: 'rename_group_file',
				description: 'Rename a file in the group',
				action: 'Rename group file',
			},
			{
				name: 'Upload Group File',
				value: 'upload_group_file',
				description: 'Upload a file to a group',
				action: 'Upload group file',
			},
		],
		displayOptions: {
			show: {
				resource: ['files'],
			},
		},
	},

	// 群号（所有操作都需要）
	{
		displayName: 'Group Name or ID',
		name: 'group_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
			},
		},
	},

	// ========== 上传群文件字段 ==========
	{
		displayName: 'File Path or URL',
		name: 'file',
		type: 'string',
		default: '',
		required: true,
		description: 'File path on server or URL to upload (local path, file://, or HTTP URL)',
		placeholder: '/path/to/file.txt or https://example.com/file.txt',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['upload_group_file'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'File name to display in the group',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['upload_group_file'],
			},
		},
	},
	{
		displayName: 'Folder Name or ID',
		name: 'folder',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getAllGroupFolderList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		description:
			'Parent folder (optional). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['upload_group_file'],
			},
		},
	},

	// ========== 获取群子目录文件列表字段 ==========
	{
		displayName: 'Folder Name or ID',
		name: 'folder_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupRootFolderList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['get_group_files_by_folder'],
			},
		},
	},
	{
		displayName: 'Folder Name',
		name: 'folder_name',
		type: 'string',
		default: '',
		description: 'Folder name (for display purposes)',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['get_group_files_by_folder'],
			},
		},
	},

	// ========== 文件数量（获取文件列表时使用） ==========
	{
		displayName: 'File Count',
		name: 'file_count',
		type: 'number',
		default: 50,
		description: 'Number of files to retrieve at once',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['get_group_root_files', 'get_group_files_by_folder'],
			},
		},
	},

	// ========== 获取文件信息字段 ==========
	{
		displayName: 'File Name or ID',
		name: 'file_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupRootFileList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['get_file'],
			},
		},
	},
	{
		displayName: 'File Path',
		name: 'file',
		type: 'string',
		default: '',
		description: 'File path (alternative to file_id)',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['get_file'],
			},
		},
	},

	// ========== 创建群文件文件夹字段 ==========
	{
		displayName: 'Folder Name',
		name: 'folder_name',
		type: 'string',
		default: '',
		required: true,
		description: 'Name of the folder to create',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['create_group_file_folder'],
			},
		},
	},

	// ========== 删除群文件字段 ==========
	{
		displayName: 'File Name or ID',
		name: 'file_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupRootFileList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['delete_group_file'],
			},
		},
	},

	// ========== 删除群文件夹字段 ==========
	{
		displayName: 'Folder Name or ID',
		name: 'folder_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupRootFolderList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['delete_group_folder'],
			},
		},
	},

	// ========== 移动群文件字段 ==========
	{
		displayName: 'Current Parent Directory Name or ID',
		name: 'current_parent_directory',
		type: 'options',
		description:
			'Current directory where the file is located. Usually \'/\' (root) unless you moved it before. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getGroupRootFolderList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['move_group_file'],
			},
		},
	},
	{
		displayName: 'File Name or ID',
		name: 'file_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupFileListByDirectory',
			loadOptionsDependsOn: ['group_id', 'current_parent_directory'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['move_group_file'],
			},
		},
	},
	{
		displayName: 'Target Parent Directory Name or ID',
		name: 'target_parent_directory',
		type: 'options',
		description:
			'Directory where you want to move the file to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getAllGroupFolderList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['move_group_file'],
			},
		},
	},

	// ========== 重命名群文件字段 ==========
	{
		displayName: 'Current Parent Directory Name or ID',
		name: 'current_parent_directory',
		type: 'options',
		description:
			'Current directory where the file is located. Usually \'/\' (root). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getGroupRootFolderList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['rename_group_file'],
			},
		},
	},
	{
		displayName: 'File Name or ID',
		name: 'file_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupFileListByDirectory',
			loadOptionsDependsOn: ['group_id', 'current_parent_directory'],
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['rename_group_file'],
			},
		},
	},
	{
		displayName: 'New Name',
		name: 'new_name',
		type: 'string',
		default: '',
		required: true,
		description: 'New file name',
		displayOptions: {
			show: {
				resource: ['files'],
				operation: ['rename_group_file'],
			},
		},
	},
];
