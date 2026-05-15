import { INodeProperties } from 'n8n-workflow';

export const groupProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Get Group Info',
				value: 'get_group_info',
				description: 'Get group information',
				action: 'Get group info',
			},
			{
				name: 'Get Group List',
				value: 'get_group_list',
				description: 'Get all groups the bot joined',
				action: 'Get group list',
			},
			{
				name: 'Get Group Member Info',
				value: 'get_group_member_info',
				description: 'Get information of a group member',
				action: 'Get group member info',
			},
			{
				name: 'Get Group Member List',
				value: 'get_group_member_list',
				action: 'Get group member list',
			},
			{
				name: 'Group Sign',
				value: 'send_group_sign',
				description: 'Send a group sign',
				action: 'Send group sign',
			},
			{
				name: 'Kick User',
				value: 'kick_user',
				description: 'Remove a user from the group',
				action: 'Kick user from group',
			},
			{
				name: 'Leave Group',
				value: 'group_leave',
				description: 'Bot leaves the group',
				action: 'Leave group',
			},
			{
				name: 'Mute All',
				value: 'mute_all',
				description: 'Mute all members in the group',
				action: 'Mute all users in group',
			},
			{
				name: 'Mute User',
				value: 'mute_user',
				description: 'Mute a specific group member',
				action: 'Mute user in group',
			},
			{
				name: 'Send Poke',
				value: 'send_poke',
				description: 'Send a poke to a group member',
				action: 'Send poke in group',
			},
			{
				name: 'Set Admin',
				value: 'set_group_admin',
				description: 'Grant or revoke admin role of a user',
				action: 'Set group admin',
			},
			{
				name: 'Upload Group File',
				value: 'upload_group_file',
				description: 'Upload a file to the group',
				action: 'Upload group file',
			},
		],
		default: 'upload_group_file',
		displayOptions: {
			show: {
				resource: ['group'],
			},
		},
	},
	// Managed Group fields (for all group operations)
	{
		displayName: 'Managed Group Name or ID',
		name: 'managed_group_id',
		type: 'options',
		description:
			'Only shows groups where the bot is admin or owner. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getManagedGroupList',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['mute_user', 'mute_all', 'kick_user'],
				resource: ['group'],
			},
		},
	},
	// 设置管理员需要
	{
		displayName: 'Owned Group Name or ID',
		name: 'managed_group_id',
		type: 'options',
		description:
			'Only shows groups where the bot is admin or owner. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getOwnedGroupList',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['set_group_admin'],
				resource: ['group'],
			},
		},
	},
	// 退群需要所有群组（多选）
	{
		displayName: 'Group Names or IDs',
		name: 'group_ids',
		type: 'multiOptions',
		description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: [],
		displayOptions: {
			show: {
				operation: ['group_leave'],
				resource: ['group'],
			},
		},
	},
	// 其他操作的群组选择（单选）
	{
		displayName: 'Group Name or ID',
		name: 'group_id',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'send_group_sign',
					'get_group_info',
					'get_group_member_info',
					'get_group_member_list',
					'send_poke',
					'upload_group_file',
				],
				resource: ['group'],
			},
		},
	},
	// 用户选择字段（多选）- 用于需要批量操作的场景
	{
		displayName: 'User Names or IDs',
		name: 'user_ids',
		type: 'multiOptions',
		description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getGroupMemberList',
			loadOptionsDependsOn: ['managed_group_id'],
		},
		default: [],
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['mute_user', 'kick_user', 'set_group_admin'],
			},
		},
	},
	// 用户选择字段（单选）- 用于单个用户操作
	{
		displayName: 'User Name or ID',
		name: 'user_id',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getGroupMemberList',
			loadOptionsDependsOn: ['group_id'],
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['get_group_member_info', 'send_poke'],
			},
		},
	},
	// Upload Group File fields
	{
		displayName: 'File Path or URL',
		name: 'file',
		type: 'string',
		default: '',
		required: true,
		description: 'File path on server or URL to upload',
		placeholder: '/path/to/file.txt or https://example.com/file.txt',
		displayOptions: {
			show: {
				resource: ['group'],
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
				resource: ['group'],
				operation: ['upload_group_file'],
			},
		},
	},
	{
		displayName: 'Folder ID',
		name: 'folder',
		type: 'string',
		default: '',
		description: 'Parent folder ID (optional)',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['upload_group_file'],
			},
		},
	},
	{
		displayName: 'Folder ID (Alternative)',
		name: 'folder_id',
		type: 'string',
		default: '',
		description: 'Parent folder ID (compatibility field, optional)',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['upload_group_file'],
			},
		},
	},
	{
		displayName: 'Duration (Seconds)',
		name: 'duration',
		type: 'number',
		default: 60,
		required: true,
		description: 'Duration to mute the user',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['mute_user'],
			},
		},
	},
	{
		displayName: 'Reject Add Request',
		name: 'reject_add_request',
		type: 'boolean',
		default: false,
		description: "Whether to reject the user's add request (blacklist)",
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['kick_user'],
			},
		},
	},
	{
		displayName: 'Enable',
		name: 'enable',
		type: 'boolean',
		default: true,
		description: 'Whether to enable or disable admin role',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['set_group_admin'],
			},
		},
	},
	{
		displayName: 'Enable Mute All',
		name: 'enable',
		type: 'boolean',
		default: true,
		description: 'Whether to enable or disable mute all',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['mute_all'],
			},
		},
	},
];
