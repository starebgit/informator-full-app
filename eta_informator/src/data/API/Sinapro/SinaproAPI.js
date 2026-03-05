import client, { sinaproClient } from "../../../feathers/feathers";

export function getUnits() {
    return client
        .service("units")
        .find()
        .then((result) => {
            const { data } = { ...result };
            const labels = data.map((unit) => {
                const subunits = unit.subunits.map((subunit) => {
                    return {
                        label: subunit.name,
                        value: subunit.id,
                        subunitId: subunit.id,
                        unitId: unit.id,
                    };
                });
                return { label: unit.name, options: subunits };
            });
            return labels;
        });
}

export function getCasts() {
    return sinaproClient
        .service("casts")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getRings() {
    return sinaproClient
        .service("rings")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getClips() {
    return sinaproClient
        .service("clips")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getProtectors() {
    return sinaproClient
        .service("protectors")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getFireclays() {
    return sinaproClient
        .service("fireclays")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getSpirals() {
    return sinaproClient
        .service("spirals")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getLastSync() {
    return sinaproClient
        .service("last-sync")
        .find({
            query: {
                $sort: {
                    id: -1,
                },
                $limit: 1,
            },
        })
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}
