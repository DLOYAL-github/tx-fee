const express = require("express")
const { chromium } = require("playwright-chromium")
const { firefox } = require("playwright-firefox")

const app = express()
app.use(express.static("./public"))
const port = process.env.PORT || 3000;

app.get("/fee-in-usk", async (req, res) => {

  res.writeHead(200, { "Content-Type": "text/plain" });

  // Send the response body "Hello World"
  res.end("working...");

}); 
 
app.get("/:hash", async (req, res) => {
  
  const browserName = req.query.browser|| "chromium";
  const hash = req.params["hash"]; 
    if (!["chromium", "firefox"].includes(browserName)) {
      return res.status(500).send(`invalid browser name (${browserName})!`)
    }
    const url = "https://finder.kujira.network/kaiyo-1/tx/"+hash;
    
    const ResultsSelector = '#root > div > div.container.explore > div.md-row.pad-tight.wrap > div:nth-child(1) > div > table > tbody > tr:nth-child(6)';
  
    const waitUntil = ResultsSelector || "load";
  
    const width = req.query.width ? parseInt(req.query.width, 10) : 1920;
    const height = req.query.height ? parseInt(req.query.height, 10) : 1080;
    console.log(`Incoming request for browser '${browserName}' and URL '${url}'`)
    try {
      
      const browser = await { chromium, firefox }[browserName].launch({
        chromiumSandbox: false, headless: true
      })
      let page = await browser.newPage()
      await page.goto(url, {
        timeout: 10 * 1000
      })
      if (req.query.timeout) {
        await page.waitForTimeout(parseInt(req.query.timeout, 10))
      }
      const data2 = await page.screenshot({type: "png"});
      await page.waitForSelector("#root > div > div.container.explore > div.md-row.pad-tight.wrap > div:nth-child(1) > div > table > tbody > tr:nth-child(6)");
        
      
      // Extract the results from the page.
      const data = await page.evaluate(() => {
        const data = document.querySelector("#root > div > div.container.explore > div.md-row.pad-tight.wrap > div:nth-child(1) > div > table > tbody > tr:nth-child(6)").innerText.split(":")[1];
  
        // Define a regular expression pattern to match numeric values and units
        const regex = /(\d+)\n([A-Za-z0-9]+)/g;
        
        // Initialize an object to store the data
        const dataArray = {};
        
        // Use a loop to iterate over matches found by the regular expression
        let match;
        while ((match = regex.exec(data)) !== null) {
          const numericValue = match[1];
          const unit = match[2];
        
          // Check if the unit already exists in the object
          if (dataArray[unit]) {
            // If it exists, push the new numeric value to the array
            dataArray[unit].push(numericValue);
          } else {
            // If it doesn't exist, create a new array with the numeric value
            dataArray[unit] = [numericValue];
          }
        }  
          return dataArray;

        });
  
      await browser.close()
  
      res.send(data);
    } catch (err) {
      res.status(500).send(`Something went wrong: ${err}`)
    }

});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});