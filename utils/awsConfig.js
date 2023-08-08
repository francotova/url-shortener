import AWS from 'aws-sdk'

AWS.config.update({
    region: "us-east-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "AKIAY5B5K7V4GT3TD2HQ",
    secretAccessKey: "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",
});

export default AWS;