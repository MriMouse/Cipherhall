/**
 * 翻译工具函数
 * 使用LLM one-api统一接口进行文本翻译
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = "AIzaSyD49YwJFyiM3VDdlndA9AfoimkkUP1aD8w";
const PROXY_URL = "http://127.0.0.1:7897";

let ai: GoogleGenAI | null = null;

// 初始化 Gemini API 客户端
async function initGeminiClient() {
  try {
    // 尝试直接连接
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (error) {
    console.log("直接连接失败，尝试使用代理...");
    // 使用代理连接
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      proxy: PROXY_URL,
    });
  }
}

// 翻译文本
export async function translateText(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  try {
    if (!ai) {
      await initGeminiClient();
    }

    const prompt = `请将以下${fromLang}文本翻译成${toLang}，只返回翻译结果，不要包含任何解释或其他内容：\n${text}`;

    const response = await ai!.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("翻译失败:", error);
    throw new Error("翻译服务暂时不可用");
  }
}

// 批量翻译文本
export async function translateBatch(
  texts: string[],
  fromLang: string,
  toLang: string
): Promise<string[]> {
  try {
    const translations = await Promise.all(
      texts.map((text) => translateText(text, fromLang, toLang))
    );
    return translations;
  } catch (error) {
    console.error("批量翻译失败:", error);
    throw new Error("翻译服务暂时不可用");
  }
}

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslationResponse {
  translatedText: string;
}

interface LanguageDetectionRequest {
  text: string;
  mode: "detect";
}

interface LanguageDetectionResponse {
  detectedLanguage: string;
}

interface Language {
  code: string;
  name: string;
}

/**
 * 检测文本语言
 * @param text - 需要检测的文本
 * @returns 检测到的语言代码
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    // 准备请求数据
    const requestData: LanguageDetectionRequest = {
      text,
      mode: "detect",
    };

    // 发送语言检测请求
    const response = await fetch(TRANSLATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`语言检测请求失败: ${response.status} ${errorText}`);
    }

    // 解析响应数据
    const data = (await response.json()) as LanguageDetectionResponse;

    // 返回检测到的语言代码
    return data.detectedLanguage;
  } catch (error) {
    console.error("语言检测失败:", error);
    throw error;
  }
}

/**
 * 获取支持的语言列表
 * @returns 支持的语言列表
 */
export async function getSupportedLanguages(): Promise<Language[]> {
  try {
    // 发送支持语言列表请求
    const response = await fetch(`${TRANSLATE_API_URL}/languages`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
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
    console.error("获取支持语言列表失败:", error);
    throw error;
  }
}
