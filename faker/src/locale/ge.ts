/*
 * This file is automatically generated.
 * Run 'pnpm run generate:locales' to update.
 */

import { Faker } from '../faker';
import en from '../locales/en';
import ge from '../locales/ge';

export const faker = new Faker({
  locale: 'ge',
  localeFallback: 'en',
  locales: {
    ge,
    en,
  },
});