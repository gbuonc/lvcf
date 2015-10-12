var Firebase = require("firebase");
var fbs = new Firebase("https://scorching-torch-4370.firebaseio.com");

exports.setModDate = function(date){
    fbs.set({lastModified: date});
}
exports.db = fbs;