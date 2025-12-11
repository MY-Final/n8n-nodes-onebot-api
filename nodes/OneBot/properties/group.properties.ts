import { INodeProperties } from 'n8n-workflow';

export const groupProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'hidden',
		default: 'group',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Mute User',
				value: 'mute_user',
				description: 'Mute a specific group member',
				action: 'Mute user in group',
			},
			{
				name: 'Mute All',
				value: 'mute_all',
				description: 'Mute all members in the group',
				action: 'Mute all users in group',
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
				name: 'Set Admin',
				value: 'set_group_admin',
				description: 'Grant or revoke admin role of a user',
				action: 'Set group admin',
			},
			{
				name: 'Group Sign',
				value: 'send_group_sign',
				description: 'Send a group sign',
				action: 'Send group sign',
			}
		],
		default: 'mute_user',
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
		description: 'Only shows groups where the bot is admin or owner. You can also specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
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
		description: 'Only shows groups where the bot is admin or owner. You can also specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
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
	// 退群需要所有群组
	{
		displayName: 'Managed Group Name or ID',
		name: 'managed_group_id',
		type: 'options',
		description: 'Only shows groups where the bot is admin or owner. You can also specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['group_leave','send_group_sign'],
				resource: ['group'],
			},
		},
	},
	// Fields for specific actions
	{
		displayName: 'User',
		name: 'user_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupMemberList',
			loadOptionsDependsOn: ['group_id', 'managed_group_id','set_group_admin'],
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['mute_user', 'kick_user', 'set_group_admin'],
			},
		},
	},
	{
		displayName: 'Duration (seconds)',
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
