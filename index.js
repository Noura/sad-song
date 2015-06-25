window.onload = function() {
    //
    // SETUP //////////////////
    //

    // this is the parameter which we will change based on GSR readings
    // filters can look and this and decide how to interpret it to mess with the audio
    var filter_param = 0;
    var gsr = null;

    var start = 800; // this is when the song starts
    var end = 7080; // this is when the song ends
    var len = end - start; // this is the length of the song in gsr samples
    // if the song starts at 800
    // and the song is 5:14 long = 5*60+14 = 314 seconds long
    // and there are 20 samples per second
    // 314 sec * 20 samples / sec = 6280 samples in the song
    // 800 + 6280 = 7080

    // changing the filter parameter based on the GSR readings
    // and draw a visualization
    var i = 0;
    function change_filter_param() {
        if (i >= len) {
            return;
        }
        filter_param = gsr[i];
        i += 1;
        $('body').append($(
            '<div style="position:absolute; top:'+i*1+'px; left:0; width:'+gsr[i]*$(window).width()*0.4+'px; height:1px; background:black;"></div>'));
        if ( i > $(window).scrollTop() + $(window).height()) {
            $(window).scrollTop($(window).scrollTop() + 1);
        }
        setTimeout(change_filter_param, 50);
    };

    var context = new AudioContext();

    // making the buffer an audio node
    var source = context.createBufferSource();

    // our custom audio filter
    var filter = context.createScriptProcessor(4096, 2, 2);
    filter.onaudioprocess = function(e) {
        console.log('filter');
        for (var channel = 0; channel < e.outputBuffer.numberOfChannels; channel++) {
            var input = e.inputBuffer.getChannelData(channel);
            var output = e.outputBuffer.getChannelData(channel);
            for (var sample = 0; sample < e.inputBuffer.length; sample++) {
                // noise
                // var noise_level = filter_param * 0.1;
                // output[sample] = input[sample] * (1 - noise_level) + ((Math.random() * 2) - 1) * noise_level;
                // bitcrushing
                output[sample] = Math.floor(input[sample] * (1.0-filter_param) * 10) / ( (1.0-filter_param) * 10);
                // lets it get somewhat louder as it gets crushed
                // but not super painfully way louder
                output[sample] *= (1.0 - 0.85 * filter_param);
                output[sample] *= 0.25;
            }
        }
    };

    //
    // LOAD PRERECORDED GSR DATA //////////////////
    //
    var data = null;
    $.getJSON('data.json', function(d) {
        data = d;
        // processing the GSR data
        // only take the GSR data for when the song was playing
        gsr = _.pluck(data, 'gsr').slice(start, end + 1);
        // distort the min and max to exaggerate variation
        var min = _.min(gsr) + 0.3;
        var max = _.max(gsr) - 0.1;
        // normalize
        gsr = _.map(gsr, function(g) {
            return Math.max(0, Math.min(1, Math.abs((g - min) / (max - min))));
        });

        //
        // THEN LOAD SONG //////////////////
        //
        var request = new XMLHttpRequest();
        request.open('GET', 'animal_collective_peacebone.mp3', true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            //
            // THEN DECODE AUDIO //////////////////
            //
            context.decodeAudioData(request.response, function(buf) {
                //
                // THEN GET THINGS MOVING //////////////////
                //
                source.buffer = buf;

                // hooking up the audio stuff
                source.connect(filter);
                filter.connect(context.destination);

                // starting the audio
                source.start(0);

                change_filter_param();

            }, function error() {
                console.log('error with request for song');   
            }); // end of decoding audio
        };
        request.send(); // end of loading song
    }); // end of loading GSR data
}; // end of window.onload
