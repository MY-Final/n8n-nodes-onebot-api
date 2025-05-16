import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';
import { LoginInfo } from './Interfaces';
import { getFriendList, getGroupList, getGroupMemberList } from './SearchFunctions';

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
						name: '机器人',
						value: 'bot',
					},
					{
						name: '好友',
						value: 'friend',
					},
					{
						name: '群组',
						value: 'group',
					},
					{
						name: '消息',
						value: 'message',
					},
					{
						name: '其他',
						value: 'misc',
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
						action: 'Send friend Poke',
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
						name: '获取群信息',
						value: 'get_group_info',
						action: 'Get group info',
					},
					{
						name: '获取群列表',
						value: 'get_group_list',
						action: 'Get group list',
					},
					{
						name: '获取群成员信息',
						value: 'get_group_member_info',
						action: 'Get group member info',
					},
					{
						name: '获取群成员列表',
						value: 'get_group_member_list',
						action: 'Get group member list',
					},
					{
						name: '踢出群成员',
						value: 'set_group_kick',
						action: 'Set_group_kick',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '禁言群成员',
						value: 'set_group_ban',
						action: 'Set Group Ban',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '全员禁言',
						value: 'set_group_whole_ban',
						action: 'Set Group Whole Ban',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '设置群名称',
						value: 'set_group_name',
						action: 'Set Group Name',
						description: '要求机器人是管理员或者群主',
					},
					{
						name: '设置群管理员',
						value: 'set_group_admin',
						action: 'Set Group Admin',
						description: '要求机器人是群主',
					},
					{
						name: '群戳一戳',
						value: 'group_poke',
						action: 'Group Poke',
						description: '群戳一戳，戳了一下你，嘻嘻',

					},
					{
						name: '设置群签到',
						value: 'set_group_sign',
						action: 'Set Group Sign',
						description: '设置群签到',
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
					'选择好友，可以输入昵称或QQ号进行搜索，也可以直接输入QQ号',
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
					'选择群组，可以输入群名称或群号进行搜索',
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
							'get_group_list',
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
					'选择您有管理权限的群组（群主或管理员）',
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
					'选择您是群主的群组（只有群主才能设置管理员）',
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
					'选择要戳的群成员，可以输入昵称或QQ号进行搜索，也可以直接输入QQ号',
				required: true,
				displayOptions: {
					show: {
						operation: ['get_group_member_info', 'set_group_kick', 'set_group_ban', 'set_group_admin', 'group_poke'],
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
				displayName: '@全体成员',
				name: 'atAll',
				type: 'boolean',
				default: false,
				description: '在消息开头添加@全体成员',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_group_msg'],
					},
				},
			},
			{
				displayName: '@特定成员',
				name: 'atUser',
				type: 'boolean',
				default: false,
				description: '在消息中@特定群成员',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_group_msg'],
					},
				},
			},
			{
				displayName: '要@的成员',
				name: 'atUserId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getGroupMemberList',
					loadOptionsDependsOn: ['group_id'],
				},
				default: '',
				description: '选择要@的群成员',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_group_msg'],
						atUser: [true],
					},
				},
			},
			{
				displayName: '发送图片',
				name: 'sendImage',
				type: 'boolean',
				default: false,
				description: '是否发送图片',
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
				displayName: 'Forward Mode',
				name: 'forward_mode',
				type: 'boolean',
				noDataExpression: true,
				default: false,
				description: '开启后将以转发消息形式发送，支持多条消息',
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
				default: {},
				placeholder: '配置转发消息的基本信息',
				options: [
					{
						displayName: '消息摘要',
						name: 'summary',
						type: 'string',
						default: '哼哼',
						description: '显示在转发消息卡片顶部的标题文字',
					},
					{
						displayName: '消息来源',
						name: 'source',
						type: 'string',
						default: '坏蛋！',
						description: '显示在转发消息卡片右上角的来源文字',
					},
					{
						displayName: '提示文字',
						name: 'prompt',
						type: 'string',
						default: '宝宝，我爱你',
						description: '显示在转发消息卡片底部的提示文字',
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
				displayName: '转发消息列表',
				name: 'forwardMessages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: '添加转发消息',
				options: [
					{
						name: 'messages',
						displayName: '消息项',
						values: [
							{
								displayName: '发送者QQ',
								name: 'user_id',
								type: 'string',
								default: '',
								description: '消息发送者的QQ号',
							},
							{
								displayName: '发送者昵称',
								name: 'nickname',
								type: 'string',
								default: '',
								description: '消息发送者的昵称',
							},
							{
								displayName: '消息内容',
								name: 'content',
								type: 'string',
								typeOptions: {
									rows: 4,
								},
								default: '',
								description: '消息文本内容，支持文本和CQ码',
							},
							{
								displayName: '添加图片',
								name: 'addImage',
								type: 'boolean',
								default: false,
								description: '是否在当前消息中添加图片',
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
										addImage: [true],
									},
								},
							},
						],
					},
				],
				description: '转发消息列表，可添加多条消息',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [true],
					},
				},
			},
			{
				displayName: '文本内容',
				name: 'newsMessages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: '添加文本内容',
				options: [
					{
						name: 'news',
						displayName: '文本项',
						values: [
							{
								displayName: '文本内容',
								name: 'text',
								type: 'string',
								default: '不许点进来！。',
								description: '转发消息中显示的文本内容',
							},
						],
					},
				],
				description: '转发消息的文本内容，用于卡片预览',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send_private_msg', 'send_group_msg'],
						forward_mode: [true],
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
				description: '加入群黑名单，不再接受加群申请',
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
				description: '是否启用全员禁言',
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
				description: '是否设置为管理员，true为设置，false为取消，注意：只有群主可以设置或取消管理员',
				default: true,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['set_group_admin'],
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

	/**
	 * 检查机器人在群中的权限
	 *
	 * @param executeFunctions - 执行函数上下文
	 * @param groupId - 群ID
	 * @returns 包含权限信息的对象
	 */
	private static async checkBotGroupPermission(
		executeFunctions: IExecuteFunctions,
		groupId: string | number
	): Promise<{ isAdmin: boolean; isOwner: boolean; canOperate: boolean }> {
		try {
			// 1. 获取机器人的登录信息
			const loginInfo = await apiRequest.call(executeFunctions, 'GET', 'get_login_info');

			if (!loginInfo?.data?.user_id) {
				console.error('获取登录信息失败，无法检查权限');
				return { isAdmin: false, isOwner: false, canOperate: false };
			}

			const botId = loginInfo.data.user_id;
			console.log(`当前机器人QQ: ${botId}`);

			// 2. 获取机器人在群中的信息
			const query = { group_id: groupId, user_id: botId };
			const memberInfo = await apiRequest.call(executeFunctions, 'GET', 'get_group_member_info', undefined, query);

			if (!memberInfo?.data) {
				console.error('获取群成员信息失败，无法检查权限');
				return { isAdmin: false, isOwner: false, canOperate: false };
			}

			// 3. 检查权限
			const role = memberInfo.data.role || '';
			const isOwner = role === 'owner';
			const isAdmin = role === 'admin' || isOwner;

			console.log(`机器人在群 ${groupId} 中的角色: ${role}, 是管理员: ${isAdmin}, 是群主: ${isOwner}`);

			return {
				isAdmin,
				isOwner,
				canOperate: isAdmin // 只有管理员或群主才能操作
			};
		} catch (error) {
			console.error('检查权限时出错:', error instanceof Error ? error.message : String(error));
			return { isAdmin: false, isOwner: false, canOperate: false };
		}
	}

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
				// 初始化变量
				let action: IDataObject = { operation: 'unknown' };
				let body: IDataObject = {};
				let endpoint: string = '';

				try {
					// 获取操作类型
					action.operation = this.getNodeParameter('operation', index) as string;
					console.log(`正在执行操作: ${action.operation}`);

					// 获取并处理群组ID
					let groupId: string | number | undefined;
					if (['send_group_msg', 'get_group_info', 'get_group_member_list', 'get_group_member_info', 'set_group_kick', 'set_group_ban', 'set_group_whole_ban', 'set_group_name', 'set_group_admin', 'group_poke', 'set_group_sign'].includes(action.operation as string)) {
						groupId = this.getNodeParameter('group_id', index) as string | number;
						console.log('获取到group_id:', groupId, '类型:', typeof groupId);
					}

					// 根据操作类型设置body和endpoint
					switch (action.operation) {
						case 'send_private_msg':
							// 发送私聊消息：设置用户ID和消息内容
							const privateUserId = this.getNodeParameter('user_id', index);
							body.user_id = privateUserId;

							// 检查是否使用转发模式
							const privateForwardMode = this.getNodeParameter('forward_mode', index, false) as boolean;
							
							if (privateForwardMode) {
								// 使用转发消息格式
								const forwardMessages = this.getNodeParameter('forwardMessages', index) as {
									messages: Array<{
										user_id: string;
										nickname: string;
										content: string;
										addImage: boolean;
										imageUrl?: string;
									}>;
								};
								
								// 获取转发消息设置
								const forwardSettings = this.getNodeParameter('forwardSettings', index, {}) as {
									summary?: string;
									source?: string;
									prompt?: string;
								};
								
								// 获取文本内容
								const newsMessages = this.getNodeParameter('newsMessages', index, { news: [] }) as {
									news: Array<{
										text: string;
									}>;
								};
								
								// 转换为OneBot API所需的格式
								const messages = forwardMessages.messages.map(msg => {
									// 处理消息内容，支持CQ码
									let content = msg.content || '';
									
									// 检查是否需要添加图片
									if (msg.addImage) {
										try {
											let imagePath = '';
											
											// 使用简化后的图片URL
											imagePath = msg.imageUrl || '';
											
											// 添加图片CQ码
											if (imagePath && imagePath.trim() !== '') {
												// 如果消息内容为空，则只发送图片
												if (!content.trim()) {
													content = `[CQ:image,file=${imagePath}]`;
												} else {
													// 否则在消息后添加图片
													content = `${content}\n[CQ:image,file=${imagePath}]`;
												}
											} else {
												console.log('转发消息中图片URL为空，跳过添加图片');
											}
										} catch (error) {
											console.error('处理转发消息图片时出错:', error instanceof Error ? error.message : String(error));
											// 如果出错，继续处理文本消息，不添加图片
										}
									}
									
									return {
										type: 'node',
										data: {
											user_id: msg.user_id,
											nickname: msg.nickname,
											content: content,
										}
									};
								});
								
								body = {
									user_id: privateUserId,
									messages,
								};
								
								// 添加摘要、提示和来源
								if (forwardSettings.summary) body.summary = forwardSettings.summary;
								if (forwardSettings.prompt) body.prompt = forwardSettings.prompt;
								if (forwardSettings.source) body.source = forwardSettings.source;
								
								// 添加文本内容
								if (newsMessages.news && newsMessages.news.length > 0) {
									body.news = newsMessages.news.map(item => ({ text: item.text }));
								} else {
									// 确保始终有news字段，即使没有设置
									body.news = [{ text: "不许点进来！。" }];
								}
								
								endpoint = 'send_private_forward_msg';
								console.log('send_private_forward_msg参数:', JSON.stringify(body));
							} else {
								// 获取消息内容
								let privateMessageContent = this.getNodeParameter('message', index) as string;

								// 检查是否需要发送图片
								const privateSendImage = this.getNodeParameter('sendImage', index, false) as boolean;
								if (privateSendImage) {
									try {
										console.log(`[私聊消息] 发送图片标志为true，开始处理图片`);
										// 使用默认值'url'，确保即使获取不到也有默认值
										const imageSource = this.getNodeParameter('imageSource', index, 'url') as string;
										console.log(`[私聊消息] 图片来源: ${imageSource}`);
										let imagePath = '';

										if (imageSource === 'url') {
											imagePath = this.getNodeParameter('imageUrl', index, '') as string;
											console.log(`[私聊消息] 图片URL: ${imagePath}`);
										} else if (imageSource === 'file') {
											// 本地文件需要添加file://前缀
											const filePath = this.getNodeParameter('imagePath', index, '') as string;
											console.log(`[私聊消息] 本地图片路径: ${filePath}`);
											imagePath = filePath ? 'file://' + filePath : '';
										} else if (imageSource === 'base64') {
											// Base64编码需要添加base64://前缀
											const base64Data = this.getNodeParameter('imageBase64', index, '') as string;
											console.log(`[私聊消息] Base64图片数据长度: ${base64Data.length}`);
											imagePath = base64Data ? 'base64://' + base64Data : '';
										}

										// 只有当图片路径不为空时才添加图片
										if (imagePath && imagePath.trim() !== '') {
											console.log(`[私聊消息] 图片路径有效，添加图片CQ码`);
											// 如果消息内容为空，则只发送图片
											if (!privateMessageContent.trim()) {
												// 使用CQ码格式
												privateMessageContent = `[CQ:image,file=${imagePath}]`;
											} else {
												// 否则在消息后添加图片
												privateMessageContent = `${privateMessageContent}\n[CQ:image,file=${imagePath}]`;
											}
										} else {
											console.log('[私聊消息] 图片路径为空，跳过添加图片CQ码');
										}
									} catch (error) {
										console.error('[私聊消息] 处理图片时出错:', error instanceof Error ? error.message : String(error));
										// 如果出错，继续处理文本消息，不添加图片
									}
								}

								body.message = privateMessageContent;
								endpoint = 'send_private_msg';
								console.log('send_private_msg参数:', JSON.stringify(body));
							}
							break;
						case 'get_stranger_info':
							// 获取陌生人信息：设置用户QQ号
							const strangerUserId = this.getNodeParameter('user_id', index);
							body.user_id = strangerUserId;
							endpoint = 'get_stranger_info';
							console.log('get_stranger_info参数:', JSON.stringify(body));
							break;
						case 'send_like':
							// 发送好友赞：设置用户QQ号和点赞次数
							// user_id: 好友QQ号
							// times: 点赞次数，每个好友每天最多10次
							const likeUserId = this.getNodeParameter('user_id', index);
							body.user_id = likeUserId;
							body.times = this.getNodeParameter('times', index) as number;
							endpoint = 'send_like';
							console.log('send_like参数:', JSON.stringify(body));
							break;
						case 'send_friend_poke':
							// 私聊戳一戳：设置用户QQ号
							const friendPokeUserId = this.getNodeParameter('user_id', index);
							body.user_id = friendPokeUserId;
							console.log('send_friend_poke参数:', JSON.stringify(body));
							endpoint = 'send_poke';
							break;
						case 'send_group_msg':
							// 发送群消息：设置群号和消息内容
							if (!groupId) {
								throw new Error('发送群消息需要有效的群ID，但未提供');
							}
							body.group_id = groupId;

							// 检查是否使用转发模式
							const groupForwardMode = this.getNodeParameter('forward_mode', index, false) as boolean;
							
							if (groupForwardMode) {
								// 使用转发消息格式
								const forwardMessages = this.getNodeParameter('forwardMessages', index) as {
									messages: Array<{
										user_id: string;
										nickname: string;
										content: string;
										addImage: boolean;
										imageUrl?: string;
									}>;
								};
								
								// 获取转发消息设置
								const forwardSettings = this.getNodeParameter('forwardSettings', index, {}) as {
									summary?: string;
									source?: string;
									prompt?: string;
								};
								
								// 获取文本内容
								const newsMessages = this.getNodeParameter('newsMessages', index, { news: [] }) as {
									news: Array<{
										text: string;
									}>;
								};
								
								// 转换为OneBot API所需的格式
								const messages = forwardMessages.messages.map(msg => {
									// 处理消息内容，支持CQ码
									let content = msg.content || '';
									
									// 检查是否需要添加图片
									if (msg.addImage) {
										try {
											let imagePath = '';
											
											// 使用简化后的图片URL
											imagePath = msg.imageUrl || '';
											
											// 添加图片CQ码
											if (imagePath && imagePath.trim() !== '') {
												// 如果消息内容为空，则只发送图片
												if (!content.trim()) {
													content = `[CQ:image,file=${imagePath}]`;
												} else {
													// 否则在消息后添加图片
													content = `${content}\n[CQ:image,file=${imagePath}]`;
												}
											} else {
												console.log('群聊转发消息中图片URL为空，跳过添加图片');
											}
										} catch (error) {
											console.error('处理群聊转发消息图片时出错:', error instanceof Error ? error.message : String(error));
											// 如果出错，继续处理文本消息，不添加图片
										}
									}
									
									return {
										type: 'node',
										data: {
											user_id: msg.user_id,
											nickname: msg.nickname,
											content: content,
										}
									};
								});
								
								body = {
									group_id: groupId,
									messages,
								};
								
								// 添加摘要、提示和来源
								if (forwardSettings.summary) body.summary = forwardSettings.summary;
								if (forwardSettings.prompt) body.prompt = forwardSettings.prompt;
								if (forwardSettings.source) body.source = forwardSettings.source;
								
								// 添加文本内容
								if (newsMessages.news && newsMessages.news.length > 0) {
									body.news = newsMessages.news.map(item => ({ text: item.text }));
								} else {
									// 确保始终有news字段，即使没有设置
									body.news = [{ text: "不许点进来！。" }];
								}
								
								endpoint = 'send_group_forward_msg';
								console.log('send_group_forward_msg参数:', JSON.stringify(body));
							} else {
								// 获取消息内容
								let messageContent = this.getNodeParameter('message', index) as string;

								// 检查是否需要@全体成员
								const atAll = this.getNodeParameter('atAll', index, false) as boolean;
								if (atAll) {
									// 在消息前添加@全体成员CQ码
									messageContent = '[CQ:at,qq=all] ' + messageContent;
								}

								// 检查是否需要@特定成员
								const atUser = this.getNodeParameter('atUser', index, false) as boolean;
								if (atUser) {
									const atUserId = this.getNodeParameter('atUserId', index) as string;
									messageContent = `[CQ:at,qq=${atUserId}] ${messageContent}`;
								}

								// 检查是否需要发送图片
								const sendImage = this.getNodeParameter('sendImage', index, false) as boolean;
								if (sendImage) {
									try {
										console.log(`[群聊消息] 发送图片标志为true，开始处理图片`);
										// 使用默认值'url'，确保即使获取不到也有默认值
										const imageSource = this.getNodeParameter('imageSource', index, 'url') as string;
										console.log(`[群聊消息] 图片来源: ${imageSource}`);
										let imagePath = '';

										if (imageSource === 'url') {
											imagePath = this.getNodeParameter('imageUrl', index, '') as string;
											console.log(`[群聊消息] 图片URL: ${imagePath}`);
										} else if (imageSource === 'file') {
											// 本地文件需要添加file://前缀
											const filePath = this.getNodeParameter('imagePath', index, '') as string;
											console.log(`[群聊消息] 本地图片路径: ${filePath}`);
											imagePath = filePath ? 'file://' + filePath : '';
										} else if (imageSource === 'base64') {
											// Base64编码需要添加base64://前缀
											const base64Data = this.getNodeParameter('imageBase64', index, '') as string;
											console.log(`[群聊消息] Base64图片数据长度: ${base64Data.length}`);
											imagePath = base64Data ? 'base64://' + base64Data : '';
										}

										// 只有当图片路径不为空时才添加图片
										if (imagePath && imagePath.trim() !== '') {
											console.log(`[群聊消息] 图片路径有效，添加图片CQ码`);
											// 处理不同情况下的消息格式
											// 1. 只有图片
											if (!messageContent.trim()) {
												messageContent = `[CQ:image,file=${imagePath}]`;
											}
											// 2. @全体成员 + 图片
											else if (messageContent.trim() === '[CQ:at,qq=all] ') {
												messageContent = `[CQ:at,qq=all] [CQ:image,file=${imagePath}]`;
											}
											// 3. @特定成员 + 图片
											else if (messageContent.includes('[CQ:at,qq=') && !messageContent.includes('[CQ:at,qq=all]')) {
												// 保持@用户的部分，添加图片
												messageContent = `${messageContent}[CQ:image,file=${imagePath}]`;
											}
											// 4. 普通文本 + 图片
											else {
												messageContent = `${messageContent}\n[CQ:image,file=${imagePath}]`;
											}
										} else {
											console.log('[群聊消息] 图片路径为空，跳过添加图片CQ码');
										}
									} catch (error) {
										console.error('[群聊消息] 处理群聊图片时出错:', error instanceof Error ? error.message : String(error));
										// 如果出错，继续处理文本消息，不添加图片
									}
								}

								body.message = messageContent;
								endpoint = 'send_group_msg';
								console.log('send_group_msg参数:', JSON.stringify(body));
							}
							break;
						case 'get_group_member_list':
							// 获取群成员列表：设置群号
							if (!groupId) {
								throw new Error('获取群成员列表需要有效的群ID，但未提供');
							}
							body.group_id = groupId;
							endpoint = 'get_group_member_list';
							console.log('get_group_member_list参数:', JSON.stringify(body));
							break;
						case 'get_group_info':
							// 获取群信息：设置群号
							if (!groupId) {
								throw new Error('获取群信息需要有效的群ID，但未提供');
							}
							body.group_id = groupId;
							endpoint = 'get_group_info';
							console.log('get_group_info参数:', JSON.stringify(body));
							break;
						case 'get_group_member_info':
							// 获取群成员信息：设置群号和成员QQ号
							if (!groupId) {
								throw new Error('获取群成员信息需要有效的群ID，但未提供');
							}
							body.group_id = groupId;
							const memberInfoUserId = this.getNodeParameter('user_id', index);
							body.user_id = memberInfoUserId;
							console.log('get_group_member_info参数:', JSON.stringify(body));
							endpoint = 'get_group_member_info';
							break;
						case 'group_poke':
							// 群戳一戳：设置群号和成员QQ号
							if (!groupId) {
								throw new Error('群戳一戳需要有效的群ID，但未提供');
							}
							body.group_id = groupId;
							const pokeUserId = this.getNodeParameter('user_id', index);
							body.user_id = pokeUserId;
							console.log('group_poke参数:', JSON.stringify(body));
							endpoint = 'send_poke';
							break;
						case 'set_group_sign':
							// 设置群签到：设置群号
							if (!groupId) {
								throw new Error('设置群签到需要有效的群ID，但未提供');
							}
							body.group_id = groupId;
							endpoint = 'set_group_sign';
							break;
						case 'set_group_kick':
						case 'set_group_ban':
						case 'set_group_whole_ban':
						case 'set_group_name':
						case 'set_group_admin': {
							if (!groupId) {
								throw new Error('操作需要有效的群ID，但未提供');
							}
							// 检查权限
							const permissionInfo = await OneBot.checkBotGroupPermission(this, groupId);

							// 根据不同操作进行特定的权限检查
							switch (action.operation) {
								case 'set_group_admin':
									// 设置管理员需要群主权限
									if (!permissionInfo.isOwner) {
										throw new Error(`无法执行操作: 设置管理员需要群主权限，当前机器人不是群 ${groupId} 的群主`);
									}
									console.log(`机器人是群 ${groupId} 的群主，可以设置管理员`);
									break;

								default:
									// 其他操作需要管理员或群主权限
									if (!permissionInfo.isAdmin) {
										throw new Error(`无法执行操作: ${action.operation} 需要管理员权限，当前机器人不是群 ${groupId} 的管理员或群主`);
									}
									console.log(`机器人在群 ${groupId} 中有管理员权限，可以执行 ${action.operation} 操作`);
							}

							// 根据不同操作设置相应参数
							switch (action.operation) {
								case 'set_group_kick':
									// 踢出群成员：设置群号、成员QQ号和拒绝加入请求
									body.group_id = groupId;
									const kickUserId = this.getNodeParameter('user_id', index);
									body.user_id = kickUserId;
									body.reject_add_request = this.getNodeParameter('reject_add_request', index) as boolean;
									console.log('set_group_kick参数:', JSON.stringify(body));
									endpoint = 'set_group_kick';
									break;

								case 'set_group_ban':
									// 禁言群成员：设置群号、成员QQ号和禁言时长
									body.group_id = groupId;
									const banUserId = this.getNodeParameter('user_id', index);
									body.user_id = banUserId;
									body.duration = this.getNodeParameter('duration', index) as number;
									console.log('set_group_ban参数:', JSON.stringify(body));
									endpoint = 'set_group_ban';
									break;

								case 'set_group_whole_ban':
									// 群组全员禁言：设置群号和是否禁言
									body.group_id = groupId;
									body.enable = this.getNodeParameter('enable', index) as boolean;
									console.log('set_group_whole_ban参数:', JSON.stringify(body));
									endpoint = 'set_group_whole_ban';
									break;

								case 'set_group_name':
									// 设置群名称：设置群号和新群名
									body.group_id = groupId;
									body.group_name = this.getNodeParameter('group_name', index) as string;
									console.log('set_group_name参数:', JSON.stringify(body));
									endpoint = 'set_group_name';
									break;

								case 'set_group_admin':
									// 群组设置管理员
									body.group_id = groupId;
									const adminUserId = this.getNodeParameter('user_id', index);
									body.user_id = adminUserId;
									body.enable = this.getNodeParameter('enable', index) as boolean;
									console.log('set_group_admin参数:', JSON.stringify(body));
									endpoint = 'set_group_admin';
									break;
							}
							break;

						}
					}

					const method: IHttpRequestMethods = Object.keys(body).length == 0 ? 'GET' : 'POST';
					const data = await apiRequest.call(this, method, endpoint, body);
					const json = this.helpers.returnJsonArray(data);
					const executionData = this.helpers.constructExecutionMetaData(json, {
						itemData: { item: index },
					});

					responseData.push(...executionData);
				} catch (error) {
					console.error(`执行操作 ${action.operation} 时出错:`, error instanceof Error ? error.message : String(error));

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
				// 获取第一个输入项的操作类型和目标ID
				const operation = this.getNodeParameter('operation', 0) as string;
				
				// 只支持发送消息操作的转发
				if (!['send_private_msg', 'send_group_msg'].includes(operation)) {
					throw new Error('多输入项转发消息仅支持发送私聊消息和群消息操作');
				}
				
				// 准备转发消息参数
				let body: IDataObject = {};
				let endpoint: string = '';
				
				// 获取机器人信息，用于构建消息
				const loginInfo = await apiRequest.call(this, 'GET', 'get_login_info');
				const botInfo = loginInfo?.data || { user_id: '0', nickname: 'Bot' };
				
				// 构建转发消息数组
				const messages = [];
				
				for (let index = 0; index < itemsLength; index++) {
					// 获取当前项的消息内容
					let messageContent = '';
					let userId = '';
					let nickname = '';
					
					try {
						// 尝试获取消息内容
						messageContent = this.getNodeParameter('message', index, '') as string;
						
						// 尝试获取用户ID和昵称，如果失败则使用机器人信息
						if (operation === 'send_private_msg') {
							userId = this.getNodeParameter('user_id', index, botInfo.user_id) as string;
							// 尝试获取用户昵称
							try {
								const userInfo = await apiRequest.call(this, 'GET', 'get_stranger_info', undefined, { user_id: userId });
								nickname = userInfo?.data?.nickname || `用户${userId}`;
							} catch (e) {
								nickname = `用户${userId}`;
							}
						} else {
							// 群消息，使用机器人信息
							userId = botInfo.user_id;
							nickname = botInfo.nickname;
						}
						
						// 检查是否需要发送图片
						try {
							const sendImage = this.getNodeParameter('sendImage', index, false) as boolean;
							if (sendImage) {
								console.log(`[群聊消息] 发送图片标志为true，开始处理图片`);
								// 使用默认值'url'，确保即使获取不到也有默认值
								const imageSource = this.getNodeParameter('imageSource', index, 'url') as string;
								console.log(`[群聊消息] 图片来源: ${imageSource}`);
								let imagePath = '';

								if (imageSource === 'url') {
									imagePath = this.getNodeParameter('imageUrl', index, '') as string;
									console.log(`[群聊消息] 图片URL: ${imagePath}`);
								} else if (imageSource === 'file') {
									// 本地文件需要添加file://前缀
									const filePath = this.getNodeParameter('imagePath', index, '') as string;
									console.log(`[群聊消息] 本地图片路径: ${filePath}`);
									imagePath = filePath ? 'file://' + filePath : '';
								} else if (imageSource === 'base64') {
									// Base64编码需要添加base64://前缀
									const base64Data = this.getNodeParameter('imageBase64', index, '') as string;
									console.log(`[群聊消息] Base64图片数据长度: ${base64Data.length}`);
									imagePath = base64Data ? 'base64://' + base64Data : '';
								}

								// 只有当图片路径不为空时才添加图片
								if (imagePath && imagePath.trim() !== '') {
									console.log(`[群聊消息] 图片路径有效，添加图片CQ码`);
									// 处理不同情况下的消息格式
									// 1. 只有图片
									if (!messageContent.trim()) {
										messageContent = `[CQ:image,file=${imagePath}]`;
									}
									// 2. @全体成员 + 图片
									else if (messageContent.trim() === '[CQ:at,qq=all] ') {
										messageContent = `[CQ:at,qq=all] [CQ:image,file=${imagePath}]`;
									}
									// 3. @特定成员 + 图片
									else if (messageContent.includes('[CQ:at,qq=') && !messageContent.includes('[CQ:at,qq=all]')) {
										// 保持@用户的部分，添加图片
										messageContent = `${messageContent}[CQ:image,file=${imagePath}]`;
									}
									// 4. 普通文本 + 图片
									else {
										messageContent = `${messageContent}\n[CQ:image,file=${imagePath}]`;
									}
								} else {
									console.log('[群聊消息] 图片路径为空，跳过添加图片CQ码');
								}
							}
						} catch (error) {
							console.error(`处理第${index+1}项的图片时出错:`, error instanceof Error ? error.message : String(error));
							// 如果出错，继续处理文本消息，不添加图片
						}
						
						// 检查是否有@全体成员或@特定成员（针对群消息）
						if (operation === 'send_group_msg') {
							try {
								// 检查是否需要@全体成员
								const atAll = this.getNodeParameter('atAll', index, false) as boolean;
								if (atAll) {
									// 在消息前添加@全体成员CQ码
									messageContent = '[CQ:at,qq=all] ' + messageContent;
								}

								// 检查是否需要@特定成员
								const atUser = this.getNodeParameter('atUser', index, false) as boolean;
								if (atUser) {
									const atUserId = this.getNodeParameter('atUserId', index, '') as string;
									if (atUserId) {
										messageContent = `[CQ:at,qq=${atUserId}] ${messageContent}`;
									}
								}
							} catch (error) {
								console.error(`处理第${index+1}项的@功能时出错:`, error instanceof Error ? error.message : String(error));
								// 如果出错，继续处理文本消息，不添加@
							}
						}
					} catch (e) {
						// 如果获取失败，尝试使用JSON数据作为消息内容
						try {
							messageContent = JSON.stringify(items[index].json);
						} catch (jsonError) {
							messageContent = '无法获取消息内容';
						}
						userId = botInfo.user_id;
						nickname = botInfo.nickname;
					}
					
					// 构建消息对象 - 使用标准格式
					const messageObj = {
						type: 'node',
						data: {
							user_id: userId,
							nickname: nickname,
							content: messageContent
						}
					};
					
					messages.push(messageObj);
				}
				
				// 构建转发消息体
				if (operation === 'send_private_msg') {
					try {
						const privateUserId = this.getNodeParameter('user_id', 0) as string;
						body = {
							user_id: privateUserId,
							messages,
						};
						endpoint = 'send_private_forward_msg';
					} catch (error) {
						console.error('获取私聊用户ID时出错:', error instanceof Error ? error.message : String(error));
						throw new Error('获取私聊用户ID失败，无法发送转发消息');
					}
				} else {
					try {
						const groupId = this.getNodeParameter('group_id', 0) as string;
						body = {
							group_id: groupId,
							messages,
						};
						endpoint = 'send_group_forward_msg';
					} catch (error) {
						console.error('获取群ID时出错:', error instanceof Error ? error.message : String(error));
						throw new Error('获取群ID失败，无法发送转发消息');
					}
				}
				
				// 尝试从第一个输入项获取转发消息设置
				try {
					// 检查第一个输入项是否有转发消息设置
					const hasForwardSettings = this.getNodeParameter('forward_mode', 0, false) as boolean;
					
					if (hasForwardSettings) {
						// 获取转发消息设置
						const forwardSettings = this.getNodeParameter('forwardSettings', 0, {}) as {
							summary?: string;
							source?: string;
							prompt?: string;
						};
						
						// 使用用户设置的值
						if (forwardSettings.summary) body.summary = forwardSettings.summary;
						if (forwardSettings.prompt) body.prompt = forwardSettings.prompt;
						if (forwardSettings.source) body.source = forwardSettings.source;
						
						// 获取文本内容
						try {
							const newsMessages = this.getNodeParameter('newsMessages', 0, { news: [] }) as {
								news: Array<{
									text: string;
								}>;
							};
							
							if (newsMessages.news && newsMessages.news.length > 0) {
								body.news = newsMessages.news.map(item => ({ text: item.text }));
							} else {
								// 如果没有设置文本内容，使用默认的
								body.news = [{ text: "不许点进来！。" }];
							}
						} catch (e) {
							// 如果获取失败，使用默认值
							body.news = [{ text: "不许点进来！。" }];
						}
					} else {
						// 使用默认值，但更个性化
						body.summary = '哼哼';
						body.prompt = '宝宝，我爱你';
						body.source = '坏蛋！';
						body.news = [{ text: "不许点进来！。" }];
					}
				} catch (e) {
					// 如果获取失败，使用默认个性化值
					body.summary = '哼哼';
					body.prompt = '宝宝，我爱你';
					body.source = '坏蛋！';
					body.news = [{ text: "不许点进来！。" }];
				}
				
				console.log(`自动转发消息参数:`, JSON.stringify(body));
				
				// 发送请求
				const method: IHttpRequestMethods = 'POST';
				const data = await apiRequest.call(this, method, endpoint, body);
				const json = this.helpers.returnJsonArray(data);
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
