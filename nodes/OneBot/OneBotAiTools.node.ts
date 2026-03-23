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
 * 只包含无需参数的安全查询操作，不包含写操作
 */
export class OneBotAiTools implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot AI Tools',
		name: 'oneBotAiTools',
		icon: 'file:onebot.svg',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["tool"] }}',
		description: 'AI Agent tools for OneBot (query operations only, no parameters required)',
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
						name: 'Get Friend List',
						value: 'get_friend_list',
						description:
							'Retrieve a complete list of the bot QQ friends. Returns friend QQ numbers and nicknames. No parameters required.',
						action: 'Get friend list',
					},
					{
						name: 'Get Group List',
						value: 'get_group_list',
						description:
							'Retrieve a list of all QQ groups the bot has joined. Returns group IDs and group names. No parameters required.',
						action: 'Get group list',
					},
					{
						name: 'Get Login Info',
						value: 'get_login_info',
						description:
							"Retrieve the bot's own login information including QQ number (uin), nickname, online status, etc. No parameters required.",
						action: 'Get bot login info',
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
				description: 'Select the query tool to use (no parameters required)',
			},
			// 无需其他参数 - 所有工具都不需要输入参数
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

					case 'get_group_list':
						data = await apiRequest.call(this, 'GET', API_PATHS.getGroupList);
						break;

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
