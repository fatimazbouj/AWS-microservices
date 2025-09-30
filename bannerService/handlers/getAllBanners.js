const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

//Lambda function to return all banners from DynamoDB table
exports.getAllBanners = async () => {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME;

        //Create a scan command to fetch all items from the table
        const scanCommand = new ScanCommand({
            TableName: tableName
        });

        //Execute the scan command
        const {Items} = await dynamoClient.send(scanCommand);
        if(!Items || !Items.length===0){
            return {
                statusCode: 404,
                body: JSON.stringify({error: 'No banners found'})
            };
        }

        //format the retrieved items into readable json response
        const banners = await Items.map((item) => {
            imageUrl: item.imageUrl.S //Extracting image URL
        });


        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(banners)
        };

    } catch (error) {
        console.error('Error fetching banners', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not fetch banners' })
        };
    }
}