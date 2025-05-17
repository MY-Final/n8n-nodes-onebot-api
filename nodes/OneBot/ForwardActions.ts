import {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 处理多输入项转发消息
 * 简化版本：只支持纯文本消息的转发
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
                // 获取每个项目的消息文本
                const messageText = this.getNodeParameter('message', i, '');
                
                if (!messageText || (typeof messageText === 'string' && messageText.trim() === '')) {
                    console.log(`项目 ${i+1}: 消息为空，将使用默认文本`);
                }
                
                // 添加到转发消息数组
                (body.messages as IDataObject[]).push({
                    type: 'node',
                    data: {
                        user_id: botInfo.user_id.toString(),
                        nickname: botInfo.nickname,
                        content: [{
                            type: 'text',
                            data: {
                                text: messageText || `[转发消息 #${i+1}]`
                            }
                        }]
                    }
                });
                
                console.log(`已添加项目 ${i+1} 的文本消息到转发列表`);
            } catch (error) {
                console.error(`处理项目 ${i+1} 时出错:`, error instanceof Error ? error.message : String(error));
                
                // 添加错误信息作为消息内容
                (body.messages as IDataObject[]).push({
                    type: 'node',
                    data: {
                        user_id: botInfo.user_id.toString(),
                        nickname: botInfo.nickname,
                        content: [{
                            type: 'text',
                            data: {
                                text: `[错误: 处理项目 ${i+1} 失败]`
                            }
                        }]
                    }
                });
            }
        }
        
        // 添加转发消息设置（读取用户配置）
        try {
            const forwardSettings = this.getNodeParameter('forwardSettings', 0, {}) as {
                summary?: string;
                source?: string;
                prompt?: string;
            };
            
            body.summary = forwardSettings.summary || '聊天记录';
            body.source = forwardSettings.source || '';
            body.prompt = forwardSettings.prompt || '查看完整聊天记录';
            
            // 添加文本内容
            try {
                const newsMessages = this.getNodeParameter('newsMessages', 0, { news: [] }) as {
                    news: Array<{
                        text: string;
                    }>;
                };
                
                if (newsMessages.news && newsMessages.news.length > 0) {
                    body.news = newsMessages.news.map(item => ({ text: item.text || "不许点进来！" }));
                    console.log(`添加了${newsMessages.news.length}条自定义文本内容`);
                } else {
                    body.news = [];
                }
            } catch (error) {
                console.log('获取文本内容失败，使用默认值:', error instanceof Error ? error.message : String(error));
                body.news = [];
            }
            
            // 检查输入数据中是否含有额外设置
            try {
                const itemData = this.getInputData(0);
                if (itemData[0] && itemData[0].json) {
                    // 检查输入中的prompt, summary, source, news字段
                    if (itemData[0].json.prompt && typeof itemData[0].json.prompt === 'string') {
                        body.prompt = itemData[0].json.prompt;
                        console.log(`从输入数据中获取prompt: ${body.prompt}`);
                    }
                    
                    if (itemData[0].json.summary && typeof itemData[0].json.summary === 'string') {
                        body.summary = itemData[0].json.summary;
                        console.log(`从输入数据中获取summary: ${body.summary}`);
                    }
                    
                    if (itemData[0].json.source && typeof itemData[0].json.source === 'string') {
                        body.source = itemData[0].json.source;
                        console.log(`从输入数据中获取source: ${body.source}`);
                    }
                    
                    // 检查是否有news数组
                    if (itemData[0].json.news && Array.isArray(itemData[0].json.news)) {
                        body.news = itemData[0].json.news;
                        console.log(`从输入数据中获取news数组`);
                    }
                }
            } catch (e) {
                console.log(`尝试从输入数据中获取设置时出错:`, e instanceof Error ? e.message : String(e));
            }
        } catch (error) {
            console.log('获取转发设置时出错，使用默认值:', error instanceof Error ? error.message : String(error));
            body.summary = '聊天记录';
            body.prompt = '查看完整聊天记录';
            body.news = [];
        }
        
        console.log(`准备发送${(body.messages as IDataObject[]).length}条转发消息，端点: ${endpoint}`);
        console.log(`转发设置: 摘要=${body.summary}, 提示=${body.prompt}, 来源=${body.source || '无'}`);
        if (body.news && Array.isArray(body.news)) {
            console.log(`包含自定义文本内容`);
        }
        
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