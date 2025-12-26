if (typeof PITChatWidget == "undefined" || !PITChatWidget) {

    var PITChatWidget = {
        init: async function () {
            var self = this;
            var funcInit = async function () {
                var funcMessageListener = function (event) {
                    if (event && event.data && event.data.eventArgs) {
                        if (event.data.eventArgs.type == "close" && !document.getElementById('debug')) {
                            self.close();
                        }
                        else if (event.data.eventArgs.type == "chatPageComplete") {
                            PITChatWidget.DOM.makeChatVisible();
                        }
                    }
                };
                window.addEventListener("message", funcMessageListener);


                await PITChatWidget.options.init();
                PITChatWidget.Load.loadStyles();
                if (PITChatWidget.options.openChat == 'true') {
                    PITChatWidget.DOM.buildChat();
                    PITChatWidget.DOM.showChat();
                } else {
                    PITChatWidget.DOM.drawButton();
                    PITChatWidget.DOM.showMsgCnt();
                }

                resize = function () {
                    var fr = document.getElementById('pit-chat-frame');
                    if (fr) {
                        if (window.top.innerWidth < 1024) {
                            fr.classList.add('mobile');
                        }
                        else {
                            fr.classList.remove('mobile');
                        }
                    }
                };
                window.addEventListener("resize", function () { resize(); });
            };
            if (document.readyState === "complete"
                || document.readyState === "interactive") {
                await funcInit();
            }
            else {
                window.addEventListener("load", async function (event) {
                    await funcInit();
                });
            }
        },

        changeUser: function (userId, userName, userParams) {
            if (typeof userParams == "undefined" || !userParams) {
                if ((!userId && PITChatWidget.options.userId == PITChatWidget.options.defaultUserId())
                    || (userId == PITChatWidget.options.userId)) {
                    return;
                }
                else {
                    PITChatWidget.options.userId = userId;
                    PITChatWidget.options.userName = userName ? userName : '';
                    PITChatWidget.options.init(function () {
                        PITChatWidget.DOM.updateChat();
                    });
                }
            }
            else {
                if ((!userId && PITChatWidget.options.userId == PITChatWidget.options.defaultUserId())
                    || (userId == PITChatWidget.options.userId)) {
                }
                else {
                    PITChatWidget.options.userId = userId;
                    PITChatWidget.options.userName = userName ? userName : '';
                }
                PITChatWidget.options.userParams = userParams;

                PITChatWidget.options.init(function () {
                    PITChatWidget.DOM.updateChat();
                });
            }
            let uid = localStorage.getItem('pitChatUserId');
            if (!uid) {
                localStorage.setItem('pitChatUserId', userId)
            } else if (uid != userId) {
                localStorage.setItem('pitChatUserId', userId)
                localStorage.setItem('oldPitChatUserId', uid)
            }
        },

        close: function () {
            PITChatWidget.DOM.hideChat();
            PITChatWidget.DOM.destroyChat();
        },

        destroy: function () {
            PITChatWidget.DOM.destroyButton();
            PITChatWidget.DOM.destroyChat();
        },

        trigger: function () {
            if (PITChatWidget.DOM.isChatOpen()) {
                PITChatWidget.DOM.hideChat();
                return false;
            }
            else {
                PITChatWidget.DOM.showChat();
                return true;
            }
        },

    };
}

