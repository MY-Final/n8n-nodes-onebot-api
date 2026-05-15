import { INodeProperties } from 'n8n-workflow';

export const relationshipProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'delete_friend',
		noDataExpression: true,
		options: [
			{
				name: 'Delete Friend',
				value: 'delete_friend',
				action: 'Delete friend',
			},
		],
		displayOptions: {
			show: {
				resource: ['relationship'],
			},
		},
	},

	{
		displayName: 'User Names or IDs',
		name: 'user_ids',
		type: 'multiOptions',
		description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getFriendList',
		},
		default: [],
		displayOptions: {
			show: {
				resource: ['relationship'],
				operation: ['delete_friend'],
			},
		},
	},

	{
		displayName: 'Temporary Block',
		name: 'temp_block',
		type: 'boolean',
		default: false,
		description: 'Whether to also (temporarily) block the user when deleting',
		displayOptions: {
			show: {
				resource: ['relationship'],
				operation: ['delete_friend'],
			},
		},
	},

	{
		displayName: 'Both-Side Delete',
		name: 'temp_both_del',
		type: 'boolean',
		default: false,
		description: 'Whether to delete from both sides (remove yourself from the other’s list)',
		displayOptions: {
			show: {
				resource: ['relationship'],
				operation: ['delete_friend'],
			},
		},
	},
];
