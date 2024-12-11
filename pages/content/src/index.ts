import { toggleTheme } from '@src/toggleTheme';

console.log('content script loaded');

void toggleTheme();

interface VideoInfo {
  title: string;
  videoId: string;
  timestamp: string;
}

// 현재 재생 중인 동영상 정보 가져오기
function getVideoInfo(): VideoInfo {
  const video = document.querySelector('video');
  const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || '';
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v') || '';
  const timestamp = video ? formatTime(video.currentTime) : '00:00';
  console.log('getVideoInfo', { title, videoId, timestamp });

  return {
    title,
    videoId,
    timestamp,
  };
}

// 초를 HH:MM:SS 형식으로 변환
function formatTime(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
}

// 동영상 정보 변경 감지
let prevVideoId = '';
setInterval(() => {
  const currentVideoId = new URL(window.location.href).searchParams.get('v');
  if (currentVideoId && currentVideoId !== prevVideoId) {
    prevVideoId = currentVideoId;
    chrome.runtime.sendMessage({ type: 'VIDEO_INFO_UPDATED', data: getVideoInfo() });
  }
}, 1000);

// 현재 재생 시간 변경 감지
const video = document.querySelector('video');
if (video) {
  video.addEventListener('timeupdate', () => {
    chrome.runtime.sendMessage({
      type: 'VIDEO_TIMESTAMP_UPDATED',
      data: { timestamp: formatTime(video.currentTime) },
    });
  });
}
