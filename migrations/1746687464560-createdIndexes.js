const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CreatedIndexes1746687464560 {
    name = 'CreatedIndexes1746687464560'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "user_createBy" ON "users" ("createBy") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."user_createBy"`);
    }
}
