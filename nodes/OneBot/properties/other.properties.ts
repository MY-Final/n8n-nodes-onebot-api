import { INodeProperties } from 'n8n-workflow';

export const otherProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'get_status',
		options: [
			{
				name: 'Get Status',
				value: 'get_status',
				action: 'Get status',
			},
			{
				name: 'Get Version Info',
				value: 'get_version_info',
				action: 'Get version info',
			},
		],
		displayOptions: {
			show: {
				resource: ['other'],
			},
		},
	},
];
