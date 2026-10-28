// All copy lives here so it can be edited without touching layout code.

const services = [
  {
    id: 'agents', icon: 'agent', name: 'Custom AI Agents',
    desc: 'AI assistants designed around your business processes, knowledge, and tools.',
    items: ['Lead qualification and routing', 'Internal knowledge assistants', 'Customer support assistance', 'Document information extraction', 'Routine task execution with human oversight'],
  },
  {
    id: 'automation', icon: 'flow', name: 'Business Automation',
    desc: 'Connect your existing applications and eliminate repetitive administrative work.',
    items: ['Form-to-spreadsheet workflows', 'Email and notification automation', 'CRM updates and lead follow-ups', 'Client onboarding', 'Document and reporting workflows'],
  },
  {
    id: 'agency', icon: 'layers', name: 'Agency Automation',
    desc: 'Help agencies manage more clients without multiplying repetitive tasks.',
    items: ['Automated onboarding sequences', 'Client status updates', 'Report preparation', 'Task and deadline reminders', 'Proposal preparation assistance', 'Lead capture and qualification'],
  },
  {
    id: 'data', icon: 'chart', name: 'Business Data Intelligence',
    desc: 'Turn approved business data into useful answers, reports, and decisions.',
    items: ['Natural-language questions about business data', 'Scheduled summaries and dashboards', 'Operational alerts', 'Trend and anomaly detection', 'Data integration and reporting workflows'],
  },
];

const serviceOptions = [...services.map(s => ({ id: s.id, name: s.name })), { id: 'unsure', name: 'Not sure yet' }];

const values = [
  { title: 'Reduce manual work', text: 'Copy-pasting between tools, chasing status updates and retyping the same details are tasks software can usually handle. We find them and remove them.' },
  { title: 'Respond to opportunities faster', text: 'Enquiries, leads and requests get routed, acknowledged and prepared for follow-up without waiting for someone to notice them.' },
  { title: 'Make better use of business data', text: 'Information already sitting in your spreadsheets, CRM and databases can become clear answers and regular reports your team can act on.' },
];

const steps = [
  { n: '01', name: 'Discover', text: 'We understand your business, current tools, and biggest operational bottlenecks.' },
  { n: '02', name: 'Design', text: 'We map the workflow and propose a practical AI or automation solution.' },
  { n: '03', name: 'Build', text: 'We implement and test the agreed workflow, including appropriate permissions and integrations.' },
  { n: '04', name: 'Optimize', text: 'We review performance, resolve issues, and improve the solution based on actual usage and results.' },
];

const industries = [
  { name: 'Marketing and creative agencies', problem: 'Account managers spend hours collecting numbers from several platforms to assemble client reports and status updates.', automation: 'A workflow that gathers approved data, drafts the report, and queues it for a person to review before it is sent.', benefit: 'More time for strategy and client relationships; more consistent reporting.', service: 'agency' },
  { name: 'E-commerce', problem: 'Order questions, return requests and stock notes arrive through inboxes and chats and get handled one by one.', automation: 'An assistant that drafts replies from your policies and order data, and flags unusual cases for staff.', benefit: 'Quicker first responses and fewer repetitive tickets for the team.', service: 'agents' },
  { name: 'Professional services', problem: 'New client intake, document collection and follow-up reminders depend on manual emails and spreadsheets.', automation: 'An onboarding workflow that collects details, creates the client record and schedules reminders.', benefit: 'A smoother start for clients and fewer dropped follow-ups.', service: 'automation' },
  { name: 'Sales teams', problem: 'Leads arrive from forms, email and social channels and are qualified and logged by hand.', automation: 'Automatic capture, simple qualification rules or an assistant that summarises each lead, and CRM updates with human sign-off.', benefit: 'Faster follow-up and cleaner pipeline data.', service: 'agents' },
  { name: 'Customer support', problem: 'Agents search long documents and past tickets to answer similar questions repeatedly.', automation: 'A knowledge assistant that suggests answers with references to your own documentation, for agents to approve.', benefit: 'More consistent answers and shorter handling effort.', service: 'agents' },
  { name: 'Operations and administration', problem: 'Approvals, data entry between systems and recurring reports eat into the working week.', automation: 'Connected workflows that move information between tools, send reminders and produce scheduled summaries.', benefit: 'Fewer manual hand-offs and better visibility of what is pending.', service: 'automation' },
];

