import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect } from 'react';
import { exampleThemeStorage } from '@extension/storage';
import { ObsidianAPI } from '@packages/obsidian-api';

interface VideoInfo {
  title: string;
  videoId: string;
  timestamp: string;
}

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [note, setNote] = useState('');
  const [obsidianConfig, setObsidianConfig] = useState({
    baseUrl: 'http://localhost:27123',
    apiKey: '',
    vaultName: '',
  });

  useEffect(() => {
    // 옵시디언 설정 불러오기
    chrome.storage.sync.get(['obsidianApiUrl', 'obsidianApiKey', 'obsidianVaultName'], result => {
      if (result.obsidianApiUrl || result.obsidianApiKey || result.obsidianVaultName) {
        setObsidianConfig({
          baseUrl: result.obsidianApiUrl || 'http://localhost:27123',
          apiKey: result.obsidianApiKey || '',
          vaultName: result.obsidianVaultName || '',
        });
      }
    });

    // 비디오 정보 업데이트 메시지 수신
    chrome.runtime.onMessage.addListener(message => {
      if (message.target === 'side-panel') {
        if (message.type === 'VIDEO_INFO_UPDATED') {
          setVideoInfo(message.data);
        } else if (message.type === 'VIDEO_TIMESTAMP_UPDATED') {
          setVideoInfo(prev => (prev ? { ...prev, timestamp: message.data.timestamp } : null));
        }
      }
    });
  }, []);

  const handleSaveNote = async () => {
    if (!videoInfo || !note || !obsidianConfig.vaultName) {
      alert('비디오 정보와 노트 내용, 옵시디언 설정이 필요합니다.');
      return;
    }

    try {
      const api = new ObsidianAPI(obsidianConfig);
      const content = ObsidianAPI.createNoteContent(videoInfo, note);
      const response = await api.createNote(videoInfo.title, content);

      if (response.ok) {
        alert('노트가 저장되었습니다.');
        setNote('');
      } else {
        throw new Error('노트 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert(
        '노트 저장에 실패했습니다. 옵시디언이 실행 중이고, Local REST API 플러그인이 활성화되어 있는지 확인해주세요.',
      );
    }
  };

  const handleConfigSave = () => {
    chrome.storage.sync.set(
      {
        obsidianApiUrl: obsidianConfig.baseUrl,
        obsidianApiKey: obsidianConfig.apiKey,
        obsidianVaultName: obsidianConfig.vaultName,
      },
      () => {
        alert('설정이 저장되었습니다.');
      },
    );
  };

  return (
    <div className={`h-screen flex flex-col ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {/* 비디오 정보 */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          {videoInfo ? (
            <div className={`${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
              <h2 className="text-lg font-bold">{videoInfo.title}</h2>
              <p className="text-sm">타임스탬프: {videoInfo.timestamp}</p>
            </div>
          ) : (
            <p className={`${isLight ? 'text-gray-900' : 'text-gray-100'}`}>유튜브 동영상을 재생해주세요.</p>
          )}
        </div>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-black ${
            isLight ? 'text-gray-600' : 'text-gray-300'
          }`}
          title="설정">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* 옵시디언 설정 */}
      <div className="p-4 border-b">
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
          <label className="block text-sm font-medium">옵시디언 API URL</label>
          <div className="mt-1 flex">
            <input
              type="text"
              className={`flex-1 p-2 rounded-l border ${
                isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
              }`}
              value={obsidianConfig.baseUrl}
              onChange={e => setObsidianConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="API URL을 입력하세요"
            />
          </div>
          <label className="block text-sm font-medium mt-2">옵시디언 API Key</label>
          <div className="mt-1 flex">
            <input
              type="text"
              className={`flex-1 p-2 rounded-l border ${
                isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
              }`}
              value={obsidianConfig.apiKey}
              onChange={e => setObsidianConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="API Key를 입력하세요"
            />
          </div>
          <label className="block text-sm font-medium mt-2">옵시디언 Vault 이름</label>
          <div className="mt-1 flex">
            <input
              type="text"
              className={`flex-1 p-2 rounded-l border ${
                isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
              }`}
              value={obsidianConfig.vaultName}
              onChange={e => setObsidianConfig(prev => ({ ...prev, vaultName: e.target.value }))}
              placeholder="Vault 이름을 입력하세요"
            />
            <button
              className={`px-4 rounded-r ${
                isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-600 text-gray-100 hover:bg-gray-500'
              }`}
              onClick={handleConfigSave}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 노트 에디터 */}
      <div className="flex-1 p-4">
        <textarea
          className={`w-full h-full p-2 rounded border ${
            isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
          }`}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="노트를 작성하세요..."
        />
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 border-t">
        <button
          className={`w-full py-2 px-4 rounded ${
            isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={handleSaveNote}>
          옵시디언에 저장
        </button>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
