var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// ../../node_modules/.bun/solid-js@1.9.17/node_modules/solid-js/dist/dev.js
var exports_dev = {};
__export(exports_dev, {
  $DEVCOMP: () => $DEVCOMP,
  $PROXY: () => $PROXY,
  $TRACK: () => $TRACK,
  DEV: () => DEV,
  ErrorBoundary: () => ErrorBoundary,
  For: () => For,
  Index: () => Index,
  Match: () => Match,
  Show: () => Show,
  Suspense: () => Suspense,
  SuspenseList: () => SuspenseList,
  Switch: () => Switch,
  batch: () => batch,
  cancelCallback: () => cancelCallback,
  catchError: () => catchError,
  children: () => children,
  createComponent: () => createComponent,
  createComputed: () => createComputed,
  createContext: () => createContext,
  createDeferred: () => createDeferred,
  createEffect: () => createEffect,
  createMemo: () => createMemo,
  createReaction: () => createReaction,
  createRenderEffect: () => createRenderEffect,
  createResource: () => createResource,
  createRoot: () => createRoot,
  createSelector: () => createSelector,
  createSignal: () => createSignal,
  createUniqueId: () => createUniqueId,
  enableExternalSource: () => enableExternalSource,
  enableHydration: () => enableHydration,
  enableScheduling: () => enableScheduling,
  equalFn: () => equalFn,
  from: () => from,
  getListener: () => getListener,
  getOwner: () => getOwner,
  indexArray: () => indexArray,
  lazy: () => lazy,
  mapArray: () => mapArray,
  mergeProps: () => mergeProps,
  observable: () => observable,
  on: () => on,
  onCleanup: () => onCleanup,
  onError: () => onError,
  onMount: () => onMount,
  requestCallback: () => requestCallback,
  resetErrorBoundaries: () => resetErrorBoundaries,
  runWithOwner: () => runWithOwner,
  sharedConfig: () => sharedConfig,
  splitProps: () => splitProps,
  startTransition: () => startTransition,
  untrack: () => untrack,
  useContext: () => useContext,
  useTransition: () => useTransition
});
var taskIdCounter = 1;
var isCallbackScheduled = false;
var isPerformingWork = false;
var taskQueue = [];
var currentTask = null;
var shouldYieldToHost = null;
var yieldInterval = 5;
var deadline = 0;
var maxYieldInterval = 300;
var maxDeadline = 0;
var scheduleCallback = null;
var scheduledCallback = null;
var maxSigned31BitInt = 1073741823;
function setupScheduler() {
  const channel = new MessageChannel, { port1, port2: port } = channel;
  if (typeof port1.unref === "function")
    port1.unref();
  if (typeof port.unref === "function")
    port.unref();
  scheduleCallback = () => port.postMessage(null);
  port1.onmessage = () => {
    if (scheduledCallback !== null) {
      const currentTime = performance.now();
      deadline = currentTime + yieldInterval;
      maxDeadline = currentTime + maxYieldInterval;
      try {
        const hasMoreWork = scheduledCallback(currentTime);
        if (!hasMoreWork) {
          scheduledCallback = null;
        } else
          port.postMessage(null);
      } catch (error) {
        port.postMessage(null);
        throw error;
      }
    }
  };
  if (navigator && navigator.scheduling && navigator.scheduling.isInputPending) {
    const scheduling = navigator.scheduling;
    shouldYieldToHost = () => {
      const currentTime = performance.now();
      if (currentTime >= deadline) {
        if (scheduling.isInputPending()) {
          return true;
        }
        return currentTime >= maxDeadline;
      } else {
        return false;
      }
    };
  } else {
    shouldYieldToHost = () => performance.now() >= deadline;
  }
}
function enqueue(taskQueue, task) {
  function findIndex() {
    let m = 0;
    let n = taskQueue.length - 1;
    while (m <= n) {
      const k = n + m >> 1;
      const cmp = task.expirationTime - taskQueue[k].expirationTime;
      if (cmp > 0)
        m = k + 1;
      else if (cmp < 0)
        n = k - 1;
      else
        return k;
    }
    return m;
  }
  taskQueue.splice(findIndex(), 0, task);
}
function requestCallback(fn, options) {
  if (!scheduleCallback)
    setupScheduler();
  let startTime = performance.now(), timeout = maxSigned31BitInt;
  if (options && options.timeout)
    timeout = options.timeout;
  const newTask = {
    id: taskIdCounter++,
    fn,
    startTime,
    expirationTime: startTime + timeout
  };
  enqueue(taskQueue, newTask);
  if (!isCallbackScheduled && !isPerformingWork) {
    isCallbackScheduled = true;
    scheduledCallback = flushWork;
    scheduleCallback();
  }
  return newTask;
}
function cancelCallback(task) {
  task.fn = null;
}
function flushWork(initialTime) {
  isCallbackScheduled = false;
  isPerformingWork = true;
  try {
    return workLoop(initialTime);
  } finally {
    currentTask = null;
    isPerformingWork = false;
  }
}
function workLoop(initialTime) {
  let currentTime = initialTime;
  currentTask = taskQueue[0] || null;
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    const callback = currentTask.fn;
    if (callback !== null) {
      currentTask.fn = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      callback(didUserCallbackTimeout);
      currentTime = performance.now();
      if (currentTask === taskQueue[0]) {
        taskQueue.shift();
      }
    } else
      taskQueue.shift();
    currentTask = taskQueue[0] || null;
  }
  return currentTask !== null;
}
var sharedConfig = {
  context: undefined,
  registry: undefined,
  effects: undefined,
  done: false,
  getContextId() {
    return getContextId(this.context.count);
  },
  getNextContextId() {
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return {
    ...sharedConfig.context,
    id: sharedConfig.getNextContextId(),
    count: 0
  };
}
var IS_DEV = true;
var equalFn = (a, b) => a === b;
var $PROXY = Symbol("solid-proxy");
var SUPPORTS_PROXY = typeof Proxy === "function";
var $TRACK = Symbol("solid-track");
var $DEVCOMP = Symbol("solid-dev-component");
var signalOptions = {
  equals: equalFn
};
var ERROR = null;
var runEffects = runQueue;
var STALE = 1;
var PENDING = 2;
var UNOWNED = {};
var NO_INIT = {};
var Owner = null;
var Transition = null;
var Scheduler = null;
var ExternalSourceConfig = null;
var Listener = null;
var Updates = null;
var Effects = null;
var ExecCount = 0;
var DevHooks = {
  afterUpdate: null,
  afterCreateOwner: null,
  afterCreateSignal: null,
  afterRegisterGraph: null
};
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === undefined ? owner : detachedOwner, root = unowned ? {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  } : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? () => fn(() => {
    throw new Error("Dispose method must be an explicit argument to createRoot function");
  }) : () => fn(() => untrack(() => cleanNode(root)));
  DevHooks.afterCreateOwner && DevHooks.afterCreateOwner(root);
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || undefined
  };
  {
    if (options.name)
      s.name = options.name;
    if (options.internal) {
      s.internal = true;
    } else {
      registerGraph(s);
      if (DevHooks.afterCreateSignal)
        DevHooks.afterCreateSignal(s);
    }
  }
  const setter = (value) => {
    if (typeof value === "function") {
      if (Transition && Transition.running && Transition.sources.has(s))
        value = value(s.tValue);
      else
        value = value(s.value);
    }
    return writeSignal(s, value);
  };
  return [readSignal.bind(s), setter];
}
function createComputed(fn, value, options) {
  const c = createComputation(fn, value, true, STALE, options);
  if (Scheduler && Transition && Transition.running)
    Updates.push(c);
  else
    updateComputation(c);
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE, options);
  if (Scheduler && Transition && Transition.running)
    Updates.push(c);
  else
    updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE, options), s = SuspenseContext && useContext(SuspenseContext);
  if (s)
    c.suspense = s;
  if (!options || !options.render)
    c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createReaction(onInvalidate, options) {
  let fn;
  const c = createComputation(() => {
    fn ? fn() : untrack(onInvalidate);
    fn = undefined;
  }, undefined, false, 0, options), s = SuspenseContext && useContext(SuspenseContext);
  if (s)
    c.suspense = s;
  c.user = true;
  return (tracking) => {
    fn = tracking;
    updateComputation(c);
  };
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0, options);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || undefined;
  if (Scheduler && Transition && Transition.running) {
    c.tState = STALE;
    Updates.push(c);
  } else
    updateComputation(c);
  return readSignal.bind(c);
}
function isPromise(v) {
  return v && typeof v === "object" && "then" in v;
}
function createResource(pSource, pFetcher, pOptions) {
  let source;
  let fetcher;
  let options;
  if (typeof pFetcher === "function") {
    source = pSource;
    fetcher = pFetcher;
    options = pOptions || {};
  } else {
    source = true;
    fetcher = pSource;
    options = pFetcher || {};
  }
  let pr = null, initP = NO_INIT, id = null, loadedUnderTransition = false, scheduled = false, resolved = "initialValue" in options, dynamic = typeof source === "function" && createMemo(source);
  const contexts = new Set, [value, setValue] = (options.storage || createSignal)(options.initialValue), [error, setError] = createSignal(undefined), [track, trigger] = createSignal(undefined, {
    equals: false
  }), [state, setState] = createSignal(resolved ? "ready" : "unresolved");
  if (Owner)
    onCleanup(() => {
      for (const c of contexts.keys())
        c.decrement();
      contexts.clear();
      if (Transition && pr)
        Transition.promises.delete(pr);
      pr = null;
    });
  if (sharedConfig.context) {
    id = sharedConfig.getNextContextId();
    if (options.ssrLoadFrom === "initial")
      initP = options.initialValue;
    else if (sharedConfig.load && sharedConfig.has(id))
      initP = sharedConfig.load(id);
  }
  function loadEnd(p, v, error, key) {
    if (pr === p) {
      pr = null;
      key !== undefined && (resolved = true);
      if ((p === initP || v === initP) && options.onHydrated)
        queueMicrotask(() => options.onHydrated(key, {
          value: v
        }));
      initP = NO_INIT;
      if (Transition && p && loadedUnderTransition) {
        Transition.promises.delete(p);
        loadedUnderTransition = false;
        runUpdates(() => {
          Transition.running = true;
          completeLoad(v, error);
        }, false);
      } else
        completeLoad(v, error);
    }
    return v;
  }
  function completeLoad(v, err) {
    runUpdates(() => {
      if (err === undefined)
        setValue(() => v);
      setState(err !== undefined ? "errored" : resolved ? "ready" : "unresolved");
      setError(err);
      for (const c of contexts.keys())
        c.decrement();
      contexts.clear();
    }, false);
  }
  function read() {
    const c = SuspenseContext && useContext(SuspenseContext), v = value(), err = error();
    if (err !== undefined && !pr)
      throw err;
    if (Listener && !Listener.user && c) {
      createComputed(() => {
        track();
        if (pr) {
          if (c.resolved && Transition && loadedUnderTransition)
            Transition.promises.add(pr);
          else if (!contexts.has(c)) {
            c.increment();
            contexts.add(c);
          }
        }
      });
    }
    return v;
  }
  function load(refetching = true) {
    if (refetching !== false && scheduled)
      return;
    scheduled = false;
    const lookup = dynamic ? dynamic() : source;
    loadedUnderTransition = Transition && Transition.running;
    if (lookup == null || lookup === false) {
      loadEnd(pr, untrack(value));
      return;
    }
    if (Transition && pr)
      Transition.promises.delete(pr);
    let error;
    const p = initP !== NO_INIT ? initP : untrack(() => {
      try {
        return fetcher(lookup, {
          value: value(),
          refetching
        });
      } catch (fetcherError) {
        error = fetcherError;
      }
    });
    if (error !== undefined) {
      loadEnd(pr, undefined, castError(error), lookup);
      return;
    } else if (!isPromise(p)) {
      loadEnd(pr, p, undefined, lookup);
      return p;
    }
    pr = p;
    if ("v" in p) {
      if (p.s === 1)
        loadEnd(pr, p.v, undefined, lookup);
      else
        loadEnd(pr, undefined, castError(p.v), lookup);
      return p;
    }
    scheduled = true;
    queueMicrotask(() => scheduled = false);
    runUpdates(() => {
      setState(resolved ? "refreshing" : "pending");
      trigger();
    }, false);
    return p.then((v) => loadEnd(p, v, undefined, lookup), (e) => loadEnd(p, undefined, castError(e), lookup));
  }
  Object.defineProperties(read, {
    state: {
      get: () => state()
    },
    error: {
      get: () => error()
    },
    loading: {
      get() {
        const s = state();
        return s === "pending" || s === "refreshing";
      }
    },
    latest: {
      get() {
        if (!resolved)
          return read();
        const err = error();
        if (err && !pr)
          throw err;
        return value();
      }
    }
  });
  let owner = Owner;
  if (dynamic)
    createComputed(() => (owner = Owner, load(false)));
  else
    load(false);
  return [read, {
    refetch: (info) => runWithOwner(owner, () => load(info)),
    mutate: setValue
  }];
}
function createDeferred(source, options) {
  let t, timeout = options ? options.timeoutMs : undefined;
  const node = createComputation(() => {
    if (!t || !t.fn)
      t = requestCallback(() => setDeferred(() => node.value), timeout !== undefined ? {
        timeout
      } : undefined);
    return source();
  }, undefined, true);
  const [deferred, setDeferred] = createSignal(Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, options);
  updateComputation(node);
  setDeferred(() => Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value);
  return deferred;
}
function createSelector(source, fn = equalFn, options) {
  const subs = new Map;
  const node = createComputation((p) => {
    const v = source();
    for (const [key, val] of subs.entries())
      if (fn(key, v) !== fn(key, p)) {
        for (const c of val.values()) {
          if (Transition && Transition.running)
            c.tState = STALE;
          else
            c.state = STALE;
          if (c.pure)
            Updates.push(c);
          else
            Effects.push(c);
        }
      }
    return v;
  }, undefined, true, STALE, options);
  updateComputation(node);
  return (key) => {
    const listener = Listener;
    if (listener) {
      let l;
      if (l = subs.get(key))
        l.add(listener);
      else
        subs.set(key, l = new Set([listener]));
      onCleanup(() => {
        l.delete(listener);
        !l.size && subs.delete(key);
      });
    }
    return fn(key, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value);
  };
}
function batch(fn) {
  return runUpdates(fn, false);
}
function untrack(fn) {
  if (!ExternalSourceConfig && Listener === null)
    return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig)
      return ExternalSourceConfig.untrack(fn);
    return fn();
  } finally {
    Listener = listener;
  }
}
function on(deps, fn, options) {
  const isArray = Array.isArray(deps);
  let prevInput;
  let defer = options && options.defer;
  return (prevValue) => {
    let input;
    if (isArray) {
      input = Array(deps.length);
      for (let i = 0;i < deps.length; i++)
        input[i] = deps[i]();
    } else
      input = deps();
    if (defer) {
      defer = false;
      return prevValue;
    }
    const result = untrack(() => fn(input, prevInput, prevValue));
    prevInput = input;
    return result;
  };
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null)
    console.warn("cleanups created outside a `createRoot` or `render` will never be run");
  else if (Owner.cleanups === null)
    Owner.cleanups = [fn];
  else
    Owner.cleanups.push(fn);
  return fn;
}
function catchError(fn, handler) {
  ERROR || (ERROR = Symbol("error"));
  Owner = createComputation(undefined, undefined, true);
  Owner.context = {
    ...Owner.context,
    [ERROR]: [handler]
  };
  if (Transition && Transition.running)
    Transition.sources.add(Owner);
  try {
    return fn();
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
}
function getListener() {
  return Listener;
}
function getOwner() {
  return Owner;
}
function runWithOwner(o, fn) {
  const prev = Owner;
  const prevListener = Listener;
  Owner = o;
  Listener = null;
  try {
    return runUpdates(fn, true);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = prev;
    Listener = prevListener;
  }
}
function enableScheduling(scheduler = requestCallback) {
  Scheduler = scheduler;
}
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn();
    return Transition.done;
  }
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    if (Scheduler || SuspenseContext) {
      t = Transition || (Transition = {
        sources: new Set,
        effects: [],
        promises: new Set,
        disposed: new Set,
        queue: new Set,
        running: true
      });
      t.done || (t.done = new Promise((res) => t.resolve = res));
      t.running = true;
    }
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : undefined;
  });
}
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
function useTransition() {
  return [transPending, startTransition];
}
function resumeEffects(e) {
  Effects.push.apply(Effects, e);
  e.length = 0;
}
function devComponent(Comp, props) {
  const c = createComputation(() => untrack(() => {
    Object.assign(Comp, {
      [$DEVCOMP]: true
    });
    return Comp(props);
  }), undefined, true, 0);
  c.props = props;
  c.observers = null;
  c.observerSlots = null;
  c.name = Comp.name;
  c.component = Comp;
  updateComputation(c);
  return c.tValue !== undefined ? c.tValue : c.value;
}
function registerGraph(value) {
  if (Owner) {
    if (Owner.sourceMap)
      Owner.sourceMap.push(value);
    else
      Owner.sourceMap = [value];
    value.graph = Owner;
  }
  if (DevHooks.afterRegisterGraph)
    DevHooks.afterRegisterGraph(value);
}
function createContext(defaultValue, options) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id, options),
    defaultValue
  };
}
function useContext(context) {
  let value;
  return Owner && Owner.context && (value = Owner.context[context.id]) !== undefined ? value : context.defaultValue;
}
function children(fn) {
  const children2 = createMemo(fn);
  const memo = createMemo(() => resolveChildren(children2()), undefined, {
    name: "children"
  });
  memo.toArray = () => {
    const c = memo();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo;
}
var SuspenseContext;
function getSuspenseContext() {
  return SuspenseContext || (SuspenseContext = createContext());
}
function enableExternalSource(factory, untrack2 = (fn) => fn()) {
  if (ExternalSourceConfig) {
    const {
      factory: oldFactory,
      untrack: oldUntrack
    } = ExternalSourceConfig;
    ExternalSourceConfig = {
      factory: (fn, trigger) => {
        const oldSource = oldFactory(fn, trigger);
        const source = factory((x) => oldSource.track(x), trigger);
        return {
          track: (x) => source.track(x),
          dispose() {
            source.dispose();
            oldSource.dispose();
          }
        };
      },
      untrack: (fn) => oldUntrack(() => untrack2(fn))
    };
  } else {
    ExternalSourceConfig = {
      factory,
      untrack: untrack2
    };
  }
}
function readSignal() {
  const runningTransition = Transition && Transition.running;
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE)
      updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const observers = this.observers;
    if (!observers || observers[observers.length - 1] !== Listener) {
      const sSlot = observers ? observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [this];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(this);
        Listener.sourceSlots.push(sSlot);
      }
      if (!observers) {
        this.observers = [Listener];
        this.observerSlots = [Listener.sources.length - 1];
      } else {
        observers.push(Listener);
        this.observerSlots.push(Listener.sources.length - 1);
      }
    }
  }
  if (runningTransition && Transition.sources.has(this))
    return this.tValue;
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node);
        node.tValue = value;
      }
      if (!TransitionRunning)
        node.value = value;
    } else
      node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0;i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o))
            continue;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure)
              Updates.push(o);
            else
              Effects.push(o);
            if (o.observers)
              markDownstream(o);
          }
          if (!TransitionRunning)
            o.state = STALE;
          else
            o.tState = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (IS_DEV)
            throw new Error("Potential Infinite Loop Detected.");
          throw new Error;
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn)
    return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned.forEach(cleanNode);
        node.tOwned = undefined;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      if (!Transition.sources.has(node))
        node.value = nextValue;
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else
      node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Transition && Transition.running) {
    c.state = 0;
    c.tState = state;
  }
  if (Owner === null)
    console.warn("computations created outside a `createRoot` or `render` will never be disposed");
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned)
        Owner.tOwned = [c];
      else
        Owner.tOwned.push(c);
    } else {
      if (!Owner.owned)
        Owner.owned = [c];
      else
        Owner.owned.push(c);
    }
  }
  if (options && options.name)
    c.name = options.name;
  if (ExternalSourceConfig && c.fn) {
    const sourceFn = c.fn;
    const [track, trigger] = createSignal(undefined, {
      equals: false
    });
    const ordinary = ExternalSourceConfig.factory(sourceFn, trigger);
    onCleanup(() => ordinary.dispose());
    let inTransition;
    let trackedOrdinary = false;
    const triggerInTransition = () => startTransition(trigger).then(() => {
      if (inTransition) {
        inTransition.dispose();
        inTransition = undefined;
        if (!trackedOrdinary)
          trigger();
      }
    });
    c.fn = (x) => {
      track();
      if (Transition && Transition.running) {
        if (!inTransition)
          inTransition = ExternalSourceConfig.factory(sourceFn, triggerInTransition);
        return inTransition.track(x);
      }
      trackedOrdinary = true;
      return ordinary.track(x);
    };
  }
  DevHooks.afterCreateOwner && DevHooks.afterCreateOwner(c);
  return c;
}
function runTop(node) {
  const runningTransition = Transition && Transition.running;
  if ((runningTransition ? node.tState : node.state) === 0)
    return;
  if ((runningTransition ? node.tState : node.state) === PENDING)
    return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback))
    return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (runningTransition && Transition.disposed.has(node))
      return;
    if (runningTransition ? node.tState : node.state)
      ancestors.push(node);
  }
  for (let i = ancestors.length - 1;i >= 0; i--) {
    node = ancestors[i];
    if (runningTransition) {
      let top = node, prev = ancestors[i + 1];
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top))
          return;
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node);
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates)
    return fn();
  let wait = false;
  if (!init)
    Updates = [];
  if (Effects)
    wait = true;
  else
    Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait)
      Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running)
      scheduleQueue(Updates);
    else
      runQueue(Updates);
    Updates = null;
  }
  if (wait)
    return;
  let res;
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources;
      const disposed = Transition.disposed;
      Effects.push.apply(Effects, Transition.effects);
      res = Transition.resolve;
      for (const e of Effects) {
        "tState" in e && (e.state = e.tState);
        delete e.tState;
      }
      Transition = null;
      runUpdates(() => {
        for (const d of disposed)
          cleanNode(d);
        for (const v of sources) {
          v.value = v.tValue;
          if (v.owned) {
            for (let i = 0, len = v.owned.length;i < len; i++)
              cleanNode(v.owned[i]);
          }
          if (v.tOwned)
            v.owned = v.tOwned;
          delete v.tValue;
          delete v.tOwned;
          v.tState = 0;
        }
        setTransPending(false);
      }, false);
    } else if (Transition.running) {
      Transition.running = false;
      Transition.effects.push.apply(Transition.effects, Effects);
      Effects = null;
      setTransPending(true);
      return;
    }
  }
  const e = Effects;
  Effects = null;
  if (e.length)
    runUpdates(() => runEffects(e), false);
  else
    DevHooks.afterUpdate && DevHooks.afterUpdate();
  if (res)
    res();
}
function runQueue(queue) {
  for (let i = 0;i < queue.length; i++)
    runTop(queue[i]);
}
function scheduleQueue(queue) {
  for (let i = 0;i < queue.length; i++) {
    const item = queue[i];
    const tasks = Transition.queue;
    if (!tasks.has(item)) {
      tasks.add(item);
      Scheduler(() => {
        tasks.delete(item);
        runUpdates(() => {
          Transition.running = true;
          runTop(item);
        }, false);
        Transition && (Transition.running = false);
      });
    }
  }
}
function runUserEffects(queue) {
  let i, userLength = 0;
  for (i = 0;i < queue.length; i++) {
    const e = queue[i];
    if (!e.user)
      runTop(e);
    else
      queue[userLength++] = e;
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = []);
      sharedConfig.effects.push(...queue.slice(0, userLength));
      return;
    }
    setHydrateContext();
  }
  if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
    queue = [...sharedConfig.effects, ...queue];
    userLength += sharedConfig.effects.length;
    delete sharedConfig.effects;
  }
  for (i = 0;i < userLength; i++)
    runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running;
  if (runningTransition)
    node.tState = 0;
  else
    node.state = 0;
  for (let i = 0;i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);
      } else if (state === PENDING)
        lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition && Transition.running;
  for (let i = 0;i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (runningTransition ? !o.tState : !o.state) {
      if (runningTransition)
        o.tState = PENDING;
      else
        o.state = PENDING;
      if (o.pure)
        Updates.push(o);
      else
        Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i = node.tOwned.length - 1;i >= 0; i--)
      cleanNode(node.tOwned[i]);
    delete node.tOwned;
  }
  if (Transition && Transition.running && node.pure) {
    reset(node, true);
  } else if (node.owned) {
    for (i = node.owned.length - 1;i >= 0; i--)
      cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1;i >= 0; i--)
      node.cleanups[i]();
    node.cleanups = null;
  }
  if (Transition && Transition.running)
    node.tState = 0;
  else
    node.state = 0;
  delete node.sourceMap;
}
function reset(node, top) {
  if (!top) {
    node.tState = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i = 0;i < node.owned.length; i++)
      reset(node.owned[i]);
  }
}
function castError(err) {
  if (err instanceof Error)
    return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function runErrors(err, fns, owner) {
  try {
    for (const f of fns)
      f(err);
  } catch (e) {
    handleError(e, owner && owner.owner || null);
  }
}
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns)
    throw error;
  if (Effects)
    Effects.push({
      fn() {
        runErrors(error, fns, owner);
      },
      state: STALE
    });
  else
    runErrors(error, fns, owner);
}
function resolveChildren(children2) {
  if (typeof children2 === "function" && !children2.length)
    return resolveChildren(children2());
  if (Array.isArray(children2)) {
    const results = [];
    for (let i = 0;i < children2.length; i++) {
      const result = resolveChildren(children2[i]);
      if (Array.isArray(result)) {
        if (result.length < 32768)
          results.push.apply(results, result);
        else
          for (let j = 0;j < result.length; j++)
            results.push(result[j]);
      } else {
        results.push(result);
      }
    }
    return results;
  }
  return children2;
}
function createProvider(id, options) {
  return function provider(props) {
    let res;
    createRenderEffect(() => res = untrack(() => {
      Owner.context = {
        ...Owner.context,
        [id]: props.value
      };
      return children(() => props.children);
    }), undefined, options);
    return res;
  };
}
function onError(fn) {
  ERROR || (ERROR = Symbol("error"));
  if (Owner === null)
    console.warn("error handlers created outside a `createRoot` or `render` will never be run");
  else if (Owner.context === null || !Owner.context[ERROR]) {
    Owner.context = {
      ...Owner.context,
      [ERROR]: [fn]
    };
    mutateContext(Owner, ERROR, [fn]);
  } else
    Owner.context[ERROR].push(fn);
}
function mutateContext(o, key, value) {
  if (o.owned) {
    for (let i = 0;i < o.owned.length; i++) {
      if (o.owned[i].context === o.context)
        mutateContext(o.owned[i], key, value);
      if (!o.owned[i].context) {
        o.owned[i].context = o.context;
        mutateContext(o.owned[i], key, value);
      } else if (!o.owned[i].context[key]) {
        o.owned[i].context[key] = value;
        mutateContext(o.owned[i], key, value);
      }
    }
  }
}
function observable(input) {
  return {
    subscribe(observer) {
      if (!(observer instanceof Object) || observer == null) {
        throw new TypeError("Expected the observer to be an object.");
      }
      const handler = typeof observer === "function" ? observer : observer.next && observer.next.bind(observer);
      if (!handler) {
        return {
          unsubscribe() {}
        };
      }
      const dispose = createRoot((disposer) => {
        createEffect(() => {
          const v = input();
          untrack(() => handler(v));
        });
        return disposer;
      });
      if (getOwner())
        onCleanup(dispose);
      return {
        unsubscribe() {
          dispose();
        }
      };
    },
    [Symbol.observable || "@@observable"]() {
      return this;
    }
  };
}
function from(producer, initalValue = undefined) {
  const [s, set] = createSignal(initalValue, {
    equals: false
  });
  if ("subscribe" in producer) {
    const unsub = producer.subscribe((v) => set(() => v));
    onCleanup(() => ("unsubscribe" in unsub) ? unsub.unsubscribe() : unsub());
  } else {
    const clean = producer(set);
    onCleanup(clean);
  }
  return s;
}
var FALLBACK = Symbol("fallback");
function dispose(d) {
  for (let i = 0;i < d.length; i++)
    d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], newLen = newItems.length, i, j;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0;j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen);start < end && items[start] === newItems[start]; start++)
          ;
        for (end = len - 1, newEnd = newLen - 1;end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = new Map;
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd;j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === undefined ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start;i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== undefined && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else
            disposers[i]();
        }
        for (j = start;j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else
            mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j, {
          name: "index"
        });
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
function indexArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], signals = [], len = 0, i;
  onCleanup(() => dispose(disposers));
  return () => {
    const newItems = list() || [], newLen = newItems.length;
    newItems[$TRACK];
    return untrack(() => {
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          signals = [];
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
        return mapped;
      }
      if (items[0] === FALLBACK) {
        disposers[0]();
        disposers = [];
        items = [];
        mapped = [];
        len = 0;
      }
      for (i = 0;i < newLen; i++) {
        if (i < items.length && items[i] !== newItems[i]) {
          signals[i](() => newItems[i]);
        } else if (i >= items.length) {
          mapped[i] = createRoot(mapper);
        }
      }
      for (;i < items.length; i++) {
        disposers[i]();
      }
      len = signals.length = disposers.length = newLen;
      items = newItems.slice(0);
      return mapped = mapped.slice(0, len);
    });
    function mapper(disposer) {
      disposers[i] = disposer;
      const [s, set] = createSignal(newItems[i], {
        name: "value"
      });
      signals[i] = set;
      return mapFn(s, i);
    }
  };
}
var hydrationEnabled = false;
function enableHydration() {
  hydrationEnabled = true;
}
function createComponent(Comp, props) {
  if (hydrationEnabled) {
    if (sharedConfig.context) {
      const c = sharedConfig.context;
      setHydrateContext(nextHydrateContext());
      const r = devComponent(Comp, props || {});
      setHydrateContext(c);
      return r;
    }
  }
  return devComponent(Comp, props || {});
}
function trueFn() {
  return true;
}
var propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY)
      return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY)
      return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
  for (let i = 0, length = this.length;i < length; ++i) {
    const v = this[i]();
    if (v !== undefined)
      return v;
  }
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0;i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || !!s && $PROXY in s;
    sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
  }
  if (SUPPORTS_PROXY && proxy) {
    return new Proxy({
      get(property) {
        for (let i = sources.length - 1;i >= 0; i--) {
          const v = resolveSource(sources[i])[property];
          if (v !== undefined)
            return v;
        }
      },
      has(property) {
        for (let i = sources.length - 1;i >= 0; i--) {
          if (property in resolveSource(sources[i]))
            return true;
        }
        return false;
      },
      keys() {
        const keys = [];
        for (let i = 0;i < sources.length; i++)
          keys.push(...Object.keys(resolveSource(sources[i])));
        return [...new Set(keys)];
      }
    }, propTraps);
  }
  const sourcesMap = {};
  const defined = Object.create(null);
  for (let i = sources.length - 1;i >= 0; i--) {
    const source = sources[i];
    if (!source)
      continue;
    const sourceKeys = Object.getOwnPropertyNames(source);
    for (let i = sourceKeys.length - 1;i >= 0; i--) {
      const key = sourceKeys[i];
      if (key === "__proto__" || key === "constructor")
        continue;
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (!defined[key]) {
        defined[key] = desc.get ? {
          enumerable: true,
          configurable: true,
          get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
        } : desc.value !== undefined ? desc : undefined;
      } else {
        const sources = sourcesMap[key];
        if (sources) {
          if (desc.get)
            sources.push(desc.get.bind(source));
          else if (desc.value !== undefined)
            sources.push(() => desc.value);
        }
      }
    }
  }
  const target = {};
  const definedKeys = Object.keys(defined);
  for (let i = definedKeys.length - 1;i >= 0; i--) {
    const key = definedKeys[i], desc = defined[key];
    if (desc && desc.get)
      Object.defineProperty(target, key, desc);
    else
      target[key] = desc ? desc.value : undefined;
  }
  return target;
}
function splitProps(props, ...keys) {
  const len = keys.length;
  if (SUPPORTS_PROXY && $PROXY in props) {
    const blocked = len > 1 ? keys.flat() : keys[0];
    const claimed = new Set;
    const res = keys.map((k) => {
      const owned = k.filter((property) => !claimed.has(property) && (claimed.add(property), true));
      return new Proxy({
        get(property) {
          return owned.includes(property) ? props[property] : undefined;
        },
        has(property) {
          return owned.includes(property) && property in props;
        },
        keys() {
          return owned.filter((property) => (property in props));
        }
      }, propTraps);
    });
    res.push(new Proxy({
      get(property) {
        return blocked.includes(property) ? undefined : props[property];
      },
      has(property) {
        return blocked.includes(property) ? false : (property in props);
      },
      keys() {
        return Object.keys(props).filter((k) => !blocked.includes(k));
      }
    }, propTraps));
    return res;
  }
  const objects = [];
  for (let i = 0;i <= len; i++) {
    objects[i] = {};
  }
  for (const propName of Object.getOwnPropertyNames(props)) {
    let keyIndex = len;
    for (let i = 0;i < keys.length; i++) {
      if (keys[i].includes(propName)) {
        keyIndex = i;
        break;
      }
    }
    const desc = Object.getOwnPropertyDescriptor(props, propName);
    const isDefaultDesc = !desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable;
    isDefaultDesc ? objects[keyIndex][propName] = desc.value : Object.defineProperty(objects[keyIndex], propName, desc);
  }
  return objects;
}
function lazy(fn) {
  let comp;
  let p;
  const load = () => {
    if (!p) {
      const cur = p = fn();
      cur.then((mod) => {
        comp = () => mod.default;
      }, () => {
        if (p === cur)
          p = undefined;
      });
    }
    return p;
  };
  const wrap = (props) => {
    const ctx = sharedConfig.context;
    if (ctx) {
      const [s, set] = createSignal();
      sharedConfig.count || (sharedConfig.count = 0);
      sharedConfig.count++;
      load().then((mod) => {
        !sharedConfig.done && setHydrateContext(ctx);
        sharedConfig.count--;
        set(() => mod.default);
        setHydrateContext();
      }, (err) => {
        !sharedConfig.done && setHydrateContext(ctx);
        sharedConfig.count--;
        set(() => () => {
          throw err;
        });
        setHydrateContext();
      });
      comp = s;
    } else if (!comp) {
      const [s] = createResource(() => load().then((mod) => mod.default));
      comp = s;
      onCleanup(() => comp = undefined);
    }
    let Comp;
    return createMemo(() => (Comp = comp?.()) ? untrack(() => {
      if (IS_DEV)
        Object.assign(Comp, {
          [$DEVCOMP]: true
        });
      if (!ctx || sharedConfig.done)
        return Comp(props);
      const c = sharedConfig.context;
      setHydrateContext(ctx);
      const r = Comp(props);
      setHydrateContext(c);
      return r;
    }) : "");
  };
  wrap.preload = () => load();
  return wrap;
}
var counter = 0;
function createUniqueId() {
  const ctx = sharedConfig.context;
  return ctx ? sharedConfig.getNextContextId() : `cl-${counter++}`;
}
var narrowedError = (name) => `Attempting to access a stale value from <${name}> that could possibly be undefined. This may occur because you are reading the accessor returned from the component at a time where it has already been unmounted. We recommend cleaning up any stale timers or async, or reading from the initial condition.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || undefined), undefined, {
    name: "value"
  });
}
function Index(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(indexArray(() => props.each, props.children, fallback || undefined), undefined, {
    name: "value"
  });
}
function Show(props) {
  const keyed = props.keyed;
  const conditionValue = createMemo(() => props.when, undefined, {
    name: "condition value"
  });
  const condition = keyed ? conditionValue : createMemo(conditionValue, undefined, {
    equals: (a, b) => !a === !b,
    name: "condition"
  });
  return createMemo(() => {
    const c = condition();
    if (c) {
      const child = props.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn ? untrack(() => child(keyed ? c : () => {
        if (!untrack(condition))
          throw narrowedError("Show");
        return conditionValue();
      })) : child;
    }
    return props.fallback;
  }, undefined, {
    name: "value"
  });
}
function Switch(props) {
  const chs = children(() => props.children);
  const switchFunc = createMemo(() => {
    const ch = chs();
    const mps = Array.isArray(ch) ? ch : [ch];
    let func = () => {
      return;
    };
    for (let i = 0;i < mps.length; i++) {
      const index = i;
      const mp = mps[i];
      const prevFunc = func;
      const conditionValue = createMemo(() => prevFunc() ? undefined : mp.when, undefined, {
        name: "condition value"
      });
      const condition = mp.keyed ? conditionValue : createMemo(conditionValue, undefined, {
        equals: (a, b) => !a === !b,
        name: "condition"
      });
      func = () => prevFunc() || (condition() ? [index, conditionValue, mp] : undefined);
    }
    return func;
  });
  return createMemo(() => {
    const sel = switchFunc()();
    if (!sel)
      return props.fallback;
    const [index, conditionValue, mp] = sel;
    const child = mp.children;
    const fn = typeof child === "function" && child.length > 0;
    return fn ? untrack(() => child(mp.keyed ? conditionValue() : () => {
      if (untrack(switchFunc)()?.[0] !== index)
        throw narrowedError("Match");
      return conditionValue();
    })) : child;
  }, undefined, {
    name: "eval conditions"
  });
}
function Match(props) {
  return props;
}
var Errors;
function resetErrorBoundaries() {
  Errors && [...Errors].forEach((fn) => fn());
}
function ErrorBoundary(props) {
  let err;
  if (sharedConfig.context && sharedConfig.load)
    err = sharedConfig.load(sharedConfig.getContextId());
  const [errored, setErrored] = createSignal(err, {
    name: "errored"
  });
  Errors || (Errors = new Set);
  Errors.add(setErrored);
  onCleanup(() => Errors.delete(setErrored));
  return createMemo(() => {
    let e;
    if (e = errored()) {
      const f = props.fallback;
      if (typeof f !== "function" || f.length == 0)
        console.error(e);
      return typeof f === "function" && f.length ? untrack(() => f(e, () => setErrored())) : f;
    }
    return catchError(() => props.children, setErrored);
  }, undefined, {
    name: "value"
  });
}
var suspenseListEquals = (a, b) => a.showContent === b.showContent && a.showFallback === b.showFallback;
var SuspenseListContext = /* @__PURE__ */ createContext();
function SuspenseList(props) {
  let [wrapper, setWrapper] = createSignal(() => ({
    inFallback: false
  })), show;
  const listContext = useContext(SuspenseListContext);
  const [registry, setRegistry] = createSignal([]);
  if (listContext) {
    show = listContext.register(createMemo(() => wrapper()().inFallback));
  }
  const resolved = createMemo((prev) => {
    const { revealOrder: reveal, tail } = props, {
      showContent = true,
      showFallback = true
    } = show ? show() : {}, reg = registry(), reverse = reveal === "backwards";
    if (reveal === "together") {
      const all = reg.every((inFallback) => !inFallback());
      const res = reg.map(() => ({
        showContent: all && showContent,
        showFallback
      }));
      res.inFallback = !all;
      return res;
    }
    let stop = false;
    let inFallback = prev.inFallback;
    const res = [];
    for (let i = 0, len = reg.length;i < len; i++) {
      const n = reverse ? len - i - 1 : i, s = reg[n]();
      if (!stop && !s) {
        res[n] = {
          showContent,
          showFallback
        };
      } else {
        const next = !stop;
        if (next)
          inFallback = true;
        res[n] = {
          showContent: next,
          showFallback: !tail || next && tail === "collapsed" ? showFallback : false
        };
        stop = true;
      }
    }
    if (!stop)
      inFallback = false;
    res.inFallback = inFallback;
    return res;
  }, {
    inFallback: false
  });
  setWrapper(() => resolved);
  return createComponent(SuspenseListContext.Provider, {
    value: {
      register: (inFallback) => {
        let index;
        setRegistry((registry) => {
          index = registry.length;
          return [...registry, inFallback];
        });
        return createMemo(() => resolved()[index], undefined, {
          equals: suspenseListEquals
        });
      }
    },
    get children() {
      return props.children;
    }
  });
}
function Suspense(props) {
  let counter = 0, show, ctx, p, flicker, error;
  const [inFallback, setFallback] = createSignal(false), SuspenseContext = getSuspenseContext(), store = {
    increment: () => {
      if (++counter === 1)
        setFallback(true);
    },
    decrement: () => {
      if (--counter === 0)
        setFallback(false);
    },
    inFallback,
    effects: [],
    resolved: false
  }, owner = getOwner();
  if (sharedConfig.context && sharedConfig.load) {
    const key = sharedConfig.getContextId();
    let ref = sharedConfig.load(key);
    if (ref) {
      if (typeof ref !== "object" || ref.s !== 1)
        p = ref;
      else
        sharedConfig.gather(key);
    }
    if (p && p !== "$$f") {
      const [s, set] = createSignal(undefined, {
        equals: false
      });
      flicker = s;
      p.then(() => {
        if (sharedConfig.done)
          return set();
        sharedConfig.gather(key);
        setHydrateContext(ctx);
        set();
        setHydrateContext();
      }, (err) => {
        error = err;
        set();
      });
    }
  }
  const listContext = useContext(SuspenseListContext);
  if (listContext)
    show = listContext.register(store.inFallback);
  let dispose;
  onCleanup(() => dispose && dispose());
  return createComponent(SuspenseContext.Provider, {
    value: store,
    get children() {
      return createMemo(() => {
        if (error)
          throw error;
        ctx = sharedConfig.context;
        if (flicker) {
          flicker();
          return flicker = undefined;
        }
        if (ctx && p === "$$f")
          setHydrateContext();
        const rendered = createMemo(() => props.children);
        return createMemo((prev) => {
          const inFallback = store.inFallback(), {
            showContent = true,
            showFallback = true
          } = show ? show() : {};
          if ((!inFallback || p && p !== "$$f") && showContent) {
            store.resolved = true;
            dispose && dispose();
            dispose = ctx = p = undefined;
            resumeEffects(store.effects);
            return rendered();
          }
          if (!showFallback)
            return;
          if (dispose)
            return prev;
          return createRoot((disposer) => {
            dispose = disposer;
            if (ctx) {
              setHydrateContext({
                id: ctx.id + "F",
                count: 0
              });
              ctx = undefined;
            }
            return props.fallback;
          }, owner);
        });
      });
    }
  });
}
var DEV = {
  hooks: DevHooks,
  writeSignal,
  registerGraph
};
if (globalThis) {
  if (!globalThis.Solid$$)
    globalThis.Solid$$ = true;
  else
    console.warn("You appear to have multiple instances of Solid. This can lead to unexpected behavior.");
}

// ../../node_modules/.bun/solid-js@1.9.17/node_modules/solid-js/web/dist/dev.js
var booleans = [
  "allowfullscreen",
  "async",
  "alpha",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "adauctionheaders",
  "browsingtopics",
  "credentialless",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback",
  "preservespitch",
  "shadowrootclonable",
  "shadowrootcustomelementregistry",
  "shadowrootdelegatesfocus",
  "shadowrootserializable",
  "sharedstoragewritable"
];
var Properties = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "noValidate",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "adAuctionHeaders",
  "allowFullscreen",
  "browsingTopics",
  "defaultChecked",
  "defaultMuted",
  "defaultSelected",
  "disablePictureInPicture",
  "disableRemotePlayback",
  "preservesPitch",
  "shadowRootClonable",
  "shadowRootCustomElementRegistry",
  "shadowRootDelegatesFocus",
  "shadowRootSerializable",
  "sharedStorageWritable",
  ...booleans
]);
var ChildProperties = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]);
var Aliases = /* @__PURE__ */ Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});
var PropAliases = /* @__PURE__ */ Object.assign(Object.create(null), {
  class: "className",
  novalidate: {
    $: "noValidate",
    FORM: 1
  },
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  },
  adauctionheaders: {
    $: "adAuctionHeaders",
    IFRAME: 1
  },
  allowfullscreen: {
    $: "allowFullscreen",
    IFRAME: 1
  },
  browsingtopics: {
    $: "browsingTopics",
    IMG: 1
  },
  defaultchecked: {
    $: "defaultChecked",
    INPUT: 1
  },
  defaultmuted: {
    $: "defaultMuted",
    AUDIO: 1,
    VIDEO: 1
  },
  defaultselected: {
    $: "defaultSelected",
    OPTION: 1
  },
  disablepictureinpicture: {
    $: "disablePictureInPicture",
    VIDEO: 1
  },
  disableremoteplayback: {
    $: "disableRemotePlayback",
    AUDIO: 1,
    VIDEO: 1
  },
  preservespitch: {
    $: "preservesPitch",
    AUDIO: 1,
    VIDEO: 1
  },
  shadowrootclonable: {
    $: "shadowRootClonable",
    TEMPLATE: 1
  },
  shadowrootdelegatesfocus: {
    $: "shadowRootDelegatesFocus",
    TEMPLATE: 1
  },
  shadowrootserializable: {
    $: "shadowRootSerializable",
    TEMPLATE: 1
  },
  sharedstoragewritable: {
    $: "sharedStorageWritable",
    IFRAME: 1,
    IMG: 1
  }
});
function getPropAlias(prop, tagName) {
  const a = PropAliases[prop];
  return typeof a === "object" ? a[tagName] ? a["$"] : undefined : a;
}
var DelegatedEvents = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]);
var SVGElements = /* @__PURE__ */ new Set([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern"
]);
var SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
var memo = (fn) => createMemo(() => fn());
function reconcileArrays(parentNode, a, b) {
  let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd)
        parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart]))
          a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map;
        let i = bStart;
        while (i < bEnd)
          map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart, sequence = 1, t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence)
              break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index)
              parentNode.insertBefore(b[bStart++], node);
          } else
            parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else
          aStart++;
      } else
        a[aStart++].remove();
    }
  }
}
var $$EVENTS = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  if (!element) {
    throw new Error("The `element` passed to `render(..., element)` doesn't exist. Make sure `element` exists in the document.");
  }
  let disposer;
  createRoot((dispose) => {
    disposer = dispose;
    element === document ? code() : insert(element, code(), !init && element.firstChild ? null : undefined, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isImportNode, isSVG, isMathML) {
  let node;
  const create = () => {
    if (isHydrating())
      throw new Error("Failed attempt to create new DOM elements during hydration. Check that the libraries you are using support hydration.");
    const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
    t.innerHTML = html;
    return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
  };
  const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document2 = window.document) {
  const e = document2[$$EVENTS] || (document2[$$EVENTS] = new Set);
  for (let i = 0, l = eventNames.length;i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document2.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  if (isHydrating(node))
    return;
  if (value == null)
    node.removeAttribute(name);
  else
    node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (isHydrating(node))
    return;
  if (value == null)
    node.removeAttributeNS(namespace, name);
  else
    node.setAttributeNS(namespace, name, value);
}
function setBoolAttribute(node, name, value) {
  if (isHydrating(node))
    return;
  value ? node.setAttribute(name, "") : node.removeAttribute(name);
}
function className(node, value) {
  if (isHydrating(node))
    return;
  if (value == null)
    node.removeAttribute("class");
  else
    node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else
      node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = (e) => handlerFn.call(node, handler[1], e));
  } else
    node.addEventListener(name, handler, typeof handler !== "function" && handler);
}
function classList(node, value, prev = {}) {
  const classKeys = Object.keys(value || {}), prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length;i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key])
      continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length;i < len; i++) {
    const key = classKeys[i], classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue)
      continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}
function style(node, value, prev) {
  if (!value)
    return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string")
    return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = undefined);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function setStyleProperty(node, name, value) {
  value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
}
function spread(node, props = {}, isSVG, skipChildren) {
  const prevProps = {};
  if (!skipChildren) {
    createRenderEffect(() => prevProps.children = insertExpression(node, props.children, prevProps.children));
  }
  createRenderEffect(() => typeof props.ref === "function" && use(props.ref, node));
  createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
  return prevProps;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== undefined && !initial)
    initial = [];
  if (typeof accessor !== "function")
    return insertExpression(parent, accessor, initial, marker);
  createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
}
function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children")
        continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef, props);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren)
        insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef, props);
  }
}
function getNextElement(template) {
  let node, key, hydrating = isHydrating();
  if (!hydrating || !(node = sharedConfig.registry.get(key = getHydrationKey()))) {
    if (hydrating) {
      sharedConfig.done = true;
      throw new Error(`Hydration Mismatch. Unable to find DOM nodes for hydration key: ${key}
