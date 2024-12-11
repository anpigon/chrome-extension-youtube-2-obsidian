import '@src/Options.css';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useEffect, useState } from 'react';

const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [config, setConfig] = useState({
    apiUrl: 'http://localhost:27123',
    apiKey: '',
    vaultName: '',
  });

  useEffect(() => {
    // 저장된 설정 불러오기
    chrome.storage.sync.get(['obsidianApiUrl', 'obsidianApiKey', 'obsidianVaultName'], result => {
      setConfig({
        apiUrl: result.obsidianApiUrl || 'http://localhost:27123',
        apiKey: result.obsidianApiKey || '',
        vaultName: result.obsidianVaultName || '',
      });
    });
  }, []);

  const handleSave = () => {
    chrome.storage.sync.set(
      {
        obsidianApiUrl: config.apiUrl,
        obsidianApiKey: config.apiKey,
        obsidianVaultName: config.vaultName,
      },
      () => {
        alert('설정이 저장되었습니다.');
      },
    );
  };

  return (
    <div className={`p-4 min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>Obsidian 설정</h1>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              API URL
            </label>
            <input
              type="text"
              className={`w-full p-2 rounded border ${
                isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
              }`}
              value={config.apiUrl}
              onChange={e => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              placeholder="예: http://localhost:27123"
            />
            <p className={`mt-1 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Local REST API 플러그인의 URL을 입력하세요.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              API Key
            </label>
            <input
              type="password"
              className={`w-full p-2 rounded border ${
                isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
              }`}
              value={config.apiKey}
              onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="API Key를 입력하세요"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Vault 이름
            </label>
            <input
              type="text"
              className={`w-full p-2 rounded border ${
                isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
              }`}
              value={config.vaultName}
              onChange={e => setConfig(prev => ({ ...prev, vaultName: e.target.value }))}
              placeholder="Vault 이름을 입력하세요"
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-2 px-4 rounded ${
              isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default Options;
