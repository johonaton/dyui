;(function ($,window,document,undefined) {
//HELPERS /////////////////////////////////////////////////////////////////////
    function makeForm(element){
          var result;
          if(element.parts){
            result = document.createElement('fieldset');
            var legend = document.createElement('legend');
            legend.innerHTML = element.label || '';
            result.appendChild(legend);
            for(var part in element.parts){
              element.parts[part].label = element.parts[part].label || part;
              result.appendChild(makeForm(element.parts[part]));
            }
          } else {
            result = document.createElement('p');
            var label = document.createElement('label');
            var field;
            label.innerHTML = element.label || '';
            switch(element.type){
              case "select":
                field = document.createElement('select');
                if(element.values && element.values instanceof Array){
                  element.values.map(function(value){
                    var op = document.createElement('option');
                    op.innerHTML = value;
                    op.setAttribute("value",value);
                    field.appendChild(op);
                  });
                }
                if(element.value) {
                	field.value = element.value;
                	field.setAttribute("value",element.value);
                }
              break;
              case "radio":
              break;
              case "textarea":
            	 field = document.createElement('textarea');
            	 if(element.cols)field.setAttribute("cols",element.cols);
            	 if(element.rows)field.setAttribute("rows",element.rows);
            	 if(element.value) {
                 	field.innerHTML=element.value;
                 }
              break;
              default: //default is "text" 
                field = document.createElement('input');
                field.setAttribute("type","text");
                if(element.value) {
                	field.value = element.value;
                	field.setAttribute("value",element.value);
                }
              break;
            }
            field.setAttribute("name",element.name);
            result.appendChild(label);
            result.appendChild(field);
            if(element.optional){
                $(label).addClass('optional');
                $(label).click(function(e){
                   if($(field).attr('disabled')){
                       $(field).removeAttr('disabled');
                   }else {
                       $(field).attr('disabled','disabled');
                    }
                });
                $(field).attr('disabled','disabled');
            }
          }
          
          return result;
    }
//INPUTS //////////////////////////////////////////////////////////////////////
    function Form(options){
        var form = document.createElement('form');
        var $self = $(this);
        $(form).submit(function(e){
        	e.preventDefault(); 
        	return false;
        }); //suppress default submit

        for(var p in options.parts){
            var part = options.parts[p];
            part.label = part.label || p;
            form.appendChild(makeForm(part));
        }
        //form.appendChild(makeForm(options));
        $self.append(form);

        return {
            run: function(callback){
                var data = $(form).serializeArray();
                if(callback && callback instanceof Function){
                    callback(data);
                }
            },
            reset: function(){
                form.reset();
            },
            destroy: function(){
                $(form).remove();
            }
        };
    }
//OUTPUTS /////////////////////////////////////////////////////////////////////
    function Banner() {
        var banner = document.createElement("p");
        var $self = $(this);
        var options = arguments[0];
        $self.append(banner);
        if(options.background){
            $(banner).css("background",options.background);
        }
        $(banner).addClass("banner");
        var labels = {};
        for (var bind in options.binds) {
            var l = document.createElement("span");
            var options = options.binds[bind];
            var color;
            if(typeof options.binds[bind] === 'object'){
                color = options.binds[bind];
            } else if (typeof options.binds[bind] === 'string'){
                color = options.binds[bind].color || "black";
            }
            l.setAttribute("style", "color:" + options.binds[bind] + ";");
            banner.appendChild(l);
            labels[bind] = l;
        }

        return {
            run: function(data){
                for(var bind in options.binds) {
                    labels[bind].innerHTML = bind + ": " + d[bind] + (options.units || "") + " ";
                }
            },
            reset: function(){
                $(banner).text('');
            },
            destroy: function(){
                $(banner).remove();
            }
        };
    }
    function Table() {
        var table = document.createElement("table");
        var options = arguments[0];
        var $self = $(this);
        $self.append(table);
        var rows = {};
        var labels = {};
        var vals = {};
        for (var bind in options.binds) {
            rows[bind] = document.createElement("tr");
            labels[bind] = document.createElement("th");
            labels[bind].innerHTML = bind;
            vals[bind] = document.createElement("td");
            rows[bind].appendChild(labels[bind]);
            rows[bind].appendChild(vals[bind]);
        }

        return {
            run: function(data){
                table.innerHTML = "";
                for (var bind in options.binds) {
                	if(data[bind] !== undefined){
                        vals[bind].innerHTML = data[bind];
                        table.appendChild(rows[bind]);
                	}
                }
            },
            reset: function(){
                table.innerHTML = "";
            },
            destroy: function(){
                $(table).remove();
            }
        };
    }
//FILTERS /////////////////////////////////////////////////////////////////////
    function ArrayToObject(){
        var options = arguments[0];
        return {
            run: function(data,callback){
                var a = data;
                var o = {};
                for (var i in a){
                    var v = a[i];
                    var path = v.name.split(options.delimiter);
                    var depth = path.length;
                    var scope = o;
                    for (var p in path){
                        var node = path[p];
                        if(scope[node] === undefined){
                            scope[node]= depth>1?{}:v.value;
                        } //TODO: handle multiple to array conversions
                        scope=scope[node];
                        depth--;
                    }
                }
                callback(o);
            }
        };
    }

///////////////////////////////////////////////////////////////////////////////
    $.fn.dyui("register",{
        input: {
            form : Form,
        },
        output: {
            table: Table,
        },
        filter: {
            arrayToObject: ArrayToObject,
            array_to_object: ArrayToObject,
            arr_to_obj: ArrayToObject
        }
    });
})(jQuery,window,document);

