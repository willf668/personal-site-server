const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const basicAuth = require('express-basic-auth');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');

const publicIp = require('public-ip');
let IPV4 = "POOP";
publicIp.v4().then(ip => {
    IPV4 = ip;
});

let options = {};
let sitePort=443, apiPort=8443;
try {
    options.key = fs.readFileSync('./ssl/example.key');
    options.cert = fs.readFileSync('./ssl/example.crt');
}
catch {
    console.log("No SSL files found, falling back to HTTP");
    sitePort=80;
    apiPort=5000;
}

let auth = "";
fs.readFile(__dirname + '/password.txt', function (err, data) {
    if (err) {
        throw err;
    }
    let userPass = "admin:" + data.toString();
    auth = Buffer.from(userPass).toString("base64");
});

const reactApp = express();
const reactDir = (process.argv.length > 2 ? process.argv[2] : path.resolve("../personal-site-21/"));
reactApp.use(express.static(path.join(reactDir, 'build')));
reactApp.get('*', function (req, res) {
    res.sendFile(reactDir + "/build/index.html");
});
https.createServer(options, reactApp).listen(sitePort);

const apiApp = express();
apiApp.use(cors({
    origin: '*'
}));
apiApp.use((req, res, next) => {
    if (auth != req.headers.authorization) {
        res.send({ data: false });
        return;
    }
    return next();
});
apiApp.get('/reset', function (req, res) {
    exec('/home/pi/website_update.sh');
});
apiApp.get('/ip', function (req, res) {
    res.send({ data: IPV4 });
});
https.createServer(options, apiApp).listen(apiPort);