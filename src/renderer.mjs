import { Palette } from '@ansi-art/color';

export class Renderer{
    constructor(options={}){
        this.name = options.name;
        this.options = options;
        this.palette = options.palette || (new Palette());
    }
        
    lineart(image, utils, callback){
        
    }
    
    stipple(image, utils, callback){
        
    }
    
    mask(image, utils, callback){
        
    }
    
    render(image, utils, callback){
        
    }
    
}