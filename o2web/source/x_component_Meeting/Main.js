MWF.xApplication.Meeting = MWF.xApplication.Meeting || {};
MWF.require("MWF.xDesktop.UserData", null, false);
MWF.xDesktop.requireApp("Meeting", "MeetingView", null, false);
MWF.xDesktop.requireApp("Meeting", "Common", null, false);
MWF.xDesktop.requireApp("Template", "MDomItem", null, false);
MWF.xApplication.Meeting.options.multitask = false;
MWF.xApplication.Meeting.Main = new Class({
    Extends: MWF.xApplication.Common.Main,
    Implements: [Options, Events],

    options: {
        "style": "default",
        "name": "Meeting",
        "icon": "icon.png",
        "width": "1000",
        "height": "600",
        "isResize": true,
        "isMax": true,
        "sideBarEnable" : true,
        "settingEnable" : true,
        "title": MWF.xApplication.Meeting.LP.title
    },
    onQueryLoad: function(){
        this.lp = MWF.xApplication.Meeting.LP;
        this.menuMode="show";
        this.isManager = MWF.AC.isMeetingAdministrator();

        this.actions = MWF.Actions.get("x_meeting_assemble_control");
        this.personActions = MWF.Actions.get("x_organization_assemble_express");
        //if (!this.actions) this.actions = new MWF.xApplication.Meeting.Actions.RestActions();
        //if (!this.personActions) this.personActions = new MWF.xAction.org.express.RestActions();
    },
    loadApplication: function(callback) {
        MWF.UD.getDataJson("meetingConfig", function(json){
            this.meetingConfig = json || {};

            o2.Actions.load("x_meeting_assemble_control").ConfigAction.getSystemConfig(function(json){
                var jsonData = json.data;
                if (jsonData.process){
                    this.meetingConfig.process = jsonData.process;
                }else{
                    this.meetingConfig.process = null;
                }
                if( jsonData.weekBegin ){
                    this.meetingConfig.weekBegin = jsonData.weekBegin;
                }
                if( jsonData.meetingViewer ){
                    this.meetingConfig.meetingViewer = jsonData.meetingViewer;
                }

                for( var key in jsonData ){
                    if( key !== "process" && key !== "weekBegin" && key !== "meetingViewer" ){
                        this.meetingConfig[ key ] = jsonData[key];
                    }
                }
                if( !this.meetingConfig.disableViewList ) this.meetingConfig.disableViewList = [];

                if( !this.meetingConfig.typeList ){
                    this.meetingConfig.typeList = [];
                }else{
                    this.meetingConfig.typeList = this.meetingConfig.typeList.filter(function(t){return !!t});
                }

                this.createNode();
                if (!this.options.isRefresh) {
                    this.maxSize(function () {
                        this.loadLayout();
                    }.bind(this));
                } else {
                    this.loadLayout();
                }
                if (callback) callback();

            }.bind(this));
        }.bind(this));
    },
    createNode: function(){
        this.content.setStyle("overflow", "hidden");
        this.node = new Element("div", {
            "styles": {"width": "100%", "height": "100%", "overflow": "hidden"}
        }).inject(this.content);
    },
    loadLayout: function(){

        this.content.loadCss("../x_component_Meeting/$Main/default/style.css");

        if( this.status && this.status.action ){
            this.defaultAction = this.status.action;
        }else if (this.meetingConfig.defaultView){
            this.defaultAction = this.meetingConfig.defaultView;
        }else{
            this.defaultAction = "toMyMeeting";
        }
        if( this.meetingConfig.disableViewList.contains( this.defaultAction ) ){
            this.defaultAction = "";
        }

        this.topMenu = new Element("div", {"styles": this.css.topMenu}).inject(this.node);
        this.contentNode = new Element("div.contentNode", {"styles":  this.inContainer ? this.css.contentNode_inContainer : this.css.contentNode}).inject(this.node);
        //this.bottomMenu = new Element("div", {"styles": this.css.bottomMenu}).inject(this.node);
        this.loadTopMenus();
        if( this.options.sideBarEnable ){
            this.loadSideBar();
        }
        //this.loadBottomMenus();

        //this.hideMenu();
        //
        //this.node.addEvent("contextmenu", function(e){
        //    if (this.menuMode=="show"){
        //        this.hideMenu();
        //    }else{
        //        this.showMenu();
        //    }
        //    e.preventDefault();
        //}.bind(this));

        this.setEvent();


    },
    isOnlineAvailable: function(){
        return !!this.meetingConfig.enableOnline;
    },
    isAutoCreateOnlineRoom: function(){
        return this.meetingConfig.enableOnline && this.meetingConfig.onlineProduct === "好视通"
    },
    isCopyEnable: function(){
        return Promise.resolve(false);
        // if( typeOf(this.copyEnable) === "boolean" )return Promise.resolve(this.copyEnable);
        // var text = "";
        // if (navigator.clipboard) {
        //     return navigator.clipboard.writeText(text).then(function() {
        //         this.copyEnable = true;
        //         return this.copyEnable;
        //     }.bind(this), function(err) {
        //         this.copyEnable = false;
        //         return this.copyEnable;
        //     });
        // }else{
        //     var textArea = document.createElement("textarea");
        //     textArea.value = text;
        //     // Avoid scrolling to bottom
        //     textArea.style.top = "0";
        //     textArea.style.left = "0";
        //     textArea.style.position = "fixed";
        //     document.body.appendChild(textArea);
        //     textArea.focus();
        //     textArea.select();
        //     try {
        //         var successful = document.execCommand('copy');
        //         this.copyEnable = successful;
        //     } catch (err) {
        //         this.copyEnable = false
        //     }
        //     document.body.removeChild(textArea);
        //     return Promise.resolve(this.copyEnable);
        // }
    },
    copyTextToClipboard: function(text) {
        if (!navigator.clipboard) {
            this.fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text);
    },
    fallbackCopyTextToClipboard: function(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            var successful = document.execCommand('copy');
        } catch (err) {
        }

        document.body.removeChild(textArea);
    },
    setEvent: function(){
        //this.topMenu.addEvent("mouseover", function(){this.showMenu();}.bind(this));
        //this.topMenu.addEvent("mouseout", function(){this.hideMenu();}.bind(this));
        //this.bottomMenu.addEvent("mouseover", function(){this.showMenu();}.bind(this));
        //this.bottomMenu.addEvent("mouseout", function(){this.hideMenu();}.bind(this));
        //this.contentNode.addEvent("click", function(){this.hideMenu();}.bind(this));
    },
    loadTopMenus_right: function(){
        this.topMenuRight = new Element("div", {"styles": this.css.topMenuRight }).inject(this.topMenu);

        this.createTopMenu_right(this.lp.addMeeting, "o2icon-create", "addMeeting");
        if (this.isManager)this.createTopMenu_right(this.lp.addRoom, "o2icon-icon_newhuiyishi", "addRoom");

        //var refreshNode = this.createTopMenu_right(this.lp.refresh, "refresh", "refresh");
        //refreshNode.setStyle("float", "right");

        if( this.options.settingEnable ){
            var configNode = this.createTopMenu_right(this.lp.setting, "o2icon-config", "config");
            configNode.setStyle("float", "right");
        }
    },
    createTopMenu_right : function(text, icon, action){
        var actionNode = new Element("div", {"styles": this.css.topMenuNode_right, "title" : text}).inject(this.topMenuRight);
        var actionIconNode = new Element("div."+icon, {"styles": this.css.topMenuIconNode}).inject(actionNode);
        var actionTextNode = new Element("div",{styles: this.css.topMenuTextNode, "text":text}).inject(actionNode);
        //actionIconNode.setStyle("background", "url(../x_component_Meeting/$Main/default/icon/"+icon+".png) no-repeat center center");
        actionNode.store("icon",icon);
        actionNode.store("iconNode",actionIconNode);

        var _self = this;
        actionNode.addEvents({
            "mouseover": function(){
                this.node.setStyles(_self.css.topMenuNode_over);
                this.node.addClass("mainColor_color");
                this.node.retrieve("iconNode").setStyles( _self.css.topMenuIconNode_over ).addClass("mainColor_color");
                //this.node.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+this.node.retrieve("icon")+"_click.png) no-repeat center center" );
            }.bind( { node : actionNode } ),
            "mouseout": function(){
                this.node.setStyles(_self.css.topMenuNode_right);
                this.node.removeClass("mainColor_color");
                this.node.retrieve("iconNode").setStyles( _self.css.topMenuIconNode ).removeClass("mainColor_color");
                //this.node.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+this.node.retrieve("icon")+".png) no-repeat center center" );
            }.bind({ node:actionNode }),
            "click": function(){
                this.node.setStyles(_self.css.topMenuNode_down);
                //this.node.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+this.node.retrieve("icon")+"_click.png) no-repeat center center" );
                if (_self[action]) _self[action].apply(_self);
            }.bind({ node : actionNode })
        });
        return actionNode;
    },
    loadTopMenus: function(){
        this.createTopMenu(this.lp.myMeeting, "o2icon-person", "toMyMeeting");
        this.createTopMenu(this.lp.month, "o2icon-month", "toMonth");
        this.createTopMenu(this.lp.week, "o2icon-week", "toWeek");
        this.createTopMenu(this.lp.day, "o2icon-day", "toDay");
        this.createTopMenu(this.lp.list, "o2icon-list", "toList");
        this.createTopMenu(this.lp.room, "o2icon-home", "toRoom");
        this.loadTopMenus_right();
    },
    isViewAvailable : function( action ){
        return  !this.meetingConfig.disableViewList.contains( action );
    },
    createTopMenu: function(text, icon, action){
        if( this.meetingConfig.disableViewList.contains( action ) )return;

        if( this.meetingConfig[ action + "ViewName" ] ){
            text = this.meetingConfig[ action + "ViewName" ];
        }

        var actionNode = new Element("div", {"styles": this.css.topMenuNode}).inject(this.topMenu);
        var actionIconNode = new Element("div."+icon, {"styles": this.css.topMenuIconNode}).inject(actionNode);
        //actionIconNode.setStyle("background", "url(../x_component_Meeting/$Main/default/icon/"+icon+".png) no-repeat center center");
        var actionTextNode = new Element("div", {"styles": this.css.topMenuTextNode, "text": text}).inject(actionNode);
        actionNode.store("icon",icon);
        actionNode.store("iconNode",actionIconNode);
        actionNode.store("action",action);

        var _self = this;
        actionNode.addEvents({
            "mouseover": function(){
                if( this.node != _self.currentTopMenuNode ){
                    this.node.setStyles(_self.css.topMenuNode_over);
                    this.node.addClass("mainColor_color");
                    this.node.retrieve("iconNode").setStyles( _self.css.topMenuIconNode_over ).addClass("mainColor_color");
                    //this.node.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+this.node.retrieve("icon")+"_click.png) no-repeat center center" );
                }
            }.bind( { node : actionNode } ),
            "mouseout": function(){
                if(this.node != _self.currentTopMenuNode){
                    this.node.setStyles(_self.css.topMenuNode);
                    this.node.removeClass("mainColor_color");
                    this.node.retrieve("iconNode").setStyles( _self.css.topMenuIconNode ).removeClass("mainColor_color");
                    //this.node.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+this.node.retrieve("icon")+".png) no-repeat center center" );
                }
            }.bind({ node:actionNode }),
            //"mousedown": function(){this.setStyles(_self.css.topMenuNode_down);},
            //"mouseup": function(){this.setStyles(_self.css.topMenuNode_over);},
            "click": function(){
                if( this.node != _self.currentTopMenuNode ){
                    this.node.setStyles( _self.css.topMenuNode_down );
                    this.node.addClass("mainColor_color");
                    this.node.retrieve("iconNode").setStyles( _self.css.topMenuIconNode_over ).addClass("mainColor_color");
                    //this.node.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+this.node.retrieve("icon")+"_click.png) no-repeat center center" );
                }
                if( _self.currentTopMenuNode && this.node != _self.currentTopMenuNode){
                    _self.currentTopMenuNode.setStyles( _self.css.topMenuNode );
                    _self.currentTopMenuNode.removeClass("mainColor_color");
                    _self.currentTopMenuNode.retrieve("iconNode").setStyles( _self.css.topMenuIconNode ).removeClass("mainColor_color");
                    //_self.currentTopMenuNode.retrieve("iconNode").setStyle( "background","url(../x_component_Meeting/$Main/default/icon/"+_self.currentTopMenuNode.retrieve("icon")+".png) no-repeat center center" );
                }
                _self.currentTopMenuNode = this.node;
                if (_self[action]) _self[action].apply(_self);
            }.bind({ node : actionNode })
        });
        if( this.defaultAction ){
            if( this.defaultAction == action ){
                actionNode.click();
            }
        }else if( !this.loaded ){
            actionNode.click();
            this.loaded = true;
        }
        return actionNode;
    },

    hideMenu: function(){

    },
    showMenu: function(){
        if (this.menuMode!="show") {
            this.topMenu.set("tween", {duration: 100, transition: "bounce:out"});
            //this.bottomMenu.set("tween", {duration: 100, transition: "bounce:out"});
            this.topMenu.tween("top", "-50px", "0px");
            //this.bottomMenu.tween("bottom", "-50px", "0px");
            this.menuMode = "show";

            if (this.topMenuPoint) this.topMenuPoint.setStyle("display", "none");
            if (this.bottomMenuPoint) this.bottomMenuPoint.setStyle("display", "none");
        }
    },
    hideCurrentView: function(){
        if (this.currentView){
            this.currentView.hide();
            this.currentView = null;
        }
    },
    toMyMeeting: function(){
        this.contentNode.setStyles(this.css.contentNode);
        //if ((!this.myMeetingView) || this.currentView!=this.myMeetingView){
        //    this.hideCurrentView();
        //    this.getMyMeetingView(function(){
        //        this.myMeetingView.show();
        //        this.currentView = this.myMeetingView;
        //    }.bind(this));
        //}
        if( this.currentView ){
            this.currentView.destroy();
            this.currentView = null;
        }
        this.myMeetingView = null;
        this.getMyMeetingView(function(){
            this.myMeetingView.show();
            this.currentView = this.myMeetingView;
        }.bind(this));
    },
    getMyMeetingView: function(callback){
        if (!this.myMeetingView){
            MWF.xDesktop.requireApp("Meeting", "MeetingView", function(){
                var options;
                if( this.status && this.status.options ){
                    options = this.status.options
                }
                this.myMeetingView = new MWF.xApplication.Meeting.MeetingView(this.contentNode, this, options);
                if( options )this.status.options = null;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    },
    toList: function(){
        this.contentNode.setStyle("background", "#EEE");
        //if ((!this.listView) || this.currentView!=this.listView){
        //    this.hideCurrentView();
        //    this.getListView(function(){
        //        this.listView.show();
        //        this.currentView = this.listView;
        //    }.bind(this));
        //}
        if( this.currentView ){
            this.currentView.destroy();
            this.currentView = null;
        }
        this.listView = null;
        this.getListView(function(){
            this.listView.show();
            this.currentView = this.listView;
        }.bind(this));
    },
    getListView: function(callback){
        if (!this.listView){
            MWF.xDesktop.requireApp("Meeting", "ListView", function(){
                var options;
                if( this.status && this.status.options ){
                    options = this.status.options
                }
                this.listView = new MWF.xApplication.Meeting.ListView(this.contentNode, this, options);
                if( options )this.status.options = null;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    },

    toMonth: function(){
        this.contentNode.setStyle("background", "#EEE");
        //if ((!this.monthView) || this.currentView!=this.monthView){
        //    this.hideCurrentView();
        //    this.getMonthView(function(){
        //        this.monthView.show();
        //        this.currentView = this.monthView;
        //    }.bind(this));
        //}
        if( this.currentView ){
            this.currentView.destroy();
            this.currentView = null;
        }
        this.monthView = null;
        this.getMonthView(function(){
            this.monthView.show();
            this.currentView = this.monthView;
        }.bind(this));
    },
    getMonthView: function(callback){
        if (!this.monthView){
            MWF.xDesktop.requireApp("Meeting", "MonthView", function(){
                var options;
                if( this.status && this.status.options ){
                    options = this.status.options
                }
                this.monthView = new MWF.xApplication.Meeting.MonthView(this.contentNode, this, options);
                if( options )this.status.options = null;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    },

    toWeek: function(){
        this.contentNode.setStyle("background", "#EEE");
        //if ((!this.monthView) || this.currentView!=this.monthView){
        //    this.hideCurrentView();
        //    this.getMonthView(function(){
        //        this.monthView.show();
        //        this.currentView = this.monthView;
        //    }.bind(this));
        //}
        if( this.currentView ){
            this.currentView.destroy();
            this.currentView = null;
        }
        this.weekView = null;
        this.getWeekView(function(){
            this.weekView.show();
            this.currentView = this.weekView;
        }.bind(this));
    },
    getWeekView: function(callback){
        if (!this.weekView){
            MWF.xDesktop.requireApp("Meeting", "WeekView", function(){
                var options;
                if( this.status && this.status.options ){
                    options = this.status.options
                }
                this.weekView = new MWF.xApplication.Meeting.WeekView(this.contentNode, this, options);
                if( options )this.status.options = null;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    },

    toDay: function(d){
        this.contentNode.setStyle("background", "#EEE");
        //if ((!this.dayView) || this.currentView!=this.dayView){
        //    this.hideCurrentView();
        //    this.getDayView(function(){
        //        this.dayView.show();
        //        this.currentView = this.dayView;
        //    }.bind(this), d);
        //}
        if( this.currentView ){
            this.currentView.destroy();
            this.currentView = null;
        }
        this.dayView = null;
        this.getDayView(function(){
            this.dayView.show();
            this.currentView = this.dayView;
        }.bind(this), d);
    },
    getDayView: function(callback, d){
        if (!this.dayView){
            MWF.xDesktop.requireApp("Meeting", "DayView", function(){
                var options;
                if( this.status && this.status.options ){
                    options = this.status.options
                }
                this.dayView = new MWF.xApplication.Meeting.DayView(this.contentNode, this, options || {"date": d});
                if(this.status)this.status.options = null;
                if (callback) callback();
            }.bind(this));
        }else{
            this.dayView.toDay(d);
            if (callback) callback();
        }
    },

    toRoom: function(){
        this.contentNode.setStyle("background", "#EEE");
        //if ((!this.roomView) || this.currentView!=this.roomView){
        //    this.hideCurrentView();
        //    this.getRoomView(function(){
        //        this.roomView.show();
        //        this.currentView = this.roomView;
        //    }.bind(this));
        //}
        if( this.currentView ){
            this.currentView.destroy();
            this.currentView = null;
        }
        this.roomView = null;
        this.getRoomView(function(){
            this.roomView.show();
            this.currentView = this.roomView;
        }.bind(this));
    },
    getRoomView: function(callback){
        if (!this.roomView){
            MWF.xDesktop.requireApp("Meeting", "RoomView", function(){
                var options;
                if( this.status && this.status.options ){
                    options = this.status.options
                }
                this.roomView = new MWF.xApplication.Meeting.RoomView(this.contentNode, this, options);
                if( options )this.status.options = null;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }

    },

    //refresh: function(){
    //    //this.hideMenu();
    //    if (this.currentView) this.currentView.reload();
    //},
    addMeeting: function(date, hour, minute, room, processData, latest){
        o2.Actions.load("x_meeting_assemble_control").ConfigAction.getSystemConfig(function(json){
            var jsonData = json.data;
            var process = (jsonData) ? jsonData.process : null;
            if (process){
                this.loadMeetingProcess(process, processData, latest);
            }else{
                //new MWF.xApplication.Meeting.Creator(this, date, hour, room);
                var form = new MWF.xApplication.Meeting.MeetingForm(this,{}, {
                    date : date,
                    hour : hour,
                    minute : minute,
                    room : room
                }, {app:this});
                form.view = this;
                form.create();
                //this.hideMenu();
            }
        }.bind(this));
    },
    loadMeetingProcess: function(id, processData, latest){
        this.getProcess(id, function(process){
            MWF.xDesktop.requireApp("process.TaskCenter", "ProcessStarter", function(){
                var starter = new MWF.xApplication.process.TaskCenter.ProcessStarter(process, this, {
                    "latest" : latest,
                    "workData" : processData,
                    "onStarted": function(data, title, processName){
                        this.afterStartProcess(data, title, processName);
                    }.bind(this)
                });
                starter.load();
            }.bind(this));
        }.bind(this));
    },
    afterStartProcess: function(data, title, processName){
		if (data.work){
			this.startProcessDraft(data, title, processName);
		}else{
			this.startProcessInstance(data, title, processName);
		}
	},
	startProcessDraft: function(data, title, processName){
		var work = data.work;
		var options = {"draft": work, "appId": "process.Work"+(new o2.widget.UUID).toString(), "desktopReload": false,
			"onPostClose": function(){
			}.bind(this)
		};
		this.desktop.openApplication(null, "process.Work", options);
	},
    startProcessInstance: function(data, title, processName){
        var workInfors = [];
        var currentTask = [];

        data.each(function(work){
            if (work.currentTaskIndex !== -1) currentTask.push(work.taskList[work.currentTaskIndex].work);
            workInfors.push(this.getStartWorkInforObj(work));
        }.bind(this));

        if (currentTask.length===1){
            var options = {"workId": currentTask[0], "appId": currentTask[0]};
            this.desktop.openApplication(null, "process.Work", options);

            this.createStartWorkResault(workInfors, title, processName, false);
        }else{
            this.createStartWorkResault(workInfors, title, processName, true);
        }
    },
    createStartWorkResault: function(workInfors, title, processName, isopen){
        var content = "";
        workInfors.each(function(infor){
            var users = [];
            infor.users.each(function(uname){
                users.push(MWF.name.cn(uname));
            });

            content += "<div><b>"+this.lp.nextActivity+"<font style=\"color: #ea621f\">"+infor.activity+"</font>, "+this.lp.nextUser+"<font style=\"color: #ea621f\">"+users.join(", ")+"</font></b>";
            if (infor.currentTask && isopen){
                content += "&nbsp;&nbsp;&nbsp;&nbsp;<span value=\""+infor.currentTask+"\">"+this.lp.deal+"</span></div>";
            }else{
                content += "</div>";
            }
        }.bind(this));

        var t = workInfors[0].title || title;
        var msg = {
            "subject": this.lp.processStarted,
            "content": "<div>"+this.lp.processStartedMessage+"“["+processName+"]"+t+"”</div>"+content
        };

        var tooltip = layout.desktop.message.addTooltip(msg);
        var item = layout.desktop.message.addMessage(msg);

        this.setStartWorkResaultAction(tooltip);
        this.setStartWorkResaultAction(item);
    },
    getStartWorkInforObj: function(work){
        var title = "";
        var users = [];
        var currentTask = "";
        work.taskList.each(function(task, idx){
            title = task.title;
            users.push(task.person+"("+task.department + ")");
            if (work.currentTaskIndex===idx) currentTask = task.id;
        }.bind(this));
        return {"activity": work.fromActivityName, "users": users, "currentTask": currentTask, "title" : title };
    },
    setStartWorkResaultAction: function(item){
        var node = item.node.getElements("span");
        node.setStyles(this.css.dealStartedWorkAction);
        var _self = this;
        node.addEvent("click", function(e){
            var options = {"taskId": this.get("value"), "appId": this.get("value")};
            _self.desktop.openApplication(e, "process.Work", options);
        });
    },
    getProcess: function(id, callback){
        // MWF.xDesktop.requireApp("process.ProcessManager", "Actions.RestActions", function(){
        //     var action = new MWF.xApplication.process.ProcessManager.Actions.RestActions();
        //     action.getProcess(id, function(json){
                 if (callback) callback(id);
        //     }.bind(this));
        // }.bind(this));
    },

    config: function(){
        new MWF.xApplication.Meeting.Config(this, this.meetingConfig);
        //this.hideMenu();
    },
    addRoom : function(){
        var form = new MWF.xApplication.Meeting.RoomForm(this,{}, {}, {app:this});
        form.view = this;
        form.create();
        //this.hideMenu();
    },
    recordStatus: function(){
        //alert( JSON.stringify(
        //    {
        //        action : this.currentTopMenuNode ? this.currentTopMenuNode.retrieve("action") : "toMyMeeting",
        //        options : this.currentView.recordStatus ? this.currentView.recordStatus() : null
        //    }
        //) )
        return {
            action : this.currentTopMenuNode ? this.currentTopMenuNode.retrieve("action") : "toMyMeeting",
            options : (this.currentView && this.currentView.recordStatus) ? this.currentView.recordStatus() : null
        };
    },
    reload: function( ){
        // if( this.inContainer ){
            if( this.currentView && this.currentView.reload ){
                this.currentView.reload();
            }else{
                this.refresh()
            }
        // }else{
        //     this.refresh()
        // }
    },
    loadSideBar : function(){
        this.sideBar = new MWF.xApplication.Meeting.SideBar(this.node, this);
        this.sideBar.show();
    },
    isMeetingViewer : function( callback ){
        if( typeOf( this._isMeetingViewer ) == "boolean"){
            if(callback)callback( this._isMeetingViewer );
            return;
        }
        var meetingViewer = this.meetingConfig.meetingViewer;
        if( !meetingViewer || !meetingViewer.length ){
            this._isMeetingViewer = false;
            if(callback)callback( this._isMeetingViewer );
            return;
        }

        if( this.isManager ){
            this._isMeetingViewer = true;
            if(callback)callback( this._isMeetingViewer );
            return;
        }

        if( typeOf( meetingViewer ) != "array" )meetingViewer = [meetingViewer];
        MWF.Actions.get("x_organization_assemble_personal").getPerson(function( json ){
        //this.actions.getCurrentPerson( function( json ){
            var dn = json.data.distinguishedName;
            //var dn = this.desktop.session.user.distinguishedName;

            if( meetingViewer.contains( dn ) ){
                this._isMeetingViewer = true;
                if(callback)callback( this._isMeetingViewer );
                return;
            }

            for( var i=0; i<json.data.woGroupList.length; i++ ){
                if( meetingViewer.contains( json.data.woGroupList[i].distinguishedName ) ){
                    this._isMeetingViewer = true;
                    if(callback)callback( this._isMeetingViewer );
                    return;
                }
            }

            //var personList = [ dn ];
            this.personActions.listUnitSupNestedWithPersonValue({"personList":[dn]}, function(js){
                for( var i=0; i<js.data.unitList.length; i++ ){
                    if( meetingViewer.contains( js.data.unitList[i] ) ){
                        this._isMeetingViewer = true;
                        if(callback)callback( this._isMeetingViewer );
                        return;
                    }
                }
                this._isMeetingViewer = false;
                if(callback)callback( this._isMeetingViewer );
            }.bind(this),null, false );
        }.bind(this), null, false)

    }
});



MWF.xApplication.Meeting.Config = new Class({
    Implements: [Events],
    initialize: function(app){
        this.app = app;
        this.css = this.app.css;
        this.lp = this.app.lp;
        this.configData = this.app.meetingConfig || {};
        this.process = null;

        o2.Actions.load("x_meeting_assemble_control").ConfigAction.getConfigManage(function(json){
            var jsonData = json.data || {};
            if (jsonData.process){
                this.configData.process = jsonData.process;
            }else{
                this.configData.process = null;
            }
            if( jsonData.weekBegin ){
                this.configData.weekBegin = jsonData.weekBegin;
            }
            if( jsonData.meetingViewer ){
                this.configData.meetingViewer = jsonData.meetingViewer;
            }
            if( jsonData.mobileCreateEnable ){
                this.configData.mobileCreateEnable = jsonData.mobileCreateEnable;
            }

            for( var key in jsonData ){
                if( key !== "process" && key !== "weekBegin" && key !== "meetingViewer" && key !=="mobileCreateEnable"){
                    this.configData[ key ] = jsonData[key];
                }
            }
            this.load();
        }.bind(this));
    },
    load: function(){
        this.node = new Element("div", {
            "styles": MWF.AC.isMeetingAdministrator() ? this.css.configNode_admin : this.css.configNode
        }).inject(this.app.node);
        this.contentNode = new Element("div", {"styles": this.css.configContentNode}).inject(this.node);

        var statusStyle = "overflow: hidden;margin-top:6px;margin-left:10px;";
        var statusIconStyle = "float: left; width: 16px; height: 16px; border-radius: 100px; ";
        var statusIconStyle2 = "float: left; width: 14px; height: 14px; border-radius: 100px; ";
        var statusTextStyle = "margin-left:35px; line-height:16px; height:16px;font-size:14px;color:#666;";

        var viewStyle = "font-size:14px;color:#666;heigh:16px;margin-top:6px;margin-left:10px;";
        var inputTextStyle = "float:right; width:260px; border:1px solid #ccc";

        var viewStyle2 = "font-size:14px;color:#666;heigh:16px;margin-top:6px;";

        var d = this.configData;
        var configLp = this.lp.config;
        if( !d.onlineConfig )d.onlineConfig = {};

        var html =

            //"<div class='configTitle'>"+this.lp.config.meetingStatus+"</div>" +
            //
            //"<div style='"+ statusStyle +"'>"+
            //"   <div style='"+ statusIconStyle + "background-color:#4990E2'></div>" +
            //"   <div style='"+  statusTextStyle +"'>"+this.lp.config.wait+"</div></div>" +
            //"</div>"+
            //
            //"<div style='"+ statusStyle +"'>"+
            //"   <div style='"+ statusIconStyle + "background-color:#66CC7F'></div>" +
            //"   <div style='"+  statusTextStyle +"'>"+this.lp.config.progress+"</div></div>" +
            //"</div>"+
            //
            //"<div style='"+ statusStyle +"'>"+
            //"   <div style='"+ statusIconStyle + "background-color:#F6A623'></div>" +
            //"   <div style='"+  statusTextStyle +"'>"+this.lp.config.invite+"</div></div>" +
            //"</div>"+
            //
            //"<div style='"+ statusStyle +"'>"+
            //"   <div style='"+ statusIconStyle + "background-color:#ccc'></div>" +
            //"   <div style='"+  statusTextStyle +"'>"+this.lp.config.completed+"</div></div>" +
            //"</div>"+
            //
            //"<div style='"+ statusStyle +"'>"+
            //"   <div style='"+ statusIconStyle2 + "border:2px solid #FF7F7F;'></div>" +
            //"   <div style='"+  statusTextStyle +"'>"+this.lp.config.conflict+"</div></div>" +
            //"</div>"+
            //
            //"<div class='line'></div>" +

            "<div class='configTitle'>"+this.lp.config["default"]+"</div>" +
            "<div>";

        if( !d.disableViewList.contains( "toMyMeeting" )  ){
            html +=
                "   <div style='"+ viewStyle +"'>" +
                "<input type='radio' name='configSelectDefaultView' "+(((!d.defaultView) || d.defaultView=="toMyMeeting") ? "checked" : "")+" value='toMyMeeting'>"+ ( d.toMyMeetingViewName || this.lp.myMeeting )+
                "   </div>";
        }

        if( !d.disableViewList.contains( "toMonth" )  ){
            html +=
                "   <div style='"+ viewStyle +"'>" +
                "<input type='radio' name='configSelectDefaultView' "+((d.defaultView=="toMonth") ? "checked" : "")+" value='toMonth'>"+ ( d.toMonthViewName || this.lp.month )+
                "   </div>";
        }

        if( !d.disableViewList.contains( "toWeek" )  ){
            html +=
                "   <div style='"+ viewStyle +"'>" +
                "<input type='radio' name='configSelectDefaultView' "+((d.defaultView=="toWeek") ? "checked" : "")+" value='toWeek'>"+( d.toWeekViewName || this.lp.week )+
                "   </div>";
        }

        if( !d.disableViewList.contains( "toDay" )  ){
            html +=
                "   <div style='"+ viewStyle +"'>" +
                "<input type='radio' name='configSelectDefaultView' "+((d.defaultView=="toDay") ? "checked" : "")+" value='toDay'>"+(d.toDayViewName || this.lp.day)+
                "   </div>";
        }

        if( !d.disableViewList.contains( "toList" )  ){
            html +=
                "   <div style='"+ viewStyle +"'>" +
                "<input type='radio' name='configSelectDefaultView' "+((d.defaultView=="toList") ? "checked" : "")+" value='toList'>"+(d.toListViewName || this.lp.list)+
                "   </div>";
        }

        if( !d.disableViewList.contains( "toRoom" )  ){
            html +=
                "   <div style='"+ viewStyle +"'>" +
                "<input type='radio' name='configSelectDefaultView' "+((d.defaultView=="toRoom") ? "checked" : "")+" value='toRoom'>"+(d.toRoomViewName || this.lp.room)+
                "   </div>";
        }

        html +="</div>";

        if( MWF.AC.isMeetingAdministrator() ){
            d.disableViewList = d.disableViewList || [];
            html += "<div class='line'></div>"+

                "<div class='configTitle'>"+this.lp.config.viewSetting +"</div>" +
                "<div>"+
                "   <div style='"+ viewStyle +"'>" +
                "<input type='checkbox' name='configAvailableView' "+( !d.disableViewList.contains( "toMyMeeting" ) ? "checked" : "")+" value='toMyMeeting'>"+this.lp.myMeeting+
                "<input type='text' name='toMyMeetingViewName' value='" + (d.toMyMeetingViewName || "") + "' style='"+ inputTextStyle +"' placeholder='"+ this.lp.config.viewCustomName +"' >"+
                "   </div>" +
                "   <div style='"+ viewStyle +"'>" +
                "<input type='checkbox' name='configAvailableView' "+( !d.disableViewList.contains( "toMonth" ) ? "checked" : "")+" value='toMonth'>"+this.lp.month+
                "<input type='text' name='toMonthViewName' value='" + (d.toMonthViewName || "") + "' style='"+ inputTextStyle +"' placeholder='"+ this.lp.config.viewCustomName +"' >"+
                "   </div>" +
                "   <div style='"+ viewStyle +"'>" +
                "<input type='checkbox' name='configAvailableView' "+( !d.disableViewList.contains( "toWeek" ) ? "checked" : "")+" value='toWeek'>"+this.lp.week+
                "<input type='text' name='toWeekViewName' value='" + (d.toWeekViewName || "") + "' style='"+ inputTextStyle +"' placeholder='"+ this.lp.config.viewCustomName +"' >"+
                "   </div>" +
                "   <div style='"+ viewStyle +"'>" +
                "<input type='checkbox' name='configAvailableView' "+( !d.disableViewList.contains( "toDay" ) ? "checked" : "")+" value='toDay'>"+this.lp.day+
                "<input type='text' name='toDayViewName' value='" + (d.toDayViewName || "") + "' style='"+ inputTextStyle +"' placeholder='"+ this.lp.config.viewCustomName +"' >"+
                "   </div>" +
                "   <div style='"+ viewStyle +"'>" +
                "<input type='checkbox' name='configAvailableView' "+( !d.disableViewList.contains( "toList" ) ? "checked" : "")+" value='toList'>"+this.lp.list+
                "<input type='text' name='toListViewName' value='" + (d.toListViewName || "") + "' style='"+ inputTextStyle +"' placeholder='"+ this.lp.config.viewCustomName +"' >"+
                "   </div>" +
                "   <div style='"+ viewStyle +"'>" +
                "<input type='checkbox' name='configAvailableView' "+( !d.disableViewList.contains( "toRoom" ) ? "checked" : "")+" value='toRoom'>"+this.lp.room+
                "<input type='text' name='toRoomViewName' value='" + (d.toRoomViewName || "") + "' style='"+ inputTextStyle +"' placeholder='"+ this.lp.config.viewCustomName +"' >"+
                "   </div>" +
                "</div>" +

                "<div class='line'></div>"+

                "<div class='configTitle'>"+this.lp.config.weekBegin +"</div>" +
                "<div><select name='configSelectWeekBeign'>"+
                "<option value='0' "+((d.weekBegin=="0") ? "selected" : "")+">"+this.lp.weeks.Sun+"</option>"+
                "<option value='1' "+((d.weekBegin=="1") ? "selected" : "")+">"+this.lp.weeks.Mon+"</option>"+
                    //"<option value='2'"+((d.weekBegin=="2") ? "selected" : "")+">"+this.lp.weeks.Tues+"</option>"+
                    //"<option value='3'"+((d.weekBegin=="3") ? "selected" : "")+">"+this.lp.weeks.Wed+"</option>"+
                    //"<option value='4'"+((d.weekBegin=="4") ? "selected" : "")+">"+this.lp.weeks.Thur+"</option>"+
                    //"<option value='5'"+((d.weekBegin=="5") ? "selected" : "")+">"+this.lp.weeks.Fri+"</option>"+
                    //"<option value='6'"+((d.weekBegin=="6") ? "selected" : "")+">"+this.lp.weeks.Sat+"</option>"+
                "</select></div>"+

                "<div class='line'></div>"+
                "<div class='configTitle'>"+this.lp.config.applyProcess+"</div>" +
                "<div item='processArea'></div>" +

                //"<div class='line'></div>"+
                "<div class='configTitle' title='"+ this.lp.config.meetingViewerTitle +"'>"+this.lp.config.meetingViewer +"</div>" +
                "<div item='meetingViewerNode'></div>" +

                "<div class='configTitle'>"+this.lp.config.mobileCreateEnable +"</div>" +
                "<div item='mobileCreateEnable'></div>" +

                "<div class='line'></div>"+
                "<div class='configTitle'>"+this.lp.config.meetingType +"</div>" +
                "<div><textarea name='typeList' style='width: 370px;height: 120px;'>"+ d.typeList.join("\n") +"</textarea></div>" +

                "<div class='line'></div>"+
                "<div class='configTitle'>"+this.lp.config.enableOnline +"</div>" +
                "<div item='enableOnline'></div>"+

                "<div class='onlineArea' style='display:"+( d.enableOnline ? "" : "none" )+"'>"+
                "   <div class='configTitle' style='margin-top:15px;'>"+this.lp.config.onlineProduct +"</div>" +
                "   <div item='onlineProduct'></div>"+

                "   <div class='onlineConfigArea' style='display: "+( d.onlineProduct === "好视通" ? "" : "none" )+"'>"+
                "       <div class='configTitle' style='margin-top:15px;'>"+ this.lp.config.hstUrl +"</div>" +
                "       <div style='"+ viewStyle2 +"'>" +
                "           <input type='text' name='hstUrl' value='" + (d.onlineConfig.hstUrl || "") + "' style='width:calc(100% - 10px); border:1px solid #ccc'>"+
                "       </div>"+

                "       <div class='configTitle' style='margin-top:15px;'>"+ this.lp.config.hstKey +"</div>" +
                "       <div style='"+ viewStyle2 +"'>" +
                "           <input type='text' name='hstKey' value='" + (d.onlineConfig.hstKey || "") + "' style='width:calc(100% - 10px); border:1px solid #ccc'>"+
                "       </div>"+

                "       <div class='configTitle' style='margin-top:15px;'>"+ this.lp.config.hstSecret +"</div>" +
                "       <div style='"+ viewStyle2 +"'>" +
                "           <input type='text' name='hstSecret' value='" + (d.onlineConfig.hstSecret || "") + "' style='width:calc(100% - 10px); border:1px solid #ccc'>"+
                "       </div>"+

                "       <div class='configTitle' style='margin-top:15px;'>"+ this.lp.config.hstAuth +"</div>" +
                "       <div item='hstAuth'></div>"+

                // "       <div class='o2ToHstUidArea' style='display: "+( d.onlineConfig.hstAuth ? "" : "none" )+"'>"+
                "           <div class='configTitle' style='margin-top:15px;'>"+ this.lp.config.o2ToHstUid +"</div>" +
                "           <div item='o2ToHstUid'></div>"+
                // "       </div>"+
                "   </div>"+
                "</div>";

            // {
            //     "hstUrl": "https://117.133.7.109:8443",
            //     "hstKey": "4QY08Kyh",
            //     "hstSecret": "HpQi5csSMrufkM)b&#YWVlr7o*wWUG3G",
            //     "hstAuth": true,
            //     "o2ToHstUid": "employee"
            // }

                // "<div class='line'></div>"+
                // "<div class='configTitle'>"+this.lp.config.apiAddress +"</div>" +
                // "<div><textarea name='apiAddress' style='width: 270px;height: 60px;word-break:break-all;'>"+ (d.api || "") +"</textarea></div>"+
                //
                // "<div class='configTitle'>"+this.lp.config.key +"</div>" +
                // "<div><input name='key' style='width: 270px;height: 26px;' value='"+(d.key || "")+"'></input></div>"+
                //
                // "<div class='configTitle'>"+this.lp.config.secret +"</div>" +
                // "<div><input name='secret' style='width: 270px;height: 26px;' value='"+(d.secret || "")+"'></input></div>";

        }

        this.contentNode.set("html", html);
        this.contentNode.getElements("div.line").setStyles(this.css.configContentLine);
        this.contentNode.getElements("div.configTitle").setStyles(this.css.configTitleDiv);

        if( MWF.AC.isMeetingAdministrator() ){
            this.processNode = this.contentNode.getElement("[item='processArea']");
            this.processNode.setStyles(this.css.configProcessNode);
            this.createApplicationSelect();


            this.meetingViewerNode = this.contentNode.getElement("[item='meetingViewerNode']");
            //this.meetingViewerNode.setStyles(this.css.configProcessNode);

            this.meetingViewer = new MDomItem(this.meetingViewerNode, {
                name : "meetingViewer", type : "org", orgType : ["person","unit","group"], count : 0, style : this.css.configMeetingViewerNode,
                value : d.meetingViewer || []
            } , null, this.app );
            this.meetingViewer.load();

            this.mobileCreateEnableNode = this.contentNode.getElement("[item='mobileCreateEnable']");
            this.mobileCreateEnable = new MDomItem(this.mobileCreateEnableNode, {
                name : "mobileCreateEnable", type : "select", selectValue : ["true","false"], selectText : this.lp.config.mobileCreateEnableOptions,
                value : d.mobileCreateEnable || "true"
            } , null, this.app );
            this.mobileCreateEnable.load();

            this.enableOnlineNode = this.contentNode.getElement("[item='enableOnline']");
            this.enableOnline = new MDomItem(this.enableOnlineNode, {
                name : "enableOnline", type : "select", selectValue : ["true","false"], selectText : [this.lp.yes, this.lp.no],
                value : ( d.enableOnline || false ).toString(),
                event: {
                    change: function (item, ev) {
                        var value = item.getValue();
                        this.contentNode.getElement("div.onlineArea").setStyle("display", value === "true" ? "" : "none");
                        // if( this.onlineProduct.getValue() === "好视通" && value === "true" && !this.scriptEditor )this.loadScriptEditor();
                        this.setSize();
                    }.bind(this)
                }
            } , null, this.app );
            this.enableOnline.load();

            this.onlineProductNode = this.contentNode.getElement("[item='onlineProduct']");
            this.onlineProduct = new MDomItem(this.onlineProductNode, {
                name : "onlineProduct", type : "select", selectValue : ["其他","好视通"], selectText : [this.lp.other,"好视通"],
                value : d.onlineProduct || "其他",
                event: {
                    change: function (item, ev ) {
                        var value = item.getValue();
                        this.contentNode.getElement("div.onlineConfigArea").setStyle("display", value === "好视通" ? "" : "none");
                        // if( value === "好视通" && this.enableOnline.getValue() === "true" &&  !this.scriptEditor )this.loadScriptEditor();
                        this.setSize();
                    }.bind(this)
                }
            } , null, this.app );
            this.onlineProduct.load();

            this.hstAuthNode = this.contentNode.getElement("[item='hstAuth']");
            this.hstAuth = new MDomItem(this.hstAuthNode, {
                name : "hstAuth", type : "select", selectValue : ["true","false"], selectText : [this.lp.yes, this.lp.no],
                value : (d.onlineConfig.hstAuth || false).toString()
                // event: {
                //     change: function (item, ev ) {
                //         var value = item.getValue();
                //         this.contentNode.getElement("div.o2ToHstUidArea").setStyle("display", value === "true" ? "" : "none");
                //         this.setSize();
                //     }.bind(this)
                // }
            } , null, this.app );
            this.hstAuth.load();

            var lp = this.lp.config;
            this.o2ToHstUidNode = this.contentNode.getElement("[item='o2ToHstUid']");
            this.o2ToHstUid = new MDomItem(this.o2ToHstUidNode, {
                name : "o2ToHstUid", type : "select",
                selectValue : ["employee", "unique", "distinguishedName", "mobile","mail", "weixin","qq"],
                selectText : [lp.employee, lp.unique, lp.distinguishedName, lp.mobile, lp.mail, lp.weixin, lp.qq],
                value : d.onlineConfig.o2ToHstUid || "employee"
            } , null, this.app );
            this.o2ToHstUid.load();


            // if( d.onlineProduct === "好视通" && d.enableOnline ){
            //     this.loadScriptEditor();
            // }

        }

        this.actionNode = new Element("div", {"styles": this.css.configActionNode}).inject(this.node);
        this.cancelNode = new Element("div", {"styles": this.css.configActionCancelNode, "text": this.app.lp.cancel}).inject(this.actionNode);
        this.saveNode = new Element("div", {"styles": this.css.configActionSaveNode, "text": this.app.lp.save}).inject(this.actionNode);
        this.saveNode.addClass("mainColor_bg");

        this.cancelNode.addEvent("click", this.hide.bind(this));
        this.saveNode.addEvent("click", this.save.bind(this));

        this.node.addEvent("mousedown", function(e){e.stopPropagation();}.bind(this));

        this.setSize();

        this.show();
    },
    // loadScriptEditor:function(){
    //     var json;
    //     if( !this.configData.onlineConfig ){
    //         json = {
    //             'hstUrl':'好视通服务地址',
    //             'hstKey':'好视通服务接口KEY',
    //             'hstSecret':'好视通服务接口SECRET',
    //             'hstUserSync':'是否启用O2到好视通人员同步'
    //         }
    //     }else{
    //         json = this.configData.onlineConfig;
    //     }
    //     MWF.require("MWF.widget.JavascriptEditor", null, false);
    //     var value;
    //     try{
    //         value = JSON.stringify(json, null, "\t");
    //     }catch (e) {}
    //
    //     var node = this.contentNode.getElement('div[item="onlineConfig"]');
    //     if( value ){
    //         this.scriptEditor = new MWF.widget.JavascriptEditor(node, {
    //             "forceType": "ace",
    //             "option": {"value": value, "mode" : "json" }
    //         });
    //         this.scriptEditor.load(function(){
    //             this.scriptEditor.setValue(value);
    //         }.bind(this));
    //     }
    // },
    setSize : function(){
        var sizeY = this.node.getSize().y;
        var y = this.app.content.getSize().y;
        if( sizeY > y-50 ){
            this.node.setStyle("height", y-50 );
        }

    },
    createApplicationSelect: function(){
        if (this.configData.process){
            MWF.require("MWF.widget.O2Identity", function(){
                var p = new MWF.widget.O2Process(this.configData.process, this.processNode);
            }.bind(this));
        }
        this.processNode.addEvent("click", function(){
            MWF.xDesktop.requireApp("Selector", "package", function(){

                var options = {
                    "type": "Process",
                    "values": [this.process || this.configData.process],
                    "count": 1,
                    "onComplete": function (items) {
                        this.processNode.empty();
                        this.process = null;
                        this.configData.process = null;
                        if (items.length){
                            MWF.require("MWF.widget.O2Identity", function(){
                                var p = new MWF.widget.O2Process(items[0].data, this.processNode);
                                this.process = {
                                    "name": items[0].data.name,
                                    "id": items[0].data.id,
                                    "application": items[0].data.application,
                                    "applicationName": items[0].data.applicationName,
                                    "alias": items[0].data.alias
                                };
                                this.configData.process = this.process;
                            }.bind(this));
                        }

                    }.bind(this)
                };
                var selector = new MWF.O2Selector(this.app.content, options);

            }.bind(this));
        }.bind(this));

    },

    save: function(){
        //var hideMenu = "auto";
        var defaultView = "toMyMeeting";
        var process = null;
        //var node = this.contentNode.getFirst("div");
        //var hideMenuNode = node.getElement("input");
        //if (hideMenuNode) if (!hideMenuNode.checked) hideMenu = "static";

        //node = node.getNext();
        var viewNodes = this.contentNode.getElements("input[name='configSelectDefaultView']");
        for (var i=0; i<viewNodes.length; i++){
            if (viewNodes[i].checked){
                defaultView = viewNodes[i].get("value");
                break;
            }
        }

        MWF.UD.putData("meetingConfig", {
            //"hideMenu": hideMenu,
            "defaultView": defaultView
        }, null, false);

        if( MWF.AC.isMeetingAdministrator() ){
            //if (this.processSelect){
                //process = this.processSelect.options[this.processSelect.selectedIndex].get("value");
                //MWF.UD.putPublicData("meetingConfig", {"process": process});
            //}

            var disableViewList = [];
            var viewAvailableNodes = this.contentNode.getElements("input[name='configAvailableView']");
            for (var i=0; i<viewAvailableNodes.length; i++){
                if ( !viewAvailableNodes[i].checked){
                    disableViewList.push( viewAvailableNodes[i].get("value") ) ;
                }
            }

            var weekBeginSelect = this.contentNode.getElement("select[name='configSelectWeekBeign']");
            var weekBeginValue = "0";
            if( weekBeginSelect ){
                weekBeginValue = weekBeginSelect.options[weekBeginSelect.selectedIndex].get("value");
            }

            var viewer = null;
            if( this.meetingViewer ){
                viewer = this.meetingViewer.getValue();
            }

            var typeList = [];
            var typeListInput = this.contentNode.getElement("textarea[name='typeList']");
            if(typeListInput)typeList = typeListInput.get("value").split("\n");

            // var onlineConfig;
            // if( this.scriptEditor ){
            //     onlineConfig = this.scriptEditor.getValue();
            //     try{
            //         onlineConfig = JSON.parse( onlineConfig );
            //     }catch (e) {
            //         this.app.notice( this.app.lp.onlineConfigNotJson, "info" );
            //         return;
            //     }
            //     onlineConfig = JSON.parse(this.scriptEditor.getValue())
            // }else{
            //     onlineConfig = this.configData.onlineConfig || {};
            // }

            var onlineConfig = {
                hstUrl: this.contentNode.getElement("input[name='hstUrl']").get("value"),
                hstKey: this.contentNode.getElement("input[name='hstKey']").get("value"),
                hstSecret: this.contentNode.getElement("input[name='hstSecret']").get("value"),
                hstAuth: this.hstAuth.getValue() === "true",
                o2ToHstUid: this.o2ToHstUid.getValue(),
            };
            if( this.enableOnline.getValue() === "true" && this.onlineProduct.getValue() === "好视通" ){
                if( !onlineConfig.hstUrl || !onlineConfig.hstKey || !onlineConfig.hstSecret ){
                    this.app.notice( this.app.lp.config.onlineConfigNotEmpty, "info" );
                    return;
                }
            }


            var data = {
                //"hideMenu": hideMenu,
                "process": this.process || this.configData.process,
                "weekBegin" : weekBeginValue,
                "meetingViewer" : viewer,
                "mobileCreateEnable" : this.mobileCreateEnable.getValue(),
                "disableViewList" : disableViewList,
                "typeList": typeList,
                "toMyMeetingViewName" : this.contentNode.getElement("input[name='toMyMeetingViewName']").get("value"),
                "toMonthViewName" : this.contentNode.getElement("input[name='toMonthViewName']").get("value"),
                "toWeekViewName" : this.contentNode.getElement("input[name='toWeekViewName']").get("value"),
                "toDayViewName" : this.contentNode.getElement("input[name='toDayViewName']").get("value"),
                "toListViewName" : this.contentNode.getElement("input[name='toListViewName']").get("value"),
                "toRoomViewName" : this.contentNode.getElement("input[name='toRoomViewName']").get("value"),
                "enableOnline": this.enableOnline.getValue() === "true",
                "onlineProduct": this.onlineProduct.getValue(),
                "onlineConfig": onlineConfig
            };

            o2.Actions.load("x_meeting_assemble_control").ConfigAction.saveSystemConfig(data, function () {
                this.app.meetingConfig = Object.merge(this.app.meetingConfig, data);
            }.bind(this), null, false);
        }

        this.app.notice( this.app.lp.config_saveSuccess, "success" );

        this.hide();
    },
    show: function(){
        this.node.setStyles(MWF.AC.isMeetingAdministrator() ? this.css.configNode_admin : this.css.configNode);
        var fx = new Fx.Morph(this.node, {
            "duration": "500",
            "transition": Fx.Transitions.Expo.easeOut
        });
        fx.start({
            "opacity": 1
        }).chain(function(){
            this.hideFun = this.hide.bind(this);
            this.app.node.addEvent("mousedown", this.hideFun);
        }.bind(this));
    },
    hide: function(){
        if(this.scriptEditor)this.scriptEditor.destroy();
        this.node.destroy();
        this.app.node.removeEvent("mousedown", this.hideFun);
        MWF.release(this);
    }

});