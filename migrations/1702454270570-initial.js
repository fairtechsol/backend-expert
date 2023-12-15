const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Initial1702454270570 {
    name = 'Initial1702454270570'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."bettings_betstatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "bettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "matchType" character varying(50) NOT NULL, "betCondition" character varying(200), "noRate" double precision, "yesRate" double precision, "ratePercent" character varying(50), "sessionStatus" character varying(50) DEFAULT 'suspended', "selectionId" character varying, "sessionBet" boolean NOT NULL DEFAULT true, "betStatus" "public"."bettings_betstatus_enum" NOT NULL DEFAULT 'save', "stopAt" TIMESTAMP WITH TIME ZONE, "betResult" character varying, "sessionMinBet" double precision, "sessionMaxBet" double precision, CONSTRAINT "UQ_1e70b1452c95244c9f8bceae02b" UNIQUE ("matchId"), CONSTRAINT "PK_18baabb46e8b30402aca9c7fdb8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bookmakers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "betId" uuid NOT NULL, "matchType" character varying(50) NOT NULL, "marketType" character varying(50) NOT NULL, "marketName" character varying(50) NOT NULL, "minBet" double precision, "maxBet" double precision, "teamABack" double precision, "teamBBack" double precision, "teamCBack" double precision, "teamAStatus" character varying DEFAULT 'suspended', "teamBStatus" character varying DEFAULT 'suspended', "teamCStatus" character varying DEFAULT 'suspended', "teamALay" double precision, "teamBLay" double precision, "teamCLay" double precision, "isActive" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_24e1529b766485122592c40366c" UNIQUE ("matchId"), CONSTRAINT "UQ_4de06438acfb3fbd694f60ad055" UNIQUE ("betId"), CONSTRAINT "PK_f75b6ecebd5c6a9df57492e0b3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "bookmaker_marketName" ON "bookmakers" ("matchId", "marketName") `);
        await queryRunner.query(`CREATE TABLE "matchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "competitionId" character varying NOT NULL, "competitionName" character varying NOT NULL, "title" character varying(100) NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "teamA" character varying(100) NOT NULL, "teamB" character varying(100) NOT NULL, "teamC" character varying(100), "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, "matchOddMinBet" double precision NOT NULL DEFAULT '0', "matchOddMaxBet" double precision NOT NULL DEFAULT '0', "betFairSessionMinBet" double precision NOT NULL DEFAULT '0', "betFairSessionMaxBet" double precision NOT NULL DEFAULT '0', "betFairBookmakerMinBet" double precision NOT NULL DEFAULT '0', "betFairBookmakerMaxBet" double precision NOT NULL DEFAULT '0', "apiMatchOddActive" boolean NOT NULL DEFAULT false, "apiBookMakerActive" boolean NOT NULL DEFAULT false, "apiSessionActive" boolean NOT NULL DEFAULT false, "manualSessionActive" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_8afa35a9cde7e34e88d400dd96d" UNIQUE ("marketId"), CONSTRAINT "PK_0fdbc8e05ccfb9533008b132189" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "match_marketId" ON "matchs" ("marketId", "matchType") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userName" character varying NOT NULL, "fullName" character varying, "password" character varying NOT NULL, "phoneNumber" character varying, "city" character varying, "allPrivilege" boolean NOT NULL DEFAULT false, "addMatchPrivilege" boolean NOT NULL DEFAULT false, "betFairMatchPrivilege" boolean NOT NULL DEFAULT false, "bookmakerMatchPrivilege" boolean NOT NULL DEFAULT false, "sessionMatchPrivilege" boolean NOT NULL DEFAULT false, "loginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_userName" ON "users" ("id", "userName") `);
        await queryRunner.query(`ALTER TABLE "bettings" ADD CONSTRAINT "FK_1e70b1452c95244c9f8bceae02b" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmakers" ADD CONSTRAINT "FK_24e1529b766485122592c40366c" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookmakers" DROP CONSTRAINT "FK_24e1529b766485122592c40366c"`);
        await queryRunner.query(`ALTER TABLE "bettings" DROP CONSTRAINT "FK_1e70b1452c95244c9f8bceae02b"`);
        await queryRunner.query(`DROP INDEX "public"."user_userName"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."match_marketId"`);
        await queryRunner.query(`DROP TABLE "matchs"`);
        await queryRunner.query(`DROP INDEX "public"."bookmaker_marketName"`);
        await queryRunner.query(`DROP TABLE "bookmakers"`);
        await queryRunner.query(`DROP TABLE "bettings"`);
        await queryRunner.query(`DROP TYPE "public"."bettings_betstatus_enum"`);
    }
}
