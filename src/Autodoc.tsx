import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import './index.css';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { generateAutodocDocx } from './lib/generateAutodocDocx';

// --- TYPE DEFINITIONS ---
interface TonePreset {
  id: string;
  name: string;
  systemInstruction: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
  images?: string[];
  promptMode: boolean;
  isGenerating?: boolean;
  error?: string | null;
}

interface ExportData {
  userEmail?: string;
  orgName?: string;
  clientName?: string;
  clientEmail?: string;
  [key: string]: string | undefined;
}

interface ModalInput {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface ModalConfig {
  title: string;
  message: string;
  inputs?: ModalInput[];
  confirmText: string;
  isDestructive: boolean;
  action: (data: ExportData) => void | Promise<void>;
}

interface TableContext {
  td: HTMLTableCellElement;
  tr: HTMLTableRowElement;
  table: HTMLTableElement;
  cellIndex: number;
  rowIndex: number;
}

const BRAND_COLOR = '#ff8300';

const AI_TONE_PRESETS: TonePreset[] = [
  {
    id: 'formal',
    name: '💼 Formal Corporate',
    systemInstruction:
      'Write in a professional, formal corporate tone suitable for legally binding agreements and high-value project stakeholders. Use clear, authoritative language.',
  },
  {
    id: 'technical',
    name: '🛠️ Technical Deep-Dive',
    systemInstruction:
      'Write with technical precision and rich engineering detail. Focus on architectural accuracy, technical steps, dependencies, and precise system parameters.',
  },
  {
    id: 'concise',
    name: '⚡ Agile & Concise',
    systemInstruction:
      'Write using direct, concise, and action-oriented phrasing. Use high-impact bullet points where possible. Avoid corporate jargon and filler words.',
  },
  {
    id: 'executive',
    name: '🎯 Executive Summary',
    systemInstruction:
      'Write from a strategic perspective, highlighting high-level business objectives, return on investment, milestones, and strategic alignment.',
  },
];

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

type RecipeKey = 'SOW_LEVEL_1' | 'SOW_LEVEL_2' | 'SOW_LEVEL_3';

const RECIPES: Record<
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

const IconPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const IconDownload = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);
const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);
const IconFileText = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);
const IconSparkles = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
  </svg>
);
const IconChevronUp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);
const IconChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
const IconImage = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);
const IconTable = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="3" y1="15" x2="21" y2="15"></line>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);
const IconMenu = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);
const IconClose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const IconInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

/* ==============================================================================
   DEV TEAM NOTES: AZURE AI INTEGRATION
   ==============================================================================
   This function has been stubbed to remove the client-side Google API call. 
   You must wire this up to your Azure OpenAI resource.
   ============================================================================== */
const generateAIContent = async (
  prompt: string,
  customInstruction: string
): Promise<string> => {
  const defaultInstruction =
    'You are a professional corporate document writer. Write professional, formal content fulfilling the request. IMPORTANT: Return the response formatted strictly as basic HTML using ONLY <p>, <ul>, <li>, <strong>, <em>, and <br> tags. Do not use Markdown. Do not include outer html tags, body tags, or CSS. Return only raw body-level HTML tags.';
  const activeInstruction = customInstruction
    ? `${defaultInstruction} ${customInstruction}`
    : defaultInstruction;

  // Simulate network latency for UI demonstration until Azure is hooked up
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  await delay(1500);

  // TODO: Replace this mock return with actual Azure AI endpoint fetch logic (see comments above).
  return `<p><em>[DEV TEAM: Replace this mock block with actual Azure AI payload response. System instruction applied: ${customInstruction}]</em></p><p>You requested: ${prompt}</p>`;
};

const countWords = (html?: string): number => {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ');
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
};

// --- RICH TEXT EDITOR COMPONENT ---
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onGenerateAI: (promptText: string) => Promise<void>;
  isGenerating?: boolean;
  isPromptMode: boolean;
  setPromptMode: (val: boolean) => void;
  currentTone: TonePreset;
}

