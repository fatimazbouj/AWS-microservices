//import required AWS sdk modules to interact with dynamoDB
const {DynamoDBClient, ScanCommand} = require("@aws-sdk/client-dynamodb");

//Initialize the DynamoDB client with AWS region
const dynamodb = new DynamoDBClient({ region: 'us-east-1' });

//function to fetch all products where approved is true
exports.getApprovedProducts = async () => {
    try {
        const tableName = process.env.DYNAMO_TABLE_NAME;

        //create a scan command to fetch items with isApproved = true
        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'isApproved = :isApproved',
            ExpressionAttributeValues: {
                ':isApproved': { BOOL: true }
            }
        });

        //execute the scan command
        const scanResult = await dynamodb.send(scanCommand);
        const approvedProducts = scanResult.Items || [];

        return {
            statusCode: 200,
            body: JSON.stringify(approvedProducts)
        };

    } catch (error) {
        console.error('Error fetching approved products', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not fetch approved products' })
        };
    }
}