PITChatWidget.Utils = typeof PITChatWidget.Utils != 'undefined' && PITChatWidget.Utils ? PITChatWidget.Utils : {
    isUndefined: function (o) {
        return typeof o === 'undefined';
    },
    isString: function (o) {
        return typeof o === 'string';
    },
    newGuid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    getCookie: function (name) {
        var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    },
    setCookie: function (name, value) {
        document.cookie = name + '=' + value + ';path=/; secure';

    },
    parseLocation: function (href) {
        var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
        return match && {
            href: href,
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7]
        }
    },
    getSearchParam: function (search, param) {
        param = param.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(search);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },
    getJSTagParams: function (scriptId) {
        var scriptTag = document.getElementById(scriptId);
        if (scriptTag) {
            var urlParams = this.parseLocation(scriptTag.src);
            return {
                pitUrl: urlParams.protocol + "//" + urlParams.host,
                entityId: this.getSearchParam(urlParams.search, "entityId"),
                accountId: this.getSearchParam(urlParams.search, "accountId"),
                openChat: this.getSearchParam(urlParams.search, "open"),
            };
        }
        else {
            console.log("Not found script");
        }
    },
    isAbsoluteUrl: function (url) {
        var r = new RegExp('^(?:[a-z]+:)?//', 'i');
        return r.test(url);
    },
    correctUrlToPit: function (pitUrl, url) {
        if (!url) {
            return '';
        }
        else if (this.isAbsoluteUrl(url)) {
            return url;
        }
        else {
            return pitUrl + url;
        }
    }
};

PITChatWidget.Load = typeof PITChatWidget.Load != 'undefined' && PITChatWidget.Load ? PITChatWidget.Load : {
    loadStyle: function (url) {
        if (url) {
            /* var _xhr = XMLHttpRequest;
             var has_cred = false;
             try { has_cred = _xhr && ('withCredentials' in (new _xhr())); } catch (e) { }
             if (!has_cred) {
                 console.error('CORS not supported');
                 return;
             }
             var xhr = new _xhr();
             xhr.open('GET', url);
             xhr.onload = function () {
                 xhr.onload = xhr.onerror = null;
                 if (xhr.status < 200 || xhr.status >= 300) {
                     console.error('style failed to load: ' + url);
                 } else {
                     /*var style_tag = document.createElement('style');
                     style_tag.appendChild(document.createTextNode(xhr.responseText));
                     document.head.appendChild(style_tag);*/
            var link = document.createElement("link");
            link.href = url;
            link.type = "text/css";
            link.rel = "stylesheet";
            link.media = "screen,print";
            document.head.appendChild(link);
            /*}
        };
        xhr.onerror = function () {
            xhr.onload = xhr.onerror = null;
            console.error('XHR CORS CSS fail:' + styleURI);
        };
        xhr.send(); */
        }
    },

    loadStyles: function () {
        let self = this;
        this.loadStyle(PITChatWidget.Utils.correctUrlToPit(PITChatWidget.options.pitUrl, '/chat/pit-chat-start.css'))
        let customStyle = PITChatWidget.options.cssUrl
        if (PITChatWidget.options.cssUrlBefore != null) {
            window.setTimeout(function () {
                self.loadStyle(PITChatWidget.Utils.correctUrlToPit(PITChatWidget.options.pitUrl, PITChatWidget.options.cssUrlBefore));
            }, 10);
        } else if (customStyle && customStyle != '/chat/chat.css') {
            customStyle = customStyle.split('.')[0] + '-start.css';
            window.setTimeout(function () {
                self.loadStyle(PITChatWidget.Utils.correctUrlToPit(PITChatWidget.options.pitUrl, customStyle));
            }, 10);
        }
    }
};

