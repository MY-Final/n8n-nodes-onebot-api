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
						description: 'Get bot login information',
						action: 'Get bot login info',
					},
					{
						name: 'Get Friend List',
						value: 'get_friend_list',
						description: 'Get friend list',
						action: 'Get friend list',
					},
					{
						name: 'Get Stranger Info',
						value: 'get_stranger_info',
						description: 'Get stranger information',
						action: 'Get stranger info',
					},
					{
						name: 'Get Group List',
						value: 'get_group_list',
						description: 'Get group list',
						action: 'Get group list',
					},
					{
						name: 'Get Group Info',
						value: 'get_group_info',
						description: 'Get group information',
						action: 'Get group info',
					},
					{
						name: 'Get Group Member List',
						value: 'get_group_member_list',
						description: 'Get group member list',
						action: 'Get group member list',
					},
					{
						name: 'Get Group Member Info',
						value: 'get_group_member_info',
						description: 'Get group member information',
						action: 'Get group member info',
					},
					{
						name: 'Get Group Root Files',
						value: 'get_group_root_files',
						description: 'Get group root directory files',
						action: 'Get group root files',
					},
					{
						name: 'Get Group Files By Folder',
						value: 'get_group_files_by_folder',
						description: 'Get files in group folder',
						action: 'Get group files by folder',
					},
					{
						name: 'Get File Info',
						value: 'get_file',
						description: 'Get file information',
						action: 'Get file info',
					},
					{
						name: 'Get Status',
						value: 'get_status',
						description: 'Get bot status',
						action: 'Get status',
					},
					{
						name: 'Get Version Info',
						value: 'get_version_info',
						description: 'Get version information',
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
