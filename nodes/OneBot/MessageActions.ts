import {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 执行消息相关操作
 */
export async function executeMessageOperation(
    this: IExecuteFunctions,
    index: number,
): Promise<INodeExecutionData> {
    const operation = this.getNodeParameter('operation', index) as string;
    console.log(`执行消息操作: ${operation}`);

    // 处理消息操作
    if (operation === 'send_private_msg') {
        return await handlePrivateMessage.call(this, index);
    } else if (operation === 'send_group_msg') {
        return await handleGroupMessage.call(this, index);
    } else {
        throw new Error(`未知的消息操作：${operation}`);
    }
}

/**
 * 验证并处理Base64图片数据
 * @param base64Data Base64编码的图片数据
 * @returns 处理后的Base64图片路径
 */
function processBase64Image(base64Data: string): string {
    if (!base64Data || base64Data.trim() === '') {
        console.log('Base64数据为空');
        return '';
    }

    // 显示数据大小信息，但不限制大小
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    const sizeInMB = sizeInBytes / (1024 * 1024);
    console.log(`Base64图片大小: ${sizeInMB.toFixed(2)}MB`);
    
    // 超过10MB给出警告但不阻止发送
    if (sizeInMB > 10) {
        console.log(`警告: Base64图片较大 (${sizeInMB.toFixed(2)}MB)，可能导致发送延迟或超时`);
    }

    // 检查并清理Base64数据
    let cleanedData = base64Data;
    // 去除可能存在的data:image前缀
    if (cleanedData.includes('base64,')) {
        cleanedData = cleanedData.split('base64,')[1];
    }
    
    // 验证为有效的Base64字符
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(cleanedData)) {
        console.log('Base64数据包含无效字符');
        throw new Error('无效的Base64图片数据');
    }

    return `base64://${cleanedData}`;
}

/**
 * 处理私聊消息
 */
