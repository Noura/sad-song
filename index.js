window.onload = function() {
    var data = null;
    $.getJSON('data.json', function(d) {
        data = d;
    });

    var context = new AudioContext();

    var buffer = null;
    var request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:8000/animal_collective_peacebone.mp3', true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        context.decodeAudioData(request.response, function(buf) {
            buffer = buf;
        }, function error() {
            console.log('error with request for song');   
        });
    };
    request.send();

    function proceed_when_ready() {
        if (data === null || buffer == null) {
            setTimeout(proceed_when_ready, 1000);
            return;
        }
        var source = context.createBufferSource();
        source.buffer = buffer;

        var filter = context.createScriptProcessor(4096, 2, 2);
        filter.gsr = 0;
        filter.onaudioprocess = function(e) {
            for (var channel = 0; channel < e.outputBuffer.numberOfChannels; channel++) {
                var input = e.inputBuffer.getChannelData(channel);
                var output = e.outputBuffer.getChannelData(channel);
                var noise_level = filter.gsr * 0.2;
                for (var sample = 0; sample < e.inputBuffer.length; sample++) {
                    output[sample] = input[sample] * (1 - noise_level) + ((Math.random() * 2) - 1) * noise_level;
                }
            }
        };
        source.connect(filter);
        filter.connect(context.destination);

        source.start(0);

        var start = 800; // this is when the song starts
        var end = 7060; // this is when the song ends
        var gsr = _.pluck(data, 'gsr').slice(start, end + 1);
        var min = _.min(gsr);
        var max = _.max(gsr);
        gsr = _.map(gsr, function(g) {
            return (g - min) / (max - min);
        });
        var i = start;
        function change_noise_level() {
            if (i >= data.length) {
                return;
            }
            filter.gsr = gsr[i];
            i += 1;
            $(document).append('<div style="position:absolute; top:'+i*5+'; left:0; width:'+gsr[i]*500+'px; background:black;"></div>');
            setTimeout(change_noise_level, 50);
        };
        change_noise_level();
    }
    proceed_when_ready();
};
