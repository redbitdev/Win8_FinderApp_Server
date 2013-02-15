var dataTable;

$(document).ready(function() {
	$.getJSON('/api/tables', function(data) {
		$.each(data, function(key, val) {
			var li = '<li class="nav-header hidden-tablet">' + val + '</li>';
			li += '<li><a class="ajax-link" href="/view/' + val + '"><i class="icon-th"></i><span class="hidden-tablet">Data</span></a></li>';
			li += '<li><a class="ajax-link" href="/map/' + val + '"><i class="icon-globe"></i><span class="hidden-tablet">Map</span></a></li>';
			$('#sidebar-menu').append(li);
		});
	});
	var th = $('#table-header');

	if(th) {
		var tableName = th.data('tablename');
		console.log('looking up ' + tableName);
		$.getJSON("/api/data/" + tableName, function(data) {
			//first add the headers:
			th.append("<th></th>")
			for (param in data[0]) {
					var html = '<th class="sorting" role="columnheader">' + param + '</th>';
					th.append(html);
				};
			$.each(data, function(key, val) {
				var cls = key % 2 === 0 ? 'odd' : 'even';
				var html = '<tr class="' + cls + '">';
				html+= '<td><input type="checkbox" class="selector check" data-id="' + val.entityid + '" />';
				for( param in val ) {
					html += '<td>' + val[param] + '</td>'				
				}
				html += "</td>";
				$('#table-body').append(html);
			});

			dataTable = $('.datatable').dataTable({
				"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span12'i><'span12 center'p>>",
				"sPaginationType": "bootstrap",
				"oLanguage": {
				"sLengthMenu": "_MENU_ records per page"
				}
			} );
		});
	}

	var map = $('#map-canvas');

	if( map ) {

		$('#map-canvas').jump({'credentials': 'AvOW5Fz4QTsubTTdmaVnseeZnAQ0JYwbx_6zdMdgHk6iF-pnoTE7vojUFJ1kXFTP', 'enableSearchLogo': false }, function() {
			var self = this;
			var tableName = map.data('tablename');
			console.log('looking up ' + tableName);
			
			$.getJSON( "/api/data/" + tableName, function(response) {
				$.each( response, function(i, obj) {
					var location = new Microsoft.Maps.Location(obj.latitude, obj.longitude);
					self.addMarker({ 'location': location, 'bounds': true, 'title': obj.location } )
				});
			});
		});
	}

	$('#download-csv li a').click(function(e){
		e.preventDefault();
		var type = $(e.target).data('type');
		var table = $(e.target).data('tablename');


		var id = "";

		if(type === 'selected' ) {
			$.each(dataTable.fnGetNodes(), function(i, obj){
				var check = $(obj).find('.check');
				if($(check).is(":checked")) {
					id += $(check).data('id') + ",";
				}
			});
		}
		else if( type === 'visible') {
			$.each($('.check'), function(i, obj) {
				id += $(obj).data('id') + ",";
			})
		}

		window.open("/api/data/" + table + ".csv?ids=" + id);

	});
});