async function handlePrivateMessage(
    this: IExecuteFunctions,
    index: number,
): Promise<INodeExecutionData> {
    // 获取用户ID
    const privateUserId = this.getNodeParameter('user_id', index);
    const body: IDataObject = { user_id: privateUserId };
    let endpoint: string = '';

    // 检查是否使用转发模式
    const privateForwardMode = this.getNodeParameter('forward_mode', index, false) as boolean;
    
    if (privateForwardMode) {
        // 使用转发消息格式
        const forwardMessages = this.getNodeParameter('forwardMessages', index) as {
            messages: Array<{
                user_id: string;
                nickname: string;
                addImage: boolean;
                imageSource?: string;
                imageUrl?: string;
                imagePath?: string;
                imageBase64?: string;
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
            // 默认使用空内容
            let content: any = '';
            
            // 检查是否需要添加图片
            if (msg.addImage) {
                try {
                    let imagePath = '';
                    
                    // 根据图片来源获取图片路径
                    const imageSource = msg.imageSource || 'url';
                    
                    if (imageSource === 'url') {
                        // 网络图片
                        imagePath = msg.imageUrl || '';
                    } else if (imageSource === 'file') {
                        // 本地文件需要添加file://前缀
                        const filePath = msg.imagePath || '';
                        imagePath = filePath ? 'file://' + filePath : '';
                    } else if (imageSource === 'base64') {
                        // 处理Base64编码
                        try {
                            imagePath = processBase64Image(msg.imageBase64 || '');
                        } catch (e) {
                            console.error('处理Base64图片失败:', e instanceof Error ? e.message : String(e));
                            // 出错时不添加图片，但不中断处理
                        }
                    }
                    
                    // 添加图片CQ码
                    if (imagePath && imagePath.trim() !== '') {
                        // 如果消息内容为空，则只发送图片
                        content = `[CQ:image,file=${imagePath}]`;
                    } else {
                        console.log('转发消息中图片路径为空，跳过添加图片');
                    }
                } catch (error) {
                    console.error('处理转发消息图片时出错:', error instanceof Error ? error.message : String(error));
                    // 如果出错，继续处理文本消息，不添加图片
                }
            }
            
            // 确保使用用户输入的user_id和nickname，为空时使用默认值
            const userId = msg.user_id && msg.user_id.trim() !== '' ? msg.user_id : '10000';
            const nickname = msg.nickname && msg.nickname.trim() !== '' ? msg.nickname : '用户';
            
            return {
                type: 'node',
                data: {
                    user_id: userId,
                    nickname: nickname,
                    content
                }
            };
        });
        
        body.messages = messages;
        
        // 添加摘要、提示和来源
        if (forwardSettings.summary) body.summary = forwardSettings.summary;
        if (forwardSettings.prompt) body.prompt = forwardSettings.prompt;
        if (forwardSettings.source) body.source = forwardSettings.source;
        
        // 添加文本内容
        if (newsMessages.news && newsMessages.news.length > 0) {
            body.news = newsMessages.news.map(item => ({ text: item.text }));
        } else {
            // 确保始终有news字段，即使没有设置
            body.news = [{ text: "不许点进来！" }];
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
                    // 处理Base64编码
                    try {
                        const base64Data = this.getNodeParameter('imageBase64', index, '') as string;
                        console.log(`[私聊消息] Base64图片数据长度: ${base64Data.length}`);
                        imagePath = processBase64Image(base64Data);
                    } catch (e) {
                        console.error('[私聊消息] 处理Base64图片失败:', e instanceof Error ? e.message : String(e));
                        throw e; // 将错误向上传递
                    }
                }

                // 只有当图片路径不为空时才添加图片
                if (imagePath && imagePath.trim() !== '') {
                    console.log(`[私聊消息] 图片路径有效，添加图片CQ码`);
                    if (!privateMessageContent.trim()) {
                        privateMessageContent = `[CQ:image,file=${imagePath}]`;
                    } else {
                        privateMessageContent = `${privateMessageContent}\n[CQ:image,file=${imagePath}]`;
                    }
                } else {
                    console.log('[私聊消息] 图片路径为空，跳过添加图片CQ码');
                }
            } catch (error) {
                console.error('[私聊消息] 处理图片时出错:', error instanceof Error ? error.message : String(error));
                throw error; // 将错误向上传递
            }
        }

        body.message = privateMessageContent;
        endpoint = 'send_private_msg';
        console.log('send_private_msg参数:', JSON.stringify(body));
    }

    // 发送请求
    try {
        const data = await apiRequest.call(this, 'POST', endpoint, body);
        return { json: data };
    } catch (error) {
        // 添加更友好的错误提示
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('aborted') || errorMsg.includes('connection')) {
            throw new Error(`发送消息失败: 服务器连接中断。可能是图片太大或格式有问题，请尝试使用更小的图片或检查网络连接。`);
        }
        throw error;
    }
}

/**
 * 处理群聊消息
 */
