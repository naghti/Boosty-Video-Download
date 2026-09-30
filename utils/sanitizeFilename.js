import { DEFAULT_FILENAME, FILENAME_MAX_LENGTH } from '../consts.js';

export const sanitizeFilename = (name) => {
  const cleaned = String(name || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.\s]+$/g, '')
    .replace(/^\.+$/g, '')
    .slice(0, FILENAME_MAX_LENGTH)
    .replace(/[.\s]+$/g, '');

  return cleaned || DEFAULT_FILENAME;
};
