import puppeteer from "puppeteer";
import { footer, pdf } from "../Utils/pdfTemplate.js"; // Import your HTML template function
import { pdfTestInfo } from "../Utils/pdf.js";

const generatePdf = async (req, res) => {
  try {
    const obj = {};
    const extractAllTestsByCategory = (tests) => {
      for (let test of tests) {
        if (obj[test?.category?.name]?.length) {
          obj[test?.category?.name] = [...obj[test?.category?.name], test];
        } else {
          obj[test?.category?.name] = [test];
        }
      }
      return obj;
    };

    extractAllTestsByCategory(pdfTestInfo?.data.packages[0].tests);
    extractAllTestsByCategory(pdfTestInfo?.data.tests);

    const pdfInfo = {
      doctorSignDigits: [
        {
          doctorSign:
            "https://labops-backend.s3.amazonaws.com/media/labbranchmedia/2024-07-15_135350.4350890000.png",
          doctorName: "Debditya Mallick",
          doctorPostion: "MD Pathology",
        },
        {
          doctorSign: "",
          doctorName: "Rishikesh Ghosh",
          doctorPostion: "MD Pathology",
        },
      ],
      header: {
        image:
          "https://labops-backend.s3.amazonaws.com/media/labbranchmedia/2024-07-22_105236.6868260000.png",
      },
      footer: {
        image:
          "https://labops-backend.s3.ap-south-1.amazonaws.com/media/labbranchmedia/2024-07-24_182341.4493740000.png",
      },
      marginTop: 0,
      marginBottom: 0,
      tests: Object.keys(obj).map((category) => ({
        category,
        tests: obj[category],
      })),
      pdfAllInfo: pdfTestInfo?.data,
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
        return `${44.5}rem;`;
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
        return `${57}rem;`;
      } else if (marginTop && marginBottom) {
        return `${57 - (marginTop + marginBottom)}rem;`;
      } else if (marginTop) {
        return `${50 - marginTop}rem;`;
      } else if (marginBottom) {
        console.log("helllo");
        return `${50 - marginBottom}rem;`;
      } else {
        return "50rem";
      }
    };

    function pixelsToRem(pxValue, baseFontSize = 16) {
      const remValue = pxValue / baseFontSize;
      return Math.round(remValue);
    }

    const baseFontSize = 16;

    const marginTop = pixelsToRem(pdfInfo?.marginTop || 0, baseFontSize);
    const marginBottom = pixelsToRem(pdfInfo?.marginBottom || 0, baseFontSize);

    let tableHeight = calculateTableheight(pdfInfo, marginTop, marginBottom);
    console.log(pdfInfo?.doctorSignDigits);

    const htmlTemplate = pdf(
      pdfInfo,
      tableHeight,
      marginTop,
      marginBottom,
      pdfInfo?.doctorSignDigits
    );

    const browser = await puppeteer.launch();
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="example.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Error generating PDF" });
  }
};

export { generatePdf };
