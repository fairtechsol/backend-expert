const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class UpdateSelectionid1702888401674 {
    name = 'UpdateSelectionid1702888401674'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "selectionId" DROP NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "selectionId" SET NOT NULL`);
    }
}
