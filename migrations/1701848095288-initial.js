const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Initial1701848095288 {
    name = 'Initial1701848095288'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userName" character varying NOT NULL, "fullName" character varying, "password" character varying NOT NULL, "phoneNumber" character varying, "city" character varying, "allPrivilege" boolean NOT NULL DEFAULT false, "addMatchPrivilege" boolean NOT NULL DEFAULT false, "betFairMatchPrivilege" boolean NOT NULL DEFAULT false, "bookmakerMatchPrivilege" boolean NOT NULL DEFAULT false, "sessionMatchPrivilege" boolean NOT NULL DEFAULT false, "delayTime" integer NOT NULL DEFAULT '5', "loginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_userName" ON "users" ("id", "userName") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."user_userName"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
