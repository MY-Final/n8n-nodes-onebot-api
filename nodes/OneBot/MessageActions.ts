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
                content?: string;
            }>;
        };
        
        // 获取转发消息设置
        const forwardSettings = this.getNodeParameter('forwardSettings', index, {}) as {
            summary?: string;
            source?: string;
            prompt?: string;
            news?: string;
        };
        
        // 获取文本内容
        let newsItems: Array<{ text: string }> = [];
        try {
        const newsMessages = this.getNodeParameter('newsMessages', index, { news: [] }) as {
            news: Array<{
                text: string;
            }>;
        };
            
            if (newsMessages.news && newsMessages.news.length > 0) {
                newsItems = newsMessages.news.map(item => ({ text: item.text }));
                console.log('使用旧版newsMessages参数');
            }
        } catch (e) {
            console.log('获取旧版newsMessages参数失败:', e instanceof Error ? e.message : String(e));
        }
        
        // 转换为OneBot API所需的格式
        const messages = forwardMessages.messages.map(msg => {
            // 检查是否有自定义内容
            let content: any = msg.content || '';
            
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
        
        // 添加文本内容 - 优先使用forwardSettings.news参数
        if (forwardSettings.news) {
            body.news = [{ text: forwardSettings.news }];
            console.log(`使用forwardSettings.news参数: ${forwardSettings.news}`);
        } else if (newsItems.length > 0) {
            // 兼容旧版格式
            body.news = newsItems;
            console.log(`使用旧版newsMessages参数，包含${newsItems.length}条内容`);
        } else {
            // 确保始终有news字段，即使没有设置
            body.news = [{ text: "查看详细内容" }];
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
    try {
        // 添加MessageItem类型定义
        type MessageItem = {
            user_id: string;
            nickname: string;
            addImage: boolean;
            imageSource?: string;
            imageUrl?: string;
            imagePath?: string;
            imageBase64?: string;
            content?: string;  // 添加content属性
        };
        
    // 获取群ID
        let groupId;
        try {
            groupId = this.getNodeParameter('group_id', index);
            console.log(`成功获取群ID: ${groupId}`);
        } catch (error) {
            console.error('获取群ID参数失败:', error instanceof Error ? error.message : String(error));
            throw new Error('发送群消息失败: 无法获取群ID参数');
        }
        
    if (!groupId) {
        throw new Error('发送群消息需要有效的群ID，但未提供');
    }
    
    const body: IDataObject = { group_id: groupId };
    let endpoint: string = '';

    // 检查是否使用转发模式
        let groupForwardMode = false;
        try {
            groupForwardMode = this.getNodeParameter('forward_mode', index, false) as boolean;
            console.log(`转发模式: ${groupForwardMode ? '启用' : '禁用'}`);
        } catch (error) {
            console.error('获取转发模式参数失败:', error instanceof Error ? error.message : String(error));
            // 默认禁用转发模式
            groupForwardMode = false;
        }
    
    if (groupForwardMode) {
        // 使用转发消息格式
            let forwardMessages: {
                messages: Array<MessageItem>
            } = { messages: [] };
            try {
                forwardMessages = this.getNodeParameter('forwardMessages', index) as {
                    messages: Array<MessageItem>;
                };
                console.log(`获取到转发消息列表，包含${forwardMessages.messages.length}条消息`);
            } catch (error) {
                console.error('获取转发消息列表参数失败:', error instanceof Error ? error.message : String(error));
                console.log('将根据输入数据自动创建转发消息');
                
                // 自动创建转发消息 - 使用机器人的登录信息
                try {
                    // 获取机器人信息
                    const loginInfoResponse = await apiRequest.call(this, 'GET', 'get_login_info');
                    if (loginInfoResponse && loginInfoResponse.data) {
                        const botInfo = loginInfoResponse.data;
                        
                        // 尝试从输入数据获取消息内容
                        let content = '';
                        let hasImage = false;
                        let imageUrl = '';
                        
                        try {
                            const inputData = this.getInputData();
                            if (inputData && inputData[index]) {
                                // 检查是否有文本内容
                                const jsonData = inputData[index].json;
                                if (jsonData) {
                                    if (typeof jsonData.message === 'string') {
                                        content = jsonData.message;
                                    } else if (typeof jsonData.text === 'string') {
                                        content = jsonData.text;
                                    } else if (typeof jsonData.content === 'string') {
                                        content = jsonData.content;
                                    } else if (typeof jsonData.data === 'string') {
                                        content = jsonData.data;
                                    } else if (jsonData.message !== undefined) {
                                        content = String(jsonData.message);
                                    } else if (jsonData.text !== undefined) {
                                        content = String(jsonData.text);
                                    } else if (jsonData.content !== undefined) {
                                        content = String(jsonData.content);
                                    } else if (jsonData.data !== undefined) {
                                        content = String(jsonData.data);
                                    }
                                    
                                    // 检查是否有图片URL
                                    if (typeof jsonData.imageUrl === 'string') {
                                        imageUrl = jsonData.imageUrl;
                                        hasImage = true;
                                    } else if (typeof jsonData.url === 'string' && 
                                              (jsonData.url.endsWith('.jpg') || 
                                               jsonData.url.endsWith('.jpeg') || 
                                               jsonData.url.endsWith('.png') || 
                                               jsonData.url.endsWith('.gif'))) {
                                        imageUrl = jsonData.url;
                                        hasImage = true;
                                    }
                                }
                                
                                // 检查是否有二进制数据（图片）
                                if (inputData[index].binary && typeof inputData[index].binary === 'object') {
                                    const binaryData = inputData[index].binary as Record<string, any>;
                                    if (binaryData && Object.keys(binaryData).length > 0) {
                                        for (const binaryPropertyName of Object.keys(binaryData)) {
                                            const binaryProperty = binaryData[binaryPropertyName];
                                            if (binaryProperty && binaryProperty.mimeType && binaryProperty.mimeType.startsWith('image/')) {
                                            // 使用base64图片
                                            imageUrl = `base64://${binaryProperty.data}`;
                                            hasImage = true;
                                            break;
                                        }
                                    }
                                    }
                                }
                            }
                        } catch (inputError) {
                            console.error('从输入数据获取内容失败:', inputError instanceof Error ? inputError.message : String(inputError));
                        }
                        
                        // 如果都没有内容，提供默认值
                        if (!content && !hasImage) {
                            content = '转发的消息';
                        }
                        
                                            // 创建一个简单的转发消息
                    forwardMessages = {
                        messages: [
                            {
                                user_id: botInfo.user_id.toString(),
                                nickname: botInfo.nickname || '机器人',
                                addImage: hasImage,
                                imageSource: hasImage ? (imageUrl.startsWith('base64://') ? 'base64' : 'url') : undefined,
                                imageUrl: hasImage && !imageUrl.startsWith('base64://') ? imageUrl : undefined,
                                imageBase64: hasImage && imageUrl.startsWith('base64://') ? imageUrl.replace('base64://', '') : undefined,
                                content: content || '转发的消息' // 确保有内容
                            }
                        ]
                    };
                        
                        console.log('自动创建了转发消息，使用机器人信息');
                    } else {
                        console.error('无法获取机器人信息，使用默认值');
                        forwardMessages = {
                            messages: [
                                {
                                    user_id: '10000',
                                    nickname: '机器人',
                                    addImage: false,
                                    content: '转发的消息' // 确保有内容
                                }
                            ]
                        };
                    }
                } catch (botInfoError) {
                    console.error('获取机器人信息失败:', botInfoError instanceof Error ? botInfoError.message : String(botInfoError));
                    // 创建一个简单的默认转发消息
                    forwardMessages = {
                        messages: [
                            {
                                user_id: '10000',
                                nickname: '机器人',
                                addImage: false,
                                content: '转发的消息' // 确保有内容
                            }
                        ]
                    };
                }
            }
        
        // 获取转发消息设置
            let forwardSettings = {};
            try {
                forwardSettings = this.getNodeParameter('forwardSettings', index, {}) as {
            summary?: string;
            source?: string;
            prompt?: string;
                    news?: string;
        };
                console.log('成功获取转发设置参数');
            } catch (error) {
                console.error('获取转发设置参数失败:', error instanceof Error ? error.message : String(error));
                forwardSettings = {};
            }
        
        // 获取文本内容
            let newsItems: Array<{ text: string }> = [];
            try {
        const newsMessages = this.getNodeParameter('newsMessages', index, { news: [] }) as {
            news: Array<{
                text: string;
            }>;
        };
                
                if (newsMessages.news && newsMessages.news.length > 0) {
                    newsItems = newsMessages.news.map(item => ({ text: item.text }));
                    console.log('使用旧版newsMessages参数');
                }
            } catch (error) {
                console.log('获取旧版newsMessages参数失败:', error instanceof Error ? error.message : String(error));
            }
        
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
            if ((forwardSettings as any).summary) body.summary = (forwardSettings as any).summary;
            if ((forwardSettings as any).prompt) body.prompt = (forwardSettings as any).prompt;
            if ((forwardSettings as any).source) body.source = (forwardSettings as any).source;
            
            // 添加文本内容 - 优先使用forwardSettings.news参数
            if ((forwardSettings as any).news) {
                body.news = [{ text: (forwardSettings as any).news }];
                console.log(`使用forwardSettings.news参数: ${(forwardSettings as any).news}`);
            } else if (newsItems.length > 0) {
                // 兼容旧版格式
                body.news = newsItems;
                console.log(`使用旧版newsMessages参数，包含${newsItems.length}条内容`);
        } else {
            // 确保始终有news字段，即使没有设置
                body.news = [{ text: "查看详细内容" }];
        }
        
        endpoint = 'send_group_forward_msg';
        console.log('send_group_forward_msg参数:', JSON.stringify(body));
    } else {
        // 获取消息内容
            let messageContent = '';
            try {
                messageContent = this.getNodeParameter('message', index) as string;
                console.log('成功获取消息内容参数');
            } catch (error) {
                console.error('获取消息内容参数失败:', error instanceof Error ? error.message : String(error));
                // 如果获取消息参数失败，尝试从输入数据中获取
                try {
                    const inputData = this.getInputData();
                    if (inputData && inputData[index] && inputData[index].json) {
                        const jsonData = inputData[index].json;
                        if (typeof jsonData.message === 'string') {
                            messageContent = jsonData.message;
                            console.log('从输入数据中获取消息内容');
                        } else if (typeof jsonData.text === 'string') {
                            messageContent = jsonData.text;
                            console.log('从输入数据text字段获取消息内容');
                        } else if (typeof jsonData.content === 'string') {
                            messageContent = jsonData.content;
                            console.log('从输入数据content字段获取消息内容');
                        } else {
                            messageContent = '消息内容为空';
                            console.log('无法获取消息内容，使用默认值');
                        }
                    } else {
                        messageContent = '消息内容为空';
                        console.log('输入数据为空，使用默认消息内容');
                    }
                } catch (inputError) {
                    console.error('尝试从输入数据获取消息内容失败:', inputError instanceof Error ? inputError.message : String(inputError));
                    messageContent = '消息内容为空';
                }
            }

        // 获取"自动检测Base64数据"选项，默认为false（不启用自动检测）
        const autoDetectBase64 = false; // 默认不启用自动检测

        // 检查消息中是否包含Base64数据并自动处理
        messageContent = detectAndProcessBase64InMessage(messageContent, autoDetectBase64);

        // 检查是否需要@全体成员
            let atAll = false;
            try {
                atAll = this.getNodeParameter('atAll', index, false) as boolean;
                console.log(`@全体成员: ${atAll ? '是' : '否'}`);
            } catch (error) {
                console.error('获取@全体成员参数失败:', error instanceof Error ? error.message : String(error));
                atAll = false;
            }
            
        if (atAll) {
            // 在消息前添加@全体成员CQ码
            messageContent = '[CQ:at,qq=all] ' + messageContent;
        }

        // 检查是否需要@特定成员
            let atUser = false;
            try {
                atUser = this.getNodeParameter('atUser', index, false) as boolean;
                console.log(`@特定成员: ${atUser ? '是' : '否'}`);
            } catch (error) {
                console.error('获取@特定成员参数失败:', error instanceof Error ? error.message : String(error));
                atUser = false;
            }
            
        if (atUser) {
                let atUserId = '';
                try {
                    atUserId = this.getNodeParameter('atUserId', index) as string;
                    console.log(`@用户ID: ${atUserId}`);
                } catch (error) {
                    console.error('获取@用户ID参数失败:', error instanceof Error ? error.message : String(error));
                    atUserId = '';
                }
                
                if (atUserId) {
            messageContent = `[CQ:at,qq=${atUserId}] ${messageContent}`;
                }
        }

        // 检查是否需要发送图片
            let sendImage = false;
            try {
                sendImage = this.getNodeParameter('sendImage', index, false) as boolean;
                console.log(`发送图片: ${sendImage ? '是' : '否'}`);
            } catch (error) {
                console.error('获取发送图片参数失败:', error instanceof Error ? error.message : String(error));
                sendImage = false;
            }
            
            if (sendImage) {
            try {
                console.log(`[群聊消息] 发送图片标志为true，开始处理图片`);
                // 使用默认值'url'，确保即使获取不到也有默认值
                    let imageSource = 'url';
                    try {
                        imageSource = this.getNodeParameter('imageSource', index, 'url') as string;
                console.log(`[群聊消息] 图片来源: ${imageSource}`);
                    } catch (error) {
                        console.error('获取图片来源参数失败:', error instanceof Error ? error.message : String(error));
                        imageSource = 'url';
                    }
                    
                let imagePath = '';

                if (imageSource === 'url') {
                        try {
                    imagePath = this.getNodeParameter('imageUrl', index, '') as string;
                    console.log(`[群聊消息] 图片URL: ${imagePath}`);
                        } catch (error) {
                            console.error('获取图片URL参数失败:', error instanceof Error ? error.message : String(error));
                            imagePath = '';
                        }
                } else if (imageSource === 'file') {
                    // 本地文件需要添加file://前缀
                        let filePath = '';
                        try {
                            filePath = this.getNodeParameter('imagePath', index, '') as string;
                    console.log(`[群聊消息] 本地图片路径: ${filePath}`);
                        } catch (error) {
                            console.error('获取本地图片路径参数失败:', error instanceof Error ? error.message : String(error));
                            filePath = '';
                        }
                    imagePath = filePath ? 'file://' + filePath : '';
                } else if (imageSource === 'base64') {
                    // 处理Base64编码
                    try {
                            let base64Data = '';
                            try {
                                base64Data = this.getNodeParameter('imageBase64', index, '') as string;
                        console.log(`[群聊消息] Base64图片数据长度: ${base64Data.length}`);
                            } catch (error) {
                                console.error('获取Base64图片数据参数失败:', error instanceof Error ? error.message : String(error));
                                base64Data = '';
                            }
                            
                            if (base64Data && base64Data.trim() !== '') {
                        imagePath = processBase64Image(base64Data);
                            }
                    } catch (e) {
                        console.error('[群聊消息] 处理Base64图片失败:', e instanceof Error ? e.message : String(e));
                            // 但不抛出错误中断流程
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
                    console.error('[群聊消息] 处理群聊图片时出错，但继续执行:', error instanceof Error ? error.message : String(error));
                    // 这里不再抛出错误，而是继续发送文本消息
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
    } catch (outerError) {
        console.error('执行群聊消息操作时出错:', outerError instanceof Error ? outerError.message : String(outerError));
        throw outerError;
    }
} 