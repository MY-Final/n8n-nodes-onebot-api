import { INodeProperties } from 'n8n-workflow';

export const friendProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'get_friend_list',
		noDataExpression: true,
		options: [
			{
				name: 'Get Friend List',
				value: 'get_friend_list',
				action: 'Get friend list',
			},
			{
				name: 'Get Stranger Info',
				value: 'get_stranger_info',
				action: 'Get stranger info',
			},
			{
				name: 'Send Like',
				value: 'send_like',
				action: 'Send like',
			},
			{
				name: 'Send Poke',
				value: 'send_poke',
				action: 'Send poke',
			},
		],
		displayOptions: {
			show: {
				resource: ['friend'],
			},
		},
	},

	// user_id
	{
		displayName: 'User Names or IDs',
		name: 'user_ids',
		type: 'multiOptions',
		description:
			'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getFriendList',
		},
		default: [],
		displayOptions: {
			show: {
				operation: ['send_like', 'send_poke'],
				resource: ['friend'],
			},
		},
	},
	{
		displayName: 'User Name or ID',
		name: 'user_id',
		type: 'options',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getFriendList',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['send_private_msg', 'get_stranger_info'],
				resource: ['friend'],
			},
		},
	},

	// 点赞次数
	{
		displayName: 'Times',
		name: 'times',
		type: 'number',
		typeOptions: {
			minValue: 1,
			numberStepSize: 1,
		},
		default: 1,
		description: '点赞次数',
		displayOptions: {
			show: {
				resource: ['friend'],
				operation: ['send_like'],
			},
		},
	},
];
