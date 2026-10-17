import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndClaims1792238224440 implements MigrationInterface {
    name = 'CreateUsersAndClaims1792238224440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "claims" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "status" character varying(16) NOT NULL, "department" character varying(32) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_96c91970c0dcb2f69fdccd0a698" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(120) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "claims" ADD CONSTRAINT "FK_6b6d7ad7d8c3982b44194fd542c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "claims" DROP CONSTRAINT "FK_6b6d7ad7d8c3982b44194fd542c"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "claims"`);
    }

}
