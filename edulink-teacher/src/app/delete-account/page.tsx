'use client';

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Account Deletion</h1>
        <div className="bg-white rounded-xl shadow-sm border p-8 space-y-4">
          <p className="text-gray-600">
            To request deletion of your EduLink account and all associated data, please send an email to:
          </p>
          <a href="mailto:hashim@salih.tech?subject=Account%20Deletion%20Request" className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
            hashim@salih.tech
          </a>
          <p className="text-sm text-gray-400 mt-4">
            Please include your registered email address in the message. We will process your request within 7 business days and delete all personal data including your profile, messages, appointments, and learning history.
          </p>
        </div>
        <p className="text-sm text-gray-400 mt-8">© {new Date().getFullYear()} EduLink. All rights reserved.</p>
      </div>
    </main>
  );
}
