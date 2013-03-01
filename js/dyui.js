;(function ($,window,document,undefined) {
    function HexToRGB(HEX) {
        function hexToR(h) {
            return parseInt((cutHex(h)).substring(0, 2), 16);
        }

        function hexToG(h) {
            return parseInt((cutHex(h)).substring(2, 4), 16);
        }

        function hexToB(h) {
            return parseInt((cutHex(h)).substring(4, 6), 16);
        }

        function cutHex(h) {
            return (h.charAt(0) == "#") ? h.substring(1, 7) : h;
        }
        var R = hexToR(HEX);
        var G = hexToG(HEX);
        var B = hexToB(HEX);
        return {
            R: R,
            G: G,
            B: B
        };
    }

    function serializeForm(form){
        var o = {};
        var a = $(form).serializeArray();
        
        $.each(a,function(i,v){
            var path = v.name.split(".");
            var depth = path.length;
            var scope = o;
            $.each(path,function(){
                if(scope[this] === undefined){
                    scope[this]= depth>1?{}:v.value;
                }
                scope=scope[this];
                depth--;
            });
        });
        return o;
    }
    
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
              break;
              default: //default is "text" 
                field = document.createElement('input');
                field.setAttribute("type","text");
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
            }
          }
          
          return result;
    }
    
    function Input(submit, reset, exit) {
        this.submit = submit;
        this.reset = reset;
        this.exit = exit;

        var itvl = -1;
        this.start = function (poll, interval) {
            itvl = setInterval(poll, interval);
        };
        this.stop = function () {
            clearInterval(itvl);
            itvl = -1;
        };
    }

    function Output(update, reset, exit) {
        this.update = update;
        this.reset = reset;
        this.exit = exit;
    }
  
  
    function Form($target,options){
        var form = document.createElement('form');
        form.onsubmit = function(e){e.preventDefault; return false;} //suppress default submit
        for(var p in form.parts){
            var part = form.parts[p];
            form.appendChild(makeForm(part));
        }
        //form.appendChild(makeForm(options));
        $target.append(form);
        return new Input(
          function(callback){
            var data = serializeForm(form);
            if(options.submit && options.submit instanceof Function) options.submit(data);
            if(callback && callback instanceof Function) callback(data);
          },
          function(){
            form.reset();
          },
          function(){
            $target[0].removeChild(form);
          }
        );
    }

    function Line($target, options) {
        var c = document.createElement('canvas');
        $target.append(c);
        var colors = {};
        var data = {};
        var maxScale = 1;
        var minScale = 0;
        var max_age = options.max_age || 10000; //maximum age in milliseconds
        for (var bind in options.binds) {
            colors[bind] = HexToRGB(options.binds[bind]);
            data[bind] = [];
        }

        function init(p) {
            var W = (options.width || $target[0].offsetWidth);
            var H = (options.height || 100);
            p.setup = function () {
                p.size(W, H);
            };
            p.draw = function () {
                p.smooth();
                var w = (options.width || $target[0].offsetWidth);
                var now = (new Date()).getTime();
                if (W != w) {
                    W = w;
                    p.size(w, H); //resize only when width changes
                }
                p.background(0);
                if (options.tick) {
                    var interval = p.width / (max_age / options.tick);
                    var ticks = p.width / interval + 1;
                    var offset = -(now % options.tick) * (interval * 1.0 / options.tick);
                    p.stroke(p.color(75));
                    p.strokeWeight(1);
                    var zero = p.height + (minScale / (maxScale - minScale)) * p.height;
                    p.line(0, zero, p.width, zero);
                    for (var i = 0; i < ticks; i++) {
                        var tick = i * interval + offset;
                        p.line(tick, 0, tick, p.height);
                    }
                }

                for (var field in data) {
                    var pts = data[field];
                    var rgb = colors[field];
                    var color = p.color(rgb.R, rgb.G, rgb.B);
                    p.noFill();
                    p.smooth();
                    p.stroke(color);
                    p.strokeWeight(3);
                    p.strokeJoin("ROUND");
                    p.beginShape();
                    var lx,ly;
                    var x,y;
                    for (var pt in pts) {
                        var dat = pts[pt];
                        var timescale = max_age / p.width;
                        x = p.width - (now - dat.time - (options.delay || 0)) / timescale;
                        y = p.height - (((Number(dat.val) - minScale) / (maxScale - minScale)) * p.height);
                      
                      if(pt > 0 && options.interpolation == "bezier"){
                        p.bezierVertex((lx + x) / 2, ly, (lx + x) / 2, y, x, y);
                      } else { 
                        p.vertex(x, y);
                      }
                        lx = x;
                        ly = y;
                    }
                    p.endShape();
                    p.fill(220);
                    p.text(Math.round(maxScale) + (options.units || ""), 10, 12);
                    p.text(Math.round(minScale) + (options.units || ""), 10, p.height - 2);
                }
            };
        }
        var p_instance = new Processing(c, init);
        return new Output(

        function (d) { //updater
            var now = (new Date()).getTime();
            for (var bind in data) {
                var val = d[bind];
                data[bind].push({
                    time: now, //add a timestamp for x scaling 
                    val: val
                });
            }
            //recalculate scaling bounds
            maxScale = 1;
            minScale = 0;
            for (bind in data) {
                //remove oldest points
                while ((now - data[bind][0].time) > max_age + (options.delay || 0) + (max_age * 0.1)) {
                    data[bind] = data[bind].slice(1); //slice off oldest
                }
                for (var point in data[bind]) {
                    var pt = data[bind][point];
                    if (Number(pt.val) > maxScale) maxScale = pt.val;
                    if (Number(pt.val) < minScale) minScale = pt.val;
                }
            }

        },

        function () { //exit
            p_instance.exit();
        });
    }

    function Table($target, options) {
        var table = document.createElement("table");
        $target.append(table);
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
        return new Output(

        function (d) {
            table.innerHTML = "";
            for (var bind in options.binds) {
                vals[bind].innerHTML = d[bind];
                table.appendChild(rows[bind]);
            }
        },

        function () {
            table.innerHTML = "";
        });
    }

    function Header($target, options) {
        var header = document.createElement("p");
        $target.append(header);
        header.setAttribute("style", "background:black;font-size:70%;margin:0;");
        var labels = {};
        for (var bind in options.binds) {
            var l = document.createElement("span");
            l.setAttribute("style", "color:" + options.binds[bind] + ";");
            header.appendChild(l);
            labels[bind] = l;
        }
        return new Output(

        function (d) {
            for (var bind in options.binds) {
                labels[bind].innerHTML = bind + ": " + d[bind] + (options.units || "") + " ";
            }
        },

        function () {
            header.innerHTML = "";
        });
    }
    //mappings to type constructors
    var factory = {
        inputs: {
          form: Form
        },
        outputs: {
            line: Line,
            header: Header,
            table: Table
        }
    };

    factory.createInput = function ($target, inputs) {
        var handles = [];
        inputs.map(function(input){
            if(factory.inputs[input.type]){
                handles.push(factory.inputs[input.type]($target,input));
            } else {
               throw TypeError("Unknown input type '" + options.chart + "'"); 
            }
        });
        return new Input(
            function(callback){
                for(var h in handles){handles[h].submit(callback);}
            },
            function(){
                for(var h in handles){handles[h].reset();}
            },
            function(){
                for(var h in handles){handles[h].exit();}
            }
        );
        
    };
    factory.createOutput = function ($target, outputs) {
        var handles = [];
        outputs.map(function(output){
            if(factory.outputs[output.type]){
                handles.push(factory.outputs[output.type]($target,output));
            } else {
               throw TypeError("Unknown input type '" + output.type + "'"); 
            }
        });
        return new Output(
            function(d){
                for(var h in handles){handles[h].update(d);}
            },
            function(){
                for(var h in handles){handles[h].reset();}
            },
            function(){
                for(var h in handles){handles[h].exit();}
            }
        );
    };
    
    $.fn.dyui = function(method,options,callback){
        switch(method){
        case "input":
            callback(factory.createInput(this,options));
            break;
        case "output":
            callback(factory.createOutput(this,options));
            break;
        }
        return this;
    };
})(jQuery,window,document);

