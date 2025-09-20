const {DynamoDBClient, UpdateItemCommand} = require("@aws-sdk/client-dynamodb");

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

exports.updateCategoryImage = async (event) => {
    try {

        const tableName = process.env.DYNAMO_TABLE_NAME;
        const record = event.Records ? event.Records[0] : null;
        const bucketName = record?.s3?.bucket?.name; //or process.env.BUCKET_NAME
        const fileName = record?.s3?.object?.key;

        console.log(' ---------------fileName:', fileName);

        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

        const updateCommandItem= new UpdateItemCommand({
            TableName: tableName,
            Key: {
                fileName: {S: fileName}
            },
            UpdateExpression: 'SET imageUrl = :imageUrl',
            ExpressionAttributeValues: {
                ':imageUrl': {S: imageUrl}
            },
            ReturnValues: 'ALL_NEW' // Returns all the attributes of the item, as they appear after the UpdateItem operation
        });

        await dynamoClient.send(updateCommandItem);

        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Category image updated successfully', imageUrl})
        };


    } catch (error) {
        console.error('Error updating category image', error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Could not update category image'})
        };
    }
}