declare var window: Window;

export class Connection {
  constructor(
    private socket: FrameSocket,
    private cid: string,
    public target: Window,
    public targetFrame: HTMLIFrameElement | undefined,
  ) {}
  send(data: any): void {
    const message = {
      type: "FrameSocket:data",
      cid: this.cid,
      data
    };
    this.target.postMessage(message, "*");
  }
  public ondata: (data: any) => void = () => {};
}
interface Syn {
  sid: string;
  nonce: string;
  target: Window;
}
interface Synack {
  nonce: string;
  synacknonce: string;
  target: Window;
  targetFrame: HTMLIFrameElement;
}
export class FrameSocket {
  private syns: Syn[] = [];
  private synacks: {
    [sid: string]: Synack[];
  } = {};
  private connections: { [cid: string]: Connection } = {};
  constructor(self: Window = window) {
    self.addEventListener("message", (event: MessageEvent) => {
      if (!event.data || !event.data.type) return;
      if (event.data.type === "FrameSocket:syn") {
        this.onSynEvent(event);
      } else if (event.data.type === "FrameSocket:synack") {
        this.onSynackEvent(event);
      } else if (event.data.type === "FrameSocket:ack") {
        this.onAckEvent(event);
      } else if (event.data.type === "FrameSocket:data") {
        this.onDataEvent(event);
      } else {
      }
    });
  }
  connect(target: Window) {
    const syn = {
      sid: randomid(),
      nonce: randomid(),
      target: target
    };
    this.syns.push(syn);
    const message = {
      type: "FrameSocket:syn",
      sid: syn.sid,
      nonce: syn.nonce
    };
    target.postMessage(message, "*");
  }
  public onconnection: (connection: Connection) => void = () => {};
  private onSynEvent(event: MessageEvent): void {
    const synack = (this.synacks[event.data.sid] = <Synack[]>[]);
    // [].slice.call(self.frames)
    [].slice.call(self.document.querySelectorAll("iframe"))
      .forEach((frame: HTMLIFrameElement) => {
      const synacknonce = randomid();
      synack.push({
        targetFrame: frame,
        target: frame.contentWindow,
        nonce: event.data.nonce,
        synacknonce: synacknonce
      });
      const message = {
        type: "FrameSocket:synack",
        sid: event.data.sid,
        synacknonce: synacknonce
      };
      frame.contentWindow.postMessage(message, "*");
    });
  }
  private onSynackEvent(event: MessageEvent): void {
    this.syns.forEach((syn, i, syns) => {
      if (event.data.sid !== syn.sid) return;
      const message = {
        type: "FrameSocket:ack",
        sid: syn.sid,
        synacknonce: event.data.synacknonce,
        nonce: syn.nonce
      };
      syn.target.postMessage(message, "*");
      const cid = event.data.synacknonce + syn.nonce;
      this.connections[cid] = new Connection(this, cid, syn.target, null);
      this.onconnection(this.connections[cid]);
      syns.splice(i, 1);
    });
  }
  private onAckEvent(event: MessageEvent) {
    (this.synacks[event.data.sid] || <Synack[]>[]).forEach(
      (synack: Synack, i: number, synacks: Synack[]) => {
        if (
          !synack ||
          synack.synacknonce !== event.data.synacknonce ||
          synack.nonce !== event.data.nonce
        ) {
          return;
        }
        const cid = synack.synacknonce + synack.nonce;
        const target = synack.target;
        this.connections[cid] = new Connection(this, cid, target, synack.targetFrame);
        this.onconnection(this.connections[cid]);
        synacks.splice(i, 1);
        delete this.synacks[event.data.sid];
      }
    );
  }
  private onDataEvent(event: MessageEvent): void {
    if (!this.connections[event.data.cid]) return;
    let connection = this.connections[event.data.cid];
    if (connection.ondata) {
      connection.ondata(event.data.data);
    }
  }
}
function randomid() {
  return (
    Date.now().toString(32) +
    Math.random()
      .toString(32)
      .substring(2)
  );
}
(<any> window).FrameSocket = FrameSocket;