${template ? template().outerHTML : ""}`);
    }
    return template();
  }
  if (sharedConfig.completed)
    sharedConfig.completed.add(node);
  sharedConfig.registry.delete(key);
  return node;
}
function isHydrating(node) {
  return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length;i < nameLen; i++)
    node.classList.toggle(classNames[i], value);
}
function assignProp(node, prop, value, prev, isSVG, skipRef, props) {
  let isCE, isProp, isChildProp, propAlias, forceProp;
  if (prop === "style")
    return style(node, value, prev);
  if (prop === "classList")
    return classList(node, value, prev);
  if (value === prev)
    return prev;
  if (prop === "ref") {
    if (!skipRef)
      value(node);
  } else if (prop.slice(0, 3) === "on:") {
    const e = prop.slice(3);
    prev && node.removeEventListener(e, prev, typeof prev !== "function" && prev);
    value && node.addEventListener(e, value, typeof value !== "function" && value);
  } else if (prop.slice(0, 10) === "oncapture:") {
    const e = prop.slice(10);
    prev && node.removeEventListener(e, prev, true);
    value && node.addEventListener(e, value, true);
  } else if (prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEventListener(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if (prop.slice(0, 5) === "attr:") {
    setAttribute(node, prop.slice(5), value);
  } else if (prop.slice(0, 5) === "bool:") {
    setBoolAttribute(node, prop.slice(5), value);
  } else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-") || ("is" in props))) {
    if (forceProp) {
      prop = prop.slice(5);
      isProp = true;
    } else if (isHydrating(node))
      return value;
    if (prop === "class" || prop === "className")
      className(node, value);
    else if (isCE && !isProp && !isChildProp)
      node[toPropertyName(prop)] = value;
    else if ((prop === "value" || prop === "defaultValue") && (node.nodeName === "INPUT" || node.nodeName === "TEXTAREA"))
      node[propAlias || prop] = value ?? "";
    else
      node[propAlias || prop] = value;
  } else {
    const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
    if (ns)
      setAttributeNS(node, ns, prop, value);
    else
      setAttribute(node, Aliases[prop] || prop, value);
  }
  return value;
}
function eventHandler(e) {
  if (sharedConfig.registry && sharedConfig.events) {
    if (sharedConfig.events.find(([el, ev]) => ev === e))
      return;
  }
  let node = e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const oriCurrentTarget = e.currentTarget;
  const retarget = (value) => Object.defineProperty(e, "target", {
    configurable: true,
    value
  });
  const handleNode = () => {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble)
        return;
    }
    node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (handleNode() && (node = node._$host || node.parentNode || node.host))
      ;
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (sharedConfig.registry && !sharedConfig.done)
    sharedConfig.done = _$HY.done = true;
  try {
    if (e.composedPath) {
      const path = e.composedPath();
      retarget(path[0]);
      for (let i = 0;i < path.length - 2; i++) {
        node = path[i];
        if (!handleNode())
          break;
        if (node._$host) {
          node = node._$host;
          walkUpTree();
          break;
        }
        if (node.parentNode === oriCurrentTarget) {
          break;
        }
      }
    } else
      walkUpTree();
    retarget(oriTarget);
  } finally {
    e = node = null;
  }
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  const hydrating = isHydrating(parent);
  if (hydrating) {
    !current && (current = [...parent.childNodes]);
    let cleaned = [];
    for (let i = 0;i < current.length; i++) {
      const node = current[i];
      if (node.nodeType === 8 && node.data.slice(0, 2) === "!$")
        node.remove();
      else
        cleaned.push(node);
    }
    current = cleaned;
  }
  while (typeof current === "function")
    current = current();
  if (value === current)
    return current;
  const t = typeof value, multi = marker !== undefined;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (hydrating)
      return current;
    if (t === "number") {
      value = value.toString();
      if (value === current)
        return current;
    }
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else
        node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else
        current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (hydrating)
      return current;
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function")
        v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (hydrating) {
      if (!array.length)
        return current;
      if (marker === undefined)
        return current = [...parent.childNodes];
      let node = array[0];
      if (node.parentNode !== parent)
        return current;
      const nodes = [node];
      while ((node = node.nextSibling) !== marker)
        nodes.push(node);
      return current = nodes;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi)
        return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else
        reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (hydrating && value.parentNode)
      return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi)
        return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else
      parent.replaceChild(value, parent.firstChild);
    current = value;
  } else
    console.warn(`Unrecognized value. Skipped inserting`, value);
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length;i < len; i++) {
    let item = array[i], prev = current && current[normalized.length], t;
    if (item == null || item === true || item === false)
      ;
    else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function")
          item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value)
        normalized.push(prev);
      else
        normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length;i < len; i++)
    parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined)
    return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1;i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i)
          isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else
          isParent && el.remove();
      } else
        inserted = true;
    }
  } else
    parent.insertBefore(node, marker);
  return [node];
}
function getHydrationKey() {
  return sharedConfig.getNextContextId();
}
var RequestContext = Symbol();
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function createElement(tagName, isSVG = false, is = undefined) {
  return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName, {
    is
  });
}
function createDynamic(component, props) {
  const cached = createMemo(component);
  return createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case "function":
        Object.assign(component, {
          [$DEVCOMP]: true
        });
        return untrack(() => component(props));
      case "string":
        const isSvg = SVGElements.has(component);
        const el = sharedConfig.context ? getNextElement() : createElement(component, isSvg, untrack(() => props.is));
        spread(el, props, isSvg);
        return el;
    }
  });
}
function Dynamic(props) {
  const [, others] = splitProps(props, ["component"]);
  return createDynamic(() => props.component, others);
}

// ../../frontend/web/packages/ui/src/viewModels/WebViewModel.ts
class WebViewModel {
  id = "";
  classes = [];
  isEnabled = true;
  isVisible = true;
}
// ../../frontend/web/packages/ui/src/viewModels/ButtonViewModel.ts
class ButtonViewModel extends WebViewModel {
  _command;
  text = "";
  variant = "secondary";
  icon = undefined;
  constructor(_command, init = {}) {
    super();
    this._command = _command;
    if (init.text !== undefined)
      this.text = init.text;
    if (init.variant !== undefined)
      this.variant = init.variant;
    if (init.icon !== undefined)
      this.icon = init.icon;
  }
  async execute() {
    if (!this.isEnabled)
      return;
    await this._command();
  }
}
// ../../frontend/web/packages/ui/src/viewModels/DropdownFieldViewModel.ts
class DropdownFieldViewModel extends WebViewModel {
  _onChange;
  key = "";
  labelText = "";
  options = [];
  value = "";
  constructor(init = {}, _onChange) {
    super();
    this._onChange = _onChange;
    Object.assign(this, init);
  }
  setValue(value) {
    if (!this.options.includes(value))
      throw new Error(`"${value}" is not one of the options of "${this.key}" (${this.options.join(", ")}).`);
    this.value = value;
    this._onChange?.(value);
  }
}
// ../../frontend/web/packages/ui/src/viewModels/DynamicFormRowViewModel.ts
class DynamicFormRowViewModel {
  id;
  labelText;
  fields;
  constructor(id, labelText, fields) {
    this.id = id;
    this.labelText = labelText;
    this.fields = fields;
  }
}
// ../../shared/typescript/packages/core/src/data/DataDiffApi.ts
class DataDiffApi {
  static clone(data) {
    return structuredClone(data);
  }
  static diff(before, current) {
    return DataDiffApi.diffRecords(before, current, "data");
  }
  static patch(base, delta) {
    const result = DataDiffApi.clone(base);
    for (const [key, value] of Object.entries(delta)) {
      DataDiffApi.refuseProtoKey(key, "delta");
      const existing = result[key];
      result[key] = DataDiffApi.isRecord(existing) && DataDiffApi.isRecord(value) ? DataDiffApi.patch(existing, value) : DataDiffApi.clone(value);
    }
    return result;
  }
  static diffRecords(before, current, where) {
    for (const key of Object.keys(before)) {
      if (!Object.hasOwn(current, key))
        throw new Error(`${where}.${key}: the key is gone, a delta cannot say that (keep the shape of the data).`);
    }
    const delta = {};
    for (const [key, now] of Object.entries(current)) {
      DataDiffApi.refuseProtoKey(key, where);
      if (!Object.hasOwn(before, key)) {
        delta[key] = DataDiffApi.clone(now);
        continue;
      }
      const was = before[key];
      if (DataDiffApi.isRecord(was) && DataDiffApi.isRecord(now)) {
        const inner = DataDiffApi.diffRecords(was, now, `${where}.${key}`);
        if (Object.keys(inner).length > 0)
          delta[key] = inner;
      } else if (!DataDiffApi.equal(was, now)) {
        delta[key] = DataDiffApi.clone(now);
      }
    }
    return delta;
  }
  static equal(a, b) {
    if (a === b)
      return true;
    if (Array.isArray(a) && Array.isArray(b))
      return a.length === b.length && a.every((item, index) => DataDiffApi.equal(item, b[index]));
    if (DataDiffApi.isRecord(a) && DataDiffApi.isRecord(b)) {
      const keys = Object.keys(a);
      return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && DataDiffApi.equal(a[key], b[key]));
    }
    return false;
  }
  static isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  static refuseProtoKey(key, where) {
    if (key === "__proto__")
      throw new Error(`${where}: the key "__proto__" is not allowed.`);
  }
}
// ../../shared/typescript/packages/forms/src/DynamicFormModelApi.ts
var ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;

class DynamicFormModelApi {
  static validate(input) {
    const form = DynamicFormModelApi.record(input, "form");
    DynamicFormModelApi.text(form.title, "form.title");
    const fields = DynamicFormModelApi.list(form.fields, "form.fields");
    const ids = new Set;
    fields.forEach((field, index) => DynamicFormModelApi.validateField(field, `form.fields[${index}]`, ids, true));
    return input;
  }
  static initialValues(model) {
    const values = {};
    for (const field of model.fields) {
      if (field.kind === "rows") {
        const rows = {};
        for (const row of field.rows)
          rows[row.id] = DynamicFormModelApi.leafValues(row.fields);
        values[field.id] = rows;
      } else {
        values[field.id] = DynamicFormModelApi.leafValue(field);
      }
    }
    return values;
  }
  static check(model, delta) {
    const entries = DynamicFormModelApi.record(delta, "delta");
    const fields = new Map(model.fields.map((field) => [field.id, field]));
    for (const [id, value] of Object.entries(entries)) {
      const field = fields.get(id);
      if (field === undefined)
        throw new Error(`delta.${id}: the form has no field "${id}" (fields: ${[...fields.keys()].join(", ")}).`);
      if (field.kind !== "rows") {
        DynamicFormModelApi.checkLeaf(field, value, `delta.${id}`);
        continue;
      }
      const rows = new Map(field.rows.map((row) => [row.id, row]));
      for (const [rowId, rowValue] of Object.entries(DynamicFormModelApi.record(value, `delta.${id}`))) {
        const row = rows.get(rowId);
        if (row === undefined)
          throw new Error(`delta.${id}.${rowId}: the field "${id}" has no row "${rowId}".`);
        const leaves = new Map(row.fields.map((leaf) => [leaf.id, leaf]));
        for (const [leafId, leafValue] of Object.entries(DynamicFormModelApi.record(rowValue, `delta.${id}.${rowId}`))) {
          const leaf = leaves.get(leafId);
          if (leaf === undefined)
            throw new Error(`delta.${id}.${rowId}.${leafId}: the row "${rowId}" has no field "${leafId}".`);
          DynamicFormModelApi.checkLeaf(leaf, leafValue, `delta.${id}.${rowId}.${leafId}`);
        }
      }
    }
  }
  static apply(model, delta) {
    DynamicFormModelApi.check(model, delta);
    return DataDiffApi.patch(DynamicFormModelApi.initialValues(model), delta);
  }
  static leafValue(field) {
    if (field.kind === "dropdown")
      return field.value ?? field.options[0] ?? "";
    if (field.kind === "switch")
      return field.value ?? false;
    return field.value ?? "";
  }
  static leafValues(fields) {
    const values = {};
    for (const field of fields)
      values[field.id] = DynamicFormModelApi.leafValue(field);
    return values;
  }
  static checkLeaf(field, value, where) {
    if (field.kind === "switch") {
      if (typeof value !== "boolean")
        throw new Error(`${where}: the switch "${field.id}" takes true or false, got ${DynamicFormModelApi.describe(value)}.`);
      return;
    }
    if (typeof value !== "string")
      throw new Error(`${where}: the ${field.kind} "${field.id}" takes a text, got ${DynamicFormModelApi.describe(value)}.`);
    if (field.kind === "dropdown" && !field.options.includes(value))
      throw new Error(`${where}: "${value}" is not one of the options of "${field.id}" (${field.options.join(", ")}).`);
    if (field.kind === "text" && field.maxLength !== undefined && value.length > field.maxLength)
      throw new Error(`${where}: the text is ${value.length} characters long, the field "${field.id}" takes at most ${field.maxLength}.`);
  }
  static validateField(input, where, ids, allowRows) {
    const field = DynamicFormModelApi.record(input, where);
    const id = DynamicFormModelApi.id(field.id, `${where}.id`);
    if (ids.has(id))
      throw new Error(`${where}.id: "${id}" is used twice among its siblings.`);
    ids.add(id);
    DynamicFormModelApi.text(field.label, `${where}.label`);
    const kind = field.kind;
    if (kind === "dropdown") {
      const options = DynamicFormModelApi.list(field.options, `${where}.options`);
      if (options.length === 0)
        throw new Error(`${where}.options: a dropdown needs at least one option.`);
      options.forEach((option, index) => DynamicFormModelApi.text(option, `${where}.options[${index}]`));
      if (new Set(options).size !== options.length)
        throw new Error(`${where}.options: the options must all be different (${options.join(", ")}).`);
      if (field.value !== undefined && !options.includes(field.value))
        throw new Error(`${where}.value: ${DynamicFormModelApi.describe(field.value)} is not one of the options (${options.join(", ")}).`);
    } else if (kind === "switch") {
      if (field.value !== undefined && typeof field.value !== "boolean")
        throw new Error(`${where}.value: a switch takes true or false, got ${DynamicFormModelApi.describe(field.value)}.`);
    } else if (kind === "text") {
      const max = field.maxLength;
      if (max !== undefined && (typeof max !== "number" || !Number.isInteger(max) || max < 1))
        throw new Error(`${where}.maxLength: expected a whole number of at least 1, got ${DynamicFormModelApi.describe(max)}.`);
      if (field.value !== undefined && typeof field.value !== "string")
        throw new Error(`${where}.value: a text field takes a text, got ${DynamicFormModelApi.describe(field.value)}.`);
      if (typeof field.value === "string" && typeof max === "number" && field.value.length > max)
        throw new Error(`${where}.value: the prefilled text is longer than maxLength ${max}.`);
    } else if (kind === "rows") {
      if (!allowRows)
        throw new Error(`${where}.kind: rows cannot be inside a row.`);
      const rowIds = new Set;
      DynamicFormModelApi.list(field.rows, `${where}.rows`).forEach((rowInput, index) => {
        const rowWhere = `${where}.rows[${index}]`;
        const row = DynamicFormModelApi.record(rowInput, rowWhere);
        const rowId = DynamicFormModelApi.id(row.id, `${rowWhere}.id`);
        if (rowIds.has(rowId))
          throw new Error(`${rowWhere}.id: "${rowId}" is used twice among the rows.`);
        rowIds.add(rowId);
        DynamicFormModelApi.text(row.label, `${rowWhere}.label`);
        const leafIds = new Set;
        DynamicFormModelApi.list(row.fields, `${rowWhere}.fields`).forEach((leaf, leafIndex) => DynamicFormModelApi.validateField(leaf, `${rowWhere}.fields[${leafIndex}]`, leafIds, false));
      });
    } else {
      throw new Error(`${where}.kind: expected dropdown, switch, text or rows, got ${DynamicFormModelApi.describe(kind)}.`);
    }
  }
  static record(value, where) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new Error(`${where}: expected an object, got ${DynamicFormModelApi.describe(value)}.`);
    return value;
  }
  static list(value, where) {
    if (!Array.isArray(value))
      throw new Error(`${where}: expected a list, got ${DynamicFormModelApi.describe(value)}.`);
    return value;
  }
  static text(value, where) {
    if (typeof value !== "string")
      throw new Error(`${where}: expected a text, got ${DynamicFormModelApi.describe(value)}.`);
    return value;
  }
  static id(value, where) {
    const text = DynamicFormModelApi.text(value, where);
    if (!ID.test(text))
      throw new Error(`${where}: "${text}" is no id (letters, digits and _ . : - only, starting with a letter or a digit).`);
    return text;
  }
  static describe(value) {
    return value === undefined ? "nothing" : JSON.stringify(value)?.slice(0, 60) ?? String(value);
  }
}
// ../../frontend/web/packages/ui/src/viewModels/SwitchFieldViewModel.ts
class SwitchFieldViewModel extends WebViewModel {
  _onChange;
  key = "";
  labelText = "";
  value = false;
  constructor(init = {}, _onChange) {
    super();
    this._onChange = _onChange;
    Object.assign(this, init);
  }
  setValue(value) {
    this.value = value;
    this._onChange?.(value);
  }
}

// ../../frontend/web/packages/ui/src/viewModels/TextFieldViewModel.ts
class TextFieldViewModel extends WebViewModel {
  _onChange;
  key = "";
  label = "";
  value = "";
  placeholder = "";
  isMultiline = false;
  isRequired = false;
  constructor(init = {}, _onChange) {
    super();
    this._onChange = _onChange;
    Object.assign(this, init);
  }
  setValue(value) {
    this.value = value;
    this._onChange?.(value);
  }
}

// ../../frontend/web/packages/ui/src/viewModels/DynamicFormViewModel.ts
class DynamicFormViewModel extends WebViewModel {
  _source;
  _target;
  state = "idle";
  titleText = "";
  errorText = "";
  describeError = (error) => error instanceof Error ? error.message : String(error);
  items = [];
  loadingText;
  submit;
  cancel;
  _snapshot = {};
  _isSubmitting = false;
  constructor(_source, _target, texts) {
    super();
    this._source = _source;
    this._target = _target;
    this.loadingText = texts.loadingText;
    this.submit = new ButtonViewModel(() => this._submit(), { text: texts.submitText, variant: "primary" });
    this.cancel = new ButtonViewModel(() => this._target.cancel(), { text: texts.cancelText });
    this.submit.isEnabled = false;
  }
  onRenderAsync() {
    return this.load();
  }
  async load() {
    this.state = "loading";
    this.errorText = "";
    try {
      this._build(DynamicFormModelApi.validate(await this._source.load()));
      this.state = "ready";
    } catch (error) {
      this.items = [];
      this.titleText = "";
      this.state = "failed";
      this.errorText = this.describeError(error);
    }
  }
  currentValues() {
    const values = {};
    for (const item of this.items) {
      if (item.kind === "field")
        values[item.field.key] = item.field.value;
      else
        values[item.id] = Object.fromEntries(item.rows.map((row) => [row.id, Object.fromEntries(row.fields.map((field) => [field.key, field.value]))]));
    }
    return values;
  }
  get hasChanges() {
    return Object.keys(DataDiffApi.diff(this._snapshot, this.currentValues())).length > 0;
  }
  _build(model) {
    const initial = DynamicFormModelApi.initialValues(model);
    this._snapshot = DataDiffApi.clone(initial);
    this.titleText = model.title;
    this.items = model.fields.map((field) => {
      if (field.kind !== "rows")
        return { kind: "field", field: this._leaf(field, initial[field.id]) };
      const rowValues = initial[field.id];
      const rows = field.rows.map((row) => {
        const values = rowValues[row.id];
        return new DynamicFormRowViewModel(row.id, row.label, row.fields.map((leaf) => this._leaf(leaf, values[leaf.id])));
      });
      return { kind: "rows", id: field.id, labelText: field.label, rows };
    });
    this._refresh();
  }
  _leaf(field, value) {
    const changed = () => this._refresh();
    if (field.kind === "dropdown")
      return new DropdownFieldViewModel({ key: field.id, labelText: field.label, options: field.options, value }, changed);
    if (field.kind === "switch")
      return new SwitchFieldViewModel({ key: field.id, labelText: field.label, value }, changed);
    return new TextFieldViewModel({ key: field.id, label: field.label, value }, changed);
  }
  _refresh() {
    this.submit.isEnabled = this.state !== "sent" && !this._isSubmitting && this.hasChanges;
    this.errorText = "";
  }
  async _submit() {
    if (this.state !== "ready" || this._isSubmitting)
      return;
    const delta = DataDiffApi.diff(this._snapshot, this.currentValues());
    this._isSubmitting = true;
    this.submit.isEnabled = false;
    try {
      await this._target.submit(delta);
      this.state = "sent";
    } catch (error) {
      this._isSubmitting = false;
      this._refresh();
      this.errorText = this.describeError(error);
      return;
    }
    this._isSubmitting = false;
  }
}
// ../../frontend/web/packages/ui/src/viewModels/dropIndex.ts
function dropIndexAt(extents, pointerY, from) {
  if (extents.length === 0)
    return 0;
  let slot = extents.length;
  for (let index = 0;index < extents.length; index++) {
    const row = extents[index];
    if (pointerY < (row.top + row.bottom) / 2) {
      slot = index;
      break;
    }
  }
  return slot > from ? slot - 1 : slot;
}
// ../../frontend/web/packages/mvvm/src/disposable.ts
class DisposableContainer {
  items = [];
  add(item) {
    this.items.push(item);
    return item;
  }
  dispose() {
    const items = this.items;
    this.items = [];
    for (let index = items.length - 1;index >= 0; index--)
      items[index].dispose();
  }
  [Symbol.dispose]() {
    this.dispose();
  }
}
function toDisposable(dispose) {
  return { dispose, [Symbol.dispose]: dispose };
}
// ../../frontend/web/packages/mvvm/src/diagnostics.ts
class Message {
  type;
  constructor(type) {
    this.type = type;
  }
}

class BindingCreatedMessage extends Message {
  expression;
  constructor(expression) {
    super("BindingCreatedMessage");
    this.expression = expression;
  }
}

class ObjectObservedMessage extends Message {
  path;
  constructor(path) {
    super("ObjectObservedMessage");
    this.path = path;
  }
}

class PropertyObservedMessage extends Message {
  path;
  instrumented;
  constructor(path, instrumented) {
    super("PropertyObservedMessage");
    this.path = path;
    this.instrumented = instrumented;
  }
}

class NotifiedMessage extends Message {
  path;
  constructor(path) {
    super("NotifiedMessage");
    this.path = path;
  }
}

class ReEvaluationTriggeredMessage extends Message {
  path;
  constructor(path) {
    super("ReEvaluationTriggeredMessage");
    this.path = path;
  }
}

class EvaluationCompletedMessage extends Message {
  result;
  constructor(result) {
    super("EvaluationCompletedMessage");
    this.result = result;
  }
}

class DetachedMessage extends Message {
  constructor() {
    super("DetachedMessage");
  }
}

class DebugMessageHook {
  static raise;
  static bind(handler) {
    const previous = DebugMessageHook.raise;
    DebugMessageHook.raise = handler;
    return toDisposable(() => {
      DebugMessageHook.raise = previous;
    });
  }
}
// ../../frontend/web/packages/mvvm/src/property-mutation-observation-strategy.ts
class ListenerList {
  listeners = [];
  add(listener) {
    if (!this.listeners.includes(listener))
      this.listeners.push(listener);
  }
  remove(listener) {
    const index = this.listeners.indexOf(listener);
    if (index >= 0)
      this.listeners.splice(index, 1);
  }
  notify(change) {
    const { listeners } = this;
    if (listeners.length === 0)
      return;
    DebugMessageHook.raise?.(new NotifiedMessage(change.key === undefined ? "[target]" : String(change.key)));
    if (listeners.length === 1) {
      listeners[0](change);
      return;
    }
    let failure;
    for (const listener of listeners.slice()) {
      try {
        listener(change);
      } catch (error) {
        failure ??= { error };
      }
    }
    if (failure)
      throw failure.error;
  }
}

class PropertyCell extends ListenerList {
  target;
  key;
  value;
  installedSetter;
  isInstalled() {
    return Object.getOwnPropertyDescriptor(this.target, this.key)?.set === this.installedSetter;
  }
  constructor(target, key) {
    super();
    this.target = target;
    this.key = key;
  }
  write(next) {
    if (Object.is(this.value, next))
      return;
    this.value = next;
    this.notify({ target: this.target, key: this.key });
  }
}
var ARRAY_MUTATORS = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
var cells = new WeakMap;
var arrayListeners = new WeakMap;
var resolveTarget = (value) => value;
function setTargetResolver(resolver) {
  resolveTarget = resolver;
}
function notifyArray(array) {
  arrayListeners.get(array)?.notify({ target: array });
}
var ObservedArrayPrototype = Object.create(Array.prototype);
for (const name of ARRAY_MUTATORS) {
  const native = Array.prototype[name];
  Object.defineProperty(ObservedArrayPrototype, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value(...args) {
      const result = native.apply(this, args);
      notifyArray(resolveTarget(this));
      return result;
    }
  });
}
function instrumentArray(array) {
  let listeners = arrayListeners.get(array);
  if (listeners)
    return listeners;
  if (!Object.isExtensible(array))
    return;
  if (Object.getPrototypeOf(array) === Array.prototype) {
    Object.setPrototypeOf(array, ObservedArrayPrototype);
  } else {
    for (const name of ARRAY_MUTATORS) {
      const inherited = array[name];
      Object.defineProperty(array, name, {
        configurable: true,
        enumerable: false,
        writable: true,
        value(...args) {
          const result = inherited.apply(this, args);
          notifyArray(array);
          return result;
        }
      });
    }
  }
  arrayListeners.set(array, listeners = new ListenerList);
  return listeners;
}
function findDescriptor(target, key) {
  const own = Object.getOwnPropertyDescriptor(target, key);
  if (own)
    return { descriptor: own, own: true };
  for (let proto = Object.getPrototypeOf(target);proto; proto = Object.getPrototypeOf(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (descriptor)
      return { descriptor, own: false };
  }
  return;
}
function cellOf(target, key, verify) {
  let byKey = cells.get(target);
  const known = byKey?.get(key);
  if (known !== undefined && (!verify || known === null || known.isInstalled()))
    return known;
  const cell = instrumentProperty(target, key);
  if (!byKey)
    cells.set(target, byKey = new Map);
  byKey.set(key, cell);
  return cell;
}
function instrumentProperty(target, key) {
  if (!Object.isExtensible(target))
    return null;
  const found = findDescriptor(target, key);
  if (found && !found.own)
    return null;
  const cell = new PropertyCell(target, key);
  const get = () => cell.value;
  const write = (next) => cell.write(next);
  if (!found) {
    const placeholderSet = (next) => {
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get, set: write });
      cell.installedSetter = write;
      cell.write(next);
    };
    Object.defineProperty(target, key, { configurable: true, enumerable: false, get, set: placeholderSet });
    cell.installedSetter = placeholderSet;
    return cell;
  }
  const { descriptor } = found;
  if (!descriptor.configurable)
    return null;
  if ("value" in descriptor) {
    if (!descriptor.writable)
      return null;
    cell.value = descriptor.value;
    Object.defineProperty(target, key, { configurable: true, enumerable: descriptor.enumerable ?? true, get, set: write });
    cell.installedSetter = write;
    return cell;
  }
  const { get: originalGet, set: originalSet } = descriptor;
  if (!originalSet)
    return null;
  const wrappedSet = function(next) {
    originalSet.call(this, next);
    cell.notify({ target, key });
  };
  Object.defineProperty(target, key, { configurable: true, enumerable: descriptor.enumerable ?? true, ...originalGet ? { get: originalGet } : {}, set: wrappedSet });
  cell.installedSetter = wrappedSet;
  return cell;
}
class PropertyMutationObservationStrategy {
  signal;
  arrays = new Map;
  properties = new Map;
  generation = 0;
  depth = 0;
  listener;
  constructor(signal) {
    this.signal = signal;
    this.listener = (change) => this.signal(change);
  }
  get propertyRegistrationCount() {
    return this.properties.size;
  }
  attach(target, _path) {
    if (!Array.isArray(target))
      return;
    if (!this.arrays.has(target)) {
      const listeners = instrumentArray(target);
      if (!listeners)
        return;
      listeners.add(this.listener);
    }
    this.arrays.set(target, this.generation);
  }
  attachProperty(target, key, targetPath) {
    const cached = cells.get(target)?.get(key);
    if (cached && this.properties.has(cached)) {
      this.properties.set(cached, this.generation);
      return;
    }
    const cell = cellOf(target, key, true);
    if (DebugMessageHook.raise)
      DebugMessageHook.raise(new PropertyObservedMessage(`${targetPath ?? "?"}.${String(key)}`, cell !== null));
    if (!cell)
      return;
    cell.add(this.listener);
    this.properties.set(cell, this.generation);
  }
  beginEvaluation() {
    if (this.depth++ === 0)
      this.generation++;
  }
  endEvaluation() {
    if (--this.depth > 0)
      return;
    const current = this.generation;
    for (const [array, seen] of this.arrays) {
      if (seen === current)
        continue;
      arrayListeners.get(array)?.remove(this.listener);
      this.arrays.delete(array);
    }
    for (const [cell, seen] of this.properties) {
      if (seen === current)
        continue;
      cell.remove(this.listener);
      this.properties.delete(cell);
    }
  }
  detach() {
    for (const array of this.arrays.keys())
      arrayListeners.get(array)?.remove(this.listener);
    for (const cell of this.properties.keys())
      cell.remove(this.listener);
    this.arrays.clear();
    this.properties.clear();
    DebugMessageHook.raise?.(new DetachedMessage);
  }
}

// ../../frontend/web/packages/mvvm/src/expression-observer.ts
var evaluationDepth = 0;
var proxyTargets = new WeakMap;
var isObjectLike = (value) => typeof value === "object" && value !== null || typeof value === "function";
function unwrapObserved(value) {
  return isObjectLike(value) ? proxyTargets.get(value) ?? value : value;
}
setTargetResolver(unwrapObserved);
function needsRawReceiver(target) {
  return target instanceof Map || target instanceof Set || target instanceof WeakMap || target instanceof WeakSet || target instanceof Date || target instanceof RegExp || target instanceof Promise || target instanceof ArrayBuffer || ArrayBuffer.isView(target) || typeof EventTarget !== "undefined" && target instanceof EventTarget;
}
var isArrayIndexOrLength = (key) => key === "length" || key.length > 0 && key.length < 16 && key.charCodeAt(0) >= 48 && key.charCodeAt(0) <= 57 && String(Number(key)) === key;

class ExpressionObserver {
  strategy;
  proxies = new WeakMap;
  handler;
  root;
  rootTarget;
  evaluating = 0;
  constructor(strategy, rootTarget) {
    this.strategy = strategy;
    this.handler = new ObserverHandler(this);
    this.rootTarget = unwrapObserved(rootTarget);
    this.root = this.observeValue(this.rootTarget);
  }
  getObservedSource() {
    return this.root;
  }
  dispose() {
    this.strategy.detach();
  }
  evaluate(query) {
    this.evaluating++;
    evaluationDepth++;
    this.strategy.beginEvaluation?.();
    try {
      if (isObjectLike(this.rootTarget))
        this.strategy.attach(this.rootTarget);
      const result = unwrapResult(query(this.root), this.created);
      DebugMessageHook.raise?.(new EvaluationCompletedMessage(result));
      return result;
    } finally {
      this.strategy.endEvaluation?.();
      evaluationDepth--;
      if (--this.evaluating === 0)
        this.created.clear();
    }
  }
  created = new Set;
  observeCallResult(result) {
    if (this.evaluating > 0 && isObjectLike(result) && !proxyTargets.has(result) && !this.proxies.has(result))
      this.created.add(result);
    return this.observeValue(result);
  }
  observeValue(value, parent, key) {
    if (!isObjectLike(value))
      return value;
    const target = unwrapObserved(value);
    if (this.evaluating > 0 && typeof target !== "function") {
      this.strategy.attach(target);
      if (DebugMessageHook.raise)
        DebugMessageHook.raise(new ObjectObservedMessage(parent === undefined ? "$" : `?.${String(key)}`));
    }
    let proxy = this.proxies.get(target);
    if (!proxy) {
      proxy = new Proxy(target, this.handler);
      this.proxies.set(target, proxy);
      proxyTargets.set(proxy, target);
    }
    return proxy;
  }
}

class ObserverHandler {
  observer;
  constructor(observer) {
    this.observer = observer;
  }
  get(target, key, receiver) {
    if (typeof key === "symbol")
      return Reflect.get(target, key, receiver);
    const observer = this.observer;
    if (observer.evaluating > 0 && !(Array.isArray(target) && isArrayIndexOrLength(key)))
      observer.strategy.attachProperty(target, key);
    const value = Reflect.get(target, key, receiver);
    if (!isObjectLike(value) || key === "constructor")
      return value;
    if (typeof target === "function" || !Object.isExtensible(target)) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      if (descriptor && !descriptor.configurable && descriptor.writable === false)
        return value;
    }
    return observer.observeValue(value, target, key);
  }
  set(target, key, value) {
    return Reflect.set(target, key, unwrapObserved(value), target);
  }
  apply(target, thisArg, args) {
    const thisTarget = unwrapObserved(thisArg);
    const raw = isObjectLike(thisTarget) && needsRawReceiver(thisTarget);
    const result = Reflect.apply(target, raw ? thisTarget : thisArg, raw ? args.map(unwrapObserved) : args);
    return this.observer.observeCallResult(result);
  }
  construct(target, args) {
    return this.observer.observeCallResult(Reflect.construct(target, args.map(unwrapObserved)));
  }
}
function unwrapResult(value, created, depth = 0) {
  if (!isObjectLike(value))
    return value;
  const target = proxyTargets.get(value);
  if (target && !created.has(target))
    return target;
  const container = target ?? value;
  if (depth > 4 || typeof container === "function" || !Object.isExtensible(container))
    return container;
  if (Array.isArray(container)) {
    for (let index = 0;index < container.length; index++) {
      const member = container[index];
      if (isObjectLike(member))
        container[index] = unwrapResult(member, created, depth + 1);
    }
    return container;
  }
  const proto = Object.getPrototypeOf(container);
  if (proto !== Object.prototype && proto !== null)
    return container;
  for (const key of Object.keys(container)) {
    const member = container[key];
    if (isObjectLike(member))
      container[key] = unwrapResult(member, created, depth + 1);
  }
  return container;
}

class ValueContainer {
  source;
  expression;
  signal;
  triggerSignalOnValueChangeOnly;
  value;
  hadChange = false;
  changeCount = 0;
  constructor(source, expression, signal, triggerSignalOnValueChangeOnly, value) {
    this.source = source;
    this.expression = expression;
    this.signal = signal;
    this.triggerSignalOnValueChangeOnly = triggerSignalOnValueChangeOnly;
    this.value = value;
  }
  onChange(sourceOfChange) {
    this.hadChange = true;
    this.changeCount++;
    DebugMessageHook.raise?.(new ReEvaluationTriggeredMessage(sourceOfChange?.path ?? (sourceOfChange?.key === undefined ? "?" : String(sourceOfChange.key))));
    const newValue = this.expression(this.source);
    if (!this.triggerSignalOnValueChangeOnly || this.value != newValue) {
      this.value = newValue;
      this.signal(newValue, sourceOfChange);
    }
  }
}

class ReactiveBinding {
  observerDisposable;
  observedSource;
  valueContainer;
  onRefresh;
  constructor(observerDisposable, observedSource, valueContainer, onRefresh) {
    this.observerDisposable = observerDisposable;
    this.observedSource = observedSource;
    this.valueContainer = valueContainer;
    this.onRefresh = onRefresh;
  }
  refresh() {
    this.onRefresh?.();
    this.valueContainer.value = this.valueContainer.expression(this.observedSource);
  }
  touch() {
    this.onRefresh?.();
  }
  dispose() {
    this.observerDisposable.dispose();
  }
  [Symbol.dispose]() {
    this.dispose();
  }
}
function observeExpression(source, expression, signal, onRefresh, triggerOnInit = false, triggerSignalOnFinalValueChangeOnly = true, _useObservedExpressionResult = false) {
  let observer;
  const trackedExpression = (_) => {
    if (!observer)
      throw new Error("ExpressionObserver is not initialized.");
    return observer.evaluate(expression);
  };
  const valueContainer = new ValueContainer(source, trackedExpression, signal, triggerSignalOnFinalValueChangeOnly);
  DebugMessageHook.raise?.(new BindingCreatedMessage(expression.toString()));
  observer = new ExpressionObserver(new PropertyMutationObservationStrategy((change) => valueContainer.onChange(change)), source);
  valueContainer.value = trackedExpression(source);
  if (evaluationDepth > 0 && isObjectLike(source) && proxyTargets.has(source))
    expression(source);
  const binding = new ReactiveBinding({ dispose: () => observer?.dispose() }, observer.getObservedSource(), valueContainer, onRefresh);
  if (triggerOnInit)
    signal(valueContainer.value, undefined, true);
  return binding;
}
// ../../frontend/web/packages/mvvm/src/jsx-mvvm.ts
function jsx(jsxFramework, render) {
  return new JsxMvvmApi(jsxFramework, render);
}

class JsxMvvmApi {
  framework;
  render;
  constructor(framework, render) {
    this.framework = framework;
    this.render = render;
  }
  renderMvvmView(view, viewModel, parent) {
    this.render(() => view({ model: viewModel }), parent);
  }
  createMvvmView(viewFactory) {
    return (props) => {
      const view = new MvvmView(props.model, this.framework.createSignal);
      this.framework.onCleanup(() => view.dispose());
      const aware = props.model;
      if (typeof aware?.onRenderAsync === "function")
        this.framework.onMount?.(() => void aware.onRenderAsync());
      return viewFactory(view, this);
    };
  }
  createSimpleView(defaultProps, viewFactory) {
    return (props) => viewFactory(Object.assign({}, defaultProps, props), this);
  }
}

class MvvmView {
  viewModel;
  createSignal;
  disposables = new DisposableContainer;
  bindings = new Map;
  constructor(viewModel, createSignal) {
    this.viewModel = viewModel;
    this.createSignal = createSignal;
  }
  bind(expression, key) {
    const finalKey = key ?? expression.toString();
    const existing = this.bindings.get(finalKey);
    if (!existing) {
      const binding = bindTo(this.viewModel, expression, this.createSignal);
      this.disposables.add(binding);
      this.bindings.set(finalKey, { binding, seenChanges: binding.valueContainer.changeCount });
      return binding.valueContainer.value;
    }
    const { binding } = existing;
    const changes = binding.valueContainer.changeCount;
    if (changes !== existing.seenChanges) {
      existing.seenChanges = changes;
      binding.touch();
    } else {
      binding.refresh();
    }
    return binding.valueContainer.value;
  }
  dispose() {
    this.disposables.dispose();
    this.bindings.clear();
  }
}
function bindTo(source, expression, createSignal) {
  let changeId = 0;
  const [getSignal, setSignal] = createSignal(0);
  getSignal();
  return observeExpression(source, expression, () => setSignal(++changeId), getSignal);
}
// ../../frontend/web/packages/ui/src/views/mvvm.ts
var mvvm = jsx(exports_dev, render);
function useMvvmView(model) {
  const view = new MvvmView(model, createSignal);
  onCleanup(() => view.dispose());
  return view;
}

// ../../frontend/web/packages/ui/src/views/UiIcon.tsx
var _tmpl$ = /* @__PURE__ */ template(`<svg class=ui-icon viewBox="0 0 24 24"aria-hidden=true>`);
var _tmpl$2 = /* @__PURE__ */ template(`<svg><path d="M15 5l-7 7 7 7"></svg>`, false, true, false);
var _tmpl$3 = /* @__PURE__ */ template(`<svg><path d="M9 5l7 7-7 7"></svg>`, false, true, false);
var _tmpl$4 = /* @__PURE__ */ template(`<svg><path d="M6 6l12 12M18 6L6 18"></svg>`, false, true, false);
var _tmpl$5 = /* @__PURE__ */ template(`<svg><circle cx=11 cy=11 r=6></svg>`, false, true, false);
var _tmpl$6 = /* @__PURE__ */ template(`<svg><path d="M16 16l5 5"></svg>`, false, true, false);
var _tmpl$7 = /* @__PURE__ */ template(`<svg><path d="M12 5v14M5 12h14"></svg>`, false, true, false);
var _tmpl$8 = /* @__PURE__ */ template(`<svg><path d="M5 12h14"></svg>`, false, true, false);
var _tmpl$9 = /* @__PURE__ */ template(`<svg><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"></svg>`, false, true, false);
var _tmpl$0 = /* @__PURE__ */ template(`<svg><path d="M12 19V5M5 12l7-7 7 7"></svg>`, false, true, false);
var _tmpl$1 = /* @__PURE__ */ template(`<svg><path d="M12 5v14M19 12l-7 7-7-7"></svg>`, false, true, false);
var _tmpl$10 = /* @__PURE__ */ template(`<svg><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"></svg>`, false, true, false);
var _tmpl$11 = /* @__PURE__ */ template(`<svg><circle cx=9 cy=6 r=1.4 fill=currentColor stroke=none></svg>`, false, true, false);
var _tmpl$12 = /* @__PURE__ */ template(`<svg><circle cx=15 cy=6 r=1.4 fill=currentColor stroke=none></svg>`, false, true, false);
var _tmpl$13 = /* @__PURE__ */ template(`<svg><circle cx=9 cy=12 r=1.4 fill=currentColor stroke=none></svg>`, false, true, false);
var _tmpl$14 = /* @__PURE__ */ template(`<svg><circle cx=15 cy=12 r=1.4 fill=currentColor stroke=none></svg>`, false, true, false);
var _tmpl$15 = /* @__PURE__ */ template(`<svg><circle cx=9 cy=18 r=1.4 fill=currentColor stroke=none></svg>`, false, true, false);
var _tmpl$16 = /* @__PURE__ */ template(`<svg><circle cx=15 cy=18 r=1.4 fill=currentColor stroke=none></svg>`, false, true, false);
var _tmpl$17 = /* @__PURE__ */ template(`<svg><path d="M12 20h9"></svg>`, false, true, false);
var _tmpl$18 = /* @__PURE__ */ template(`<svg><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></svg>`, false, true, false);
var _tmpl$19 = /* @__PURE__ */ template(`<svg><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></svg>`, false, true, false);
var _tmpl$20 = /* @__PURE__ */ template(`<svg><circle cx=12 cy=13 r=4></svg>`, false, true, false);
var _tmpl$21 = /* @__PURE__ */ template(`<svg><circle cx=12 cy=12 r=3></svg>`, false, true, false);
var _tmpl$22 = /* @__PURE__ */ template(`<svg><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></svg>`, false, true, false);
function UiIcon(props) {
  return (() => {
    var _el$ = _tmpl$();
    insert(_el$, (() => {
      var _c$ = memo(() => props.name === "back");
      return () => _c$() && _tmpl$2();
    })(), null);
    insert(_el$, (() => {
      var _c$2 = memo(() => props.name === "chevron");
      return () => _c$2() && _tmpl$3();
    })(), null);
    insert(_el$, (() => {
      var _c$3 = memo(() => props.name === "close");
      return () => _c$3() && _tmpl$4();
    })(), null);
    insert(_el$, (() => {
      var _c$4 = memo(() => props.name === "search");
      return () => _c$4() && [_tmpl$5(), _tmpl$6()];
    })(), null);
    insert(_el$, (() => {
      var _c$5 = memo(() => props.name === "plus");
      return () => _c$5() && _tmpl$7();
    })(), null);
    insert(_el$, (() => {
      var _c$6 = memo(() => props.name === "minus");
      return () => _c$6() && _tmpl$8();
    })(), null);
    insert(_el$, (() => {
      var _c$7 = memo(() => props.name === "trash");
      return () => _c$7() && _tmpl$9();
    })(), null);
    insert(_el$, (() => {
      var _c$8 = memo(() => props.name === "arrow-up");
      return () => _c$8() && _tmpl$0();
    })(), null);
    insert(_el$, (() => {
      var _c$9 = memo(() => props.name === "arrow-down");
      return () => _c$9() && _tmpl$1();
    })(), null);
    insert(_el$, (() => {
      var _c$0 = memo(() => props.name === "reorder");
      return () => _c$0() && _tmpl$10();
    })(), null);
    insert(_el$, (() => {
      var _c$1 = memo(() => props.name === "grip");
      return () => _c$1() && [_tmpl$11(), _tmpl$12(), _tmpl$13(), _tmpl$14(), _tmpl$15(), _tmpl$16()];
    })(), null);
    insert(_el$, (() => {
      var _c$10 = memo(() => props.name === "edit");
      return () => _c$10() && [_tmpl$17(), _tmpl$18()];
    })(), null);
    insert(_el$, (() => {
      var _c$11 = memo(() => props.name === "camera");
      return () => _c$11() && [_tmpl$19(), _tmpl$20()];
    })(), null);
    insert(_el$, (() => {
      var _c$12 = memo(() => props.name === "settings");
      return () => _c$12() && [_tmpl$21(), _tmpl$22()];
    })(), null);
    return _el$;
  })();
}

