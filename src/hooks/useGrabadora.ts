import { useCallback, useRef, useState } from "react";

function codificarWav(bloques: Float32Array[], sampleRate: number): Blob {
  const total = bloques.reduce((suma, b) => suma + b.length, 0);
  const muestras = new Float32Array(total);
  let offset = 0;
  for (const b of bloques) {
    muestras.set(b, offset);
    offset += b.length;
  }

  const objetivo = 16000;
  const factor = Math.max(1, Math.floor(sampleRate / objetivo));
  const largo = Math.floor(muestras.length / factor);
  const buffer = new ArrayBuffer(44 + largo * 2);
  const vista = new DataView(buffer);

  const escribir = (pos: number, texto: string) => {
    for (let i = 0; i < texto.length; i += 1) vista.setUint8(pos + i, texto.charCodeAt(i));
  };

  const rate = Math.floor(sampleRate / factor);
  escribir(0, "RIFF");
  vista.setUint32(4, 36 + largo * 2, true);
  escribir(8, "WAVE");
  escribir(12, "fmt ");
  vista.setUint32(16, 16, true);
  vista.setUint16(20, 1, true);
  vista.setUint16(22, 1, true);
  vista.setUint32(24, rate, true);
  vista.setUint32(28, rate * 2, true);
  vista.setUint16(32, 2, true);
  vista.setUint16(34, 16, true);
  escribir(36, "data");
  vista.setUint32(40, largo * 2, true);

  for (let i = 0; i < largo; i += 1) {
    const valor = Math.max(-1, Math.min(1, muestras[i * factor] ?? 0));
    vista.setInt16(44 + i * 2, valor < 0 ? valor * 0x8000 : valor * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function useGrabadoraVoz() {
  const [grabando, setGrabando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<{
    stream?: MediaStream;
    ctx?: AudioContext;
    nodo?: ScriptProcessorNode;
    fuente?: MediaStreamAudioSourceNode;
    bloques: Float32Array[];
  }>({ bloques: [] });

  const iniciar = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const ctx = new AudioContext();
      const fuente = ctx.createMediaStreamSource(stream);
      const nodo = ctx.createScriptProcessor(4096, 1, 1);
      refs.current = { stream, ctx, nodo, fuente, bloques: [] };
      nodo.onaudioprocess = (evento) => {
        refs.current.bloques.push(new Float32Array(evento.inputBuffer.getChannelData(0)));
      };
      fuente.connect(nodo);
      nodo.connect(ctx.destination);
      setGrabando(true);
      return true;
    } catch {
      setError("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
      return false;
    }
  }, []);

  const detener = useCallback(async (): Promise<{ base64: string; mimeType: string } | null> => {
    const { stream, ctx, nodo, fuente, bloques } = refs.current;
    setGrabando(false);
    stream?.getTracks().forEach((t) => t.stop());
    nodo?.disconnect();
    fuente?.disconnect();
    if (!ctx) return null;
    const blob = codificarWav(bloques, ctx.sampleRate);
    await ctx.close();
    refs.current = { bloques: [] };

    if (blob.size < 2500) {
      setError("La grabación fue demasiado corta. Inténtalo de nuevo.");
      return null;
    }

    const buffer = await blob.arrayBuffer();
    let binario = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i] ?? 0);
    return { base64: btoa(binario), mimeType: "audio/wav" };
  }, []);

  return { grabando, error, iniciar, detener };
}

export async function archivoABase64(archivo: File): Promise<string> {
  const buffer = await archivo.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binario = "";
  const trozo = 0x8000;
  for (let i = 0; i < bytes.length; i += trozo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }
  return btoa(binario);
}
