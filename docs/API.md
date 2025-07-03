# API リファレンス

このドキュメントでは、Remix Audio Visualizer のコンポーネント、フック、ユーティリティ関数について詳しく説明します。

## コンポーネント API

### HelloWorld

基本的なテスト用コンポーネントです。

```typescript
interface HelloWorldProps {
  name?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ name = 'World' }) => {
  return <h1>Hello, {name}!</h1>;
};
```

#### Props

| プロパティ | 型 | デフォルト値 | 説明 |
|-----------|-----|-------------|------|
| `name` | `string` | `"World"` | 表示する名前 |

#### 使用例

```tsx
import HelloWorld from "~/components/HelloWorld";

// デフォルト使用
<HelloWorld />

// カスタム名前
<HelloWorld name="Remix" />
```

## メインページ（Audio Visualizer）

### State Management

アプリケーションの状態は以下のReact Hookを使用して管理されています：

```typescript
// ファイル管理
const [audioFile, setAudioFile] = useState<File | null>(null);
const [centerImage, setCenterImage] = useState<string | null>(null);

// 再生状態
const [isPlaying, setIsPlaying] = useState(false);

// ビジュアライザー設定
const [visualizerType, setVisualizerType] = useState("circular");
const [color, setColor] = useState("#ffffff");
```

### Audio Context References

Web Audio API の各種ノードは以下のように管理されています：

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const audioContextRef = useRef<AudioContext | null>(null);
const analyserRef = useRef<AnalyserNode | null>(null);
const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);
const imageRef = useRef<HTMLImageElement | null>(null);
```

## 主要な関数

### handleFileChange

音声ファイルの選択を処理します。

```typescript
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setAudioFile(file);
    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(file);
    }
  }
};
```

#### パラメータ
- `event`: ファイル入力のChangeイベント

#### 処理内容
1. 選択されたファイルを取得
2. `audioFile` 状態を更新
3. Audio要素のソースURLを設定

### handleImageChange

中央画像ファイルの選択を処理します。

```typescript
const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && imageRef.current) {
        const imageUrl = e.target.result as string;
        setCenterImage(imageUrl);
        imageRef.current.src = imageUrl;
      }
    };
    reader.readAsDataURL(file);
  }
};
```

#### パラメータ
- `event`: ファイル入力のChangeイベント

#### 処理内容
1. 選択された画像ファイルを取得
2. FileReader でData URLに変換
3. `centerImage` 状態と Image要素を更新

### togglePlay

音声の再生/一時停止を切り替えます。

```typescript
const togglePlay = () => {
  if (!audioRef.current?.src) return;

  if (isPlaying) {
    audioRef.current.pause();
  } else {
    if (!audioContextRef.current) {
      // Audio Context の初期化
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioContext.createMediaElementSource(audioRef.current);
      sourceRef.current = source;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }
    audioRef.current.play();
  }
};
```

#### 処理内容
1. 音声ソースの存在確認
2. 再生中の場合は一時停止
3. 停止中の場合は Audio Context を初期化（初回のみ）
4. 音声再生を開始

### visualize

メインの視覚化描画関数です。

```typescript
const visualize = () => {
  const canvas = canvasRef.current;
  const analyser = analyserRef.current;
  const canvasCtx = canvas?.getContext("2d");

  if (!canvas || !canvasCtx) {
    requestAnimationFrame(visualize);
    return;
  }

  // Canvas をクリア
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.fillStyle = "#000";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // 視覚化タイプに応じた描画処理
    if (visualizerType === "waveform") {
      // 波形描画
    } else if (visualizerType === "frequency") {
      // 周波数バー描画
    } else if (visualizerType === "circular") {
      // 円形描画
    }
  }

  // 中央画像の描画
  if (centerImage && imageRef.current?.complete) {
    // 円形クリッピングを適用して画像を描画
  }

  requestAnimationFrame(visualize);
};
```

#### 視覚化タイプ

##### Waveform（波形）
```typescript
analyser.getByteTimeDomainData(dataArray);
canvasCtx.lineWidth = 2;
canvasCtx.strokeStyle = color;
canvasCtx.beginPath();

