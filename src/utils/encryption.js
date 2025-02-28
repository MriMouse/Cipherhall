/**
 * 端到端加密工具函数
 * 使用 Web Crypto API 实现 RSA-OAEP 加密
 */

// 生成新的RSA密钥对
export async function generateKeyPair() {
  try {
    // 生成RSA-OAEP密钥对
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256"
      },
      true, // 可导出
      ["encrypt", "decrypt"]
    );
    
    // 导出密钥为 JWK 格式
    const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
    
    // 将密钥转换为字符串存储
    return {
      publicKey: JSON.stringify(publicKeyJwk),
      privateKey: JSON.stringify(privateKeyJwk)
    };
  } catch (error) {
    console.error("密钥生成失败:", error);
    throw error;
  }
}

// 从JWK字符串导入公钥
async function importPublicKey(publicKeyJwk) {
  try {
    const key = JSON.parse(publicKeyJwk);
    return await window.crypto.subtle.importKey(
      "jwk",
      key,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["encrypt"]
    );
  } catch (error) {
    console.error("导入公钥失败:", error);
    throw error;
  }
}

// 从JWK字符串导入私钥
async function importPrivateKey(privateKeyJwk) {
  try {
    const key = JSON.parse(privateKeyJwk);
    return await window.crypto.subtle.importKey(
      "jwk",
      key,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["decrypt"]
    );
  } catch (error) {
    console.error("导入私钥失败:", error);
    throw error;
  }
}

// 使用公钥加密消息
export async function encryptMessage(message, publicKeyJwk) {
  try {
    const publicKey = await importPublicKey(publicKeyJwk);
    
    // 将字符串转换为Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // 加密数据
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      data
    );
    
    // 将加密数据转换为Base64以便传输
    return arrayBufferToBase64(encryptedData);
  } catch (error) {
    console.error("加密失败:", error);
    throw error;
  }
}

// 使用私钥解密消息
export async function decryptMessage(encryptedMessage, privateKeyJwk) {
  try {
    const privateKey = await importPrivateKey(privateKeyJwk);
    
    // 将Base64转换回ArrayBuffer
    const encryptedData = base64ToArrayBuffer(encryptedMessage);
    
    // 解密数据
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedData
    );
    
    // 将解密后的数据转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("解密失败:", error);
    throw error;
  }
}

// ArrayBuffer转Base64
function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return window.btoa(binary);
}

// Base64转ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
