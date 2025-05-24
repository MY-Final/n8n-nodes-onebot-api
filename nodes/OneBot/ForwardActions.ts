import {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 处理多输入项转发消息
 * 简化版本：仅支持纯文本消息的转发
 */
export async function handleMultipleInputsForward(
    this: IExecuteFunctions,
    itemsLength: number
): Promise<INodeExecutionData> {
    try {
        console.log(`处理多输入项转发，总共${itemsLength}个项目`);
        
        // 获取第一个输入项的操作类型
        const operation = this.getNodeParameter('operation', 0) as string;
        
        // 只支持发送消息操作的转发
        if (!['send_private_msg', 'send_group_msg'].includes(operation)) {
            throw new Error('多输入项转发消息仅支持发送私聊消息和群消息操作');
        }
        
        // 获取机器人信息
        const loginInfo = await apiRequest.call(this, 'GET', 'get_login_info');
        const botInfo = loginInfo?.data || { user_id: '0', nickname: 'Bot' };
        console.log(`获取机器人信息：ID: ${botInfo.user_id}, 昵称: ${botInfo.nickname}`);
        
        // 尝试获取自定义的user_id和nickname
        let userId = botInfo.user_id.toString();
        let nickname = botInfo.nickname;
        
        try {
            // 1. 首先检查UI中是否启用了自定义发送者
            const customSender = this.getNodeParameter('customSender', 0, false) as boolean;
            
            if (customSender) {
                // 2. 从UI中获取自定义发送者信息
                const senderInfo = this.getNodeParameter('senderInfo', 0, {}) as {
                    user_id?: string;
                    nickname?: string;
                };
                
                // 如果UI中设置了自定义值，则使用
                if (senderInfo.user_id && senderInfo.user_id.trim() !== '') {
                    userId = senderInfo.user_id;
                    console.log(`使用UI设置的自定义user_id: ${userId}`);
                }
                
                if (senderInfo.nickname && senderInfo.nickname.trim() !== '') {
                    nickname = senderInfo.nickname;
                    console.log(`使用UI设置的自定义nickname: ${nickname}`);
                }
            }
        } catch (error) {
            console.log(`获取UI自定义发送者信息失败，使用默认值:`, error instanceof Error ? error.message : String(error));
        }
        
        // 准备转发消息参数
        const body: IDataObject = {};
        let endpoint: string = '';
        
        // 确定是私聊还是群消息
        if (operation === 'send_private_msg') {
            endpoint = 'send_private_forward_msg';
            body.user_id = this.getNodeParameter('user_id', 0) as string;
        } else {
            endpoint = 'send_group_forward_msg';
            body.group_id = this.getNodeParameter('group_id', 0) as string;
        }
        
        // 构建转发消息数组
        body.messages = [];
        for (let i = 0; i < itemsLength; i++) {
            try {
                // 获取消息文本
                let messageText = '';
                try {
                    // 首先尝试从UI参数获取
                    messageText = this.getNodeParameter('message', i, '') as string;
                    console.log(`从message参数获取文本: "${messageText}"`);
                } catch (msgError) {
                    console.log(`获取message参数失败: ${msgError instanceof Error ? msgError.message : String(msgError)}`);
                }
                
                // 准备本条消息的发送者信息（默认使用全局设置的值）
                let itemUserId = userId;
                let itemNickname = nickname;
                
                try {
                    // 从输入数据中获取，如果有设置的话
                    const inputData = this.getInputData();
                    if (inputData && inputData[i] && inputData[i].json) {
                        // 检查是否有自定义user_id
                        if (inputData[i].json.user_id) {
                            itemUserId = String(inputData[i].json.user_id);
                            console.log(`项目 ${i+1}: 使用自定义user_id: ${itemUserId}`);
                        }
                        
                        // 检查是否有自定义nickname
                        if (inputData[i].json.nickname) {
                            itemNickname = String(inputData[i].json.nickname);
                            console.log(`项目 ${i+1}: 使用自定义nickname: ${itemNickname}`);
                        }
                        
                        // 检查输入数据中是否有消息内容
                        if (messageText === '' && inputData[i].json.message) {
                            messageText = String(inputData[i].json.message);
                            console.log(`项目 ${i+1}: 从输入数据获取消息内容: "${messageText}"`);
                        }
                    }
                } catch (error) {
                    console.log(`获取自定义输入数据失败:`, error instanceof Error ? error.message : String(error));
                }
                
                // 添加到转发消息数组
                (body.messages as IDataObject[]).push({
                    type: 'node',
                    data: {
                        user_id: itemUserId,
                        nickname: itemNickname,
                        content: messageText || '消息内容为空'
                    }
                });
                
                console.log(`已添加项目 ${i+1} 的消息到转发列表`);
            } catch (error) {
                console.error(`处理项目 ${i+1} 时出错:`, error instanceof Error ? error.message : String(error));
                
                // 添加错误信息作为消息内容
                (body.messages as IDataObject[]).push({
                    type: 'node',
                    data: {
                        user_id: botInfo.user_id.toString(),
                        nickname: botInfo.nickname,
                        content: `无法获取消息内容`
                    }
                });
            }
        }
        
        // 添加默认的转发消息设置
        body.summary = '聊天记录';
        body.prompt = '查看完整聊天记录';
        
        // 检查是否有设置了forwardSettings参数
        try {
            const forwardSettings = this.getNodeParameter('forwardSettings', 0, {}) as {
                summary?: string;
                source?: string;
                prompt?: string;
                news?: string;
            };
            
            if (forwardSettings.summary) body.summary = forwardSettings.summary;
            if (forwardSettings.source) body.source = forwardSettings.source;
            if (forwardSettings.prompt) body.prompt = forwardSettings.prompt;
            
            // 添加news内容 (可选)
            if (forwardSettings.news) {
                body.news = [{ text: forwardSettings.news }];
            }
        } catch (error) {
            console.log('获取转发设置失败，使用默认值:', error instanceof Error ? error.message : String(error));
        }
        
        console.log(`准备发送${(body.messages as IDataObject[]).length}条转发消息，端点: ${endpoint}`);
        
        // 发送请求
        try {
            const data = await apiRequest.call(this, 'POST', endpoint, body);
            console.log('转发消息发送成功');
            return { json: data };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('发送转发消息失败:', errorMsg);
            throw error;
        }
    } catch (error) {
        console.error(`执行多输入项转发消息时出错:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
} 