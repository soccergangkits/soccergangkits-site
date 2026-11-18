import { getStore } from "@netlify/blobs";

// Serves the result of a background generation to the browser while it polls.
// GET /.netlify/functions/get-preview?id=<request id>
// Returns {"status":"pending"|"working"|"done"|"error", "image": "data:image/png;base64,..."}.

export default async (request) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ status: "error", message: "missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const store = getStore("previews");
  const record = await store.get(id, { type: "json" });
  if (!record) {
    return new Response(JSON.stringify({ status: "pending" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (record.status === "done") {
    return new Response(
      JSON.stringify({ status: "done", image: "data:image/png;base64," + record.image }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify(record), {
    headers: { "Content-Type": "application/json" },
  });
};
