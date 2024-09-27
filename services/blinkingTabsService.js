const { AppDataSource } = require("../config/postGresConnection");
const blinkingTabsSchema = require("../models/blinkingTabs.entity");
const blinkingTabsRepo = AppDataSource.getRepository(blinkingTabsSchema);

exports.addBlinkingTabs = async (value) => {

    return await blinkingTabsRepo.save(value);
}

exports.updateBlinkingTabs = async (where, value) => {

    return await blinkingTabsRepo.update(where,value);
}

exports.getBlinkingTabs = async () => {
    return await blinkingTabsRepo.find({
        order: {
            order: "ASC"
        }
    });
}


exports.getBlinkingTab = async (where, select) => {
    return await blinkingTabsRepo.findOne({ where: where, select: select });
}


exports.removeBlinkingTabs = async (where) => {
    return await blinkingTabsRepo.delete(where);
}