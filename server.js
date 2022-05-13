const express = require("express");
const config = require("config");
const axios = require("axios");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const app = express();

app.get("/", (req, res) => {
  res.send("Success");
});

//Start the server
app.listen(config.get("server.port"), () =>
  console.log("Example app is listening on port" + config.get("server.port"))
);

//Notification listener
app.post("/notify", jsonParser, (req, res) => {
  console.log("Inside Notify");
  console.log(req.body);

  if (req.body.event.name === "CHANNEL_ASSETPUBLISHED") {
    console.log("inside event")

    const fields = req.body.entity.items[0].fields;
    console.log(fields);

    //Call Eloqua API
    const eloquaURL = config.get("eloquaURL") + "assets/email";

    const headers = {headers : { 
      'Authorization': `Basic ${config.get("eloquaToken")}`,
      "Content-Type": "application/json"
  }};

    const eloquaData = {
      "name": fields.email_name,
      "subject": fields.subject,
      "htmlContent": {
        "type": "RawHtmlContent",
        "html": fields.content,
      },
    };

    //Create Email in Eloqua
    axios
      .post(eloquaURL, eloquaData,headers)
      .then((response) => {
        console.log("Response from Eloqua request");
        let temp = response.data.fields;
        res.send("Success");
        console.log(temp);
      })
      .catch((err) => {
        console.log(err);
        res.send("Success");
      });
  }
});
