const {DynamoDBClient, UpdateItemCommand , ScanCommand} = require("@aws-sdk/client-dynamodb");

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

exports.updateProductImage = async (event) => {
    try {

        const tableName = process.env.DYNAMO_TABLE_NAME;
        const record = event.Records ? event.Records[0] : null;
        const bucketName = record?.s3?.bucket?.name; //or process.env.BUCKET_NAME
        const fileName = record?.s3?.object?.key;

        console.log(' ---------------fileName:', fileName);

        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

        // Scan the table to find the item with the matching fileName
        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'fileName = :fileName',
            ExpressionAttributeValues: {
                ':fileName': { S: fileName }
            }
        });

        const scanResult = await dynamoClient.send(scanCommand);
        if (scanResult.Items?.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Product not found for the given fileName' })
            }
        }
        // Assuming fileName is unique, we take the first item
        const productId = scanResult.Items[0].id.S;

        const updateCommandItem= new UpdateItemCommand({
            TableName: tableName,
            Key: {
                id: {S: productId}
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
            body: JSON.stringify({message: 'Product image updated successfully', imageUrl})
        };


    } catch (error) {
        console.error('Error updating product image', error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Could not update product image'})
        };
    }
}