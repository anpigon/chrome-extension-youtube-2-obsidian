interface ObsidianConfig {
  baseUrl: string;
  vaultName: string;
  apiKey?: string;
}

export class ObsidianAPI {
  private config: ObsidianConfig;

  constructor(config: ObsidianConfig) {
    this.config = config;
  }

  async createNote(title: string, content: string): Promise<Response> {
    const url = `${this.config.baseUrl}/vault/${this.config.vaultName}/create`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        path: `YouTube Notes/${title}.md`,
        content,
      }),
    });
  }

  // 노트 생성을 위한 마크다운 템플릿 생성
  static createNoteContent(videoInfo: { title: string; videoId: string; timestamp: string }, note: string): string {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoInfo.videoId}&t=${videoInfo.timestamp}`;

    return `# ${videoInfo.title}

## 타임스탬프: ${videoInfo.timestamp}
[YouTube 링크](${youtubeUrl})

## 노트
${note}
`;
  }
}
