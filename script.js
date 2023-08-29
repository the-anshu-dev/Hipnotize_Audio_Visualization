/*
  Noel Delgado | @pixelia_me
  Music by Ivan Ibarra - Cultos Personales
*/
(function() {
    var AudioContext = (window.AudioContext || window.webkitAudioContext);
    var PI = Math.PI, TWO_PI = Math.PI * 2, cos = Math.cos, sin = Math.sin, round = Math.round, random = Math.random, floor = Math.floor;
    var ctx, actx, analyser, audioBuffer, gainNode, frequencyDataLen, frequencyData, bufferSource;
    var startAngle = PI / 180 * -90;
    var rotation = 0;
    var playing = false, startedAt, pausedAt;
    var W, H, CX, CY;
    var startElement = document.querySelector('#loadcontrol');
    var loadingElement = document.querySelector('#loading');
    var loadingMessage = loadingElement.querySelector('.msg');

    var settings = {
        polygons : 20,
        colors : {
            background: "rgba(0,0,0,.1)"
        },
        media : "https://s3-us-west-2.amazonaws.com/s.cdpn.io/9473/ivan-ibarra_-_cultos-personales.mp3",
        fftSize : 32, // [32, 64, 128, 256, 512, 1024, 2048]
        smoothingTimeConstant : 0.6 // 0.8
    };

    // feature check.
    (function() {
        if (!AudioContext) {
            return featureNotSupported();
        }

        startElement.addEventListener('click', initializeAudio);

        // initializeAudio();
    })();

    function featureNotSupported() {
        hideStarter();
        return document.getElementById('no-audio').style.display = "block";
    }

    function hideStarter() {
        startElement.style.display = 'none';
    }

    // web audio api supported! let's load the audio
    function initializeAudio() {
        hideStarter();
        loadingElement.classList.add('show');
        updateLoadingMessage("- Loading Audio Buffer -");

        actx = new AudioContext();
        bufferSource = actx.createBufferSource();

        var xmlHTTP  = new XMLHttpRequest();
        xmlHTTP.open('GET', settings.media, true);
        xmlHTTP.responseType = 'arraybuffer';

        xmlHTTP.onload = function(e) {
            updateLoadingMessage("- Decoding Audio File Data -");

            actx.decodeAudioData(this.response, function(buffer) {
                updateLoadingMessage("- Ready -");
                audioBuffer = buffer;
                run();
            }, function() {alert('Error decoding audio data');});
        };

        xmlHTTP.send();
    }

    function updateLoadingMessage(text) {
        loadingMessage.textContent = text;
    }

    function run() {
        ctx = document.createElement('canvas').getContext('2d');

        analyser = actx.createAnalyser();
        analyser.fftSize = settings.fftSize;
        analyser.smoothingTimeConstant = settings.smoothingTimeConstant;
        // analyser.maxDecibels = -30;
        // analyser.minDecibels = -100;

        gainNode = actx.createGain();
        gainNode.connect(analyser);
        analyser.connect(actx.destination);
        frequencyDataLen = analyser.frequencyBinCount;
        frequencyData = new Uint8Array(frequencyDataLen);

        document.body.appendChild(ctx.canvas);
        document.getElementById('loading').className = "hide";
        play();

        resizeHandler();
        ctx.canvas.addEventListener('click', toggleAudio);
        window.addEventListener('resize', resizeHandler);
    }

    function animate() {
        if (!playing) return;
        requestAnimationFrame(animate);
        update();
    }

    function update() {
        var i, sides, radius, r, g, b, a, avg = 0;

        ctx.beginPath();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = settings.colors.background;
        ctx.fillRect(0,0,W,H);
        ctx.closePath();

        analyser.getByteFrequencyData(frequencyData);

        for (i = 0; i < frequencyDataLen; i++) {
            avg += frequencyData[i];
        }
        avg = (avg / frequencyDataLen);
        sides = floor(avg / 24);

        for (i = 0; i < settings.polygons; i++) {
            radius = (avg * i / 10) + 10;
            r = 255;
            g = 0;
            b = round(random() * radius);
            a = (255 / radius);

            if (avg < 80) {
                rotation = 0;
                g = b = 255;
                a = 0.25;
            }

            if (avg > 140) {
                rotation += 1;
                r = 124;
                g = 220;
                b = 255;
                a = 1;
            }

            ctx.beginPath();
            ctx.globalCompositeOperation = "lighter";
            createPolygon(ctx, CX, CY, radius, sides, startAngle, 0);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba('+r+','+g+','+b+','+a+')';
            ctx.stroke();
            ctx.closePath();
        }

    }

    function createPolygon(ctx, x, y, radius, sides, startAngle) {
        if (sides < 3) sides = 3;

        var a = (TWO_PI) / sides;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(startAngle + rotation);
        ctx.moveTo(radius, 0);

        for (var i = 1; i < sides; i++) {
            ctx.lineTo(radius * cos(a * i), radius * sin(a * i));
        }

        ctx.closePath();
        ctx.restore();
    }

    function toggleAudio() {
        if (playing) pause(); else play();
    }

    function play() {
        playing = true;
        startedAt = pausedAt ? Date.now() - pausedAt : Date.now();
        bufferSource = null;
        bufferSource = actx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.loop = true;
        bufferSource.connect(gainNode);

        if (pausedAt) bufferSource.start(0, pausedAt / 1000);
        else bufferSource.start();

        animate();
    }

    function pause() {
        playing = false;
        pausedAt = Date.now() - startedAt;
        bufferSource.stop();
    }

    function resizeHandler() {
        W = ctx.canvas.width = window.innerWidth;
        H = ctx.canvas.height = window.innerHeight;
        CX = W / 2;
        CY = H /2;
    }
})();