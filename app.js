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
    console.log(req.body);
    var arr = [[req.body.venue, req.body.data, req.body.cachet, req.body.spese, req.body.diff]];
	Spreadsheet.load(credentials, function(err, spreadsheet) {
        gdrive.writeData(err, spreadsheet, arr, res);
    });
});

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
        if(newModDate !== lastModified){
            // get full content from gdrive and update firebase
            Spreadsheet.load(credentials, function(err, spreadsheet) {
                if(err) throw err;
                spreadsheet.receive({},function(err, obj, info) {
                    if(err) throw err;
                    console.log(obj);
                    fBase.db.set({
                        lastModified: lastModified,
                        spreadsheetObj: obj
                    });
                    console.log("firebase updated");
                });
            });
        }
        // get full content from firebase
        fBase.db.child("spreadsheetObj").on("value", function(data){
            var model = data.val();
            console.log(model);
        });
    });
}
// Bootstrappa tuttecose... -------------------------
init();