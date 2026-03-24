import { HTMLManager } from '@jupyter-widgets/html-manager/lib/htmlmanager';
import type { IClassicComm } from '@jupyter-widgets/base';

// ipywidgets CSS for rendering widget controls
import '@jupyter-widgets/controls/css/widgets.built.css';

export type CommMessage = {
  msgType: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

// Registry of active comms by comm_id
const _comms = new Map<string, WidgetComm>();

// Callback for sending comm messages from JS to Python
let _sendToPython: ((commId: string, dataJson: string) => void) | null = null;

export class WidgetComm implements IClassicComm {
  comm_id: string;
  target_name: string;
  private _onMsg: ((msg: any) => void) | null = null;
  private _onClose: ((msg: any) => void) | null = null;

  constructor(comm_id: string, target_name: string) {
    this.comm_id = comm_id;
    this.target_name = target_name;
    _comms.set(comm_id, this);
  }

  open(data: any, callbacks?: any, metadata?: any, buffers?: any[]): string {
    // Comm is already opened by Python side; this is a no-op on JS
    return this.comm_id;
  }

  send(data: any, callbacks?: any, metadata?: any, buffers?: any[]): string {
    if (_sendToPython) {
      _sendToPython(this.comm_id, JSON.stringify(data));
    }
    return this.comm_id;
  }

  close(data?: any, callbacks?: any, metadata?: any, buffers?: any[]): string {
    _comms.delete(this.comm_id);
    return this.comm_id;
  }

  on_msg(callback: (x: any) => void): void {
    this._onMsg = callback;
  }

  on_close(callback: (x: any) => void): void {
    this._onClose = callback;
  }

  // Called when a message arrives from Python
  _handleMsg(msg: any): void {
    if (this._onMsg) this._onMsg(msg);
  }

  _handleClose(msg: any): void {
    if (this._onClose) this._onClose(msg);
    _comms.delete(this.comm_id);
  }
}

export class QuartoWidgetManager extends HTMLManager {
  private _pendingModels: Promise<any>[] = [];

  // Override display_view to bypass Lumino Widget.attach which
  // requires the host to be connected to the DOM. We render
  // widgets into containers that are attached later.
  async display_view(view: any, el: HTMLElement): Promise<void> {
    const v = await Promise.resolve(view);
    el.appendChild(v.luminoWidget.node);
  }
  async _create_comm(
    target_name: string,
    model_id: string,
    data?: any,
    metadata?: any,
    buffers?: ArrayBuffer[] | ArrayBufferView[]
  ): Promise<IClassicComm> {
    return new WidgetComm(model_id, target_name);
  }

  async _get_comm_info(): Promise<{}> {
    return {};
  }

  handleMessage(msg: CommMessage): void {
    switch (msg.msgType) {
      case 'comm_open':
        this._pendingModels.push(this._doCommOpen(msg));
        break;
      case 'comm_msg':
        this._doCommMsg(msg);
        break;
      case 'comm_close':
        this._doCommClose(msg);
        break;
    }
  }

  async waitForModels(): Promise<void> {
    await Promise.all(this._pendingModels);
    this._pendingModels = [];
  }

  async renderWidget(modelId: string, container: HTMLElement): Promise<void> {
    await this.waitForModels();
    const model = await this.get_model(modelId);
    const view = await this.create_view(model);
    await this.display_view(view, container);
  }

  private async _doCommOpen(msg: CommMessage): Promise<void> {
    const content = msg.content;
    const metadata = msg.metadata;
    const comm = new WidgetComm(
      content.comm_id as string,
      (content.target_name as string) || 'jupyter.widget.comm'
    );
    try {
      await this.handle_comm_open(comm, {
        content: content,
        metadata: metadata,
        buffers: [],
      } as any);
    } catch (err) {
      console.error('[widget-manager] handle_comm_open error:', err);
    }
  }

  private _doCommMsg(msg: CommMessage): void {
    const content = msg.content;
    const comm = _comms.get(content.comm_id as string);
    if (comm) {
      comm._handleMsg({
        content: content,
        buffers: [],
      });
    }
  }

  private _doCommClose(msg: CommMessage): void {
    const content = msg.content;
    const comm = _comms.get(content.comm_id as string);
    if (comm) {
      comm._handleClose({
        content: content,
        buffers: [],
      });
    }
  }
}

let _manager: QuartoWidgetManager | null = null;

export function getWidgetManager(): QuartoWidgetManager {
  if (!_manager) {
    _manager = new QuartoWidgetManager();
  }
  return _manager;
}

export function handleCommMessage(msg: CommMessage): void {
  getWidgetManager().handleMessage(msg);
}

export function setSendToPython(fn: (commId: string, dataJson: string) => void): void {
  _sendToPython = fn;
}