// ../../frontend/web/packages/ui/src/views/ButtonView.tsx
var _tmpl$23 = /* @__PURE__ */ template(`<button type=button>`);
var isIconOnly = (variant) => variant === "icon" || variant === "icon-small";
var ButtonView = mvvm.createMvvmView((view) => createComponent(Show, {
  get when() {
    return view.bind((v) => v.isVisible);
  },
  get children() {
    var _el$ = _tmpl$23();
    _el$.$$click = () => void view.viewModel.execute();
    insert(_el$, createComponent(Show, {
      get when() {
        return view.bind((v) => v.icon);
      },
      children: (name) => createComponent(UiIcon, {
        get name() {
          return name();
        }
      })
    }), null);
    insert(_el$, createComponent(Show, {
      get when() {
        return !view.bind((v) => isIconOnly(v.variant));
      },
      get children() {
        return view.bind((v) => v.text);
      }
    }), null);
    createRenderEffect((_p$) => {
      var _v$ = view.bind((v) => v.id) || undefined, _v$2 = view.bind((v) => [isIconOnly(v.variant) ? `ui-icon-button${v.variant === "icon-small" ? " ui-icon-button--small" : ""}` : `ui-button ui-button--${v.variant}`, ...v.classes].join(" ")), _v$3 = !view.bind((v) => v.isEnabled), _v$4 = view.bind((v) => isIconOnly(v.variant) ? v.text : undefined), _v$5 = view.bind((v) => isIconOnly(v.variant) ? v.text : undefined);
      _v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
      _v$3 !== _p$.a && (_el$.disabled = _p$.a = _v$3);
      _v$4 !== _p$.o && setAttribute(_el$, "aria-label", _p$.o = _v$4);
      _v$5 !== _p$.i && setAttribute(_el$, "title", _p$.i = _v$5);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  }
}));
delegateEvents(["click"]);
// ../../frontend/web/packages/ui/src/views/overlayHistory.ts
var OverlayHistoryContext = createContext(undefined);
var OverlayHistoryProvider = OverlayHistoryContext.Provider;
function createOverlayBack(isOpen, onBack) {
  const history = useContext(OverlayHistoryContext);
  if (!history)
    return;
  let withdraw;
  const release = () => {
    const current = withdraw;
    withdraw = undefined;
    current?.();
  };
  createEffect(() => {
    if (isOpen()) {
      if (withdraw)
        return;
      withdraw = history.open(() => {
        withdraw = undefined;
        onBack();
      });
    } else {
      release();
    }
  });
  onCleanup(release);
}

// ../../frontend/web/packages/ui/src/views/ConfirmSheetView.tsx
var _tmpl$24 = /* @__PURE__ */ template(`<dialog class=ui-sheet><h2 class=ui-sheet__title></h2><p class=ui-sheet__text></p><div class=ui-sheet__actions>`);
var ConfirmSheetView = mvvm.createMvvmView((view) => {
  let dialog;
  const id = createUniqueId();
  createOverlayBack(() => view.bind((v) => v.isOpen), () => void view.viewModel.cancel.execute());
  createEffect(() => {
    const open = view.bind((v) => v.isOpen);
    if (!dialog)
      return;
    if (open && !dialog.open)
      dialog.showModal();
    if (!open && dialog.open)
      dialog.close();
  });
  return (() => {
    var _el$ = _tmpl$24(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
    _el$.addEventListener("cancel", (event) => {
      event.preventDefault();
      view.viewModel.cancel.execute();
    });
    use((element) => dialog = element, _el$);
    setAttribute(_el$, "aria-labelledby", `${id}-title`);
    setAttribute(_el$2, "id", `${id}-title`);
    insert(_el$2, () => view.bind((v) => v.title));
    insert(_el$3, () => view.bind((v) => v.text));
    insert(_el$4, createComponent(ButtonView, {
      get model() {
        return view.viewModel.cancel;
      }
    }), null);
    insert(_el$4, createComponent(ButtonView, {
      get model() {
        return view.viewModel.confirm;
      }
    }), null);
    return _el$;
  })();
});
// ../../frontend/web/packages/ui/src/views/TextFieldView.tsx
var _tmpl$25 = /* @__PURE__ */ template(`<textarea class=ui-field rows=4>`);
var _tmpl$26 = /* @__PURE__ */ template(`<div><label class=ui-field-label>`);
var _tmpl$32 = /* @__PURE__ */ template(`<input class=ui-field autocomplete=off>`);
var TextFieldView = mvvm.createMvvmView((view) => {
  const generatedId = createUniqueId();
  const id = () => view.bind((v) => v.id) || generatedId;
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$26(), _el$2 = _el$.firstChild;
      insert(_el$2, () => view.bind((v) => v.label));
      insert(_el$, createComponent(Show, {
        get when() {
          return view.bind((v) => v.isMultiline);
        },
        get fallback() {
          return (() => {
            var _el$4 = _tmpl$32();
            _el$4.$$input = (event) => view.viewModel.setValue(event.currentTarget.value);
            createRenderEffect((_p$) => {
              var _v$6 = id(), _v$7 = view.bind((v) => v.placeholder), _v$8 = !view.bind((v) => v.isEnabled);
              _v$6 !== _p$.e && setAttribute(_el$4, "id", _p$.e = _v$6);
              _v$7 !== _p$.t && setAttribute(_el$4, "placeholder", _p$.t = _v$7);
              _v$8 !== _p$.a && (_el$4.disabled = _p$.a = _v$8);
              return _p$;
            }, {
              e: undefined,
              t: undefined,
              a: undefined
            });
            createRenderEffect(() => _el$4.value = view.bind((v) => v.value));
            return _el$4;
          })();
        },
        get children() {
          var _el$3 = _tmpl$25();
          _el$3.$$input = (event) => view.viewModel.setValue(event.currentTarget.value);
          createRenderEffect((_p$) => {
            var _v$ = id(), _v$2 = view.bind((v) => v.placeholder), _v$3 = !view.bind((v) => v.isEnabled);
            _v$ !== _p$.e && setAttribute(_el$3, "id", _p$.e = _v$);
            _v$2 !== _p$.t && setAttribute(_el$3, "placeholder", _p$.t = _v$2);
            _v$3 !== _p$.a && (_el$3.disabled = _p$.a = _v$3);
            return _p$;
          }, {
            e: undefined,
            t: undefined,
            a: undefined
          });
          createRenderEffect(() => _el$3.value = view.bind((v) => v.value));
          return _el$3;
        }
      }), null);
      createRenderEffect((_p$) => {
        var _v$4 = view.bind((v) => ["ui-text-field", ...v.classes].join(" ")), _v$5 = id();
        _v$4 !== _p$.e && className(_el$, _p$.e = _v$4);
        _v$5 !== _p$.t && setAttribute(_el$2, "for", _p$.t = _v$5);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      return _el$;
    }
  });
});
delegateEvents(["input"]);

// ../../frontend/web/packages/ui/src/views/FormSheetView.tsx
var _tmpl$27 = /* @__PURE__ */ template(`<div class=ui-sheet__fields>`);
var _tmpl$28 = /* @__PURE__ */ template(`<p class=ui-sheet__error role=alert>`);
var _tmpl$33 = /* @__PURE__ */ template(`<div class=ui-sheet__actions>`);
var _tmpl$42 = /* @__PURE__ */ template(`<dialog class=ui-sheet><form><h2 class=ui-sheet__title>`);
var _tmpl$52 = /* @__PURE__ */ template(`<p class=ui-sheet__text>`);
var FormSheetView = mvvm.createMvvmView((view) => {
  let dialog;
  let form;
  const id = createUniqueId();
  createOverlayBack(() => view.bind((v) => v.isOpen), () => void view.viewModel.cancel.execute());
  createEffect(() => {
    const open = view.bind((v) => v.isOpen);
    if (!dialog)
      return;
    if (open && !dialog.open) {
      dialog.showModal();
      const focusFirstField = () => {
        if (dialog?.open && !dialog.contains(document.activeElement))
          form?.querySelector("input, textarea")?.focus();
      };
      queueMicrotask(focusFirstField);
      requestAnimationFrame(focusFirstField);
    }
    if (!open && dialog.open)
      dialog.close();
  });
  return (() => {
    var _el$ = _tmpl$42(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    _el$.addEventListener("cancel", (event) => {
      event.preventDefault();
      view.viewModel.cancel.execute();
    });
    use((element) => dialog = element, _el$);
    setAttribute(_el$, "aria-labelledby", `${id}-title`);
    _el$2.addEventListener("submit", (event) => {
      event.preventDefault();
      view.viewModel.confirm.execute();
    });
    use((element) => form = element, _el$2);
    setAttribute(_el$3, "id", `${id}-title`);
    insert(_el$3, () => view.bind((v) => v.title));
    insert(_el$2, createComponent(Show, {
      get when() {
        return !view.bind((v) => v.isConfirmingRemove);
      },
      get fallback() {
        return createComponent(Show, {
          get when() {
            return view.bind((v) => v.remove);
          },
          children: (remove) => [(() => {
            var _el$7 = _tmpl$52();
            insert(_el$7, () => remove().text);
            return _el$7;
          })(), (() => {
            var _el$8 = _tmpl$33();
            insert(_el$8, createComponent(ButtonView, {
              get model() {
                return remove().cancel;
              }
            }), null);
            insert(_el$8, createComponent(ButtonView, {
              get model() {
                return remove().confirm;
              }
            }), null);
            return _el$8;
          })()]
        });
      },
      get children() {
        return [(() => {
          var _el$4 = _tmpl$27();
          insert(_el$4, createComponent(For, {
            get each() {
              return view.bind((v) => v.fields.slice());
            },
            children: (field) => createComponent(TextFieldView, {
              model: field
            })
          }));
          return _el$4;
        })(), createComponent(Show, {
          get when() {
            return view.bind((v) => v.errorText);
          },
          get children() {
            var _el$5 = _tmpl$28();
            insert(_el$5, () => view.bind((v) => v.errorText));
            return _el$5;
          }
        }), (() => {
          var _el$6 = _tmpl$33();
          insert(_el$6, createComponent(ButtonView, {
            get model() {
              return view.viewModel.cancel;
            }
          }), null);
          insert(_el$6, createComponent(ButtonView, {
            get model() {
              return view.viewModel.confirm;
            }
          }), null);
          return _el$6;
        })(), createComponent(Show, {
          get when() {
            return view.bind((v) => v.remove);
          },
          children: (remove) => createComponent(ButtonView, {
            get model() {
              return remove().button;
            }
          })
        })];
      }
    }), null);
    return _el$;
  })();
});

// ../../frontend/web/packages/ui/src/views/FilePickerView.tsx
var _tmpl$29 = /* @__PURE__ */ template(`<label><span></span><input type=file class=ui-visually-hidden>`);
var FilePickerView = mvvm.createMvvmView((view) => {
  let input;
  const choose = async (files) => {
    await view.viewModel.pick(files ? Array.from(files) : []);
    if (input)
      input.value = "";
  };
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$29(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
      insert(_el$, createComponent(Show, {
        get when() {
          return view.bind((v) => v.icon);
        },
        children: (icon) => createComponent(UiIcon, {
          get name() {
            return icon();
          }
        })
      }), _el$2);
      insert(_el$2, () => view.bind((v) => v.text));
      _el$3.addEventListener("change", (event) => void choose(event.currentTarget.files));
      use((element) => input = element, _el$3);
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => v.id) || undefined, _v$2 = view.bind((v) => ["ui-button", "ui-button--secondary", "ui-file-picker", ...v.classes].join(" ")), _v$3 = view.bind((v) => !v.isEnabled || v.isBusy), _v$4 = view.bind((v) => v.accept), _v$5 = view.bind((v) => v.isMultiple), _v$6 = view.bind((v) => !v.isEnabled || v.isBusy);
        _v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
        _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
        _v$3 !== _p$.a && setAttribute(_el$, "aria-disabled", _p$.a = _v$3);
        _v$4 !== _p$.o && setAttribute(_el$3, "accept", _p$.o = _v$4);
        _v$5 !== _p$.i && (_el$3.multiple = _p$.i = _v$5);
        _v$6 !== _p$.n && (_el$3.disabled = _p$.n = _v$6);
        return _p$;
      }, {
        e: undefined,
        t: undefined,
        a: undefined,
        o: undefined,
        i: undefined,
        n: undefined
      });
      return _el$;
    }
  });
});

