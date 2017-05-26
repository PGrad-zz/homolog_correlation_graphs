onmessage = function(vals) {
    let json_file = vals.data[0];
    let xobj = new XMLHttpRequest();
    xobj.open('GET', json_file, true);
    xobj.overrideMimeType("application/json");
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {

            // .open will NOT return a value but simply returns undefined in async mode so use a callback
            postMessage(JSON.parse(xobj.responseText));

        }
    };
    xobj.send(null);
};