const faq = [
  ['What can Starboy Labs automate for my business?', 'Typically repetitive, rule-based or text-heavy work: lead capture and follow-up, client onboarding, reporting, notifications, data entry between tools and document handling. After a conversation about your workflows we will tell you honestly what is a good candidate and what is not.'],
  ['Do I need to replace my existing software?', 'Usually not. We aim to connect the tools you already use, such as spreadsheets, email, CRMs and forms. Whether that is possible depends on what integrations or APIs each tool offers, which we check during discovery.'],
  ['Can you build custom AI agents?', 'Yes. We design agents around your processes and knowledge, with defined permissions and clear points where a person approves or reviews the work. Scope and feasibility are confirmed per project.'],
  ['Can AI work with our existing databases?', 'Often yes, when access is approved and secured. We would agree which data the system may use, how it connects, and what it is allowed to do with it, before building anything.'],
  ['How do you protect business data?', 'We work on the principle of least access: only approved data, with credentials stored securely on the server side and never in front-end code. Details such as hosting, retention and any third-party AI providers are agreed per project and written down.'],
  ['Can humans review AI-generated outputs?', 'Yes, and for anything important we recommend it. Workflows can be designed so that drafts, messages or updates wait for approval before they are sent or saved.'],
  ['How long does implementation take?', 'It depends on the number of tools, the data involved and how clearly the process is defined. We do not quote fixed timelines in advance; you will receive an estimate after discovery.'],
  ['How is a project priced?', 'Pricing depends on scope: the workflows involved, integrations, testing needs and any ongoing support. We will provide a proposal after understanding your requirements rather than a one-size-fits-all price list.'],
  ['Do you work with agencies and international clients?', 'Yes. Starboy Labs is set up to work with agencies and businesses in India and abroad. Share your location and preferred way of communicating in the contact form and we will take it from there.'],
];

const principles = [
  ['Business-first problem solving', 'We start with the bottleneck, not the technology. If automation is not the right answer, we will say so.'],
  ['Tailored to existing workflows', 'Solutions are designed around the tools and habits your team already has.'],
  ['Responsible use of AI', 'AI is used where it helps, with its limits made clear, rather than everywhere by default.'],
  ['Human oversight', 'Important decisions and outbound actions can be routed to a person for approval.'],
  ['Secure handling of business data', 'Least-access permissions and server-side credentials, agreed in writing per project.'],
  ['Transparent implementation and testing', 'You see the workflow map, what was built, and how it was tested.'],
];

