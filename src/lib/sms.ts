const SEMAPHORE_URL = "https://api.semaphore.co/api/v4/messages";

export async function sendSms({
  to,
  message,
}: {
  to: string; // normalized +63 format
  message: string;
}) {
  const res = await fetch(SEMAPHORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.SEMAPHORE_API_KEY,
      number: to,
      message,
      sendername: process.env.SEMAPHORE_SENDER_NAME,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Semaphore SMS failed (${res.status}): ${text}`);
  }

  return res.json();
}
