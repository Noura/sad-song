window.onload = function() {
    var data = null;
    $.getJSON('data.json', function(d) {
        data = d;
        console.log('data', data);
    });

    var context = new AudioContext();

    var buffer = null;
    var request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:8000/animal_collective_peacebone.mp3', true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        context.decodeAudioData(request.response, function(buf) {
            buffer = buf;
            console.log('buffer', buffer);
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

        var whiteNoise = context.createScriptProcessor(4096, 2, 2);
        whiteNoise.noise_level = 0.01;
        whiteNoise.onaudioprocess = function(e) {
            for (var channel = 0; channel < e.outputBuffer.numberOfChannels; channel++) {
                var input = e.inputBuffer.getChannelData(channel);
                var output = e.outputBuffer.getChannelData(channel);
                for (var sample = 0; sample < e.inputBuffer.length; sample++) {
                    output[sample] = input[sample];
                    output[sample] += ((Math.random() * 2) - 1) * whiteNoise.noise_level;
                }
            }
        };
        source.connect(whiteNoise);
        whiteNoise.connect(context.destination);

        source.start(0);

        setInterval(function() {
            whiteNoise.noise_level = Math.random() * 0.2;
        }, 500);
    }
    proceed_when_ready();
};
