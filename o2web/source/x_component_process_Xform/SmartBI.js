MWF.xDesktop.requireApp("process.Xform", "$Module", null, false);
/** @class SmartBI 容器组件。
 * @example
 * //可以在脚本中获取该组件
 * //方法1：
 * var div = this.form.get("name"); //获取组件
 * //方法2
 * var div = this.target; //在组件事件脚本中获取
 * @extends MWF.xApplication.process.Xform.$Module
 * @o2category FormComponents
 * @o2range {Process|CMS|Portal}
 * @hideconstructor
 */
MWF.xApplication.process.Xform.SmartBI = MWF.APPSmartBI =  new Class({
    Extends: MWF.APP$Module,

    _loadUserInterface: function(){ 
        if (!this.json.smartbiresource || this.json.smartbiresource==="none") this.node.destroy();
        else{
            var _iframe = this.node.getElement("iframe");
            var url = _iframe.get("src");
            
            this.iframe = new Element("iframe",{
                src:url,
                frameborder:"0",
                scrolling:"auto"
            }).inject(this.node,"after");
    
            this.node.destroy();
            this.node = this.iframe.setStyles({
                "width":"100%",
                "height":"100%",
                "min-height":"500px",
                "min-width":"500px"
            });
        }
        
	}
});