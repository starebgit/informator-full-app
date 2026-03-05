import { dreamreportClient } from "../../../feathers/feathers";

export function getFoundryForms(startDate, endDate) {
    return dreamreportClient
        .service("forms")
        .find({
            query: {
                date: {
                    $gte: startDate.format("YYYY-MM-DD"),
                    $lte: endDate.format("YYYY-MM-DD"),
                },
            },
        })
        .then((response) => {
            return response;
        });
}

export function getCastingProgram() {
    return dreamreportClient.service("casting-program").find({
        query: {
            $limit: 1,
            $sort: {
                startTimestamp: -1,
            },
        },
    });
}
