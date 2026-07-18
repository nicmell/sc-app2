/* @ts-self-types="./scsynthdef_compiler.d.ts" */

export class A2K {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        A2KFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_a2k_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.a2k_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) A2K.prototype[Symbol.dispose] = A2K.prototype.free;

export class APF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        APFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_apf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.apf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.apf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) APF.prototype[Symbol.dispose] = APF.prototype.free;

export class AllpassC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AllpassCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_allpassc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.allpassc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.allpassc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) AllpassC.prototype[Symbol.dispose] = AllpassC.prototype.free;

export class AllpassL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AllpassLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_allpassl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.allpassl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.allpassl_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) AllpassL.prototype[Symbol.dispose] = AllpassL.prototype.free;

export class AllpassN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AllpassNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_allpassn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.allpassn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.allpassn_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) AllpassN.prototype[Symbol.dispose] = AllpassN.prototype.free;

export class AmpComp {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AmpCompFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ampcomp_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ampcomp_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ampcomp_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ampcomp_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) AmpComp.prototype[Symbol.dispose] = AmpComp.prototype.free;

export class AmpCompA {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AmpCompAFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ampcompa_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ampcompa_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ampcompa_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ampcompa_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) AmpCompA.prototype[Symbol.dispose] = AmpCompA.prototype.free;

