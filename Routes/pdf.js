import express from "express";
import { generatePdf } from "../Controllers/pdf.js";

const route = express.Router();

route.post("/print", generatePdf);

export default route;
