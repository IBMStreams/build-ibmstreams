'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

export const CONFIG = {
  TARGET_V5_CP4D: 'v5cp4d',
  TARGET_V5_STANDALONE: 'v5standalone',
  TARGET_V4: 'v4',
};

export const BUILD_ACTION = {
  DOWNLOAD: 0,
  SUBMIT: 1
};

export const SPL_MSG_REGEX_V4 = /^([\w.]+(?:\/[\w.]+)?):(\d+):(\d+):\s+(\w{5}\d{4}[IWE])\s+((ERROR|WARN|INFO):.*)$/;
export const SPL_MSG_REGEX_V5 = /^(?:\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}\.\d{3}.\s+)([\w.]+(?:\/[\w.]+)?):(\d+):(\d+):\s+(\w{5}\d{4}[IWE])\s+((ERROR|WARN|WARNING|INFO):.*)$/;
export const SPL_NAMESPACE_REGEX = /^\s*(?:\bnamespace\b)\s+([a-z|A-Z|0-9|.|_]+)\s*;/gm;
export const SPL_MAIN_COMPOSITE_REGEX = /.*?(?:\bcomposite\b)(?:\s*|\/\/.*?|\/\*.*?\*\/)+([a-z|A-Z|0-9|.|_]+)(?:\s*|\/\/.*?|\/\*.*?\*\/)*\{/gm;
