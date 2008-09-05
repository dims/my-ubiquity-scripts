// todo: close Ubiquity window after completing the insert
// todo: allow keyboard selection
// todo: underline the words that match
// todo: add insert-tab-link command
// todo: add copy-link command or UI
// todo: improve style and display of found links
// todo: support * for bookmark filtering (like the AwesomeBar)

CmdUtils.CreateCommand({
    name: "go",

    takes: {
        "search terms": noun_arb_text
    },

    preview: function(pblock, theWords) {
        var self = this; // capture for later

        if (theWords.text.length == 0) { return; }

        var regexp = /(ftp|http|https):\/\/(\w+:{01}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        if (regexp.test(theWords.text)){
            var msg = "<iframe src='" + theWords.text + "' width=500 height=400/>";
            pblock.innerHTML = msg;
            return;
        }

        var onClickFactory = function (url) { 
            return function() { 
                Utils.openUrlInBrowser(url); 

                // Get the main window that contains the browser XUL document
                // and close the Ubiquity popup
                var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIWebNavigation)
                     .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                     .rootTreeItem
                     .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIDOMWindow);
                mainWindow.gUbiquity.closeWindow();
            };
        }

        var onSearchComplete = function(controller) {
            // do_check_eq(controller.searchStatus, Ci.nsIAutoCompleteController.STATUS_COMPLETE_MATCH);

              var links = self._getLinks(controller);
              pblock.innerHTML = CmdUtils.renderTemplate( style + template, { links: links });
              self._activateLinks(pblock, onClickFactory);
        };

        this._getHistoryLinks(theWords.text, onSearchComplete);
    },

    execute: function(theWords) {
        Utils.openUrlInBrowser(theWords.text);
    },

    _activateLinks: function(node, onClickFactory) {
        // find all anchors with an onclick, and replace it with a call to onClickFactory(url);

        for (var i = 0; i < node.childNodes.length; i++) {
            var child = node.childNodes[i];
            if (!child.getAttribute) { continue; }
            
            var url= child.getAttribute("url");
            
            if (url && url != "") {
                child.removeAttribute("url");
                child.onclick = onClickFactory(url);
            } else {
                this._activateLinks(child, onClickFactory);
            }
            
            child = null;
            url = null;
        }

    },

    _getLinks: function(controller) {
        var links = [];
        var maxLinks = 6;

        for (var i = 0; i < controller.matchCount && i < maxLinks; i++) {
            var url = controller.getValueAt(i);
            var title = controller.getCommentAt(i);
            if (title.length == 0) { title = url; }

            var favicon = controller.getImageAt(i);
            var displayurl = (url.length < 67) ? url : (url.substr(0, 64) + "...");

            links.push( { url: url, title: title, displayurl: displayurl, favicon: favicon} );
        }

        return links;
    },

    _getHistoryLinks: function(partialSearch, onSearchComplete) {
        function AutoCompleteInput(aSearches) {
            this.searches = aSearches;
        }
        AutoCompleteInput.prototype = {
            constructor: AutoCompleteInput,

            searches: null,

            minResultsForPopup: 0,
            timeout: 10,
            searchParam: "",
            textValue: "",
            disableAutoComplete: false,
            completeDefaultIndex: false,

            get searchCount() {
                return this.searches.length;
            },

            getSearchAt: function(aIndex) {
                return this.searches[aIndex];
            },

            onSearchBegin: function() {},
            onSearchComplete: function() {},

            popupOpen: false,

            popup: {
                setSelectedIndex: function(aIndex) {},
                invalidate: function() {},

                // nsISupports implementation
                QueryInterface: function(iid) {
                    if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIAutoCompletePopup)) return this;

                    throw Components.results.NS_ERROR_NO_INTERFACE;
                }
            },

            // nsISupports implementation
            QueryInterface: function(iid) {
                if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIAutoCompleteInput)) return this;

                throw Components.results.NS_ERROR_NO_INTERFACE;
            }
        }

        var controller = Components.classes["@mozilla.org/autocomplete/controller;1"].getService(Components.interfaces.nsIAutoCompleteController);

        var input = new AutoCompleteInput(["history"]);
        controller.input = input;

//        input.onSearchBegin = function() { };

        input.onSearchComplete = function() {
            onSearchComplete(controller);
        };

        controller.startSearch(partialSearch);
    }
})

var style = ""+
"<style> "+
"    .link-actions { "+
"      padding: 5px; cursor: default; "+
"    } "+
"    .link-actions:hover { "+
"      color: #C0FFC0; background-color: lightslategray; text-decoration: none; color: black; "+
"    } "+
"    .link-actions .url { "+
"      color: lightslategray; "+
"    } "+
"    .link-actions:hover .url { "+
"      color: black; "+
"    } "+"</style> "+
"";

var template = "" +
"{for link in links}"+
"  <div class='link-actions' url='${link.url}' >"+
" <img src='${link.favicon}'/> "+
"    <a>${link.title}</a> "+
" <div class='url'>${link.displayurl}</div> "+
"  </div>"+
"{forelse}"+ 
"  <b>No link found.</b>"+
"{/for}"+
"";