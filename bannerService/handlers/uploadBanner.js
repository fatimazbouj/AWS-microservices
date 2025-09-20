const {S3Client , PutObjectCommand} = require("@aws-sdk/client-s3");
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({region: 'us-east-1'});

exports.getUploadBannerUrl = async (event) => {
    try {
        const {fileName, fileType} = JSON.parse(event.body);

        const bucketName = process.env.BUCKET_NAME;

        if(!fileName || !fileType) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: 'fileName and fileType are required'})
            };
        }

        //create a filename with a date prefix to avoid overwriting
        const key = `${Date.now()}_${fileName}`;

        const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(s3, command, {expiresIn: 3600});

        return {
        statusCode: 200,
        body: JSON.stringify({
            uploadUrl: signedUrl,
            fileUrl: `https://${bucketName}.s3.amazonaws.com/${key}`
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