// ../../frontend/web/packages/ui/src/views/HintView.tsx
var _tmpl$30 = /* @__PURE__ */ template(`<p>`);
var HintView = mvvm.createMvvmView((view) => createComponent(Show, {
  get when() {
    return view.bind((v) => v.isVisible);
  },
  get children() {
    var _el$ = _tmpl$30();
    insert(_el$, () => view.bind((v) => v.text));
    createRenderEffect((_p$) => {
      var _v$ = view.bind((v) => v.id) || undefined, _v$2 = view.bind((v) => ["ui-hint", ...v.tone === "error" ? ["ui-hint--error"] : [], ...v.classes].join(" ")), _v$3 = view.bind((v) => v.tone === "error" ? "alert" : undefined);
      _v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
      _v$3 !== _p$.a && setAttribute(_el$, "role", _p$.a = _v$3);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined
    });
    return _el$;
  }
}));

// ../../frontend/web/packages/ui/src/views/ImageView.tsx
var _tmpl$31 = /* @__PURE__ */ template(`<div>`);
var _tmpl$210 = /* @__PURE__ */ template(`<img alt>`);
var ImageView = mvvm.createMvvmView((view) => {
  let current;
  const [url] = createResource(() => view.bind((v) => v.key), async () => {
    const blob = await view.viewModel.image();
    if (current)
      URL.revokeObjectURL(current);
    current = blob ? URL.createObjectURL(blob) : undefined;
    return current;
  });
  onCleanup(() => current && URL.revokeObjectURL(current));
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$31();
      insert(_el$, createComponent(Show, {
        get when() {
          return memo(() => !!view.bind((v) => v.hasImage))() && url();
        },
        get fallback() {
          return createComponent(UiIcon, {
            get name() {
              return view.viewModel.emptyIcon;
            }
          });
        },
        children: (src) => (() => {
          var _el$2 = _tmpl$210();
          createRenderEffect(() => setAttribute(_el$2, "src", src()));
          return _el$2;
        })()
      }));
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => v.id) || undefined, _v$2 = view.bind((v) => ["ui-image", ...v.classes].join(" "));
        _v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
        _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      return _el$;
    }
  });
});

