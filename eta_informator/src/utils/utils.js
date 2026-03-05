import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { useQuery } from "react-query";
import { sinaproClient } from "../feathers/feathers";
import axios from "axios";

export function pdfUrl(path) {
    return `http://${process.env.REACT_APP_INFORMATOR}` + path.split("public")[1];
}

export function getFromLS(key) {
    let ls = {};
    if (global.localStorage) {
        try {
            ls = JSON.parse(global.localStorage.getItem(key));
        } catch (e) {
            /*Ignore*/
        }
    }
    return ls;
}

export function saveToLS(key, value) {
    if (global.localStorage) {
        global.localStorage.setItem(key, JSON.stringify(value));
    }
}

export function base64ToBlob(base64, type = "application/octet-stream") {
    const binStr = atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: type });
}

export function exportToXLSX(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    XLSX.writeFile(workbook, `${filename}_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`);
}

export const filteredMachineGroupNames = {
    "PLAT linije 1-6 - Popravilo": "Popravilo",
    "PLAT linije 1-6 - Izmet": "Izmet",
    "PLAT linije 1-6 - Izmet polizdelkov": "Izmet polizdelki",
    "VELIKE PLOŠČE LINIJA": "Montaža Velike Plošče",
};

export function useScrapData(selectedMonth, machineGroup, selectedUnit) {
    return useQuery(
        ["scrap", selectedMonth.format("MM-YYYY"), machineGroup?.id, "sinapro"],
        () => {
            return sinaproClient.service("scrap").find({
                query: {
                    start: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    end: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    machine: [
                        ...machineGroup?.machines.map((m) => m.machineAltKey),
                        ...(selectedUnit?.ted == 404
                            ? ["449980300", "400411900", "449980500", "449980600"]
                            : []),
                    ].join(", "),
                    source: "sinapro",
                    replace:
                        selectedUnit?.ted == 404
                            ? '{"408424800": 449980300, "408424900":400411900, "408425000": 449980500, "408425100": 449980600}'
                            : "{}",
                },
            });
        },
        {
            enabled: !!machineGroup, // Only fetch if machineGroup is defined
        },
    );
}

export function translateUnit(unit) {
    const map = {
        ST: "KOS", // Stück → KOS
        // Add more if needed later
    };

    return map[unit] || unit;
}

export const transformToSAPCode = (code) => {
    if (code == null) {
        return "";
    }
    let convertedMaterial = code;
    const regex = /[.]/gi;
    if (code.includes("-")) {
        const [prefix, suffix] = code.split("-");
        convertedMaterial = `${prefix}${suffix}00`;
    } else if (code.includes("/")) {
        const [prefix, suffix] = code.split("/");
        convertedMaterial = `${prefix}00${suffix}`;
    }
    convertedMaterial = convertedMaterial?.replace(regex, "");
    convertedMaterial = convertedMaterial?.padStart(18, "0");
    return convertedMaterial;
};

export async function navigateToOrderIfExists(orderNumber, { history, showToast, t }) {
    // const useNewSapFlow =
    //     typeof window !== "undefined" &&
    //     localStorage.getItem("useNewSapFlow") === "true";

    try {
        // if (useNewSapFlow) {
        // 🔹 NEW: lightweight existence check
        await axios.get(`${process.env.REACT_APP_INFORMATORSAP}/api/orderdetails/exists`, {
            params: { code: orderNumber },
        });
        // If we got here, SAP returned 200 → order exists
        history.push(`/documentation/plm/${orderNumber}`);
        return true;
        //     } else {
        //         // 🔸 OLD: Feathers /orders existence check
        //     const res = await axios.get(
        //         `http://${process.env.REACT_APP_INFORMATOR}/orders?code=${orderNumber}`,
        //     );
        //     const exists = Array.isArray(res?.data?.data) && res.data.data.length > 0;

        //     if (exists) {
        //         history.push(`/documentation/plm/${orderNumber}`);
        //         return true;
        //     }
        //     showToast(t("warning"), t("labels:order_not_found", { number: orderNumber }), "warning");
        //     return false;
        // }
    } catch (e) {
        // const sourceLabel = useNewSapFlow ? "SAP order" : "order";

        showToast(t("SAP"), t("labels:order_not_found", { number: orderNumber }), "warning");

        return false;
    }
}

// React-friendly wrapper hook so you can memoize the function with current deps
export function useOrderNavigator({ history, showToast, t }) {
    return async (orderNumber) => navigateToOrderIfExists(orderNumber, { history, showToast, t });
}

export const subunitToUnitMap = {
    termo_55: "thermo",
    termo_d1: "thermo",
    termo_d2: "thermo",
    termo_d3: "thermo",
    plosca_montaza: "hotplate",
    plosca_keramika: "hotplate",
    protektor: "hotplate",
    livarna_obdelovalnica: "foundry",
    livarna_brusilnica: "foundry",
    livarna_robotske_celice: "foundry",
    foundry: "foundry",
    automation: "ptc",
    tubes: "ptc",
    toolshop: "ptc",
};

export function getUnitKeyFromSubunitKeyword(subunitKeyword) {
    return subunitToUnitMap[subunitKeyword] || null;
}
