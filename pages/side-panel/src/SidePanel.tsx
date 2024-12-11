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
    vaultName: '',
  });

  useEffect(() => {
    // 옵시디언 설정 불러오기
    chrome.storage.sync.get(['obsidianVaultName'], result => {
      if (result.obsidianVaultName) {
        setObsidianConfig(prev => ({ ...prev, vaultName: result.obsidianVaultName }));
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
    chrome.storage.sync.set({ obsidianVaultName: obsidianConfig.vaultName }, () => {
      alert('설정이 저장되었습니다.');
    });
  };

  return (
    <div className={`h-screen flex flex-col ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {/* 비디오 정보 */}
      <div className="p-4 border-b">
        {videoInfo ? (
          <div className={`${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
            <h2 className="text-lg font-bold">{videoInfo.title}</h2>
            <p className="text-sm">타임스탬프: {videoInfo.timestamp}</p>
          </div>
        ) : (
          <p className={`${isLight ? 'text-gray-900' : 'text-gray-100'}`}>유튜브 동영상을 재생해주세요.</p>
        )}
      </div>

      {/* 옵시디언 설정 */}
      <div className="p-4 border-b">
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
          <label className="block text-sm font-medium">옵시디언 Vault 이름</label>
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
