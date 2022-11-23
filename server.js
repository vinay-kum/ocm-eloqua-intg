const express = require("express");
const config = require("config");
const axios = require("axios");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const fs = require('fs');
const app = express();

app.get("/", (req, res) => {
  res.send("Success");
});

function replaceIdWithLink(html) {
  const newHTML = html.replace(
    /(\[\!\-\-\$CEC_DIGITAL_ASSET\-\-\])(.*?)(\[\/\!-\-\$CEC_DIGITAL_ASSET\-\-\])/g,
    function (contentId) {
      return (
        config.get("baseURL") +
        "content/published/api/v1.1/assets/" +
        contentId.match(/(?<=\-\-\])(.*?)(?=\[\/)/g) +
        "/native?channelToken=" +
        config.get("channelToken")
      );
    }
  );
  return newHTML;
}

//Start the server
app.listen(config.get("server.port"), () =>
  console.log("Example app is listening on port" + config.get("server.port"))
);

//Notification listener
app.post("/notify", jsonParser, (req, res) => {


  if (req.body.event.name === "CHANNEL_ASSETPUBLISHED") {


    const fields = req.body.entity.items[0].fields;
  

    //Call Eloqua API
    const eloquaURL = config.get("eloquaURL") + "assets/email";

    const headers = {
      headers: {
        Authorization: `Basic ${config.get("eloquaToken")}`,
        "Content-Type": "application/json",
      },
    };

    const eloquaData = {
      name: fields.email_name,
      subject: fields.subject,
      htmlContent: {
        type: "RawHtmlContent",
        html: replaceIdWithLink(fields.content),
      },
    };

    //Create Email in Eloqua
    axios
      .post(eloquaURL, eloquaData, headers)
      .then((response) => {
        let temp = response.data.fields;
      })
      .catch((err) => {

      });
  }
});

//Notify User
//Notification listener
app.post("/notifyUser", jsonParser, (req, res) => {
  console.log("Inside Notify user");

  //Get the Payload Content ID, name & other attributes
  // Fetch Email template content ID (get the content id from configuration)
  // Replace the Email template placeholder
  // Replace Content link to published channel link
  // Update Eloqua Email ID with new HTML
  // Create import job


  if (req.body.event.name === "CHANNEL_ASSETPUBLISHED") {
    console.log("inside event");

    const contentID = req.body.entity.items[0].id;
    const contentDetailURL =
      'https://sandbox-oce0002.ocecdn.oraclecloud.com/content/published/api/v1.1/items/' + contentID + '?channelToken=441492f10b9e4b4c8f4187a06e22ff7a';

    axios.get(contentDetailURL).then(resp => {

      updateEmailContent(resp.data);

    });

  }
});

function updateEmailContent(data){
   
  const fields = data.fields;

    //Call Eloqua API
    const eloquaURL = config.get("eloquaURL") + "assets/email/4826";

    const headers = {
      headers: {
        Authorization: `Basic ${config.get("eloquaToken")}`,
        "Content-Type": "application/json",
      },
    };

    const eloquaData = {
      id : "4826",
      subject: "New Content: " + fields.bp_asset_name,
      name : "New Content Update",
      htmlContent: {
        type: "RawHtmlContent",
        html: getEmailContent(data.id,fields)
      }
    };

    //Update Email in Eloqua
    axios
      .put(eloquaURL, eloquaData, headers)
      .then((response) => {
        let temp = response.data.fields;
        console.log(temp);
      })
      .catch((err) => {
        console.log("Error response from Eloqua request");
        console.log(err);
      });
}

function getEmailContent(contentId,data) {
  //Read Email template
  //Replace variables

  let emailContent = fs.readFileSync('./emailTemplate.html', 'utf8');


  emailContent = emailContent.replace('##OVERVIEW##', data.bp_asset_description);
  emailContent = emailContent.replace('##CONTENTID##', contentId);

  return emailContent;


}
