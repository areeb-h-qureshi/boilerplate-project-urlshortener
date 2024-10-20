require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('dns')

let urlDatabase = {};
let urlCounter = 1;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  let original_url = req.body.url;
  let parsedUrl;
  try {
    parsedUrl = new URL(original_url);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  let hostname = parsedUrl.hostname;

// Check if the hostname can be resolved
dns.lookup(hostname, function (err, address, family) {
  if (err) {
    // Hostname could not be resolved
    return res.json({ error: 'invalid url' });
  } else {
    // Check if the URL already exists in the database
    let existingEntry = Object.entries(urlDatabase).find(
      ([key, value]) => value.original_url === original_url
    );

    if (existingEntry) {
      // URL already exists; return existing short_url
      return res.json({
        original_url: existingEntry[1].original_url,
        short_url: existingEntry[0],
      });
    }

    // URL is valid and new; add to database
    let short_url = urlCounter++;
    urlDatabase[short_url] = { original_url: original_url };

    res.json({ original_url: original_url, short_url: short_url });
  }
});
});

app.get('/api/shorturl/:short_url', function (req, res) {
let short_url = req.params.short_url;
let entry = urlDatabase[short_url];

if (entry) {
  res.redirect(entry.original_url);
} else {
  res.json({ error: 'No short URL found for the given input' });
}
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
