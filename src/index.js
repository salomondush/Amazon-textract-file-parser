import  express  from "express";
import cors from "cors";
import  parseFileRouter from "../routes/parseFileRouter.js";
import upload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const PORT = process.env.PORT || 3200;
const app = express();


app.use(cors()); // for server to be accessible by other origin
app.use(express.json()); // for parsing json
app.use(express.urlencoded({ extended: true })); // for parsing url encoded data
app.use(upload()); // for parsing file uploads

app.use("/file", parseFileRouter);

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});