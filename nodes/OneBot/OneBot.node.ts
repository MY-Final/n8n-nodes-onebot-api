import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	ILoadOptionsFunctions,
	NodeOperationError,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';
import { LoginInfo } from './Interfaces';
import { getFriendList, getGroupList, getGroupMemberList } from './SearchFunctions';
import { executeBotOperation } from './BotActions';
import { executeFriendOperation } from './FriendActions';
import { executeGroupOperation } from './GroupActions';
import { executeMiscOperation } from './MiscActions';
import { executeMessageOperation } from './MessageActions';
import { handleMultipleInputsForward } from './ForwardActions';
import { executeMemberOperation } from './MemberActions';

export class OneBot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot-api',
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
						name: '成员关系',
						value: 'member',
					},
					{
						name: '好友',
						value: 'friend',
					},
					{
						name: '机器人',
						value: 'bot',
					},
					{
						name: '其他',
						value: 'misc',
					},
					{
						name: '群组',
						value: 'group',
					},
					{
						name: '消息',
						value: 'message',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				default: 'get_login_info',
				noDataExpression: true,
				options: [
					{
						name: '获取登录信息',
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
						name: '获取好友列表',
						value: 'get_friend_list',
						action: 'Get friend list',
					},
					{
						name: '获取陌生人信息',
						value: 'get_stranger_info',
						action: 'Get stranger info',
					},
					{
						name: '给好友点赞',
						value: 'send_like',
						action: 'Send like to a friend',
					},
					{
						name: '私聊戳一戳',
						value: 'send_friend_poke',
						action: 'Send friend poke',
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
						name: '获取群成员列表',
						value: 'get_group_member_list',
						action: 'Get group member list',
					},
					{
						name: '获取群成员信息',
						value: 'get_group_member_info',
						action: 'Get group member info',
					},
					{
						name: '获取群列表',
						value: 'get_group_list',
						action: 'Get group list',
					},
					{
						name: '获取群信息',
						value: 'get_group_info',
						action: 'Get group info',
					},
					{
						name: '禁言群成员',
						value: 'set_group_ban',
						action: 'Set group ban',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '全员禁言',
						value: 'set_group_whole_ban',
						action: 'Set group whole ban',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '群戳一戳',
						value: 'group_poke',
						action: 'Group poke',
						description: '群戳一戳，戳了一下你，嘻嘻',
					},
					{
						name: '设置群管理员',
						value: 'set_group_admin',
						action: 'Set group admin',
						description: '要求机器人是群主',
					},
					{
						name: '设置群名称',
						value: 'set_group_name',
						action: 'Set group name',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '设置群签到',
						value: 'set_group_sign',
						action: 'Set group sign',
					},
					{
						name: '踢出群成员',
						value: 'set_group_kick',
						action: 'Set group kick',
						description: '要求机器人是管理员或者群主',
					},
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
				default: 'set_group_leave',
				noDataExpression: true,
				options: [
					{
						name: '退出群聊',
						value: 'set_group_leave',
						action: 'Leave group',
						description: '退出群聊，如果是群主则解散群',
					},
					{
						name: '删除好友',
						value: 'delete_friend',
						action: 'Delete friend',
						description: 'Delete friend',
					},
					{
						name: '批量操作',
						value: 'batch_operation',
						action: 'Batch operation',
						description: '批量退群和删除好友，支持白名单',
					},
					{
						name: '随机删除好友',
						value: 'random_delete_friends',
						action: 'Random delete friends',
						description: '随机删除指定数量范围内的好友，支持白名单',
					},
				],
				displayOptions: {
					show: {
						resource: ['member'],
					},
				},
			},
			// 退群操作的参数
			{
				displayName: 'Group Name or ID',
				name: 'group_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getGroupList',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['set_group_leave'],
						resource: ['member'],
					},
				},
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
			{
				displayName: '是否解散群',
				name: 'is_dismiss',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['set_group_leave'],
						resource: ['member'],
					},
				},
				description: 'Whether to dismiss the group (if you are the owner)',
			},
			// 删除好友操作的参数
			{
				displayName: 'User Name or ID',
				name: 'user_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFriendList',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['delete_friend'],
						resource: ['member'],
					},
				},
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				default: 'send_private_msg',
				noDataExpression: true,
				options: [
					{
						name: '发送私聊消息',
						value: 'send_private_msg',
						action: 'Send private message',
					},
					{
						name: '发送群消息',
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
				noDataExpression: true,
				default: 'get_status',
				options: [
					{
						name: '获取状态',
						value: 'get_status',
						action: 'Get status',
					},
					{
						name: '获取版本信息',
						value: 'get_version_info',
						action: 'Get version info',
					},
				],
				displayOptions: {
					show: {
						resource: ['misc'],
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
				required: true,
				displayOptions: {
					show: {
						operation: ['send_private_msg', 'get_stranger_info', 'send_like', 'send_friend_poke'],
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
				required: true,
				displayOptions: {
					show: {
						operation: [
							'get_group_info',
							'get_group_member_info',
							'get_group_member_list',
							'send_group_msg',
							'group_poke',
							'set_group_sign',
						],
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
					loadOptionsMethod: 'getManagedGroupList',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'set_group_kick',
							'set_group_ban',
							'set_group_whole_ban',
							'set_group_name',
						],
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
					loadOptionsMethod: 'getOwnedGroupList',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'set_group_admin',
						],
					},
				},
			},
			{
				displayName: 'Member Name or ID',
				name: 'user_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					loadOptionsDependsOn: ['group_id'],
				},
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				required: true,
				displayOptions: {
					show: {
						operation: ['get_group_member_info', 'group_poke'],
					},
				},
			},
			{
				displayName: '成员 Names or IDs',
				name: 'user_ids',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					loadOptionsDependsOn: ['group_id'],
				},
				default: [],
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				required: true,
				displayOptions: {
					show: {
						operation: ['set_group_kick', 'set_group_ban', 'set_group_admin'],
					},
				},
			},
			{
				displayName: 'Times',
				name: 'times',
				type: 'number',
				description: '非SVIP用户每天只能点赞10次',
				default: 1,
				displayOptions: {
					show: {
						resource: ['friend'],
						operation: ['send_like'],
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
				displayName: '转发模式',
				name: 'forward_mode',
				type: 'boolean',
				default: false,
				description: 'Whether to use forward message format for multiple messages',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
					},
				},
			},
			{
				displayName: '转发消息设置',
				name: 'forwardSettings',
				type: 'collection',
				default: {
					summary: '聊天记录',
					source: '来自好友的消息',
					prompt: '查看完整聊天记录',
					news: '查看详细内容'
				},
				placeholder: '配置转发消息的基本信息',
				options: [
					{
						displayName: '消息摘要',
						name: 'summary',
						type: 'string',
						default: '聊天记录',
						description: '显示在转发消息卡片顶部的标题文字',
					},
					{
						displayName: '消息来源',
						name: 'source',
						type: 'string',
						default: '来自好友的消息',
						description: '显示在转发消息卡片右上角的来源文字',
					},
					{
						displayName: '提示文字',
						name: 'prompt',
						type: 'string',
						default: '查看完整聊天记录',
						description: '显示在转发消息卡片底部的提示文字',
					},
					{
						displayName: '文本内容',
						name: 'news',
						type: 'string',
						default: '查看详细内容',
						description: '转发消息中的文本内容',
					},
				],
				description: '配置转发消息的显示效果',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [true],
					},
				},
			},
			{
				displayName: '自定义发送者信息',
				name: 'customSender',
				type: 'boolean',
				default: false,
				description: 'Whether to customize sender information for each message',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [true],
					},
				},
			},
			{
				displayName: '发送者信息',
				name: 'senderInfo',
				type: 'collection',
				default: {},
				placeholder: '配置转发消息的发送者信息',
				options: [
					{
						displayName: '用户ID',
						name: 'user_id',
						type: 'string',
						default: '',
						description: '显示的发送者QQ号（不填则使用机器人QQ号）',
					},
					{
						displayName: '昵称',
						name: 'nickname',
						type: 'string',
						default: '',
						description: '显示的发送者昵称（不填则使用机器人昵称）',
					},
				],
				description: '配置发送者信息（用于多条消息使用相同发送者）',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [true],
						customSender: [true],
					},
				},
			},
			{
				displayName: '@全体成员',
				name: 'atAll',
				type: 'boolean',
				default: false,
				description: 'Whether to add @all at the beginning of the message',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: '@特定成员',
				name: 'atUser',
				type: 'boolean',
				default: false,
				description: 'Whether to @specific members in the message',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: '要@的成员 Name or ID',
				name: 'atUserId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					loadOptionsDependsOn: ['group_id'],
				},
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_group_msg'],
						atUser: [true],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: '发送图片',
				name: 'sendImage',
				type: 'boolean',
				default: false,
				description: 'Whether to send images',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: '图片来源',
				name: 'imageSource',
				type: 'options',
				options: [
					{
						name: '网络图片',
						value: 'url',
					},
					{
						name: '本地图片',
						value: 'file',
					},
					{
						name: 'Base64编码',
						value: 'base64',
					},
				],
				default: 'url',
				description: '图片的来源类型',
				displayOptions: {
					show: {
						sendImage: [true],
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: '图片URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				placeholder: 'http://example.com/image.jpg',
				description: '网络图片的URL地址',
				displayOptions: {
					show: {
						sendImage: [true],
						imageSource: ['url'],
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: '本地图片路径',
				name: 'imagePath',
				type: 'string',
				default: '',
				placeholder: 'D:/images/example.jpg',
				description: '本地图片的完整路径',
				displayOptions: {
					show: {
						sendImage: [true],
						imageSource: ['file'],
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: 'Base64编码图片',
				name: 'imageBase64',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/...',
				description: '图片的Base64编码（不需要包含前缀如"data:image/jpeg;base64,"）',
				displayOptions: {
					show: {
						sendImage: [true],
						imageSource: ['base64'],
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [false],
					},
				},
			},
			{
				displayName: 'Ban Duration (Seconds)',
				name: 'duration',
				type: 'number',
				description: '禁言时长，单位秒，0表示取消禁言',
				default: 1800,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['set_group_ban'],
					},
				},
			},
			{
				displayName: 'Reject Future Join Requests',
				name: 'reject_add_request',
				type: 'boolean',
				description: 'Whether to add to blacklist and reject future join requests',
				default: false,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['set_group_kick'],
					},
				},
			},
			{
				displayName: 'Enable Ban',
				name: 'enable',
				type: 'boolean',
				description: 'Whether to enable whole group ban',
				default: true,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['set_group_whole_ban'],
					},
				},
			},
			{
				displayName: 'New Group Name',
				name: 'group_name',
				type: 'string',
				description: '设置新的群名称',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['set_group_name'],
					},
				},
			},
			{
				displayName: 'Enable Admin',
				name: 'enable',
				type: 'boolean',
				description: 'Whether to set as admin, true to set, false to unset, note: only group owner can set or unset admin',
				default: true,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['set_group_admin'],
					},
				},
			},
			// 批量操作的参数
			{
				displayName: '操作模式',
				name: 'batch_mode',
				type: 'options',
				options: [
					{
						name: '退出所有群聊',
						value: 'groups',
					},
					{
						name: '删除所有好友',
						value: 'friends',
					},
					{
						name: '两者都执行',
						value: 'both',
					},
				],
				default: 'both',
				required: true,
				displayOptions: {
					show: {
						operation: ['batch_operation'],
						resource: ['member'],
					},
				},
				description: '选择要批量执行的操作',
			},
			{
				displayName: '使用白名单',
				name: 'use_whitelist',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['batch_operation'],
						resource: ['member'],
					},
				},
				description: 'Whether to use whitelist to exclude certain groups or friends',
			},
			{
				displayName: '群聊 Names or IDs',
				name: 'whitelist_groups',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getGroupList',
				},
				default: [],
				displayOptions: {
					show: {
						operation: ['batch_operation'],
						resource: ['member'],
						use_whitelist: [true],
						batch_mode: ['groups', 'both'],
					},
				},
				description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
			{
				displayName: '好友 Names or IDs',
				name: 'whitelist_friends',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFriendList',
				},
				default: [],
				displayOptions: {
					show: {
						operation: ['batch_operation'],
						resource: ['member'],
						use_whitelist: [true],
						batch_mode: ['friends', 'both'],
					},
				},
				description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
			{
				displayName: '是否解散群聊',
				name: 'is_dismiss_batch',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['batch_operation'],
						resource: ['member'],
						batch_mode: ['groups', 'both'],
					},
				},
				description: 'Whether to dismiss groups when leaving (if you are the owner)',
			},
			// 随机删除好友的参数
			{
				displayName: '最大删除数量',
				name: 'max_friends_to_delete',
				type: 'number',
				default: 5,
				required: true,
				displayOptions: {
					show: {
						operation: ['random_delete_friends'],
						resource: ['member'],
					},
				},
				description: '设置随机删除好友的最大数量，实际删除数量为1到此数字之间的随机值',
			},
			{
				displayName: '使用白名单',
				name: 'use_whitelist_random',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['random_delete_friends'],
						resource: ['member'],
					},
				},
				description: 'Whether to use whitelist to exclude certain friends from random deletion',
			},
			{
				displayName: '好友 Names or IDs',
				name: 'whitelist_friends_random',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getFriendList',
				},
				default: [],
				displayOptions: {
					show: {
						operation: ['random_delete_friends'],
						resource: ['member'],
						use_whitelist_random: [true],
					},
				},
				description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
		],
	};

	methods = {
		loadOptions: {
			getFriendList,
			getGroupList,
			getGroupMemberList,
			async getManagedGroupList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const loginInfo = await apiRequest.call(this, 'GET', 'get_login_info') as {
						data: LoginInfo
					};

					if (!loginInfo?.data?.user_id) {
						console.error('获取登录信息失败，无法获取管理的群聊');
						return [{ name: '获取失败', value: '', description: '无法获取登录信息' }];
					}

					const botId = loginInfo.data.user_id;
					console.log(`当前机器人QQ: ${botId}`);

					const groupListResponse = await apiRequest.call(this, 'GET', 'get_group_list') as {
						data: {
							group_id: number;
							group_name: string;
							role?: string;
						}[];
					};

					if (!groupListResponse?.data || !Array.isArray(groupListResponse.data)) {
						console.error('获取群列表失败');
						return [{ name: '获取失败', value: '', description: '无法获取群列表' }];
					}

					const managedGroups = [];

					for (const group of groupListResponse.data) {
						if (group.role && (group.role === 'admin' || group.role === 'owner')) {
							managedGroups.push({
								name: `${group.group_name} (${group.role === 'owner' ? '群主' : '管理员'})`,
								value: group.group_id,
								description: group.group_id.toString(),
							});
							continue;
						}

						try {
							const query = { group_id: group.group_id, user_id: botId };
							const memberInfo = await apiRequest.call(this, 'GET', 'get_group_member_info', undefined, query) as {
								data?: {
									role?: string;
								}
							};

							if (memberInfo?.data?.role) {
								const role = memberInfo.data.role;
								if (role === 'admin' || role === 'owner') {
									managedGroups.push({
										name: `${group.group_name} (${role === 'owner' ? '群主' : '管理员'})`,
										value: group.group_id,
										description: group.group_id.toString(),
									});
								}
							}
						} catch (error) {
							console.error(`获取群 ${group.group_id} 的成员信息失败:`, error);
							continue;
						}
					}

					if (managedGroups.length === 0) {
						return [{ name: '没有管理权限的群聊', value: '', description: '机器人不是任何群的管理员或群主' }];
					}

					return managedGroups;
				} catch (error) {
					console.error('获取管理的群聊列表失败:', error instanceof Error ? error.message : String(error));
					return [{ name: '获取失败', value: '', description: '获取管理的群聊列表时出错' }];
				}
			},
			async getOwnedGroupList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const loginInfo = await apiRequest.call(this, 'GET', 'get_login_info') as {
						data: LoginInfo
					};

					if (!loginInfo?.data?.user_id) {
						console.error('获取登录信息失败，无法获取管理的群聊');
						return [{ name: '获取失败', value: '', description: '无法获取登录信息' }];
					}

					const botId = loginInfo.data.user_id;
					console.log(`当前机器人QQ: ${botId}`);

					const groupListResponse = await apiRequest.call(this, 'GET', 'get_group_list') as {
						data: {
							group_id: number;
							group_name: string;
							role?: string;
						}[];
					};

					if (!groupListResponse?.data || !Array.isArray(groupListResponse.data)) {
						console.error('获取群列表失败');
						return [{ name: '获取失败', value: '', description: '无法获取群列表' }];
					}

					const ownedGroups = [];

					for (const group of groupListResponse.data) {
						// 先检查直接返回的角色信息
						if (group.role === 'owner') {
							ownedGroups.push({
								name: `${group.group_name} (群主)`,
								value: group.group_id,
								description: group.group_id.toString(),
							});
							continue;
						}

						// 如果没有直接的角色信息，查询成员信息
						if (!group.role) {
							try {
								const query = { group_id: group.group_id, user_id: botId };
								const memberInfo = await apiRequest.call(this, 'GET', 'get_group_member_info', undefined, query) as {
									data?: {
										role?: string;
									}
								};

								if (memberInfo?.data?.role === 'owner') {
									ownedGroups.push({
										name: `${group.group_name} (群主)`,
										value: group.group_id,
										description: group.group_id.toString(),
									});
								}
							} catch (error) {
								console.error(`获取群 ${group.group_id} 的成员信息失败:`, error);
								continue;
							}
						}
					}

					if (ownedGroups.length === 0) {
						return [{ name: '没有群主权限的群聊', value: '', description: '机器人不是任何群的群主' }];
					}

					return ownedGroups;
				} catch (error) {
					console.error('获取机器人是群主的群聊列表失败:', error instanceof Error ? error.message : String(error));
					return [{ name: '获取失败', value: '', description: '获取群主的群聊列表时出错' }];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// 用于保存所有响应
		const responseData: any[] = [];

		// 对每个输入项进行处理
		const items = this.getInputData();
		const itemsLength = items.length;

		// 检查是否有多个输入项，如果有则自动使用转发消息模式
		const autoForwardMode = itemsLength > 1;

		// 如果只有一个输入项，正常处理
		if (!autoForwardMode) {
			// 处理单个输入项
		for (let index = 0; index < itemsLength; index++) {
				try {
					// 获取操作类型及资源类型
					const operation = this.getNodeParameter('operation', index) as string;
					const resource = this.getNodeParameter('resource', index) as string;
					console.log(`正在执行操作: ${operation}, 资源类型: ${resource}`);

					// 根据资源类型使用对应的模块处理
					if (resource === 'bot') {
						const botActionResponse = await executeBotOperation.call(this, index);
						const json = this.helpers.returnJsonArray(botActionResponse);
						const executionData = this.helpers.constructExecutionMetaData(json, {
							itemData: { item: index },
						});
						responseData.push(...executionData);
					} else if (resource === 'friend') {
						const friendActionResponse = await executeFriendOperation.call(this, index);
						const json = this.helpers.returnJsonArray(friendActionResponse);
						const executionData = this.helpers.constructExecutionMetaData(json, {
							itemData: { item: index },
						});
						responseData.push(...executionData);
					} else if (resource === 'group') {
						const groupActionResponse = await executeGroupOperation.call(this, index);
						const json = this.helpers.returnJsonArray(groupActionResponse);
						const executionData = this.helpers.constructExecutionMetaData(json, {
							itemData: { item: index },
						});
						responseData.push(...executionData);
					} else if (resource === 'misc') {
						const miscActionResponse = await executeMiscOperation.call(this, index);
						const json = this.helpers.returnJsonArray(miscActionResponse);
						const executionData = this.helpers.constructExecutionMetaData(json, {
							itemData: { item: index },
						});
						responseData.push(...executionData);
					} else if (resource === 'message') {
						const messageActionResponse = await executeMessageOperation.call(this, index);
						const json = this.helpers.returnJsonArray(messageActionResponse);
				const executionData = this.helpers.constructExecutionMetaData(json, {
					itemData: { item: index },
				});
				responseData.push(...executionData);
					} else if (resource === 'member') {
						const memberActionResponse = await executeMemberOperation.call(this, index);
						const json = this.helpers.returnJsonArray(memberActionResponse);
						const executionData = this.helpers.constructExecutionMetaData(json, {
							itemData: { item: index },
						});
						responseData.push(...executionData);
					} else {
						throw new NodeOperationError(this.getNode(), `未知的资源类型: ${resource}`);
					}
			} catch (error) {
					console.error(`执行操作时出错:`, error instanceof Error ? error.message : String(error));

				// 创建错误响应数据
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorItem = {
					json: {
						error: errorMessage,
						success: false
					}
				};
				const executionData = this.helpers.constructExecutionMetaData([errorItem], {
					itemData: { item: index },
					});

					responseData.push(...executionData);
				}
			}
		} else {
			// 处理多个输入项，自动使用转发消息模式
			try {
				// 使用MessageActions中的处理多输入项函数
				const multiForwardResponse = await handleMultipleInputsForward.call(this, itemsLength);
				const json = this.helpers.returnJsonArray(multiForwardResponse);
				const executionData = this.helpers.constructExecutionMetaData(json, {
					itemData: { item: 0 },
				});

				responseData.push(...executionData);
			} catch (error) {
				console.error(`执行多输入项转发消息时出错:`, error instanceof Error ? error.message : String(error));

				// 创建错误响应数据
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorItem = {
					json: {
						error: errorMessage,
						success: false
					}
				};
				const executionData = this.helpers.constructExecutionMetaData([errorItem], {
					itemData: { item: 0 },
				});

				responseData.push(...executionData);
			}
		}

		return [responseData];
	}
}

