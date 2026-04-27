export type AgentType = 'CLAUDE' | 'HUMAN';
export type AgentStatus = 'IDLE' | 'ACTIVE' | 'BLOCKED';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type OutputType = 'TEXT' | 'IMAGE' | 'URL';

export interface Agent {
  id: string;
  name: string;
  role: string;
  type: AgentType;
  status: AgentStatus;
  parentId: string | null;
  children: Agent[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedAgentId: string;
  agent: Agent;
  output: Output | null;
  dueDate: string | null;
  createdAt: string;
}

export interface Output {
  id: string;
  taskId: string;
  agentId: string;
  content: string;
  type: OutputType;
  validated: boolean;
  createdAt: string;
}

export interface Brief {
  id: string;
  agentId: string;
  content: string;
  sentAt: string;
  sentBy: string;
}