// ../../frontend/web/packages/ui/src/views/PictureView.tsx
var _tmpl$34 = /* @__PURE__ */ template(`<span class=ui-picture__hint>`);
var _tmpl$211 = /* @__PURE__ */ template(`<label><input type=file class=ui-visually-hidden>`);
var _tmpl$35 = /* @__PURE__ */ template(`<button type=button class=ui-picture__open>`);
var _tmpl$43 = /* @__PURE__ */ template(`<div class=ui-picture__actions>`);
var _tmpl$53 = /* @__PURE__ */ template(`<div><dialog class=ui-viewer><div class=ui-viewer__bar></div><div class=ui-viewer__scroll><div class=ui-viewer__stage>`);
var _tmpl$62 = /* @__PURE__ */ template(`<img alt>`);
function EmptyHint(props) {
  return [createComponent(UiIcon, {
    get name() {
      return props.icon;
    }
  }), (() => {
    var _el$ = _tmpl$34();
    insert(_el$, () => props.text);
    return _el$;
  })()];
}
var PictureView = mvvm.createMvvmView((view) => {
  let input;
  let dialog;
  let current;
  const choose = async (files) => {
    await view.viewModel.picker.pick(files ? Array.from(files) : []);
    if (input)
      input.value = "";
  };
  const [url] = createResource(() => view.bind((v) => v.viewer.isOpen) ? view.bind((v) => v.key) ?? false : false, async () => {
    if (current)
      URL.revokeObjectURL(current);
    current = undefined;
    const blob = await view.viewModel.image.image();
    current = blob ? URL.createObjectURL(blob) : undefined;
    return current;
  });
  onCleanup(() => current && URL.revokeObjectURL(current));
  createOverlayBack(() => view.bind((v) => v.viewer.isOpen), () => view.viewModel.viewer.close());
  createEffect(() => {
    const open = view.bind((v) => v.viewer.isOpen);
    if (!dialog)
      return;
    if (open && !dialog.open)
      dialog.showModal();
    if (!open && dialog.open)
      dialog.close();
  });
  let scroller;
  let shownScale = 1;
  createEffect(() => {
    const scale = view.bind((v) => v.viewer.scale);
    const element = scroller;
    const ratio = scale / shownScale;
    shownScale = scale;
    if (!element || ratio === 1)
      return;
    const centre = {
      x: element.scrollLeft + element.clientWidth / 2,
      y: element.scrollTop + element.clientHeight / 2
    };
    queueMicrotask(() => {
      element.scrollLeft = centre.x * ratio - element.clientWidth / 2;
      element.scrollTop = centre.y * ratio - element.clientHeight / 2;
    });
  });
  const [natural, setNatural] = createSignal();
  const [display, setDisplay] = createSignal({
    width: 0,
    height: 0
  });
  const fitted = () => {
    const size = natural();
    const shown = display();
    if (!size || shown.width === 0 || shown.height === 0)
      return;
    const fit = Math.min(1, shown.width / size.width, shown.height / size.height) * view.bind((v) => v.viewer.scale);
    return {
      width: size.width * fit,
      height: size.height * fit
    };
  };
  onMount(() => {
    if (!scroller)
      return;
    const measure = () => setDisplay({
      width: scroller.clientWidth,
      height: scroller.clientHeight
    });
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    measure();
    onCleanup(() => observer.disconnect());
  });
  const pointers = new Map;
  let pinchStart;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const filePicker = (cover) => (() => {
    var _el$2 = _tmpl$211(), _el$3 = _el$2.firstChild;
    className(_el$2, cover ? "ui-picture__cover" : "ui-icon-button ui-icon-button--small ui-picture__action");
    insert(_el$2, createComponent(Show, {
      when: !cover,
      get fallback() {
        return createComponent(EmptyHint, {
          get icon() {
            return view.viewModel.image.emptyIcon;
          },
          get text() {
            return view.bind((v) => v.picker.text);
          }
        });
      },
      get children() {
        return createComponent(UiIcon, {
          name: "edit"
        });
      }
    }), _el$3);
    _el$3.addEventListener("change", (event) => void choose(event.currentTarget.files));
    use((element) => input = element, _el$3);
    createRenderEffect((_p$) => {
      var _v$ = view.bind((v) => v.picker.text), _v$2 = cover ? undefined : view.bind((v) => v.picker.text), _v$3 = view.bind((v) => v.picker.accept), _v$4 = !view.bind((v) => v.picker.isEnabled && !v.picker.isBusy);
      _v$ !== _p$.e && setAttribute(_el$2, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setAttribute(_el$2, "title", _p$.t = _v$2);
      _v$3 !== _p$.a && setAttribute(_el$3, "accept", _p$.a = _v$3);
      _v$4 !== _p$.o && (_el$3.disabled = _p$.o = _v$4);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$2;
  })();
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$4 = _tmpl$53(), _el$7 = _el$4.firstChild, _el$8 = _el$7.firstChild, _el$9 = _el$8.nextSibling, _el$0 = _el$9.firstChild;
      insert(_el$4, createComponent(ImageView, {
        get model() {
          return view.viewModel.image;
        }
      }), _el$7);
      insert(_el$4, createComponent(Show, {
        get when() {
          return view.bind((v) => v.hasImage);
        },
        get children() {
          var _el$5 = _tmpl$35();
          _el$5.$$click = () => view.viewModel.open();
          createRenderEffect((_p$) => {
            var _v$5 = view.bind((v) => v.texts.openTooltipText), _v$6 = view.bind((v) => v.texts.openTooltipText);
            _v$5 !== _p$.e && setAttribute(_el$5, "aria-label", _p$.e = _v$5);
            _v$6 !== _p$.t && setAttribute(_el$5, "title", _p$.t = _v$6);
            return _p$;
          }, {
            e: undefined,
            t: undefined
          });
          return _el$5;
        }
      }), _el$7);
      insert(_el$4, createComponent(Show, {
        get when() {
          return view.bind((v) => v.isPickTarget);
        },
        get children() {
          return filePicker(true);
        }
      }), _el$7);
      insert(_el$4, createComponent(Show, {
        get when() {
          return view.bind((v) => v.showsActions);
        },
        get children() {
          var _el$6 = _tmpl$43();
          insert(_el$6, createComponent(Show, {
            get when() {
              return view.bind((v) => v.canPick);
            },
            get children() {
              return filePicker(false);
            }
          }), null);
          insert(_el$6, createComponent(Show, {
            get when() {
              return view.bind((v) => v.canRemove);
            },
            get children() {
              return createComponent(ButtonView, {
                get model() {
                  return view.viewModel.removeButton;
                }
              });
            }
          }), null);
          return _el$6;
        }
      }), _el$7);
      _el$7.addEventListener("cancel", (event) => {
        event.preventDefault();
        view.viewModel.viewer.close();
      });
      use((element) => dialog = element, _el$7);
      insert(_el$8, createComponent(ButtonView, {
        get model() {
          return view.viewModel.viewer.zoomOutButton;
        }
      }), null);
      insert(_el$8, createComponent(ButtonView, {
        get model() {
          return view.viewModel.viewer.zoomInButton;
        }
      }), null);
      insert(_el$8, createComponent(ButtonView, {
        get model() {
          return view.viewModel.viewer.closeButton;
        }
      }), null);
      _el$9.addEventListener("pointercancel", (event) => {
        pointers.delete(event.pointerId);
        pinchStart = undefined;
      });
      _el$9.$$pointerup = (event) => {
        pointers.delete(event.pointerId);
        pinchStart = undefined;
      };
      _el$9.$$pointermove = (event) => {
        if (!pointers.has(event.pointerId))
          return;
        pointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });
        if (pinchStart && pointers.size === 2)
          view.viewModel.viewer.pinch(pinchStart.scale, pinchStart.distance, distance());
      };
      _el$9.$$pointerdown = (event) => {
        pointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });
        if (pointers.size === 2)
          pinchStart = {
            distance: distance(),
            scale: view.viewModel.viewer.scale
          };
      };
      _el$9.$$dblclick = () => view.viewModel.viewer.toggleZoom();
      use((element) => scroller = element, _el$9);
      insert(_el$0, createComponent(Show, {
        get when() {
          return url();
        },
        children: (src) => (() => {
          var _el$1 = _tmpl$62();
          _el$1.addEventListener("load", (event) => setNatural({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight
          }));
          setAttribute(_el$1, "draggable", false);
          createRenderEffect((_p$) => {
            var _v$9 = src(), _v$0 = fitted() ? `${fitted().width}px` : undefined, _v$1 = fitted() ? `${fitted().height}px` : undefined;
            _v$9 !== _p$.e && setAttribute(_el$1, "src", _p$.e = _v$9);
            _v$0 !== _p$.t && setStyleProperty(_el$1, "width", _p$.t = _v$0);
            _v$1 !== _p$.a && setStyleProperty(_el$1, "height", _p$.a = _v$1);
            return _p$;
          }, {
            e: undefined,
            t: undefined,
            a: undefined
          });
          return _el$1;
        })()
      }));
      createRenderEffect((_p$) => {
        var _v$7 = view.bind((v) => v.id) || undefined, _v$8 = view.bind((v) => ["ui-picture", ...v.isPickTarget ? ["ui-picture--pick"] : [], ...v.classes].join(" "));
        _v$7 !== _p$.e && setAttribute(_el$4, "id", _p$.e = _v$7);
        _v$8 !== _p$.t && className(_el$4, _p$.t = _v$8);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      return _el$4;
    }
  });
});
delegateEvents(["click", "dblclick", "pointerdown", "pointermove", "pointerup"]);

