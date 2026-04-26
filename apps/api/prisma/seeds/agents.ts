import { DashAgentType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAgents() {
  const manager = await prisma.dashAgent.upsert({
    where: { id: 'agent-manager' },
    update: {},
    create: { id: 'agent-manager', name: 'Manager', role: 'Project Manager', type: DashAgentType.CLAUDE },
  });

  const designer = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-designer' },
    update: {},
    create: { id: 'agent-senior-designer', name: 'Senior Designer', role: 'Design Lead', type: DashAgentType.HUMAN, parentId: manager.id },
  });

  const influencer = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-influencer' },
    update: {},
    create: { id: 'agent-senior-influencer', name: 'Senior Influencer', role: 'Ambassador Lead', type: DashAgentType.CLAUDE, parentId: manager.id },
  });

  const juridique = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-juridique' },
    update: {},
    create: { id: 'agent-senior-juridique', name: 'Senior Juridique', role: 'Legal Lead', type: DashAgentType.HUMAN, parentId: manager.id },
  });

  const cfo = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-cfo' },
    update: {},
    create: { id: 'agent-senior-cfo', name: 'Directeur Financier', role: 'CFO', type: DashAgentType.HUMAN, parentId: manager.id },
  });

  const subAgents = [
    { id: 'agent-uiux', name: 'UI/UX Designer', role: 'Interface Design', type: DashAgentType.HUMAN, parentId: designer.id },
    { id: 'agent-brand', name: 'Brand Designer', role: 'Brand Identity', type: DashAgentType.CLAUDE, parentId: designer.id },
    { id: 'agent-content', name: 'Content Creator', role: 'Content Production', type: DashAgentType.CLAUDE, parentId: influencer.id },
    { id: 'agent-community', name: 'Community Manager', role: 'Community Engagement', type: DashAgentType.HUMAN, parentId: influencer.id },
    { id: 'agent-contracts', name: 'Contract Specialist', role: 'Contract Review', type: DashAgentType.HUMAN, parentId: juridique.id },
    { id: 'agent-compliance', name: 'Compliance Officer', role: 'Regulatory Compliance', type: DashAgentType.HUMAN, parentId: juridique.id },
    { id: 'agent-ip', name: 'IP Specialist', role: 'Intellectual Property', type: DashAgentType.CLAUDE, parentId: juridique.id },
    { id: 'agent-rgpd', name: 'RGPD / Data Protection', role: 'Data Privacy', type: DashAgentType.HUMAN, parentId: juridique.id },
    { id: 'agent-budget', name: 'Budget Analyst', role: 'Budget Planning', type: DashAgentType.HUMAN, parentId: cfo.id },
    { id: 'agent-reporting', name: 'Financial Reporting', role: 'Financial Reports', type: DashAgentType.CLAUDE, parentId: cfo.id },
    { id: 'agent-cashflow', name: 'Cash Flow', role: 'Cash Flow Analysis', type: DashAgentType.HUMAN, parentId: cfo.id },
    { id: 'agent-investment', name: 'Investment Analyst', role: 'Investment Strategy', type: DashAgentType.CLAUDE, parentId: cfo.id },
  ];

  for (const agent of subAgents) {
    await prisma.dashAgent.upsert({
      where: { id: agent.id },
      update: {},
      create: agent,
    });
  }

  console.log('✓ 17 agents seeded');
}
