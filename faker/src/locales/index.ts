/*
 * This file is automatically generated.
 * Run 'pnpm run generate:locales' to update.
 */

import type { LocaleDefinition } from '..';

import ja from './ja'
import zh_CN from './zh_CN'
import en from './en'


export type KnownLocale =
  "ja"|
  "zh_CN"|"en"

export type KnownLocales = Record<KnownLocale, LocaleDefinition>;

const locales: KnownLocales = {
  ja,zh_CN,en
};

export default locales;