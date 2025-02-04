const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1736922472434 {
    name = 'Tournament1736922472434'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."tournamentRunners_status_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "status" "public"."tournamentRunners_status_enum" DEFAULT 'suspended'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."tournamentRunners_status_enum"`);
    }
}
