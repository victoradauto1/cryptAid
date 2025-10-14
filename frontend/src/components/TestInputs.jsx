import { useState } from 'react';

export default function TestInputs() {
    const [imageUrl, setImageUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
  
    return (
      <div>
        <input
          type="text"
          id="imageURL"
          className="form-control"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL da imagem"
        />
        <input
          type="text"
          id="videoURL"
          className="form-control"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="URL do vídeo"
        />
      </div>
    );
  }