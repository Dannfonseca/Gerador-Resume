import { DEFAULT_AI_MODEL } from './aiModels';

/**
 * Simple encryption/decryption helper for the API Keys.
 */

const SECRET_SALT = 'ats-pro-secure-vault';

const encrypt = (text) => {
  if (!text) return null;
  return btoa(
    text.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length))
    ).join('')
  );
};

const decrypt = (encoded) => {
  if (!encoded) return null;
  try {
    return atob(encoded)
      .split('')
      .map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length))
      ).join('');
  } catch {
    return null;
  }
};

export const saveApiKey = (service, key) => {
  const normalizedKey = key?.trim() || '';
  if (!normalizedKey) {
    localStorage.removeItem(`${service}_api_key`);
    return;
  }
  localStorage.setItem(`${service}_api_key`, encrypt(normalizedKey));
};

export const getApiKey = (service) => {
  return decrypt(localStorage.getItem(`${service}_api_key`));
};

export const clearApiKey = (service) => {
  localStorage.removeItem(`${service}_api_key`);
};

export const saveAiModel = (modelId) => {
  localStorage.setItem('preferred_ai_model', modelId || DEFAULT_AI_MODEL);
};

export const getAiModel = () => {
  return localStorage.getItem('preferred_ai_model') || DEFAULT_AI_MODEL;
};
