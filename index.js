const express = require('express'),
    app = new express(),
    request = require('request'),
    covidIndiaDataSource = 'https://api.covid19india.org';

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

    request.get(covidIndiaDataSource + '/v4/timeseries.json', {json: true}, (error, response, body) => {
        if (error) {
            return console.log('error:' + error);
        }

        res.send(body);
    });
});

app.get('/covid/india/detailedSummary', function (req, res) {
    let effectiveDate = new Date();
    effectiveDate.setDate(new Date().getDate() - 1);
    let summaryDate = effectiveDate.toISOString().substring(0, 10);
    let uri = covidIndiaDataSource + '/v4/data-' + summaryDate + '.json';
    request.get(uri, {json: true}, (error, response, body) => {
        let responseJSON = JSON.parse(JSON.stringify(response));
        if (responseJSON.statusCode === 404) {
            effectiveDate.setDate(effectiveDate.getDate() - 1);
            summaryDate = effectiveDate.toISOString().substring(0, 10);
            uri = covidIndiaDataSource + '/v4/data-' + summaryDate + '.json';
            request.get(uri, {json: true}, (error, response, body) => {
                let responseJSON = JSON.parse(JSON.stringify(response));
                if (responseJSON.statusCode === 404) {
                    res.send("No data found");
                } else {
                    body['TT'].effectiveDate = summaryDate;
                    res.send(body);
                }
            });
        } else {
            body['TT'].effectiveDate = summaryDate;
            res.send(body);
        }
    });
});

app.get('/covid/india/nationalSummary', function (req, res) {
    let effectiveDate = new Date();
    effectiveDate.setDate(new Date().getDate() - 1);
    let summaryDate = effectiveDate.toISOString().substring(0, 10);
    let uri = covidIndiaDataSource + '/v4/data-' + summaryDate + '.json';
    request.get(uri, {json: true}, (error, response, body) => {
        let responseJSON = JSON.parse(JSON.stringify(response));
        if (responseJSON.statusCode === 404) {
            effectiveDate.setDate(effectiveDate.getDate() - 1);
            summaryDate = effectiveDate.toISOString().substring(0, 10);
            uri = covidIndiaDataSource + '/v4/data-' + summaryDate + '.json';
            request.get(uri, {json: true}, (error, response, body) => {
                let responseJSON = JSON.parse(JSON.stringify(response));
                if (responseJSON.statusCode === 404) {
                    res.send("No data found");
                } else {
                    let responseBody = body['TT'];
                    responseBody.effectiveDate = summaryDate;
                    res.send(responseBody);
                }
            });
        } else {
            let responseBody = body['TT'];
            responseBody.effectiveDate = summaryDate;
            res.send(responseBody);
        }
    });
});


app.get('/covid/india/testingFacility', function (req, res) {
    request.get(covidIndiaDataSource + '/state_test_data.json', {json: true}, (error, response, body) => {
        if (error) {
            return console.log('error:' + error);
        }

        let today = new Date();
        let todayString = today.getDate() + '/' + (today.getMonth() + 1).toString().padStart(2, '0') + '/' + today.getFullYear();
        let yesterdayString = (today.getDate() - 1) + '/' + (today.getMonth() + 1).toString().padStart(2, '0') + '/' + today.getFullYear();
        let responseBody = {};
        responseBody.states_tested_data = body.states_tested_data.filter(state => state.updatedon === todayString);
        if (responseBody.states_tested_data === undefined || responseBody.states_tested_data === null || responseBody.states_tested_data.length === 0) {
            responseBody.states_tested_data = body.states_tested_data.filter(state => state.updatedon === yesterdayString);
        }

        res.send(responseBody);
    });
});