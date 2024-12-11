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
  const [noteTitle, setNoteTitle] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
      console.log('message', message);

      if (message.type === 'VIDEO_INFO_UPDATED') {
        setVideoInfo(message.data);
        setNoteTitle(message.data.title); // Set initial title from video title
      } else if (message.type === 'VIDEO_TIMESTAMP_UPDATED') {
        setVideoInfo(prev => (prev ? { ...prev, timestamp: message.data.timestamp } : null));
      }
    });
  }, []);

  const handleSaveNote = async () => {
    console.log(videoInfo, noteTitle, note, obsidianConfig.vaultName);
    if (!noteTitle || !note || !obsidianConfig.vaultName) {
      setNotification({ message: '노트 내용, 옵시디언 설정이 필요합니다.', type: 'error' });
      return;
    }

    try {
      const api = new ObsidianAPI(obsidianConfig);

      // Check if file exists
      const exists = await api.checkFileExists(noteTitle);
      if (exists) {
        setShowConfirmDialog(true);
        return;
      }

      // If file doesn't exist, create new note
      await saveNewNote(api);
    } catch (error) {
      console.error('Error saving note:', error);
      setNotification({
        message:
          '노트 저장에 실패했습니다. 옵시디언이 실행 중이고, Local REST API 플러그인이 활성화되어 있는지 확인해주세요.',
        type: 'error',
      });
    }
  };

  const saveNewNote = async (api: ObsidianAPI) => {
    const response = await api.createNote(noteTitle, note);
    console.log('Response:', response);

    if (response.ok) {
      setNotification({ message: '노트가 저장되었습니다.', type: 'success' });
    } else {
      throw new Error('노트 저장에 실패했습니다.');
    }
  };

  const appendToExistingNote = async () => {
    try {
      const api = new ObsidianAPI(obsidianConfig);
      const response = await api.appendToNote(noteTitle, note);

      if (response.ok) {
        setNotification({ message: '노트가 추가되었습니다.', type: 'success' });
      } else {
        throw new Error('노트 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error appending to note:', error);
      setNotification({
        message: '노트 추가에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setShowConfirmDialog(false);
    }
  };

  const overwriteExistingNote = async () => {
    try {
      const api = new ObsidianAPI(obsidianConfig);
      await saveNewNote(api);
    } finally {
      setShowConfirmDialog(false);
    }
  };

  // 3초 후에 알림 메시지 자동으로 사라지게 하기
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className={`h-screen flex flex-col ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {/* 알림 메시지 */}
      {notification && (
        <div
          className={`p-4 ${
            notification.type === 'error'
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'bg-green-100 border-green-400 text-green-700'
          } border-l-4`}
          role="alert">
          <p>{notification.message}</p>
        </div>
      )}

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

      {/* 확인 다이얼로그 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
            <h3 className="text-lg font-medium mb-4">같은 이름의 노트가 이미 존재합니다</h3>
            <p className="mb-4">어떻게 처리하시겠습니까?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => setShowConfirmDialog(false)}>
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={appendToExistingNote}>
                내용 추가
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={overwriteExistingNote}>
                덮어쓰기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 노트 제목 입력 */}
      <div className="p-4 border-b">
        <input
          type="text"
          className={`w-full p-2 rounded border ${isLight ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'}`}
          value={noteTitle}
          onChange={e => setNoteTitle(e.target.value)}
          placeholder="노트 제목을 입력하세요..."
        />
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
