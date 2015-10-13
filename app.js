var express = require('express');
var app = express();
var serveStatic = require('serve-static');
var Spreadsheet = require('edit-google-spreadsheet');
var bodyParser = require('body-parser');
var credentials = require('./private/credentials.js');
var gdrive = require('./spreadsheet.js');
var fBase = require('./firebase.js');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(serveStatic('public'));
app.listen(process.env.PORT);
var appData = {};
appData.ractive = {};
appData.ractive.gigs = [];
appData.splineData = [];
appData.columnData = [];
appData.pieData = [];

// DEFINE A SIMPLE API THAT RETURNS JSON -------------------------------------------------
app.get("/meta", function (req, res) {
    Spreadsheet.load(credentials, function(err, spreadsheet) {
        gdrive.getMeta(err, spreadsheet, res);
    });
});
app.get("/load", function (req, res) {
    Spreadsheet.load(credentials, function(err, spreadsheet) {
        gdrive.getData(err, spreadsheet, res);
    });
});
app.post("/add", function (req, res) {
    var arr = [[req.body.venue, req.body.data, req.body.cachet, req.body.spese, req.body.diff]];
	Spreadsheet.load(credentials, function(err, spreadsheet) {
        gdrive.writeData(err, spreadsheet, arr, res);
    });
});
app.get("/graph", function (req, res) {
    res.json(appData);
});

var convert = function(input){
  // change dots in commas
  var out = parseInt(input.toString().replace('.', ''), 10);
  return out;
};
// ---------------------------------------------------
var init = function(){
    var lastModified;
    // first get last modified data via spreadsheet metadata
    Spreadsheet.load(credentials, function(err, spreadsheet) {
        if(err) throw err;
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            lastModified = Date.parse(metadata.updated);
            console.log('last modified on gdrive: ', lastModified);
        });
    });
    //than compare the one saved on firebase
    fBase.db.child("lastModified").on("value", function(data){
        var newModDate = data.val();
        console.log('last modified on firebase: ', newModDate);
        //if(newModDate !== lastModified){
            // get full content from gdrive and update firebase
            Spreadsheet.load(credentials, function(err, spreadsheet) {
                if(err) throw err;
                spreadsheet.receive({getValues: true}, function(err, obj, info) {
                    if(err) throw err;
                    // PROCESS DATA from SPREADSHEET to get some usable figures
                    // **********************************************************
                        //appData.now = new Date();
                        // 1. store total values in graph obj

                        var total_IN = convert(obj[2]['5']);
                        var total_OUT= convert(obj[2]['6']);
                        var total_NET = convert(obj[2]['7']);
                        appData.pieData.push({name: 'IN', y: total_IN});
                        appData.pieData.push({name: 'OUT', y: total_OUT});

                        // stats ...........................
                        appData.ractive.mnin = total_IN;
                        appData.ractive.mnout = total_OUT;
                        appData.ractive.total = total_NET;

                        // 2. get rid of first 2 spreadsheet rows (heading and totals)
                        obj['1'] = null;
                        obj['2'] = null;
                        delete obj['1'];
                        delete obj['2'];

                        // 3. get x axis figures and store in graph obj
                        var tmpTotal = 0;
                        var venue;
                        for(var prop in obj){
                           var innerObj = obj[prop];
                           var tmpObjSpline = {};
                           var tmpObjColumn = {};
                           var date = innerObj['1'];
                           // if there's a venue ok, otherwise use notes field
                           var venue = (innerObj['3'] != '-' && innerObj['3'] !='') ? innerObj['3'] : innerObj['9'];
                           var location = innerObj['4'];
                           var cachet = (innerObj['5']) || 0;
                           var expenses = (innerObj['6']) || 0;
                           var net = convert(innerObj['7']);
                           var color = (net < 0) ? 'red' : ((net > 0) ? 'green' : '');
                           console.log(net);
                           tmpTotal += net;
                           tmpObjSpline.name = date+'<br><strong>'+venue+'</strong><br>'+location+'<br>Cachet:'+cachet+'€ Expenses:'+expenses+'€';
                           tmpObjSpline.y =tmpTotal;
                           tmpObjColumn.name = date+'<br><strong>'+venue+'</strong><br>'+location+'<br>Cachet:'+cachet+'€ Expenses:'+expenses+'€';
                           tmpObjColumn.y =net;
                           tmpObjColumn.color = (net < 0) ? 'red' : null;

                           appData.splineData.push(tmpObjSpline);
                           appData.columnData.push(tmpObjColumn);
                           // inverted array
                           appData.ractive.gigs.unshift({venue: venue, location: location, net: net, notes: innerObj['9'], color: color});

                        }
                    // **********************************************************
                    fBase.db.set({
                        lastModified: lastModified,
                        spreadsheetObj: obj
                    });
                    //console.log("firebase updated");
                });
            });
       // }
        // get full content from firebase
        fBase.db.child("spreadsheetObj").on("value", function(data){
            var model = data.val();
            //console.log(model);
        });
    });
}
// Bootstrappa tuttecose... -------------------------
init();