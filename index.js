const express = require('express'),
    app = new express(),
    request = require('request'),
    covidIndiaDataSource = 'https://api.covid19india.org/v4';

app.use(express.static('client'));
app.use('/', express.static('client/html'))
app.use('/js', express.static('client/js'));
app.use('/css', express.static('client/css'));
app.use('/webfonts', express.static('client/webfonts'))

const port = 8080;
app.listen(port, () => {
    console.log("Server started on port " + port);
})

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Request headers you wish to allow
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

app.get('/covid/india/timeseries', function (req, res) {

    request.get(covidIndiaDataSource + '/timeseries.json', {json: true}, (error, response, body) => {
        if (error) {
            return console.log('error:' + error);
        }

        res.send(body);
    });
});

app.get('/covid/india/summary/:summaryDate', function (req, res) {
    let summaryDate = req.params.summaryDate;
    let uri = covidIndiaDataSource + '/data-' + summaryDate + '.json';
    request.get(uri, {json: true}, (error, response, body) => {
        let responseJSON = JSON.parse(JSON.stringify(response));
        if (responseJSON.statusCode == 404) {
            res.send("No data found");
        } else {
            res.send(body);
        }
    });
});