// ---- Opportunity finder: transparent, rule-based ----
const finder = {
  questions: [
    { id: 'business', label: 'What type of business do you run?', type: 'radio', options: [['agency', 'Marketing or creative agency'], ['ecom', 'E-commerce'], ['services', 'Professional services'], ['startup', 'Startup or founder-led business'], ['sales_support', 'Sales or customer support team'], ['other', 'Something else']] },
    { id: 'task', label: 'What task consumes the most repetitive manual work?', type: 'radio', options: [['leads', 'Capturing and following up leads'], ['reporting', 'Preparing reports and client updates'], ['onboarding', 'Onboarding new clients or customers'], ['support', 'Answering repeated customer or team questions'], ['documents', 'Entering data from documents, emails or forms'], ['reminders', 'Chasing approvals, tasks and deadlines'], ['data', 'Getting answers out of our data']] },
    { id: 'tools', label: 'Which tools do you currently use?', type: 'checkbox', options: [['sheets', 'Spreadsheets (Google Sheets, Excel)'], ['email', 'Email (Gmail, Outlook)'], ['crm', 'A CRM (HubSpot, Zoho, Salesforce, etc.)'], ['pm', 'Project tools (Asana, ClickUp, Trello, etc.)'], ['ads', 'Ad or analytics platforms'], ['store', 'Shopify, WooCommerce or similar'], ['db', 'A database or internal system'], ['chat', 'WhatsApp, Slack or website chat']] },
    { id: 'freq', label: 'How often does this task occur?', type: 'radio', options: [['daily', 'Many times a day'], ['weekly', 'A few times a week'], ['monthly', 'Monthly or occasionally']] },
    { id: 'goal', label: 'What result would you most like to achieve?', type: 'radio', options: [['time', 'Save team time'], ['speed', 'Respond faster'], ['accuracy', 'Fewer mistakes and missed items'], ['insight', 'Clearer insight from our data']] },
  ],
  tasks: {
    leads: { service: 'agents', title: 'Lead capture, qualification and follow-up', workflow: ['Enquiry arrives through a form, email or chat', 'Details are captured in one place and checked against simple qualification rules (or summarised by an AI assistant)', 'The lead is created or updated in your CRM or spreadsheet', 'A draft acknowledgement and an owner notification are prepared', 'A person approves anything customer-facing before it goes out'], integrations: ['Website form or chat tool', 'CRM or spreadsheet API', 'Email or messaging provider'], limits: ['Qualification rules need to be defined together', 'Replies should be reviewed until quality is proven', 'Messaging channels may have platform rules for automated outreach'] },
    reporting: { service: 'agency', title: 'Report and client-update drafting', workflow: ['Scheduled trigger collects data from approved sources', 'Figures are placed into a consistent report template', 'A summary draft is generated for the account manager', 'The manager reviews and edits the draft', 'The approved report is sent through an authorised channel'], integrations: ['Analytics or ad platform exports/APIs', 'Spreadsheet or reporting tool', 'Email or shared drive'], limits: ['Data access depends on each platform\'s API and permissions', 'Narrative summaries need human review for accuracy', 'Custom layouts may need extra design work'] },
    onboarding: { service: 'automation', title: 'Client onboarding workflow', workflow: ['New client is confirmed (form, contract or CRM stage change)', 'Welcome message and information request are prepared', 'Client folder, project and tasks are created from a template', 'Team members are notified with deadlines', 'Missing items trigger reminders'], integrations: ['CRM or form tool', 'Project management tool', 'Email and file storage'], limits: ['Template steps must be agreed first', 'Contract or payment steps may need manual confirmation', 'Reminders should respect client communication preferences'] },
    support: { service: 'agents', title: 'Knowledge and support assistant', workflow: ['Question arrives from a customer or team member', 'Assistant searches your approved documents and past answers', 'It drafts a response and cites the source material', 'A person approves or edits before sending', 'Unanswered questions are logged to improve the knowledge base'], integrations: ['Help desk, inbox or chat tool', 'Document storage or knowledge base', 'Optional order or customer system'], limits: ['Answers are only as good as the source documents', 'AI-drafted answers can be wrong, so review points matter', 'Sensitive data access needs explicit approval'] },
    documents: { service: 'agents', title: 'Document and email data extraction', workflow: ['Document, email or form arrives in a defined inbox or folder', 'Key fields are extracted into a structured format', 'Low-confidence items are flagged for checking', 'Verified data is written to your spreadsheet or system', 'An exceptions list is shared with the team'], integrations: ['Email or storage folder', 'Spreadsheet, database or accounting/CRM system', 'Optional OCR or AI extraction service'], limits: ['Poor scans or varied layouts reduce accuracy', 'A review step is recommended for important records', 'Data protection requirements may restrict which services can be used'] },
    reminders: { service: 'automation', title: 'Task, approval and deadline reminders', workflow: ['Tasks and due dates are read from your project tool or sheet', 'Overdue or upcoming items are identified by rules', 'Owners receive reminders through their preferred channel', 'Approvals are collected with one-click links', 'A summary of pending items is sent to managers'], integrations: ['Project management tool or spreadsheet', 'Email, Slack or WhatsApp provider', 'Calendar (optional)'], limits: ['Over-notifying can be counterproductive, so thresholds need tuning', 'Depends on tasks being kept up to date', 'Some channels have rate or template limits'] },
    data: { service: 'data', title: 'Business data questions and scheduled summaries', workflow: ['Agree which approved data sources can be used', 'Data is connected and cleaned into a consistent view', 'Team members ask questions in plain language or receive scheduled summaries', 'Answers show the underlying figures so they can be checked', 'Alerts fire when agreed thresholds are crossed'], integrations: ['Database, data warehouse or spreadsheets', 'Analytics or finance tools', 'Dashboard or messaging tool for delivery'], limits: ['Data quality limits answer quality', 'Access must be read-only and permissioned', 'Natural-language answers should show their source for verification'] },
  },
  freqNote: { daily: 'Because this happens many times a day, it is a strong candidate to look at first.', weekly: 'A few times a week is a good fit for automation, especially if several people repeat the task.', monthly: 'Occasional tasks can still be worth automating if they are long or error-prone; otherwise a simple template may be enough.' },
  goalNote: { time: 'Focus: remove hand-offs and copy-paste steps.', speed: 'Focus: automatic triggers and instant acknowledgements.', accuracy: 'Focus: validation checks and an exceptions list for people to review.', insight: 'Focus: connecting data sources and scheduling regular summaries.' },
  toolNames: { sheets: 'Spreadsheets', email: 'Email', crm: 'CRM', pm: 'Project tools', ads: 'Ad/analytics platforms', store: 'Store platform', db: 'Database', chat: 'Chat/messaging' },
};

const manualFlow = ['Collect data', 'Open multiple tools', 'Copy information', 'Prepare report', 'Email client'];
const autoFlow = [['Collect approved data', false], ['Generate report draft', false], ['Review results', true], ['Send through an authorized workflow', false]];

module.exports = { services, serviceOptions, values, steps, industries, faq, principles, finder, manualFlow, autoFlow };
