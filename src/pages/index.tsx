import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState<string>("");
  const [shortened, setShortened] = useState<string>("");
  const [streamEnded, setStreamEnded] = useState(false);

  type ollamaResponse = {
    model: string;
    response: string;
    done: boolean;
  };

  function parseStreamData(value: Uint8Array | undefined, concatenatedResponse: string) {
    try {
      const jsonData: ollamaResponse = JSON.parse(
        new TextDecoder().decode(value)
      ) as ollamaResponse;

      console.log(jsonData);

      if (jsonData.done) {
        setStreamEnded(true);
      } else {
        concatenatedResponse += jsonData.response;
        setShortened(concatenatedResponse);
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
    return concatenatedResponse
  }

  const handleSummaryCall = async () => {
    const inputData = {
      model: "llama2",
      prompt: text,
    };
  
    let concatenatedResponse = "";
  
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body?.getReader();
      if (reader) {
        while (!streamEnded) {
          const { value, done } = await reader.read();
          if (done) {
            setStreamEnded(true);

            break
          }
          concatenatedResponse = parseStreamData(value, concatenatedResponse);
        }
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    }
  
    setStreamEnded(false);

    
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="container flex min-w-full max-w-screen-lg flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Make it short
          </h1>
          <div className="flex min-w-full max-w-none flex-col items-center justify-center gap-4">
            <textarea
              className="w-1/2 rounded-md px-4 py-2 text-xl font-semibold text-black focus:outline-none"
              placeholder="Text to summarize"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  await handleSummaryCall();
                }
              }}
            />
            <button
              className="rounded-md bg-[#2acf2d] px-4 py-2 text-lg font-bold text-white focus:outline-none"
              type="button"
              onClick={handleSummaryCall}
            >
              Shorten it!
            </button>
            <div className="flex max-w-screen-sm flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {shortened}
              </h1>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
