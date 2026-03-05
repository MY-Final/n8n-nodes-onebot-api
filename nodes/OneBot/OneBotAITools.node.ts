import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	INodeExecutionData,
} from 'n8n-workflow';
import { apiRequest } from './GenericFunctions';
import { API_PATHS } from './constants/apiPaths';

/**
 * AI Agent 专用查询工具节点
 * 只包含安全的查询类操作，不包含写操作
 */
export class OneBotAITools implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot AI Tools',
		name: 'oneBotAiTools',
		icon: 'file:onebot.svg',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["tool"] }}',
		description: 'AI Agent tools for OneBot (query operations only)',
		defaults: {
			name: 'OneBot AI Tools',
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
				displayName: 'Tool',
				name: 'tool',
				type: 'options',
				default: 'get_login_info',
				options: [
					{
						name: 'Get Login Info',
						value: 'get_login_info',
						description:
							"Retrieve the bot's own login information including QQ number (uin), nickname, online status, etc. No parameters required.",
						action: 'Get bot login info',
					},
					{
						name: 'Get Friend List',
						value: 'get_friend_list',
						description:
							'Retrieve a complete list of the bot QQ friends. Returns friend QQ numbers and nicknames. No parameters required.',
						action: 'Get friend list',
					},
					{
						name: 'Get Stranger Info',
						value: 'get_stranger_info',
						description:
							'Query detailed information about a specific QQ user (stranger). Requires user_id (QQ number). Returns nickname, sex, age, etc.',
						action: 'Get stranger info',
					},
					{
						name: 'Get Group List',
						value: 'get_group_list',
						description:
							'Retrieve a list of all QQ groups the bot has joined. Returns group IDs and group names. No parameters required.',
						action: 'Get group list',
					},
					{
						name: 'Get Group Info',
						value: 'get_group_info',
						description:
							'Get detailed information about a specific QQ group. Requires group_id. Returns group name, member count, owner info, etc.',
						action: 'Get group info',
					},
					{
						name: 'Get Group Member List',
						value: 'get_group_member_list',
						description:
							'Retrieve a complete list of members in a specific QQ group. Requires group_id. Returns member QQ numbers, nicknames, roles (owner/admin/member).',
						action: 'Get group member list',
					},
					{
						name: 'Get Group Member Info',
						value: 'get_group_member_info',
						description:
							'Get detailed information about a specific member in a QQ group. Requires group_id and user_id. Returns nickname, role, join time, etc.',
						action: 'Get group member info',
					},
					{
						name: 'Get Group Root Files',
						value: 'get_group_root_files',
						description:
							'Retrieve files from the root directory of a QQ group file system. Requires group_id. Optional: file_count (default 50). Returns file list and folder list.',
						action: 'Get group root files',
					},
					{
						name: 'Get Group Files By Folder',
						value: 'get_group_files_by_folder',
						description:
							'Retrieve files from a specific folder in a QQ group file system. Requires group_id and folder_id. Optional: file_count (default 50).',
						action: 'Get group files by folder',
					},
					{
						name: 'Get File Info',
						value: 'get_file',
						description:
							'Get detailed information about a specific file in QQ group file system. Requires either file_id or file path. Returns file URL, size, name, base64, etc.',
						action: 'Get file info',
					},
					{
						name: 'Get Status',
						value: 'get_status',
						description:
							"Check the bot's current online status and connection statistics. Returns status (online/offline), statistics, and other runtime information.",
						action: 'Get status',
					},
					{
						name: 'Get Version Info',
						value: 'get_version_info',
						description:
							'Retrieve version information about the bot and OneBot implementation. Returns app name, version, protocol version, etc.',
						action: 'Get version info',
					},
				],
				description: 'Select the query tool to use',
			},
			// Get Login Info - 无需参数
			// Get Friend List - 无需参数
			// Get Group List - 无需参数
			// Get Status - 无需参数
			// Get Version Info - 无需参数

			// Get Stranger Info
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_stranger_info'],
					},
				},
				description: 'QQ number to query',
			},

			// Get Group Info
			{
				displayName: 'Group ID',
				name: 'group_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_info'],
					},
				},
				description: 'QQ group number',
			},

			// Get Group Member List
			{
				displayName: 'Group ID',
				name: 'group_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_member_list'],
					},
				},
				description: 'QQ group number',
			},

			// Get Group Member Info
			{
				displayName: 'Group ID',
				name: 'group_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_member_info'],
					},
				},
				description: 'QQ group number',
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_member_info'],
					},
				},
				description: 'QQ number of the member',
			},

			// Get Group Root Files
			{
				displayName: 'Group ID',
				name: 'group_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_root_files'],
					},
				},
				description: 'QQ group number',
			},
			{
				displayName: 'File Count',
				name: 'file_count',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						tool: ['get_group_root_files'],
					},
				},
				description: 'Number of files to retrieve',
			},

			// Get Group Files By Folder
			{
				displayName: 'Group ID',
				name: 'group_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_files_by_folder'],
					},
				},
				description: 'QQ group number',
			},
			{
				displayName: 'Folder ID',
				name: 'folder_id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['get_group_files_by_folder'],
					},
				},
				description: 'Folder ID to query',
			},
			{
				displayName: 'File Count',
				name: 'file_count',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						tool: ['get_group_files_by_folder'],
					},
				},
				description: 'Number of files to retrieve',
			},

			// Get File Info
			{
				displayName: 'File ID',
				name: 'file_id',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						tool: ['get_file'],
					},
				},
				description: 'File ID to query',
			},
			{
				displayName: 'File Path',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						tool: ['get_file'],
					},
				},
				description: 'File path (alternative to file_id)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const result: INodeExecutionData[] = [];

		for (let index = 0; index < items.length; index++) {
			try {
				const tool = this.getNodeParameter('tool', index) as string;
				let data: IDataObject;

				switch (tool) {
					case 'get_login_info':
						data = await apiRequest.call(this, 'GET', API_PATHS.getLoginInfo);
						break;

					case 'get_friend_list':
						data = await apiRequest.call(this, 'GET', API_PATHS.getFriendList);
						break;

					case 'get_stranger_info': {
						const user_id = this.getNodeParameter('user_id', index) as string;
						data = await apiRequest.call(this, 'POST', 'get_stranger_info', {
							user_id: Number(user_id),
						});
						break;
					}

					case 'get_group_list':
						data = await apiRequest.call(this, 'GET', API_PATHS.getGroupList);
						break;

					case 'get_group_info': {
						const group_id = this.getNodeParameter('group_id', index) as string;
						data = await apiRequest.call(this, 'POST', 'get_group_info', {
							group_id: Number(group_id),
						});
						break;
					}

					case 'get_group_member_list': {
						const group_id = this.getNodeParameter('group_id', index) as string;
						data = await apiRequest.call(this, 'POST', API_PATHS.getGroupMemberList, {
							group_id: Number(group_id),
						});
						break;
					}

					case 'get_group_member_info': {
						const group_id = this.getNodeParameter('group_id', index) as string;
						const user_id = this.getNodeParameter('user_id', index) as string;
						data = await apiRequest.call(this, 'POST', 'get_group_member_info', {
							group_id: Number(group_id),
							user_id: Number(user_id),
						});
						break;
					}

					case 'get_group_root_files': {
						const group_id = this.getNodeParameter('group_id', index) as string;
						const file_count = this.getNodeParameter('file_count', index, 50) as number;
						data = await apiRequest.call(this, 'POST', API_PATHS.getGroupRootFiles, {
							group_id: Number(group_id),
							file_count,
						});
						break;
					}

					case 'get_group_files_by_folder': {
						const group_id = this.getNodeParameter('group_id', index) as string;
						const folder_id = this.getNodeParameter('folder_id', index) as string;
						const file_count = this.getNodeParameter('file_count', index, 50) as number;
						data = await apiRequest.call(this, 'POST', API_PATHS.getGroupFilesByFolder, {
							group_id: Number(group_id),
							folder_id,
							file_count,
						});
						break;
					}

					case 'get_file': {
						let file_id = '';
						let file = '';
						try {
							file_id = this.getNodeParameter('file_id', index) as string;
						} catch {}
						try {
							file = this.getNodeParameter('file', index) as string;
						} catch {}

						if (!file_id && !file) {
							throw new NodeOperationError(
								this.getNode(),
								'Either file_id or file must be provided',
								{ itemIndex: index },
							);
						}

						const body: IDataObject = {};
						if (file_id) body.file_id = file_id;
						if (file) body.file = file;

						data = await apiRequest.call(this, 'POST', API_PATHS.getFile, body);
						break;
					}

					case 'get_status':
						data = await apiRequest.call(this, 'GET', 'get_status');
						break;

					case 'get_version_info':
						data = await apiRequest.call(this, 'GET', 'get_version_info');
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown tool: ${tool}`, {
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
