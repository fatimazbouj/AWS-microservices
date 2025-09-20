    const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
    const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    const { snsClient, PublishCommand } = require("@aws-sdk/client-sns");
    const sns = new snsClient({ region: 'us-east-1' });

    exports.cleanUpCategories = async () => {
            try{

                const tableName = process.env.DYNAMO_TABLE_NAME;
                const snsTopicArn = process.env.SNS_TOPIC_ARN;

                //calculate the timestamp for one hour ago to filter outdated categories
                const oneHourAgo = new Date(Date.now() - 3600000);

                // create a scan command to find items older than one hour
                // and not have imageUrl attribute
                const scanCommand = new ScanCommand({
                    TableName: tableName,
                    FilterExpression: 'createdAt < :oneHourAgo AND attribute_not_exists(imageUrl)',
                    ExpressionAttributeValues: {
                        ':oneHourAgo': { S: oneHourAgo.toISOString() }
                    }
                });
                //execute the scan command to get the items
                const scanResult = await dynamoClient.send(scanCommand);
                const itemsToDelete = scanResult.Items || [];

                if(!itemsToDelete || itemsToDelete.length === 0){
                    return {
                        statusCode: 200,
                        body: JSON.stringify({message: 'No outdated categories to clean up'})
                    };
                }
                //initialize a counter for deleted items
                let deletedCount = 0;
                //iterate over the items and delete them
                for(const item of itemsToDelete){
                    const deleteCommand = new DeleteItemCommand({
                        TableName: tableName,
                        Key: {
                            fileName: item.fileName.S
                        }
                    });
                    await dynamoClient.send(deleteCommand);
                    deletedCount++;
                }
                //send an SNS notification after deleting categories
                const publishCommand = new PublishCommand({
                    TopicArn: snsTopicArn,
                    Message: `Clean up completed. Deleted ${deletedCount} outdated categories.`,
                    Subject: 'Category Clean Up Notification'
                });
                await sns.send(publishCommand);

                return {
                    statusCode: 200,
                    body: JSON.stringify({message: `Clean up completed. Deleted ${deletedCount} outdated categories.`})
                };
                
            }catch (e) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({error: 'Could not clean up categories', details: e.message})
                }
            }
    }