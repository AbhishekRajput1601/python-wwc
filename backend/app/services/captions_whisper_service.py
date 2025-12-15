import asyncio
import tempfile
import os
import subprocess
import shutil
from typing import Optional
import httpx
import time
from app.core.config import settings
from filetype import guess as detect_filetype


# Concurrency semaphore
MAX_CONCURRENT = int(getattr(settings, 'TRANSCRIBE_CONCURRENCY', 2))
_semaphore = asyncio.Semaphore(MAX_CONCURRENT)


async def _run_subprocess(cmd: list) -> None:
    """Run blocking subprocess in thread executor."""
    def _run():
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.decode(errors='replace') or 'ffmpeg failed')

    await asyncio.to_thread(_run)


async def convert_to_wav_file(file_or_buffer, input_type: Optional[str] = None) -> str:
    """Write input buffer/file to temp file and convert to 16k mono PCM S16LE WAV using ffmpeg.

    Returns path to the output WAV file. Caller is responsible for deletion.
    """
    tmp_dir = tempfile.gettempdir()
    uid = next(tempfile._get_candidate_names())
    # determine extension
    ext = ''
    if input_type:
        t = input_type.lower()
        if 'webm' in t:
            ext = '.webm'
        elif 'ogg' in t:
            ext = '.ogg'
        elif 'wav' in t:
            ext = '.wav'
        elif 'mp3' in t:
            ext = '.mp3'
        elif 'mp4' in t or 'm4a' in t:
            ext = '.m4a'

    input_base = os.path.join(tmp_dir, f'whisper_input_{uid}')
    output_path = os.path.join(tmp_dir, f'whisper_output_{uid}.wav')

    # write input
    if isinstance(file_or_buffer, (bytes, bytearray)):
        # try to detect
        if not ext:
            try:
                ft = detect_filetype(file_or_buffer)
                if ft and ft.extension:
                    ext = f'.{ft.extension}'
            except Exception:
                ext = '.webm'
        input_path = input_base + ext
        with open(input_path, 'wb') as f:
            f.write(file_or_buffer)
    elif isinstance(file_or_buffer, str):
        if not os.path.exists(file_or_buffer):
            raise FileNotFoundError(file_or_buffer)
        src_ext = os.path.splitext(file_or_buffer)[1] or '.wav'
        input_path = input_base + src_ext
        shutil.copyfile(file_or_buffer, input_path)
    else:
        raise ValueError('file_or_buffer must be bytes or filepath string')

    # conversion function
    async def _try_convert(path):
        cmd = [
            'ffmpeg', '-y', '-i', path,
            '-ac', '1', '-ar', '16000', '-acodec', 'pcm_s16le', output_path
        ]
        await _run_subprocess(cmd)

    # try conversion, on failure try alternative extensions (if buffer)
    try:
        await _try_convert(input_path)
        try:
            os.remove(input_path)
        except Exception:
            pass
        return output_path
    except Exception as first_err:
        # attempt alternatives if original was buffer
        if isinstance(file_or_buffer, (bytes, bytearray)):
            alt_exts = ['.webm', '.ogg', '.mp3', '.wav', '.m4a']
            tried = {os.path.splitext(input_path)[1]}
            for alt in alt_exts:
                if alt in tried:
                    continue
                alt_input = input_base + alt
                try:
                    with open(alt_input, 'wb') as f:
                        f.write(file_or_buffer)
                    await _try_convert(alt_input)
                    try:
                        os.remove(alt_input)
                    except Exception:
                        pass
                    try:
                        os.remove(input_path)
                    except Exception:
                        pass
                    return output_path
                except Exception:
                    try:
                        os.remove(alt_input)
                    except Exception:
                        pass
                    tried.add(alt)

        # cleanup and raise
        try:
            os.remove(input_path)
        except Exception:
            pass
        try:
            os.remove(output_path)
        except Exception:
            pass
        raise first_err


async def transcribe_audio(file_or_buffer, language: Optional[str] = None, translate: bool = False, input_type: Optional[str] = None) -> dict:
    """Transcribe audio by converting to WAV and forwarding to external Whisper HTTP service.

    Returns parsed JSON response from the Whisper endpoint.
    """
    url = os.getenv('WHISPER_URL') or getattr(settings, 'WHISPER_URL', 'http://localhost:5001/transcribe')
    max_retries = int(os.getenv('WHISPER_MAX_RETRIES') or getattr(settings, 'WHISPER_MAX_RETRIES', 5))
    timeout_ms = int(os.getenv('WHISPER_TIMEOUT_MS') or getattr(settings, 'WHISPER_TIMEOUT_MS', 600000))
    timeout = timeout_ms / 1000.0

    await _semaphore.acquire()
    try:
        output_path = await convert_to_wav_file(file_or_buffer, input_type)
        try:
            wav_bytes = open(output_path, 'rb').read()
        finally:
            try:
                os.remove(output_path)
            except Exception:
                pass

        async def parse_retry_after(header_val):
            if not header_val:
                return None
            try:
                sec = int(header_val)
                return sec * 1000
            except Exception:
                try:
                    # best-effort fallback
                    return None
                except Exception:
                    return None

        async def send_with_retries(attempt=0):
            try:
                files = {'audio': ('audio.wav', wav_bytes, 'audio/wav')}
                data = {'translate': 'true' if translate else 'false'}
                if language:
                    data['language'] = language

                headers = {'User-Agent': 'wwc-captions-service/1.0'}
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, data=data, files=files, headers=headers)
                # if HTML response, treat as error
                text = resp.text
                if isinstance(text, str) and text.strip().startswith('<'):
                    raise RuntimeError('Received HTML response from whisper endpoint')
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as he:
                status = he.response.status_code
                if status == 429 and attempt < max_retries:
                    header = he.response.headers.get('retry-after') or he.response.headers.get('Retry-After')
                    retry_ms = await parse_retry_after(header) or min(30000, 1000 * (2 ** attempt))
                    jitter = int.from_bytes(os.urandom(1), 'big') % 500
                    await asyncio.sleep((retry_ms + jitter) / 1000.0)
                    return await send_with_retries(attempt + 1)
                if status >= 500 and attempt < max_retries:
                    wait = min(30000, 1000 * (2 ** attempt)) + (int.from_bytes(os.urandom(2), 'big') % 500)
                    await asyncio.sleep(wait / 1000.0)
                    return await send_with_retries(attempt + 1)
                raise
            except Exception:
                if attempt < max_retries:
                    await asyncio.sleep(min(30, 1 * (2 ** attempt)))
                    return await send_with_retries(attempt + 1)
                raise

        result = await send_with_retries(0)
        return result

    finally:
        _semaphore.release()
