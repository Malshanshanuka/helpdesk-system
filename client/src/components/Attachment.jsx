import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import api from "../api/axios";
import { formatSize } from "../lib/format";

export default function Attachment({ file, mine }) {
  const isImage = file.mimetype.startsWith("image/");
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isImage) return;

    let objectUrl = "";
    let cancelled = false;

    // Files are private, so they are fetched with the auth token as a blob
    api
      .get(`/files/${file.filename}`, { responseType: "blob" })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.filename, isImage]);

  const download = async () => {
    try {
      const { data } = await api.get(`/files/${file.filename}`, { responseType: "blob" });
      const href = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = href;
      link.download = file.originalName;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      alert("Could not download this file");
    }
  };

  if (isImage && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block">
        <img src={url} alt={file.originalName} className="max-h-56 rounded-lg" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={isImage && !failed}
      className={`mt-2 flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm ${
        mine ? "border-blue-400 bg-blue-500" : "border-slate-200 bg-slate-50"
      }`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{isImage && !failed ? "Loading..." : file.originalName}</span>
      <span className="text-xs opacity-70">{formatSize(file.size)}</span>
      <Download className="h-4 w-4 shrink-0" />
    </button>
  );
}