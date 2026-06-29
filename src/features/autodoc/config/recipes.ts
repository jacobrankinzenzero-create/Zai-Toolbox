/**
 * AUTODOC starter recipes.
 *
 * AUTODOC is intentionally generic, but the current built-in recipe family is
 * still Statement of Work. Keeping these recipes in their own config file makes
 * it much easier to add Proposal, Discovery Report, or Meeting Pack recipes
 * later without bloating the main React page.
 */

const raciTableHtml = `
<div style="overflow-x: auto; margin: 1rem 0;">
  <table border="1" style="width: 100%; border-collapse: collapse; border-color: #d1d5db; text-align: left; font-size: 11pt; font-family: Calibri, sans-serif;">
    <thead style="background-color: #f9fafb;">
      <tr style="background-color: #f3f4f6;">
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; width: 30%;">Project Activity / Deliverable</th>
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; text-align: center;">Project Manager</th>
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; text-align: center;">Solutions Architect</th>
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; text-align: center;">Project Lead</th>
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; text-align: center;">Account Manager</th>
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; text-align: center;">Client Sponsor</th>
        <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold; text-align: center;">Client SME</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Requirements Gathering</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center; color: #ff8300; font-weight: bold;">A</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">R</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Solution Architecture Design</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center; color: #ff8300; font-weight: bold;">A</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">R</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Implementation &amp; Build</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center; color: #ff8300; font-weight: bold;">A</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">User Acceptance Testing (UAT)</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">R</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">C</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">I</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center; color: #ff8300; font-weight: bold;">A</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">R</td>
      </tr>
    </tbody>
  </table>
</div>
<p style="font-size: 9pt; color: #6b7280; font-style: italic;">* Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed</p>
<p><br></p>
`;

export type RecipeKey = 'SOW_LEVEL_1' | 'SOW_LEVEL_2' | 'SOW_LEVEL_3';

export const RECIPES: Record<
  RecipeKey,
  { name: string; sections: { title: string; content: string }[] }
