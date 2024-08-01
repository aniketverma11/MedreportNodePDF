export const pdf = (pdfInfo, tableHeight, marginTop, marginBottom, doctor) => {
  console.log(doctor);
  const template = ` <html >
  <head>
        <style>
          body {
            width: 100%;
            height:100%;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
           
          }
          .container {
            height:100%;
            
            width: 100%;
            padding: 0.8rem 0rem;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: start;
            
            position: relative;
          }
          .headerImgContainer {
            width: 100%;
          }

          .footerImgContainer {
            width: 100%;
            padding-top :1.5rem;
          }
          
          .headerInfoContainer {
            width: 100%;
            display: flex;
            border-bottom: 2px solid black;
            padding: 1rem 0;
          }
          .headerInfoContainerSection {
            flex: 1;
            display: flex;
            justify-content: center;
          }
          .hedaerInfoLineComp {
            display: flex;
            align-items: center;
          }
          .hedaerInfoLine {
            height: 5rem;
            width: 0px;
            border: 1px solid black;
          }
          .headerInfoContainerBox {
            width: fit-content;
            display: flex;
            flex-direction: column;
            font-size: 1.1rem;
            font-weight: 500;
            row-gap: 0.2rem;
          }
          table {
            font-family: arial, sans-serif;
            border-collapse: collapse;
            width: 100%;
       
          }

          td,
          th {
           
            text-align: left;
            padding :0.3rem 0;
            width: 10rem;
            padding-left: 3rem;
          }
          th {
            background-color: #D3EEFF;
            margin-bottom:1rem !important;
            
          }
          .textContainer {
           
            width: 100%;
            padding: 1rem 0rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            row-gap: 0.8rem;
          }
          .textContainerTexts {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
          }
          .bigText {
            width:100%;
            text-align: center;
            font-size: 1.6rem;
            font-weight: 700;
            margin-bottom: 0.7rem;
          }
          .midText {
            font-size: 1.3rem;
            font-weight: 500;
          }
          .signatureComponent {
            width: 100%;
            display: flex;
            align-items: center;
            column-gap: 1.8rem;
            
          }
          .signatureSection {
            width: fit-content;
            display: flex;
            flex-direction: column;
            align-items: start;
            column-gap: 1.8rem;
          }
          img {
            margin: 0;
            padding: 0;
            display: block;
          }
          .testInfoContainer {
            width: 100%;
          }
          .textContainerMain {
            width: 100%;
            padding: 1rem 0rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            row-gap: 0.8rem;
            
          }
        </style>
      </head>
      <body>
       ${pdfInfo?.tests
         ?.map(
           (
             test
           ) => ` <container style="margin-top: ${marginTop}rem; margin-bottom:${marginBottom}rem" class="container">
        <div class="testInfoContainer">
          ${
            pdfInfo?.header?.image
              ? `<div class="headerImgContainer">
            <img
              width="850px"
              height="200px"
              src="${pdfInfo?.header?.image}"
              alt="img"
            />
          </div>`
              : ""
          }
          <div class="headerInfoContainer">
            <div class="headerInfoContainerSection">
              <div class="headerInfoContainerBox">
                <div>Name: ${
                  pdfInfo?.pdfAllInfo?.patient_info?.name || ""
                }</div>
                <div>Gender: ${
                  pdfInfo?.pdfAllInfo?.patient_info?.gender || ""
                }</div>
                <div>Age: ${pdfInfo?.pdfAllInfo?.patient_info?.age || ""}</div>
                <div>Phone: ${
                  pdfInfo?.pdfAllInfo?.patient_info?.phone || ""
                }</div>
              </div>
            </div>
            <div class="hedaerInfoLineComp">
              <div class="hedaerInfoLine"></div>
            </div>
            <div class="headerInfoContainerSection">
              <div class="headerInfoContainerBox">
                <div>Patient ID: ${
                  pdfInfo?.pdfAllInfo?.patient_info?.id || ""
                }</div>
                <div>Doctor: ${
                  pdfInfo?.pdfAllInfo?.patient_info?.doctor?.name || ""
                }</div>
                <div>Email ID:   ${
                  pdfInfo?.pdfAllInfo?.patient?.email || ""
                }</div>
                <div>Date: ${pdfInfo?.pdfAllInfo?.date || ""}</div>
              </div>
            </div>
          </div>
          <div  style="height : ${tableHeight};" class="textContainerMain"> ${test?.tests
             ?.map(
               (testInfo, i) => `<div  class="textContainer">
          <div class="textContainerTexts">
           ${
             i == 0
               ? ` <span class="bigText">${
                   testInfo?.category?.name || ""
                 }</span>`
               : ""
           }
            <span class="midText">${testInfo?.testName || ""}</span>
          </div>
          <table>
            <tr >
              <th>Test</th>
              <th> Selected Result</th>
              <th>Unit</th>
              <th>Normal Range</th>
            </tr>
            
            ${testInfo?.testComponent?.testComponents
              ?.map(
                (val) => `<tr>
            <td>${val?.name || ""}</td>
            <td>${val?.result || ""}</td>
            <td>${val?.unit || ""}</td>
            
            <td>${val?.refRangeComment || ""}</td>

          </tr>`
              )
              .join("")}
           
            
            
          </table>
        </div>`
             )
             .join("")} </div>
          
          
        </div>
        
        <div class="signatureComponent">
       ${doctor
         ?.map(
           (doc) => `<div class="signatureSection">
           ${
             doc?.doctorSign
               ? ` <img
           width="100px"
           height="99px"
           src="${doc?.doctorSign}"
           alt=""
         />`
               : `<div style="height:6.3rem;"></div>`
           }
      
       <span>${doc?.doctorName || ""}</span>
       <span>${doc?.doctorPostion || ""}</span>
     </div>`
         )
         .join("")}
          
        </div>
        ${
          pdfInfo?.footer?.image
            ? `<div class="footerImgContainer">
          <img
            width="850px"
            height="60px"
            src="${pdfInfo?.footer?.image}"
            alt="img"
          />
        </div>`
            : ""
        }

      </container>`
         )
         .join("")}

      





      
      </body>
</html>`;
  return template;
};
