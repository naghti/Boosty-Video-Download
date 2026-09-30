import {
  DEFAULT_FILENAME,
  MESSAGE_ACTION,
  SCRIPT_WORLD,
  STATUS_TYPE,
} from './consts.js';
import { isBoostyUrl } from './utils/isBoostyUrl.js';
import { sanitizeFilename } from './utils/sanitizeFilename.js';

const downloadButton = document.getElementById('download');
const statusElement = document.getElementById('status');

const setStatus = (text, type = '') => {
  statusElement.textContent = text;
  statusElement.className = type;
};

const getPostTitle = (fallbackName) => {
  const rawTitle = (document.title || '').trim();
  const withoutBrand = rawTitle.replace(/\s*[|·]\s*Boosty\s*$/i, '').trim();
  const separatorIndex = withoutBrand.lastIndexOf(' - ');
  const postTitle =
    separatorIndex > 0 ? withoutBrand.slice(0, separatorIndex).trim() : withoutBrand;

  return postTitle || fallbackName;
};

const downloadBoostyVideo = () => {
  const player = document.querySelector('vk-video-player');
  const internalActions = player?.store?.actions?.internal;

  if (typeof internalActions?.downloadVideo !== 'function') {
    return { isOk: false, error: 'Плеер не найден на странице' };
  }

  try {
    internalActions.downloadVideo();
    return { isOk: true };
  } catch (error) {
    return { isOk: false, error: String(error?.message || error) };
  }
};

const cancelPreparedDownload = async () => {
  try {
    await chrome.runtime.sendMessage({ action: MESSAGE_ACTION.CANCEL_DOWNLOAD });
  } catch {
    return;
  }
};

const handleDownloadClick = async () => {
  downloadButton.disabled = true;
  setStatus('Скачивание…');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !isBoostyUrl(tab.url || '')) {
      setStatus('Откройте страницу boosty.to', STATUS_TYPE.ERROR);
      return;
    }

    const [titleInjection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPostTitle,
      args: [DEFAULT_FILENAME],
    });

    const filename = sanitizeFilename(titleInjection?.result);

    if (!filename) {
      setStatus('Не удалось получить название поста', STATUS_TYPE.ERROR);
      return;
    }

    await chrome.runtime.sendMessage({
      action: MESSAGE_ACTION.PREPARE_DOWNLOAD,
      filename,
    });

    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: SCRIPT_WORLD.MAIN,
      func: downloadBoostyVideo,
    });

    const result = injection?.result;

    if (result?.isOk) {
      setStatus(`Скачивание: ${filename}`, STATUS_TYPE.OK);
      return;
    }

    await cancelPreparedDownload();
    setStatus(result?.error || 'Плеер не найден', STATUS_TYPE.ERROR);
  } catch (error) {
    await cancelPreparedDownload();
    setStatus(String(error?.message || 'Не удалось запустить скачивание'), STATUS_TYPE.ERROR);
  } finally {
    downloadButton.disabled = false;
  }
};

downloadButton.addEventListener('click', handleDownloadClick);
