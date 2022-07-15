import  express  from "express";
const parseFileRouter = express.Router();
import analyze_document_text from "../utils/textractAnalyze.js";
import AWS from "aws-sdk";

import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

const s3 = new AWS.S3();

/**
 * Endpoint for parsing an image file and returning the text
 * 
 * Uploads the image file to S3 and then calls the textractAnalyze function to get the text
 */
export default parseFileRouter.post("/analyse", async function(req, res){
    const bucket_name = process.env.AWS_BUCKET_NAME;

    console.log("req.files: ", req.files);
    try{
        const response = await s3.putObject({
            Body: req.files.image.data,
            Bucket: "makemeals",
            Key: req.files.image.name,
        }).promise();

        console.log("response: ", response);

        // Set params
        const params = {
            Document: {
            S3Object: {
                Bucket: bucket_name,
                Name: req.files.image.name
            },
            },
            FeatureTypes: ["TABLES"]
        }
        const csv = await analyze_document_text(params);

        res.status(200).send({"response": csv});
        }
    catch(err){
        console.log("Error: ", err);
        res.send(err);
    }
});
