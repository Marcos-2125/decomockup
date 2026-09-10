import fetch from 'node-fetch';

async function probarOllama() {
  console.log("Enviando mensaje de prueba a Ollama...");

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: 'Responde únicamente con la palabra "LISTO" si puedes leer este mensaje.',
        stream: false
      })
    });

    const data = await response.json();
    console.log("\nRespuesta de Ollama:", data.response.trim());
  } catch (error) {
    console.error("Error al conectar con Ollama:", error.message);
  }
}

probarOllama();