/*
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
//*/

import { 
    Color, 
    Palette, 
    Medium, 
    Space
} from '@ansi-art/color';
import { Image as CanvasImage, Canvas } from '@environment-safe/canvas';
import { Ansi, Grid } from '@ansi-art/tools';
import { Renderer } from './renderer.mjs';
import { alphabets as valueScales } from './alphabets.mjs';
import { AverageRenderer } from './renderers/average.mjs';

const defaultAverageRenderer = new AverageRenderer();
const getAverage = ()=>{
    return defaultAverageRenderer;
};

var AsciiArt = {};
//var parentArt;
//var requestInstance;
export const Image = function(options){
    const canvasOptions = { ...options };
    if(!canvasOptions.palette){
        canvasOptions.palette = new Palette({
            medium: new Medium(options.medium || 'vga'),
            space: new Space(options.bitDepth),
            distance: options.distance || ((r1, g1, b1, r2, g2, b2)=>{
                return (Math.abs(r1-r2)+Math.abs(g1-g2)+Math.abs(b1-b2)+
                    Math.abs(Math.max(r1, g1, b1)-Math.max(r2, g2, b2))/2
                )/3 + Math.abs(Math.max(r1, g1, b1)-Math.max(r2, g2, b2))/2;
            })
        });
    }
    this.image = new CanvasImage(canvasOptions);
    this.loaded = this.image.loaded;
    this.palette = canvasOptions.palette;
    this.color = options.color || (new Color());
    this.alphabet = valueScales[options.alphabet || 'ultra-wide'];
    if(options.invertValue) this.alphabet = this.alphabet.reverse();
    var fixDimOptionsAccordingToAspectRatio = function(ob){
        if(
            (!ob.options.width) &&
            (!ob.options.height)
        ){
            ob.options.width = 80;
        }
        if(ob.options.width){
            if(!ob.options.height){
                ob.options.height = ob.options.width * ob.aspectRatio;
            }
        }else{
            if(ob.options.height){
                ob.options.width = ob.options.height / ob.aspectRatio;
            }
        }
    };
    this.loaded.then(()=>{
        this.aspectRatio = this.image.height/this.image.width;
        fixDimOptionsAccordingToAspectRatio(this);
        this.canvas = new Canvas(this.image.width, this.image.height);
        //todo: direct copy the canvas objects
        this.context = this.canvas.getContext('2d');
        this.context.drawImage(
            this.image, 0, 0, this.image.width, this.image.height
        );
    });
    //this.parentClass = AsciiArt.Image;
    if(!options.alphabet) options.alphabet = 'ultra-wide';
    options.alphabet = valueScales[options.alphabet];
    if(options.invertValue) options.alphabet = options.alphabet.reverse();
    if(this.debug){
        console.log('ALPHABET', '\n', options.alphabet);
    }
    this.options = options;
    if(!this.options.renderer) this.options.renderer = 'average';
    var jobs = [];
    this.ready = function(callback){
        jobs.push(callback);
    };
};

Image.prototype.write = function(location, callback, type){
    if(typeof location === 'function' && !callback){
        callback = location;
        location = undefined;
    }
    var ob = this;
    this.ready(function(){
        if(location && location.indexOf('://') !== -1){
            throw new Error('uris not yet implemented!');
        }else{
            renderers[ob.options.renderer][type||'render'](
                ob,
                {
                    imageFromCanvas : function(canvas, cb){
                        var newImage = new Image();
                        if(canvas.toBuffer){
                            newImage.src = canvas.toBuffer();
                            //in node, the img is immediately available
                            setTimeout(function(){
                                cb(null, newImage);
                            }, 0);
                        }else{
                            newImage.src = canvas.toDataURL();
                            newImage.onload = function(){
                                cb(null, newImage);
                            };
                        }
                        return newImage;
                    },
                    canvas : function(width, height){
                        var canvas = new Canvas(width, height);
                        return canvas;
                    }
                },
                function(err, text){
                    if(err) return callback(err);
                    if(location) require('fs').writeFile(location, text, function(err){
                        return callback(err, text, ob.context);
                    });
                    else callback(err, text);
                }
            );
        }
    });
};

