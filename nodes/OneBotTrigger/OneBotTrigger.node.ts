import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

interface OneBotEvent extends IDataObject {
	post_type?: string;
	postType?: string;
	message_type?: string;
	messageType?: string;
	notice_type?: string;
	noticeType?: string;
	request_type?: string;
	requestType?: string;
	meta_event_type?: string;
	metaEventType?: string;
	self_id?: number;
	selfId?: number;
	user_id?: number;
	userId?: number;
	group_id?: number;
	groupId?: number;
	message_id?: number;
	messageId?: number;
	time?: number;
	timestamp?: number;
}

function normalizeType(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return normalized.length > 0 ? normalized : undefined;
}

function normalizeSelectedTypes(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.map((item) => normalizeType(item))
			.filter((item): item is string => item !== undefined);
	}

	const singleType = normalizeType(value);
	return singleType ? [singleType] : [];
}

function getDetailType(event: OneBotEvent): string {
	const postType = normalizeType(event.post_type ?? event.postType);

	switch (postType) {
		case 'message':
			return normalizeType(event.message_type ?? event.messageType) ?? 'unknown';
		case 'notice':
			return normalizeType(event.notice_type ?? event.noticeType) ?? 'unknown';
		case 'request':
			return normalizeType(event.request_type ?? event.requestType) ?? 'unknown';
		case 'meta_event':
			return normalizeType(event.meta_event_type ?? event.metaEventType) ?? 'unknown';
		default:
			return 'unknown';
	}
}

function buildOutput(event: OneBotEvent, includeRaw: boolean): IDataObject {
	const postType = normalizeType(event.post_type ?? event.postType) ?? 'unknown';
	const normalized: IDataObject = {
		postType,
		detailType: getDetailType(event),
		selfId: event.self_id ?? event.selfId,
		userId: event.user_id ?? event.userId,
		groupId: event.group_id ?? event.groupId,
		messageId: event.message_id ?? event.messageId,
		timestamp: event.time ?? event.timestamp,
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
	if (Array.isArray(headerValue)) {
		return parseHeaderToken(headerValue[0]);
	}

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
		icon: 'file:onebot.svg',
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

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const event = this.getBodyData() as OneBotEvent;

		const selectedTypes = normalizeSelectedTypes(this.getNodeParameter('events', []));
		const currentPostType = normalizeType(event.post_type ?? event.postType);
		if (!matchesPostType(selectedTypes, currentPostType)) {
			if (this.getMode() === 'manual') {
				const debugData = this.helpers.returnJsonArray({
					matched: false,
					reason: 'post_type does not match selected Events filter',
					receivedPostType: currentPostType ?? 'unknown',
					selectedTypes,
					raw: event,
				});

				return {
					workflowData: [debugData],
				};
			}

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
				if (this.getMode() === 'manual') {
					const debugData = this.helpers.returnJsonArray({
						matched: false,
						reason: 'token verification failed',
						expectedTokenConfigured: Boolean(expectedToken),
						hasIncomingToken: Boolean(incomingToken),
					});

					return {
						workflowData: [debugData],
					};
				}

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