export class Amplitude {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AmplitudeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_amplitude_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.amplitude_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.amplitude_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Amplitude.prototype[Symbol.dispose] = Amplitude.prototype.free;

export class BAllPass {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BAllPassFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ballpass_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ballpass_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BAllPass.prototype[Symbol.dispose] = BAllPass.prototype.free;

export class BBandPass {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BBandPassFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bbandpass_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bbandpass_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BBandPass.prototype[Symbol.dispose] = BBandPass.prototype.free;

export class BBandStop {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BBandStopFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bbandstop_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bbandstop_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BBandStop.prototype[Symbol.dispose] = BBandStop.prototype.free;

export class BHiPass {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BHiPassFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bhipass_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bhipass_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BHiPass.prototype[Symbol.dispose] = BHiPass.prototype.free;

export class BHiShelf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BHiShelfFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bhishelf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bhishelf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BHiShelf.prototype[Symbol.dispose] = BHiShelf.prototype.free;

export class BLowPass {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BLowPassFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blowpass_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.blowpass_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BLowPass.prototype[Symbol.dispose] = BLowPass.prototype.free;

export class BLowShelf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BLowShelfFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blowshelf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.blowshelf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BLowShelf.prototype[Symbol.dispose] = BLowShelf.prototype.free;

export class BPF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BPFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bpf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bpf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bpf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BPF.prototype[Symbol.dispose] = BPF.prototype.free;

export class BPZ2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BPZ2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bpz2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bpz2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bpz2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BPZ2.prototype[Symbol.dispose] = BPZ2.prototype.free;

export class BPeakEQ {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BPeakEQFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bpeakeq_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bpeakeq_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BPeakEQ.prototype[Symbol.dispose] = BPeakEQ.prototype.free;

export class BRF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BRFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_brf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.brf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.brf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BRF.prototype[Symbol.dispose] = BRF.prototype.free;

export class BRZ2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BRZ2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_brz2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.brz2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.brz2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BRZ2.prototype[Symbol.dispose] = BRZ2.prototype.free;

export class Balance2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Balance2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_balance2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.balance2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.balance2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Balance2.prototype[Symbol.dispose] = Balance2.prototype.free;

export class Ball {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BallFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ball_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ball_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ball_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Ball.prototype[Symbol.dispose] = Ball.prototype.free;

export class BeatTrack {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BeatTrackFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_beattrack_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.beattrack_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BeatTrack.prototype[Symbol.dispose] = BeatTrack.prototype.free;

export class BeatTrack2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BeatTrack2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_beattrack2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.beattrack2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BeatTrack2.prototype[Symbol.dispose] = BeatTrack2.prototype.free;

export class BiPanB2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BiPanB2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bipanb2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bipanb2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bipanb2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BiPanB2.prototype[Symbol.dispose] = BiPanB2.prototype.free;

export class Blip {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BlipFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blip_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.blip_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.blip_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Blip.prototype[Symbol.dispose] = Blip.prototype.free;

export class BrownNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BrownNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_brownnoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.brownnoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.brownnoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BrownNoise.prototype[Symbol.dispose] = BrownNoise.prototype.free;

export class BufAllpassC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufAllpassCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufallpassc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufallpassc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufAllpassC.prototype[Symbol.dispose] = BufAllpassC.prototype.free;

export class BufAllpassL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufAllpassLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufallpassl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufallpassl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufAllpassL.prototype[Symbol.dispose] = BufAllpassL.prototype.free;

export class BufAllpassN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufAllpassNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufallpassn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufallpassn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufAllpassN.prototype[Symbol.dispose] = BufAllpassN.prototype.free;

export class BufChannels {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufChannelsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufchannels_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufchannels_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufchannels_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufChannels.prototype[Symbol.dispose] = BufChannels.prototype.free;

export class BufCombC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufCombCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufcombc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufcombc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufCombC.prototype[Symbol.dispose] = BufCombC.prototype.free;

export class BufCombL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufCombLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufcombl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufcombl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufCombL.prototype[Symbol.dispose] = BufCombL.prototype.free;

export class BufCombN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufCombNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufcombn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufcombn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufCombN.prototype[Symbol.dispose] = BufCombN.prototype.free;

export class BufDelayC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufDelayCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufdelayc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdelayc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdelayc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufDelayC.prototype[Symbol.dispose] = BufDelayC.prototype.free;

export class BufDelayL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufDelayLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufdelayl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdelayl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdelayl_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufDelayL.prototype[Symbol.dispose] = BufDelayL.prototype.free;

export class BufDelayN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufDelayNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufdelayn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdelayn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdelayn_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufDelayN.prototype[Symbol.dispose] = BufDelayN.prototype.free;

export class BufDur {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufDurFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufdur_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdur_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufdur_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufDur.prototype[Symbol.dispose] = BufDur.prototype.free;

export class BufFrames {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufFramesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufframes_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufframes_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufframes_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufFrames.prototype[Symbol.dispose] = BufFrames.prototype.free;

export class BufRateScale {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufRateScaleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufratescale_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufratescale_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufratescale_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufRateScale.prototype[Symbol.dispose] = BufRateScale.prototype.free;

export class BufRd {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufRdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufrd_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufrd_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufrd_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufRd.prototype[Symbol.dispose] = BufRd.prototype.free;

export class BufSampleRate {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufSampleRateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufsamplerate_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufsamplerate_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufsamplerate_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufSampleRate.prototype[Symbol.dispose] = BufSampleRate.prototype.free;

export class BufSamples {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufSamplesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufsamples_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufsamples_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufsamples_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufSamples.prototype[Symbol.dispose] = BufSamples.prototype.free;

export class BufWr {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BufWrFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bufwr_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufwr_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.bufwr_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) BufWr.prototype[Symbol.dispose] = BufWr.prototype.free;

export class COsc {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        COscFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cosc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.cosc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.cosc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) COsc.prototype[Symbol.dispose] = COsc.prototype.free;

export class CheckBadValues {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CheckBadValuesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_checkbadvalues_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.checkbadvalues_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.checkbadvalues_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CheckBadValues.prototype[Symbol.dispose] = CheckBadValues.prototype.free;

export class ClearBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ClearBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_clearbuf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.clearbuf_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ClearBuf.prototype[Symbol.dispose] = ClearBuf.prototype.free;

export class Clip {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ClipFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_clip_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.clip_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.clip_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Clip.prototype[Symbol.dispose] = Clip.prototype.free;

export class ClipNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ClipNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_clipnoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.clipnoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.clipnoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ClipNoise.prototype[Symbol.dispose] = ClipNoise.prototype.free;

export class CoinGate {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CoinGateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coingate_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.coingate_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.coingate_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CoinGate.prototype[Symbol.dispose] = CoinGate.prototype.free;

export class CombC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CombCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_combc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.combc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.combc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CombC.prototype[Symbol.dispose] = CombC.prototype.free;

export class CombL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CombLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_combl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.combl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.combl_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CombL.prototype[Symbol.dispose] = CombL.prototype.free;

export class CombN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CombNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_combn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.combn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.combn_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CombN.prototype[Symbol.dispose] = CombN.prototype.free;

export class Compander {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CompanderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_compander_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.compander_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Compander.prototype[Symbol.dispose] = Compander.prototype.free;

export class ControlDur {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ControlDurFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_controldur_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.controldur_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ControlDur.prototype[Symbol.dispose] = ControlDur.prototype.free;

export class ControlRate {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ControlRateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_controlrate_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.controlrate_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ControlRate.prototype[Symbol.dispose] = ControlRate.prototype.free;

export class Convolution {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ConvolutionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_convolution_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.convolution_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Convolution.prototype[Symbol.dispose] = Convolution.prototype.free;

export class Convolution2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Convolution2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_convolution2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.convolution2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Convolution2.prototype[Symbol.dispose] = Convolution2.prototype.free;

export class Convolution2L {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Convolution2LFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_convolution2l_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.convolution2l_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Convolution2L.prototype[Symbol.dispose] = Convolution2L.prototype.free;

export class Convolution3 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Convolution3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_convolution3_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.convolution3_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.convolution3_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Convolution3.prototype[Symbol.dispose] = Convolution3.prototype.free;

export class Crackle {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CrackleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_crackle_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.crackle_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.crackle_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Crackle.prototype[Symbol.dispose] = Crackle.prototype.free;

export class CuspL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CuspLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cuspl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.cuspl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CuspL.prototype[Symbol.dispose] = CuspL.prototype.free;

export class CuspN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CuspNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cuspn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.cuspn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) CuspN.prototype[Symbol.dispose] = CuspN.prototype.free;

export class DC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.dc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.dc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DC.prototype[Symbol.dispose] = DC.prototype.free;

export class Decay {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DecayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_decay_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.decay_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.decay_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Decay.prototype[Symbol.dispose] = Decay.prototype.free;

export class Decay2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Decay2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_decay2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.decay2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.decay2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Decay2.prototype[Symbol.dispose] = Decay2.prototype.free;

export class DecodeB2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DecodeB2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_decodeb2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.decodeb2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.decodeb2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DecodeB2.prototype[Symbol.dispose] = DecodeB2.prototype.free;

export class DegreeToKey {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DegreeToKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_degreetokey_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.degreetokey_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.degreetokey_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DegreeToKey.prototype[Symbol.dispose] = DegreeToKey.prototype.free;

export class DelTapRd {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DelTapRdFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_deltaprd_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.deltaprd_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.deltaprd_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DelTapRd.prototype[Symbol.dispose] = DelTapRd.prototype.free;

export class DelTapWr {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DelTapWrFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_deltapwr_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.deltapwr_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.deltapwr_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DelTapWr.prototype[Symbol.dispose] = DelTapWr.prototype.free;

export class Delay1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Delay1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_delay1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delay1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delay1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Delay1.prototype[Symbol.dispose] = Delay1.prototype.free;

export class Delay2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Delay2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_delay2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delay2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delay2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Delay2.prototype[Symbol.dispose] = Delay2.prototype.free;

export class DelayC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DelayCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_delayc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delayc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delayc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DelayC.prototype[Symbol.dispose] = DelayC.prototype.free;

export class DelayL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DelayLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_delayl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delayl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delayl_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DelayL.prototype[Symbol.dispose] = DelayL.prototype.free;

export class DelayN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DelayNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_delayn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delayn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.delayn_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DelayN.prototype[Symbol.dispose] = DelayN.prototype.free;

export class Demand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DemandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_demand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.demand_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.demand_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Demand.prototype[Symbol.dispose] = Demand.prototype.free;

export class DemandEnvGen {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DemandEnvGenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_demandenvgen_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.demandenvgen_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.demandenvgen_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DemandEnvGen.prototype[Symbol.dispose] = DemandEnvGen.prototype.free;

export class DetectIndex {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DetectIndexFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_detectindex_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.detectindex_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.detectindex_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DetectIndex.prototype[Symbol.dispose] = DetectIndex.prototype.free;

export class DetectSilence {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DetectSilenceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_detectsilence_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.detectsilence_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.detectsilence_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DetectSilence.prototype[Symbol.dispose] = DetectSilence.prototype.free;

export class DiskIn {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DiskInFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_diskin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.diskin_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DiskIn.prototype[Symbol.dispose] = DiskIn.prototype.free;

export class DiskOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DiskOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_diskout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.diskout_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) DiskOut.prototype[Symbol.dispose] = DiskOut.prototype.free;

export class Done {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DoneFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_done_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.done_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Done.prototype[Symbol.dispose] = Done.prototype.free;

export class Dust {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DustFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dust_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.dust_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.dust_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Dust.prototype[Symbol.dispose] = Dust.prototype.free;

export class Dust2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Dust2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dust2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.dust2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.dust2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Dust2.prototype[Symbol.dispose] = Dust2.prototype.free;

export class Duty {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DutyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_duty_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.duty_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.duty_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Duty.prototype[Symbol.dispose] = Duty.prototype.free;

export class EnvGen {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EnvGenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_envgen_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.envgen_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.envgen_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) EnvGen.prototype[Symbol.dispose] = EnvGen.prototype.free;

export class ExpRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExpRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_exprand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.exprand_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ExpRand.prototype[Symbol.dispose] = ExpRand.prototype.free;

export class FBSineC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FBSineCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fbsinec_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fbsinec_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FBSineC.prototype[Symbol.dispose] = FBSineC.prototype.free;

export class FBSineL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FBSineLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fbsinel_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fbsinel_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FBSineL.prototype[Symbol.dispose] = FBSineL.prototype.free;

export class FBSineN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FBSineNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fbsinen_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fbsinen_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FBSineN.prototype[Symbol.dispose] = FBSineN.prototype.free;

export class FFT {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FFTFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fft_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fft_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FFT.prototype[Symbol.dispose] = FFT.prototype.free;

export class FFTTrigger {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FFTTriggerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ffttrigger_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ffttrigger_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FFTTrigger.prototype[Symbol.dispose] = FFTTrigger.prototype.free;

export class FOS {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FOSFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fos_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fos_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fos_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FOS.prototype[Symbol.dispose] = FOS.prototype.free;

export class FSinOsc {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FSinOscFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fsinosc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fsinosc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fsinosc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FSinOsc.prototype[Symbol.dispose] = FSinOsc.prototype.free;

export class Fold {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FoldFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fold_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fold_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.fold_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Fold.prototype[Symbol.dispose] = Fold.prototype.free;

export class Formant {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FormantFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_formant_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.formant_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Formant.prototype[Symbol.dispose] = Formant.prototype.free;

export class Formlet {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FormletFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_formlet_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.formlet_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.formlet_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Formlet.prototype[Symbol.dispose] = Formlet.prototype.free;

export class Free {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FreeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_free_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.free_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Free.prototype[Symbol.dispose] = Free.prototype.free;

export class FreeSelf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FreeSelfFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_freeself_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.freeself_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FreeSelf.prototype[Symbol.dispose] = FreeSelf.prototype.free;

export class FreeSelfWhenDone {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FreeSelfWhenDoneFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_freeselfwhendone_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.freeselfwhendone_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FreeSelfWhenDone.prototype[Symbol.dispose] = FreeSelfWhenDone.prototype.free;

export class FreeVerb {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FreeVerbFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_freeverb_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.freeverb_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FreeVerb.prototype[Symbol.dispose] = FreeVerb.prototype.free;

export class FreeVerb2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FreeVerb2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_freeverb2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.freeverb2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FreeVerb2.prototype[Symbol.dispose] = FreeVerb2.prototype.free;

export class FreqShift {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FreqShiftFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_freqshift_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.freqshift_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) FreqShift.prototype[Symbol.dispose] = FreqShift.prototype.free;

export class GVerb {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GVerbFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gverb_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gverb_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GVerb.prototype[Symbol.dispose] = GVerb.prototype.free;

export class Gate {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gate_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gate_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gate_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Gate.prototype[Symbol.dispose] = Gate.prototype.free;

export class GbmanL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GbmanLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gbmanl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gbmanl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GbmanL.prototype[Symbol.dispose] = GbmanL.prototype.free;

export class GbmanN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GbmanNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gbmann_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gbmann_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GbmanN.prototype[Symbol.dispose] = GbmanN.prototype.free;

export class Gendy1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Gendy1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gendy1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gendy1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gendy1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Gendy1.prototype[Symbol.dispose] = Gendy1.prototype.free;

export class Gendy2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Gendy2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gendy2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gendy2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gendy2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Gendy2.prototype[Symbol.dispose] = Gendy2.prototype.free;

export class Gendy3 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Gendy3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gendy3_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gendy3_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.gendy3_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Gendy3.prototype[Symbol.dispose] = Gendy3.prototype.free;

export class GrainBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GrainBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_grainbuf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.grainbuf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GrainBuf.prototype[Symbol.dispose] = GrainBuf.prototype.free;

export class GrainFM {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GrainFMFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_grainfm_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.grainfm_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GrainFM.prototype[Symbol.dispose] = GrainFM.prototype.free;

export class GrainIn {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GrainInFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_grainin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.grainin_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GrainIn.prototype[Symbol.dispose] = GrainIn.prototype.free;

export class GrainSin {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GrainSinFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_grainsin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.grainsin_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GrainSin.prototype[Symbol.dispose] = GrainSin.prototype.free;

export class GrayNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GrayNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graynoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.graynoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.graynoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) GrayNoise.prototype[Symbol.dispose] = GrayNoise.prototype.free;

export class HPF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HPFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hpf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hpf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hpf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) HPF.prototype[Symbol.dispose] = HPF.prototype.free;

export class HPZ1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HPZ1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hpz1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hpz1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hpz1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) HPZ1.prototype[Symbol.dispose] = HPZ1.prototype.free;

export class HPZ2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HPZ2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hpz2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hpz2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hpz2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) HPZ2.prototype[Symbol.dispose] = HPZ2.prototype.free;

export class Hasher {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HasherFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hasher_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hasher_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hasher_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Hasher.prototype[Symbol.dispose] = Hasher.prototype.free;

export class HenonC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HenonCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_henonc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.henonc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) HenonC.prototype[Symbol.dispose] = HenonC.prototype.free;

export class HenonL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HenonLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_henonl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.henonl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) HenonL.prototype[Symbol.dispose] = HenonL.prototype.free;

export class HenonN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HenonNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_henonn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.henonn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) HenonN.prototype[Symbol.dispose] = HenonN.prototype.free;

export class Hilbert {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HilbertFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hilbert_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.hilbert_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Hilbert.prototype[Symbol.dispose] = Hilbert.prototype.free;

export class IEnvGen {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IEnvGenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ienvgen_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ienvgen_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ienvgen_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) IEnvGen.prototype[Symbol.dispose] = IEnvGen.prototype.free;

export class IFFT {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IFFTFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ifft_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ifft_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ifft_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) IFFT.prototype[Symbol.dispose] = IFFT.prototype.free;

export class IRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_irand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.irand_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) IRand.prototype[Symbol.dispose] = IRand.prototype.free;

export class Impulse {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ImpulseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_impulse_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.impulse_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.impulse_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Impulse.prototype[Symbol.dispose] = Impulse.prototype.free;

export class In {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_in_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.in_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.in_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) In.prototype[Symbol.dispose] = In.prototype.free;

export class InFeedback {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InFeedbackFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_infeedback_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.infeedback_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) InFeedback.prototype[Symbol.dispose] = InFeedback.prototype.free;

export class InRange {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InRangeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inrange_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.inrange_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.inrange_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.inrange_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) InRange.prototype[Symbol.dispose] = InRange.prototype.free;

export class InRect {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InRectFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_inrect_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.inrect_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.inrect_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) InRect.prototype[Symbol.dispose] = InRect.prototype.free;

export class InTrig {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        InTrigFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intrig_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.intrig_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) InTrig.prototype[Symbol.dispose] = InTrig.prototype.free;

export class Index {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IndexFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_index_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.index_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.index_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Index.prototype[Symbol.dispose] = Index.prototype.free;

export class IndexInBetween {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IndexInBetweenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_indexinbetween_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.indexinbetween_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.indexinbetween_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) IndexInBetween.prototype[Symbol.dispose] = IndexInBetween.prototype.free;

export class Integrator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntegratorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_integrator_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.integrator_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.integrator_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Integrator.prototype[Symbol.dispose] = Integrator.prototype.free;

export class K2A {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        K2AFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_k2a_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.k2a_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) K2A.prototype[Symbol.dispose] = K2A.prototype.free;

export class KeyState {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeyStateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_keystate_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.keystate_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) KeyState.prototype[Symbol.dispose] = KeyState.prototype.free;

export class KeyTrack {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeyTrackFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_keytrack_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.keytrack_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) KeyTrack.prototype[Symbol.dispose] = KeyTrack.prototype.free;

export class Klang {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KlangFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_klang_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.klang_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Klang.prototype[Symbol.dispose] = Klang.prototype.free;

export class Klank {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KlankFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_klank_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.klank_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Klank.prototype[Symbol.dispose] = Klank.prototype.free;

export class LFClipNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFClipNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfclipnoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfclipnoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfclipnoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFClipNoise.prototype[Symbol.dispose] = LFClipNoise.prototype.free;

export class LFCub {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFCubFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfcub_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfcub_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfcub_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFCub.prototype[Symbol.dispose] = LFCub.prototype.free;

export class LFDClipNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFDClipNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfdclipnoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdclipnoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdclipnoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFDClipNoise.prototype[Symbol.dispose] = LFDClipNoise.prototype.free;

export class LFDNoise0 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFDNoise0Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfdnoise0_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdnoise0_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdnoise0_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFDNoise0.prototype[Symbol.dispose] = LFDNoise0.prototype.free;

export class LFDNoise1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFDNoise1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfdnoise1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdnoise1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdnoise1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFDNoise1.prototype[Symbol.dispose] = LFDNoise1.prototype.free;

export class LFDNoise3 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFDNoise3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfdnoise3_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdnoise3_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfdnoise3_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFDNoise3.prototype[Symbol.dispose] = LFDNoise3.prototype.free;

export class LFGauss {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFGaussFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfgauss_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfgauss_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfgauss_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFGauss.prototype[Symbol.dispose] = LFGauss.prototype.free;

export class LFNoise0 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFNoise0Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfnoise0_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfnoise0_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfnoise0_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFNoise0.prototype[Symbol.dispose] = LFNoise0.prototype.free;

export class LFNoise1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFNoise1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfnoise1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfnoise1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfnoise1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFNoise1.prototype[Symbol.dispose] = LFNoise1.prototype.free;

export class LFNoise2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFNoise2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfnoise2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfnoise2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfnoise2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFNoise2.prototype[Symbol.dispose] = LFNoise2.prototype.free;

export class LFPar {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFParFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfpar_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfpar_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfpar_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFPar.prototype[Symbol.dispose] = LFPar.prototype.free;

export class LFPulse {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFPulseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfpulse_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfpulse_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfpulse_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFPulse.prototype[Symbol.dispose] = LFPulse.prototype.free;

export class LFSaw {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFSawFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lfsaw_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfsaw_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lfsaw_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFSaw.prototype[Symbol.dispose] = LFSaw.prototype.free;

export class LFTri {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LFTriFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lftri_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lftri_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lftri_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LFTri.prototype[Symbol.dispose] = LFTri.prototype.free;

export class LPF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LPFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lpf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lpf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lpf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LPF.prototype[Symbol.dispose] = LPF.prototype.free;

export class LPZ1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LPZ1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lpz1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lpz1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lpz1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LPZ1.prototype[Symbol.dispose] = LPZ1.prototype.free;

export class LPZ2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LPZ2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lpz2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lpz2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lpz2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LPZ2.prototype[Symbol.dispose] = LPZ2.prototype.free;

export class Lag {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LagFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lag_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Lag.prototype[Symbol.dispose] = Lag.prototype.free;

export class Lag2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Lag2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lag2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Lag2.prototype[Symbol.dispose] = Lag2.prototype.free;

export class Lag2UD {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Lag2UDFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lag2ud_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag2ud_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag2ud_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Lag2UD.prototype[Symbol.dispose] = Lag2UD.prototype.free;

export class Lag3 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Lag3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lag3_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag3_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag3_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Lag3.prototype[Symbol.dispose] = Lag3.prototype.free;

export class Lag3UD {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Lag3UDFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lag3ud_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag3ud_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lag3ud_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Lag3UD.prototype[Symbol.dispose] = Lag3UD.prototype.free;

export class LagIn {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LagInFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lagin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lagin_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LagIn.prototype[Symbol.dispose] = LagIn.prototype.free;

export class LagUD {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LagUDFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lagud_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lagud_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lagud_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LagUD.prototype[Symbol.dispose] = LagUD.prototype.free;

export class LastValue {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LastValueFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lastvalue_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lastvalue_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lastvalue_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LastValue.prototype[Symbol.dispose] = LastValue.prototype.free;

export class Latch {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LatchFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_latch_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.latch_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.latch_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Latch.prototype[Symbol.dispose] = Latch.prototype.free;

export class LatoocarfianC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LatoocarfianCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_latoocarfianc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.latoocarfianc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LatoocarfianC.prototype[Symbol.dispose] = LatoocarfianC.prototype.free;

export class LatoocarfianL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LatoocarfianLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_latoocarfianl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.latoocarfianl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LatoocarfianL.prototype[Symbol.dispose] = LatoocarfianL.prototype.free;

export class LatoocarfianN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LatoocarfianNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_latoocarfiann_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.latoocarfiann_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LatoocarfianN.prototype[Symbol.dispose] = LatoocarfianN.prototype.free;

export class LeakDC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LeakDCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_leakdc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.leakdc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.leakdc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LeakDC.prototype[Symbol.dispose] = LeakDC.prototype.free;

export class LeastChange {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LeastChangeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_leastchange_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.leastchange_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.leastchange_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LeastChange.prototype[Symbol.dispose] = LeastChange.prototype.free;

export class Limiter {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LimiterFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_limiter_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.limiter_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Limiter.prototype[Symbol.dispose] = Limiter.prototype.free;

export class LinCongC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinCongCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lincongc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lincongc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinCongC.prototype[Symbol.dispose] = LinCongC.prototype.free;

export class LinCongL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinCongLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lincongl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lincongl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinCongL.prototype[Symbol.dispose] = LinCongL.prototype.free;

export class LinCongN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinCongNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lincongn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lincongn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinCongN.prototype[Symbol.dispose] = LinCongN.prototype.free;

export class LinExp {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinExpFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linexp_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linexp_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linexp_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinExp.prototype[Symbol.dispose] = LinExp.prototype.free;

export class LinPan2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinPan2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linpan2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linpan2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linpan2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinPan2.prototype[Symbol.dispose] = LinPan2.prototype.free;

export class LinRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linrand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linrand_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinRand.prototype[Symbol.dispose] = LinRand.prototype.free;

export class LinXFade2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinXFade2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linxfade2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linxfade2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linxfade2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LinXFade2.prototype[Symbol.dispose] = LinXFade2.prototype.free;

export class Line {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_line_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.line_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.line_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Line.prototype[Symbol.dispose] = Line.prototype.free;

export class Linen {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linen_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.linen_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Linen.prototype[Symbol.dispose] = Linen.prototype.free;

export class LocalBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LocalBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_localbuf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.localbuf_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LocalBuf.prototype[Symbol.dispose] = LocalBuf.prototype.free;

export class LocalIn {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LocalInFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_localin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.localin_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.localin_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LocalIn.prototype[Symbol.dispose] = LocalIn.prototype.free;

export class LocalOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LocalOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_localout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.localout_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.localout_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LocalOut.prototype[Symbol.dispose] = LocalOut.prototype.free;

export class Logistic {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LogisticFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_logistic_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.logistic_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.logistic_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Logistic.prototype[Symbol.dispose] = Logistic.prototype.free;

export class LorenzL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LorenzLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lorenzl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.lorenzl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) LorenzL.prototype[Symbol.dispose] = LorenzL.prototype.free;

export class Loudness {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LoudnessFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_loudness_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.loudness_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Loudness.prototype[Symbol.dispose] = Loudness.prototype.free;

export class MFCC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MFCCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mfcc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mfcc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MFCC.prototype[Symbol.dispose] = MFCC.prototype.free;

export class MantissaMask {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MantissaMaskFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mantissamask_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mantissamask_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mantissamask_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MantissaMask.prototype[Symbol.dispose] = MantissaMask.prototype.free;

export class MaxLocalBufs {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MaxLocalBufsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_maxlocalbufs_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.maxlocalbufs_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MaxLocalBufs.prototype[Symbol.dispose] = MaxLocalBufs.prototype.free;

export class Median {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MedianFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_median_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.median_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.median_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Median.prototype[Symbol.dispose] = Median.prototype.free;

export class MidEQ {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MidEQFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mideq_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mideq_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mideq_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MidEQ.prototype[Symbol.dispose] = MidEQ.prototype.free;

export class MoogFF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MoogFFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_moogff_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.moogff_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.moogff_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MoogFF.prototype[Symbol.dispose] = MoogFF.prototype.free;

export class MostChange {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MostChangeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mostchange_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mostchange_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mostchange_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MostChange.prototype[Symbol.dispose] = MostChange.prototype.free;

export class MouseButton {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MouseButtonFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mousebutton_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mousebutton_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MouseButton.prototype[Symbol.dispose] = MouseButton.prototype.free;

export class MouseX {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MouseXFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mousex_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mousex_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MouseX.prototype[Symbol.dispose] = MouseX.prototype.free;

export class MouseY {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MouseYFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mousey_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.mousey_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MouseY.prototype[Symbol.dispose] = MouseY.prototype.free;

export class MulAdd {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MulAddFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_muladd_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.muladd_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.muladd_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.muladd_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) MulAdd.prototype[Symbol.dispose] = MulAdd.prototype.free;

export class NRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nrand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.nrand_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NRand.prototype[Symbol.dispose] = NRand.prototype.free;

export class Normalizer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NormalizerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_normalizer_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.normalizer_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Normalizer.prototype[Symbol.dispose] = Normalizer.prototype.free;

export class NumAudioBuses {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NumAudioBusesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_numaudiobuses_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numaudiobuses_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NumAudioBuses.prototype[Symbol.dispose] = NumAudioBuses.prototype.free;

export class NumBuffers {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NumBuffersFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_numbuffers_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numbuffers_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NumBuffers.prototype[Symbol.dispose] = NumBuffers.prototype.free;

export class NumControlBuses {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NumControlBusesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_numcontrolbuses_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numcontrolbuses_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NumControlBuses.prototype[Symbol.dispose] = NumControlBuses.prototype.free;

export class NumInputBuses {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NumInputBusesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_numinputbuses_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numinputbuses_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NumInputBuses.prototype[Symbol.dispose] = NumInputBuses.prototype.free;

export class NumOutputBuses {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NumOutputBusesFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_numoutputbuses_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numoutputbuses_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NumOutputBuses.prototype[Symbol.dispose] = NumOutputBuses.prototype.free;

export class NumRunningSynths {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NumRunningSynthsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_numrunningsynths_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numrunningsynths_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.numrunningsynths_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) NumRunningSynths.prototype[Symbol.dispose] = NumRunningSynths.prototype.free;

export class OffsetOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OffsetOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_offsetout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.offsetout_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.offsetout_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) OffsetOut.prototype[Symbol.dispose] = OffsetOut.prototype.free;

export class OnePole {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OnePoleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_onepole_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.onepole_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.onepole_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) OnePole.prototype[Symbol.dispose] = OnePole.prototype.free;

export class OneZero {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OneZeroFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_onezero_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.onezero_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.onezero_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) OneZero.prototype[Symbol.dispose] = OneZero.prototype.free;

export class Onsets {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OnsetsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_onsets_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.onsets_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Onsets.prototype[Symbol.dispose] = Onsets.prototype.free;

export class Osc {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OscFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_osc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.osc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.osc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Osc.prototype[Symbol.dispose] = Osc.prototype.free;

export class Out {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_out_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.out_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.out_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Out.prototype[Symbol.dispose] = Out.prototype.free;

export class PSinGrain {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PSinGrainFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_psingrain_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.psingrain_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PSinGrain.prototype[Symbol.dispose] = PSinGrain.prototype.free;

export class PV_Add {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_AddFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_add_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_add_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Add.prototype[Symbol.dispose] = PV_Add.prototype.free;

export class PV_BinScramble {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_BinScrambleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_binscramble_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_binscramble_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_BinScramble.prototype[Symbol.dispose] = PV_BinScramble.prototype.free;

export class PV_BinShift {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_BinShiftFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_binshift_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_binshift_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_BinShift.prototype[Symbol.dispose] = PV_BinShift.prototype.free;

export class PV_BinWipe {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_BinWipeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_binwipe_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_binwipe_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_BinWipe.prototype[Symbol.dispose] = PV_BinWipe.prototype.free;

export class PV_BrickWall {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_BrickWallFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_brickwall_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_brickwall_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_BrickWall.prototype[Symbol.dispose] = PV_BrickWall.prototype.free;

export class PV_ConformalMap {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_ConformalMapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_conformalmap_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_conformalmap_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_ConformalMap.prototype[Symbol.dispose] = PV_ConformalMap.prototype.free;

export class PV_Conj {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_ConjFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_conj_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_conj_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Conj.prototype[Symbol.dispose] = PV_Conj.prototype.free;

export class PV_Copy {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_CopyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_copy_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_copy_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Copy.prototype[Symbol.dispose] = PV_Copy.prototype.free;

export class PV_CopyPhase {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_CopyPhaseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_copyphase_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_copyphase_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_CopyPhase.prototype[Symbol.dispose] = PV_CopyPhase.prototype.free;

export class PV_Diffuser {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_DiffuserFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_diffuser_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_diffuser_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Diffuser.prototype[Symbol.dispose] = PV_Diffuser.prototype.free;

export class PV_Div {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_DivFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_div_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_div_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Div.prototype[Symbol.dispose] = PV_Div.prototype.free;

export class PV_HainsworthFoote {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_HainsworthFooteFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_hainsworthfoote_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_hainsworthfoote_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_HainsworthFoote.prototype[Symbol.dispose] = PV_HainsworthFoote.prototype.free;

export class PV_JensenAndersen {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_JensenAndersenFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_jensenandersen_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_jensenandersen_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_JensenAndersen.prototype[Symbol.dispose] = PV_JensenAndersen.prototype.free;

export class PV_LocalMax {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_LocalMaxFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_localmax_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_localmax_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_LocalMax.prototype[Symbol.dispose] = PV_LocalMax.prototype.free;

export class PV_MagAbove {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagAboveFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magabove_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magabove_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagAbove.prototype[Symbol.dispose] = PV_MagAbove.prototype.free;

export class PV_MagBelow {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagBelowFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magbelow_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magbelow_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagBelow.prototype[Symbol.dispose] = PV_MagBelow.prototype.free;

export class PV_MagClip {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagClipFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magclip_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magclip_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagClip.prototype[Symbol.dispose] = PV_MagClip.prototype.free;

export class PV_MagDiv {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagDivFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magdiv_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magdiv_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagDiv.prototype[Symbol.dispose] = PV_MagDiv.prototype.free;

export class PV_MagFreeze {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagFreezeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magfreeze_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magfreeze_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagFreeze.prototype[Symbol.dispose] = PV_MagFreeze.prototype.free;

export class PV_MagMul {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagMulFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magmul_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magmul_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagMul.prototype[Symbol.dispose] = PV_MagMul.prototype.free;

export class PV_MagNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magnoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magnoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagNoise.prototype[Symbol.dispose] = PV_MagNoise.prototype.free;

export class PV_MagShift {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagShiftFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magshift_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magshift_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagShift.prototype[Symbol.dispose] = PV_MagShift.prototype.free;

export class PV_MagSmear {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagSmearFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magsmear_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magsmear_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagSmear.prototype[Symbol.dispose] = PV_MagSmear.prototype.free;

export class PV_MagSquared {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MagSquaredFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_magsquared_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_magsquared_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_MagSquared.prototype[Symbol.dispose] = PV_MagSquared.prototype.free;

export class PV_Max {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MaxFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_max_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_max_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Max.prototype[Symbol.dispose] = PV_Max.prototype.free;

export class PV_Min {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MinFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_min_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_min_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Min.prototype[Symbol.dispose] = PV_Min.prototype.free;

export class PV_Mul {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_MulFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_mul_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_mul_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_Mul.prototype[Symbol.dispose] = PV_Mul.prototype.free;

export class PV_PhaseShift {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_PhaseShiftFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_phaseshift_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_phaseshift_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_PhaseShift.prototype[Symbol.dispose] = PV_PhaseShift.prototype.free;

export class PV_PhaseShift270 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_PhaseShift270Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_phaseshift270_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_phaseshift270_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_PhaseShift270.prototype[Symbol.dispose] = PV_PhaseShift270.prototype.free;

export class PV_PhaseShift90 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_PhaseShift90Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_phaseshift90_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_phaseshift90_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_PhaseShift90.prototype[Symbol.dispose] = PV_PhaseShift90.prototype.free;

export class PV_RandComb {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_RandCombFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_randcomb_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_randcomb_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_RandComb.prototype[Symbol.dispose] = PV_RandComb.prototype.free;

export class PV_RandWipe {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_RandWipeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_randwipe_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_randwipe_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_RandWipe.prototype[Symbol.dispose] = PV_RandWipe.prototype.free;

export class PV_RectComb {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_RectCombFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_rectcomb_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_rectcomb_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_RectComb.prototype[Symbol.dispose] = PV_RectComb.prototype.free;

export class PV_RectComb2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PV_RectComb2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pv_rectcomb2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pv_rectcomb2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PV_RectComb2.prototype[Symbol.dispose] = PV_RectComb2.prototype.free;

export class Pan2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Pan2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pan2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pan2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pan2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Pan2.prototype[Symbol.dispose] = Pan2.prototype.free;

export class Pan4 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Pan4Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pan4_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pan4_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pan4_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Pan4.prototype[Symbol.dispose] = Pan4.prototype.free;

export class PanAz {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PanAzFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_panaz_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.panaz_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.panaz_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PanAz.prototype[Symbol.dispose] = PanAz.prototype.free;

export class PanB {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PanBFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_panb_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.panb_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.panb_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PanB.prototype[Symbol.dispose] = PanB.prototype.free;

export class PanB2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PanB2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_panb2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.panb2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.panb2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PanB2.prototype[Symbol.dispose] = PanB2.prototype.free;

export class PartConv {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PartConvFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_partconv_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.partconv_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PartConv.prototype[Symbol.dispose] = PartConv.prototype.free;

export class Pause {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PauseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pause_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pause_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Pause.prototype[Symbol.dispose] = Pause.prototype.free;

export class PauseSelf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PauseSelfFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pauseself_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pauseself_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PauseSelf.prototype[Symbol.dispose] = PauseSelf.prototype.free;

export class PauseSelfWhenDone {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PauseSelfWhenDoneFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pauseselfwhendone_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pauseselfwhendone_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PauseSelfWhenDone.prototype[Symbol.dispose] = PauseSelfWhenDone.prototype.free;

export class Peak {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PeakFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_peak_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.peak_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.peak_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Peak.prototype[Symbol.dispose] = Peak.prototype.free;

export class PeakFollower {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PeakFollowerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_peakfollower_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.peakfollower_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.peakfollower_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PeakFollower.prototype[Symbol.dispose] = PeakFollower.prototype.free;

export class Phasor {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PhasorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_phasor_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.phasor_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.phasor_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Phasor.prototype[Symbol.dispose] = Phasor.prototype.free;

export class PinkNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PinkNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pinknoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pinknoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pinknoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PinkNoise.prototype[Symbol.dispose] = PinkNoise.prototype.free;

export class Pitch {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PitchFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pitch_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pitch_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Pitch.prototype[Symbol.dispose] = Pitch.prototype.free;

export class PitchShift {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PitchShiftFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pitchshift_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pitchshift_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PitchShift.prototype[Symbol.dispose] = PitchShift.prototype.free;

export class PlayBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PlayBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_playbuf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.playbuf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.playbuf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PlayBuf.prototype[Symbol.dispose] = PlayBuf.prototype.free;

export class Pluck {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PluckFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pluck_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pluck_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Pluck.prototype[Symbol.dispose] = Pluck.prototype.free;

export class Poll {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PollFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_poll_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.poll_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.poll_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Poll.prototype[Symbol.dispose] = Poll.prototype.free;

export class Pulse {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PulseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pulse_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pulse_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pulse_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Pulse.prototype[Symbol.dispose] = Pulse.prototype.free;

export class PulseCount {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PulseCountFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pulsecount_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pulsecount_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pulsecount_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PulseCount.prototype[Symbol.dispose] = PulseCount.prototype.free;

export class PulseDivider {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PulseDividerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pulsedivider_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pulsedivider_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.pulsedivider_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) PulseDivider.prototype[Symbol.dispose] = PulseDivider.prototype.free;

export class QuadC {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuadCFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quadc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.quadc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) QuadC.prototype[Symbol.dispose] = QuadC.prototype.free;

export class QuadL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuadLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quadl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.quadl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) QuadL.prototype[Symbol.dispose] = QuadL.prototype.free;

export class QuadN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuadNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quadn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.quadn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) QuadN.prototype[Symbol.dispose] = QuadN.prototype.free;

export class RHPF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RHPFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rhpf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rhpf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rhpf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RHPF.prototype[Symbol.dispose] = RHPF.prototype.free;

export class RLPF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RLPFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rlpf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rlpf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rlpf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RLPF.prototype[Symbol.dispose] = RLPF.prototype.free;

export class RadiansPerSample {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RadiansPerSampleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_radianspersample_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.radianspersample_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RadiansPerSample.prototype[Symbol.dispose] = RadiansPerSample.prototype.free;

export class Ramp {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RampFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ramp_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ramp_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ramp_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Ramp.prototype[Symbol.dispose] = Ramp.prototype.free;

export class Rand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rand_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Rand.prototype[Symbol.dispose] = Rand.prototype.free;

export class RandID {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RandIDFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_randid_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.randid_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.randid_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RandID.prototype[Symbol.dispose] = RandID.prototype.free;

export class RandSeed {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RandSeedFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_randseed_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.randseed_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.randseed_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.randseed_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RandSeed.prototype[Symbol.dispose] = RandSeed.prototype.free;

export class RecordBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RecordBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recordbuf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.recordbuf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.recordbuf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RecordBuf.prototype[Symbol.dispose] = RecordBuf.prototype.free;

export class ReplaceOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ReplaceOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_replaceout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.replaceout_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.replaceout_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ReplaceOut.prototype[Symbol.dispose] = ReplaceOut.prototype.free;

export class Resonz {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ResonzFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_resonz_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.resonz_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.resonz_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Resonz.prototype[Symbol.dispose] = Resonz.prototype.free;

export class Ringz {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RingzFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ringz_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ringz_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.ringz_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Ringz.prototype[Symbol.dispose] = Ringz.prototype.free;

export class Rotate2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Rotate2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rotate2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rotate2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.rotate2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Rotate2.prototype[Symbol.dispose] = Rotate2.prototype.free;

export class RunningMax {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RunningMaxFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_runningmax_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.runningmax_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.runningmax_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RunningMax.prototype[Symbol.dispose] = RunningMax.prototype.free;

export class RunningMin {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RunningMinFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_runningmin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.runningmin_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.runningmin_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RunningMin.prototype[Symbol.dispose] = RunningMin.prototype.free;

export class RunningSum {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RunningSumFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_runningsum_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.runningsum_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.runningsum_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) RunningSum.prototype[Symbol.dispose] = RunningSum.prototype.free;

export class SOS {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SOSFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sos_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sos_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sos_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SOS.prototype[Symbol.dispose] = SOS.prototype.free;

export class SampleDur {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SampleDurFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sampledur_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sampledur_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SampleDur.prototype[Symbol.dispose] = SampleDur.prototype.free;

export class SampleRate {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SampleRateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_samplerate_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.samplerate_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SampleRate.prototype[Symbol.dispose] = SampleRate.prototype.free;

export class Saw {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SawFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_saw_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.saw_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.saw_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Saw.prototype[Symbol.dispose] = Saw.prototype.free;

export class Schmidt {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SchmidtFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_schmidt_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.schmidt_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.schmidt_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Schmidt.prototype[Symbol.dispose] = Schmidt.prototype.free;

export class ScopeOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ScopeOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_scopeout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.scopeout_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.scopeout_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ScopeOut.prototype[Symbol.dispose] = ScopeOut.prototype.free;

export class ScopeOut2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ScopeOut2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_scopeout2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.scopeout2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.scopeout2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ScopeOut2.prototype[Symbol.dispose] = ScopeOut2.prototype.free;

export class Select {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SelectFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_select_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.select_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.select_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Select.prototype[Symbol.dispose] = Select.prototype.free;

export class SendReply {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SendReplyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sendreply_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sendreply_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sendreply_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SendReply.prototype[Symbol.dispose] = SendReply.prototype.free;

export class SendTrig {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SendTrigFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sendtrig_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sendtrig_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sendtrig_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SendTrig.prototype[Symbol.dispose] = SendTrig.prototype.free;

export class SetBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SetBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_setbuf_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.setbuf_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.setbuf_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SetBuf.prototype[Symbol.dispose] = SetBuf.prototype.free;

export class SetResetFF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SetResetFFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_setresetff_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.setresetff_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.setresetff_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SetResetFF.prototype[Symbol.dispose] = SetResetFF.prototype.free;

export class Shaper {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ShaperFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_shaper_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.shaper_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.shaper_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Shaper.prototype[Symbol.dispose] = Shaper.prototype.free;

export class SharedIn {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SharedInFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sharedin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sharedin_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SharedIn.prototype[Symbol.dispose] = SharedIn.prototype.free;

export class SharedOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SharedOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sharedout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sharedout_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SharedOut.prototype[Symbol.dispose] = SharedOut.prototype.free;

export class Silent {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SilentFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_silent_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.silent_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Silent.prototype[Symbol.dispose] = Silent.prototype.free;

export class SinOsc {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SinOscFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sinosc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sinosc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sinosc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SinOsc.prototype[Symbol.dispose] = SinOsc.prototype.free;

export class SinOscFB {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SinOscFBFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sinoscfb_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sinoscfb_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sinoscfb_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SinOscFB.prototype[Symbol.dispose] = SinOscFB.prototype.free;

export class Slew {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SlewFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_slew_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.slew_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.slew_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Slew.prototype[Symbol.dispose] = Slew.prototype.free;

export class Slope {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SlopeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_slope_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.slope_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.slope_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Slope.prototype[Symbol.dispose] = Slope.prototype.free;

export class SpecCentroid {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpecCentroidFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_speccentroid_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.speccentroid_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SpecCentroid.prototype[Symbol.dispose] = SpecCentroid.prototype.free;

export class SpecFlatness {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpecFlatnessFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_specflatness_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.specflatness_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SpecFlatness.prototype[Symbol.dispose] = SpecFlatness.prototype.free;

export class SpecPcile {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpecPcileFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_specpcile_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.specpcile_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SpecPcile.prototype[Symbol.dispose] = SpecPcile.prototype.free;

export class Spring {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpringFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spring_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.spring_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.spring_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Spring.prototype[Symbol.dispose] = Spring.prototype.free;

export class StandardL {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StandardLFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_standardl_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.standardl_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) StandardL.prototype[Symbol.dispose] = StandardL.prototype.free;

export class StandardN {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StandardNFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_standardn_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.standardn_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) StandardN.prototype[Symbol.dispose] = StandardN.prototype.free;

export class Stepper {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StepperFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stepper_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.stepper_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.stepper_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Stepper.prototype[Symbol.dispose] = Stepper.prototype.free;

export class StereoConvolution2L {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StereoConvolution2LFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stereoconvolution2l_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.stereoconvolution2l_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) StereoConvolution2L.prototype[Symbol.dispose] = StereoConvolution2L.prototype.free;

export class SubsampleOffset {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SubsampleOffsetFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_subsampleoffset_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ir(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.subsampleoffset_ir(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SubsampleOffset.prototype[Symbol.dispose] = SubsampleOffset.prototype.free;

export class Sweep {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SweepFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sweep_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sweep_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.sweep_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Sweep.prototype[Symbol.dispose] = Sweep.prototype.free;

export class SyncSaw {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SyncSawFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_syncsaw_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.syncsaw_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.syncsaw_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SyncSaw.prototype[Symbol.dispose] = SyncSaw.prototype.free;

/**
 * The SynthDef graph builder — mirrors the native [`SynthDef`] one-to-one.
 */
export class SynthDef {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SynthDefFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_synthdef_free(ptr, 0);
    }
    /**
     * Add a named scalar control; returns its `UGenInput` handle.
     * @param {string} name
     * @param {number} default_value
     * @param {string} rate
     * @returns {UGenInput}
     */
    addControl(name, default_value, rate) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(rate, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.synthdef_addControl(this.__wbg_ptr, ptr0, len0, default_value, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Add a named ARRAY control (consecutive slots, one name at the base
     * index); returns the per-slot `UGenInput` handles.
     * @param {string} name
     * @param {Float32Array} defaults
     * @param {string} rate
     * @returns {UGenInput[]}
     */
    addControlArray(name, defaults, rate) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(defaults, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(rate, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.synthdef_addControlArray(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Append a UGen node (registry-driven — what the app's markup compiler
     * uses); returns the node index.
     * @param {string} class_name
     * @param {string} rate
     * @param {(UGenInput | number)[]} inputs
     * @param {number} num_outputs
     * @param {number} special_index
     * @returns {number}
     */
    addUgen(class_name, rate, inputs, num_outputs, special_index) {
        const ptr0 = passStringToWasm0(class_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(rate, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayJsValueToWasm0(inputs, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.synthdef_addUgen(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, num_outputs, special_index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {string} name
     */
    constructor(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.synthdef_new(ptr0, len0);
        this.__wbg_ptr = ret;
        SynthDefFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * The calculation rate of an already-added node ("scalar" | "control"
     * | "audio"), or undefined for an out-of-range index.
     * @param {number} index
     * @returns {string | undefined}
     */
    nodeRate(index) {
        const ret = wasm.synthdef_nodeRate(this.__wbg_ptr, index);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Encode to SCgf v2 bytes.
     * @returns {Uint8Array}
     */
    toBytes() {
        const ret = wasm.synthdef_toBytes(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The structured JSON form (what `parseScgf` also returns).
     * @returns {any}
     */
    toJson() {
        const ret = wasm.synthdef_toJson(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) SynthDef.prototype[Symbol.dispose] = SynthDef.prototype.free;

export class T2A {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        T2AFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_t2a_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.t2a_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) T2A.prototype[Symbol.dispose] = T2A.prototype.free;

export class T2K {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        T2KFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_t2k_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.t2k_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) T2K.prototype[Symbol.dispose] = T2K.prototype.free;

export class TBall {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TBallFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tball_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tball_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tball_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TBall.prototype[Symbol.dispose] = TBall.prototype.free;

export class TDelay {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TDelayFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tdelay_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tdelay_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tdelay_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TDelay.prototype[Symbol.dispose] = TDelay.prototype.free;

export class TDuty {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TDutyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tduty_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tduty_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tduty_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TDuty.prototype[Symbol.dispose] = TDuty.prototype.free;

export class TExpRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TExpRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_texprand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.texprand_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.texprand_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TExpRand.prototype[Symbol.dispose] = TExpRand.prototype.free;

export class TGrains {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TGrainsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tgrains_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tgrains_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TGrains.prototype[Symbol.dispose] = TGrains.prototype.free;

export class TIRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TIRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tirand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tirand_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.tirand_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TIRand.prototype[Symbol.dispose] = TIRand.prototype.free;

export class TRand {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TRandFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trand_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trand_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trand_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TRand.prototype[Symbol.dispose] = TRand.prototype.free;

export class TWindex {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TWindexFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_twindex_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.twindex_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.twindex_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TWindex.prototype[Symbol.dispose] = TWindex.prototype.free;

export class Timer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TimerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_timer_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.timer_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.timer_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Timer.prototype[Symbol.dispose] = Timer.prototype.free;

export class ToggleFF {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ToggleFFFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_toggleff_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.toggleff_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.toggleff_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ToggleFF.prototype[Symbol.dispose] = ToggleFF.prototype.free;

export class Trapezoid {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrapezoidFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trapezoid_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trapezoid_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trapezoid_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Trapezoid.prototype[Symbol.dispose] = Trapezoid.prototype.free;

export class Trig {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrigFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trig_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trig_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trig_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Trig.prototype[Symbol.dispose] = Trig.prototype.free;

export class Trig1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Trig1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trig1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trig1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.trig1_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Trig1.prototype[Symbol.dispose] = Trig1.prototype.free;

export class TwoPole {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TwoPoleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_twopole_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.twopole_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.twopole_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TwoPole.prototype[Symbol.dispose] = TwoPole.prototype.free;

export class TwoZero {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TwoZeroFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_twozero_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.twozero_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.twozero_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) TwoZero.prototype[Symbol.dispose] = TwoZero.prototype.free;

export class VDiskIn {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VDiskInFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vdiskin_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vdiskin_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) VDiskIn.prototype[Symbol.dispose] = VDiskIn.prototype.free;

export class VOsc {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VOscFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vosc_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vosc_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vosc_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) VOsc.prototype[Symbol.dispose] = VOsc.prototype.free;

export class VOsc3 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VOsc3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vosc3_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vosc3_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vosc3_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) VOsc3.prototype[Symbol.dispose] = VOsc3.prototype.free;

export class VarSaw {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VarSawFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_varsaw_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.varsaw_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.varsaw_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) VarSaw.prototype[Symbol.dispose] = VarSaw.prototype.free;

export class Vibrato {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VibratoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vibrato_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vibrato_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.vibrato_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Vibrato.prototype[Symbol.dispose] = Vibrato.prototype.free;

export class Warp1 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Warp1Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_warp1_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.warp1_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Warp1.prototype[Symbol.dispose] = Warp1.prototype.free;

export class WhiteNoise {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WhiteNoiseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_whitenoise_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.whitenoise_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.whitenoise_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) WhiteNoise.prototype[Symbol.dispose] = WhiteNoise.prototype.free;

export class Wrap {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WrapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wrap_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.wrap_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.wrap_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Wrap.prototype[Symbol.dispose] = Wrap.prototype.free;

export class WrapIndex {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WrapIndexFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wrapindex_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.wrapindex_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.wrapindex_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) WrapIndex.prototype[Symbol.dispose] = WrapIndex.prototype.free;

export class XFade2 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        XFade2Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_xfade2_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.xfade2_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.xfade2_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) XFade2.prototype[Symbol.dispose] = XFade2.prototype.free;

export class XLine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        XLineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_xline_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.xline_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.xline_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) XLine.prototype[Symbol.dispose] = XLine.prototype.free;

export class XOut {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        XOutFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_xout_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.xout_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.xout_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) XOut.prototype[Symbol.dispose] = XOut.prototype.free;

export class ZeroCrossing {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ZeroCrossingFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_zerocrossing_free(ptr, 0);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static ar(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.zerocrossing_ar(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SynthDef} def
     * @param {any} args
     * @returns {any}
     */
    static kr(def, args) {
        _assertClass(def, SynthDef);
        const ret = wasm.zerocrossing_kr(def.__wbg_ptr, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) ZeroCrossing.prototype[Symbol.dispose] = ZeroCrossing.prototype.free;

/**
 * `specialIndex` for a binary operator name (`+`, `min`, …); undefined
 * for unknown operators.
 * @param {string} op
 * @returns {number | undefined}
 */
export function binaryOpIndex(op) {
    const ptr0 = passStringToWasm0(op, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.binaryOpIndex(ptr0, len0);
    return ret === 0xFFFFFF ? undefined : ret;
}

/**
 * Build one envelope shape and flatten it to the EnvGen `Env.asArray` run.
 * `args` is a `{ name: number | UGenInput | (number | UGenInput)[] }`
 * object; `curve`/`releaseNode`/`loopNode` are the sclang keyword args.
 * Error messages match the TS package verbatim (the app pins them).
 * @param {string} shape
 * @param {any} args
 * @param {any} curve
 * @param {number | null} [release_node]
 * @param {number | null} [loop_node]
 * @returns {UGenInput[]}
 */
export function buildEnvRun(shape, args, curve, release_node, loop_node) {
    const ptr0 = passStringToWasm0(shape, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.buildEnvRun(ptr0, len0, args, curve, isLikeNone(release_node) ? Number.MAX_SAFE_INTEGER : (release_node) >> 0, isLikeNone(loop_node) ? Number.MAX_SAFE_INTEGER : (loop_node) >> 0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Flatten a raw envelope spec (levels/times/curves/releaseNode/loopNode)
 * to the EnvGen run — the generic path `Env.new`-style callers use.
 * @param {(UGenInput | number)[]} levels
 * @param {(UGenInput | number)[]} times
 * @param {any} curves
 * @param {number | null} [release_node]
 * @param {number | null} [loop_node]
 * @returns {UGenInput[]}
 */
export function encodeEnvRun(levels, times, curves, release_node, loop_node) {
    const ptr0 = passArrayJsValueToWasm0(levels, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayJsValueToWasm0(times, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.encodeEnvRun(ptr0, len0, ptr1, len1, curves, isLikeNone(release_node) ? Number.MAX_SAFE_INTEGER : (release_node) >> 0, isLikeNone(loop_node) ? Number.MAX_SAFE_INTEGER : (loop_node) >> 0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Parse SCgf v2 bytes into the structured JSON form.
 * @param {Uint8Array} bytes
 * @returns {any}
 */
export function parseScgf(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.parseScgf(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * `specialIndex` for a unary operator name (`neg`, `abs`, …).
 * @param {string} op
 * @returns {number | undefined}
 */
export function unaryOpIndex(op) {
    const ptr0 = passStringToWasm0(op, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.unaryOpIndex(ptr0, len0);
    return ret === 0xFFFFFF ? undefined : ret;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_ef53bc310eb298a0: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_6b506e6536831eaa: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_boolean_get_1a45e2c38d4d41b9: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_0accd80f45e5faa2: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_754e9f305ff6029e: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_87c3bfe968c6a5ad: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_56732c2bc353f41d: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_c236cabd84a4d769: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_67b456be8673d3d7: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_2c56564c75129511: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_9bb1761122181af2: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_72bdf95d3ae505b1: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_1506f2235d1bdba0: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_8a89609d89f6608a: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_done_60cf307fcc680536: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_04b37a02507f1713: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_from_d300fe49deab18f5: function(arg0) {
            const ret = Array.from(arg0);
            return ret;
        },
        __wbg_get_1f8f054ddbaa7db2: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_2b48c7d0d006a781: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_de6a0f7d4d18a304: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_33f6e5c9e2f2d6b2: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_8f49811467741499: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_86f30649f63ef9c2: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_67c2c9c4313f4448: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_66acec27e09e99a7: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_8732428d309e270e: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_4a591ecaa01354d9: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_66f1a4b2e9026940: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_new_578aeef4b6b94378: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_622fc80556be2e26: function() {
            const ret = new Map();
            return ret;
        },
        __wbg_new_ce1ab61c1c2b300d: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_d90091b82fdf5b91: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_next_9e03acdf51c4960d: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_eb8ca7351fa27906: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_prototypesetcall_3249fc62a0fafa30: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_set_52b1e1eb5bed906a: function(arg0, arg1, arg2) {
            const ret = arg0.set(arg1, arg2);
            return ret;
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_dca99999bba88a9a: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_value_f3625092ee4b37f4: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./scsynthdef_compiler_bg.js": import0,
    };
}

const A2KFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_a2k_free(ptr, 1));
const APFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_apf_free(ptr, 1));
const AllpassCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_allpassc_free(ptr, 1));
const AllpassLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_allpassl_free(ptr, 1));
const AllpassNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_allpassn_free(ptr, 1));
const AmpCompFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ampcomp_free(ptr, 1));
const AmpCompAFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ampcompa_free(ptr, 1));
const AmplitudeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_amplitude_free(ptr, 1));
const BAllPassFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ballpass_free(ptr, 1));
const BBandPassFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bbandpass_free(ptr, 1));
const BBandStopFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bbandstop_free(ptr, 1));
const BHiPassFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bhipass_free(ptr, 1));
const BHiShelfFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bhishelf_free(ptr, 1));
const BLowPassFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blowpass_free(ptr, 1));
const BLowShelfFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blowshelf_free(ptr, 1));
const BPFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bpf_free(ptr, 1));
const BPZ2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bpz2_free(ptr, 1));
const BPeakEQFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bpeakeq_free(ptr, 1));
const BRFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_brf_free(ptr, 1));
const BRZ2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_brz2_free(ptr, 1));
const Balance2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_balance2_free(ptr, 1));
const BallFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ball_free(ptr, 1));
const BeatTrackFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_beattrack_free(ptr, 1));
const BeatTrack2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_beattrack2_free(ptr, 1));
const BiPanB2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bipanb2_free(ptr, 1));
const BlipFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blip_free(ptr, 1));
const BrownNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_brownnoise_free(ptr, 1));
const BufAllpassCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufallpassc_free(ptr, 1));
const BufAllpassLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufallpassl_free(ptr, 1));
const BufAllpassNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufallpassn_free(ptr, 1));
const BufChannelsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufchannels_free(ptr, 1));
const BufCombCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufcombc_free(ptr, 1));
const BufCombLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufcombl_free(ptr, 1));
const BufCombNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufcombn_free(ptr, 1));
const BufDelayCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufdelayc_free(ptr, 1));
const BufDelayLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufdelayl_free(ptr, 1));
const BufDelayNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufdelayn_free(ptr, 1));
const BufDurFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufdur_free(ptr, 1));
const BufFramesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufframes_free(ptr, 1));
const BufRateScaleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufratescale_free(ptr, 1));
const BufRdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufrd_free(ptr, 1));
const BufSampleRateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufsamplerate_free(ptr, 1));
const BufSamplesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufsamples_free(ptr, 1));
const BufWrFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bufwr_free(ptr, 1));
const COscFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cosc_free(ptr, 1));
const CheckBadValuesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_checkbadvalues_free(ptr, 1));
const ClearBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_clearbuf_free(ptr, 1));
const ClipFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_clip_free(ptr, 1));
const ClipNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_clipnoise_free(ptr, 1));
const CoinGateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_coingate_free(ptr, 1));
const CombCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_combc_free(ptr, 1));
const CombLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_combl_free(ptr, 1));
const CombNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_combn_free(ptr, 1));
const CompanderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_compander_free(ptr, 1));
const ControlDurFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_controldur_free(ptr, 1));
const ControlRateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_controlrate_free(ptr, 1));
const ConvolutionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_convolution_free(ptr, 1));
const Convolution2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_convolution2_free(ptr, 1));
const Convolution2LFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_convolution2l_free(ptr, 1));
const Convolution3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_convolution3_free(ptr, 1));
const CrackleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_crackle_free(ptr, 1));
const CuspLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cuspl_free(ptr, 1));
const CuspNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cuspn_free(ptr, 1));
const DCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dc_free(ptr, 1));
const DecayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_decay_free(ptr, 1));
const Decay2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_decay2_free(ptr, 1));
const DecodeB2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_decodeb2_free(ptr, 1));
const DegreeToKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_degreetokey_free(ptr, 1));
const DelTapRdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_deltaprd_free(ptr, 1));
const DelTapWrFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_deltapwr_free(ptr, 1));
const Delay1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_delay1_free(ptr, 1));
const Delay2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_delay2_free(ptr, 1));
const DelayCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_delayc_free(ptr, 1));
const DelayLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_delayl_free(ptr, 1));
const DelayNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_delayn_free(ptr, 1));
const DemandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_demand_free(ptr, 1));
const DemandEnvGenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_demandenvgen_free(ptr, 1));
const DetectIndexFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_detectindex_free(ptr, 1));
const DetectSilenceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_detectsilence_free(ptr, 1));
const DiskInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_diskin_free(ptr, 1));
const DiskOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_diskout_free(ptr, 1));
const DoneFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_done_free(ptr, 1));
const DustFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dust_free(ptr, 1));
const Dust2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dust2_free(ptr, 1));
const DutyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_duty_free(ptr, 1));
const EnvGenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_envgen_free(ptr, 1));
const ExpRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_exprand_free(ptr, 1));
const FBSineCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fbsinec_free(ptr, 1));
const FBSineLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fbsinel_free(ptr, 1));
const FBSineNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fbsinen_free(ptr, 1));
const FFTFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fft_free(ptr, 1));
const FFTTriggerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ffttrigger_free(ptr, 1));
const FOSFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fos_free(ptr, 1));
const FSinOscFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fsinosc_free(ptr, 1));
const FoldFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fold_free(ptr, 1));
const FormantFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_formant_free(ptr, 1));
const FormletFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_formlet_free(ptr, 1));
const FreeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_free_free(ptr, 1));
const FreeSelfFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_freeself_free(ptr, 1));
const FreeSelfWhenDoneFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_freeselfwhendone_free(ptr, 1));
const FreeVerbFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_freeverb_free(ptr, 1));
const FreeVerb2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_freeverb2_free(ptr, 1));
const FreqShiftFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_freqshift_free(ptr, 1));
const GVerbFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gverb_free(ptr, 1));
const GateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gate_free(ptr, 1));
const GbmanLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gbmanl_free(ptr, 1));
const GbmanNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gbmann_free(ptr, 1));
const Gendy1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gendy1_free(ptr, 1));
const Gendy2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gendy2_free(ptr, 1));
const Gendy3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gendy3_free(ptr, 1));
const GrainBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_grainbuf_free(ptr, 1));
const GrainFMFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_grainfm_free(ptr, 1));
const GrainInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_grainin_free(ptr, 1));
const GrainSinFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_grainsin_free(ptr, 1));
const GrayNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_graynoise_free(ptr, 1));
const HPFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hpf_free(ptr, 1));
const HPZ1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hpz1_free(ptr, 1));
const HPZ2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hpz2_free(ptr, 1));
const HasherFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hasher_free(ptr, 1));
const HenonCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_henonc_free(ptr, 1));
const HenonLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_henonl_free(ptr, 1));
const HenonNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_henonn_free(ptr, 1));
const HilbertFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hilbert_free(ptr, 1));
const IEnvGenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ienvgen_free(ptr, 1));
const IFFTFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ifft_free(ptr, 1));
const IRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_irand_free(ptr, 1));
const ImpulseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_impulse_free(ptr, 1));
const InFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_in_free(ptr, 1));
const InFeedbackFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_infeedback_free(ptr, 1));
const InRangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inrange_free(ptr, 1));
const InRectFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_inrect_free(ptr, 1));
const InTrigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intrig_free(ptr, 1));
const IndexFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_index_free(ptr, 1));
const IndexInBetweenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_indexinbetween_free(ptr, 1));
const IntegratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_integrator_free(ptr, 1));
const K2AFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_k2a_free(ptr, 1));
const KeyStateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_keystate_free(ptr, 1));
const KeyTrackFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_keytrack_free(ptr, 1));
const KlangFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_klang_free(ptr, 1));
const KlankFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_klank_free(ptr, 1));
const LFClipNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfclipnoise_free(ptr, 1));
const LFCubFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfcub_free(ptr, 1));
const LFDClipNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfdclipnoise_free(ptr, 1));
const LFDNoise0Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfdnoise0_free(ptr, 1));
const LFDNoise1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfdnoise1_free(ptr, 1));
const LFDNoise3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfdnoise3_free(ptr, 1));
const LFGaussFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfgauss_free(ptr, 1));
const LFNoise0Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfnoise0_free(ptr, 1));
const LFNoise1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfnoise1_free(ptr, 1));
const LFNoise2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfnoise2_free(ptr, 1));
const LFParFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfpar_free(ptr, 1));
const LFPulseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfpulse_free(ptr, 1));
const LFSawFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lfsaw_free(ptr, 1));
const LFTriFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lftri_free(ptr, 1));
const LPFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lpf_free(ptr, 1));
const LPZ1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lpz1_free(ptr, 1));
const LPZ2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lpz2_free(ptr, 1));
const LagFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lag_free(ptr, 1));
const Lag2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lag2_free(ptr, 1));
const Lag2UDFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lag2ud_free(ptr, 1));
const Lag3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lag3_free(ptr, 1));
const Lag3UDFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lag3ud_free(ptr, 1));
const LagInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lagin_free(ptr, 1));
const LagUDFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lagud_free(ptr, 1));
const LastValueFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lastvalue_free(ptr, 1));
const LatchFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_latch_free(ptr, 1));
const LatoocarfianCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_latoocarfianc_free(ptr, 1));
const LatoocarfianLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_latoocarfianl_free(ptr, 1));
const LatoocarfianNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_latoocarfiann_free(ptr, 1));
const LeakDCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_leakdc_free(ptr, 1));
const LeastChangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_leastchange_free(ptr, 1));
const LimiterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_limiter_free(ptr, 1));
const LinCongCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lincongc_free(ptr, 1));
const LinCongLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lincongl_free(ptr, 1));
const LinCongNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lincongn_free(ptr, 1));
const LinExpFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linexp_free(ptr, 1));
const LinPan2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linpan2_free(ptr, 1));
const LinRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linrand_free(ptr, 1));
const LinXFade2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linxfade2_free(ptr, 1));
const LineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_line_free(ptr, 1));
const LinenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linen_free(ptr, 1));
const LocalBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_localbuf_free(ptr, 1));
const LocalInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_localin_free(ptr, 1));
const LocalOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_localout_free(ptr, 1));
const LogisticFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_logistic_free(ptr, 1));
const LorenzLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lorenzl_free(ptr, 1));
const LoudnessFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_loudness_free(ptr, 1));
const MFCCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mfcc_free(ptr, 1));
const MantissaMaskFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mantissamask_free(ptr, 1));
const MaxLocalBufsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_maxlocalbufs_free(ptr, 1));
const MedianFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_median_free(ptr, 1));
const MidEQFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mideq_free(ptr, 1));
const MoogFFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_moogff_free(ptr, 1));
const MostChangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mostchange_free(ptr, 1));
const MouseButtonFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mousebutton_free(ptr, 1));
const MouseXFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mousex_free(ptr, 1));
const MouseYFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mousey_free(ptr, 1));
const MulAddFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_muladd_free(ptr, 1));
const NRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_nrand_free(ptr, 1));
const NormalizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_normalizer_free(ptr, 1));
const NumAudioBusesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_numaudiobuses_free(ptr, 1));
const NumBuffersFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_numbuffers_free(ptr, 1));
const NumControlBusesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_numcontrolbuses_free(ptr, 1));
const NumInputBusesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_numinputbuses_free(ptr, 1));
const NumOutputBusesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_numoutputbuses_free(ptr, 1));
const NumRunningSynthsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_numrunningsynths_free(ptr, 1));
const OffsetOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_offsetout_free(ptr, 1));
const OnePoleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_onepole_free(ptr, 1));
const OneZeroFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_onezero_free(ptr, 1));
const OnsetsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_onsets_free(ptr, 1));
const OscFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_osc_free(ptr, 1));
const OutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_out_free(ptr, 1));
const PSinGrainFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_psingrain_free(ptr, 1));
const PV_AddFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_add_free(ptr, 1));
const PV_BinScrambleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_binscramble_free(ptr, 1));
const PV_BinShiftFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_binshift_free(ptr, 1));
const PV_BinWipeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_binwipe_free(ptr, 1));
const PV_BrickWallFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_brickwall_free(ptr, 1));
const PV_ConformalMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_conformalmap_free(ptr, 1));
const PV_ConjFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_conj_free(ptr, 1));
const PV_CopyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_copy_free(ptr, 1));
const PV_CopyPhaseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_copyphase_free(ptr, 1));
const PV_DiffuserFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_diffuser_free(ptr, 1));
const PV_DivFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_div_free(ptr, 1));
const PV_HainsworthFooteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_hainsworthfoote_free(ptr, 1));
const PV_JensenAndersenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_jensenandersen_free(ptr, 1));
const PV_LocalMaxFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_localmax_free(ptr, 1));
const PV_MagAboveFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magabove_free(ptr, 1));
const PV_MagBelowFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magbelow_free(ptr, 1));
const PV_MagClipFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magclip_free(ptr, 1));
const PV_MagDivFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magdiv_free(ptr, 1));
const PV_MagFreezeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magfreeze_free(ptr, 1));
const PV_MagMulFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magmul_free(ptr, 1));
const PV_MagNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magnoise_free(ptr, 1));
const PV_MagShiftFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magshift_free(ptr, 1));
const PV_MagSmearFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magsmear_free(ptr, 1));
const PV_MagSquaredFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_magsquared_free(ptr, 1));
const PV_MaxFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_max_free(ptr, 1));
const PV_MinFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_min_free(ptr, 1));
const PV_MulFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_mul_free(ptr, 1));
const PV_PhaseShiftFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_phaseshift_free(ptr, 1));
const PV_PhaseShift270Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_phaseshift270_free(ptr, 1));
const PV_PhaseShift90Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_phaseshift90_free(ptr, 1));
const PV_RandCombFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_randcomb_free(ptr, 1));
const PV_RandWipeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_randwipe_free(ptr, 1));
const PV_RectCombFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_rectcomb_free(ptr, 1));
const PV_RectComb2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pv_rectcomb2_free(ptr, 1));
const Pan2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pan2_free(ptr, 1));
const Pan4Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pan4_free(ptr, 1));
const PanAzFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_panaz_free(ptr, 1));
const PanBFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_panb_free(ptr, 1));
const PanB2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_panb2_free(ptr, 1));
const PartConvFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_partconv_free(ptr, 1));
const PauseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pause_free(ptr, 1));
const PauseSelfFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pauseself_free(ptr, 1));
const PauseSelfWhenDoneFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pauseselfwhendone_free(ptr, 1));
const PeakFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_peak_free(ptr, 1));
const PeakFollowerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_peakfollower_free(ptr, 1));
const PhasorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_phasor_free(ptr, 1));
const PinkNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pinknoise_free(ptr, 1));
const PitchFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pitch_free(ptr, 1));
const PitchShiftFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pitchshift_free(ptr, 1));
const PlayBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_playbuf_free(ptr, 1));
const PluckFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pluck_free(ptr, 1));
const PollFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_poll_free(ptr, 1));
const PulseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pulse_free(ptr, 1));
const PulseCountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pulsecount_free(ptr, 1));
const PulseDividerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pulsedivider_free(ptr, 1));
const QuadCFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quadc_free(ptr, 1));
const QuadLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quadl_free(ptr, 1));
const QuadNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_quadn_free(ptr, 1));
const RHPFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rhpf_free(ptr, 1));
const RLPFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rlpf_free(ptr, 1));
const RadiansPerSampleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_radianspersample_free(ptr, 1));
const RampFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ramp_free(ptr, 1));
const RandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rand_free(ptr, 1));
const RandIDFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_randid_free(ptr, 1));
const RandSeedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_randseed_free(ptr, 1));
const RecordBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_recordbuf_free(ptr, 1));
const ReplaceOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_replaceout_free(ptr, 1));
const ResonzFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_resonz_free(ptr, 1));
const RingzFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ringz_free(ptr, 1));
const Rotate2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rotate2_free(ptr, 1));
const RunningMaxFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_runningmax_free(ptr, 1));
const RunningMinFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_runningmin_free(ptr, 1));
const RunningSumFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_runningsum_free(ptr, 1));
const SOSFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sos_free(ptr, 1));
const SampleDurFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sampledur_free(ptr, 1));
const SampleRateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_samplerate_free(ptr, 1));
const SawFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_saw_free(ptr, 1));
const SchmidtFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_schmidt_free(ptr, 1));
const ScopeOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_scopeout_free(ptr, 1));
const ScopeOut2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_scopeout2_free(ptr, 1));
const SelectFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_select_free(ptr, 1));
const SendReplyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sendreply_free(ptr, 1));
const SendTrigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sendtrig_free(ptr, 1));
const SetBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_setbuf_free(ptr, 1));
const SetResetFFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_setresetff_free(ptr, 1));
const ShaperFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_shaper_free(ptr, 1));
const SharedInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sharedin_free(ptr, 1));
const SharedOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sharedout_free(ptr, 1));
const SilentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_silent_free(ptr, 1));
const SinOscFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sinosc_free(ptr, 1));
const SinOscFBFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sinoscfb_free(ptr, 1));
const SlewFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_slew_free(ptr, 1));
const SlopeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_slope_free(ptr, 1));
const SpecCentroidFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_speccentroid_free(ptr, 1));
const SpecFlatnessFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_specflatness_free(ptr, 1));
const SpecPcileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_specpcile_free(ptr, 1));
const SpringFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spring_free(ptr, 1));
const StandardLFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_standardl_free(ptr, 1));
const StandardNFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_standardn_free(ptr, 1));
const StepperFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stepper_free(ptr, 1));
const StereoConvolution2LFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stereoconvolution2l_free(ptr, 1));
const SubsampleOffsetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_subsampleoffset_free(ptr, 1));
const SweepFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sweep_free(ptr, 1));
const SyncSawFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_syncsaw_free(ptr, 1));
const SynthDefFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_synthdef_free(ptr, 1));
const T2AFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_t2a_free(ptr, 1));
const T2KFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_t2k_free(ptr, 1));
const TBallFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tball_free(ptr, 1));
const TDelayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tdelay_free(ptr, 1));
const TDutyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tduty_free(ptr, 1));
const TExpRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_texprand_free(ptr, 1));
const TGrainsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tgrains_free(ptr, 1));
const TIRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tirand_free(ptr, 1));
const TRandFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trand_free(ptr, 1));
const TWindexFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_twindex_free(ptr, 1));
const TimerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_timer_free(ptr, 1));
const ToggleFFFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_toggleff_free(ptr, 1));
const TrapezoidFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trapezoid_free(ptr, 1));
const TrigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trig_free(ptr, 1));
const Trig1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trig1_free(ptr, 1));
const TwoPoleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_twopole_free(ptr, 1));
const TwoZeroFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_twozero_free(ptr, 1));
const VDiskInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vdiskin_free(ptr, 1));
const VOscFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vosc_free(ptr, 1));
const VOsc3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vosc3_free(ptr, 1));
const VarSawFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_varsaw_free(ptr, 1));
const VibratoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vibrato_free(ptr, 1));
const Warp1Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_warp1_free(ptr, 1));
const WhiteNoiseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_whitenoise_free(ptr, 1));
const WrapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wrap_free(ptr, 1));
const WrapIndexFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wrapindex_free(ptr, 1));
const XFade2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_xfade2_free(ptr, 1));
const XLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_xline_free(ptr, 1));
const XOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_xout_free(ptr, 1));
const ZeroCrossingFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_zerocrossing_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('scsynthdef_compiler_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