Image.prototype.writeMask = function(location, callback){
    return this.write(location, callback, 'mask');
};
Image.prototype.writeLineArt = function(location, callback){
    return this.write(location, callback, 'lineart');
};
Image.prototype.writeStipple = function(location, callback){
    return this.write(location, callback, 'stipple');
};
Image.prototype.writePosterized = function(location, callback){
    if(typeof location === 'function'){
        callback = location;
        location = undefined;
    }
    this.options.background = true;
    var ob = this;

    var generateBounds = function(min, max){
        return function(value){
            return Math.min(max, Math.max(min, value));
        };
    };
    var flip = function(fieldA, fieldB, min, max, boundFn){
        return function(obj){
            if(obj[fieldA] !== null) obj[fieldA] = max - obj[fieldA];
            if(obj[fieldB] !== null) obj[fieldB] = max - obj[fieldB];
        };
    };
    var swap = function(fieldA, fieldB, min, max, boundFn){
        return function(obj){
            if(obj[fieldA] !== null && obj[fieldB] !== null){
                var swap = obj[fieldA];
                obj[fieldA] = obj[fieldB];
                obj[fieldB] = swap;
            }else{
                if(obj[fieldA] !== null) obj[fieldA] = obj[fieldB];
                if(obj[fieldB] !== null) obj[fieldB] = obj[fieldA];
            }
        };
    };
    var flipAndSwap = function(fieldA, fieldB, min, max, boundFn){
        var doSwap = swap(fieldA, fieldB, min, max, boundFn);
        var doFlip = flip(fieldA, fieldB, min, max, boundFn);
        var fn = function(obj){
            doFlip(obj);
            if(obj[fieldA] !== null) obj[fieldA] = boundFn(obj[fieldA]);
            if(obj[fieldB] !== null) obj[fieldB] = boundFn(obj[fieldB]);
            doSwap(obj);
        };
        fn.swap = doSwap;
        fn.flip = doFlip;
        return fn;
    };
    /*var dumpRange = function(obj){
        console.log('[]>', {t:obj.threshold, f:obj.floor});
    }; //*/
    this.write(location, function(err, rendered){
        if(err) return callback(err);
        ob.options.background = false; //todo:orig
        var coloredBackground = rendered;
        //var ot = ob.options.threshold;
        var snapRange = generateBounds(0, 255);
        var fas = flipAndSwap('threshold', 'floor', 0, 255, snapRange);
        //dumpRange(ob.options);
        if(!ob.options.threshold) ob.options.threshold = 50;
        if(!ob.options.floor) ob.options.floor = 0;
        if(ob.options.blended){
            var stipplePrefix = (typeof ob.options.stippled === 'string')?
                this.color.code(ob.options.stippled):
                '';
            var linePrefix = (typeof ob.options.lineart === 'string')?
                this.color.code(ob.options.lineart) || '':
                '';
            //fas(ob.options);
            //dumpRange(ob.options);
            ob.writeLineArt(location, function(err, r){ //writeLineArt
                var rendered = Ansi.map(r,function(chr, styles){
                    return linePrefix+chr;
                });
                //var ln = rendered;
                if(err) return callback(err);
                var canvas = new Grid(coloredBackground);
                canvas.drawOnto(rendered, 0, 0, true, true);
                var previousResult = canvas.toString();
                //ob.options.threshold = ot;
                fas(ob.options);
                ob.writeStipple(location, function(err, r2){
                    var rendered = Ansi.map(r2,function(chr, styles){
                        return stipplePrefix+chr;
                    });
                    if(err) return callback(err);
                    var canvas = new Grid(previousResult);
                    canvas.drawOnto(rendered, 0, 0, true, true);
                    var result = canvas.toString();
                    callback(undefined, result);
                });
            });
        }else{
            if(ob.options.stippled){
                var prefix = (typeof ob.options.stippled === 'string')?
                    ob.color.code(ob.options.stippled):
                    '';
                ob.writeStipple(location, function(err, r){
                    var rendered = Ansi.map(r,function(chr, styles){
                        return prefix+styles.join()+chr;
                    });
                    if(err) return callback(err);
                    var canvas = new Grid(coloredBackground);
                    canvas.drawOnto(rendered, 0, 0, false, true);
                    var result = canvas.toString();
                    callback(undefined, result);
                });
            }else{
                ob.writeLineArt(location, function(err, rendered){
                    if(err) return callback(err);
                    var canvas = new Grid(coloredBackground);
                    canvas.drawOnto(rendered, 0, 0, false, true);
                    var result = canvas.toString();
                    callback(undefined, result);
                });
            }
        }
    });
};

const renderers = {};
renderers['average'] = getAverage();


const newReturnContext = function(options){
    return new Promise(function(resolve, reject){
        try{
            create(options, function(err, rendered){
                if(err) return reject(err);
                resolve(rendered);
            });
        }catch(ex){
            reject(ex);
        }
    });
};

const create = function(options, callback){
    if(!callback){
        return newReturnContext(options);
    }else{
        var image = new AsciiArt.Image(options);
        if(options.posterized){
            image.writePosterized(function(err, rendered){
                callback(err, rendered);
            });
        }else{
            if(options.lineart){
                image.writeLineArt(function(err, rendered){
                    callback(err, rendered);
                });
            }else{
                if(options.stippled){
                    image.writeStipple(function(err, rendered){
                        callback(err, rendered);
                    });
                }else{
                    image.write(function(err, rendered){
                        callback(err, rendered);
                    });
                }
            }
        }
    }
};

export { Renderer, AverageRenderer };