// ../../frontend/web/packages/ui/src/views/ViewRegistryContext.tsx
var ViewRegistryContext = createContext();
function useViewRegistry() {
  const registry = useContext(ViewRegistryContext);
  if (!registry)
    throw new Error("ViewSelector outside of <ViewRegistryProvider>.");
  return registry;
}

// ../../frontend/web/packages/ui/src/views/ViewSelector.tsx
function ViewSelector(props) {
  const registry = useViewRegistry();
  return createComponent(Show, {
    get when() {
      return props.model;
    },
    keyed: true,
    children: (model) => createComponent(Dynamic, {
      get component() {
        return registry.resolve(model);
      },
      model
    })
  });
}

// ../../frontend/web/packages/ui/src/views/ListRowView.tsx
var _tmpl$36 = /* @__PURE__ */ template(`<span class=ui-list-row__leading>`);
var _tmpl$212 = /* @__PURE__ */ template(`<span class=ui-list-row__meta>`);
var _tmpl$37 = /* @__PURE__ */ template(`<span class=ui-list-row__trailing>`);
var _tmpl$44 = /* @__PURE__ */ template(`<a><span class=ui-list-row__text><span class=ui-list-row__title>`);
function Content(props) {
  return createComponent(Show, {
    get when() {
      return props.content;
    },
    children: (content) => typeof content() === "string" ? memo(() => content()) : createComponent(ViewSelector, {
      get model() {
        return content();
      }
    })
  });
}
var ListRowView = mvvm.createMvvmView((view) => (() => {
  var _el$ = _tmpl$44(), _el$3 = _el$.firstChild, _el$4 = _el$3.firstChild;
  _el$.$$click = (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0)
      return;
    event.preventDefault();
    view.viewModel.open();
  };
  insert(_el$, createComponent(Show, {
    get when() {
      return view.bind((v) => v.leading);
    },
    get children() {
      var _el$2 = _tmpl$36();
      insert(_el$2, createComponent(Content, {
        get content() {
          return view.bind((v) => v.leading);
        }
      }));
      return _el$2;
    }
  }), _el$3);
  insert(_el$4, () => view.bind((v) => v.title));
  insert(_el$3, createComponent(Show, {
    get when() {
      return view.bind((v) => v.meta);
    },
    get children() {
      var _el$5 = _tmpl$212();
      insert(_el$5, () => view.bind((v) => v.meta));
      return _el$5;
    }
  }), null);
  insert(_el$, createComponent(Show, {
    get when() {
      return view.bind((v) => v.trailing);
    },
    get children() {
      var _el$6 = _tmpl$37();
      insert(_el$6, createComponent(Content, {
        get content() {
          return view.bind((v) => v.trailing);
        }
      }));
      return _el$6;
    }
  }), null);
  createRenderEffect((_p$) => {
    var _v$ = view.bind((v) => v.id) || undefined, _v$2 = view.bind((v) => ["ui-list-row", ...v.isSelected ? ["ui-list-row--selected"] : [], ...v.classes].join(" ")), _v$3 = view.bind((v) => v.href) ?? "#", _v$4 = view.bind((v) => v.isSelected ? "page" : undefined);
    _v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
    _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
    _v$3 !== _p$.a && setAttribute(_el$, "href", _p$.a = _v$3);
    _v$4 !== _p$.o && setAttribute(_el$, "aria-current", _p$.o = _v$4);
    return _p$;
  }, {
    e: undefined,
    t: undefined,
    a: undefined,
    o: undefined
  });
  return _el$;
})());
delegateEvents(["click"]);

