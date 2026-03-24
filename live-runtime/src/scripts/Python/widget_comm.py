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


def _get_comm_class():
    """Lazily create the Comm subclass (requires 'comm' package)."""
    global _Comm
    if _Comm is not None:
        return _Comm

    from comm import BaseComm

    class Comm(BaseComm):
        """Custom Comm that sends messages to the main thread via JS callback."""

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

    _Comm = Comm
    return _Comm


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
