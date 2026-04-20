import client, { toolshopClient, sinaproClient, qualityClient } from "../../../feathers/feathers";
import dayjs from "dayjs";
import {
    generateTypeLabels,
    generateRolesLabels,
    generateSubunitLabels,
    generateUnitLabels,
    generateKeywordsLabels,
} from "../../Formaters/Informator";
import { getAllEmployees, getEmployees } from "../Spica/SpicaAPI";

/**
 * @returns Promise with unit data
 */
export function getUnits() {
    return client
        .service("units")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getSubunitsLabels() {
    return client
        .service("units")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return generateSubunitLabels(data);
        });
}

export function getUnitsLabels() {
    return client
        .service("units")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return generateUnitLabels(data);
        });
}

export async function getMachineGroups(subunitId) {
    return client
        .service("machine-groups")
        .find(subunitId == undefined ? {} : { query: { subunitId: subunitId } })
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getForemans(subunitId) {
    return client
        .service("foremans")
        .find({ query: { subunitId: subunitId, active: 1 } })
        .then((res) => {
            const { data } = res;
            return data;
        });
}

export function getUnitStaff(subunitId, date) {
    return client
        .service("foremans")
        .find({ query: { subunitId: subunitId, active: 1 } })
        .then((result) => {
            const { data } = result;
            const foremans = data.map((entry) => entry.id);
            return client
                .service("staff")
                .find({
                    query: {
                        foremanId: { $in: foremans },
                        date: {
                            $eq: date.isAfter(dayjs().subtract(1, "day"), "day")
                                ? dayjs().subtract(1, "day").toDate()
                                : date.toDate(),
                        },
                        $select: ["employeeId"],
                    },
                })
                .then(({ data }) => {
                    return data.reduce((acc, cur) => {
                        const employees = JSON.parse(cur.employeeId);
                        acc = [...acc, ...employees];
                        return acc;
                    }, []);
                });
        });
}

export function getStaff(subunitId, startDate, endDate) {
    return (
        client
            .service("foremans")
            //* REMOED subunitId: subunitId, from query
            .find({ query: { active: 1 } })
            .then(async (result) => {
                const { data } = result;
                const foremans = data.map((entry) => entry.id);
                return client
                    .service("staff")
                    .find({
                        query: {
                            foremanId: { $in: foremans },
                            date: {
                                $gte: startDate.isAfter(dayjs())
                                    ? dayjs().toDate()
                                    : startDate.toDate(),
                                $lte: endDate.toDate(),
                            },
                            $select: ["employeeId"],
                        },
                    })
                    .then(async ({ data }) => {
                        const staff = data.reduce((prev, curr) => {
                            const ids = JSON.parse(curr.employeeId).map((entry) => +entry);
                            return [...prev, ...ids];
                        }, []);

                        const employees = await getAllEmployees(startDate, endDate);
                        return employees;
                    });
            })
            .catch((e) => console.log(e))
    );
}

export function getMachines(ted) {
    if (!ted)
        return sinaproClient
            .service("ted")
            .find({ query: { active: 1, companyId: 1060 } })
            .then((response) => {
                const { data } = response;
                return data;
            });
    return sinaproClient
        .service("ted")
        .find({ query: { tedId: ted + "", active: 1, companyId: 1060 } })
        .then((response) => {
            const { data } = response;
            return data;
        });
}

export function getMachinesAll() {
    return sinaproClient
        .service("machines")
        .find({ query: { active: 1, companyId: 1060 } })
        .then((response) => {
            const { data } = response;
            return data;
        });
}

export function getGoals(machineGroupId) {
    return client
        .service("goals")
        .find({ query: { machine_group_id: machineGroupId } })
        .then((result) => {
            const { data } = { ...result };
            return data;
        })
        .catch((e) => e);
}

export function getSettings(userId) {
    return client
        .service("user-settings")
        .find({ query: { merged: true, id: userId } })
        .then((response) => {
            return response;
        })
        .catch((e) => e);
}

export function patchSettings({ userSettingId, layouts }) {
    return client
        .service("user-settings")
        .patch(userSettingId, { unconstrainedValue: JSON.stringify(layouts) })
        .then((response) => response)
        .catch((e) => e);
}

export function getLastIndicator(subunitId) {
    return client
        .service("attachments")
        .find({
            query: {
                subunitId: subunitId,
                categoryId: 6,
                $limit: 1,
                $sort: {
                    id: -1,
                },
            },
        })
        .then(({ data }) => data);
}

export function getAllAccidents() {
    return client
        .service("accidents")
        .find({
            query: {
                $sort: {
                    accidentDate: -1,
                },
            },
        })
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getAccidents(subunitId) {
    return client
        .service("accidents")
        .find({
            query: {
                subunit_id: subunitId,
                $sort: {
                    accidentDate: -1,
                },
            },
        })
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function getAccidentsByYear(subunitId, year) {
    return client
        .service("accidents")
        .find({
            query: {
                ...(subunitId && { subunit_id: subunitId }),
                accident_date: {
                    $gte: year.startOf("year"),
                    $lte: year.endOf("year"),
                },
            },
        })
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function createAccident(values) {
    return client.service("accidents").create({
        employeeId: values.employeeId,
        birthDate: "1998-06-24",
        accidentDate: values.accidentDate,
        description: values.description,
        accidentCauseId: values.accidentCauseId.value,
        subunitId: values.subunitId.subunitId,
        userId: values.userId,
    });
}

export function editAccident(values) {
    return client.service("accidents").patch(values.id, {
        employeeId: values.employeeId,
        birthDate: "1998-06-24",
        accidentDate: values.accidentDate,
        description: values.description,
        accidentCauseId: values.accidentCauseId.value,
        subunitId: values.subunitId.subunitId,
        userId: values.userId,
    });
}

export function createNotice(values) {
    return client.service("notices").create({
        type: values.type.value,
        title: values.tile,
        materialCode: values.materialCode,
        machineCode: values.machineCode,
        subunitId: values.subunitId.subunitId,
        description: values.description,
        userId: values.userId,
    });
}

export function editNotice(values) {
    return client.service("notices").patch(values.id, {
        noticeTypeId: values.type.value,
        title: values.title,
        materialCode: values.materialCode,
        machineCode: values.machineCode,
        subunitId: values.subunitId.subunitId,
        description: values.description,
        userId: values.userId,
        formCode: values.formCode,
    });
}
export function createVideoInstruction(values) {
    return client.service("video-instructions").create({
        title: values.title,
        description: values.description,
        subunitId: values.subunitId.subunitId,
        userId: values.userId,
        machineCode: values.machine_code,
    });
}
export function editVideoInstruction(values) {
    return client.service("video-instructions").patch(values.id, {
        title: values.title,
        description: values.description,
        subunitId: values.subunitId.subunitId,
        userId: values.userId,
        machineCode: values.machine_code,
    });
}

export function getTypesLabels() {
    return client
        .service("notice-types")
        .find()
        .then(({ data }) => generateTypeLabels(data));
}

export function getRolesLabels() {
    return client
        .service("roles")
        .find()
        .then(({ data }) => generateRolesLabels(data));
}

export function getKeywordsLabels() {
    return client
        .service("keywords")
        .find()
        .then(({ data }) => generateKeywordsLabels(data));
}

export function removeDocument(id) {
    return client.service("documents").remove(id);
}

export function removeUpload(id) {
    return client.service("uploads").remove(id);
}

export function removeAttachment(id) {
    return client.service("attachments").remove(id);
}

export function removeNotice(id) {
    return client.service("notices").remove(id);
}

export function removeVideoInstruction(id) {
    return client.service("video-instructions").remove(id);
}

// Digitalization
export function getDigitalizationByQuery(page, perPage, sort, query) {
    return client
        .service("digitalization")
        .find({
            query: {
                $limit: perPage,
                $skip: (page - 1) * perPage,
                $sort: {
                    createdAt: sort,
                },
                ...query,
            },
        })
        .then((result) => result);
}

export function editDigitalization(values) {
    return client.service("digitalization").patch(values.id, {
        title: values.title,
        //userId: 137,/*values.userId,*/
    });
}

export function removeDigitalization(id) {
    return client.service("digitalization").remove(id);
}

export function createDigitalization(values) {
    return client.service("digitalization").create({
        title: values.title,
    });
}

export function removeAccident(id) {
    return client.service("accidents").remove(id);
}

export function removeGoal(id) {
    return client.service("goals").remove(id);
}

export function removeUser(id) {
    return client.service("users").remove(id);
}

export function createGroup(values) {
    const machines = values.selectedMachines.map((machine) => {
        return {
            machineKey: machine.value,
            machineAltKey: machine.altKey,
            name: machine.nameShort,
            displayName: machine.name,
        };
    });
    return client.service("machine-groups").create({
        name: values.name,
        quality: values.quality,
        realization: values.realization,
        oee: values.oee,
        dashboard: values.dashboard,
        qualityTol: values.qualityTol,
        realizationTol: values.realizationTol,
        oeeTol: 1,
        perShift: values.perShift,
        perMachine: values.perMachine,
        perBuyer: values.perBuyer,
        perProduct: values.perProduct,
        defaultValueCategory: "1",
        subunitId: values.subunit.subunitId,
        machines: machines,
    });
}

export function getNoticesByQuery(page, perPage, sort, query) {
    return client
        .service("notices")
        .find({
            query: {
                $limit: perPage,
                $skip: (page - 1) * perPage,
                $sort: {
                    createdAt: sort,
                },
                ...query,
            },
        })
        .then((result) => result);
}

export function getNoticesById(subunitId, page, perPage) {
    return client
        .service("notices")
        .find({
            query: {
                subunitId: subunitId,
                $limit: perPage,
                $skip: (page - 1) * perPage,
            },
        })
        .then((result) => result);
}

export function getNotices() {
    return client
        .service("notices")
        .find({
            query: {
                $sort: {
                    id: -1,
                },
            },
        })
        .then((result) => {
            const { data } = result;
            return data;
        });
}

export function getNotice(material_code) {
    return client
        .service("notices")
        .find({
            query: {
                materialCode: { $like: material_code + "%" },
            },
        })
        .then((result) => {
            const { data } = result;
            return data;
        });
}

export function getVideoInstructionsByQuery(page, perPage, sort, query) {
    return client
        .service("video-instructions")
        .find({
            query: {
                $limit: perPage,
                $skip: (page - 1) * perPage,
                $sort: {
                    createdAt: sort,
                },
                ...query,
            },
        })
        .then((result) => result);
}

export function getVideoInstructionsById(subunitId, page, perPage) {
    return client
        .service("video-instructions")
        .find({
            query: {
                subunitId: subunitId,
                $limit: perPage,
                $skip: (page - 1) * perPage,
            },
        })
        .then((result) => result);
}

export function getVideoInstructions() {
    return client
        .service("video-instructions")
        .find({
            query: {
                $sort: {
                    id: -1,
                },
            },
        })
        .then((result) => {
            const { data } = result;
            return data;
        });
}

export function getVideoInstruction(material_code) {
    return client
        .service("video-instructions")
        .find({
            query: {
                materialCode: { $like: material_code + "%" },
            },
        })
        .then((result) => {
            const { data } = result;
            return data;
        });
}

export function editGroup(values) {
    const machines = values.selectedMachines.map((machine) => {
        return {
            machineKey: machine.value,
            machineAltKey: machine.altKey,
            name: machine.nameShort,
            displayName: machine.name,
        };
    });
    return client.service("machine-groups").patch(values.id, {
        name: values.name,
        quality: values.quality,
        realization: values.realization,
        oee: values.oee,
        dashboard: values.dashboard,
        qualityTol: values.qualityTol,
        realizationTol: values.realizationTol,
        oeeTol: values.oeeTol,
        perShift: values.perShift,
        perMachine: values.perMachine,
        perBuyer: values.perBuyer,
        perProduct: values.perMaterial,
        defaultValueCategory: values.defaultValueCategory,
        subunitId: values.subunit.subunitId,
        machines: machines,
    });
}

export function createGoal(values) {
    return client.service("goals").create({
        realizationGoal: values.realizationGoal,
        qualityGoal: values.qualityGoal,
        oeeGoal: values.oeeGoal,
        startDate: values.startDate,
        endDate: values.endDate,
        machineGroupId: values.machineGroupId,
        userId: values.userId,
    });
}

export function editGoal(values) {
    return client.service("goals").patch(values.id, {
        realizationGoal: values.realizationGoal,
        qualityGoal: values.qualityGoal,
        oeeGoal: values.oeeGoal,
        startDate: values.startDate,
        endDate: values.endDate,
        machineGroupId: values.machineGroupId,
        userId: values.userId,
    });
}

export function createUser(values) {
    return client.service("users").create({
        username: values.username,
        name: values.name,
        lastname: values.lastname,
        email: values.email,
        roleId: values.roleId,
        password: "defaultPass",
    });
}

export function editUser(values) {
    return client.service("users").patch(values.id, {
        name: values.name,
        lastname: values.lastname,
        email: values.email,
        roleId: values.roleId,
    });
}

export function getCauses() {
    return client
        .service("accident-causes")
        .find()
        .then((result) => {
            const { data } = { ...result };
            return data;
        });
}

export function createCondition(values) {
    return client.service("machine-conditions").create({
        value: values.value,
        exact: values.exact,
        machineGroupId: values.machineGroupId,
        conditionId: values.conditionId,
    });
}

export function removeCondition(id) {
    return client.service("machine-conditions").remove(id);
}

export function getReports() {
    return toolshopClient
        .service("reports")
        .find()
        .then((response) => response);
}

export function getOrders(archive) {
    return toolshopClient
        .service("orders")
        .find({ query: { archive: archive ? true : false } })
        .then((response) => response);
}

export function createFlawLocation(values) {
    return qualityClient.service("flaw-location").create({
        name: values.name,
        locationId: Number(values.locationId.id),
    });
}

export function editFlawLocation(values) {
    return qualityClient.service("flaw-location").patch(values.id, {
        name: values.name,
    });
}

export function getFlawLocations(query = {}) {
    return qualityClient
        .service("flaw-location")
        .find(query)
        .then((response) => {
            return response.data;
        });
}

export function getApprovers(query = { query: { $limit: 200 } }) {
    return qualityClient
        .service("approvers")
        .find(query)
        .then((response) => {
            return response.data;
        });
}

export function createFlaw(values) {
    return qualityClient.service("flaws").create({
        name: values.name,
        active: true,
        color: values.color,
        highlight: values.highlight,
        flawLocationId: Number(values.flawLocation.id),
        userId: values.userId,
        material_component: values.material_component,
    });
}

export function editFlaw(values) {
    return qualityClient.service("flaws").patch(values.id, {
        name: values.name,
        active: values.active,
        color: values.color,
        highlight: values.highlight,
        locationId: values.locationId,
        flawLocationId: values.flawLocationId,
        material_component: values.material_component,
    });
}

export function removeFlaw(id) {
    return qualityClient.service("flaws").remove(id);
}

export function getFlaws(query = {}, filter = (data) => data.filter((flaw) => true)) {
    return qualityClient
        .service("flaws")
        .find({ ...query })
        .then((response) => {
            return filter(response.data);
        });
}

export function getScraps(query = {}, filter = (data) => data.filter((scrap) => true)) {
    return qualityClient
        .service("scraps")
        .find({ ...query })
        .then((response) => {
            return filter(response.data);
        });
}

export function getPaginatedScraps(query = {}, filter = (data) => data.filter((scrap) => true)) {
    return qualityClient
        .service("scraps")
        .find({ ...query })
        .then((response) => {
            return response;
        });
}

export function createScrap(values) {
    return qualityClient.service("scraps").create({ ...values });
}

export function patchScrap(values) {
    return qualityClient.service("scraps").patch(values.id, {
        ...values,
    });
}

export function getInputLocations(query = {}) {
    return qualityClient
        .service("locations")
        .find(query)
        .then((response) => {
            return response.data;
        });
}

export function getInputLocation(id) {
    return qualityClient
        .service("locations")
        .get(id)
        .then((response) => {
            return response;
        });
}

export function createInputLocation(values) {
    return qualityClient.service("locations").create({
        name: values.name,
        active: true,
        subunitId: values.subunitId,
    });
}

export function editInputLocation(values) {
    return qualityClient.service("locations").patch(values.id, {
        name: values.name,
        subunitId: values.subunitId,
    });
}

export function removeInputLocation(id) {
    return qualityClient.service("locations").remove(id);
}

export function getInputLocationMachines(query = {}) {
    return qualityClient
        .service("machines")
        .find(query)
        .then((response) => {
            return response.data;
        });
}

export function createInputLocationMachines(values) {
    return Promise.all(
        values.map((machine) => {
            return qualityClient.service("machines").create({
                machineCode: machine.machineCode,
                locationId: machine.locationId,
            });
        }),
    );
}

export function createInputLocationMachines2(values) {
    return qualityClient.service("machines").create(values);
}

export function createInputLocationMachine(values) {
    return qualityClient.service("machines").create({
        machineCode: values.machineCode,
        locationId: values.locationId,
    });
}

export function removeInputLocationMachine(id) {
    return qualityClient.service("machines").remove(id);
}

export const fetchMaterials = async (term) => {
    const response = await fetch(
        `${process.env.REACT_APP_INFORMATORSAP}/api/materials/search?term=${encodeURIComponent(
            term,
        )}`,
    );
    if (!response.ok) {
        throw new Error("Failed to fetch materials");
    }
    return await response.json();
};

// Bulk material info: [{ code, name (NAZIV), orderNumber }]
export async function fetchMaterialsInfoBulk(codes) {
    console.log(process.env.REACT_APP_INFORMATORSAP);
    console.log(codes);
    if (!codes || codes.length === 0) return [];

    const res = await fetch(`${process.env.REACT_APP_INFORMATORSAP}/api/materials/bulk-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
    });
    if (!res.ok) throw new Error("Failed to fetch material info (bulk).");
    return res.json();
}
