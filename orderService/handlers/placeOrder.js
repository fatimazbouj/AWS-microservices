//import aws sdk to intercat with dynamodb
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

// Create a DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

//Import exios to make http requests
const axios = require('axios');

//Import crypto to generate unique ids
const crypto = require('crypto');

//import sqs client to send messages to SQS
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

//Create an SQS client
const sqsClient = new SQSClient({ region: "us-east-1" });

exports.placeOrder = async (req, res) => {
    try {
        //extract user email from the request context (assuming it's passed via an authorizer)
        const email = req.requestContext?.authorizer?.jwt?.claims?.email;

        const {id, quantity} = JSON.parse(req.body);

        // Validate request
        if (!id || !quantity || !email) {
            return {
                status: 400,
                error: 'Product id, quantity and email are required!'
            };
        }

        //Fetch the list of products from an external service product API
        const productResponse = await axios.get('https://25qewwujel.execute-api.us-east-1.amazonaws.com/get-approved-products');
        const approvedProducts = productResponse.data || [];

        //Find the products requested in the approved products list
        const product = approvedProducts.find(p => p.id?.S === id);
        if (!product) {
            return {
                status: 400,
                error: 'Product not found or not approved!'
            }
        }

        //check if there is a sufficient stock available
        const availableStock = parseInt(product.quantity?.N || '0');
        if (availableStock < quantity) {
            return {
                status: 400,
                error: 'Insufficient stock available!'
            }
        }

        //generate a unique id using uuid library
        const orderId= crypto.randomUUID();

        //Create order object payload
        const orderPayload = {
            id:orderId,
            productId: id,
            quantity,
            email,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
        };

        //send order to SQS queue for further processing
        const sqsParams = {
            QueueUrl: process.env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(orderPayload)
        };
        const command = new SendMessageCommand(sqsParams);
        await sqsClient.send(command);

        //Respond with success message
        return {
            status: 200,
            message: 'Order placed successfully!',
            orderId
        }
    }catch(err) {
        console.error('Error placing order:', err);
        return {
            status: 500,
            error: 'Could not place order, please try again later.'
        }
    }

}