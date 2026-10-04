import { characterizePgCron, pgCronLocalUrl } from "../fixtures/pg_cron";
const result = await characterizePgCron(pgCronLocalUrl());
console.log(JSON.stringify(result, null, 2));