// ../../frontend/web/packages/ui/src/views/ListView.tsx
var _tmpl$38 = /* @__PURE__ */ template(`<li>`);
var _tmpl$213 = /* @__PURE__ */ template(`<div class=ui-list-row__controls>`);
var _tmpl$39 = /* @__PURE__ */ template(`<ul>`);
var _tmpl$45 = /* @__PURE__ */ template(`<div class=ui-reorderable><div class=ui-reorder-dropline></div><div class=ui-visually-hidden aria-live=polite>`);
function ListItem(props) {
  const view = useMvvmView(props.model);
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$38();
      insert(_el$, createComponent(ViewSelector, {
        get model() {
          return view.bind((v) => v.content);
        }
      }), null);
      insert(_el$, createComponent(Show, {
        get when() {
          return view.bind((v) => v.controls);
        },
        children: (controls) => (() => {
          var _el$2 = _tmpl$213();
          insert(_el$2, createComponent(ViewSelector, {
            get model() {
              return controls();
            }
          }));
          return _el$2;
        })()
      }), null);
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => v.controls ? "ui-list-item ui-list-item--controls" : "ui-list-item"), _v$2 = view.bind((v) => v.key);
        _v$ !== _p$.e && className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$, "data-item-key", _p$.t = _v$2);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      return _el$;
    }
  });
}
var ListView = mvvm.createMvvmView((view) => {
  const vm = view.viewModel;
  let container;
  const rowExtents = () => [...container?.querySelectorAll(":scope > ul:not(.ui-drag-preview) > li") ?? []].map((row) => row.getBoundingClientRect());
  let pointerY = 0;
  const rememberPointer = (event) => pointerY = event.clientY;
  window.addEventListener("pointerdown", rememberPointer, true);
  onCleanup(() => window.removeEventListener("pointerdown", rememberPointer, true));
  const copyState = (original, copy) => {
    const parts = "canvas, input, textarea, select";
    const twins = copy.querySelectorAll(parts);
    original.querySelectorAll(parts).forEach((part, index) => {
      const twin = twins[index];
      if (!twin)
        return;
      if (part instanceof HTMLCanvasElement && twin instanceof HTMLCanvasElement)
        twin.getContext("2d")?.drawImage(part, 0, 0);
      else if (part instanceof HTMLInputElement && twin instanceof HTMLInputElement) {
        twin.value = part.value;
        twin.checked = part.checked;
      } else if (part instanceof HTMLTextAreaElement && twin instanceof HTMLTextAreaElement)
        twin.value = part.value;
      else if (part instanceof HTMLSelectElement && twin instanceof HTMLSelectElement)
        twin.selectedIndex = part.selectedIndex;
    });
  };
  const liftPreview = (row) => {
    const rect = row.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    const copy = row.cloneNode(true);
    copy.removeAttribute("data-item-key");
    for (const element of copy.querySelectorAll("[id]"))
      element.removeAttribute("id");
    const wrapper = document.createElement("ul");
    wrapper.className = "ui-list ui-drag-preview";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.inert = true;
    wrapper.style.left = `${rect.left}px`;
    wrapper.style.top = `${rect.top}px`;
    wrapper.style.width = `${rect.width}px`;
    wrapper.append(copy);
    container.append(wrapper);
    copyState(row, copy);
    row.dataset.lifted = "";
    const startY = pointerY;
    return {
      moveTo(clientY) {
        const top = Math.min(Math.max(rect.top + (clientY - startY), bounds.top), bounds.bottom - rect.height);
        wrapper.style.top = `${top}px`;
      },
      remove() {
        wrapper.remove();
        delete row.dataset.lifted;
      }
    };
  };
  createEffect(() => {
    const dragged = view.bind((v) => v.draggingId);
    if (dragged === undefined)
      return;
    const row = container?.querySelector(`:scope > ul:not(.ui-drag-preview) > li[data-item-key="${CSS.escape(dragged)}"]`);
    const preview = row ? liftPreview(row) : undefined;
    const onMove = (event) => {
      preview?.moveTo(event.clientY);
      vm.dragTo(dropIndexAt(rowExtents(), event.clientY, vm.positionOf(dragged)));
    };
    const onUp = () => void vm.drop();
    const onCancel = () => vm.cancelDrag();
    const onKey = (event) => {
      if (event.key === "Escape")
        vm.cancelDrag();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("ui-dragging");
    onCleanup(() => {
      preview?.remove();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("ui-dragging");
    });
  });
  const dropLineTop = () => {
    const dragged = view.bind((v) => v.draggingId);
    const index = view.bind((v) => v.dropIndex);
    if (dragged === undefined || index === undefined || !container)
      return;
    const from = vm.positionOf(dragged);
    const extents = rowExtents();
    if (index === from || extents.length === 0)
      return;
    const target = extents[Math.min(index, extents.length - 1)];
    return (index < from ? target.top : target.bottom) - container.getBoundingClientRect().top;
  };
  const list = () => (() => {
    var _el$3 = _tmpl$39();
    insert(_el$3, createComponent(For, {
      get each() {
        return view.bind((v) => v.items.slice());
      },
      children: (item) => createComponent(ListItem, {
        model: item
      })
    }));
    createRenderEffect((_p$) => {
      var _v$3 = view.bind((v) => v.id) || undefined, _v$4 = view.bind((v) => ["ui-list", ...v.classes].join(" ")), _v$5 = view.bind((v) => v.label);
      _v$3 !== _p$.e && setAttribute(_el$3, "id", _p$.e = _v$3);
      _v$4 !== _p$.t && className(_el$3, _p$.t = _v$4);
      _v$5 !== _p$.a && setAttribute(_el$3, "aria-label", _p$.a = _v$5);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined
    });
    return _el$3;
  })();
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      return createComponent(Show, {
        get when() {
          return view.bind((v) => v.reordering || v.canToggle);
        },
        get fallback() {
          return list();
        },
        get children() {
          var _el$4 = _tmpl$45(), _el$5 = _el$4.firstChild, _el$6 = _el$5.nextSibling;
          var _ref$ = container;
          typeof _ref$ === "function" ? use(_ref$, _el$4) : container = _el$4;
          insert(_el$4, list, _el$5);
          insert(_el$6, () => view.bind((v) => v.announcement));
          createRenderEffect((_p$) => {
            var _v$6 = dropLineTop() === undefined, _v$7 = `${dropLineTop() ?? 0}px`;
            _v$6 !== _p$.e && (_el$5.hidden = _p$.e = _v$6);
            _v$7 !== _p$.t && setStyleProperty(_el$5, "top", _p$.t = _v$7);
            return _p$;
          }, {
            e: undefined,
            t: undefined
          });
          return _el$4;
        }
      });
    }
  });
});

// ../../frontend/web/packages/ui/src/views/ProgressBarView.tsx
var _tmpl$40 = /* @__PURE__ */ template(`<div><div class=ui-progress__track role=progressbar aria-valuemin=0><span></span></div><span class=ui-progress__label>`);
var ProgressBarView = mvvm.createMvvmView((view) => createComponent(Show, {
  get when() {
    return view.bind((v) => v.isVisible);
  },
  get children() {
    var _el$ = _tmpl$40(), _el$2 = _el$.firstChild, { firstChild: _el$3, nextSibling: _el$4 } = _el$2;
    insert(_el$4, () => view.bind((v) => v.label));
    createRenderEffect((_p$) => {
      var _v$ = view.bind((v) => ["ui-progress", ...v.classes].join(" ")), _v$2 = view.bind((v) => v.total), _v$3 = view.bind((v) => v.done), _v$4 = view.bind((v) => `ui-progress__fill ui-progress__fill--${v.effectiveTone}`), _v$5 = `${view.bind((v) => v.percent)}%`;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && setAttribute(_el$2, "aria-valuemax", _p$.t = _v$2);
      _v$3 !== _p$.a && setAttribute(_el$2, "aria-valuenow", _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$3, _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$3, "width", _p$.i = _v$5);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  }
}));

// ../../frontend/web/packages/ui/src/views/ReorderControlsView.tsx
var _tmpl$41 = /* @__PURE__ */ template(`<div class=ui-reorder-controls>`);
var ReorderControlsView = mvvm.createMvvmView((view) => (() => {
  var _el$ = _tmpl$41();
  insert(_el$, createComponent(ViewSelector, {
    get model() {
      return view.viewModel.layout;
    }
  }));
  createRenderEffect(() => setAttribute(_el$, "data-reorder-item", view.bind((v) => v.itemId)));
  return _el$;
})());

// ../../frontend/web/packages/ui/src/views/ReorderHandleView.tsx
var _tmpl$46 = /* @__PURE__ */ template(`<button type=button>`);
var ReorderHandleView = mvvm.createMvvmView((view) => (() => {
  var _el$ = _tmpl$46();
  _el$.$$pointerdown = (event) => {
    if (event.button !== 0)
      return;
    event.preventDefault();
    view.viewModel.startDrag();
  };
  insert(_el$, createComponent(UiIcon, {
    name: "grip"
  }));
  createRenderEffect((_p$) => {
    var _v$ = view.bind((v) => `ui-icon-button ui-icon-button--small ui-reorder-handle${v.isDragging ? " ui-reorder-handle--dragging" : ""}`), _v$2 = view.bind((v) => v.label);
    _v$ !== _p$.e && className(_el$, _p$.e = _v$);
    _v$2 !== _p$.t && setAttribute(_el$, "aria-label", _p$.t = _v$2);
    return _p$;
  }, {
    e: undefined,
    t: undefined
  });
  return _el$;
})());
delegateEvents(["pointerdown"]);

// ../../frontend/web/packages/ui/src/views/SearchView.tsx
var _tmpl$47 = /* @__PURE__ */ template(`<button type=button class=ui-search__clear>`);
var _tmpl$214 = /* @__PURE__ */ template(`<p class=ui-search__hint>`);
var _tmpl$310 = /* @__PURE__ */ template(`<div class=ui-search__dropdown><ul class=ui-search__results role=listbox>`);
var _tmpl$48 = /* @__PURE__ */ template(`<div><div class=ui-search__field><input class=ui-search__input type=search role=combobox autocomplete=off>`);
var _tmpl$54 = /* @__PURE__ */ template(`<span class=ui-search__meta>`);
var _tmpl$63 = /* @__PURE__ */ template(`<li class=ui-search__result role=option><span class=ui-search__title>`);
var _tmpl$72 = /* @__PURE__ */ template(`<mark>`);
var SearchView = mvvm.createMvvmView((view) => {
  const generatedId = createUniqueId();
  const id = () => view.bind((v) => v.id) || generatedId;
  const listId = () => `${id()}-results`;
  const optionId = (index) => `${id()}-result-${index}`;
  const hasDropdown = () => view.bind((v) => v.isOpen && (v.rows.length > 0 || v.hint !== ""));
  const onKeyDown = (event) => {
    const model = view.viewModel;
    if (event.key === "ArrowDown")
      model.moveActive(1);
    else if (event.key === "ArrowUp")
      model.moveActive(-1);
    else if (event.key === "Enter" && model.isOpen && model.activeIndex >= 0)
      model.selectActive();
    else if (event.key === "Escape")
      model.close();
    else
      return;
    event.preventDefault();
  };
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$48(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
      insert(_el$2, createComponent(UiIcon, {
        name: "search"
      }), _el$3);
      _el$3.$$keydown = onKeyDown;
      _el$3.$$input = (event) => view.viewModel.setQuery(event.currentTarget.value);
      insert(_el$2, createComponent(Show, {
        get when() {
          return view.bind((v) => v.query !== "");
        },
        get children() {
          var _el$4 = _tmpl$47();
          _el$4.$$click = () => view.viewModel.clear();
          insert(_el$4, createComponent(UiIcon, {
            name: "close"
          }));
          createRenderEffect(() => setAttribute(_el$4, "aria-label", view.bind((v) => v.clearLabel)));
          return _el$4;
        }
      }), null);
      insert(_el$, createComponent(Show, {
        get when() {
          return hasDropdown();
        },
        get children() {
          var _el$5 = _tmpl$310(), _el$7 = _el$5.firstChild;
          _el$5.$$mousedown = (event) => event.preventDefault();
          insert(_el$5, createComponent(Show, {
            get when() {
              return view.bind((v) => v.hint);
            },
            get children() {
              var _el$6 = _tmpl$214();
              insert(_el$6, () => view.bind((v) => v.hint));
              return _el$6;
            }
          }), _el$7);
          insert(_el$7, createComponent(For, {
            get each() {
              return view.bind((v) => v.rows);
            },
            children: (row, index) => (() => {
              var _el$8 = _tmpl$63(), _el$9 = _el$8.firstChild;
              _el$8.$$click = () => view.viewModel.select(index());
              insert(_el$9, createComponent(For, {
                get each() {
                  return row.segments;
                },
                children: (segment) => segment.isMatch ? (() => {
                  var _el$1 = _tmpl$72();
                  insert(_el$1, () => segment.text);
                  return _el$1;
                })() : memo(() => segment.text)
              }));
              insert(_el$8, createComponent(Show, {
                get when() {
                  return row.meta;
                },
                get children() {
                  var _el$0 = _tmpl$54();
                  insert(_el$0, () => row.meta);
                  return _el$0;
                }
              }), null);
              createRenderEffect((_p$) => {
                var _v$9 = optionId(index()), _v$0 = !!(view.bind((v) => v.activeIndex) === index()), _v$1 = view.bind((v) => v.activeIndex) === index();
                _v$9 !== _p$.e && setAttribute(_el$8, "id", _p$.e = _v$9);
                _v$0 !== _p$.t && _el$8.classList.toggle("ui-search__result--active", _p$.t = _v$0);
                _v$1 !== _p$.a && setAttribute(_el$8, "aria-selected", _p$.a = _v$1);
                return _p$;
              }, {
                e: undefined,
                t: undefined,
                a: undefined
              });
              return _el$8;
            })()
          }));
          createRenderEffect(() => setAttribute(_el$7, "id", listId()));
          return _el$5;
        }
      }), null);
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => ["ui-search", ...v.classes].join(" ")), _v$2 = id(), _v$3 = view.bind((v) => v.label || v.placeholder), _v$4 = hasDropdown(), _v$5 = listId(), _v$6 = view.bind((v) => v.isOpen && v.activeIndex >= 0 ? optionId(v.activeIndex) : undefined), _v$7 = view.bind((v) => v.placeholder), _v$8 = !view.bind((v) => v.isEnabled);
        _v$ !== _p$.e && className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$3, "id", _p$.t = _v$2);
        _v$3 !== _p$.a && setAttribute(_el$3, "aria-label", _p$.a = _v$3);
        _v$4 !== _p$.o && setAttribute(_el$3, "aria-expanded", _p$.o = _v$4);
        _v$5 !== _p$.i && setAttribute(_el$3, "aria-controls", _p$.i = _v$5);
        _v$6 !== _p$.n && setAttribute(_el$3, "aria-activedescendant", _p$.n = _v$6);
        _v$7 !== _p$.s && setAttribute(_el$3, "placeholder", _p$.s = _v$7);
        _v$8 !== _p$.h && (_el$3.disabled = _p$.h = _v$8);
        return _p$;
      }, {
        e: undefined,
        t: undefined,
        a: undefined,
        o: undefined,
        i: undefined,
        n: undefined,
        s: undefined,
        h: undefined
      });
      createRenderEffect(() => _el$3.value = view.bind((v) => v.query));
      return _el$;
    }
  });
});
delegateEvents(["input", "keydown", "click", "mousedown"]);

