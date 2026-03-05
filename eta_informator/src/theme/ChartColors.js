const ChartColors = {
    blue: "rgba(0, 123, 255, 1)",
    pink: "rgba(232, 93, 117)",
    purple: "rgba(157, 105, 163)",
    salmon: "rgba(252, 161, 125)",
    skyBlue: "rgba(102, 206, 214)",
    queenBlue: "rgba(69, 105, 144)",
    purpleNavy: "rgba(73, 67, 104)",
    red: "rgba(147, 22, 33)",
    turquoise: "rgba(66, 217, 200)",
    lemon: "rgba(194, 232, 18)",
    tangerine: "rgba(255, 147, 79)",
    green: "rgba(68, 99, 63)",
    sum: "rgba(52, 152, 219, 0.5)",
    norm: "rgba(252, 161, 125, 0.5)",
    1: "rgba(237,110,43, 0.7)",
    2: "rgba(100, 202, 47, 0.7)",
    3: "rgba(10, 158, 235, 1)",
    ETA: "rgba(237,110,43, 0.7)",
    EGO: "rgba(100, 202, 47, 0.7)",
    EKZ: "rgba(10, 158, 235, 1)",
    machines: [
        "rgba(38, 61, 66, 0.8)",
        "rgba(142, 108, 136, 0.8)",
        "rgba(99, 199, 178, 0.8)",
        "rgba(109, 61, 20, 0.8)",
        "rgba(167, 38, 8, 0.8)",
        "rgba(217, 30, 54, 0.8)",
        "rgba(145, 229, 246, 0.8)",
        "rgba(249, 233, 0, 0.8)",
        "rgba(237, 51, 185, 0.8)",
        "rgba(167, 38, 8, 0.8)",
        "rgba(149, 249, 227,0.8)",
        "rgba(227, 219, 219, 0.8)",
    ],
    type: [
        "rgba(255, 64, 0,0.8)",
        "rgba(80, 178, 192,0.8)",
        "rgba(242, 212, 146,0.8)",
        "rgba(242, 149, 89,0.8)",
        "rgba(40, 56, 69,0.8)",
        "rgba(100, 25, 41,0.8)",
        "rgba(189,145,245,0.8)",
        "rgba(132, 90, 19,0.8)",
        "rgba(141, 240, 220,0.8)",
        "rgba(27, 40, 69,0.8)",
    ],
};

export const lightChartColors = {
    blue: "rgba(0, 123, 255, 0.3)",
    pink: "rgba(232, 93, 117, 0.3)",
    purple: "rgba(157, 105, 163,0.3)",
    salmon: "rgba(252, 161, 125,0.3)",
    skyBlue: "rgba(102, 206, 214,0.3)",
    queenBlue: "rgba(69, 105, 144,0.3)",
    purpleNavy: "rgba(73, 67, 104,0.3)",
    red: "rgba(147, 22, 33,0.3)",
    turquoise: "rgba(66, 217, 200,0.3)",
    lemon: "rgba(194, 232, 18,0.3)",
    tangerine: "rgba(255, 147, 79,0.3)",
    green: "rgba(68, 99, 63,0.3)",
};

export const eventNameColors = {
    holiday: "#bf8cfc",
    remote: "#33b983",
    special_leave: "#002f64",
    hour_use: "#0050ae",
    maternity: "#c85b00",
    waiting: "#f98517",
    sick: "#B00000",
    leave: "#551153",
};

export const eventsColors = {
    8: "#bf8cfc",
    10: "#33b983",
    26: "#33b983",
    14: "#002f64",
    95: "#002f64",
    27: "#0050ae",
    29: "#c85b00",
    31: "#f98517",
    39: "#f98517",
    37: "#B00000",
    55: "#B00000",
    65: "#ac0000",
    91: "#c6a000",
    104: "#551153",
};
export const lightEventsColors = {
    8: "#00876c99",
    10: "#3d9a7099",
    26: "#3d9a7099",
    14: "#002f6499",
    95: "#002f6499",
    27: "#0050ae99",
    29: "#c85b0099",
    31: "#d6e18499",
    39: "#d6e18499",
    37: "#B0000099",
    55: "#B0000099",
    65: "#fbb86299",
    91: "#c6a00099",
    104: "#55115399",
};

export function getColor(string, type) {
    const val = valueOf(string);
    return ChartColors[type][val % ChartColors[type].length];
}

export function indicatorColor(indicator) {
    switch (indicator) {
        case "oee":
            return "queenBlue";
        case "bad":
            return "red";
        case "total":
            return "queenBlue";
        default:
            return "queenBlue";
    }
}

export default ChartColors;
