import type { MetaFunction } from "@remix-run/node";
import { useCallback, useState } from "react";
import type { CenterImageEntity } from "../domain/entities/CenterImage";
import { AudioControls } from "../presentation/components/AudioControls";
import { BPMDisplay } from "../presentation/components/BPMDisplay";
import { FileUploadArea } from "../presentation/components/FileUploadArea";
import { VisualizerCanvas } from "../presentation/components/VisualizerCanvas";
import { Button } from "../presentation/components/ui/Button";
import { Card } from "../presentation/components/ui/Card";
import { ToastContainer, useToast } from "../presentation/components/ui/Toast";
import { useAudio } from "../presentation/hooks/useAudio";
import { useBPM } from "../presentation/hooks/useBPM";
import { useFileUpload } from "../presentation/hooks/useFileUpload";
import { useVisualizer } from "../presentation/hooks/useVisualizer";

export const meta: MetaFunction = () => {
  return [
    { title: "🎵 オーディオビジュアライザー | 音楽を視覚化する" },
    {
      name: "description",
      content:
        "美しい音楽の視覚化体験。様々なビジュアライザーモードで音楽をお楽しみください。",
    },
  ];
};

export default function Index() {
  const [centerImage, setCenterImage] = useState<CenterImageEntity | null>(
    null
  );
  const { toasts, success, error: showError } = useToast();

  // カスタムフック
  const audio = useAudio();
  const {
    isUploading: isAudioUploading,
    uploadProgress: audioProgress,
    uploadAudioFile,
    uploadImageFile,
    supportedFormats,
  } = useFileUpload();

  // audioRepositoryを取得してビジュアライザーに渡す
  const visualizer = useVisualizer(audio.audioRepository ?? undefined);

  // BPM検出機能
  const bpm = useBPM(audio.audioRepository, audio.isPlaying);

  // ファイルアップロードハンドラー
  const handleAudioUpload = useCallback(
    async (file: File) => {
      try {
        const audioFile = await uploadAudioFile(file);
        if (audioFile) {
          await audio.setAudioFile(audioFile);
          success(`${audioFile.name} をアップロードしました`);
        }
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "アップロードに失敗しました"
        );
      }
    },
    [uploadAudioFile, audio, success, showError]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        const imageFile = await uploadImageFile(file);
        if (imageFile) {
          setCenterImage(imageFile);
          success(`${imageFile.name} をセンター画像に設定しました`);
        }
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "画像アップロードに失敗しました"
        );
      }
    },
    [uploadImageFile, success, showError]
  );

  // ビジュアライザーモードの切り替えハンドラー
  const handleModeToggle = useCallback(
    (modeId: string) => {
      visualizer.toggleMode(modeId);
      const mode = visualizer.config.modes.find((m) => m.id === modeId);
      if (mode) {
        success(
          `${mode.nameJa}モードを${mode.enabled ? "有効" : "無効"}にしました`
        );
      }
    },
    [visualizer, success]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="relative z-10 p-6 pb-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 tracking-wider drop-shadow-sm">
            🎵 オーディオビジュアライザー
          </h1>
          <p className="text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            音楽を美しく視覚化し、新しい音楽体験をお楽しみください
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* ビジュアライザーキャンバス */}
        <Card variant="glass" padding="sm" className="overflow-hidden shadow-xl">
          <VisualizerCanvas
            ref={visualizer.canvasRef}
            centerImage={centerImage}
            onCanvasReady={visualizer.startAnimation}
            hasAudioFile={!!audio.audioFile}
            isPlaying={audio.isPlaying}
            isAnimating={visualizer.isAnimating}
            className="w-full"
          />
        </Card>

        {/* コントロールパネル */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ファイルアップロード */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              📁 ファイル選択
            </h2>

            <div className="space-y-4">
              <FileUploadArea
                type="audio"
                accept={supportedFormats.audio}
                isUploading={isAudioUploading}
                uploadProgress={audioProgress}
                onFileSelect={handleAudioUpload}
              />

              <FileUploadArea
                type="image"
                accept={supportedFormats.image}
                isUploading={false}
                uploadProgress={0}
                onFileSelect={handleImageUpload}
                className="h-48"
              />
            </div>
          </div>

          {/* オーディオコントロール */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🎛️ 再生コントロール
            </h2>

            <div className="space-y-4">
              <AudioControls
                isPlaying={audio.isPlaying}
                isLoading={audio.isLoading}
                canPlay={!!audio.audioFile}
                currentTime={audio.currentTime}
                duration={audio.duration}
                volume={audio.volume}
                onPlay={audio.play}
                onPause={audio.pause}
                onStop={audio.stop}
                onSeek={audio.setCurrentTime}
                onVolumeChange={audio.setVolume}
              />

              {/* 現在のファイル情報 */}
              {audio.audioFile && (
                <Card variant="outline" padding="sm" className="bg-white/50 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">再生中</p>
                    <p className="text-xs text-slate-500 truncate">
                      {audio.audioFile.name}
                    </p>
                  </div>
                </Card>
              )}

              {/* BPM表示 */}
              {audio.audioFile && (
                <BPMDisplay 
                  bpmData={bpm.bpmData}
                  className="bg-white/50 backdrop-blur-sm"
                />
              )}
            </div>
          </div>

          {/* ビジュアライザー設定 */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🎨 ビジュアライザー
            </h2>

            <div className="space-y-4">
              <Card variant="outline" padding="md" className="bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">
                  表示モード
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {visualizer.config.modes.map((mode) => (
                    <label
                      key={mode.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={mode.enabled}
                        onChange={() => handleModeToggle(mode.id)}
                        className="w-5 h-5 text-indigo-600 bg-white border-2 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                        aria-label={`${mode.nameJa} モードを切り替え`}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{mode.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                            {mode.nameJa}
                          </p>
                          <p className="text-xs text-slate-500">
                            {mode.descriptionJa}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              {/* 感度調整 */}
              <Card variant="outline" padding="md" className="bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">
                  感度調整
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>感度</span>
                    <span>{visualizer.config.sensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={visualizer.config.sensitivity}
                    onChange={(e) =>
                      visualizer.updateSensitivity(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {(audio.error || visualizer.error || bpm.error) && (
          <Card variant="outline" className="border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-lg">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">エラーが発生しました</p>
                <p className="text-red-600 text-sm">
                  {audio.error || visualizer.error || bpm.error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  audio.clearError();
                  visualizer.clearError();
                  bpm.clearError();
                }}
                className="ml-auto"
              >
                閉じる
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-16 p-6 text-center">
        <p className="text-sm text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          🎵 音楽ファイルを選択して、美しいビジュアライザーをお楽しみください
        </p>
      </footer>

      {/* トースト通知 */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
