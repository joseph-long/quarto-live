import * as WebR from 'webr';
import * as Comlink from 'comlink';
import type { PyodideAPIWorker, PyodideWorker } from './pyodide-worker';
import { WebRExerciseEditor, PyodideExerciseEditor } from './editor';
import { highlightR, highlightPython, interpolate } from './highlighter';
import { WebREvaluator } from './evaluate-webr';
import { PyodideEvaluator } from './evaluate-pyodide';
import { WebREnvironment, PyodideEnvironment } from './environment';
import { WebRGrader } from './grader-webr';
import { PyodideGrader } from './grader-pyodide';
import { comlinkTransfer, imageBitmapTransfer, mapTransfer, proxyTransfer } from './pyodide-proxy';
import { b64Encode, b64Decode, collapsePath } from './utils';
import './css/live-runtime.css';
import './css/highlighting.css';
import './css/reveal.css';

type WebRInitData = {
  packages: {
    pkgs: string[],
    repos: string[],
  }
  options: WebR.WebROptions,
  render_df: string;
}

async function setupR(webR: WebR.WebR, data: WebRInitData) {
  await webR.evalRVoid('options("webr.render.df" = x)', {
    env: { x: data.render_df || "default" },
  });
  return await webR.evalRVoid(atob(require('./scripts/R/setup.R')));
}

async function setupPython(pyodide: PyodideAPIWorker) {
  await pyodide.runPythonAsync(atob(require('./scripts/Python/setup.py')))
  const matplotlib_display = atob(require('./scripts/Python/matplotlib_display.py'));
  await pyodide.FS.mkdirTree('/pyodide');
  await pyodide.FS.writeFile('/pyodide/matplotlib_display.py', matplotlib_display);

  // Write comm bridge module to worker filesystem so Python can import it
  const widget_comm = atob(require('./scripts/Python/widget_comm.py'));
  await pyodide.FS.writeFile('/pyodide/widget_comm.py', widget_comm);
}

type CommMessage = {
  msgType: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

async function setupCommBridge(
  pyodide: PyodideAPIWorker,
  pyodideWorker: Comlink.Remote<PyodideWorker>,
  onCommMessage?: (msg: CommMessage) => void,
) {
  // Register callback on worker that receives comm messages from Python
  await pyodideWorker.registerCommCallback(
    Comlink.proxy((msgType: string, contentJson: string, metadataJson: string) => {
      const msg: CommMessage = {
        msgType,
        content: JSON.parse(contentJson),
        metadata: JSON.parse(metadataJson),
      };
      // Store messages globally for inspection/testing
      ((window as any).__quarto_live_comms ??= []).push(msg);
      if (onCommMessage) {
        onCommMessage(msg);
      }
    })
  );

  // Initialize the Python side of the comm bridge.
  // Uses Python-level try/except because the JS-to-Python proxy call
  // can hang in Firefox if the import fails at the Pyodide level.
  try {
    await pyodide.runPythonAsync(`
try:
    from widget_comm import init_comm_bridge
    from js import _sendCommMessage
    init_comm_bridge(_sendCommMessage)
except Exception as _e:
    pass
    `);
  } catch {
    // comm package not available, bridge not initialized
  }
}

async function startPyodideWorker(options) {
  const workerUrl = new URL("./pyodide-worker.js", import.meta.url);
  const worker = new Worker(workerUrl, { type: "module" });
  const pyodideWorker = Comlink.wrap<PyodideWorker>(worker);
  const pyodide = await pyodideWorker.init(options);
  Comlink.transferHandlers.set("PyProxy", proxyTransfer);
  Comlink.transferHandlers.set("Comlink", comlinkTransfer);
  Comlink.transferHandlers.set("ImageBitmap", imageBitmapTransfer);
  Comlink.transferHandlers.set("Map", mapTransfer);

  // See pyodide-worker.ts
  Comlink.transferHandlers.delete("throw");

  return { pyodide, pyodideWorker };
}

declare global {
  interface Window {
    _exercise_ojs_runtime?: {
      PyodideExerciseEditor: typeof PyodideExerciseEditor;
      PyodideEvaluator: typeof PyodideEvaluator;
      PyodideEnvironment: typeof PyodideEnvironment;
      PyodideGrader: typeof PyodideGrader;
      WebR: typeof WebR;
      WebRExerciseEditor: typeof WebRExerciseEditor;
      WebREvaluator: typeof WebREvaluator;
      WebRGrader: typeof WebRGrader;
      WebREnvironment: typeof WebREnvironment;
      highlightR: typeof highlightR;
      highlightPython: typeof highlightPython;
      interpolate: typeof interpolate;
      setupR: typeof setupR;
      setupPython: typeof setupPython;
      setupCommBridge: typeof setupCommBridge;
      startPyodideWorker: typeof startPyodideWorker;
      b64Decode: typeof b64Decode;
      b64Encode: typeof b64Encode;
      collapsePath: typeof collapsePath;
    };
  }
}

window._exercise_ojs_runtime = {
  PyodideExerciseEditor,
  PyodideEvaluator,
  PyodideEnvironment,
  PyodideGrader,
  WebR,
  WebRExerciseEditor,
  WebREvaluator,
  WebRGrader,
  WebREnvironment,
  highlightR,
  highlightPython,
  interpolate,
  setupR,
  setupPython,
  setupCommBridge,
  startPyodideWorker,
  b64Encode,
  b64Decode,
  collapsePath,
};

export {
  PyodideExerciseEditor,
  PyodideEvaluator,
  PyodideEnvironment,
  PyodideGrader,
  WebR,
  WebRExerciseEditor,
  WebREvaluator,
  WebRGrader,
  WebREnvironment,
  highlightR,
  highlightPython,
  interpolate,
  setupR,
  setupPython,
  setupCommBridge,
  startPyodideWorker,
  b64Encode,
  b64Decode,
  collapsePath,
}
