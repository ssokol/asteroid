/****************************************************************************************

    Asterisk Administration Console
    
    A simple web application that allows Asterisk users to administer their system
    from a web interface.
    
    TODO:
    
    * Security! Add a login process
    * Modularity! Make it so that modules can be installed and loaded dynamically
    * Console / CLI
    * Configuration Editor
    * AMI Monitor / Tester
    * AGI Editor (?)
    * ARI Script Editor (Node.js Engine)
    * Database configuration and editor
    * CEL and CDR display
    
****************************************************************************************/

$(document).ready(function() {

    // Calculate available space for screens
    var width = $(".navbar").width();
    var height = $(".container").height() - ($(".navbar").height() + 40);

    asteriskeditor.init("ast-editor-screen", width, height);
    asteriskcli.init("ast-console-screen", width, height);
    asterisksoftphone.init("4e1f5bb2-1a53-453f-870f-9f8040fd761f", "webcaller");
    
    var clearUI = function() {
        $(".ast-administrator-screen").hide();
        $("#navbar li").removeClass("active");
    }
    
    var activateEditor = function() {
        clearUI();
        asteriskeditor.activate();
        $("#nav-config").parent().addClass("active"); 
    };
    
    var activateCLI = function() {
        clearUI();        
        asteriskcli.activate();
        $("#nav-console").parent().addClass("active");    
    };
    
    var toggleSoftPhone = function() {
        $(".ast-softphone").toggle();
    };
    
    $("#nav-config").click(activateEditor);
    $("#nav-console").click(activateCLI);
    $("#nav-show-softphone").click(toggleSoftPhone);
       	
    $(window).keypress(function(e) {
        if (e.ctrlKey) {
            if (e.charCode === 49) {
                activateCLI();
            } else
            if (e.charCode === 50) {
                activateEditor();
            }
        }
    });
    
    // display the console / cli screen
    asteriskcli.activate();
}); 