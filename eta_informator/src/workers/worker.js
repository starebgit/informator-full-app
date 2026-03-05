/* eslint-disable */
import {
    fetchChartDataset,
    fetchScrapChartDataset,
    groupData,
} from "../utils/shopfloor/dataConvert";

export function datasetProvider(data, machines, options) {
    if (!data || data.length == 0) return [];
    return fetchChartDataset(data, machines, options);
}
export function scrapDatasetProvider(data, category, startDate, endDate, ids, conditions) {
    if (!data || data.length == 0) return [];
    return fetchScrapChartDataset(data, category, startDate, endDate, ids, conditions);
}

/**
 *
 * @param {object} data - Input data from SinaproAPI
 * @param {string} options.indicator - Defines indicator type
 * @param {string} options.category - Defines grouping category
 * @param {boolean} options.condense - If false, the result is not condensed into depth of 1
 * @param {boolean} options.raw - If true, the value array are not comupted into sum or mean
 * @returns grouped and condensed dataset
 */
export function groupDataProvider(data, options) {
    if (!data || data.length == 0) return [];
    return groupData(data, options);
}
