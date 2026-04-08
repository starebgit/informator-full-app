export default function getNavigation(path, selectedUnit) {
    if (selectedUnit?.keyword == "toolshop")
        return {
            organisation: {
                title: "Organizacija",
                path: `${path}/${selectedUnit?.keyword}/organisation`,
                notification: 0,
            },
            safety: {
                title: "safety",
                path: `${path}/${selectedUnit?.keyword}/safety`,
                notification: 0,
            },
            dashboard: {
                title: "dashboard",
                path: `${path}/${selectedUnit?.keyword}/dashboard`,
                notification: 0,
            },
            orders: {
                title: "orders",
                path: `${path}/orders`,
                notification: 0,
            },
            staff: {
                title: "staff",
                path: `${path}/${selectedUnit?.keyword}/staff`,
                notification: 0,
            },
            lean: {
                title: "lean",
                path: `${path}/${selectedUnit?.keyword}/lean`,
                notification: 0,
            },
            stock: {
                title: "stock",
                path: `${path}/${selectedUnit?.keyword}/stock`,
                notification: 0,
            },
            attachments: {
                title: "attachments",
                path: `${path}/${selectedUnit?.keyword}/attachments`,
                notification: 0,
            },
        };
    if (selectedUnit?.keyword == "foundry")
        return {
            safety: {
                title: "safety",
                path: `${path}/${selectedUnit?.keyword}/safety`,
                notification: 0,
            },
            indicators: {
                title: "indicators",
                path: `${path}/${selectedUnit?.keyword}/indicators`,
                notification: 0,
            },
            dashboard: {
                title: "dashboard",
                path: `${path}/${selectedUnit?.keyword}/dashboard`,
                notification: 0,
            },
            quality: {
                title: "quality",
                path: `${path}/${selectedUnit?.keyword}/quality`,
                notification: 0,
            },
            stock: {
                title: "stock",
                path: `${path}/${selectedUnit?.keyword}/stock`,
                notification: 0,
            },
            staff: {
                title: "staff",
                path: `${path}/${selectedUnit?.keyword}/staff`,
                notification: 0,
            },
            lean: {
                title: "lean",
                path: `${path}/${selectedUnit?.keyword}/lean`,
                notification: 0,
            },
            attachments: {
                title: "attachments",
                path: `${path}/${selectedUnit?.keyword}/attachments`,
                notification: 0,
            },
            castingProgram: {
                title: "casting_program",
                path: `${path}/${selectedUnit?.keyword}/casting-program`,
                notification: 0,
            },
        };
    if (selectedUnit?.unitId == 2 || selectedUnit?.keyword == "livarna_obdelovalnica") {
        return {
            safety: {
                title: "safety",
                path: `${path}/${selectedUnit?.keyword}/safety`,
                notification: 0,
            },
            indicators: {
                title: "indicators",
                path: `${path}/${selectedUnit?.keyword}/indicators`,
                notification: 0,
            },
            dashboard: {
                title: "dashboard",
                path: `${path}/${selectedUnit?.keyword}/dashboard`,
                notification: 0,
            },
            realization: {
                title: "realization",
                path: `${path}/${selectedUnit?.keyword}/realization`,
                notification: 0,
            },
            staff: {
                title: "staff",
                path: `${path}/${selectedUnit?.keyword}/staff`,
                notification: 0,
            },
            distribution: {
                title: "distribution",
                path: `${path}/${selectedUnit?.keyword}/distribution`,
                notification: 0,
            },
            quality: {
                title: "quality",
                path: `${path}/${selectedUnit?.keyword}/quality`,
                notification: 0,
            },
            stock: {
                title: "stock",
                path: `${path}/${selectedUnit?.keyword}/stock`,
                notification: 0,
            },
            oee: {
                title: "oee",
                path: `${path}/${selectedUnit?.keyword}/oee`,
                notification: 0,
            },
            lean: {
                title: "lean",
                path: `${path}/${selectedUnit?.keyword}/lean`,
                notification: 0,
            },
            attachments: {
                title: "attachments",
                path: `${path}/${selectedUnit?.keyword}/attachments`,
                notification: 0,
            },
        };
    }

    return {
        safety: {
            title: "safety",
            path: `${path}/${selectedUnit?.keyword}/safety`,
            notification: 0,
        },
        indicators: {
            title: "indicators",
            path: `${path}/${selectedUnit?.keyword}/indicators`,
            notification: 0,
        },
        dashboard: {
            title: "dashboard",
            path: `${path}/${selectedUnit?.keyword}/dashboard`,
            notification: 0,
        },
        realization: {
            title: "realization",
            path: `${path}/${selectedUnit?.keyword}/realization`,
            notification: 0,
        },
        staff: {
            title: "staff",
            path: `${path}/${selectedUnit?.keyword}/staff`,
            notification: 0,
        },
        distribution: {
            title: "distribution",
            path: `${path}/${selectedUnit?.keyword}/distribution`,
            notification: 0,
        },
        quality: {
            title: "quality",
            path: `${path}/${selectedUnit?.keyword}/quality`,
            notification: 0,
        },
        stock: {
            title: "stock",
            path: `${path}/${selectedUnit?.keyword}/stock`,
            notification: 0,
        },
        oee: {
            title: "oee",
            path: `${path}/${selectedUnit?.keyword}/oee`,
            notification: 0,
        },
        lean: {
            title: "lean",
            path: `${path}/${selectedUnit?.keyword}/lean`,
            notification: 0,
        },
        attachments: {
            title: "attachments",
            path: `${path}/${selectedUnit?.keyword}/attachments`,
            notification: 0,
        },
    };
}
