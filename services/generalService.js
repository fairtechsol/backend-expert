const { AppDataSource } = require("../config/postGresConnection");
const systemTableSchema = require("../models/systemTable.entity");
const systemTableRepo = AppDataSource.getRepository(systemTableSchema);

exports.addNotification = async (value, userId) => {
    const notification = {};
    notification.createBy = userId;
    notification.type = 'notification';
    let notificationExist = await systemTableRepo.findOneBy({ type: 'notification' });
    if (notificationExist) {
        notification.id = notificationExist.id;
    }
    notification.value = value;
    return await systemTableRepo.save(notification);
}

exports.getBanner = async (type='notification') => {
    return await systemTableRepo.findOneBy({ type: type });
}

exports.addBanner = async (value, userId) => {
    const banner = {};
    banner.createBy = userId;
    banner.type = 'banner';
    let bannerExist = await systemTableRepo.findOneBy({ type: 'banner' });
    if (bannerExist) {
        banner.id = bannerExist.id;
    }
    banner.value = value;
    return await systemTableRepo.save(banner);
}
