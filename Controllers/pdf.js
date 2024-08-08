import puppeteer from "puppeteer";
import { pdf } from "../Utils/pdfTemplate.js"; // Import your HTML template function

import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: "AKIATCKAQU7JXLBI4EQS", //process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: "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", //process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1", //process.env.AWS_REGION,
});

const generatePdf = async (req, res) => {
  try {
    const {
      doctorSignDigits,
      tests,
      packages = [],
      header,
      footer,
      marginTopPx,
      marginBottomPx,
    } = req.body;
    const obj = {};

    const extractAllTestsByCategory = (tests) => {
      console.log("Extracting tests:", tests);
      if (!Array.isArray(tests) || tests.length === 0) return;
      for (let test of tests) {
        if (obj[test?.category?.name]?.length) {
          obj[test?.category?.name] = [...obj[test?.category?.name], test];
        } else {
          obj[test?.category?.name] = [test];
        }
      }
      return obj;
    };

    if (Array.isArray(packages) && packages[0]?.uuid) {
      for (let i = 0; i < packages.length; i++) {
        if (packages[i]?.uuid) {
          extractAllTestsByCategory(packages[i].tests || []);
        }
      }
    }

    extractAllTestsByCategory(tests || []);

    const CBC = obj["Hematology"]?.find((test) => {
      if (test?.testName === "Complete Blood Count (CBC)") return test;
    });

    if (CBC?.testName === "Complete Blood Count (CBC)") {
      obj["Hematology"] = obj["Hematology"]?.filter(
        (test) => test?.testName !== CBC?.testName
      );
    }

    function processTestComponents(obj, maxTablesPerCategory = 15) {
      let processedData = {};

      // Step 1: Calculate total tables in each category
      for (let cat in obj) {
        const totalTables = calculateTotalTables(obj[cat]);

        // Step 2: Determine if splitting is necessary
        if (totalTables > maxTablesPerCategory) {
          const numNewCategories = Math.ceil(
            totalTables / maxTablesPerCategory
          );

          // Initialize processedData entry for the current category
          processedData[cat] = 0;

          // Create new categories and initialize them
          initializeNewCategories(obj, processedData, cat, numNewCategories);

          // Distribute components across new categories prioritizing smaller objects
          distributeComponents(obj, processedData, cat, maxTablesPerCategory);

          // Adjust maxTablesPerCategory for this specific category
          adjustMaxTablesPerCategory(
            obj,
            cat,
            totalTables,
            maxTablesPerCategory
          );
        }
      }

      return processedData;
    }

    function calculateTotalTables(category) {
      return category.reduce((acc, val) => {
        return acc + (val?.testComponent?.testComponents?.length || 0);
      }, 0);
    }

    function initializeNewCategories(
      obj,
      processedData,
      cat,
      numNewCategories
    ) {
      for (let i = 2; i <= numNewCategories; i++) {
        let newCategoryKey = `${cat}-${i}`;
        processedData[newCategoryKey] = 0;
        obj[newCategoryKey] = []; // Initialize as an empty array
      }
    }

    function distributeComponents(
      obj,
      processedData,
      cat,
      maxTablesPerCategory
    ) {
      let currentCategoryIndex = 1;
      let currentTableCount = 0;

      // Sort objects within the category based on testComponent.testComponents length in ascending order
      obj[cat].sort(
        (a, b) =>
          (a.testComponent?.testComponents?.length || 0) -
          (b.testComponent?.testComponents?.length || 0)
      );

      for (let originalObj of obj[cat]) {
        let currentComponents = originalObj.testComponent?.testComponents || [];

        while (currentComponents.length > 0) {
          let newCategoryKey = `${cat}-${currentCategoryIndex}`;
          if (currentTableCount >= maxTablesPerCategory) {
            currentTableCount = 0;
            currentCategoryIndex++;
            newCategoryKey = `${cat}-${currentCategoryIndex}`;
          }

          if (!obj[newCategoryKey]) {
            obj[newCategoryKey] = [];
          }

          let componentsToMove = currentComponents.splice(
            0,
            maxTablesPerCategory - currentTableCount
          );
          obj[newCategoryKey].push({
            ...originalObj,
            testComponent: { testComponents: componentsToMove },
          });
          processedData[newCategoryKey]++;
          currentTableCount += componentsToMove.length;
        }
      }

      // Remove original category if all components are moved
      if (
        obj[cat].every(
          (item) =>
            !item.testComponent?.testComponents ||
            item.testComponent.testComponents.length === 0
        )
      ) {
        delete obj[cat];
      }
    }

    function adjustMaxTablesPerCategory(
      obj,
      cat,
      totalTables,
      maxTablesPerCategory
    ) {
      if (totalTables > 3 * maxTablesPerCategory) {
        maxTablesPerCategory = Math.ceil(totalTables / 3);
      }
    }

    let remainingTables2 = header?.image ? 20 : 15;

    if (marginBottom && marginTop) {
      let availablePixels2 = marginBottom + marginTop;
      remainingTables2 = getRemainingTablesAfterExtraction(availablePixels2);
    } else if (marginBottom) {
      remainingTables2 = getRemainingTablesAfterExtraction(marginBottom);
    } else if (marginTop) {
      remainingTables2 = getRemainingTablesAfterExtraction(marginTop);
    }

    processTestComponents(
      obj,
      remainingTables2 === 0 && header?.image ? 20 : 15
    );

    if (CBC?.testName === "Complete Blood Count (CBC)") {
      if (obj["Hematology"]?.length === 0) {
        obj["Hematology"] = [{ ...CBC }];
      } else {
        obj["Hematology--1"] = [{ ...CBC }];
      }
    }

    const pdfInfo = {
      doctorSignDigits,
      header,
      footer,
      marginTop: marginTopPx,
      marginBottom: marginBottomPx,
      tests: Object.keys(obj).map((category) => ({
        category,
        tests: obj[category],
      })),
      pdfAllInfo: req.body,
    };

    const calculateTableheight = (pdfInfo, marginTop, marginBottom) => {
      if (
        pdfInfo?.header?.image &&
        pdfInfo?.footer?.image &&
        marginTop &&
        marginBottom
      ) {
        //console.log(`${marginTop + marginBottom}rem;`);
        return `${45 - (marginTop + marginBottom)}rem;`;
      } else if (
        pdfInfo?.header?.image &&
        pdfInfo?.footer?.image &&
        marginBottom
      ) {
        return `${44.5 - marginBottom}rem;`;
      } else if (
        pdfInfo?.header?.image &&
        pdfInfo?.footer?.image &&
        marginTop
      ) {
        return `${44.5 - marginTop}rem;`;
      } else if (pdfInfo?.header?.image && pdfInfo?.footer?.image) {
        return `${49.5}rem;`;
      } else if (pdfInfo?.header?.image && marginTop && marginBottom) {
        console.log("helllo");
        return `${50.5 - (marginTop + marginBottom)}rem;`;
      } else if (pdfInfo?.footer?.image && marginTop && marginBottom) {
        return `${44.5 - (marginTop + marginBottom)}rem;`;
      } else if (pdfInfo?.header?.image && marginTop) {
        return `${49.5 - marginTop}rem;`;
      } else if (pdfInfo?.header?.image && marginBottom) {
        return `${50 - marginBottom}rem;`;
      } else if (pdfInfo?.footer?.image && marginTop) {
        return `${56.5 - marginTop}rem;`;
      } else if (pdfInfo?.footer?.image && marginBottom) {
        return `${56.5 - marginBottom}rem;`;
      } else if (pdfInfo?.header?.image) {
        return `${50}rem;`;
      } else if (pdfInfo?.footer?.image) {
        return `${59}rem;`;
      } else if (marginTop && marginBottom) {
        return `${57 - (marginTop + marginBottom)}rem;`;
      } else if (marginTop) {
        return `${50 - marginTop}rem;`;
      } else if (marginBottom) {
        console.log("helllo");
        return `${50 - marginBottom}rem;`;
      } else {
        return "52rem";
      }
    };

    function pixelsToRem(pxValue, baseFontSize = 16) {
      const remValue = pxValue / baseFontSize;
      return Math.round(remValue);
    }

    const baseFontSize = header?.image ? 20 : 15;

    const marginTop = pixelsToRem(pdfInfo?.marginTop || 0, baseFontSize);
    const marginBottom = pixelsToRem(pdfInfo?.marginBottom || 0, baseFontSize);

    let tableHeight = calculateTableheight(pdfInfo, marginTop, marginBottom);
    // console.log(pdfInfo?.doctorSignDigits);

    const htmlTemplate = pdf(
      pdfInfo,
      tableHeight,
      marginTop,
      marginBottom,
      pdfInfo?.doctorSignDigits
    );

    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--deterministic-fetch",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
        "--disabled-setupid-sandbox",
        // '--single-process',
      ],
      ignoreDefaultArgs: ["--disable-extensions"],
      timeout: 60000,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 595, height: 842 });
    await page.setContent(htmlTemplate);

    const pdfBuffer = await page.pdf({
      format: "A4",

      margin: {
        top: "0mm",
        bottom: "0mm",
        left: "9mm",
        right: "10mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>", // Empty header template
      footerTemplate: "<div></div>", // Empty footer template
    });

    await browser.close();

    // Generate unique filename
    const filename = `medical-pdfs/${uuidv4()}.pdf`;

    // Upload to S3
    const params = {
      Bucket: "labops-backend", //process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ACL: "public-read", // Optional: make the file publicly readable
    };

    const uploadResult = await s3.upload(params).promise();
    const fileUrl = uploadResult.Location;
    res.status(200).json({ url: fileUrl });
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", 'inline; filename="example.pdf"');
    // res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Error generating PDF" });
  }
};

export { generatePdf };
