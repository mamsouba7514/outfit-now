type StatusHandler = (agentId: string, status: string) => void;

export function connectDashWs(onStatus: StatusHandler): () => void {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000';
  let ws: WebSocket | null = null;
  let retryDelay = 1000;
  let stopped = false;

  function connect() {
    ws = new WebSocket(`${WS_URL}/v1/dash/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as
        | { type: 'agent_status'; agentId: string; status: string }
        | { type: 'init'; agents: { id: string; status: string }[] };

      if (data.type === 'agent_status') {
        onStatus(data.agentId, data.status);
      } else if (data.type === 'init') {
        for (const agent of data.agents) onStatus(agent.id, agent.status);
      }
    };

    ws.onclose = () => {
      if (stopped) return;
      setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, 30_000);
        connect();
      }, retryDelay);
    };

    ws.onopen = () => {
      retryDelay = 1000;
    };
  }

  connect();
  return () => {
    stopped = true;
    ws?.close();
  };
}
