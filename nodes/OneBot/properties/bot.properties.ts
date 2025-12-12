import { INodeProperties } from 'n8n-workflow';

//  Properties for Bot Resource
export const botProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'get_login_info',
		noDataExpression: true,
		options: [
			{
				name: 'Get Login Info',
				value: 'get_login_info',
				action: 'Get login info',
			},
		],
		displayOptions: {
			show: {
				resource: ['bot'],
			},
		},
	},
];
