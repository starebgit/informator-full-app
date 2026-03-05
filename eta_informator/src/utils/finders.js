import _ from "lodash";

const findSubunitByKeyword = (units, keyword) => {
    let subunit;
    _.forEach(units, (unit) => {
        subunit = _.find(unit.options, ["keyword", keyword]);
        return _.isUndefined(subunit);
    });
    return subunit;
};

export const findSubunitByTed = (units, ted) => {
    let subunit;
    _.forEach(units, (unit) => {
        subunit = _.find(unit.options, ["ted", +ted]);
        return _.isUndefined(subunit);
    });
    return subunit;
};

export const findSubunitById = (units, id) => {
    let subunit;
    _.forEach(units, (unit) => {
        subunit = _.find(unit.options, ["subunitId", id]);
        return _.isUndefined(subunit);
    });
    return subunit;
};

export default findSubunitByKeyword;
