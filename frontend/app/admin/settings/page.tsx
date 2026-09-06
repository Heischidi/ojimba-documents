"use client";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform configuration</p>
      </div>

      <div className="card p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">Download Token Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Configure how download links work. These values are set via environment variables on the backend.</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Token Expiry</span>
              <span className="font-mono text-gray-900">DOWNLOAD_TOKEN_EXPIRY_HOURS</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Max Downloads Per Token</span>
              <span className="font-mono text-gray-900">MAX_DOWNLOADS</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">S3 Signed URL Expiry</span>
              <span className="font-mono text-gray-900">S3_SIGNED_URL_EXPIRY (seconds)</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-1">File Upload Limits</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Maximum File Size</span>
              <span className="font-mono text-gray-900">MAX_FILE_SIZE_MB</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Allowed Extensions</span>
              <span className="font-mono text-gray-900">ALLOWED_EXTENSIONS</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Configuration via Environment Variables</p>
          <p>All platform settings are managed through environment variables on the backend server. Edit your <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the server to apply changes.</p>
        </div>
      </div>
    </div>
  );
}
