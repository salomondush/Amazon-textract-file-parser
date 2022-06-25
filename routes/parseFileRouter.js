import  express  from "express";
const parseFileRouter = express.Router();
import analyze_document_text from "../utils/textractAnalyze.js";
import AWS from "aws-sdk";

import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import


const s3 = new AWS.S3();


export default parseFileRouter.post("/analyse", async function(req, res){
    const bucket_name = process.env.AWS_BUCKET_NAME;

    console.log("bucket name: ", bucket_name);


    try{
        const response = await s3.putObject({
            Body: req.files.file.data,
            Bucket: "makemeals",
            Key: req.files.file.name,
        }).promise();

        console.log("response: ", response);

        // Set params
        const params = {
            Document: {
            S3Object: {
                Bucket: bucket_name,
                Name: req.files.file.name
            },
            },
            FeatureTypes: ["TABLES"]
        }
        const csv = await analyze_document_text(params);

        res.send(csv);
        }
    catch(err){
        console.log("Error: ", err);
        res.send(err);
    }
});
