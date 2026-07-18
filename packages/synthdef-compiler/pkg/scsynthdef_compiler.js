/* @ts-self-types="./scsynthdef_compiler.d.ts" */

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

/**
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function a2KKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.a2KKr(def.__wbg_ptr, args);
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
export function allpassCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.allpassCAr(def.__wbg_ptr, args);
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
export function allpassCKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.allpassCKr(def.__wbg_ptr, args);
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
export function allpassLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.allpassLAr(def.__wbg_ptr, args);
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
export function allpassLKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.allpassLKr(def.__wbg_ptr, args);
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
export function allpassNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.allpassNAr(def.__wbg_ptr, args);
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
export function allpassNKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.allpassNKr(def.__wbg_ptr, args);
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
export function ampCompAAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ampCompAAr(def.__wbg_ptr, args);
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
export function ampCompAIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ampCompAIr(def.__wbg_ptr, args);
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
export function ampCompAKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ampCompAKr(def.__wbg_ptr, args);
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
export function ampCompAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ampCompAr(def.__wbg_ptr, args);
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
export function ampCompIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ampCompIr(def.__wbg_ptr, args);
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
export function ampCompKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ampCompKr(def.__wbg_ptr, args);
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
export function amplitudeAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.amplitudeAr(def.__wbg_ptr, args);
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
export function amplitudeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.amplitudeKr(def.__wbg_ptr, args);
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
export function apfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.apfAr(def.__wbg_ptr, args);
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
export function apfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.apfKr(def.__wbg_ptr, args);
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
export function bAllPassAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bAllPassAr(def.__wbg_ptr, args);
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
export function bBandPassAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bBandPassAr(def.__wbg_ptr, args);
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
export function bBandStopAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bBandStopAr(def.__wbg_ptr, args);
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
export function bHiPassAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bHiPassAr(def.__wbg_ptr, args);
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
export function bHiShelfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bHiShelfAr(def.__wbg_ptr, args);
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
export function bLowPassAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bLowPassAr(def.__wbg_ptr, args);
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
export function bLowShelfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bLowShelfAr(def.__wbg_ptr, args);
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
export function bPeakEqAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bPeakEqAr(def.__wbg_ptr, args);
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
export function balance2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.balance2Ar(def.__wbg_ptr, args);
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
export function balance2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.balance2Kr(def.__wbg_ptr, args);
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
export function ballAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ballAr(def.__wbg_ptr, args);
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
export function ballKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ballKr(def.__wbg_ptr, args);
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
export function beatTrack2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.beatTrack2Kr(def.__wbg_ptr, args);
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
export function beatTrackKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.beatTrackKr(def.__wbg_ptr, args);
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
export function biPanB2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.biPanB2Ar(def.__wbg_ptr, args);
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
export function biPanB2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.biPanB2Kr(def.__wbg_ptr, args);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

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
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function blipAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.blipAr(def.__wbg_ptr, args);
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
export function blipKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.blipKr(def.__wbg_ptr, args);
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
export function bpfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bpfAr(def.__wbg_ptr, args);
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
export function bpfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bpfKr(def.__wbg_ptr, args);
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
export function bpz2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bpz2Ar(def.__wbg_ptr, args);
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
export function bpz2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bpz2Kr(def.__wbg_ptr, args);
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
export function brfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.brfAr(def.__wbg_ptr, args);
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
export function brfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.brfKr(def.__wbg_ptr, args);
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
export function brownNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.brownNoiseAr(def.__wbg_ptr, args);
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
export function brownNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.brownNoiseKr(def.__wbg_ptr, args);
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
export function brz2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.brz2Ar(def.__wbg_ptr, args);
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
export function brz2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.brz2Kr(def.__wbg_ptr, args);
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
export function bufAllpassCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufAllpassCAr(def.__wbg_ptr, args);
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
export function bufAllpassLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufAllpassLAr(def.__wbg_ptr, args);
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
export function bufAllpassNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufAllpassNAr(def.__wbg_ptr, args);
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
export function bufChannelsIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufChannelsIr(def.__wbg_ptr, args);
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
export function bufChannelsKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufChannelsKr(def.__wbg_ptr, args);
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
export function bufCombCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufCombCAr(def.__wbg_ptr, args);
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
export function bufCombLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufCombLAr(def.__wbg_ptr, args);
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
export function bufCombNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufCombNAr(def.__wbg_ptr, args);
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
export function bufDelayCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDelayCAr(def.__wbg_ptr, args);
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
export function bufDelayCKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDelayCKr(def.__wbg_ptr, args);
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
export function bufDelayLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDelayLAr(def.__wbg_ptr, args);
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
export function bufDelayLKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDelayLKr(def.__wbg_ptr, args);
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
export function bufDelayNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDelayNAr(def.__wbg_ptr, args);
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
export function bufDelayNKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDelayNKr(def.__wbg_ptr, args);
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
export function bufDurIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDurIr(def.__wbg_ptr, args);
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
export function bufDurKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufDurKr(def.__wbg_ptr, args);
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
export function bufFramesIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufFramesIr(def.__wbg_ptr, args);
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
export function bufFramesKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufFramesKr(def.__wbg_ptr, args);
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
export function bufRateScaleIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufRateScaleIr(def.__wbg_ptr, args);
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
export function bufRateScaleKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufRateScaleKr(def.__wbg_ptr, args);
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
export function bufRdAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufRdAr(def.__wbg_ptr, args);
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
export function bufRdKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufRdKr(def.__wbg_ptr, args);
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
export function bufSampleRateIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufSampleRateIr(def.__wbg_ptr, args);
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
export function bufSampleRateKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufSampleRateKr(def.__wbg_ptr, args);
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
export function bufSamplesIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufSamplesIr(def.__wbg_ptr, args);
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
export function bufSamplesKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufSamplesKr(def.__wbg_ptr, args);
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
export function bufWrAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufWrAr(def.__wbg_ptr, args);
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
export function bufWrKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.bufWrKr(def.__wbg_ptr, args);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
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
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function cOscAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.cOscAr(def.__wbg_ptr, args);
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
export function cOscKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.cOscKr(def.__wbg_ptr, args);
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
export function checkBadValuesAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.checkBadValuesAr(def.__wbg_ptr, args);
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
export function checkBadValuesKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.checkBadValuesKr(def.__wbg_ptr, args);
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
export function clearBufIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.clearBufIr(def.__wbg_ptr, args);
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
export function clipAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.clipAr(def.__wbg_ptr, args);
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
export function clipKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.clipKr(def.__wbg_ptr, args);
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
export function clipNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.clipNoiseAr(def.__wbg_ptr, args);
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
export function clipNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.clipNoiseKr(def.__wbg_ptr, args);
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
export function coinGateAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.coinGateAr(def.__wbg_ptr, args);
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
export function coinGateKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.coinGateKr(def.__wbg_ptr, args);
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
export function combCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.combCAr(def.__wbg_ptr, args);
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
export function combCKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.combCKr(def.__wbg_ptr, args);
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
export function combLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.combLAr(def.__wbg_ptr, args);
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
export function combLKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.combLKr(def.__wbg_ptr, args);
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
export function combNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.combNAr(def.__wbg_ptr, args);
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
export function combNKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.combNKr(def.__wbg_ptr, args);
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
export function companderAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.companderAr(def.__wbg_ptr, args);
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
export function controlDurIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.controlDurIr(def.__wbg_ptr, args);
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
export function controlRateIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.controlRateIr(def.__wbg_ptr, args);
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
export function convolution2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.convolution2Ar(def.__wbg_ptr, args);
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
export function convolution2LAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.convolution2LAr(def.__wbg_ptr, args);
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
export function convolution3Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.convolution3Ar(def.__wbg_ptr, args);
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
export function convolution3Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.convolution3Kr(def.__wbg_ptr, args);
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
export function convolutionAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.convolutionAr(def.__wbg_ptr, args);
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
export function crackleAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.crackleAr(def.__wbg_ptr, args);
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
export function crackleKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.crackleKr(def.__wbg_ptr, args);
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
export function cuspLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.cuspLAr(def.__wbg_ptr, args);
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
export function cuspNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.cuspNAr(def.__wbg_ptr, args);
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
export function dcAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dcAr(def.__wbg_ptr, args);
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
export function dcKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dcKr(def.__wbg_ptr, args);
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
export function decay2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.decay2Ar(def.__wbg_ptr, args);
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
export function decay2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.decay2Kr(def.__wbg_ptr, args);
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
export function decayAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.decayAr(def.__wbg_ptr, args);
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
export function decayKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.decayKr(def.__wbg_ptr, args);
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
export function decodeB2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.decodeB2Ar(def.__wbg_ptr, args);
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
export function decodeB2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.decodeB2Kr(def.__wbg_ptr, args);
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
export function degreeToKeyAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.degreeToKeyAr(def.__wbg_ptr, args);
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
export function degreeToKeyKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.degreeToKeyKr(def.__wbg_ptr, args);
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
export function delTapRdAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delTapRdAr(def.__wbg_ptr, args);
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
export function delTapRdKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delTapRdKr(def.__wbg_ptr, args);
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
export function delTapWrAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delTapWrAr(def.__wbg_ptr, args);
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
export function delTapWrKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delTapWrKr(def.__wbg_ptr, args);
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
export function delay1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delay1Ar(def.__wbg_ptr, args);
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
export function delay1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delay1Kr(def.__wbg_ptr, args);
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
export function delay2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delay2Ar(def.__wbg_ptr, args);
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
export function delay2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delay2Kr(def.__wbg_ptr, args);
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
export function delayCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delayCAr(def.__wbg_ptr, args);
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
export function delayCKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delayCKr(def.__wbg_ptr, args);
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
export function delayLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delayLAr(def.__wbg_ptr, args);
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
export function delayLKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delayLKr(def.__wbg_ptr, args);
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
export function delayNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delayNAr(def.__wbg_ptr, args);
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
export function delayNKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.delayNKr(def.__wbg_ptr, args);
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
export function demandAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.demandAr(def.__wbg_ptr, args);
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
export function demandEnvGenAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.demandEnvGenAr(def.__wbg_ptr, args);
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
export function demandEnvGenKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.demandEnvGenKr(def.__wbg_ptr, args);
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
export function demandKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.demandKr(def.__wbg_ptr, args);
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
export function detectIndexAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.detectIndexAr(def.__wbg_ptr, args);
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
export function detectIndexKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.detectIndexKr(def.__wbg_ptr, args);
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
export function detectSilenceAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.detectSilenceAr(def.__wbg_ptr, args);
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
export function detectSilenceKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.detectSilenceKr(def.__wbg_ptr, args);
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
export function diskInAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.diskInAr(def.__wbg_ptr, args);
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
export function diskOutAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.diskOutAr(def.__wbg_ptr, args);
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
export function doneKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.doneKr(def.__wbg_ptr, args);
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
export function dust2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dust2Ar(def.__wbg_ptr, args);
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
export function dust2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dust2Kr(def.__wbg_ptr, args);
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
export function dustAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dustAr(def.__wbg_ptr, args);
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
export function dustKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dustKr(def.__wbg_ptr, args);
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
export function dutyAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dutyAr(def.__wbg_ptr, args);
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
export function dutyKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.dutyKr(def.__wbg_ptr, args);
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
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function envGenAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.envGenAr(def.__wbg_ptr, args);
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
export function envGenKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.envGenKr(def.__wbg_ptr, args);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The envelope-shape registry metadata (names, ordered args with
 * defaults/array/modulatable flags, release/loop nodes).
 * @returns {string}
 */
