import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';
import { LoginInfo, MessageAction, OneBotAction } from './Interfaces';
import { getFriendList, getGroupList, getGroupMemberList } from './SearchFunctions';
import { sendLike } from './action/interactive/SendLike';
import { SendPoke } from './action/interactive/SendPoke';
import { MuteUser, MuteAll } from './action/group-managements/Mute';
import { getManagedGroupList, getOwnedGroupList } from '../utils/ManagedGroupUtils';
import { KickUser, LeaveGroup } from './action/group-managements/Kick';
import { DeleteFriend } from './action/friend-managements/DeleFriend';
import { sendGroupSign } from './action/interactive/SendGroupSign';
import { SetAdmin } from './action/group-managements/SetAdmin';

export class OneBot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot',
		name: 'oneBot',
		icon: 'file:onebot.svg',
		description: 'Consume OneBot API',
		subtitle: '={{ $parameter["operation"] }}',
		version: 1,
		defaults: {
			name: 'OneBot',
		},
		group: ['transform'],
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'oneBotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'message',
				options: [
					{
						name: 'Bot',
						value: 'bot',
					},
					{
						name: 'Friend',
						value: 'friend',
					},
					{
						name: 'Group',
						value: 'group',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Other',
						value: 'other',
					},
					{
						name: 'Relationship',
						value: 'relationship',
					},
					{
						name: 'Engagement',
						value: 'engagement',
					}
				],
			},
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
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				default: 'get_group_list',
				noDataExpression: true,
				options: [
					{
						name: 'Get Group Info',
						value: 'get_group_info',
						action: 'Get group info',
					},
					{
						name: 'Get Group List',
						value: 'get_group_list',
						action: 'Get group list',
					},
					{
						name: 'Get Group Member Info',
						value: 'get_group_member_info',
						action: 'Get group member info',
					},
					{
						name: 'Get Group Member List',
						value: 'get_group_member_list',
						action: 'Get group member list',
					},
					{
						name: 'Kick User',
						value: 'kick_user',
						action: 'Kick user',
					},
					{
						name: 'Leave Group',
						value: 'group_leave',
						action: 'Leave group',
					},
					{
						name: 'Mute All',
						value: 'mute_all',
						action: 'Mute all',
					},
					{
						name: 'Mute User',
						value: 'mute_user',
						action: 'Mute user',
					},
					{
						name: 'Send Poke',
						value: 'send_poke',
						action: 'Send poke',
					},
					{
						name: 'Group Sign',
						value: 'send_group_sign',
						action: 'Send group sign',
					},
					{
						name: 'Set Admin',
						value: 'set_group_admin',
						action: 'Set group admin',
					}
				],
				displayOptions: {
					show: {
						resource: ['group'],
					},
				},
			},
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
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
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
						operation: ['send_private_msg', 'get_stranger_info', 'send_like', 'send_poke'],
						resource: ['friend'],
					},
				},
			},
			{
				displayName: 'Group Name or ID',
				name: 'group_id',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getGroupList',
				},
				default: '',
				displayOptions: {
					show: {
						operation: [
							'send_group_msg',
							'get_group_info',
							'get_group_member_list',
							'get_group_member_info',
							'send_poke',
							'group_leave',
							'send_group_sign'
						],
						resource: ['group'],
					},
				},
			},
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
			// 可以选择单个选项
			{
				displayName: 'Member Name or ID',
				name: 'user_id',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					loadOptionsDependsOn: ['group_id', 'managed_group_id'],
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['get_group_member_info', 'send_poke'],
						resource: ['group'],
					},
				},
			},
			// 可以选择多个选项
			{
				displayName: 'Member Names or IDs',
				name: 'user_ids',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					// 让成员加载在禁言/踢人场景下同时依赖 managed_group_id 或 group_id
					loadOptionsDependsOn: ['group_id', 'managed_group_id'],
				},
				default: [],
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: ['mute_user', 'kick_user'],
						resource: ['group'],
					},
				},
			},
			{
				displayName: 'Reject Add Request',
				name: 'reject_add_request',
				type: 'boolean',
				default: false,
				description: 'Whether to reject the kicked user from rejoining the group',
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['kick_user'],
					},
				},
			},
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
			{
				displayName: 'Duration (Seconds)',
				name: 'duration',
				type: 'number',
				typeOptions: {
					minValue: 0,
					numberStepSize: 1,
				},
				default: 60,
				description: '禁言时长（秒），0 表示解除禁言',
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
				description: 'Whether to enable mute all',
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['mute_all'],
					},
				},
			},
			{
				displayName: 'Owned Group Name or ID',
				name: 'group_id',
				type: 'options',
				description: 'Only shows groups where you are the owner. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
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
			{
				displayName: 'Member Name or ID',
				name: 'user_id',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					loadOptionsDependsOn: ['group_id'],
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['set_group_admin'],
						resource: ['group'],
					},
				},
			},
			{
				displayName: 'Enable Admin',
				name: 'enable',
				type: 'boolean',
				default: true,
				description: 'Whether to set as admin (true) or remove admin privileges (false)',
				displayOptions: {
					show: {
						operation: ['set_group_admin'],
						resource: ['group'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			getFriendList,
			getGroupList,
			getGroupMemberList,
			getManagedGroupList,
			getOwnedGroupList,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource');

		if (resource === 'message' && items.length > 1) {
			const forward_mode = this.getNodeParameter('forward_mode', 0) as boolean;
			if (forward_mode) {
				const operation = this.getNodeParameter('operation', 0) as string;
				const action = { resource, operation } as MessageAction;

				const { data: info } = (await apiRequest.call(this, 'GET', '/get_login_info')) as {
					data: LoginInfo;
				};

				const body: IDataObject = {};
				body.messages = items.map((item, index) => ({
					type: 'node',
					data: {
						name: info.nickname,
						uin: info.user_id.toString(),
						content: this.getNodeParameter('message', index) as string,
					},
				}));

				let endpoint = '';
				switch (action.operation) {
					case 'send_private_msg':
						endpoint = '/send_private_forward_msg';
						body.user_id = this.getNodeParameter('user_id', 0) as number;
						break;

					case 'send_group_msg':
						endpoint = '/send_group_forward_msg';
						body.group_id = this.getNodeParameter('group_id', 0) as number;
						break;
				}
				const data = await apiRequest.call(this, 'POST', endpoint, body);
				const json = this.helpers.returnJsonArray(data);
				return [json];
			}
		}

		const result: INodeExecutionData[] = [];
		for (let index = 0; index < items.length; index++) {
			const operation = this.getNodeParameter('operation', index);
			const action = { resource, operation } as OneBotAction;

			let data: IDataObject;
			switch (action.operation) {
				case 'send_like':
					data = await sendLike.call(this, index);
					break;

				case 'send_poke':
					data = await SendPoke.call(this, index);
					break;

				case 'mute_user':
					data = await MuteUser.call(this, index);
					break;

				case 'mute_all':
					data = await MuteAll.call(this, index);
					break;

				case 'kick_user':
					data = await KickUser.call(this, index);
					break;

				case 'group_leave':
					data = await LeaveGroup.call(this, index);
					break;

				case 'delete_friend':
					data = await DeleteFriend.call(this, index);
					break;
				case 'send_group_sign':
					data = await sendGroupSign.call(this, index);
					break;

				case 'set_group_admin':
					data = await SetAdmin.call(this, index);
					break;

				default: {
					let body: IDataObject = {};
					switch (action.operation) {
						case 'send_private_msg':
							body.message = this.getNodeParameter('message', index) as string;
						case 'get_stranger_info':
							body.user_id = this.getNodeParameter('user_id', index) as number;
							break;

						case 'send_group_msg':
							body.message = this.getNodeParameter('message', index) as string;
						case 'get_group_member_list':
						case 'get_group_info':
							body.group_id = this.getNodeParameter('group_id', index) as number;
							break;

						case 'get_group_member_info':
							body.group_id = this.getNodeParameter('group_id', index) as number;
							body.user_id = this.getNodeParameter('user_id', index) as number;
							break;
					}

					const method: IHttpRequestMethods = Object.keys(body).length == 0 ? 'GET' : 'POST';
					data = await apiRequest.call(this, method, action.operation, body);
					break;
				}
			}

			const json = this.helpers.returnJsonArray(data);
			const executionData = this.helpers.constructExecutionMetaData(json, {
				itemData: { item: index },
			});

			result.push(...executionData);
		}
		return [result];
	}
}
