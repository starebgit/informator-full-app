import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import * as dayjs from "dayjs";
import * as weekOfYear from "dayjs/plugin/weekOfYear";
import * as isoWeek from "dayjs/plugin/isoWeek";
import * as customParseFormat from "dayjs/plugin/customParseFormat";
import * as utc from "dayjs/plugin/utc";
import * as advancedFormat from "dayjs/plugin/advancedFormat";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import * as isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import * as quarterOfYear from "dayjs/plugin/quarterOfYear";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { registerLocale } from "react-datepicker";
import SL from "./sl.json";
import EN from "./en.json";
import DE from "./de.json";
import sl from "date-fns/locale/sl";
import de from "date-fns/locale/de";
import en from "date-fns/locale/en-GB";
import dayjsDe from "dayjs/locale/de";
import dayjsSi from "dayjs/locale/sl";
import dayjsEn from "dayjs/locale/en-gb";

registerLocale("si", sl);
registerLocale("de", de);
registerLocale("en", en);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);
dayjs.extend(relativeTime);

export { dayjs };

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init(
        {
            fallbackLng: "si",
            resources: {
                si: {
                    shopfloor: SL.shopfloor,
                    navigation: SL.navigation,
                    documentation: SL.documentation,
                    manual_input: SL.manual_input,
                    labels: SL.labels,
                    settings: SL.settings,
                    toolshop: SL.toolshop,
                    guidelines: SL.guidelines,
                    infopoint: SL.infopoint,
                    maintenance: SL.maintenance,
                },
                en: {
                    shopfloor: EN.shopfloor,
                    navigation: EN.navigation,
                    documentation: EN.documentation,
                    manual_input: EN.manual_input,
                    labels: EN.labels,
                    settings: EN.settings,
                    toolshop: EN.toolshop,
                    guidelines: EN.guidelines,
                    infopoint: EN.infopoint,
                    maintenance: EN.maintenance,
                },
                de: {
                    shopfloor: DE.shopfloor,
                    navigation: DE.navigation,
                    documentation: DE.documentation,
                    manual_input: DE.manual_input,
                    labels: DE.labels,
                    settings: DE.settings,
                    toolshop: DE.toolshop,
                    guidelines: DE.guidelines,
                    infopoint: DE.infopoint,
                    maintenance: DE.maintenance,
                },
            },
            debug: process.env.REACT_APP_I18N,
            interpolation: {
                format: function (value, format, lng) {
                    if (value instanceof dayjs) {
                        return dayjs(value).format(format);
                    }
                    return value;
                },
            },

            escapeValue: false,
        },
        () => {
            if (i18n.isInitialized) {
                const lng = i18n.language;
                const dayjsLocale =
                    lng == "en" ? dayjsEn : lng == "de" ? dayjsDe : lng == "si" ? dayjsSi : dayjsSi;
                dayjs.locale(dayjsLocale);
            }
        },
    );

i18n.on("languageChanged", function (lng) {
    const dayjsLocale =
        lng == "en" ? dayjsEn : lng == "de" ? dayjsDe : lng == "si" ? dayjsSi : dayjsSi;
    dayjs.locale(dayjsLocale);
});

export default i18n;
