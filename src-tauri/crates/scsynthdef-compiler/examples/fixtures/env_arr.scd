SynthDef(\env_arr, { |freq = 440, gate = 1, env = #[0, 2, -99, -99, 1, 0.5, 5, -4, 0, 0.5, 5, -4]|
    Out.ar(0, SinOsc.ar(freq, 0) * EnvGen.kr(env, gate, 1, 0, 1, 0))
}).writeDefFile(thisProcess.nowExecutingPath.dirname);
0.exit;
