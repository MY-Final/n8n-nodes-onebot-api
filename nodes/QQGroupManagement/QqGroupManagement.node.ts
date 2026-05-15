import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	INodeExecutionData,
} from 'n8n-workflow';
import { apiRequest } from '../OneBot/GenericFunctions';
import { API_PATHS } from '../OneBot/constants/apiPaths';
import { checkBotGroupPermission } from '../utils/PermissionUtils';

/**
 * QQ 群管理 Tool 节点
 * 专为 AI Agent 设计的简化接口
 */
export class QqGroupManagement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'QQ Group Management',
		name: 'qqGroupManagement',
		icon: 'file:../OneBot/onebot.svg',
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
						action: 'Mute a group member for specified duration',
					},
					{
						name: 'Mute All',
						value: 'mute_all',
						description: 'Enable or disable mute all in the group',
						action: 'Enable or disable mute all in the group',
					},
					{
						name: 'Kick User',
						value: 'kick_user',
						description: 'Remove a member from the group',
						action: 'Remove a member from the group',
					},
					{
						name: 'Set Admin',
						value: 'set_admin',
						description: 'Grant or revoke admin role',
						action: 'Grant or revoke admin role',
					},
				],
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
				displayName: 'Duration (Seconds)',
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
				const group_id = this.getNodeParameter('groupId', index) as string;
				const data: IDataObject = {};

				switch (action) {
					case 'mute_user': {
						const user_id = this.getNodeParameter('userId', index) as string;
						const duration = this.getNodeParameter('duration', index) as number;

						const permission = await checkBotGroupPermission(this, group_id);
						if (!permission.canOperate) {
							throw new NodeOperationError(
								this.getNode(),
								`机器人没有权限执行禁言操作。当前角色：${
									permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
								}，需要管理员或群主权限。`,
								{ itemIndex: index },
							);
						}

						const body: IDataObject = { group_id, user_id: Number(user_id), duration };
						Object.assign(data, await apiRequest.call(this, 'POST', API_PATHS.setGroupBan, body));
						break;
					}
					case 'mute_all': {
						const enable = this.getNodeParameter('enable', index) as boolean;

						const permission = await checkBotGroupPermission(this, group_id);
						if (!permission.canOperate) {
							throw new NodeOperationError(
								this.getNode(),
								`机器人没有权限执行全员禁言操作。当前角色：${
									permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
								}，需要管理员或群主权限。`,
								{ itemIndex: index },
							);
						}

						const body: IDataObject = { group_id, enable };
						Object.assign(
							data,
							await apiRequest.call(this, 'POST', API_PATHS.setGroupWholeBan, body),
						);
						break;
					}
					case 'kick_user': {
						const user_id = this.getNodeParameter('userId', index) as string;
						const reject_add_request = this.getNodeParameter(
							'reject_add_request',
							index,
							false,
						) as boolean;

						const permission = await checkBotGroupPermission(this, group_id);
						if (!permission.canOperate) {
							throw new NodeOperationError(
								this.getNode(),
								`机器人没有权限执行踢人操作。当前角色：${
									permission.isOwner ? '群主' : permission.isAdmin ? '管理员' : '普通成员'
								}，需要管理员或群主权限。`,
								{ itemIndex: index },
							);
						}

						const body: IDataObject = {
							group_id,
							user_id: Number(user_id),
							reject_add_request,
						};
						Object.assign(
							data,
							await apiRequest.call(this, 'POST', API_PATHS.setGroupKick, body),
						);
						break;
					}
					case 'set_admin': {
						const user_id = this.getNodeParameter('userId', index) as string;
						const enable = this.getNodeParameter('enable', index) as boolean;

						const body: IDataObject = {
							group_id,
							user_id: Number(user_id),
							enable,
						};
						Object.assign(
							data,
							await apiRequest.call(this, 'POST', API_PATHS.setGroupAdmin, body),
						);
						break;
					}
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
