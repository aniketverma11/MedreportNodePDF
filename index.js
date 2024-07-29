import express from "express";
import dotenv from "dotenv";
import pdfRoute from "./Routes/pdf.js";
import cors from "cors";

dotenv.config();
const server = express();
server.use(express.json());
server.use(cors());

server.use("/api/v1", pdfRoute);

const PORT = process.env.PORT;

server.listen(PORT, () => console.log(`Server is running at port ${PORT}`));