async function handleGroupMessage(
    this: IExecuteFunctions,
    index: number,
): Promise<INodeExecutionData> {
    // 获取群ID
    const groupId = this.getNodeParameter('group_id', index);
    if (!groupId) {
        throw new Error('发送群消息需要有效的群ID，但未提供');
    }
    
    const body: IDataObject = { group_id: groupId };
    let endpoint: string = '';

    // 检查是否使用转发模式
    const groupForwardMode = this.getNodeParameter('forward_mode', index, false) as boolean;
    
    if (groupForwardMode) {
        // 使用转发消息格式
        const forwardMessages = this.getNodeParameter('forwardMessages', index) as {
            messages: Array<{
                user_id: string;
                nickname: string;
                addImage: boolean;
                imageSource?: string;
                imageUrl?: string;
                imagePath?: string;
                imageBase64?: string;
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
            // 默认使用空内容
            let content: any = '';
            
            // 检查是否需要添加图片
            if (msg.addImage) {
                try {
                    let imagePath = '';
                    
                    // 根据图片来源获取图片路径
                    const imageSource = msg.imageSource || 'url';
                    
                    if (imageSource === 'url') {
                        // 网络图片
                        imagePath = msg.imageUrl || '';
                    } else if (imageSource === 'file') {
                        // 本地文件需要添加file://前缀
                        const filePath = msg.imagePath || '';
                        imagePath = filePath ? 'file://' + filePath : '';
                    } else if (imageSource === 'base64') {
                        // 处理Base64编码
                        try {
                            imagePath = processBase64Image(msg.imageBase64 || '');
                        } catch (e) {
                            console.error('处理Base64图片失败:', e instanceof Error ? e.message : String(e));
                            // 出错时不添加图片，但不中断处理
                        }
                    }
                    
                    // 添加图片CQ码
                    if (imagePath && imagePath.trim() !== '') {
                        // 如果消息内容为空，则只发送图片
                        content = `[CQ:image,file=${imagePath}]`;
                    } else {
                        console.log('群聊转发消息中图片路径为空，跳过添加图片');
                    }
                } catch (error) {
                    console.error('处理群聊转发消息图片时出错:', error instanceof Error ? error.message : String(error));
                    // 如果出错，继续处理文本消息，不添加图片
                }
            }
            
            // 确保使用用户输入的user_id和nickname，为空时使用默认值
            const userId = msg.user_id && msg.user_id.trim() !== '' ? msg.user_id : '10000';
            const nickname = msg.nickname && msg.nickname.trim() !== '' ? msg.nickname : '用户';
            
            return {
                type: 'node',
                data: {
                    user_id: userId,
                    nickname: nickname,
                    content
                }
            };
        });
        
        body.messages = messages;
        
        // 添加摘要、提示和来源
        if (forwardSettings.summary) body.summary = forwardSettings.summary;
        if (forwardSettings.prompt) body.prompt = forwardSettings.prompt;
        if (forwardSettings.source) body.source = forwardSettings.source;
        
        // 添加文本内容
        if (newsMessages.news && newsMessages.news.length > 0) {
            body.news = newsMessages.news.map(item => ({ text: item.text }));
        } else {
            // 确保始终有news字段，即使没有设置
            body.news = [{ text: "不许点进来！" }];
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
                    // 处理Base64编码
                    try {
                        const base64Data = this.getNodeParameter('imageBase64', index, '') as string;
                        console.log(`[群聊消息] Base64图片数据长度: ${base64Data.length}`);
                        imagePath = processBase64Image(base64Data);
                    } catch (e) {
                        console.error('[群聊消息] 处理Base64图片失败:', e instanceof Error ? e.message : String(e));
                        throw e; // 将错误向上传递
                    }
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
                throw error; // 将错误向上传递
            }
        }

        body.message = messageContent;
        endpoint = 'send_group_msg';
        console.log('send_group_msg参数:', JSON.stringify(body));
    }

    // 发送请求
    try {
        const data = await apiRequest.call(this, 'POST', endpoint, body);
        return { json: data };
    } catch (error) {
        // 添加更友好的错误提示
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('aborted') || errorMsg.includes('connection')) {
            throw new Error(`发送群消息失败: 服务器连接中断。可能是图片太大或格式有问题，请尝试使用更小的图片或检查网络连接。`);
        }
        throw error;
    }
}

/**
 * 处理多输入项转发消息
 */
