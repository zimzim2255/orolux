const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');
const acceptLanguageParser = require('accept-language-parser');

// Configure i18next

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    preload: ['en', 'ar'],
    defaultNS: 'common',
    ns: ['common'],
    detection: {
      order: ['header'],
      lookupHeader: 'accept-language',
      convertDetectedLanguage: (lng) => {
        const parsed = acceptLanguageParser.parse(lng);
        return parsed.length > 0 ? parsed[0].code : 'en';
      }
    },
    interpolation: {
      escapeValue: false
    }
  });

module.exports = i18next;
