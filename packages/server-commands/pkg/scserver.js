"use components";

function promiseWithResolvers() {
  if (Promise.withResolvers) {
    return Promise.withResolvers();
  } else {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
}
const symbolDispose = Symbol.dispose || Symbol.for('dispose');
const symbolAsyncIterator = Symbol.asyncIterator;
const symbolIterator = Symbol.iterator;

const _debugLog = (...args) => {
  if (!globalThis?.process?.env?.JCO_DEBUG) { return; }
  console.debug(...args);
};
const ASYNC_DETERMINISM = 'random';
const GLOBAL_COMPONENT_MEMORY_MAP = new Map();
const CURRENT_TASK_META = {};

function _getGlobalCurrentTaskMeta(componentIdx) {
  if (componentIdx === null || componentIdx === undefined) {
    throw new Error("missing/invalid component idx");
  }
  const v = CURRENT_TASK_META[componentIdx];
  if (v === undefined || v === null) {
    return undefined;
  }
  return { ...v };
}


function _setGlobalCurrentTaskMeta(args) {
  if (!args) { throw new TypeError('args missing'); }
  if (args.taskID === undefined) { throw new TypeError('missing task ID'); }
  if (args.componentIdx === undefined) { throw new TypeError('missing component idx'); }
  const { taskID, componentIdx } = args;
  return CURRENT_TASK_META[componentIdx] = { taskID, componentIdx };
}


function _withGlobalCurrentTaskMeta(args) {
  _debugLog('[_withGlobalCurrentTaskMeta()] args', args);
  if (!args) { throw new TypeError('args missing'); }
  if (args.taskID === undefined) { throw new TypeError('missing task ID'); }
  if (args.componentIdx === undefined) { throw new TypeError('missing component idx'); }
  if (!args.fn) { throw new TypeError('missing fn'); }
  const { taskID, componentIdx, fn } = args;
  
  try {
    CURRENT_TASK_META[componentIdx] = { taskID, componentIdx };
    return fn();
  } catch (err) {
    _debugLog("error while executing sync callee/callback", {
      ...args,
      err,
    });
    throw err;
  } finally {
    CURRENT_TASK_META[componentIdx] = null;
  }
}

async function _withGlobalCurrentTaskMetaAsync(args) {
  _debugLog('[_withGlobalCurrentTaskMetaAsync()] args', args);
  if (!args) { throw new TypeError('args missing'); }
  if (args.taskID === undefined) { throw new TypeError('missing task ID'); }
  if (args.componentIdx === undefined) { throw new TypeError('missing component idx'); }
  if (!args.fn) { throw new TypeError('missing fn'); }
  
  const { taskID, componentIdx, fn } = args;
  
  try {
    CURRENT_TASK_META[componentIdx] = { taskID, componentIdx };
    return await fn();
  } catch (err) {
    _debugLog("error while executing async callee/callback", {
      ...args,
      err,
    });
    throw err;
  } finally {
    CURRENT_TASK_META[componentIdx] = null;
  }
}

async function _clearCurrentTask(args) {
  _debugLog('[_clearCurrentTask()] args', args);
  if (!args) { throw new TypeError('args missing'); }
  if (args.taskID === undefined) { throw new TypeError('missing task ID'); }
  if (args.componentIdx === undefined) { throw new TypeError('missing component idx'); }
  const { taskID, componentIdx } = args;
  
  const meta = CURRENT_TASK_META[componentIdx];
  if (!meta) { throw new Error(`missing current task meta for component idx [${componentIdx}]`); }
  
  if (meta.taskID !== taskID) {
    throw new Error(`task ID [${meta.taskID}] != requested ID [${taskID}]`);
  }
  if (meta.componentIdx !== componentIdx) {
    throw new Error(`component idx [${meta.componentIdx}] != requested idx [${componentIdx}]`);
  }
  
  CURRENT_TASK_META[componentIdx] = null;
}

function lookupMemoriesForComponent(args) {
  const { componentIdx } = args ?? {};
  if (args.componentIdx === undefined) { throw new TypeError("missing component idx"); }
  
  const metas = GLOBAL_COMPONENT_MEMORY_MAP.get(componentIdx);
  if (!metas) { return []; }
  
  if (args.memoryIdx === undefined) {
    return Object.values(metas);
  }
  
  const meta = metas[args.memoryIdx];
  return meta?.memory;
}

function registerGlobalMemoryForComponent(args) {
  const { componentIdx, memory, memoryIdx } = args ?? {};
  if (componentIdx === undefined) { throw new TypeError('missing component idx'); }
  if (memory === undefined && memoryIdx === undefined) { throw new TypeError('missing both memory & memory idx'); }
  let inner = GLOBAL_COMPONENT_MEMORY_MAP.get(componentIdx);
  if (!inner) {
    inner = {};
    GLOBAL_COMPONENT_MEMORY_MAP.set(componentIdx, inner);
  }
  
  inner[memoryIdx] = { memory, memoryIdx, componentIdx };
}

class RepTable {
  #data = [0, null];
  #size = 0;
  #target;
  
  constructor(args) {
    this.target = args?.target;
  }
  
  data() { return this.#data; }
  
  insert(val) {
    _debugLog('[RepTable#insert()] args', { val, target: this.target });
    const freeIdx = this.#data[0];
    if (freeIdx === 0) {
      this.#data.push(val);
      this.#data.push(null);
      const rep = (this.#data.length >> 1) - 1;
      _debugLog('[RepTable#insert()] inserted', { val, target: this.target, rep });
      this.#size += 1;
      return rep;
    }
    this.#data[0] = this.#data[freeIdx << 1];
    const placementIdx = freeIdx << 1;
    this.#data[placementIdx] = val;
    this.#data[placementIdx + 1] = null;
    _debugLog('[RepTable#insert()] inserted', { val, target: this.target, rep: freeIdx });
    this.#size += 1;
    return freeIdx;
  }
  
  get(rep) {
    _debugLog('[RepTable#get()] args', { rep, target: this.target });
    if (rep === 0) { throw new Error('invalid resource rep during get, (cannot be 0)'); }
    
    const baseIdx = rep << 1;
    const val = this.#data[baseIdx];
    return val;
  }
  
  contains(rep) {
    _debugLog('[RepTable#contains()] args', { rep, target: this.target });
    if (rep === 0) { throw new Error('invalid resource rep during contains, (cannot be 0)'); }
    
    const baseIdx = rep << 1;
    return !!this.#data[baseIdx];
  }
  
  remove(rep) {
    _debugLog('[RepTable#remove()] args', { rep, target: this.target });
    if (rep === 0) { throw new Error('invalid resource rep during remove, (cannot be 0)'); }
    if (this.#data.length === 2) { throw new Error('invalid'); }
    
    const baseIdx = rep << 1;
    const val = this.#data[baseIdx];
    
    this.#data[baseIdx] = this.#data[0];
    this.#data[0] = rep;
    this.#size -= 1;
    
    return val;
  }
  
  size() { return this.#size; }
  
  clear() {
    _debugLog('[RepTable#clear()] args', { rep, target: this.target });
    this.#data = [0, null];
  }
}
const _coinFlip = () => { return Math.random() > 0.5; };
let SCOPE_ID = 0;
const I32_MIN = -2_147_483_648;

const I32_MAX= 2_147_483_647;


function _isValidNumericPrimitive(ty, v) {
  if (v === undefined || v === null) { return false; }
  switch (ty) {
    case 'bool':
    return v === 0 || v === 1;
    break;
    case 'u8':
    return v >= 0 && v <= 255;
    break;
    case 's8':
    return v >= -128 && v <= 127;
    break;
    case 'u16':
    return v >= 0 && v <= 65535;
    break;
    case 's16':
    return v >= -32768 && v <= 32767;
    case 'u32':
    return v >= 0 && v <= 4_294_967_295;
    case 's32':
    return v >= -2_147_483_648 && v <= 2_147_483_647;
    case 'u64':
    return typeof v === 'bigint' && v >= 0 && v <= 18_446_744_073_709_551_615n;
    case 's64':
    return typeof v === 'bigint' && v >= -9223372036854775808n && v <= 9223372036854775807n;
    break;
    case 'f32':
    case 'f64': return typeof v === 'number';
    default:
    return false;
  }
  return true;
}

function _requireValidNumericPrimitive(ty, v) {
  if (v === undefined  || v === null || !_isValidNumericPrimitive(ty, v)) {
    throw new TypeError(`invalid ${ty} value [${v}]`);
  }
  return true;
}

const _typeCheckValidI32 = (n) => typeof n === 'number' && n >= I32_MIN && n <= I32_MAX;


const _typeCheckAsyncFn= (f) => {
  return f instanceof ASYNC_FN_CTOR;
};

let RESOURCE_CALL_BORROWS = [];const ASYNC_FN_CTOR = (async () => {}).constructor;

function clearCurrentTask(componentIdx, taskID) {
  _debugLog('[clearCurrentTask()] args', { componentIdx, taskID });
  
  if (componentIdx === undefined || componentIdx === null) {
    throw new Error('missing/invalid component instance index while ending current task');
  }
  
  const tasks = ASYNC_TASKS_BY_COMPONENT_IDX.get(componentIdx);
  if (!tasks || !Array.isArray(tasks)) {
    throw new Error('missing/invalid tasks for component instance while ending task');
  }
  if (tasks.length == 0) {
    throw new Error(`no current tasks for component instance [${componentIdx}] while ending task`);
  }
  
  if (taskID !== undefined) {
    const last = tasks[tasks.length - 1];
    if (last.id !== taskID) {
      // throw new Error('current task does not match expected task ID');
      return;
    }
  }
  
  ASYNC_CURRENT_TASK_IDS.pop();
  ASYNC_CURRENT_COMPONENT_IDXS.pop();
  
  const taskMeta = tasks.pop();
  return taskMeta.task;
}

const CURRENT_TASK_MAY_BLOCK= globalThis.WebAssembly ? new globalThis.WebAssembly.Global({ value: 'i32', mutable: true }, 0) : false;

const ASYNC_CURRENT_TASK_IDS = [];
const ASYNC_CURRENT_COMPONENT_IDXS = [];

function unpackCallbackResult(result) {
  if (!(_typeCheckValidI32(result))) { throw new Error('invalid callback return value [' + result + '], not a valid i32'); }
  const eventCode = result & 0xF;
  if (eventCode < 0 || eventCode > 3) {
    throw new Error('invalid async return value [' + eventCode + '], outside callback code range');
  }
  if (result < 0 || result >= 2**32) { throw new Error('invalid callback result'); }
  // TODO: table max length check?
  const waitableSetRep = result >> 4;
  return [eventCode, waitableSetRep];
}

class AsyncSubtask {
  static _ID = 0n;
  
  static State = {
    STARTING: 0,
    STARTED: 1,
    RETURNED: 2,
    CANCELLED_BEFORE_STARTED: 3,
    CANCELLED_BEFORE_RETURNED: 4,
  };
  
  #id;
  #state = AsyncSubtask.State.STARTING;
  #componentIdx;
  
  #parentTask;
  #childTask = null;
  
  #dropped = false;
  #cancelRequested = false;
  
  #memoryIdx = null;
  #lenders = null;
  
  #waitable = null;
  
  #callbackFn = null;
  #callbackFnName = null;
  
  #postReturnFn = null;
  #onProgressFn = null;
  #pendingEventFn = null;
  
  #callMetadata = {};
  
  #resolved = false;
  
  #onResolveHandlers = [];
  #onStartHandlers = [];
  
  #result = null;
  #resultSet = false;
  
  fnName;
  target;
  isAsync;
  isManualAsync;
  
  constructor(args) {
    if (typeof args.componentIdx !== 'number') {
      throw new Error('invalid componentIdx for subtask creation');
    }
    this.#componentIdx = args.componentIdx;
    
    this.#id = ++AsyncSubtask._ID;
    this.fnName = args.fnName;
    
    if (!args.parentTask) { throw new Error('missing parent task during subtask creation'); }
    this.#parentTask = args.parentTask;
    
    if (args.childTask) { this.#childTask = args.childTask; }
    
    if (args.memoryIdx) { this.#memoryIdx = args.memoryIdx; }
    
    if (!args.waitable) { throw new Error("missing/invalid waitable"); }
    this.#waitable = args.waitable;
    
    if (args.callMetadata) { this.#callMetadata = args.callMetadata; }
    
    this.#lenders = [];
    this.target = args.target;
    this.isAsync = args.isAsync;
    this.isManualAsync = args.isManualAsync;
  }
  
  id() { return this.#id; }
  parentTaskID() { return this.#parentTask?.id(); }
  childTaskID() { return this.#childTask?.id(); }
  state() { return this.#state; }
  
  waitable() { return this.#waitable; }
  waitableRep() { return this.#waitable.idx(); }
  
  join() { return this.#waitable.join(...arguments); }
  getPendingEvent() { return this.#waitable.getPendingEvent(...arguments); }
  hasPendingEvent() { return this.#waitable.hasPendingEvent(...arguments); }
  setPendingEvent() { return this.#waitable.setPendingEvent(...arguments); }
  
  setTarget(tgt) { this.target = tgt; }
  
  getResult() {
    if (!this.#resultSet) { throw new Error("subtask result has not been set") }
    return this.#result;
  }
  setResult(v) {
    if (this.#resultSet) { throw new Error("subtask result has already been set"); }
    this.#result = v;
    this.#resultSet = true;
  }
  
  componentIdx() { return this.#componentIdx; }
  
  setChildTask(t) {
    if (!t) { throw new Error('cannot set missing/invalid child task on subtask'); }
    if (this.#childTask) { throw new Error('child task is already set on subtask'); }
    if (this.#parentTask === t) { throw new Error("parent cannot be child"); }
    this.#childTask = t;
  }
  getChildTask(t) { return this.#childTask; }
  
  getParentTask() { return this.#parentTask; }
  
  setCallbackFn(f, name) {
    if (!f) { return; }
    if (this.#callbackFn) { throw new Error('callback fn can only be set once'); }
    this.#callbackFn = f;
    this.#callbackFnName = name;
  }
  
  getCallbackFnName() {
    if (!this.#callbackFn) { return undefined; }
    return this.#callbackFn.name;
  }
  
  setPostReturnFn(f) {
    if (!f) { return; }
    if (this.#postReturnFn) { throw new Error('postReturn fn can only be set once'); }
    this.#postReturnFn = f;
  }
  
  setOnProgressFn(f) {
    if (this.#onProgressFn) { throw new Error('on progress fn can only be set once'); }
    this.#onProgressFn = f;
  }
  
  isNotStarted() {
    return this.#state == AsyncSubtask.State.STARTING;
  }
  
  registerOnStartHandler(f) {
    this.#onStartHandlers.push(f);
  }
  
  onStart(args) {
    _debugLog('[AsyncSubtask#onStart()] args', {
      componentIdx: this.#componentIdx,
      subtaskID: this.#id,
      parentTaskID: this.parentTaskID(),
      fnName: this.fnName,
      args,
    });
    
    if (this.#onProgressFn) { this.#onProgressFn(); }
    
    this.#state = AsyncSubtask.State.STARTED;
    
    let result;
    
    // If we have been provided a helper start function as a result of
    // component fusion performed by wasmtime tooling, then we can call that helper and lifts/lowers will
    // be performed for us.
    //
    // See also documentation on `HostIntrinsic::PrepareCall`
    //
    if (this.#callMetadata.startFn) {
      result = this.#callMetadata.startFn.apply(null, args?.startFnParams ?? []);
    }
    
    return result;
  }
  
  
  registerOnResolveHandler(f) {
    this.#onResolveHandlers.push(f);
  }
  
  reject(subtaskErr) {
    this.#childTask?.reject(subtaskErr);
  }
  
  onResolve(subtaskValue) {
    _debugLog('[AsyncSubtask#onResolve()] args', {
      componentIdx: this.#componentIdx,
      subtaskID: this.#id,
      isAsync: this.isAsync,
      childTaskID: this.childTaskID(),
      parentTaskID: this.parentTaskID(),
      parentTaskFnName: this.#parentTask?.entryFnName(),
      fnName: this.fnName,
    });
    
    if (this.#resolved) {
      throw new Error('subtask has already been resolved');
    }
    
    if (this.#onProgressFn) { this.#onProgressFn(); }
    
    if (subtaskValue === null && this.#cancelRequested) {
      if (this.#state === AsyncSubtask.State.STARTING) {
        this.#state = AsyncSubtask.State.CANCELLED_BEFORE_STARTED;
      } else {
        if (this.#state !== AsyncSubtask.State.STARTED) {
          throw new Error('resolved subtask must have been started before cancellation');
        }
        this.#state = AsyncSubtask.State.CANCELLED_BEFORE_RETURNED;
      }
    } else {
      if (this.#state !== AsyncSubtask.State.STARTED) {
        throw new Error('resolved subtask must have been started before completion');
      }
      this.#state = AsyncSubtask.State.RETURNED;
    }
    
    this.setResult(subtaskValue);
    
    for (const f of this.#onResolveHandlers) {
      try {
        f(subtaskValue);
      } catch (err) {
        console.error("error during subtask resolve handler", err);
        throw err;
      }
    }
    
    const callMetadata = this.getCallMetadata();
    
    // TODO(fix): we should be able to easily have the caller's meomry
    // to lower into here, but it's not present in PrepareCall
    const memory = callMetadata.memory ?? this.#parentTask?.getReturnMemory() ?? lookupMemoriesForComponent({ componentIdx: this.#parentTask?.componentIdx() })[0];
    if (callMetadata && !callMetadata.returnFn && this.isAsync && callMetadata.resultPtr && memory) {
      const { resultPtr, realloc } = callMetadata;
      const lowers = callMetadata.lowers; // may have been updated in task.return of the child
      if (lowers && lowers.length > 0) {
        lowers[0]({
          componentIdx: this.#componentIdx,
          memory,
          realloc,
          vals: [subtaskValue],
          storagePtr: resultPtr,
          stringEncoding: callMetadata.stringEncoding,
        });
      }
    }
    
    this.#resolved = true;
    this.#parentTask.removeSubtask(this);
    
    if (!this.isAsync) {
      this.deliverResolve();
      const rep = this.waitableRep();
      if (rep) {
        try {
          const removed = this.#getComponentState().handles.remove(rep);
          if (removed !== this) {
            throw new Error("unexpectedly received non-self Subtask from handle removal");
          }
          this.drop();
        } catch (err) {
          _debugLog('[AsyncSubtask#onResolve()] failed to remove subtask after sync subtask completion', err);
        }
      }
    }
  }
  
  getStateNumber() { return this.#state; }
  isReturned() { return this.#state === AsyncSubtask.State.RETURNED; }
  
  getCallMetadata() { return this.#callMetadata; }
  
  isResolved() {
    if (this.#state === AsyncSubtask.State.STARTING
    || this.#state === AsyncSubtask.State.STARTED) {
      return false;
    }
    if (this.#state === AsyncSubtask.State.RETURNED
    || this.#state === AsyncSubtask.State.CANCELLED_BEFORE_STARTED
    || this.#state === AsyncSubtask.State.CANCELLED_BEFORE_RETURNED) {
      return true;
    }
    throw new Error('unrecognized internal Subtask state [' + this.#state + ']');
  }
  
  addLender(handle) {
    _debugLog('[AsyncSubtask#addLender()] args', { handle });
    if (!Number.isNumber(handle)) { throw new Error('missing/invalid lender handle [' + handle + ']'); }
    
    if (this.#lenders.length === 0 || this.isResolved()) {
      throw new Error('subtask has no lendors or has already been resolved');
    }
    
    handle.lends++;
    this.#lenders.push(handle);
  }
  
  deliverResolve() {
    _debugLog('[AsyncSubtask#deliverResolve()] args', {
      lenders: this.#lenders,
      parentTaskID: this.parentTaskID(),
      subtaskID: this.#id,
      childTaskID: this.childTaskID(),
      resolved: this.isResolved(),
      resolveDelivered: this.resolveDelivered(),
    });
    
    const cannotDeliverResolve = this.resolveDelivered() || !this.isResolved();
    if (cannotDeliverResolve) {
      throw new Error('subtask cannot deliver resolution twice, and the subtask must be resolved');
    }
    
    for (const lender of this.#lenders) {
      lender.lends--;
    }
    
    this.#lenders = null;
  }
  
  resolveDelivered() {
    _debugLog('[AsyncSubtask#resolveDelivered()] args', { });
    if (this.#lenders === null && !this.isResolved()) {
      throw new Error('invalid subtask state, lenders missing and subtask has not been resolved');
    }
    return this.#lenders === null;
  }
  
  drop() {
    _debugLog('[AsyncSubtask#drop()] args', {
      componentIdx: this.#componentIdx,
      parentTaskID: this.#parentTask?.id(),
      parentTaskFnName: this.#parentTask?.entryFnName(),
      childTaskID: this.#childTask?.id(),
      childTaskFnName: this.#childTask?.entryFnName(),
      subtaskFnName: this.fnName,
    });
    if (!this.#waitable) { throw new Error('missing/invalid inner waitable'); }
    if (!this.resolveDelivered()) {
      throw new Error('cannot drop subtask before resolve is delivered');
    }
    if (this.#waitable) { this.#waitable.drop() }
    this.#dropped = true;
  }
  
  #getComponentState() {
    const state = getOrCreateAsyncState(this.#componentIdx);
    if (!state) {
      throw new Error('invalid/missing async state for component [' + componentIdx + ']');
    }
    return state;
  }
  
  getWaitableHandleIdx() {
    _debugLog('[AsyncSubtask#getWaitableHandleIdx()] args', { });
    if (!this.#waitable) { throw new Error('missing/invalid waitable'); }
    return this.waitableRep();
  }
}

function _prepareCall(
memoryIdx,
getMemoryFn,
startFn,
returnFn,
callerComponentIdx,
calleeComponentIdx,
taskReturnTypeIdx,
calleeIsAsyncInt,
stringEncoding,
resultCountOrAsync,
) {
  _debugLog('[_prepareCall()]', {
    memoryIdx,
    callerComponentIdx,
    calleeComponentIdx,
    taskReturnTypeIdx,
    calleeIsAsyncInt,
    stringEncoding,
    resultCountOrAsync,
  });
  const argArray = [...arguments];
  
  // value passed in *may* be as large as u32::MAX which may be mangled into -2
  resultCountOrAsync >>>= 0;
  
  let isAsync = false;
  let hasResultPointer = false;
  if (resultCountOrAsync === 2**32 - 1) {
    // prepare async with no result (u32::MAX)
    isAsync = true;
    hasResultPointer = false;
  } else if (resultCountOrAsync === 2**32 - 2) {
    // prepare async with result (u32::MAX - 1)
    isAsync = true;
    hasResultPointer = true;
  }
  
  const currentCallerTaskMeta = getCurrentTask(callerComponentIdx);
  if (!currentCallerTaskMeta) {
    throw new Error('invalid/missing current task for caller during prepare call');
  }
  
  const currentCallerTask = currentCallerTaskMeta.task;
  if (!currentCallerTask) {
    throw new Error('unexpectedly missing task in meta for caller during prepare call');
  }
  
  if (currentCallerTask.componentIdx() !== callerComponentIdx) {
    throw new Error(`task component idx [${ currentCallerTask.componentIdx() }] !== [${ callerComponentIdx }] (callee ${ calleeComponentIdx })`);
  }
  
  let getCalleeParamsFn;
  let resultPtr = null;
  let directParamsArr;
  if (hasResultPointer) {
    directParamsArr = argArray.slice(10, argArray.length - 1);
    getCalleeParamsFn = () => directParamsArr;
    resultPtr = argArray[argArray.length - 1];
  } else {
    directParamsArr = argArray.slice(10);
    getCalleeParamsFn = () => directParamsArr;
  }
  
  let encoding;
  switch (stringEncoding) {
    case 0:
    encoding = 'utf8';
    break;
    case 1:
    encoding = 'utf16';
    break;
    case 2:
    encoding = 'compact-utf16';
    break;
    default:
    throw new Error(`unrecognized string encoding enum [${stringEncoding}]`);
  }
  
  const subtask = currentCallerTask.createSubtask({
    componentIdx: callerComponentIdx,
    parentTask: currentCallerTask,
    isAsync,
    callMetadata: {
      getMemoryFn,
      memoryIdx,
      resultPtr,
      returnFn,
      startFn,
      stringEncoding,
    }
  });
  
  const [newTask, newTaskID] = createNewCurrentTask({
    componentIdx: calleeComponentIdx,
    isAsync,
    getCalleeParamsFn,
    entryFnName: [
    'task',
    subtask.getParentTask().id(),
    'subtask',
    subtask.id(),
    'new-prepared-async-task'
    ].join('/'),
    stringEncoding,
  });
  newTask.setParentSubtask(subtask);
  newTask.setReturnMemoryIdx(memoryIdx);
  newTask.setReturnMemory(getMemoryFn);
  subtask.setChildTask(newTask);
  
  newTask.subtaskMeta = {
    subtask,
    calleeComponentIdx,
    callerComponentIdx,
    getCalleeParamsFn,
    stringEncoding,
    isAsync,
  };
  
  _setGlobalCurrentTaskMeta({
    taskID: newTask.id(),
    componentIdx: newTask.componentIdx(),
  });
}

function _asyncStartCall(args, callee, paramCount, resultCount, flags) {
  const componentIdx = ASYNC_CURRENT_COMPONENT_IDXS.at(-1);
  
  const globalTaskMeta = _getGlobalCurrentTaskMeta(componentIdx);
  if (!globalTaskMeta) { throw new Error('missing global current task globalTaskMeta'); }
  const taskID = globalTaskMeta.taskID;
  
  _debugLog('[_asyncStartCall()] args', { args, componentIdx });
  const { getCallbackFn, callbackIdx, getPostReturnFn, postReturnIdx } = args;
  
  const preparedTaskMeta = getCurrentTask(componentIdx, taskID);
  if (!preparedTaskMeta) { throw new Error('unexpectedly missing current task'); }
  
  const preparedTask = preparedTaskMeta.task;
  if (!preparedTask) { throw new Error('unexpectedly missing current task'); }
  if (!preparedTask.subtaskMeta) { throw new Error('missing subtask meta from prepare'); }
  
  const {
    subtask,
    returnMemoryIdx,
    getReturnMemoryFn,
    callerComponentIdx,
    calleeComponentIdx,
    getCalleeParamsFn,
    isAsync,
    stringEncoding,
  } = preparedTask.subtaskMeta;
  if (!subtask) { throw new Error("missing subtask from cstate during async start call"); }
  if (calleeComponentIdx !== preparedTask.componentIdx()) {
    throw new Error(`meta callee idx [${calleeComponentIdx}] != current task idx [${preparedTask.componentIdx()}] during async start call`);
  }
  if (calleeComponentIdx !== componentIdx) {
    throw new Error("mismatched componentIdx for async start call (does not match prepare)");
  }
  
  const argArray = [...arguments];
  
  if (resultCount < 0 || resultCount > 1) { throw new Error('invalid/unsupported result count'); }
  
  const callbackFnName = 'callback_' + callbackIdx;
  const callbackFn = getCallbackFn();
  preparedTask.setCallbackFn(callbackFn, callbackFnName);
  preparedTask.setPostReturnFn(getPostReturnFn());
  
  if (resultCount < 0 || resultCount > 1) {
    throw new Error(`unsupported result count [${ resultCount }]`);
  }
  
  const params = preparedTask.getCalleeParams();
  if (paramCount !== params.length) {
    throw new Error(`unexpected callee param count [${ params.length }], _asyncStartCall invocation expected [${ paramCount }]`);
  }
  
  const callerComponentState = getOrCreateAsyncState(subtask.componentIdx());
  
  const calleeComponentState = getOrCreateAsyncState(preparedTask.componentIdx());
  const calleeBackpressure = calleeComponentState.hasBackpressure();
  
  // Set up a handler on subtask completion to lower results from the call into the caller's memory region.
  //
  // NOTE: during fused guest->guest calls this handler is triggered, but does not actually perform
  // lowering manually, as fused modules provider helper functions that can
  subtask.registerOnResolveHandler((res) => {
    _debugLog('[_asyncStartCall()] handling subtask result', { res, subtaskID: subtask.id() });
    
    let subtaskCallMeta = subtask.getCallMetadata();
    
    // NOTE: in the case of guest -> guest async calls, there may be no memory/realloc present,
    // as the host will intermediate the value storage/movement between calls.
    //
    // We can simply take the value and lower it as a parameter
    if (subtaskCallMeta.memory || subtaskCallMeta.realloc) {
      throw new Error("call metadata unexpectedly contains memory/realloc for guest->guest call");
    }
    
    const callerTask = subtask.getParentTask();
    const calleeTask = preparedTask;
    const callerMemoryIdx = callerTask.getReturnMemoryIdx();
    const callerComponentIdx = callerTask.componentIdx();
    
    // If a helper function was provided we are likely in a fused guest->guest call,
    // and the result will be delivered (lift/lowered) via helper function
    if (subtaskCallMeta && subtaskCallMeta.returnFn) {
      _debugLog('[_asyncStartCall()] return function present while handling subtask result, returning early (skipping lower)', {
        calleeTaskID: calleeTask.id(),
        calleeComponentIdx,
      });
      
      // TODO: centralize calling of returnFn to *one place* (if possible)
      if (subtaskCallMeta.returnFnCalled) { return; }
      
      const res = subtaskCallMeta.returnFn.apply(null, [subtaskCallMeta.resultPtr]);
      
      _debugLog('[_asyncStartCall()] finished calling return fn', {
        calleeTaskID: calleeTask.id(),
        calleeComponentIdx,
        res,
      });
      
      return;
    }
    
    // If there is no where to lower the results, exit early
    if (!subtaskCallMeta.resultPtr) {
      _debugLog('[_asyncStartCall()] no result ptr during subtask result handling, returning early (skipping lower)');
      return;
    }
    
    let callerMemory;
    if (callerMemoryIdx !== null && callerMemoryIdx !== undefined) {
      callerMemory = lookupMemoriesForComponent({ componentIdx: callerComponentIdx, memoryIdx: callerMemoryIdx });
    } else {
      const callerMemories = lookupMemoriesForComponent({ componentIdx: callerComponentIdx });
      if (callerMemories.length !== 1) { throw new Error(`unsupported amount of caller memories`); }
      callerMemory = callerMemories[0];
    }
    
    if (!callerMemory) {
      _debugLog('[_asyncStartCall()] missing memory', { subtaskID: subtask.id(), res });
      throw new Error(`missing memory for to guest->guest call result (subtask [${subtask.id()}])`);
    }
    
    const lowerFns = calleeTask.getReturnLowerFns();
    if (!lowerFns || lowerFns.length === 0) {
      _debugLog('[_asyncStartCall()] missing result lower metadata for guest->guest call', { subtaskID: subtask.id() });
      throw new Error(`missing result lower metadata for guest->guest call (subtask [${subtask.id()}])`);
    }
    
    if (lowerFns.length !== 1) {
      _debugLog('[_asyncStartCall()] only single result reportetd for guest->guest call', { subtaskID: subtask.id() });
      throw new Error(`only single result supported for guest->guest calls (subtask [${subtask.id()}])`);
    }
    
    _debugLog('[_asyncStartCall()] lowering results', { subtaskID: subtask.id() });
    lowerFns[0]({
      realloc: undefined,
      memory: callerMemory,
      vals: [res],
      storagePtr: subtaskCallMeta.resultPtr,
      componentIdx: callerComponentIdx,
      stringEncoding: subtaskCallMeta.stringEncoding,
    });
    
  });
  
  subtask.setOnProgressFn(() => {
    subtask.setPendingEvent(() => {
      if (subtask.isResolved()) { subtask.deliverResolve(); }
      const event = {
        code: ASYNC_EVENT_CODE.SUBTASK,
        payload0: subtask.waitableRep(),
        payload1: subtask.getStateNumber(),
      };
      return event;
    });
  });
  
  // Start the (event) driver loop that will resolve the subtask
  // in a new JS task
  setTimeout(async () => {
    _debugLog('[_asyncStartCall()] continuing started subtask (in JS task)', {
      taskID: preparedTask.id(),
      subtaskID: subtask.id(),
      callerComponentIdx,
      calleeComponentIdx,
    });
    
    let startRes = subtask.onStart({ startFnParams: params });
    startRes = Array.isArray(startRes) ? startRes : [startRes];
    
    if (calleeComponentState.isExclusivelyLocked()) {
      _debugLog('[_asyncStartCall()] during continuation callee is exclusively locked, suspending...', {
        taskID: preparedTask.id(),
        subtaskID: subtask.id(),
        callerComponentIdx,
        calleeComponentIdx,
      });
      await calleeComponentState.suspendTask({
        task: preparedTask,
        readyFn: () => !calleeComponentState.isExclusivelyLocked(),
      });
    }
    
    const started = await preparedTask.enter();
    if (!started) {
      _debugLog('[_asyncStartCall()] task failed early', {
        taskID: preparedTask.id(),
        subtaskID: subtask.id(),
      });
      throw new Error("task failed to start");
      return;
    }
    
    let callbackResult;
    try {
      let jspiCallee;
      if (callee._cachedPromising) {
        jspiCallee = callee._cachedPromising;
      } else {
        callee._cachedPromising = WebAssembly.promising(callee);
        jspiCallee = callee._cachedPromising;
      }
      
      callbackResult = await _withGlobalCurrentTaskMetaAsync({
        taskID: preparedTask.id(),
        componentIdx: preparedTask.componentIdx(),
        fn: () => {
          return jspiCallee.apply(null, startRes);
        }
      });
    } catch(err) {
      _debugLog("[_asyncStartCall()] initial subtask callee run failed", err);
      // NOTE: a good place to rejectt the parent task, if rejection API is enabled
      // subtask.reject(err);
      // subtask.getParentTask().reject(err);
      
      subtask.getParentTask().setErrored(err);
      
      return;
    }
    
    // If there was no callback function, we're dealing with a sync function
    // that was lifted as async without one, there is only the callee.
    if (!callbackFn) {
      _debugLog("[_asyncStartCall()] no callback, resolving w/ callee result", {
        taskID: preparedTask.id(),
        componentIdx: preparedTask.componentIdx(),
        preparedTask,
        stateNumber: preparedTask.taskState(),
        isResolved: preparedTask.isResolved(),
        callbackFn,
      });
      preparedTask.resolve([callbackResult]);
      return;
    }
    
    let fnName = callbackFn.fnName;
    if (!fnName) {
      fnName = [
      '<task ',
      subtask.parentTaskID(),
      '/subtask ',
      subtask.id(),
      '/task ',
      preparedTask.id(),
      '>',
      ].join("");
    }
    
    try {
      _debugLog("[_asyncStartCall()] starting driver loop", {
        fnName,
        componentIdx: preparedTask.componentIdx(),
        subtaskID: subtask.id(),
        childTaskID: subtask.childTaskID(),
        parentTaskID: subtask.parentTaskID(),
      });
      
      await _driverLoop({
        componentState: calleeComponentState,
        task: preparedTask,
        fnName,
        isAsync: true,
        callbackResult,
        resolve,
        reject
      });
    } catch (err) {
      _debugLog("[AsyncStartCall] drive loop call failure", { err });
    }
    
  }, 0);
  
  const subtaskState = subtask.getStateNumber();
  if (subtaskState < 0 || subtaskState > 2**5) {
    throw new Error('invalid subtask state, out of valid range');
  }
  
  _debugLog('[_asyncStartCall()] returning subtask rep & state', {
    subtask: {
      rep: subtask.waitableRep(),
      state: subtaskState,
    }
  });
  
  return Number(subtask.waitableRep()) << 4 | subtaskState;
}

function _syncStartCall(callbackIdx) {
  _debugLog('[_syncStartCall()] args', { callbackIdx });
  throw new Error('synchronous start call not implemented!');
}

class Waitable {
  #componentIdx;
  
  #pendingEventFn = null;
  
  #promise;
  #resolve;
  #reject;
  
  #waitableSet = null;
  
  #hasSyncWaiter = false;
  
  #idx = null; // to component-global waitables
  
  target;
  
  constructor(args) {
    const { componentIdx, target } = args;
    this.#componentIdx = componentIdx;
    this.target = args.target;
    this.#resetPromise();
  }
  
  componentIdx() { return this.#componentIdx; }
  isInSet() { return this.#waitableSet !== null; }
  
  idx() { return this.#idx; }
  setIdx(idx) {
    if (idx === 0) { throw new Error("waitable idx cannot be zero"); }
    this.#idx = idx;
  }
  
  setTarget(tgt) { this.target = tgt; }
  
  #resetPromise() {
    const { promise, resolve, reject } = promiseWithResolvers()
    this.#promise = promise;
    this.#resolve = resolve;
    this.#reject = reject;
  }
  
  resolve() { this.#resolve(); }
  reject(err) { this.#reject(err); }
  promise() { return this.#promise; }
  
  hasPendingEvent() {
    // _debugLog('[Waitable#hasPendingEvent()]', {
      //     componentIdx: this.#componentIdx,
      //     waitable: this,
      //     waitableSet: this.#waitableSet,
      //     hasPendingEvent: this.#pendingEventFn !== null,
      // });
      return this.#pendingEventFn !== null;
    }
    
    setPendingEvent(fn) {
      _debugLog('[Waitable#setPendingEvent()] args', {
        waitable: this,
        inSet: this.#waitableSet,
      });
      this.#pendingEventFn = fn;
    }
    
    getPendingEvent() {
      _debugLog('[Waitable#getPendingEvent()] args', {
        waitable: this,
        inSet: this.#waitableSet,
        hasPendingEvent: this.#pendingEventFn !== null,
      });
      if (this.#pendingEventFn === null) { return null; }
      const eventFn = this.#pendingEventFn;
      this.#pendingEventFn = null;
      const e = eventFn();
      this.#resetPromise();
      return e;
    }
    
    join(waitableSet) {
      _debugLog('[Waitable#join()] args', {
        waitable: this,
        waitableSet: waitableSet,
        isRemoval: waitableSet === null,
      });
      
      if (this.#waitableSet === undefined) {
        throw new TypeError('waitable set must be not be undefined');
      }
      
      if (this.#waitableSet) {
        this.#waitableSet.removeWaitable(this);
      }
      
      this.#waitableSet = waitableSet;
      
      if (waitableSet) {
        this.#waitableSet.addWaitable(this);
      }
    }
    
    drop() {
      _debugLog('[Waitable#drop()] args', {
        componentIdx: this.#componentIdx,
        waitable: this,
      });
      if (this.hasPendingEvent()) {
        throw new Error('waitables with pending events cannot be dropped');
      }
      this.join(null);
    }
    
    async waitForPendingEvent(args) {
      const { cstate } = args;
      if (!cstate) { throw new TypeError('missing component state'); }
      
      if (this.#waitableSet !== null || this.#hasSyncWaiter) {
        throw new Error("waitable is already in a set/has a sync waiter");
      }
      this.#hasSyncWaiter = true;
      await cstate.waitUntil({
        cancellable: false,
        readyFn: () => this.hasPendingEvent(),
      });
      this.#hasSyncWaiter = false;
    }
    
  }
  
  const ERR_CTX_TABLES = {};
  
  function contextGet(ctx) {
    const { componentIdx, slot } = ctx;
    if (componentIdx === undefined) { throw new TypeError("missing component idx"); }
    if (slot === undefined) { throw new TypeError("missing slot"); }
    
    const currentTaskMeta = _getGlobalCurrentTaskMeta(componentIdx);
    if (!currentTaskMeta) {
      throw new Error(`missing/incomplete global current task meta for component idx [${componentIdx}] during context set`);
    }
    const taskID = currentTaskMeta.taskID;
    
    const taskMeta = getCurrentTask(componentIdx, taskID);
    if (!taskMeta) { throw new Error('failed to retrieve current task'); }
    
    let task = taskMeta.task;
    if (!task) { throw new Error('invalid/missing current task in metadata while getting context'); }
    
    _debugLog('[contextGet()] args', {
      slot,
      storage: task.storage,
      taskID: task.id(),
      componentIdx: task.componentIdx(),
    });
    
    if (slot < 0 || slot >= task.storage.length) { throw new Error('invalid slot for current task'); }
    
    return task.storage[slot];
  }
  
  
  function contextSet(ctx, value) {
    const { componentIdx, slot } = ctx;
    if (componentIdx === undefined) { throw new TypeError("missing component idx"); }
    if (slot === undefined) { throw new TypeError("missing slot"); }
    if (!(_typeCheckValidI32(value))) { throw new Error('invalid value for context set (not valid i32)'); }
    
    const currentTaskMeta = _getGlobalCurrentTaskMeta(componentIdx);
    if (!currentTaskMeta) {
      throw new Error(`missing/incomplete global current task meta for component idx [${componentIdx}] during context set`);
    }
    const taskID = currentTaskMeta.taskID;
    
    const taskMeta = getCurrentTask(componentIdx, taskID);
    if (!taskMeta) { throw new Error('failed to retrieve current task'); }
    
    let task = taskMeta.task;
    if (!task) { throw new Error('invalid/missing current task in metadata while setting context'); }
    
    _debugLog('[contextSet()] args', {
      slot,
      value,
      storage: task.storage,
      taskID: task.id(),
      componentIdx: task.componentIdx(),
    });
    
    if (slot < 0 || slot >= task.storage.length) { throw new Error('invalid slot for current task'); }
    task.storage[slot] = value;
  }
  
  const ASYNC_TASKS_BY_COMPONENT_IDX = new Map();
  
  class AsyncTask {
    static _ID = 0n;
    
    static State = {
      INITIAL: 'initial',
      CANCELLED: 'cancelled',
      CANCEL_PENDING: 'cancel-pending',
      CANCEL_DELIVERED: 'cancel-delivered',
      RESOLVED: 'resolved',
    }
    
    static BlockResult = {
      CANCELLED: 'block.cancelled',
      NOT_CANCELLED: 'block.not-cancelled',
    }
    
    #id;
    #componentIdx;
    #state;
    #isAsync;
    #isManualAsync;
    #entryFnName = null;
    
    #onResolveHandlers = [];
    #completionPromise = null;
    #rejected = false;
    
    #exitPromise = null;
    #onExitHandlers = [];
    
    #memoryIdx = null;
    #memory = null;
    
    #callbackFn = null;
    #callbackFnName = null;
    
    #postReturnFn = null;
    
    #getCalleeParamsFn = null;
    
    #stringEncoding = null;
    
    #parentSubtask = null;
    
    #errHandling;
    
    #backpressurePromise;
    #backpressureWaiters = 0n;
    
    #returnLowerFns = null;
    
    #subtasks = [];
    
    #entered = false;
    #exited = false;
    #errored = null;
    
    cancelled = false;
    cancelRequested = false;
    alwaysTaskReturn = false;
    
    returnCalls =  0;
    storage = [0, 0];
    borrowedHandles = {};
    
    tmpRetI64HighBits = 0|0;
    
    constructor(opts) {
      this.#id = ++AsyncTask._ID;
      
      if (opts?.componentIdx === undefined) {
        throw new TypeError('missing component id during task creation');
      }
      this.#componentIdx = opts.componentIdx;
      
      this.#state = AsyncTask.State.INITIAL;
      this.#isAsync = opts?.isAsync ?? false;
      this.#isManualAsync = opts?.isManualAsync ?? false;
      this.#entryFnName = opts.entryFnName;
      
      const {
        promise: completionPromise,
        resolve: resolveCompletionPromise,
        reject: rejectCompletionPromise,
      } = promiseWithResolvers();
      this.#completionPromise = completionPromise;
      
      this.#onResolveHandlers.push((results) => {
        if (this.#parentSubtask !== null) { return; }
        if (!this.#isAsync) { return; }
        
        if (this.#errored !== null) {
          rejectCompletionPromise(this.#errored);
          return;
        } else if (this.#rejected) {
          rejectCompletionPromise(results);
          return;
        }
        
        resolveCompletionPromise(results);
      });
      
      const {
        promise: exitPromise,
        resolve: resolveExitPromise,
        reject: rejectExitPromise,
      } = promiseWithResolvers();
      this.#exitPromise = exitPromise;
      
      this.#onExitHandlers.push(() => {
        resolveExitPromise();
      });
      
      if (opts.callbackFn) { this.#callbackFn = opts.callbackFn; }
      if (opts.callbackFnName) { this.#callbackFnName = opts.callbackFnName; }
      
      if (opts.getCalleeParamsFn) { this.#getCalleeParamsFn = opts.getCalleeParamsFn; }
      
      if (opts.stringEncoding) { this.#stringEncoding = opts.stringEncoding; }
      
      if (opts.parentSubtask) { this.#parentSubtask = opts.parentSubtask; }
      
      
      if (opts.errHandling) { this.#errHandling = opts.errHandling; }
    }
    
    taskState() { return this.#state; }
    id() { return this.#id; }
    componentIdx() { return this.#componentIdx; }
    entryFnName() { return this.#entryFnName; }
    
    completionPromise() { return this.#completionPromise; }
    exitPromise() { return this.#exitPromise; }
    
    isAsync() { return this.#isAsync; }
    isSync() { return !this.isAsync(); }
    
    getErrHandling() { return this.#errHandling; }
    
    hasCallback() { return this.#callbackFn !== null; }
    
    getReturnMemoryIdx() { return this.#memoryIdx; }
    setReturnMemoryIdx(idx) {
      if (idx === null) { return; }
      this.#memoryIdx = idx;
    }
    
    getReturnMemory() { return this.#memory; }
    setReturnMemory(m) {
      if (m === null) { return; }
      this.#memory = m;
    }
    
    setReturnLowerFns(fns) { this.#returnLowerFns = fns; }
    getReturnLowerFns() { return this.#returnLowerFns; }
    
    setParentSubtask(subtask) {
      if (!subtask || !(subtask instanceof AsyncSubtask)) { return }
      if (this.#parentSubtask) { throw new Error('parent subtask can only be set once'); }
      this.#parentSubtask = subtask;
    }
    
    getParentSubtask() { return this.#parentSubtask; }
    
    // TODO(threads): this is very inefficient, we can pass along a root task,
    // and ideally do not need this once thread support is in place
    getRootTask() {
      let currentSubtask = this.getParentSubtask();
      let task = this;
      while (currentSubtask) {
        task = currentSubtask.getParentTask();
        currentSubtask = task.getParentSubtask();
      }
      return task;
    }
    
    setPostReturnFn(f) {
      if (!f) { return; }
      if (this.#postReturnFn) { throw new Error('postReturn fn can only be set once'); }
      this.#postReturnFn = f;
    }
    
    setCallbackFn(f, name) {
      if (!f) { return; }
      if (this.#callbackFn) { throw new Error('callback fn can only be set once'); }
      this.#callbackFn = f;
      this.#callbackFnName = name;
    }
    
    getCallbackFnName() {
      if (!this.#callbackFnName) { return undefined; }
      return this.#callbackFnName;
    }
    
    async runCallbackFn(...args) {
      if (!this.#callbackFn) { throw new Error('no callback function has been set for task'); }
      return _withGlobalCurrentTaskMetaAsync({
        taskID: this.#id,
        componentIdx: this.#componentIdx,
        fn: () => { return this.#callbackFn.apply(null, args); }
      });
    }
    
    getCalleeParams() {
      if (!this.#getCalleeParamsFn) { throw new Error('missing/invalid getCalleeParamsFn'); }
      return this.#getCalleeParamsFn();
    }
    
    mayBlock() { return this.isAsync() || this.isResolvedState() }
    
    mayEnter(task) {
      const cstate = getOrCreateAsyncState(this.#componentIdx);
      if (cstate.hasBackpressure()) {
        _debugLog('[AsyncTask#mayEnter()] disallowed due to backpressure', { taskID: this.#id });
        return false;
      }
      if (!cstate.callingSyncImport()) {
        _debugLog('[AsyncTask#mayEnter()] disallowed due to sync import call', { taskID: this.#id });
        return false;
      }
      const callingSyncExportWithSyncPending = cstate.callingSyncExport && !task.isAsync;
      if (!callingSyncExportWithSyncPending) {
        _debugLog('[AsyncTask#mayEnter()] disallowed due to sync export w/ sync pending', { taskID: this.#id });
        return false;
      }
      return true;
    }
    
    enterSync() {
      if (this.needsExclusiveLock()) {
        const cstate = getOrCreateAsyncState(this.#componentIdx);
        // TODO(???): it is *very possible* for a the line below to fail if
        // an async function is already running (and holding the exclusive lock)
        //
        // It's not really possible to fix this unless we turn every sync export into
        // an async export that will use the regular async enabled `enter()`.
        cstate.exclusiveLock();
      }
      return true;
    }
    
    async enter(opts) {
      _debugLog('[AsyncTask#enter()] args', {
        taskID: this.#id,
        componentIdx: this.#componentIdx,
        subtaskID: this.getParentSubtask()?.id(),
        args: opts,
        entryFnName: this.#entryFnName,
      });
      
      if (this.#entered) {
        throw new Error(`task with ID [${this.#id}] should not be entered twice`);
      }
      
      const cstate = getOrCreateAsyncState(this.#componentIdx);
      
      if (opts?.isHost) {
        this.#entered = true;
        return this.#entered;
      }
      
      await cstate.nextTaskExecutionSlot({ task: this });
      
      // If a task is synchronous then we can avoid component-relevant
      // tracking and immediately enter.
      if (this.isSync()) {
        this.#entered = true;
        
        // TODO(breaking): remove once manually-specifying async fns is removed
        // It is currently possible for an actually sync export to be specified
        // as async via JSPI
        if (this.#isManualAsync) {
          if (this.needsExclusiveLock()) { cstate.exclusiveLock(); }
        }
        
        return this.#entered;
      }
      
      // Perform intial backpressure check
      if (cstate.hasBackpressure() || this.needsExclusiveLock() && cstate.isExclusivelyLocked()) {
        cstate.addBackpressureWaiter();
        
        const result = await this.waitUntil({
          readyFn: () => {
            return !(cstate.hasBackpressure()
            || this.needsExclusiveLock() && cstate.isExclusivelyLocked());
          },
          cancellable: true,
        });
        
        cstate.removeBackpressureWaiter();
        
        if (result === AsyncTask.BlockResult.CANCELLED) {
          this.cancel();
          return false;
        }
      }
      
      // Lock the component state or keep trying until we can/do
      try {
        if (this.needsExclusiveLock()) { cstate.exclusiveLock(); }
      } catch {
        // Continuously attempt to lock until we can
        while (cstate.hasBackpressure() || this.needsExclusiveLock() && cstate.isExclusivelyLocked()) {
          try {
            if (this.needsExclusiveLock()) { cstate.exclusiveLock(); }
            break;
          } catch(err) {
            cstate.addBackpressureWaiter();
            const result = await this.waitUntil({
              readyFn: () => {
                return !(cstate.hasBackpressure()
                || this.needsExclusiveLock() && cstate.isExclusivelyLocked());
              },
              cancellable: true,
            });
            cstate.removeBackpressureWaiter();
            if (result === AsyncTask.BlockResult.CANCELLED) {
              this.cancel();
              return false;
            }
          }
        }
      }
      
      this.#entered = true;
      return this.#entered;
    }
    
    isRunningState() { return this.#state !== AsyncTask.State.RESOLVED; }
    isResolvedState() { return this.#state === AsyncTask.State.RESOLVED; }
    isResolved() { return this.#state === AsyncTask.State.RESOLVED; }
    
    async waitUntil(opts) {
      const { readyFn, cancellable } = opts;
      _debugLog('[AsyncTask#waitUntil()] args', { taskID: this.#id, args: { cancellable } });
      
      // TODO(fix): check for cancel
      // TODO(fix): determinism
      // TODO(threads): add this thread to waiting list
      
      const keepGoing = await this.suspendUntil({
        readyFn,
        cancellable,
      });
      
      return keepGoing;
    }
    
    async yieldUntil(opts) {
      const { readyFn, cancellable } = opts;
      _debugLog('[AsyncTask#yieldUntil()]', {
        taskID: this.#id,
        args: {
          cancellable,
        },
        componentIdx: this.#componentIdx,
      });
      
      const keepGoing = await this.suspendUntil({ readyFn, cancellable });
      if (keepGoing) {
        return {
          code: ASYNC_EVENT_CODE.NONE,
          payload0: 0,
          payload1: 0,
        };
      }
      
      return {
        code: ASYNC_EVENT_CODE.TASK_CANCELLED,
        payload0: 0,
        payload1: 0,
      };
    }
    
    async suspendUntil(opts) {
      const { cancellable, readyFn } = opts;
      _debugLog('[AsyncTask#suspendUntil()] args', {
        taskID: this.#id,
        args: {
          cancellable,
        },
        componentIdx: this.#componentIdx,
      });
      
      const pendingCancelled = this.deliverPendingCancel({ cancellable });
      if (pendingCancelled) { return false; }
      
      const completed = await this.immediateSuspendUntil({ readyFn, cancellable });
      return completed;
    }
    
    // TODO(threads): equivalent to thread.suspend_until()
    async immediateSuspendUntil(opts) {
      const { cancellable, readyFn } = opts;
      _debugLog('[AsyncTask#immediateSuspendUntil()] args', {
        args: {
          cancellable,
          readyFn,
        },
        taskID: this.#id,
        componentIdx: this.#componentIdx,
      });
      
      const ready = readyFn();
      if (ready && ASYNC_DETERMINISM === 'random') {
        const coinFlip = _coinFlip();
        if (coinFlip) { return true }
      }
      
      const keepGoing = await this.immediateSuspend({ cancellable, readyFn });
      return keepGoing;
    }
    
    async immediateSuspend(opts) { // NOTE: equivalent to thread.suspend()
    // TODO(threads): store readyFn on the thread
    const { cancellable, readyFn } = opts;
    _debugLog('[AsyncTask#immediateSuspend()] args', { cancellable, readyFn });
    
    const pendingCancelled = this.deliverPendingCancel({ cancellable });
    if (pendingCancelled) { return false; }
    
    const cstate = getOrCreateAsyncState(this.#componentIdx);
    const keepGoing = await cstate.suspendTask({ task: this, readyFn });
    return keepGoing;
  }
  
  deliverPendingCancel(opts) {
    const { cancellable } = opts;
    _debugLog('[AsyncTask#deliverPendingCancel()]', {
      args: { cancellable },
      taskID: this.#id,
      componentIdx: this.#componentIdx,
    });
    
    if (cancellable && this.#state === AsyncTask.State.PENDING_CANCEL) {
      this.#state = AsyncTask.State.CANCEL_DELIVERED;
      return true;
    }
    
    return false;
  }
  
  isCancelled() { return this.cancelled }
  
  cancel(args) {
    _debugLog('[AsyncTask#cancel()] args', { });
    if (this.taskState() !== AsyncTask.State.CANCEL_DELIVERED) {
      throw new Error(`(component [${this.#componentIdx}]) task [${this.#id}] invalid task state [${this.taskState()}] for cancellation`);
    }
    if (this.borrowedHandles.length > 0) { throw new Error('task still has borrow handles'); }
    this.cancelled = true;
    this.onResolve(args?.error ?? new Error('task cancelled'));
    this.#state = AsyncTask.State.RESOLVED;
  }
  
  onResolve(taskValue) {
    const handlers = this.#onResolveHandlers;
    this.#onResolveHandlers = [];
    for (const f of handlers) {
      try {
        f(taskValue);
      } catch (err) {
        _debugLog("[AsyncTask#onResolve] error during task resolve handler", err);
        throw err;
      }
    }
    
    if (this.#parentSubtask) {
      const meta = this.#parentSubtask.getCallMetadata();
      // Run the rturn fn if it has not already been called -- this *should* have happened in
      // `task.return`, but some paths do not go through task.return (e.g. async lower of sync fn
      // which goes through prepare + async-start-call)
      if (meta.returnFn && !meta.returnFnCalled) {
        _debugLog('[AsyncTask#onResolve()] running returnFn', {
          componentIdx: this.#componentIdx,
          taskID: this.#id,
          subtaskID: this.#parentSubtask.id(),
        });
        const memory = meta.getMemoryFn();
        meta.returnFn.apply(null, [taskValue, meta.resultPtr]);
        meta.returnFnCalled = true;
      }
    }
    
    if (this.#postReturnFn) {
      _debugLog('[AsyncTask#onResolve()] running post return ', {
        componentIdx: this.#componentIdx,
        taskID: this.#id,
      });
      try {
        this.#postReturnFn(taskValue);
      } catch (err) {
        _debugLog("[AsyncTask#onResolve] error during task resolve handler", err);
        throw err;
      }
    }
    
    if (this.#parentSubtask) {
      this.#parentSubtask.onResolve(taskValue);
    }
  }
  
  registerOnResolveHandler(f) {
    this.#onResolveHandlers.push(f);
  }
  
  isRejected() { return this.#rejected; }
  
  isErrored() { return this.#errored; }
  setErrored(err) { this.#errored = err; }
  
  reject(taskErr) {
    _debugLog('[AsyncTask#reject()] args', {
      componentIdx: this.#componentIdx,
      taskID: this.#id,
      parentSubtask: this.#parentSubtask,
      parentSubtaskID: this.#parentSubtask?.id(),
      entryFnName: this.entryFnName(),
      callbackFnName: this.#callbackFnName,
      errMsg: taskErr.message,
    });
    
    if (this.isResolvedState() || this.#rejected) { return; }
    
    this.#rejected = true;
    this.cancelRequested = true;
    this.#state = AsyncTask.State.PENDING_CANCEL;
    const cancelled = this.deliverPendingCancel({ cancellable: true });
    
    // TODO: do cleanup here to reset the machinery so we can run again?
    
    this.cancel({ error: taskErr });
  }
  
  resolve(results) {
    _debugLog('[AsyncTask#resolve()] args', {
      componentIdx: this.#componentIdx,
      taskID: this.#id,
      entryFnName: this.entryFnName(),
      callbackFnName: this.#callbackFnName,
    });
    
    if (this.#state === AsyncTask.State.RESOLVED) {
      throw new Error(`(component [${this.#componentIdx}]) task [${this.#id}]  is already resolved (did you forget to wait for an import?)`);
    }
    
    if (this.borrowedHandles.length > 0) {
      throw new Error('task still has borrow handles');
    }
    
    this.#state = AsyncTask.State.RESOLVED;
    
    switch (results.length) {
      case 0:
      this.onResolve(undefined);
      break;
      case 1:
      this.onResolve(results[0]);
      break;
      default:
      _debugLog('[AsyncTask#resolve()] unexpected number of results', {
        componentIdx: this.#componentIdx,
        results,
        taskID: this.#id,
        subtaskID: this.#parentSubtask?.id(),
        entryFnName: this.#entryFnName,
        callbackFnName: this.#callbackFnName,
      });
      throw new Error('unexpected number of results');
    }
  }
  
  exit(args) {
    _debugLog('[AsyncTask#exit()]', {
      componentIdx: this.#componentIdx,
      taskID: this.#id,
    });
    
    if (this.#exited)  { throw new Error("task has already exited"); }
    
    if (this.#state !== AsyncTask.State.RESOLVED) {
      throw new Error(`(component [${this.#componentIdx}]) task [${this.#id}] exited without resolution`);
    }
    
    if (this.borrowedHandles > 0) {
      throw new Error('task [${this.#id}] exited without clearing borrowed handles');
    }
    
    const state = getOrCreateAsyncState(this.#componentIdx);
    if (!state) { throw new Error('missing async state for component [' + this.#componentIdx + ']'); }
    
    // Exempt the host from exclusive lock check
    if (this.#componentIdx !== -1 && !args?.skipExclusiveLockCheck) {
      if (this.needsExclusiveLock() && !state.isExclusivelyLocked()) {
        throw new Error(`task [${this.#id}] exit: component [${this.#componentIdx}] should have been exclusively locked`);
      }
    }
    
    state.exclusiveRelease();
    
    for (const f of this.#onExitHandlers) {
      try {
        f();
      } catch (err) {
        console.error("error during task exit handler", err);
        throw err;
      }
    }
    
    this.#exited = true;
    clearCurrentTask(this.#componentIdx, this.id());
  }
  
  needsExclusiveLock() {
    return !this.#isAsync || this.hasCallback();
  }
  
  createSubtask(args) {
    _debugLog('[AsyncTask#createSubtask()] args', args);
    const { componentIdx, childTask, callMetadata, fnName, isAsync, isManualAsync } = args;
    
    const cstate = getOrCreateAsyncState(this.#componentIdx);
    if (!cstate) {
      throw new Error(`invalid/missing async state for component idx [${componentIdx}]`);
    }
    
    const waitable = new Waitable({
      componentIdx: this.#componentIdx,
      target: `subtask (internal ID [${this.#id}])`,
    });
    
    const newSubtask = new AsyncSubtask({
      componentIdx,
      childTask,
      parentTask: this,
      callMetadata,
      isAsync,
      isManualAsync,
      fnName,
      waitable,
    });
    this.#subtasks.push(newSubtask);
    newSubtask.setTarget(`subtask (internal ID [${newSubtask.id()}], waitable [${waitable.idx()}], component [${componentIdx}])`);
    waitable.setIdx(cstate.handles.insert(newSubtask));
    waitable.setTarget(`waitable for subtask (waitable id [${waitable.idx()}], subtask internal ID [${newSubtask.id()}])`);
    return newSubtask;
  }
  
  getLatestSubtask() {
    return this.#subtasks.at(-1);
  }
  
  getSubtaskByWaitableRep(rep) {
    if (rep === undefined) { throw new TypeError('missing rep'); }
    return this.#subtasks.find(s => s.waitableRep() === rep);
  }
  
  currentSubtask() {
    _debugLog('[AsyncTask#currentSubtask()]');
    if (this.#subtasks.length === 0) { return undefined; }
    return this.#subtasks.at(-1);
  }
  
  removeSubtask(subtask) {
    if (this.#subtasks.length === 0) {
      throw new Error('cannot end current subtask: no current subtask');
    }
    this.#subtasks = this.#subtasks.filter(t => t !== subtask);
    return subtask;
  }
}

const ASYNC_EVENT_CODE = {
  NONE: 0,
  SUBTASK: 1,
  STREAM_READ: 2,
  STREAM_WRITE: 3,
  FUTURE_READ: 4,
  FUTURE_WRITE: 5,
  TASK_CANCELLED: 6,
};

function getCurrentTask(componentIdx, taskID) {
  let usedGlobal = false;
  if (componentIdx === undefined || componentIdx === null) {
    throw new Error('missing component idx'); // TODO(fix)
    // componentIdx = ASYNC_CURRENT_COMPONENT_IDXS.at(-1);
    // usedGlobal = true;
  }
  
  const taskMetas = ASYNC_TASKS_BY_COMPONENT_IDX.get(componentIdx);
  if (taskMetas === undefined || taskMetas.length === 0) { return undefined; }
  
  if (taskID) {
    return taskMetas.find(meta => meta.task.id() === taskID);
  }
  
  const taskMeta = taskMetas[taskMetas.length - 1];
  if (!taskMeta || !taskMeta.task) { return undefined; }
  
  return taskMeta;
}

const emptyFunc = () => {};

let dv = new DataView(new ArrayBuffer());
const dataView = mem => dv.buffer === mem.buffer ? dv : dv = new DataView(mem.buffer);

function toInt32(val) {
  
  return val >> 0;
}


function toUint32(val) {
  
  return val >>> 0;
}

const TEXT_DECODER_UTF8 = new TextDecoder();
const TEXT_ENCODER_UTF8 = new TextEncoder();

function _utf8AllocateAndEncode(s, realloc, memory) {
  if (typeof s !== 'string') {
    throw new TypeError('expected a string, received [' + typeof s + ']');
  }
  if (s.length === 0) { return { ptr: 1, len: 0 }; }
  let buf = TEXT_ENCODER_UTF8.encode(s);
  let ptr = realloc(0, 0, 1, buf.length);
  new Uint8Array(memory.buffer).set(buf, ptr);
  const res = { ptr, len: buf.length, codepoints: [...s].length };
  return res;
}


const T_FLAG = 1 << 30;

function rscTableCreateOwn(table, rep) {
  const free = table[0] & ~T_FLAG;
  table._createdReps.add(rep);
  if (free === 0) {
    table.push(0);
    table.push(rep | T_FLAG);
    return (table.length >> 1) - 1;
  }
  table[0] = table[free << 1];
  table[free << 1] = 0;
  table[(free << 1) + 1] = rep | T_FLAG;
  return free;
}

function rscTableRemove(table, handle) {
  const scope = table[handle << 1];
  const val = table[(handle << 1) + 1];
  const own = (val & T_FLAG) !== 0;
  const rep = val & ~T_FLAG;
  if (val === 0 || (scope & T_FLAG) !== 0) {
    throw new TypeError("Invalid handle");
  }
  table[handle << 1] = table[0] | T_FLAG;
  table[0] = handle | T_FLAG;
  return { rep, scope, own };
}

function createNewCurrentTask(args) {
  _debugLog('[createNewCurrentTask()] args', args);
  const {
    componentIdx,
    isAsync,
    isManualAsync,
    entryFnName,
    parentSubtaskID,
    callbackFnName,
    getCallbackFn,
    getParamsFn,
    stringEncoding,
    errHandling,
    getCalleeParamsFn,
    resultPtr,
    callingWasmExport,
  } = args;
  if (componentIdx === undefined || componentIdx === null) {
    throw new Error('missing/invalid component instance index while starting task');
  }
  let taskMetas = ASYNC_TASKS_BY_COMPONENT_IDX.get(componentIdx);
  const callbackFn = getCallbackFn ? getCallbackFn() : null;
  
  const newTask = new AsyncTask({
    componentIdx,
    isAsync,
    isManualAsync,
    entryFnName,
    callbackFn,
    callbackFnName,
    stringEncoding,
    getCalleeParamsFn,
    resultPtr,
    errHandling,
  });
  
  const newTaskID = newTask.id();
  const newTaskMeta = { id: newTaskID, componentIdx, task: newTask };
  
  // NOTE: do not track host tasks
  ASYNC_CURRENT_TASK_IDS.push(newTaskID);
  ASYNC_CURRENT_COMPONENT_IDXS.push(componentIdx);
  
  if (!taskMetas) {
    taskMetas = [newTaskMeta];
    ASYNC_TASKS_BY_COMPONENT_IDX.set(componentIdx, [newTaskMeta]);
  } else {
    taskMetas.push(newTaskMeta);
  }
  
  return [newTask, newTaskID];
}

const STREAMS = new RepTable({ target: 'global stream map' });
const ASYNC_STATE = new Map();

function getOrCreateAsyncState(componentIdx, init) {
  if (!ASYNC_STATE.has(componentIdx)) {
    const newState = new ComponentAsyncState({ componentIdx });
    ASYNC_STATE.set(componentIdx, newState);
  }
  return ASYNC_STATE.get(componentIdx);
}

class ComponentAsyncState {
  static EVENT_HANDLER_EVENTS = [ 'backpressure-change' ];
  
  #componentIdx;
  #callingAsyncImport = false;
  #syncImportWait = promiseWithResolvers();
  #locked = false;
  #parkedTasks = new Map();
  #suspendedTasksByTaskID = new Map();
  #suspendedTaskIDs = [];
  #errored = null;
  
  #backpressure = 0;
  #backpressureWaiters = 0n;
  
  #handlerMap = new Map();
  #nextHandlerID = 0n;
  
  #tickLoop = null;
  #tickLoopInterval = null;
  
  #onExclusiveReleaseHandlers = [];
  
  mayLeave = true;
  
  handles;
  subtasks;
  
  constructor(args) {
    this.#componentIdx = args.componentIdx;
    this.handles = new RepTable({ target: `component [${this.#componentIdx}] handles (waitable objects)` });
    this.subtasks = new RepTable({ target: `component [${this.#componentIdx}] subtasks` });
  };
  
  componentIdx() { return this.#componentIdx; }
  
  errored() { return this.#errored !== null; }
  setErrored(err) {
    _debugLog('[ComponentAsyncState#setErrored()] component errored', { err, componentIdx: this.#componentIdx });
    if (this.#errored) { return; }
    if (!err) {
      err = new Error('error elswehere (see other component instance error)')
      err.componentIdx = this.#componentIdx;
    }
    this.#errored = err;
  }
  
  callingSyncImport(val) {
    if (val === undefined) { return this.#callingAsyncImport; }
    if (typeof val !== 'boolean') { throw new TypeError('invalid setting for async import'); }
    const prev = this.#callingAsyncImport;
    this.#callingAsyncImport = val;
    if (prev === true && this.#callingAsyncImport === false) {
      this.#notifySyncImportEnd();
    }
  }
  
  #notifySyncImportEnd() {
    const existing = this.#syncImportWait;
    this.#syncImportWait = promiseWithResolvers();
    existing.resolve();
  }
  
  async waitForSyncImportCallEnd() {
    await this.#syncImportWait.promise;
  }
  
  setBackpressure(v) {
    this.#backpressure = v;
    return this.#backpressure
  }
  getBackpressure() { return this.#backpressure; }
  
  incrementBackpressure() {
    const current = this.#backpressure;
    if (current < 0 || current > 2**16) {
      throw new Error(`invalid current backpressure value [${current}]`);
    }
    const newValue = this.getBackpressure() + 1;
    if (newValue >= 2**16) {
      throw new Error(`invalid new backpressure value [${newValue}], overflow`);
    }
    return this.setBackpressure(newValue);
  }
  
  decrementBackpressure() {
    const current = this.#backpressure;
    if (current < 0 || current > 2**16) {
      throw new Error(`invalid current backpressure value [${current}]`);
    }
    const newValue = Math.max(0, current - 1);
    if (newValue < 0) {
      throw new Error(`invalid new backpressure value [${newValue}], underflow`);
    }
    return this.setBackpressure(newValue);
  }
  hasBackpressure() { return this.#backpressure > 0; }
  
  waitForBackpressure() {
    let backpressureCleared = false;
    const cstate = this;
    cstate.addBackpressureWaiter();
    const handlerID = this.registerHandler({
      event: 'backpressure-change',
      fn: (bp) => {
        if (bp === 0) {
          cstate.removeHandler(handlerID);
          backpressureCleared = true;
        }
      }
    });
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (backpressureCleared) { return; }
        clearInterval(interval);
        cstate.removeBackpressureWaiter();
        resolve(null);
      }, 0);
    });
  }
  
  registerHandler(args) {
    const { event, fn } = args;
    if (!event) { throw new Error("missing handler event"); }
    if (!fn) { throw new Error("missing handler fn"); }
    
    if (!ComponentAsyncState.EVENT_HANDLER_EVENTS.includes(event)) {
      throw new Error(`unrecognized event handler [${event}]`);
    }
    
    const handlerID = this.#nextHandlerID++;
    let handlers = this.#handlerMap.get(event);
    if (!handlers) {
      handlers = [];
      this.#handlerMap.set(event, handlers)
    }
    
    handlers.push({ id: handlerID, fn, event });
    return handlerID;
  }
  
  removeHandler(args) {
    const { event, handlerID } = args;
    const registeredHandlers = this.#handlerMap.get(event);
    if (!registeredHandlers) { return; }
    const found = registeredHandlers.find(h => h.id === handlerID);
    if (!found) { return; }
    this.#handlerMap.set(event, this.#handlerMap.get(event).filter(h => h.id !== handlerID));
  }
  
  getBackpressureWaiters() { return this.#backpressureWaiters; }
  addBackpressureWaiter() { this.#backpressureWaiters++; }
  removeBackpressureWaiter() {
    this.#backpressureWaiters--;
    if (this.#backpressureWaiters < 0) {
      throw new Error("unexepctedly negative number of backpressure waiters");
    }
  }
  
  isExclusivelyLocked() { return this.#locked === true; }
  setLocked(locked) {
    this.#locked = locked;
  }
  
  exclusiveLock() {
    _debugLog('[ComponentAsyncState#exclusiveLock()]', {
      locked: this.#locked,
      componentIdx: this.#componentIdx,
    });
    this.setLocked(true);
  }
  
  exclusiveRelease() {
    _debugLog('[ComponentAsyncState#exclusiveRelease()] args', {
      locked: this.#locked,
      componentIdx: this.#componentIdx,
    });
    this.setLocked(false);
    
    this.#onExclusiveReleaseHandlers = this.#onExclusiveReleaseHandlers.filter(v => !!v);
    for (const [idx, f] of this.#onExclusiveReleaseHandlers.entries()) {
      try {
        this.#onExclusiveReleaseHandlers[idx] = null;
        f();
      } catch (err) {
        _debugLog("error while executing handler for next exclusive release", err);
        throw err;
      }
    }
  }
  
  onNextExclusiveRelease(fn) {
    _debugLog('[ComponentAsyncState#()onNextExclusiveRelease] registering');
    this.#onExclusiveReleaseHandlers.push(fn);
  }
  
  // nextTaskPromise & nextTaskQueue are used to await current task completion and queues
  // any tasks attempting to enter() and complete.
  //
  // see: nextTaskExecutionSlot()
  //
  // TODO(threads): this should be unnecessary once threads are properly implemented,
  // as the task.enter() logic should suffice (it should be guaranteed that we cannot re-enter
  // unless the task in question is the current task in the thread execution, and only one can
  // run at a time)
  #nextTaskPromise = Promise.resolve(true);
  #nextTaskQueue = [];
  
  async nextTaskExecutionSlot(args) {
    const { task } = args;
    
    const placeholder = {
      completed: false,
      task,
      promise: task.exitPromise().then(() => {
        placeholder.completed = true;
      }),
    };
    this.#nextTaskQueue.push(placeholder);
    
    let next;
    while (true) {
      await this.#nextTaskPromise;
      
      next = this.#nextTaskQueue.find(placeholder => !placeholder.completed);
      
      // This task is next in the queue, we can continue
      if (next === undefined || next === placeholder) {
        this.#nextTaskPromise = next.promise;
        if (this.#nextTaskQueue.length > 1000) {
          this.#nextTaskQueue = this.#nextTaskQueue.filter(p => !p.completed);
          if (this.#nextTaskQueue.length > 1000) {
            _debugLog('[ComponentAsyncState#()nextTaskExecutionSlot] next task queue length > 1000 even after cleanup, tasks may be leaking');
          }
        }
        break;
      }
      
      // If we get here, this task was *not* next in the queue, continue waiting
      // (at this point the task that *is* next will likely have already set itself
      // as this.#nextTaskPromise)
    }
  }
  
  #getSuspendedTaskMeta(taskID) {
    return this.#suspendedTasksByTaskID.get(taskID);
  }
  
  #removeSuspendedTaskMeta(taskID) {
    _debugLog('[ComponentAsyncState#removeSuspendedTaskMeta()] removing suspended task', {
      taskID,
      componentIdx: this.#componentIdx,
    });
    const idx = this.#suspendedTaskIDs.findIndex(t => t === taskID);
    const meta = this.#suspendedTasksByTaskID.get(taskID);
    this.#suspendedTaskIDs[idx] = null;
    this.#suspendedTasksByTaskID.delete(taskID);
    return meta;
  }
  
  #addSuspendedTaskMeta(meta) {
    if (!meta) { throw new Error('missing task meta'); }
    const taskID = meta.taskID;
    this.#suspendedTasksByTaskID.set(taskID, meta);
    this.#suspendedTaskIDs.push(taskID);
    if (this.#suspendedTasksByTaskID.size < this.#suspendedTaskIDs.length - 10) {
      this.#suspendedTaskIDs = this.#suspendedTaskIDs.filter(t => t !== null);
    }
  }
  
  // TODO(threads): readyFn is normally on the thread
  suspendTask(args) {
    const { task, readyFn } = args;
    const taskID = task.id();
    const componentIdx = task.componentIdx();
    _debugLog('[ComponentAsyncState#suspendTask()]', {
      taskID,
      componentIdx: this.#componentIdx,
      taskEntryFnName: task.entryFnName(),
      subtask: task.getParentSubtask(),
    });
    
    if (componentIdx !== this.#componentIdx) {
      throw new Error('assert: task component idx should match async state');
    }
    
    if (this.#getSuspendedTaskMeta(taskID)) {
      throw new Error(`task [${taskID}] already suspended`);
    }
    
    const { promise, resolve, reject } = promiseWithResolvers();
    this.#addSuspendedTaskMeta({
      task,
      taskID,
      readyFn,
      resume: () => {
        _debugLog('[ComponentAsyncState] resuming suspended task', {
          taskID,
          componentIdx: this.#componentIdx,
        });
        // TODO(threads): it's thread cancellation we should be checking for below, not task
        resolve(!task.isCancelled());
      },
    });
    
    this.runTickLoop();
    
    return promise;
  }
  
  resumeTaskByID(taskID) {
    const meta = this.#removeSuspendedTaskMeta(taskID);
    if (!meta) { return; }
    if (meta.taskID !== taskID) { throw new Error('task ID does not match'); }
    meta.resume();
  }
  
  async runTickLoop() {
    if (this.#tickLoop !== null) { return; }
    this.#tickLoop = 1;
    setTimeout(async () => {
      let done = this.tick();
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        done = this.tick();
      }
      this.#tickLoop = null;
    }, 10);
  }
  
  tick() {
    // _debugLog('[ComponentAsyncState#tick()]', { suspendedTaskIDs: this.#suspendedTaskIDs });
    
    const resumableTasks = this.#suspendedTaskIDs.filter(t => t !== null);
    for (const taskID of resumableTasks) {
      const meta = this.#suspendedTasksByTaskID.get(taskID);
      if (!meta || !meta.readyFn) {
        throw new Error(`missing/invalid task despite ID [${taskID}] being present`);
      }
      
      // If the task failed via any means, allow the task to resume because
      // it's been cancelled -- the callback should immediately exit as well
      if (meta.task.isRejected()) {
        _debugLog('[ComponentAsyncState#tick()] detected task rejection, leaving early', { meta });
        this.resumeTaskByID(taskID);
        return;
      }
      
      const isReady = meta.readyFn();
      if (!isReady) { continue; }
      
      _debugLog('[ComponentAsyncState#tick()] resuming task via tick', {
        taskID,
        componentIdx: this.#componentIdx,
      });
      this.resumeTaskByID(taskID);
    }
    
    return this.#suspendedTaskIDs.filter(t => t !== null).length === 0;
  }
  
  addStreamEndToTable(args) {
    _debugLog('[ComponentAsyncState#addStreamEnd()] args', args);
    const { tableIdx, streamEnd } = args;
    if (typeof streamEnd === 'number') { throw new Error("INSERTING BAD STREAMEND"); }
    
    let { table, componentIdx } = STREAM_TABLES[tableIdx];
    if (componentIdx === undefined || !table) {
      throw new Error(`invalid global stream table state for table [${tableIdx}]`);
    }
    
    const handle = table.insert(streamEnd);
    streamEnd.setHandle(handle);
    streamEnd.setStreamTableIdx(tableIdx);
    
    const cstate = getOrCreateAsyncState(componentIdx);
    const waitableIdx = cstate.handles.insert(streamEnd);
    streamEnd.setWaitableIdx(waitableIdx);
    
    _debugLog('[ComponentAsyncState#addStreamEnd()] added stream end', {
      tableIdx,
      table,
      handle,
      streamEnd,
      destComponentIdx: componentIdx,
    });
    
    return { handle, waitableIdx };
  }
  
  createWaitable(args) {
    return new Waitable({ target: args?.target, });
  }
  
  createReadableStreamEnd(args) {
    _debugLog('[ComponentAsyncState#createStreamEnd()] args', args);
    const { tableIdx, elemMeta, hostInjectFn } = args;
    
    const { table: localStreamTable, componentIdx } = STREAM_TABLES[tableIdx];
    if (!localStreamTable) {
      throw new Error(`missing global stream table lookup for table [${tableIdx}] while creating stream`);
    }
    if (componentIdx !== this.#componentIdx) {
      throw new Error('component idx mismatch while creating stream');
    }
    
    const waitable = this.createWaitable();
    const streamEnd = new StreamReadableEnd({
      tableIdx,
      elemMeta,
      hostInjectFn,
      pendingBufferMeta: {},
      target: `stream read end (lowered, @init)`,
      waitable,
    });
    
    streamEnd.setWaitableIdx(this.handles.insert(streamEnd));
    streamEnd.setHandle(localStreamTable.insert(streamEnd));
    if (streamEnd.streamTableIdx() !== tableIdx) {
      throw new Error("unexpectedly mismatched stream table");
    }
    const streamEndWaitableIdx = streamEnd.waitableIdx();
    const streamEndHandle = streamEnd.handle();
    waitable.setTarget(`waitable for stream read end (lowered, waitable [${streamEndWaitableIdx}])`);
    streamEnd.setTarget(`stream read end (lowered, waitable [${streamEndWaitableIdx}])`);
    
    return {
      waitableIdx: streamEndWaitableIdx,
      handle: streamEndHandle,
      streamEnd,
    };
  }
  
  createStream(args) {
    _debugLog('[ComponentAsyncState#createStream()] args', args);
    const { tableIdx, elemMeta, hostInjectFn } = args;
    if (tableIdx === undefined) { throw new Error("missing table idx while adding stream"); }
    if (elemMeta === undefined) { throw new Error("missing element metadata while adding stream"); }
    
    const { table: localStreamTable, componentIdx } = STREAM_TABLES[tableIdx];
    if (!localStreamTable) {
      throw new Error(`missing global stream table lookup for table [${tableIdx}] while creating stream`);
    }
    if (componentIdx !== this.#componentIdx) {
      throw new Error('component idx mismatch while creating stream');
    }
    
    const readWaitable = this.createWaitable();
    const writeWaitable = this.createWaitable();
    
    const stream = new InternalStream({
      tableIdx,
      elemMeta,
      readWaitable,
      writeWaitable,
      hostInjectFn,
    });
    stream.setGlobalStreamMapRep(STREAMS.insert(stream));
    
    const writeEnd = stream.writeEnd();
    writeEnd.setWaitableIdx(this.handles.insert(writeEnd));
    writeEnd.setHandle(localStreamTable.insert(writeEnd));
    if (writeEnd.streamTableIdx() !== tableIdx) { throw new Error("unexpectedly mismatched stream table"); }
    
    const writeEndWaitableIdx = writeEnd.waitableIdx();
    const writeEndHandle = writeEnd.handle();
    writeWaitable.setTarget(`waitable for stream write end (waitable [${writeEndWaitableIdx}])`);
    writeEnd.setTarget(`stream write end (waitable [${writeEndWaitableIdx}])`);
    
    const readEnd = stream.readEnd();
    readEnd.setWaitableIdx(this.handles.insert(readEnd));
    readEnd.setHandle(localStreamTable.insert(readEnd));
    if (readEnd.streamTableIdx() !== tableIdx) { throw new Error("unexpectedly mismatched stream table"); }
    
    const readEndWaitableIdx = readEnd.waitableIdx();
    const readEndHandle = readEnd.handle();
    readWaitable.setTarget(`waitable for read end (waitable [${readEndWaitableIdx}])`);
    readEnd.setTarget(`stream read end (waitable [${readEndWaitableIdx}])`);
    
    return {
      writeEnd,
      writeEndWaitableIdx,
      writeEndHandle,
      readEndWaitableIdx,
      readEndHandle,
      readEnd,
    };
  }
  
  getStreamEnd(args) {
    _debugLog('[ComponentAsyncState#getStreamEnd()] args', args);
    const { tableIdx, streamEndHandle, streamEndWaitableIdx } = args;
    if (tableIdx === undefined) {
      throw new Error('missing table idx while getting stream end');
    }
    
    const { table, componentIdx } = STREAM_TABLES[tableIdx];
    const cstate = getOrCreateAsyncState(componentIdx);
    
    let streamEnd;
    if (streamEndWaitableIdx !== undefined) {
      streamEnd = cstate.handles.get(streamEndWaitableIdx);
    } else if (streamEndHandle !== undefined) {
      if (!table) { throw new Error(`missing/invalid table [${tableIdx}] while getting stream end`); }
      streamEnd = table.get(streamEndHandle);
    } else {
      throw new TypeError("must specify either waitable idx or handle to retrieve stream");
    }
    
    if (!streamEnd) {
      throw new Error(`missing stream end (tableIdx [${tableIdx}], handle [${streamEndHandle}], waitableIdx [${streamEndWaitableIdx}])`);
    }
    if (tableIdx && streamEnd.streamTableIdx() !== tableIdx) {
      throw new Error(`stream end table idx [${streamEnd.streamTableIdx()}] does not match [${tableIdx}]`);
    }
    
    return streamEnd;
  }
  
  deleteStreamEnd(args) {
    _debugLog('[ComponentAsyncState#deleteStreamEnd()] args', args);
    const { tableIdx, streamEndWaitableIdx } = args;
    if (tableIdx === undefined) { throw new Error("missing table idx while removing stream end"); }
    if (streamEndWaitableIdx === undefined) { throw new Error("missing stream idx while removing stream end"); }
    
    const { table, componentIdx } = STREAM_TABLES[tableIdx];
    const cstate = getOrCreateAsyncState(componentIdx);
    
    const streamEnd = cstate.handles.get(streamEndWaitableIdx);
    if (!streamEnd) {
      throw new Error(`missing stream end [${streamEndWaitableIdx}] in component handles while deleting stream`);
    }
    if (streamEnd.streamTableIdx() !== tableIdx) {
      throw new Error(`stream end table idx [${streamEnd.streamTableIdx()}] does not match [${tableIdx}]`);
    }
    
    let removed = cstate.handles.remove(streamEnd.waitableIdx());
    if (!removed) {
      throw new Error(`failed to remove stream end [${streamEndWaitableIdx}] waitable obj in component [${componentIdx}]`);
    }
    
    removed = table.remove(streamEnd.handle());
    if (!removed) {
      throw new Error(`failed to remove stream end with handle [${streamEnd.handle()}] from stream table [${tableIdx}] in component [${componentIdx}]`);
    }
    
    return streamEnd;
  }
  
  removeStreamEndFromTable(args) {
    _debugLog('[ComponentAsyncState#removeStreamEndFromTable()] args', args);
    
    const { tableIdx, streamWaitableIdx } = args;
    if (tableIdx === undefined) { throw new Error("missing table idx while removing stream end"); }
    if (streamWaitableIdx === undefined) {
      throw new Error("missing stream end waitable idx while removing stream end");
    }
    
    const { table, componentIdx } = STREAM_TABLES[tableIdx];
    if (!table) { throw new Error(`missing/invalid table [${tableIdx}] while removing stream end`); }
    
    const cstate = getOrCreateAsyncState(componentIdx);
    
    const streamEnd = cstate.handles.get(streamWaitableIdx);
    if (!streamEnd) {
      throw new Error(`missing stream end (handle [${streamWaitableIdx}], table [${tableIdx}])`);
    }
    const handle = streamEnd.handle();
    
    let removed = cstate.handles.remove(streamWaitableIdx);
    if (!removed) {
      throw new Error(`failed to remove streamEnd from handles (waitable idx [${streamWaitableIdx}]), component [${componentIdx}])`);
    }
    
    removed = table.remove(handle);
    if (!removed) {
      throw new Error(`failed to remove streamEnd from table (handle [${handle}]), table [${tableIdx}], component [${componentIdx}])`);
    }
    
    return streamEnd;
  }
  
  createFuture(args) {
    _debugLog('[ComponentAsyncState#createFuture()] args', args);
    const { tableIdx, elemMeta, hostInjectFn } = args;
    if (tableIdx === undefined) { throw new Error("missing table idx while adding future"); }
    if (elemMeta === undefined) { throw new Error("missing element metadata while adding future"); }
    
    const { table: futureTable, componentIdx } = FUTURE_TABLES[tableIdx];
    if (!futureTable) {
      throw new Error(`missing global future table lookup for table [${tableIdx}] while creating future`);
    }
    if (componentIdx !== this.#componentIdx) {
      throw new Error('component idx mismatch while creating future');
    }
    
    const readWaitable = this.createWaitable();
    const writeWaitable = this.createWaitable();
    
    const future = new InternalFuture({
      tableIdx,
      componentIdx: this.#componentIdx,
      elemMeta,
      readWaitable,
      writeWaitable,
      hostInjectFn,
    });
    future.setGlobalFutureMapRep(FUTURES.insert(future));
    
    const writeEnd = future.writeEnd();
    writeEnd.setWaitableIdx(this.handles.insert(writeEnd));
    writeEnd.setHandle(futureTable.insert(writeEnd));
    if (writeEnd.futureTableIdx() !== tableIdx) { throw new Error("unexpectedly mismatched future table"); }
    
    const writeEndWaitableIdx = writeEnd.waitableIdx();
    const writeEndHandle = writeEnd.handle();
    writeWaitable.setTarget(`waitable for future write end (waitable [${writeEndWaitableIdx}])`);
    writeEnd.setTarget(`future write end (waitable [${writeEndWaitableIdx}])`);
    
    const readEnd = future.readEnd();
    readEnd.setWaitableIdx(this.handles.insert(readEnd));
    readEnd.setHandle(futureTable.insert(readEnd));
    if (readEnd.futureTableIdx() !== tableIdx) { throw new Error("unexpectedly mismatched future table"); }
    
    const readEndWaitableIdx = readEnd.waitableIdx();
    const readEndHandle = readEnd.handle();
    readWaitable.setTarget(`waitable for read end (waitable [${readEndWaitableIdx}])`);
    readEnd.setTarget(`future read end (waitable [${readEndWaitableIdx}])`);
    
    return {
      writeEnd,
      writeEndWaitableIdx,
      writeEndHandle,
      readEndWaitableIdx,
      readEndHandle,
      readEnd,
    };
  }
  
  getFutureEnd(args) {
    _debugLog('[ComponentAsyncState#getFutureEnd()] args', args);
    const { tableIdx, futureEndHandle, futureEndWaitableIdx } = args;
    if (tableIdx === undefined) {
      throw new Error('missing table idx while getting future end');
    }
    
    const { table, componentIdx } = FUTURE_TABLES[tableIdx];
    const cstate = getOrCreateAsyncState(componentIdx);
    
    let futureEnd;
    if (futureEndWaitableIdx !== undefined) {
      futureEnd = cstate.handles.get(futureEndWaitableIdx);
    } else if (futureEndHandle !== undefined) {
      if (!table) { throw new Error(`missing/invalid table [${tableIdx}] while getting future end`); }
      futureEnd = table.get(futureEndHandle);
    } else {
      throw new TypeError("must specify either waitable idx or handle to retrieve future");
    }
    
    if (!futureEnd) {
      throw new Error(`missing future end (tableIdx [${tableIdx}], handle [${futureEndHandle}], waitableIdx [${futureEndWaitableIdx}])`);
    }
    if (tableIdx && futureEnd.futureTableIdx() !== tableIdx) {
      throw new Error(`future end table idx [${futureEnd.futureTableIdx()}] does not match [${tableIdx}]`);
    }
    
    return futureEnd;
  }
  
  removeFutureEndFromTable(args) {
    _debugLog('[ComponentAsyncState#removeFutureEndFromTable()] args', args);
    
    const { tableIdx, futureWaitableIdx } = args;
    if (tableIdx === undefined) { throw new Error("missing table idx while removing future end"); }
    if (futureWaitableIdx === undefined) {
      throw new Error("missing future end waitable idx while removing future end");
    }
    
    const { table, componentIdx } = FUTURE_TABLES[tableIdx];
    if (!table) { throw new Error(`missing/invalid table [${tableIdx}] while removing future end`); }
    
    const cstate = getOrCreateAsyncState(componentIdx);
    
    const futureEnd = cstate.handles.get(futureWaitableIdx);
    if (!futureEnd) {
      throw new Error(`missing future end (handle [${futureWaitableIdx}], table [${tableIdx}])`);
    }
    const handle = futureEnd.handle();
    
    let removed = cstate.handles.remove(futureWaitableIdx);
    if (!removed) {
      throw new Error(`failed to remove futureEnd from handles (waitable idx [${futureWaitableIdx}]), component [${componentIdx}])`);
    }
    
    removed = table.remove(handle);
    if (!removed) {
      throw new Error(`failed to remove futureEnd from table (handle [${handle}]), table [${tableIdx}], component [${componentIdx}])`);
    }
    
    return futureEnd;
  }
  
}

const base64Compile = str => WebAssembly.compile(
typeof Buffer !== 'undefined'
? Buffer.from(str, 'base64')
: Uint8Array.from(atob(str), b => b.charCodeAt(0))
);


const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
let _fs;
async function fetchCompile (url) {
  if (isNode) {
    _fs = _fs || await import('node:fs/promises');
    return WebAssembly.compile(await _fs.readFile(url));
  }
  return fetch(url).then(WebAssembly.compileStreaming);
}

const symbolRscHandle = Symbol('handle');

const HANDLE_TABLES= [];


function finalizationRegistryCreate (unregister) {
  if (typeof FinalizationRegistry === 'undefined') {
    return { unregister () {} };
  }
  return new FinalizationRegistry(unregister);
}

class ComponentError extends Error {
  constructor (value) {
    const enumerable = typeof value !== 'string';
    super(enumerable ? `${String(value)} (see error.payload)` : value);
    Object.defineProperty(this, 'payload', { value, enumerable });
  }
}

const isLE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

function throwInvalidBool() {
  throw new TypeError('invalid variant discriminant for bool');
}

const instantiateCore = WebAssembly.instantiate;


let exports0;
let exports1;
let exports2;
let memory0;
let realloc0;
let realloc0Async;
let postReturn0;
let postReturn0Async;
let postReturn1;
let postReturn1Async;
let postReturn2;
let postReturn2Async;
let commands010Encode;

function encode(arg0) {
  var ptr0 = realloc0(0, 0, 4, 68);
  var variant227 = arg0;
  switch (variant227.tag) {
    case 'b-alloc': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 0, true);
      var {bufnum: v1_0, numFrames: v1_1, numChannels: v1_2, completionMsg: v1_3, sampleRate: v1_4 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v1_0), true);
      dataView(memory0).setInt32(ptr0 + 8, toInt32(v1_1), true);
      var variant2 = v1_2;
      if (variant2 === null || variant2=== undefined) {
        dataView(memory0).setInt8(ptr0 + 12, 0, true);
      } else {
        const e = variant2;
        dataView(memory0).setInt8(ptr0 + 12, 1, true);
        dataView(memory0).setInt32(ptr0 + 16, toInt32(e), true);
      }
      var variant4 = v1_3;
      if (variant4 === null || variant4=== undefined) {
        dataView(memory0).setInt8(ptr0 + 20, 0, true);
      } else {
        const e = variant4;
        dataView(memory0).setInt8(ptr0 + 20, 1, true);
        var val3 = e;
        var len3 = Array.isArray(val3) ? val3.length : val3.byteLength;
        var ptr3 = realloc0(0, 0, 1, len3 * 1);
        
        let valData3;
        const valLenBytes3 = len3 * 1;
        if (Array.isArray(val3)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv3 = new DataView(memory0.buffer);
          for (const v of val3) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv3.setUint8(ptr3+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, valLenBytes3);
          const out3 = new Uint8Array(memory0.buffer, ptr3, valLenBytes3);
          out3.set(valData3);
        }
        
        dataView(memory0).setUint32(ptr0 + 28, len3, true);
        dataView(memory0).setUint32(ptr0 + 24, ptr3, true);
      }
      var variant5 = v1_4;
      if (variant5 === null || variant5=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant5;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        dataView(memory0).setFloat32(ptr0 + 36, +e, true);
      }
      break;
    }
    case 'b-alloc-read': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 1, true);
      var {bufnum: v6_0, path: v6_1, startFrame: v6_2, numberOfFrames: v6_3, completionMsg: v6_4 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v6_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v6_1, realloc0, memory0);
      var ptr7= encodeRes.ptr;
      var len7 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 12, len7, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr7, true);
      var variant8 = v6_2;
      if (variant8 === null || variant8=== undefined) {
        dataView(memory0).setInt8(ptr0 + 16, 0, true);
      } else {
        const e = variant8;
        dataView(memory0).setInt8(ptr0 + 16, 1, true);
        dataView(memory0).setInt32(ptr0 + 20, toInt32(e), true);
      }
      var variant9 = v6_3;
      if (variant9 === null || variant9=== undefined) {
        dataView(memory0).setInt8(ptr0 + 24, 0, true);
      } else {
        const e = variant9;
        dataView(memory0).setInt8(ptr0 + 24, 1, true);
        dataView(memory0).setInt32(ptr0 + 28, toInt32(e), true);
      }
      var variant11 = v6_4;
      if (variant11 === null || variant11=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant11;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        var val10 = e;
        var len10 = Array.isArray(val10) ? val10.length : val10.byteLength;
        var ptr10 = realloc0(0, 0, 1, len10 * 1);
        
        let valData10;
        const valLenBytes10 = len10 * 1;
        if (Array.isArray(val10)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv10 = new DataView(memory0.buffer);
          for (const v of val10) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv10.setUint8(ptr10+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData10 = new Uint8Array(val10.buffer || val10, val10.byteOffset, valLenBytes10);
          const out10 = new Uint8Array(memory0.buffer, ptr10, valLenBytes10);
          out10.set(valData10);
        }
        
        dataView(memory0).setUint32(ptr0 + 40, len10, true);
        dataView(memory0).setUint32(ptr0 + 36, ptr10, true);
      }
      break;
    }
    case 'b-alloc-read-channel': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 2, true);
      var {bufnum: v12_0, path: v12_1, startFrame: v12_2, numberOfFrames: v12_3, channels: v12_4, completionMsg: v12_5 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v12_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v12_1, realloc0, memory0);
      var ptr13= encodeRes.ptr;
      var len13 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 12, len13, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr13, true);
      dataView(memory0).setInt32(ptr0 + 16, toInt32(v12_2), true);
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v12_3), true);
      var val14 = v12_4;
      var len14 = val14.length;
      var ptr14 = realloc0(0, 0, 4, len14 * 4);
      
      let valData14;
      const valLenBytes14 = len14 * 4;
      if (Array.isArray(val14)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv14 = new DataView(memory0.buffer);
        for (const v of val14) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv14.setInt32(ptr14+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData14 = new Uint8Array(val14.buffer || val14, val14.byteOffset, valLenBytes14);
        const out14 = new Uint8Array(memory0.buffer, ptr14, valLenBytes14);
        out14.set(valData14);
      }
      
      dataView(memory0).setUint32(ptr0 + 28, len14, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr14, true);
      var variant16 = v12_5;
      if (variant16 === null || variant16=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant16;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        var val15 = e;
        var len15 = Array.isArray(val15) ? val15.length : val15.byteLength;
        var ptr15 = realloc0(0, 0, 1, len15 * 1);
        
        let valData15;
        const valLenBytes15 = len15 * 1;
        if (Array.isArray(val15)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv15 = new DataView(memory0.buffer);
          for (const v of val15) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv15.setUint8(ptr15+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData15 = new Uint8Array(val15.buffer || val15, val15.byteOffset, valLenBytes15);
          const out15 = new Uint8Array(memory0.buffer, ptr15, valLenBytes15);
          out15.set(valData15);
        }
        
        dataView(memory0).setUint32(ptr0 + 40, len15, true);
        dataView(memory0).setUint32(ptr0 + 36, ptr15, true);
      }
      break;
    }
    case 'b-close': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 3, true);
      var {bufnum: v17_0, completionMsg: v17_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v17_0), true);
      var variant19 = v17_1;
      if (variant19 === null || variant19=== undefined) {
        dataView(memory0).setInt8(ptr0 + 8, 0, true);
      } else {
        const e = variant19;
        dataView(memory0).setInt8(ptr0 + 8, 1, true);
        var val18 = e;
        var len18 = Array.isArray(val18) ? val18.length : val18.byteLength;
        var ptr18 = realloc0(0, 0, 1, len18 * 1);
        
        let valData18;
        const valLenBytes18 = len18 * 1;
        if (Array.isArray(val18)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv18 = new DataView(memory0.buffer);
          for (const v of val18) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv18.setUint8(ptr18+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData18 = new Uint8Array(val18.buffer || val18, val18.byteOffset, valLenBytes18);
          const out18 = new Uint8Array(memory0.buffer, ptr18, valLenBytes18);
          out18.set(valData18);
        }
        
        dataView(memory0).setUint32(ptr0 + 16, len18, true);
        dataView(memory0).setUint32(ptr0 + 12, ptr18, true);
      }
      break;
    }
    case 'b-fill': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 4, true);
      var {bufnum: v20_0, tail: v20_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v20_0), true);
      var vec22 = v20_1;
      var len22 = vec22.length;
      var result22 = realloc0(0, 0, 4, len22 * 12);
      for (let i = 0; i < vec22.length; i++) {
        const e = vec22[i];
        const base = result22 + i * 12;var [tuple21_0, tuple21_1, tuple21_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple21_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple21_1), true);
        dataView(memory0).setFloat32(base + 8, +tuple21_2, true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len22, true);
      dataView(memory0).setUint32(ptr0 + 8, result22, true);
      break;
    }
    case 'b-free': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 5, true);
      var {bufnum: v23_0, completionMsg: v23_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v23_0), true);
      var variant25 = v23_1;
      if (variant25 === null || variant25=== undefined) {
        dataView(memory0).setInt8(ptr0 + 8, 0, true);
      } else {
        const e = variant25;
        dataView(memory0).setInt8(ptr0 + 8, 1, true);
        var val24 = e;
        var len24 = Array.isArray(val24) ? val24.length : val24.byteLength;
        var ptr24 = realloc0(0, 0, 1, len24 * 1);
        
        let valData24;
        const valLenBytes24 = len24 * 1;
        if (Array.isArray(val24)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv24 = new DataView(memory0.buffer);
          for (const v of val24) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv24.setUint8(ptr24+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData24 = new Uint8Array(val24.buffer || val24, val24.byteOffset, valLenBytes24);
          const out24 = new Uint8Array(memory0.buffer, ptr24, valLenBytes24);
          out24.set(valData24);
        }
        
        dataView(memory0).setUint32(ptr0 + 16, len24, true);
        dataView(memory0).setUint32(ptr0 + 12, ptr24, true);
      }
      break;
    }
    case 'b-gen': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 6, true);
      var {bufnum: v26_0, cmd: v26_1, commandArguments: v26_2 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v26_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v26_1, realloc0, memory0);
      var ptr27= encodeRes.ptr;
      var len27 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 12, len27, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr27, true);
      var vec31 = v26_2;
      var len31 = vec31.length;
      var result31 = realloc0(0, 0, 8, len31 * 16);
      for (let i = 0; i < vec31.length; i++) {
        const e = vec31[i];
        const base = result31 + i * 16;var variant30 = e;
        switch (variant30.tag) {
          case 'int32': {
            const e = variant30.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant30.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant30.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant30.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr28= encodeRes.ptr;
            var len28 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len28, true);
            dataView(memory0).setUint32(base + 8, ptr28, true);
            break;
          }
          case 'blob': {
            const e = variant30.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val29 = e;
            var len29 = Array.isArray(val29) ? val29.length : val29.byteLength;
            var ptr29 = realloc0(0, 0, 1, len29 * 1);
            
            let valData29;
            const valLenBytes29 = len29 * 1;
            if (Array.isArray(val29)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv29 = new DataView(memory0.buffer);
              for (const v of val29) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv29.setUint8(ptr29+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData29 = new Uint8Array(val29.buffer || val29, val29.byteOffset, valLenBytes29);
              const out29 = new Uint8Array(memory0.buffer, ptr29, valLenBytes29);
              out29.set(valData29);
            }
            
            dataView(memory0).setUint32(base + 12, len29, true);
            dataView(memory0).setUint32(base + 8, ptr29, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant30.tag)}\` (received \`${variant30}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 20, len31, true);
      dataView(memory0).setUint32(ptr0 + 16, result31, true);
      break;
    }
    case 'b-get': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 7, true);
      var {bufnum: v32_0, sampleIndices: v32_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v32_0), true);
      var val33 = v32_1;
      var len33 = val33.length;
      var ptr33 = realloc0(0, 0, 4, len33 * 4);
      
      let valData33;
      const valLenBytes33 = len33 * 4;
      if (Array.isArray(val33)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv33 = new DataView(memory0.buffer);
        for (const v of val33) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv33.setInt32(ptr33+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData33 = new Uint8Array(val33.buffer || val33, val33.byteOffset, valLenBytes33);
        const out33 = new Uint8Array(memory0.buffer, ptr33, valLenBytes33);
        out33.set(valData33);
      }
      
      dataView(memory0).setUint32(ptr0 + 12, len33, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr33, true);
      break;
    }
    case 'b-getn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 8, true);
      var {bufnum: v34_0, tail: v34_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v34_0), true);
      var vec36 = v34_1;
      var len36 = vec36.length;
      var result36 = realloc0(0, 0, 4, len36 * 8);
      for (let i = 0; i < vec36.length; i++) {
        const e = vec36[i];
        const base = result36 + i * 8;var [tuple35_0, tuple35_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple35_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple35_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len36, true);
      dataView(memory0).setUint32(ptr0 + 8, result36, true);
      break;
    }
    case 'b-query': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 9, true);
      var {bufnums: v37_0 } = e;
      var val38 = v37_0;
      var len38 = val38.length;
      var ptr38 = realloc0(0, 0, 4, len38 * 4);
      
      let valData38;
      const valLenBytes38 = len38 * 4;
      if (Array.isArray(val38)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv38 = new DataView(memory0.buffer);
        for (const v of val38) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv38.setInt32(ptr38+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData38 = new Uint8Array(val38.buffer || val38, val38.byteOffset, valLenBytes38);
        const out38 = new Uint8Array(memory0.buffer, ptr38, valLenBytes38);
        out38.set(valData38);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len38, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr38, true);
      break;
    }
    case 'b-read': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 10, true);
      var {bufnum: v39_0, path: v39_1, startFrame: v39_2, numberOfFrames: v39_3, startingFrame: v39_4, leaveFileOpen: v39_5, completionMsg: v39_6 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v39_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v39_1, realloc0, memory0);
      var ptr40= encodeRes.ptr;
      var len40 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 12, len40, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr40, true);
      var variant41 = v39_2;
      if (variant41 === null || variant41=== undefined) {
        dataView(memory0).setInt8(ptr0 + 16, 0, true);
      } else {
        const e = variant41;
        dataView(memory0).setInt8(ptr0 + 16, 1, true);
        dataView(memory0).setInt32(ptr0 + 20, toInt32(e), true);
      }
      var variant42 = v39_3;
      if (variant42 === null || variant42=== undefined) {
        dataView(memory0).setInt8(ptr0 + 24, 0, true);
      } else {
        const e = variant42;
        dataView(memory0).setInt8(ptr0 + 24, 1, true);
        dataView(memory0).setInt32(ptr0 + 28, toInt32(e), true);
      }
      var variant43 = v39_4;
      if (variant43 === null || variant43=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant43;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        dataView(memory0).setInt32(ptr0 + 36, toInt32(e), true);
      }
      var variant44 = v39_5;
      if (variant44 === null || variant44=== undefined) {
        dataView(memory0).setInt8(ptr0 + 40, 0, true);
      } else {
        const e = variant44;
        dataView(memory0).setInt8(ptr0 + 40, 1, true);
        dataView(memory0).setInt32(ptr0 + 44, toInt32(e), true);
      }
      var variant46 = v39_6;
      if (variant46 === null || variant46=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant46;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        var val45 = e;
        var len45 = Array.isArray(val45) ? val45.length : val45.byteLength;
        var ptr45 = realloc0(0, 0, 1, len45 * 1);
        
        let valData45;
        const valLenBytes45 = len45 * 1;
        if (Array.isArray(val45)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv45 = new DataView(memory0.buffer);
          for (const v of val45) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv45.setUint8(ptr45+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData45 = new Uint8Array(val45.buffer || val45, val45.byteOffset, valLenBytes45);
          const out45 = new Uint8Array(memory0.buffer, ptr45, valLenBytes45);
          out45.set(valData45);
        }
        
        dataView(memory0).setUint32(ptr0 + 56, len45, true);
        dataView(memory0).setUint32(ptr0 + 52, ptr45, true);
      }
      break;
    }
    case 'b-read-channel': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 11, true);
      var {bufnum: v47_0, path: v47_1, startFrame: v47_2, numberOfFrames: v47_3, startingFrame: v47_4, leaveFileOpen: v47_5, channels: v47_6, completionMsg: v47_7 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v47_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v47_1, realloc0, memory0);
      var ptr48= encodeRes.ptr;
      var len48 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 12, len48, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr48, true);
      dataView(memory0).setInt32(ptr0 + 16, toInt32(v47_2), true);
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v47_3), true);
      dataView(memory0).setInt32(ptr0 + 24, toInt32(v47_4), true);
      dataView(memory0).setInt32(ptr0 + 28, toInt32(v47_5), true);
      var val49 = v47_6;
      var len49 = val49.length;
      var ptr49 = realloc0(0, 0, 4, len49 * 4);
      
      let valData49;
      const valLenBytes49 = len49 * 4;
      if (Array.isArray(val49)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv49 = new DataView(memory0.buffer);
        for (const v of val49) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv49.setInt32(ptr49+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData49 = new Uint8Array(val49.buffer || val49, val49.byteOffset, valLenBytes49);
        const out49 = new Uint8Array(memory0.buffer, ptr49, valLenBytes49);
        out49.set(valData49);
      }
      
      dataView(memory0).setUint32(ptr0 + 36, len49, true);
      dataView(memory0).setUint32(ptr0 + 32, ptr49, true);
      var variant51 = v47_7;
      if (variant51 === null || variant51=== undefined) {
        dataView(memory0).setInt8(ptr0 + 40, 0, true);
      } else {
        const e = variant51;
        dataView(memory0).setInt8(ptr0 + 40, 1, true);
        var val50 = e;
        var len50 = Array.isArray(val50) ? val50.length : val50.byteLength;
        var ptr50 = realloc0(0, 0, 1, len50 * 1);
        
        let valData50;
        const valLenBytes50 = len50 * 1;
        if (Array.isArray(val50)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv50 = new DataView(memory0.buffer);
          for (const v of val50) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv50.setUint8(ptr50+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData50 = new Uint8Array(val50.buffer || val50, val50.byteOffset, valLenBytes50);
          const out50 = new Uint8Array(memory0.buffer, ptr50, valLenBytes50);
          out50.set(valData50);
        }
        
        dataView(memory0).setUint32(ptr0 + 48, len50, true);
        dataView(memory0).setUint32(ptr0 + 44, ptr50, true);
      }
      break;
    }
    case 'b-set': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 12, true);
      var {bufnum: v52_0, tail: v52_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v52_0), true);
      var vec54 = v52_1;
      var len54 = vec54.length;
      var result54 = realloc0(0, 0, 4, len54 * 8);
      for (let i = 0; i < vec54.length; i++) {
        const e = vec54[i];
        const base = result54 + i * 8;var [tuple53_0, tuple53_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple53_0), true);
        dataView(memory0).setFloat32(base + 4, +tuple53_1, true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len54, true);
      dataView(memory0).setUint32(ptr0 + 8, result54, true);
      break;
    }
    case 'b-set-sample-rate': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 13, true);
      var {bufnum: v55_0, theDesiredSampling: v55_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v55_0), true);
      dataView(memory0).setFloat32(ptr0 + 8, +v55_1, true);
      break;
    }
    case 'b-setn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 14, true);
      var {bufnum: v56_0, tail: v56_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v56_0), true);
      var vec59 = v56_1;
      var len59 = vec59.length;
      var result59 = realloc0(0, 0, 4, len59 * 12);
      for (let i = 0; i < vec59.length; i++) {
        const e = vec59[i];
        const base = result59 + i * 12;var [tuple57_0, tuple57_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple57_0), true);
        var val58 = tuple57_1;
        var len58 = val58.length;
        var ptr58 = realloc0(0, 0, 4, len58 * 4);
        
        let valData58;
        const valLenBytes58 = len58 * 4;
        if (Array.isArray(val58)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv58 = new DataView(memory0.buffer);
          for (const v of val58) {
            _requireValidNumericPrimitive.bind(null, 'f32')(v);
            dv58.setFloat32(ptr58+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData58 = new Uint8Array(val58.buffer || val58, val58.byteOffset, valLenBytes58);
          const out58 = new Uint8Array(memory0.buffer, ptr58, valLenBytes58);
          out58.set(valData58);
        }
        
        dataView(memory0).setUint32(base + 8, len58, true);
        dataView(memory0).setUint32(base + 4, ptr58, true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len59, true);
      dataView(memory0).setUint32(ptr0 + 8, result59, true);
      break;
    }
    case 'b-write': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 15, true);
      var {bufnum: v60_0, path: v60_1, headerFormat: v60_2, sampleFormat: v60_3, numberOfFrames: v60_4, startingFrame: v60_5, leaveFileOpen: v60_6, completionMsg: v60_7 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v60_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v60_1, realloc0, memory0);
      var ptr61= encodeRes.ptr;
      var len61 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 12, len61, true);
      dataView(memory0).setUint32(ptr0 + 8, ptr61, true);
      
      var encodeRes = _utf8AllocateAndEncode(v60_2, realloc0, memory0);
      var ptr62= encodeRes.ptr;
      var len62 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 20, len62, true);
      dataView(memory0).setUint32(ptr0 + 16, ptr62, true);
      
      var encodeRes = _utf8AllocateAndEncode(v60_3, realloc0, memory0);
      var ptr63= encodeRes.ptr;
      var len63 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len63, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr63, true);
      var variant64 = v60_4;
      if (variant64 === null || variant64=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant64;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        dataView(memory0).setInt32(ptr0 + 36, toInt32(e), true);
      }
      var variant65 = v60_5;
      if (variant65 === null || variant65=== undefined) {
        dataView(memory0).setInt8(ptr0 + 40, 0, true);
      } else {
        const e = variant65;
        dataView(memory0).setInt8(ptr0 + 40, 1, true);
        dataView(memory0).setInt32(ptr0 + 44, toInt32(e), true);
      }
      var variant66 = v60_6;
      if (variant66 === null || variant66=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant66;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        dataView(memory0).setInt32(ptr0 + 52, toInt32(e), true);
      }
      var variant68 = v60_7;
      if (variant68 === null || variant68=== undefined) {
        dataView(memory0).setInt8(ptr0 + 56, 0, true);
      } else {
        const e = variant68;
        dataView(memory0).setInt8(ptr0 + 56, 1, true);
        var val67 = e;
        var len67 = Array.isArray(val67) ? val67.length : val67.byteLength;
        var ptr67 = realloc0(0, 0, 1, len67 * 1);
        
        let valData67;
        const valLenBytes67 = len67 * 1;
        if (Array.isArray(val67)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv67 = new DataView(memory0.buffer);
          for (const v of val67) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv67.setUint8(ptr67+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData67 = new Uint8Array(val67.buffer || val67, val67.byteOffset, valLenBytes67);
          const out67 = new Uint8Array(memory0.buffer, ptr67, valLenBytes67);
          out67.set(valData67);
        }
        
        dataView(memory0).setUint32(ptr0 + 64, len67, true);
        dataView(memory0).setUint32(ptr0 + 60, ptr67, true);
      }
      break;
    }
    case 'b-zero': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 16, true);
      var {bufnum: v69_0, completionMsg: v69_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v69_0), true);
      var variant71 = v69_1;
      if (variant71 === null || variant71=== undefined) {
        dataView(memory0).setInt8(ptr0 + 8, 0, true);
      } else {
        const e = variant71;
        dataView(memory0).setInt8(ptr0 + 8, 1, true);
        var val70 = e;
        var len70 = Array.isArray(val70) ? val70.length : val70.byteLength;
        var ptr70 = realloc0(0, 0, 1, len70 * 1);
        
        let valData70;
        const valLenBytes70 = len70 * 1;
        if (Array.isArray(val70)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv70 = new DataView(memory0.buffer);
          for (const v of val70) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv70.setUint8(ptr70+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData70 = new Uint8Array(val70.buffer || val70, val70.byteOffset, valLenBytes70);
          const out70 = new Uint8Array(memory0.buffer, ptr70, valLenBytes70);
          out70.set(valData70);
        }
        
        dataView(memory0).setUint32(ptr0 + 16, len70, true);
        dataView(memory0).setUint32(ptr0 + 12, ptr70, true);
      }
      break;
    }
    case 'c-fill': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 17, true);
      var {tail: v72_0 } = e;
      var vec75 = v72_0;
      var len75 = vec75.length;
      var result75 = realloc0(0, 0, 4, len75 * 16);
      for (let i = 0; i < vec75.length; i++) {
        const e = vec75[i];
        const base = result75 + i * 16;var [tuple73_0, tuple73_1, tuple73_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple73_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple73_1), true);
        var variant74 = tuple73_2;
        switch (variant74.tag) {
          case 'float': {
            const e = variant74.val;
            dataView(memory0).setInt8(base + 8, 0, true);
            dataView(memory0).setFloat32(base + 12, +e, true);
            break;
          }
          case 'int': {
            const e = variant74.val;
            dataView(memory0).setInt8(base + 8, 1, true);
            dataView(memory0).setInt32(base + 12, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant74.tag)}\` (received \`${variant74}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 8, len75, true);
      dataView(memory0).setUint32(ptr0 + 4, result75, true);
      break;
    }
    case 'c-get': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 18, true);
      var {busIndices: v76_0 } = e;
      var val77 = v76_0;
      var len77 = val77.length;
      var ptr77 = realloc0(0, 0, 4, len77 * 4);
      
      let valData77;
      const valLenBytes77 = len77 * 4;
      if (Array.isArray(val77)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv77 = new DataView(memory0.buffer);
        for (const v of val77) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv77.setInt32(ptr77+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData77 = new Uint8Array(val77.buffer || val77, val77.byteOffset, valLenBytes77);
        const out77 = new Uint8Array(memory0.buffer, ptr77, valLenBytes77);
        out77.set(valData77);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len77, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr77, true);
      break;
    }
    case 'c-getn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 19, true);
      var {tail: v78_0 } = e;
      var vec80 = v78_0;
      var len80 = vec80.length;
      var result80 = realloc0(0, 0, 4, len80 * 8);
      for (let i = 0; i < vec80.length; i++) {
        const e = vec80[i];
        const base = result80 + i * 8;var [tuple79_0, tuple79_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple79_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple79_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len80, true);
      dataView(memory0).setUint32(ptr0 + 4, result80, true);
      break;
    }
    case 'c-set': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 20, true);
      var {tail: v81_0 } = e;
      var vec84 = v81_0;
      var len84 = vec84.length;
      var result84 = realloc0(0, 0, 4, len84 * 12);
      for (let i = 0; i < vec84.length; i++) {
        const e = vec84[i];
        const base = result84 + i * 12;var [tuple82_0, tuple82_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple82_0), true);
        var variant83 = tuple82_1;
        switch (variant83.tag) {
          case 'float': {
            const e = variant83.val;
            dataView(memory0).setInt8(base + 4, 0, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'int': {
            const e = variant83.val;
            dataView(memory0).setInt8(base + 4, 1, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant83.tag)}\` (received \`${variant83}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 8, len84, true);
      dataView(memory0).setUint32(ptr0 + 4, result84, true);
      break;
    }
    case 'c-setn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 21, true);
      var {tail: v85_0 } = e;
      var vec89 = v85_0;
      var len89 = vec89.length;
      var result89 = realloc0(0, 0, 4, len89 * 12);
      for (let i = 0; i < vec89.length; i++) {
        const e = vec89[i];
        const base = result89 + i * 12;var [tuple86_0, tuple86_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple86_0), true);
        var vec88 = tuple86_1;
        var len88 = vec88.length;
        var result88 = realloc0(0, 0, 4, len88 * 8);
        for (let i = 0; i < vec88.length; i++) {
          const e = vec88[i];
          const base = result88 + i * 8;var variant87 = e;
          switch (variant87.tag) {
            case 'float': {
              const e = variant87.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setFloat32(base + 4, +e, true);
              break;
            }
            case 'int': {
              const e = variant87.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant87.tag)}\` (received \`${variant87}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 8, len88, true);
        dataView(memory0).setUint32(base + 4, result88, true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len89, true);
      dataView(memory0).setUint32(ptr0 + 4, result89, true);
      break;
    }
    case 'clear-sched': {
      dataView(memory0).setInt8(ptr0 + 0, 22, true);
      break;
    }
    case 'cmd': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 23, true);
      var {cmd: v90_0, anyArguments: v90_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v90_0, realloc0, memory0);
      var ptr91= encodeRes.ptr;
      var len91 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 8, len91, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr91, true);
      var vec95 = v90_1;
      var len95 = vec95.length;
      var result95 = realloc0(0, 0, 8, len95 * 16);
      for (let i = 0; i < vec95.length; i++) {
        const e = vec95[i];
        const base = result95 + i * 16;var variant94 = e;
        switch (variant94.tag) {
          case 'int32': {
            const e = variant94.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant94.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant94.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant94.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr92= encodeRes.ptr;
            var len92 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len92, true);
            dataView(memory0).setUint32(base + 8, ptr92, true);
            break;
          }
          case 'blob': {
            const e = variant94.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val93 = e;
            var len93 = Array.isArray(val93) ? val93.length : val93.byteLength;
            var ptr93 = realloc0(0, 0, 1, len93 * 1);
            
            let valData93;
            const valLenBytes93 = len93 * 1;
            if (Array.isArray(val93)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv93 = new DataView(memory0.buffer);
              for (const v of val93) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv93.setUint8(ptr93+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData93 = new Uint8Array(val93.buffer || val93, val93.byteOffset, valLenBytes93);
              const out93 = new Uint8Array(memory0.buffer, ptr93, valLenBytes93);
              out93.set(valData93);
            }
            
            dataView(memory0).setUint32(base + 12, len93, true);
            dataView(memory0).setUint32(base + 8, ptr93, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant94.tag)}\` (received \`${variant94}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 16, len95, true);
      dataView(memory0).setUint32(ptr0 + 12, result95, true);
      break;
    }
    case 'd-free': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 24, true);
      var {synthDefNames: v96_0 } = e;
      var vec98 = v96_0;
      var len98 = vec98.length;
      var result98 = realloc0(0, 0, 4, len98 * 8);
      for (let i = 0; i < vec98.length; i++) {
        const e = vec98[i];
        const base = result98 + i * 8;
        var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
        var ptr97= encodeRes.ptr;
        var len97 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 4, len97, true);
        dataView(memory0).setUint32(base + 0, ptr97, true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len98, true);
      dataView(memory0).setUint32(ptr0 + 4, result98, true);
      break;
    }
    case 'd-load': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 25, true);
      var {pathnameOfFile: v99_0, completionMsg: v99_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v99_0, realloc0, memory0);
      var ptr100= encodeRes.ptr;
      var len100 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 8, len100, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr100, true);
      var variant102 = v99_1;
      if (variant102 === null || variant102=== undefined) {
        dataView(memory0).setInt8(ptr0 + 12, 0, true);
      } else {
        const e = variant102;
        dataView(memory0).setInt8(ptr0 + 12, 1, true);
        var val101 = e;
        var len101 = Array.isArray(val101) ? val101.length : val101.byteLength;
        var ptr101 = realloc0(0, 0, 1, len101 * 1);
        
        let valData101;
        const valLenBytes101 = len101 * 1;
        if (Array.isArray(val101)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv101 = new DataView(memory0.buffer);
          for (const v of val101) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv101.setUint8(ptr101+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData101 = new Uint8Array(val101.buffer || val101, val101.byteOffset, valLenBytes101);
          const out101 = new Uint8Array(memory0.buffer, ptr101, valLenBytes101);
          out101.set(valData101);
        }
        
        dataView(memory0).setUint32(ptr0 + 20, len101, true);
        dataView(memory0).setUint32(ptr0 + 16, ptr101, true);
      }
      break;
    }
    case 'd-load-dir': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 26, true);
      var {pathnameOfDirectory: v103_0, completionMsg: v103_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v103_0, realloc0, memory0);
      var ptr104= encodeRes.ptr;
      var len104 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 8, len104, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr104, true);
      var variant106 = v103_1;
      if (variant106 === null || variant106=== undefined) {
        dataView(memory0).setInt8(ptr0 + 12, 0, true);
      } else {
        const e = variant106;
        dataView(memory0).setInt8(ptr0 + 12, 1, true);
        var val105 = e;
        var len105 = Array.isArray(val105) ? val105.length : val105.byteLength;
        var ptr105 = realloc0(0, 0, 1, len105 * 1);
        
        let valData105;
        const valLenBytes105 = len105 * 1;
        if (Array.isArray(val105)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv105 = new DataView(memory0.buffer);
          for (const v of val105) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv105.setUint8(ptr105+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData105 = new Uint8Array(val105.buffer || val105, val105.byteOffset, valLenBytes105);
          const out105 = new Uint8Array(memory0.buffer, ptr105, valLenBytes105);
          out105.set(valData105);
        }
        
        dataView(memory0).setUint32(ptr0 + 20, len105, true);
        dataView(memory0).setUint32(ptr0 + 16, ptr105, true);
      }
      break;
    }
    case 'd-recv': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 27, true);
      var {bufferOfData: v107_0, completionMsg: v107_1 } = e;
      var val108 = v107_0;
      var len108 = Array.isArray(val108) ? val108.length : val108.byteLength;
      var ptr108 = realloc0(0, 0, 1, len108 * 1);
      
      let valData108;
      const valLenBytes108 = len108 * 1;
      if (Array.isArray(val108)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv108 = new DataView(memory0.buffer);
        for (const v of val108) {
          _requireValidNumericPrimitive.bind(null, 'u8')(v);
          dv108.setUint8(ptr108+ offset, v, true);
          offset += 1;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData108 = new Uint8Array(val108.buffer || val108, val108.byteOffset, valLenBytes108);
        const out108 = new Uint8Array(memory0.buffer, ptr108, valLenBytes108);
        out108.set(valData108);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len108, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr108, true);
      var variant110 = v107_1;
      if (variant110 === null || variant110=== undefined) {
        dataView(memory0).setInt8(ptr0 + 12, 0, true);
      } else {
        const e = variant110;
        dataView(memory0).setInt8(ptr0 + 12, 1, true);
        var val109 = e;
        var len109 = Array.isArray(val109) ? val109.length : val109.byteLength;
        var ptr109 = realloc0(0, 0, 1, len109 * 1);
        
        let valData109;
        const valLenBytes109 = len109 * 1;
        if (Array.isArray(val109)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv109 = new DataView(memory0.buffer);
          for (const v of val109) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv109.setUint8(ptr109+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData109 = new Uint8Array(val109.buffer || val109, val109.byteOffset, valLenBytes109);
          const out109 = new Uint8Array(memory0.buffer, ptr109, valLenBytes109);
          out109.set(valData109);
        }
        
        dataView(memory0).setUint32(ptr0 + 20, len109, true);
        dataView(memory0).setUint32(ptr0 + 16, ptr109, true);
      }
      break;
    }
    case 'dump-osc': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 28, true);
      var {code: v111_0 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v111_0), true);
      break;
    }
    case 'error': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 29, true);
      var {mode: v112_0 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v112_0), true);
      break;
    }
    case 'g-deep-free': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 30, true);
      var {groupIds: v113_0 } = e;
      var val114 = v113_0;
      var len114 = val114.length;
      var ptr114 = realloc0(0, 0, 4, len114 * 4);
      
      let valData114;
      const valLenBytes114 = len114 * 4;
      if (Array.isArray(val114)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv114 = new DataView(memory0.buffer);
        for (const v of val114) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv114.setInt32(ptr114+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData114 = new Uint8Array(val114.buffer || val114, val114.byteOffset, valLenBytes114);
        const out114 = new Uint8Array(memory0.buffer, ptr114, valLenBytes114);
        out114.set(valData114);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len114, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr114, true);
      break;
    }
    case 'g-dump-tree': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 31, true);
      var {tail: v115_0 } = e;
      var vec117 = v115_0;
      var len117 = vec117.length;
      var result117 = realloc0(0, 0, 4, len117 * 8);
      for (let i = 0; i < vec117.length; i++) {
        const e = vec117[i];
        const base = result117 + i * 8;var [tuple116_0, tuple116_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple116_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple116_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len117, true);
      dataView(memory0).setUint32(ptr0 + 4, result117, true);
      break;
    }
    case 'g-free-all': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 32, true);
      var {groupIds: v118_0 } = e;
      var val119 = v118_0;
      var len119 = val119.length;
      var ptr119 = realloc0(0, 0, 4, len119 * 4);
      
      let valData119;
      const valLenBytes119 = len119 * 4;
      if (Array.isArray(val119)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv119 = new DataView(memory0.buffer);
        for (const v of val119) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv119.setInt32(ptr119+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData119 = new Uint8Array(val119.buffer || val119, val119.byteOffset, valLenBytes119);
        const out119 = new Uint8Array(memory0.buffer, ptr119, valLenBytes119);
        out119.set(valData119);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len119, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr119, true);
      break;
    }
    case 'g-head': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 33, true);
      var {tail: v120_0 } = e;
      var vec122 = v120_0;
      var len122 = vec122.length;
      var result122 = realloc0(0, 0, 4, len122 * 8);
      for (let i = 0; i < vec122.length; i++) {
        const e = vec122[i];
        const base = result122 + i * 8;var [tuple121_0, tuple121_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple121_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple121_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len122, true);
      dataView(memory0).setUint32(ptr0 + 4, result122, true);
      break;
    }
    case 'g-new': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 34, true);
      var {tail: v123_0 } = e;
      var vec125 = v123_0;
      var len125 = vec125.length;
      var result125 = realloc0(0, 0, 4, len125 * 12);
      for (let i = 0; i < vec125.length; i++) {
        const e = vec125[i];
        const base = result125 + i * 12;var [tuple124_0, tuple124_1, tuple124_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple124_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple124_1), true);
        dataView(memory0).setInt32(base + 8, toInt32(tuple124_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len125, true);
      dataView(memory0).setUint32(ptr0 + 4, result125, true);
      break;
    }
    case 'g-query-tree': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 35, true);
      var {tail: v126_0 } = e;
      var vec128 = v126_0;
      var len128 = vec128.length;
      var result128 = realloc0(0, 0, 4, len128 * 8);
      for (let i = 0; i < vec128.length; i++) {
        const e = vec128[i];
        const base = result128 + i * 8;var [tuple127_0, tuple127_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple127_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple127_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len128, true);
      dataView(memory0).setUint32(ptr0 + 4, result128, true);
      break;
    }
    case 'g-tail': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 36, true);
      var {tail: v129_0 } = e;
      var vec131 = v129_0;
      var len131 = vec131.length;
      var result131 = realloc0(0, 0, 4, len131 * 8);
      for (let i = 0; i < vec131.length; i++) {
        const e = vec131[i];
        const base = result131 + i * 8;var [tuple130_0, tuple130_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple130_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple130_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len131, true);
      dataView(memory0).setUint32(ptr0 + 4, result131, true);
      break;
    }
    case 'n-after': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 37, true);
      var {tail: v132_0 } = e;
      var vec134 = v132_0;
      var len134 = vec134.length;
      var result134 = realloc0(0, 0, 4, len134 * 8);
      for (let i = 0; i < vec134.length; i++) {
        const e = vec134[i];
        const base = result134 + i * 8;var [tuple133_0, tuple133_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple133_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple133_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len134, true);
      dataView(memory0).setUint32(ptr0 + 4, result134, true);
      break;
    }
    case 'n-before': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 38, true);
      var {tail: v135_0 } = e;
      var vec137 = v135_0;
      var len137 = vec137.length;
      var result137 = realloc0(0, 0, 4, len137 * 8);
      for (let i = 0; i < vec137.length; i++) {
        const e = vec137[i];
        const base = result137 + i * 8;var [tuple136_0, tuple136_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple136_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple136_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len137, true);
      dataView(memory0).setUint32(ptr0 + 4, result137, true);
      break;
    }
    case 'n-fill': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 39, true);
      var {nodeId: v138_0, tail: v138_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v138_0), true);
      var vec143 = v138_1;
      var len143 = vec143.length;
      var result143 = realloc0(0, 0, 4, len143 * 24);
      for (let i = 0; i < vec143.length; i++) {
        const e = vec143[i];
        const base = result143 + i * 24;var [tuple139_0, tuple139_1, tuple139_2] = e;
        var variant141 = tuple139_0;
        switch (variant141.tag) {
          case 'index': {
            const e = variant141.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant141.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr140= encodeRes.ptr;
            var len140 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len140, true);
            dataView(memory0).setUint32(base + 4, ptr140, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant141.tag)}\` (received \`${variant141}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple139_1), true);
        var variant142 = tuple139_2;
        switch (variant142.tag) {
          case 'float': {
            const e = variant142.val;
            dataView(memory0).setInt8(base + 16, 0, true);
            dataView(memory0).setFloat32(base + 20, +e, true);
            break;
          }
          case 'int': {
            const e = variant142.val;
            dataView(memory0).setInt8(base + 16, 1, true);
            dataView(memory0).setInt32(base + 20, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant142.tag)}\` (received \`${variant142}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 12, len143, true);
      dataView(memory0).setUint32(ptr0 + 8, result143, true);
      break;
    }
    case 'n-free': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 40, true);
      var {nodeIds: v144_0 } = e;
      var val145 = v144_0;
      var len145 = val145.length;
      var ptr145 = realloc0(0, 0, 4, len145 * 4);
      
      let valData145;
      const valLenBytes145 = len145 * 4;
      if (Array.isArray(val145)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv145 = new DataView(memory0.buffer);
        for (const v of val145) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv145.setInt32(ptr145+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData145 = new Uint8Array(val145.buffer || val145, val145.byteOffset, valLenBytes145);
        const out145 = new Uint8Array(memory0.buffer, ptr145, valLenBytes145);
        out145.set(valData145);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len145, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr145, true);
      break;
    }
    case 'n-map': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 41, true);
      var {nodeId: v146_0, tail: v146_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v146_0), true);
      var vec150 = v146_1;
      var len150 = vec150.length;
      var result150 = realloc0(0, 0, 4, len150 * 16);
      for (let i = 0; i < vec150.length; i++) {
        const e = vec150[i];
        const base = result150 + i * 16;var [tuple147_0, tuple147_1] = e;
        var variant149 = tuple147_0;
        switch (variant149.tag) {
          case 'index': {
            const e = variant149.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant149.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr148= encodeRes.ptr;
            var len148 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len148, true);
            dataView(memory0).setUint32(base + 4, ptr148, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant149.tag)}\` (received \`${variant149}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple147_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len150, true);
      dataView(memory0).setUint32(ptr0 + 8, result150, true);
      break;
    }
    case 'n-mapa': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 42, true);
      var {nodeId: v151_0, tail: v151_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v151_0), true);
      var vec155 = v151_1;
      var len155 = vec155.length;
      var result155 = realloc0(0, 0, 4, len155 * 16);
      for (let i = 0; i < vec155.length; i++) {
        const e = vec155[i];
        const base = result155 + i * 16;var [tuple152_0, tuple152_1] = e;
        var variant154 = tuple152_0;
        switch (variant154.tag) {
          case 'index': {
            const e = variant154.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant154.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr153= encodeRes.ptr;
            var len153 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len153, true);
            dataView(memory0).setUint32(base + 4, ptr153, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant154.tag)}\` (received \`${variant154}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple152_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len155, true);
      dataView(memory0).setUint32(ptr0 + 8, result155, true);
      break;
    }
    case 'n-mapan': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 43, true);
      var {nodeId: v156_0, tail: v156_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v156_0), true);
      var vec160 = v156_1;
      var len160 = vec160.length;
      var result160 = realloc0(0, 0, 4, len160 * 20);
      for (let i = 0; i < vec160.length; i++) {
        const e = vec160[i];
        const base = result160 + i * 20;var [tuple157_0, tuple157_1, tuple157_2] = e;
        var variant159 = tuple157_0;
        switch (variant159.tag) {
          case 'index': {
            const e = variant159.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant159.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr158= encodeRes.ptr;
            var len158 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len158, true);
            dataView(memory0).setUint32(base + 4, ptr158, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant159.tag)}\` (received \`${variant159}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple157_1), true);
        dataView(memory0).setInt32(base + 16, toInt32(tuple157_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len160, true);
      dataView(memory0).setUint32(ptr0 + 8, result160, true);
      break;
    }
    case 'n-mapn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 44, true);
      var {nodeId: v161_0, tail: v161_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v161_0), true);
      var vec165 = v161_1;
      var len165 = vec165.length;
      var result165 = realloc0(0, 0, 4, len165 * 20);
      for (let i = 0; i < vec165.length; i++) {
        const e = vec165[i];
        const base = result165 + i * 20;var [tuple162_0, tuple162_1, tuple162_2] = e;
        var variant164 = tuple162_0;
        switch (variant164.tag) {
          case 'index': {
            const e = variant164.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant164.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr163= encodeRes.ptr;
            var len163 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len163, true);
            dataView(memory0).setUint32(base + 4, ptr163, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant164.tag)}\` (received \`${variant164}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple162_1), true);
        dataView(memory0).setInt32(base + 16, toInt32(tuple162_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len165, true);
      dataView(memory0).setUint32(ptr0 + 8, result165, true);
      break;
    }
    case 'n-order': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 45, true);
      var {addAction: v166_0, targetId: v166_1, nodeIds: v166_2 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v166_0), true);
      dataView(memory0).setInt32(ptr0 + 8, toInt32(v166_1), true);
      var val167 = v166_2;
      var len167 = val167.length;
      var ptr167 = realloc0(0, 0, 4, len167 * 4);
      
      let valData167;
      const valLenBytes167 = len167 * 4;
      if (Array.isArray(val167)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv167 = new DataView(memory0.buffer);
        for (const v of val167) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv167.setInt32(ptr167+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData167 = new Uint8Array(val167.buffer || val167, val167.byteOffset, valLenBytes167);
        const out167 = new Uint8Array(memory0.buffer, ptr167, valLenBytes167);
        out167.set(valData167);
      }
      
      dataView(memory0).setUint32(ptr0 + 16, len167, true);
      dataView(memory0).setUint32(ptr0 + 12, ptr167, true);
      break;
    }
    case 'n-query': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 46, true);
      var {nodeIds: v168_0 } = e;
      var val169 = v168_0;
      var len169 = val169.length;
      var ptr169 = realloc0(0, 0, 4, len169 * 4);
      
      let valData169;
      const valLenBytes169 = len169 * 4;
      if (Array.isArray(val169)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv169 = new DataView(memory0.buffer);
        for (const v of val169) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv169.setInt32(ptr169+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData169 = new Uint8Array(val169.buffer || val169, val169.byteOffset, valLenBytes169);
        const out169 = new Uint8Array(memory0.buffer, ptr169, valLenBytes169);
        out169.set(valData169);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len169, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr169, true);
      break;
    }
    case 'n-run': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 47, true);
      var {tail: v170_0 } = e;
      var vec172 = v170_0;
      var len172 = vec172.length;
      var result172 = realloc0(0, 0, 4, len172 * 8);
      for (let i = 0; i < vec172.length; i++) {
        const e = vec172[i];
        const base = result172 + i * 8;var [tuple171_0, tuple171_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple171_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple171_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len172, true);
      dataView(memory0).setUint32(ptr0 + 4, result172, true);
      break;
    }
    case 'n-set': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 48, true);
      var {nodeId: v173_0, tail: v173_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v173_0), true);
      var vec178 = v173_1;
      var len178 = vec178.length;
      var result178 = realloc0(0, 0, 4, len178 * 20);
      for (let i = 0; i < vec178.length; i++) {
        const e = vec178[i];
        const base = result178 + i * 20;var [tuple174_0, tuple174_1] = e;
        var variant176 = tuple174_0;
        switch (variant176.tag) {
          case 'index': {
            const e = variant176.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant176.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr175= encodeRes.ptr;
            var len175 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len175, true);
            dataView(memory0).setUint32(base + 4, ptr175, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant176.tag)}\` (received \`${variant176}\`) specified for \`ControlId\``);
          }
        }
        var variant177 = tuple174_1;
        switch (variant177.tag) {
          case 'float': {
            const e = variant177.val;
            dataView(memory0).setInt8(base + 12, 0, true);
            dataView(memory0).setFloat32(base + 16, +e, true);
            break;
          }
          case 'int': {
            const e = variant177.val;
            dataView(memory0).setInt8(base + 12, 1, true);
            dataView(memory0).setInt32(base + 16, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant177.tag)}\` (received \`${variant177}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 12, len178, true);
      dataView(memory0).setUint32(ptr0 + 8, result178, true);
      break;
    }
    case 'n-setn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 49, true);
      var {nodeId: v179_0, tail: v179_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v179_0), true);
      var vec185 = v179_1;
      var len185 = vec185.length;
      var result185 = realloc0(0, 0, 4, len185 * 20);
      for (let i = 0; i < vec185.length; i++) {
        const e = vec185[i];
        const base = result185 + i * 20;var [tuple180_0, tuple180_1] = e;
        var variant182 = tuple180_0;
        switch (variant182.tag) {
          case 'index': {
            const e = variant182.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant182.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr181= encodeRes.ptr;
            var len181 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len181, true);
            dataView(memory0).setUint32(base + 4, ptr181, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant182.tag)}\` (received \`${variant182}\`) specified for \`ControlId\``);
          }
        }
        var vec184 = tuple180_1;
        var len184 = vec184.length;
        var result184 = realloc0(0, 0, 4, len184 * 8);
        for (let i = 0; i < vec184.length; i++) {
          const e = vec184[i];
          const base = result184 + i * 8;var variant183 = e;
          switch (variant183.tag) {
            case 'float': {
              const e = variant183.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setFloat32(base + 4, +e, true);
              break;
            }
            case 'int': {
              const e = variant183.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant183.tag)}\` (received \`${variant183}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 16, len184, true);
        dataView(memory0).setUint32(base + 12, result184, true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len185, true);
      dataView(memory0).setUint32(ptr0 + 8, result185, true);
      break;
    }
    case 'n-trace': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 50, true);
      var {nodeIds: v186_0 } = e;
      var val187 = v186_0;
      var len187 = val187.length;
      var ptr187 = realloc0(0, 0, 4, len187 * 4);
      
      let valData187;
      const valLenBytes187 = len187 * 4;
      if (Array.isArray(val187)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv187 = new DataView(memory0.buffer);
        for (const v of val187) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv187.setInt32(ptr187+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData187 = new Uint8Array(val187.buffer || val187, val187.byteOffset, valLenBytes187);
        const out187 = new Uint8Array(memory0.buffer, ptr187, valLenBytes187);
        out187.set(valData187);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len187, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr187, true);
      break;
    }
    case 'notify': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 51, true);
      var {enable: v188_0, clientId: v188_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v188_0), true);
      var variant189 = v188_1;
      if (variant189 === null || variant189=== undefined) {
        dataView(memory0).setInt8(ptr0 + 8, 0, true);
      } else {
        const e = variant189;
        dataView(memory0).setInt8(ptr0 + 8, 1, true);
        dataView(memory0).setInt32(ptr0 + 12, toInt32(e), true);
      }
      break;
    }
    case 'nrt-end': {
      dataView(memory0).setInt8(ptr0 + 0, 52, true);
      break;
    }
    case 'p-new': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 53, true);
      var {tail: v190_0 } = e;
      var vec192 = v190_0;
      var len192 = vec192.length;
      var result192 = realloc0(0, 0, 4, len192 * 12);
      for (let i = 0; i < vec192.length; i++) {
        const e = vec192[i];
        const base = result192 + i * 12;var [tuple191_0, tuple191_1, tuple191_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple191_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple191_1), true);
        dataView(memory0).setInt32(base + 8, toInt32(tuple191_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 8, len192, true);
      dataView(memory0).setUint32(ptr0 + 4, result192, true);
      break;
    }
    case 'quit': {
      dataView(memory0).setInt8(ptr0 + 0, 54, true);
      break;
    }
    case 'rt-memory-status': {
      dataView(memory0).setInt8(ptr0 + 0, 55, true);
      break;
    }
    case 's-get': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 56, true);
      var {nodeId: v193_0, controls: v193_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v193_0), true);
      var vec196 = v193_1;
      var len196 = vec196.length;
      var result196 = realloc0(0, 0, 4, len196 * 12);
      for (let i = 0; i < vec196.length; i++) {
        const e = vec196[i];
        const base = result196 + i * 12;var variant195 = e;
        switch (variant195.tag) {
          case 'index': {
            const e = variant195.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant195.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr194= encodeRes.ptr;
            var len194 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len194, true);
            dataView(memory0).setUint32(base + 4, ptr194, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant195.tag)}\` (received \`${variant195}\`) specified for \`ControlId\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 12, len196, true);
      dataView(memory0).setUint32(ptr0 + 8, result196, true);
      break;
    }
    case 's-getn': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 57, true);
      var {nodeId: v197_0, tail: v197_1 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v197_0), true);
      var vec201 = v197_1;
      var len201 = vec201.length;
      var result201 = realloc0(0, 0, 4, len201 * 16);
      for (let i = 0; i < vec201.length; i++) {
        const e = vec201[i];
        const base = result201 + i * 16;var [tuple198_0, tuple198_1] = e;
        var variant200 = tuple198_0;
        switch (variant200.tag) {
          case 'index': {
            const e = variant200.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant200.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr199= encodeRes.ptr;
            var len199 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len199, true);
            dataView(memory0).setUint32(base + 4, ptr199, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant200.tag)}\` (received \`${variant200}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple198_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 12, len201, true);
      dataView(memory0).setUint32(ptr0 + 8, result201, true);
      break;
    }
    case 's-new': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 58, true);
      var {defName: v202_0, nodeId: v202_1, addAction: v202_2, targetId: v202_3, tail: v202_4 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v202_0, realloc0, memory0);
      var ptr203= encodeRes.ptr;
      var len203 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 8, len203, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr203, true);
      dataView(memory0).setInt32(ptr0 + 12, toInt32(v202_1), true);
      dataView(memory0).setInt32(ptr0 + 16, toInt32(v202_2), true);
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v202_3), true);
      var vec209 = v202_4;
      var len209 = vec209.length;
      var result209 = realloc0(0, 0, 4, len209 * 24);
      for (let i = 0; i < vec209.length; i++) {
        const e = vec209[i];
        const base = result209 + i * 24;var [tuple204_0, tuple204_1] = e;
        var variant206 = tuple204_0;
        switch (variant206.tag) {
          case 'index': {
            const e = variant206.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant206.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr205= encodeRes.ptr;
            var len205 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len205, true);
            dataView(memory0).setUint32(base + 4, ptr205, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant206.tag)}\` (received \`${variant206}\`) specified for \`ControlId\``);
          }
        }
        var variant208 = tuple204_1;
        switch (variant208.tag) {
          case 'float': {
            const e = variant208.val;
            dataView(memory0).setInt8(base + 12, 0, true);
            dataView(memory0).setFloat32(base + 16, +e, true);
            break;
          }
          case 'int': {
            const e = variant208.val;
            dataView(memory0).setInt8(base + 12, 1, true);
            dataView(memory0).setInt32(base + 16, toInt32(e), true);
            break;
          }
          case 'bus': {
            const e = variant208.val;
            dataView(memory0).setInt8(base + 12, 2, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr207= encodeRes.ptr;
            var len207 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 20, len207, true);
            dataView(memory0).setUint32(base + 16, ptr207, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant208.tag)}\` (received \`${variant208}\`) specified for \`ControlValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 28, len209, true);
      dataView(memory0).setUint32(ptr0 + 24, result209, true);
      break;
    }
    case 's-noid': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 59, true);
      var {synthIds: v210_0 } = e;
      var val211 = v210_0;
      var len211 = val211.length;
      var ptr211 = realloc0(0, 0, 4, len211 * 4);
      
      let valData211;
      const valLenBytes211 = len211 * 4;
      if (Array.isArray(val211)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv211 = new DataView(memory0.buffer);
        for (const v of val211) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv211.setInt32(ptr211+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData211 = new Uint8Array(val211.buffer || val211, val211.byteOffset, valLenBytes211);
        const out211 = new Uint8Array(memory0.buffer, ptr211, valLenBytes211);
        out211.set(valData211);
      }
      
      dataView(memory0).setUint32(ptr0 + 8, len211, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr211, true);
      break;
    }
    case 'scope-subscribe': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 60, true);
      var {subId: v212_0, scope: v212_1, channels: v212_2, chunkSize: v212_3 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v212_0), true);
      dataView(memory0).setInt32(ptr0 + 8, toInt32(v212_1), true);
      dataView(memory0).setInt32(ptr0 + 12, toInt32(v212_2), true);
      dataView(memory0).setInt32(ptr0 + 16, toInt32(v212_3), true);
      break;
    }
    case 'scope-unsubscribe': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 61, true);
      var {subId: v213_0 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v213_0), true);
      break;
    }
    case 'status': {
      dataView(memory0).setInt8(ptr0 + 0, 62, true);
      break;
    }
    case 'sync': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 63, true);
      var {aUniqueNumber: v214_0 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v214_0), true);
      break;
    }
    case 'u-cmd': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 64, true);
      var {nodeId: v215_0, unitGeneratorIndex: v215_1, cmd: v215_2, anyArguments: v215_3 } = e;
      dataView(memory0).setInt32(ptr0 + 4, toInt32(v215_0), true);
      dataView(memory0).setInt32(ptr0 + 8, toInt32(v215_1), true);
      
      var encodeRes = _utf8AllocateAndEncode(v215_2, realloc0, memory0);
      var ptr216= encodeRes.ptr;
      var len216 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 16, len216, true);
      dataView(memory0).setUint32(ptr0 + 12, ptr216, true);
      var vec220 = v215_3;
      var len220 = vec220.length;
      var result220 = realloc0(0, 0, 8, len220 * 16);
      for (let i = 0; i < vec220.length; i++) {
        const e = vec220[i];
        const base = result220 + i * 16;var variant219 = e;
        switch (variant219.tag) {
          case 'int32': {
            const e = variant219.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant219.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant219.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant219.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr217= encodeRes.ptr;
            var len217 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len217, true);
            dataView(memory0).setUint32(base + 8, ptr217, true);
            break;
          }
          case 'blob': {
            const e = variant219.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val218 = e;
            var len218 = Array.isArray(val218) ? val218.length : val218.byteLength;
            var ptr218 = realloc0(0, 0, 1, len218 * 1);
            
            let valData218;
            const valLenBytes218 = len218 * 1;
            if (Array.isArray(val218)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv218 = new DataView(memory0.buffer);
              for (const v of val218) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv218.setUint8(ptr218+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData218 = new Uint8Array(val218.buffer || val218, val218.byteOffset, valLenBytes218);
              const out218 = new Uint8Array(memory0.buffer, ptr218, valLenBytes218);
              out218.set(valData218);
            }
            
            dataView(memory0).setUint32(base + 12, len218, true);
            dataView(memory0).setUint32(base + 8, ptr218, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant219.tag)}\` (received \`${variant219}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 24, len220, true);
      dataView(memory0).setUint32(ptr0 + 20, result220, true);
      break;
    }
    case 'version': {
      dataView(memory0).setInt8(ptr0 + 0, 65, true);
      break;
    }
    case 'other': {
      const e = variant227.val;
      dataView(memory0).setInt8(ptr0 + 0, 66, true);
      var {address: v221_0, args: v221_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v221_0, realloc0, memory0);
      var ptr222= encodeRes.ptr;
      var len222 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 8, len222, true);
      dataView(memory0).setUint32(ptr0 + 4, ptr222, true);
      var vec226 = v221_1;
      var len226 = vec226.length;
      var result226 = realloc0(0, 0, 8, len226 * 16);
      for (let i = 0; i < vec226.length; i++) {
        const e = vec226[i];
        const base = result226 + i * 16;var variant225 = e;
        switch (variant225.tag) {
          case 'int32': {
            const e = variant225.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant225.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant225.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant225.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr223= encodeRes.ptr;
            var len223 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len223, true);
            dataView(memory0).setUint32(base + 8, ptr223, true);
            break;
          }
          case 'blob': {
            const e = variant225.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val224 = e;
            var len224 = Array.isArray(val224) ? val224.length : val224.byteLength;
            var ptr224 = realloc0(0, 0, 1, len224 * 1);
            
            let valData224;
            const valLenBytes224 = len224 * 1;
            if (Array.isArray(val224)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv224 = new DataView(memory0.buffer);
              for (const v of val224) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv224.setUint8(ptr224+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData224 = new Uint8Array(val224.buffer || val224, val224.byteOffset, valLenBytes224);
              const out224 = new Uint8Array(memory0.buffer, ptr224, valLenBytes224);
              out224.set(valData224);
            }
            
            dataView(memory0).setUint32(base + 12, len224, true);
            dataView(memory0).setUint32(base + 8, ptr224, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant225.tag)}\` (received \`${variant225}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 16, len226, true);
      dataView(memory0).setUint32(ptr0 + 12, result226, true);
      break;
    }
    default: {
      throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant227.tag)}\` (received \`${variant227}\`) specified for \`ServerMessage\``);
    }
  }
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="encode"][Instruction::CallWasm] enter', {
    funcName: 'encode',
    paramCount: 1,
    async: false,
    postReturn: true,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'commands010Encode',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'throw-result-err',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => commands010Encode(ptr0),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  let variant230;
  switch (dataView(memory0).getUint8(ret + 0, true)) {
    case 0: {
      var ptr228 = dataView(memory0).getUint32(ret + 4, true);
      var len228 = dataView(memory0).getUint32(ret + 8, true);
      var result228 = new Uint8Array(memory0.buffer.slice(ptr228, ptr228 + len228 * 1));
      variant230= {
        tag: 'ok',
        val: result228
      };
      break;
    }
    case 1: {
      var ptr229 = dataView(memory0).getUint32(ret + 4, true);
      var len229 = dataView(memory0).getUint32(ret + 8, true);
      var result229 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr229, len229));
      variant230= {
        tag: 'err',
        val: result229
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="encode"][Instruction::Return]', {
    funcName: 'encode',
    paramCount: 1,
    async: false,
    postReturn: true
  });
  const retCopy = variant230;
  task.resolve([retCopy.val]);
  
  let cstate = getOrCreateAsyncState(0);
  cstate.mayLeave = false;
  postReturn0(ret);
  cstate.mayLeave = true;
  task.exit();
  
  
  
  if (typeof retCopy === 'object' && retCopy.tag === 'err') {
    throw new ComponentError(retCopy.val);
  }
  return retCopy.val;
  
}
let commands010EncodeBatch;

function encodeBatch(arg0) {
  var vec227 = arg0;
  var len227 = vec227.length;
  var result227 = realloc0(0, 0, 4, len227 * 68);
  for (let i = 0; i < vec227.length; i++) {
    const e = vec227[i];
    const base = result227 + i * 68;var variant226 = e;
    switch (variant226.tag) {
      case 'b-alloc': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 0, true);
        var {bufnum: v0_0, numFrames: v0_1, numChannels: v0_2, completionMsg: v0_3, sampleRate: v0_4 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v0_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v0_1), true);
        var variant1 = v0_2;
        if (variant1 === null || variant1=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant1;
          dataView(memory0).setInt8(base + 12, 1, true);
          dataView(memory0).setInt32(base + 16, toInt32(e), true);
        }
        var variant3 = v0_3;
        if (variant3 === null || variant3=== undefined) {
          dataView(memory0).setInt8(base + 20, 0, true);
        } else {
          const e = variant3;
          dataView(memory0).setInt8(base + 20, 1, true);
          var val2 = e;
          var len2 = Array.isArray(val2) ? val2.length : val2.byteLength;
          var ptr2 = realloc0(0, 0, 1, len2 * 1);
          
          let valData2;
          const valLenBytes2 = len2 * 1;
          if (Array.isArray(val2)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv2 = new DataView(memory0.buffer);
            for (const v of val2) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv2.setUint8(ptr2+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData2 = new Uint8Array(val2.buffer || val2, val2.byteOffset, valLenBytes2);
            const out2 = new Uint8Array(memory0.buffer, ptr2, valLenBytes2);
            out2.set(valData2);
          }
          
          dataView(memory0).setUint32(base + 28, len2, true);
          dataView(memory0).setUint32(base + 24, ptr2, true);
        }
        var variant4 = v0_4;
        if (variant4 === null || variant4=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant4;
          dataView(memory0).setInt8(base + 32, 1, true);
          dataView(memory0).setFloat32(base + 36, +e, true);
        }
        break;
      }
      case 'b-alloc-read': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 1, true);
        var {bufnum: v5_0, path: v5_1, startFrame: v5_2, numberOfFrames: v5_3, completionMsg: v5_4 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v5_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v5_1, realloc0, memory0);
        var ptr6= encodeRes.ptr;
        var len6 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len6, true);
        dataView(memory0).setUint32(base + 8, ptr6, true);
        var variant7 = v5_2;
        if (variant7 === null || variant7=== undefined) {
          dataView(memory0).setInt8(base + 16, 0, true);
        } else {
          const e = variant7;
          dataView(memory0).setInt8(base + 16, 1, true);
          dataView(memory0).setInt32(base + 20, toInt32(e), true);
        }
        var variant8 = v5_3;
        if (variant8 === null || variant8=== undefined) {
          dataView(memory0).setInt8(base + 24, 0, true);
        } else {
          const e = variant8;
          dataView(memory0).setInt8(base + 24, 1, true);
          dataView(memory0).setInt32(base + 28, toInt32(e), true);
        }
        var variant10 = v5_4;
        if (variant10 === null || variant10=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant10;
          dataView(memory0).setInt8(base + 32, 1, true);
          var val9 = e;
          var len9 = Array.isArray(val9) ? val9.length : val9.byteLength;
          var ptr9 = realloc0(0, 0, 1, len9 * 1);
          
          let valData9;
          const valLenBytes9 = len9 * 1;
          if (Array.isArray(val9)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv9 = new DataView(memory0.buffer);
            for (const v of val9) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv9.setUint8(ptr9+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData9 = new Uint8Array(val9.buffer || val9, val9.byteOffset, valLenBytes9);
            const out9 = new Uint8Array(memory0.buffer, ptr9, valLenBytes9);
            out9.set(valData9);
          }
          
          dataView(memory0).setUint32(base + 40, len9, true);
          dataView(memory0).setUint32(base + 36, ptr9, true);
        }
        break;
      }
      case 'b-alloc-read-channel': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 2, true);
        var {bufnum: v11_0, path: v11_1, startFrame: v11_2, numberOfFrames: v11_3, channels: v11_4, completionMsg: v11_5 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v11_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v11_1, realloc0, memory0);
        var ptr12= encodeRes.ptr;
        var len12 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len12, true);
        dataView(memory0).setUint32(base + 8, ptr12, true);
        dataView(memory0).setInt32(base + 16, toInt32(v11_2), true);
        dataView(memory0).setInt32(base + 20, toInt32(v11_3), true);
        var val13 = v11_4;
        var len13 = val13.length;
        var ptr13 = realloc0(0, 0, 4, len13 * 4);
        
        let valData13;
        const valLenBytes13 = len13 * 4;
        if (Array.isArray(val13)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv13 = new DataView(memory0.buffer);
          for (const v of val13) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv13.setInt32(ptr13+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData13 = new Uint8Array(val13.buffer || val13, val13.byteOffset, valLenBytes13);
          const out13 = new Uint8Array(memory0.buffer, ptr13, valLenBytes13);
          out13.set(valData13);
        }
        
        dataView(memory0).setUint32(base + 28, len13, true);
        dataView(memory0).setUint32(base + 24, ptr13, true);
        var variant15 = v11_5;
        if (variant15 === null || variant15=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant15;
          dataView(memory0).setInt8(base + 32, 1, true);
          var val14 = e;
          var len14 = Array.isArray(val14) ? val14.length : val14.byteLength;
          var ptr14 = realloc0(0, 0, 1, len14 * 1);
          
          let valData14;
          const valLenBytes14 = len14 * 1;
          if (Array.isArray(val14)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv14 = new DataView(memory0.buffer);
            for (const v of val14) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv14.setUint8(ptr14+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData14 = new Uint8Array(val14.buffer || val14, val14.byteOffset, valLenBytes14);
            const out14 = new Uint8Array(memory0.buffer, ptr14, valLenBytes14);
            out14.set(valData14);
          }
          
          dataView(memory0).setUint32(base + 40, len14, true);
          dataView(memory0).setUint32(base + 36, ptr14, true);
        }
        break;
      }
      case 'b-close': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 3, true);
        var {bufnum: v16_0, completionMsg: v16_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v16_0), true);
        var variant18 = v16_1;
        if (variant18 === null || variant18=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant18;
          dataView(memory0).setInt8(base + 8, 1, true);
          var val17 = e;
          var len17 = Array.isArray(val17) ? val17.length : val17.byteLength;
          var ptr17 = realloc0(0, 0, 1, len17 * 1);
          
          let valData17;
          const valLenBytes17 = len17 * 1;
          if (Array.isArray(val17)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv17 = new DataView(memory0.buffer);
            for (const v of val17) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv17.setUint8(ptr17+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData17 = new Uint8Array(val17.buffer || val17, val17.byteOffset, valLenBytes17);
            const out17 = new Uint8Array(memory0.buffer, ptr17, valLenBytes17);
            out17.set(valData17);
          }
          
          dataView(memory0).setUint32(base + 16, len17, true);
          dataView(memory0).setUint32(base + 12, ptr17, true);
        }
        break;
      }
      case 'b-fill': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 4, true);
        var {bufnum: v19_0, tail: v19_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v19_0), true);
        var vec21 = v19_1;
        var len21 = vec21.length;
        var result21 = realloc0(0, 0, 4, len21 * 12);
        for (let i = 0; i < vec21.length; i++) {
          const e = vec21[i];
          const base = result21 + i * 12;var [tuple20_0, tuple20_1, tuple20_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple20_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple20_1), true);
          dataView(memory0).setFloat32(base + 8, +tuple20_2, true);
        }
        dataView(memory0).setUint32(base + 12, len21, true);
        dataView(memory0).setUint32(base + 8, result21, true);
        break;
      }
      case 'b-free': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 5, true);
        var {bufnum: v22_0, completionMsg: v22_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v22_0), true);
        var variant24 = v22_1;
        if (variant24 === null || variant24=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant24;
          dataView(memory0).setInt8(base + 8, 1, true);
          var val23 = e;
          var len23 = Array.isArray(val23) ? val23.length : val23.byteLength;
          var ptr23 = realloc0(0, 0, 1, len23 * 1);
          
          let valData23;
          const valLenBytes23 = len23 * 1;
          if (Array.isArray(val23)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv23 = new DataView(memory0.buffer);
            for (const v of val23) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv23.setUint8(ptr23+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData23 = new Uint8Array(val23.buffer || val23, val23.byteOffset, valLenBytes23);
            const out23 = new Uint8Array(memory0.buffer, ptr23, valLenBytes23);
            out23.set(valData23);
          }
          
          dataView(memory0).setUint32(base + 16, len23, true);
          dataView(memory0).setUint32(base + 12, ptr23, true);
        }
        break;
      }
      case 'b-gen': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 6, true);
        var {bufnum: v25_0, cmd: v25_1, commandArguments: v25_2 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v25_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v25_1, realloc0, memory0);
        var ptr26= encodeRes.ptr;
        var len26 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len26, true);
        dataView(memory0).setUint32(base + 8, ptr26, true);
        var vec30 = v25_2;
        var len30 = vec30.length;
        var result30 = realloc0(0, 0, 8, len30 * 16);
        for (let i = 0; i < vec30.length; i++) {
          const e = vec30[i];
          const base = result30 + i * 16;var variant29 = e;
          switch (variant29.tag) {
            case 'int32': {
              const e = variant29.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant29.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant29.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant29.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr27= encodeRes.ptr;
              var len27 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len27, true);
              dataView(memory0).setUint32(base + 8, ptr27, true);
              break;
            }
            case 'blob': {
              const e = variant29.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val28 = e;
              var len28 = Array.isArray(val28) ? val28.length : val28.byteLength;
              var ptr28 = realloc0(0, 0, 1, len28 * 1);
              
              let valData28;
              const valLenBytes28 = len28 * 1;
              if (Array.isArray(val28)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv28 = new DataView(memory0.buffer);
                for (const v of val28) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv28.setUint8(ptr28+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData28 = new Uint8Array(val28.buffer || val28, val28.byteOffset, valLenBytes28);
                const out28 = new Uint8Array(memory0.buffer, ptr28, valLenBytes28);
                out28.set(valData28);
              }
              
              dataView(memory0).setUint32(base + 12, len28, true);
              dataView(memory0).setUint32(base + 8, ptr28, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant29.tag)}\` (received \`${variant29}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 20, len30, true);
        dataView(memory0).setUint32(base + 16, result30, true);
        break;
      }
      case 'b-get': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 7, true);
        var {bufnum: v31_0, sampleIndices: v31_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v31_0), true);
        var val32 = v31_1;
        var len32 = val32.length;
        var ptr32 = realloc0(0, 0, 4, len32 * 4);
        
        let valData32;
        const valLenBytes32 = len32 * 4;
        if (Array.isArray(val32)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv32 = new DataView(memory0.buffer);
          for (const v of val32) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv32.setInt32(ptr32+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData32 = new Uint8Array(val32.buffer || val32, val32.byteOffset, valLenBytes32);
          const out32 = new Uint8Array(memory0.buffer, ptr32, valLenBytes32);
          out32.set(valData32);
        }
        
        dataView(memory0).setUint32(base + 12, len32, true);
        dataView(memory0).setUint32(base + 8, ptr32, true);
        break;
      }
      case 'b-getn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 8, true);
        var {bufnum: v33_0, tail: v33_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v33_0), true);
        var vec35 = v33_1;
        var len35 = vec35.length;
        var result35 = realloc0(0, 0, 4, len35 * 8);
        for (let i = 0; i < vec35.length; i++) {
          const e = vec35[i];
          const base = result35 + i * 8;var [tuple34_0, tuple34_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple34_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple34_1), true);
        }
        dataView(memory0).setUint32(base + 12, len35, true);
        dataView(memory0).setUint32(base + 8, result35, true);
        break;
      }
      case 'b-query': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 9, true);
        var {bufnums: v36_0 } = e;
        var val37 = v36_0;
        var len37 = val37.length;
        var ptr37 = realloc0(0, 0, 4, len37 * 4);
        
        let valData37;
        const valLenBytes37 = len37 * 4;
        if (Array.isArray(val37)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv37 = new DataView(memory0.buffer);
          for (const v of val37) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv37.setInt32(ptr37+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData37 = new Uint8Array(val37.buffer || val37, val37.byteOffset, valLenBytes37);
          const out37 = new Uint8Array(memory0.buffer, ptr37, valLenBytes37);
          out37.set(valData37);
        }
        
        dataView(memory0).setUint32(base + 8, len37, true);
        dataView(memory0).setUint32(base + 4, ptr37, true);
        break;
      }
      case 'b-read': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 10, true);
        var {bufnum: v38_0, path: v38_1, startFrame: v38_2, numberOfFrames: v38_3, startingFrame: v38_4, leaveFileOpen: v38_5, completionMsg: v38_6 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v38_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v38_1, realloc0, memory0);
        var ptr39= encodeRes.ptr;
        var len39 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len39, true);
        dataView(memory0).setUint32(base + 8, ptr39, true);
        var variant40 = v38_2;
        if (variant40 === null || variant40=== undefined) {
          dataView(memory0).setInt8(base + 16, 0, true);
        } else {
          const e = variant40;
          dataView(memory0).setInt8(base + 16, 1, true);
          dataView(memory0).setInt32(base + 20, toInt32(e), true);
        }
        var variant41 = v38_3;
        if (variant41 === null || variant41=== undefined) {
          dataView(memory0).setInt8(base + 24, 0, true);
        } else {
          const e = variant41;
          dataView(memory0).setInt8(base + 24, 1, true);
          dataView(memory0).setInt32(base + 28, toInt32(e), true);
        }
        var variant42 = v38_4;
        if (variant42 === null || variant42=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant42;
          dataView(memory0).setInt8(base + 32, 1, true);
          dataView(memory0).setInt32(base + 36, toInt32(e), true);
        }
        var variant43 = v38_5;
        if (variant43 === null || variant43=== undefined) {
          dataView(memory0).setInt8(base + 40, 0, true);
        } else {
          const e = variant43;
          dataView(memory0).setInt8(base + 40, 1, true);
          dataView(memory0).setInt32(base + 44, toInt32(e), true);
        }
        var variant45 = v38_6;
        if (variant45 === null || variant45=== undefined) {
          dataView(memory0).setInt8(base + 48, 0, true);
        } else {
          const e = variant45;
          dataView(memory0).setInt8(base + 48, 1, true);
          var val44 = e;
          var len44 = Array.isArray(val44) ? val44.length : val44.byteLength;
          var ptr44 = realloc0(0, 0, 1, len44 * 1);
          
          let valData44;
          const valLenBytes44 = len44 * 1;
          if (Array.isArray(val44)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv44 = new DataView(memory0.buffer);
            for (const v of val44) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv44.setUint8(ptr44+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData44 = new Uint8Array(val44.buffer || val44, val44.byteOffset, valLenBytes44);
            const out44 = new Uint8Array(memory0.buffer, ptr44, valLenBytes44);
            out44.set(valData44);
          }
          
          dataView(memory0).setUint32(base + 56, len44, true);
          dataView(memory0).setUint32(base + 52, ptr44, true);
        }
        break;
      }
      case 'b-read-channel': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 11, true);
        var {bufnum: v46_0, path: v46_1, startFrame: v46_2, numberOfFrames: v46_3, startingFrame: v46_4, leaveFileOpen: v46_5, channels: v46_6, completionMsg: v46_7 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v46_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v46_1, realloc0, memory0);
        var ptr47= encodeRes.ptr;
        var len47 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len47, true);
        dataView(memory0).setUint32(base + 8, ptr47, true);
        dataView(memory0).setInt32(base + 16, toInt32(v46_2), true);
        dataView(memory0).setInt32(base + 20, toInt32(v46_3), true);
        dataView(memory0).setInt32(base + 24, toInt32(v46_4), true);
        dataView(memory0).setInt32(base + 28, toInt32(v46_5), true);
        var val48 = v46_6;
        var len48 = val48.length;
        var ptr48 = realloc0(0, 0, 4, len48 * 4);
        
        let valData48;
        const valLenBytes48 = len48 * 4;
        if (Array.isArray(val48)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv48 = new DataView(memory0.buffer);
          for (const v of val48) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv48.setInt32(ptr48+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData48 = new Uint8Array(val48.buffer || val48, val48.byteOffset, valLenBytes48);
          const out48 = new Uint8Array(memory0.buffer, ptr48, valLenBytes48);
          out48.set(valData48);
        }
        
        dataView(memory0).setUint32(base + 36, len48, true);
        dataView(memory0).setUint32(base + 32, ptr48, true);
        var variant50 = v46_7;
        if (variant50 === null || variant50=== undefined) {
          dataView(memory0).setInt8(base + 40, 0, true);
        } else {
          const e = variant50;
          dataView(memory0).setInt8(base + 40, 1, true);
          var val49 = e;
          var len49 = Array.isArray(val49) ? val49.length : val49.byteLength;
          var ptr49 = realloc0(0, 0, 1, len49 * 1);
          
          let valData49;
          const valLenBytes49 = len49 * 1;
          if (Array.isArray(val49)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv49 = new DataView(memory0.buffer);
            for (const v of val49) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv49.setUint8(ptr49+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData49 = new Uint8Array(val49.buffer || val49, val49.byteOffset, valLenBytes49);
            const out49 = new Uint8Array(memory0.buffer, ptr49, valLenBytes49);
            out49.set(valData49);
          }
          
          dataView(memory0).setUint32(base + 48, len49, true);
          dataView(memory0).setUint32(base + 44, ptr49, true);
        }
        break;
      }
      case 'b-set': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 12, true);
        var {bufnum: v51_0, tail: v51_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v51_0), true);
        var vec53 = v51_1;
        var len53 = vec53.length;
        var result53 = realloc0(0, 0, 4, len53 * 8);
        for (let i = 0; i < vec53.length; i++) {
          const e = vec53[i];
          const base = result53 + i * 8;var [tuple52_0, tuple52_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple52_0), true);
          dataView(memory0).setFloat32(base + 4, +tuple52_1, true);
        }
        dataView(memory0).setUint32(base + 12, len53, true);
        dataView(memory0).setUint32(base + 8, result53, true);
        break;
      }
      case 'b-set-sample-rate': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 13, true);
        var {bufnum: v54_0, theDesiredSampling: v54_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v54_0), true);
        dataView(memory0).setFloat32(base + 8, +v54_1, true);
        break;
      }
      case 'b-setn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 14, true);
        var {bufnum: v55_0, tail: v55_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v55_0), true);
        var vec58 = v55_1;
        var len58 = vec58.length;
        var result58 = realloc0(0, 0, 4, len58 * 12);
        for (let i = 0; i < vec58.length; i++) {
          const e = vec58[i];
          const base = result58 + i * 12;var [tuple56_0, tuple56_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple56_0), true);
          var val57 = tuple56_1;
          var len57 = val57.length;
          var ptr57 = realloc0(0, 0, 4, len57 * 4);
          
          let valData57;
          const valLenBytes57 = len57 * 4;
          if (Array.isArray(val57)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv57 = new DataView(memory0.buffer);
            for (const v of val57) {
              _requireValidNumericPrimitive.bind(null, 'f32')(v);
              dv57.setFloat32(ptr57+ offset, v, true);
              offset += 4;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData57 = new Uint8Array(val57.buffer || val57, val57.byteOffset, valLenBytes57);
            const out57 = new Uint8Array(memory0.buffer, ptr57, valLenBytes57);
            out57.set(valData57);
          }
          
          dataView(memory0).setUint32(base + 8, len57, true);
          dataView(memory0).setUint32(base + 4, ptr57, true);
        }
        dataView(memory0).setUint32(base + 12, len58, true);
        dataView(memory0).setUint32(base + 8, result58, true);
        break;
      }
      case 'b-write': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 15, true);
        var {bufnum: v59_0, path: v59_1, headerFormat: v59_2, sampleFormat: v59_3, numberOfFrames: v59_4, startingFrame: v59_5, leaveFileOpen: v59_6, completionMsg: v59_7 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v59_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v59_1, realloc0, memory0);
        var ptr60= encodeRes.ptr;
        var len60 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len60, true);
        dataView(memory0).setUint32(base + 8, ptr60, true);
        
        var encodeRes = _utf8AllocateAndEncode(v59_2, realloc0, memory0);
        var ptr61= encodeRes.ptr;
        var len61 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 20, len61, true);
        dataView(memory0).setUint32(base + 16, ptr61, true);
        
        var encodeRes = _utf8AllocateAndEncode(v59_3, realloc0, memory0);
        var ptr62= encodeRes.ptr;
        var len62 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 28, len62, true);
        dataView(memory0).setUint32(base + 24, ptr62, true);
        var variant63 = v59_4;
        if (variant63 === null || variant63=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant63;
          dataView(memory0).setInt8(base + 32, 1, true);
          dataView(memory0).setInt32(base + 36, toInt32(e), true);
        }
        var variant64 = v59_5;
        if (variant64 === null || variant64=== undefined) {
          dataView(memory0).setInt8(base + 40, 0, true);
        } else {
          const e = variant64;
          dataView(memory0).setInt8(base + 40, 1, true);
          dataView(memory0).setInt32(base + 44, toInt32(e), true);
        }
        var variant65 = v59_6;
        if (variant65 === null || variant65=== undefined) {
          dataView(memory0).setInt8(base + 48, 0, true);
        } else {
          const e = variant65;
          dataView(memory0).setInt8(base + 48, 1, true);
          dataView(memory0).setInt32(base + 52, toInt32(e), true);
        }
        var variant67 = v59_7;
        if (variant67 === null || variant67=== undefined) {
          dataView(memory0).setInt8(base + 56, 0, true);
        } else {
          const e = variant67;
          dataView(memory0).setInt8(base + 56, 1, true);
          var val66 = e;
          var len66 = Array.isArray(val66) ? val66.length : val66.byteLength;
          var ptr66 = realloc0(0, 0, 1, len66 * 1);
          
          let valData66;
          const valLenBytes66 = len66 * 1;
          if (Array.isArray(val66)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv66 = new DataView(memory0.buffer);
            for (const v of val66) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv66.setUint8(ptr66+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData66 = new Uint8Array(val66.buffer || val66, val66.byteOffset, valLenBytes66);
            const out66 = new Uint8Array(memory0.buffer, ptr66, valLenBytes66);
            out66.set(valData66);
          }
          
          dataView(memory0).setUint32(base + 64, len66, true);
          dataView(memory0).setUint32(base + 60, ptr66, true);
        }
        break;
      }
      case 'b-zero': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 16, true);
        var {bufnum: v68_0, completionMsg: v68_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v68_0), true);
        var variant70 = v68_1;
        if (variant70 === null || variant70=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant70;
          dataView(memory0).setInt8(base + 8, 1, true);
          var val69 = e;
          var len69 = Array.isArray(val69) ? val69.length : val69.byteLength;
          var ptr69 = realloc0(0, 0, 1, len69 * 1);
          
          let valData69;
          const valLenBytes69 = len69 * 1;
          if (Array.isArray(val69)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv69 = new DataView(memory0.buffer);
            for (const v of val69) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv69.setUint8(ptr69+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData69 = new Uint8Array(val69.buffer || val69, val69.byteOffset, valLenBytes69);
            const out69 = new Uint8Array(memory0.buffer, ptr69, valLenBytes69);
            out69.set(valData69);
          }
          
          dataView(memory0).setUint32(base + 16, len69, true);
          dataView(memory0).setUint32(base + 12, ptr69, true);
        }
        break;
      }
      case 'c-fill': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 17, true);
        var {tail: v71_0 } = e;
        var vec74 = v71_0;
        var len74 = vec74.length;
        var result74 = realloc0(0, 0, 4, len74 * 16);
        for (let i = 0; i < vec74.length; i++) {
          const e = vec74[i];
          const base = result74 + i * 16;var [tuple72_0, tuple72_1, tuple72_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple72_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple72_1), true);
          var variant73 = tuple72_2;
          switch (variant73.tag) {
            case 'float': {
              const e = variant73.val;
              dataView(memory0).setInt8(base + 8, 0, true);
              dataView(memory0).setFloat32(base + 12, +e, true);
              break;
            }
            case 'int': {
              const e = variant73.val;
              dataView(memory0).setInt8(base + 8, 1, true);
              dataView(memory0).setInt32(base + 12, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant73.tag)}\` (received \`${variant73}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 8, len74, true);
        dataView(memory0).setUint32(base + 4, result74, true);
        break;
      }
      case 'c-get': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 18, true);
        var {busIndices: v75_0 } = e;
        var val76 = v75_0;
        var len76 = val76.length;
        var ptr76 = realloc0(0, 0, 4, len76 * 4);
        
        let valData76;
        const valLenBytes76 = len76 * 4;
        if (Array.isArray(val76)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv76 = new DataView(memory0.buffer);
          for (const v of val76) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv76.setInt32(ptr76+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData76 = new Uint8Array(val76.buffer || val76, val76.byteOffset, valLenBytes76);
          const out76 = new Uint8Array(memory0.buffer, ptr76, valLenBytes76);
          out76.set(valData76);
        }
        
        dataView(memory0).setUint32(base + 8, len76, true);
        dataView(memory0).setUint32(base + 4, ptr76, true);
        break;
      }
      case 'c-getn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 19, true);
        var {tail: v77_0 } = e;
        var vec79 = v77_0;
        var len79 = vec79.length;
        var result79 = realloc0(0, 0, 4, len79 * 8);
        for (let i = 0; i < vec79.length; i++) {
          const e = vec79[i];
          const base = result79 + i * 8;var [tuple78_0, tuple78_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple78_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple78_1), true);
        }
        dataView(memory0).setUint32(base + 8, len79, true);
        dataView(memory0).setUint32(base + 4, result79, true);
        break;
      }
      case 'c-set': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 20, true);
        var {tail: v80_0 } = e;
        var vec83 = v80_0;
        var len83 = vec83.length;
        var result83 = realloc0(0, 0, 4, len83 * 12);
        for (let i = 0; i < vec83.length; i++) {
          const e = vec83[i];
          const base = result83 + i * 12;var [tuple81_0, tuple81_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple81_0), true);
          var variant82 = tuple81_1;
          switch (variant82.tag) {
            case 'float': {
              const e = variant82.val;
              dataView(memory0).setInt8(base + 4, 0, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'int': {
              const e = variant82.val;
              dataView(memory0).setInt8(base + 4, 1, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant82.tag)}\` (received \`${variant82}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 8, len83, true);
        dataView(memory0).setUint32(base + 4, result83, true);
        break;
      }
      case 'c-setn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 21, true);
        var {tail: v84_0 } = e;
        var vec88 = v84_0;
        var len88 = vec88.length;
        var result88 = realloc0(0, 0, 4, len88 * 12);
        for (let i = 0; i < vec88.length; i++) {
          const e = vec88[i];
          const base = result88 + i * 12;var [tuple85_0, tuple85_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple85_0), true);
          var vec87 = tuple85_1;
          var len87 = vec87.length;
          var result87 = realloc0(0, 0, 4, len87 * 8);
          for (let i = 0; i < vec87.length; i++) {
            const e = vec87[i];
            const base = result87 + i * 8;var variant86 = e;
            switch (variant86.tag) {
              case 'float': {
                const e = variant86.val;
                dataView(memory0).setInt8(base + 0, 0, true);
                dataView(memory0).setFloat32(base + 4, +e, true);
                break;
              }
              case 'int': {
                const e = variant86.val;
                dataView(memory0).setInt8(base + 0, 1, true);
                dataView(memory0).setInt32(base + 4, toInt32(e), true);
                break;
              }
              default: {
                throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant86.tag)}\` (received \`${variant86}\`) specified for \`NumericValue\``);
              }
            }
          }
          dataView(memory0).setUint32(base + 8, len87, true);
          dataView(memory0).setUint32(base + 4, result87, true);
        }
        dataView(memory0).setUint32(base + 8, len88, true);
        dataView(memory0).setUint32(base + 4, result88, true);
        break;
      }
      case 'clear-sched': {
        dataView(memory0).setInt8(base + 0, 22, true);
        break;
      }
      case 'cmd': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 23, true);
        var {cmd: v89_0, anyArguments: v89_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v89_0, realloc0, memory0);
        var ptr90= encodeRes.ptr;
        var len90 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len90, true);
        dataView(memory0).setUint32(base + 4, ptr90, true);
        var vec94 = v89_1;
        var len94 = vec94.length;
        var result94 = realloc0(0, 0, 8, len94 * 16);
        for (let i = 0; i < vec94.length; i++) {
          const e = vec94[i];
          const base = result94 + i * 16;var variant93 = e;
          switch (variant93.tag) {
            case 'int32': {
              const e = variant93.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant93.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant93.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant93.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr91= encodeRes.ptr;
              var len91 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len91, true);
              dataView(memory0).setUint32(base + 8, ptr91, true);
              break;
            }
            case 'blob': {
              const e = variant93.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val92 = e;
              var len92 = Array.isArray(val92) ? val92.length : val92.byteLength;
              var ptr92 = realloc0(0, 0, 1, len92 * 1);
              
              let valData92;
              const valLenBytes92 = len92 * 1;
              if (Array.isArray(val92)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv92 = new DataView(memory0.buffer);
                for (const v of val92) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv92.setUint8(ptr92+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData92 = new Uint8Array(val92.buffer || val92, val92.byteOffset, valLenBytes92);
                const out92 = new Uint8Array(memory0.buffer, ptr92, valLenBytes92);
                out92.set(valData92);
              }
              
              dataView(memory0).setUint32(base + 12, len92, true);
              dataView(memory0).setUint32(base + 8, ptr92, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant93.tag)}\` (received \`${variant93}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 16, len94, true);
        dataView(memory0).setUint32(base + 12, result94, true);
        break;
      }
      case 'd-free': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 24, true);
        var {synthDefNames: v95_0 } = e;
        var vec97 = v95_0;
        var len97 = vec97.length;
        var result97 = realloc0(0, 0, 4, len97 * 8);
        for (let i = 0; i < vec97.length; i++) {
          const e = vec97[i];
          const base = result97 + i * 8;
          var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
          var ptr96= encodeRes.ptr;
          var len96 = encodeRes.len;
          
          dataView(memory0).setUint32(base + 4, len96, true);
          dataView(memory0).setUint32(base + 0, ptr96, true);
        }
        dataView(memory0).setUint32(base + 8, len97, true);
        dataView(memory0).setUint32(base + 4, result97, true);
        break;
      }
      case 'd-load': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 25, true);
        var {pathnameOfFile: v98_0, completionMsg: v98_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v98_0, realloc0, memory0);
        var ptr99= encodeRes.ptr;
        var len99 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len99, true);
        dataView(memory0).setUint32(base + 4, ptr99, true);
        var variant101 = v98_1;
        if (variant101 === null || variant101=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant101;
          dataView(memory0).setInt8(base + 12, 1, true);
          var val100 = e;
          var len100 = Array.isArray(val100) ? val100.length : val100.byteLength;
          var ptr100 = realloc0(0, 0, 1, len100 * 1);
          
          let valData100;
          const valLenBytes100 = len100 * 1;
          if (Array.isArray(val100)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv100 = new DataView(memory0.buffer);
            for (const v of val100) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv100.setUint8(ptr100+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData100 = new Uint8Array(val100.buffer || val100, val100.byteOffset, valLenBytes100);
            const out100 = new Uint8Array(memory0.buffer, ptr100, valLenBytes100);
            out100.set(valData100);
          }
          
          dataView(memory0).setUint32(base + 20, len100, true);
          dataView(memory0).setUint32(base + 16, ptr100, true);
        }
        break;
      }
      case 'd-load-dir': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 26, true);
        var {pathnameOfDirectory: v102_0, completionMsg: v102_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v102_0, realloc0, memory0);
        var ptr103= encodeRes.ptr;
        var len103 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len103, true);
        dataView(memory0).setUint32(base + 4, ptr103, true);
        var variant105 = v102_1;
        if (variant105 === null || variant105=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant105;
          dataView(memory0).setInt8(base + 12, 1, true);
          var val104 = e;
          var len104 = Array.isArray(val104) ? val104.length : val104.byteLength;
          var ptr104 = realloc0(0, 0, 1, len104 * 1);
          
          let valData104;
          const valLenBytes104 = len104 * 1;
          if (Array.isArray(val104)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv104 = new DataView(memory0.buffer);
            for (const v of val104) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv104.setUint8(ptr104+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData104 = new Uint8Array(val104.buffer || val104, val104.byteOffset, valLenBytes104);
            const out104 = new Uint8Array(memory0.buffer, ptr104, valLenBytes104);
            out104.set(valData104);
          }
          
          dataView(memory0).setUint32(base + 20, len104, true);
          dataView(memory0).setUint32(base + 16, ptr104, true);
        }
        break;
      }
      case 'd-recv': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 27, true);
        var {bufferOfData: v106_0, completionMsg: v106_1 } = e;
        var val107 = v106_0;
        var len107 = Array.isArray(val107) ? val107.length : val107.byteLength;
        var ptr107 = realloc0(0, 0, 1, len107 * 1);
        
        let valData107;
        const valLenBytes107 = len107 * 1;
        if (Array.isArray(val107)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv107 = new DataView(memory0.buffer);
          for (const v of val107) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv107.setUint8(ptr107+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData107 = new Uint8Array(val107.buffer || val107, val107.byteOffset, valLenBytes107);
          const out107 = new Uint8Array(memory0.buffer, ptr107, valLenBytes107);
          out107.set(valData107);
        }
        
        dataView(memory0).setUint32(base + 8, len107, true);
        dataView(memory0).setUint32(base + 4, ptr107, true);
        var variant109 = v106_1;
        if (variant109 === null || variant109=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant109;
          dataView(memory0).setInt8(base + 12, 1, true);
          var val108 = e;
          var len108 = Array.isArray(val108) ? val108.length : val108.byteLength;
          var ptr108 = realloc0(0, 0, 1, len108 * 1);
          
          let valData108;
          const valLenBytes108 = len108 * 1;
          if (Array.isArray(val108)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv108 = new DataView(memory0.buffer);
            for (const v of val108) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv108.setUint8(ptr108+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData108 = new Uint8Array(val108.buffer || val108, val108.byteOffset, valLenBytes108);
            const out108 = new Uint8Array(memory0.buffer, ptr108, valLenBytes108);
            out108.set(valData108);
          }
          
          dataView(memory0).setUint32(base + 20, len108, true);
          dataView(memory0).setUint32(base + 16, ptr108, true);
        }
        break;
      }
      case 'dump-osc': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 28, true);
        var {code: v110_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v110_0), true);
        break;
      }
      case 'error': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 29, true);
        var {mode: v111_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v111_0), true);
        break;
      }
      case 'g-deep-free': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 30, true);
        var {groupIds: v112_0 } = e;
        var val113 = v112_0;
        var len113 = val113.length;
        var ptr113 = realloc0(0, 0, 4, len113 * 4);
        
        let valData113;
        const valLenBytes113 = len113 * 4;
        if (Array.isArray(val113)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv113 = new DataView(memory0.buffer);
          for (const v of val113) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv113.setInt32(ptr113+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData113 = new Uint8Array(val113.buffer || val113, val113.byteOffset, valLenBytes113);
          const out113 = new Uint8Array(memory0.buffer, ptr113, valLenBytes113);
          out113.set(valData113);
        }
        
        dataView(memory0).setUint32(base + 8, len113, true);
        dataView(memory0).setUint32(base + 4, ptr113, true);
        break;
      }
      case 'g-dump-tree': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 31, true);
        var {tail: v114_0 } = e;
        var vec116 = v114_0;
        var len116 = vec116.length;
        var result116 = realloc0(0, 0, 4, len116 * 8);
        for (let i = 0; i < vec116.length; i++) {
          const e = vec116[i];
          const base = result116 + i * 8;var [tuple115_0, tuple115_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple115_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple115_1), true);
        }
        dataView(memory0).setUint32(base + 8, len116, true);
        dataView(memory0).setUint32(base + 4, result116, true);
        break;
      }
      case 'g-free-all': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 32, true);
        var {groupIds: v117_0 } = e;
        var val118 = v117_0;
        var len118 = val118.length;
        var ptr118 = realloc0(0, 0, 4, len118 * 4);
        
        let valData118;
        const valLenBytes118 = len118 * 4;
        if (Array.isArray(val118)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv118 = new DataView(memory0.buffer);
          for (const v of val118) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv118.setInt32(ptr118+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData118 = new Uint8Array(val118.buffer || val118, val118.byteOffset, valLenBytes118);
          const out118 = new Uint8Array(memory0.buffer, ptr118, valLenBytes118);
          out118.set(valData118);
        }
        
        dataView(memory0).setUint32(base + 8, len118, true);
        dataView(memory0).setUint32(base + 4, ptr118, true);
        break;
      }
      case 'g-head': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 33, true);
        var {tail: v119_0 } = e;
        var vec121 = v119_0;
        var len121 = vec121.length;
        var result121 = realloc0(0, 0, 4, len121 * 8);
        for (let i = 0; i < vec121.length; i++) {
          const e = vec121[i];
          const base = result121 + i * 8;var [tuple120_0, tuple120_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple120_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple120_1), true);
        }
        dataView(memory0).setUint32(base + 8, len121, true);
        dataView(memory0).setUint32(base + 4, result121, true);
        break;
      }
      case 'g-new': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 34, true);
        var {tail: v122_0 } = e;
        var vec124 = v122_0;
        var len124 = vec124.length;
        var result124 = realloc0(0, 0, 4, len124 * 12);
        for (let i = 0; i < vec124.length; i++) {
          const e = vec124[i];
          const base = result124 + i * 12;var [tuple123_0, tuple123_1, tuple123_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple123_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple123_1), true);
          dataView(memory0).setInt32(base + 8, toInt32(tuple123_2), true);
        }
        dataView(memory0).setUint32(base + 8, len124, true);
        dataView(memory0).setUint32(base + 4, result124, true);
        break;
      }
      case 'g-query-tree': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 35, true);
        var {tail: v125_0 } = e;
        var vec127 = v125_0;
        var len127 = vec127.length;
        var result127 = realloc0(0, 0, 4, len127 * 8);
        for (let i = 0; i < vec127.length; i++) {
          const e = vec127[i];
          const base = result127 + i * 8;var [tuple126_0, tuple126_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple126_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple126_1), true);
        }
        dataView(memory0).setUint32(base + 8, len127, true);
        dataView(memory0).setUint32(base + 4, result127, true);
        break;
      }
      case 'g-tail': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 36, true);
        var {tail: v128_0 } = e;
        var vec130 = v128_0;
        var len130 = vec130.length;
        var result130 = realloc0(0, 0, 4, len130 * 8);
        for (let i = 0; i < vec130.length; i++) {
          const e = vec130[i];
          const base = result130 + i * 8;var [tuple129_0, tuple129_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple129_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple129_1), true);
        }
        dataView(memory0).setUint32(base + 8, len130, true);
        dataView(memory0).setUint32(base + 4, result130, true);
        break;
      }
      case 'n-after': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 37, true);
        var {tail: v131_0 } = e;
        var vec133 = v131_0;
        var len133 = vec133.length;
        var result133 = realloc0(0, 0, 4, len133 * 8);
        for (let i = 0; i < vec133.length; i++) {
          const e = vec133[i];
          const base = result133 + i * 8;var [tuple132_0, tuple132_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple132_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple132_1), true);
        }
        dataView(memory0).setUint32(base + 8, len133, true);
        dataView(memory0).setUint32(base + 4, result133, true);
        break;
      }
      case 'n-before': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 38, true);
        var {tail: v134_0 } = e;
        var vec136 = v134_0;
        var len136 = vec136.length;
        var result136 = realloc0(0, 0, 4, len136 * 8);
        for (let i = 0; i < vec136.length; i++) {
          const e = vec136[i];
          const base = result136 + i * 8;var [tuple135_0, tuple135_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple135_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple135_1), true);
        }
        dataView(memory0).setUint32(base + 8, len136, true);
        dataView(memory0).setUint32(base + 4, result136, true);
        break;
      }
      case 'n-fill': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 39, true);
        var {nodeId: v137_0, tail: v137_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v137_0), true);
        var vec142 = v137_1;
        var len142 = vec142.length;
        var result142 = realloc0(0, 0, 4, len142 * 24);
        for (let i = 0; i < vec142.length; i++) {
          const e = vec142[i];
          const base = result142 + i * 24;var [tuple138_0, tuple138_1, tuple138_2] = e;
          var variant140 = tuple138_0;
          switch (variant140.tag) {
            case 'index': {
              const e = variant140.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant140.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr139= encodeRes.ptr;
              var len139 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len139, true);
              dataView(memory0).setUint32(base + 4, ptr139, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant140.tag)}\` (received \`${variant140}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple138_1), true);
          var variant141 = tuple138_2;
          switch (variant141.tag) {
            case 'float': {
              const e = variant141.val;
              dataView(memory0).setInt8(base + 16, 0, true);
              dataView(memory0).setFloat32(base + 20, +e, true);
              break;
            }
            case 'int': {
              const e = variant141.val;
              dataView(memory0).setInt8(base + 16, 1, true);
              dataView(memory0).setInt32(base + 20, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant141.tag)}\` (received \`${variant141}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 12, len142, true);
        dataView(memory0).setUint32(base + 8, result142, true);
        break;
      }
      case 'n-free': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 40, true);
        var {nodeIds: v143_0 } = e;
        var val144 = v143_0;
        var len144 = val144.length;
        var ptr144 = realloc0(0, 0, 4, len144 * 4);
        
        let valData144;
        const valLenBytes144 = len144 * 4;
        if (Array.isArray(val144)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv144 = new DataView(memory0.buffer);
          for (const v of val144) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv144.setInt32(ptr144+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData144 = new Uint8Array(val144.buffer || val144, val144.byteOffset, valLenBytes144);
          const out144 = new Uint8Array(memory0.buffer, ptr144, valLenBytes144);
          out144.set(valData144);
        }
        
        dataView(memory0).setUint32(base + 8, len144, true);
        dataView(memory0).setUint32(base + 4, ptr144, true);
        break;
      }
      case 'n-map': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 41, true);
        var {nodeId: v145_0, tail: v145_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v145_0), true);
        var vec149 = v145_1;
        var len149 = vec149.length;
        var result149 = realloc0(0, 0, 4, len149 * 16);
        for (let i = 0; i < vec149.length; i++) {
          const e = vec149[i];
          const base = result149 + i * 16;var [tuple146_0, tuple146_1] = e;
          var variant148 = tuple146_0;
          switch (variant148.tag) {
            case 'index': {
              const e = variant148.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant148.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr147= encodeRes.ptr;
              var len147 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len147, true);
              dataView(memory0).setUint32(base + 4, ptr147, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant148.tag)}\` (received \`${variant148}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple146_1), true);
        }
        dataView(memory0).setUint32(base + 12, len149, true);
        dataView(memory0).setUint32(base + 8, result149, true);
        break;
      }
      case 'n-mapa': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 42, true);
        var {nodeId: v150_0, tail: v150_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v150_0), true);
        var vec154 = v150_1;
        var len154 = vec154.length;
        var result154 = realloc0(0, 0, 4, len154 * 16);
        for (let i = 0; i < vec154.length; i++) {
          const e = vec154[i];
          const base = result154 + i * 16;var [tuple151_0, tuple151_1] = e;
          var variant153 = tuple151_0;
          switch (variant153.tag) {
            case 'index': {
              const e = variant153.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant153.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr152= encodeRes.ptr;
              var len152 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len152, true);
              dataView(memory0).setUint32(base + 4, ptr152, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant153.tag)}\` (received \`${variant153}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple151_1), true);
        }
        dataView(memory0).setUint32(base + 12, len154, true);
        dataView(memory0).setUint32(base + 8, result154, true);
        break;
      }
      case 'n-mapan': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 43, true);
        var {nodeId: v155_0, tail: v155_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v155_0), true);
        var vec159 = v155_1;
        var len159 = vec159.length;
        var result159 = realloc0(0, 0, 4, len159 * 20);
        for (let i = 0; i < vec159.length; i++) {
          const e = vec159[i];
          const base = result159 + i * 20;var [tuple156_0, tuple156_1, tuple156_2] = e;
          var variant158 = tuple156_0;
          switch (variant158.tag) {
            case 'index': {
              const e = variant158.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant158.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr157= encodeRes.ptr;
              var len157 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len157, true);
              dataView(memory0).setUint32(base + 4, ptr157, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant158.tag)}\` (received \`${variant158}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple156_1), true);
          dataView(memory0).setInt32(base + 16, toInt32(tuple156_2), true);
        }
        dataView(memory0).setUint32(base + 12, len159, true);
        dataView(memory0).setUint32(base + 8, result159, true);
        break;
      }
      case 'n-mapn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 44, true);
        var {nodeId: v160_0, tail: v160_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v160_0), true);
        var vec164 = v160_1;
        var len164 = vec164.length;
        var result164 = realloc0(0, 0, 4, len164 * 20);
        for (let i = 0; i < vec164.length; i++) {
          const e = vec164[i];
          const base = result164 + i * 20;var [tuple161_0, tuple161_1, tuple161_2] = e;
          var variant163 = tuple161_0;
          switch (variant163.tag) {
            case 'index': {
              const e = variant163.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant163.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr162= encodeRes.ptr;
              var len162 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len162, true);
              dataView(memory0).setUint32(base + 4, ptr162, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant163.tag)}\` (received \`${variant163}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple161_1), true);
          dataView(memory0).setInt32(base + 16, toInt32(tuple161_2), true);
        }
        dataView(memory0).setUint32(base + 12, len164, true);
        dataView(memory0).setUint32(base + 8, result164, true);
        break;
      }
      case 'n-order': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 45, true);
        var {addAction: v165_0, targetId: v165_1, nodeIds: v165_2 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v165_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v165_1), true);
        var val166 = v165_2;
        var len166 = val166.length;
        var ptr166 = realloc0(0, 0, 4, len166 * 4);
        
        let valData166;
        const valLenBytes166 = len166 * 4;
        if (Array.isArray(val166)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv166 = new DataView(memory0.buffer);
          for (const v of val166) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv166.setInt32(ptr166+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData166 = new Uint8Array(val166.buffer || val166, val166.byteOffset, valLenBytes166);
          const out166 = new Uint8Array(memory0.buffer, ptr166, valLenBytes166);
          out166.set(valData166);
        }
        
        dataView(memory0).setUint32(base + 16, len166, true);
        dataView(memory0).setUint32(base + 12, ptr166, true);
        break;
      }
      case 'n-query': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 46, true);
        var {nodeIds: v167_0 } = e;
        var val168 = v167_0;
        var len168 = val168.length;
        var ptr168 = realloc0(0, 0, 4, len168 * 4);
        
        let valData168;
        const valLenBytes168 = len168 * 4;
        if (Array.isArray(val168)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv168 = new DataView(memory0.buffer);
          for (const v of val168) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv168.setInt32(ptr168+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData168 = new Uint8Array(val168.buffer || val168, val168.byteOffset, valLenBytes168);
          const out168 = new Uint8Array(memory0.buffer, ptr168, valLenBytes168);
          out168.set(valData168);
        }
        
        dataView(memory0).setUint32(base + 8, len168, true);
        dataView(memory0).setUint32(base + 4, ptr168, true);
        break;
      }
      case 'n-run': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 47, true);
        var {tail: v169_0 } = e;
        var vec171 = v169_0;
        var len171 = vec171.length;
        var result171 = realloc0(0, 0, 4, len171 * 8);
        for (let i = 0; i < vec171.length; i++) {
          const e = vec171[i];
          const base = result171 + i * 8;var [tuple170_0, tuple170_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple170_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple170_1), true);
        }
        dataView(memory0).setUint32(base + 8, len171, true);
        dataView(memory0).setUint32(base + 4, result171, true);
        break;
      }
      case 'n-set': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 48, true);
        var {nodeId: v172_0, tail: v172_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v172_0), true);
        var vec177 = v172_1;
        var len177 = vec177.length;
        var result177 = realloc0(0, 0, 4, len177 * 20);
        for (let i = 0; i < vec177.length; i++) {
          const e = vec177[i];
          const base = result177 + i * 20;var [tuple173_0, tuple173_1] = e;
          var variant175 = tuple173_0;
          switch (variant175.tag) {
            case 'index': {
              const e = variant175.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant175.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr174= encodeRes.ptr;
              var len174 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len174, true);
              dataView(memory0).setUint32(base + 4, ptr174, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant175.tag)}\` (received \`${variant175}\`) specified for \`ControlId\``);
            }
          }
          var variant176 = tuple173_1;
          switch (variant176.tag) {
            case 'float': {
              const e = variant176.val;
              dataView(memory0).setInt8(base + 12, 0, true);
              dataView(memory0).setFloat32(base + 16, +e, true);
              break;
            }
            case 'int': {
              const e = variant176.val;
              dataView(memory0).setInt8(base + 12, 1, true);
              dataView(memory0).setInt32(base + 16, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant176.tag)}\` (received \`${variant176}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 12, len177, true);
        dataView(memory0).setUint32(base + 8, result177, true);
        break;
      }
      case 'n-setn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 49, true);
        var {nodeId: v178_0, tail: v178_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v178_0), true);
        var vec184 = v178_1;
        var len184 = vec184.length;
        var result184 = realloc0(0, 0, 4, len184 * 20);
        for (let i = 0; i < vec184.length; i++) {
          const e = vec184[i];
          const base = result184 + i * 20;var [tuple179_0, tuple179_1] = e;
          var variant181 = tuple179_0;
          switch (variant181.tag) {
            case 'index': {
              const e = variant181.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant181.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr180= encodeRes.ptr;
              var len180 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len180, true);
              dataView(memory0).setUint32(base + 4, ptr180, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant181.tag)}\` (received \`${variant181}\`) specified for \`ControlId\``);
            }
          }
          var vec183 = tuple179_1;
          var len183 = vec183.length;
          var result183 = realloc0(0, 0, 4, len183 * 8);
          for (let i = 0; i < vec183.length; i++) {
            const e = vec183[i];
            const base = result183 + i * 8;var variant182 = e;
            switch (variant182.tag) {
              case 'float': {
                const e = variant182.val;
                dataView(memory0).setInt8(base + 0, 0, true);
                dataView(memory0).setFloat32(base + 4, +e, true);
                break;
              }
              case 'int': {
                const e = variant182.val;
                dataView(memory0).setInt8(base + 0, 1, true);
                dataView(memory0).setInt32(base + 4, toInt32(e), true);
                break;
              }
              default: {
                throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant182.tag)}\` (received \`${variant182}\`) specified for \`NumericValue\``);
              }
            }
          }
          dataView(memory0).setUint32(base + 16, len183, true);
          dataView(memory0).setUint32(base + 12, result183, true);
        }
        dataView(memory0).setUint32(base + 12, len184, true);
        dataView(memory0).setUint32(base + 8, result184, true);
        break;
      }
      case 'n-trace': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 50, true);
        var {nodeIds: v185_0 } = e;
        var val186 = v185_0;
        var len186 = val186.length;
        var ptr186 = realloc0(0, 0, 4, len186 * 4);
        
        let valData186;
        const valLenBytes186 = len186 * 4;
        if (Array.isArray(val186)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv186 = new DataView(memory0.buffer);
          for (const v of val186) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv186.setInt32(ptr186+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData186 = new Uint8Array(val186.buffer || val186, val186.byteOffset, valLenBytes186);
          const out186 = new Uint8Array(memory0.buffer, ptr186, valLenBytes186);
          out186.set(valData186);
        }
        
        dataView(memory0).setUint32(base + 8, len186, true);
        dataView(memory0).setUint32(base + 4, ptr186, true);
        break;
      }
      case 'notify': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 51, true);
        var {enable: v187_0, clientId: v187_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v187_0), true);
        var variant188 = v187_1;
        if (variant188 === null || variant188=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant188;
          dataView(memory0).setInt8(base + 8, 1, true);
          dataView(memory0).setInt32(base + 12, toInt32(e), true);
        }
        break;
      }
      case 'nrt-end': {
        dataView(memory0).setInt8(base + 0, 52, true);
        break;
      }
      case 'p-new': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 53, true);
        var {tail: v189_0 } = e;
        var vec191 = v189_0;
        var len191 = vec191.length;
        var result191 = realloc0(0, 0, 4, len191 * 12);
        for (let i = 0; i < vec191.length; i++) {
          const e = vec191[i];
          const base = result191 + i * 12;var [tuple190_0, tuple190_1, tuple190_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple190_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple190_1), true);
          dataView(memory0).setInt32(base + 8, toInt32(tuple190_2), true);
        }
        dataView(memory0).setUint32(base + 8, len191, true);
        dataView(memory0).setUint32(base + 4, result191, true);
        break;
      }
      case 'quit': {
        dataView(memory0).setInt8(base + 0, 54, true);
        break;
      }
      case 'rt-memory-status': {
        dataView(memory0).setInt8(base + 0, 55, true);
        break;
      }
      case 's-get': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 56, true);
        var {nodeId: v192_0, controls: v192_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v192_0), true);
        var vec195 = v192_1;
        var len195 = vec195.length;
        var result195 = realloc0(0, 0, 4, len195 * 12);
        for (let i = 0; i < vec195.length; i++) {
          const e = vec195[i];
          const base = result195 + i * 12;var variant194 = e;
          switch (variant194.tag) {
            case 'index': {
              const e = variant194.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant194.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr193= encodeRes.ptr;
              var len193 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len193, true);
              dataView(memory0).setUint32(base + 4, ptr193, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant194.tag)}\` (received \`${variant194}\`) specified for \`ControlId\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 12, len195, true);
        dataView(memory0).setUint32(base + 8, result195, true);
        break;
      }
      case 's-getn': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 57, true);
        var {nodeId: v196_0, tail: v196_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v196_0), true);
        var vec200 = v196_1;
        var len200 = vec200.length;
        var result200 = realloc0(0, 0, 4, len200 * 16);
        for (let i = 0; i < vec200.length; i++) {
          const e = vec200[i];
          const base = result200 + i * 16;var [tuple197_0, tuple197_1] = e;
          var variant199 = tuple197_0;
          switch (variant199.tag) {
            case 'index': {
              const e = variant199.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant199.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr198= encodeRes.ptr;
              var len198 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len198, true);
              dataView(memory0).setUint32(base + 4, ptr198, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant199.tag)}\` (received \`${variant199}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple197_1), true);
        }
        dataView(memory0).setUint32(base + 12, len200, true);
        dataView(memory0).setUint32(base + 8, result200, true);
        break;
      }
      case 's-new': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 58, true);
        var {defName: v201_0, nodeId: v201_1, addAction: v201_2, targetId: v201_3, tail: v201_4 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v201_0, realloc0, memory0);
        var ptr202= encodeRes.ptr;
        var len202 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len202, true);
        dataView(memory0).setUint32(base + 4, ptr202, true);
        dataView(memory0).setInt32(base + 12, toInt32(v201_1), true);
        dataView(memory0).setInt32(base + 16, toInt32(v201_2), true);
        dataView(memory0).setInt32(base + 20, toInt32(v201_3), true);
        var vec208 = v201_4;
        var len208 = vec208.length;
        var result208 = realloc0(0, 0, 4, len208 * 24);
        for (let i = 0; i < vec208.length; i++) {
          const e = vec208[i];
          const base = result208 + i * 24;var [tuple203_0, tuple203_1] = e;
          var variant205 = tuple203_0;
          switch (variant205.tag) {
            case 'index': {
              const e = variant205.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant205.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr204= encodeRes.ptr;
              var len204 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len204, true);
              dataView(memory0).setUint32(base + 4, ptr204, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant205.tag)}\` (received \`${variant205}\`) specified for \`ControlId\``);
            }
          }
          var variant207 = tuple203_1;
          switch (variant207.tag) {
            case 'float': {
              const e = variant207.val;
              dataView(memory0).setInt8(base + 12, 0, true);
              dataView(memory0).setFloat32(base + 16, +e, true);
              break;
            }
            case 'int': {
              const e = variant207.val;
              dataView(memory0).setInt8(base + 12, 1, true);
              dataView(memory0).setInt32(base + 16, toInt32(e), true);
              break;
            }
            case 'bus': {
              const e = variant207.val;
              dataView(memory0).setInt8(base + 12, 2, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr206= encodeRes.ptr;
              var len206 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 20, len206, true);
              dataView(memory0).setUint32(base + 16, ptr206, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant207.tag)}\` (received \`${variant207}\`) specified for \`ControlValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 28, len208, true);
        dataView(memory0).setUint32(base + 24, result208, true);
        break;
      }
      case 's-noid': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 59, true);
        var {synthIds: v209_0 } = e;
        var val210 = v209_0;
        var len210 = val210.length;
        var ptr210 = realloc0(0, 0, 4, len210 * 4);
        
        let valData210;
        const valLenBytes210 = len210 * 4;
        if (Array.isArray(val210)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv210 = new DataView(memory0.buffer);
          for (const v of val210) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv210.setInt32(ptr210+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData210 = new Uint8Array(val210.buffer || val210, val210.byteOffset, valLenBytes210);
          const out210 = new Uint8Array(memory0.buffer, ptr210, valLenBytes210);
          out210.set(valData210);
        }
        
        dataView(memory0).setUint32(base + 8, len210, true);
        dataView(memory0).setUint32(base + 4, ptr210, true);
        break;
      }
      case 'scope-subscribe': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 60, true);
        var {subId: v211_0, scope: v211_1, channels: v211_2, chunkSize: v211_3 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v211_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v211_1), true);
        dataView(memory0).setInt32(base + 12, toInt32(v211_2), true);
        dataView(memory0).setInt32(base + 16, toInt32(v211_3), true);
        break;
      }
      case 'scope-unsubscribe': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 61, true);
        var {subId: v212_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v212_0), true);
        break;
      }
      case 'status': {
        dataView(memory0).setInt8(base + 0, 62, true);
        break;
      }
      case 'sync': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 63, true);
        var {aUniqueNumber: v213_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v213_0), true);
        break;
      }
      case 'u-cmd': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 64, true);
        var {nodeId: v214_0, unitGeneratorIndex: v214_1, cmd: v214_2, anyArguments: v214_3 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v214_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v214_1), true);
        
        var encodeRes = _utf8AllocateAndEncode(v214_2, realloc0, memory0);
        var ptr215= encodeRes.ptr;
        var len215 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 16, len215, true);
        dataView(memory0).setUint32(base + 12, ptr215, true);
        var vec219 = v214_3;
        var len219 = vec219.length;
        var result219 = realloc0(0, 0, 8, len219 * 16);
        for (let i = 0; i < vec219.length; i++) {
          const e = vec219[i];
          const base = result219 + i * 16;var variant218 = e;
          switch (variant218.tag) {
            case 'int32': {
              const e = variant218.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant218.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant218.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant218.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr216= encodeRes.ptr;
              var len216 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len216, true);
              dataView(memory0).setUint32(base + 8, ptr216, true);
              break;
            }
            case 'blob': {
              const e = variant218.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val217 = e;
              var len217 = Array.isArray(val217) ? val217.length : val217.byteLength;
              var ptr217 = realloc0(0, 0, 1, len217 * 1);
              
              let valData217;
              const valLenBytes217 = len217 * 1;
              if (Array.isArray(val217)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv217 = new DataView(memory0.buffer);
                for (const v of val217) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv217.setUint8(ptr217+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData217 = new Uint8Array(val217.buffer || val217, val217.byteOffset, valLenBytes217);
                const out217 = new Uint8Array(memory0.buffer, ptr217, valLenBytes217);
                out217.set(valData217);
              }
              
              dataView(memory0).setUint32(base + 12, len217, true);
              dataView(memory0).setUint32(base + 8, ptr217, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant218.tag)}\` (received \`${variant218}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 24, len219, true);
        dataView(memory0).setUint32(base + 20, result219, true);
        break;
      }
      case 'version': {
        dataView(memory0).setInt8(base + 0, 65, true);
        break;
      }
      case 'other': {
        const e = variant226.val;
        dataView(memory0).setInt8(base + 0, 66, true);
        var {address: v220_0, args: v220_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v220_0, realloc0, memory0);
        var ptr221= encodeRes.ptr;
        var len221 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len221, true);
        dataView(memory0).setUint32(base + 4, ptr221, true);
        var vec225 = v220_1;
        var len225 = vec225.length;
        var result225 = realloc0(0, 0, 8, len225 * 16);
        for (let i = 0; i < vec225.length; i++) {
          const e = vec225[i];
          const base = result225 + i * 16;var variant224 = e;
          switch (variant224.tag) {
            case 'int32': {
              const e = variant224.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant224.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant224.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant224.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr222= encodeRes.ptr;
              var len222 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len222, true);
              dataView(memory0).setUint32(base + 8, ptr222, true);
              break;
            }
            case 'blob': {
              const e = variant224.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val223 = e;
              var len223 = Array.isArray(val223) ? val223.length : val223.byteLength;
              var ptr223 = realloc0(0, 0, 1, len223 * 1);
              
              let valData223;
              const valLenBytes223 = len223 * 1;
              if (Array.isArray(val223)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv223 = new DataView(memory0.buffer);
                for (const v of val223) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv223.setUint8(ptr223+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData223 = new Uint8Array(val223.buffer || val223, val223.byteOffset, valLenBytes223);
                const out223 = new Uint8Array(memory0.buffer, ptr223, valLenBytes223);
                out223.set(valData223);
              }
              
              dataView(memory0).setUint32(base + 12, len223, true);
              dataView(memory0).setUint32(base + 8, ptr223, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant224.tag)}\` (received \`${variant224}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 16, len225, true);
        dataView(memory0).setUint32(base + 12, result225, true);
        break;
      }
      default: {
        throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant226.tag)}\` (received \`${variant226}\`) specified for \`ServerMessage\``);
      }
    }
  }
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="encode-batch"][Instruction::CallWasm] enter', {
    funcName: 'encode-batch',
    paramCount: 2,
    async: false,
    postReturn: true,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'commands010EncodeBatch',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'throw-result-err',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => commands010EncodeBatch(result227, len227),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  let variant230;
  switch (dataView(memory0).getUint8(ret + 0, true)) {
    case 0: {
      var ptr228 = dataView(memory0).getUint32(ret + 4, true);
      var len228 = dataView(memory0).getUint32(ret + 8, true);
      var result228 = new Uint8Array(memory0.buffer.slice(ptr228, ptr228 + len228 * 1));
      variant230= {
        tag: 'ok',
        val: result228
      };
      break;
    }
    case 1: {
      var ptr229 = dataView(memory0).getUint32(ret + 4, true);
      var len229 = dataView(memory0).getUint32(ret + 8, true);
      var result229 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr229, len229));
      variant230= {
        tag: 'err',
        val: result229
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="encode-batch"][Instruction::Return]', {
    funcName: 'encode-batch',
    paramCount: 1,
    async: false,
    postReturn: true
  });
  const retCopy = variant230;
  task.resolve([retCopy.val]);
  
  let cstate = getOrCreateAsyncState(0);
  cstate.mayLeave = false;
  postReturn0(ret);
  cstate.mayLeave = true;
  task.exit();
  
  
  
  if (typeof retCopy === 'object' && retCopy.tag === 'err') {
    throw new ComponentError(retCopy.val);
  }
  return retCopy.val;
  
}
let commands010EncodeBundle;

function encodeBundle(arg0, arg1) {
  var {seconds: v0_0, fractional: v0_1 } = arg0;
  var vec228 = arg1;
  var len228 = vec228.length;
  var result228 = realloc0(0, 0, 4, len228 * 68);
  for (let i = 0; i < vec228.length; i++) {
    const e = vec228[i];
    const base = result228 + i * 68;var variant227 = e;
    switch (variant227.tag) {
      case 'b-alloc': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 0, true);
        var {bufnum: v1_0, numFrames: v1_1, numChannels: v1_2, completionMsg: v1_3, sampleRate: v1_4 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v1_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v1_1), true);
        var variant2 = v1_2;
        if (variant2 === null || variant2=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant2;
          dataView(memory0).setInt8(base + 12, 1, true);
          dataView(memory0).setInt32(base + 16, toInt32(e), true);
        }
        var variant4 = v1_3;
        if (variant4 === null || variant4=== undefined) {
          dataView(memory0).setInt8(base + 20, 0, true);
        } else {
          const e = variant4;
          dataView(memory0).setInt8(base + 20, 1, true);
          var val3 = e;
          var len3 = Array.isArray(val3) ? val3.length : val3.byteLength;
          var ptr3 = realloc0(0, 0, 1, len3 * 1);
          
          let valData3;
          const valLenBytes3 = len3 * 1;
          if (Array.isArray(val3)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv3 = new DataView(memory0.buffer);
            for (const v of val3) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv3.setUint8(ptr3+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, valLenBytes3);
            const out3 = new Uint8Array(memory0.buffer, ptr3, valLenBytes3);
            out3.set(valData3);
          }
          
          dataView(memory0).setUint32(base + 28, len3, true);
          dataView(memory0).setUint32(base + 24, ptr3, true);
        }
        var variant5 = v1_4;
        if (variant5 === null || variant5=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant5;
          dataView(memory0).setInt8(base + 32, 1, true);
          dataView(memory0).setFloat32(base + 36, +e, true);
        }
        break;
      }
      case 'b-alloc-read': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 1, true);
        var {bufnum: v6_0, path: v6_1, startFrame: v6_2, numberOfFrames: v6_3, completionMsg: v6_4 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v6_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v6_1, realloc0, memory0);
        var ptr7= encodeRes.ptr;
        var len7 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len7, true);
        dataView(memory0).setUint32(base + 8, ptr7, true);
        var variant8 = v6_2;
        if (variant8 === null || variant8=== undefined) {
          dataView(memory0).setInt8(base + 16, 0, true);
        } else {
          const e = variant8;
          dataView(memory0).setInt8(base + 16, 1, true);
          dataView(memory0).setInt32(base + 20, toInt32(e), true);
        }
        var variant9 = v6_3;
        if (variant9 === null || variant9=== undefined) {
          dataView(memory0).setInt8(base + 24, 0, true);
        } else {
          const e = variant9;
          dataView(memory0).setInt8(base + 24, 1, true);
          dataView(memory0).setInt32(base + 28, toInt32(e), true);
        }
        var variant11 = v6_4;
        if (variant11 === null || variant11=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant11;
          dataView(memory0).setInt8(base + 32, 1, true);
          var val10 = e;
          var len10 = Array.isArray(val10) ? val10.length : val10.byteLength;
          var ptr10 = realloc0(0, 0, 1, len10 * 1);
          
          let valData10;
          const valLenBytes10 = len10 * 1;
          if (Array.isArray(val10)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv10 = new DataView(memory0.buffer);
            for (const v of val10) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv10.setUint8(ptr10+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData10 = new Uint8Array(val10.buffer || val10, val10.byteOffset, valLenBytes10);
            const out10 = new Uint8Array(memory0.buffer, ptr10, valLenBytes10);
            out10.set(valData10);
          }
          
          dataView(memory0).setUint32(base + 40, len10, true);
          dataView(memory0).setUint32(base + 36, ptr10, true);
        }
        break;
      }
      case 'b-alloc-read-channel': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 2, true);
        var {bufnum: v12_0, path: v12_1, startFrame: v12_2, numberOfFrames: v12_3, channels: v12_4, completionMsg: v12_5 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v12_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v12_1, realloc0, memory0);
        var ptr13= encodeRes.ptr;
        var len13 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len13, true);
        dataView(memory0).setUint32(base + 8, ptr13, true);
        dataView(memory0).setInt32(base + 16, toInt32(v12_2), true);
        dataView(memory0).setInt32(base + 20, toInt32(v12_3), true);
        var val14 = v12_4;
        var len14 = val14.length;
        var ptr14 = realloc0(0, 0, 4, len14 * 4);
        
        let valData14;
        const valLenBytes14 = len14 * 4;
        if (Array.isArray(val14)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv14 = new DataView(memory0.buffer);
          for (const v of val14) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv14.setInt32(ptr14+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData14 = new Uint8Array(val14.buffer || val14, val14.byteOffset, valLenBytes14);
          const out14 = new Uint8Array(memory0.buffer, ptr14, valLenBytes14);
          out14.set(valData14);
        }
        
        dataView(memory0).setUint32(base + 28, len14, true);
        dataView(memory0).setUint32(base + 24, ptr14, true);
        var variant16 = v12_5;
        if (variant16 === null || variant16=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant16;
          dataView(memory0).setInt8(base + 32, 1, true);
          var val15 = e;
          var len15 = Array.isArray(val15) ? val15.length : val15.byteLength;
          var ptr15 = realloc0(0, 0, 1, len15 * 1);
          
          let valData15;
          const valLenBytes15 = len15 * 1;
          if (Array.isArray(val15)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv15 = new DataView(memory0.buffer);
            for (const v of val15) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv15.setUint8(ptr15+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData15 = new Uint8Array(val15.buffer || val15, val15.byteOffset, valLenBytes15);
            const out15 = new Uint8Array(memory0.buffer, ptr15, valLenBytes15);
            out15.set(valData15);
          }
          
          dataView(memory0).setUint32(base + 40, len15, true);
          dataView(memory0).setUint32(base + 36, ptr15, true);
        }
        break;
      }
      case 'b-close': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 3, true);
        var {bufnum: v17_0, completionMsg: v17_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v17_0), true);
        var variant19 = v17_1;
        if (variant19 === null || variant19=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant19;
          dataView(memory0).setInt8(base + 8, 1, true);
          var val18 = e;
          var len18 = Array.isArray(val18) ? val18.length : val18.byteLength;
          var ptr18 = realloc0(0, 0, 1, len18 * 1);
          
          let valData18;
          const valLenBytes18 = len18 * 1;
          if (Array.isArray(val18)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv18 = new DataView(memory0.buffer);
            for (const v of val18) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv18.setUint8(ptr18+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData18 = new Uint8Array(val18.buffer || val18, val18.byteOffset, valLenBytes18);
            const out18 = new Uint8Array(memory0.buffer, ptr18, valLenBytes18);
            out18.set(valData18);
          }
          
          dataView(memory0).setUint32(base + 16, len18, true);
          dataView(memory0).setUint32(base + 12, ptr18, true);
        }
        break;
      }
      case 'b-fill': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 4, true);
        var {bufnum: v20_0, tail: v20_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v20_0), true);
        var vec22 = v20_1;
        var len22 = vec22.length;
        var result22 = realloc0(0, 0, 4, len22 * 12);
        for (let i = 0; i < vec22.length; i++) {
          const e = vec22[i];
          const base = result22 + i * 12;var [tuple21_0, tuple21_1, tuple21_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple21_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple21_1), true);
          dataView(memory0).setFloat32(base + 8, +tuple21_2, true);
        }
        dataView(memory0).setUint32(base + 12, len22, true);
        dataView(memory0).setUint32(base + 8, result22, true);
        break;
      }
      case 'b-free': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 5, true);
        var {bufnum: v23_0, completionMsg: v23_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v23_0), true);
        var variant25 = v23_1;
        if (variant25 === null || variant25=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant25;
          dataView(memory0).setInt8(base + 8, 1, true);
          var val24 = e;
          var len24 = Array.isArray(val24) ? val24.length : val24.byteLength;
          var ptr24 = realloc0(0, 0, 1, len24 * 1);
          
          let valData24;
          const valLenBytes24 = len24 * 1;
          if (Array.isArray(val24)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv24 = new DataView(memory0.buffer);
            for (const v of val24) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv24.setUint8(ptr24+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData24 = new Uint8Array(val24.buffer || val24, val24.byteOffset, valLenBytes24);
            const out24 = new Uint8Array(memory0.buffer, ptr24, valLenBytes24);
            out24.set(valData24);
          }
          
          dataView(memory0).setUint32(base + 16, len24, true);
          dataView(memory0).setUint32(base + 12, ptr24, true);
        }
        break;
      }
      case 'b-gen': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 6, true);
        var {bufnum: v26_0, cmd: v26_1, commandArguments: v26_2 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v26_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v26_1, realloc0, memory0);
        var ptr27= encodeRes.ptr;
        var len27 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len27, true);
        dataView(memory0).setUint32(base + 8, ptr27, true);
        var vec31 = v26_2;
        var len31 = vec31.length;
        var result31 = realloc0(0, 0, 8, len31 * 16);
        for (let i = 0; i < vec31.length; i++) {
          const e = vec31[i];
          const base = result31 + i * 16;var variant30 = e;
          switch (variant30.tag) {
            case 'int32': {
              const e = variant30.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant30.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant30.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant30.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr28= encodeRes.ptr;
              var len28 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len28, true);
              dataView(memory0).setUint32(base + 8, ptr28, true);
              break;
            }
            case 'blob': {
              const e = variant30.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val29 = e;
              var len29 = Array.isArray(val29) ? val29.length : val29.byteLength;
              var ptr29 = realloc0(0, 0, 1, len29 * 1);
              
              let valData29;
              const valLenBytes29 = len29 * 1;
              if (Array.isArray(val29)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv29 = new DataView(memory0.buffer);
                for (const v of val29) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv29.setUint8(ptr29+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData29 = new Uint8Array(val29.buffer || val29, val29.byteOffset, valLenBytes29);
                const out29 = new Uint8Array(memory0.buffer, ptr29, valLenBytes29);
                out29.set(valData29);
              }
              
              dataView(memory0).setUint32(base + 12, len29, true);
              dataView(memory0).setUint32(base + 8, ptr29, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant30.tag)}\` (received \`${variant30}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 20, len31, true);
        dataView(memory0).setUint32(base + 16, result31, true);
        break;
      }
      case 'b-get': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 7, true);
        var {bufnum: v32_0, sampleIndices: v32_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v32_0), true);
        var val33 = v32_1;
        var len33 = val33.length;
        var ptr33 = realloc0(0, 0, 4, len33 * 4);
        
        let valData33;
        const valLenBytes33 = len33 * 4;
        if (Array.isArray(val33)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv33 = new DataView(memory0.buffer);
          for (const v of val33) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv33.setInt32(ptr33+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData33 = new Uint8Array(val33.buffer || val33, val33.byteOffset, valLenBytes33);
          const out33 = new Uint8Array(memory0.buffer, ptr33, valLenBytes33);
          out33.set(valData33);
        }
        
        dataView(memory0).setUint32(base + 12, len33, true);
        dataView(memory0).setUint32(base + 8, ptr33, true);
        break;
      }
      case 'b-getn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 8, true);
        var {bufnum: v34_0, tail: v34_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v34_0), true);
        var vec36 = v34_1;
        var len36 = vec36.length;
        var result36 = realloc0(0, 0, 4, len36 * 8);
        for (let i = 0; i < vec36.length; i++) {
          const e = vec36[i];
          const base = result36 + i * 8;var [tuple35_0, tuple35_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple35_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple35_1), true);
        }
        dataView(memory0).setUint32(base + 12, len36, true);
        dataView(memory0).setUint32(base + 8, result36, true);
        break;
      }
      case 'b-query': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 9, true);
        var {bufnums: v37_0 } = e;
        var val38 = v37_0;
        var len38 = val38.length;
        var ptr38 = realloc0(0, 0, 4, len38 * 4);
        
        let valData38;
        const valLenBytes38 = len38 * 4;
        if (Array.isArray(val38)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv38 = new DataView(memory0.buffer);
          for (const v of val38) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv38.setInt32(ptr38+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData38 = new Uint8Array(val38.buffer || val38, val38.byteOffset, valLenBytes38);
          const out38 = new Uint8Array(memory0.buffer, ptr38, valLenBytes38);
          out38.set(valData38);
        }
        
        dataView(memory0).setUint32(base + 8, len38, true);
        dataView(memory0).setUint32(base + 4, ptr38, true);
        break;
      }
      case 'b-read': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 10, true);
        var {bufnum: v39_0, path: v39_1, startFrame: v39_2, numberOfFrames: v39_3, startingFrame: v39_4, leaveFileOpen: v39_5, completionMsg: v39_6 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v39_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v39_1, realloc0, memory0);
        var ptr40= encodeRes.ptr;
        var len40 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len40, true);
        dataView(memory0).setUint32(base + 8, ptr40, true);
        var variant41 = v39_2;
        if (variant41 === null || variant41=== undefined) {
          dataView(memory0).setInt8(base + 16, 0, true);
        } else {
          const e = variant41;
          dataView(memory0).setInt8(base + 16, 1, true);
          dataView(memory0).setInt32(base + 20, toInt32(e), true);
        }
        var variant42 = v39_3;
        if (variant42 === null || variant42=== undefined) {
          dataView(memory0).setInt8(base + 24, 0, true);
        } else {
          const e = variant42;
          dataView(memory0).setInt8(base + 24, 1, true);
          dataView(memory0).setInt32(base + 28, toInt32(e), true);
        }
        var variant43 = v39_4;
        if (variant43 === null || variant43=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant43;
          dataView(memory0).setInt8(base + 32, 1, true);
          dataView(memory0).setInt32(base + 36, toInt32(e), true);
        }
        var variant44 = v39_5;
        if (variant44 === null || variant44=== undefined) {
          dataView(memory0).setInt8(base + 40, 0, true);
        } else {
          const e = variant44;
          dataView(memory0).setInt8(base + 40, 1, true);
          dataView(memory0).setInt32(base + 44, toInt32(e), true);
        }
        var variant46 = v39_6;
        if (variant46 === null || variant46=== undefined) {
          dataView(memory0).setInt8(base + 48, 0, true);
        } else {
          const e = variant46;
          dataView(memory0).setInt8(base + 48, 1, true);
          var val45 = e;
          var len45 = Array.isArray(val45) ? val45.length : val45.byteLength;
          var ptr45 = realloc0(0, 0, 1, len45 * 1);
          
          let valData45;
          const valLenBytes45 = len45 * 1;
          if (Array.isArray(val45)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv45 = new DataView(memory0.buffer);
            for (const v of val45) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv45.setUint8(ptr45+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData45 = new Uint8Array(val45.buffer || val45, val45.byteOffset, valLenBytes45);
            const out45 = new Uint8Array(memory0.buffer, ptr45, valLenBytes45);
            out45.set(valData45);
          }
          
          dataView(memory0).setUint32(base + 56, len45, true);
          dataView(memory0).setUint32(base + 52, ptr45, true);
        }
        break;
      }
      case 'b-read-channel': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 11, true);
        var {bufnum: v47_0, path: v47_1, startFrame: v47_2, numberOfFrames: v47_3, startingFrame: v47_4, leaveFileOpen: v47_5, channels: v47_6, completionMsg: v47_7 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v47_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v47_1, realloc0, memory0);
        var ptr48= encodeRes.ptr;
        var len48 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len48, true);
        dataView(memory0).setUint32(base + 8, ptr48, true);
        dataView(memory0).setInt32(base + 16, toInt32(v47_2), true);
        dataView(memory0).setInt32(base + 20, toInt32(v47_3), true);
        dataView(memory0).setInt32(base + 24, toInt32(v47_4), true);
        dataView(memory0).setInt32(base + 28, toInt32(v47_5), true);
        var val49 = v47_6;
        var len49 = val49.length;
        var ptr49 = realloc0(0, 0, 4, len49 * 4);
        
        let valData49;
        const valLenBytes49 = len49 * 4;
        if (Array.isArray(val49)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv49 = new DataView(memory0.buffer);
          for (const v of val49) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv49.setInt32(ptr49+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData49 = new Uint8Array(val49.buffer || val49, val49.byteOffset, valLenBytes49);
          const out49 = new Uint8Array(memory0.buffer, ptr49, valLenBytes49);
          out49.set(valData49);
        }
        
        dataView(memory0).setUint32(base + 36, len49, true);
        dataView(memory0).setUint32(base + 32, ptr49, true);
        var variant51 = v47_7;
        if (variant51 === null || variant51=== undefined) {
          dataView(memory0).setInt8(base + 40, 0, true);
        } else {
          const e = variant51;
          dataView(memory0).setInt8(base + 40, 1, true);
          var val50 = e;
          var len50 = Array.isArray(val50) ? val50.length : val50.byteLength;
          var ptr50 = realloc0(0, 0, 1, len50 * 1);
          
          let valData50;
          const valLenBytes50 = len50 * 1;
          if (Array.isArray(val50)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv50 = new DataView(memory0.buffer);
            for (const v of val50) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv50.setUint8(ptr50+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData50 = new Uint8Array(val50.buffer || val50, val50.byteOffset, valLenBytes50);
            const out50 = new Uint8Array(memory0.buffer, ptr50, valLenBytes50);
            out50.set(valData50);
          }
          
          dataView(memory0).setUint32(base + 48, len50, true);
          dataView(memory0).setUint32(base + 44, ptr50, true);
        }
        break;
      }
      case 'b-set': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 12, true);
        var {bufnum: v52_0, tail: v52_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v52_0), true);
        var vec54 = v52_1;
        var len54 = vec54.length;
        var result54 = realloc0(0, 0, 4, len54 * 8);
        for (let i = 0; i < vec54.length; i++) {
          const e = vec54[i];
          const base = result54 + i * 8;var [tuple53_0, tuple53_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple53_0), true);
          dataView(memory0).setFloat32(base + 4, +tuple53_1, true);
        }
        dataView(memory0).setUint32(base + 12, len54, true);
        dataView(memory0).setUint32(base + 8, result54, true);
        break;
      }
      case 'b-set-sample-rate': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 13, true);
        var {bufnum: v55_0, theDesiredSampling: v55_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v55_0), true);
        dataView(memory0).setFloat32(base + 8, +v55_1, true);
        break;
      }
      case 'b-setn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 14, true);
        var {bufnum: v56_0, tail: v56_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v56_0), true);
        var vec59 = v56_1;
        var len59 = vec59.length;
        var result59 = realloc0(0, 0, 4, len59 * 12);
        for (let i = 0; i < vec59.length; i++) {
          const e = vec59[i];
          const base = result59 + i * 12;var [tuple57_0, tuple57_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple57_0), true);
          var val58 = tuple57_1;
          var len58 = val58.length;
          var ptr58 = realloc0(0, 0, 4, len58 * 4);
          
          let valData58;
          const valLenBytes58 = len58 * 4;
          if (Array.isArray(val58)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv58 = new DataView(memory0.buffer);
            for (const v of val58) {
              _requireValidNumericPrimitive.bind(null, 'f32')(v);
              dv58.setFloat32(ptr58+ offset, v, true);
              offset += 4;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData58 = new Uint8Array(val58.buffer || val58, val58.byteOffset, valLenBytes58);
            const out58 = new Uint8Array(memory0.buffer, ptr58, valLenBytes58);
            out58.set(valData58);
          }
          
          dataView(memory0).setUint32(base + 8, len58, true);
          dataView(memory0).setUint32(base + 4, ptr58, true);
        }
        dataView(memory0).setUint32(base + 12, len59, true);
        dataView(memory0).setUint32(base + 8, result59, true);
        break;
      }
      case 'b-write': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 15, true);
        var {bufnum: v60_0, path: v60_1, headerFormat: v60_2, sampleFormat: v60_3, numberOfFrames: v60_4, startingFrame: v60_5, leaveFileOpen: v60_6, completionMsg: v60_7 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v60_0), true);
        
        var encodeRes = _utf8AllocateAndEncode(v60_1, realloc0, memory0);
        var ptr61= encodeRes.ptr;
        var len61 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 12, len61, true);
        dataView(memory0).setUint32(base + 8, ptr61, true);
        
        var encodeRes = _utf8AllocateAndEncode(v60_2, realloc0, memory0);
        var ptr62= encodeRes.ptr;
        var len62 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 20, len62, true);
        dataView(memory0).setUint32(base + 16, ptr62, true);
        
        var encodeRes = _utf8AllocateAndEncode(v60_3, realloc0, memory0);
        var ptr63= encodeRes.ptr;
        var len63 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 28, len63, true);
        dataView(memory0).setUint32(base + 24, ptr63, true);
        var variant64 = v60_4;
        if (variant64 === null || variant64=== undefined) {
          dataView(memory0).setInt8(base + 32, 0, true);
        } else {
          const e = variant64;
          dataView(memory0).setInt8(base + 32, 1, true);
          dataView(memory0).setInt32(base + 36, toInt32(e), true);
        }
        var variant65 = v60_5;
        if (variant65 === null || variant65=== undefined) {
          dataView(memory0).setInt8(base + 40, 0, true);
        } else {
          const e = variant65;
          dataView(memory0).setInt8(base + 40, 1, true);
          dataView(memory0).setInt32(base + 44, toInt32(e), true);
        }
        var variant66 = v60_6;
        if (variant66 === null || variant66=== undefined) {
          dataView(memory0).setInt8(base + 48, 0, true);
        } else {
          const e = variant66;
          dataView(memory0).setInt8(base + 48, 1, true);
          dataView(memory0).setInt32(base + 52, toInt32(e), true);
        }
        var variant68 = v60_7;
        if (variant68 === null || variant68=== undefined) {
          dataView(memory0).setInt8(base + 56, 0, true);
        } else {
          const e = variant68;
          dataView(memory0).setInt8(base + 56, 1, true);
          var val67 = e;
          var len67 = Array.isArray(val67) ? val67.length : val67.byteLength;
          var ptr67 = realloc0(0, 0, 1, len67 * 1);
          
          let valData67;
          const valLenBytes67 = len67 * 1;
          if (Array.isArray(val67)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv67 = new DataView(memory0.buffer);
            for (const v of val67) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv67.setUint8(ptr67+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData67 = new Uint8Array(val67.buffer || val67, val67.byteOffset, valLenBytes67);
            const out67 = new Uint8Array(memory0.buffer, ptr67, valLenBytes67);
            out67.set(valData67);
          }
          
          dataView(memory0).setUint32(base + 64, len67, true);
          dataView(memory0).setUint32(base + 60, ptr67, true);
        }
        break;
      }
      case 'b-zero': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 16, true);
        var {bufnum: v69_0, completionMsg: v69_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v69_0), true);
        var variant71 = v69_1;
        if (variant71 === null || variant71=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant71;
          dataView(memory0).setInt8(base + 8, 1, true);
          var val70 = e;
          var len70 = Array.isArray(val70) ? val70.length : val70.byteLength;
          var ptr70 = realloc0(0, 0, 1, len70 * 1);
          
          let valData70;
          const valLenBytes70 = len70 * 1;
          if (Array.isArray(val70)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv70 = new DataView(memory0.buffer);
            for (const v of val70) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv70.setUint8(ptr70+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData70 = new Uint8Array(val70.buffer || val70, val70.byteOffset, valLenBytes70);
            const out70 = new Uint8Array(memory0.buffer, ptr70, valLenBytes70);
            out70.set(valData70);
          }
          
          dataView(memory0).setUint32(base + 16, len70, true);
          dataView(memory0).setUint32(base + 12, ptr70, true);
        }
        break;
      }
      case 'c-fill': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 17, true);
        var {tail: v72_0 } = e;
        var vec75 = v72_0;
        var len75 = vec75.length;
        var result75 = realloc0(0, 0, 4, len75 * 16);
        for (let i = 0; i < vec75.length; i++) {
          const e = vec75[i];
          const base = result75 + i * 16;var [tuple73_0, tuple73_1, tuple73_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple73_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple73_1), true);
          var variant74 = tuple73_2;
          switch (variant74.tag) {
            case 'float': {
              const e = variant74.val;
              dataView(memory0).setInt8(base + 8, 0, true);
              dataView(memory0).setFloat32(base + 12, +e, true);
              break;
            }
            case 'int': {
              const e = variant74.val;
              dataView(memory0).setInt8(base + 8, 1, true);
              dataView(memory0).setInt32(base + 12, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant74.tag)}\` (received \`${variant74}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 8, len75, true);
        dataView(memory0).setUint32(base + 4, result75, true);
        break;
      }
      case 'c-get': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 18, true);
        var {busIndices: v76_0 } = e;
        var val77 = v76_0;
        var len77 = val77.length;
        var ptr77 = realloc0(0, 0, 4, len77 * 4);
        
        let valData77;
        const valLenBytes77 = len77 * 4;
        if (Array.isArray(val77)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv77 = new DataView(memory0.buffer);
          for (const v of val77) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv77.setInt32(ptr77+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData77 = new Uint8Array(val77.buffer || val77, val77.byteOffset, valLenBytes77);
          const out77 = new Uint8Array(memory0.buffer, ptr77, valLenBytes77);
          out77.set(valData77);
        }
        
        dataView(memory0).setUint32(base + 8, len77, true);
        dataView(memory0).setUint32(base + 4, ptr77, true);
        break;
      }
      case 'c-getn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 19, true);
        var {tail: v78_0 } = e;
        var vec80 = v78_0;
        var len80 = vec80.length;
        var result80 = realloc0(0, 0, 4, len80 * 8);
        for (let i = 0; i < vec80.length; i++) {
          const e = vec80[i];
          const base = result80 + i * 8;var [tuple79_0, tuple79_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple79_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple79_1), true);
        }
        dataView(memory0).setUint32(base + 8, len80, true);
        dataView(memory0).setUint32(base + 4, result80, true);
        break;
      }
      case 'c-set': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 20, true);
        var {tail: v81_0 } = e;
        var vec84 = v81_0;
        var len84 = vec84.length;
        var result84 = realloc0(0, 0, 4, len84 * 12);
        for (let i = 0; i < vec84.length; i++) {
          const e = vec84[i];
          const base = result84 + i * 12;var [tuple82_0, tuple82_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple82_0), true);
          var variant83 = tuple82_1;
          switch (variant83.tag) {
            case 'float': {
              const e = variant83.val;
              dataView(memory0).setInt8(base + 4, 0, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'int': {
              const e = variant83.val;
              dataView(memory0).setInt8(base + 4, 1, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant83.tag)}\` (received \`${variant83}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 8, len84, true);
        dataView(memory0).setUint32(base + 4, result84, true);
        break;
      }
      case 'c-setn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 21, true);
        var {tail: v85_0 } = e;
        var vec89 = v85_0;
        var len89 = vec89.length;
        var result89 = realloc0(0, 0, 4, len89 * 12);
        for (let i = 0; i < vec89.length; i++) {
          const e = vec89[i];
          const base = result89 + i * 12;var [tuple86_0, tuple86_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple86_0), true);
          var vec88 = tuple86_1;
          var len88 = vec88.length;
          var result88 = realloc0(0, 0, 4, len88 * 8);
          for (let i = 0; i < vec88.length; i++) {
            const e = vec88[i];
            const base = result88 + i * 8;var variant87 = e;
            switch (variant87.tag) {
              case 'float': {
                const e = variant87.val;
                dataView(memory0).setInt8(base + 0, 0, true);
                dataView(memory0).setFloat32(base + 4, +e, true);
                break;
              }
              case 'int': {
                const e = variant87.val;
                dataView(memory0).setInt8(base + 0, 1, true);
                dataView(memory0).setInt32(base + 4, toInt32(e), true);
                break;
              }
              default: {
                throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant87.tag)}\` (received \`${variant87}\`) specified for \`NumericValue\``);
              }
            }
          }
          dataView(memory0).setUint32(base + 8, len88, true);
          dataView(memory0).setUint32(base + 4, result88, true);
        }
        dataView(memory0).setUint32(base + 8, len89, true);
        dataView(memory0).setUint32(base + 4, result89, true);
        break;
      }
      case 'clear-sched': {
        dataView(memory0).setInt8(base + 0, 22, true);
        break;
      }
      case 'cmd': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 23, true);
        var {cmd: v90_0, anyArguments: v90_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v90_0, realloc0, memory0);
        var ptr91= encodeRes.ptr;
        var len91 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len91, true);
        dataView(memory0).setUint32(base + 4, ptr91, true);
        var vec95 = v90_1;
        var len95 = vec95.length;
        var result95 = realloc0(0, 0, 8, len95 * 16);
        for (let i = 0; i < vec95.length; i++) {
          const e = vec95[i];
          const base = result95 + i * 16;var variant94 = e;
          switch (variant94.tag) {
            case 'int32': {
              const e = variant94.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant94.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant94.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant94.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr92= encodeRes.ptr;
              var len92 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len92, true);
              dataView(memory0).setUint32(base + 8, ptr92, true);
              break;
            }
            case 'blob': {
              const e = variant94.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val93 = e;
              var len93 = Array.isArray(val93) ? val93.length : val93.byteLength;
              var ptr93 = realloc0(0, 0, 1, len93 * 1);
              
              let valData93;
              const valLenBytes93 = len93 * 1;
              if (Array.isArray(val93)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv93 = new DataView(memory0.buffer);
                for (const v of val93) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv93.setUint8(ptr93+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData93 = new Uint8Array(val93.buffer || val93, val93.byteOffset, valLenBytes93);
                const out93 = new Uint8Array(memory0.buffer, ptr93, valLenBytes93);
                out93.set(valData93);
              }
              
              dataView(memory0).setUint32(base + 12, len93, true);
              dataView(memory0).setUint32(base + 8, ptr93, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant94.tag)}\` (received \`${variant94}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 16, len95, true);
        dataView(memory0).setUint32(base + 12, result95, true);
        break;
      }
      case 'd-free': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 24, true);
        var {synthDefNames: v96_0 } = e;
        var vec98 = v96_0;
        var len98 = vec98.length;
        var result98 = realloc0(0, 0, 4, len98 * 8);
        for (let i = 0; i < vec98.length; i++) {
          const e = vec98[i];
          const base = result98 + i * 8;
          var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
          var ptr97= encodeRes.ptr;
          var len97 = encodeRes.len;
          
          dataView(memory0).setUint32(base + 4, len97, true);
          dataView(memory0).setUint32(base + 0, ptr97, true);
        }
        dataView(memory0).setUint32(base + 8, len98, true);
        dataView(memory0).setUint32(base + 4, result98, true);
        break;
      }
      case 'd-load': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 25, true);
        var {pathnameOfFile: v99_0, completionMsg: v99_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v99_0, realloc0, memory0);
        var ptr100= encodeRes.ptr;
        var len100 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len100, true);
        dataView(memory0).setUint32(base + 4, ptr100, true);
        var variant102 = v99_1;
        if (variant102 === null || variant102=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant102;
          dataView(memory0).setInt8(base + 12, 1, true);
          var val101 = e;
          var len101 = Array.isArray(val101) ? val101.length : val101.byteLength;
          var ptr101 = realloc0(0, 0, 1, len101 * 1);
          
          let valData101;
          const valLenBytes101 = len101 * 1;
          if (Array.isArray(val101)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv101 = new DataView(memory0.buffer);
            for (const v of val101) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv101.setUint8(ptr101+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData101 = new Uint8Array(val101.buffer || val101, val101.byteOffset, valLenBytes101);
            const out101 = new Uint8Array(memory0.buffer, ptr101, valLenBytes101);
            out101.set(valData101);
          }
          
          dataView(memory0).setUint32(base + 20, len101, true);
          dataView(memory0).setUint32(base + 16, ptr101, true);
        }
        break;
      }
      case 'd-load-dir': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 26, true);
        var {pathnameOfDirectory: v103_0, completionMsg: v103_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v103_0, realloc0, memory0);
        var ptr104= encodeRes.ptr;
        var len104 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len104, true);
        dataView(memory0).setUint32(base + 4, ptr104, true);
        var variant106 = v103_1;
        if (variant106 === null || variant106=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant106;
          dataView(memory0).setInt8(base + 12, 1, true);
          var val105 = e;
          var len105 = Array.isArray(val105) ? val105.length : val105.byteLength;
          var ptr105 = realloc0(0, 0, 1, len105 * 1);
          
          let valData105;
          const valLenBytes105 = len105 * 1;
          if (Array.isArray(val105)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv105 = new DataView(memory0.buffer);
            for (const v of val105) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv105.setUint8(ptr105+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData105 = new Uint8Array(val105.buffer || val105, val105.byteOffset, valLenBytes105);
            const out105 = new Uint8Array(memory0.buffer, ptr105, valLenBytes105);
            out105.set(valData105);
          }
          
          dataView(memory0).setUint32(base + 20, len105, true);
          dataView(memory0).setUint32(base + 16, ptr105, true);
        }
        break;
      }
      case 'd-recv': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 27, true);
        var {bufferOfData: v107_0, completionMsg: v107_1 } = e;
        var val108 = v107_0;
        var len108 = Array.isArray(val108) ? val108.length : val108.byteLength;
        var ptr108 = realloc0(0, 0, 1, len108 * 1);
        
        let valData108;
        const valLenBytes108 = len108 * 1;
        if (Array.isArray(val108)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv108 = new DataView(memory0.buffer);
          for (const v of val108) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv108.setUint8(ptr108+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData108 = new Uint8Array(val108.buffer || val108, val108.byteOffset, valLenBytes108);
          const out108 = new Uint8Array(memory0.buffer, ptr108, valLenBytes108);
          out108.set(valData108);
        }
        
        dataView(memory0).setUint32(base + 8, len108, true);
        dataView(memory0).setUint32(base + 4, ptr108, true);
        var variant110 = v107_1;
        if (variant110 === null || variant110=== undefined) {
          dataView(memory0).setInt8(base + 12, 0, true);
        } else {
          const e = variant110;
          dataView(memory0).setInt8(base + 12, 1, true);
          var val109 = e;
          var len109 = Array.isArray(val109) ? val109.length : val109.byteLength;
          var ptr109 = realloc0(0, 0, 1, len109 * 1);
          
          let valData109;
          const valLenBytes109 = len109 * 1;
          if (Array.isArray(val109)) {
            // Regular array likely containing numbers, write values to memory
            let offset = 0;
            const dv109 = new DataView(memory0.buffer);
            for (const v of val109) {
              _requireValidNumericPrimitive.bind(null, 'u8')(v);
              dv109.setUint8(ptr109+ offset, v, true);
              offset += 1;
            }
          } else {
            // TypedArray / ArrayBuffer-like, direct copy
            valData109 = new Uint8Array(val109.buffer || val109, val109.byteOffset, valLenBytes109);
            const out109 = new Uint8Array(memory0.buffer, ptr109, valLenBytes109);
            out109.set(valData109);
          }
          
          dataView(memory0).setUint32(base + 20, len109, true);
          dataView(memory0).setUint32(base + 16, ptr109, true);
        }
        break;
      }
      case 'dump-osc': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 28, true);
        var {code: v111_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v111_0), true);
        break;
      }
      case 'error': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 29, true);
        var {mode: v112_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v112_0), true);
        break;
      }
      case 'g-deep-free': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 30, true);
        var {groupIds: v113_0 } = e;
        var val114 = v113_0;
        var len114 = val114.length;
        var ptr114 = realloc0(0, 0, 4, len114 * 4);
        
        let valData114;
        const valLenBytes114 = len114 * 4;
        if (Array.isArray(val114)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv114 = new DataView(memory0.buffer);
          for (const v of val114) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv114.setInt32(ptr114+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData114 = new Uint8Array(val114.buffer || val114, val114.byteOffset, valLenBytes114);
          const out114 = new Uint8Array(memory0.buffer, ptr114, valLenBytes114);
          out114.set(valData114);
        }
        
        dataView(memory0).setUint32(base + 8, len114, true);
        dataView(memory0).setUint32(base + 4, ptr114, true);
        break;
      }
      case 'g-dump-tree': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 31, true);
        var {tail: v115_0 } = e;
        var vec117 = v115_0;
        var len117 = vec117.length;
        var result117 = realloc0(0, 0, 4, len117 * 8);
        for (let i = 0; i < vec117.length; i++) {
          const e = vec117[i];
          const base = result117 + i * 8;var [tuple116_0, tuple116_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple116_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple116_1), true);
        }
        dataView(memory0).setUint32(base + 8, len117, true);
        dataView(memory0).setUint32(base + 4, result117, true);
        break;
      }
      case 'g-free-all': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 32, true);
        var {groupIds: v118_0 } = e;
        var val119 = v118_0;
        var len119 = val119.length;
        var ptr119 = realloc0(0, 0, 4, len119 * 4);
        
        let valData119;
        const valLenBytes119 = len119 * 4;
        if (Array.isArray(val119)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv119 = new DataView(memory0.buffer);
          for (const v of val119) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv119.setInt32(ptr119+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData119 = new Uint8Array(val119.buffer || val119, val119.byteOffset, valLenBytes119);
          const out119 = new Uint8Array(memory0.buffer, ptr119, valLenBytes119);
          out119.set(valData119);
        }
        
        dataView(memory0).setUint32(base + 8, len119, true);
        dataView(memory0).setUint32(base + 4, ptr119, true);
        break;
      }
      case 'g-head': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 33, true);
        var {tail: v120_0 } = e;
        var vec122 = v120_0;
        var len122 = vec122.length;
        var result122 = realloc0(0, 0, 4, len122 * 8);
        for (let i = 0; i < vec122.length; i++) {
          const e = vec122[i];
          const base = result122 + i * 8;var [tuple121_0, tuple121_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple121_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple121_1), true);
        }
        dataView(memory0).setUint32(base + 8, len122, true);
        dataView(memory0).setUint32(base + 4, result122, true);
        break;
      }
      case 'g-new': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 34, true);
        var {tail: v123_0 } = e;
        var vec125 = v123_0;
        var len125 = vec125.length;
        var result125 = realloc0(0, 0, 4, len125 * 12);
        for (let i = 0; i < vec125.length; i++) {
          const e = vec125[i];
          const base = result125 + i * 12;var [tuple124_0, tuple124_1, tuple124_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple124_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple124_1), true);
          dataView(memory0).setInt32(base + 8, toInt32(tuple124_2), true);
        }
        dataView(memory0).setUint32(base + 8, len125, true);
        dataView(memory0).setUint32(base + 4, result125, true);
        break;
      }
      case 'g-query-tree': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 35, true);
        var {tail: v126_0 } = e;
        var vec128 = v126_0;
        var len128 = vec128.length;
        var result128 = realloc0(0, 0, 4, len128 * 8);
        for (let i = 0; i < vec128.length; i++) {
          const e = vec128[i];
          const base = result128 + i * 8;var [tuple127_0, tuple127_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple127_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple127_1), true);
        }
        dataView(memory0).setUint32(base + 8, len128, true);
        dataView(memory0).setUint32(base + 4, result128, true);
        break;
      }
      case 'g-tail': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 36, true);
        var {tail: v129_0 } = e;
        var vec131 = v129_0;
        var len131 = vec131.length;
        var result131 = realloc0(0, 0, 4, len131 * 8);
        for (let i = 0; i < vec131.length; i++) {
          const e = vec131[i];
          const base = result131 + i * 8;var [tuple130_0, tuple130_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple130_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple130_1), true);
        }
        dataView(memory0).setUint32(base + 8, len131, true);
        dataView(memory0).setUint32(base + 4, result131, true);
        break;
      }
      case 'n-after': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 37, true);
        var {tail: v132_0 } = e;
        var vec134 = v132_0;
        var len134 = vec134.length;
        var result134 = realloc0(0, 0, 4, len134 * 8);
        for (let i = 0; i < vec134.length; i++) {
          const e = vec134[i];
          const base = result134 + i * 8;var [tuple133_0, tuple133_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple133_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple133_1), true);
        }
        dataView(memory0).setUint32(base + 8, len134, true);
        dataView(memory0).setUint32(base + 4, result134, true);
        break;
      }
      case 'n-before': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 38, true);
        var {tail: v135_0 } = e;
        var vec137 = v135_0;
        var len137 = vec137.length;
        var result137 = realloc0(0, 0, 4, len137 * 8);
        for (let i = 0; i < vec137.length; i++) {
          const e = vec137[i];
          const base = result137 + i * 8;var [tuple136_0, tuple136_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple136_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple136_1), true);
        }
        dataView(memory0).setUint32(base + 8, len137, true);
        dataView(memory0).setUint32(base + 4, result137, true);
        break;
      }
      case 'n-fill': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 39, true);
        var {nodeId: v138_0, tail: v138_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v138_0), true);
        var vec143 = v138_1;
        var len143 = vec143.length;
        var result143 = realloc0(0, 0, 4, len143 * 24);
        for (let i = 0; i < vec143.length; i++) {
          const e = vec143[i];
          const base = result143 + i * 24;var [tuple139_0, tuple139_1, tuple139_2] = e;
          var variant141 = tuple139_0;
          switch (variant141.tag) {
            case 'index': {
              const e = variant141.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant141.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr140= encodeRes.ptr;
              var len140 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len140, true);
              dataView(memory0).setUint32(base + 4, ptr140, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant141.tag)}\` (received \`${variant141}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple139_1), true);
          var variant142 = tuple139_2;
          switch (variant142.tag) {
            case 'float': {
              const e = variant142.val;
              dataView(memory0).setInt8(base + 16, 0, true);
              dataView(memory0).setFloat32(base + 20, +e, true);
              break;
            }
            case 'int': {
              const e = variant142.val;
              dataView(memory0).setInt8(base + 16, 1, true);
              dataView(memory0).setInt32(base + 20, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant142.tag)}\` (received \`${variant142}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 12, len143, true);
        dataView(memory0).setUint32(base + 8, result143, true);
        break;
      }
      case 'n-free': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 40, true);
        var {nodeIds: v144_0 } = e;
        var val145 = v144_0;
        var len145 = val145.length;
        var ptr145 = realloc0(0, 0, 4, len145 * 4);
        
        let valData145;
        const valLenBytes145 = len145 * 4;
        if (Array.isArray(val145)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv145 = new DataView(memory0.buffer);
          for (const v of val145) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv145.setInt32(ptr145+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData145 = new Uint8Array(val145.buffer || val145, val145.byteOffset, valLenBytes145);
          const out145 = new Uint8Array(memory0.buffer, ptr145, valLenBytes145);
          out145.set(valData145);
        }
        
        dataView(memory0).setUint32(base + 8, len145, true);
        dataView(memory0).setUint32(base + 4, ptr145, true);
        break;
      }
      case 'n-map': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 41, true);
        var {nodeId: v146_0, tail: v146_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v146_0), true);
        var vec150 = v146_1;
        var len150 = vec150.length;
        var result150 = realloc0(0, 0, 4, len150 * 16);
        for (let i = 0; i < vec150.length; i++) {
          const e = vec150[i];
          const base = result150 + i * 16;var [tuple147_0, tuple147_1] = e;
          var variant149 = tuple147_0;
          switch (variant149.tag) {
            case 'index': {
              const e = variant149.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant149.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr148= encodeRes.ptr;
              var len148 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len148, true);
              dataView(memory0).setUint32(base + 4, ptr148, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant149.tag)}\` (received \`${variant149}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple147_1), true);
        }
        dataView(memory0).setUint32(base + 12, len150, true);
        dataView(memory0).setUint32(base + 8, result150, true);
        break;
      }
      case 'n-mapa': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 42, true);
        var {nodeId: v151_0, tail: v151_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v151_0), true);
        var vec155 = v151_1;
        var len155 = vec155.length;
        var result155 = realloc0(0, 0, 4, len155 * 16);
        for (let i = 0; i < vec155.length; i++) {
          const e = vec155[i];
          const base = result155 + i * 16;var [tuple152_0, tuple152_1] = e;
          var variant154 = tuple152_0;
          switch (variant154.tag) {
            case 'index': {
              const e = variant154.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant154.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr153= encodeRes.ptr;
              var len153 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len153, true);
              dataView(memory0).setUint32(base + 4, ptr153, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant154.tag)}\` (received \`${variant154}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple152_1), true);
        }
        dataView(memory0).setUint32(base + 12, len155, true);
        dataView(memory0).setUint32(base + 8, result155, true);
        break;
      }
      case 'n-mapan': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 43, true);
        var {nodeId: v156_0, tail: v156_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v156_0), true);
        var vec160 = v156_1;
        var len160 = vec160.length;
        var result160 = realloc0(0, 0, 4, len160 * 20);
        for (let i = 0; i < vec160.length; i++) {
          const e = vec160[i];
          const base = result160 + i * 20;var [tuple157_0, tuple157_1, tuple157_2] = e;
          var variant159 = tuple157_0;
          switch (variant159.tag) {
            case 'index': {
              const e = variant159.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant159.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr158= encodeRes.ptr;
              var len158 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len158, true);
              dataView(memory0).setUint32(base + 4, ptr158, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant159.tag)}\` (received \`${variant159}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple157_1), true);
          dataView(memory0).setInt32(base + 16, toInt32(tuple157_2), true);
        }
        dataView(memory0).setUint32(base + 12, len160, true);
        dataView(memory0).setUint32(base + 8, result160, true);
        break;
      }
      case 'n-mapn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 44, true);
        var {nodeId: v161_0, tail: v161_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v161_0), true);
        var vec165 = v161_1;
        var len165 = vec165.length;
        var result165 = realloc0(0, 0, 4, len165 * 20);
        for (let i = 0; i < vec165.length; i++) {
          const e = vec165[i];
          const base = result165 + i * 20;var [tuple162_0, tuple162_1, tuple162_2] = e;
          var variant164 = tuple162_0;
          switch (variant164.tag) {
            case 'index': {
              const e = variant164.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant164.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr163= encodeRes.ptr;
              var len163 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len163, true);
              dataView(memory0).setUint32(base + 4, ptr163, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant164.tag)}\` (received \`${variant164}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple162_1), true);
          dataView(memory0).setInt32(base + 16, toInt32(tuple162_2), true);
        }
        dataView(memory0).setUint32(base + 12, len165, true);
        dataView(memory0).setUint32(base + 8, result165, true);
        break;
      }
      case 'n-order': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 45, true);
        var {addAction: v166_0, targetId: v166_1, nodeIds: v166_2 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v166_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v166_1), true);
        var val167 = v166_2;
        var len167 = val167.length;
        var ptr167 = realloc0(0, 0, 4, len167 * 4);
        
        let valData167;
        const valLenBytes167 = len167 * 4;
        if (Array.isArray(val167)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv167 = new DataView(memory0.buffer);
          for (const v of val167) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv167.setInt32(ptr167+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData167 = new Uint8Array(val167.buffer || val167, val167.byteOffset, valLenBytes167);
          const out167 = new Uint8Array(memory0.buffer, ptr167, valLenBytes167);
          out167.set(valData167);
        }
        
        dataView(memory0).setUint32(base + 16, len167, true);
        dataView(memory0).setUint32(base + 12, ptr167, true);
        break;
      }
      case 'n-query': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 46, true);
        var {nodeIds: v168_0 } = e;
        var val169 = v168_0;
        var len169 = val169.length;
        var ptr169 = realloc0(0, 0, 4, len169 * 4);
        
        let valData169;
        const valLenBytes169 = len169 * 4;
        if (Array.isArray(val169)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv169 = new DataView(memory0.buffer);
          for (const v of val169) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv169.setInt32(ptr169+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData169 = new Uint8Array(val169.buffer || val169, val169.byteOffset, valLenBytes169);
          const out169 = new Uint8Array(memory0.buffer, ptr169, valLenBytes169);
          out169.set(valData169);
        }
        
        dataView(memory0).setUint32(base + 8, len169, true);
        dataView(memory0).setUint32(base + 4, ptr169, true);
        break;
      }
      case 'n-run': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 47, true);
        var {tail: v170_0 } = e;
        var vec172 = v170_0;
        var len172 = vec172.length;
        var result172 = realloc0(0, 0, 4, len172 * 8);
        for (let i = 0; i < vec172.length; i++) {
          const e = vec172[i];
          const base = result172 + i * 8;var [tuple171_0, tuple171_1] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple171_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple171_1), true);
        }
        dataView(memory0).setUint32(base + 8, len172, true);
        dataView(memory0).setUint32(base + 4, result172, true);
        break;
      }
      case 'n-set': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 48, true);
        var {nodeId: v173_0, tail: v173_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v173_0), true);
        var vec178 = v173_1;
        var len178 = vec178.length;
        var result178 = realloc0(0, 0, 4, len178 * 20);
        for (let i = 0; i < vec178.length; i++) {
          const e = vec178[i];
          const base = result178 + i * 20;var [tuple174_0, tuple174_1] = e;
          var variant176 = tuple174_0;
          switch (variant176.tag) {
            case 'index': {
              const e = variant176.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant176.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr175= encodeRes.ptr;
              var len175 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len175, true);
              dataView(memory0).setUint32(base + 4, ptr175, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant176.tag)}\` (received \`${variant176}\`) specified for \`ControlId\``);
            }
          }
          var variant177 = tuple174_1;
          switch (variant177.tag) {
            case 'float': {
              const e = variant177.val;
              dataView(memory0).setInt8(base + 12, 0, true);
              dataView(memory0).setFloat32(base + 16, +e, true);
              break;
            }
            case 'int': {
              const e = variant177.val;
              dataView(memory0).setInt8(base + 12, 1, true);
              dataView(memory0).setInt32(base + 16, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant177.tag)}\` (received \`${variant177}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 12, len178, true);
        dataView(memory0).setUint32(base + 8, result178, true);
        break;
      }
      case 'n-setn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 49, true);
        var {nodeId: v179_0, tail: v179_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v179_0), true);
        var vec185 = v179_1;
        var len185 = vec185.length;
        var result185 = realloc0(0, 0, 4, len185 * 20);
        for (let i = 0; i < vec185.length; i++) {
          const e = vec185[i];
          const base = result185 + i * 20;var [tuple180_0, tuple180_1] = e;
          var variant182 = tuple180_0;
          switch (variant182.tag) {
            case 'index': {
              const e = variant182.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant182.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr181= encodeRes.ptr;
              var len181 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len181, true);
              dataView(memory0).setUint32(base + 4, ptr181, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant182.tag)}\` (received \`${variant182}\`) specified for \`ControlId\``);
            }
          }
          var vec184 = tuple180_1;
          var len184 = vec184.length;
          var result184 = realloc0(0, 0, 4, len184 * 8);
          for (let i = 0; i < vec184.length; i++) {
            const e = vec184[i];
            const base = result184 + i * 8;var variant183 = e;
            switch (variant183.tag) {
              case 'float': {
                const e = variant183.val;
                dataView(memory0).setInt8(base + 0, 0, true);
                dataView(memory0).setFloat32(base + 4, +e, true);
                break;
              }
              case 'int': {
                const e = variant183.val;
                dataView(memory0).setInt8(base + 0, 1, true);
                dataView(memory0).setInt32(base + 4, toInt32(e), true);
                break;
              }
              default: {
                throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant183.tag)}\` (received \`${variant183}\`) specified for \`NumericValue\``);
              }
            }
          }
          dataView(memory0).setUint32(base + 16, len184, true);
          dataView(memory0).setUint32(base + 12, result184, true);
        }
        dataView(memory0).setUint32(base + 12, len185, true);
        dataView(memory0).setUint32(base + 8, result185, true);
        break;
      }
      case 'n-trace': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 50, true);
        var {nodeIds: v186_0 } = e;
        var val187 = v186_0;
        var len187 = val187.length;
        var ptr187 = realloc0(0, 0, 4, len187 * 4);
        
        let valData187;
        const valLenBytes187 = len187 * 4;
        if (Array.isArray(val187)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv187 = new DataView(memory0.buffer);
          for (const v of val187) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv187.setInt32(ptr187+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData187 = new Uint8Array(val187.buffer || val187, val187.byteOffset, valLenBytes187);
          const out187 = new Uint8Array(memory0.buffer, ptr187, valLenBytes187);
          out187.set(valData187);
        }
        
        dataView(memory0).setUint32(base + 8, len187, true);
        dataView(memory0).setUint32(base + 4, ptr187, true);
        break;
      }
      case 'notify': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 51, true);
        var {enable: v188_0, clientId: v188_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v188_0), true);
        var variant189 = v188_1;
        if (variant189 === null || variant189=== undefined) {
          dataView(memory0).setInt8(base + 8, 0, true);
        } else {
          const e = variant189;
          dataView(memory0).setInt8(base + 8, 1, true);
          dataView(memory0).setInt32(base + 12, toInt32(e), true);
        }
        break;
      }
      case 'nrt-end': {
        dataView(memory0).setInt8(base + 0, 52, true);
        break;
      }
      case 'p-new': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 53, true);
        var {tail: v190_0 } = e;
        var vec192 = v190_0;
        var len192 = vec192.length;
        var result192 = realloc0(0, 0, 4, len192 * 12);
        for (let i = 0; i < vec192.length; i++) {
          const e = vec192[i];
          const base = result192 + i * 12;var [tuple191_0, tuple191_1, tuple191_2] = e;
          dataView(memory0).setInt32(base + 0, toInt32(tuple191_0), true);
          dataView(memory0).setInt32(base + 4, toInt32(tuple191_1), true);
          dataView(memory0).setInt32(base + 8, toInt32(tuple191_2), true);
        }
        dataView(memory0).setUint32(base + 8, len192, true);
        dataView(memory0).setUint32(base + 4, result192, true);
        break;
      }
      case 'quit': {
        dataView(memory0).setInt8(base + 0, 54, true);
        break;
      }
      case 'rt-memory-status': {
        dataView(memory0).setInt8(base + 0, 55, true);
        break;
      }
      case 's-get': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 56, true);
        var {nodeId: v193_0, controls: v193_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v193_0), true);
        var vec196 = v193_1;
        var len196 = vec196.length;
        var result196 = realloc0(0, 0, 4, len196 * 12);
        for (let i = 0; i < vec196.length; i++) {
          const e = vec196[i];
          const base = result196 + i * 12;var variant195 = e;
          switch (variant195.tag) {
            case 'index': {
              const e = variant195.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant195.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr194= encodeRes.ptr;
              var len194 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len194, true);
              dataView(memory0).setUint32(base + 4, ptr194, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant195.tag)}\` (received \`${variant195}\`) specified for \`ControlId\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 12, len196, true);
        dataView(memory0).setUint32(base + 8, result196, true);
        break;
      }
      case 's-getn': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 57, true);
        var {nodeId: v197_0, tail: v197_1 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v197_0), true);
        var vec201 = v197_1;
        var len201 = vec201.length;
        var result201 = realloc0(0, 0, 4, len201 * 16);
        for (let i = 0; i < vec201.length; i++) {
          const e = vec201[i];
          const base = result201 + i * 16;var [tuple198_0, tuple198_1] = e;
          var variant200 = tuple198_0;
          switch (variant200.tag) {
            case 'index': {
              const e = variant200.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant200.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr199= encodeRes.ptr;
              var len199 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len199, true);
              dataView(memory0).setUint32(base + 4, ptr199, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant200.tag)}\` (received \`${variant200}\`) specified for \`ControlId\``);
            }
          }
          dataView(memory0).setInt32(base + 12, toInt32(tuple198_1), true);
        }
        dataView(memory0).setUint32(base + 12, len201, true);
        dataView(memory0).setUint32(base + 8, result201, true);
        break;
      }
      case 's-new': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 58, true);
        var {defName: v202_0, nodeId: v202_1, addAction: v202_2, targetId: v202_3, tail: v202_4 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v202_0, realloc0, memory0);
        var ptr203= encodeRes.ptr;
        var len203 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len203, true);
        dataView(memory0).setUint32(base + 4, ptr203, true);
        dataView(memory0).setInt32(base + 12, toInt32(v202_1), true);
        dataView(memory0).setInt32(base + 16, toInt32(v202_2), true);
        dataView(memory0).setInt32(base + 20, toInt32(v202_3), true);
        var vec209 = v202_4;
        var len209 = vec209.length;
        var result209 = realloc0(0, 0, 4, len209 * 24);
        for (let i = 0; i < vec209.length; i++) {
          const e = vec209[i];
          const base = result209 + i * 24;var [tuple204_0, tuple204_1] = e;
          var variant206 = tuple204_0;
          switch (variant206.tag) {
            case 'index': {
              const e = variant206.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            case 'name': {
              const e = variant206.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr205= encodeRes.ptr;
              var len205 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 8, len205, true);
              dataView(memory0).setUint32(base + 4, ptr205, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant206.tag)}\` (received \`${variant206}\`) specified for \`ControlId\``);
            }
          }
          var variant208 = tuple204_1;
          switch (variant208.tag) {
            case 'float': {
              const e = variant208.val;
              dataView(memory0).setInt8(base + 12, 0, true);
              dataView(memory0).setFloat32(base + 16, +e, true);
              break;
            }
            case 'int': {
              const e = variant208.val;
              dataView(memory0).setInt8(base + 12, 1, true);
              dataView(memory0).setInt32(base + 16, toInt32(e), true);
              break;
            }
            case 'bus': {
              const e = variant208.val;
              dataView(memory0).setInt8(base + 12, 2, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr207= encodeRes.ptr;
              var len207 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 20, len207, true);
              dataView(memory0).setUint32(base + 16, ptr207, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant208.tag)}\` (received \`${variant208}\`) specified for \`ControlValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 28, len209, true);
        dataView(memory0).setUint32(base + 24, result209, true);
        break;
      }
      case 's-noid': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 59, true);
        var {synthIds: v210_0 } = e;
        var val211 = v210_0;
        var len211 = val211.length;
        var ptr211 = realloc0(0, 0, 4, len211 * 4);
        
        let valData211;
        const valLenBytes211 = len211 * 4;
        if (Array.isArray(val211)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv211 = new DataView(memory0.buffer);
          for (const v of val211) {
            _requireValidNumericPrimitive.bind(null, 's32')(v);
            dv211.setInt32(ptr211+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData211 = new Uint8Array(val211.buffer || val211, val211.byteOffset, valLenBytes211);
          const out211 = new Uint8Array(memory0.buffer, ptr211, valLenBytes211);
          out211.set(valData211);
        }
        
        dataView(memory0).setUint32(base + 8, len211, true);
        dataView(memory0).setUint32(base + 4, ptr211, true);
        break;
      }
      case 'scope-subscribe': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 60, true);
        var {subId: v212_0, scope: v212_1, channels: v212_2, chunkSize: v212_3 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v212_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v212_1), true);
        dataView(memory0).setInt32(base + 12, toInt32(v212_2), true);
        dataView(memory0).setInt32(base + 16, toInt32(v212_3), true);
        break;
      }
      case 'scope-unsubscribe': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 61, true);
        var {subId: v213_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v213_0), true);
        break;
      }
      case 'status': {
        dataView(memory0).setInt8(base + 0, 62, true);
        break;
      }
      case 'sync': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 63, true);
        var {aUniqueNumber: v214_0 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v214_0), true);
        break;
      }
      case 'u-cmd': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 64, true);
        var {nodeId: v215_0, unitGeneratorIndex: v215_1, cmd: v215_2, anyArguments: v215_3 } = e;
        dataView(memory0).setInt32(base + 4, toInt32(v215_0), true);
        dataView(memory0).setInt32(base + 8, toInt32(v215_1), true);
        
        var encodeRes = _utf8AllocateAndEncode(v215_2, realloc0, memory0);
        var ptr216= encodeRes.ptr;
        var len216 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 16, len216, true);
        dataView(memory0).setUint32(base + 12, ptr216, true);
        var vec220 = v215_3;
        var len220 = vec220.length;
        var result220 = realloc0(0, 0, 8, len220 * 16);
        for (let i = 0; i < vec220.length; i++) {
          const e = vec220[i];
          const base = result220 + i * 16;var variant219 = e;
          switch (variant219.tag) {
            case 'int32': {
              const e = variant219.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant219.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant219.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant219.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr217= encodeRes.ptr;
              var len217 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len217, true);
              dataView(memory0).setUint32(base + 8, ptr217, true);
              break;
            }
            case 'blob': {
              const e = variant219.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val218 = e;
              var len218 = Array.isArray(val218) ? val218.length : val218.byteLength;
              var ptr218 = realloc0(0, 0, 1, len218 * 1);
              
              let valData218;
              const valLenBytes218 = len218 * 1;
              if (Array.isArray(val218)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv218 = new DataView(memory0.buffer);
                for (const v of val218) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv218.setUint8(ptr218+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData218 = new Uint8Array(val218.buffer || val218, val218.byteOffset, valLenBytes218);
                const out218 = new Uint8Array(memory0.buffer, ptr218, valLenBytes218);
                out218.set(valData218);
              }
              
              dataView(memory0).setUint32(base + 12, len218, true);
              dataView(memory0).setUint32(base + 8, ptr218, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant219.tag)}\` (received \`${variant219}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 24, len220, true);
        dataView(memory0).setUint32(base + 20, result220, true);
        break;
      }
      case 'version': {
        dataView(memory0).setInt8(base + 0, 65, true);
        break;
      }
      case 'other': {
        const e = variant227.val;
        dataView(memory0).setInt8(base + 0, 66, true);
        var {address: v221_0, args: v221_1 } = e;
        
        var encodeRes = _utf8AllocateAndEncode(v221_0, realloc0, memory0);
        var ptr222= encodeRes.ptr;
        var len222 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 8, len222, true);
        dataView(memory0).setUint32(base + 4, ptr222, true);
        var vec226 = v221_1;
        var len226 = vec226.length;
        var result226 = realloc0(0, 0, 8, len226 * 16);
        for (let i = 0; i < vec226.length; i++) {
          const e = vec226[i];
          const base = result226 + i * 16;var variant225 = e;
          switch (variant225.tag) {
            case 'int32': {
              const e = variant225.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setInt32(base + 8, toInt32(e), true);
              break;
            }
            case 'float32': {
              const e = variant225.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setFloat32(base + 8, +e, true);
              break;
            }
            case 'float64': {
              const e = variant225.val;
              dataView(memory0).setInt8(base + 0, 2, true);
              dataView(memory0).setFloat64(base + 8, +e, true);
              break;
            }
            case 'string': {
              const e = variant225.val;
              dataView(memory0).setInt8(base + 0, 3, true);
              
              var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
              var ptr223= encodeRes.ptr;
              var len223 = encodeRes.len;
              
              dataView(memory0).setUint32(base + 12, len223, true);
              dataView(memory0).setUint32(base + 8, ptr223, true);
              break;
            }
            case 'blob': {
              const e = variant225.val;
              dataView(memory0).setInt8(base + 0, 4, true);
              var val224 = e;
              var len224 = Array.isArray(val224) ? val224.length : val224.byteLength;
              var ptr224 = realloc0(0, 0, 1, len224 * 1);
              
              let valData224;
              const valLenBytes224 = len224 * 1;
              if (Array.isArray(val224)) {
                // Regular array likely containing numbers, write values to memory
                let offset = 0;
                const dv224 = new DataView(memory0.buffer);
                for (const v of val224) {
                  _requireValidNumericPrimitive.bind(null, 'u8')(v);
                  dv224.setUint8(ptr224+ offset, v, true);
                  offset += 1;
                }
              } else {
                // TypedArray / ArrayBuffer-like, direct copy
                valData224 = new Uint8Array(val224.buffer || val224, val224.byteOffset, valLenBytes224);
                const out224 = new Uint8Array(memory0.buffer, ptr224, valLenBytes224);
                out224.set(valData224);
              }
              
              dataView(memory0).setUint32(base + 12, len224, true);
              dataView(memory0).setUint32(base + 8, ptr224, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant225.tag)}\` (received \`${variant225}\`) specified for \`OscArg\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 16, len226, true);
        dataView(memory0).setUint32(base + 12, result226, true);
        break;
      }
      default: {
        throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant227.tag)}\` (received \`${variant227}\`) specified for \`ServerMessage\``);
      }
    }
  }
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="encode-bundle"][Instruction::CallWasm] enter', {
    funcName: 'encode-bundle',
    paramCount: 4,
    async: false,
    postReturn: true,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'commands010EncodeBundle',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'throw-result-err',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => commands010EncodeBundle(toUint32(v0_0), toUint32(v0_1), result228, len228),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  let variant231;
  switch (dataView(memory0).getUint8(ret + 0, true)) {
    case 0: {
      var ptr229 = dataView(memory0).getUint32(ret + 4, true);
      var len229 = dataView(memory0).getUint32(ret + 8, true);
      var result229 = new Uint8Array(memory0.buffer.slice(ptr229, ptr229 + len229 * 1));
      variant231= {
        tag: 'ok',
        val: result229
      };
      break;
    }
    case 1: {
      var ptr230 = dataView(memory0).getUint32(ret + 4, true);
      var len230 = dataView(memory0).getUint32(ret + 8, true);
      var result230 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr230, len230));
      variant231= {
        tag: 'err',
        val: result230
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="encode-bundle"][Instruction::Return]', {
    funcName: 'encode-bundle',
    paramCount: 1,
    async: false,
    postReturn: true
  });
  const retCopy = variant231;
  task.resolve([retCopy.val]);
  
  let cstate = getOrCreateAsyncState(0);
  cstate.mayLeave = false;
  postReturn0(ret);
  cstate.mayLeave = true;
  task.exit();
  
  
  
  if (typeof retCopy === 'object' && retCopy.tag === 'err') {
    throw new ComponentError(retCopy.val);
  }
  return retCopy.val;
  
}
let commands010AtUnixMs;

function atUnixMs(arg0) {
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="at-unix-ms"][Instruction::CallWasm] enter', {
    funcName: 'at-unix-ms',
    paramCount: 1,
    async: false,
    postReturn: false,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'commands010AtUnixMs',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'none',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => commands010AtUnixMs(+arg0),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  _debugLog('[iface="scserver:commands/commands@0.1.0", function="at-unix-ms"][Instruction::Return]', {
    funcName: 'at-unix-ms',
    paramCount: 1,
    async: false,
    postReturn: false
  });
  task.resolve([{
    seconds: dataView(memory0).getInt32(ret + 0, true) >>> 0,
    fractional: dataView(memory0).getInt32(ret + 4, true) >>> 0,
  }]);
  task.exit();
  return {
    seconds: dataView(memory0).getInt32(ret + 0, true) >>> 0,
    fractional: dataView(memory0).getInt32(ret + 4, true) >>> 0,
  };
}

const handleTable0 = [T_FLAG, 0];
handleTable0._createdReps = new Set();
const finalizationRegistry0 = finalizationRegistryCreate((handle) => {
  const { rep } = rscTableRemove(handleTable0, handle);
  exports0['0'](rep);
});

HANDLE_TABLES[0] = handleTable0;
let nrt010ConstructorNrtScore;

class NrtScore{
  constructor() {
    _debugLog('[iface="scserver:commands/nrt@0.1.0", function="[constructor]nrt-score"][Instruction::CallWasm] enter', {
      funcName: '[constructor]nrt-score',
      paramCount: 0,
      async: false,
      postReturn: false,
    });
    const hostProvided = false;
    
    const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
      componentIdx: 0,
      isAsync: false,
      isManualAsync: false,
      entryFnName: 'nrt010ConstructorNrtScore',
      getCallbackFn: () => null,
      callbackFnName: null,
      errHandling: 'none',
      callingWasmExport: true,
    });
    
    const started = task.enterSync();
    
    if (null!== null) {
      task.setReturnMemoryIdx(null);
      task.setReturnMemory(() => null());
    }
    
    
    let ret;
    
    try {
      ret =   _withGlobalCurrentTaskMeta({
        taskID: task.id(),
        componentIdx: task.componentIdx(),
        fn: () => nrt010ConstructorNrtScore(),
      });
    } catch (err) {
      
      _debugLog('[Instruction::CallWasm] error during sync call', {
        taskID: task.id(),
        err,
      });
      task.setErrored(err);
      task.reject(err);
      task.exit();
      throw err;
      
    }
    
    var handle1 = ret;
    var rsc0 = new.target === NrtScore ? this : Object.create(NrtScore.prototype);
    Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
    finalizationRegistry0.register(rsc0, handle1, rsc0);
    Object.defineProperty(rsc0, symbolDispose, { writable: true, value: function () {
      finalizationRegistry0.unregister(rsc0);
      rscTableRemove(handleTable0, handle1);
      rsc0[symbolDispose] = emptyFunc;
      rsc0[symbolRscHandle] = undefined;
      exports0['0'](handleTable0[(handle1 << 1) + 1] & ~T_FLAG);
    }});
    _debugLog('[iface="scserver:commands/nrt@0.1.0", function="[constructor]nrt-score"][Instruction::Return]', {
      funcName: '[constructor]nrt-score',
      paramCount: 1,
      async: false,
      postReturn: false
    });
    task.resolve([rsc0]);
    task.exit();
    return rsc0;
  }
}
let nrt010MethodNrtScoreAt;

NrtScore.prototype.at = function at(arg1, arg2) {
  var ptr0 = realloc0(0, 0, 8, 88);
  
  var handle2 = this[symbolRscHandle];
  if (!handle2 || (handleTable0[(handle2 << 1) + 1] & T_FLAG) === 0) {
    throw new TypeError('Resource error: Not a valid \"NrtScore\" resource.');
  }
  var handle1 = handleTable0[(handle2 << 1) + 1] & ~T_FLAG;
  
  dataView(memory0).setInt32(ptr0 + 0, handle1, true);
  dataView(memory0).setFloat64(ptr0 + 8, +arg1, true);
  var variant229 = arg2;
  switch (variant229.tag) {
    case 'b-alloc': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 0, true);
      var {bufnum: v3_0, numFrames: v3_1, numChannels: v3_2, completionMsg: v3_3, sampleRate: v3_4 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v3_0), true);
      dataView(memory0).setInt32(ptr0 + 24, toInt32(v3_1), true);
      var variant4 = v3_2;
      if (variant4 === null || variant4=== undefined) {
        dataView(memory0).setInt8(ptr0 + 28, 0, true);
      } else {
        const e = variant4;
        dataView(memory0).setInt8(ptr0 + 28, 1, true);
        dataView(memory0).setInt32(ptr0 + 32, toInt32(e), true);
      }
      var variant6 = v3_3;
      if (variant6 === null || variant6=== undefined) {
        dataView(memory0).setInt8(ptr0 + 36, 0, true);
      } else {
        const e = variant6;
        dataView(memory0).setInt8(ptr0 + 36, 1, true);
        var val5 = e;
        var len5 = Array.isArray(val5) ? val5.length : val5.byteLength;
        var ptr5 = realloc0(0, 0, 1, len5 * 1);
        
        let valData5;
        const valLenBytes5 = len5 * 1;
        if (Array.isArray(val5)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv5 = new DataView(memory0.buffer);
          for (const v of val5) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv5.setUint8(ptr5+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData5 = new Uint8Array(val5.buffer || val5, val5.byteOffset, valLenBytes5);
          const out5 = new Uint8Array(memory0.buffer, ptr5, valLenBytes5);
          out5.set(valData5);
        }
        
        dataView(memory0).setUint32(ptr0 + 44, len5, true);
        dataView(memory0).setUint32(ptr0 + 40, ptr5, true);
      }
      var variant7 = v3_4;
      if (variant7 === null || variant7=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant7;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        dataView(memory0).setFloat32(ptr0 + 52, +e, true);
      }
      break;
    }
    case 'b-alloc-read': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 1, true);
      var {bufnum: v8_0, path: v8_1, startFrame: v8_2, numberOfFrames: v8_3, completionMsg: v8_4 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v8_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v8_1, realloc0, memory0);
      var ptr9= encodeRes.ptr;
      var len9 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len9, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr9, true);
      var variant10 = v8_2;
      if (variant10 === null || variant10=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant10;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        dataView(memory0).setInt32(ptr0 + 36, toInt32(e), true);
      }
      var variant11 = v8_3;
      if (variant11 === null || variant11=== undefined) {
        dataView(memory0).setInt8(ptr0 + 40, 0, true);
      } else {
        const e = variant11;
        dataView(memory0).setInt8(ptr0 + 40, 1, true);
        dataView(memory0).setInt32(ptr0 + 44, toInt32(e), true);
      }
      var variant13 = v8_4;
      if (variant13 === null || variant13=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant13;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        var val12 = e;
        var len12 = Array.isArray(val12) ? val12.length : val12.byteLength;
        var ptr12 = realloc0(0, 0, 1, len12 * 1);
        
        let valData12;
        const valLenBytes12 = len12 * 1;
        if (Array.isArray(val12)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv12 = new DataView(memory0.buffer);
          for (const v of val12) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv12.setUint8(ptr12+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData12 = new Uint8Array(val12.buffer || val12, val12.byteOffset, valLenBytes12);
          const out12 = new Uint8Array(memory0.buffer, ptr12, valLenBytes12);
          out12.set(valData12);
        }
        
        dataView(memory0).setUint32(ptr0 + 56, len12, true);
        dataView(memory0).setUint32(ptr0 + 52, ptr12, true);
      }
      break;
    }
    case 'b-alloc-read-channel': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 2, true);
      var {bufnum: v14_0, path: v14_1, startFrame: v14_2, numberOfFrames: v14_3, channels: v14_4, completionMsg: v14_5 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v14_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v14_1, realloc0, memory0);
      var ptr15= encodeRes.ptr;
      var len15 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len15, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr15, true);
      dataView(memory0).setInt32(ptr0 + 32, toInt32(v14_2), true);
      dataView(memory0).setInt32(ptr0 + 36, toInt32(v14_3), true);
      var val16 = v14_4;
      var len16 = val16.length;
      var ptr16 = realloc0(0, 0, 4, len16 * 4);
      
      let valData16;
      const valLenBytes16 = len16 * 4;
      if (Array.isArray(val16)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv16 = new DataView(memory0.buffer);
        for (const v of val16) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv16.setInt32(ptr16+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData16 = new Uint8Array(val16.buffer || val16, val16.byteOffset, valLenBytes16);
        const out16 = new Uint8Array(memory0.buffer, ptr16, valLenBytes16);
        out16.set(valData16);
      }
      
      dataView(memory0).setUint32(ptr0 + 44, len16, true);
      dataView(memory0).setUint32(ptr0 + 40, ptr16, true);
      var variant18 = v14_5;
      if (variant18 === null || variant18=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant18;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        var val17 = e;
        var len17 = Array.isArray(val17) ? val17.length : val17.byteLength;
        var ptr17 = realloc0(0, 0, 1, len17 * 1);
        
        let valData17;
        const valLenBytes17 = len17 * 1;
        if (Array.isArray(val17)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv17 = new DataView(memory0.buffer);
          for (const v of val17) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv17.setUint8(ptr17+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData17 = new Uint8Array(val17.buffer || val17, val17.byteOffset, valLenBytes17);
          const out17 = new Uint8Array(memory0.buffer, ptr17, valLenBytes17);
          out17.set(valData17);
        }
        
        dataView(memory0).setUint32(ptr0 + 56, len17, true);
        dataView(memory0).setUint32(ptr0 + 52, ptr17, true);
      }
      break;
    }
    case 'b-close': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 3, true);
      var {bufnum: v19_0, completionMsg: v19_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v19_0), true);
      var variant21 = v19_1;
      if (variant21 === null || variant21=== undefined) {
        dataView(memory0).setInt8(ptr0 + 24, 0, true);
      } else {
        const e = variant21;
        dataView(memory0).setInt8(ptr0 + 24, 1, true);
        var val20 = e;
        var len20 = Array.isArray(val20) ? val20.length : val20.byteLength;
        var ptr20 = realloc0(0, 0, 1, len20 * 1);
        
        let valData20;
        const valLenBytes20 = len20 * 1;
        if (Array.isArray(val20)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv20 = new DataView(memory0.buffer);
          for (const v of val20) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv20.setUint8(ptr20+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData20 = new Uint8Array(val20.buffer || val20, val20.byteOffset, valLenBytes20);
          const out20 = new Uint8Array(memory0.buffer, ptr20, valLenBytes20);
          out20.set(valData20);
        }
        
        dataView(memory0).setUint32(ptr0 + 32, len20, true);
        dataView(memory0).setUint32(ptr0 + 28, ptr20, true);
      }
      break;
    }
    case 'b-fill': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 4, true);
      var {bufnum: v22_0, tail: v22_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v22_0), true);
      var vec24 = v22_1;
      var len24 = vec24.length;
      var result24 = realloc0(0, 0, 4, len24 * 12);
      for (let i = 0; i < vec24.length; i++) {
        const e = vec24[i];
        const base = result24 + i * 12;var [tuple23_0, tuple23_1, tuple23_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple23_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple23_1), true);
        dataView(memory0).setFloat32(base + 8, +tuple23_2, true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len24, true);
      dataView(memory0).setUint32(ptr0 + 24, result24, true);
      break;
    }
    case 'b-free': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 5, true);
      var {bufnum: v25_0, completionMsg: v25_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v25_0), true);
      var variant27 = v25_1;
      if (variant27 === null || variant27=== undefined) {
        dataView(memory0).setInt8(ptr0 + 24, 0, true);
      } else {
        const e = variant27;
        dataView(memory0).setInt8(ptr0 + 24, 1, true);
        var val26 = e;
        var len26 = Array.isArray(val26) ? val26.length : val26.byteLength;
        var ptr26 = realloc0(0, 0, 1, len26 * 1);
        
        let valData26;
        const valLenBytes26 = len26 * 1;
        if (Array.isArray(val26)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv26 = new DataView(memory0.buffer);
          for (const v of val26) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv26.setUint8(ptr26+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData26 = new Uint8Array(val26.buffer || val26, val26.byteOffset, valLenBytes26);
          const out26 = new Uint8Array(memory0.buffer, ptr26, valLenBytes26);
          out26.set(valData26);
        }
        
        dataView(memory0).setUint32(ptr0 + 32, len26, true);
        dataView(memory0).setUint32(ptr0 + 28, ptr26, true);
      }
      break;
    }
    case 'b-gen': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 6, true);
      var {bufnum: v28_0, cmd: v28_1, commandArguments: v28_2 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v28_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v28_1, realloc0, memory0);
      var ptr29= encodeRes.ptr;
      var len29 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len29, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr29, true);
      var vec33 = v28_2;
      var len33 = vec33.length;
      var result33 = realloc0(0, 0, 8, len33 * 16);
      for (let i = 0; i < vec33.length; i++) {
        const e = vec33[i];
        const base = result33 + i * 16;var variant32 = e;
        switch (variant32.tag) {
          case 'int32': {
            const e = variant32.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant32.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant32.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant32.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr30= encodeRes.ptr;
            var len30 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len30, true);
            dataView(memory0).setUint32(base + 8, ptr30, true);
            break;
          }
          case 'blob': {
            const e = variant32.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val31 = e;
            var len31 = Array.isArray(val31) ? val31.length : val31.byteLength;
            var ptr31 = realloc0(0, 0, 1, len31 * 1);
            
            let valData31;
            const valLenBytes31 = len31 * 1;
            if (Array.isArray(val31)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv31 = new DataView(memory0.buffer);
              for (const v of val31) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv31.setUint8(ptr31+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData31 = new Uint8Array(val31.buffer || val31, val31.byteOffset, valLenBytes31);
              const out31 = new Uint8Array(memory0.buffer, ptr31, valLenBytes31);
              out31.set(valData31);
            }
            
            dataView(memory0).setUint32(base + 12, len31, true);
            dataView(memory0).setUint32(base + 8, ptr31, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant32.tag)}\` (received \`${variant32}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 36, len33, true);
      dataView(memory0).setUint32(ptr0 + 32, result33, true);
      break;
    }
    case 'b-get': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 7, true);
      var {bufnum: v34_0, sampleIndices: v34_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v34_0), true);
      var val35 = v34_1;
      var len35 = val35.length;
      var ptr35 = realloc0(0, 0, 4, len35 * 4);
      
      let valData35;
      const valLenBytes35 = len35 * 4;
      if (Array.isArray(val35)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv35 = new DataView(memory0.buffer);
        for (const v of val35) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv35.setInt32(ptr35+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData35 = new Uint8Array(val35.buffer || val35, val35.byteOffset, valLenBytes35);
        const out35 = new Uint8Array(memory0.buffer, ptr35, valLenBytes35);
        out35.set(valData35);
      }
      
      dataView(memory0).setUint32(ptr0 + 28, len35, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr35, true);
      break;
    }
    case 'b-getn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 8, true);
      var {bufnum: v36_0, tail: v36_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v36_0), true);
      var vec38 = v36_1;
      var len38 = vec38.length;
      var result38 = realloc0(0, 0, 4, len38 * 8);
      for (let i = 0; i < vec38.length; i++) {
        const e = vec38[i];
        const base = result38 + i * 8;var [tuple37_0, tuple37_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple37_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple37_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len38, true);
      dataView(memory0).setUint32(ptr0 + 24, result38, true);
      break;
    }
    case 'b-query': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 9, true);
      var {bufnums: v39_0 } = e;
      var val40 = v39_0;
      var len40 = val40.length;
      var ptr40 = realloc0(0, 0, 4, len40 * 4);
      
      let valData40;
      const valLenBytes40 = len40 * 4;
      if (Array.isArray(val40)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv40 = new DataView(memory0.buffer);
        for (const v of val40) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv40.setInt32(ptr40+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData40 = new Uint8Array(val40.buffer || val40, val40.byteOffset, valLenBytes40);
        const out40 = new Uint8Array(memory0.buffer, ptr40, valLenBytes40);
        out40.set(valData40);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len40, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr40, true);
      break;
    }
    case 'b-read': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 10, true);
      var {bufnum: v41_0, path: v41_1, startFrame: v41_2, numberOfFrames: v41_3, startingFrame: v41_4, leaveFileOpen: v41_5, completionMsg: v41_6 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v41_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v41_1, realloc0, memory0);
      var ptr42= encodeRes.ptr;
      var len42 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len42, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr42, true);
      var variant43 = v41_2;
      if (variant43 === null || variant43=== undefined) {
        dataView(memory0).setInt8(ptr0 + 32, 0, true);
      } else {
        const e = variant43;
        dataView(memory0).setInt8(ptr0 + 32, 1, true);
        dataView(memory0).setInt32(ptr0 + 36, toInt32(e), true);
      }
      var variant44 = v41_3;
      if (variant44 === null || variant44=== undefined) {
        dataView(memory0).setInt8(ptr0 + 40, 0, true);
      } else {
        const e = variant44;
        dataView(memory0).setInt8(ptr0 + 40, 1, true);
        dataView(memory0).setInt32(ptr0 + 44, toInt32(e), true);
      }
      var variant45 = v41_4;
      if (variant45 === null || variant45=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant45;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        dataView(memory0).setInt32(ptr0 + 52, toInt32(e), true);
      }
      var variant46 = v41_5;
      if (variant46 === null || variant46=== undefined) {
        dataView(memory0).setInt8(ptr0 + 56, 0, true);
      } else {
        const e = variant46;
        dataView(memory0).setInt8(ptr0 + 56, 1, true);
        dataView(memory0).setInt32(ptr0 + 60, toInt32(e), true);
      }
      var variant48 = v41_6;
      if (variant48 === null || variant48=== undefined) {
        dataView(memory0).setInt8(ptr0 + 64, 0, true);
      } else {
        const e = variant48;
        dataView(memory0).setInt8(ptr0 + 64, 1, true);
        var val47 = e;
        var len47 = Array.isArray(val47) ? val47.length : val47.byteLength;
        var ptr47 = realloc0(0, 0, 1, len47 * 1);
        
        let valData47;
        const valLenBytes47 = len47 * 1;
        if (Array.isArray(val47)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv47 = new DataView(memory0.buffer);
          for (const v of val47) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv47.setUint8(ptr47+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData47 = new Uint8Array(val47.buffer || val47, val47.byteOffset, valLenBytes47);
          const out47 = new Uint8Array(memory0.buffer, ptr47, valLenBytes47);
          out47.set(valData47);
        }
        
        dataView(memory0).setUint32(ptr0 + 72, len47, true);
        dataView(memory0).setUint32(ptr0 + 68, ptr47, true);
      }
      break;
    }
    case 'b-read-channel': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 11, true);
      var {bufnum: v49_0, path: v49_1, startFrame: v49_2, numberOfFrames: v49_3, startingFrame: v49_4, leaveFileOpen: v49_5, channels: v49_6, completionMsg: v49_7 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v49_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v49_1, realloc0, memory0);
      var ptr50= encodeRes.ptr;
      var len50 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len50, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr50, true);
      dataView(memory0).setInt32(ptr0 + 32, toInt32(v49_2), true);
      dataView(memory0).setInt32(ptr0 + 36, toInt32(v49_3), true);
      dataView(memory0).setInt32(ptr0 + 40, toInt32(v49_4), true);
      dataView(memory0).setInt32(ptr0 + 44, toInt32(v49_5), true);
      var val51 = v49_6;
      var len51 = val51.length;
      var ptr51 = realloc0(0, 0, 4, len51 * 4);
      
      let valData51;
      const valLenBytes51 = len51 * 4;
      if (Array.isArray(val51)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv51 = new DataView(memory0.buffer);
        for (const v of val51) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv51.setInt32(ptr51+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData51 = new Uint8Array(val51.buffer || val51, val51.byteOffset, valLenBytes51);
        const out51 = new Uint8Array(memory0.buffer, ptr51, valLenBytes51);
        out51.set(valData51);
      }
      
      dataView(memory0).setUint32(ptr0 + 52, len51, true);
      dataView(memory0).setUint32(ptr0 + 48, ptr51, true);
      var variant53 = v49_7;
      if (variant53 === null || variant53=== undefined) {
        dataView(memory0).setInt8(ptr0 + 56, 0, true);
      } else {
        const e = variant53;
        dataView(memory0).setInt8(ptr0 + 56, 1, true);
        var val52 = e;
        var len52 = Array.isArray(val52) ? val52.length : val52.byteLength;
        var ptr52 = realloc0(0, 0, 1, len52 * 1);
        
        let valData52;
        const valLenBytes52 = len52 * 1;
        if (Array.isArray(val52)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv52 = new DataView(memory0.buffer);
          for (const v of val52) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv52.setUint8(ptr52+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData52 = new Uint8Array(val52.buffer || val52, val52.byteOffset, valLenBytes52);
          const out52 = new Uint8Array(memory0.buffer, ptr52, valLenBytes52);
          out52.set(valData52);
        }
        
        dataView(memory0).setUint32(ptr0 + 64, len52, true);
        dataView(memory0).setUint32(ptr0 + 60, ptr52, true);
      }
      break;
    }
    case 'b-set': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 12, true);
      var {bufnum: v54_0, tail: v54_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v54_0), true);
      var vec56 = v54_1;
      var len56 = vec56.length;
      var result56 = realloc0(0, 0, 4, len56 * 8);
      for (let i = 0; i < vec56.length; i++) {
        const e = vec56[i];
        const base = result56 + i * 8;var [tuple55_0, tuple55_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple55_0), true);
        dataView(memory0).setFloat32(base + 4, +tuple55_1, true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len56, true);
      dataView(memory0).setUint32(ptr0 + 24, result56, true);
      break;
    }
    case 'b-set-sample-rate': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 13, true);
      var {bufnum: v57_0, theDesiredSampling: v57_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v57_0), true);
      dataView(memory0).setFloat32(ptr0 + 24, +v57_1, true);
      break;
    }
    case 'b-setn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 14, true);
      var {bufnum: v58_0, tail: v58_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v58_0), true);
      var vec61 = v58_1;
      var len61 = vec61.length;
      var result61 = realloc0(0, 0, 4, len61 * 12);
      for (let i = 0; i < vec61.length; i++) {
        const e = vec61[i];
        const base = result61 + i * 12;var [tuple59_0, tuple59_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple59_0), true);
        var val60 = tuple59_1;
        var len60 = val60.length;
        var ptr60 = realloc0(0, 0, 4, len60 * 4);
        
        let valData60;
        const valLenBytes60 = len60 * 4;
        if (Array.isArray(val60)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv60 = new DataView(memory0.buffer);
          for (const v of val60) {
            _requireValidNumericPrimitive.bind(null, 'f32')(v);
            dv60.setFloat32(ptr60+ offset, v, true);
            offset += 4;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData60 = new Uint8Array(val60.buffer || val60, val60.byteOffset, valLenBytes60);
          const out60 = new Uint8Array(memory0.buffer, ptr60, valLenBytes60);
          out60.set(valData60);
        }
        
        dataView(memory0).setUint32(base + 8, len60, true);
        dataView(memory0).setUint32(base + 4, ptr60, true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len61, true);
      dataView(memory0).setUint32(ptr0 + 24, result61, true);
      break;
    }
    case 'b-write': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 15, true);
      var {bufnum: v62_0, path: v62_1, headerFormat: v62_2, sampleFormat: v62_3, numberOfFrames: v62_4, startingFrame: v62_5, leaveFileOpen: v62_6, completionMsg: v62_7 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v62_0), true);
      
      var encodeRes = _utf8AllocateAndEncode(v62_1, realloc0, memory0);
      var ptr63= encodeRes.ptr;
      var len63 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 28, len63, true);
      dataView(memory0).setUint32(ptr0 + 24, ptr63, true);
      
      var encodeRes = _utf8AllocateAndEncode(v62_2, realloc0, memory0);
      var ptr64= encodeRes.ptr;
      var len64 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 36, len64, true);
      dataView(memory0).setUint32(ptr0 + 32, ptr64, true);
      
      var encodeRes = _utf8AllocateAndEncode(v62_3, realloc0, memory0);
      var ptr65= encodeRes.ptr;
      var len65 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 44, len65, true);
      dataView(memory0).setUint32(ptr0 + 40, ptr65, true);
      var variant66 = v62_4;
      if (variant66 === null || variant66=== undefined) {
        dataView(memory0).setInt8(ptr0 + 48, 0, true);
      } else {
        const e = variant66;
        dataView(memory0).setInt8(ptr0 + 48, 1, true);
        dataView(memory0).setInt32(ptr0 + 52, toInt32(e), true);
      }
      var variant67 = v62_5;
      if (variant67 === null || variant67=== undefined) {
        dataView(memory0).setInt8(ptr0 + 56, 0, true);
      } else {
        const e = variant67;
        dataView(memory0).setInt8(ptr0 + 56, 1, true);
        dataView(memory0).setInt32(ptr0 + 60, toInt32(e), true);
      }
      var variant68 = v62_6;
      if (variant68 === null || variant68=== undefined) {
        dataView(memory0).setInt8(ptr0 + 64, 0, true);
      } else {
        const e = variant68;
        dataView(memory0).setInt8(ptr0 + 64, 1, true);
        dataView(memory0).setInt32(ptr0 + 68, toInt32(e), true);
      }
      var variant70 = v62_7;
      if (variant70 === null || variant70=== undefined) {
        dataView(memory0).setInt8(ptr0 + 72, 0, true);
      } else {
        const e = variant70;
        dataView(memory0).setInt8(ptr0 + 72, 1, true);
        var val69 = e;
        var len69 = Array.isArray(val69) ? val69.length : val69.byteLength;
        var ptr69 = realloc0(0, 0, 1, len69 * 1);
        
        let valData69;
        const valLenBytes69 = len69 * 1;
        if (Array.isArray(val69)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv69 = new DataView(memory0.buffer);
          for (const v of val69) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv69.setUint8(ptr69+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData69 = new Uint8Array(val69.buffer || val69, val69.byteOffset, valLenBytes69);
          const out69 = new Uint8Array(memory0.buffer, ptr69, valLenBytes69);
          out69.set(valData69);
        }
        
        dataView(memory0).setUint32(ptr0 + 80, len69, true);
        dataView(memory0).setUint32(ptr0 + 76, ptr69, true);
      }
      break;
    }
    case 'b-zero': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 16, true);
      var {bufnum: v71_0, completionMsg: v71_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v71_0), true);
      var variant73 = v71_1;
      if (variant73 === null || variant73=== undefined) {
        dataView(memory0).setInt8(ptr0 + 24, 0, true);
      } else {
        const e = variant73;
        dataView(memory0).setInt8(ptr0 + 24, 1, true);
        var val72 = e;
        var len72 = Array.isArray(val72) ? val72.length : val72.byteLength;
        var ptr72 = realloc0(0, 0, 1, len72 * 1);
        
        let valData72;
        const valLenBytes72 = len72 * 1;
        if (Array.isArray(val72)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv72 = new DataView(memory0.buffer);
          for (const v of val72) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv72.setUint8(ptr72+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData72 = new Uint8Array(val72.buffer || val72, val72.byteOffset, valLenBytes72);
          const out72 = new Uint8Array(memory0.buffer, ptr72, valLenBytes72);
          out72.set(valData72);
        }
        
        dataView(memory0).setUint32(ptr0 + 32, len72, true);
        dataView(memory0).setUint32(ptr0 + 28, ptr72, true);
      }
      break;
    }
    case 'c-fill': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 17, true);
      var {tail: v74_0 } = e;
      var vec77 = v74_0;
      var len77 = vec77.length;
      var result77 = realloc0(0, 0, 4, len77 * 16);
      for (let i = 0; i < vec77.length; i++) {
        const e = vec77[i];
        const base = result77 + i * 16;var [tuple75_0, tuple75_1, tuple75_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple75_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple75_1), true);
        var variant76 = tuple75_2;
        switch (variant76.tag) {
          case 'float': {
            const e = variant76.val;
            dataView(memory0).setInt8(base + 8, 0, true);
            dataView(memory0).setFloat32(base + 12, +e, true);
            break;
          }
          case 'int': {
            const e = variant76.val;
            dataView(memory0).setInt8(base + 8, 1, true);
            dataView(memory0).setInt32(base + 12, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant76.tag)}\` (received \`${variant76}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 24, len77, true);
      dataView(memory0).setUint32(ptr0 + 20, result77, true);
      break;
    }
    case 'c-get': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 18, true);
      var {busIndices: v78_0 } = e;
      var val79 = v78_0;
      var len79 = val79.length;
      var ptr79 = realloc0(0, 0, 4, len79 * 4);
      
      let valData79;
      const valLenBytes79 = len79 * 4;
      if (Array.isArray(val79)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv79 = new DataView(memory0.buffer);
        for (const v of val79) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv79.setInt32(ptr79+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData79 = new Uint8Array(val79.buffer || val79, val79.byteOffset, valLenBytes79);
        const out79 = new Uint8Array(memory0.buffer, ptr79, valLenBytes79);
        out79.set(valData79);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len79, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr79, true);
      break;
    }
    case 'c-getn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 19, true);
      var {tail: v80_0 } = e;
      var vec82 = v80_0;
      var len82 = vec82.length;
      var result82 = realloc0(0, 0, 4, len82 * 8);
      for (let i = 0; i < vec82.length; i++) {
        const e = vec82[i];
        const base = result82 + i * 8;var [tuple81_0, tuple81_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple81_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple81_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len82, true);
      dataView(memory0).setUint32(ptr0 + 20, result82, true);
      break;
    }
    case 'c-set': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 20, true);
      var {tail: v83_0 } = e;
      var vec86 = v83_0;
      var len86 = vec86.length;
      var result86 = realloc0(0, 0, 4, len86 * 12);
      for (let i = 0; i < vec86.length; i++) {
        const e = vec86[i];
        const base = result86 + i * 12;var [tuple84_0, tuple84_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple84_0), true);
        var variant85 = tuple84_1;
        switch (variant85.tag) {
          case 'float': {
            const e = variant85.val;
            dataView(memory0).setInt8(base + 4, 0, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'int': {
            const e = variant85.val;
            dataView(memory0).setInt8(base + 4, 1, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant85.tag)}\` (received \`${variant85}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 24, len86, true);
      dataView(memory0).setUint32(ptr0 + 20, result86, true);
      break;
    }
    case 'c-setn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 21, true);
      var {tail: v87_0 } = e;
      var vec91 = v87_0;
      var len91 = vec91.length;
      var result91 = realloc0(0, 0, 4, len91 * 12);
      for (let i = 0; i < vec91.length; i++) {
        const e = vec91[i];
        const base = result91 + i * 12;var [tuple88_0, tuple88_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple88_0), true);
        var vec90 = tuple88_1;
        var len90 = vec90.length;
        var result90 = realloc0(0, 0, 4, len90 * 8);
        for (let i = 0; i < vec90.length; i++) {
          const e = vec90[i];
          const base = result90 + i * 8;var variant89 = e;
          switch (variant89.tag) {
            case 'float': {
              const e = variant89.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setFloat32(base + 4, +e, true);
              break;
            }
            case 'int': {
              const e = variant89.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant89.tag)}\` (received \`${variant89}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 8, len90, true);
        dataView(memory0).setUint32(base + 4, result90, true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len91, true);
      dataView(memory0).setUint32(ptr0 + 20, result91, true);
      break;
    }
    case 'clear-sched': {
      dataView(memory0).setInt8(ptr0 + 16, 22, true);
      break;
    }
    case 'cmd': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 23, true);
      var {cmd: v92_0, anyArguments: v92_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v92_0, realloc0, memory0);
      var ptr93= encodeRes.ptr;
      var len93 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 24, len93, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr93, true);
      var vec97 = v92_1;
      var len97 = vec97.length;
      var result97 = realloc0(0, 0, 8, len97 * 16);
      for (let i = 0; i < vec97.length; i++) {
        const e = vec97[i];
        const base = result97 + i * 16;var variant96 = e;
        switch (variant96.tag) {
          case 'int32': {
            const e = variant96.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant96.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant96.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant96.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr94= encodeRes.ptr;
            var len94 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len94, true);
            dataView(memory0).setUint32(base + 8, ptr94, true);
            break;
          }
          case 'blob': {
            const e = variant96.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val95 = e;
            var len95 = Array.isArray(val95) ? val95.length : val95.byteLength;
            var ptr95 = realloc0(0, 0, 1, len95 * 1);
            
            let valData95;
            const valLenBytes95 = len95 * 1;
            if (Array.isArray(val95)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv95 = new DataView(memory0.buffer);
              for (const v of val95) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv95.setUint8(ptr95+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData95 = new Uint8Array(val95.buffer || val95, val95.byteOffset, valLenBytes95);
              const out95 = new Uint8Array(memory0.buffer, ptr95, valLenBytes95);
              out95.set(valData95);
            }
            
            dataView(memory0).setUint32(base + 12, len95, true);
            dataView(memory0).setUint32(base + 8, ptr95, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant96.tag)}\` (received \`${variant96}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 32, len97, true);
      dataView(memory0).setUint32(ptr0 + 28, result97, true);
      break;
    }
    case 'd-free': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 24, true);
      var {synthDefNames: v98_0 } = e;
      var vec100 = v98_0;
      var len100 = vec100.length;
      var result100 = realloc0(0, 0, 4, len100 * 8);
      for (let i = 0; i < vec100.length; i++) {
        const e = vec100[i];
        const base = result100 + i * 8;
        var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
        var ptr99= encodeRes.ptr;
        var len99 = encodeRes.len;
        
        dataView(memory0).setUint32(base + 4, len99, true);
        dataView(memory0).setUint32(base + 0, ptr99, true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len100, true);
      dataView(memory0).setUint32(ptr0 + 20, result100, true);
      break;
    }
    case 'd-load': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 25, true);
      var {pathnameOfFile: v101_0, completionMsg: v101_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v101_0, realloc0, memory0);
      var ptr102= encodeRes.ptr;
      var len102 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 24, len102, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr102, true);
      var variant104 = v101_1;
      if (variant104 === null || variant104=== undefined) {
        dataView(memory0).setInt8(ptr0 + 28, 0, true);
      } else {
        const e = variant104;
        dataView(memory0).setInt8(ptr0 + 28, 1, true);
        var val103 = e;
        var len103 = Array.isArray(val103) ? val103.length : val103.byteLength;
        var ptr103 = realloc0(0, 0, 1, len103 * 1);
        
        let valData103;
        const valLenBytes103 = len103 * 1;
        if (Array.isArray(val103)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv103 = new DataView(memory0.buffer);
          for (const v of val103) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv103.setUint8(ptr103+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData103 = new Uint8Array(val103.buffer || val103, val103.byteOffset, valLenBytes103);
          const out103 = new Uint8Array(memory0.buffer, ptr103, valLenBytes103);
          out103.set(valData103);
        }
        
        dataView(memory0).setUint32(ptr0 + 36, len103, true);
        dataView(memory0).setUint32(ptr0 + 32, ptr103, true);
      }
      break;
    }
    case 'd-load-dir': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 26, true);
      var {pathnameOfDirectory: v105_0, completionMsg: v105_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v105_0, realloc0, memory0);
      var ptr106= encodeRes.ptr;
      var len106 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 24, len106, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr106, true);
      var variant108 = v105_1;
      if (variant108 === null || variant108=== undefined) {
        dataView(memory0).setInt8(ptr0 + 28, 0, true);
      } else {
        const e = variant108;
        dataView(memory0).setInt8(ptr0 + 28, 1, true);
        var val107 = e;
        var len107 = Array.isArray(val107) ? val107.length : val107.byteLength;
        var ptr107 = realloc0(0, 0, 1, len107 * 1);
        
        let valData107;
        const valLenBytes107 = len107 * 1;
        if (Array.isArray(val107)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv107 = new DataView(memory0.buffer);
          for (const v of val107) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv107.setUint8(ptr107+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData107 = new Uint8Array(val107.buffer || val107, val107.byteOffset, valLenBytes107);
          const out107 = new Uint8Array(memory0.buffer, ptr107, valLenBytes107);
          out107.set(valData107);
        }
        
        dataView(memory0).setUint32(ptr0 + 36, len107, true);
        dataView(memory0).setUint32(ptr0 + 32, ptr107, true);
      }
      break;
    }
    case 'd-recv': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 27, true);
      var {bufferOfData: v109_0, completionMsg: v109_1 } = e;
      var val110 = v109_0;
      var len110 = Array.isArray(val110) ? val110.length : val110.byteLength;
      var ptr110 = realloc0(0, 0, 1, len110 * 1);
      
      let valData110;
      const valLenBytes110 = len110 * 1;
      if (Array.isArray(val110)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv110 = new DataView(memory0.buffer);
        for (const v of val110) {
          _requireValidNumericPrimitive.bind(null, 'u8')(v);
          dv110.setUint8(ptr110+ offset, v, true);
          offset += 1;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData110 = new Uint8Array(val110.buffer || val110, val110.byteOffset, valLenBytes110);
        const out110 = new Uint8Array(memory0.buffer, ptr110, valLenBytes110);
        out110.set(valData110);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len110, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr110, true);
      var variant112 = v109_1;
      if (variant112 === null || variant112=== undefined) {
        dataView(memory0).setInt8(ptr0 + 28, 0, true);
      } else {
        const e = variant112;
        dataView(memory0).setInt8(ptr0 + 28, 1, true);
        var val111 = e;
        var len111 = Array.isArray(val111) ? val111.length : val111.byteLength;
        var ptr111 = realloc0(0, 0, 1, len111 * 1);
        
        let valData111;
        const valLenBytes111 = len111 * 1;
        if (Array.isArray(val111)) {
          // Regular array likely containing numbers, write values to memory
          let offset = 0;
          const dv111 = new DataView(memory0.buffer);
          for (const v of val111) {
            _requireValidNumericPrimitive.bind(null, 'u8')(v);
            dv111.setUint8(ptr111+ offset, v, true);
            offset += 1;
          }
        } else {
          // TypedArray / ArrayBuffer-like, direct copy
          valData111 = new Uint8Array(val111.buffer || val111, val111.byteOffset, valLenBytes111);
          const out111 = new Uint8Array(memory0.buffer, ptr111, valLenBytes111);
          out111.set(valData111);
        }
        
        dataView(memory0).setUint32(ptr0 + 36, len111, true);
        dataView(memory0).setUint32(ptr0 + 32, ptr111, true);
      }
      break;
    }
    case 'dump-osc': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 28, true);
      var {code: v113_0 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v113_0), true);
      break;
    }
    case 'error': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 29, true);
      var {mode: v114_0 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v114_0), true);
      break;
    }
    case 'g-deep-free': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 30, true);
      var {groupIds: v115_0 } = e;
      var val116 = v115_0;
      var len116 = val116.length;
      var ptr116 = realloc0(0, 0, 4, len116 * 4);
      
      let valData116;
      const valLenBytes116 = len116 * 4;
      if (Array.isArray(val116)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv116 = new DataView(memory0.buffer);
        for (const v of val116) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv116.setInt32(ptr116+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData116 = new Uint8Array(val116.buffer || val116, val116.byteOffset, valLenBytes116);
        const out116 = new Uint8Array(memory0.buffer, ptr116, valLenBytes116);
        out116.set(valData116);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len116, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr116, true);
      break;
    }
    case 'g-dump-tree': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 31, true);
      var {tail: v117_0 } = e;
      var vec119 = v117_0;
      var len119 = vec119.length;
      var result119 = realloc0(0, 0, 4, len119 * 8);
      for (let i = 0; i < vec119.length; i++) {
        const e = vec119[i];
        const base = result119 + i * 8;var [tuple118_0, tuple118_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple118_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple118_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len119, true);
      dataView(memory0).setUint32(ptr0 + 20, result119, true);
      break;
    }
    case 'g-free-all': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 32, true);
      var {groupIds: v120_0 } = e;
      var val121 = v120_0;
      var len121 = val121.length;
      var ptr121 = realloc0(0, 0, 4, len121 * 4);
      
      let valData121;
      const valLenBytes121 = len121 * 4;
      if (Array.isArray(val121)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv121 = new DataView(memory0.buffer);
        for (const v of val121) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv121.setInt32(ptr121+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData121 = new Uint8Array(val121.buffer || val121, val121.byteOffset, valLenBytes121);
        const out121 = new Uint8Array(memory0.buffer, ptr121, valLenBytes121);
        out121.set(valData121);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len121, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr121, true);
      break;
    }
    case 'g-head': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 33, true);
      var {tail: v122_0 } = e;
      var vec124 = v122_0;
      var len124 = vec124.length;
      var result124 = realloc0(0, 0, 4, len124 * 8);
      for (let i = 0; i < vec124.length; i++) {
        const e = vec124[i];
        const base = result124 + i * 8;var [tuple123_0, tuple123_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple123_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple123_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len124, true);
      dataView(memory0).setUint32(ptr0 + 20, result124, true);
      break;
    }
    case 'g-new': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 34, true);
      var {tail: v125_0 } = e;
      var vec127 = v125_0;
      var len127 = vec127.length;
      var result127 = realloc0(0, 0, 4, len127 * 12);
      for (let i = 0; i < vec127.length; i++) {
        const e = vec127[i];
        const base = result127 + i * 12;var [tuple126_0, tuple126_1, tuple126_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple126_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple126_1), true);
        dataView(memory0).setInt32(base + 8, toInt32(tuple126_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len127, true);
      dataView(memory0).setUint32(ptr0 + 20, result127, true);
      break;
    }
    case 'g-query-tree': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 35, true);
      var {tail: v128_0 } = e;
      var vec130 = v128_0;
      var len130 = vec130.length;
      var result130 = realloc0(0, 0, 4, len130 * 8);
      for (let i = 0; i < vec130.length; i++) {
        const e = vec130[i];
        const base = result130 + i * 8;var [tuple129_0, tuple129_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple129_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple129_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len130, true);
      dataView(memory0).setUint32(ptr0 + 20, result130, true);
      break;
    }
    case 'g-tail': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 36, true);
      var {tail: v131_0 } = e;
      var vec133 = v131_0;
      var len133 = vec133.length;
      var result133 = realloc0(0, 0, 4, len133 * 8);
      for (let i = 0; i < vec133.length; i++) {
        const e = vec133[i];
        const base = result133 + i * 8;var [tuple132_0, tuple132_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple132_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple132_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len133, true);
      dataView(memory0).setUint32(ptr0 + 20, result133, true);
      break;
    }
    case 'n-after': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 37, true);
      var {tail: v134_0 } = e;
      var vec136 = v134_0;
      var len136 = vec136.length;
      var result136 = realloc0(0, 0, 4, len136 * 8);
      for (let i = 0; i < vec136.length; i++) {
        const e = vec136[i];
        const base = result136 + i * 8;var [tuple135_0, tuple135_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple135_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple135_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len136, true);
      dataView(memory0).setUint32(ptr0 + 20, result136, true);
      break;
    }
    case 'n-before': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 38, true);
      var {tail: v137_0 } = e;
      var vec139 = v137_0;
      var len139 = vec139.length;
      var result139 = realloc0(0, 0, 4, len139 * 8);
      for (let i = 0; i < vec139.length; i++) {
        const e = vec139[i];
        const base = result139 + i * 8;var [tuple138_0, tuple138_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple138_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple138_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len139, true);
      dataView(memory0).setUint32(ptr0 + 20, result139, true);
      break;
    }
    case 'n-fill': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 39, true);
      var {nodeId: v140_0, tail: v140_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v140_0), true);
      var vec145 = v140_1;
      var len145 = vec145.length;
      var result145 = realloc0(0, 0, 4, len145 * 24);
      for (let i = 0; i < vec145.length; i++) {
        const e = vec145[i];
        const base = result145 + i * 24;var [tuple141_0, tuple141_1, tuple141_2] = e;
        var variant143 = tuple141_0;
        switch (variant143.tag) {
          case 'index': {
            const e = variant143.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant143.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr142= encodeRes.ptr;
            var len142 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len142, true);
            dataView(memory0).setUint32(base + 4, ptr142, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant143.tag)}\` (received \`${variant143}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple141_1), true);
        var variant144 = tuple141_2;
        switch (variant144.tag) {
          case 'float': {
            const e = variant144.val;
            dataView(memory0).setInt8(base + 16, 0, true);
            dataView(memory0).setFloat32(base + 20, +e, true);
            break;
          }
          case 'int': {
            const e = variant144.val;
            dataView(memory0).setInt8(base + 16, 1, true);
            dataView(memory0).setInt32(base + 20, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant144.tag)}\` (received \`${variant144}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 28, len145, true);
      dataView(memory0).setUint32(ptr0 + 24, result145, true);
      break;
    }
    case 'n-free': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 40, true);
      var {nodeIds: v146_0 } = e;
      var val147 = v146_0;
      var len147 = val147.length;
      var ptr147 = realloc0(0, 0, 4, len147 * 4);
      
      let valData147;
      const valLenBytes147 = len147 * 4;
      if (Array.isArray(val147)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv147 = new DataView(memory0.buffer);
        for (const v of val147) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv147.setInt32(ptr147+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData147 = new Uint8Array(val147.buffer || val147, val147.byteOffset, valLenBytes147);
        const out147 = new Uint8Array(memory0.buffer, ptr147, valLenBytes147);
        out147.set(valData147);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len147, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr147, true);
      break;
    }
    case 'n-map': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 41, true);
      var {nodeId: v148_0, tail: v148_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v148_0), true);
      var vec152 = v148_1;
      var len152 = vec152.length;
      var result152 = realloc0(0, 0, 4, len152 * 16);
      for (let i = 0; i < vec152.length; i++) {
        const e = vec152[i];
        const base = result152 + i * 16;var [tuple149_0, tuple149_1] = e;
        var variant151 = tuple149_0;
        switch (variant151.tag) {
          case 'index': {
            const e = variant151.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant151.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr150= encodeRes.ptr;
            var len150 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len150, true);
            dataView(memory0).setUint32(base + 4, ptr150, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant151.tag)}\` (received \`${variant151}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple149_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len152, true);
      dataView(memory0).setUint32(ptr0 + 24, result152, true);
      break;
    }
    case 'n-mapa': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 42, true);
      var {nodeId: v153_0, tail: v153_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v153_0), true);
      var vec157 = v153_1;
      var len157 = vec157.length;
      var result157 = realloc0(0, 0, 4, len157 * 16);
      for (let i = 0; i < vec157.length; i++) {
        const e = vec157[i];
        const base = result157 + i * 16;var [tuple154_0, tuple154_1] = e;
        var variant156 = tuple154_0;
        switch (variant156.tag) {
          case 'index': {
            const e = variant156.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant156.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr155= encodeRes.ptr;
            var len155 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len155, true);
            dataView(memory0).setUint32(base + 4, ptr155, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant156.tag)}\` (received \`${variant156}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple154_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len157, true);
      dataView(memory0).setUint32(ptr0 + 24, result157, true);
      break;
    }
    case 'n-mapan': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 43, true);
      var {nodeId: v158_0, tail: v158_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v158_0), true);
      var vec162 = v158_1;
      var len162 = vec162.length;
      var result162 = realloc0(0, 0, 4, len162 * 20);
      for (let i = 0; i < vec162.length; i++) {
        const e = vec162[i];
        const base = result162 + i * 20;var [tuple159_0, tuple159_1, tuple159_2] = e;
        var variant161 = tuple159_0;
        switch (variant161.tag) {
          case 'index': {
            const e = variant161.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant161.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr160= encodeRes.ptr;
            var len160 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len160, true);
            dataView(memory0).setUint32(base + 4, ptr160, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant161.tag)}\` (received \`${variant161}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple159_1), true);
        dataView(memory0).setInt32(base + 16, toInt32(tuple159_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len162, true);
      dataView(memory0).setUint32(ptr0 + 24, result162, true);
      break;
    }
    case 'n-mapn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 44, true);
      var {nodeId: v163_0, tail: v163_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v163_0), true);
      var vec167 = v163_1;
      var len167 = vec167.length;
      var result167 = realloc0(0, 0, 4, len167 * 20);
      for (let i = 0; i < vec167.length; i++) {
        const e = vec167[i];
        const base = result167 + i * 20;var [tuple164_0, tuple164_1, tuple164_2] = e;
        var variant166 = tuple164_0;
        switch (variant166.tag) {
          case 'index': {
            const e = variant166.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant166.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr165= encodeRes.ptr;
            var len165 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len165, true);
            dataView(memory0).setUint32(base + 4, ptr165, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant166.tag)}\` (received \`${variant166}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple164_1), true);
        dataView(memory0).setInt32(base + 16, toInt32(tuple164_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len167, true);
      dataView(memory0).setUint32(ptr0 + 24, result167, true);
      break;
    }
    case 'n-order': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 45, true);
      var {addAction: v168_0, targetId: v168_1, nodeIds: v168_2 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v168_0), true);
      dataView(memory0).setInt32(ptr0 + 24, toInt32(v168_1), true);
      var val169 = v168_2;
      var len169 = val169.length;
      var ptr169 = realloc0(0, 0, 4, len169 * 4);
      
      let valData169;
      const valLenBytes169 = len169 * 4;
      if (Array.isArray(val169)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv169 = new DataView(memory0.buffer);
        for (const v of val169) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv169.setInt32(ptr169+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData169 = new Uint8Array(val169.buffer || val169, val169.byteOffset, valLenBytes169);
        const out169 = new Uint8Array(memory0.buffer, ptr169, valLenBytes169);
        out169.set(valData169);
      }
      
      dataView(memory0).setUint32(ptr0 + 32, len169, true);
      dataView(memory0).setUint32(ptr0 + 28, ptr169, true);
      break;
    }
    case 'n-query': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 46, true);
      var {nodeIds: v170_0 } = e;
      var val171 = v170_0;
      var len171 = val171.length;
      var ptr171 = realloc0(0, 0, 4, len171 * 4);
      
      let valData171;
      const valLenBytes171 = len171 * 4;
      if (Array.isArray(val171)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv171 = new DataView(memory0.buffer);
        for (const v of val171) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv171.setInt32(ptr171+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData171 = new Uint8Array(val171.buffer || val171, val171.byteOffset, valLenBytes171);
        const out171 = new Uint8Array(memory0.buffer, ptr171, valLenBytes171);
        out171.set(valData171);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len171, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr171, true);
      break;
    }
    case 'n-run': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 47, true);
      var {tail: v172_0 } = e;
      var vec174 = v172_0;
      var len174 = vec174.length;
      var result174 = realloc0(0, 0, 4, len174 * 8);
      for (let i = 0; i < vec174.length; i++) {
        const e = vec174[i];
        const base = result174 + i * 8;var [tuple173_0, tuple173_1] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple173_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple173_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len174, true);
      dataView(memory0).setUint32(ptr0 + 20, result174, true);
      break;
    }
    case 'n-set': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 48, true);
      var {nodeId: v175_0, tail: v175_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v175_0), true);
      var vec180 = v175_1;
      var len180 = vec180.length;
      var result180 = realloc0(0, 0, 4, len180 * 20);
      for (let i = 0; i < vec180.length; i++) {
        const e = vec180[i];
        const base = result180 + i * 20;var [tuple176_0, tuple176_1] = e;
        var variant178 = tuple176_0;
        switch (variant178.tag) {
          case 'index': {
            const e = variant178.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant178.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr177= encodeRes.ptr;
            var len177 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len177, true);
            dataView(memory0).setUint32(base + 4, ptr177, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant178.tag)}\` (received \`${variant178}\`) specified for \`ControlId\``);
          }
        }
        var variant179 = tuple176_1;
        switch (variant179.tag) {
          case 'float': {
            const e = variant179.val;
            dataView(memory0).setInt8(base + 12, 0, true);
            dataView(memory0).setFloat32(base + 16, +e, true);
            break;
          }
          case 'int': {
            const e = variant179.val;
            dataView(memory0).setInt8(base + 12, 1, true);
            dataView(memory0).setInt32(base + 16, toInt32(e), true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant179.tag)}\` (received \`${variant179}\`) specified for \`NumericValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 28, len180, true);
      dataView(memory0).setUint32(ptr0 + 24, result180, true);
      break;
    }
    case 'n-setn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 49, true);
      var {nodeId: v181_0, tail: v181_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v181_0), true);
      var vec187 = v181_1;
      var len187 = vec187.length;
      var result187 = realloc0(0, 0, 4, len187 * 20);
      for (let i = 0; i < vec187.length; i++) {
        const e = vec187[i];
        const base = result187 + i * 20;var [tuple182_0, tuple182_1] = e;
        var variant184 = tuple182_0;
        switch (variant184.tag) {
          case 'index': {
            const e = variant184.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant184.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr183= encodeRes.ptr;
            var len183 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len183, true);
            dataView(memory0).setUint32(base + 4, ptr183, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant184.tag)}\` (received \`${variant184}\`) specified for \`ControlId\``);
          }
        }
        var vec186 = tuple182_1;
        var len186 = vec186.length;
        var result186 = realloc0(0, 0, 4, len186 * 8);
        for (let i = 0; i < vec186.length; i++) {
          const e = vec186[i];
          const base = result186 + i * 8;var variant185 = e;
          switch (variant185.tag) {
            case 'float': {
              const e = variant185.val;
              dataView(memory0).setInt8(base + 0, 0, true);
              dataView(memory0).setFloat32(base + 4, +e, true);
              break;
            }
            case 'int': {
              const e = variant185.val;
              dataView(memory0).setInt8(base + 0, 1, true);
              dataView(memory0).setInt32(base + 4, toInt32(e), true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant185.tag)}\` (received \`${variant185}\`) specified for \`NumericValue\``);
            }
          }
        }
        dataView(memory0).setUint32(base + 16, len186, true);
        dataView(memory0).setUint32(base + 12, result186, true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len187, true);
      dataView(memory0).setUint32(ptr0 + 24, result187, true);
      break;
    }
    case 'n-trace': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 50, true);
      var {nodeIds: v188_0 } = e;
      var val189 = v188_0;
      var len189 = val189.length;
      var ptr189 = realloc0(0, 0, 4, len189 * 4);
      
      let valData189;
      const valLenBytes189 = len189 * 4;
      if (Array.isArray(val189)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv189 = new DataView(memory0.buffer);
        for (const v of val189) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv189.setInt32(ptr189+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData189 = new Uint8Array(val189.buffer || val189, val189.byteOffset, valLenBytes189);
        const out189 = new Uint8Array(memory0.buffer, ptr189, valLenBytes189);
        out189.set(valData189);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len189, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr189, true);
      break;
    }
    case 'notify': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 51, true);
      var {enable: v190_0, clientId: v190_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v190_0), true);
      var variant191 = v190_1;
      if (variant191 === null || variant191=== undefined) {
        dataView(memory0).setInt8(ptr0 + 24, 0, true);
      } else {
        const e = variant191;
        dataView(memory0).setInt8(ptr0 + 24, 1, true);
        dataView(memory0).setInt32(ptr0 + 28, toInt32(e), true);
      }
      break;
    }
    case 'nrt-end': {
      dataView(memory0).setInt8(ptr0 + 16, 52, true);
      break;
    }
    case 'p-new': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 53, true);
      var {tail: v192_0 } = e;
      var vec194 = v192_0;
      var len194 = vec194.length;
      var result194 = realloc0(0, 0, 4, len194 * 12);
      for (let i = 0; i < vec194.length; i++) {
        const e = vec194[i];
        const base = result194 + i * 12;var [tuple193_0, tuple193_1, tuple193_2] = e;
        dataView(memory0).setInt32(base + 0, toInt32(tuple193_0), true);
        dataView(memory0).setInt32(base + 4, toInt32(tuple193_1), true);
        dataView(memory0).setInt32(base + 8, toInt32(tuple193_2), true);
      }
      dataView(memory0).setUint32(ptr0 + 24, len194, true);
      dataView(memory0).setUint32(ptr0 + 20, result194, true);
      break;
    }
    case 'quit': {
      dataView(memory0).setInt8(ptr0 + 16, 54, true);
      break;
    }
    case 'rt-memory-status': {
      dataView(memory0).setInt8(ptr0 + 16, 55, true);
      break;
    }
    case 's-get': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 56, true);
      var {nodeId: v195_0, controls: v195_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v195_0), true);
      var vec198 = v195_1;
      var len198 = vec198.length;
      var result198 = realloc0(0, 0, 4, len198 * 12);
      for (let i = 0; i < vec198.length; i++) {
        const e = vec198[i];
        const base = result198 + i * 12;var variant197 = e;
        switch (variant197.tag) {
          case 'index': {
            const e = variant197.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant197.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr196= encodeRes.ptr;
            var len196 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len196, true);
            dataView(memory0).setUint32(base + 4, ptr196, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant197.tag)}\` (received \`${variant197}\`) specified for \`ControlId\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 28, len198, true);
      dataView(memory0).setUint32(ptr0 + 24, result198, true);
      break;
    }
    case 's-getn': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 57, true);
      var {nodeId: v199_0, tail: v199_1 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v199_0), true);
      var vec203 = v199_1;
      var len203 = vec203.length;
      var result203 = realloc0(0, 0, 4, len203 * 16);
      for (let i = 0; i < vec203.length; i++) {
        const e = vec203[i];
        const base = result203 + i * 16;var [tuple200_0, tuple200_1] = e;
        var variant202 = tuple200_0;
        switch (variant202.tag) {
          case 'index': {
            const e = variant202.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant202.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr201= encodeRes.ptr;
            var len201 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len201, true);
            dataView(memory0).setUint32(base + 4, ptr201, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant202.tag)}\` (received \`${variant202}\`) specified for \`ControlId\``);
          }
        }
        dataView(memory0).setInt32(base + 12, toInt32(tuple200_1), true);
      }
      dataView(memory0).setUint32(ptr0 + 28, len203, true);
      dataView(memory0).setUint32(ptr0 + 24, result203, true);
      break;
    }
    case 's-new': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 58, true);
      var {defName: v204_0, nodeId: v204_1, addAction: v204_2, targetId: v204_3, tail: v204_4 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v204_0, realloc0, memory0);
      var ptr205= encodeRes.ptr;
      var len205 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 24, len205, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr205, true);
      dataView(memory0).setInt32(ptr0 + 28, toInt32(v204_1), true);
      dataView(memory0).setInt32(ptr0 + 32, toInt32(v204_2), true);
      dataView(memory0).setInt32(ptr0 + 36, toInt32(v204_3), true);
      var vec211 = v204_4;
      var len211 = vec211.length;
      var result211 = realloc0(0, 0, 4, len211 * 24);
      for (let i = 0; i < vec211.length; i++) {
        const e = vec211[i];
        const base = result211 + i * 24;var [tuple206_0, tuple206_1] = e;
        var variant208 = tuple206_0;
        switch (variant208.tag) {
          case 'index': {
            const e = variant208.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 4, toInt32(e), true);
            break;
          }
          case 'name': {
            const e = variant208.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr207= encodeRes.ptr;
            var len207 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 8, len207, true);
            dataView(memory0).setUint32(base + 4, ptr207, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant208.tag)}\` (received \`${variant208}\`) specified for \`ControlId\``);
          }
        }
        var variant210 = tuple206_1;
        switch (variant210.tag) {
          case 'float': {
            const e = variant210.val;
            dataView(memory0).setInt8(base + 12, 0, true);
            dataView(memory0).setFloat32(base + 16, +e, true);
            break;
          }
          case 'int': {
            const e = variant210.val;
            dataView(memory0).setInt8(base + 12, 1, true);
            dataView(memory0).setInt32(base + 16, toInt32(e), true);
            break;
          }
          case 'bus': {
            const e = variant210.val;
            dataView(memory0).setInt8(base + 12, 2, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr209= encodeRes.ptr;
            var len209 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 20, len209, true);
            dataView(memory0).setUint32(base + 16, ptr209, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant210.tag)}\` (received \`${variant210}\`) specified for \`ControlValue\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 44, len211, true);
      dataView(memory0).setUint32(ptr0 + 40, result211, true);
      break;
    }
    case 's-noid': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 59, true);
      var {synthIds: v212_0 } = e;
      var val213 = v212_0;
      var len213 = val213.length;
      var ptr213 = realloc0(0, 0, 4, len213 * 4);
      
      let valData213;
      const valLenBytes213 = len213 * 4;
      if (Array.isArray(val213)) {
        // Regular array likely containing numbers, write values to memory
        let offset = 0;
        const dv213 = new DataView(memory0.buffer);
        for (const v of val213) {
          _requireValidNumericPrimitive.bind(null, 's32')(v);
          dv213.setInt32(ptr213+ offset, v, true);
          offset += 4;
        }
      } else {
        // TypedArray / ArrayBuffer-like, direct copy
        valData213 = new Uint8Array(val213.buffer || val213, val213.byteOffset, valLenBytes213);
        const out213 = new Uint8Array(memory0.buffer, ptr213, valLenBytes213);
        out213.set(valData213);
      }
      
      dataView(memory0).setUint32(ptr0 + 24, len213, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr213, true);
      break;
    }
    case 'scope-subscribe': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 60, true);
      var {subId: v214_0, scope: v214_1, channels: v214_2, chunkSize: v214_3 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v214_0), true);
      dataView(memory0).setInt32(ptr0 + 24, toInt32(v214_1), true);
      dataView(memory0).setInt32(ptr0 + 28, toInt32(v214_2), true);
      dataView(memory0).setInt32(ptr0 + 32, toInt32(v214_3), true);
      break;
    }
    case 'scope-unsubscribe': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 61, true);
      var {subId: v215_0 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v215_0), true);
      break;
    }
    case 'status': {
      dataView(memory0).setInt8(ptr0 + 16, 62, true);
      break;
    }
    case 'sync': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 63, true);
      var {aUniqueNumber: v216_0 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v216_0), true);
      break;
    }
    case 'u-cmd': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 64, true);
      var {nodeId: v217_0, unitGeneratorIndex: v217_1, cmd: v217_2, anyArguments: v217_3 } = e;
      dataView(memory0).setInt32(ptr0 + 20, toInt32(v217_0), true);
      dataView(memory0).setInt32(ptr0 + 24, toInt32(v217_1), true);
      
      var encodeRes = _utf8AllocateAndEncode(v217_2, realloc0, memory0);
      var ptr218= encodeRes.ptr;
      var len218 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 32, len218, true);
      dataView(memory0).setUint32(ptr0 + 28, ptr218, true);
      var vec222 = v217_3;
      var len222 = vec222.length;
      var result222 = realloc0(0, 0, 8, len222 * 16);
      for (let i = 0; i < vec222.length; i++) {
        const e = vec222[i];
        const base = result222 + i * 16;var variant221 = e;
        switch (variant221.tag) {
          case 'int32': {
            const e = variant221.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant221.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant221.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant221.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr219= encodeRes.ptr;
            var len219 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len219, true);
            dataView(memory0).setUint32(base + 8, ptr219, true);
            break;
          }
          case 'blob': {
            const e = variant221.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val220 = e;
            var len220 = Array.isArray(val220) ? val220.length : val220.byteLength;
            var ptr220 = realloc0(0, 0, 1, len220 * 1);
            
            let valData220;
            const valLenBytes220 = len220 * 1;
            if (Array.isArray(val220)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv220 = new DataView(memory0.buffer);
              for (const v of val220) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv220.setUint8(ptr220+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData220 = new Uint8Array(val220.buffer || val220, val220.byteOffset, valLenBytes220);
              const out220 = new Uint8Array(memory0.buffer, ptr220, valLenBytes220);
              out220.set(valData220);
            }
            
            dataView(memory0).setUint32(base + 12, len220, true);
            dataView(memory0).setUint32(base + 8, ptr220, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant221.tag)}\` (received \`${variant221}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 40, len222, true);
      dataView(memory0).setUint32(ptr0 + 36, result222, true);
      break;
    }
    case 'version': {
      dataView(memory0).setInt8(ptr0 + 16, 65, true);
      break;
    }
    case 'other': {
      const e = variant229.val;
      dataView(memory0).setInt8(ptr0 + 16, 66, true);
      var {address: v223_0, args: v223_1 } = e;
      
      var encodeRes = _utf8AllocateAndEncode(v223_0, realloc0, memory0);
      var ptr224= encodeRes.ptr;
      var len224 = encodeRes.len;
      
      dataView(memory0).setUint32(ptr0 + 24, len224, true);
      dataView(memory0).setUint32(ptr0 + 20, ptr224, true);
      var vec228 = v223_1;
      var len228 = vec228.length;
      var result228 = realloc0(0, 0, 8, len228 * 16);
      for (let i = 0; i < vec228.length; i++) {
        const e = vec228[i];
        const base = result228 + i * 16;var variant227 = e;
        switch (variant227.tag) {
          case 'int32': {
            const e = variant227.val;
            dataView(memory0).setInt8(base + 0, 0, true);
            dataView(memory0).setInt32(base + 8, toInt32(e), true);
            break;
          }
          case 'float32': {
            const e = variant227.val;
            dataView(memory0).setInt8(base + 0, 1, true);
            dataView(memory0).setFloat32(base + 8, +e, true);
            break;
          }
          case 'float64': {
            const e = variant227.val;
            dataView(memory0).setInt8(base + 0, 2, true);
            dataView(memory0).setFloat64(base + 8, +e, true);
            break;
          }
          case 'string': {
            const e = variant227.val;
            dataView(memory0).setInt8(base + 0, 3, true);
            
            var encodeRes = _utf8AllocateAndEncode(e, realloc0, memory0);
            var ptr225= encodeRes.ptr;
            var len225 = encodeRes.len;
            
            dataView(memory0).setUint32(base + 12, len225, true);
            dataView(memory0).setUint32(base + 8, ptr225, true);
            break;
          }
          case 'blob': {
            const e = variant227.val;
            dataView(memory0).setInt8(base + 0, 4, true);
            var val226 = e;
            var len226 = Array.isArray(val226) ? val226.length : val226.byteLength;
            var ptr226 = realloc0(0, 0, 1, len226 * 1);
            
            let valData226;
            const valLenBytes226 = len226 * 1;
            if (Array.isArray(val226)) {
              // Regular array likely containing numbers, write values to memory
              let offset = 0;
              const dv226 = new DataView(memory0.buffer);
              for (const v of val226) {
                _requireValidNumericPrimitive.bind(null, 'u8')(v);
                dv226.setUint8(ptr226+ offset, v, true);
                offset += 1;
              }
            } else {
              // TypedArray / ArrayBuffer-like, direct copy
              valData226 = new Uint8Array(val226.buffer || val226, val226.byteOffset, valLenBytes226);
              const out226 = new Uint8Array(memory0.buffer, ptr226, valLenBytes226);
              out226.set(valData226);
            }
            
            dataView(memory0).setUint32(base + 12, len226, true);
            dataView(memory0).setUint32(base + 8, ptr226, true);
            break;
          }
          default: {
            throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant227.tag)}\` (received \`${variant227}\`) specified for \`OscArg\``);
          }
        }
      }
      dataView(memory0).setUint32(ptr0 + 32, len228, true);
      dataView(memory0).setUint32(ptr0 + 28, result228, true);
      break;
    }
    default: {
      throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant229.tag)}\` (received \`${variant229}\`) specified for \`ServerMessage\``);
    }
  }
  _debugLog('[iface="scserver:commands/nrt@0.1.0", function="[method]nrt-score.at"][Instruction::CallWasm] enter', {
    funcName: '[method]nrt-score.at',
    paramCount: 1,
    async: false,
    postReturn: false,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'nrt010MethodNrtScoreAt',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'none',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => nrt010MethodNrtScoreAt(ptr0),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  _debugLog('[iface="scserver:commands/nrt@0.1.0", function="[method]nrt-score.at"][Instruction::Return]', {
    funcName: '[method]nrt-score.at',
    paramCount: 0,
    async: false,
    postReturn: false
  });
  task.resolve([ret]);
  task.exit();
};
let nrt010MethodNrtScoreEncode;

NrtScore.prototype.encode = function encode() {
  
  var handle1 = this[symbolRscHandle];
  if (!handle1 || (handleTable0[(handle1 << 1) + 1] & T_FLAG) === 0) {
    throw new TypeError('Resource error: Not a valid \"NrtScore\" resource.');
  }
  var handle0 = handleTable0[(handle1 << 1) + 1] & ~T_FLAG;
  
  _debugLog('[iface="scserver:commands/nrt@0.1.0", function="[method]nrt-score.encode"][Instruction::CallWasm] enter', {
    funcName: '[method]nrt-score.encode',
    paramCount: 1,
    async: false,
    postReturn: true,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'nrt010MethodNrtScoreEncode',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'throw-result-err',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => nrt010MethodNrtScoreEncode(handle0),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  let variant4;
  switch (dataView(memory0).getUint8(ret + 0, true)) {
    case 0: {
      var ptr2 = dataView(memory0).getUint32(ret + 4, true);
      var len2 = dataView(memory0).getUint32(ret + 8, true);
      var result2 = new Uint8Array(memory0.buffer.slice(ptr2, ptr2 + len2 * 1));
      variant4= {
        tag: 'ok',
        val: result2
      };
      break;
    }
    case 1: {
      var ptr3 = dataView(memory0).getUint32(ret + 4, true);
      var len3 = dataView(memory0).getUint32(ret + 8, true);
      var result3 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      variant4= {
        tag: 'err',
        val: result3
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  _debugLog('[iface="scserver:commands/nrt@0.1.0", function="[method]nrt-score.encode"][Instruction::Return]', {
    funcName: '[method]nrt-score.encode',
    paramCount: 1,
    async: false,
    postReturn: true
  });
  const retCopy = variant4;
  task.resolve([retCopy.val]);
  
  let cstate = getOrCreateAsyncState(0);
  cstate.mayLeave = false;
  postReturn0(ret);
  cstate.mayLeave = true;
  task.exit();
  
  
  
  if (typeof retCopy === 'object' && retCopy.tag === 'err') {
    throw new ComponentError(retCopy.val);
  }
  return retCopy.val;
  
};
let replies010Decode;

function decode(arg0) {
  var val0 = arg0;
  var len0 = Array.isArray(val0) ? val0.length : val0.byteLength;
  var ptr0 = realloc0(0, 0, 1, len0 * 1);
  
  let valData0;
  const valLenBytes0 = len0 * 1;
  if (Array.isArray(val0)) {
    // Regular array likely containing numbers, write values to memory
    let offset = 0;
    const dv0 = new DataView(memory0.buffer);
    for (const v of val0) {
      _requireValidNumericPrimitive.bind(null, 'u8')(v);
      dv0.setUint8(ptr0+ offset, v, true);
      offset += 1;
    }
  } else {
    // TypedArray / ArrayBuffer-like, direct copy
    valData0 = new Uint8Array(val0.buffer || val0, val0.byteOffset, valLenBytes0);
    const out0 = new Uint8Array(memory0.buffer, ptr0, valLenBytes0);
    out0.set(valData0);
  }
  
  _debugLog('[iface="scserver:commands/replies@0.1.0", function="decode"][Instruction::CallWasm] enter', {
    funcName: 'decode',
    paramCount: 2,
    async: false,
    postReturn: true,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'replies010Decode',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'throw-result-err',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => replies010Decode(ptr0, len0),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  let variant34;
  switch (dataView(memory0).getUint8(ret + 0, true)) {
    case 0: {
      let variant32;
      switch (dataView(memory0).getUint8(ret + 8, true)) {
        case 0: {
          var ptr1 = dataView(memory0).getUint32(ret + 16, true);
          var len1 = dataView(memory0).getUint32(ret + 20, true);
          var result1 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr1, len1));
          var len5 = dataView(memory0).getUint32(ret + 28, true);
          var base5 = dataView(memory0).getUint32(ret + 24, true);
          var result5 = [];
          for (let i = 0; i < len5; i++) {
            const base = base5 + i * 16;
            let variant4;
            switch (dataView(memory0).getUint8(base + 0, true)) {
              case 0: {
                variant4= {
                  tag: 'int32',
                  val: dataView(memory0).getInt32(base + 8, true)
                };
                break;
              }
              case 1: {
                variant4= {
                  tag: 'float32',
                  val: dataView(memory0).getFloat32(base + 8, true)
                };
                break;
              }
              case 2: {
                variant4= {
                  tag: 'float64',
                  val: dataView(memory0).getFloat64(base + 8, true)
                };
                break;
              }
              case 3: {
                var ptr2 = dataView(memory0).getUint32(base + 8, true);
                var len2 = dataView(memory0).getUint32(base + 12, true);
                var result2 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr2, len2));
                variant4= {
                  tag: 'string',
                  val: result2
                };
                break;
              }
              case 4: {
                var ptr3 = dataView(memory0).getUint32(base + 8, true);
                var len3 = dataView(memory0).getUint32(base + 12, true);
                var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
                variant4= {
                  tag: 'blob',
                  val: result3
                };
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for OscArg');
              }
            }
            result5.push(variant4);
          }
          variant32= {
            tag: 'done',
            val: {
              address: result1,
              extras: result5,
            }
          };
          break;
        }
        case 1: {
          var ptr6 = dataView(memory0).getUint32(ret + 16, true);
          var len6 = dataView(memory0).getUint32(ret + 20, true);
          var result6 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr6, len6));
          var ptr7 = dataView(memory0).getUint32(ret + 24, true);
          var len7 = dataView(memory0).getUint32(ret + 28, true);
          var result7 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr7, len7));
          var len11 = dataView(memory0).getUint32(ret + 36, true);
          var base11 = dataView(memory0).getUint32(ret + 32, true);
          var result11 = [];
          for (let i = 0; i < len11; i++) {
            const base = base11 + i * 16;
            let variant10;
            switch (dataView(memory0).getUint8(base + 0, true)) {
              case 0: {
                variant10= {
                  tag: 'int32',
                  val: dataView(memory0).getInt32(base + 8, true)
                };
                break;
              }
              case 1: {
                variant10= {
                  tag: 'float32',
                  val: dataView(memory0).getFloat32(base + 8, true)
                };
                break;
              }
              case 2: {
                variant10= {
                  tag: 'float64',
                  val: dataView(memory0).getFloat64(base + 8, true)
                };
                break;
              }
              case 3: {
                var ptr8 = dataView(memory0).getUint32(base + 8, true);
                var len8 = dataView(memory0).getUint32(base + 12, true);
                var result8 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr8, len8));
                variant10= {
                  tag: 'string',
                  val: result8
                };
                break;
              }
              case 4: {
                var ptr9 = dataView(memory0).getUint32(base + 8, true);
                var len9 = dataView(memory0).getUint32(base + 12, true);
                var result9 = new Uint8Array(memory0.buffer.slice(ptr9, ptr9 + len9 * 1));
                variant10= {
                  tag: 'blob',
                  val: result9
                };
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for OscArg');
              }
            }
            result11.push(variant10);
          }
          variant32= {
            tag: 'fail',
            val: {
              address: result6,
              error: result7,
              extras: result11,
            }
          };
          break;
        }
        case 2: {
          variant32= {
            tag: 'late',
            val: {
              seconds: dataView(memory0).getInt32(ret + 16, true),
              fractions: dataView(memory0).getInt32(ret + 20, true),
              lateSecs: dataView(memory0).getInt32(ret + 24, true),
              lateFracs: dataView(memory0).getInt32(ret + 28, true),
            }
          };
          break;
        }
        case 3: {
          let variant12;
          switch (dataView(memory0).getUint8(ret + 36, true)) {
            case 0: {
              variant12 = undefined;
              break;
            }
            case 1: {
              variant12 = dataView(memory0).getInt32(ret + 40, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          let variant13;
          switch (dataView(memory0).getUint8(ret + 44, true)) {
            case 0: {
              variant13 = undefined;
              break;
            }
            case 1: {
              variant13 = dataView(memory0).getInt32(ret + 48, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          variant32= {
            tag: 'n-go',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              parentId: dataView(memory0).getInt32(ret + 20, true),
              prevId: dataView(memory0).getInt32(ret + 24, true),
              nextId: dataView(memory0).getInt32(ret + 28, true),
              isGroup: dataView(memory0).getInt32(ret + 32, true),
              headId: variant12,
              tailId: variant13,
            }
          };
          break;
        }
        case 4: {
          let variant14;
          switch (dataView(memory0).getUint8(ret + 36, true)) {
            case 0: {
              variant14 = undefined;
              break;
            }
            case 1: {
              variant14 = dataView(memory0).getInt32(ret + 40, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          let variant15;
          switch (dataView(memory0).getUint8(ret + 44, true)) {
            case 0: {
              variant15 = undefined;
              break;
            }
            case 1: {
              variant15 = dataView(memory0).getInt32(ret + 48, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          variant32= {
            tag: 'n-end',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              parentId: dataView(memory0).getInt32(ret + 20, true),
              prevId: dataView(memory0).getInt32(ret + 24, true),
              nextId: dataView(memory0).getInt32(ret + 28, true),
              isGroup: dataView(memory0).getInt32(ret + 32, true),
              headId: variant14,
              tailId: variant15,
            }
          };
          break;
        }
        case 5: {
          let variant16;
          switch (dataView(memory0).getUint8(ret + 36, true)) {
            case 0: {
              variant16 = undefined;
              break;
            }
            case 1: {
              variant16 = dataView(memory0).getInt32(ret + 40, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          let variant17;
          switch (dataView(memory0).getUint8(ret + 44, true)) {
            case 0: {
              variant17 = undefined;
              break;
            }
            case 1: {
              variant17 = dataView(memory0).getInt32(ret + 48, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          variant32= {
            tag: 'n-on',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              parentId: dataView(memory0).getInt32(ret + 20, true),
              prevId: dataView(memory0).getInt32(ret + 24, true),
              nextId: dataView(memory0).getInt32(ret + 28, true),
              isGroup: dataView(memory0).getInt32(ret + 32, true),
              headId: variant16,
              tailId: variant17,
            }
          };
          break;
        }
        case 6: {
          let variant18;
          switch (dataView(memory0).getUint8(ret + 36, true)) {
            case 0: {
              variant18 = undefined;
              break;
            }
            case 1: {
              variant18 = dataView(memory0).getInt32(ret + 40, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          let variant19;
          switch (dataView(memory0).getUint8(ret + 44, true)) {
            case 0: {
              variant19 = undefined;
              break;
            }
            case 1: {
              variant19 = dataView(memory0).getInt32(ret + 48, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          variant32= {
            tag: 'n-off',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              parentId: dataView(memory0).getInt32(ret + 20, true),
              prevId: dataView(memory0).getInt32(ret + 24, true),
              nextId: dataView(memory0).getInt32(ret + 28, true),
              isGroup: dataView(memory0).getInt32(ret + 32, true),
              headId: variant18,
              tailId: variant19,
            }
          };
          break;
        }
        case 7: {
          let variant20;
          switch (dataView(memory0).getUint8(ret + 36, true)) {
            case 0: {
              variant20 = undefined;
              break;
            }
            case 1: {
              variant20 = dataView(memory0).getInt32(ret + 40, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          let variant21;
          switch (dataView(memory0).getUint8(ret + 44, true)) {
            case 0: {
              variant21 = undefined;
              break;
            }
            case 1: {
              variant21 = dataView(memory0).getInt32(ret + 48, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          variant32= {
            tag: 'n-move',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              parentId: dataView(memory0).getInt32(ret + 20, true),
              prevId: dataView(memory0).getInt32(ret + 24, true),
              nextId: dataView(memory0).getInt32(ret + 28, true),
              isGroup: dataView(memory0).getInt32(ret + 32, true),
              headId: variant20,
              tailId: variant21,
            }
          };
          break;
        }
        case 8: {
          let variant22;
          switch (dataView(memory0).getUint8(ret + 36, true)) {
            case 0: {
              variant22 = undefined;
              break;
            }
            case 1: {
              variant22 = dataView(memory0).getInt32(ret + 40, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          let variant23;
          switch (dataView(memory0).getUint8(ret + 44, true)) {
            case 0: {
              variant23 = undefined;
              break;
            }
            case 1: {
              variant23 = dataView(memory0).getInt32(ret + 48, true);
              break;
            }
            default: {
              throw new TypeError('invalid variant discriminant for option');
            }
          }
          variant32= {
            tag: 'n-info',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              parentId: dataView(memory0).getInt32(ret + 20, true),
              prevId: dataView(memory0).getInt32(ret + 24, true),
              nextId: dataView(memory0).getInt32(ret + 28, true),
              isGroup: dataView(memory0).getInt32(ret + 32, true),
              headId: variant22,
              tailId: variant23,
            }
          };
          break;
        }
        case 9: {
          variant32= {
            tag: 'status-reply',
            val: {
              unused: dataView(memory0).getInt32(ret + 16, true),
              numUgens: dataView(memory0).getInt32(ret + 20, true),
              numSynths: dataView(memory0).getInt32(ret + 24, true),
              numGroups: dataView(memory0).getInt32(ret + 28, true),
              numSynthDefs: dataView(memory0).getInt32(ret + 32, true),
              avgCpu: dataView(memory0).getFloat32(ret + 36, true),
              peakCpu: dataView(memory0).getFloat32(ret + 40, true),
              nominalSampleRate: dataView(memory0).getFloat64(ret + 48, true),
              actualSampleRate: dataView(memory0).getFloat64(ret + 56, true),
            }
          };
          break;
        }
        case 10: {
          variant32= {
            tag: 'tr',
            val: {
              nodeId: dataView(memory0).getInt32(ret + 16, true),
              triggerId: dataView(memory0).getInt32(ret + 20, true),
              value: dataView(memory0).getFloat32(ret + 24, true),
            }
          };
          break;
        }
        case 11: {
          var ptr24 = dataView(memory0).getUint32(ret + 24, true);
          var len24 = dataView(memory0).getUint32(ret + 28, true);
          var result24 = new Float32Array(memory0.buffer.slice(ptr24, ptr24 + len24 * 4));
          variant32= {
            tag: 'b-setn',
            val: {
              bufnum: dataView(memory0).getInt32(ret + 16, true),
              start: dataView(memory0).getInt32(ret + 20, true),
              samples: result24,
            }
          };
          break;
        }
        case 12: {
          variant32= {
            tag: 'synced',
            val: {
              syncId: dataView(memory0).getInt32(ret + 16, true),
            }
          };
          break;
        }
        case 13: {
          var bool25 = dataView(memory0).getUint8(ret + 24, true);
          var ptr26 = dataView(memory0).getUint32(ret + 32, true);
          var len26 = dataView(memory0).getUint32(ret + 36, true);
          var result26 = new Float32Array(memory0.buffer.slice(ptr26, ptr26 + len26 * 4));
          variant32= {
            tag: 'scope-chunk',
            val: {
              subId: dataView(memory0).getInt32(ret + 16, true),
              tickIndex: dataView(memory0).getInt32(ret + 20, true),
              isGap: bool25 == 0 ? false : (bool25 == 1 ? true : throwInvalidBool()),
              channels: dataView(memory0).getInt32(ret + 28, true),
              samples: result26,
            }
          };
          break;
        }
        case 14: {
          var ptr27 = dataView(memory0).getUint32(ret + 16, true);
          var len27 = dataView(memory0).getUint32(ret + 20, true);
          var result27 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr27, len27));
          var len31 = dataView(memory0).getUint32(ret + 28, true);
          var base31 = dataView(memory0).getUint32(ret + 24, true);
          var result31 = [];
          for (let i = 0; i < len31; i++) {
            const base = base31 + i * 16;
            let variant30;
            switch (dataView(memory0).getUint8(base + 0, true)) {
              case 0: {
                variant30= {
                  tag: 'int32',
                  val: dataView(memory0).getInt32(base + 8, true)
                };
                break;
              }
              case 1: {
                variant30= {
                  tag: 'float32',
                  val: dataView(memory0).getFloat32(base + 8, true)
                };
                break;
              }
              case 2: {
                variant30= {
                  tag: 'float64',
                  val: dataView(memory0).getFloat64(base + 8, true)
                };
                break;
              }
              case 3: {
                var ptr28 = dataView(memory0).getUint32(base + 8, true);
                var len28 = dataView(memory0).getUint32(base + 12, true);
                var result28 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr28, len28));
                variant30= {
                  tag: 'string',
                  val: result28
                };
                break;
              }
              case 4: {
                var ptr29 = dataView(memory0).getUint32(base + 8, true);
                var len29 = dataView(memory0).getUint32(base + 12, true);
                var result29 = new Uint8Array(memory0.buffer.slice(ptr29, ptr29 + len29 * 1));
                variant30= {
                  tag: 'blob',
                  val: result29
                };
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for OscArg');
              }
            }
            result31.push(variant30);
          }
          variant32= {
            tag: 'other',
            val: {
              address: result27,
              args: result31,
            }
          };
          break;
        }
        default: {
          throw new TypeError('invalid variant discriminant for ServerReply');
        }
      }
      variant34= {
        tag: 'ok',
        val: variant32
      };
      break;
    }
    case 1: {
      var ptr33 = dataView(memory0).getUint32(ret + 8, true);
      var len33 = dataView(memory0).getUint32(ret + 12, true);
      var result33 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr33, len33));
      variant34= {
        tag: 'err',
        val: result33
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  _debugLog('[iface="scserver:commands/replies@0.1.0", function="decode"][Instruction::Return]', {
    funcName: 'decode',
    paramCount: 1,
    async: false,
    postReturn: true
  });
  const retCopy = variant34;
  task.resolve([retCopy.val]);
  
  let cstate = getOrCreateAsyncState(0);
  cstate.mayLeave = false;
  postReturn1(ret);
  cstate.mayLeave = true;
  task.exit();
  
  
  
  if (typeof retCopy === 'object' && retCopy.tag === 'err') {
    throw new ComponentError(retCopy.val);
  }
  return retCopy.val;
  
}
let replies010DecodeBundle;

function decodeBundle(arg0) {
  var val0 = arg0;
  var len0 = Array.isArray(val0) ? val0.length : val0.byteLength;
  var ptr0 = realloc0(0, 0, 1, len0 * 1);
  
  let valData0;
  const valLenBytes0 = len0 * 1;
  if (Array.isArray(val0)) {
    // Regular array likely containing numbers, write values to memory
    let offset = 0;
    const dv0 = new DataView(memory0.buffer);
    for (const v of val0) {
      _requireValidNumericPrimitive.bind(null, 'u8')(v);
      dv0.setUint8(ptr0+ offset, v, true);
      offset += 1;
    }
  } else {
    // TypedArray / ArrayBuffer-like, direct copy
    valData0 = new Uint8Array(val0.buffer || val0, val0.byteOffset, valLenBytes0);
    const out0 = new Uint8Array(memory0.buffer, ptr0, valLenBytes0);
    out0.set(valData0);
  }
  
  _debugLog('[iface="scserver:commands/replies@0.1.0", function="decode-bundle"][Instruction::CallWasm] enter', {
    funcName: 'decode-bundle',
    paramCount: 2,
    async: false,
    postReturn: true,
  });
  const hostProvided = false;
  
  const [task, _wasm_call_currentTaskID] = createNewCurrentTask({
    componentIdx: 0,
    isAsync: false,
    isManualAsync: false,
    entryFnName: 'replies010DecodeBundle',
    getCallbackFn: () => null,
    callbackFnName: null,
    errHandling: 'throw-result-err',
    callingWasmExport: true,
  });
  
  const started = task.enterSync();
  
  if (0!== null) {
    task.setReturnMemoryIdx(0);
    task.setReturnMemory(() => memory0());
  }
  
  
  let ret;
  
  try {
    ret =   _withGlobalCurrentTaskMeta({
      taskID: task.id(),
      componentIdx: task.componentIdx(),
      fn: () => replies010DecodeBundle(ptr0, len0),
    });
  } catch (err) {
    
    _debugLog('[Instruction::CallWasm] error during sync call', {
      taskID: task.id(),
      err,
    });
    task.setErrored(err);
    task.reject(err);
    task.exit();
    throw err;
    
  }
  
  let variant35;
  switch (dataView(memory0).getUint8(ret + 0, true)) {
    case 0: {
      var len33 = dataView(memory0).getUint32(ret + 16, true);
      var base33 = dataView(memory0).getUint32(ret + 12, true);
      var result33 = [];
      for (let i = 0; i < len33; i++) {
        const base = base33 + i * 56;
        let variant32;
        switch (dataView(memory0).getUint8(base + 0, true)) {
          case 0: {
            var ptr1 = dataView(memory0).getUint32(base + 8, true);
            var len1 = dataView(memory0).getUint32(base + 12, true);
            var result1 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr1, len1));
            var len5 = dataView(memory0).getUint32(base + 20, true);
            var base5 = dataView(memory0).getUint32(base + 16, true);
            var result5 = [];
            for (let i = 0; i < len5; i++) {
              const base = base5 + i * 16;
              let variant4;
              switch (dataView(memory0).getUint8(base + 0, true)) {
                case 0: {
                  variant4= {
                    tag: 'int32',
                    val: dataView(memory0).getInt32(base + 8, true)
                  };
                  break;
                }
                case 1: {
                  variant4= {
                    tag: 'float32',
                    val: dataView(memory0).getFloat32(base + 8, true)
                  };
                  break;
                }
                case 2: {
                  variant4= {
                    tag: 'float64',
                    val: dataView(memory0).getFloat64(base + 8, true)
                  };
                  break;
                }
                case 3: {
                  var ptr2 = dataView(memory0).getUint32(base + 8, true);
                  var len2 = dataView(memory0).getUint32(base + 12, true);
                  var result2 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr2, len2));
                  variant4= {
                    tag: 'string',
                    val: result2
                  };
                  break;
                }
                case 4: {
                  var ptr3 = dataView(memory0).getUint32(base + 8, true);
                  var len3 = dataView(memory0).getUint32(base + 12, true);
                  var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
                  variant4= {
                    tag: 'blob',
                    val: result3
                  };
                  break;
                }
                default: {
                  throw new TypeError('invalid variant discriminant for OscArg');
                }
              }
              result5.push(variant4);
            }
            variant32= {
              tag: 'done',
              val: {
                address: result1,
                extras: result5,
              }
            };
            break;
          }
          case 1: {
            var ptr6 = dataView(memory0).getUint32(base + 8, true);
            var len6 = dataView(memory0).getUint32(base + 12, true);
            var result6 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr6, len6));
            var ptr7 = dataView(memory0).getUint32(base + 16, true);
            var len7 = dataView(memory0).getUint32(base + 20, true);
            var result7 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr7, len7));
            var len11 = dataView(memory0).getUint32(base + 28, true);
            var base11 = dataView(memory0).getUint32(base + 24, true);
            var result11 = [];
            for (let i = 0; i < len11; i++) {
              const base = base11 + i * 16;
              let variant10;
              switch (dataView(memory0).getUint8(base + 0, true)) {
                case 0: {
                  variant10= {
                    tag: 'int32',
                    val: dataView(memory0).getInt32(base + 8, true)
                  };
                  break;
                }
                case 1: {
                  variant10= {
                    tag: 'float32',
                    val: dataView(memory0).getFloat32(base + 8, true)
                  };
                  break;
                }
                case 2: {
                  variant10= {
                    tag: 'float64',
                    val: dataView(memory0).getFloat64(base + 8, true)
                  };
                  break;
                }
                case 3: {
                  var ptr8 = dataView(memory0).getUint32(base + 8, true);
                  var len8 = dataView(memory0).getUint32(base + 12, true);
                  var result8 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr8, len8));
                  variant10= {
                    tag: 'string',
                    val: result8
                  };
                  break;
                }
                case 4: {
                  var ptr9 = dataView(memory0).getUint32(base + 8, true);
                  var len9 = dataView(memory0).getUint32(base + 12, true);
                  var result9 = new Uint8Array(memory0.buffer.slice(ptr9, ptr9 + len9 * 1));
                  variant10= {
                    tag: 'blob',
                    val: result9
                  };
                  break;
                }
                default: {
                  throw new TypeError('invalid variant discriminant for OscArg');
                }
              }
              result11.push(variant10);
            }
            variant32= {
              tag: 'fail',
              val: {
                address: result6,
                error: result7,
                extras: result11,
              }
            };
            break;
          }
          case 2: {
            variant32= {
              tag: 'late',
              val: {
                seconds: dataView(memory0).getInt32(base + 8, true),
                fractions: dataView(memory0).getInt32(base + 12, true),
                lateSecs: dataView(memory0).getInt32(base + 16, true),
                lateFracs: dataView(memory0).getInt32(base + 20, true),
              }
            };
            break;
          }
          case 3: {
            let variant12;
            switch (dataView(memory0).getUint8(base + 28, true)) {
              case 0: {
                variant12 = undefined;
                break;
              }
              case 1: {
                variant12 = dataView(memory0).getInt32(base + 32, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            let variant13;
            switch (dataView(memory0).getUint8(base + 36, true)) {
              case 0: {
                variant13 = undefined;
                break;
              }
              case 1: {
                variant13 = dataView(memory0).getInt32(base + 40, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            variant32= {
              tag: 'n-go',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                parentId: dataView(memory0).getInt32(base + 12, true),
                prevId: dataView(memory0).getInt32(base + 16, true),
                nextId: dataView(memory0).getInt32(base + 20, true),
                isGroup: dataView(memory0).getInt32(base + 24, true),
                headId: variant12,
                tailId: variant13,
              }
            };
            break;
          }
          case 4: {
            let variant14;
            switch (dataView(memory0).getUint8(base + 28, true)) {
              case 0: {
                variant14 = undefined;
                break;
              }
              case 1: {
                variant14 = dataView(memory0).getInt32(base + 32, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            let variant15;
            switch (dataView(memory0).getUint8(base + 36, true)) {
              case 0: {
                variant15 = undefined;
                break;
              }
              case 1: {
                variant15 = dataView(memory0).getInt32(base + 40, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            variant32= {
              tag: 'n-end',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                parentId: dataView(memory0).getInt32(base + 12, true),
                prevId: dataView(memory0).getInt32(base + 16, true),
                nextId: dataView(memory0).getInt32(base + 20, true),
                isGroup: dataView(memory0).getInt32(base + 24, true),
                headId: variant14,
                tailId: variant15,
              }
            };
            break;
          }
          case 5: {
            let variant16;
            switch (dataView(memory0).getUint8(base + 28, true)) {
              case 0: {
                variant16 = undefined;
                break;
              }
              case 1: {
                variant16 = dataView(memory0).getInt32(base + 32, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            let variant17;
            switch (dataView(memory0).getUint8(base + 36, true)) {
              case 0: {
                variant17 = undefined;
                break;
              }
              case 1: {
                variant17 = dataView(memory0).getInt32(base + 40, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            variant32= {
              tag: 'n-on',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                parentId: dataView(memory0).getInt32(base + 12, true),
                prevId: dataView(memory0).getInt32(base + 16, true),
                nextId: dataView(memory0).getInt32(base + 20, true),
                isGroup: dataView(memory0).getInt32(base + 24, true),
                headId: variant16,
                tailId: variant17,
              }
            };
            break;
          }
          case 6: {
            let variant18;
            switch (dataView(memory0).getUint8(base + 28, true)) {
              case 0: {
                variant18 = undefined;
                break;
              }
              case 1: {
                variant18 = dataView(memory0).getInt32(base + 32, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            let variant19;
            switch (dataView(memory0).getUint8(base + 36, true)) {
              case 0: {
                variant19 = undefined;
                break;
              }
              case 1: {
                variant19 = dataView(memory0).getInt32(base + 40, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            variant32= {
              tag: 'n-off',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                parentId: dataView(memory0).getInt32(base + 12, true),
                prevId: dataView(memory0).getInt32(base + 16, true),
                nextId: dataView(memory0).getInt32(base + 20, true),
                isGroup: dataView(memory0).getInt32(base + 24, true),
                headId: variant18,
                tailId: variant19,
              }
            };
            break;
          }
          case 7: {
            let variant20;
            switch (dataView(memory0).getUint8(base + 28, true)) {
              case 0: {
                variant20 = undefined;
                break;
              }
              case 1: {
                variant20 = dataView(memory0).getInt32(base + 32, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            let variant21;
            switch (dataView(memory0).getUint8(base + 36, true)) {
              case 0: {
                variant21 = undefined;
                break;
              }
              case 1: {
                variant21 = dataView(memory0).getInt32(base + 40, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            variant32= {
              tag: 'n-move',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                parentId: dataView(memory0).getInt32(base + 12, true),
                prevId: dataView(memory0).getInt32(base + 16, true),
                nextId: dataView(memory0).getInt32(base + 20, true),
                isGroup: dataView(memory0).getInt32(base + 24, true),
                headId: variant20,
                tailId: variant21,
              }
            };
            break;
          }
          case 8: {
            let variant22;
            switch (dataView(memory0).getUint8(base + 28, true)) {
              case 0: {
                variant22 = undefined;
                break;
              }
              case 1: {
                variant22 = dataView(memory0).getInt32(base + 32, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            let variant23;
            switch (dataView(memory0).getUint8(base + 36, true)) {
              case 0: {
                variant23 = undefined;
                break;
              }
              case 1: {
                variant23 = dataView(memory0).getInt32(base + 40, true);
                break;
              }
              default: {
                throw new TypeError('invalid variant discriminant for option');
              }
            }
            variant32= {
              tag: 'n-info',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                parentId: dataView(memory0).getInt32(base + 12, true),
                prevId: dataView(memory0).getInt32(base + 16, true),
                nextId: dataView(memory0).getInt32(base + 20, true),
                isGroup: dataView(memory0).getInt32(base + 24, true),
                headId: variant22,
                tailId: variant23,
              }
            };
            break;
          }
          case 9: {
            variant32= {
              tag: 'status-reply',
              val: {
                unused: dataView(memory0).getInt32(base + 8, true),
                numUgens: dataView(memory0).getInt32(base + 12, true),
                numSynths: dataView(memory0).getInt32(base + 16, true),
                numGroups: dataView(memory0).getInt32(base + 20, true),
                numSynthDefs: dataView(memory0).getInt32(base + 24, true),
                avgCpu: dataView(memory0).getFloat32(base + 28, true),
                peakCpu: dataView(memory0).getFloat32(base + 32, true),
                nominalSampleRate: dataView(memory0).getFloat64(base + 40, true),
                actualSampleRate: dataView(memory0).getFloat64(base + 48, true),
              }
            };
            break;
          }
          case 10: {
            variant32= {
              tag: 'tr',
              val: {
                nodeId: dataView(memory0).getInt32(base + 8, true),
                triggerId: dataView(memory0).getInt32(base + 12, true),
                value: dataView(memory0).getFloat32(base + 16, true),
              }
            };
            break;
          }
          case 11: {
            var ptr24 = dataView(memory0).getUint32(base + 16, true);
            var len24 = dataView(memory0).getUint32(base + 20, true);
            var result24 = new Float32Array(memory0.buffer.slice(ptr24, ptr24 + len24 * 4));
            variant32= {
              tag: 'b-setn',
              val: {
                bufnum: dataView(memory0).getInt32(base + 8, true),
                start: dataView(memory0).getInt32(base + 12, true),
                samples: result24,
              }
            };
            break;
          }
          case 12: {
            variant32= {
              tag: 'synced',
              val: {
                syncId: dataView(memory0).getInt32(base + 8, true),
              }
            };
            break;
          }
          case 13: {
            var bool25 = dataView(memory0).getUint8(base + 16, true);
            var ptr26 = dataView(memory0).getUint32(base + 24, true);
            var len26 = dataView(memory0).getUint32(base + 28, true);
            var result26 = new Float32Array(memory0.buffer.slice(ptr26, ptr26 + len26 * 4));
            variant32= {
              tag: 'scope-chunk',
              val: {
                subId: dataView(memory0).getInt32(base + 8, true),
                tickIndex: dataView(memory0).getInt32(base + 12, true),
                isGap: bool25 == 0 ? false : (bool25 == 1 ? true : throwInvalidBool()),
                channels: dataView(memory0).getInt32(base + 20, true),
                samples: result26,
              }
            };
            break;
          }
          case 14: {
            var ptr27 = dataView(memory0).getUint32(base + 8, true);
            var len27 = dataView(memory0).getUint32(base + 12, true);
            var result27 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr27, len27));
            var len31 = dataView(memory0).getUint32(base + 20, true);
            var base31 = dataView(memory0).getUint32(base + 16, true);
            var result31 = [];
            for (let i = 0; i < len31; i++) {
              const base = base31 + i * 16;
              let variant30;
              switch (dataView(memory0).getUint8(base + 0, true)) {
                case 0: {
                  variant30= {
                    tag: 'int32',
                    val: dataView(memory0).getInt32(base + 8, true)
                  };
                  break;
                }
                case 1: {
                  variant30= {
                    tag: 'float32',
                    val: dataView(memory0).getFloat32(base + 8, true)
                  };
                  break;
                }
                case 2: {
                  variant30= {
                    tag: 'float64',
                    val: dataView(memory0).getFloat64(base + 8, true)
                  };
                  break;
                }
                case 3: {
                  var ptr28 = dataView(memory0).getUint32(base + 8, true);
                  var len28 = dataView(memory0).getUint32(base + 12, true);
                  var result28 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr28, len28));
                  variant30= {
                    tag: 'string',
                    val: result28
                  };
                  break;
                }
                case 4: {
                  var ptr29 = dataView(memory0).getUint32(base + 8, true);
                  var len29 = dataView(memory0).getUint32(base + 12, true);
                  var result29 = new Uint8Array(memory0.buffer.slice(ptr29, ptr29 + len29 * 1));
                  variant30= {
                    tag: 'blob',
                    val: result29
                  };
                  break;
                }
                default: {
                  throw new TypeError('invalid variant discriminant for OscArg');
                }
              }
              result31.push(variant30);
            }
            variant32= {
              tag: 'other',
              val: {
                address: result27,
                args: result31,
              }
            };
            break;
          }
          default: {
            throw new TypeError('invalid variant discriminant for ServerReply');
          }
        }
        result33.push(variant32);
      }
      variant35= {
        tag: 'ok',
        val: {
          time: {
            seconds: dataView(memory0).getInt32(ret + 4, true) >>> 0,
            fractional: dataView(memory0).getInt32(ret + 8, true) >>> 0,
          },
          replies: result33,
        }
      };
      break;
    }
    case 1: {
      var ptr34 = dataView(memory0).getUint32(ret + 4, true);
      var len34 = dataView(memory0).getUint32(ret + 8, true);
      var result34 = TEXT_DECODER_UTF8.decode(new Uint8Array(memory0.buffer, ptr34, len34));
      variant35= {
        tag: 'err',
        val: result34
      };
      break;
    }
    default: {
      throw new TypeError('invalid variant discriminant for expected');
    }
  }
  _debugLog('[iface="scserver:commands/replies@0.1.0", function="decode-bundle"][Instruction::Return]', {
    funcName: 'decode-bundle',
    paramCount: 1,
    async: false,
    postReturn: true
  });
  const retCopy = variant35;
  task.resolve([retCopy.val]);
  
  let cstate = getOrCreateAsyncState(0);
  cstate.mayLeave = false;
  postReturn2(ret);
  cstate.mayLeave = true;
  task.exit();
  
  
  
  if (typeof retCopy === 'object' && retCopy.tag === 'err') {
    throw new ComponentError(retCopy.val);
  }
  return retCopy.val;
  
}
const trampoline0 = rscTableCreateOwn.bind(null, handleTable0);
function trampoline1(handle) {
  const handleEntry = rscTableRemove(handleTable0, handle);
  if (handleEntry.own) {
    
    exports0['0'](handleEntry.rep);
  }
}

const $init = (() => {
  let gen = (function* _initGenerator () {
    const module0 = fetchCompile(new URL('./scserver.core.wasm', import.meta.url));
    const module1 = base64Compile('AGFzbQEAAAABBQFgAX8AAwIBAAQFAXABAQEHEAIBMAAACCRpbXBvcnRzAQAKCwEJACAAQQARAAALAC8JcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkBDXdpdC1jb21wb25lbnQHMC4yMjcuMQAtBG5hbWUAExJ3aXQtY29tcG9uZW50OnNoaW0BEQEADmR0b3ItbnJ0LXNjb3Jl');
    const module2 = base64Compile('AGFzbQEAAAABBQFgAX8AAhUCAAEwAAAACCRpbXBvcnRzAXABAQEJBwEAQQALAQAALwlwcm9kdWNlcnMBDHByb2Nlc3NlZC1ieQENd2l0LWNvbXBvbmVudAcwLjIyNy4xABwEbmFtZQAVFHdpdC1jb21wb25lbnQ6Zml4dXBz');
    ({ exports: exports0 } = yield instantiateCore(yield module1));
    ({ exports: exports1 } = yield instantiateCore(yield module0, {
      '[export]scserver:commands/nrt@0.1.0': {
        '[resource-drop]nrt-score': trampoline1,
        '[resource-new]nrt-score': trampoline0,
      },
    }));
    ({ exports: exports2 } = yield instantiateCore(yield module2, {
      '': {
        $imports: exports0.$imports,
        '0': exports1['scserver:commands/nrt@0.1.0#[dtor]nrt-score'],
      },
    }));
    memory0 = exports1.memory;
    realloc0 = exports1.cabi_realloc;
    
    try {
      realloc0Async = WebAssembly.promising(exports1.cabi_realloc);
    } catch(err) {
      realloc0Async = exports1.cabi_realloc;
    }
    
    postReturn0 = exports1['cabi_post_scserver:commands/commands@0.1.0#encode'];
    
    try {
      postReturn0Async = WebAssembly.promising(exports1['cabi_post_scserver:commands/commands@0.1.0#encode']);
    } catch(err) {
      postReturn0Async = exports1['cabi_post_scserver:commands/commands@0.1.0#encode'];
    }
    
    postReturn1 = exports1['cabi_post_scserver:commands/replies@0.1.0#decode'];
    
    try {
      postReturn1Async = WebAssembly.promising(exports1['cabi_post_scserver:commands/replies@0.1.0#decode']);
    } catch(err) {
      postReturn1Async = exports1['cabi_post_scserver:commands/replies@0.1.0#decode'];
    }
    
    postReturn2 = exports1['cabi_post_scserver:commands/replies@0.1.0#decode-bundle'];
    
    try {
      postReturn2Async = WebAssembly.promising(exports1['cabi_post_scserver:commands/replies@0.1.0#decode-bundle']);
    } catch(err) {
      postReturn2Async = exports1['cabi_post_scserver:commands/replies@0.1.0#decode-bundle'];
    }
    
    commands010Encode = exports1['scserver:commands/commands@0.1.0#encode'];
    commands010EncodeBatch = exports1['scserver:commands/commands@0.1.0#encode-batch'];
    commands010EncodeBundle = exports1['scserver:commands/commands@0.1.0#encode-bundle'];
    commands010AtUnixMs = exports1['scserver:commands/commands@0.1.0#at-unix-ms'];
    nrt010ConstructorNrtScore = exports1['scserver:commands/nrt@0.1.0#[constructor]nrt-score'];
    nrt010MethodNrtScoreAt = exports1['scserver:commands/nrt@0.1.0#[method]nrt-score.at'];
    nrt010MethodNrtScoreEncode = exports1['scserver:commands/nrt@0.1.0#[method]nrt-score.encode'];
    replies010Decode = exports1['scserver:commands/replies@0.1.0#decode'];
    replies010DecodeBundle = exports1['scserver:commands/replies@0.1.0#decode-bundle'];
  })();
  let promise, resolve, reject;
  function runNext (value) {
    try {
      let done;
      do {
        ({ value, done } = gen.next(value));
      } while (!(value instanceof Promise) && !done);
      if (done) {
        if (resolve) resolve(value);
        else return value;
      }
      if (!promise) promise = new Promise((_resolve, _reject) => (resolve = _resolve, reject = _reject));
      value.then(runNext, reject);
    }
    catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }
  const maybeSyncReturn = runNext(null);
  return promise || maybeSyncReturn;
})();

await $init;
const commands010 = {
  atUnixMs: atUnixMs,
  encode: encode,
  encodeBatch: encodeBatch,
  encodeBundle: encodeBundle,
  
};
const nrt010 = {
  NrtScore: NrtScore,
  
};
const replies010 = {
  decode: decode,
  decodeBundle: decodeBundle,
  
};

export { commands010 as commands, nrt010 as nrt, replies010 as replies, commands010 as 'scserver:commands/commands@0.1.0', nrt010 as 'scserver:commands/nrt@0.1.0', replies010 as 'scserver:commands/replies@0.1.0',  }