export async function handleMultipleInputsForward(
    this: IExecuteFunctions,
    itemsLength: number
): Promise<INodeExecutionData> {
    try {
        // 获取第一个输入项的操作类型
        const operation = this.getNodeParameter('operation', 0) as string;
        
        // 只支持发送消息操作的转发
        if (!['send_private_msg', 'send_group_msg'].includes(operation)) {
            throw new Error('多输入项转发消息仅支持发送私聊消息和群消息操作');
        }
        
        // 准备转发消息参数
        let body: IDataObject = {};
        let endpoint: string = '';
        
        // 尝试从第一个输入项获取用户ID和昵称
        let defaultUserId = '';
        let defaultNickname = '';
        
        // 优先使用用户在前端设置的转发消息信息
        try {
            const hasForwardSettings = this.getNodeParameter('forward_mode', 0, false) as boolean;
            
            if (hasForwardSettings) {
                // 获取第一个转发消息的用户ID和昵称作为默认值
                const forwardMessages = this.getNodeParameter('forwardMessages', 0) as {
                    messages: Array<{
                        user_id: string;
                        nickname: string;
                    }>;
                };
                
                if (forwardMessages?.messages && forwardMessages.messages.length > 0) {
                    defaultUserId = forwardMessages.messages[0].user_id || '';
                    defaultNickname = forwardMessages.messages[0].nickname || '';
                    console.log(`使用用户提供的默认ID: ${defaultUserId}, 昵称: ${defaultNickname}`);
                }
            }
        } catch (e) {
            console.log('获取用户指定的转发消息信息失败，使用默认值');
        }
        
        // 如果前面未获取到有效的默认值，尝试获取机器人信息
        if (!defaultUserId) {
            try {
                const loginInfo = await apiRequest.call(this, 'GET', 'get_login_info');
                const botInfo = loginInfo?.data || { user_id: '0', nickname: 'Bot' };
                defaultUserId = botInfo.user_id;
                defaultNickname = botInfo.nickname;
                console.log(`使用机器人信息作为默认ID: ${defaultUserId}, 昵称: ${defaultNickname}`);
            } catch (error) {
                console.log('获取机器人信息失败，使用硬编码默认值');
                defaultUserId = '0'; 
                defaultNickname = 'Bot';
            }
        }
        
        // 构建转发消息数组
        const messages = [];
        
        for (let index = 0; index < itemsLength; index++) {
            // 获取当前项的消息内容
            let messageContent = '';
            
            try {
                // 尝试获取消息内容
                messageContent = this.getNodeParameter('message', index, '') as string;
                
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
                    messageContent = JSON.stringify(this.getInputData()[index].json);
                } catch (jsonError) {
                    messageContent = '无法获取消息内容';
                }
            }
            
            // 构建消息对象 - 使用标准格式和默认的user_id
            const messageObj = {
                type: 'node',
                data: {
                    user_id: defaultUserId,
                    nickname: defaultNickname,
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
                // 转发消息设置
                const forwardSettings = this.getNodeParameter('forwardSettings', 0, {}) as {
                    summary?: string;
                    source?: string;
                    prompt?: string;
                };
                
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
                        body.news = [{ text: "不许点进来！" }];
                    }
                } catch (e) {
                    // 如果获取失败，使用默认值
                    body.news = [{ text: "不许点进来！" }];
                }
            } else {
                body.summary = '哼哼';
                body.prompt = '宝宝，我爱你';
                body.source = '坏蛋！';
                body.news = [{ text: "不许点进来！" }];
            }
        } catch (e) {
            // 使用默认个性化值
            body.summary = '哼哼';
            body.prompt = '宝宝，我爱你';
            body.source = '坏蛋！';
            body.news = [{ text: "不许点进来！" }];
        }
        
        console.log(`自动转发消息参数:`, JSON.stringify(body));
        
        // 发送请求
        try {
            const data = await apiRequest.call(this, 'POST', endpoint, body);
            return { json: data };
        } catch (error) {
            // 添加更友好的错误提示
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes('aborted') || errorMsg.includes('connection')) {
                throw new Error(`发送转发消息失败: 服务器连接中断。可能是内容太大或格式有问题，请检查网络连接或减少转发的消息数量。`);
            }
            throw error;
        }
    } catch (error) {
        console.error(`执行多输入项转发消息时出错:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
} 