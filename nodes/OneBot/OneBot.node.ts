import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { botProperties } from './properties/bot.properties';
import { friendProperties } from './properties/friend.properties';
import { groupProperties } from './properties/group.properties';
import { messageProperties } from './properties/message.properties';
import { otherProperties } from './properties/other.properties';
import { relationshipProperties } from './properties/relationship.properties';
import { filesProperties } from './properties/files.properties';
import { getFriendList } from './loadOptions/getFriendList';
import { getGroupList } from './loadOptions/getGroupList';
import { getGroupMemberList } from './loadOptions/getGroupMemberList';
import { getManagedGroupList } from './loadOptions/getManagedGroupList';
import { getOwnedGroupList } from './loadOptions/getOwnedGroupList';
import {
	getGroupRootFileList,
	getGroupFileListByDirectory,
	getGroupFileByFolderList,
	getGroupRootFolderList,
	getAllGroupFolderList,
} from './loadOptions/getGroupFileList';
import { executeForwardMode, executeOperation } from './actionHandlers';

/**
 * Get forward_mode parameter safely
 */
function getForwardModeParam(this: IExecuteFunctions): boolean {
	try {
		return this.getNodeParameter('forward_mode', 0) as boolean;
	} catch {
		return false;
	}
}

export class OneBot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OneBot',
		name: 'oneBot',
		icon: 'file:onebot.svg',
		description:
			'Control QQ bot via OneBot protocol. Send messages, manage groups, upload files, and more.',
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
						name: 'File',
						value: 'files',
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
			...filesProperties,
			...friendProperties,
			...groupProperties,
			...messageProperties,
			...otherProperties,
			...relationshipProperties,
		],
		usableAsTool: true,
	};

	methods = {
		loadOptions: {
			getFriendList,
			getGroupList,
			getGroupMemberList,
			getManagedGroupList,
			getOwnedGroupList,
			getGroupRootFileList,
			getGroupFileListByDirectory,
			getGroupFileByFolderList,
			getGroupRootFolderList,
			getAllGroupFolderList,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource');

		// Handle forward mode for message resource
		if (resource === 'message') {
			const forwardMode = getForwardModeParam.call(this);

			if (forwardMode) {
				const operation = this.getNodeParameter('operation', 0) as string;
				const data = await executeForwardMode.call(this, items, operation);
				const json = this.helpers.returnJsonArray(data);
				return [json];
			}
		}

		// Execute operations for each item
		const result: INodeExecutionData[] = [];
		for (let index = 0; index < items.length; index++) {
			const operation = this.getNodeParameter('operation', index);

			const data = await executeOperation.call(this, resource, operation, index);

			const json = this.helpers.returnJsonArray(data);
			const executionData = this.helpers.constructExecutionMetaData(json, {
				itemData: { item: index },
			});

			result.push(...executionData);
		}

		return [result];
	}
}
