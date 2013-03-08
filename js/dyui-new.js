;(function ($,window,document,undefined) {
/**
* A generalized handle type for inputs, outputs and filters
  a handle either has an input function, an output function, or
*/
    function Handle(){
        var args = arguments[0];
        this.self = this;
        this.run = function(){
            args.run.apply(this.self,arguments);
            return this;
        };
        this.reset = function(){
            args.reset.apply(this.self,arguments);
            return this;
        };
        this.destroy = args.destroy;
    }

    var types = {};
    var methods = {
        register: function(new_types){
            if(new_types instanceof Object){
                for(var type_class in new_types){
                    if(types[type_class] === undefined) types[type_class] = {};
                    for(var type in new_types[type_class]){
                        types[type_class][type] = new_types[type_class][type];
                    }
                }
            }

            return this;
        },
        create: function(){
            if(typeof arguments[0] !== 'object'){
                $.error("Must provide a configuration object");
            }
            if(!(arguments[1] instanceof Function)){
                $.error("Must provide a callback!");
            }
            var args = arguments[0],callback = arguments[1];

            var result = {};
            for(var id in args){
                var node = args[id];
                result[id] = {};
                for(var port in node){
                    var handle = types[port][node[port].type].call(this,node[port]);
                    handle.self = result[id];
                    result[id][port] = handle;                   
                }
            }
            callback(result);
            return this;
        }
    }

    $.fn.dyui = function(method){
        if(methods[method]){
            return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
        } else {
            $.error("Method " + method + " does not exist in jQuery.dyui");
        }
    }
})(jQuery,window,document);

