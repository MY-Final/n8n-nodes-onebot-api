import { INodeProperties } from 'n8n-workflow';

export const messageProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'send_msg',
		options: [
			{
				name: 'Send Message',
				value: 'send_msg',
				description: 'Send private or group message (unified interface)',
				action: 'Send message',
			},
			{
				name: 'Send Private Message',
				value: 'send_private_msg',
				description: 'Send a private message',
				action: 'Send private message',
			},
			{
				name: 'Send Group Message',
				value: 'send_group_msg',
				description: 'Send a group message',
				action: 'Send group message',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
	},

	// 消息类型（仅 send_msg 使用）
	{
		displayName: 'Message Type',
		name: 'message_type',
		type: 'options',
		default: 'group',
		options: [
			{
				name: 'Private',
				value: 'private',
			},
			{
				name: 'Group',
				value: 'group',
			},
		],
		displayOptions: {
			show: {
				operation: ['send_msg'],
				resource: ['message'],
			},
		},
	},

	// 接收者 (私聊) - send_private_msg
	{
		displayName: 'User Name or ID',
		name: 'user_id',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getFriendList',
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg'],
			},
		},
	},

	// 接收者 (私聊) - send_msg + message_type=private
	{
		displayName: 'User Name or ID',
		name: 'user_id',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getFriendList',
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_msg'],
				message_type: ['private'],
			},
		},
	},

	// 群号 (群消息) - send_group_msg
	{
		displayName: 'Group Name or ID',
		name: 'group_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_group_msg'],
			},
		},
	},

	// 群号 (群消息) - send_msg + message_type=group
	{
		displayName: 'Group Name or ID',
		name: 'group_id',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getGroupList',
		},
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_msg'],
				message_type: ['group'],
			},
		},
	},

	// 文本/消息段
	{
		displayName: 'Message',
		name: 'message',
		type: 'json',
		typeOptions: {
			rows: 10,
		},
		default: '',
		description:
			'Message content. Can be plain text, CQ code string, or JSON array of message segments. For example: [{"type":"text","data":{"text":"hello"}}]',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_msg', 'send_private_msg', 'send_group_msg'],
			},
		},
	},

	// 纯文本转义
	{
		displayName: 'Auto Escape',
		name: 'auto_escape',
		type: 'boolean',
		default: false,
		description: 'Whether to send as plain text (escape CQ codes)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_msg', 'send_private_msg', 'send_group_msg'],
			},
		},
	},

	// 转发模式（用于普通消息多条输入）
	{
		displayName: 'Forward Mode',
		name: 'forward_mode',
		type: 'boolean',
		noDataExpression: true,
		default: false,
		description: 'Whether to send as forward message (supports single or multiple items)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
			},
		},
	},

	// ========== 合并转发专属参数（仅当 Forward Mode=true 时显示） ==========

	// 自定义发送者（全局配置，每条消息也可以单独覆盖）
	{
		displayName: 'Use Custom Sender',
		name: 'use_custom_sender',
		type: 'boolean',
		default: false,
		description: 'Whether to use custom sender info instead of bot info',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
			},
		},
	},

	// 发送者昵称（全局配置）
	{
		displayName: 'Sender Nickname',
		name: 'sender_nickname',
		type: 'string',
		default: '',
		description: 'Default sender nickname (can be overridden per message)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
				use_custom_sender: [true],
			},
		},
	},

	// 发送者 QQ 号（全局配置）
	{
		displayName: 'Sender UIN',
		name: 'sender_uin',
		type: 'string',
		default: '',
		description: 'Default sender QQ number (can be overridden per message)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
				use_custom_sender: [true],
			},
		},
	},

	// 消息时间（全局配置）
	{
		displayName: 'Time',
		name: 'time',
		type: 'string',
		default: '',
		description: 'Message timestamp (Unix timestamp or ISO string)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
			},
		},
	},

	// 来源（全局配置）
	{
		displayName: 'Source',
		name: 'source',
		type: 'string',
		default: '',
		description: 'Forward message source',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
			},
		},
	},

	// 摘要（全局配置）
	{
		displayName: 'Summary',
		name: 'summary',
		type: 'string',
		default: '',
		description: 'Forward message summary',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
			},
		},
	},

	// 提示（全局配置）
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		default: '',
		description: 'Forward message prompt',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
			},
		},
	},

	// news 参数（数组）（全局配置）
	{
		displayName: 'News',
		name: 'news',
		type: 'fixedCollection',
		default: {},
		description: 'Forward message news',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send_private_msg', 'send_group_msg'],
				forward_mode: [true],
			},
		},
		options: [
			{
				name: 'newsItem',
				displayName: 'News Item',
				values: [
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
];
