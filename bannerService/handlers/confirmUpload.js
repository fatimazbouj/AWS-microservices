const {DynamoDBClient, PutItemCommand} = require("@aws-sdk/client-dynamodb");

const dynamoDb = new DynamoDBClient({region: 'us-east-1'});

exports.confirmUpload = async (event) => {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME;
        const bucketName = process.env.BUCKET_NAME;
        //Extract file details from s3 event notification if available
        const record = event.Records ? event.Records[0] : null; //get the first record
        //Extract fileName from s3
        const fileName = record ? record.s3.object.key : null;
        //Construct the public url for the uploaded file
        const imageUrl = fileName ? `https://${bucketName}.s3.amazonaws.com/${fileName}` : null;

        const params = {
            TableName: tableName,
            Item: {
                fileName: {S: fileName},
                imageUrl: {S: imageUrl},
                uploadedAt: {S: new Date().toISOString()},
            }
        };

        const command = new PutItemCommand(params);
        await dynamoDb.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({message: 'File upload confirmed', data: params.Item})
        };
    } catch (error) {
        console.error('Error confirming upload', error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message})
        };
    }
}