import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	INodeExecutionData,
} from 'n8n-workflow';
import { sendPrivateMsg, sendGroupMsg } from '../OneBot/action/message/SendMessage';

/**
 * 发送 QQ 消息 Tool 节点
 * 专为 AI Agent 设计的简化接口
 */
export class SendQqMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Send QQ Message',
		name: 'sendQqMessage',
		icon: 'file:../OneBot/onebot.svg',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["messageType"] }}: {{ $parameter["message"] }}',
		description: 'Send a message to QQ (private or group)',
		defaults: {
			name: 'Send QQ Message',
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
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				default: 'group',
				options: [
					{
						name: 'Private Message',
						value: 'private',
						description: 'Send to a QQ user',
					},
					{
						name: 'Group Message',
						value: 'group',
						description: 'Send to a QQ group',
					},
				],
				description: 'Choose whether to send a private or group message',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						messageType: ['private'],
					},
				},
				description: 'QQ number to send message to',
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						messageType: ['group'],
					},
				},
				description: 'QQ group number to send message to',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				required: true,
				typeOptions: {
					rows: 4,
				},
				description: 'Message content. Supports plain text, CQ codes, or JSON message segments.',
			},
			{
				displayName: 'Auto Escape',
				name: 'autoEscape',
				type: 'boolean',
				default: false,
				description: 'Whether to send as plain text (escape CQ codes)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const result: INodeExecutionData[] = [];

		for (let index = 0; index < items.length; index++) {
			try {
				const messageType = this.getNodeParameter('messageType', index) as 'private' | 'group';

				let data: IDataObject;

				if (messageType === 'private') {
					// 调用内部的 sendPrivateMsg 函数
					data = await sendPrivateMsg.call(this, index);
				} else {
					// 调用内部的 sendGroupMsg 函数
					data = await sendGroupMsg.call(this, index);
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
