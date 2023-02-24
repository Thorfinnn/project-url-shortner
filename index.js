require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const UrlSchema = new mongoose.Schema({
  url: String,
  shortened_url: Number
});

var Url = new mongoose.model('Url', UrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.set('json spaces', 2);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


app.post('/api/shorturl', urlencodedParser, (req, res) => {

  const requrl = req.body.url;
  let isTrue = checkUrl(requrl.toString());
    if (!isTrue) {
      return res.json({
        error: "invalid url"
      });
    }
    Url.exists({ url: requrl }, (err, dat) => {
      if (err) return console.log(err);
      else if (!dat) {
        Url.find({ shortened_url: { $gte: 0 } }).sort({ shortened_url: -1 }).limit(1).exec((err, data) => {
          if (err) return console.log(err);
          urlmodel = new Url({
            url: requrl,
            shortened_url: parseInt(data[0].shortened_url) + 1
          });
          urlmodel.save((err, d) => {
            if (err) console.log(err);
          });
          return res.json({
            original_url: requrl,
            short_url: parseInt(data[0].shortened_url) + 1
          });
        });
      } else {
        Url.find({ url: requrl }, (err, dat) => {
          if (err) return console.log(err);
          else return res.json({
            original_url: requrl,
            short_url: parseInt(dat[0].shortened_url)
          });

        });
      }
    });
});

app.get('/api/shorturl/:url', urlencodedParser, (req, res) => {
  const shorturl = req.params.url;

  Url.exists({ shortened_url: parseInt(shorturl) }, (err, result) => {
    if (err) return console.log(err);
    else if (result) {
      Url.find({ shortened_url: parseInt(shorturl) }, (err, data) => {
        if (err) return console.log(err);
        return res.redirect(data[0].url);
      });
    } else {
      return res.json({
        error: 'invalid url'
      });
    }
  });

});

var checkUrl = (urlString) =>{
  try{
    let url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  }catch(error){
    return false;
  }
}


