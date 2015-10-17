/****************************************************************************************

    Asterisk Administration Console
    Configuration Editor Module
    
****************************************************************************************/

var asteriskeditor = (function () {

    var exports = {};
    
    var screen = null;
    var ast_editor = null;
    var updateTimer = null;	
    var files = {};	 // holds all currently active files
    var currentFile = null; // pointer to current file

    function file(params) {
        var that = this;
        var mName = null;
        var mText = null;
        var mType = null;
        var mPath = null;
        var mDirty = false;
    
        this.save = function(commit, callback) {
            var commit = commit || false; 
            var data = {filename: mName, filepath: mPath, text: mText, commit: commit};
            $.ajax({
                type: "POST",
                url: "/file/save",
                processData: false,
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(r) {
                    mDirty = false;
                    if (callback) {
                        callback(null, r);
                    }
                },
                error: function(e) {
                    if (callback) {
                        callback(e, null);
                    }
                }
            });
        }
    
        this.getType = function() {
            return mType;
        }
    
        this.getText = function() {
            return mText;
        }
    
        this.setText = function(t) {
            mText = t;
        }
    
        if (params) {
            if (params.hasOwnProperty("text")) {
                mText = params.text;
            }
            if (params.hasOwnProperty("type")) {
                mType = params.type;
            }
            if (params.hasOwnProperty("name")) {
                mName = params.name;
            }
            if (params.hasOwnProperty("filepath")) {
                mPath = params.filepath;
            }			
            if (params.hasOwnProperty("saved")) {
                mDirty = !params.saved;
            }
        }
    
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this.cursorPosition = {row: 0, col: 0};
    }

    var selectFile = function(evt) {
            console.log("Select file!!!!");
            console.dir(evt);
        
            // first, save state for the current file if there is one
            if (currentFile) {
                currentFile.scrollTop = ast_editor.session.getScrollTop();
                currentFile.scrollLeft = ast_editor.session.getScrollLeft();
                currentFile.cursorPosition = ast_editor.getCursorPosition();
            }
        
            // select the clicked file
            $(".ast-editor-file").removeClass("selected");
            $(evt.target).addClass("selected");
        
            // get the filepath from the clicked element
            var filepath = $(evt.target).attr("filepath");
        
            // Add to recent or move to top of recent as appropriate
            var r = $(".ast-editor-recent [filepath=\"" + filepath + "\"]");
            if (r.length === 0) {
                    // add as new
                    $(".ast-editor-recent").prepend("<li class=\"ast-editor-file\" filepath=\"" + filepath + "\">"+evt.target.innerHTML+"</li>").click(selectFile);
            } else {
                    // move up
                    var e = $(r[0]).detach();
                    $(".ast-editor-recent").prepend(e);
            }
        
            // If it isn't already open, add it to the open list
            var r = $(".ast-editor-open [filepath=\"" + filepath + "\"]");
            if (r.length === 0) {
                 $(".ast-editor-open").prepend("<li class=\"ast-editor-file\" filepath=\"" + filepath + "\">"+evt.target.innerHTML+"</li>").click(selectFile);

                // now rebuild the recent cache in local storage
                var items = $(".ast-editor-recent li");
                var recents = [];
                for (var i = 0; i < items.length; i++) {
                    var rec = {};
                    rec.name = $(items[i]).html();
                    rec.filepath = $(items[i]).attr("filepath");
                    recents.push(rec);
                }
                localStorage.setItem("recentFiles", JSON.stringify(recents));
            }
        
            // first, check to see if this is already loaded...
            if (files.hasOwnProperty(filepath) === true) {
                // ok, just make that the current file.
                if (currentFile) {
                    currentFile.setText(ast_editor.getValue());
                }
                currentFile = files[filepath];
                activateCurrentFile();
            } else {
                loadFile(filepath);
            }
        
    }

    var selectDirectory = function(evt) {

            var target = evt.target.innerHTML;
            var parent = $("#ast-editor-folders li").last().attr("path");
            $("#folders").append("<li class=\"ast-editor-folder\" path=\"" + parent + "/" + target + "\">"+target+"</li>");
            getFileList(parent + "/" + target);
        
            $(".folder").click(selectFolder);
    }

    var selectFolder = function(evt) {

            var target = evt.target.innerHTML;
            var path = $(evt.target).attr("path");
            getFileList(path);
            $(evt.target).nextAll().remove();

    }

    var activateCurrentFile = function() {
            var type = currentFile.getType().substr(1).toLowerCase();
            if (type === "js") type = "javascript";
            if (type === "ino") type = "c_cpp";
            if (type === "c") type = "c_cpp";
            if (type === "cpp") type = "c_cpp";
            if (type === "md") type = "markdown";
            if (type === "conf") type = "ini";	
            ast_editor.getSession().setMode("ace/mode/" + type);
            ast_editor.setValue(currentFile.getText());
            ast_editor.clearSelection();

            if (currentFile.scrollTop) ast_editor.session.setScrollTop(currentFile.scrollTop);
            if (currentFile.scrollLeft) ast_editor.session.setScrollTop(currentFile.scrollLeft);
            if (currentFile.cursorPosition) ast_editor.moveCursorToPosition(currentFile.cursorPosition);
        
            ast_editor.focus();
    }

    var loadFile = function(fileName) {
        $.get(
            "/file/load?filepath="+fileName,
            function(data) {
                data = JSON.parse(data);
                data.saved = true;
            
                var f = new file(data);
                files[data.filepath] = f;
                currentFile = f;
                activateCurrentFile();
            }
        );
    }

    var getFileList = function(filepath, next) {

        var url = filepath ? "/file/list?root=" + filepath : "/file/list";
        console.dir(url);
        $.get(
            url,
            function(data) {
                data = JSON.parse(data);
                console.dir(data);
                        var list = $(".ast-editor-files");
                        list.empty();
                        for (var i = 0; i < data.files.length; i++) {
                            var f = data.files[i];
                            if (f.directory) {
                                // skip it - for now
                                var item = "<li class=\"ast-editor-directory\" isDirectory=\"true\">"+f.name+"</li>\n";
                                //list.append(item);
                            } else {
                                var item = "<li class=\"ast-editor-file\" filepath=\""+f.filepath+"\">"+f.name+"</li>\n";
                                list.append(item);
                            }
                        }
                    
                        $(".ast-editor-file").off("click").click(selectFile);
                        $(".ast-editor-directory").off("click").click(selectDirectory);
                    
                        if (next) {
                            next();
                        }
            }
        );
    }

    var getRecentFiles = function(next) {
        var recents = localStorage.getItem("recentFiles");
        recents = JSON.parse(recents);
        if (!recents) {
            if (next) {
                next();
            }
            return;
        }
    
        for (var i = 0; i < recents.length; i++) {
            var r = recents[i];
            $(".ast-editor-recent").append("<li class=\"ast-editor-file\" filepath=\"" + r.filepath + "\">"+r.name+"</li>").click(selectFile);
        }
        if (next) {
            next();
        }
    }


    var setEditorSize = function(width, height) {        
        $(".ast-editor-left-menu").height(height);
        $("#ast-editor-main").width(width - 180);
        $("#ast-editor-main").height(height);
    }


    var makeFilebox = function(classname, text, id) {
        var root = $("<div />");
        root.addClass(classname);
        
        var caption = $("<div />");
        caption.addClass("ast-editor-filebox-caption");
        caption.html(text);
        
        var box = $("<div />");
        box.addClass("ast-editor-filebox");
        
        var list = $("<ul />");
        list.addClass(id);
        
        box.append(list);
        root.append(caption);
        root.append(box);
        
        return root;
    }


    exports.init = function(element, width, height) {

        // get a reference to the element
        screen = $("#" + element);
        
        // empty out the base element
        screen.hide();
        screen.empty();
        screen.addClass("ast-administrator-screen");
        
        // add the left-hand navigation pane
        var menu = $("<div />");
        menu.addClass("ast-editor-left-menu");
        //menu.append(makeFilebox("ast-editor-folder-list", "Folders", "ast-editor-folders"));
        menu.append(makeFilebox("ast-editor-file-list", "Files", "ast-editor-files"));
        menu.append(makeFilebox("ast-editor-open-list", "Open", "ast-editor-open"));
        menu.append(makeFilebox("ast-editor-recent-list", "Recent", "ast-editor-recent"));
        screen.append(menu);
        
        // add the main editing pane
        var ebox = $("<div />");
        ebox.addClass("ast-editor-main");
        ebox.attr("id", "ast-editor-main");
        screen.append(ebox);
        
        // construct the basic structure for the editor

        // enable the ACE editor on the core element
        ast_editor = ace.edit("ast-editor-main");
        ast_editor.setTheme("ace/theme/monokai");
        ast_editor.getSession().setMode("ace/mode/ini");
    
        // listen for ctrl+s to save files
        // TODO: try this from other operating systems
        $(window).bind('keydown', 'meta_s', function(evt) {
            // save command sequence
            if ((evt.metaKey === true) && (evt.keyCode === 83)) {
                if (currentFile) {
                    currentFile.setText(ast_editor.getValue());
                    currentFile.save(true);
                }
                evt.preventDefault();
                return false;
            } else
            if ((evt.metaKey === true) && (evt.keyCode === 79)) {
                // openFile();
                evt.preventDefault();
                return false;
            }
            return true;
        });
    
        // update the cached image of the text when the user makes a change
        ast_editor.on("change", function(evt) {
            if (currentFile) {
                if (updateTimer) {
                    clearTimeout(updateTimer);
                }
                updateTimer = setTimeout(function() {
                    if (currentFile) {
                        currentFile.setText(ast_editor.getValue());
                    }
                }, 1000);
            }
        });

        // load the main file list
        getFileList(null, function() {
            getRecentFiles(function() {
                setEditorSize(width, height);
            });
        }); 

    };

    exports.activate = function() {
        screen.show();
    };
    
	return exports;
}());
