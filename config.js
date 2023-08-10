import dotenv from "dotenv"

dotenv.config();

const config = {
    PORT: process.env.PORT,
    REGION_AWS: process.env.REGION_AWS,
    ENDPOINT_AWS: process.env.ENDPOINT_AWS,
    ACCESS_KEY_ID_AWS: process.env.ACCESS_KEY_ID_AWS,
    SECRET_KEY_AWS: process.env.SECRET_KEY_AWS,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
}

export { config }
