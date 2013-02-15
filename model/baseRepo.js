var mongoose = require('mongoose');
// get free mongo db @ www.mongolab.com
var path = 'mongodb://YOUR-MONGO-DB-CONNECTION-STRING';
module.exports = {
	_db: null,
	init: function() {
		if(!module.exports._db) {

			module.exports._db = mongoose.connect(path);

		}
		return module.exports._db;
	}
}