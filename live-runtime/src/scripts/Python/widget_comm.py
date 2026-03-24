"""Comm bridge for ipywidgets in quarto-live.

Provides a custom Comm class that routes widget comm messages from
Python (in a Pyodide Web Worker) to JavaScript (main thread) via a
JS callback function set on the worker global scope.

Usage: call init_comm_bridge() after Pyodide is initialized and
before any ipywidgets code runs. Requires the 'comm' package.
"""
import json


_js_send_comm = None
_Comm = None
_comm_registry = {}


def _get_comm_class():
    """Lazily create the Comm subclass (requires 'comm' package)."""
    global _Comm
    if _Comm is not None:
        return _Comm

    from comm import BaseComm

    class Comm(BaseComm):
        """Custom Comm that sends messages to the main thread via JS callback."""

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            _comm_registry[self.comm_id] = self

        def publish_msg(self, msg_type, data=None, metadata=None, buffers=None, **keys):
            data = {} if data is None else data
            metadata = {} if metadata is None else metadata
            content = dict(data=data, comm_id=self.comm_id, **keys)

            if _js_send_comm is not None:
                _js_send_comm(
                    msg_type,
                    json.dumps(content),
                    json.dumps(metadata),
                )

        def close(self, *args, **kwargs):
            _comm_registry.pop(self.comm_id, None)
            super().close(*args, **kwargs)

    _Comm = Comm
    return _Comm


def receive_comm_msg(comm_id, data_json):
    """Handle an incoming comm_msg from JavaScript.

    Dispatches the message to the Python Comm instance registered
    under the given comm_id, triggering widget state updates.
    """
    comm = _comm_registry.get(comm_id)
    if comm is not None:
        data = json.loads(data_json)
        msg = {"content": {"data": data}, "buffers": []}
        comm.handle_msg(msg)


def init_comm_bridge(send_fn):
    """Initialize the comm bridge with a JS callback function.

    Args:
        send_fn: A JavaScript function (JsProxy) that will be called with
                 (msg_type: str, content_json: str, metadata_json: str)
                 whenever Python sends a comm message.

    Raises:
        ImportError: If the 'comm' package is not installed.
    """
    import comm
    global _js_send_comm
    _js_send_comm = send_fn
    comm.create_comm = _get_comm_class()
    _patch_output_widget()


def _patch_output_widget():
    """Patch ipywidgets Output widget for non-kernel (Pyodide) operation.

    The standard Output widget relies on the Jupyter kernel's message
    routing to capture output. In Pyodide there is no kernel, so we
    monkey-patch __enter__/__exit__/clear_output to capture stdout
    and update self.outputs directly.
    """
    import sys
    from io import StringIO

    try:
        import ipywidgets
    except ImportError:
        return

    def _clear_output(self, wait=False):
        self.outputs = ()

    def _enter(self):
        if not hasattr(self, '_quarto_captures'):
            self._quarto_captures = []
        self._quarto_captures.append(sys.stdout)
        sys.stdout = StringIO()
        return self

    def _exit(self, etype, evalue, tb):
        if not hasattr(self, '_quarto_captures') or not self._quarto_captures:
            return None
        captured = sys.stdout.getvalue() if hasattr(sys.stdout, 'getvalue') else ''
        sys.stdout = self._quarto_captures.pop()
        if captured.strip():
            self.outputs = self.outputs + (
                {'output_type': 'stream', 'name': 'stdout', 'text': captured},
            )
        return True

    ipywidgets.Output.clear_output = _clear_output
    ipywidgets.Output.__enter__ = _enter
    ipywidgets.Output.__exit__ = _exit
