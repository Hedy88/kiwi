import { Snowflake } from "nodejs-snowflake";

const snowflake = new Snowflake({
    custom_epoch: 1730486592,
    instance_id: 0
});

const generateId = (time: number = Date.now()) => {
    return snowflake.idFromTimestamp(time);
};

export { generateId, snowflake };