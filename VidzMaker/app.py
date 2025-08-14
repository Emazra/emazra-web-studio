from flask import Flask, render_template
import subprocess
from pathlib import Path
import re
import socket
import json

app = Flask(__name__, template_folder="source")  # your template folder name

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"Error fetching local IP: {e}")
        return "127.0.0.1"

def get_audio_duration(audio_path):
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error", "-select_streams", "a:0",
            "-show_entries", "format=duration", "-of", "json",
            str(audio_path)
        ], capture_output=True, text=True, check=True)

        duration = float(json.loads(result.stdout)["format"]["duration"])
        return duration
    except Exception as e:
        print(f"Error getting duration of {audio_path}: {e}")
        return None

@app.route('/')
def index():
    local_ip = get_local_ip()
    return render_template('index.html', local_ip=local_ip)

@app.route('/process_images')
def process_images():
    script_dir = Path(__file__).resolve().parent
    input_dir = script_dir / "src/vid-input"
    output_dir = script_dir / "src/vid-output"
    output_dir.mkdir(parents=True, exist_ok=True)

    image_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"]
    audio_extensions = [".mp3", ".opus", ".aac", ".m4a", ".wav", ".flac", ".ogg", ".mp4", ".dat", ".mpg", ".mpeg", ".mpa"]

    audio_codec_map = {
        ".mp3": "libmp3lame",
        ".opus": "libopus",
        ".aac": "aac",
        ".m4a": "aac",
        ".wav": "aac",
        ".flac": "flac",
        ".ogg": "libvorbis",
        ".mp4": "aac",
        ".dat": "aac",
	".mpg": "aac",
	".mpeg": "aac",
	".mpa": "aac",
    }

    for ext in image_extensions:
        for img_path in input_dir.glob(f"*{ext}"):
            base = img_path.stem
            output_path = output_dir / f"{base}.mp4"
            resized_img_path = input_dir / f"{base}_resized{ext}"

            audio_files = []
            for aext in audio_extensions:
                audio_files += list(input_dir.glob(f"{base}*{aext}"))

            audio_files = sorted(
                audio_files,
                key=lambda f: int(re.match(r"(\d+)", f.name).group(1)) if re.match(r"(\d+)", f.name) else float('inf')
            )

            if not audio_files:
                for aext in audio_extensions:
                    single_path = input_dir / f"{base}{aext}"
                    if single_path.exists():
                        audio_files = [single_path]
                        break

            if audio_files:
                try:
                    if len(audio_files) > 1:
                        merged_ext = audio_files[0].suffix
                        merged_audio_path = input_dir / f"{base}_merged{merged_ext}"
                        file_list_path = input_dir / "file_list.txt"

                        with open(file_list_path, "w", encoding="utf-8") as f:
                            for audio in audio_files:
                                f.write(f"file '{audio.resolve()}'\n")

                        subprocess.run([
                            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(file_list_path),
                            "-c", "copy", str(merged_audio_path)
                        ], check=True)

                        final_audio_path = merged_audio_path
                    else:
                        final_audio_path = audio_files[0]

                    # Resize image
                    subprocess.run([
                        "ffmpeg", "-y", "-i", str(img_path),
                        "-vf", "scale=ceil(iw/2)*2:ceil(ih/2)*2",
                        str(resized_img_path)
                    ], check=True)

                    # Get duration of audio
                    duration = get_audio_duration(final_audio_path)
                    if not duration:
                        print(f"Could not determine duration for {final_audio_path}, skipping.")
                        continue

                    codec = audio_codec_map.get(final_audio_path.suffix.lower(), "aac")

                    # Create video with exact duration
                    subprocess.run([
                        "ffmpeg", "-y", "-r", "1", "-loop", "1",
                        "-i", str(resized_img_path), "-i", str(final_audio_path),
                        "-t", str(duration),
                        "-c:v", "libx264", "-preset", "ultrafast", "-x264-params", "keyint=1",
                        "-c:a", codec, "-b:a", "192k",
                        "-pix_fmt", "yuv420p",
                        "-shortest",
                        str(output_path)
                    ], check=True)

                    # Cleanup
                    resized_img_path.unlink()
                    if len(audio_files) > 1:
                        merged_audio_path.unlink()
                        file_list_path.unlink()

                    print(f"Processed {base} with audio.")
                except subprocess.CalledProcessError as e:
                    print(f"ffmpeg error processing {base}: {e}")
                    continue
            else:
                print(f"No audio found for {img_path.name}")

    return "Batch processing complete."

if __name__ == '__main__':
    local_ip = get_local_ip()
    print(f" * Running on http://{local_ip}:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