> = {
  SOW_LEVEL_1: {
    name: 'Statement of Work (Level 1 - Light)',
    sections: [
      {
        title: 'Introduction',
        content:
          '<p>This Statement of Work ("SOW") defines the professional services to be delivered by Zenzero to the Client. Both parties agree to the requirements, timelines, and budgets documented herein.</p>',
      },
      {
        title: 'Background Information',
        content:
          "<p>Describe the client's current business challenge, why this initiative is starting, and the primary triggers for this engagement.</p>",
      },
      {
        title: 'Scope of Work',
        content:
          '<p>Outline the primary scope parameters of this engagement. Detail high-level expectations, boundaries, and the technical scope covered under this project.</p>',
      },
      {
        title: 'Scope Definition',
        content:
          '<p>Provide specific in-scope criteria, technology platforms involved, and the key user groups affected.</p>',
      },
      {
        title: 'Deliverables',
        content:
          '<ul><li>Detailed project plan and target deployment architecture.</li><li>Configured production and testing environments.</li><li>Handover documentation and knowledge transfer session.</li></ul>',
      },
      {
        title: 'Assumptions, Exclusions And Dependencies',
        content:
          '<p><strong>Assumptions:</strong> The client will provide timely access to necessary infrastructure.</p><p><strong>Exclusions:</strong> Hardware acquisition and third-party software licensing unless explicitly stated.</p><p><strong>Dependencies:</strong> Provisioning of administrative access by client IT leads within 5 business days.</p>',
      },
      {
        title: 'Resource Requirement and timeline',
        content:
          '<p>Zenzero will allocate an implementation engineer and a project manager on a part-time basis to complete the deliverables over an estimated period of 3-4 weeks.</p>',
      },
      {
        title: 'Budget Overview',
        content:
          '<p>Detailed breakdown of proposed fees, resource rates, and total project estimation.</p>',
      },
      {
        title: 'Payment Terms',
        content:
          '<p>Invoices will be submitted upon sign-off of the corresponding project deliverables. Payments are due within 30 days of the invoice date.</p>',
      },
      {
        title: 'Project Timeline',
        content:
          '<p>The anticipated start date is subject to agreement execution, with an estimated duration of 30 calendar days from kick-off.</p>',
      },
    ],
  },
  SOW_LEVEL_2: {
    name: 'Statement of Work (Level 2 - Standard)',
    sections: [
      {
        title: 'Introduction',
        content:
          '<p>This Statement of Work is entered into pursuant to the Master Services Agreement between Zenzero and the Client. It outlines the standard operational scope and delivery terms.</p>',
      },
      {
        title: 'Background Information',
        content:
          "<p>A concise explanation of the client's tactical goals, operational impacts, and current technical systems targeted for modernization.</p>",
      },
      {
        title: 'Current Environment',
        content:
          '<p>Detailing the current server versions, network infrastructure, client systems, licensing tiers, and immediate limitations of the existing platform.</p>',
      },
      {
        title: 'Scope of Work',
        content:
          '<p>Detailed breakdown of deployment, configuration, migration paths, and integration services provided by Zenzero.</p>',
      },
      {
        title: 'Scope Definition',
        content:
          '<p>Specific parameters defining what constitutes complete work, including supported environments, test runs, and performance boundaries.</p>',
      },
      {
        title: 'Deliverables',
        content:
          '<p>Specify standard deliverables with physical/digital proof criteria for sign-off.</p>',
      },
      {
        title: 'Testing',
        content:
          '<p>Details of the User Acceptance Testing (UAT) phase, verification scripts, defect resolution SLA, and sign-off window.</p>',
      },
      {
        title: 'Assumptions',
        content:
          '<p>Standard operational assumptions regarding team availability, environmental readiness, and client resource allocation.</p>',
      },
      {
        title: 'Exclusions',
        content:
          '<p>Explicit list of tasks, configurations, and post-project maintenance agreements not included in this SOW.</p>',
      },
      {
        title: 'Dependencies',
        content:
          '<p>Critical third-party APIs, vendor support agreements, and physical access requirements necessary for timely delivery.</p>',
      },
      {
        title: 'Risk identification and mitigation',
        content:
          '<p>Highlight potential project risks (e.g. data loss during transfer, configuration conflicts) and specific mitigation actions.</p>',
      },
      {
        title: 'Schedule and timeline',
        content:
          '<p>Visual phases, work package breakdowns, and expected weekly progress schedules.</p>',
      },
      {
        title: 'Project Timeline',
        content:
          '<p>Estimated schedule spanning 6-8 weeks from inception to final handover.</p>',
      },
      {
        title: 'Key Project Milestones',
        content:
          '<p>Milestone 1: Project Kickoff &amp; Discovery (Week 1)<br>Milestone 2: Design &amp; Architecture approval (Week 2)<br>Milestone 3: Implementation completion (Week 5)<br>Milestone 4: UAT &amp; Handover (Week 6)</p>',
      },
      {
        title: 'Resource Requirement',
        content:
          '<p>List of Zenzero resources dedicated to this delivery, with targeted allocations.</p>',
      },
      {
        title: 'Overview',
        content:
          '<p>General description of resources and project management governance levels applied to this tier of service.</p>',
      },
      {
        title: 'Labour Requirements',
        content:
          '<ul><li>Project Manager: 15 hours</li><li>Solutions Architect: 10 hours</li><li>Senior Systems Engineer: 45 hours</li></ul>',
      },
      {
        title: 'One off Items',
        content:
          '<p>Specific software licensing, travel expenses, or specialized diagnostic tools required to execute the services.</p>',
      },
      {
        title: 'Payment Terms',
        content:
          '<p>Payment terms are net 30 days from invoice date. Any adjustments to scope will follow the change control process.</p>',
      },
      {
        title: 'Payment Milestones',
        content:
          '<p>Payment 1: 30% upon SOW execution<br>Payment 2: 40% upon Build completion<br>Payment 3: 30% upon successful client UAT sign-off.</p>',
      },
      {
        title: 'Project Change Control',
        content:
          '<p>Procedures outlining how adjustments to scope, budget, or timelines will be formally raised, analyzed, and approved.</p>',
      },
      {
        title: 'Change Request Process',
        content:
          '<p>A written Change Control Note (CCN) must be submitted by the requesting party. Work on changes will start only upon mutual signature of the CCN.</p>',
      },
      {
        title: 'Project communication',
        content:
          '<p>How the teams will interface to ensure smooth delivery, status alignment, and issue tracking.</p>',
      },
      {
        title: 'Communication channels and methods',
        content:
          '<p>Weekly status reports, bi-weekly review meetings via MS Teams, and escalation pathways.</p>',
      },
      {
        title: 'Security and Compliance',
        content:
          '<p>Technical standards and frameworks applied during build phase to align with security baselines.</p>',
      },
      {
        title: 'Security and Compliance Requirements',
        content:
          '<p>Compliance with GDPR, standard security hardening guidelines, and credential management protocols.</p>',
      },
      {
        title: 'Personal Data Scope and Handling',
        content:
          '<p>Detailing whether PII is accessed, transferred, or cached, and outlining the role of data processors.</p>',
      },
      {
        title: 'Project Transition',
        content:
          '<p>Support handover protocols to the Client IT Team or Zenzero Managed Services Desk for ongoing maintenance.</p>',
      },
    ],
  },
  SOW_LEVEL_3: {
    name: 'Statement of Work (Level 3 - Enterprise)',
    sections: [
      {
        title: 'Introduction',
        content:
          '<p>This enterprise-grade Statement of Work details the exhaustive operational delivery plan, compliance governance, RACI structures, and custom architecture mapping designed for the Client.</p>',
      },
      {
        title: 'Background Information',
        content:
          '<p>In-depth strategic background, legacy system challenges, compliance obligations, and business outcome definitions.</p>',
      },
      {
        title: 'Current Environment',
        content:
          '<p>Comprehensive inventory of existing physical/virtual assets, network topologies, database instances, and operating systems.</p>',
      },
      {
        title: 'Objectives',
        content:
          '<p>Key performance indicators (KPIs) and operational success metrics mapped to enterprise goals.</p>',
      },
      {
        title: 'Business Objectives',
        content:
          '<ul><li>Reduce system latency by 25%.</li><li>Ensure 99.99% infrastructure availability via redundant architecture.</li><li>Comply fully with security audit recommendations.</li></ul>',
      },
      {
        title: 'Scope of Work',
        content:
          '<p>Enterprise-scale delivery breakdown covering discovery, prototyping, system integration, high-availability setups, and exhaustive user training.</p>',
      },
      {
        title: 'Scope Definition',
        content:
          '<p>Boundary limitations, data center locations, regulatory scope, and specific integration boundaries.</p>',
      },
      {
        title: 'Deliverables',
        content:
          '<p>Comprehensive master deliverables matrix containing criteria for formal stage-gate approval.</p>',
      },
      {
        title: 'Acceptance Criteria',
        content:
          '<p>Formal, objective tests that must be passed before deliverables are signed off. Includes performance benchmarking and vulnerability scanning.</p>',
      },
      {
        title: 'Assumptions',
        content:
          '<p>Exhaustive list of operational, infrastructure, and access assumptions.</p>',
      },
      {
        title: 'Exclusions',
        content:
          '<p>Explicit out-of-scope declarations to prevent project creep in complex legacy systems.</p>',
      },
      {
        title: 'Dependencies',
        content:
          '<p>External vendors, ISP provisioning, client software licensing updates, and firewall permissions.</p>',
      },
      {
        title: 'Risk identification and mitigation',
        content:
          '<p>Strategic risk log detailing risk severity, probability, impact, owners, and dynamic mitigation plans.</p>',
      },
      {
        title: 'Schedule and timeline',
        content:
          '<p>Critical path planning, dependencies milestones, and resource timeline charts.</p>',
      },
      {
        title: 'Project Timeline',
        content:
          '<p>Estimated timeline of 12-16 weeks structured in agile sprints or clear waterfall stages.</p>',
      },
      {
        title: 'Milestones',
        content:
          '<p>Detailed phase-gate milestones requiring signed Certificate of Acceptance prior to progression.</p>',
      },
      {
        title: 'Roles and Responsibilities',
        content:
          '<p>Governance framework and working groups assigned to guide the project steering committee.</p>',
      },
      {
        title: 'Project team',
        content:
          '<p>Zenzero and Client key contacts, project sponsors, technical leads, and escalation coordinators.</p>',
      },
      {
        title: 'Stakeholders',
        content:
          '<p>Executive sponsors, security officers, operational business unit heads, and user representatives.</p>',
      },
      {
        title: 'Resource Requirement',
        content:
          '<p>Detailed enterprise staffing model including dedicated project managers, senior architects, and specialized security consultants.</p>',
      },
      {
        title: 'Budget Overview',
        content:
          '<p>Fixed-price or Time & Materials pricing details, including travel, hardware procurement, and cloud service estimations.</p>',
      },
      {
        title: 'Payment Terms',
        content:
          '<p>Detailed progress payment schedule, milestone billing triggers, and standard corporate payment terms.</p>',
      },
      {
        title: 'Project Change Control',
        content:
          '<p>Rigorous change-control process for identifying scope creep, impact assessment, and steering committee approvals.</p>',
      },
      {
        title: 'Change Request Process',
        content:
          '<p>Standard Change Request procedure including written impact forms, technical review gates, and formal sign-offs.</p>',
      },
      {
        title: 'Project communication',
        content:
          '<p>Formal progress meeting schedules, stakeholder briefing channels, monthly steering committee reviews, and status dashboard accesses.</p>',
      },
      {
        title: 'Communication channels and methods',
        content:
          '<p>Dedicated Slack/Teams channels, Jira dashboard access, weekly status reports, and escalation matrix.</p>',
      },
      { title: 'RACI', content: raciTableHtml },
      {
        title: 'Security & Compliance',
        content:
          '<p>High-security environment specifications, regulatory mandates, and identity governance controls.</p>',
      },
      {
        title: 'Security and compliance Requirements',
        content:
          '<p>ISO 27001, Cyber Essentials Plus compliance verification, multi-factor authentication requirements, and encrypted data-at-rest configurations.</p>',
      },
    ],
  },
};