const sliceWidth = (canvas.width * 1.0) / bufferLength;
let x = 0;
for (let i = 0; i < bufferLength; i++) {
  const v = dataArray[i] / 128.0;
  const y = (v * canvas.height) / 2;
  if (i === 0) canvasCtx.moveTo(x, y);
  else canvasCtx.lineTo(x, y);
  x += sliceWidth;
}
canvasCtx.stroke();
```

##### Frequency Bars（周波数バー）
```typescript
analyser.getByteFrequencyData(dataArray);
const barWidth = (canvas.width / bufferLength) * 2.5;
let x = 0;

for (let i = 0; i < bufferLength; i++) {
  const barHeight = dataArray[i];
  canvasCtx.fillStyle = color;
  canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
  x += barWidth + 1;
}
```

##### Circular（円形）
```typescript
analyser.getByteFrequencyData(dataArray);
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 120;
const bars = bufferLength * 0.7;

for (let i = 0; i < bars; i++) {
  const barHeight = dataArray[i] * 0.5;
  if (barHeight < 1) continue;

  const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
  const hue = (i / bars) * 360;
  
  canvasCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
  canvasCtx.lineWidth = 3;

  const startX = centerX + radius * Math.cos(angle);
  const startY = centerY + radius * Math.sin(angle);
  const endX = centerX + (radius + barHeight) * Math.cos(angle);
  const endY = centerY + (radius + barHeight) * Math.sin(angle);

  canvasCtx.beginPath();
  canvasCtx.moveTo(startX, startY);
  canvasCtx.lineTo(endX, endY);
  canvasCtx.stroke();
}
```

## Web Audio API 設定

### Analyser Node 設定

```typescript
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;  // FFTサイズ（256の周波数ビン）
```

### サポートされている設定値

| プロパティ | 値 | 説明 |
|-----------|-----|------|
| `fftSize` | `512` | FFT変換のサイズ |
| `frequencyBinCount` | `256` | 周波数データの配列長 |
| `minDecibels` | `-100` | デシベルの最小値 |
| `maxDecibels` | `-30` | デシベルの最大値 |
| `smoothingTimeConstant` | `0.8` | 時間平滑化定数 |

## 型定義

### VisualizerType

```typescript
type VisualizerType = "circular" | "waveform" | "frequency";
```

### FileChangeEvent

```typescript
type FileChangeEvent = React.ChangeEvent<HTMLInputElement>;
```

### CanvasContext

```typescript
type CanvasContext = CanvasRenderingContext2D;
```

## イベントハンドラー

### Audio要素イベント

```typescript
const handlePlay = () => setIsPlaying(true);
const handlePause = () => setIsPlaying(false);

useEffect(() => {
  const audioElement = audioRef.current;
  audioElement?.addEventListener('play', handlePlay);
  audioElement?.addEventListener('pause', handlePause);

  return () => {
    audioElement?.removeEventListener('play', handlePlay);
    audioElement?.removeEventListener('pause', handlePause);
  };
}, []);
```

## パフォーマンス最適化

### requestAnimationFrame の使用

```typescript
useEffect(() => {
  const animationFrameId = requestAnimationFrame(visualize);
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}, [isPlaying, visualizerType, color, centerImage]);
```

### メモリ管理

- Audio Context は一度のみ初期化
- Canvas コンテキストは再利用
- FileReader は使用後適切にクリーンアップ
- Audio URL は Object.createObjectURL で作成し、適切に解放

## ブラウザ互換性

### Audio Context の初期化

```typescript
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
```

### サポートされているメソッド

- `createAnalyser()`: 全モダンブラウザ
- `createMediaElementSource()`: 全モダンブラウザ  
- `getByteFrequencyData()`: 全モダンブラウザ
- `getByteTimeDomainData()`: 全モダンブラウザ

## エラーハンドリング

### 推奨されるエラーハンドリングパターン

```typescript
try {
  const audioContext = new AudioContext();
  // Audio Context の処理
} catch (error) {
  console.error('Audio Context initialization failed:', error);
  // フォールバック処理
}
```

## セキュリティ考慮事項

### Autoplay Policy

ブラウザの自動再生ポリシーに準拠するため、ユーザーのインタラクション後にのみ Audio Context を初期化します。

### File Access

アップロードされたファイルは `createObjectURL` を使用してメモリ内でのみ処理され、サーバーには送信されません。