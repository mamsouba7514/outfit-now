import type { Agent, Brief, Output, Task, TaskStatus } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashboard_token') ?? '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getAgents: () => request<{ agents: Agent[] }>('/v1/dash/agents'),
  getAgent: (id: string) => request<{ agent: Agent }>(`/v1/dash/agents/${id}`),
  sendBrief: (agentId: string, content: string) =>
    request<{ brief: Brief }>(`/v1/dash/agents/${agentId}/brief`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getTasks: (params?: { agentId?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ tasks: Task[] }>(`/v1/dash/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (data: {
    title: string;
    description?: string;
    assignedAgentId: string;
    dueDate?: string;
  }) => request<{ task: Task }>('/v1/dash/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (taskId: string, status: TaskStatus) =>
    request<{ task: Task }>(`/v1/dash/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  validateOutput: (outputId: string) =>
    request<{ output: Output }>(`/v1/dash/outputs/${outputId}/validate`, { method: 'POST' }),
  rejectOutput: (outputId: string) =>
    request<{ message: string }>(`/v1/dash/outputs/${outputId}/reject`, { method: 'POST' }),
};
