import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

interface OneBotEvent extends IDataObject {
	post_type?: string;
	message_type?: string;
	notice_type?: string;
	request_type?: string;
	meta_event_type?: string;
	self_id?: number;
	user_id?: number;
	group_id?: number;
	message_id?: number;
	time?: number;
}

function getDetailType(event: OneBotEvent): string {
	switch (event.post_type) {
		case 'message':
			return event.message_type ?? 'unknown';
		case 'notice':
			return event.notice_type ?? 'unknown';
		case 'request':
			return event.request_type ?? 'unknown';
		case 'meta_event':
			return event.meta_event_type ?? 'unknown';
		default:
			return 'unknown';
	}
}

function buildOutput(event: OneBotEvent, includeRaw: boolean): IDataObject {
	const normalized: IDataObject = {
		postType: event.post_type ?? 'unknown',
		detailType: getDetailType(event),
		selfId: event.self_id,
		userId: event.user_id,
		groupId: event.group_id,
		messageId: event.message_id,
		timestamp: event.time,
	};

	if (!includeRaw) {
		return normalized;
	}

	return {
		...normalized,
		raw: event,
	};
}

function matchesPostType(selectedTypes: string[], currentType?: string): boolean {
	if (selectedTypes.length === 0) {
		return true;
	}

	if (!currentType) {
		return false;
	}

	return selectedTypes.includes(currentType);
}

function parseHeaderToken(headerValue: unknown): string {
	if (typeof headerValue !== 'string') {
		return '';
	}

	if (headerValue.startsWith('Bearer ')) {
		return headerValue.slice(7).trim();
	}

	return headerValue.trim();
}

export class OneBotTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot Trigger',
		name: 'oneBotTrigger',
		icon: 'file:../OneBot/onebot.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receive OneBot HTTP event callbacks',
		defaults: {
			name: 'OneBot Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'event',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				default: ['message', 'notice', 'request', 'meta_event'],
				options: [
					{
						name: 'Message',
						value: 'message',
						description: 'Receive message events',
					},
					{
						name: 'Meta Event',
						value: 'meta_event',
						description: 'Receive heartbeat and lifecycle events',
					},
					{
						name: 'Notice',
						value: 'notice',
						description: 'Receive notice events',
					},
					{
						name: 'Request',
						value: 'request',
						description: 'Receive request events',
					},
				],
				description: 'Only trigger workflow for selected post types',
			},
			{
				displayName: 'Verify Token',
				name: 'verifyToken',
				type: 'boolean',
				default: false,
				description: 'Whether to verify `x-onebot-token` or `Authorization: Bearer` token',
			},
			{
				displayName: 'Expected Token',
				name: 'expectedToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				displayOptions: {
					show: {
						verifyToken: [true],
					},
				},
				description: 'Incoming request token must match this value',
			},
			{
				displayName: 'Include Raw Event',
				name: 'includeRaw',
				type: 'boolean',
				default: true,
				description: 'Whether to include full raw OneBot payload in output',
			},
		],
		usableAsTool: true,
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		return {
			closeFunction: async () => {},
		};
	}

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const event = this.getBodyData() as OneBotEvent;

		const selectedTypes = this.getNodeParameter('events', []) as string[];
		if (!matchesPostType(selectedTypes, event.post_type)) {
			return {
				workflowData: [[]],
			};
		}

		const verifyToken = this.getNodeParameter('verifyToken', false) as boolean;
		if (verifyToken) {
			const expectedToken = this.getNodeParameter('expectedToken', '') as string;
			const headers = this.getHeaderData();
			const oneBotToken = parseHeaderToken(headers['x-onebot-token']);
			const authToken = parseHeaderToken(headers.authorization);
			const incomingToken = oneBotToken || authToken;

			if (!expectedToken || incomingToken !== expectedToken) {
				return {
					workflowData: [[]],
				};
			}
		}

		const includeRaw = this.getNodeParameter('includeRaw', true) as boolean;
		const output = buildOutput(event, includeRaw);
		const data: INodeExecutionData[] = this.helpers.returnJsonArray(output);

		return {
			workflowData: [data],
		};
	}
}
