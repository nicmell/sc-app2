/* @ts-self-types="./scserver_commands.d.ts" */

/**
 * Wall-clock helper: convert a Unix timestamp in milliseconds (what
 * `Date.now()` yields) into the NTP timetag a bundle carries. Negative or
 * non-finite input yields the OSC "immediate" tag `(0, 1)`.
 * @param {number} ms
 * @returns {OscTimetag}
 */
export function at_unix_ms(ms) {
    const ret = wasm.at_unix_ms(ms);
    return ret;
}

/**
 * Allocate buffer space.
 * @param {any} bufnum
 * @param {any} num_frames
 * @param {any} opts
 * @returns {any}
 */
export function bAlloc(bufnum, num_frames, opts) {
    const ret = wasm.bAlloc(bufnum, num_frames, opts);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Allocate buffer space and read a sound file.
 * @param {any} bufnum
 * @param {any} path
 * @param {any} opts
 * @returns {any}
 */
export function bAllocRead(bufnum, path, opts) {
    const ret = wasm.bAllocRead(bufnum, path, opts);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Allocate buffer space and read channels from a sound file.
 * @param {any} bufnum
 * @param {any} path
 * @param {any} start_frame
 * @param {any} number_of_frames
 * @param {any} channels
 * @param {any} completion_msg
 * @returns {any}
 */
export function bAllocReadChannel(bufnum, path, start_frame, number_of_frames, channels, completion_msg) {
    const ret = wasm.bAllocReadChannel(bufnum, path, start_frame, number_of_frames, channels, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Close soundfile.
 * @param {any} bufnum
 * @param {any} completion_msg
 * @returns {any}
 */
export function bClose(bufnum, completion_msg) {
    const ret = wasm.bClose(bufnum, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Fill ranges of sample value(s).
 * @param {any} bufnum
 * @param {any} tail
 * @returns {any}
 */
export function bFill(bufnum, tail) {
    const ret = wasm.bFill(bufnum, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Free buffer data.
 * @param {any} bufnum
 * @param {any} completion_msg
 * @returns {any}
 */
export function bFree(bufnum, completion_msg) {
    const ret = wasm.bFree(bufnum, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Call a command to fill a buffer.
 * @param {any} bufnum
 * @param {any} cmd
 * @param {any} command_arguments
 * @returns {any}
 */
export function bGen(bufnum, cmd, command_arguments) {
    const ret = wasm.bGen(bufnum, cmd, command_arguments);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get sample value(s).
 * @param {any} bufnum
 * @param {any} sample_indices
 * @returns {any}
 */
export function bGet(bufnum, sample_indices) {
    const ret = wasm.bGet(bufnum, sample_indices);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get ranges of sample value(s).
 * @param {any} bufnum
 * @param {any} tail
 * @returns {any}
 */
export function bGetn(bufnum, tail) {
    const ret = wasm.bGetn(bufnum, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get buffer info.
 * @param {any} bufnums
 * @returns {any}
 */
export function bQuery(bufnums) {
    const ret = wasm.bQuery(bufnums);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Read sound file data into an existing buffer.
 * @param {any} bufnum
 * @param {any} path
 * @param {any} opts
 * @returns {any}
 */
export function bRead(bufnum, path, opts) {
    const ret = wasm.bRead(bufnum, path, opts);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Read sound file channel data into an existing buffer.
 * @param {any} bufnum
 * @param {any} path
 * @param {any} start_frame
 * @param {any} number_of_frames
 * @param {any} starting_frame
 * @param {any} leave_file_open
 * @param {any} channels
 * @param {any} completion_msg
 * @returns {any}
 */
export function bReadChannel(bufnum, path, start_frame, number_of_frames, starting_frame, leave_file_open, channels, completion_msg) {
    const ret = wasm.bReadChannel(bufnum, path, start_frame, number_of_frames, starting_frame, leave_file_open, channels, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set sample value(s).
 * @param {any} bufnum
 * @param {any} tail
 * @returns {any}
 */
export function bSet(bufnum, tail) {
    const ret = wasm.bSet(bufnum, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set the sampling rate of the buffer.
 * @param {any} bufnum
 * @param {any} the_desired_sampling
 * @returns {any}
 */
export function bSetSampleRate(bufnum, the_desired_sampling) {
    const ret = wasm.bSetSampleRate(bufnum, the_desired_sampling);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set ranges of sample value(s).
 * @param {any} bufnum
 * @param {any} tail
 * @returns {any}
 */
export function bSetn(bufnum, tail) {
    const ret = wasm.bSetn(bufnum, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Write sound file data.
 * @param {any} bufnum
 * @param {any} path
 * @param {any} header_format
 * @param {any} sample_format
 * @param {any} opts
 * @returns {any}
 */
export function bWrite(bufnum, path, header_format, sample_format, opts) {
    const ret = wasm.bWrite(bufnum, path, header_format, sample_format, opts);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Zero sample data.
 * @param {any} bufnum
 * @param {any} completion_msg
 * @returns {any}
 */
export function bZero(bufnum, completion_msg) {
    const ret = wasm.bZero(bufnum, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Fill ranges of bus value(s).
 * @param {any} tail
 * @returns {any}
 */
export function cFill(tail) {
    const ret = wasm.cFill(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get bus value(s).
 * @param {any} bus_indices
 * @returns {any}
 */
export function cGet(bus_indices) {
    const ret = wasm.cGet(bus_indices);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get ranges of bus value(s).
 * @param {any} tail
 * @returns {any}
 */
export function cGetn(tail) {
    const ret = wasm.cGetn(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set bus value(s).
 * @param {any} tail
 * @returns {any}
 */
export function cSet(tail) {
    const ret = wasm.cSet(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set ranges of bus value(s).
 * @param {any} tail
 * @returns {any}
 */
export function cSetn(tail) {
    const ret = wasm.cSetn(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Clear all scheduled bundles. Removes all bundles from the scheduling queue.
 * @returns {any}
 */
export function clearSched() {
    const ret = wasm.clearSched();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Plug-in defined command.
 * @param {any} cmd
 * @param {any} any_arguments
 * @returns {any}
 */
export function cmd(cmd, any_arguments) {
    const ret = wasm.cmd(cmd, any_arguments);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Delete synth definition.
 * @param {any} synth_def_names
 * @returns {any}
 */
export function dFree(synth_def_names) {
    const ret = wasm.dFree(synth_def_names);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Load synth definition.
 * @param {any} pathname_of_file
 * @param {any} completion_msg
 * @returns {any}
 */
export function dLoad(pathname_of_file, completion_msg) {
    const ret = wasm.dLoad(pathname_of_file, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Load a directory of synth definitions.
 * @param {any} pathname_of_directory
 * @param {any} completion_msg
 * @returns {any}
 */
export function dLoadDir(pathname_of_directory, completion_msg) {
    const ret = wasm.dLoadDir(pathname_of_directory, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Receive a synth definition file.
 * @param {any} buffer_of_data
 * @param {any} completion_msg
 * @returns {any}
 */
export function dRecv(buffer_of_data, completion_msg) {
    const ret = wasm.dRecv(buffer_of_data, completion_msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Decode an inbound packet — a bare message or a `#bundle` — into raw
 * `{ address, args }` views with NO typed mapping: the rx log rendering
 * and the tests' wire-truth view.
 * @param {Uint8Array} bytes
 * @returns {Array<any>}
 */
export function decode_raw_packet(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode_raw_packet(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Classify one OSC reply message into its typed variant.
 * @param {Uint8Array} bytes
 * @returns {any}
 */
export function decode_reply(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode_reply(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Decode a raw inbound packet — a bare message or a `#bundle` — into typed
 * replies, one per contained message. Nested bundles are rejected (scsynth
 * never sends them).
 * @param {Uint8Array} bytes
 * @returns {Array<any>}
 */
export function decode_reply_packet(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode_reply_packet(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * sc-app bridge extension (not in the SC command reference): a SuperDirt/Strudel event, routed by the bridge to the strudel peer. The wire format is SuperDirt's alternating key/value arg list.
 * @param {any} pairs
 * @returns {any}
 */
export function dirtPlay(pairs) {
    const ret = wasm.dirtPlay(pairs);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Display incoming OSC messages.
 * @param {any} code
 * @returns {any}
 */
export function dumpOSC(code) {
    const ret = wasm.dumpOSC(code);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Serialise one typed command to OSC wire bytes.
 * @param {any} msg
 * @returns {Uint8Array}
 */
export function encode(msg) {
    const ret = wasm.encode(msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Serialise many commands into one standard OSC bundle — scsynth applies
 * the whole bundle atomically at the timetag.
 * @param {any} time
 * @param {Array<any>} msgs
 * @returns {Uint8Array}
 */
export function encode_bundle(time, msgs) {
    const ret = wasm.encode_bundle(time, msgs);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Enable/disable error message posting.
 * @param {any} mode
 * @returns {any}
 */
export function error(mode) {
    const ret = wasm.error(mode);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Free all synths in this group and all its sub-groups.
 * @param {any} group_ids
 * @returns {any}
 */
export function gDeepFree(group_ids) {
    const ret = wasm.gDeepFree(group_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Post a representation of this group's node subtree.
 * @param {any} tail
 * @returns {any}
 */
export function gDumpTree(tail) {
    const ret = wasm.gDumpTree(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Delete all nodes in a group.
 * @param {any} group_ids
 * @returns {any}
 */
export function gFreeAll(group_ids) {
    const ret = wasm.gFreeAll(group_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Add node to head of group.
 * @param {any} tail
 * @returns {any}
 */
export function gHead(tail) {
    const ret = wasm.gHead(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Create a new group.
 * @param {any} tail
 * @returns {any}
 */
export function gNew(tail) {
    const ret = wasm.gNew(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get a representation of this group's node subtree.
 * @param {any} tail
 * @returns {any}
 */
export function gQueryTree(tail) {
    const ret = wasm.gQueryTree(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Add node to tail of group.
 * @param {any} tail
 * @returns {any}
 */
export function gTail(tail) {
    const ret = wasm.gTail(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Lower one typed command to its raw wire view (`{ address, args }` with
 * the args in wire ORDER) via `to_osc_message()` — the console's tx log
 * rendering, definitionally in sync with the encoder.
 * @param {any} msg
 * @returns {any}
 */
export function message_to_osc(msg) {
    const ret = wasm.message_to_osc(msg);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Place a node after another.
 * @param {any} tail
 * @returns {any}
 */
export function nAfter(tail) {
    const ret = wasm.nAfter(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Place a node before another.
 * @param {any} tail
 * @returns {any}
 */
export function nBefore(tail) {
    const ret = wasm.nBefore(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Fill ranges of a node's control value(s).
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nFill(node_id, tail) {
    const ret = wasm.nFill(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Delete a node.
 * @param {any} node_ids
 * @returns {any}
 */
export function nFree(node_ids) {
    const ret = wasm.nFree(node_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Map a node's controls to read from a bus.
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nMap(node_id, tail) {
    const ret = wasm.nMap(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Map a node's controls to read from an audio bus.
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nMapa(node_id, tail) {
    const ret = wasm.nMapa(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Map a node's controls to read from audio buses.
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nMapan(node_id, tail) {
    const ret = wasm.nMapan(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Map a node's controls to read from buses.
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nMapn(node_id, tail) {
    const ret = wasm.nMapn(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Move and order a list of nodes.
 * @param {any} add_action
 * @param {any} target_id
 * @param {any} node_ids
 * @returns {any}
 */
export function nOrder(add_action, target_id, node_ids) {
    const ret = wasm.nOrder(add_action, target_id, node_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get info about a node.
 * @param {any} node_ids
 * @returns {any}
 */
export function nQuery(node_ids) {
    const ret = wasm.nQuery(node_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Turn node on or off.
 * @param {any} tail
 * @returns {any}
 */
export function nRun(tail) {
    const ret = wasm.nRun(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set a node's control value(s).
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nSet(node_id, tail) {
    const ret = wasm.nSet(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Set ranges of a node's control value(s).
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function nSetn(node_id, tail) {
    const ret = wasm.nSetn(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Trace a node.
 * @param {any} node_ids
 * @returns {any}
 */
export function nTrace(node_ids) {
    const ret = wasm.nTrace(node_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Register to receive notifications from server
 * @param {any} enable
 * @param {any} client_id
 * @returns {any}
 */
export function notify(enable, client_id) {
    const ret = wasm.notify(enable, client_id);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * End real time mode, close file. Not yet implemented. This message should be sent in a bundle in non real time mode. The bundle timestamp will establish the ending time of the file. This command will end non real time mode and close the sound file. Replies to sender with /done when complete.
 * @returns {any}
 */
export function nrtEnd() {
    const ret = wasm.nrtEnd();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Create a new parallel group.
 * @param {any} tail
 * @returns {any}
 */
export function pNew(tail) {
    const ret = wasm.pNew(tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Quit program. Exits the synthesis server.
 * @returns {any}
 */
export function quit() {
    const ret = wasm.quit();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * The escape hatch: a raw address + leniently-coerced args, outside the
 * command catalogue.
 * @param {string} address
 * @param {Array<any>} args
 * @returns {any}
 */
export function raw_message(address, args) {
    const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.raw_message(ptr0, len0, args);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Queries the amount of currently free real-time memory (in bytes).
 * @returns {any}
 */
export function rtMemoryStatus() {
    const ret = wasm.rtMemoryStatus();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get control value(s).
 * @param {any} node_id
 * @param {any} controls
 * @returns {any}
 */
export function sGet(node_id, controls) {
    const ret = wasm.sGet(node_id, controls);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get ranges of control value(s).
 * @param {any} node_id
 * @param {any} tail
 * @returns {any}
 */
export function sGetn(node_id, tail) {
    const ret = wasm.sGetn(node_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Create a new synth.
 * @param {any} def_name
 * @param {any} node_id
 * @param {any} add_action
 * @param {any} target_id
 * @param {any} tail
 * @returns {any}
 */
export function sNew(def_name, node_id, add_action, target_id, tail) {
    const ret = wasm.sNew(def_name, node_id, add_action, target_id, tail);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Auto-reassign synth's ID to a reserved value.
 * @param {any} synth_ids
 * @returns {any}
 */
export function sNoid(synth_ids) {
    const ret = wasm.sNoid(synth_ids);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * sc-app bridge extension (not in the SC command reference): register a scope-slot stream with the bridge. The bridge is the consumer, so the struct also carries from_message/decode parsers.
 * @param {any} sub_id
 * @param {any} scope
 * @param {any} channels
 * @param {any} chunk_size
 * @returns {any}
 */
export function scopeSubscribe(sub_id, scope, channels, chunk_size) {
    const ret = wasm.scopeSubscribe(sub_id, scope, channels, chunk_size);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * sc-app bridge extension (not in the SC command reference): drop a scope-slot stream.
 * @param {any} sub_id
 * @returns {any}
 */
export function scopeUnsubscribe(sub_id) {
    const ret = wasm.scopeUnsubscribe(sub_id);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Query the status. Replies to sender with the following message:
 * @returns {any}
 */
export function status() {
    const ret = wasm.status();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Notify when async commands have completed.
 * @param {any} a_unique_number
 * @returns {any}
 */
export function sync(a_unique_number) {
    const ret = wasm.sync(a_unique_number);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Send a command to a unit generator.
 * @param {any} node_id
 * @param {any} unit_generator_index
 * @param {any} cmd
 * @param {any} any_arguments
 * @returns {any}
 */
export function uCmd(node_id, unit_generator_index, cmd, any_arguments) {
    const ret = wasm.uCmd(node_id, unit_generator_index, cmd, any_arguments);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Query the SuperCollider version. Replies to sender with the following message:
 * @returns {any}
 */
export function version() {
    const ret = wasm.version();
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
        __wbg___wbindgen_bigint_get_as_i64_38130e98eecd467d: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
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
        __wbg___wbindgen_in_70a403a56e771704: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_6ffd6468a9bc44b9: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
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
        __wbg___wbindgen_jsval_eq_1068e624fa87f6ab: function(arg0, arg1) {
            const ret = arg0 === arg1;
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
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
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
        __wbg_instanceof_Map_9fc06d9a951bcee6: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Map;
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
        __wbg_new_ce1ab61c1c2b300d: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_d90091b82fdf5b91: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_from_slice_18fa1f71286d66b8: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_from_slice_956df4f769fb782c: function(arg0, arg1) {
            const ret = new Float32Array(getArrayF32FromWasm0(arg0, arg1));
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
        __wbg_push_a6822215aa43e71c: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_6e30c9374c26414c: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
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
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0) {
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
        "./scserver_commands_bg.js": import0,
    };
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
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

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
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
        module_or_path = new URL('scserver_commands_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
