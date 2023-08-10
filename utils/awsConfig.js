import AWS from 'aws-sdk'
import {config} from "../config.js"


AWS.config.update({
    region: config.REGION_AWS,
    endpoint: config.ENDPOINT_AWS,
    accessKeyId: config.ACCESS_KEY_ID_AWS,
    secretAccessKey: config.SECRET_KEY_AWS
})

export default AWS;