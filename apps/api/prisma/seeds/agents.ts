import { DashAgentType, PrismaClient } from '@prisma/client';

export async function seedAgents(prisma: PrismaClient) {
  const allAgents = [
    // Manager
    { id: 'agent-manager', name: 'Manager', role: 'Project Manager', type: DashAgentType.CLAUDE, parentId: null },
    // Seniors
    { id: 'agent-senior-designer', name: 'Senior Designer', role: 'Design Lead', type: DashAgentType.HUMAN, parentId: 'agent-manager' },
    { id: 'agent-senior-influencer', name: 'Senior Influencer', role: 'Ambassador Lead', type: DashAgentType.CLAUDE, parentId: 'agent-manager' },
    { id: 'agent-senior-juridique', name: 'Senior Juridique', role: 'Legal Lead', type: DashAgentType.HUMAN, parentId: 'agent-manager' },
    { id: 'agent-senior-cfo', name: 'Directeur Financier', role: 'CFO', type: DashAgentType.HUMAN, parentId: 'agent-manager' },
    // Designer sub-agents
    { id: 'agent-uiux', name: 'UI/UX Designer', role: 'Interface Design', type: DashAgentType.HUMAN, parentId: 'agent-senior-designer' },
    { id: 'agent-brand', name: 'Brand Designer', role: 'Brand Identity', type: DashAgentType.CLAUDE, parentId: 'agent-senior-designer' },
    // Influencer sub-agents
    { id: 'agent-content', name: 'Content Creator', role: 'Content Production', type: DashAgentType.CLAUDE, parentId: 'agent-senior-influencer' },
    { id: 'agent-community', name: 'Community Manager', role: 'Community Engagement', type: DashAgentType.HUMAN, parentId: 'agent-senior-influencer' },
    // Legal sub-agents
    { id: 'agent-contracts', name: 'Contract Specialist', role: 'Contract Review', type: DashAgentType.HUMAN, parentId: 'agent-senior-juridique' },
    { id: 'agent-compliance', name: 'Compliance Officer', role: 'Regulatory Compliance', type: DashAgentType.HUMAN, parentId: 'agent-senior-juridique' },
    { id: 'agent-ip', name: 'IP Specialist', role: 'Intellectual Property', type: DashAgentType.CLAUDE, parentId: 'agent-senior-juridique' },
    { id: 'agent-rgpd', name: 'RGPD / Data Protection', role: 'Data Privacy', type: DashAgentType.HUMAN, parentId: 'agent-senior-juridique' },
    // CFO sub-agents
    { id: 'agent-budget', name: 'Budget Analyst', role: 'Budget Planning', type: DashAgentType.HUMAN, parentId: 'agent-senior-cfo' },
    { id: 'agent-reporting', name: 'Financial Reporting', role: 'Financial Reports', type: DashAgentType.CLAUDE, parentId: 'agent-senior-cfo' },
    { id: 'agent-cashflow', name: 'Cash Flow', role: 'Cash Flow Analysis', type: DashAgentType.HUMAN, parentId: 'agent-senior-cfo' },
    { id: 'agent-investment', name: 'Investment Analyst', role: 'Investment Strategy', type: DashAgentType.CLAUDE, parentId: 'agent-senior-cfo' },
  ];

  // Upsert sequentially to respect FK order (parents before children)
  for (const agent of allAgents) {
    await prisma.dashAgent.upsert({
      where: { id: agent.id },
      update: {},
      create: agent,
    });
  }

  console.log(`✓ ${allAgents.length} agents seeded`);
}
