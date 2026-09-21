"use client";

import { useEffect, useRef, useState } from "react";
import { useAppPreferences } from "@/lib/i18n/context";

export function PhotoCapture({
  photo,
  onCapture,
}: {
  photo: string | null;
  onCapture: (photo: string | null) => void;
}) {
  const { t } = useAppPreferences();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    setHint(t("photo.hint"));
  }, [t]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setLive(true);
      setHint(t("photo.lineup"));
    } catch {
      setHint(t("photo.unavailable"));
    }
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    onCapture(canvas.toDataURL("image/jpeg", 0.6));
    stopCamera();
    setHint(t("photo.captured"));
  }

  return (
    <>
      <div className="photo-zone">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="photo-thumb" src={photo} alt={t("photo.alt")} />
        ) : (
          <div className="photo-thumb" aria-hidden />
        )}
        <div>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              if (live) {
                capture();
                return;
              }
              if (photo) {
                onCapture(null);
                setHint(t("photo.hint"));
              }
              void startCamera();
            }}
          >
            {live ? t("photo.capture") : photo ? t("photo.retake") : t("photo.take")}
          </button>
          {live ? (
            <button type="button" className="ghost-btn" onClick={stopCamera}>
              {t("photo.cancel")}
            </button>
          ) : null}
          <div className="hint field-hint">{hint}</div>
        </div>
      </div>
      <video
        ref={videoRef}
        className="cam"
        autoPlay
        playsInline
        muted
        style={{ display: live ? "block" : "none" }}
      />
      <canvas ref={canvasRef} hidden />
    </>
  );
}
