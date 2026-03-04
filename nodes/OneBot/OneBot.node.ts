import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';
import { OneBotAction } from './Interfaces';
import { botProperties } from './properties/bot.properties';
import { friendProperties } from './properties/friend.properties';
import { groupProperties } from './properties/group.properties';
import { messageProperties } from './properties/message.properties';
import { otherProperties } from './properties/other.properties';
import { relationshipProperties } from './properties/relationship.properties';
import { getFriendList } from './loadOptions/getFriendList';
import { getGroupList } from './loadOptions/getGroupList';
import { getGroupMemberList } from './loadOptions/getGroupMemberList';
import { getManagedGroupList } from './loadOptions/getManagedGroupList';
import { getOwnedGroupList } from './loadOptions/getOwnedGroupList';
import { sendLike } from './action/interactive/SendLike';
import { SendPoke } from './action/interactive/SendPoke';
import { MuteUser, MuteAll } from './action/group-managements/Mute';
import { KickUser, LeaveGroup } from './action/group-managements/Kick';
import { DeleteFriend } from './action/friend-managements/DeleFriend';
import { sendGroupSign } from './action/interactive/SendGroupSign';
import { SetAdmin } from './action/group-managements/SetAdmin';
import {
	sendPrivateMsg,
	sendGroupMsg,
	sendPrivateForwardMsg,
	sendGroupForwardMsg,
} from './action/message/SendMessage';

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
						name: '预留项',
						value: 'engagement',
					},
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
				],
			},
			...botProperties,
			...friendProperties,
			...groupProperties,
			...messageProperties,
			...otherProperties,
			...relationshipProperties,
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

				let data: IDataObject;
				switch (operation) {
					case 'send_private_msg':
						data = await sendPrivateForwardMsg.call(this, items);
						break;

					case 'send_group_msg':
						data = await sendGroupForwardMsg.call(this, items);
						break;

					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported forward operation: ${operation}`,
						);
				}

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

				case 'send_private_msg':
					data = await sendPrivateMsg.call(this, index);
					break;

				case 'send_group_msg':
					data = await sendGroupMsg.call(this, index);
					break;

				default: {
					let body: IDataObject = {};
					switch (action.operation) {
						case 'get_stranger_info':
							body.user_id = this.getNodeParameter('user_id', index) as number;
							break;

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
