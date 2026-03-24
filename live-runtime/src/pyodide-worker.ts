import * as Comlink from 'comlink';
import { loadPyodide, PyodideAPI } from 'pyodide';
import { comlinkTransfer, imageBitmapTransfer, mapTransfer, proxyTransfer } from './pyodide-proxy';
import { PyProxy } from 'pyodide/ffi';

declare global {
  interface Window {
    pyodide?: PyodideAPIWorker;
  }
}

export type PyodideWorker = {
  init: typeof init;
  registerCommCallback: typeof registerCommCallback;
}

export type PyodideAPIWorker = PyodideAPI & {
  _module: {
    PyProxy_getPtr: (obj: PyProxy) => number;
  };
  _FS: typeof FS;
}

const FS = {
  mkdirTree(path: string) {
    self.pyodide._FS.mkdirTree(path);
  },
  writeFile(path: string, data: ArrayBufferView) {
    self.pyodide._FS.writeFile(path, data);
  }
}

async function init(options) {
  self.pyodide = await loadPyodide(options) as PyodideAPIWorker;
  self.pyodide.registerComlink(Comlink);
  self.pyodide._FS = self.pyodide.FS;
  self.pyodide.FS = { ...self.pyodide.FS, ...FS };
  Comlink.transferHandlers.set("PyProxy", proxyTransfer);
  Comlink.transferHandlers.set("Comlink", comlinkTransfer);
  Comlink.transferHandlers.set("ImageBitmap", imageBitmapTransfer);
  Comlink.transferHandlers.set("Map", mapTransfer);

  // FIXME: Why does this cause the error `Unserializable return value`
  Comlink.transferHandlers.delete("throw");

  return Comlink.proxy(self.pyodide);
}

// Comm bridge: stores a callback from the main thread that receives
// comm messages from Python. The callback is called by _sendCommMessage
// which is exposed on the worker global for Python to invoke.
let _commCallback: ((msgType: string, contentJson: string, metadataJson: string) => void) | null = null;

function registerCommCallback(callback: (msgType: string, contentJson: string, metadataJson: string) => void) {
  _commCallback = callback;
  // Expose a function on the worker global that Python can call via `from js import _sendCommMessage`
  (self as any)._sendCommMessage = (msgType: string, contentJson: string, metadataJson: string) => {
    if (_commCallback) {
      _commCallback(msgType, contentJson, metadataJson);
    }
  };
}

Comlink.expose({ init, registerCommCallback });
