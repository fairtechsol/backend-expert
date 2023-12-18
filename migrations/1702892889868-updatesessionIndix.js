const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class UpdatesessionIndix1702892889868 {
    name = 'UpdatesessionIndix1702892889868'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`CREATE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
    }
}
