const {S3Client , PutObjectCommand} = require("@aws-sdk/client-s3");
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");
const { DynamoDBClient , PutItemCommand} = require("@aws-sdk/client-dynamodb");

const s3 = new S3Client({region: 'us-east-1'});
const dynamoClient = new DynamoDBClient({region: 'us-east-1'});

exports.getUploadUrl = async (event) => {
    try {
        const {fileName, fileType, categoryName} = JSON.parse(event.body);

        const bucketName = process.env.BUCKET_NAME;

        if (!fileName || !fileType || !categoryName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'fileName, fileType and categoryName are required' })
            };
        }

        //create a filename with a date prefix to avoid overwriting

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(s3, command, {expiresIn: 3600});

        const putItemCommand = new PutItemCommand({
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: {
                fileName: {S: fileName},
                categoryName: {S: categoryName},
                createdAt: {S: new Date().toISOString()}
            }
        });

        await dynamoClient.send(putItemCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                uploadUrl: signedUrl,
                fileUrl: `https://${bucketName}.s3.amazonaws.com/${fileName}`
            })
        };
    } catch (error) {
        console.error('Error generating signed URL', error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Could not generate signed URL'})
        };
    }
}