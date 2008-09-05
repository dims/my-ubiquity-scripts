CmdUtils.CreateCommand({
  name: "go",
  takes: {status: noun_arb_text},
  homepage: "http://davanum.wordpress.com/",
  author: { name: "Davanum Srinivas", email: "davanum AT gmail.com"},
  description: "open browser to specified url",
  preview: function( pblock, statusText) {
    jQuery.ajax({
      async: false,
      type: "GET",
      url: statusText.text,
      success: function() {
         var msg = "<iframe src='" + statusText.text + "' width=500 height=400/>";
         pblock.innerHTML = msg;
      }
    });
  },
  execute: function(statusText) {
    Utils.openUrlInBrowser(statusText.text);
  }
})
