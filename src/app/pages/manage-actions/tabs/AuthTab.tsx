import { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { ApiIntegration, AuthType, OAuth2GrantType } from '../../../types/apiIntegration';
import { VariableInput } from '../components/VariableInput';
import { CredentialsModal } from '../components/CredentialsModal';

interface AuthTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

const AUTH_TYPE_OPTIONS: { value: AuthType; label: string; description: string }[] = [
  { value: 'none',          label: 'No Auth',          description: 'Public endpoint, no credentials needed' },
  { value: 'bearer',        label: 'Bearer Token',     description: 'Authorization: Bearer <token>' },
  { value: 'api_key',       label: 'API Key',          description: 'Custom key in header or query param' },
  { value: 'basic',         label: 'Basic Auth',       description: 'Username and password (Base64 encoded)' },
  { value: 'oauth2',        label: 'OAuth 2.0',        description: 'Token-based, multiple grant types' },
  { value: 'aws_sig4',      label: 'AWS Signature v4', description: 'Amazon Web Services request signing' },
  { value: 'digest',        label: 'Digest Auth',      description: 'Challenge-response authentication' },
  { value: 'custom_header', label: 'Custom Header',    description: 'Any custom authentication header' },
];

const OAUTH2_GRANTS: { value: OAuth2GrantType; label: string }[] = [
  { value: 'client_credentials',      label: 'Client Credentials (Machine-to-Machine)' },
  { value: 'authorization_code',      label: 'Authorization Code' },
  { value: 'authorization_code_pkce', label: 'Authorization Code + PKCE' },
  { value: 'password',                label: 'Resource Owner Password' },
  { value: 'implicit',                label: 'Implicit (Deprecated)' },
];

export function AuthTab({ integration, onChange }: AuthTabProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const auth = integration.auth;

  const setAuth = (updates: Partial<typeof auth>) =>
    onChange({ ...integration, auth: { ...auth, ...updates } });

  const setType = (type: AuthType) =>
    onChange({ ...integration, auth: { type } });

  return (
    <div className="space-y-5">
      {/* Credential Store shortcut */}
      <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-200/60 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-teal-700">
          <ShieldCheck size={13} />
          <span>Use a saved credential from the store for better security</span>
        </div>
        <button
          onClick={() => setShowCredentials(true)}
          className="text-xs font-medium text-teal-700 hover:text-teal-900 underline underline-offset-2"
        >
          Open Credential Store
        </button>
      </div>

      {/* Auth type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Authentication Type</label>
        <div className="grid grid-cols-2 gap-2">
          {AUTH_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`text-left p-3 rounded-lg border transition-all ${
                auth.type === opt.value
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className={`text-xs font-medium ${auth.type === opt.value ? 'text-teal-800' : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional fields */}
      {auth.type !== 'none' && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/30">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
            Configuration
            {auth.credentialId && (
              <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                Using saved credential
              </span>
            )}
          </p>

          {/* Bearer Token */}
          {auth.type === 'bearer' && (
            <VariableInput
              label="Bearer Token *"
              value={auth.bearerToken ?? ''}
              onChange={(v) => setAuth({ bearerToken: v })}
              placeholder="{{credentials.bearer_token}} or paste token"
            />
          )}

          {/* API Key */}
          {auth.type === 'api_key' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Header / Param Name *</label>
                <input
                  type="text"
                  value={auth.apiKeyName ?? ''}
                  onChange={(e) => setAuth({ apiKeyName: e.target.value })}
                  placeholder="e.g. X-API-Key or Authorization"
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <VariableInput
                label="Key Value *"
                value={auth.apiKeyValue ?? ''}
                onChange={(v) => setAuth({ apiKeyValue: v })}
                placeholder="{{credentials.api_key}}"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Add To</label>
                <div className="flex gap-3">
                  {(['header', 'query'] as const).map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="apiKeyPlacement"
                        value={p}
                        checked={(auth.apiKeyPlacement ?? 'header') === p}
                        onChange={() => setAuth({ apiKeyPlacement: p })}
                        className="accent-teal-600"
                      />
                      <span className="text-xs text-gray-700 capitalize">{p === 'header' ? 'Request Header' : 'Query Parameter'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Basic Auth */}
          {auth.type === 'basic' && (
            <div className="grid grid-cols-2 gap-3">
              <VariableInput
                label="Username *"
                value={auth.basicUsername ?? ''}
                onChange={(v) => setAuth({ basicUsername: v })}
                placeholder="{{credentials.username}}"
              />
              <VariableInput
                label="Password *"
                value={auth.basicPassword ?? ''}
                onChange={(v) => setAuth({ basicPassword: v })}
                placeholder="{{credentials.password}}"
              />
              <p className="col-span-2 text-[10px] text-gray-400 flex items-center gap-1">
                <Info size={10} />
                Sent as Base64-encoded <code className="bg-gray-100 px-1 rounded">Authorization: Basic</code> header
              </p>
            </div>
          )}

          {/* OAuth 2.0 */}
          {auth.type === 'oauth2' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grant Type</label>
                <select
                  value={auth.oauth2GrantType ?? 'client_credentials'}
                  onChange={(e) => setAuth({ oauth2GrantType: e.target.value as OAuth2GrantType })}
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  {OAUTH2_GRANTS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <VariableInput
                label="Token URL *"
                value={auth.oauth2TokenUrl ?? ''}
                onChange={(v) => setAuth({ oauth2TokenUrl: v })}
                placeholder="https://auth.provider.com/oauth/token"
              />
              {(auth.oauth2GrantType === 'authorization_code' || auth.oauth2GrantType === 'authorization_code_pkce' || auth.oauth2GrantType === 'implicit') && (
                <VariableInput
                  label="Authorization URL"
                  value={auth.oauth2AuthUrl ?? ''}
                  onChange={(v) => setAuth({ oauth2AuthUrl: v })}
                  placeholder="https://auth.provider.com/authorize"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <VariableInput
                  label="Client ID *"
                  value={auth.oauth2ClientId ?? ''}
                  onChange={(v) => setAuth({ oauth2ClientId: v })}
                  placeholder="{{credentials.client_id}}"
                />
                <VariableInput
                  label="Client Secret *"
                  value={auth.oauth2ClientSecret ?? ''}
                  onChange={(v) => setAuth({ oauth2ClientSecret: v })}
                  placeholder="{{credentials.client_secret}}"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Scope</label>
                <input
                  type="text"
                  value={auth.oauth2Scope ?? ''}
                  onChange={(e) => setAuth({ oauth2Scope: e.target.value })}
                  placeholder="read:data write:data"
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-400"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Space-separated scopes</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Token Placement</label>
                <div className="flex gap-3">
                  {(['header', 'body'] as const).map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="oauth2Placement"
                        value={p}
                        checked={(auth.oauth2TokenPlacement ?? 'header') === p}
                        onChange={() => setAuth({ oauth2TokenPlacement: p })}
                        className="accent-teal-600"
                      />
                      <span className="text-xs text-gray-700 capitalize">{p === 'header' ? 'Request Header' : 'Request Body'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AWS Signature v4 */}
          {auth.type === 'aws_sig4' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <VariableInput
                  label="Access Key ID *"
                  value={auth.awsAccessKey ?? ''}
                  onChange={(v) => setAuth({ awsAccessKey: v })}
                  placeholder="AKIA••••••••"
                />
                <VariableInput
                  label="Secret Access Key *"
                  value={auth.awsSecretKey ?? ''}
                  onChange={(v) => setAuth({ awsSecretKey: v })}
                  placeholder="{{credentials.aws_secret}}"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Region *</label>
                  <input
                    type="text"
                    value={auth.awsRegion ?? ''}
                    onChange={(e) => setAuth({ awsRegion: e.target.value })}
                    placeholder="ap-south-1"
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
                  <input
                    type="text"
                    value={auth.awsService ?? ''}
                    onChange={(e) => setAuth({ awsService: e.target.value })}
                    placeholder="execute-api"
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <VariableInput
                label="Session Token (optional)"
                value={auth.awsSessionToken ?? ''}
                onChange={(v) => setAuth({ awsSessionToken: v })}
                placeholder="For temporary/STS credentials"
              />
            </div>
          )}

          {/* Digest Auth */}
          {auth.type === 'digest' && (
            <div className="grid grid-cols-2 gap-3">
              <VariableInput
                label="Username *"
                value={auth.digestUsername ?? ''}
                onChange={(v) => setAuth({ digestUsername: v })}
                placeholder="{{credentials.username}}"
              />
              <VariableInput
                label="Password *"
                value={auth.digestPassword ?? ''}
                onChange={(v) => setAuth({ digestPassword: v })}
                placeholder="{{credentials.password}}"
              />
              <p className="col-span-2 text-[10px] text-gray-400 flex items-center gap-1">
                <Info size={10} />
                Two-step challenge-response: initial request → server challenge → retry with digest hash
              </p>
            </div>
          )}

          {/* Custom Header */}
          {auth.type === 'custom_header' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Header Name *</label>
                <input
                  type="text"
                  value={auth.customHeaderName ?? ''}
                  onChange={(e) => setAuth({ customHeaderName: e.target.value })}
                  placeholder="X-Custom-Auth"
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <VariableInput
                label="Header Value *"
                value={auth.customHeaderValue ?? ''}
                onChange={(v) => setAuth({ customHeaderValue: v })}
                placeholder="{{credentials.api_key}}"
              />
            </div>
          )}
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <CredentialsModal
          onClose={() => setShowCredentials(false)}
          onSelect={(cred) => {
            setAuth({ credentialId: cred.id });
            setShowCredentials(false);
          }}
        />
      )}
    </div>
  );
}
