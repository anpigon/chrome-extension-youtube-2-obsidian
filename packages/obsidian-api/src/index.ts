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
    const url = `${this.config.baseUrl}/vault/${title}.md`;
    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return fetch(url, {
      method: 'PUT',
      headers,
      body: content,
    });
  }

  async checkFileExists(title: string): Promise<boolean> {
    const url = `${this.config.baseUrl}/vault/${title}.md`;
    const headers: Record<string, string> = {};

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers,
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking file:', error);
      return false;
    }
  }

  async getNote(title: string) {
    const url = `${this.config.baseUrl}/vault/${title}.md`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: 'application/vnd.olrapi.note+json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // First, get the existing content
    const existingResponse = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!existingResponse.ok) {
      throw new Error('Failed to get existing note content');
    }

    return (await existingResponse.json()) as {
      content: string;
      frontmatter: Record<string, string>;
      path: string;
      stat: {
        ctime: number;
        mtime: number;
        size: number;
      };
      tags: string[];
    };
  }

  async appendToNote(title: string, content: string): Promise<Response> {
    const url = `${this.config.baseUrl}/vault/${title}.md`;
    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown',
      accept: '*/*',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // First, get the existing content
    const { content: existingContent } = await this.getNote(title);

    const newContent = `${existingContent}\n\n${content}`;

    return fetch(url, {
      method: 'PUT',
      headers,
      body: newContent,
    });
  }

  // 노트 생성을 위한 마크다운 템플릿 생성
  static createNoteContent(
    title: string,
    note: string,
    videoInfo?: { title: string; videoId: string; timestamp: string },
  ): string {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoInfo.videoId}&t=${videoInfo.timestamp}`;

    return `# ${title}

## 타임스탬프: ${videoInfo.timestamp}
[YouTube 링크](${youtubeUrl})

## 노트
${note}
`;
  }
}
