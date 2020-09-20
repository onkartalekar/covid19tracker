angular.module("app", ["chart.js", 'datatables'])
    // Optional configuration
    .config(['ChartJsProvider', function (ChartJsProvider) {
        // Configure all charts
        ChartJsProvider.setOptions({
            chartColors: ['#ff0000', '#008000', '#0000ff'],
            responsive: true
        });
        // Configure all line charts
        ChartJsProvider.setOptions('line', {
            showLines: true
        });
    }])
    .controller("CovidSummaryController", ['$scope', '$timeout', '$http', function ($scope, $timeout, $http) {

        $scope.tabs = [{
            href: "states",
            title: "States Level Data",
            isActive: true
        }, {
            href: "districts",
            title: "Districts Level Data",
            isActive: false
        }, {
            href: "testingFacility",
            title: "Testing Facility Data",
            isActive: false
        }];

        $scope.setActiveTab = function (index) {
            $scope.tabs.forEach(tab => tab.isActive = false);
            $scope.tabs[index].isActive = true;
        }

        $scope.shouldShowGraphForState = [];
        let effectiveDate = new Date();
        effectiveDate.setDate(new Date().getDate() - 1);
        $scope.statesLookup = {
            "AP": "Andhra Pradesh",
            "AR": "Arunachal Pradesh",
            "AS": "Assam",
            "BR": "Bihar",
            "CT": "Chhattisgarh",
            "GA": "Goa",
            "GJ": "Gujarat",
            "HR": "Haryana",
            "HP": "Himachal Pradesh",
            "JK": "Jammu and Kashmir",
            "JH": "Jharkhand",
            "KA": "Karnataka",
            "KL": "Kerala",
            "MP": "Madhya Pradesh",
            "MH": "Maharashtra",
            "MN": "Manipur",
            "ML": "Meghalaya",
            "MZ": "Mizoram",
            "NL": "Nagaland",
            "OR": "Odisha",
            "PB": "Punjab",
            "RJ": "Rajasthan",
            "SK": "Sikkim",
            "TG": "Telangana",
            "TN": "Tamil Nadu",
            "TR": "Tripura",
            "UT": "Uttarakhand",
            "UP": "Uttar Pradesh",
            "WB": "West Bengal",
            "AN": "Andaman and Nicobar Islands",
            "DN": "Dadra Nagar Haveli and Daman Diu",
            "DL": "Delhi",
            "PY": "Puducherry",
            "LA": "Ladakh",
            "CH": "Chandigarh"
        };

        $scope.showHideGraphForState = function (state) {
            $scope.shouldShowGraphForState[state] = !$scope.shouldShowGraphForState[state];
        };

        $scope.calculateRate = function (cases, confirmed) {
            if (cases === undefined || cases == null || confirmed === 0) {
                return '0%';
            }
            return Math.round(cases / confirmed * 10000) / 100 + '%';
        }

        //let apiContext = "https://vishwaroop.info";
        let apiContext = "http://localhost:8080";
        $http.get(apiContext + "/covid/india/timeseries")
            .then(function (data) {
                $scope.seriesData = {};
                $scope.labels = {};
                $scope.series = ['confirmed', 'recovered'];
                $scope.testedGraphSeries = ['tested'];
                $scope.deceasedGraphSeries = ['deceased'];
                $scope.statesFromTimeseries = Object.keys(data.data);
                let totalConfirmed = [], totalRecovered = [], totalDeceased = [], totalTested = [];

                for (const key in $scope.statesFromTimeseries) {
                    const state = $scope.statesFromTimeseries[key];
                    $scope.labels[state] = Object.keys(data.data[state].dates);

                    for (const date in data.data[state].dates) {
                        if (data.data[state].dates.hasOwnProperty(date)) {
                            const day = data.data[state].dates[date];

                            if (day.total) {
                                totalConfirmed.push(day.total.confirmed);
                                totalRecovered.push(day.total.recovered);
                                totalDeceased.push(day.total.deceased);
                                totalTested.push(day.total.tested);
                            }
                        }
                    }

                    if (state === 'TT') {
                        $scope.nationalSeriesData = [];
                        $scope.nationalTestedSeriesData = [];
                        $scope.nationalDeceasedSeriesData = [];
                        $scope.nationalSeriesData.push(totalConfirmed);
                        $scope.nationalSeriesData.push(totalRecovered);
                        $scope.nationalDeceasedSeriesData.push(totalDeceased);
                        $scope.nationalTestedSeriesData.push(totalTested);

                        $scope.nationalStats = {};
                        $scope.nationalStats.total = {
                            'recoveryRate': $scope.calculateRate(totalRecovered[totalRecovered.length - 1], totalConfirmed[totalConfirmed.length - 1]),
                            'mortalityRate': $scope.calculateRate(totalDeceased[totalDeceased.length - 1], totalConfirmed[totalConfirmed.length - 1])
                        };
                    } else {
                        $scope.seriesData[state] = [];
                        $scope.seriesData[state].push(totalConfirmed)
                        $scope.seriesData[state].push(totalRecovered);
                        $scope.seriesData[state].push(totalDeceased);
                    }

                    //reset
                    totalConfirmed = [];
                    totalRecovered = [];
                    totalDeceased = [];
                    totalTested = [];
                }

            }, function (error) {
                console.log(error);
            });

        let summaryDateParameter = effectiveDate.toISOString().substring(0, 10);
        $http.get(apiContext + "/covid/india/detailedSummary")
            .then(function (data) {
                $scope.effectiveDate = new Date(data.data['TT'].effectiveDate).toUTCString().substring(0, 16)
                fillSummaryData(data.data);
            }, function (error) {
                console.log(error);
            });

        $http.get(apiContext + "/covid/india/testingFacility")
            .then(function (data) {
                $scope.testingFacilityData = data.data.states_tested_data;
            }, function (error) {
                console.log(error);
            });

        function fillSummaryData(summary) {
            $scope.summary = summary;
            $scope.states = Object.keys(summary);

            $scope.states.forEach(state => {
                if (summary[state].meta) {
                    $scope.summary[state].population = summary[state].meta.population;
                }
                if($scope.summary[state].total) {
                    $scope.summary[state].total.testingRate = $scope.calculateRate(summary[state].total.tested, summary[state].population);
                    $scope.summary[state].total.confirmedRate = $scope.calculateRate(summary[state].total.confirmed, summary[state].total.tested);
                    $scope.summary[state].total.recoveryRate = $scope.calculateRate(summary[state].total.recovered, summary[state].total.confirmed);
                    $scope.summary[state].total.mortalityRate = $scope.calculateRate(summary[state].total.deceased, summary[state].total.confirmed);
                }

                if (state !== 'TT') {
                    $scope.summary[state].districtNames = Object.keys(summary[state].districts);
                    $scope.summary[state].districtNames.forEach(district => {
                        if (summary[state].districts[district]) {
                            if (summary[state].districts[district].meta) {
                                $scope.summary[state].districts[district].population = summary[state].districts[district].meta.population;
                            }
                            if (summary[state].districts[district].total) {
                                $scope.summary[state].districts[district].total.recoveryRate = $scope.calculateRate(summary[state].districts[district].total.recovered, summary[state].districts[district].total.confirmed);
                                $scope.summary[state].districts[district].total.mortalityRate = $scope.calculateRate(summary[state].districts[district].total.deceased, summary[state].districts[district].total.confirmed);
                            }
                        } else {
                            $scope.summary[state].districts[district].total = {
                                'confirmed': null,
                                'deceased': null,
                                'recovered': null,
                                'recoveryRate': null,
                                'mortalityRate': null
                            };
                        }
                        if (!summary[state].districts[district].delta) {
                            $scope.summary[state].districts[district].delta = {
                                'confirmed': null,
                                'deceased': null,
                                'recovered': null
                            };
                        }
                    });
                }
            });
        }

        $scope.formatNumberToString = function (number, isSignedNumber) {
            if (number === undefined || number == null || number === 0 || number === '') {
                return '-';
            }

            let formattedString;
            let sign = '';
            if (isSignedNumber) {
                sign = number < 0 ? '-' : '+';
            }
            number = Math.abs(number);
            let quotient = Math.floor(number / 1000);
            let reminder = number % 1000;

            if (quotient > 0) {
                formattedString = ',' + reminder.toString().padStart(3, '0');

                reminder = quotient % 100;
                quotient = Math.floor(quotient / 100);

                if (quotient > 0) {
                    formattedString = ',' + reminder.toString().padStart(2, '0') + formattedString;

                    reminder = quotient % 100;
                    quotient = Math.floor(quotient / 100);

                    if (quotient > 0) {
                        formattedString = ',' + reminder.toString().padStart(2, '0') + formattedString;

                        reminder = quotient % 100;
                        quotient = Math.floor(quotient / 100);

                        if (quotient > 0) {
                            formattedString = ',' + reminder.toString().padStart(2, '0') + formattedString;

                            reminder = quotient % 100;
                            quotient = Math.floor(quotient / 100);

                            if (quotient > 0) {
                                return 'large number';
                            } else {
                                return sign + reminder + formattedString;
                            }
                        } else {
                            return sign + reminder + formattedString;
                        }
                    } else {
                        return sign + reminder + formattedString;
                    }
                } else {
                    return sign + reminder + formattedString;
                }

            } else {
                return sign + reminder.toString();
            }
        }

    }]);