PITChatWidget.DOM = typeof PITChatWidget.DOM != 'undefined' && PITChatWidget.DOM ? PITChatWidget.DOM : {
    drawButton: function () {
        var pitUrl = PITChatWidget.options.pitUrl;
        this.btn = document.createElement('img');
        this.btn.src = PITChatWidget.Utils.correctUrlToPit(pitUrl, PITChatWidget.options.openChatIcon);
        this.btn.dataset.state = "on";
        this.btn.dataset.on_src = PITChatWidget.Utils.correctUrlToPit(pitUrl, PITChatWidget.options.openChatIcon);
        this.btn.dataset.off_src = PITChatWidget.Utils.correctUrlToPit(pitUrl, PITChatWidget.options.closeChatIcon);
        this.btn.id = "pit-chat-btn";
        this.btn.style = "display: none";
        this.btn.className += " pit-chat-btn";

        var self = this;
        this.btn.addEventListener("click", function (ev) {
            if (self.isChatOpen()) {
                self.hideChat();
            }
            else {
                self.showChat();
            }
        });
        var batDiv = document.getElementById('PITChatWidgetButtonDiv');
        if (batDiv) {
            batDiv.appendChild(this.btn);
            if (this.cnt)
                batDiv.appendChild(this.cnt);
        } else {
            document.body.appendChild(this.btn);
        }
    },

    isChatOpen: function () {
        return this.frame && this.frame.dataset.state == "on";
    },

    loadChatFrame: function () {
        var self = this;
        if (self.isChatOpen() || 1) {
            var setFrameSrc = function () {
                if (self.frame.dataset.originalSrc != PITChatWidget.options.chatUrl) {
                    // self.frame.className += " pit-hidden";
                    // self.curtain.classList.remove("pit-hidden");
                    var url = PITChatWidget.options.chatUrl;
                    // url = url.replace(/.+vocamate.ru/,location.origin)
                    //var url = url.replace("cchat","cchat2")
                    self.frame.src = url;
                }
            }
            if (!PITChatWidget.options.chatUrl) {
                PITChatWidget.options.getUrlRequest(function () {
                    setFrameSrc();
                });
            }
            else {
                setFrameSrc();
            }
        }
    },

    buildChat: async function () {
        var self = this;
        if (this.area) {
            this.updateChat();
            return;
        }
        var pitUrl = PITChatWidget.options.pitUrl;

        this.area = document.getElementById("pit-chat-area");
        if (!this.area){
            this.area = document.createElement('div');
            this.area.id = "pit-chat-area";
        }
        this.area.dataset.state = "off";

        /*this.header = document.createElement('div');

        var chatDiv = document.getElementById('PITChatWidgetDiv');
        var debugMode;
        if (chatDiv){
            debugMode = true;
            this.area.className += " pit-chat-debug-area pit-hidden";
            chatDiv.appendChild(this.area);
        this.header.className += " pit-chat-debug-area-header";
        }
        else{
            this.area.className += " pit-chat-area pit-hidden";
            document.body.appendChild(this.area);


        this.header.className += " pit-chat-area-header";
        }
        !debugMode&&this.area.appendChild(this.header);*/

        if (PITChatWidget.options.anChatAreaDragAndDrop) {
            this.header.className += " allow-move";
            this.header.addEventListener('mousedown', function (ev) {
                var body = document.body;
                var scrollTop = window.pageYOffset || body.scrollTop;
                var scrollLeft = window.pageXOffset || body.scrollLeft;
                var x0 = ev.offsetX, y0 = ev.offsetY;
                var parent = this.parentNode;
                //var box = parent.getBoundingClientRect();
                //var pX = box.left, pY = box.top;                
                var oldOpacity = parent.style.opacity;
                parent.style.opacity = 0.85;
                var ifrm = document.getElementById("pit-chat-frame");
                ifrm.style['pointer-events'] = 'none';

                var moveChatArea = function (ev) {
                    parent.style.left = (ev.pageX - x0 - scrollLeft) + "px";
                    parent.style.top = (ev.pageY - y0 - scrollTop) + "px";
                    ev.preventDefault();
                    return false;
                };
                body.addEventListener("mousemove", moveChatArea, false);

                var endMoveChatArea = function (ev) {
                    parent.style.opacity = oldOpacity;
                    ifrm.style['pointer-events'] = 'auto';
                    body.removeEventListener('mouseup', endMoveChatArea, false);
                    body.removeEventListener('mousemove', moveChatArea, false);
                    body.removeEventListener('mouseleave', endMoveChatArea, false);
                    ev.preventDefault();
                    return false;
                }
                body.addEventListener('mouseup', endMoveChatArea, false);
                body.addEventListener('mouseleave', endMoveChatArea, false);
                ev.preventDefault();
                return false;
            }, false);
        }

        /*var headerText = document.createElement('span');
        headerText.className += " pit-chat-area-header-text";
        headerText.innerText = '??? ????????? Vocamate'
        this.header.appendChild(headerText);

        var closeBtn = document.createElement('img');
        closeBtn.src = "";
        closeBtn.className += " pit-chat-close-btn";
        closeBtn.addEventListener("click", function (ev) {
            self.hideChat();
        });
        this.header.appendChild(closeBtn);*/

        //var closeBtn = document.createElement('img');
        /*closeBtn.src = PITChatWidget.Utils.correctUrlToPit(pitUrl, PITChatWidget.options.closeChatIcon);
        closeBtn.className += " pit-chat-close-btn";
        closeBtn.addEventListener("click", function (ev) {
            self.hideChat();
        });
        //this.header.appendChild(closeBtn);
        this.curtain = document.createElement('div');
        this.curtain.className += " pit-chat-curtain";
        this.area.appendChild(this.curtain);*/

        this.frame = document.createElement('iframe');
        this.frame.id = "pit-chat-frame";
        this.frame.allow = "clipboard-read; clipboard-write; microphone; camera; autoplay ";
        this.frame.className += " pit-chat-frame";
        this.frame.frameBorder = 0;
        this.frame.dataset.originalSrc = "";
        this.frame.dataset.state = "off";
        this.frame.onload = function () {

            /*if (self.area) {
                if (self.curtain.className.indexOf("pit-hidden") == -1) {
                    self.curtain.className += " pit-hidden";
                }


            }*/
        }
        this.loadChatFrame();
        //this.area.appendChild(this.frame);
        if (document.getElementById('PITChatWidgetDiv'))
            PITChatWidgetDiv.appendChild(this.frame)
        else
            document.body.appendChild(this.frame)

        window.setTimeout(function () {
            if (PITChatWidget.onBuildChatCompleted) {
                PITChatWidget.onBuildChatCompleted(self.area);
            }
        }, 0);
    },

    updateChat: function () {
        this.frame.src = this.frame.dataset.originalSrc = PITChatWidget.options.chatUrl = '';
        this.loadChatFrame();
        if (!PITChatWidget.options.unreadMsgCnt)
            PITChatWidget.options.unreadMsgCnt = 0;

        this.showMsgCnt();
    },

    showMsgCnt: function () {
        if (!document.getElementById('msgCnt')) {
            this.cnt = document.createElement('div');
            this.cnt.id = 'msgCnt';
            this.cnt = document.body.appendChild(this.cnt);
            this.cnt.style.display = (this.cnt.innerText == '0' ? 'none' : 'block');
        }
        if (PITChatWidget.options.unreadMsgCnt) {
            this.cnt.innerText = PITChatWidget.options.unreadMsgCnt;
        }
        else {
            document.getElementById('msgCnt').style = 'display:none';
        }
    },

    showChat: async function () {
        if (this.frame) {
            if (window.top.innerWidth < 1024) {
                document.getElementsByTagName('BODY')[0].classList.add('pit_noscrollmobile')
            }
            this.frame.classList.remove("pit-hidden");
            this.frame.dataset.state = "on";
            if (this.btn) {
                this.btn.dataset.state = "off";
                this.btn.src = this.btn.dataset.off_src;
            }
            if (document.getElementById('msgCnt')) {
                document.getElementById('msgCnt').style = 'display:none';
            }

            if (this.frame) {
                this.frame.contentWindow.postMessage({ eventArgs: { type: "show", error: null } }, '*');
            }
        }
        else {
            var self = this;
            await self.buildChat();
            //window.setTimeout(function () {
                resize();
                self.showChat();
            //}, 100);
        }
    },

    makeChatVisible: function () {
        if (this.curtain) {
            if (this.curtain.className.indexOf("pit-hidden") == -1) {
                this.curtain.className += " pit-hidden";
            }
            this.area.classList.remove("pit-hidden")
        }
    },

    hideChat: function () {
        if (this.frame && this.btn) {
            if (window.top.innerWidth < 1024) {
                document.getElementsByTagName('BODY')[0].classList.remove('pit_noscrollmobile')
            }
            this.frame.className += " pit-hidden";
            this.frame.dataset.state = "off";
            this.btn.dataset.state = "on";
            this.btn.src = this.btn.dataset.on_src;
        }
    },

    destroyButton: function () {
        if (this.btn) {
            this.btn.remove();
            this.btn = null;
        }
    },

    destroyChat: function () {
        if (this.area) {
            PITChatWidget.options.chatUrl = this.frame.src = '';
            this.area.remove();
            this.area = null;
            this.frame = null;
        }
    },
};

