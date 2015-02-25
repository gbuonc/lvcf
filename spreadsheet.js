module.exports = {
    getMeta : function(err, spreadsheet, res) {
        if(err) throw err;
        spreadsheet.metadata(function(err, metadata){
          if(err) throw err;
          res.json(metadata);
        });
    },
    getData: function(err, spreadsheet, res){
        if(err) throw err;
        spreadsheet.receive({},function(err, rows, info) {
            if(err) throw err;
            res.json(rows);
        });
    },
    writeData: function (err, spreadsheet, arr, res){
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
}