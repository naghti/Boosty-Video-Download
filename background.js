import {
  CONFLICT_ACTION,
  DEFAULT_VIDEO_EXTENSION,
  MESSAGE_ACTION,
  PENDING_TIMEOUT_MS,
} from './consts.js';

let pendingFilename = null;
let pendingTimerId = null;

const clearPending = () => {
  pendingFilename = null;

  if (pendingTimerId) {
    clearTimeout(pendingTimerId);
    pendingTimerId = null;
  }
};

const setPendingFilename = (filename) => {
  pendingFilename = filename || null;

  if (pendingTimerId) {
    clearTimeout(pendingTimerId);
  }

  pendingTimerId = setTimeout(clearPending, PENDING_TIMEOUT_MS);
};

const getFileExtension = (filename) => {
  const extensionMatch = String(filename || '').match(/\.([a-z0-9]+)$/i);

  return extensionMatch ? extensionMatch[1] : DEFAULT_VIDEO_EXTENSION;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === MESSAGE_ACTION.PREPARE_DOWNLOAD) {
    setPendingFilename(message.filename);
    sendResponse({ isOk: true });
    return;
  }

  if (message?.action === MESSAGE_ACTION.CANCEL_DOWNLOAD) {
    clearPending();
    sendResponse({ isOk: true });
  }
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (!pendingFilename) {
    suggest();
    return;
  }

  const extension = getFileExtension(item.filename);

  suggest({
    filename: `${pendingFilename}.${extension}`,
    conflictAction: CONFLICT_ACTION.UNIQUIFY,
  });

  clearPending();
});