const RichTextEditor: React.FC<RichTextEditorProps> = memo(
  ({
    content,
    onChange,
    onGenerateAI,
    isGenerating,
    isPromptMode,
    setPromptMode,
    currentTone,
  }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [inTable, setInTable] = useState(false);

    useEffect(() => {
      if (
        editorRef.current &&
        content !== editorRef.current.innerHTML &&
        document.activeElement !== editorRef.current
      ) {
        editorRef.current.innerHTML = content;
      }
    }, [content]);

    const handleInput = useCallback(() => {
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, [onChange]);

    const checkContext = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) {
        setInTable(false);
        return;
      }
      let node: Node | null = selection.getRangeAt(0).startContainer;
      if (node.nodeType === 3) node = node.parentNode;
      if (node instanceof Element) {
        setInTable(!!node.closest('table'));
      }
    }, []);

    const execCommand = useCallback(
      (command: string, value: string | null = null) => {
        document.execCommand(command, false, value ?? undefined);
        if (editorRef.current) {
          editorRef.current.focus();
        }
        handleInput();
        checkContext();
      },
      [handleInput, checkContext]
    );

    const insertTable = useCallback(() => {
      const defaultTableHtml = `
      <div style="overflow-x: auto; margin: 1rem 0;">
        <table border="1" style="width: 100%; border-collapse: collapse; border-color: #d1d5db; text-align: left;">
          <thead style="background-color: #f9fafb;">
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold;">Header 1</th>
              <th style="padding: 10px; border: 1px solid #9ca3af; font-weight: bold;">Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #d1d5db;"><br></td>
              <td style="padding: 10px; border: 1px solid #d1d5db;"><br></td>
            </tr>
          </tbody>
        </table>
      </div><p><br></p>`;
      document.execCommand('insertHTML', false, defaultTableHtml);
      if (editorRef.current) {
        editorRef.current.focus();
      }
      handleInput();
    }, [handleInput]);

    const getActiveTableContext = (): TableContext | null => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return null;
      let node: Node | null = selection.getRangeAt(0).startContainer;
      if (node.nodeType === 3) node = node.parentNode;
      if (!(node instanceof Element)) return null;

      const td = node.closest('td, th') as HTMLTableCellElement;
      const tr = node.closest('tr') as HTMLTableRowElement;
      const table = node.closest('table') as HTMLTableElement;

      if (td && tr && table) {
        return {
          td,
          tr,
          table,
          cellIndex: td.cellIndex,
          rowIndex: tr.rowIndex,
        };
      }
      return null;
    };

    const addRow = useCallback(() => {
      const ctx = getActiveTableContext();
      if (!ctx || !ctx.tr.parentNode) return;
      const newRow = document.createElement('tr');
      Array.from(ctx.tr.children).forEach(() => {
        const newCell = document.createElement('td');
        newCell.style.cssText = 'padding: 10px; border: 1px solid #d1d5db;';
        newCell.innerHTML = '<br>';
        newRow.appendChild(newCell);
      });
      ctx.tr.parentNode.insertBefore(newRow, ctx.tr.nextSibling);
      handleInput();
    }, [handleInput]);

    const removeRow = useCallback(() => {
      const ctx = getActiveTableContext();
      if (!ctx || !ctx.tr.parentNode) return;
      if (ctx.tr.parentNode.children.length <= 1) return;
      ctx.tr.remove();
      handleInput();
      checkContext();
    }, [handleInput, checkContext]);

    const addColumn = useCallback(() => {
      const ctx = getActiveTableContext();
      if (!ctx) return;
      const rows = ctx.table.rows;
      for (let i = 0; i < rows.length; i++) {
        const sourceCell = rows[i].children[ctx.cellIndex] as HTMLElement;
        if (!sourceCell || !rows[i].parentNode) continue;
        const isHeader =
          rows[i].parentNode?.nodeName.toLowerCase() === 'thead' ||
          sourceCell.tagName.toLowerCase() === 'th';
        const newCell = document.createElement(isHeader ? 'th' : 'td');
        newCell.style.cssText = isHeader
          ? 'padding: 10px; border: 1px solid #9ca3af; font-weight: bold;'
          : 'padding: 10px; border: 1px solid #d1d5db;';
        newCell.innerHTML = '<br>';
        if (sourceCell.nextSibling) {
          rows[i].insertBefore(newCell, sourceCell.nextSibling);
        } else {
          rows[i].appendChild(newCell);
        }
      }
      handleInput();
    }, [handleInput]);

    const removeColumn = useCallback(() => {
      const ctx = getActiveTableContext();
      if (!ctx) return;
      if (ctx.tr.children.length <= 1) return;
      const rows = ctx.table.rows;
      const cellIdx = ctx.cellIndex;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].children[cellIdx]) {
          rows[i].children[cellIdx].remove();
        }
      }
      handleInput();
      checkContext();
    }, [handleInput, checkContext]);

    const handleAIAction = useCallback(async () => {
      if (!isPromptMode) {
        setPromptMode(true);
        return;
      }
      const promptText =
        editorRef.current?.innerText || editorRef.current?.textContent;
      if (promptText && promptText.trim()) {
        await onGenerateAI(promptText);
        setPromptMode(false);
      }
    }, [isPromptMode, setPromptMode, onGenerateAI]);

    return (
      <div
        className={`border rounded-xl overflow-hidden transition-all duration-300 ${
          isPromptMode
            ? 'border-[#ff8300] ring-2 ring-[#ff8300]/20'
            : 'border-gray-200'
        } bg-white shadow-sm`}
      >
        <div className="flex flex-wrap gap-1.5 items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => execCommand('formatBlock', 'H1')}
              className="px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => execCommand('formatBlock', 'H2')}
              className="px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
            >
              H2
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button
              type="button"
              onClick={() => execCommand('bold')}
              className="px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className="px-2 py-1 text-xs font-bold italic text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className="px-2 py-1 text-xs font-bold underline text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
              title="Underline"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => execCommand('strikeThrough')}
              className="px-2 py-1 text-xs font-bold line-through text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
              title="Strikethrough"
            >
              S
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200/70 rounded transition-colors"
            >
              1. List
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button
              type="button"
              onClick={insertTable}
              className="p-1.5 flex items-center text-gray-600 hover:bg-gray-200/70 rounded transition-colors"
              title="Insert Responsive Table"
            >
              <IconTable />
            </button>

            {inTable && (
              <>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1">
                  Table:
                </span>
                <button
                  type="button"
                  onClick={addRow}
                  className="px-2 py-0.5 text-[11px] font-semibold text-[#ff8300] bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 transition-colors"
                  title="Add Row Below"
                >
                  + Row
                </button>
                <button
                  type="button"
                  onClick={removeRow}
                  className="px-2 py-0.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                  title="Delete Active Row"
                >
                  - Row
                </button>
                <button
                  type="button"
                  onClick={addColumn}
                  className="px-2 py-0.5 text-[11px] font-semibold text-[#ff8300] bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 transition-colors"
                  title="Add Column Right"
                >
                  + Col
                </button>
                <button
                  type="button"
                  onClick={removeColumn}
                  className="px-2 py-0.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                  title="Delete Active Column"
                >
                  - Col
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPromptMode && (
              <span className="text-[10px] bg-amber-50 text-[#ff8300] font-semibold px-2 py-0.5 rounded border border-amber-200">
                Tone: {currentTone.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleAIAction}
              disabled={isGenerating}
              className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                isGenerating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isPromptMode
                  ? 'bg-[#ff8300] text-white hover:bg-[#e67600] shadow-sm animate-pulse'
                  : 'bg-orange-50 text-[#ff8300] hover:bg-orange-100 border border-orange-100'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : isPromptMode ? (
                <>
                  <span className="mr-1">
                    <IconSparkles />
                  </span>{' '}
                  Synthesize Draft
                </>
              ) : (
                <>
                  <span className="mr-1">
                    <IconSparkles />
                  </span>{' '}
                  AI Assistant
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          {isPromptMode && (
            <div className="absolute top-0 left-0 right-0 text-xs bg-[#ff8300]/10 text-[#ff8300] px-4 py-1.5 border-b border-[#ff8300]/20 font-medium">
              💡 <strong>Draft Guidelines:</strong> Type your details below,
              then click <strong>Synthesize Draft</strong> to construct
              formatted, expert copy.
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            onMouseUp={checkContext}
            onKeyUp={checkContext}
            className={`w-full min-h-[160px] p-4 text-gray-700 focus:outline-none prose prose-slate max-w-none overflow-x-auto ${
              isPromptMode ? 'pt-10 bg-orange-50/20' : ''
            }`}
            style={{ minHeight: '160px' }}
          />
        </div>
      </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';

// --- SECTION COMPONENT ---
interface SectionComponentProps {
  section: Section;
  index: number;
  totalSections: number;
  updateSection: (id: string, updates: Partial<Section>) => void;
  removeSection: (id: string) => void;
  moveSection: (index: number, direction: number) => void;
  activeTone: TonePreset;
}

const SectionComponent: React.FC<SectionComponentProps> = memo(
  ({
    section,
    index,
    totalSections,
    updateSection,
    removeSection,
    moveSection,
    activeTone,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wordCount = countWords(section.content);

    const handleTitleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        updateSection(section.id, { title: e.target.value }),
      [section.id, updateSection]
    );
    const handleContentChange = useCallback(
      (content: string) => updateSection(section.id, { content }),
      [section.id, updateSection]
    );

   const handleImageUpload = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const maxSizeMb = 4;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      alert(`Please upload an image smaller than ${maxSizeMb}MB.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const currentImages = section.images || [];

      updateSection(section.id, {
        images: [...currentImages, reader.result as string],
      });

      // Allow the same file to be selected again later if needed
      e.target.value = '';
    };

    reader.onerror = () => {
      alert('Could not read the image file.');
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  },
  [section.id, section.images, updateSection]
);

    const handleRemoveImage = useCallback(
      (indexToRemove: number) => {
        const newImages = (section.images || []).filter(
          (_, idx) => idx !== indexToRemove
        );
        updateSection(section.id, { images: newImages });
      },
      [section.id, section.images, updateSection]
    );

    const triggerAIGeneration = useCallback(
      async (promptText: string) => {
        updateSection(section.id, { isGenerating: true, error: null });
        try {
          const promptContext = `Please write a highly detailed professional document section with title: "${section.title}". Use the following guidelines: "${promptText}".`;
          const generatedHtml = await generateAIContent(
            promptContext,
            activeTone.systemInstruction
          );
          updateSection(section.id, {
            content: generatedHtml,
            isGenerating: false,
            promptMode: false,
          });
        } catch (err: any) {
          updateSection(section.id, {
            isGenerating: false,
            error:
              err.message || 'AI Generation failed. Check backend connection.',
          });
        }
      },
      [section.id, section.title, activeTone, updateSection]
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 group hover:shadow-md transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center flex-1 gap-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveSection(index, -1)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Move Section Up"
              >
                <IconChevronUp />
              </button>
              <button
                type="button"
                disabled={index === totalSections - 1}
                onClick={() => moveSection(index, 1)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Move Section Down"
              >
                <IconChevronDown />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-md">
                #{index + 1}
              </span>
              <input
                type="text"
                value={section.title}
                onChange={handleTitleChange}
                placeholder="Section Title"
                className="text-base font-semibold text-gray-800 bg-transparent border-none focus:outline-none w-full placeholder-gray-300 focus:ring-1 focus:ring-orange-100 rounded px-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
              {wordCount} words
            </span>
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50"
              title="Delete Section"
            >
              <IconTrash />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <RichTextEditor
            content={section.content}
            onChange={handleContentChange}
            onGenerateAI={triggerAIGeneration}
            isGenerating={section.isGenerating}
            isPromptMode={section.promptMode}
            setPromptMode={(val) =>
              updateSection(section.id, { promptMode: val })
            }
            currentTone={activeTone}
          />

          {section.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3.5 rounded-lg border border-red-100 flex items-start gap-2">
              <span className="mt-0.5 text-red-500 flex-shrink-0">
                <IconInfo />
              </span>
              <div>
                <p className="font-semibold">Generation Problem</p>
                <p className="text-xs mt-0.5">{section.error}</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            {section.images && section.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {section.images.map((img, idx) => (
                  <div key={idx} className="relative group/img">
                    <img
                      src={img}
                      alt="Attachment"
                      className="h-20 w-auto rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white shadow-md rounded-full p-1 hover:bg-red-600 transition-all scale-90"
                      title="Remove attachment"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold flex items-center text-gray-500 hover:text-[#ff8300] transition-colors gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <IconImage /> Attach Asset / Sketch
            </button>
          </div>
        </div>
      </div>
    );
  }
);
SectionComponent.displayName = 'SectionComponent';

// --- MAIN APP COMPONENT ---
export default function App() {
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState<string>(() => {
    return (
      localStorage.getItem('autodoc_title') || 'Untitled Statement of Work'
    );
  });
  const [sections, setSections] = useState<Section[]>(() => {
    const saved = localStorage.getItem('autodoc_sections');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'sec_1',
            title: 'Introduction',
            content:
              '<p>Start drafting your introduction here, or trigger the <strong>AI Assistant</strong> in this block to synthesize standard paragraphs dynamically.</p>',
            images: [],
            promptMode: false,
          },
        ];
  });

  const [activeTone, setActiveTone] = useState<TonePreset>(AI_TONE_PRESETS[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [modalData, setModalData] = useState<ExportData>({});
  const [exportData, setExportData] = useState<ExportData>(() => {
    const saved = localStorage.getItem('autodoc_export_metadata');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('autodoc_title', documentTitle);
  }, [documentTitle]);

 useEffect(() => {
  try {
    const sectionsForStorage = sections.map((section) => ({
      ...section,
      images: [], // Do not persist base64 images to localStorage
    }));

    localStorage.setItem(
      'autodoc_sections',
      JSON.stringify(sectionsForStorage)
    );
  } catch (error) {
    console.warn('Could not save AUTODOC sections to localStorage:', error);
  }
}, [sections]);

  useEffect(() => {
    localStorage.setItem('autodoc_export_metadata', JSON.stringify(exportData));
  }, [exportData]);

  const totalWords = sections.reduce(
    (acc, sec) => acc + countWords(sec.content),
    0
  );

  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      {
        id: `sec_${Date.now()}`,
        title: 'New Section',
        content: '<p>Enter content details...</p>',
        images: [],
        promptMode: false,
      },
    ]);
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const moveSection = useCallback(
    (index: number, direction: number) => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= sections.length) return;
      setSections((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[targetIdx];
        copy[targetIdx] = temp;
        return copy;
      });
    },
    [sections.length]
  );

  const applyRecipe = useCallback(
    (recipeKey: RecipeKey) => {
      const executeRecipe = () => {
        const recipe = RECIPES[recipeKey];
        setDocumentTitle(recipe.name);
        setSections(
          recipe.sections.map((sec, idx) => ({
            id: `recipe_sec_${Date.now()}_${idx}`,
            title: sec.title,
            content: sec.content,
            images: [],
            promptMode: false,
          }))
        );
        setModalConfig(null);
        setMobileMenuOpen(false);
      };

      if (sections.length > 0) {
        setModalConfig({
          title: 'Replace with Template?',
          message:
            'Applying a template will overwrite your active workspace sections. Would you like to proceed?',
          confirmText: 'Overwrite & Apply',
          isDestructive: true,
          action: executeRecipe,
        });
      } else {
        executeRecipe();
      }
    },
    [sections.length]
  );

  const clearAllSections = useCallback(() => {
    if (sections.length === 0) return;
    setModalConfig({
      title: 'Reset Current Workspace?',
      message:
        'Are you sure you want to delete all sections and start over? This actions is irreversible.',
      confirmText: 'Reset Workspace',
      isDestructive: true,
      action: () => {
        setSections([]);
        setDocumentTitle('Untitled Document');
        setModalConfig(null);
        setMobileMenuOpen(false);
      },
    });
  }, [sections.length]);

  const handleBackupExport = useCallback(() => {
    const backupData = {
      title: documentTitle,
      sections,
      metadata: exportData,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/\s+/g, '_')}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [documentTitle, sections, exportData]);

  const handleBackupImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string;
          const parsed = JSON.parse(result);
          if (parsed.title && Array.isArray(parsed.sections)) {
            setDocumentTitle(parsed.title);
            setSections(parsed.sections);
            if (parsed.metadata) setExportData(parsed.metadata);
            setMobileMenuOpen(false);
          } else {
            alert('Invalid backup file layout structure.');
          }
        } catch (err) {
          alert('Could not parse JSON configuration.');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const executeExport = useCallback(
  async (metadataOverride?: ExportData) => {
    try {
      await generateAutodocDocx({
        documentTitle,
        sections,
        metadata: metadataOverride || exportData,
      });
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : 'Could not generate the Word document.';

      alert(message);
    }
  },
  [documentTitle, sections, exportData]
);

  const handleExportClick = useCallback(() => {
    setModalData(exportData);
    setModalConfig({
      title: 'Export content Details',
      message:
        'Please review content details for automatic formatting on the Zenzero corporate cover page template.',
      inputs: [
        {
          id: 'userEmail',
          label: 'Zenzero Creator Email',
          type: 'email',
          placeholder: 'yourname@zenzero.co.uk',
          required: true,
        },
        {
          id: 'orgName',
          label: "Client Organisation's Name",
          type: 'text',
          placeholder: 'e.g. Acme Corporation',
          required: true,
        },
        {
          id: 'clientName',
          label: 'Client Main Representative',
          type: 'text',
          placeholder: 'e.g. Jane Doe',
          required: false,
        },
        {
          id: 'clientEmail',
          label: 'Client Contact Email',
          type: 'email',
          placeholder: 'jane@acme.com',
          required: false,
        },
      ],
      confirmText: 'Generate & Download',
      isDestructive: false,
      action: async (data) => {
        setExportData(data);
        setModalConfig(null);
        await executeExport(data);
      },
    });
  }, [executeExport, exportData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-gray-800">
      {/* MOBILE CONTAINER HEADER */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black"
            style={{ background: 'linear-gradient(135deg, #ff8300, #ff5b00)' }}
          >
            ad
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900">
            autodoc
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to Toolbox"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* DASHBOARD SIDEBAR FOR DESKTOP & MOBILE */}
      <div
        className={`w-full md:w-64 bg-white border-r border-gray-200 flex flex-col fixed md:h-screen z-20 shadow-sm transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen
            ? 'translate-x-0 top-[57px] bottom-0 h-[calc(100vh-57px)]'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="hidden md:flex p-6 border-b border-gray-100 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #ff8300, #ff4700)',
              }}
            >
              ad
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">
              autodoc
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Toolbox"
            aria-label="Back to Toolbox"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              AI tone
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {AI_TONE_PRESETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTone(t)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all duration-200 font-medium ${
                    activeTone.id === t.id
                      ? 'border-[#ff8300] bg-orange-50 text-[#ff8300] font-bold shadow-xs'
                      : 'border-transparent hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Recipes
            </h3>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => applyRecipe('SOW_LEVEL_1')}
                className="w-full flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-[#ff8300] hover:bg-orange-50/50 transition-all text-left text-xs font-semibold text-gray-700"
              >
                <div className="text-[#ff8300] mr-2">
                  <IconFileText />
                </div>{' '}
                Level 1: Light SOW
              </button>
              <button
                type="button"
                onClick={() => applyRecipe('SOW_LEVEL_2')}
                className="w-full flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-[#ff8300] hover:bg-orange-50/50 transition-all text-left text-xs font-semibold text-gray-700"
              >
                <div className="text-[#ff8300] mr-2">
                  <IconFileText />
                </div>{' '}
                Level 2: Standard SOW
              </button>
              <button
                type="button"
                onClick={() => applyRecipe('SOW_LEVEL_3')}
                className="w-full flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-[#ff8300] hover:bg-orange-50/50 transition-all text-left text-xs font-semibold text-gray-700"
              >
                <div className="text-[#ff8300] mr-2">
                  <IconFileText />
                </div>{' '}
                Level 3: Enterprise SOW
              </button>
              <p className="text-[10px] text-gray-400 text-center mb-4 leading-relaxed">
                For more recipes, speak to your organisation. You can upload
                your own below via the <b>Local Backup</b> section.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Local Backup
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleBackupExport}
                className="py-2 text-center text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-semibold"
              >
                Save Draft
              </button>
              <label className="py-2 text-center text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer font-semibold block">
                Load Draft
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Metrics Log
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-gray-200/50">
                <div className="text-sm font-bold text-gray-800">
                  {sections.length}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">
                  Sections
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200/50">
                <div className="text-sm font-bold text-gray-800">
                  {totalWords}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">
                  Total Words
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleExportClick}
              className="w-full flex items-center justify-center p-3 mb-2.5 rounded-lg text-white shadow-sm transition-all font-semibold text-xs bg-[#ff8300] hover:bg-[#e67600] tracking-wide uppercase"
            >
              <span className="mr-1.5">
                <IconDownload />
              </span>{' '}
              Export Word Document
            </button>
            <p className="text-[10px] text-gray-400 text-center mb-4 leading-relaxed">
              Export builds a clean corporate cover page template dynamically.
            </p>

            <button
              type="button"
              onClick={clearAllSections}
              disabled={sections.length === 0}
              className={`w-full flex items-center justify-center p-2.5 rounded-lg border transition-all font-semibold text-xs ${
                sections.length === 0
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50/50'
                  : 'border-red-100 text-red-500 hover:bg-red-50'
              }`}
            >
              <span className="mr-1.5">
                <IconTrash />
              </span>{' '}
              Clear Current Document
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 md:ml-64 flex flex-col items-center">
        <div className="w-full bg-white border-b border-gray-200 py-4 px-4 sm:px-8 sticky top-0 md:top-0 z-10 flex justify-center shadow-xs">
          <div className="max-w-4xl w-full flex items-center">
            <div className="text-gray-400 mr-3 hidden sm:block">
              <IconFileText />
            </div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-xl sm:text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none w-full"
              placeholder="Document Title"
            />
          </div>
        </div>

        <div className="w-full max-w-4xl py-6 sm:py-10 px-4 sm:px-8">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <SectionComponent
                key={section.id}
                section={section}
                index={index}
                totalSections={sections.length}
                updateSection={updateSection}
                removeSection={removeSection}
                moveSection={moveSection}
                activeTone={activeTone}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addSection}
            className="mt-6 w-full py-5 border-2 border-dashed border-gray-300 hover:border-[#ff8300] rounded-xl text-gray-500 hover:text-[#ff8300] hover:bg-orange-50/40 transition-all flex items-center justify-center font-bold text-sm gap-2"
          >
            <IconPlus /> Add Custom Section Block
          </button>

          {sections.length === 0 && (
            <div className="text-center py-24 text-gray-500">
              <div className="mx-auto text-gray-300 mb-4 flex justify-center scale-150">
                <IconFileText />
              </div>
              <p className="text-xl font-bold text-gray-800">
                Your Document Workspace is Empty
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                Generate comprehensive, industry-standard documents instantly by
                choosing Level 1, 2, or 3 SOW blueprints on the sidebar menu.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION & EXPORT INFORMATION PROMPTER */}
      {modalConfig && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {modalConfig.title}
            </h3>
            <p className="text-gray-500 text-xs mb-4">{modalConfig.message}</p>

            {modalConfig.inputs && (
              <div className="space-y-3.5 mb-2">
                {modalConfig.inputs.map((input) => (
                  <div key={input.id}>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {input.label}{' '}
                      {input.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type={input.type}
                      placeholder={input.placeholder}
                      value={modalData[input.id] || ''}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          [input.id]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8300]/20 focus:border-[#ff8300] text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setModalConfig(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => modalConfig.action(modalData)}
                disabled={modalConfig.inputs?.some(
                  (input) =>
                    input.required && !(modalData[input.id] || '').trim()
                )}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                  modalConfig.isDestructive
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#ff8300] hover:bg-[#e67600]'
                }`}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
