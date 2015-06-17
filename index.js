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
                for (var sample = 0; sample < e.inputBuffer.length; sample++) {
                    output[sample] = input[sample] * (1 - filter.gsr) + ((Math.random() * 2) - 1) * filter.gsr;
                }
            }
        };
        source.connect(filter);
        filter.connect(context.destination);

        source.start(0);

        // TODO sync the data with the song listening
        // the song ended at 4:43 from the end on the data recording
        var i = 0;
        var gsr = _.pluck(data, 'gsr');
        var min = _.min(gsr);
        var max = _.max(gsr);
        gsr = _.map(gsr, function(g) {
            return (g - min) / (max - min);
        });
        function change_noise_level() {
            if (i >= data.length) {
                return;
            }
            filter.gsr = gsr[i];
            i += 1;
            setTimeout(change_noise_level, 50);
        };
        change_noise_level();
    }
    proceed_when_ready();
};
