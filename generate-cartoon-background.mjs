import { getStore } from "@netlify/blobs";

// Background function: Netlify answers the browser with 202 right away and
// lets this keep running for up to 15 minutes. The cartoon takes about
// 25-40 seconds from OpenAI, far longer than a normal function's 10 second
// limit, so it cannot run as a regular function. The result is stored in
// Netlify Blobs under the request id, and get-preview.mjs serves it back
// to the browser when it polls.

function buildPrompt(name, lastName, number, teamColors, shirtColor) {
  return (
    "Turn the child in this photo into a bold comic-book cartoon soccer player: " +
    "back view, same pose, same curly hair and face profile as the photo, " +
    "holding a soccer ball under his right arm. Thick black outline, dynamic " +
    "paint brush strokes and dots in the background, halftone shading, vibrant, " +
    "crisp, print-ready, on a clean white background. " +
    "IGNORE the jersey, name and number in the photo completely. " +
    "The jersey in the cartoon must be " + shirtColor + ", with trim in the team colors. " +
    "The back of the shirt must say '" + lastName + "' in capital letters above a large number '" +
    number + "' in the team colors. Use the customer's last name exactly as given, " +
    "even if the photo shows a different name on the jersey. " +
    "The background brush strokes must use ONLY these team colors: " + teamColors + ". " +
    "Do not add gold, pink or any other color to the brush strokes. " +
    "Keep the child's likeness, hair and pose from the photo. " +
    "No other text, no extra logos, no watermark."
  );
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), { status: 400 });
  }
  const { id, photo, name, lastName, number, teamColors, shirtColor } = body || {};
  if (!id || !photo || !name || !number || !teamColors || !shirtColor) {
    return new Response(JSON.stringify({ error: "missing fields" }), { status: 400 });
  }

  const store = getStore("previews");
  try {
    await store.setJSON(id, { status: "working" });
    const match = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(photo);
    if (!match) throw new Error("photo is not a base64 data URL");
    const bytes = Buffer.from(match[2], "base64");

    const form = new FormData();
    form.append("model", "gpt-image-1.5");
    form.append("prompt", buildPrompt(name, lastName, number, teamColors, shirtColor));
    form.append("size", "1024x1536");
    form.append("image", new Blob([bytes], { type: match[1] }), "photo.jpg");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      await store.setJSON(id, { status: "error", message: text.slice(0, 300) });
      return new Response(JSON.stringify({ ok: true }));
    }
    const data = await res.json();
    await store.setJSON(id, { status: "done", image: data.data[0].b64_json });
  } catch (err) {
    try {
      await store.setJSON(id, { status: "error", message: String(err).slice(0, 300) });
    } catch {}
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
