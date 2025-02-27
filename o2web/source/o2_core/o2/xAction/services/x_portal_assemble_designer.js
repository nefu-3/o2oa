MWF.xAction.RestActions.Action["x_portal_assemble_designer"] = new Class({
    Extends: MWF.xAction.RestActions.Action,
    getUUID: function(success, async){
        var sync = (async !== false);
        var id = "";
        this.action.invoke({"name": "getId","async": sync, "parameter": {"count": "1"}, "success": function(ids){
            id = ids.data[0].id;
            if (success) success(id);
        },	"failure": null});
        return id;
    },
    listApplicationSummary: function(categoryName, success, failure, async){
        if (categoryName){
            this.action.invoke({"name": "listApplicationByCategorySummary","async": async, "parameter": {"applictionCategory": categoryName}, "success": success,	"failure": failure});
        }else{
            this.action.invoke({"name": "listApplicationSummary","async": async, "success": success,	"failure": failure});
        }
    },
    saveApplication: function(applicationData, success, failure){
        if (applicationData.id){
            this.updateApplication(applicationData.id, applicationData, success, failure);
        }else{
            this.addApplication(applicationData, success, failure);
        }
    },
    savePage: function(pageData, mobileData, fieldList, success, failure){
        if (!pageData.isNewPage){
            this.updatePage(pageData, mobileData, fieldList, success, failure);
        }else{
            this.addPage(pageData, mobileData, fieldList, success, failure);
        }
    },

    updatePage: function(pageData, mobileData, fieldList, success, failure){
        var data, mobileDataStr;
        if (pageData) data = MWF.encodeJsonString(JSON.encode(pageData));
        if (mobileData) mobileDataStr = MWF.encodeJsonString(JSON.encode(mobileData));

        var relatedScriptMap = null;
        if (pageData && pageData.json.includeScripts && pageData.json.includeScripts.length){
            relatedScriptMap = {};
            pageData.json.includeScripts.each(function(s){
                relatedScriptMap[s.id] = ((s.appType==="process") ? "processPlatform" : s.appType);
            });
        };

        var mobileRelatedScriptMap = null;
        if (mobileData && mobileData.json.includeScripts && mobileData.json.includeScripts.length){
            mobileRelatedScriptMap = {};
            mobileData.json.includeScripts.each(function(s){
                mobileRelatedScriptMap[s.id] = ((s.appType==="process") ? "processPlatform" : s.appType);
            });
        }

        var json = {
            "id": pageData.json.id,
            "name": pageData.json.name,
            "alias": pageData.json.name,
            //"hasMobile": false,
            "description": pageData.json.description,
            "portal": pageData.json.application,
            "icon": pageData.json.formIcon,
            "formFieldList": fieldList,
            "relatedScriptMap": relatedScriptMap,
            "relatedWidgetList": (pageData && pageData.json.widgetList) ? pageData.json.widgetList : [],
            "mobileRelatedScriptMap": mobileRelatedScriptMap,
            "mobileRelatedWidgetList": (mobileData && mobileData.json.widgetList) ? mobileData.json.widgetList : []
        };
        if (mobileData && mobileData.json.moduleList){
            if (Object.keys(mobileData.json.moduleList).length){
                json.hasMobile = true;
            }else{
                json.hasMobile = false;
            }
        }
        if (pageData) json.data = data;
        if (mobileData) json.mobileData = mobileDataStr;
        this.action.invoke({"name": "updatePage","data": json,"parameter": {"id": pageData.json.id},"success": success,"failure": failure});
    },

    saveFile: function(data, success, failure, async){
        if (data.id){
            this.updataFile(data.id, data, success, failure);
        }else{
            this.getUUID(function(id){
                data.id = id;
                this.addFile(data, success, failure, async);
            }.bind(this), false);

        }
    },

    addPage: function(pageData, mobileData, fieldList, success, failure){
        var data, mobileDataStr;
        if (!pageData.json.id){
            this.getUUID(function(id){
                pageData.json.id = id;

                if (pageData) data = MWF.encodeJsonString(JSON.encode(pageData));


                if ( mobileData && !mobileData.json.id ){
                    mobileData.json.id = id;
                }
                if (mobileData) mobileDataStr = MWF.encodeJsonString(JSON.encode(mobileData));

                var relatedScriptMap = null;
                if (pageData && pageData.json.includeScripts && pageData.json.includeScripts.length){
                    relatedScriptMap = {};
                    pageData.json.includeScripts.each(function(s){
                        relatedScriptMap[s.id] = ((s.appType==="process") ? "processPlatform" : s.appType);
                    });
                };

                var mobileRelatedScriptMap = null;
                if (mobileData && mobileData.json.includeScripts && mobileData.json.includeScripts.length){
                    mobileRelatedScriptMap = {};
                    mobileData.json.includeScripts.each(function(s){
                        mobileRelatedScriptMap[s.id] = ((s.appType==="process") ? "processPlatform" : s.appType);
                    });
                }

                var json = {
                    "id": pageData.json.id,
                    "name": pageData.json.name,
                    "hasMobile": false,
                    "alias": pageData.json.name,
                    "description": pageData.json.description,
                    "portal": pageData.json.application,
                    "icon": pageData.json.formIcon,
                    "formFieldList": fieldList,
                    "relatedScriptMap": relatedScriptMap,
                    "relatedWidgetList": (pageData && pageData.json.widgetList) ? pageData.json.widgetList : [],
                    "mobileRelatedScriptMap": mobileRelatedScriptMap,
                    "mobileRelatedWidgetList": (mobileData && mobileData.json.widgetList) ? mobileData.json.widgetList : []
                };
                if (mobileData && mobileData.json.moduleList){
                    if (Object.keys(mobileData.json.moduleList).length){
                        json.hasMobile = true;
                    }else{
                        json.hasMobile = false;
                    }
                }

                if (pageData) json.data = data;
                if (mobileData) json.mobileData = mobileDataStr;
                this.action.invoke({"name": "addPage","data": json, "parameter": {"id": pageData.json.categoryId}, "success": success,"failure": failure});
            }.bind(this));
        }else{
            if (pageData) data = MWF.encodeJsonString(JSON.encode(pageData));
            if ( mobileData && !mobileData.json.id ){
                mobileData.json.id = pageData.json.id;
            }
            if (mobileData) mobileDataStr = MWF.encodeJsonString(JSON.encode(mobileData));

            var json = {
                "id": pageData.json.id,
                "name": pageData.json.name,
                "alias": pageData.json.name,
                "hasMobile": false,
                "description": pageData.json.description,
                "portal": pageData.json.application
            };

            if (mobileData && mobileData.json.moduleList){
                if (Object.keys(mobileData.json.moduleList).length){
                    json.hasMobile = true;
                }else{
                    json.hasMobile = false;
                }
            }
            if (pageData) json.data = data;
            if (mobileData) json.mobileData = mobileDataStr;
            this.action.invoke({"name": "addPage","data": json, "parameter": {"id": pageData.json.categoryId}, "success": success,"failure": failure});
        }
    },
    saveWidget: function(pageData, mobileData, fieldList, success, failure){
        if (!pageData.isNewPage){
            this.updateWidget(pageData, mobileData, fieldList, success, failure);
        }else{
            this.addWidget(pageData, mobileData, fieldList, success, failure);
        }
    },
    updateWidget: function(pageData, mobileData, fieldList, success, failure){
        var data, mobileDataStr;
        if (pageData) data = MWF.encodeJsonString(JSON.encode(pageData));
        if (mobileData) mobileDataStr = MWF.encodeJsonString(JSON.encode(mobileData));
        var json = {
            "id": pageData.json.id,
            "name": pageData.json.name,
            "alias": pageData.json.name,
            //"hasMobile": false,
            "description": pageData.json.description,
            "portal": pageData.json.application,
            "icon": pageData.json.formIcon,
            "formFieldList": fieldList
        };
        if (mobileData && mobileData.json.moduleList){
            if (Object.keys(mobileData.json.moduleList).length){
                json.hasMobile = true;
            }else{
                json.hasMobile = false;
            }
        }
        if (pageData) json.data = data;
        if (mobileData) json.mobileData = mobileDataStr;
        this.action.invoke({"name": "updateWidget","data": json,"parameter": {"id": pageData.json.id},"success": success,"failure": failure});
    },
    addWidget: function(pageData, mobileData, fieldList, success, failure){
        var data, mobileDataStr;
        if (!pageData.json.id){
            this.getUUID(function(id){
                pageData.json.id = id;

                if (pageData) data = MWF.encodeJsonString(JSON.encode(pageData));
                if (mobileData) mobileDataStr = MWF.encodeJsonString(JSON.encode(mobileData));

                var json = {
                    "id": pageData.json.id,
                    "name": pageData.json.name,
                    "hasMobile": false,
                    "alias": pageData.json.name,
                    "description": pageData.json.description,
                    "portal": pageData.json.application,
                    "icon": pageData.json.formIcon,
                    "formFieldList": fieldList
                };
                if (mobileData && mobileData.json.moduleList){
                    if (Object.keys(mobileData.json.moduleList).length){
                        json.hasMobile = true;
                    }else{
                        json.hasMobile = false;
                    }
                }

                if (pageData) json.data = data;
                if (mobileData) json.mobileData = mobileDataStr;
                this.action.invoke({"name": "addWidget","data": json, "parameter": {"id": pageData.json.categoryId}, "success": success,"failure": failure});
            }.bind(this));
        }else{
            if (pageData) data = MWF.encodeJsonString(JSON.encode(pageData));
            if (mobileData) mobileDataStr = MWF.encodeJsonString(JSON.encode(mobileData));

            var json = {
                "id": pageData.json.id,
                "name": pageData.json.name,
                "alias": pageData.json.name,
                "hasMobile": false,
                "description": pageData.json.description,
                "portal": pageData.json.application
            };

            if (mobileData && mobileData.json.moduleList){
                if (Object.keys(mobileData.json.moduleList).length){
                    json.hasMobile = true;
                }else{
                    json.hasMobile = false;
                }
            }
            if (pageData) json.data = data;
            if (mobileData) json.mobileData = mobileDataStr;
            this.action.invoke({"name": "addWidget","data": json, "parameter": {"id": pageData.json.categoryId}, "success": success,"failure": failure});
        }
    },

    addPageTemplate: function(pageData, mobileData, templateData, success, failure){
        var data, mobileDataStr;
        this.getUUID(function(id){
            templateData.id = id;
            if (pageData){
                var tPageData = Object.clone(pageData);
                tPageData.json.id = id;
                tPageData.json.name = templateData.name;
                data = MWF.encodeJsonString(JSON.encode(tPageData));
            }
            if (mobileData){
                var tMobileData = Object.clone(mobileData);
                tMobileData.json.id = id;
                tMobileData.json.name = templateData.name;
                mobileDataStr = MWF.encodeJsonString(JSON.encode(tMobileData));
            }

            if (pageData) templateData.data = data;
            if (mobileData) templateData.mobileData = mobileDataStr;
            this.action.invoke({"name": "addPageTemplate","data": templateData, "success": success,"failure": failure});
        }.bind(this));
    },
    saveSource: function(sourceData, success, failure){
        if (!sourceData.isNewSource){
            this.updateSource(sourceData, success, failure);
        }else{
            this.addSource(sourceData, success, failure);
        }
    },
    updateSource: function(sourceData, success, failure){
        var data =sourceData.data;
        sourceData.data = JSON.encode(sourceData.data);
        this.action.invoke({"name": "updataSource","data": sourceData,"parameter": {"id": sourceData.id},"success": success,"failure": failure});
        sourceData.data = data;
    },
    addSource: function(sourceData, success, failure){
        var data =sourceData.data;
        sourceData.data = JSON.encode(sourceData.data);
        if (!data.id){
            this.getUUID(function(id){
                sourceData.id = id;
                this.action.invoke({"name": "addSource","data": sourceData, "success": success,"failure": failure});
                sourceData.data = data;
            }.bind(this));
        }else{
            this.action.invoke({"name": "addSource","data": sourceData, "success": success,"failure": failure});
            sourceData.data = data;
        }
    },
    saveMenu: function(data, success, failure){
        if (!data.isNewMenu){
            this.updateMenu(data, success, failure);
        }else{
            this.addStat(data, success, failure);
        }
    },
    updateMenu: function(menuData, success, failure){
        var data =menuData.data;
        menuData.data = JSON.encode(menuData.data);
        this.action.invoke({"name": "updataMenu","data": menuData,"parameter": {"id": statData.id},"success": success,"failure": failure});
        menuData.data = data;
    },
    addMenu: function(menuData, success, failure){
        var data =menuData.data;
        menuData.data = JSON.encode(menuData.data);
        if (!data.id){
            this.getUUID(function(id){
                menuData.id = id;
                this.action.invoke({"name": "addMenu","data": menuData, "success": success,"failure": failure});
                menuData.data = data;
            }.bind(this));
        }else{
            this.action.invoke({"name": "addMenu","data": menuData, "success": success,"failure": failure});
            menuData.data = data;
        }
    },
    saveScript: function(data, success, failure){
        if (!data.isNewScript){
            this.updateScript(data, success, failure);
        }else{
            this.addScript(data, success, failure);
        }
    },
    updateScript: function(data, success, failure){
        this.action.invoke({"name": "updataScript","data": data,"parameter": {"id": data.id},"success": success,"failure": failure});
    },
    addScript: function(data, success, failure){
        data.portal = data.application;

        if (!data.id){
            this.getUUID(function(id){
                data.id = id;
                this.action.invoke({"name": "addScript","data": data,"success": success,"failure": failure});
            }.bind(this));
        }else{
            this.action.invoke({"name": "addScript","data": data,"success": success,"failure": failure});
        }
    },
    changeApplicationIcon: function(applicationId, success, failure, formData, file){
        this.action.invoke({"name": "updateApplicationIcon", "parameter": {"id": applicationId},"data": formData,"file": file,"success": success,"failure": failure});
    },

    listDictionary: function(application, success, failure, async){
        this.action.invoke({"name": "listDictionary","async": async, "parameter": {"portalId": application}, "success": success,	"failure": failure});
    },
    getDictionary: function(id, success, failure, async){
        this.action.invoke({"name": "getDictionary","async": async, "parameter": {"id": id},	"success": success,	"failure": failure});
    },
    saveDictionary: function(data, success, failure){
        if (data.id){
            this.updateDictionary(data, success, failure);
        }else{
            this.addDictionary(data, success, failure);
        }
    },
    updateDictionary: function(data, success, failure){
        this.action.invoke({"name": "updataDictionary","data": data,"parameter": {"id": data.id},"success": success,"failure": failure});
    },
    addDictionary: function(data, success, failure){
        if (!data.id){
            var dirData = Object.clone(data);
            this.getUUID(function(id){
                dirData.id = id;
                this.action.invoke({"name": "addDictionary","data": dirData,"success": success,"failure": failure});
            }.bind(this));
        }else{
            this.action.invoke({"name": "addDictionary","data": data,"success": success,"failure": failure});
        }
    },
    deleteDictionary: function(id, success, failure, async){
        this.action.invoke({"name": "removeDictionary", "async": async, "parameter": {"id": id}, "success": success, "failure": failure});
    }
});
