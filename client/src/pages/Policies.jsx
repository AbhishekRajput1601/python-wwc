import React from "react";
import { Link } from "react-router-dom";

const Policies = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Terms of Service</h1>
        <p className="text-neutral-600 mb-2">World Wide Connect (WWC)</p>
        <p className="text-neutral-500 mb-8">Last updated: [01/01/2026]</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1.1 Agreement &amp; Acceptance</h2>
          <p className="text-neutral-600 leading-relaxed">
            These Terms constitute a legally binding agreement between you ("User", "you") and World Wide Connect ("WWC", "we", "us", "our"). By accessing, creating an account, hosting, joining, or participating in any meeting on WWC, you acknowledge that you have read, understood, and agree to be bound by these Terms and all related policies incorporated by reference. If you do not agree to these Terms: you must not access or use the Service, you must immediately discontinue any ongoing use, and you may not participate in meetings hosted on the platform. Continued use of the Service constitutes ongoing acceptance of these Terms, including any future updates.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1.2 Definitions &amp; Interpretation</h2>
          <p className="text-neutral-600 leading-relaxed">
            For the purposes of these Terms:
          </p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mt-2">
            <li>"Service" means the World Wide Connect website and all related features, tools, and functionalities.</li>
            <li>"User" means any individual or entity accessing or using the Service.</li>
            <li>"Host" means a User who creates, schedules, or controls a meeting.</li>
            <li>"Participant" means any User who joins a meeting.</li>
            <li>"Meeting Data" means audio, video, chat messages, shared screens, recordings, captions, translations, transcripts, timestamps, and speaker identifiers generated during meetings.</li>
            <li>"AI Features" means automated systems used for real-time translation, captions, and speaker detection.</li>
          </ul>
          <p className="text-neutral-600 mt-2">Interpretation rules: headings are for convenience only, singular includes plural and vice versa, and "including" means "including without limitation".</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1.3 Eligibility &amp; Authority</h2>
          <p className="text-neutral-600 leading-relaxed">
            You represent and warrant that you are at least the minimum legal age required to enter into a binding contract in your jurisdiction and are legally permitted to use the Service under applicable laws. If you use the Service on behalf of an organization, you have full authority to bind that entity to these Terms. You are solely responsible for ensuring compliance with all local, national, and international laws, including laws governing recording, surveillance, privacy, and data protection.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1.4 Description of Services</h2>
          <p className="text-neutral-600 leading-relaxed">WWC provides a browser-based communication platform enabling Users to:</p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mt-2">
            <li>Conduct real-time video and audio meetings</li>
            <li>Exchange text-based chat messages</li>
            <li>Share screens and visual content (without file ownership transfer)</li>
            <li>Enable meeting recording, subject to host authorization</li>
            <li>Use real-time AI-based voice translation</li>
            <li>View live captions</li>
            <li>Access post-meeting recordings, transcripts, timestamps, and speaker attribution</li>
          </ul>
          <p className="text-neutral-600 mt-2">Certain features may depend on browser compatibility, network quality, user permissions, and regional legal restrictions. WWC does not guarantee that all features will be available at all times or in all jurisdictions.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1.5 User Obligations</h2>
          <p className="text-neutral-600 leading-relaxed">You agree to:</p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mt-2">
            <li>Use the Service only for lawful purposes</li>
            <li>Respect the privacy, rights, and dignity of other Users</li>
            <li>Obtain all legally required consent before recording, captioning, or translating meetings</li>
            <li>Comply with all applicable surveillance, interception, and data protection laws</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Immediately notify WWC of any unauthorized access or security breach</li>
          </ul>
          <p className="text-neutral-600 mt-2">You acknowledge that WWC does not monitor meetings and that compliance obligations rest with the User.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1.6 Prohibited Conduct</h2>
          <p className="text-neutral-600 leading-relaxed">You must not, directly or indirectly:</p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mt-2">
            <li>Impersonate any person or entity</li>
            <li>Record meetings without lawful consent</li>
            <li>Harass, threaten, abuse, or intimidate others</li>
            <li>Share illegal, infringing, or harmful content</li>
            <li>Attempt to bypass encryption, authentication, or security controls</li>
            <li>Introduce malware, exploits, or automated attacks</li>
            <li>Reverse engineer or attempt to extract source code or system logic</li>
          </ul>
          <p className="text-neutral-600 mt-2">Any such conduct may result in immediate enforcement action.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">1.7 Account Suspension &amp; Termination</h2>
          <p className="text-neutral-600 leading-relaxed">WWC reserves the right to suspend, restrict, or terminate access to the Service, with or without notice, if these Terms are violated, there is suspected unlawful activity, there is a security threat or abuse risk, or as required by law or legal process. Upon termination, access to the Service may be permanently revoked, stored data may be deleted in accordance with retention policies, and no refunds or compensation are owed unless required by law.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">1.8 Disclaimers &amp; Service Availability</h2>
          <p className="text-neutral-600 leading-relaxed">The Service is provided on an "AS IS" and "AS AVAILABLE" basis. WWC makes no warranties, express or implied, including but not limited to fitness for a particular purpose, accuracy of AI-generated captions or translations, uninterrupted or error-free operation, or availability of any specific feature. WWC may modify, suspend, or discontinue features at any time without liability.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">1.9 Limitation of Liability</h2>
          <p className="text-neutral-600 leading-relaxed">To the maximum extent permitted by law, WWC shall not be liable for indirect, incidental, consequential, special, or punitive damages. WWC is not responsible for User-generated content or conduct; Users bear full responsibility for meeting compliance, recordings, and disclosures. If liability cannot be excluded, WWC’s total cumulative liability shall be limited to the amount paid by the User to WWC in the preceding twelve (12) months, or zero where the Service is free, unless otherwise required by law.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">1.10 Indemnification</h2>
          <p className="text-neutral-600 leading-relaxed">You agree to indemnify, defend, and hold harmless WWC, its directors, officers, employees, and affiliates from any claims, damages, losses, liabilities, or expenses arising from your use of the Service, violation of these Terms, violation of any law or third-party rights, or failure to obtain required consent. This obligation survives termination.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">1.11 Governing Law &amp; Jurisdiction</h2>
          <p className="text-neutral-600 leading-relaxed">These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict-of-law principles. Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the competent courts located in India. Nothing in this section shall limit or exclude any statutory rights or remedies available to consumers under applicable law that cannot be waived or restricted.</p>
        </section>

        {/* Divider */}
        <hr className="my-12 border-t-2 border-neutral-200" />

        {/* Privacy Policy */}
        <section className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Privacy Policy</h1>
          <p className="text-neutral-600 mb-2">World Wide Connect (WWC)</p>
          <p className="text-neutral-500 mb-8">Last updated: [01/01/2026]</p>

          <p className="text-neutral-600 mb-6">World Wide Connect ("WWC", "we", "us", "our") is committed to protecting user privacy through strict data minimization, encryption-by-default, and lawful-access-only disclosure. This Privacy Policy explains exactly what data is collected, how it is used, how it is protected, and when it may be disclosed. This policy applies to all users worldwide.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3">2.1 Privacy Principles &amp; Design Philosophy</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">WWC is built on the following non-negotiable principles:</p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mb-3">
            <li>Data Minimization – collect only what is strictly required</li>
            <li>Purpose Limitation – data is used only for defined purposes</li>
            <li>Encryption-by-Default – meeting content is always encrypted</li>
            <li>No Commercial Exploitation – no selling, profiling, or advertising</li>
            <li>Lawful Disclosure Only – data shared only via valid legal process</li>
          </ul>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.2 Scope of This Policy</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">This Privacy Policy governs website access and account creation, participation in meetings, use of recording, captions, and translation features, and backend security and authentication processes. This policy does not apply to third-party websites accessed via external links.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.3 Personal Data Collected (EXHAUSTIVE &amp; LIMITED)</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC collects only the following personal data:
          </p>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.3.1 Account Identifier</h3>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mb-3">
            <li>Email address — used for account creation, authentication, and essential communication; not used for marketing, advertising, or profiling</li>
          </ul>

          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.3.2 Login &amp; Access Logs</h3>
          <p className="text-neutral-600 mb-2">Login timestamps, session duration, IP address, and authentication success/failure indicators. Collected strictly for security monitoring, abuse prevention, and legal compliance.</p>

          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.3.3 Device &amp; Browser Information (At Login Only)</h3>
          <p className="text-neutral-600 mb-3">Operating system type, browser type and version, and device category (desktop, laptop, mobile). Collected only to detect suspicious access, prevent account compromise, and improve platform security.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.4 Data Explicitly NOT Collected (Important)</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC does not collect, request, infer, or store full names or profile photos, phone numbers or contact lists, physical addresses, biometric data or voiceprints, behavioral analytics or tracking profiles, advertising identifiers, background activity or keystrokes, or meeting content for analytics or training. No hidden data collection exists.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.5 Meeting Content &amp; Encryption</h2>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.5.1 Encrypted Meeting Data</h3>
          <p className="text-neutral-600 mb-2">All meeting-related data is encrypted, including audio streams, video streams, chat messages, screen sharing, recordings, captions, translations, transcripts, and speaker names and timestamps. Encryption is applied in transit and at rest.</p>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.5.2 No Content Monitoring</h3>
          <p className="text-neutral-600 mb-3">WWC does not monitor live meetings, review recordings, analyze content, or perform human moderation. Meeting privacy is preserved by design.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.6 Purpose of Data Processing</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Collected data is used only to authenticate users, secure accounts and sessions, prevent fraud and abuse, enable core meeting functionality, and comply with legal obligations. Data is never used for advertising, behavioral profiling, AI model training, or cross-platform tracking.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.7 AI Processing &amp; Privacy Boundary</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            AI systems used for captions and translation process data only in real time, do not retain raw data, do not store intermediate outputs, and do not use data for training or improvement. AI outputs remain encrypted and user-controlled.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.8 Data Retention Policy</h2>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.8.1 Account &amp; Log Data</h3>
          <p className="text-neutral-600 mb-2">Retained only for the minimum period required by security needs and legal obligations.</p>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.8.2 Meeting Data</h3>
          <p className="text-neutral-600 mb-3">Meeting recordings, transcripts, captions, and translations are stored in encrypted form and retained for fifteen (15) days by default. Data is accessible to both hosts and participants during this period. Beyond the 15-day period, continued access requires an active premium subscription; data remains encrypted and user-accessible only while the subscription is active; upon subscription expiry or cancellation, data is permanently deleted. WWC does not retain meeting data beyond the defined retention or subscription period.</p>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">2.8.3 Deletion</h3>
          <p className="text-neutral-600 mb-3">Deletion is irreversible; data is permanently erased within a reasonable technical timeframe.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.9 Data Sharing &amp; Disclosure</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC does not sell, rent, trade, or license user data.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Data is disclosed only when required by valid court orders, lawfully issued government demands, or statutory legal obligations. Requests are reviewed for jurisdiction, scope, and legal validity.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.10 International Data Transfers</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            As a global service, limited data may be processed across jurisdictions with appropriate safeguards applied to comply with applicable data protection laws.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.11 User Rights</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Depending on applicable law, users may request access to stored personal data, correction of email information, deletion of account and associated data, and restriction of processing where legally applicable. Requests are verified for security before execution.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.12 Security Safeguards</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC employs strong encryption standards, secure authentication, access control mechanisms, and monitoring for unauthorized access. Despite safeguards, no system can guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.13 Policy Changes</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            This Privacy Policy may be updated to reflect legal changes, security improvements, or platform enhancements. Continued use constitutes acceptance of updated terms.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">2.14 Contact Information</h2>
          <p className="text-neutral-600 mb-4">World Wide Connect – Privacy &amp; Compliance Office<br/>Email: <a href="mailto:Support@worldwideconnect.in" className="text-wwc-400">Support@worldwideconnect.in</a></p>

        </section>

        {/* Divider */}
        <hr className="my-12 border-t-2 border-neutral-200" />

        {/* AI & Automated Processing Policy */}
        <section className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">AI &amp; Automated Processing Policy</h1>
          <p className="text-neutral-600 mb-2">World Wide Connect (WWC)</p>
          <p className="text-neutral-500 mb-8">Last updated: [01/01/2026]</p>

          <p className="text-neutral-600 leading-relaxed mb-6">This AI &amp; Automated Processing Policy governs the design, deployment, operation, limitations, and legal treatment of all artificial intelligence ("AI") and automated systems used by World Wide Connect ("WWC", "we", "us"). This policy applies globally and is intended to meet or exceed emerging international AI governance standards.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3">3.1 Purpose and Scope of AI Use</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">WWC deploys AI systems solely to enhance accessibility, inclusivity, and communication effectiveness during live meetings. AI systems are not used for surveillance, profiling, behavioral prediction, identity verification, emotion analysis, advertising, or monetization. Scope is strictly limited to functional delivery of user-requested features.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.2 Categories of AI Systems Employed</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC employs narrow, task-specific AI systems including:
          </p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mb-3">
            <li><strong>Speech-to-Text Systems</strong> — live captions.</li>
            <li><strong>Speech-to-Speech Translation Systems</strong> — real-time translations.</li>
            <li><strong>Speaker Segmentation &amp; Attribution</strong> — timestamps and transcript attribution.</li>
          </ul>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.3 Nature of AI Processing (Technical &amp; Legal)</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            AI processing is real-time or user-initiated, transient in memory, context-limited, and stateless beyond task execution. Raw audio/video streams are processed only for the duration required to generate outputs and are not persistently stored by AI subsystems.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.4 Explicit Prohibition on AI Training Using User Data</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC commits that meeting audio, video, captions, transcripts, or translations are never used to train AI models. No fine-tuning, reinforcement learning, benchmarking, synthetic derivatives, or third-party model improvement using WWC data is permitted. This prohibition is permanent and retroactive.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.5 AI Data Flow &amp; Containment Architecture</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            AI subsystems do not retain raw inputs; intermediate computational states are discarded immediately after output generation; outputs remain encrypted and under user control; AI systems cannot independently access stored recordings or transcripts.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.6 No Human Review, Annotation, or Labeling</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC enforces a human non-intervention rule: no WWC employee reviews AI-generated captions or translations, no manual correction or annotation is performed, and no human quality-control sampling is conducted on user data. Human access occurs only if legally compelled under valid legal process.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.7 Accuracy, Reliability, and Risk Disclosure</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            AI outputs may contain inaccuracies, omissions, or mistranslations and are probabilistic rather than deterministic. Outputs may be affected by accent, audio quality, dialect, or background noise. WWC disclaims all warranties regarding linguistic, contextual, or semantic accuracy; AI outputs must not be relied upon for legal, medical, financial, or emergency decisions.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.8 Bias, Fairness, and Non-Discrimination Statement</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC recognizes AI limitations and does not use AI outputs for decisions affecting rights or access. No automated decisions with legal or significant effects are made. WWC evaluates AI systems for systemic risk without content review.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.9 User Control &amp; Feature Activation</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            AI features are activated explicitly by users or hosts, visible to all participants, and deactivatable at any time. Users may choose preferred output language and caption visibility. No AI feature is silently enabled.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.10 AI and Consent Alignment</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            AI processing of audio is treated as audio processing under privacy and surveillance laws. The meeting host is responsible to inform participants of AI usage, obtain legally valid consent, and ensure jurisdictional compliance. WWC does not verify consent.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.11 Regulatory Alignment &amp; Forward Compliance</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            This policy aligns with global data protection frameworks, emerging AI governance regimes, and risk-based AI regulation models. WWC classifies its AI systems as limited-risk, user-controlled, non-autonomous, non-profiling, and non-decision-making.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.12 Third-Party AI Infrastructure Safeguards</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Where third-party AI infrastructure is used, providers act solely as technical processors; data ownership remains with users; no independent data rights are granted; contractual confidentiality and security obligations apply.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.13 Auditability &amp; Accountability</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC maintains internal documentation of AI system purposes, version control and rollback mechanisms, risk evaluation records, and legal review procedures to ensure accountability without content access.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.14 Policy Enforcement</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Any violation of this AI policy by internal teams or service providers constitutes a material breach of contract, grounds for termination of access or engagement, and immediate remediation obligations.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.15 Policy Evolution</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            This policy may be updated to reflect legal developments, technological changes, or security enhancements. Material changes will be communicated where required by law.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.16 Contact</h2>
          <p className="text-neutral-600 mb-4">World Wide Connect – AI Governance &amp; Compliance Office<br/>Email: <a href="mailto:Support@worldwideconnect.com" className="text-wwc-400">Support@worldwideconnect.com</a></p>

        </section>

        {/* Divider */}
        <hr className="my-12 border-t-2 border-neutral-200" />

        {/* Legal Consent & Recording Policy */}
        <section className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Legal Consent &amp; Recording Policy</h1>
           <p className="text-neutral-600 mb-2">World Wide Connect (WWC)</p>
          <p className="text-neutral-500 mb-8">Last updated: [01/01/2026]</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3">4.4 Legal Consent Responsibility (CRITICAL)</h2>
          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">4.4.1 Host Bears Sole Responsibility</h3>
          <p className="text-neutral-600 mb-3">The meeting host bears sole and exclusive responsibility for informing all participants that recording and/or AI processing is enabled, obtaining all legally required consent, and ensuring compliance with applicable laws. WWC does not verify consent, enforce consent collection, or assume liability for consent failures.</p>

          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">4.4.2 Jurisdictional Variability</h3>
          <p className="text-neutral-600 mb-3">Recording and audio processing laws vary by jurisdiction, including one-party consent laws, all-party consent laws, and sector-specific regulations (employment, education, healthcare). Hosts are responsible for understanding and complying with the laws applicable to each participant’s location.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.5 Captions &amp; Translation as Audio Processing</h2>
          <p className="text-neutral-600 mb-3">Live captions and real-time translation are legally treated as audio processing, even when no permanent recording is saved. Accordingly, consent obligations apply equally to captions and translations; participants must be informed prior to activation; and silence or continued participation may not constitute valid consent in some jurisdictions.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.6 Participant Rights &amp; Autonomy</h2>
          <p className="text-neutral-600 mb-2">Participants have rights related to recordings and AI processing.</p>
          <ul className="list-disc list-inside text-neutral-600 ml-4 mb-3">
            <li><strong>4.6.1 Right to Be Informed</strong> — Participants have the right to know whether recording or AI processing is active and what types of data are being generated.</li>
            <li><strong>4.6.2 Right to Leave</strong> — Participants may leave a meeting if they do not consent and may decline participation without penalty imposed by WWC. WWC does not force participation.</li>
            <li><strong>4.6.3 No Covert Recording</strong> — WWC strictly prohibits hidden recording, misrepresentation of recording status, and circumvention of platform indicators. Such conduct constitutes a material violation of platform policies.</li>
          </ul>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.7 Storage, Access &amp; Control of Recordings</h2>
          <p className="text-neutral-600 mb-3">All recordings, captions, translations, and transcripts are stored in encrypted form, protected using industry-standard encryption, and secured against unauthorized access. Meeting data is stored on secure servers and synchronized with cloud-based storage systems where applicable.</p>

          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">4.7.2 Access Control</h3>
          <p className="text-neutral-600 mb-3">Access to recordings and transcripts is available to the meeting host and all participants of the meeting; access is governed by authentication controls and platform permissions. WWC does not restrict transcript visibility to hosts only.</p>

          <h3 className="text-base font-semibold text-neutral-900 mt-2 mb-1">4.7.3 Retention Period &amp; Premium Access Model</h3>
          <p className="text-neutral-600 mb-3">Recorded meeting data, including videos and transcripts, is stored on WWC servers for a maximum of fifteen (15) days from the meeting date and remains fully accessible to hosts and participants during this period. After the 15-day retention period, recordings and transcripts are automatically deleted unless the user enrolls in an active premium subscription. Premium subscribers may retain access to saved recordings and transcripts while the subscription is active; access is lost immediately upon subscription expiry. Data is permanently deleted once retention or subscription conditions lapse.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.8 Prohibited Uses of Recordings</h2>
          <p className="text-neutral-600 mb-3">Users must not distribute recordings unlawfully, use recordings for harassment, coercion, or surveillance, alter recordings to misrepresent participants, or use recordings in violation of employment, labor, or privacy laws. WWC disclaims responsibility for misuse by users.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.9 Law Enforcement &amp; Legal Requests</h2>
          <p className="text-neutral-600 mb-3">Recordings may be disclosed only under valid court order, lawful government demand, or in compliance with statutory obligations. All disclosures follow WWC’s Lawful Access Policy and are scope-limited.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.10 Liability Allocation</h2>
          <p className="text-neutral-600 mb-3">Recording or automated processing initiated by any participant does not transfer legal responsibility to WWC. The individual initiating recording, along with the host, remains responsible for consent compliance under applicable law. To the maximum extent permitted by law, WWC is not liable for unlawful recording by users; hosts indemnify WWC against claims arising from consent violations; and participants are responsible for understanding meeting conditions.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.11 Policy Enforcement</h2>
          <p className="text-neutral-600 mb-3">Violations of this policy may result in immediate suspension or termination, referral to legal authorities where required, and permanent account restriction.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.12 Policy Updates</h2>
          <p className="text-neutral-600 mb-3">This policy may be updated to reflect changes in recording laws, regulatory guidance, or platform capabilities. Continued use constitutes acceptance.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">4.13 Contact</h2>
          <p className="text-neutral-600 mb-4">World Wide Connect – Legal &amp; Compliance Office<br/>Email: <a href="mailto:Support@worldwideconnect.in" className="text-wwc-400">Support@worldwideconnect.in</a></p>

        </section>

        {/* Divider */}
        <hr className="my-12 border-t-2 border-neutral-200" />

        {/* Security & Incident Response Policy */}
        <section className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Security &amp; Incident Response Policy</h1>
          <p className="text-neutral-600 mb-2">World Wide Connect (WWC)</p>
          <p className="text-neutral-500 mb-8">Last updated: [01/01/2026]</p>

          <p className="text-neutral-600 leading-relaxed mb-6">This Security &amp; Incident Response Policy defines the technical, organizational, and procedural safeguards implemented by World Wide Connect ("WWC", "we", "us") to protect platform integrity, user accounts, and encrypted meeting data, and to govern the detection, response, mitigation, and notification of security incidents. This policy applies globally to all systems, services, personnel, contractors, and subprocessors involved in the operation of WWC.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3">5.1 Security Governance &amp; Responsibility</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">WWC maintains a formal security governance structure ensuring accountability, oversight, and continuous improvement. Key principles include security-by-design, least-privilege access, defense-in-depth, and continuous risk assessment. Security responsibilities are assigned across engineering, operations, and compliance; personnel with system access are subject to confidentiality and security obligations.</p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.2 Security Architecture Overview</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC's security architecture protects user authentication data, encrypted meeting content, AI processing pipelines, and infrastructure layers. It includes segmentation of systems, isolation of AI components, strong cryptographic enforcement, and redundant monitoring and alerting.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.3 Encryption &amp; Cryptographic Controls</h2>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.3.1 Data in Transit</strong> — All data transmitted between users, servers, and supporting services is protected using industry-standard encryption protocols.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.3.2 Data at Rest</strong> — Stored data, including recordings, transcripts, logs, and metadata, is encrypted at rest using strong cryptographic algorithms.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            <strong>5.3.3 Key Management</strong> — Encryption keys are securely generated, protected against unauthorized access, and rotated per best practices. WWC personnel do not have unrestricted access to encryption keys.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.4 Identity, Authentication &amp; Access Control</h2>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.4.1 Account Authentication</strong> — User access is protected through secure authentication mechanisms to prevent unauthorized access and credential abuse.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.4.2 Least Privilege Enforcement</strong> — Internal access to systems and data is granted strictly on a need-to-know basis.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            <strong>5.4.3 Access Logging</strong> — Administrative and system access is logged and monitored to detect unauthorized or anomalous activity.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.5 Network &amp; Infrastructure Security</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC employs layered network protections including segmentation, traffic filtering and rate limiting, DDoS protections, and secure configuration management. Infrastructure is continuously monitored for vulnerabilities and misconfigurations.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.6 Application &amp; Platform Security</h2>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.6.1 Secure Development Practices</strong> — Code review, dependency management, and vulnerability assessment are standard practices.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            <strong>5.6.2 Change Management</strong> — System changes are controlled, reviewed, and tested to minimize security risk.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.7 Logging, Monitoring &amp; Threat Detection</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC maintains continuous monitoring to detect unauthorized access attempts, suspicious login behavior, system anomalies, and potential data exposure. Logs are protected against tampering and retained only as necessary for security and legal purposes.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.8 Security Incident Definition</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            A Security Incident includes events that compromise or threaten confidentiality, integrity, availability, or lawful access controls — e.g., unauthorized access, data breaches, malware, DDoS, or insider misuse.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.9 Incident Detection &amp; Identification</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC uses automated alerts, system monitoring, and internal reporting channels to identify and classify security incidents based on severity, scope, and impact.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.10 Incident Response Process</h2>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.10.1 Identification</strong> — Detection and initial assessment.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.10.2 Containment</strong> — Immediate actions to limit impact.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.10.3 Investigation</strong> — Technical and forensic analysis to determine cause and scope.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.10.4 Remediation</strong> — Corrective actions to eliminate vulnerabilities.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            <strong>5.10.5 Recovery</strong> — Restoration, validation, and monitoring to ensure secure operations.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.11 Data Breach Handling</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            A Data Breach is any confirmed incident involving unauthorized access to personal or encrypted meeting data. WWC evaluates the nature of data, degree of encryption, and likelihood of harm; encrypted data that remains secure may not be reportable under certain laws.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.12 Notification Obligations</h2>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.12.1 User Notification</strong> — Where legally required, WWC will notify affected users without undue delay with incident description, affected data, and mitigation steps.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            <strong>5.12.2 Regulatory Notification</strong> — WWC will notify authorities as required by law; timing and content follow legal requirements.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.13 No Absolute Security Guarantee</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Despite safeguards, no system is completely secure. Users acknowledge inherent internet risks and that incidents may occur despite reasonable measures.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.14 Subprocessor &amp; Vendor Security</h2>
          <p className="text-neutral-600 leading-relaxed mb-2">
            <strong>5.14.1 Security Due Diligence</strong> — Third-party providers undergo security and confidentiality checks.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-3">
            <strong>5.14.2 Contractual Controls</strong> — Subprocessors act only on WWC instructions, have no ownership rights over data, and are prohibited from independent data use.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.15 Internal Training &amp; Awareness</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Personnel with system access receive security awareness training, incident reporting guidance, and are bound by confidentiality obligations.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.16 Audit &amp; Continuous Improvement</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC periodically reviews security controls, incident response effectiveness, and emerging threats; improvements are implemented based on risk assessments and legal developments.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.17 Legal Cooperation</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            WWC cooperates with lawful investigations only under valid legal process and in accordance with applicable law and due process safeguards.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.18 Policy Enforcement</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            Violation of this policy by users, employees, or providers may result in immediate access revocation, contract termination, or legal action where appropriate.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.19 Policy Updates</h2>
          <p className="text-neutral-600 leading-relaxed mb-3">
            This policy may be updated to reflect changes in security practices, regulations, or threat landscape; continued use constitutes acceptance.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">5.20 Contact</h2>
          <p className="text-neutral-600 mb-4">World Wide Connect – Security, Risk &amp; Incident Response Office<br/>Email: <a href="mailto:Support@worldwideconnect.in" className="text-wwc-400">Support@worldwideconnect.in</a></p>

        </section>

        <div className="mt-8">
          <p className="text-neutral-600 mb-4">For the full policy text or further legal customization, replace these placeholders with your finalized legal copy.</p>
          <Link to="/" className="text-sm text-wwc-600 font-semibold hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Policies;
