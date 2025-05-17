const web = require("./website/web.js");
const webhook = require("./webhook.js");
const parser = require("body-parser");
const express = require("express");
const path = require("path");
const app = express();
const monitor = require('./modules/scripts/utils/monitor');

app.use(parser.json());
app.use(express.static("website"));
app.get("/config.json", (req, res) => {
  res.sendFile(path.join(__dirname, "config.json"));
});

app.get("/", (req, res) => {
  web.html(res);
});

app.get("/webhook", (req, res) => {
  web.verify(req, res);
});

setTimeout(() => {
  app.post("/webhook", (req, res) => {
    webhook.listen(req.body);
    res.sendStatus(200);
  });
}, 5000);

// Start the bot
async function startBot() {
    try {
        // Start system monitoring (updates every 5 seconds)
        monitor.start();
        
        // ... rest of your startup code ...
    } catch (error) {
        console.error('Failed to start bot:', error);
    }
}

app.listen(8080, () => {
  web.log();
   //startBot(); // Uncomment this line to start the bot monitoring
});