PITChatWidget.options = typeof PITChatWidget.options != 'undefined' && PITChatWidget.options ? PITChatWidget.options : {

    platformId: "B7002127-4D90-4567-97F5-A864821D2C07",
    channelId: "E3CEFC96-3946-40BA-9373-052FF0F75811",
    userId: null,
    userName: "",
    userParams: null,

    init: async function (onSuccess) {
        var params = PITChatWidget.Utils.getJSTagParams('pit-chat-widget');
        if (params) {
            this.pitUrl = params.pitUrl;
            this.entityId = params.entityId;
            this.accountId = params.accountId;
            this.openChat = params.openChat;
            this.getUserId();
            if (this.chatUrl) {
                if (onSuccess) {
                    onSuccess();
                }
            }
            else {
                await this.getUrlRequest(onSuccess);
            }
        }
    },

    defaultUserId: function () {
        var uid = localStorage.getItem('pitChatUserId');
        if (!uid) {
            uid = PITChatWidget.Utils.newGuid();
            localStorage.setItem('pitChatUserId', uid);
        }
        return uid;
    },

    getUserId: function () {
        if (!this.userId) {
            this.userId = this.defaultUserId();
        }
        return this.userId;
    },

    buildData: function () {
        let userParams = this.userParams ? this.userParams : {}
        let oldUserId = localStorage.getItem('oldPitChatUserId')
        if (oldUserId != null) {
            userParams.oldUserId = oldUserId
        }
        let url = (window.location != window.parent.location) ? document.referrer : document.location.href;
        userParams.url = url
        userParams.widgetVersion = 'iframe'
        return {
            pitUrl: this.pitUrl,
            entityId: this.entityId,
            accountId: this.accountId,
            platformId: this.platformId,
            channelId: this.channelId,
            userId: this.userId,
            userName: this.userName,
            userParams: JSON.stringify(userParams)
        };
    },
    getUrlRequest: async function (onSuccess) {
        const self = this;
        const data = this.buildData();
        if (!data.entityId) {
            throw new Error('entityId is required');
        }

        try {
            console.log(new Date().toISOString(), "getUrlRequest");
            const response = await fetch(this.pitUrl + '/VI/Session/Chat/UrlRequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requestBody: data })
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const respObj = await response.json();

            if (respObj.isEnabled) {
                console.log(new Date().toISOString(), "getUrlRequestAnswer");
                self.chatUrl = respObj.chatUrl;
                self.cssUrl = respObj.cssUrl || "/chat/chat.css";
                self.openChatIcon = respObj.openChatIcon || "/chat/chat_open.png";
                self.closeChatIcon = respObj.closeChatIcon || "/chat/chat_close.png";
                self.anChatAreaDragAndDrop = respObj.anChatAreaDragAndDrop;
                self.unreadMsgCnt = respObj.unreadMsgCnt;
                self.cssUrlBefore = respObj.CSSUrlBefore || null;

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                PITChatWidget.destroy();
                throw new Error('Chat is not enabled');
            }
        } catch (error) {
            throw error;
        }
    }
}
window.addEventListener('message', function (event) {
    if (event.data === 'hideChat') {
        if (typeof PITChatWidget !== 'undefined' && PITChatWidget.DOM && typeof PITChatWidget.DOM.hideChat === 'function') {
            PITChatWidget.DOM.hideChat();
        }
    }
})

PITChatWidget.init();