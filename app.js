var express = require('express');
var app = express();
var serveStatic = require('serve-static');
var Spreadsheet = require('edit-google-spreadsheet');
var bodyParser = require('body-parser');
var Firebase = require("firebase");
var myFirebaseRef = new Firebase("https://scorching-torch-4370.firebaseio.com");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
// ---------------------------------
var credentials ={
   debug: true,
   oauth : {
      email: '882927279330-cakgq3nhk79i56gulmdelo783pjrrmjf@developer.gserviceaccount.com',
      keyFile: './auth/auth.pem'
    },
  spreadsheetId: '1QUq8v7RTUns3TTZgJdCS6V87lRvPN7rC23YIzWueBVA',
  worksheetId: "od6"
};

// 
myFirebaseRef.set({test: "It works!"});

// ---------------------------------
app.get("/meta", function (req, res) {
    Spreadsheet.load(credentials, function(err, spreadsheet) {
        getMeta(err, spreadsheet, res);
    });
});
app.get("/load", function (req, res) {
    Spreadsheet.load(credentials, function(err, spreadsheet) {
        getData(err, spreadsheet, res);
    });
});
app.post("/add", function (req, res) {
    console.log(req.body);
    var arr = [[req.body.venue, req.body.data, req.body.cachet, req.body.spese, req.body.diff]];
	Spreadsheet.load(credentials, function(err, spreadsheet) {
        writeData(err, spreadsheet, arr, res);
    });
});
function getMeta(err, spreadsheet, res) {
    if(err) throw err;
    spreadsheet.metadata(function(err, metadata){
      if(err) throw err;
      res.json(metadata);
    });
  }
function getData(err, spreadsheet, res){
    if(err) throw err;
    spreadsheet.receive({},function(err, rows, info) {
        if(err) throw err;
        res.json(rows);
    });
}
function writeData(err, spreadsheet, arr, res){
    if(err) throw err;
    spreadsheet.receive({},function(err, rows, info) {
        if(err) throw err;
        var obj = {};
        obj[info.nextRow] = { 1: arr};
        spreadsheet.add(obj);
        spreadsheet.send(function(err) {
            if(err) throw err;
            var message = {
                "status": "OK",
                "response" : "Aggiunta riga "+info.nextRow
            }
            res.json(message);
        });
    });
}
app.use(serveStatic('public', {'index': ['index.html']}));
app.listen(process.env.PORT);
console.log("Listening to "+process.env.PORT);