// ../../frontend/web/packages/ui/src/views/StackView.tsx
var _tmpl$49 = /* @__PURE__ */ template(`<div>`);
var SPACE = {
  none: "0px",
  small: "var(--ui-space-2)",
  medium: "var(--ui-space-3)",
  large: "var(--ui-space-4)"
};
var length = (space) => typeof space === "number" ? `${space}px` : SPACE[space];
function StackItem(props) {
  const view = useMvvmView(props.model);
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$49();
      insert(_el$, createComponent(ViewSelector, {
        get model() {
          return view.bind((v) => v.content);
        }
      }));
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => ["ui-stack__item", v.size === "fill" ? "ui-stack__item--fill" : typeof v.size === "number" ? "ui-stack__item--fixed" : "", ...v.classes].filter(Boolean).join(" ")), _v$2 = view.bind((v) => typeof v.size === "number" ? `${v.size}px` : undefined);
        _v$ !== _p$.e && className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && setStyleProperty(_el$, "--ui-item-size", _p$.t = _v$2);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      return _el$;
    }
  });
}
var StackView = mvvm.createMvvmView((view) => createComponent(Show, {
  get when() {
    return view.bind((v) => v.isVisible);
  },
  get children() {
    var _el$2 = _tmpl$49();
    insert(_el$2, createComponent(For, {
      get each() {
        return view.bind((v) => v.items.slice());
      },
      children: (item) => createComponent(StackItem, {
        model: item
      })
    }));
    createRenderEffect((_p$) => {
      var _v$3 = view.bind((v) => v.id) || undefined, _v$4 = view.bind((v) => ["ui-stack", `ui-stack--${v.orientation}`, ...v.wraps ? ["ui-stack--wrap"] : [], ...v.classes].join(" ")), _v$5 = view.bind((v) => length(v.gap)), _v$6 = view.bind((v) => v.alignItems === "start" || v.alignItems === "end" ? `flex-${v.alignItems}` : v.alignItems);
      _v$3 !== _p$.e && setAttribute(_el$2, "id", _p$.e = _v$3);
      _v$4 !== _p$.t && className(_el$2, _p$.t = _v$4);
      _v$5 !== _p$.a && setStyleProperty(_el$2, "--ui-stack-gap", _p$.a = _v$5);
      _v$6 !== _p$.o && setStyleProperty(_el$2, "--ui-stack-align", _p$.o = _v$6);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$2;
  }
}));

// ../../frontend/web/packages/ui/src/views/ToasterView.tsx
var _tmpl$50 = /* @__PURE__ */ template(`<div class=ui-toast>`);
var _tmpl$215 = /* @__PURE__ */ template(`<div class=ui-toast-region role=status aria-live=polite>`);
var ToasterView = mvvm.createMvvmView((view) => (() => {
  var _el$ = _tmpl$215();
  insert(_el$, createComponent(Show, {
    get when() {
      return view.bind((v) => v.message);
    },
    get children() {
      var _el$2 = _tmpl$50();
      insert(_el$2, () => view.bind((v) => v.message));
      return _el$2;
    }
  }));
  return _el$;
})());
// ../../frontend/web/packages/ui/src/views/DropdownFieldView.tsx
var _tmpl$51 = /* @__PURE__ */ template(`<div><label class=ui-field-label></label><select class=ui-field>`);
var _tmpl$216 = /* @__PURE__ */ template(`<option>`);
var DropdownFieldView = mvvm.createMvvmView((view) => {
  const generatedId = createUniqueId();
  const id = () => view.bind((v) => v.id) || generatedId;
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$51(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
      insert(_el$2, () => view.bind((v) => v.labelText));
      _el$3.addEventListener("change", (event) => view.viewModel.setValue(event.currentTarget.value));
      insert(_el$3, createComponent(For, {
        get each() {
          return view.bind((v) => v.options.slice());
        },
        children: (option) => (() => {
          var _el$4 = _tmpl$216();
          _el$4.value = option;
          insert(_el$4, option);
          createRenderEffect(() => _el$4.selected = view.bind((v) => v.value === option));
          return _el$4;
        })()
      }));
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => ["ui-text-field", ...v.classes].join(" ")), _v$2 = id(), _v$3 = id(), _v$4 = !view.bind((v) => v.isEnabled);
        _v$ !== _p$.e && className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$2, "for", _p$.t = _v$2);
        _v$3 !== _p$.a && setAttribute(_el$3, "id", _p$.a = _v$3);
        _v$4 !== _p$.o && (_el$3.disabled = _p$.o = _v$4);
        return _p$;
      }, {
        e: undefined,
        t: undefined,
        a: undefined,
        o: undefined
      });
      return _el$;
    }
  });
});
// ../../frontend/web/packages/ui/src/views/SwitchFieldView.tsx
var _tmpl$55 = /* @__PURE__ */ template(`<label><input type=checkbox role=switch><span class=ui-switch__text>`);
var SwitchFieldView = mvvm.createMvvmView((view) => {
  const generatedId = createUniqueId();
  const id = () => view.bind((v) => v.id) || generatedId;
  return createComponent(Show, {
    get when() {
      return view.bind((v) => v.isVisible);
    },
    get children() {
      var _el$ = _tmpl$55(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
      _el$2.addEventListener("change", (event) => view.viewModel.setValue(event.currentTarget.checked));
      insert(_el$3, () => view.bind((v) => v.labelText));
      createRenderEffect((_p$) => {
        var _v$ = view.bind((v) => ["ui-switch", ...v.classes].join(" ")), _v$2 = id(), _v$3 = id(), _v$4 = !view.bind((v) => v.isEnabled);
        _v$ !== _p$.e && className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$, "for", _p$.t = _v$2);
        _v$3 !== _p$.a && setAttribute(_el$2, "id", _p$.a = _v$3);
        _v$4 !== _p$.o && (_el$2.disabled = _p$.o = _v$4);
        return _p$;
      }, {
        e: undefined,
        t: undefined,
        a: undefined,
        o: undefined
      });
      createRenderEffect(() => _el$2.checked = view.bind((v) => v.value));
      return _el$;
    }
  });
});

// ../../frontend/web/packages/ui/src/views/DynamicFormView.tsx
var _tmpl$56 = /* @__PURE__ */ template(`<p class=ui-dynamic-form__loading>`);
var _tmpl$217 = /* @__PURE__ */ template(`<p class=ui-sheet__error role=alert>`);
var _tmpl$311 = /* @__PURE__ */ template(`<form><h2 class=ui-dynamic-form__title></h2><div class=ui-sheet__actions>`);
var _tmpl$410 = /* @__PURE__ */ template(`<section class=ui-dynamic-form__rows><h3 class=ui-dynamic-form__rows-title>`);
var _tmpl$57 = /* @__PURE__ */ template(`<fieldset class=ui-dynamic-form__row><legend class=ui-dynamic-form__row-title>`);
function FieldView(props) {
  const field = props.field;
  if (field instanceof DropdownFieldViewModel)
    return createComponent(DropdownFieldView, {
      model: field
    });
  if (field instanceof SwitchFieldViewModel)
    return createComponent(SwitchFieldView, {
      model: field
    });
  return createComponent(TextFieldView, {
    model: field
  });
}
var DynamicFormView = mvvm.createMvvmView((view) => createComponent(Show, {
  get when() {
    return view.bind((v) => v.isVisible);
  },
  get children() {
    var _el$ = _tmpl$311(), _el$2 = _el$.firstChild, _el$5 = _el$2.nextSibling;
    _el$.addEventListener("submit", (event) => {
      event.preventDefault();
      view.viewModel.submit.execute();
    });
    insert(_el$2, () => view.bind((v) => v.titleText));
    insert(_el$, createComponent(Show, {
      get when() {
        return view.bind((v) => v.state === "loading");
      },
      get children() {
        var _el$3 = _tmpl$56();
        insert(_el$3, () => view.viewModel.loadingText);
        return _el$3;
      }
    }), _el$5);
    insert(_el$, createComponent(For, {
      get each() {
        return view.bind((v) => v.items.slice());
      },
      children: (item) => item.kind === "field" ? createComponent(FieldView, {
        get field() {
          return item.field;
        }
      }) : (() => {
        var _el$6 = _tmpl$410(), _el$7 = _el$6.firstChild;
        insert(_el$7, () => item.labelText);
        insert(_el$6, createComponent(For, {
          get each() {
            return item.rows;
          },
          children: (row) => (() => {
            var _el$8 = _tmpl$57(), _el$9 = _el$8.firstChild;
            insert(_el$9, () => row.labelText);
            insert(_el$8, createComponent(For, {
              get each() {
                return row.fields;
              },
              children: (field) => createComponent(FieldView, {
                field
              })
            }), null);
            return _el$8;
          })()
        }), null);
        return _el$6;
      })()
    }), _el$5);
    insert(_el$, createComponent(Show, {
      get when() {
        return view.bind((v) => v.errorText);
      },
      get children() {
        var _el$4 = _tmpl$217();
        insert(_el$4, () => view.bind((v) => v.errorText));
        return _el$4;
      }
    }), _el$5);
    insert(_el$5, createComponent(ButtonView, {
      get model() {
        return view.viewModel.cancel;
      }
    }), null);
    insert(_el$5, createComponent(ButtonView, {
      get model() {
        return view.viewModel.submit;
      }
    }), null);
    createRenderEffect(() => className(_el$, view.bind((v) => ["ui-dynamic-form", ...v.classes].join(" "))));
    return _el$;
  }
}));
// ../../frontend/web/packages/formpage/resources/texts.de.json
var texts_de_default = {
  submitText: "Speichern",
  cancelText: "Abbrechen",
  loadingText: "Formular wird geladen …"
};

// ../../shared/typescript/packages/core/src/lazy/lazy.ts
function lazy2(create, options = {}) {
  const state = { made: false };
  return () => {
    if (!state.made) {
      const value = create();
      state.value = value;
      state.made = true;
      if (options.retryRejected && value instanceof Promise) {
        value.catch(() => {
          if (state.value === value)
            state.made = false;
        });
      }
    }
    return state.value;
  };
}
// ../../shared/typescript/packages/compression/src/DeflateApi.ts
class DeflateApi {
  static async compress(bytes) {
    return DeflateApi.run(bytes, new CompressionStream("deflate-raw"));
  }
  static async decompress(bytes) {
    try {
      return await DeflateApi.run(bytes, new DecompressionStream("deflate-raw"));
    } catch (error) {
      throw new Error("The data cannot be decompressed (it is damaged or not compressed with deflate-raw).", { cause: error });
    }
  }
  static async run(bytes, transform) {
    const stream = new Blob([bytes]).stream().pipeThrough(transform);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
}
// ../../shared/typescript/packages/crypto/src/Base64UrlApi.ts
class Base64UrlApi {
  static encode(bytes) {
    let binary = "";
    for (const byte of bytes)
      binary += String.fromCharCode(byte);
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  }
  static decode(text) {
    if (!/^[A-Za-z0-9_-]*$/.test(text))
      throw new Error("The text is not base64url: it has characters outside A-Z, a-z, 0-9, - and _.");
    const padded = text.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - text.length % 4) % 4);
    let binary;
    try {
      binary = atob(padded);
    } catch (error) {
      throw new Error("The text is not base64url: its length cannot be right.", { cause: error });
    }
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
}
// ../../shared/typescript/packages/crypto/src/CryptoApi.ts
var RSA = { name: "RSA-OAEP", hash: "SHA-256" };
var MODULUS_BYTES = 256;
var IV_BYTES = 12;
var TAG_BYTES = 16;

class CryptoApi {
  static async generateKeyPair() {
    const pair = await crypto.subtle.generateKey({ ...RSA, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ["encrypt", "decrypt"]);
    return {
      publicKey: new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey)),
      privateKey: new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey))
    };
  }
  static async seal(publicKey, plain) {
    const wrapKey = await crypto.subtle.importKey("spki", publicKey, RSA, false, ["encrypt"]);
    const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const body = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plain));
    const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, wrapKey, await crypto.subtle.exportKey("raw", aesKey)));
    if (wrapped.length !== MODULUS_BYTES)
      throw new Error(`The public key is not an RSA 2048 key: the wrapped key is ${wrapped.length} bytes, expected ${MODULUS_BYTES}.`);
    return CryptoApi.join(wrapped, iv, body);
  }
  static async open(privateKey, sealed) {
    if (sealed.length < MODULUS_BYTES + IV_BYTES + TAG_BYTES)
      throw new Error(`The sealed value is too short (${sealed.length} bytes, at least ${MODULUS_BYTES + IV_BYTES + TAG_BYTES} needed); copy it completely.`);
    try {
      const unwrapKey = await crypto.subtle.importKey("pkcs8", privateKey, RSA, false, ["decrypt"]);
      const aesBytes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, unwrapKey, sealed.slice(0, MODULUS_BYTES));
      const aesKey = await crypto.subtle.importKey("raw", aesBytes, { name: "AES-GCM" }, false, ["decrypt"]);
      const iv = sealed.slice(MODULUS_BYTES, MODULUS_BYTES + IV_BYTES);
      return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, sealed.slice(MODULUS_BYTES + IV_BYTES)));
    } catch (error) {
      throw new Error("The sealed value cannot be opened (it was sealed for another key, or it is damaged).", { cause: error });
    }
  }
  static async fingerprint(publicKey) {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", publicKey));
    const hex = Array.from(hash.slice(0, 4), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 4)}-${hex.slice(4)}`;
  }
  static join(...parts) {
    const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }
}
// ../../shared/typescript/packages/forms/src/transport/FormAnswerApi.ts
class FormAnswerApi {
  static async seal(request, delta, nowMs) {
    const bytes = await DeflateApi.compress(new TextEncoder().encode(JSON.stringify({ i: request.id, t: nowMs, d: delta })));
    return Base64UrlApi.encode(await CryptoApi.seal(request.publicKey, bytes));
  }
  static async open(privateKey, sealed, expected) {
    const plain = await CryptoApi.open(privateKey, Base64UrlApi.decode(sealed));
    const content = JSON.parse(new TextDecoder().decode(await DeflateApi.decompress(plain)));
    if (typeof content.i !== "string" || typeof content.t !== "number" || typeof content.d !== "object" || content.d === null || Array.isArray(content.d)) {
      throw new Error("The answer has an unexpected content.");
    }
    if (content.i !== expected.id)
      throw new Error("The answer belongs to another request.");
    if (Math.abs(expected.nowMs - content.t) > expected.maxAgeMs)
      throw new Error(`The answer is older than ${Math.round(expected.maxAgeMs / 60000)} minutes; ask again.`);
    return content.d;
  }
}
// ../../shared/typescript/packages/forms/src/transport/FormRequestApi.ts
var ID2 = /^[A-Za-z0-9_-]{8,64}$/;

class FormRequestApi {
  static async build(request) {
    if (!ID2.test(request.id))
      throw new Error(`The request id must be 8 to 64 letters, digits, - or _, got "${request.id}".`);
    const form = await DeflateApi.compress(new TextEncoder().encode(JSON.stringify(request.description)));
    return `id=${request.id}&key=${Base64UrlApi.encode(request.publicKey)}&form=${Base64UrlApi.encode(form)}`;
  }
  static async parse(fragment) {
    const parameters = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
    const id = FormRequestApi.required(parameters, "id");
    if (!ID2.test(id))
      throw new Error(`The link has an id that cannot be right: "${id}".`);
    const publicKey = Base64UrlApi.decode(FormRequestApi.required(parameters, "key"));
    const form = FormRequestApi.required(parameters, "form");
    let description;
    try {
      description = JSON.parse(new TextDecoder().decode(await DeflateApi.decompress(Base64UrlApi.decode(form))));
    } catch (error) {
      throw new Error("The link does not hold a readable form description (copy it completely).", { cause: error });
    }
    return { id, publicKey, description };
  }
  static required(parameters, name) {
    const value = parameters.get(name);
    if (value === null || value === "")
      throw new Error(`The link has no "${name}" (it must look like #id=...&key=...&form=...).`);
    return value;
  }
}
// ../../frontend/web/packages/formpage/src/HashFormRequestApi.ts
class HashFormRequestApi {
  fragment;
  request = lazy2(() => FormRequestApi.parse(this.fragment));
  constructor(fragment) {
    this.fragment = fragment;
  }
  get() {
    return this.request();
  }
}

// ../../frontend/web/packages/formpage/src/HashFormSource.ts
class HashFormSource {
  request;
  constructor(request) {
    this.request = request;
  }
  async load() {
    return (await this.request.get()).description;
  }
}

// ../../frontend/web/packages/formpage/src/TelegramFormTarget.ts
class TelegramFormTarget {
  request;
  telegram;
  nowMs;
  constructor(request, telegram, nowMs) {
    this.request = request;
    this.telegram = telegram;
    this.nowMs = nowMs;
  }
  async submit(delta) {
    this.telegram.sendData(await FormAnswerApi.seal(await this.request.get(), delta, this.nowMs()));
  }
  async cancel() {
    this.telegram.close();
  }
}

// ../../frontend/web/packages/formpage/src/TelegramMiniAppApi.ts
var SEND_DATA_LIMIT = 4096;

class TelegramMiniAppApi {
  webApp;
  constructor(webApp) {
    this.webApp = webApp;
  }
  static fromWindow(win) {
    const webApp = win.Telegram?.WebApp;
    if (webApp === undefined)
      throw new Error("This page works only when it is opened from Telegram: the Telegram script (telegram-web-app.js) did not give a Mini App object.");
    return new TelegramMiniAppApi(webApp);
  }
  ready() {
    this.webApp.ready();
  }
  sendData(data) {
    const bytes = new TextEncoder().encode(data).length;
    if (bytes > SEND_DATA_LIMIT)
      throw new Error(`The answer is ${bytes} bytes, Telegram allows ${SEND_DATA_LIMIT} for a Mini App; change fewer values at once.`);
    this.webApp.sendData(data);
  }
  close() {
    this.webApp.close();
  }
}

// ../../frontend/web/packages/formpage/src/index.ts
var telegram = TelegramMiniAppApi.fromWindow(window);
var request = new HashFormRequestApi(location.hash);
var form = new DynamicFormViewModel(new HashFormSource(request), new TelegramFormTarget(request, telegram, () => Date.now()), texts_de_default);
render(() => DynamicFormView({ model: form }), document.getElementById("app"));
telegram.ready();
