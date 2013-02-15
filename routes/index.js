var util = require('util'),
	fs = require('fs'),
	easyxml = require('easyxml'),
	LINQ = require('node-linq').LINQ,
	RSS = require('rss'),
	csv = require('express-csv'),
	poi = require('../model/poi'),
	config = require('../config'),
	dataTable = require('../model/dataTable');

easyxml.configure({
  singularizeChildren: true,
  underscoreAttributes: true,
  rootElement: 'response',
  dateFormat: 'ISO',
  indent: 2,
  manifest: true
});

exports.index = function(req, res) {
	res.render('index', {
		title: 'Express',
		user: req.user
	});
};

exports.login = function(req, res) {
	res.render('login', {
		layout: null
	});
}

exports.upload = function(req, res) {
	res.render('upload', {
		user: req.user
	});
}

exports.view = function(req, res) {
	res.render('view', {
		user: req.user,
		tableName: req.params.tableName
	});
}

exports.map = function(req, res) {
	res.render('map', {
		user: req.user,
		tableName: req.params.tableName
	});
}

exports.add = function(req, res) {
	res.render('add', {
		user: req.user
	});
}

exports.uploadPost = function(req, res) {
	fs.readFile(req.files.fileInput.path, 'utf8', function(err, data) {
		if(err) throw err;

		var tableName = req.body.datasetName.replace(' ', '_');
		var path = req.body.pathToItems.split(',');
		var json = JSON.parse(data);

		var arr = json;

		if(req.body.pathToItems && req.body.pathToItems.length > 0) {
			for(var j = 0; j < path.length; j++) {
				arr = arr[path[j]];
			}
		}

		for(var i = arr.length - 1; i >= 0; i--) {
			poi.addPoiToDb(tableName, arr[i]);
		};

		dataTable.add(tableName, req.user);

		res.render('uploaded', {
			user: req.user,
			fileName: req.files.fileInput.name,
			recordsAdded: arr.length,
			tableName: tableName
		});
	});
};

exports.select = function(req, res) {
	var format = req.params.format;
	if(!format) format = 'json';

	var tableName = req.params.tableName;

	if(format === "csv" && req.query.ids) {
		try
		{
			poi.getByIds(tableName, req.query.ids.split(','), function(err, pois) {
				var ret = new LINQ(pois).Select(function(p) {
					return p.data
				});
				return res.csv(ret.items);
			});
		}
		catch(err) { console.log(err ); }
	}
	else {
		poi.getAll(tableName, function(err, pois) {
			var ret = new LINQ(pois).Select(function(p) {
				return p.data
			});
			if( format === "xml") {
				res.header('Content-Type', 'text/xml');
	            var xml = easyxml.render({ results: ret.items });
	            return res.send(xml);
			}
			else if(format === "csv") {
				return res.csv(ret.items);
			}
			else if(format === "rss") {
				res.header('Content-Type', 'text/xml');
	            /* lets create an rss feed */
				var feed = new RSS({
				        title: config.appTitle,
				        description: 'Details of the ' + tableName + ' data collection.',
				        feed_url: 'http://' + req.host + '/api/data/' + tableName + '.rss',
				        site_url: 'http://' + req.host,
				       // image_url: 'http://example.com/icon.png',
				       // author: 'Dylan Greene'
				    });

				/* loop over data and add to feed */
				new LINQ(ret.items).Select(function(p) {
					feed.item({
					    title:  p.location,
					    description: p.location + ' is found at ' + p.address,
					});
				});
				
	            return res.send(feed.xml());
			}
			return res.json(ret.items);
		});
	}
}

exports.tables = function(req, res) {
	var dataTables = dataTable.getAll(function(err, tables) {
		var ret = new LINQ(tables).Select(function(p) {
			return p.name
		});
		return res.json(ret.items);
	});
}