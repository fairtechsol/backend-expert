const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CloneMarket1739174347087 {
    name = 'CloneMarket1739174347087'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "parentRunnerId" uuid`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "parentRunnerId"`);
    }
}
