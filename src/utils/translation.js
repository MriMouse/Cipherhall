/**
 * 翻译工具函数
 * 使用LLM one-api统一接口进行文本翻译
 */

// 翻译API端点

const TRANSLATE_API_URL = import.meta.env.VITE_TRANSLATE_API_URL || 'https://api.cipherhall.com/translate';
const API_KEY = import.meta.env.VITE_API_KEY || '';

/**
 * 将文本从源语言翻译到目标语言
 * @param {string} text - 需要翻译的文本
 * @param {string} sourceLanguage - 源语言代码 (如 'en-US', 'zh-CN')
 * @param {string} targetLanguage - 目标语言代码 (如 'en-US', 'zh-CN')
 * @returns {Promise<string>} - 翻译后的文本
 */
export async function translateText(text, sourceLanguage, targetLanguage) {
  try {
    // 如果源语言和目标语言相同，直接返回原文
    if (sourceLanguage === targetLanguage) {
      return text;
    }
    
    // 准备请求数据
    const requestData = {
      text,
      sourceLanguage,
      targetLanguage,
    };
    
    // 发送翻译请求
    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestData)
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`翻译请求失败: ${response.status} ${errorText}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 返回翻译后的文本
    return data.translatedText;
  } catch (error) {
    console.error('翻译失败:', error);
    throw error;
  }
}

/**
 * 检测文本语言
 * @param {string} text - 需要检测的文本
 * @returns {Promise<string>} - 检测到的语言代码
 */
export async function detectLanguage(text) {
  try {
    // 准备请求数据
    const requestData = {
      text,
      mode: 'detect'
    };
    
    // 发送语言检测请求
    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestData)
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`语言检测请求失败: ${response.status} ${errorText}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 返回检测到的语言代码
    return data.detectedLanguage;
  } catch (error) {
    console.error('语言检测失败:', error);
    throw error;
  }
}

/**
 * 获取支持的语言列表
 * @returns {Promise<Array>} - 支持的语言列表
 */
export async function getSupportedLanguages() {
  try {
    // 发送支持语言列表请求
    const response = await fetch(`${TRANSLATE_API_URL}/languages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取支持语言列表失败: ${response.status} ${errorText}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 返回支持的语言列表
    return data.languages;
  } catch (error) {
    console.error('获取支持语言列表失败:', error);
    throw error;
  }
}
