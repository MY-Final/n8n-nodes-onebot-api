import { INodeProperties } from 'n8n-workflow';

export const messageProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'send_private_msg',
		noDataExpression: true,
		options: [
			{
				name: 'Send Private Message',
				value: 'send_private_msg',
				action: 'Send private message',
			},
			{
				name: 'Send Group Message',
				value: 'send_group_msg',
				action: 'Send group message',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
	},

	// 接收者 (私聊)
	{
		displayName: 'User Name or ID',
		name: 'user_id',
		type: 'options',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getFriendList',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['send_private_msg'],
				resource: ['message'],
			},
		},
	},

	// 群号 (群消息)
	{
		displayName: 'Group Name or ID',
		name: 'group_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: {
			show: {
				operation: ['send_group_msg'],
				resource: ['message'],
			},
		},
	},

	// 文本
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
			},
		},
	},

	// forward mode
	{
		displayName: 'Forward Mode',
		name: 'forward_mode',
		type: 'boolean',
		noDataExpression: true,
		default: false,
		description: 'Whether to forward messages when there are multiple items',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
			},
		},
	},
];
