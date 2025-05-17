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
 * 检测并处理消息中可能包含的Base64数据
 * 支持直接在消息框中粘贴Base64数据，自动转换为图片CQ码
 * @param message 原始消息文本
 * @param autoDetect 是否启用自动检测
 * @returns 处理后的消息文本
 */
function detectAndProcessBase64InMessage(message: string, autoDetect: boolean = false): string {
    if (!message || message.trim() === '' || !autoDetect) {
        return message;
    }

    // 如果消息已经包含CQ码，不做处理
    if (message.includes('[CQ:')) {
        return message;
    }

    try {
        // 检测消息是否可能完全是一段Base64编码图片数据
        // 只有当整个消息都是Base64数据时才转换，不处理混合内容
        const trimmedMessage = message.trim();
        
        // 严格判断条件 - 整个消息必须符合：
        // 1. 长度至少为100个字符
        // 2. 只包含合法Base64字符
        // 3. 不包含大量空格、换行等明显的文本格式
        // 4. 不是明显的普通文本（如包含中文、明显的单词、URL等）
        if (trimmedMessage.length >= 100 && 
            /^[A-Za-z0-9+/=]+$/.test(trimmedMessage) && 
            !/\s{2,}/.test(trimmedMessage) &&
            !/[\u4e00-\u9fa5]|^(http|www|\w+\s\w+)/.test(trimmedMessage)) {
            
            try {
                console.log('检测到可能的Base64图片数据，尝试转换为CQ码');
                const processedBase64 = processBase64Image(trimmedMessage);
                if (processedBase64) {
                    return `[CQ:image,file=${processedBase64}]`;
                }
            } catch (error) {
                console.log('Base64转换失败，保留原始文本', error);
            }
        }
        
        return message;
    } catch (error) {
        console.log('Base64检测处理出错，保留原始消息:', error);
        return message;
    }
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

        // 获取"自动检测Base64数据"选项，默认为false（不启用自动检测）
        // 注意：由于我们无法动态添加UI选项，这里暂时默认为false，防止误判
        // 将来可以添加到UI选项中
        const autoDetectBase64 = false; // 默认不启用自动检测

        // 检查消息中是否包含Base64数据并自动处理
        privateMessageContent = detectAndProcessBase64InMessage(privateMessageContent, autoDetectBase64);

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
        // 更新错误提示，明确指出请求失败
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('aborted') || errorMsg.includes('connection')) {
            throw new Error(`发送私聊消息失败: 服务器连接中断。请求未成功完成，消息未发送。可能原因：图片太大或格式有问题，请尝试使用更小的图片或检查网络连接。`);
        } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            throw new Error(`发送私聊消息失败: 请求超时。请求未成功完成，消息未发送。请检查网络连接和服务器状态后重试。`);
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

        // 获取"自动检测Base64数据"选项，默认为false（不启用自动检测）
        const autoDetectBase64 = false; // 默认不启用自动检测

        // 检查消息中是否包含Base64数据并自动处理
        messageContent = detectAndProcessBase64InMessage(messageContent, autoDetectBase64);

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
        // 更新错误提示，明确指出请求失败
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('aborted') || errorMsg.includes('connection')) {
            throw new Error(`发送群消息失败: 服务器连接中断。请求未成功完成，消息未发送。可能原因：图片太大或格式有问题，请尝试使用更小的图片或检查网络连接。`);
        } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            throw new Error(`发送群消息失败: 请求超时。请求未成功完成，消息未发送。请检查网络连接和服务器状态后重试。`);
        }
        throw error;
    }
} 