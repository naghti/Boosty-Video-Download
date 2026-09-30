import { BOOSTY_HOST } from '../consts.js';

export const isBoostyUrl = (url) => {
  try {
    const { hostname } = new URL(url);

    return hostname === BOOSTY_HOST || hostname.endsWith(`.${BOOSTY_HOST}`);
  } catch {
    return false;
  }
};
