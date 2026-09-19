/**
 * Sarvam adapter factory and singleton.
 */
import { getConfig } from '../../config/env.js';
import { MockSarvamAdapter } from './mock.js';
import { LiveSarvamAdapter } from './live.js';
import type { SarvamAdapter } from './types.js';

export type { SarvamAdapter, TranslateOptions, TranslateResult, STTOptions, STTResult, TTSOptions, TTSResult, DocAIOptions, DocAIResult } from './types.js';
export { MockSarvamAdapter } from './mock.js';
export { LiveSarvamAdapter } from './live.js';

let _sarvam: SarvamAdapter | null = null;

export function getSarvamAdapter(): SarvamAdapter {
  if (_sarvam) return _sarvam;
  const config = getConfig();

  if (config.SARVAM_ADAPTER === 'live') {
    if (!config.SARVAM_API_KEY) {
      console.warn('[Sarvam] SARVAM_API_KEY not set, falling back to mock');
      _sarvam = new MockSarvamAdapter();
    } else {
      _sarvam = new LiveSarvamAdapter({
        apiKey: config.SARVAM_API_KEY,
        baseUrl: config.SARVAM_BASE_URL,
        timeoutMs: config.SARVAM_TIMEOUT_MS,
      });
    }
  } else {
    _sarvam = new MockSarvamAdapter();
  }

  return _sarvam;
}

export function _resetSarvamAdapter(): void {
  _sarvam = null;
}
