import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-neutral-800 selection:text-white pb-20">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 pt-12 relative z-10">
        {/* Navigation / Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white">
            <Shield className="w-8 h-8 text-neutral-200" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
            <p className="text-muted-foreground text-xs mt-1">Last Updated: June 21, 2026</p>
          </div>
        </div>

        {/* Glass panel container */}
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl space-y-8 bg-neutral-900/40 backdrop-blur-md">
          
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Safe & Private</h3>
              <p className="text-[11px] text-gray-400 leading-normal">Your information is used solely to fill your own application forms. No selling or trading.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-sm">Local Execution</h3>
              <p className="text-[11px] text-gray-400 leading-normal">Fields are auto-filled locally in your browser. We don't save credentials or keys.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Sync Control</h3>
              <p className="text-[11px] text-gray-400 leading-normal">Synchronize data with your local database server. You have full rights to wipe or delete it.</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 space-y-6 text-xs leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                1. Introduction
              </h2>
              <p className="text-gray-300">
                SmartApply ("we," "our," or "the Extension") is a browser extension designed to help users streamline job applications by autofilling application forms, managing profile information, and assisting with job application workflows.
              </p>
              <p className="text-gray-300">
                This Privacy Policy explains what information we collect, how we use it, and the choices available to users.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                2. Information We Collect
              </h2>
              <div className="space-y-2 pl-3">
                <h3 className="font-bold text-white">A. User Profile Information</h3>
                <p className="text-gray-300">
                  The Extension may collect and store information voluntarily provided by users, including: full name, email address, phone number, resume information, employment history, education details, skills and certifications, and professional profile links. This information is used solely to assist users in completing job applications.
                </p>
                <h3 className="font-bold text-white">B. Job Application Information</h3>
                <p className="text-gray-300">
                  The Extension may access: job titles, company names, job descriptions, application form fields, and application status. This data is processed to identify relevant forms on supported platforms and update your centralized tracking dashboard.
                </p>
                <h3 className="font-bold text-white">C. Extension Settings</h3>
                <p className="text-gray-300">
                  We store user preferences, autofill toggles, and configuration data to maintain extension functionality.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                3. Information We Do Not Collect
              </h2>
              <p className="text-gray-300">
                SmartApply does not intentionally collect financial details, payment card tokens, banking information, health profiles, government-issued IDs, or communications unrelated to job applications. We do not store website passwords or auth credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                4. How We Use Information
              </h2>
              <p className="text-gray-300">
                We use collected information solely to autofill forms, help users manage application logs, save configuration preferences, and improve the extension. We do not monetize your data, nor do we run advertising trackers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                5. Data Storage & Retention
              </h2>
              <p className="text-gray-300">
                Your data is stored locally within your secure browser sandbox, and synced to your central server database (localhost). User information is retained only as long as necessary to provide extension functionality or until you choose to delete it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                6. Data Sharing
              </h2>
              <p className="text-gray-300">
                We do not sell, rent, or trade user information. We do not share data with third parties except to comply with legal obligations or when explicitly requested by you (such as clicking to submit a form on a target employer website).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                7. User Rights & Controls
              </h2>
              <p className="text-gray-300">
                You can review, update, or completely delete your profile information, resume details, and logs at any time from your main settings page, or by uninstalling the browser extension.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white rounded-full"></span>
                8. Contact Information
              </h2>
              <p className="text-gray-300">
                For questions regarding this policy or data management, contact us at:
              </p>
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl font-mono text-[11px] text-gray-200">
                Email: support@smartapply.ai
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
