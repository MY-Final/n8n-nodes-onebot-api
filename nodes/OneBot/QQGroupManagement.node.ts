import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	INodeExecutionData,
} from 'n8n-workflow';
import { MuteUser, MuteAll } from './action/group-managements/Mute';
import { KickUser } from './action/group-managements/Kick';
import { SetAdmin } from './action/group-managements/SetAdmin';

/**
 * QQ 群管理 Tool 节点
 * 专为 AI Agent 设计的简化接口
 */
export class QQGroupManagement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'QQ Group Management',
		name: 'qqGroupManagement',
		icon: 'file:onebot.svg',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["action"] }}',
		description: 'Manage QQ groups: mute, kick, set admin',
		defaults: {
			name: 'QQ Group Management',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'oneBotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				default: 'mute_user',
				options: [
					{
						name: 'Mute User',
						value: 'mute_user',
						description: 'Mute a group member for specified duration',
					},
					{
						name: 'Mute All',
						value: 'mute_all',
						description: 'Enable or disable mute all in the group',
					},
					{
						name: 'Kick User',
						value: 'kick_user',
						description: 'Remove a member from the group',
					},
					{
						name: 'Set Admin',
						value: 'set_admin',
						description: 'Grant or revoke admin role',
					},
				],
				description: 'Choose the management action to perform',
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'string',
				default: '',
				required: true,
				description: 'QQ group number',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						action: ['mute_user', 'kick_user', 'set_admin'],
					},
				},
				description: 'QQ number of the user to manage',
			},
			{
				displayName: 'Duration (seconds)',
				name: 'duration',
				type: 'number',
				default: 60,
				required: true,
				displayOptions: {
					show: {
						action: ['mute_user'],
					},
				},
				description: 'How long to mute the user in seconds',
			},
			{
				displayName: 'Enable',
				name: 'enable',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						action: ['mute_all', 'set_admin'],
					},
				},
				description: 'Whether to enable or disable the action',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const result: INodeExecutionData[] = [];

		for (let index = 0; index < items.length; index++) {
			try {
				const action = this.getNodeParameter('action', index) as string;
				let data: IDataObject;

				switch (action) {
					case 'mute_user':
						data = await MuteUser.call(this, index);
						break;
					case 'mute_all':
						data = await MuteAll.call(this, index);
						break;
					case 'kick_user':
						data = await KickUser.call(this, index);
						break;
					case 'set_admin':
						data = await SetAdmin.call(this, index);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown action: ${action}`, {
							itemIndex: index,
						});
				}

				const json = this.helpers.returnJsonArray(data);
				result.push(...json);
			} catch (error) {
				if (this.continueOnFail()) {
					result.push({ json: { error: error.message }, pairedItem: { item: index } });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: index });
				}
			}
		}

		return [result];
	}
}
