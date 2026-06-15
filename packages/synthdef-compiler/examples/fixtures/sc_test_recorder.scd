SynthDef(\_\_sc_test_rec\_\_, { |bus = 0, bufnum = 0, phaseBus = 0|
var audio = In.ar(bus, 1);
var phase = In.ar(phaseBus, 1);
BufWr.ar(audio, bufnum, phase, 1);
}).writeDefFile(thisProcess.nowExecutingPath.dirname);
0.exit;