export function envShapesJson() {
    let deferred2_0;
    let deferred2_1;
    try {
        const ret = wasm.envShapesJson();
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function expRandIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.expRandIr(def.__wbg_ptr, args);
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
export function fSinOscAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fSinOscAr(def.__wbg_ptr, args);
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
export function fSinOscKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fSinOscKr(def.__wbg_ptr, args);
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
export function fbSineCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fbSineCAr(def.__wbg_ptr, args);
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
export function fbSineLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fbSineLAr(def.__wbg_ptr, args);
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
export function fbSineNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fbSineNAr(def.__wbg_ptr, args);
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
export function fftKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fftKr(def.__wbg_ptr, args);
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
export function fftTriggerKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fftTriggerKr(def.__wbg_ptr, args);
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
export function foldAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.foldAr(def.__wbg_ptr, args);
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
export function foldKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.foldKr(def.__wbg_ptr, args);
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
export function formantAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.formantAr(def.__wbg_ptr, args);
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
export function formletAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.formletAr(def.__wbg_ptr, args);
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
export function formletKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.formletKr(def.__wbg_ptr, args);
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
export function fosAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fosAr(def.__wbg_ptr, args);
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
export function fosKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.fosKr(def.__wbg_ptr, args);
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
export function freeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.freeKr(def.__wbg_ptr, args);
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
export function freeSelfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.freeSelfKr(def.__wbg_ptr, args);
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
export function freeSelfWhenDoneKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.freeSelfWhenDoneKr(def.__wbg_ptr, args);
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
export function freeVerb2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.freeVerb2Ar(def.__wbg_ptr, args);
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
export function freeVerbAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.freeVerbAr(def.__wbg_ptr, args);
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
export function freqShiftAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.freqShiftAr(def.__wbg_ptr, args);
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
export function gVerbAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gVerbAr(def.__wbg_ptr, args);
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
export function gateAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gateAr(def.__wbg_ptr, args);
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
export function gateKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gateKr(def.__wbg_ptr, args);
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
export function gbmanLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gbmanLAr(def.__wbg_ptr, args);
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
export function gbmanNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gbmanNAr(def.__wbg_ptr, args);
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
export function gendy1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gendy1Ar(def.__wbg_ptr, args);
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
export function gendy1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gendy1Kr(def.__wbg_ptr, args);
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
export function gendy2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gendy2Ar(def.__wbg_ptr, args);
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
export function gendy2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gendy2Kr(def.__wbg_ptr, args);
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
export function gendy3Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gendy3Ar(def.__wbg_ptr, args);
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
export function gendy3Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.gendy3Kr(def.__wbg_ptr, args);
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
export function grainBufAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.grainBufAr(def.__wbg_ptr, args);
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
export function grainFmAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.grainFmAr(def.__wbg_ptr, args);
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
export function grainInAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.grainInAr(def.__wbg_ptr, args);
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
export function grainSinAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.grainSinAr(def.__wbg_ptr, args);
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
export function grayNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.grayNoiseAr(def.__wbg_ptr, args);
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
export function grayNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.grayNoiseKr(def.__wbg_ptr, args);
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
export function hasherAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hasherAr(def.__wbg_ptr, args);
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
export function hasherKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hasherKr(def.__wbg_ptr, args);
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
export function henonCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.henonCAr(def.__wbg_ptr, args);
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
export function henonLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.henonLAr(def.__wbg_ptr, args);
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
export function henonNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.henonNAr(def.__wbg_ptr, args);
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
export function hilbertAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hilbertAr(def.__wbg_ptr, args);
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
export function hpfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hpfAr(def.__wbg_ptr, args);
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
export function hpfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hpfKr(def.__wbg_ptr, args);
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
export function hpz1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hpz1Ar(def.__wbg_ptr, args);
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
export function hpz1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hpz1Kr(def.__wbg_ptr, args);
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
export function hpz2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hpz2Ar(def.__wbg_ptr, args);
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
export function hpz2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.hpz2Kr(def.__wbg_ptr, args);
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
export function iEnvGenAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.iEnvGenAr(def.__wbg_ptr, args);
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
export function iEnvGenKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.iEnvGenKr(def.__wbg_ptr, args);
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
export function iRandIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.iRandIr(def.__wbg_ptr, args);
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
export function ifftAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ifftAr(def.__wbg_ptr, args);
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
export function ifftKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ifftKr(def.__wbg_ptr, args);
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
export function impulseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.impulseAr(def.__wbg_ptr, args);
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
export function impulseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.impulseKr(def.__wbg_ptr, args);
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
export function inAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inAr(def.__wbg_ptr, args);
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
export function inFeedbackAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inFeedbackAr(def.__wbg_ptr, args);
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
export function inKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inKr(def.__wbg_ptr, args);
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
export function inRangeAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inRangeAr(def.__wbg_ptr, args);
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
export function inRangeIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inRangeIr(def.__wbg_ptr, args);
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
export function inRangeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inRangeKr(def.__wbg_ptr, args);
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
export function inRectAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inRectAr(def.__wbg_ptr, args);
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
export function inRectKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inRectKr(def.__wbg_ptr, args);
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
export function inTrigKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.inTrigKr(def.__wbg_ptr, args);
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
export function indexAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.indexAr(def.__wbg_ptr, args);
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
export function indexInBetweenAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.indexInBetweenAr(def.__wbg_ptr, args);
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
export function indexInBetweenKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.indexInBetweenKr(def.__wbg_ptr, args);
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
export function indexKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.indexKr(def.__wbg_ptr, args);
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
export function integratorAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.integratorAr(def.__wbg_ptr, args);
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
export function integratorKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.integratorKr(def.__wbg_ptr, args);
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
export function k2AAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.k2AAr(def.__wbg_ptr, args);
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
export function keyStateKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.keyStateKr(def.__wbg_ptr, args);
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
export function keyTrackKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.keyTrackKr(def.__wbg_ptr, args);
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
export function klangAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.klangAr(def.__wbg_ptr, args);
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
export function klankAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.klankAr(def.__wbg_ptr, args);
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
export function lag2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag2Ar(def.__wbg_ptr, args);
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
export function lag2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag2Kr(def.__wbg_ptr, args);
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
export function lag2UdAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag2UdAr(def.__wbg_ptr, args);
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
export function lag2UdKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag2UdKr(def.__wbg_ptr, args);
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
export function lag3Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag3Ar(def.__wbg_ptr, args);
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
export function lag3Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag3Kr(def.__wbg_ptr, args);
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
export function lag3UdAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag3UdAr(def.__wbg_ptr, args);
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
export function lag3UdKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lag3UdKr(def.__wbg_ptr, args);
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
export function lagAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lagAr(def.__wbg_ptr, args);
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
export function lagInKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lagInKr(def.__wbg_ptr, args);
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
export function lagKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lagKr(def.__wbg_ptr, args);
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
export function lagUdAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lagUdAr(def.__wbg_ptr, args);
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
export function lagUdKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lagUdKr(def.__wbg_ptr, args);
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
export function lastValueAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lastValueAr(def.__wbg_ptr, args);
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
export function lastValueKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lastValueKr(def.__wbg_ptr, args);
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
export function latchAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.latchAr(def.__wbg_ptr, args);
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
export function latchKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.latchKr(def.__wbg_ptr, args);
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
export function latoocarfianCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.latoocarfianCAr(def.__wbg_ptr, args);
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
export function latoocarfianLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.latoocarfianLAr(def.__wbg_ptr, args);
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
export function latoocarfianNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.latoocarfianNAr(def.__wbg_ptr, args);
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
export function leakDcAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.leakDcAr(def.__wbg_ptr, args);
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
export function leakDcKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.leakDcKr(def.__wbg_ptr, args);
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
export function leastChangeAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.leastChangeAr(def.__wbg_ptr, args);
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
export function leastChangeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.leastChangeKr(def.__wbg_ptr, args);
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
export function lfClipNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfClipNoiseAr(def.__wbg_ptr, args);
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
export function lfClipNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfClipNoiseKr(def.__wbg_ptr, args);
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
export function lfCubAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfCubAr(def.__wbg_ptr, args);
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
export function lfCubKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfCubKr(def.__wbg_ptr, args);
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
export function lfGaussAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfGaussAr(def.__wbg_ptr, args);
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
export function lfGaussKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfGaussKr(def.__wbg_ptr, args);
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
export function lfNoise0Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfNoise0Ar(def.__wbg_ptr, args);
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
export function lfNoise0Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfNoise0Kr(def.__wbg_ptr, args);
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
export function lfNoise1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfNoise1Ar(def.__wbg_ptr, args);
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
export function lfNoise1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfNoise1Kr(def.__wbg_ptr, args);
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
export function lfNoise2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfNoise2Ar(def.__wbg_ptr, args);
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
export function lfNoise2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfNoise2Kr(def.__wbg_ptr, args);
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
export function lfParAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfParAr(def.__wbg_ptr, args);
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
export function lfParKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfParKr(def.__wbg_ptr, args);
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
export function lfPulseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfPulseAr(def.__wbg_ptr, args);
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
export function lfPulseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfPulseKr(def.__wbg_ptr, args);
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
export function lfSawAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfSawAr(def.__wbg_ptr, args);
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
export function lfSawKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfSawKr(def.__wbg_ptr, args);
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
export function lfTriAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfTriAr(def.__wbg_ptr, args);
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
export function lfTriKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfTriKr(def.__wbg_ptr, args);
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
export function lfdClipNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdClipNoiseAr(def.__wbg_ptr, args);
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
export function lfdClipNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdClipNoiseKr(def.__wbg_ptr, args);
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
export function lfdNoise0Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdNoise0Ar(def.__wbg_ptr, args);
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
export function lfdNoise0Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdNoise0Kr(def.__wbg_ptr, args);
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
export function lfdNoise1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdNoise1Ar(def.__wbg_ptr, args);
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
export function lfdNoise1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdNoise1Kr(def.__wbg_ptr, args);
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
export function lfdNoise3Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdNoise3Ar(def.__wbg_ptr, args);
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
export function lfdNoise3Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lfdNoise3Kr(def.__wbg_ptr, args);
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
export function limiterAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.limiterAr(def.__wbg_ptr, args);
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
export function linCongCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linCongCAr(def.__wbg_ptr, args);
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
export function linCongLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linCongLAr(def.__wbg_ptr, args);
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
export function linCongNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linCongNAr(def.__wbg_ptr, args);
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
export function linExpAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linExpAr(def.__wbg_ptr, args);
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
export function linExpKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linExpKr(def.__wbg_ptr, args);
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
export function linPan2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linPan2Ar(def.__wbg_ptr, args);
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
export function linPan2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linPan2Kr(def.__wbg_ptr, args);
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
export function linRandIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linRandIr(def.__wbg_ptr, args);
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
export function linXFade2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linXFade2Ar(def.__wbg_ptr, args);
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
export function linXFade2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linXFade2Kr(def.__wbg_ptr, args);
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
export function lineAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lineAr(def.__wbg_ptr, args);
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
export function lineKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lineKr(def.__wbg_ptr, args);
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
export function linenKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.linenKr(def.__wbg_ptr, args);
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
export function localBufIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.localBufIr(def.__wbg_ptr, args);
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
export function localInAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.localInAr(def.__wbg_ptr, args);
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
export function localInKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.localInKr(def.__wbg_ptr, args);
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
export function localOutAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.localOutAr(def.__wbg_ptr, args);
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
export function localOutKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.localOutKr(def.__wbg_ptr, args);
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
export function logisticAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.logisticAr(def.__wbg_ptr, args);
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
export function logisticKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.logisticKr(def.__wbg_ptr, args);
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
export function lorenzLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lorenzLAr(def.__wbg_ptr, args);
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
export function loudnessKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.loudnessKr(def.__wbg_ptr, args);
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
export function lpfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lpfAr(def.__wbg_ptr, args);
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
export function lpfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lpfKr(def.__wbg_ptr, args);
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
export function lpz1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lpz1Ar(def.__wbg_ptr, args);
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
export function lpz1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lpz1Kr(def.__wbg_ptr, args);
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
export function lpz2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lpz2Ar(def.__wbg_ptr, args);
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
export function lpz2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.lpz2Kr(def.__wbg_ptr, args);
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
export function mantissaMaskAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mantissaMaskAr(def.__wbg_ptr, args);
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
export function mantissaMaskKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mantissaMaskKr(def.__wbg_ptr, args);
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
export function maxLocalBufsIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.maxLocalBufsIr(def.__wbg_ptr, args);
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
export function medianAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.medianAr(def.__wbg_ptr, args);
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
export function medianKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.medianKr(def.__wbg_ptr, args);
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
export function mfccKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mfccKr(def.__wbg_ptr, args);
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
export function midEqAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.midEqAr(def.__wbg_ptr, args);
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
export function midEqKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.midEqKr(def.__wbg_ptr, args);
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
export function moogFfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.moogFfAr(def.__wbg_ptr, args);
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
export function moogFfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.moogFfKr(def.__wbg_ptr, args);
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
export function mostChangeAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mostChangeAr(def.__wbg_ptr, args);
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
export function mostChangeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mostChangeKr(def.__wbg_ptr, args);
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
export function mouseButtonKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mouseButtonKr(def.__wbg_ptr, args);
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
export function mouseXKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mouseXKr(def.__wbg_ptr, args);
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
export function mouseYKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mouseYKr(def.__wbg_ptr, args);
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
export function mulAddAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mulAddAr(def.__wbg_ptr, args);
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
export function mulAddIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mulAddIr(def.__wbg_ptr, args);
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
export function mulAddKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.mulAddKr(def.__wbg_ptr, args);
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
export function nRandIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.nRandIr(def.__wbg_ptr, args);
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
export function normalizerAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.normalizerAr(def.__wbg_ptr, args);
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
export function numAudioBusesIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numAudioBusesIr(def.__wbg_ptr, args);
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
export function numBuffersIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numBuffersIr(def.__wbg_ptr, args);
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
export function numControlBusesIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numControlBusesIr(def.__wbg_ptr, args);
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
export function numInputBusesIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numInputBusesIr(def.__wbg_ptr, args);
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
export function numOutputBusesIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numOutputBusesIr(def.__wbg_ptr, args);
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
export function numRunningSynthsIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numRunningSynthsIr(def.__wbg_ptr, args);
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
export function numRunningSynthsKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.numRunningSynthsKr(def.__wbg_ptr, args);
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
export function offsetOutAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.offsetOutAr(def.__wbg_ptr, args);
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
export function offsetOutKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.offsetOutKr(def.__wbg_ptr, args);
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
export function onePoleAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.onePoleAr(def.__wbg_ptr, args);
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
export function onePoleKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.onePoleKr(def.__wbg_ptr, args);
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
export function oneZeroAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.oneZeroAr(def.__wbg_ptr, args);
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
export function oneZeroKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.oneZeroKr(def.__wbg_ptr, args);
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
export function onsetsKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.onsetsKr(def.__wbg_ptr, args);
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
export function oscAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.oscAr(def.__wbg_ptr, args);
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
export function oscKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.oscKr(def.__wbg_ptr, args);
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
export function outAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.outAr(def.__wbg_ptr, args);
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
export function outKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.outKr(def.__wbg_ptr, args);
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
export function pSinGrainAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pSinGrainAr(def.__wbg_ptr, args);
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
export function pan2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pan2Ar(def.__wbg_ptr, args);
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
export function pan2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pan2Kr(def.__wbg_ptr, args);
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
export function pan4Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pan4Ar(def.__wbg_ptr, args);
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
export function pan4Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pan4Kr(def.__wbg_ptr, args);
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
export function panAzAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.panAzAr(def.__wbg_ptr, args);
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
export function panAzKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.panAzKr(def.__wbg_ptr, args);
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
export function panB2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.panB2Ar(def.__wbg_ptr, args);
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
export function panB2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.panB2Kr(def.__wbg_ptr, args);
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
export function panBAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.panBAr(def.__wbg_ptr, args);
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
export function panBKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.panBKr(def.__wbg_ptr, args);
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
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function partConvAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.partConvAr(def.__wbg_ptr, args);
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
export function pauseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pauseKr(def.__wbg_ptr, args);
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
export function pauseSelfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pauseSelfKr(def.__wbg_ptr, args);
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
export function pauseSelfWhenDoneKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pauseSelfWhenDoneKr(def.__wbg_ptr, args);
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
export function peakAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.peakAr(def.__wbg_ptr, args);
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
export function peakFollowerAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.peakFollowerAr(def.__wbg_ptr, args);
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
export function peakFollowerKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.peakFollowerKr(def.__wbg_ptr, args);
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
export function peakKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.peakKr(def.__wbg_ptr, args);
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
export function phasorAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.phasorAr(def.__wbg_ptr, args);
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
export function phasorKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.phasorKr(def.__wbg_ptr, args);
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
export function pinkNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pinkNoiseAr(def.__wbg_ptr, args);
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
export function pinkNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pinkNoiseKr(def.__wbg_ptr, args);
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
export function pitchKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pitchKr(def.__wbg_ptr, args);
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
export function pitchShiftAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pitchShiftAr(def.__wbg_ptr, args);
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
export function playBufAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.playBufAr(def.__wbg_ptr, args);
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
export function playBufKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.playBufKr(def.__wbg_ptr, args);
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
export function pluckAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pluckAr(def.__wbg_ptr, args);
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
export function pollAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pollAr(def.__wbg_ptr, args);
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
export function pollKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pollKr(def.__wbg_ptr, args);
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
export function pulseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pulseAr(def.__wbg_ptr, args);
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
export function pulseCountAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pulseCountAr(def.__wbg_ptr, args);
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
export function pulseCountKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pulseCountKr(def.__wbg_ptr, args);
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
export function pulseDividerAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pulseDividerAr(def.__wbg_ptr, args);
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
export function pulseDividerKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pulseDividerKr(def.__wbg_ptr, args);
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
export function pulseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pulseKr(def.__wbg_ptr, args);
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
export function pvAddKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvAddKr(def.__wbg_ptr, args);
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
export function pvBinScrambleKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvBinScrambleKr(def.__wbg_ptr, args);
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
export function pvBinShiftKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvBinShiftKr(def.__wbg_ptr, args);
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
export function pvBinWipeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvBinWipeKr(def.__wbg_ptr, args);
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
export function pvBrickWallKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvBrickWallKr(def.__wbg_ptr, args);
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
export function pvConformalMapKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvConformalMapKr(def.__wbg_ptr, args);
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
export function pvConjKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvConjKr(def.__wbg_ptr, args);
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
export function pvCopyKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvCopyKr(def.__wbg_ptr, args);
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
export function pvCopyPhaseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvCopyPhaseKr(def.__wbg_ptr, args);
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
export function pvDiffuserKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvDiffuserKr(def.__wbg_ptr, args);
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
export function pvDivKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvDivKr(def.__wbg_ptr, args);
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
export function pvHainsworthFooteAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvHainsworthFooteAr(def.__wbg_ptr, args);
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
export function pvJensenAndersenAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvJensenAndersenAr(def.__wbg_ptr, args);
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
export function pvLocalMaxKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvLocalMaxKr(def.__wbg_ptr, args);
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
export function pvMagAboveKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagAboveKr(def.__wbg_ptr, args);
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
export function pvMagBelowKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagBelowKr(def.__wbg_ptr, args);
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
export function pvMagClipKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagClipKr(def.__wbg_ptr, args);
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
export function pvMagDivKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagDivKr(def.__wbg_ptr, args);
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
export function pvMagFreezeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagFreezeKr(def.__wbg_ptr, args);
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
export function pvMagMulKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagMulKr(def.__wbg_ptr, args);
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
export function pvMagNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagNoiseKr(def.__wbg_ptr, args);
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
export function pvMagShiftKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagShiftKr(def.__wbg_ptr, args);
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
export function pvMagSmearKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagSmearKr(def.__wbg_ptr, args);
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
export function pvMagSquaredKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMagSquaredKr(def.__wbg_ptr, args);
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
export function pvMaxKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMaxKr(def.__wbg_ptr, args);
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
export function pvMinKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMinKr(def.__wbg_ptr, args);
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
export function pvMulKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvMulKr(def.__wbg_ptr, args);
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
export function pvPhaseShift270Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvPhaseShift270Kr(def.__wbg_ptr, args);
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
export function pvPhaseShift90Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvPhaseShift90Kr(def.__wbg_ptr, args);
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
export function pvPhaseShiftKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvPhaseShiftKr(def.__wbg_ptr, args);
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
export function pvRandCombKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvRandCombKr(def.__wbg_ptr, args);
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
export function pvRandWipeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvRandWipeKr(def.__wbg_ptr, args);
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
export function pvRectComb2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvRectComb2Kr(def.__wbg_ptr, args);
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
export function pvRectCombKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.pvRectCombKr(def.__wbg_ptr, args);
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
export function quadCAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.quadCAr(def.__wbg_ptr, args);
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
export function quadLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.quadLAr(def.__wbg_ptr, args);
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
export function quadNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.quadNAr(def.__wbg_ptr, args);
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
export function radiansPerSampleIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.radiansPerSampleIr(def.__wbg_ptr, args);
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
export function rampAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rampAr(def.__wbg_ptr, args);
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
export function rampKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rampKr(def.__wbg_ptr, args);
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
export function randIdIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.randIdIr(def.__wbg_ptr, args);
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
export function randIdKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.randIdKr(def.__wbg_ptr, args);
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
export function randIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.randIr(def.__wbg_ptr, args);
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
export function randSeedAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.randSeedAr(def.__wbg_ptr, args);
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
export function randSeedIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.randSeedIr(def.__wbg_ptr, args);
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
export function randSeedKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.randSeedKr(def.__wbg_ptr, args);
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
export function recordBufAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.recordBufAr(def.__wbg_ptr, args);
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
export function recordBufKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.recordBufKr(def.__wbg_ptr, args);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The full bundled UGen registry as JSON, grouped by source-file category:
 * `[[category, [entries, …]], …]`.
 * @returns {string}
 */
export function registryJson() {
    let deferred2_0;
    let deferred2_1;
    try {
        const ret = wasm.registryJson();
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function replaceOutAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.replaceOutAr(def.__wbg_ptr, args);
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
export function replaceOutKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.replaceOutKr(def.__wbg_ptr, args);
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
export function resonzAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.resonzAr(def.__wbg_ptr, args);
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
export function resonzKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.resonzKr(def.__wbg_ptr, args);
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
export function rhpfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rhpfAr(def.__wbg_ptr, args);
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
export function rhpfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rhpfKr(def.__wbg_ptr, args);
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
export function ringzAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ringzAr(def.__wbg_ptr, args);
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
export function ringzKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.ringzKr(def.__wbg_ptr, args);
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
export function rlpfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rlpfAr(def.__wbg_ptr, args);
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
export function rlpfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rlpfKr(def.__wbg_ptr, args);
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
export function rotate2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rotate2Ar(def.__wbg_ptr, args);
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
export function rotate2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.rotate2Kr(def.__wbg_ptr, args);
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
export function runningMaxAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.runningMaxAr(def.__wbg_ptr, args);
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
export function runningMaxKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.runningMaxKr(def.__wbg_ptr, args);
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
export function runningMinAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.runningMinAr(def.__wbg_ptr, args);
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
export function runningMinKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.runningMinKr(def.__wbg_ptr, args);
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
export function runningSumAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.runningSumAr(def.__wbg_ptr, args);
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
export function runningSumKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.runningSumKr(def.__wbg_ptr, args);
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
export function sampleDurIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sampleDurIr(def.__wbg_ptr, args);
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
export function sampleRateIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sampleRateIr(def.__wbg_ptr, args);
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
export function sawAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sawAr(def.__wbg_ptr, args);
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
export function sawKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sawKr(def.__wbg_ptr, args);
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
export function schmidtAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.schmidtAr(def.__wbg_ptr, args);
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
export function schmidtKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.schmidtKr(def.__wbg_ptr, args);
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
export function scopeOut2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.scopeOut2Ar(def.__wbg_ptr, args);
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
export function scopeOut2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.scopeOut2Kr(def.__wbg_ptr, args);
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
export function scopeOutAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.scopeOutAr(def.__wbg_ptr, args);
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
export function scopeOutKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.scopeOutKr(def.__wbg_ptr, args);
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
export function selectAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.selectAr(def.__wbg_ptr, args);
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
export function selectKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.selectKr(def.__wbg_ptr, args);
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
export function sendReplyAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sendReplyAr(def.__wbg_ptr, args);
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
export function sendReplyKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sendReplyKr(def.__wbg_ptr, args);
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
export function sendTrigAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sendTrigAr(def.__wbg_ptr, args);
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
export function sendTrigKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sendTrigKr(def.__wbg_ptr, args);
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
export function setBufAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.setBufAr(def.__wbg_ptr, args);
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
export function setBufKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.setBufKr(def.__wbg_ptr, args);
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
export function setResetFfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.setResetFfAr(def.__wbg_ptr, args);
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
export function setResetFfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.setResetFfKr(def.__wbg_ptr, args);
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
export function shaperAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.shaperAr(def.__wbg_ptr, args);
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
export function shaperKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.shaperKr(def.__wbg_ptr, args);
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
export function sharedInKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sharedInKr(def.__wbg_ptr, args);
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
export function sharedOutKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sharedOutKr(def.__wbg_ptr, args);
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
export function silentAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.silentAr(def.__wbg_ptr, args);
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
export function sinOscAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sinOscAr(def.__wbg_ptr, args);
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
export function sinOscFbAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sinOscFbAr(def.__wbg_ptr, args);
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
export function sinOscFbKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sinOscFbKr(def.__wbg_ptr, args);
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
export function sinOscKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sinOscKr(def.__wbg_ptr, args);
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
export function slewAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.slewAr(def.__wbg_ptr, args);
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
export function slewKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.slewKr(def.__wbg_ptr, args);
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
export function slopeAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.slopeAr(def.__wbg_ptr, args);
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
export function slopeKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.slopeKr(def.__wbg_ptr, args);
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
export function sosAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sosAr(def.__wbg_ptr, args);
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
export function sosKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sosKr(def.__wbg_ptr, args);
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
export function specCentroidKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.specCentroidKr(def.__wbg_ptr, args);
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
export function specFlatnessKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.specFlatnessKr(def.__wbg_ptr, args);
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
export function specPcileKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.specPcileKr(def.__wbg_ptr, args);
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
export function springAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.springAr(def.__wbg_ptr, args);
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
export function springKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.springKr(def.__wbg_ptr, args);
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
export function standardLAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.standardLAr(def.__wbg_ptr, args);
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
export function standardNAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.standardNAr(def.__wbg_ptr, args);
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
export function stepperAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.stepperAr(def.__wbg_ptr, args);
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
export function stepperKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.stepperKr(def.__wbg_ptr, args);
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
export function stereoConvolution2LAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.stereoConvolution2LAr(def.__wbg_ptr, args);
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
export function subsampleOffsetIr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.subsampleOffsetIr(def.__wbg_ptr, args);
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
export function sweepAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sweepAr(def.__wbg_ptr, args);
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
export function sweepKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.sweepKr(def.__wbg_ptr, args);
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
export function syncSawAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.syncSawAr(def.__wbg_ptr, args);
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
export function syncSawKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.syncSawKr(def.__wbg_ptr, args);
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
export function t2AAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.t2AAr(def.__wbg_ptr, args);
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
export function t2KKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.t2KKr(def.__wbg_ptr, args);
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
export function tBallAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tBallAr(def.__wbg_ptr, args);
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
export function tBallKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tBallKr(def.__wbg_ptr, args);
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
export function tDelayAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tDelayAr(def.__wbg_ptr, args);
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
export function tDelayKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tDelayKr(def.__wbg_ptr, args);
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
export function tDutyAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tDutyAr(def.__wbg_ptr, args);
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
export function tDutyKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tDutyKr(def.__wbg_ptr, args);
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
export function tExpRandAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tExpRandAr(def.__wbg_ptr, args);
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
export function tExpRandKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tExpRandKr(def.__wbg_ptr, args);
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
export function tGrainsAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tGrainsAr(def.__wbg_ptr, args);
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
export function tRandAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tRandAr(def.__wbg_ptr, args);
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
export function tRandKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tRandKr(def.__wbg_ptr, args);
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
export function tWindexAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tWindexAr(def.__wbg_ptr, args);
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
export function tWindexKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tWindexKr(def.__wbg_ptr, args);
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
export function tiRandAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tiRandAr(def.__wbg_ptr, args);
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
export function tiRandKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.tiRandKr(def.__wbg_ptr, args);
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
export function timerAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.timerAr(def.__wbg_ptr, args);
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
export function timerKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.timerKr(def.__wbg_ptr, args);
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
export function toggleFfAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.toggleFfAr(def.__wbg_ptr, args);
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
export function toggleFfKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.toggleFfKr(def.__wbg_ptr, args);
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
export function trapezoidAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.trapezoidAr(def.__wbg_ptr, args);
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
export function trapezoidKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.trapezoidKr(def.__wbg_ptr, args);
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
export function trig1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.trig1Ar(def.__wbg_ptr, args);
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
export function trig1Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.trig1Kr(def.__wbg_ptr, args);
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
export function trigAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.trigAr(def.__wbg_ptr, args);
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
export function trigKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.trigKr(def.__wbg_ptr, args);
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
export function twoPoleAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.twoPoleAr(def.__wbg_ptr, args);
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
export function twoPoleKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.twoPoleKr(def.__wbg_ptr, args);
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
export function twoZeroAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.twoZeroAr(def.__wbg_ptr, args);
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
export function twoZeroKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.twoZeroKr(def.__wbg_ptr, args);
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

/**
 * @param {SynthDef} def
 * @param {any} args
 * @returns {any}
 */
export function vDiskInAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vDiskInAr(def.__wbg_ptr, args);
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
export function vOsc3Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vOsc3Ar(def.__wbg_ptr, args);
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
export function vOsc3Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vOsc3Kr(def.__wbg_ptr, args);
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
export function vOscAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vOscAr(def.__wbg_ptr, args);
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
export function vOscKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vOscKr(def.__wbg_ptr, args);
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
export function varSawAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.varSawAr(def.__wbg_ptr, args);
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
export function varSawKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.varSawKr(def.__wbg_ptr, args);
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
export function vibratoAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vibratoAr(def.__wbg_ptr, args);
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
export function vibratoKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.vibratoKr(def.__wbg_ptr, args);
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
export function warp1Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.warp1Ar(def.__wbg_ptr, args);
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
export function whiteNoiseAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.whiteNoiseAr(def.__wbg_ptr, args);
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
export function whiteNoiseKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.whiteNoiseKr(def.__wbg_ptr, args);
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
export function wrapAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.wrapAr(def.__wbg_ptr, args);
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
export function wrapIndexAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.wrapIndexAr(def.__wbg_ptr, args);
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
export function wrapIndexKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.wrapIndexKr(def.__wbg_ptr, args);
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
export function wrapKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.wrapKr(def.__wbg_ptr, args);
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
export function xFade2Ar(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.xFade2Ar(def.__wbg_ptr, args);
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
export function xFade2Kr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.xFade2Kr(def.__wbg_ptr, args);
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
export function xLineAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.xLineAr(def.__wbg_ptr, args);
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
export function xLineKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.xLineKr(def.__wbg_ptr, args);
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
export function xOutAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.xOutAr(def.__wbg_ptr, args);
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
export function xOutKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.xOutKr(def.__wbg_ptr, args);
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
export function zeroCrossingAr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.zeroCrossingAr(def.__wbg_ptr, args);
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
export function zeroCrossingKr(def, args) {
    _assertClass(def, SynthDef);
    const ret = wasm.zeroCrossingKr(def.__wbg_ptr, args);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
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

const SynthDefFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_synthdef_free(ptr, 1));

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
