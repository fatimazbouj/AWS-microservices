//import libs to intercat with dynamodb
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

// Create a DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

//New lambda function to process orders
exports.processOrder = async (event) => {
    try{
        for (const record of event.Records) {
            const order = JSON.parse(record.body);
            const params = {
                TableName: process.env.DYNAMODB_TABLE_NAME || 'Orders',
                Item: {
                    id: { S: order.id },
                    productId: { S: order.productId },
                    quantity: { N: order.quantity.toString() },
                    email: { S: order.email },
                    status: { S: 'PROCESSING' },
                    createdAt: { S: new Date().toISOString() }
                }
            };
            const command = new PutItemCommand(params);
            await dynamoDBClient.send(command);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Orders processed successfully!' })
        };
    }catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not process orders', details: error.message })
        };
    }
}