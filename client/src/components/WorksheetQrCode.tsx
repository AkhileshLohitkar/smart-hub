import { useEffect, useState } from "react";
import { getAnswerKeyUrl } from "@shared/answerKeyUrl";
import { cn } from "@/lib/utils";

type WorksheetQrCodeProps = {
  worksheetId: number;
  size?: number;
  className?: string;
};

export function WorksheetQrCode({ worksheetId, size = 72, className }: WorksheetQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = getAnswerKeyUrl(worksheetId);
    console.log("[answer-key] qr payload", { worksheetId, url });

    import("qrcode")
      .then((QR) =>
        QR.toDataURL(url, {
          width: size * 2,
          margin: 1,
          color: { dark: "#1a1a2e", light: "#ffffff" },
        }),
      )
      .then((src) => {
        if (!cancelled) setDataUrl(src);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [worksheetId, size]);

  if (!dataUrl) {
    return (
      <div
        className={cn("rounded-md border border-gray-300 bg-gray-50 print:border-gray-400", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Scan for answer key"
      width={size}
      height={size}
      className={cn("rounded-md border border-gray-200 bg-white object-contain print:border-gray-400", className)}
      data-testid="worksheet-qr-code"
      draggable={false}
    />
  );
}

export async function generateAnswerKeyQrDataUrl(
  worksheetId: number,
  sizePx = 200,
  origin?: string,
): Promise<string> {
  const QR = await import("qrcode");
  return QR.toDataURL(getAnswerKeyUrl(worksheetId, origin), {
    width: sizePx,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });
}
